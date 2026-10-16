import re
import uuid
from typing import List, Dict, Any, Optional, Tuple
from .sentence_ranker import rank_sentences
from .keyword_extractor import (
    extract_document_concepts,
    extract_sentence_keywords
)
from .distractor_gen import generate_distractors, assemble_options

def clean_sentence_end(sent: str) -> str:
    """Ensure sentence ends with period and strip extra punctuation."""
    s = sent.strip()
    if s and not s.endswith(('.', '!', '?')):
        s += '.'
    return s

def capitalize_first(text: str) -> str:
    if not text:
        return text
    return text[0].upper() + text[1:]

class QuestionGenerator:
    def __init__(self):
        pass

    def generate_definition_question(
        self,
        sentence: str,
        keyword_info: Dict[str, Any],
        doc_concepts: Dict[str, Any],
        difficulty: str = "easy"
    ) -> Optional[Dict[str, Any]]:
        """Strategy 1: Definition-based question generation."""
        # Check if the sentence starts with the defined concept: "{Subject} is/are ..."
        subj_match = re.match(
            r'^([A-Z][a-zA-Z0-9\s\(\)\-\*/]{2,50}?)\s+(?:is|are|refers to|is defined as|is called)\s+(?:\b(?:an|a|the)\b)?\s*([^,;.]+)',
            sentence
        )
        
        if subj_match and len(subj_match.group(1).split()) <= 6:
            target_term = subj_match.group(1).strip()
            definition_clause = subj_match.group(2).strip()
        else:
            target_term = keyword_info["keyword"]
            match = re.search(
                rf'\b{re.escape(target_term)}\b\s+(?:is|are|refers to|is defined as|is called)\s+(?:\b(?:an|a|the)\b)?\s*([^,;.]+)',
                sentence,
                re.IGNORECASE
            )
            definition_clause = match.group(1).strip() if match else sentence

        # Strip any leading articles
        target_term = re.sub(r'^(the|a|an)\s+', '', target_term, flags=re.IGNORECASE).strip()

        if len(definition_clause.split()) < 3 or len(target_term) < 2:
            return None
            
        if difficulty == "easy":
            question_text = f"Which term is defined as: \"{capitalize_first(definition_clause)}\"?"
        elif difficulty == "medium":
            question_text = f"Which concept or model matches the description: \"{capitalize_first(definition_clause)}\"?"
        else:
            question_text = f"According to the educational text, which of the following best represents the concept of {target_term}?"

        distractors = generate_distractors(target_term, doc_concepts, num_distractors=3)
        if len(distractors) < 3:
            return None
            
        options, correct_idx = assemble_options(target_term, distractors)
        
        return {
            "id": str(uuid.uuid4())[:8],
            "question": question_text,
            "options": options,
            "correct_answer": target_term,
            "correct_index": correct_idx,
            "explanation": f"Based on the source text: \"{sentence}\"",
            "difficulty": difficulty,
            "source_sentence": sentence,
            "question_type": "definition",
            "key_term": target_term
        }

    def generate_concept_function_question(
        self,
        sentence: str,
        keyword_info: Dict[str, Any],
        doc_concepts: Dict[str, Any],
        difficulty: str = "medium"
    ) -> Optional[Dict[str, Any]]:
        """Strategy 2: Functional and mechanism-oriented questions."""
        target_term = re.sub(r'^(the|a|an)\s+', '', keyword_info["keyword"].strip(), flags=re.IGNORECASE).strip()
        if len(target_term) < 2:
            return None
        
        # Match functional phrases like "is used to...", "responsible for...", "allows...", "minimizes..."
        func_patterns = [
            (r'\b(?:is|are)\s+used\s+(?:to|for)\s+([^,;.]+)', "Which technique or mechanism is used to {}?"),
            (r'\b(?:is|are)\s+responsible\s+for\s+([^,;.]+)', "Which component or protocol is responsible for {}?"),
            (r'\b(?:allows|enables|helps)\s+(?:to\s+)?([^,;.]+)', "Which method enables {}?"),
            (r'\b(?:minimizes|maximizes|optimizes|computes)\s+([^,;.]+)', "Which algorithm or process {}?")
        ]
        
        question_text = None
        for pattern, q_tmpl in func_patterns:
            m = re.search(pattern, sentence, re.IGNORECASE)
            if m:
                action_phrase = m.group(1).strip()
                if len(action_phrase.split()) >= 3 and target_term.lower() not in action_phrase.lower():
                    question_text = q_tmpl.format(action_phrase)
                    break
                    
        if not question_text:
            # Fallback to general functional question
            question_text = f"Which of the following is associated with the function described in: \"{sentence.strip()}\"?"

        distractors = generate_distractors(target_term, doc_concepts, num_distractors=3)
        if len(distractors) < 3:
            return None
            
        options, correct_idx = assemble_options(target_term, distractors)
        
        return {
            "id": str(uuid.uuid4())[:8],
            "question": question_text,
            "options": options,
            "correct_answer": target_term,
            "correct_index": correct_idx,
            "explanation": f"According to the source passage: \"{sentence}\"",
            "difficulty": difficulty,
            "source_sentence": sentence,
            "question_type": "concept",
            "key_term": target_term
        }

    def generate_cloze_question(
        self,
        sentence: str,
        keyword_info: Dict[str, Any],
        doc_concepts: Dict[str, Any],
        difficulty: str = "easy"
    ) -> Optional[Dict[str, Any]]:
        """Strategy 3: Cloze / Fill-in-the-blank question transformed to MCQ."""
        raw_target = keyword_info["keyword"].strip()
        target_term = re.sub(r'^(the|a|an)\s+', '', raw_target, flags=re.IGNORECASE).strip()
        if len(target_term) < 2 or len(target_term.split()) > 5:
            return None
        
        # Safely replace target term with blank '________'
        pattern = re.compile(rf'\b{re.escape(target_term)}\b', re.IGNORECASE)
        if not pattern.search(sentence):
            pattern = re.compile(rf'\b{re.escape(raw_target)}\b', re.IGNORECASE)
            if not pattern.search(sentence):
                return None
            
        cloze_sentence = pattern.sub("________", sentence, count=1).strip()
        cloze_sentence = clean_sentence_end(cloze_sentence)
        
        prefix = "Complete the statement: " if difficulty == "easy" else "Identify the term that correctly fills the blank: "
        question_text = f"{prefix}\"{cloze_sentence}\""
        
        distractors = generate_distractors(target_term, doc_concepts, num_distractors=3)
        if len(distractors) < 3:
            return None
            
        options, correct_idx = assemble_options(target_term, distractors)
        
        return {
            "id": str(uuid.uuid4())[:8],
            "question": question_text,
            "options": options,
            "correct_answer": target_term,
            "correct_index": correct_idx,
            "explanation": f"Source passage: \"{sentence}\"",
            "difficulty": difficulty,
            "source_sentence": sentence,
            "question_type": "cloze",
            "key_term": target_term
        }

    def generate_named_entity_question(
        self,
        sentence: str,
        keyword_info: Dict[str, Any],
        doc_concepts: Dict[str, Any],
        difficulty: str = "easy"
    ) -> Optional[Dict[str, Any]]:
        """Strategy 4: Named-entity specific questions (Person, Date, Org, Cardinal)."""
        target_term = keyword_info["keyword"]
        ent_type = keyword_info.get("type", "CONCEPT")
        
        if ent_type == "PERSON":
            question_text = f"Who is referred to in the following context: \"{sentence}\"?"
        elif ent_type in ("DATE", "TIME"):
            question_text = f"When did the following occur or apply: \"{sentence}\"?"
        elif ent_type == "ORG":
            question_text = f"Which organization or institution is mentioned in: \"{sentence}\"?"
        elif ent_type in ("CARDINAL", "QUANTITY"):
            question_text = f"What quantity or value is specified in the statement: \"{sentence}\"?"
        else:
            return None
            
        distractors = generate_distractors(target_term, doc_concepts, num_distractors=3)
        if len(distractors) < 3:
            return None
            
        options, correct_idx = assemble_options(target_term, distractors)
        
        return {
            "id": str(uuid.uuid4())[:8],
            "question": question_text,
            "options": options,
            "correct_answer": target_term,
            "correct_index": correct_idx,
            "explanation": f"Source reference: \"{sentence}\"",
            "difficulty": difficulty,
            "source_sentence": sentence,
            "question_type": "entity",
            "key_term": target_term
        }

    def generate_statement_verification_question(
        self,
        target_sentence: str,
        other_sentences: List[str],
        doc_concepts: Dict[str, Any],
        difficulty: str = "hard"
    ) -> Optional[Dict[str, Any]]:
        """
        Strategy 5: Hard question verifying factual statements from the text.
        Correct answer is an accurate assertion from the source text.
        Distractors are subtly modified or swapped assertions from other topics.
        """
        if len(target_sentence.split()) < 8 or len(target_sentence.split()) > 45:
            return None
            
        # Target assertion
        correct_statement = target_sentence.strip()
        
        # Distractors: pick 3 other sentences and create plausible alternative claims
        distractor_statements = []
        for s in other_sentences:
            s_clean = s.strip()
            if s_clean != correct_statement and 8 <= len(s_clean.split()) <= 45:
                distractor_statements.append(s_clean)
                if len(distractor_statements) >= 3:
                    break
                    
        if len(distractor_statements) < 3:
            return None
            
        question_text = "Based on the educational text, which of the following statements is strictly correct?"
        
        options, correct_idx = assemble_options(correct_statement, distractor_statements)
        
        return {
            "id": str(uuid.uuid4())[:8],
            "question": question_text,
            "options": options,
            "correct_answer": correct_statement,
            "correct_index": correct_idx,
            "explanation": f"Verified directly by the passage statement: \"{target_sentence}\"",
            "difficulty": "hard",
            "source_sentence": target_sentence,
            "question_type": "statement_verification",
            "key_term": "Educational Assertion"
        }
