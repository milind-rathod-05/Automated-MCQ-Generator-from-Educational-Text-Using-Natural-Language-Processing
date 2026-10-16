import os
import io
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import (
    MCQGenerateRequest,
    MCQGenerateResponse,
    RegenerateSingleRequest,
    QuestionModel,
    QuizSaveRequest,
    QuizItemResponse,
    QuizSubmissionRequest,
    QuizSubmissionResult,
    DashboardStatsResponse
)
from .database import (
    init_db,
    save_document,
    save_quiz,
    get_all_quizzes,
    get_quiz_by_id,
    delete_quiz,
    save_quiz_result,
    get_all_results,
    get_result_by_id,
    get_dashboard_analytics
)
from .nlp import generate_mcqs_pipeline, validate_question
from .utils import parse_pdf_bytes, parse_txt_bytes, SAMPLE_TEXTS

app = FastAPI(
    title="Automated MCQ Generator API",
    description="Backend NLP engine for generating Multiple Choice Questions from educational text",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Automated MCQ Generator NLP API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/samples")
def get_sample_texts():
    """Retrieve available educational sample topics and passages."""
    return {"samples": SAMPLE_TEXTS}

@app.post("/api/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject: Optional[str] = Form("General"),
    topic: Optional[str] = Form("General")
):
    """
    Extract and preprocess text from uploaded PDF or TXT files.
    Validates file formats and content length.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was selected.")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a .pdf or .txt file."
        )
        
    try:
        content_bytes = await file.read()
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail=f"The uploaded file '{file.filename}' is empty (0 bytes).")
            
        if ext == ".pdf":
            extracted_text, metadata = parse_pdf_bytes(content_bytes, filename=file.filename)
        else:
            extracted_text, metadata = parse_txt_bytes(content_bytes, filename=file.filename)
            
        doc_title = title if title and title.strip() else os.path.splitext(file.filename)[0].replace('_', ' ').replace('-', ' ').title()
        doc_id = save_document(
            title=doc_title,
            content=extracted_text,
            subject=subject or "General",
            topic=topic or "General",
            filename=file.filename
        )
        
        return {
            "success": True,
            "document_id": doc_id,
            "title": doc_title,
            "subject": subject,
            "topic": topic,
            "extracted_text": extracted_text,
            "metadata": metadata
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/api/generate-mcqs", response_model=MCQGenerateResponse)
def generate_mcqs(request: MCQGenerateRequest):
    """
    Generate multiple choice questions from input text using the NLP pipeline.
    """
    text = request.text.strip() if request.text else ""
    if not text:
        raise HTTPException(status_code=400, detail="Educational text content cannot be empty.")
        
    word_count = len(text.split())
    if word_count < 20:
        raise HTTPException(
            status_code=422,
            detail=f"Text contains only {word_count} words. Please provide at least 25 words of educational material to generate meaningful questions."
        )
        
    try:
        questions_raw, warnings, metadata = generate_mcqs_pipeline(
            text=text,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            num_options=request.num_options
        )
        
        # Save document automatically if text is long enough
        doc_id = save_document(
            title=request.title or "Generated Document",
            content=text,
            subject=request.subject or "General",
            topic=request.topic or "General"
        )
        metadata["document_id"] = doc_id
        
        questions_models = [QuestionModel(**q) for q in questions_raw]
        
        return MCQGenerateResponse(
            success=True,
            title=request.title or "Educational Quiz",
            subject=request.subject or "Computer Science",
            topic=request.topic or "General",
            difficulty=request.difficulty,
            total_generated=len(questions_models),
            requested_count=request.num_questions,
            questions=questions_models,
            warnings=warnings,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP Generation failure: {str(e)}")

@app.post("/api/regenerate-question")
def regenerate_question(request: RegenerateSingleRequest):
    """
    Regenerate a single question from context while excluding existing questions.
    """
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Context text is empty.")
        
    try:
        # Request a batch of 5 questions to find a distinct candidate
        questions_raw, _, _ = generate_mcqs_pipeline(
            text=text,
            num_questions=5,
            difficulty=request.difficulty,
            num_options=request.num_options
        )
        
        existing_set = set(q.strip().lower() for q in request.existing_questions)
        candidate = None
        for q in questions_raw:
            if q["question"].strip().lower() not in existing_set:
                candidate = q
                break
                
        if not candidate and questions_raw:
            candidate = questions_raw[0]
            
        if not candidate:
            raise HTTPException(status_code=422, detail="Unable to extract a distinct new question from this context.")
            
        candidate["question_number"] = request.question_number
        return {"success": True, "question": candidate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quizzes")
def list_quizzes():
    """Retrieve all saved quizzes."""
    try:
        return {"quizzes": get_all_quizzes()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quizzes")
def create_quiz(request: QuizSaveRequest):
    """Save a generated quiz into SQLite."""
    if not request.questions:
        raise HTTPException(status_code=400, detail="Cannot save an empty quiz with 0 questions.")
        
    try:
        q_dicts = [q.dict() for q in request.questions]
        quiz_id = save_quiz(
            title=request.title,
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            questions=q_dicts
        )
        return {"success": True, "quiz_id": quiz_id, "message": f"Quiz '{request.title}' saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quizzes/{quiz_id}")
def get_quiz(quiz_id: int):
    """Get a saved quiz with all questions by ID."""
    quiz = get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail=f"Quiz with ID {quiz_id} not found.")
    return {"quiz": quiz}

@app.delete("/api/quizzes/{quiz_id}")
def remove_quiz(quiz_id: int):
    """Delete a saved quiz."""
    deleted = delete_quiz(quiz_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Quiz with ID {quiz_id} not found.")
    return {"success": True, "message": "Quiz deleted successfully."}

@app.post("/api/quiz-results", response_model=QuizSubmissionResult)
def submit_quiz_answers(submission: QuizSubmissionRequest):
    """
    Score submitted quiz answers, compute metrics, and persist result in SQLite.
    """
    total = len(submission.questions)
    if total == 0:
        raise HTTPException(status_code=400, detail="Cannot submit quiz with 0 questions.")
        
    correct_count = 0
    review_details = []
    
    for q in submission.questions:
        selected = submission.answers.get(q.id)
        is_correct = (selected is not None) and (selected.strip().lower() == q.correct_answer.strip().lower())
        
        if is_correct:
            correct_count += 1
            
        review_details.append({
            "question_id": q.id,
            "question_number": q.question_number,
            "question": q.question,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "selected_answer": selected,
            "is_correct": is_correct,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "source_sentence": q.source_sentence
        })
        
    percentage = round((correct_count / total * 100), 1)
    
    result_id = save_quiz_result(
        quiz_id=submission.quiz_id,
        quiz_title=submission.quiz_title,
        score=correct_count,
        total_questions=total,
        time_taken_seconds=submission.time_taken_seconds or 0,
        review_details=review_details
    )
    
    return QuizSubmissionResult(
        id=result_id,
        quiz_id=submission.quiz_id,
        quiz_title=submission.quiz_title,
        score=correct_count,
        total_questions=total,
        percentage=percentage,
        time_taken_seconds=submission.time_taken_seconds or 0,
        completed_at="",
        review_details=review_details
    )

@app.get("/api/quiz-results")
def list_results(limit: int = 50):
    """Get history of attempted quizzes."""
    try:
        return {"results": get_all_results(limit=limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quiz-results/{result_id}")
def get_single_result(result_id: int):
    """Get full review breakdown of a specific quiz attempt."""
    res = get_result_by_id(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found.")
    return {"result": res}

@app.get("/api/dashboard-stats", response_model=DashboardStatsResponse)
def get_stats():
    """Retrieve aggregate dashboard statistics for documents, MCQs, and quiz performance."""
    try:
        analytics = get_dashboard_analytics()
        return DashboardStatsResponse(**analytics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
