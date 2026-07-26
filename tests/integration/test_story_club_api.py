from app.models import StoryClubLead


class TestStoryClubWaitlistAPI:
    """Integration tests for Story Club pilot waitlist intake."""

    def test_join_waitlist_happy_path(self, client, db_session):
        response = client.post(
            "/api/v1/story-club/waitlist",
            json={
                "name": "Ada Reader",
                "email": "ADA@example.com",
                "role": "both",
                "genre_preferences": ["Fiction", "Mystery"],
                "willing_to_pay_5": True,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Ada Reader"
        assert data["email"] == "ada@example.com"
        assert data["role"] == "both"
        assert data["genre_preferences"] == ["Fiction", "Mystery"]
        assert data["willing_to_pay_5"] is True

        lead = db_session.query(StoryClubLead).filter_by(email="ada@example.com").one()
        assert lead.genre_preferences == "Fiction,Mystery"

    def test_join_waitlist_updates_existing_email(self, client, db_session):
        first = client.post(
            "/api/v1/story-club/waitlist",
            json={
                "name": "Ada Reader",
                "email": "ada@example.com",
                "role": "reader",
                "genre_preferences": ["Fiction"],
                "willing_to_pay_5": False,
            },
        )
        second = client.post(
            "/api/v1/story-club/waitlist",
            json={
                "name": "Ada Writer",
                "email": "ada@example.com",
                "role": "writer",
                "genre_preferences": ["Literary"],
                "willing_to_pay_5": True,
            },
        )

        assert first.status_code == 201
        assert second.status_code == 201
        data = second.json()
        assert data["id"] == first.json()["id"]
        assert data["name"] == "Ada Writer"
        assert data["role"] == "writer"
        assert data["genre_preferences"] == ["Literary"]

        assert db_session.query(StoryClubLead).count() == 1

    def test_join_waitlist_rejects_invalid_role(self, client):
        response = client.post(
            "/api/v1/story-club/waitlist",
            json={
                "name": "Ada Reader",
                "email": "ada@example.com",
                "role": "admin",
                "genre_preferences": [],
                "willing_to_pay_5": True,
            },
        )

        assert response.status_code == 422
