#!/usr/bin/env python3
"""
CLI script to ingest books from Project Gutenberg.

Usage:
    # Ingest 100 books from curated catalog
    python scripts/ingest_gutenberg.py --count 100

    # Ingest specific books by ID
    python scripts/ingest_gutenberg.py --ids 1342,84,11,2701

    # Verbose mode with progress
    python scripts/ingest_gutenberg.py --count 100 -v
"""

import argparse
import logging
import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import SessionLocal
from app.services.gutenberg import GutenbergPipeline, BookCatalog, IngestionProgress


def setup_logging(verbose: bool) -> None:
    """Configure logging based on verbosity."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%H:%M:%S",
    )
    # Quiet down noisy libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)


def create_progress_callback(verbose: bool):
    """Create a progress callback for the pipeline."""

    def progress_callback(progress: IngestionProgress) -> None:
        """Print progress updates."""
        pct = progress.current_book / progress.total_books * 100
        status = (
            f"[{progress.current_book:3d}/{progress.total_books}] "
            f"({pct:5.1f}%) "
            f"{progress.current_title[:40]:<40} by {progress.current_author[:20]}"
        )
        if verbose:
            print(status)
        else:
            # Overwrite line for compact output
            print(f"\r{status}", end="", flush=True)

    return progress_callback


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Ingest books from Project Gutenberg",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/ingest_gutenberg.py --count 10
  python scripts/ingest_gutenberg.py --ids 1342,84,11
  python scripts/ingest_gutenberg.py --count 100 -v
        """,
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of books to ingest from curated catalog (default: 10)",
    )
    parser.add_argument(
        "--ids",
        type=str,
        help="Comma-separated Gutenberg IDs to ingest (overrides --count)",
    )
    parser.add_argument(
        "--word-count",
        type=int,
        default=300,
        help="Words per page chunk (default: 300)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Verbose output with detailed logging",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be ingested without actually doing it",
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)

    # Load catalog
    catalog = BookCatalog()
    logger.info(f"Loaded catalog with {len(catalog)} books")

    # Determine which books to ingest
    if args.ids:
        # Parse specific IDs
        try:
            ids = [int(x.strip()) for x in args.ids.split(",")]
        except ValueError:
            print("Error: --ids must be comma-separated integers")
            sys.exit(1)
        books = catalog.get_books_by_ids(ids)
        logger.info(f"Will ingest {len(books)} books by ID")
    else:
        # Use curated catalog
        books = catalog.get_curated_books(limit=args.count)
        logger.info(f"Will ingest {len(books)} books from curated catalog")

    # Dry run - just show what would happen
    if args.dry_run:
        print("\n=== DRY RUN ===")
        print(f"Would ingest {len(books)} books:\n")
        for i, book in enumerate(books, 1):
            print(f"  {i:3d}. [{book['gutenberg_id']:5d}] {book['title']} by {book['author']}")
        print("\nRun without --dry-run to actually ingest.")
        return

    # Print header
    print("\n" + "=" * 60)
    print("Gutenberg Ingestion Pipeline")
    print("=" * 60)
    print(f"Target: {len(books)} books")
    print(f"Word count per page: {args.word_count}")
    print()

    # Create database session
    db = SessionLocal()

    try:
        # Create progress callback
        progress_cb = create_progress_callback(args.verbose)

        # Run pipeline
        with GutenbergPipeline(
            db=db,
            word_count=args.word_count,
            progress_callback=progress_cb,
        ) as pipeline:
            result = pipeline.ingest_batch(books)

        # Clear progress line if not verbose
        if not args.verbose:
            print()

        # Print results
        print("\n" + "=" * 60)
        print(result.summary())
        print("=" * 60)

        # Exit code based on failures
        if result.books_failed > 0:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(130)

    except Exception as e:
        logger.exception("Fatal error during ingestion")
        print(f"\nFatal error: {e}")
        sys.exit(1)

    finally:
        db.close()


if __name__ == "__main__":
    main()
