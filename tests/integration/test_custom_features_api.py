import pytest
from app.routers.auth import create_access_token, hash_password
from app.models import User
from tests.factories import BookFactory, PageFactory

DEVICE_ID = "test-device-id-1234567890"
OTHER_DEVICE_ID = "other-device-id-0987654321"
HEADERS = {"X-Device-ID": DEVICE_ID}
OTHER_HEADERS = {"X-Device-ID": OTHER_DEVICE_ID}


@pytest.fixture
def auth_headers(db_session):
    """Fixture to generate a test user and their JWT authorization header."""
    hashed = hash_password("password123")
    user = User(username="auth_test_user", password_hash=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user.id, user.username)
    return {
        "Authorization": f"Bearer {token}",
        "X-Device-ID": DEVICE_ID,
    }, user


@pytest.fixture
def other_auth_headers(db_session):
    """Fixture to generate another test user and their JWT authorization header."""
    hashed = hash_password("password123")
    user = User(username="other_auth_user", password_hash=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(user.id, user.username)
    return {
        "Authorization": f"Bearer {token}",
        "X-Device-ID": OTHER_DEVICE_ID,
    }, user


class TestCustomBookUpload:
    """Integration tests for custom book upload endpoint."""

    def test_upload_custom_book_happy_path(self, client, auth_headers):
        """Should split text into paragraphs, score vibes, and create a user-uploaded book."""
        # Arrange
        headers, user = auth_headers
        # Text with 3 paragraphs, each between 50 and 200 words
        para1 = " ".join(["word"] * 60)
        para2 = " ".join(["happy"] * 75)
        para3 = " ".join(["sad"] * 80)
        content_text = f"{para1}\n\n{para2}\n\n{para3}"

        payload = {
            "title": "My Custom Masterpiece",
            "author": "Anonymous Creator",
            "cover_url": "https://example.com/cover.jpg",
            "content_text": content_text
        }

        # Act
        response = client.post(
            "/api/v1/books/custom",
            json=payload,
            headers=headers
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My Custom Masterpiece"
        assert data["author"] == "Anonymous Creator"
        assert data["cover_url"] == "https://example.com/cover.jpg"
        assert data["is_user_uploaded"] is True
        assert data["creator_device_id"] == DEVICE_ID
        assert data["pages_count"] == 3

        # Verify pages exist in DB via book detail and page listing
        book_id = data["id"]
        detail_response = client.get(f"/api/v1/books/{book_id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert detail_data["gutenberg_id"] is None
        assert detail_data["gutenberg_url"] is None
        assert detail_data["page_count"] == 3
        assert detail_data["is_user_uploaded"] is True
        assert detail_data["creator_device_id"] == DEVICE_ID

        # Verify book listing
        list_response = client.get("/api/v1/books")
        assert list_response.status_code == 200
        books = list_response.json()
        uploaded_book = next((b for b in books if b["id"] == book_id), None)
        assert uploaded_book is not None
        assert uploaded_book["gutenberg_id"] is None
        assert uploaded_book["is_user_uploaded"] is True
        assert uploaded_book["creator_device_id"] == DEVICE_ID

    def test_upload_custom_book_empty_or_invalid_paragraphs(self, client, auth_headers):
        """Should return 422 for too short text, and 400 when text cannot be split into valid sweet-spot pages."""
        headers, user = auth_headers

        # Case 1: Less than 50 characters (fails Pydantic schema validation -> 422)
        payload_short = {
            "title": "Too Short Text",
            "author": "Author",
            "content_text": "Short."
        }
        response_short = client.post(
            "/api/v1/books/custom",
            json=payload_short,
            headers=headers
        )
        assert response_short.status_code == 422

        # Case 2: Long enough but all paragraphs are too short (fails chunking validation -> 400)
        content_text = "\n\n".join(["word " * 10] * 5)
        payload_invalid = {
            "title": "No Sweet Spot Paragraphs",
            "author": "Author",
            "content_text": content_text
        }
        response_invalid = client.post(
            "/api/v1/books/custom",
            json=payload_invalid,
            headers=headers
        )
        assert response_invalid.status_code == 400
        assert "No valid pages could be chunked" in response_invalid.json()["detail"]

    def test_upload_custom_book_unauthorized(self, client):
        """Should return 401 for requests without a valid JWT token."""
        payload = {
            "title": "Unauthorized Title",
            "author": "Author",
            "content_text": "Some content " * 30
        }
        response = client.post(
            "/api/v1/books/custom",
            json=payload,
            headers=HEADERS  # No auth header
        )
        assert response.status_code == 401


class TestCommentsAPI:
    """Integration tests for comments endpoints."""

    def test_create_comment_happy_path(self, client, db_session, auth_headers):
        """Should create a comment on an existing page and verify it."""
        # Arrange
        headers, user = auth_headers
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.7)
        db_session.commit()

        # Act
        payload = {
            "page_id": page.id,
            "content": "This is an inspiring excerpt!"
        }
        response = client.post(
            "/api/v1/comments",
            json=payload,
            headers=headers
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["page_id"] == page.id
        assert data["content"] == "This is an inspiring excerpt!"
        assert data["device_id"] == DEVICE_ID
        assert data["username"] == user.username
        assert "id" in data
        assert "created_at" in data

    def test_create_comment_on_nonexistent_page(self, client, auth_headers):
        """Should return 404 when commenting on a page that does not exist."""
        headers, user = auth_headers
        payload = {
            "page_id": 999999,
            "content": "Nice!"
        }
        response = client.post(
            "/api/v1/comments",
            json=payload,
            headers=headers
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Page not found"

    def test_create_comment_unauthorized(self, client):
        """Should return 401 when creating comment without auth headers."""
        payload = {
            "page_id": 1,
            "content": "Nice!"
        }
        response = client.post(
            "/api/v1/comments",
            json=payload,
            headers=HEADERS  # No Authorization
        )
        assert response.status_code == 401

    def test_list_comments(self, client, db_session, auth_headers):
        """Should list comments and support filtering by page_id."""
        # Arrange
        headers, user = auth_headers
        book = BookFactory.create(session=db_session)
        page1 = PageFactory.create(session=db_session, book=book, vibe_score=0.7)
        page2 = PageFactory.create(session=db_session, book=book, vibe_score=0.6)
        db_session.commit()

        # Create comments
        client.post("/api/v1/comments", json={"page_id": page1.id, "content": "P1 Comment 1"}, headers=headers)
        client.post("/api/v1/comments", json={"page_id": page1.id, "content": "P1 Comment 2"}, headers=headers)
        client.post("/api/v1/comments", json={"page_id": page2.id, "content": "P2 Comment"}, headers=headers)

        # Act - get all comments
        response_all = client.get("/api/v1/comments")
        assert response_all.status_code == 200
        comments_all = response_all.json()
        assert len(comments_all) >= 3

        # Act - filter by page1
        response_filtered = client.get(f"/api/v1/comments?page_id={page1.id}")
        assert response_filtered.status_code == 200
        comments_filtered = response_filtered.json()
        assert len(comments_filtered) == 2
        assert all(c["page_id"] == page1.id for c in comments_filtered)

    def test_delete_comment(self, client, db_session, auth_headers, other_auth_headers):
        """Should allow the creator user to delete comment, and block others with 403."""
        # Arrange
        headers1, user1 = auth_headers
        headers2, user2 = other_auth_headers
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.7)
        db_session.commit()

        # Create comment as user1 (headers1)
        create_res = client.post(
            "/api/v1/comments",
            json={"page_id": page.id, "content": "To be deleted"},
            headers=headers1
        )
        comment_id = create_res.json()["id"]

        # Act & Assert - try to delete using user2 (headers2) (should fail)
        delete_fail = client.delete(
            f"/api/v1/comments/{comment_id}",
            headers=headers2
        )
        assert delete_fail.status_code == 403
        assert "Not authorized" in delete_fail.json()["detail"]

        # Act & Assert - delete using creator user1 (headers1) (should succeed)
        delete_ok = client.delete(
            f"/api/v1/comments/{comment_id}",
            headers=headers1
        )
        assert delete_ok.status_code == 200
        assert delete_ok.json()["detail"] == "Comment deleted successfully"

        # Verify comment is deleted from GET response
        get_res = client.get(f"/api/v1/comments?page_id={page.id}")
        assert comment_id not in [c["id"] for c in get_res.json()]

    def test_delete_comment_unauthorized(self, client):
        """Should return 401 when deleting comment without auth headers."""
        response = client.delete(
            "/api/v1/comments/1",
            headers=HEADERS  # No auth header
        )
        assert response.status_code == 401


class TestReviewsAPI:
    """Integration tests for reviews endpoints."""

    def test_create_review_happy_path(self, client, db_session, auth_headers):
        """Should create a review/rating on an existing book and verify it."""
        # Arrange
        headers, user = auth_headers
        book = BookFactory.create(session=db_session)
        db_session.commit()

        # Act
        payload = {
            "book_id": book.id,
            "rating": 5,
            "content": "This book is a timeless classic."
        }
        response = client.post(
            "/api/v1/reviews",
            json=payload,
            headers=headers
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["book_id"] == book.id
        assert data["rating"] == 5
        assert data["content"] == "This book is a timeless classic."
        assert data["device_id"] == DEVICE_ID
        assert data["username"] == user.username
        assert "id" in data
        assert "created_at" in data

    def test_create_review_on_nonexistent_book(self, client, auth_headers):
        """Should return 404 when reviewing a book that does not exist."""
        headers, user = auth_headers
        payload = {
            "book_id": 999999,
            "rating": 4,
            "content": "Great!"
        }
        response = client.post(
            "/api/v1/reviews",
            json=payload,
            headers=headers
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Book not found"

    def test_create_review_unauthorized(self, client):
        """Should return 401 when creating review without auth headers."""
        payload = {
            "book_id": 1,
            "rating": 4,
            "content": "Great!"
        }
        response = client.post(
            "/api/v1/reviews",
            json=payload,
            headers=HEADERS  # No auth header
        )
        assert response.status_code == 401

    def test_list_reviews(self, client, db_session, auth_headers):
        """Should list reviews and support filtering by book_id."""
        # Arrange
        headers, user = auth_headers
        book1 = BookFactory.create(session=db_session)
        book2 = BookFactory.create(session=db_session)
        db_session.commit()

        # Create reviews
        client.post("/api/v1/reviews", json={"book_id": book1.id, "rating": 5, "content": "B1 Review 1"}, headers=headers)
        client.post("/api/v1/reviews", json={"book_id": book1.id, "rating": 4, "content": "B1 Review 2"}, headers=headers)
        client.post("/api/v1/reviews", json={"book_id": book2.id, "rating": 3, "content": "B2 Review"}, headers=headers)

        # Act - get all reviews
        response_all = client.get("/api/v1/reviews")
        assert response_all.status_code == 200
        reviews_all = response_all.json()
        assert len(reviews_all) >= 3

        # Act - filter by book1
        response_filtered = client.get(f"/api/v1/reviews?book_id={book1.id}")
        assert response_filtered.status_code == 200
        reviews_filtered = response_filtered.json()
        assert len(reviews_filtered) == 2
        assert all(r["book_id"] == book1.id for r in reviews_filtered)

    def test_delete_review(self, client, db_session, auth_headers, other_auth_headers):
        """Should allow the creator user to delete review, and block others with 403."""
        # Arrange
        headers1, user1 = auth_headers
        headers2, user2 = other_auth_headers
        book = BookFactory.create(session=db_session)
        db_session.commit()

        # Create review as user1 (headers1)
        create_res = client.post(
            "/api/v1/reviews",
            json={"book_id": book.id, "rating": 4, "content": "To be deleted"},
            headers=headers1
        )
        review_id = create_res.json()["id"]

        # Act & Assert - try to delete using user2 (headers2) (should fail)
        delete_fail = client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=headers2
        )
        assert delete_fail.status_code == 403
        assert "Not authorized" in delete_fail.json()["detail"]

        # Act & Assert - delete using creator user1 (headers1) (should succeed)
        delete_ok = client.delete(
            f"/api/v1/reviews/{review_id}",
            headers=headers1
        )
        assert delete_ok.status_code == 200
        assert delete_ok.json()["detail"] == "Review deleted successfully"

        # Verify review is deleted from GET response
        get_res = client.get(f"/api/v1/reviews?book_id={book.id}")
        assert review_id not in [r["id"] for r in get_res.json()]

    def test_delete_review_unauthorized(self, client):
        """Should return 401 when deleting review without auth headers."""
        response = client.delete(
            "/api/v1/reviews/1",
            headers=HEADERS  # No auth header
        )
        assert response.status_code == 401
