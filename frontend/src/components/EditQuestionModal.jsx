import React, { useState } from 'react';
import { X, Check, Save } from 'lucide-react';

export default function EditQuestionModal({ question, onSave, onClose }) {
  const [questionText, setQuestionText] = useState(question.question || '');
  const [options, setOptions] = useState([...(question.options || [])]);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || '');
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [difficulty, setDifficulty] = useState(question.difficulty || 'medium');

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    const prevVal = updated[index];
    updated[index] = value;
    setOptions(updated);

    // If the edited option was the selected correct answer, keep track
    if (correctAnswer === prevVal) {
      setCorrectAnswer(value);
    }
  };

  const handleSelectCorrect = (optVal) => {
    setCorrectAnswer(optVal);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert("Question text cannot be empty.");
      return;
    }

    if (options.some(opt => !opt.trim())) {
      alert("All options must contain text.");
      return;
    }

    if (!correctAnswer || !options.includes(correctAnswer)) {
      alert("Please designate one of the options as the correct answer.");
      return;
    }

    const correctIndex = options.indexOf(correctAnswer);

    onSave({
      ...question,
      question: questionText.trim(),
      options: options.map(o => o.trim()),
      correct_answer: correctAnswer.trim(),
      correct_index: correctIndex,
      explanation: explanation.trim(),
      difficulty: difficulty
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">Edit MCQ #{question.question_number || ''}</h3>
          <button onClick={onClose} className="modal-close" title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Question Text</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Answer Options (Click radio button to mark correct answer)</label>
            <div className="options-edit-list">
              {options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect = opt === correctAnswer && opt.trim() !== '';

                return (
                  <div key={idx} className={`option-edit-row ${isCorrect ? 'is-correct' : ''}`}>
                    <button
                      type="button"
                      className={`radio-check-btn ${isCorrect ? 'active' : ''}`}
                      onClick={() => handleSelectCorrect(opt)}
                      title={`Mark ${letter} as correct`}
                    >
                      {isCorrect ? <Check size={14} /> : letter}
                    </button>
                    <input
                      type="text"
                      className="form-input"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${letter}`}
                      required
                    />
                    {isCorrect && <span className="correct-tag">Correct Answer</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select
                className="form-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy (Direct / Definitions)</option>
                <option value="medium">Medium (Conceptual / Functional)</option>
                <option value="hard">Hard (Application / Reasoning)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Question Type</label>
              <input
                type="text"
                className="form-input disabled"
                value={question.question_type || 'concept'}
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Explanation</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Source context and rationale..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
