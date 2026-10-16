import re
from typing import List, Dict, Any, Set, Tuple
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from .preprocessor import get_spacy_doc, STOP_WORDS

TECHNICAL_TERMS_RE = re.compile(
    r'\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[A-Z]{2,6}(?:/[A-Z]{2,6})?)\b'
)

def extract_noun_chunks(doc) -> List[Dict[str, Any]]:
    """Extract noun chunks and compound technical entities from spaCy doc."""
    chunks = []
    seen = set()
    
    for chunk in doc.noun_chunks:
        text = chunk.text.strip()
        cleaned_text = re.sub(r'^(the|a|an|this|that|these|those)\s+', '', text, flags=re.IGNORECASE).strip()
        
        # Filter low-value or short words
        if len(cleaned_text.split()) > 5 or len(cleaned_text) < 3:
            continue
        if cleaned_text.lower() in STOP_WORDS:
            continue
            
        norm_key = cleaned_text.lower()
        if norm_key in seen:
            continue
        seen.add(norm_key)
        
        chunks.append({
            "text": cleaned_text,
            "root_dep": chunk.root.dep_,
            "root_head": chunk.root.head.text,
            "category": "noun_chunk"
        })
        
    return chunks

def extract_named_entities(doc) -> List[Dict[str, Any]]:
    """Extract named entities using spaCy NER."""
    entities = []
    seen = set()
    
    for ent in doc.ents:
        text = ent.text.strip()
        cleaned_text = re.sub(r'^(the|a|an)\s+', '', text, flags=re.IGNORECASE).strip()
        
        if len(cleaned_text) < 2 or cleaned_text.lower() in STOP_WORDS:
            continue
            
        norm_key = cleaned_text.lower()
        if norm_key in seen:
            continue
        seen.add(norm_key)
        
        entities.append({
            "text": cleaned_text,
            "label": ent.label_, # PERSON, ORG, GPE, DATE, CARDINAL, PRODUCT, WORK_OF_ART, etc.
            "category": "named_entity"
        })
        
    return entities

def extract_tfidf_keyphrases(text: str, top_n: int = 30) -> List[Dict[str, Any]]:
    """Extract top TF-IDF n-grams (1 to 3 words) from educational text."""
    try:
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            stop_words='english',
            min_df=1,
            max_features=200
        )
        tfidf_mat = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        scores = tfidf_mat.toarray()[0]
        
        ranked_indices = scores.argsort()[::-1][:top_n]
        keyphrases = []
        for idx in ranked_indices:
            term = feature_names[idx]
            # Avoid purely numeric or single char tokens
            if len(term) > 2 and not term.isdigit():
                keyphrases.append({
                    "text": term,
                    "score": round(float(scores[idx]), 4),
                    "category": "tfidf_keyphrase"
                })
        return keyphrases
    except Exception:
        return []

def extract_document_concepts(text: str) -> Dict[str, Any]:
    """
    Extract a comprehensive vocabulary of key concepts, entities, and technical phrases
    from the text for question generation and distractor pooling.
    """
    doc = get_spacy_doc(text)
    
    noun_chunks = extract_noun_chunks(doc)
    named_entities = extract_named_entities(doc)
    tfidf_phrases = extract_tfidf_keyphrases(text, top_n=35)
    
    # Extract uppercase acronyms and proper names
    acronyms = []
    seen_acronyms = set()
    for m in TECHNICAL_TERMS_RE.finditer(text):
        val = m.group(0).strip()
        if len(val) >= 2 and val.isupper() and val not in seen_acronyms:
            seen_acronyms.add(val)
            acronyms.append({"text": val, "category": "acronym"})
            
    # Combine into a unified pool with frequencies
    all_terms = []
    term_counts = Counter()
    
    # Collect all candidate texts
    candidates = []
    for item in named_entities:
        candidates.append((item["text"], item.get("label", "ENTITY")))
    for item in noun_chunks:
        candidates.append((item["text"], "CONCEPT"))
    for item in acronyms:
        candidates.append((item["text"], "ACRONYM"))
        
    for text_val, cat in candidates:
        term_counts[text_val.lower()] += 1
        all_terms.append({
            "term": text_val,
            "normalized": text_val.lower(),
            "category": cat
        })
        
    return {
        "noun_chunks": noun_chunks,
        "named_entities": named_entities,
        "tfidf_phrases": tfidf_phrases,
        "acronyms": acronyms,
        "all_terms": all_terms,
        "term_counts": dict(term_counts)
    }

def extract_sentence_keywords(sentence: str, doc_concepts: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract candidate keywords that appear specifically inside a given sentence."""
    doc = get_spacy_doc(sentence)
    candidates = []
    seen = set()
    
    # 1. Check for named entities
    for ent in doc.ents:
        clean = re.sub(r'^(the|a|an)\s+', '', ent.text, flags=re.IGNORECASE).strip()
        if len(clean) >= 2 and clean.lower() not in STOP_WORDS and clean.lower() not in seen:
            seen.add(clean.lower())
            candidates.append({
                "keyword": clean,
                "type": ent.label_,
                "start_char": ent.start_char,
                "end_char": ent.end_char,
                "importance": 1.5
            })
            
    # 2. Check for noun chunks
    for chunk in doc.noun_chunks:
        clean = re.sub(r'^(the|a|an|this|that|these|those)\s+', '', chunk.text, flags=re.IGNORECASE).strip()
        if len(clean) >= 3 and clean.lower() not in STOP_WORDS and clean.lower() not in seen:
            # Prefer subjects or direct objects
            imp = 1.2 if chunk.root.dep_ in ("nsubj", "nsubjpass", "dobj", "pobj", "attr") else 0.9
            seen.add(clean.lower())
            candidates.append({
                "keyword": clean,
                "type": "CONCEPT",
                "start_char": chunk.start_char,
                "end_char": chunk.end_char,
                "importance": imp
            })
            
    # 3. Check for acronyms in sentence
    for match in TECHNICAL_TERMS_RE.finditer(sentence):
        term = match.group(0).strip()
        if term.isupper() and len(term) >= 2 and term.lower() not in seen:
            seen.add(term.lower())
            candidates.append({
                "keyword": term,
                "type": "ACRONYM",
                "start_char": match.start(),
                "end_char": match.end(),
                "importance": 1.4
            })
            
    # Sort candidates by importance and length (longer specific phrases preferred over single generic words)
    candidates.sort(key=lambda x: (x["importance"], len(x["keyword"])), reverse=True)
    return candidates
