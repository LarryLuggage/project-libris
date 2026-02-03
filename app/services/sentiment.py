from abc import ABC, abstractmethod

from textblob import TextBlob


class SentimentAnalyzer(ABC):
    """Abstract base class for sentiment analyzers."""

    @abstractmethod
    def analyze(self, text: str) -> float:
        """
        Analyze sentiment of text.

        Args:
            text: Text to analyze

        Returns:
            Normalized score between 0.0 and 1.0
        """
        pass


class TextBlobAnalyzer(SentimentAnalyzer):
    """Basic TextBlob-based sentiment analyzer."""

    def analyze(self, text: str) -> float:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1 to 1
        return (polarity + 1) / 2  # Normalize to 0-1


class HybridAnalyzer(SentimentAnalyzer):
    """
    Combines polarity with subjectivity for literary text.

    High vibe = positive sentiment + high subjectivity (emotional, descriptive)
    """

    def analyze(self, text: str) -> float:
        blob = TextBlob(text)

        # Base polarity score (0-1)
        polarity_score = (blob.sentiment.polarity + 1) / 2

        # Subjectivity (0.0 = objective, 1.0 = subjective)
        # Literary passages tend to be more subjective/emotional
        subjectivity = blob.sentiment.subjectivity

        # Weight: 70% polarity, 30% subjectivity
        combined = (polarity_score * 0.7) + (subjectivity * 0.3)

        return min(max(combined, 0.0), 1.0)


class LiteraryAnalyzer(SentimentAnalyzer):
    """
    Enhanced analyzer that considers literary elements:
    - Descriptive language
    - Emotional intensity
    - Quotable passages (dialogue)
    """

    POSITIVE_WORDS = {
        "beautiful",
        "wonder",
        "joy",
        "love",
        "hope",
        "dream",
        "light",
        "bright",
        "golden",
        "gentle",
        "peace",
        "warm",
        "sweet",
        "grace",
        "glory",
    }

    DESCRIPTIVE_WORDS = {
        "gleaming",
        "vast",
        "ancient",
        "whispered",
        "echoed",
        "shimmering",
        "towering",
        "sprawling",
        "delicate",
        "magnificent",
        "mysterious",
        "ethereal",
    }

    def __init__(self):
        self.hybrid = HybridAnalyzer()

    def analyze(self, text: str) -> float:
        base_score = self.hybrid.analyze(text)

        # Keyword analysis
        text_lower = text.lower()
        keyword_bonus = 0.0

        # Positive literary words
        for word in self.POSITIVE_WORDS:
            if word in text_lower:
                keyword_bonus += 0.015

        # Descriptive words (engaging writing)
        for word in self.DESCRIPTIVE_WORDS:
            if word in text_lower:
                keyword_bonus += 0.01

        # Dialogue bonus (quoted speech is often engaging)
        quote_count = text.count('"')
        if quote_count >= 4:  # At least 2 complete quotes
            keyword_bonus += 0.03

        # Cap the bonus
        keyword_bonus = min(keyword_bonus, 0.15)

        final_score = base_score + keyword_bonus
        return min(max(final_score, 0.0), 1.0)


def get_analyzer(analyzer_type: str = "literary") -> SentimentAnalyzer:
    """
    Factory function to get a sentiment analyzer.

    Args:
        analyzer_type: One of "textblob", "hybrid", or "literary"

    Returns:
        SentimentAnalyzer instance
    """
    analyzers = {
        "textblob": TextBlobAnalyzer,
        "hybrid": HybridAnalyzer,
        "literary": LiteraryAnalyzer,
    }
    analyzer_class = analyzers.get(analyzer_type, LiteraryAnalyzer)
    return analyzer_class()
