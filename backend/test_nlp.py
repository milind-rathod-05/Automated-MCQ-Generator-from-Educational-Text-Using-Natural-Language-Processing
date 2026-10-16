import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db
from app.nlp import generate_mcqs_pipeline
from app.utils.sample_texts import SAMPLE_TEXTS

def test():
    init_db()
    text = SAMPLE_TEXTS["Machine Learning"]["text"]
    print("Testing NLP Pipeline on Machine Learning text...")
    questions, warnings, meta = generate_mcqs_pipeline(text, num_questions=4, difficulty="medium", num_options=4)
    print(f"Total questions generated: {len(questions)}")
    print(f"Metadata: {meta}")
    print(f"Warnings: {warnings}\n")
    
    assert len(questions) > 0, "No questions were generated!"
    
    for q in questions:
        print(f"Q{q['question_number']} [{q['difficulty'].upper()} - {q['question_type']}]: {q['question']}")
        for i, opt in enumerate(q['options']):
            tag = " [CORRECT]" if i == q['correct_index'] else ""
            print(f"  {chr(65+i)}. {opt}{tag}")
        print(f"  Source: {q['source_sentence']}")
        print(f"  Explanation: {q['explanation']}\n")

    # Verify options integrity
    for q in questions:
        assert len(q['options']) == 4
        assert len(set(q['options'])) == 4, "Duplicate options found!"
        assert q['options'][q['correct_index']] == q['correct_answer'], "Correct answer mismatch!"
        assert q['correct_answer'] in q['options'], "Correct answer not in options!"

    print("ALL NLP PIPELINE ASSERTIONS PASSED!")

if __name__ == "__main__":
    test()
