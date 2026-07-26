from app.models import User, Like, Bookmark, Comment, Review
from tests.factories import BookFactory, PageFactory

class TestAuthAPI:
    """Integration tests for user authentication and sync."""

    def test_signup_happy_path(self, client, db_session):
        """Should successfully create a user and return a JWT token."""
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "testuser", "password": "securepassword"}
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["username"] == "testuser"
        assert "user_id" in data
        assert data["token_type"] == "bearer"

        # Verify database record
        user = db_session.query(User).filter(User.username == "testuser").first()
        assert user is not None
        assert user.username == "testuser"

    def test_signup_username_taken(self, client, db_session):
        """Should fail to sign up if the username is already taken."""
        client.post(
            "/api/v1/auth/signup",
            json={"username": "duplicateuser", "password": "password123"}
        )
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "duplicateuser", "password": "password456"}
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Username already taken"

    def test_login_happy_path(self, client, db_session):
        """Should successfully login with valid credentials."""
        # Create user first
        client.post(
            "/api/v1/auth/signup",
            json={"username": "loginuser", "password": "correctpassword"}
        )

        # Act
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "loginuser", "password": "correctpassword"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["username"] == "loginuser"
        assert "user_id" in data

    def test_login_invalid_credentials(self, client, db_session):
        """Should fail to login with wrong credentials."""
        # Create user first
        client.post(
            "/api/v1/auth/signup",
            json={"username": "wronguser", "password": "correctpassword"}
        )

        # Login with wrong password
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "wronguser", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid username or password"

    def test_signup_merges_device_interactions(self, client, db_session):
        """Should sync existing device-based interactions to the new user ID upon signup."""
        # Setup mock book and page
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        device_id = "test-sync-device-id-999"

        # Create device-based interactions with user_id = None
        like = Like(device_id=device_id, page_id=page.id, user_id=None)
        bookmark = Bookmark(device_id=device_id, page_id=page.id, user_id=None)
        comment = Comment(device_id=device_id, page_id=page.id, content="Nice quote", user_id=None)
        review = Review(device_id=device_id, book_id=book.id, rating=5, content="Great book", user_id=None)

        db_session.add_all([like, bookmark, comment, review])
        db_session.commit()

        # Call signup with device ID in header
        response = client.post(
            "/api/v1/auth/signup",
            json={"username": "syncuser", "password": "password123"},
            headers={"X-Device-ID": device_id}
        )
        assert response.status_code == 201
        user_id = response.json()["user_id"]

        # Refresh from database and assert they have been updated with user_id
        db_session.expire_all()
        db_like = db_session.query(Like).filter(Like.device_id == device_id).first()
        db_bookmark = db_session.query(Bookmark).filter(Bookmark.device_id == device_id).first()
        db_comment = db_session.query(Comment).filter(Comment.device_id == device_id).first()
        db_review = db_session.query(Review).filter(Review.device_id == device_id).first()

        assert db_like.user_id == user_id
        assert db_bookmark.user_id == user_id
        assert db_comment.user_id == user_id
        assert db_review.user_id == user_id
