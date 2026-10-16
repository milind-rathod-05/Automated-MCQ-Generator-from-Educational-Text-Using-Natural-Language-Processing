import sqlite3
import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mcq_generator.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT,
        topic TEXT,
        filename TEXT,
        content TEXT NOT NULL,
        char_count INTEGER,
        word_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Quizzes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER,
        title TEXT NOT NULL,
        subject TEXT,
        topic TEXT,
        difficulty TEXT,
        question_count INTEGER,
        questions_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE SET NULL
    )
    """)

    # Saved Questions individual table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER,
        question_number INTEGER,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        difficulty TEXT,
        source_sentence TEXT,
        question_type TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
    """)

    # Quiz results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER,
        quiz_title TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage REAL NOT NULL,
        time_taken_seconds INTEGER DEFAULT 0,
        review_details_json TEXT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

# Database Helper Functions

def save_document(title: str, content: str, subject: str = "", topic: str = "", filename: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    words = len(content.split())
    chars = len(content)
    cursor.execute("""
        INSERT INTO documents (title, subject, topic, filename, content, char_count, word_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (title, subject, topic, filename, content, chars, words))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id

def save_quiz(title: str, subject: str, topic: str, difficulty: str, questions: List[Dict[str, Any]], document_id: Optional[int] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    questions_json = json.dumps(questions)
    cursor.execute("""
        INSERT INTO quizzes (document_id, title, subject, topic, difficulty, question_count, questions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (document_id, title, subject, topic, difficulty, len(questions), questions_json))
    quiz_id = cursor.lastrowid

    for idx, q in enumerate(questions, start=1):
        opts_json = json.dumps(q.get("options", []))
        cursor.execute("""
            INSERT INTO questions (quiz_id, question_number, question_text, options_json, correct_answer, explanation, difficulty, source_sentence, question_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            quiz_id,
            q.get("question_number", idx),
            q.get("question", ""),
            opts_json,
            q.get("correct_answer", ""),
            q.get("explanation", ""),
            q.get("difficulty", difficulty),
            q.get("source_sentence", ""),
            q.get("question_type", "concept")
        ))

    conn.commit()
    conn.close()
    return quiz_id

def get_all_quizzes() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, document_id, title, subject, topic, difficulty, question_count, created_at
        FROM quizzes
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    quizzes = [dict(row) for row in rows]
    conn.close()
    return quizzes

def get_quiz_by_id(quiz_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    quiz = dict(row)
    quiz["questions"] = json.loads(quiz["questions_json"])
    del quiz["questions_json"]
    conn.close()
    return quiz

def delete_quiz(quiz_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE quiz_id = ?", (quiz_id,))
    cursor.execute("DELETE FROM quizzes WHERE id = ?", (quiz_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def save_quiz_result(quiz_id: Optional[int], quiz_title: str, score: int, total_questions: int, time_taken_seconds: int, review_details: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    percentage = round((score / total_questions * 100) if total_questions > 0 else 0, 1)
    details_json = json.dumps(review_details)
    cursor.execute("""
        INSERT INTO quiz_results (quiz_id, quiz_title, score, total_questions, percentage, time_taken_seconds, review_details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (quiz_id, quiz_title, score, total_questions, percentage, time_taken_seconds, details_json))
    result_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return result_id

def get_all_results(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, quiz_id, quiz_title, score, total_questions, percentage, time_taken_seconds, completed_at
        FROM quiz_results
        ORDER BY completed_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def get_result_by_id(result_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quiz_results WHERE id = ?", (result_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    res = dict(row)
    res["review_details"] = json.loads(res["review_details_json"])
    del res["review_details_json"]
    conn.close()
    return res

def get_dashboard_analytics() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM documents")
    total_docs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM questions")
    total_mcqs = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM quiz_results")
    total_attempts = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(percentage) FROM quiz_results")
    avg_score_raw = cursor.fetchone()[0]
    avg_score = round(avg_score_raw, 1) if avg_score_raw is not None else 0.0

    cursor.execute("""
        SELECT id, title, subject, topic, difficulty, question_count, created_at
        FROM quizzes
        ORDER BY created_at DESC
        LIMIT 5
    """)
    recent_quizzes = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT id, quiz_title, score, total_questions, percentage, completed_at
        FROM quiz_results
        ORDER BY completed_at DESC
        LIMIT 5
    """)
    recent_results = [dict(r) for r in cursor.fetchall()]

    # Difficulty distribution
    cursor.execute("""
        SELECT LOWER(difficulty) as diff, COUNT(*) as cnt
        FROM questions
        GROUP BY LOWER(difficulty)
    """)
    diff_rows = cursor.fetchall()
    diff_map = {"easy": 0, "medium": 0, "hard": 0}
    for row in diff_rows:
        if row["diff"] in diff_map:
            diff_map[row["diff"]] = row["cnt"]

    # Score trend (last 10 attempts in chronological order)
    cursor.execute("""
        SELECT id, quiz_title, percentage, completed_at
        FROM quiz_results
        ORDER BY id DESC
        LIMIT 10
    """)
    score_rows = cursor.fetchall()
    score_trend = [
        {"attempt": i + 1, "quiz_title": r["quiz_title"], "percentage": r["percentage"], "date": r["completed_at"]}
        for i, r in enumerate(reversed(score_rows))
    ]

    conn.close()
    return {
        "total_documents": total_docs,
        "total_mcqs": total_mcqs,
        "total_quizzes_attempted": total_attempts,
        "average_score": avg_score,
        "recent_quizzes": recent_quizzes,
        "recent_results": recent_results,
        "difficulty_distribution": diff_map,
        "score_trend": score_trend
    }
