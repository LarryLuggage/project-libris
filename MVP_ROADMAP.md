# Project LIBRIS - MVP Roadmap

> "Goodreads meets TikTok" - Bite-sized literary discovery for book lovers

## Target User
Book lovers who want to discover new literature through beautiful, swipeable excerpts.

## Success Metric
**Daily Active Returns** - Users come back daily to discover and engage with content.

---

## Phase 1: MVP Launch Requirements

### 1. Content Pipeline (Priority: Critical)
**Goal:** Build a rich library of high-quality literary excerpts

- [x] Gutenberg ingestion service - auto-fetch and process public domain books
- [x] Content chunking algorithm - split books into "scroll-worthy" segments
- [x] Vibe scoring improvements - better sentiment analysis for quality filtering
- [x] Cover image URL fetching
- [ ] Cover image caching
- [ ] Target: 1,000+ excerpts from 100+ books at launch

### 2. Personalized Feed Algorithm (Priority: Critical)
**Goal:** Show users content they'll love, not just random pages

- [x] Track user interactions (likes, bookmarks, seen, skipped events)
- [ ] Build preference model (favorite genres, authors, themes)
- [ ] Implement collaborative filtering or content-based recommendations
- [ ] A/B test feed algorithms
- [x] "Seen" tracking to prevent repeat content

### 3. User Identity (Priority: High)
**Goal:** Persistent identity without friction

- [x] Device-based anonymous accounts (current approach - enhance)
- [x] Sync bookmarks/likes across sessions
- [ ] Optional email signup for cross-device sync
- [ ] Data export capability

### 4. Onboarding Flow (Priority: High)
**Goal:** Seed personalization from the start

- [ ] Genre selection screen (Fiction, Poetry, Philosophy, etc.)
- [ ] Favorite authors picker (popular classics authors)
- [ ] Initial vibe preference (thoughtful, romantic, adventurous, dark)
- [ ] Skip option for users who want to dive in

---

## Phase 2: Retention Features (Week 1-2 Post-Launch)

### 5. Story Club Lead Magnet
**Goal:** Validate a recurring literary membership loop before building native contest mechanics

- [x] Add in-app Story Club pilot waitlist capture
- [x] Store reader/writer role, genre preferences, and $5/month willingness-to-pay signal
- [ ] Export invited members from `story_club_leads`
- [ ] Run four-week concierge pilot with manual submissions, finalist selection, voting, and prize checks
- [ ] Compare actual participation against willingness-to-pay responses
- [ ] Decide whether to build native submissions, anonymous finalist voting, and paid founding membership

See `docs/story_club_pilot.md` for operating model, success criteria, and legal posture.

### 6. Social Sharing
**Goal:** Viral growth through beautiful shareable content

- [ ] Generate quote images with book cover background
- [ ] Share to Instagram Stories, Twitter, iMessage
- [ ] Deep link back to app from shared content
- [ ] "Made with LIBRIS" watermark

### 7. Book Discovery Links
**Goal:** Connect excerpts to full reading experience

- [ ] "Read this book" CTA on each excerpt
- [ ] Link to Project Gutenberg (free)
- [ ] Link to local library (via Libby/Overdrive API)
- [ ] Amazon affiliate links (monetization opportunity)

### 8. Daily Engagement
**Goal:** Build daily habit

- [ ] Push notification: "Your daily literary moment"
- [ ] Personalized daily quote based on preferences
- [ ] Streak tracking (X days in a row)
- [ ] "Quote of the day" featured content

---

## Phase 3: Community & UGC (Future)

### 9. User-Uploaded Quotes
- Quote submission with source attribution
- Moderation queue
- Copyright considerations (fair use guidelines)

### 10. Book Reviews
- Full book review system
- Rating aggregation
- Review excerpts in feed

### 11. Social Features
- Follow other users
- See friends' bookmarks/likes
- Curated collections by users

### 12. Audio Experience
- Text-to-speech narration
- Background ambient audio
- Audiobook preview integration

---

## Technical Debt to Address

- [ ] Replace deprecated SafeAreaView
- [ ] Add proper error handling for empty states
- [ ] Implement proper loading skeletons
- [ ] Add offline support / caching
- [ ] Performance optimization for large feeds

---

## Current MVP Hardening Status

- Backend tests, Ruff, and mypy are expected to pass locally and in CI.
- Mobile Jest tests cover feed store, interaction store, and key feed UI states.
- Feed ranking is currently global: engagement score, vibe score, then stable page ID.
- Server-side seen/skipped events suppress repeat feed items when `X-Device-ID` is sent.
- Next product tranche: onboarding preferences, lightweight personalization, sharing, and offline cache polish.

---

## Current Stack

**Backend:** FastAPI + PostgreSQL + SQLAlchemy
**Mobile:** React Native (Expo) + Zustand
**Content Source:** Project Gutenberg

---

## Next Steps

1. Build Gutenberg ingestion pipeline
2. Implement onboarding flow
3. Add interaction tracking to feed algorithm
4. Design and build share functionality
