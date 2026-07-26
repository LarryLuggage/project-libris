# 2. Migration to Paragraph-based Database Seeding

## Status
Accepted

## Context
In early phases of Project LIBRIS development, the database was seeded with a chunking logic that strictly cut texts every 100 words. This caused sentences and words to be split arbitrarily across excerpt page boundaries, resulting in many chunks starting mid-sentence. 
Although the codebase had been updated to use paragraph boundary splitters (`\n\s*\n` matching `50-200` words), the local SQLite database (`libris.db`) remained populated with the stale, word-split data.

## Decision
We updated [seed_db.py](file:///Users/tylerabbott/projects/project-libris/scripts/seed_db.py) to add a `--reset` option which drops all tables and recreates them. We then ran a complete database re-seeding against the local SQLite database file, wiping out the stale data and generating 2,639 pages of clean, paragraph-aligned literary excerpts.

## Consequences
* Every excerpt card in the mobile app feed now starts at the beginning of a sentence with proper capitalisation.
* Stale local records were cleared (any local interaction test events in SQLite were wiped, which is expected for local development database resetting).
* Seeding execution is now fully deterministic and aligned with the backend's current ingestion logic.
