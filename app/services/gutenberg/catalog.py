"""
Curated catalog of classic books from Project Gutenberg.
"""

from typing import Dict, List, Optional


class BookCatalog:
    """
    Manages the curated list of classic books to ingest.

    Contains 100+ hand-picked classics that produce high-quality,
    engaging literary excerpts suitable for the feed.
    """

    # Curated list of classic literature with known high-quality content
    CURATED_CLASSICS: List[Dict] = [
        # Jane Austen
        {"gutenberg_id": 1342, "title": "Pride and Prejudice", "author": "Jane Austen"},
        {"gutenberg_id": 158, "title": "Emma", "author": "Jane Austen"},
        {"gutenberg_id": 161, "title": "Sense and Sensibility", "author": "Jane Austen"},
        {"gutenberg_id": 105, "title": "Persuasion", "author": "Jane Austen"},
        {"gutenberg_id": 121, "title": "Northanger Abbey", "author": "Jane Austen"},
        {"gutenberg_id": 141, "title": "Mansfield Park", "author": "Jane Austen"},
        # Charles Dickens
        {"gutenberg_id": 98, "title": "A Tale of Two Cities", "author": "Charles Dickens"},
        {"gutenberg_id": 1400, "title": "Great Expectations", "author": "Charles Dickens"},
        {"gutenberg_id": 766, "title": "David Copperfield", "author": "Charles Dickens"},
        {"gutenberg_id": 730, "title": "Oliver Twist", "author": "Charles Dickens"},
        {"gutenberg_id": 46, "title": "A Christmas Carol", "author": "Charles Dickens"},
        {"gutenberg_id": 564, "title": "The Pickwick Papers", "author": "Charles Dickens"},
        {"gutenberg_id": 580, "title": "The Old Curiosity Shop", "author": "Charles Dickens"},
        # Gothic & Horror
        {"gutenberg_id": 84, "title": "Frankenstein", "author": "Mary Shelley"},
        {"gutenberg_id": 345, "title": "Dracula", "author": "Bram Stoker"},
        {"gutenberg_id": 174, "title": "The Picture of Dorian Gray", "author": "Oscar Wilde"},
        {"gutenberg_id": 42, "title": "The Strange Case of Dr. Jekyll and Mr. Hyde", "author": "Robert Louis Stevenson"},
        {"gutenberg_id": 209, "title": "The Turn of the Screw", "author": "Henry James"},
        # Bronte Sisters
        {"gutenberg_id": 768, "title": "Wuthering Heights", "author": "Emily Bronte"},
        {"gutenberg_id": 1260, "title": "Jane Eyre", "author": "Charlotte Bronte"},
        {"gutenberg_id": 969, "title": "The Tenant of Wildfell Hall", "author": "Anne Bronte"},
        # American Classics
        {"gutenberg_id": 2701, "title": "Moby Dick", "author": "Herman Melville"},
        {"gutenberg_id": 74, "title": "The Adventures of Tom Sawyer", "author": "Mark Twain"},
        {"gutenberg_id": 76, "title": "Adventures of Huckleberry Finn", "author": "Mark Twain"},
        {"gutenberg_id": 1322, "title": "Leaves of Grass", "author": "Walt Whitman"},
        {"gutenberg_id": 2852, "title": "The Scarlet Letter", "author": "Nathaniel Hawthorne"},
        {"gutenberg_id": 25344, "title": "The Scarlet Letter", "author": "Nathaniel Hawthorne"},
        {"gutenberg_id": 514, "title": "Little Women", "author": "Louisa May Alcott"},
        {"gutenberg_id": 76, "title": "The Call of the Wild", "author": "Jack London"},
        {"gutenberg_id": 215, "title": "The Call of the Wild", "author": "Jack London"},
        {"gutenberg_id": 910, "title": "White Fang", "author": "Jack London"},
        # Sherlock Holmes & Mystery
        {"gutenberg_id": 1661, "title": "The Adventures of Sherlock Holmes", "author": "Arthur Conan Doyle"},
        {"gutenberg_id": 244, "title": "A Study in Scarlet", "author": "Arthur Conan Doyle"},
        {"gutenberg_id": 2097, "title": "The Sign of Four", "author": "Arthur Conan Doyle"},
        {"gutenberg_id": 2852, "title": "The Hound of the Baskervilles", "author": "Arthur Conan Doyle"},
        {"gutenberg_id": 108, "title": "The Moonstone", "author": "Wilkie Collins"},
        {"gutenberg_id": 583, "title": "The Woman in White", "author": "Wilkie Collins"},
        # Adventure
        {"gutenberg_id": 120, "title": "Treasure Island", "author": "Robert Louis Stevenson"},
        {"gutenberg_id": 27, "title": "Kidnapped", "author": "Robert Louis Stevenson"},
        {"gutenberg_id": 103, "title": "Around the World in Eighty Days", "author": "Jules Verne"},
        {"gutenberg_id": 164, "title": "Twenty Thousand Leagues Under the Sea", "author": "Jules Verne"},
        {"gutenberg_id": 83, "title": "Journey to the Center of the Earth", "author": "Jules Verne"},
        {"gutenberg_id": 2488, "title": "The Mysterious Island", "author": "Jules Verne"},
        # Russian Literature
        {"gutenberg_id": 2600, "title": "War and Peace", "author": "Leo Tolstoy"},
        {"gutenberg_id": 1399, "title": "Anna Karenina", "author": "Leo Tolstoy"},
        {"gutenberg_id": 2554, "title": "Crime and Punishment", "author": "Fyodor Dostoevsky"},
        {"gutenberg_id": 28054, "title": "The Brothers Karamazov", "author": "Fyodor Dostoevsky"},
        {"gutenberg_id": 600, "title": "Notes from Underground", "author": "Fyodor Dostoevsky"},
        {"gutenberg_id": 1234, "title": "The Idiot", "author": "Fyodor Dostoevsky"},
        # French Literature
        {"gutenberg_id": 135, "title": "Les Miserables", "author": "Victor Hugo"},
        {"gutenberg_id": 2413, "title": "The Hunchback of Notre-Dame", "author": "Victor Hugo"},
        {"gutenberg_id": 1184, "title": "The Count of Monte Cristo", "author": "Alexandre Dumas"},
        {"gutenberg_id": 1259, "title": "The Three Musketeers", "author": "Alexandre Dumas"},
        {"gutenberg_id": 1257, "title": "The Man in the Iron Mask", "author": "Alexandre Dumas"},
        {"gutenberg_id": 2097, "title": "Twenty Years After", "author": "Alexandre Dumas"},
        {"gutenberg_id": 2650, "title": "Madame Bovary", "author": "Gustave Flaubert"},
        # Children's Classics
        {"gutenberg_id": 11, "title": "Alice's Adventures in Wonderland", "author": "Lewis Carroll"},
        {"gutenberg_id": 12, "title": "Through the Looking-Glass", "author": "Lewis Carroll"},
        {"gutenberg_id": 16, "title": "Peter Pan", "author": "J.M. Barrie"},
        {"gutenberg_id": 1998, "title": "The Wonderful Wizard of Oz", "author": "L. Frank Baum"},
        {"gutenberg_id": 35, "title": "The Time Machine", "author": "H.G. Wells"},
        {"gutenberg_id": 36, "title": "The War of the Worlds", "author": "H.G. Wells"},
        {"gutenberg_id": 159, "title": "The Invisible Man", "author": "H.G. Wells"},
        {"gutenberg_id": 5230, "title": "The Jungle Book", "author": "Rudyard Kipling"},
        {"gutenberg_id": 1937, "title": "The Secret Garden", "author": "Frances Hodgson Burnett"},
        {"gutenberg_id": 113, "title": "The Secret Garden", "author": "Frances Hodgson Burnett"},
        {"gutenberg_id": 479, "title": "A Little Princess", "author": "Frances Hodgson Burnett"},
        {"gutenberg_id": 32, "title": "Heidi", "author": "Johanna Spyri"},
        {"gutenberg_id": 45, "title": "Anne of Green Gables", "author": "L.M. Montgomery"},
        # Shakespeare
        {"gutenberg_id": 1513, "title": "Romeo and Juliet", "author": "William Shakespeare"},
        {"gutenberg_id": 1524, "title": "Hamlet", "author": "William Shakespeare"},
        {"gutenberg_id": 2267, "title": "Macbeth", "author": "William Shakespeare"},
        {"gutenberg_id": 1533, "title": "A Midsummer Night's Dream", "author": "William Shakespeare"},
        {"gutenberg_id": 1519, "title": "Much Ado About Nothing", "author": "William Shakespeare"},
        {"gutenberg_id": 1531, "title": "The Tempest", "author": "William Shakespeare"},
        {"gutenberg_id": 1532, "title": "King Lear", "author": "William Shakespeare"},
        {"gutenberg_id": 1508, "title": "Othello", "author": "William Shakespeare"},
        {"gutenberg_id": 1522, "title": "Twelfth Night", "author": "William Shakespeare"},
        {"gutenberg_id": 1515, "title": "The Merchant of Venice", "author": "William Shakespeare"},
        # Thomas Hardy
        {"gutenberg_id": 110, "title": "Tess of the d'Urbervilles", "author": "Thomas Hardy"},
        {"gutenberg_id": 153, "title": "Far from the Madding Crowd", "author": "Thomas Hardy"},
        {"gutenberg_id": 73, "title": "The Mayor of Casterbridge", "author": "Thomas Hardy"},
        {"gutenberg_id": 50, "title": "Jude the Obscure", "author": "Thomas Hardy"},
        # George Eliot
        {"gutenberg_id": 145, "title": "Middlemarch", "author": "George Eliot"},
        {"gutenberg_id": 550, "title": "Silas Marner", "author": "George Eliot"},
        {"gutenberg_id": 6688, "title": "The Mill on the Floss", "author": "George Eliot"},
        # Oscar Wilde
        {"gutenberg_id": 854, "title": "The Importance of Being Earnest", "author": "Oscar Wilde"},
        {"gutenberg_id": 902, "title": "Lady Windermere's Fan", "author": "Oscar Wilde"},
        {"gutenberg_id": 773, "title": "The Happy Prince and Other Tales", "author": "Oscar Wilde"},
        # Joseph Conrad
        {"gutenberg_id": 219, "title": "Heart of Darkness", "author": "Joseph Conrad"},
        {"gutenberg_id": 220, "title": "Lord Jim", "author": "Joseph Conrad"},
        {"gutenberg_id": 974, "title": "The Secret Agent", "author": "Joseph Conrad"},
        # Henry James
        {"gutenberg_id": 432, "title": "The Portrait of a Lady", "author": "Henry James"},
        {"gutenberg_id": 209, "title": "The Turn of the Screw", "author": "Henry James"},
        {"gutenberg_id": 639, "title": "Washington Square", "author": "Henry James"},
        # Edith Wharton
        {"gutenberg_id": 541, "title": "The Age of Innocence", "author": "Edith Wharton"},
        {"gutenberg_id": 4517, "title": "The House of Mirth", "author": "Edith Wharton"},
        {"gutenberg_id": 4510, "title": "Ethan Frome", "author": "Edith Wharton"},
        # More Classics
        {"gutenberg_id": 1232, "title": "The Prince", "author": "Niccolo Machiavelli"},
        {"gutenberg_id": 1497, "title": "The Republic", "author": "Plato"},
        {"gutenberg_id": 996, "title": "Don Quixote", "author": "Miguel de Cervantes"},
        {"gutenberg_id": 7849, "title": "Candide", "author": "Voltaire"},
        {"gutenberg_id": 2591, "title": "Grimm's Fairy Tales", "author": "Brothers Grimm"},
        {"gutenberg_id": 30254, "title": "The Blue Fairy Book", "author": "Andrew Lang"},
        {"gutenberg_id": 28885, "title": "The Red Fairy Book", "author": "Andrew Lang"},
        # Edgar Allan Poe
        {"gutenberg_id": 932, "title": "The Fall of the House of Usher", "author": "Edgar Allan Poe"},
        {"gutenberg_id": 2147, "title": "The Works of Edgar Allan Poe", "author": "Edgar Allan Poe"},
        {"gutenberg_id": 2148, "title": "The Raven and Other Poems", "author": "Edgar Allan Poe"},
        # More Adventure
        {"gutenberg_id": 1184, "title": "The Count of Monte Cristo", "author": "Alexandre Dumas"},
        {"gutenberg_id": 829, "title": "Gulliver's Travels", "author": "Jonathan Swift"},
        {"gutenberg_id": 521, "title": "Robinson Crusoe", "author": "Daniel Defoe"},
        {"gutenberg_id": 4300, "title": "Ulysses", "author": "James Joyce"},
        {"gutenberg_id": 2814, "title": "Dubliners", "author": "James Joyce"},
        {"gutenberg_id": 4217, "title": "A Portrait of the Artist as a Young Man", "author": "James Joyce"},
    ]

    def __init__(self):
        """Initialize the catalog."""
        # Remove duplicates by gutenberg_id
        seen = set()
        self._books = []
        for book in self.CURATED_CLASSICS:
            if book["gutenberg_id"] not in seen:
                seen.add(book["gutenberg_id"])
                self._books.append(book)

    def get_curated_books(self, limit: Optional[int] = None) -> List[Dict]:
        """
        Get the curated list of classic books.

        Args:
            limit: Maximum number of books to return (None for all)

        Returns:
            List of book dicts with gutenberg_id, title, author
        """
        if limit is None:
            return self._books.copy()
        return self._books[:limit]

    def get_books_by_ids(self, ids: List[int]) -> List[Dict]:
        """
        Get book info for specific Gutenberg IDs.

        For IDs in the curated list, returns the stored metadata.
        For IDs not in the list, creates placeholder entries.

        Args:
            ids: List of Gutenberg IDs

        Returns:
            List of book dicts
        """
        id_to_book = {book["gutenberg_id"]: book for book in self._books}
        result = []

        for gid in ids:
            if gid in id_to_book:
                result.append(id_to_book[gid])
            else:
                # Create placeholder for unknown IDs
                result.append(
                    {
                        "gutenberg_id": gid,
                        "title": f"Unknown Book {gid}",
                        "author": "Unknown Author",
                    }
                )

        return result

    def get_book_by_id(self, gutenberg_id: int) -> Optional[Dict]:
        """
        Get a single book by its Gutenberg ID.

        Args:
            gutenberg_id: The Gutenberg book ID

        Returns:
            Book dict or None if not found
        """
        for book in self._books:
            if book["gutenberg_id"] == gutenberg_id:
                return book
        return None

    def __len__(self) -> int:
        """Return number of books in catalog."""
        return len(self._books)

    def __iter__(self):
        """Iterate over books in catalog."""
        return iter(self._books)
