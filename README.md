# Project LIBRIS

Project LIBRIS is a "Goodreads meets TikTok" MVP for discovering literature
through swipeable public-domain excerpts.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Mobile: Expo, React Native, Zustand
- Content source: Project Gutenberg

## Backend Setup

```bash
python3 -m venv venv
venv/bin/pip install -r requirements-dev.txt
```

Create a local `.env` file:

```bash
DATABASE_URL=postgresql+psycopg2://localhost/libris
LOG_LEVEL=INFO
VIBE_THRESHOLD=0.6
PAGE_SIZE=10
CORS_ORIGINS='["http://localhost:19006","http://localhost:8081","http://127.0.0.1:19006"]'
```

Run migrations:

```bash
venv/bin/python -m alembic upgrade head
```

Start the API:

```bash
venv/bin/uvicorn app.main:app --reload
```

Seed or ingest content:

```bash
venv/bin/python scripts/seed_db.py
venv/bin/python scripts/ingest_gutenberg.py --count 10
```

## Mobile Setup

```bash
cd mobile
npm install
npm start
```

For physical devices, set `expo.extra.apiBaseUrl` in `mobile/app.json` or expose
the API on the same LAN. Simulators use local development defaults.

## Local Checks

Run the full MVP hardening check suite:

```bash
bash scripts/check.sh
```

## API Notes

- `GET /api/v1/feed` returns a deterministic global feed ranked by engagement,
  then vibe score, then page ID. This is not yet personalized recommendation.
- Passing `X-Device-ID` to `GET /api/v1/feed` suppresses pages with server-side
  `seen` or `skipped` events for that device.
- `POST /api/v1/interactions/events` records feed events with `page_id` and
  `event_type`; supported event types are `seen`, `skipped`, `liked`, and
  `bookmarked`.
- Anonymous device IDs are the MVP identity model. Interaction endpoints apply a
  lightweight in-process rate limit per device.

## Deployment Notes

- Do not use wildcard CORS in production. Set `CORS_ORIGINS` to explicit app
  origins.
- Run `alembic upgrade head` before starting a new deployment.
- The current feed ranking uses aggregate like/bookmark counts at request time;
  cache or precompute these scores before high-traffic launch.
