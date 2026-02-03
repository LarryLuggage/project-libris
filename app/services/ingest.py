import re
from typing import List, Optional

from app.config import get_settings
from app.services.sentiment import get_analyzer, SentimentAnalyzer


# Module-level analyzer instance (lazy-loaded)
_analyzer: Optional[SentimentAnalyzer] = None


def _get_analyzer() -> SentimentAnalyzer:
    """Get or create the sentiment analyzer."""
    global _analyzer
    if _analyzer is None:
        settings = get_settings()
        _analyzer = get_analyzer(settings.sentiment_analyzer)
    return _analyzer


def strip_gutenberg_headers(text: str) -> str:
    """
    Removes the standard Project Gutenberg header and footer from the text.

    Args:
        text: Raw text from Project Gutenberg

    Returns:
        Text with header/footer removed
    """
    start_pattern = r"\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*"
    end_pattern = r"\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*"

    start_match = re.search(start_pattern, text, re.IGNORECASE)
    end_match = re.search(end_pattern, text, re.IGNORECASE)

    start_index = 0
    end_index = len(text)

    if start_match:
        start_index = start_match.end()

    if end_match:
        end_index = end_match.start()

    body = text[start_index:end_index]
    return body.strip()


def chunk_text(text: str, word_count: int = 300) -> List[str]:
    """
    Splits the text into paragraph-sized chunks.

    Extracts natural paragraphs from the text, keeping only those
    within the target word range for a good reading experience.

    Args:
        text: Text to chunk
        word_count: Ignored (kept for API compatibility). Uses 50-200 word range.

    Returns:
        List of paragraph chunks
    """
    min_words = 50
    max_words = 200

    # Split on double newlines (paragraph boundaries)
    # Also handle various newline formats
    paragraphs = re.split(r'\n\s*\n', text)

    chunks = []
    for para in paragraphs:
        # Clean up whitespace
        para = ' '.join(para.split())

        if not para:
            continue

        word_count_actual = len(para.split())

        # Keep paragraphs in the sweet spot
        if min_words <= word_count_actual <= max_words:
            chunks.append(para)

    return chunks


def analyze_vibe(chunk: str) -> float:
    """
    Assigns a vibe score (0.0 to 1.0) to the text chunk.

    Uses the configured sentiment analyzer from settings.

    Args:
        chunk: Text to analyze

    Returns:
        Normalized sentiment score between 0.0 and 1.0
    """
    analyzer = _get_analyzer()
    return analyzer.analyze(chunk)
