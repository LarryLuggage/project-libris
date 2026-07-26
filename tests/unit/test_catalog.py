from app.services.gutenberg.catalog import BookCatalog


def test_curated_classics_has_no_conflicting_duplicate_ids():
    seen = {}
    for book in BookCatalog.CURATED_CLASSICS:
        gid = book["gutenberg_id"]
        key = (book["title"], book["author"])
        if gid in seen:
            assert seen[gid] == key
        else:
            seen[gid] = key


def test_catalog_deduplicates_ids_without_conflict():
    catalog = BookCatalog()
    ids = [book["gutenberg_id"] for book in catalog.get_curated_books()]
    assert len(ids) == len(set(ids))
