# ADR 0004: Feed Personalization and Auth Sync System

## Status
Accepted

## Context
To improve user retention and transition from device-based anonymous usage to full accounts, we needed:
1. Feed personalization based on favorite genres and themes/vibes (via sentiment ranges).
2. A lightweight authentication system allowing optional registration and login.
3. Seamless synchronization that retroactively associates existing device interactions (likes, bookmarks, comments, reviews) with a new user ID upon sign up.

---

## Decision

### 1. Feed Personalization Algorithm
* **Schema Modification**: Added a nullable `genre` column to the `Book` model.
* **Personalization Boost**:
  * Updated `PageRepository.get_feed_pages` to accept `preferred_genres` and `preferred_vibes`.
  * Computed boosts dynamically using SQL `CASE WHEN` clauses:
    * **Matching Genre**: +50 boost.
    * **Matching Vibe**: +50 boost if the page's sentiment `vibe_score` falls within defined ranges:
      * `"thoughtful"`: `0.4 <= vibe_score <= 0.7`
      * `"romantic"`: `0.7 <= vibe_score <= 1.0`
      * `"adventurous"`: `0.5 <= vibe_score <= 0.8`
      * `"dark"`: `0.0 <= vibe_score <= 0.4`
  * Applied boosts to the `interaction_score` to form a personalized `ranking_score` that determines feed ordering and keyset pagination.

### 2. User Authentication & Interaction Merging
* **User Model**: Added a `User` model containing `username`, `password_hash`, and timestamps.
* **Relations**: Added nullable `user_id` foreign key columns to interaction tables (`bookmarks`, `likes`, `comments`, and `reviews`).
* **Authentication Flow (`app/routers/auth.py`)**:
  * Added `POST /api/v1/auth/signup` and `POST /api/v1/auth/login`.
  * Used `bcrypt` for secure password hashing and `PyJWT` for generating JWT access tokens.
* **Interaction Sync**: During signup, if an `X-Device-ID` header (or `device_id` param) is provided, the backend updates all existing likes, bookmarks, comments, and reviews for that device ID to link them with the new user's ID.

---

## Consequences
* Allows users to seed interest preferences at onboarding or later to receive personalized content.
* Provides a frictionless path to create an account, importing all bookmarks, likes, comments, and reviews that were created anonymously.
* Maintains keyset-based cursor stability and database indexes on foreign keys.
* Full test coverage ensures robust token creation, verification, and database sync.
