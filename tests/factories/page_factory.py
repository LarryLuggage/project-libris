import factory
from app.models import Page


class PageFactory(factory.Factory):
    """Factory for creating Page instances."""

    class Meta:
        model = Page

    id = factory.Sequence(lambda n: n + 1)
    book_id = factory.LazyAttribute(lambda o: o.book.id if hasattr(o, "book") else 1)
    page_number = factory.Sequence(lambda n: n + 1)
    content_text = factory.Faker("paragraph", nb_sentences=5)
    vibe_score = factory.Faker("pyfloat", min_value=0.0, max_value=1.0)

    @classmethod
    def create(cls, session=None, book=None, **kwargs):
        """Create and persist a Page instance."""
        if book:
            kwargs["book_id"] = book.id
        obj = cls.build(**kwargs)
        if session:
            session.add(obj)
            session.flush()
        return obj

    @classmethod
    def create_batch(cls, size, session=None, book=None, **kwargs):
        """Create multiple Page instances."""
        return [cls.create(session=session, book=book, **kwargs) for _ in range(size)]
