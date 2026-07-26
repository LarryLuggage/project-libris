# ADR 0005: Auth Route Protection and UI Guards

## Status
Accepted

## Context
Previously, creating comments and reviews, deleting them, and uploading custom books were anonymous, device-based operations requiring only a client-generated device ID. This allowed unauthenticated users to alter database state without verified user accounts, which is vulnerable to spam and abuse. To secure the platform:
1. Write and delete operations on books, comments, and reviews must be protected by JWT-based user authentication.
2. Deleted items must be verified against the authenticated user's ownership.
3. Comments and reviews must explicitly expose the author's username in their respective API responses.
4. The React Native mobile client's storage state, mock configurations, and interactive screens must be secured, redirecting unauthenticated users to the Auth Screen or showing a themed Login CTA.

---

## Decision

### 1. Backend Authentication Dependency & Route Protection (Agent-Logic)
* **get_current_user Dependency (`app/routers/auth.py`)**:
  * Implemented `get_current_user` using FastAPI's `OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")`.
  * Decodes the incoming JWT token utilizing `jwt.decode` with the application's signature parameters, returning the corresponding `User` database record.
  * Raises a `401 Unauthorized` HTTP exception if the token is invalid or the user does not exist.
* **SQLAlchemy Model & Schema Updates (`app/models.py`, schemas)**:
  * Added `@property username` to both `Comment` and `Review` models in `app/models.py`. Returns `self.user.username` if a user is associated; otherwise, falls back to `"Anonymous"`.
  * Added `username: str` to `CommentResponse` and `ReviewResponse` Pydantic schemas.
* **Route Protection & Ownership Verification**:
  * Added `Depends(get_current_user)` authentication to:
    * `POST /api/v1/comments` (populates `user_id = current_user.id`)
    * `DELETE /api/v1/comments/{id}` (restricts deletion to `comment.user_id == current_user.id`)
    * `POST /api/v1/reviews` (populates `user_id = current_user.id`)
    * `DELETE /api/v1/reviews/{id}` (restricts deletion to `review.user_id == current_user.id`)
    * `POST /api/v1/books/custom`
  * Returns `403 Forbidden` if a user attempts to delete a comment or review they do not own.

### 2. Mobile Store Realignment & UI Guards (Agent-UI)
* **Zustand store alignment**:
  * **authStore.js**: Destructured backend properties `access_token`, `username`, and `user_id` from the responses of the `/api/v1/auth/signup` and `/api/v1/auth/login` endpoints. Mapped `access_token` $\rightarrow$ `token` and `{ username, user_id }` $\rightarrow$ `user` in the Zustand state store.
  * **authStore.test.js**: Updated mocks to mock `access_token` and verified that properties (such as user ID) map correctly.
* **Client UI Guards & Login CTAs**:
  * **Custom Upload Guard (`Feed.js`)**: Intercepts the top-bar Custom Book Upload click if the user is not logged in, redirecting them to the authentication screen (`AuthScreen`) rather than opening `CustomUploadScreen`.
  * **Comments Drawer Guard (`FeedItem.js`)**: Renders a styled, themed call-to-action (CTA) inside the slide-up drawer for unauthenticated users instead of displaying text fields/post buttons. The CTA provides a redirect button to navigate to `AuthScreen`.
  * **Reviews Card Guard (`BookDetailScreen.js`)**: If the user is unauthenticated, the star rating touchpoints and the review text inputs are replaced by a themed login CTA card redirecting to `AuthScreen`.

---

## Consequences
* Elevates write-security across critical endpoints, ensuring all custom books, reviews, and comments are tied to authentic, registered user accounts.
* Restricts comment and review deletion to the original author, protecting user contributions.
* Prevents unauthenticated users from initiating write actions, reducing unnecessary API requests and improving UX.
* Enables rich user context on comments and reviews by exposing usernames to feed lists.
* Full unit/integration tests and static validation (ruff and mypy) pass cleanly, assuring robust type check and security guarantees.
