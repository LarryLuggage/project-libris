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

    def test_keeps_paragraphs_in_target_word_range(self):
        """Should keep only paragraphs between 50 and 200 words."""
        para = " ".join(["word"] * 75)
        chunks = chunk_text(para)
        assert chunks == [para]

    def test_empty_text(self):
        """Should return empty list for empty text."""
        chunks = chunk_text("")
        assert chunks == []

    def test_filters_short_and_long_paragraphs(self):
        """Should drop paragraphs outside the accepted word range."""
        short_para = " ".join(["short"] * 30)
        valid_para = " ".join(["valid"] * 80)
        long_para = " ".join(["long"] * 250)
        text = f"{short_para}\n\n{valid_para}\n\n{long_para}"
        chunks = chunk_text(text)
        assert chunks == [valid_para]

    def test_splits_on_blank_lines_and_normalizes_whitespace(self):
        """Should use paragraph boundaries and collapse whitespace."""
        para1 = " ".join(["alpha"] * 60)
        para2 = " ".join(["beta"] * 55)
        text = f"\n  {para1} \n\n\n  {para2}  \n"
        chunks = chunk_text(text)
        assert chunks == [para1, para2]

    def test_word_count_parameter_is_ignored_for_backward_compat(self):
        """word_count arg should not change current paragraph-based behavior."""
        para = " ".join(["word"] * 70)
        assert chunk_text(para, word_count=25) == chunk_text(para, word_count=300)


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
        assert 0.3 <= score <= 0.7
