import requests
import sys
import os

# Ensure app is in python path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.models import Book, Page, Base
from app.services.ingest import strip_gutenberg_headers, chunk_text, analyze_vibe

# List of Gutenberg IDs for initial seed
# 1342: Pride and Prejudice
# 84: Frankenstein
# 11: Alice's Adventures in Wonderland
# 2701: Moby Dick
# 1513: Romeo and Juliet
TARGET_BOOKS = [
    {"id": 1342, "title": "Pride and Prejudice", "author": "Jane Austen"},
    {"id": 84, "title": "Frankenstein", "author": "Mary Shelley"},
    {"id": 11, "title": "Alice's Adventures in Wonderland", "author": "Lewis Carroll"},
    {"id": 2701, "title": "Moby Dick", "author": "Herman Melville"},
    {"id": 1513, "title": "Romeo and Juliet", "author": "William Shakespeare"},
]

def get_gutenberg_url(book_id: int) -> str:
    return f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt"

def seed_db():
    db = SessionLocal()
    
    # Create tables if they don't exist (ensures we can run this standalone)
    Base.metadata.create_all(bind=engine)

    for book_info in TARGET_BOOKS:
        book_id = book_info["id"]
        title = book_info["title"]
        author = book_info["author"]

        existing_book = db.query(Book).filter(Book.gutenberg_id == book_id).first()
        if existing_book:
            print(f"Skipping {title} (already exists)")
            continue

        print(f"Downloading {title}...")
        url = get_gutenberg_url(book_id)
        try:
            response = requests.get(url)
            response.raise_for_status()
            text = response.text
        except Exception as e:
            print(f"Failed to download {title}: {e}")
            continue

        print(f"Processing {title}...")
        # Clean
        body_text = strip_gutenberg_headers(text)
        
        # Create Book
        book = Book(
            gutenberg_id=book_id,
            title=title,
            author=author,
            cover_url=f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.cover.medium.jpg"
        )
        db.add(book)
        db.commit()
        db.refresh(book)

        # Chunk and Score
        chunks = chunk_text(body_text, word_count=100)
        print(f"  -> Generated {len(chunks)} pages")

        pages_to_add = []
        for i, chunk_content in enumerate(chunks):
            vibe = analyze_vibe(chunk_content)
            page = Page(
                book_id=book.id,
                page_number=i + 1,
                content_text=chunk_content,
                vibe_score=vibe
            )
            pages_to_add.append(page)
        
        db.add_all(pages_to_add)
        db.commit()
        print(f"  -> Saved pages for {title}")

    db.close()
    print("Seeding complete!")

if __name__ == "__main__":
    seed_db()
