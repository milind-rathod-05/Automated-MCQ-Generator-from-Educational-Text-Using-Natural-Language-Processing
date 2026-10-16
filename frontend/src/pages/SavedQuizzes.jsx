import React, { useState, useEffect } from 'react';
import {
  FolderBookmark,
  Play,
  Edit,
  Trash2,
  Search,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileJson,
  Printer,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCSV, exportToJSON, printQuizPDF } from '../utils/exportUtils';

export default function SavedQuizzes({
  onLaunchQuiz,
  onLoadForReview,
  onNavigateToGenerate,
  addToast
}) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.getSavedQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err) {
      console.error("Fetch quizzes error:", err);
      addToast({
        type: 'error',
        title: 'Error Loading Quizzes',
        message: err.message || 'Could not retrieve saved quizzes.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the quiz "${title}"?`);
    if (!confirmDelete) return;

    try {
      await api.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      addToast({
        type: 'success',
        message: `Quiz "${title}" deleted.`
      });
    } catch (err) {
      console.error("Delete quiz error:", err);
      addToast({
        type: 'error',
        message: err.message || 'Failed to delete quiz.'
      });
    }
  };

  const handleOpenForQuiz = async (quizId) => {
    try {
      const res = await api.getQuizById(quizId);
      if (res?.quiz) {
        onLaunchQuiz(res.quiz);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load quiz questions.' });
    }
  };

  const handleOpenForReview = async (quizId) => {
    try {
      const res = await api.getQuizById(quizId);
      if (res?.quiz) {
        onLoadForReview(res.quiz);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load quiz questions.' });
    }
  };

  const handleExport = async (quizId, type) => {
    try {
      const res = await api.getQuizById(quizId);
      const q = res?.quiz;
      if (!q) return;

      if (type === 'csv') {
        exportToCSV(q.title, q.questions);
      } else if (type === 'json') {
        exportToJSON(q.title, q.questions);
      } else if (type === 'pdf') {
        printQuizPDF(q.title, q.questions, q.subject, q.topic);
      }
      addToast({ type: 'info', message: `Exported "${q.title}" as ${type.toUpperCase()}.` });
    } catch (err) {
      addToast({ type: 'error', message: 'Export failed.' });
    }
  };

  const filtered = quizzes.filter((q) => {
    const query = searchQuery.toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      (q.subject || '').toLowerCase().includes(query) ||
      (q.topic || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Saved Quizzes Library</h2>
          <p className="page-subtitle">
            Manage, reopen, retake, or export all previously generated quizzes saved in SQLite.
          </p>
        </div>

        <button onClick={onNavigateToGenerate} className="btn-primary">
          <FileText size={16} />
          <span>Generate New Quiz</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-toolbar">
        <div className="search-box max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search saved quizzes by title, subject, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="loading-state-card">
          <p className="text-slate-500">Loading saved quizzes from SQLite...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="quizzes-grid">
          {filtered.map((quiz) => (
            <div key={quiz.id} className="quiz-card-item">
              <div className="quiz-card-header">
                <span className="subject-chip">{quiz.subject || 'General'}</span>
                <span className={`diff-pill badge-${quiz.difficulty?.toLowerCase() || 'medium'}`}>
                  {quiz.difficulty || 'medium'}
                </span>
              </div>

              <h3 className="quiz-card-title">{quiz.title}</h3>
              <p className="quiz-card-topic">{quiz.topic || 'General Topic'}</p>

              <div className="quiz-card-meta">
                <span className="flex items-center gap-1">
                  <Layers size={14} /> {quiz.question_count} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              <div className="quiz-card-actions">
                <button
                  onClick={() => handleOpenForQuiz(quiz.id)}
                  className="btn-card-play"
                  title="Take this quiz"
                >
                  <Play size={15} />
                  <span>Take Quiz</span>
                </button>

                <button
                  onClick={() => handleOpenForReview(quiz.id)}
                  className="btn-card-edit"
                  title="Review & edit questions"
                >
                  <Edit size={15} />
                  <span>Review</span>
                </button>

                {/* Export Dropdown buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleExport(quiz.id, 'csv')}
                    className="btn-card-icon"
                    title="Export CSV"
                  >
                    <FileSpreadsheet size={15} />
                  </button>
                  <button
                    onClick={() => handleExport(quiz.id, 'json')}
                    className="btn-card-icon"
                    title="Export JSON"
                  >
                    <FileJson size={15} />
                  </button>
                  <button
                    onClick={() => handleExport(quiz.id, 'pdf')}
                    className="btn-card-icon"
                    title="Print / PDF"
                  >
                    <Printer size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    className="btn-card-icon text-rose-500 hover:text-rose-700"
                    title="Delete quiz"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <FolderBookmark size={40} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No quizzes found</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center mt-1 mb-4">
            {quizzes.length === 0
              ? "You haven't saved any quizzes yet. Generate a quiz and click 'Save Quiz' to build your question bank."
              : "No quizzes match your search filter."}
          </p>
          <button onClick={onNavigateToGenerate} className="btn-primary">
            Create Your First Quiz
          </button>
        </div>
      )}
    </div>
  );
}
