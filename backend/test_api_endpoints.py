import os
import sys
import json
import pymupdf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

def run_tests():
    print("=====================================================")
    print(" STARTING FULL-STACK API & NLP INTEGRATION TESTS")
    print("=====================================================")
    
    # 1. Root & Health Check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] 1. Root API Endpoint OK:", res.json()["service"])

    # 2. Sample Texts
    res = client.get("/api/samples")
    assert res.status_code == 200
    samples = res.json()["samples"]
    assert "Artificial Intelligence" in samples
    assert "Machine Learning" in samples
    print("[PASS] 2. Educational Sample Texts Endpoint OK (Loaded topics:", list(samples.keys()), ")")

    # 3. PDF Upload Endpoint Test
    # Generate a temporary valid educational PDF in memory using pymupdf
    pdf_doc = pymupdf.open()
    page = pdf_doc.new_page()
    edu_content = """Computer Networks and Routing Protocols:
A router is a networking device that forwards data packets between computer networks. Routers perform traffic directing functions on the Internet. The Open Shortest Path First (OSPF) protocol is a link-state routing protocol used to find the best path between source and destination routers using Dijkstra's algorithm. In contrast, the Routing Information Protocol (RIP) is a distance-vector protocol that uses hop count as a routing metric. Maximum hop count for RIP is 15, preventing infinite routing loops. Border Gateway Protocol (BGP) is an exterior gateway protocol designed to exchange routing information among autonomous systems across the global Internet."""
    page.insert_textbox(pymupdf.Rect(50, 50, 550, 750), edu_content)
    pdf_bytes = pdf_doc.tobytes()
    pdf_doc.close()

    res = client.post(
        "/api/upload-document",
        files={"file": ("networks.pdf", pdf_bytes, "application/pdf")},
        data={"title": "Routing Protocols", "subject": "Computer Networks", "topic": "OSPF and BGP"}
    )
    assert res.status_code == 200, f"PDF upload failed: {res.text}"
    upload_data = res.json()
    assert upload_data["success"] is True
    assert upload_data["metadata"]["word_count"] > 30
    print("[PASS] 3. PDF Document Extraction Endpoint OK (Extracted words:", upload_data["metadata"]["word_count"], ")")

    # 4. MCQ Generation via NLP
    gen_payload = {
        "text": upload_data["extracted_text"],
        "title": "Computer Networks Quiz",
        "subject": "Computer Networks",
        "topic": "Routing Protocols",
        "num_questions": 4,
        "difficulty": "medium",
        "num_options": 4
    }
    res = client.post("/api/generate-mcqs", json=gen_payload)
    assert res.status_code == 200, f"Generate MCQs failed: {res.text}"
    mcq_data = res.json()
    assert mcq_data["success"] is True
    assert len(mcq_data["questions"]) >= 3
    print(f"[PASS] 4. NLP MCQ Generation Endpoint OK ({len(mcq_data['questions'])} MCQs produced)")
    for q in mcq_data["questions"]:
        print(f"       - Q{q['question_number']} ({q['question_type']}): {q['question'][:75]}...")

    # 5. Save Quiz to Database
    save_payload = {
        "title": mcq_data["title"],
        "subject": mcq_data["subject"],
        "topic": mcq_data["topic"],
        "difficulty": mcq_data["difficulty"],
        "source_text": upload_data["extracted_text"],
        "questions": mcq_data["questions"]
    }
    res = client.post("/api/quizzes", json=save_payload)
    assert res.status_code == 200
    quiz_id = res.json()["quiz_id"]
    print(f"[PASS] 5. Save Quiz to SQLite OK (Assigned Quiz ID: {quiz_id})")

    # 6. Retrieve Saved Quizzes
    res = client.get("/api/quizzes")
    assert res.status_code == 200
    quizzes_list = res.json()["quizzes"]
    assert any(q["id"] == quiz_id for q in quizzes_list)
    print(f"[PASS] 6. Retrieve Saved Quizzes OK (Total saved quizzes in DB: {len(quizzes_list)})")

    # 7. Retrieve Quiz by ID
    res = client.get(f"/api/quizzes/{quiz_id}")
    assert res.status_code == 200
    retrieved_quiz = res.json()["quiz"]
    assert len(retrieved_quiz["questions"]) == len(mcq_data["questions"])
    print(f"[PASS] 7. Retrieve Quiz by ID OK (Retrieved {len(retrieved_quiz['questions'])} questions)")

    # 8. Submit Quiz Answers and Test Scoring
    # Simulate user answering: answer 2 correctly, 1 incorrectly
    test_questions = mcq_data["questions"]
    simulated_answers = {}
    for idx, q in enumerate(test_questions):
        if idx % 2 == 0:
            simulated_answers[q["id"]] = q["correct_answer"]
        else:
            # Pick a distractor
            distractor = [opt for opt in q["options"] if opt != q["correct_answer"]][0]
            simulated_answers[q["id"]] = distractor

    submit_payload = {
        "quiz_id": quiz_id,
        "quiz_title": mcq_data["title"],
        "answers": simulated_answers,
        "questions": test_questions,
        "time_taken_seconds": 45
    }
    res = client.post("/api/quiz-results", json=submit_payload)
    assert res.status_code == 200
    result_data = res.json()
    assert result_data["total_questions"] == len(test_questions)
    assert result_data["score"] > 0
    print(f"[PASS] 8. Submit Quiz & Scoring OK (Score: {result_data['score']}/{result_data['total_questions']}, {result_data['percentage']}%)")

    # 9. Dashboard Stats
    res = client.get("/api/dashboard-stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_documents"] >= 1
    assert stats["total_mcqs"] >= 1
    assert stats["total_quizzes_attempted"] >= 1
    print(f"[PASS] 9. Dashboard Analytics OK (Docs: {stats['total_documents']}, MCQs: {stats['total_mcqs']}, Attempts: {stats['total_quizzes_attempted']}, Avg Score: {stats['average_score']}%)")

    # 10. Regenerate Question
    regen_payload = {
        "text": upload_data["extracted_text"],
        "existing_questions": [test_questions[0]["question"]],
        "difficulty": "medium",
        "num_options": 4,
        "question_number": 1
    }
    res = client.post("/api/regenerate-question", json=regen_payload)
    assert res.status_code == 200
    assert res.json()["success"] is True
    print("[PASS] 10. Regenerate Single Question OK (New Q:", res.json()["question"]["question"][:75], ")")

    print("\n=====================================================")
    print(" ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=====================================================")

if __name__ == "__main__":
    run_tests()
