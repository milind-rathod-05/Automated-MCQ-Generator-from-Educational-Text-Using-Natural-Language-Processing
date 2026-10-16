import React, { useState, useEffect } from 'react';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowLeft,
  Share2,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function QuizMode({
  quizData,
  onBackToReview,
  onBackToDashboard,
  addToast
}) {
  const questions = quizData?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // question_id -> selected_option string
  const [flaggedIds, setFlaggedIds] = useState(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt) => {
    if (isSubmitted || !currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) next.delete(currentQ.id);
      else next.add(currentQ.id);
      return next;
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleJumpToQuestion = (index) => {
    setCurrentIndex(index);
  };

  const handleSubmitQuiz = async () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = questions.length;

    if (answeredCount < totalCount) {
      const unanswered = totalCount - answeredCount;
      const proceed = window.confirm(
        `You have ${unanswered} unanswered question(s). Are you sure you want to submit the quiz?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        quiz_id: quizData.id || null,
        quiz_title: quizData.title || 'Educational Quiz',
        answers: userAnswers,
        questions: questions,
        time_taken_seconds: timerSeconds
      };

      const result = await api.submitQuizResult(payload);
      setSubmissionResult(result);
      setIsSubmitted(true);

      // Trigger celebratory confetti if score >= 70%
      if (result.percentage >= 70) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      addToast({
        type: 'success',
        title: 'Quiz Completed',
        message: `You scored ${result.score}/${result.total_questions} (${result.percentage}%)!`
      });
    } catch (err) {
      console.error("Quiz submission error:", err);
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Failed to submit quiz.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setFlaggedIds(new Set());
    setTimerSeconds(0);
    setIsSubmitted(false);
    setSubmissionResult(null);
    setCurrentIndex(0);
    addToast({
      type: 'info',
      message: 'Quiz restarted with a fresh timer.'
    });
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <BookOpen size={48} className="text-slate-300 mb-3" />
          <h3 className="text-xl font-bold text-slate-800">No Quiz Active</h3>
          <p className="text-slate-500 mb-4">Generate questions first or select a saved quiz to begin.</p>
          <button onClick={onBackToDashboard} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="page-container quiz-mode-page">
      {/* Quiz Top Header */}
      <div className="quiz-header-bar">
        <div className="quiz-header-left">
          <button
            onClick={onBackToReview}
            className="btn-back-link"
            title="Return to review"
          >
            <ArrowLeft size={16} />
            <span>Review Mode</span>
          </button>
          <div>
            <h2 className="quiz-session-title">{quizData.title || 'Educational Quiz'}</h2>
            <div className="quiz-session-meta">
              <span>{quizData.subject || 'General'}</span>
              <span>&bull;</span>
              <span>{questions.length} Questions</span>
              <span>&bull;</span>
              <span className="capitalize">{quizData.difficulty || 'Medium'}</span>
            </div>
          </div>
        </div>

        <div className="quiz-header-right">
          {/* Live Timer */}
          <div className="timer-badge">
            <Clock size={16} className="text-indigo-600" />
            <span className="timer-digits">{formatTime(timerSeconds)}</span>
          </div>

          {!isSubmitted && (
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="btn-submit-quiz"
            >
              <Send size={15} />
              <span>Submit Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress-track">
        <div
          className="quiz-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {!isSubmitted ? (
        /* INTERACTIVE QUESTION TAKING VIEW */
        <div className="quiz-taking-grid">
          {/* Left: Active Question Card */}
          <div className="quiz-question-pane">
            <div className="quiz-q-card">
              <div className="q-meta-row">
                <span className="q-step-badge">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <button
                  type="button"
                  onClick={handleToggleFlag}
                  className={`flag-btn ${flaggedIds.has(currentQ.id) ? 'flagged' : ''}`}
                >
                  <Flag size={15} />
                  <span>{flaggedIds.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}</span>
                </button>
              </div>

              <div className="quiz-q-text">
                {currentQ.question}
              </div>

              <div className="quiz-options-list">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = userAnswers[currentQ.id] === opt;

                  return (
                    <div
                      key={oIdx}
                      className={`quiz-opt-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(opt)}
                    >
                      <div className="opt-letter-circle">{letter}</div>
                      <div className="opt-text-val">{opt}</div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Nav Controls */}
              <div className="quiz-bottom-nav">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="btn-nav-prev"
                >
                  <ChevronLeft size={18} />
                  <span>Previous</span>
                </button>

                <div className="q-progress-info">
                  {answeredCount} of {questions.length} answered
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-nav-next"
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    className="btn-nav-submit"
                  >
                    <span>Finish & Submit</span>
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Question Navigator Grid */}
          <div className="quiz-nav-sidebar">
            <div className="section-card">
              <h4 className="nav-palette-title">Question Palette</h4>
              <p className="text-xs text-slate-500 mb-4">
                Jump directly to any question by clicking its index below:
              </p>

              <div className="palette-grid">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = !!userAnswers[q.id];
                  const isFlagged = flaggedIds.has(q.id);

                  let statusClass = 'unanswered';
                  if (isCurrent) statusClass = 'current';
                  else if (isFlagged) statusClass = 'flagged';
                  else if (isAnswered) statusClass = 'answered';

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`palette-num-btn ${statusClass}`}
                      title={`Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="palette-legend">
                <div className="legend-item">
                  <span className="dot dot-current" />
                  <span>Current</span>
                </div>
                <div className="legend-item">
                  <span className="dot dot-answered" />
                  <span>Answered</span>
                </div>
                <div className="legend-item">
                  <span className="dot dot-flagged" />
                  <span>Flagged</span>
                </div>
                <div className="legend-item">
                  <span className="dot dot-unanswered" />
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SUBMISSION SCORE & COMPREHENSIVE REVIEW VIEW */
        <div className="quiz-result-view">
          {/* Score Hero Card */}
          <div className="score-hero-card">
            <div className="score-circle-wrap">
              <div className="score-percentage-circle">
                <span className="pct-number">{submissionResult?.percentage}%</span>
                <span className="pct-label">Score</span>
              </div>
            </div>

            <div className="score-summary-details">
              <div className="flex items-center gap-2 mb-1">
                <Award size={20} className="text-amber-500" />
                <h3 className="score-title">
                  {submissionResult?.percentage >= 80 ? "Outstanding Mastery!" :
                   submissionResult?.percentage >= 60 ? "Good Performance!" :
                   "Review Recommended"}
                </h3>
              </div>

              <p className="score-desc">
                You correctly answered <strong>{submissionResult?.score}</strong> out of{" "}
                <strong>{submissionResult?.total_questions}</strong> questions in{" "}
                <strong>{formatTime(submissionResult?.time_taken_seconds || timerSeconds)}</strong>.
              </p>

              <div className="result-actions-row">
                <button onClick={handleRetake} className="btn-primary">
                  <RotateCcw size={16} />
                  <span>Retake Quiz</span>
                </button>
                <button onClick={onBackToReview} className="btn-secondary">
                  <BookOpen size={16} />
                  <span>Edit / Review Questions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Question By Question Review */}
          <div className="review-section-header">
            <h3 className="text-lg font-bold text-slate-800">
              Detailed Question-by-Question Assessment Review
            </h3>
            <span className="text-sm text-slate-500">
              Read correct explanations and groundings from the source educational passage.
            </span>
          </div>

          <div className="review-cards-list">
            {(submissionResult?.review_details || []).map((item, idx) => {
              const isCorrect = item.is_correct;
              const userChoice = item.selected_answer;
              const correctChoice = item.correct_answer;

              return (
                <div
                  key={idx}
                  className={`result-q-card ${isCorrect ? 'border-emerald-300' : 'border-rose-300'}`}
                >
                  <div className="result-card-header">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        Q{idx + 1}. {item.question}
                      </span>
                    </div>
                    <div className={`result-verdict-badge ${isCorrect ? 'verdict-correct' : 'verdict-wrong'}`}>
                      {isCorrect ? (
                        <>
                          <CheckCircle2 size={16} /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle size={16} /> Incorrect
                        </>
                      )}
                    </div>
                  </div>

                  {/* Options review */}
                  <div className="result-options-grid">
                    {(item.options || []).map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      const isThisCorrect = opt === correctChoice;
                      const isThisUserSelected = opt === userChoice;

                      let optStateClass = '';
                      if (isThisCorrect) optStateClass = 'opt-state-correct';
                      else if (isThisUserSelected && !isCorrect) optStateClass = 'opt-state-wrong';

                      return (
                        <div key={oIdx} className={`result-opt-row ${optStateClass}`}>
                          <span className="opt-letter">{letter}</span>
                          <span className="flex-1">{opt}</span>
                          {isThisCorrect && (
                            <span className="text-xs font-semibold text-emerald-700 ml-2">
                              ✓ Correct Answer
                            </span>
                          )}
                          {isThisUserSelected && !isCorrect && (
                            <span className="text-xs font-semibold text-rose-700 ml-2">
                              ✗ Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Source Grounding */}
                  <div className="result-explanation-box">
                    <div className="text-sm font-semibold text-slate-700 mb-1">
                      Explanation:
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {item.explanation || "Directly verified against educational text concepts."}
                    </p>
                    {item.source_sentence && (
                      <div className="result-source-quote">
                        <strong>Source Reference:</strong> "{item.source_sentence}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
