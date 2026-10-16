from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class QuestionModel(BaseModel):
    id: str
    question_number: int
    question: str
    options: List[str]
    correct_answer: str
    correct_index: int
    explanation: str
    difficulty: str
    source_sentence: str
    question_type: str = "concept"
    key_term: Optional[str] = None

class MCQGenerateRequest(BaseModel):
    text: str = Field(..., description="Educational text content")
    title: Optional[str] = "Educational Quiz"
    subject: Optional[str] = "Computer Science"
    topic: Optional[str] = "General"
    num_questions: int = Field(5, ge=1, le=50)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard|all)$")
    num_options: int = Field(4, ge=2, le=5)

class RegenerateSingleRequest(BaseModel):
    text: str
    existing_questions: List[str] = []
    difficulty: str = "medium"
    num_options: int = 4
    question_number: int = 1

class MCQGenerateResponse(BaseModel):
    success: bool
    title: str
    subject: str
    topic: str
    difficulty: str
    total_generated: int
    requested_count: int
    questions: List[QuestionModel]
    warnings: List[str] = []
    metadata: Dict[str, Any] = {}

class QuizSaveRequest(BaseModel):
    title: str
    subject: str = "General"
    topic: str = "General"
    difficulty: str = "medium"
    source_text: Optional[str] = ""
    questions: List[QuestionModel]

class QuizItemResponse(BaseModel):
    id: int
    title: str
    subject: str
    topic: str
    difficulty: str
    question_count: int
    created_at: str
    questions: Optional[List[QuestionModel]] = None

class QuizSubmissionRequest(BaseModel):
    quiz_id: Optional[int] = None
    quiz_title: str
    answers: Dict[str, str] # question_id -> selected_option string
    questions: List[QuestionModel]
    time_taken_seconds: Optional[int] = 0

class QuizSubmissionResult(BaseModel):
    id: Optional[int] = None
    quiz_id: Optional[int] = None
    quiz_title: str
    score: int
    total_questions: int
    percentage: float
    time_taken_seconds: int
    completed_at: str
    review_details: List[Dict[str, Any]]

class DashboardStatsResponse(BaseModel):
    total_documents: int
    total_mcqs: int
    total_quizzes_attempted: int
    average_score: float
    recent_quizzes: List[Dict[str, Any]]
    recent_results: List[Dict[str, Any]]
    difficulty_distribution: Dict[str, int]
    score_trend: List[Dict[str, Any]]
