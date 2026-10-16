import re
import string
from typing import List, Dict, Any, Tuple
import spacy
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Load spaCy model globally (cached)
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    import en_core_web_sm
    nlp = en_core_web_sm.load()

try:
    STOP_WORDS = set(stopwords.words("english"))
except Exception:
    STOP_WORDS = nlp.Defaults.stop_words

lemmatizer = WordNetLemmatizer()

def clean_text(raw_text: str) -> str:
    """Preprocess and clean raw educational text."""
    if not raw_text:
        return ""
    
    # Remove control characters
    text = re.sub(r'[\r\f\v]', ' ', raw_text)
    
    # Standardize quotation marks and apostrophes
    text = text.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
    text = text.replace('—', ' - ').replace('–', ' - ')
    
    # Collapse multiple whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{2,}', '\n\n', text)
    
    return text.strip()

def extract_sentences(text: str) -> List[str]:
    """Segment text into clean, well-formed sentences using spaCy."""
    cleaned = clean_text(text)
    if not cleaned:
        return []
    
    # Split paragraphs first to ensure cross-paragraph sentences are never created
    paragraphs = [p.strip() for p in cleaned.split('\n') if p.strip()]
    sentences = []
    
    for para in paragraphs:
        doc = nlp(para)
        for sent in doc.sents:
            s_text = sent.text.strip()
            # Filter out noisy or extremely short fragments
            if len(s_text.split()) < 4:
                continue
            # Filter out standalone numbering e.g. "1.1", "Chapter 4"
            if re.match(r'^(chapter|section|\d+(\.\d+)*)\b', s_text, re.IGNORECASE) and len(s_text.split()) < 5:
                continue
            sentences.append(s_text)
        
    return sentences

def tokenize_and_lemmatize(sentence: str, remove_stopwords: bool = True) -> List[str]:
    """Tokenize and lemmatize words for NLP processing."""
    doc = nlp(sentence)
    tokens = []
    
    for token in doc:
        if token.is_punct or token.is_space:
            continue
        if remove_stopwords and token.lower_ in STOP_WORDS:
            continue
        lemma = token.lemma_.lower()
        if len(lemma) > 1:
            tokens.append(lemma)
            
    return tokens

def get_spacy_doc(text: str):
    """Obtain a processed spaCy Doc object."""
    return nlp(text)
