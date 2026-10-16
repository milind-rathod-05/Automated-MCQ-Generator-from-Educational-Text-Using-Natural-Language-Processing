import re
from typing import List, Dict, Any, Tuple
from collections import Counter
from .preprocessor import clean_text, extract_sentences
from .sentence_ranker import rank_sentences
from .keyword_extractor import extract_document_concepts, extract_sentence_keywords
from .question_generator import QuestionGenerator

def is_question_duplicate(q1: str, q2: str) -> bool:
    """Check if two question texts are virtually identical based on word jaccard similarity."""
    words1 = set(re.findall(r'\b\w{3,}\b', q1.lower()))
    words2 = set(re.findall(r'\b\w{3,}\b', q2.lower()))
    
    if not words1 or not words2:
        return False
        
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    jaccard = len(intersection) / len(union)
    return jaccard > 0.75

def validate_question(q: Dict[str, Any], num_options: int = 4) -> Tuple[bool, str]:
    """Validate a single generated question against all quality criteria."""
    question_text = q.get("question", "").strip()
    options = q.get("options", [])
    correct_answer = q.get("correct_answer", "").strip()
    explanation = q.get("explanation", "").strip()
    
    # 1. Question text checks
    if len(question_text) < 15 or len(question_text.split()) < 4:
        return False, "Question text too short or incomplete"
        
    # 2. Options checks
    if len(options) != num_options:
        return False, f"Expected {num_options} options, found {len(options)}"
        
    # Check for empty options
    if any(len(str(opt).strip()) == 0 for opt in options):
        return False, "Empty option detected"
        
    # Check for duplicate options (case-insensitive)
    opt_lowers = [str(opt).strip().lower() for opt in options]
    if len(set(opt_lowers)) != len(opt_lowers):
        return False, "Duplicate options detected"
        
    # 3. Correct answer validation
    if correct_answer not in options:
        # Check case-insensitive match
        matched = False
        for idx, opt in enumerate(options):
            if opt.lower() == correct_answer.lower():
                q["options"][idx] = correct_answer
                q["correct_index"] = idx
                matched = True
                break
        if not matched:
            return False, "Correct answer not found in options list"
            
    # 4. Verify correct_index alignment
    if options[q.get("correct_index", -1)] != correct_answer:
        q["correct_index"] = options.index(correct_answer)
        
    # 5. Explanation check
    if not explanation:
        q["explanation"] = f"Correct answer is {correct_answer} as stated in the source text."
        
    return True, "Valid"

