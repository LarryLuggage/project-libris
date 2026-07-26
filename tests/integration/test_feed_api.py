from tests.factories import BookFactory, PageFactory
from app.models import Bookmark, FeedEvent, Like


DEVICE_ID = "test-device-id-1234567890"


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


    def test_invalid_cursor_returns_400(self, client):
        """Should return 400 when cursor is not numeric."""
        response = client.get("/api/v1/feed?cursor=not_a_number")
        assert response.status_code == 400

    def test_feed_ranks_by_interactions_then_vibe(self, client, db_session):
        """Pages with more engagement should rank higher in feed."""
        book = BookFactory.create(session=db_session)
        page_plain = PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        page_liked = PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        page_bookmarked = PageFactory.create(
            session=db_session, book=book, vibe_score=0.9
        )
        page_high_vibe = PageFactory.create(
            session=db_session, book=book, vibe_score=0.95
        )

        db_session.add(
            Like(device_id="device-like-0001", page_id=page_liked.id)
        )
        db_session.add(
            Bookmark(device_id="device-bookmark-0001", page_id=page_bookmarked.id)
        )
        db_session.commit()

        response = client.get("/api/v1/feed")
        assert response.status_code == 200
        ids = [item["id"] for item in response.json()["items"]]

        # Bookmark (score 3) ranks above like (score 2), then high-vibe, then plain.
        assert ids[:4] == [
            page_bookmarked.id,
            page_liked.id,
            page_high_vibe.id,
            page_plain.id,
        ]

    def test_cursor_with_exclude_is_deterministic(self, client, db_session):
        """Cursor + exclude should never return duplicates or excluded IDs."""
        book = BookFactory.create(session=db_session)
        pages = PageFactory.create_batch(13, session=db_session, book=book, vibe_score=0.8)
        db_session.commit()

        exclude_ids = [pages[0].id, pages[1].id]
        response1 = client.get("/api/v1/feed", params={"exclude": exclude_ids})
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["has_more"] is True

        response2 = client.get(
            "/api/v1/feed",
            params={"cursor": data1["next_cursor"], "exclude": exclude_ids},
        )
        assert response2.status_code == 200
        data2 = response2.json()

        ids1 = [item["id"] for item in data1["items"]]
        ids2 = [item["id"] for item in data2["items"]]
        all_ids = ids1 + ids2

        assert len(set(all_ids)) == len(all_ids)
        assert set(all_ids).isdisjoint(exclude_ids)
        assert len(all_ids) == 11

    def test_feed_excludes_seen_pages_for_device(self, client, db_session):
        """Should suppress server-side seen/skipped pages when device ID is present."""
        book = BookFactory.create(session=db_session)
        seen_page = PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        available_page = PageFactory.create(session=db_session, book=book, vibe_score=0.8)
        db_session.add(
            FeedEvent(
                device_id=DEVICE_ID,
                page_id=seen_page.id,
                event_type="seen",
            )
        )
        db_session.commit()

        response = client.get(
            "/api/v1/feed",
            headers={"X-Device-ID": DEVICE_ID},
        )

        assert response.status_code == 200
        returned_ids = {item["id"] for item in response.json()["items"]}
        assert seen_page.id not in returned_ids
        assert available_page.id in returned_ids

    def test_feed_without_device_id_keeps_backward_compatibility(
        self, client, db_session
    ):
        """Should not apply server-side seen suppression without a device header."""
        book = BookFactory.create(session=db_session)
        page = PageFactory.create(session=db_session, book=book, vibe_score=0.9)
        db_session.add(
            FeedEvent(
                device_id=DEVICE_ID,
                page_id=page.id,
                event_type="seen",
            )
        )
        db_session.commit()

        response = client.get("/api/v1/feed")

        assert response.status_code == 200
        returned_ids = {item["id"] for item in response.json()["items"]}
        assert page.id in returned_ids

    def test_feed_personalization_boost(self, client, db_session):
        """Feed should rank pages higher if they match preferred genres/vibes."""
        # Arrange
        book_poetry = BookFactory.create(session=db_session, genre="Poetry")
        book_fiction = BookFactory.create(session=db_session, genre="Fiction")
        book_philosophy = BookFactory.create(session=db_session, genre="Philosophy")

        # Page A: Poetry + vibe 0.8 (romantic: 0.7-1.0) -> Boost = 50 (genre) + 50 (vibe) = 100
        page_a = PageFactory.create(session=db_session, book=book_poetry, vibe_score=0.8)
        # Page B: Fiction + vibe 0.8 (romantic: 0.7-1.0) -> Boost = 0 (genre) + 50 (vibe) = 50
        page_b = PageFactory.create(session=db_session, book=book_fiction, vibe_score=0.8)
        # Page C: Philosophy + vibe 0.65 (adventurous/thoughtful) -> Boost = 0 (genre) + 0 (vibe since we only prefer romantic) = 0
        page_c = PageFactory.create(session=db_session, book=book_philosophy, vibe_score=0.65)


        db_session.commit()

        # Act
        response = client.get(
            "/api/v1/feed",
            params={
                "preferred_genres": ["Poetry"],
                "preferred_vibes": ["romantic"]
            }
        )

        # Assert
        assert response.status_code == 200
        items = response.json()["items"]
        ids = [item["id"] for item in items]
        
        # Order should be Page A (boost 100), Page B (boost 50), Page C (boost 0)
        assert ids == [page_a.id, page_b.id, page_c.id]


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
