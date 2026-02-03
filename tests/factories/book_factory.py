import factory
from app.models import Book


class BookFactory(factory.Factory):
    """Factory for creating Book instances."""

    class Meta:
        model = Book

    id = factory.Sequence(lambda n: n + 1)
    gutenberg_id = factory.Sequence(lambda n: 1000 + n)
    title = factory.Faker("sentence", nb_words=4)
    author = factory.Faker("name")
    cover_url = factory.Faker("image_url")

    @classmethod
    def create(cls, session=None, **kwargs):
        """Create and persist a Book instance."""
        obj = cls.build(**kwargs)
        if session:
            session.add(obj)
            session.flush()
        return obj

    @classmethod
    def create_batch(cls, size, session=None, **kwargs):
        """Create multiple Book instances."""
        return [cls.create(session=session, **kwargs) for _ in range(size)]
