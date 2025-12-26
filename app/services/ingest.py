import re
from typing import List
from textblob import TextBlob

def strip_gutenberg_headers(text: str) -> str:
    """
    Removes the standard Project Gutenberg header and footer from the text.
    """
    # Regex to identify the start and end of the book content
    # These are common patterns, though Gutenberg formats can vary slightly.
    start_pattern = r"\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*"
    end_pattern = r"\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK .* \*\*\*"
    
    # Attempt to find the start marker
    start_match = re.search(start_pattern, text, re.IGNORECASE)
    # Attempt to find the end marker
    end_match = re.search(end_pattern, text, re.IGNORECASE)

    start_index = 0
    end_index = len(text)

    if start_match:
        # Move past the marker and any immediate newlines
        start_index = start_match.end()
    
    if end_match:
        end_index = end_match.start()
        
    # If patterns aren't found, we return the text (or trimmed) as is, 
    # but theoretically we should always find them in standard files.
    
    body = text[start_index:end_index]
    return body.strip()

def chunk_text(text: str, word_count: int = 300) -> List[str]:
    """
    Splits the text into chunks of exactly `word_count` words.
    """
    # Simple whitespace splitting for "words"
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), word_count):
        chunk_words = words[i:i + word_count]
        chunks.append(" ".join(chunk_words))
        
    return chunks

def analyze_vibe(chunk: str) -> float:
    """
    Assigns a float vibe_score (0.0 to 1.0) to the chunk.
    TextBlob polarity is -1.0 to 1.0.
    We normalize: (polarity + 1) / 2
    """
    blob = TextBlob(chunk)
    polarity = blob.sentiment.polarity
    normalized_score = (polarity + 1) / 2
    return normalized_score
