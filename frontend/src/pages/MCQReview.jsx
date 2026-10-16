import React, { useState } from 'react';
import {
  Save,
  Download,
  Play,
  Printer,
  Trash2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Filter,
  FileSpreadsheet,
  FileJson,
  Layers,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import EditQuestionModal from '../components/EditQuestionModal';
import { api } from '../services/api';
import { exportToCSV, exportToJSON, printQuizPDF } from '../utils/exportUtils';

export default function MCQReview({
  quizData,
  sourceText,
  onUpdateQuestions,
  onLaunchQuiz,
  addToast
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [revealAll, setRevealAll] = useState(false);

  const questions = quizData?.questions || [];

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleDelete = (id) => {
    const updated = questions.filter((q) => q.id !== id);
    // Renumber remaining questions
    const renumbered = updated.map((q, idx) => ({ ...q, question_number: idx + 1 }));
    onUpdateQuestions(renumbered);

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    addToast({
      type: 'info',
      message: 'Question removed from current set.'
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = questions.filter((q) => !selectedIds.has(q.id));
    const renumbered = updated.map((q, idx) => ({ ...q, question_number: idx + 1 }));
    onUpdateQuestions(renumbered);
    setSelectedIds(new Set());
    addToast({
      type: 'info',
      message: `Removed ${count} selected questions.`
    });
  };

  const handleSaveEdit = (editedQ) => {
    const updated = questions.map((q) => (q.id === editedQ.id ? editedQ : q));
    onUpdateQuestions(updated);
    setEditingQuestion(null);
    addToast({
      type: 'success',
      message: `Updated Question #${editedQ.question_number}.`
    });
  };

  const handleRegenerateSingle = async (targetQ) => {
    if (!sourceText) {
      addToast({
        type: 'error',
        message: 'No original context text available to regenerate from.'
      });
      return;
    }

    setRegeneratingIds((prev) => new Set(prev).add(targetQ.id));

    try {
      const existingQuestions = questions.map((q) => q.question);
      const res = await api.regenerateQuestion({
        text: sourceText,
        existing_questions: existingQuestions,
        difficulty: targetQ.difficulty || 'medium',
        num_options: targetQ.options?.length || 4,
        question_number: targetQ.question_number
      });

      if (res.success && res.question) {
        const replacement = {
          ...res.question,
          id: targetQ.id,
          question_number: targetQ.question_number
        };

        const updated = questions.map((q) => (q.id === targetQ.id ? replacement : q));
        onUpdateQuestions(updated);

        addToast({
          type: 'success',
          title: 'Question Regenerated',
          message: `Regenerated Question #${targetQ.question_number} with fresh NLP context.`
        });
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      addToast({
        type: 'error',
        title: 'Regeneration Error',
        message: err.message || 'Failed to regenerate question.'
      });
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetQ.id);
        return next;
      });
    }
  };

  const handleRegenerateSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedList = questions.filter((q) => selectedIds.has(q.id));
    for (const q of selectedList) {
      await handleRegenerateSingle(q);
    }
  };

  const handleSaveQuizToDB = async () => {
    if (questions.length === 0) {
      addToast({ type: 'warning', message: 'No questions available to save.' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.saveQuiz({
        title: quizData.title || 'Educational Quiz',
        subject: quizData.subject || 'General',
        topic: quizData.topic || 'General',
        difficulty: quizData.difficulty || 'medium',
        source_text: sourceText || '',
        questions: questions
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Quiz Saved to Database',
          message: `Successfully stored "${quizData.title}" (${questions.length} MCQs) in SQLite.`
        });
      }
    } catch (err) {
      console.error("Save quiz error:", err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to save quiz to database.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtering
  const filteredQuestions = questions.filter((q) => {
    const matchesDiff = filterDifficulty === 'all' || q.difficulty?.toLowerCase() === filterDifficulty;
    const matchesSearch = !searchQuery.trim() ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.options || []).some((o) => o.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  return (
    <div className="page-container">
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onSave={handleSaveEdit}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* Review Header */}
      <div className="review-top-bar">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="subject-chip">{quizData.subject || 'Subject'}</span>
            <span className="topic-chip">{quizData.topic || 'Topic'}</span>
            <span className="diff-chip">{quizData.difficulty || 'Medium'}</span>
          </div>
          <h2 className="review-title">{quizData.title || 'Educational Quiz Review'}</h2>
          <p className="review-sub">
            {questions.length} generated questions &bull; Grounded in source text with semantic distractors
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="review-cta-group">
          <button
            onClick={handleSaveQuizToDB}
            disabled={isSaving || questions.length === 0}
            className="btn-review-save"
            title="Persist quiz to SQLite"
          >
            <Save size={16} />
            <span>{isSaving ? "Saving..." : "Save Quiz"}</span>
          </button>

          <button
            onClick={() => onLaunchQuiz(quizData)}
            disabled={questions.length === 0}
            className="btn-review-play"
            title="Start interactive student quiz mode"
          >
            <Play size={16} />
            <span>Take Quiz</span>
          </button>
        </div>
      </div>

      {/* Search, Filter, and Bulk Actions Toolbar */}
      <div className="review-toolbar">
        <div className="toolbar-left">
          {/* Select all */}
          <button
            onClick={handleSelectAll}
            className="tool-btn select-all"
            title={selectedIds.size === filteredQuestions.length ? "Deselect All" : "Select All"}
          >
            {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <CheckSquare size={16} className="text-indigo-600" />
            ) : (
              <Square size={16} />
            )}
            <span>
              {selectedIds.size > 0 ? `${selectedIds.size} Selected` : "Select All"}
            </span>
          </button>

          {/* Bulk Regenerate */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleRegenerateSelected}
              className="tool-btn"
              title="Regenerate all selected questions"
            >
              <RefreshCw size={15} />
              <span>Regenerate Selected ({selectedIds.size})</span>
            </button>
          )}

          {/* Bulk Delete */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="tool-btn text-rose-600"
              title="Delete all selected questions"
            >
              <Trash2 size={15} />
              <span>Delete Selected</span>
            </button>
          )}

          {/* Reveal All Answers Toggle */}
          <button
            onClick={() => setRevealAll(!revealAll)}
            className={`tool-btn ${revealAll ? 'active-reveal-btn' : ''}`}
            title={revealAll ? "Hide all answers to practice testing yourself" : "Reveal correct answers for all questions"}
          >
            {revealAll ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{revealAll ? "Hide All Answers" : "Reveal All Answers"}</span>
          </button>

          {/* Filter by difficulty */}
          <div className="diff-filter-wrap">
            <Filter size={14} className="filter-icon" />
            <select
              className="diff-filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Search Input */}
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Export dropdown / buttons */}
          <div className="export-btn-group">
            <button
              onClick={() => exportToCSV(quizData.title, questions)}
              className="export-btn"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet size={15} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportToJSON(quizData.title, questions)}
              className="export-btn"
              title="Export as JSON"
            >
              <FileJson size={15} />
              <span>JSON</span>
            </button>
            <button
              onClick={() => printQuizPDF(quizData.title, questions, quizData.subject, quizData.topic)}
              className="export-btn"
              title="Print or Save as PDF"
            >
              <Printer size={15} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions Cards Stream */}
      {filteredQuestions.length > 0 ? (
        <div className="questions-stream">
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isSelected={selectedIds.has(q.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={() => setEditingQuestion(q)}
              onRegenerate={() => handleRegenerateSingle(q)}
              onDelete={handleDelete}
              isRegenerating={regeneratingIds.has(q.id)}
              revealAll={revealAll}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <Layers size={40} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No questions found</h3>
          <p className="text-sm text-slate-500 max-w-md text-center mt-1">
            {questions.length === 0
              ? "You haven't generated any questions yet. Head to 'Generate MCQs' to create questions from text."
              : "No questions match your current search and difficulty filter."}
          </p>
        </div>
      )}
    </div>
  );
}
