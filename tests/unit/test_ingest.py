import pytest
from app.services.ingest import strip_gutenberg_headers, chunk_text, analyze_vibe


class TestStripGutenbergHeaders:
    """Tests for strip_gutenberg_headers function."""

    def test_removes_start_marker(self):
        """Should remove content before START marker."""
        text = "Header content\n*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\nBook content here"
        result = strip_gutenberg_headers(text)
        assert "Header content" not in result
        assert "Book content here" in result

    def test_removes_end_marker(self):
        """Should remove content after END marker."""
        text = "Book content\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***\nFooter content"
        result = strip_gutenberg_headers(text)
        assert "Footer content" not in result
        assert "Book content" in result

    def test_removes_both_markers(self):
        """Should remove both header and footer."""
        text = (
            "License info\n"
            "*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\n"
            "Actual book content\n"
            "*** END OF THE PROJECT GUTENBERG EBOOK TEST ***\n"
            "End license"
        )
        result = strip_gutenberg_headers(text)
        assert "License info" not in result
        assert "End license" not in result
        assert "Actual book content" in result

    def test_handles_missing_markers(self):
        """Should return original text if no markers found."""
        text = "Plain text without markers"
        result = strip_gutenberg_headers(text)
        assert result == text

    def test_handles_this_variant(self):
        """Should handle 'THIS' variant of marker."""
        text = "Header\n*** START OF THIS PROJECT GUTENBERG EBOOK TEST ***\nContent"
        result = strip_gutenberg_headers(text)
        assert "Header" not in result
        assert "Content" in result

    def test_strips_whitespace(self):
        """Should strip leading/trailing whitespace from result."""
        text = "*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\n\n  Content  \n\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***"
        result = strip_gutenberg_headers(text)
        assert result == "Content"


class TestChunkText:
    """Tests for chunk_text function."""

    def test_chunks_exact_word_count(self):
        """Should create chunks of exact word count."""
        words = " ".join(["word"] * 600)
        chunks = chunk_text(words, word_count=300)
        assert len(chunks) == 2
        assert len(chunks[0].split()) == 300
        assert len(chunks[1].split()) == 300

    def test_handles_remainder(self):
        """Should handle text that doesn't divide evenly."""
        words = " ".join(["word"] * 350)
        chunks = chunk_text(words, word_count=300)
        assert len(chunks) == 2
        assert len(chunks[0].split()) == 300
        assert len(chunks[1].split()) == 50

    def test_empty_text(self):
        """Should return empty list for empty text."""
        chunks = chunk_text("")
        assert chunks == [""]

    def test_text_shorter_than_chunk(self):
        """Should return single chunk for short text."""
        text = "Short text here"
        chunks = chunk_text(text, word_count=300)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_custom_word_count(self):
        """Should respect custom word count."""
        words = " ".join(["word"] * 100)
        chunks = chunk_text(words, word_count=25)
        assert len(chunks) == 4


class TestAnalyzeVibe:
    """Tests for analyze_vibe function."""

    def test_positive_text_high_score(self):
        """Positive text should have high vibe score."""
        text = "This is wonderful, amazing, beautiful, and fantastic!"
        score = analyze_vibe(text)
        assert score > 0.5

    def test_negative_text_low_score(self):
        """Negative text should have lower vibe score."""
        text = "This is terrible, awful, horrible, and disgusting."
        score = analyze_vibe(text)
        assert score < 0.5

    def test_score_in_valid_range(self):
        """Score should always be between 0.0 and 1.0."""
        texts = [
            "Neutral text here.",
            "I love everything!",
            "I hate everything!",
            "The sky is blue.",
        ]
        for text in texts:
            score = analyze_vibe(text)
            assert 0.0 <= score <= 1.0

    def test_neutral_text_middle_score(self):
        """Neutral text should have score around 0.5."""
        text = "The table is made of wood."
        score = analyze_vibe(text)
        assert 0.4 <= score <= 0.6
