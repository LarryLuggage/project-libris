from tests.factories import BookFactory, PageFactory

DEVICE_ID = "test-device-id-1234567890"
HEADERS = {"X-Device-ID": DEVICE_ID}


class TestBookmarkEndpoints:
    """Integration tests for bookmark API endpoints."""

    def test_bookmark_nonexistent_page_returns_404(self, client):
        """Should return 404 when bookmarking a page that doesn't exist."""
        response = client.post(
            "/api/v1/interactions/bookmarks/99999",
            headers=HEADERS,
        )
        assert response.status_code == 404

    def test_bookmark_happy_path(self, client, db_session):
        """Should create, verify, and delete a bookmark."""
        # Arrange
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        # Act - create bookmark
        response = client.post(
            f"/api/v1/interactions/bookmarks/{page.id}",
            headers=HEADERS,
        )
        assert response.status_code == 200
        assert response.json()["bookmarked"] is True

        # Act - verify bookmark appears in list
        response = client.get(
            "/api/v1/interactions/bookmarks",
            headers=HEADERS,
        )
        assert response.status_code == 200
        assert page.id in response.json()["page_ids"]

        # Act - remove bookmark
        response = client.delete(
            f"/api/v1/interactions/bookmarks/{page.id}",
            headers=HEADERS,
        )
        assert response.status_code == 200
        assert response.json()["bookmarked"] is False

    def test_bookmark_duplicate_is_idempotent(self, client, db_session):
        """Should handle duplicate bookmark gracefully."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        # Bookmark twice
        client.post(f"/api/v1/interactions/bookmarks/{page.id}", headers=HEADERS)
        response = client.post(
            f"/api/v1/interactions/bookmarks/{page.id}",
            headers=HEADERS,
        )
        assert response.status_code == 200
        assert response.json()["bookmarked"] is True

    def test_bookmark_requires_device_id(self, client):
        """Should reject requests without X-Device-ID header."""
        response = client.post("/api/v1/interactions/bookmarks/1")
        assert response.status_code == 422

    def test_bookmark_rejects_short_device_id(self, client):
        """Should reject device IDs shorter than 10 characters."""
        response = client.post(
            "/api/v1/interactions/bookmarks/1",
            headers={"X-Device-ID": "short"},
        )
        assert response.status_code == 400


class TestLikeEndpoints:
    """Integration tests for like API endpoints."""

    def test_like_nonexistent_page_returns_404(self, client):
        """Should return 404 when liking a page that doesn't exist."""
        response = client.post(
            "/api/v1/interactions/likes/99999",
            headers=HEADERS,
        )
        assert response.status_code == 404

    def test_like_toggle(self, client, db_session):
        """Should toggle like on and off."""
        # Arrange
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        # Act - like
        response = client.post(
            f"/api/v1/interactions/likes/{page.id}",
            headers=HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["liked"] is True
        assert data["like_count"] == 1

        # Act - unlike (toggle)
        response = client.post(
            f"/api/v1/interactions/likes/{page.id}",
            headers=HEADERS,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["liked"] is False
        assert data["like_count"] == 0

    def test_like_count_endpoint(self, client, db_session):
        """Should return like count for a page."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        # Like the page
        client.post(f"/api/v1/interactions/likes/{page.id}", headers=HEADERS)

        # Check count
        response = client.get(f"/api/v1/interactions/likes/{page.id}/count")
        assert response.status_code == 200
        assert response.json()["like_count"] == 1

    def test_like_list_endpoint(self, client, db_session):
        """Should list liked page IDs for the device."""
        book = BookFactory.create(session=db_session)
        page1 = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        page2 = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        client.post(f"/api/v1/interactions/likes/{page1.id}", headers=HEADERS)
        client.post(f"/api/v1/interactions/likes/{page2.id}", headers=HEADERS)

        response = client.get("/api/v1/interactions/likes", headers=HEADERS)
        assert response.status_code == 200
        page_ids = set(response.json()["page_ids"])
        assert page_ids == {page1.id, page2.id}


class TestFeedEventEndpoints:
    """Integration tests for feed event API endpoints."""

    def test_record_seen_event(self, client, db_session):
        """Should record a feed event for an existing page."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        response = client.post(
            "/api/v1/interactions/events",
            json={"page_id": page.id, "event_type": "seen"},
            headers=HEADERS,
        )

        assert response.status_code == 200
        assert response.json() == {
            "page_id": page.id,
            "event_type": "seen",
            "recorded": True,
        }

    def test_record_duplicate_event_is_idempotent(self, client, db_session):
        """Should accept duplicate events without creating API errors."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        payload = {"page_id": page.id, "event_type": "skipped"}
        response1 = client.post(
            "/api/v1/interactions/events",
            json=payload,
            headers=HEADERS,
        )
        response2 = client.post(
            "/api/v1/interactions/events",
            json=payload,
            headers=HEADERS,
        )

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response2.json()["recorded"] is True

    def test_record_event_rejects_invalid_type(self, client, db_session):
        """Should reject unsupported event types."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        response = client.post(
            "/api/v1/interactions/events",
            json={"page_id": page.id, "event_type": "opened"},
            headers=HEADERS,
        )

        assert response.status_code == 422

    def test_record_event_rejects_invalid_device_id(self, client, db_session):
        """Should reject events without a valid device ID."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        response = client.post(
            "/api/v1/interactions/events",
            json={"page_id": page.id, "event_type": "seen"},
            headers={"X-Device-ID": "short"},
        )

        assert response.status_code == 400
