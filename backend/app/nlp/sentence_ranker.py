import re
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .preprocessor import extract_sentences, tokenize_and_lemmatize, get_spacy_doc

# Regular expression patterns indicating educational definitions and core concepts
DEFINITION_PATTERNS = [
    re.compile(r'\b(?:is|are)\s+defined\s+as\b', re.IGNORECASE),
    re.compile(r'\b(?:refers|refer)\s+to\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+(?:a|an|the)\s+(?:type|form|kind|subfield|process|technique|method|algorithm|model|data structure|concept|framework|protocol)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+(?:a|an|the)\s+[\w\s]{1,30}\s+(?:that|which|designed to|used to)\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+known\s+as\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+termed\s+as?\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+called\b', re.IGNORECASE),
    re.compile(r'\b(?:consists|consist|comprises|comprise)\s+of\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+responsible\s+for\b', re.IGNORECASE),
    re.compile(r'\b(?:is|are)\s+used\s+(?:to|for)\b', re.IGNORECASE),
    re.compile(r'\b(?:plays|play)\s+a\s+(?:crucial|vital|fundamental|key)\s+role\b', re.IGNORECASE),
    re.compile(r'\bstands\s+for\b', re.IGNORECASE),
]

# Patterns for penalized pronouns at start of sentence (hard to make standalone questions without context)
VAGUE_PRONOUN_STARTS = re.compile(r'^(?:he|she|it|they|them|his|her|their|this|these|those)\b', re.IGNORECASE)

def compute_textrank_scores(sentences: List[str], damping: float = 0.85, max_iter: int = 50) -> np.ndarray:
    """Compute TextRank graph centrality for sentences based on cosine similarity."""
    n = len(sentences)
    if n <= 1:
        return np.ones(n)
        
    try:
        # Build TF-IDF representations
        vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
        tfidf_mat = vectorizer.fit_transform(sentences)
        sim_matrix = cosine_similarity(tfidf_mat, tfidf_mat)
        
        # Zero out diagonal (self-loops)
        np.fill_diagonal(sim_matrix, 0)
        
        # Normalize row sums to form transition probability
        row_sums = sim_matrix.sum(axis=1)
        row_sums[row_sums == 0] = 1.0  # avoid division by zero
        transition_matrix = sim_matrix / row_sums[:, np.newaxis]
        
        # Power iteration for PageRank
        scores = np.ones(n) / n
        for _ in range(max_iter):
            prev_scores = scores.copy()
            scores = (1 - damping) / n + damping * np.dot(transition_matrix.T, scores)
            if np.allclose(scores, prev_scores, atol=1e-5):
                break
                
        # Min-max scale
        s_min, s_max = scores.min(), scores.max()
        if s_max > s_min:
            scores = (scores - s_min) / (s_max - s_min)
        else:
            scores = np.ones(n)
        return scores
    except Exception:
        return np.ones(n)

def rank_sentences(text: str) -> List[Dict[str, Any]]:
    """
    Extract, rank, and annotate sentences by informational value.
    Returns sorted list of sentence metadata dicts.
    """
    sentences = extract_sentences(text)
    if not sentences:
        return []
        
    textrank_weights = compute_textrank_scores(sentences)
    
    ranked_results = []
    
    for idx, sent in enumerate(sentences):
        words = sent.split()
        word_count = len(words)
        
        # Base score from TextRank
        score = float(textrank_weights[idx]) * 1.5
        
        # Check for definition patterns
        is_definition = False
        definition_pattern_matched = None
        for pattern in DEFINITION_PATTERNS:
            if pattern.search(sent):
                is_definition = True
                definition_pattern_matched = pattern.pattern
                score += 2.2 # Significant boost for clear definitions
                break
                
        # Length heuristics
        if 8 <= word_count <= 40:
            score += 0.8
        elif word_count < 6 or word_count > 55:
            score -= 1.0
            
        # Question sentences are poor sources for new question generation
        if sent.strip().endswith('?'):
            score -= 2.0
            
        # Vague pronoun start penalty
        if VAGUE_PRONOUN_STARTS.match(sent.strip()):
            score -= 1.2
            
        # Check presence of capitalized acronyms or technical terms
        has_acronym = bool(re.search(r'\b[A-Z]{2,6}\b', sent))
        if has_acronym:
            score += 0.5
            
        # Boost sentences with contrast or relationship words
        if re.search(r'\b(?:in contrast|however|whereas|compared to|unlike|because|therefore)\b', sent, re.IGNORECASE):
            score += 0.6
            
        ranked_results.append({
            "index": idx,
            "sentence": sent,
            "score": round(max(0.05, score), 3),
            "is_definition": is_definition,
            "word_count": word_count,
            "definition_pattern": definition_pattern_matched
        })
        
    # Sort descending by score
    ranked_results.sort(key=lambda x: x["score"], reverse=True)
    return ranked_results
