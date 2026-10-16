import React, { useState, useEffect } from 'react';
import {
  Edit3,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw
} from 'lucide-react';

export default function QuestionCard({
  question,
  isSelected,
  onToggleSelect,
  onEdit,
  onRegenerate,
  onDelete,
  isRegenerating = false,
  revealAll = false
}) {
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [showSource, setShowSource] = useState(false);

  // Sync with global revealAll toggle
  useEffect(() => {
    if (revealAll) {
      setCardRevealed(true);
    } else {
      // When global toggle is turned off, reset
      setCardRevealed(false);
      setSelectedOpt(null);
    }
  }, [revealAll]);

  const difficultyColors = {
    easy: "badge-easy",
    medium: "badge-medium",
    hard: "badge-hard"
  };

  const diffClass = difficultyColors[question.difficulty?.toLowerCase()] || "badge-medium";
  const correctAnswer = (question.correct_answer || '').trim();

  const handleOptionClick = (opt) => {
    if (cardRevealed && !revealAll) {
      // Allow re-clicking if already revealed
      setSelectedOpt(opt);
      return;
    }
    setSelectedOpt(opt);
    setCardRevealed(true);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setSelectedOpt(null);
    setCardRevealed(false);
  };

  const isEffectiveRevealed = cardRevealed || revealAll;
  const userWasCorrect = selectedOpt && selectedOpt.trim().toLowerCase() === correctAnswer.toLowerCase();

  return (
    <div className={`question-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-top-row">
        <div className="card-meta-left">
          <label className="checkbox-wrap" title="Select question">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(question.id)}
            />
            <span className="q-number-pill">#{question.question_number}</span>
          </label>
          <span className={`diff-pill ${diffClass}`}>
            {question.difficulty || 'medium'}
          </span>
          <span className="type-pill">
            {question.question_type || 'concept'}
          </span>
        </div>

        <div className="card-actions-right">
          {/* Card-level reveal / reset button */}
          {isEffectiveRevealed && !revealAll ? (
            <button
              onClick={handleReset}
              className="action-btn"
              title="Hide answer and test again"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          ) : !isEffectiveRevealed ? (
            <button
              onClick={() => setCardRevealed(true)}
              className="action-btn"
              title="Reveal answer directly"
            >
              <Eye size={14} />
              <span>Reveal</span>
            </button>
          ) : null}

          <button
            onClick={() => onEdit(question)}
            className="action-btn edit"
            title="Edit question & options"
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onRegenerate(question)}
            className="action-btn regen"
            disabled={isRegenerating}
            title="Regenerate this specific question"
          >
            <RefreshCw size={14} className={isRegenerating ? "spin" : ""} />
            <span>Regenerate</span>
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="action-btn delete"
            title="Delete this question"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="q-body-text">
        {question.question}
      </div>

      {/* Options grid with interactive click-to-reveal */}
      <div className="options-container">
        {(question.options || []).map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isThisCorrect = opt.trim().toLowerCase() === correctAnswer.toLowerCase();
          const isUserSelection = selectedOpt && opt.trim().toLowerCase() === selectedOpt.trim().toLowerCase();

          let optionStyleClass = 'interactive-choice';
          let statusBadge = null;

          if (isEffectiveRevealed) {
            if (isThisCorrect) {
              optionStyleClass = 'is-correct-answer';
              statusBadge = (
                <span className="correct-indicator">
                  <CheckCircle2 size={15} /> Correct Answer
                </span>
              );
            } else if (isUserSelection && !userWasCorrect) {
              optionStyleClass = 'is-wrong-selection';
              statusBadge = (
                <span className="wrong-indicator">
                  <XCircle size={15} /> Your Choice (Incorrect)
                </span>
              );
            }
          }

          return (
            <div
              key={idx}
              className={`option-box ${optionStyleClass}`}
              onClick={() => handleOptionClick(opt)}
              role="button"
              tabIndex={0}
              title={isEffectiveRevealed ? "" : `Click to test: Select Option ${letter}`}
            >
              <span className="opt-letter">{letter}</span>
              <span className="opt-val">{opt}</span>
              {statusBadge}
            </div>
          );
        })}
      </div>

      {/* Instant verdict feedback notice when user clicks an answer */}
      {selectedOpt && isEffectiveRevealed && !revealAll && (
        <div className={`verdict-banner ${userWasCorrect ? 'verdict-pass' : 'verdict-fail'}`}>
          {userWasCorrect ? (
            <>
              <CheckCircle2 size={16} />
              <span><strong>Correct!</strong> Well done.</span>
            </>
          ) : (
            <>
              <XCircle size={16} />
              <span><strong>Incorrect.</strong> The correct answer is <strong>{correctAnswer}</strong>.</span>
            </>
          )}
        </div>
      )}

      {/* Explanation shown after reveal */}
      {isEffectiveRevealed && question.explanation && (
        <div className="explanation-box">
          <span className="exp-label">Explanation:</span>
          <span className="exp-text">{question.explanation}</span>
        </div>
      )}

      {/* Source passage */}
      {question.source_sentence && (
        <div className="source-passage-accordion">
          <button
            type="button"
            onClick={() => setShowSource(!showSource)}
            className="source-toggle-btn"
          >
            <BookOpen size={14} />
            <span>{showSource ? "Hide Source Passage" : "View Source Passage from Document"}</span>
            {showSource ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showSource && (
            <div className="source-content">
              "{question.source_sentence}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
