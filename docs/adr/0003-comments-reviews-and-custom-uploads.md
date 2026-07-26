# ADR 0003: Comments, Reviews, and Custom Uploads System

## Status
Accepted

## Context
To elevate user engagement and community interaction in Phase 1 of Project LIBRIS, we needed to implement user-generated content (UGC) capabilities:
1. Custom book uploads where users submit full text, which the system dynamically chunks and vibe-scores into pages.
2. User interactions including commenting on specific excerpts (pages) and reviewing/rating full books.
3. Strict requirement for device-based (anonymous) authorship verification matching existing bookmarking/liking flows.

---

## Decision

### 1. Database & Backend Architecture (Agent-Logic)
* **Model Modifications**:
  * Made `Book.gutenberg_id` nullable (`Optional[int]`) to accommodate custom uploads that do not originate from Project Gutenberg.
  * Added `Book.is_user_uploaded` (`Boolean`, default `False`) and `Book.creator_device_id` (`String`, nullable) to track ownership.
  * Added `Comment` model linked to `Page` containing `device_id`, `content`, and timestamp.
  * Added `Review` model linked to `Book` containing `device_id`, `rating` (1-5), `content`, and timestamp.
  * Configured cascade delete relationships: deleting a `Book` deletes its reviews, and deleting a `Page` deletes its comments.
* **FastAPI Endpoints**:
  * Added `POST /api/v1/books/custom` for custom book uploads. Uses `chunk_text` and `analyze_vibe` from the content pipeline to split user input by paragraph and sentiment score it.
  * Created `/api/v1/comments` with `POST` (create), `GET` (list and filter by `page_id`), and `DELETE` (creator verification) operations.
  * Created `/api/v1/reviews` with `POST` (create), `GET` (list and filter by `book_id`), and `DELETE` (creator verification) operations.
* **Alembic Migration**:
  * Created a migration script (`alembic/versions/e8f75d2b2b44_add_custom_books_comments_reviews.py`) supporting both SQLite and PostgreSQL. Applied the migration to Supabase using `alembic upgrade head`.

### 2. Mobile Client UI & State (Agent-UI)
* **Comment System (`commentStore.js` & `FeedItem.js`)**:
  * Created `commentStore.js` to manage comments per page with optimistic updates.
  * Built a slide-up Animated drawer sheet overlay in `FeedItem.js` containing comment lists and text inputs.
* **Book Reviews & Ratings (`reviewStore.js` & `BookDetailScreen.js`)**:
  * Created `reviewStore.js` to fetch and submit book-level reviews.
  * Built an interactive star rating selector and written feedback panel in `BookDetailScreen.js`.
  * Rendered average rating calculations, counts, and community reviews.
* **Custom Upload Screen (`customUploadStore.js` & `CustomUploadScreen.js`)**:
  * Designed a text contribution screen for Title, Author, and Excerpt text that respects the chosen theme.
  * Added navigation routing and a header button (`add-outline` icon) in the `Feed.js` top navigation.

---

## Consequences
* The app supports a richer social feedback loop for public domain and user-submitted books.
* Standardizes anonymous user authorship using the `X-Device-ID` header.
* The UI handles server and networking errors gracefully by performing optimistic updates and rolling them back on failures.
* Maintenance of database consistency during migrations using safe Alembic batch updates for SQLite and PostgreSQL.
* Comprehensive testing of backend endpoints (pytest) and mobile client state/screens (Jest).