def generate_mcqs_pipeline(
    text: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    num_options: int = 4
) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
    """
    Main NLP pipeline that parses, ranks, extracts, generates, validates,
    and returns multiple choice questions from educational text.
    """
    warnings = []
    cleaned_input = clean_text(text)
    
    if len(cleaned_input.split()) < 20:
        warnings.append("Input text is very brief. Provide richer educational passages for broader question variety.")
        return [], warnings, {}
        
    # Step 1 & 2: Sentence segmentation and ranking
    ranked_sents = rank_sentences(cleaned_input)
    if not ranked_sents:
        warnings.append("Could not extract suitable declarative sentences from the text.")
        return [], warnings, {}
        
    # Step 3: Extract document-level concepts and vocabulary
    doc_concepts = extract_document_concepts(cleaned_input)
    
    generator = QuestionGenerator()
    candidates: List[Dict[str, Any]] = []
    used_terms = set()
    used_sentences = set()
    
    all_raw_sentences = [s["sentence"] for s in ranked_sents]
    
    # Generate question pool across sentences
    for sent_meta in ranked_sents:
        sentence = sent_meta["sentence"]
        if sentence in used_sentences:
            continue
            
        kw_list = extract_sentence_keywords(sentence, doc_concepts)
        if not kw_list:
            continue
            
        # Determine target difficulty for this iteration
        target_diff = difficulty
        if difficulty == "all":
            # Cycle through difficulties
            diff_cycle = ["easy", "medium", "hard"]
            target_diff = diff_cycle[len(candidates) % len(diff_cycle)]
            
        generated_q = None
        
        # Strategy selection based on difficulty & sentence characteristics
        for kw in kw_list:
            term_norm = kw["keyword"].lower()
            if term_norm in used_terms:
                continue
                
            if target_diff == "easy":
                # Easy: Definitions, simple Cloze, or Entity
                if sent_meta["is_definition"]:
                    generated_q = generator.generate_definition_question(sentence, kw, doc_concepts, difficulty="easy")
                elif kw.get("type") in ("PERSON", "DATE", "ORG"):
                    generated_q = generator.generate_named_entity_question(sentence, kw, doc_concepts, difficulty="easy")
                else:
                    generated_q = generator.generate_cloze_question(sentence, kw, doc_concepts, difficulty="easy")
                    
            elif target_diff == "medium":
                # Medium: Concept & function, definition analysis, structural cloze
                if "is used to" in sentence.lower() or "responsible for" in sentence.lower() or "allows" in sentence.lower():
                    generated_q = generator.generate_concept_function_question(sentence, kw, doc_concepts, difficulty="medium")
                elif sent_meta["is_definition"]:
                    generated_q = generator.generate_definition_question(sentence, kw, doc_concepts, difficulty="medium")
                else:
                    generated_q = generator.generate_cloze_question(sentence, kw, doc_concepts, difficulty="medium")
                    
            else: # hard
                # Hard: Statement verification, complex concept mechanism
                if len(all_raw_sentences) >= 4 and len(candidates) % 2 == 0:
                    other_sents = [s for s in all_raw_sentences if s != sentence]
                    generated_q = generator.generate_statement_verification_question(sentence, other_sents, doc_concepts, difficulty="hard")
                else:
                    generated_q = generator.generate_concept_function_question(sentence, kw, doc_concepts, difficulty="hard")
                    
            if generated_q:
                # Validate candidate
                valid, msg = validate_question(generated_q, num_options=num_options)
                if valid:
                    # Duplicate question text check against already chosen candidates
                    duplicate = False
                    for existing in candidates:
                        if is_question_duplicate(generated_q["question"], existing["question"]):
                            duplicate = True
                            break
                            
                    if not duplicate:
                        candidates.append(generated_q)
                        used_terms.add(term_norm)
                        used_sentences.add(sentence)
                        break
                        
        if len(candidates) >= num_questions * 2: # Gather surplus pool for optimal selection
            break
            
    # If still short of num_questions, run a secondary pass with cloze on remaining sentences
    if len(candidates) < num_questions:
        for sent_meta in ranked_sents:
            sentence = sent_meta["sentence"]
            if sentence in used_sentences:
                continue
            kw_list = extract_sentence_keywords(sentence, doc_concepts)
            for kw in kw_list:
                generated_q = generator.generate_cloze_question(sentence, kw, doc_concepts, difficulty=difficulty if difficulty != "all" else "medium")
                if generated_q:
                    valid, _ = validate_question(generated_q, num_options=num_options)
                    if valid:
                        candidates.append(generated_q)
                        used_sentences.add(sentence)
                        break
            if len(candidates) >= num_questions:
                break
                
    # Final selection up to requested count
    final_questions = candidates[:num_questions]
    
    # Assign sequential question numbers
    for idx, q in enumerate(final_questions, start=1):
        q["question_number"] = idx
        
    if len(final_questions) < num_questions:
        warnings.append(
            f"The provided text contains enough distinct factual information to generate {len(final_questions)} "
            f"verified questions (requested {num_questions}). Additional questions were not generated to prevent repetition or low-quality distractors."
        )
        
    metadata = {
        "sentences_analyzed": len(ranked_sents),
        "concepts_extracted": len(doc_concepts.get("all_terms", [])),
        "target_difficulty": difficulty,
        "available_pool_size": len(candidates)
    }
    
    return final_questions, warnings, metadata
