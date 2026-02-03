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

- [ ] Gutenberg ingestion service - auto-fetch and process public domain books
- [ ] Content chunking algorithm - split books into "scroll-worthy" segments
- [ ] Vibe scoring improvements - better sentiment analysis for quality filtering
- [ ] Cover image fetching and caching
- [ ] Target: 1,000+ excerpts from 100+ books at launch

### 2. Personalized Feed Algorithm (Priority: Critical)
**Goal:** Show users content they'll love, not just random pages

- [ ] Track user interactions (likes, bookmarks, time spent, skips)
- [ ] Build preference model (favorite genres, authors, themes)
- [ ] Implement collaborative filtering or content-based recommendations
- [ ] A/B test feed algorithms
- [ ] "Seen" tracking to prevent repeat content

### 3. User Identity (Priority: High)
**Goal:** Persistent identity without friction

- [ ] Device-based anonymous accounts (current approach - enhance)
- [ ] Sync bookmarks/likes across sessions
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

### 5. Social Sharing
**Goal:** Viral growth through beautiful shareable content

- [ ] Generate quote images with book cover background
- [ ] Share to Instagram Stories, Twitter, iMessage
- [ ] Deep link back to app from shared content
- [ ] "Made with LIBRIS" watermark

### 6. Book Discovery Links
**Goal:** Connect excerpts to full reading experience

- [ ] "Read this book" CTA on each excerpt
- [ ] Link to Project Gutenberg (free)
- [ ] Link to local library (via Libby/Overdrive API)
- [ ] Amazon affiliate links (monetization opportunity)

### 7. Daily Engagement
**Goal:** Build daily habit

- [ ] Push notification: "Your daily literary moment"
- [ ] Personalized daily quote based on preferences
- [ ] Streak tracking (X days in a row)
- [ ] "Quote of the day" featured content

---

## Phase 3: Community & UGC (Future)

### 8. User-Uploaded Quotes
- Quote submission with source attribution
- Moderation queue
- Copyright considerations (fair use guidelines)

### 9. Book Reviews
- Full book review system
- Rating aggregation
- Review excerpts in feed

### 10. Social Features
- Follow other users
- See friends' bookmarks/likes
- Curated collections by users

### 11. Audio Experience
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
