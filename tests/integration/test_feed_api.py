import pytest
from tests.factories import BookFactory, PageFactory


class TestFeedEndpoint:
    """Integration tests for /feed API endpoint."""

    def test_get_feed_returns_items(self, client, db_session):
        """Should return feed items when pages exist."""
        # Arrange
        book = BookFactory.create(session=db_session)
        PageFactory.create_batch(
            5, session=db_session, book=book, vibe_score=0.8
        )
        db_session.commit()

        # Act
        response = client.get("/api/v1/feed")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "next_cursor" in data
        assert "has_more" in data

    def test_get_feed_filters_low_vibe(self, client, db_session):
        """Should only return pages with vibe_score > threshold."""
        # Arrange
        book = BookFactory.create(session=db_session)
        PageFactory.create(session=db_session, book=book, vibe_score=0.3)
        PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        db_session.commit()

        # Act
        response = client.get("/api/v1/feed")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["vibe_score"] > 0.7

    def test_get_feed_empty_when_no_high_vibe(self, client, db_session):
        """Should return empty when no pages meet threshold."""
        # Arrange
        book = BookFactory.create(session=db_session)
        PageFactory.create_batch(
            3, session=db_session, book=book, vibe_score=0.3
        )
        db_session.commit()

        # Act
        response = client.get("/api/v1/feed")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["has_more"] is False

    def test_cursor_pagination(self, client, db_session):
        """Should support cursor-based pagination."""
        # Arrange - create more pages than page_size
        book = BookFactory.create(session=db_session)
        PageFactory.create_batch(
            15, session=db_session, book=book, vibe_score=0.8
        )
        db_session.commit()

        # Act - first page
        response1 = client.get("/api/v1/feed")
        data1 = response1.json()

        # Assert first page
        assert response1.status_code == 200
        assert len(data1["items"]) == 10
        assert data1["has_more"] is True
        assert data1["next_cursor"] is not None

        # Act - second page
        response2 = client.get(f"/api/v1/feed?cursor={data1['next_cursor']}")
        data2 = response2.json()

        # Assert second page
        assert response2.status_code == 200
        assert len(data2["items"]) == 5
        assert data2["has_more"] is False

        # Assert no duplicates between pages
        ids1 = {item["id"] for item in data1["items"]}
        ids2 = {item["id"] for item in data2["items"]}
        assert ids1.isdisjoint(ids2)

    def test_exclude_pages(self, client, db_session):
        """Should exclude specified page IDs."""
        # Arrange
        book = BookFactory.create(session=db_session)
        pages = PageFactory.create_batch(
            5, session=db_session, book=book, vibe_score=0.8
        )
        db_session.commit()

        # Exclude first two pages
        exclude_ids = [pages[0].id, pages[1].id]

        # Act
        response = client.get(
            "/api/v1/feed",
            params={"exclude": exclude_ids},
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        returned_ids = {item["id"] for item in data["items"]}
        assert not returned_ids.intersection(exclude_ids)

    def test_feed_item_structure(self, client, db_session):
        """Should return items with correct structure."""
        # Arrange
        book = BookFactory.create(
            session=db_session,
            title="Test Book",
            author="Test Author",
        )
        PageFactory.create(
            session=db_session,
            book=book,
            page_number=42,
            content_text="Test content",
            vibe_score=0.9,
        )
        db_session.commit()

        # Act
        response = client.get("/api/v1/feed")

        # Assert
        assert response.status_code == 200
        data = response.json()
        item = data["items"][0]

        assert "id" in item
        assert item["title"] == "Test Book"
        assert item["author"] == "Test Author"
        assert item["page_number"] == 42
        assert item["content_text"] == "Test content"
        assert item["vibe_score"] == 0.9


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, client):
        """Should return healthy status."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "libris"


class TestLegacyFeedEndpoint:
    """Tests for backward-compatible legacy endpoint."""

    def test_legacy_feed_works(self, client, db_session):
        """Legacy /feed endpoint should still work."""
        book = BookFactory.create(session=db_session)
        PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        db_session.commit()

        response = client.get("/feed")
        assert response.status_code == 200
