import React, { useState, useEffect } from 'react';
import {
  History,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Search,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function QuizHistory({ onRetakeQuiz, addToast }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.getQuizResults();
      setResults(res.results || []);
    } catch (err) {
      console.error("Fetch history error:", err);
      addToast({
        type: 'error',
        message: 'Could not load quiz history.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await api.getQuizResultById(id);
      setSelectedResult(res.result);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load attempt details.' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filtered = results.filter((r) =>
    (r.quiz_title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Modal for viewing past attempt review */}
      {selectedResult && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-3xl">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedResult.quiz_title} - Attempt Review</h3>
                <p className="text-xs text-slate-500">
                  Scored {selectedResult.score}/{selectedResult.total_questions} ({selectedResult.percentage}%) &bull; Time: {formatTime(selectedResult.time_taken_seconds)}
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-scroll-content">
              {(selectedResult.review_details || []).map((q, idx) => (
                <div
                  key={idx}
                  className={`result-q-card mb-4 ${q.is_correct ? 'border-emerald-300' : 'border-rose-300'}`}
                >
                  <div className="result-card-header">
                    <span className="font-semibold text-slate-800">
                      Q{idx + 1}. {q.question}
                    </span>
                    <span className={`result-verdict-badge ${q.is_correct ? 'verdict-correct' : 'verdict-wrong'}`}>
                      {q.is_correct ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="result-options-grid">
                    {(q.options || []).map((opt, oIdx) => {
                      const isCorrect = opt === q.correct_answer;
                      const isUser = opt === q.selected_answer;
                      return (
                        <div
                          key={oIdx}
                          className={`result-opt-row ${isCorrect ? 'opt-state-correct' : isUser ? 'opt-state-wrong' : ''}`}
                        >
                          <span className="opt-letter">{String.fromCharCode(65 + oIdx)}</span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <span className="text-xs text-emerald-700 font-bold">✓ Correct</span>}
                          {isUser && !isCorrect && <span className="text-xs text-rose-700 font-bold">✗ Selected</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="result-explanation-box">
                      <span className="font-semibold text-slate-700">Explanation: </span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={() => setSelectedResult(null)} className="btn-secondary">
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">Quiz Attempt History</h2>
          <p className="page-subtitle">
            Inspect past student performances, scores, time taken, and question explanations.
          </p>
        </div>
      </div>

      <div className="search-toolbar">
        <div className="search-box max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search history by quiz title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state-card">
          <p className="text-slate-500">Loading attempt history from database...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="section-card">
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Time Taken</th>
                  <th>Date Attempted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-slate-800">{r.quiz_title}</td>
                    <td>{r.score} / {r.total_questions}</td>
                    <td>
                      <span className={`score-badge ${r.percentage >= 70 ? 'badge-good' : 'badge-mid'}`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td>{formatTime(r.time_taken_seconds)}</td>
                    <td className="text-sm text-slate-500">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : 'Recent'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(r.id)}
                        className="btn-table-action"
                      >
                        <Eye size={14} />
                        <span>View Breakdown</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state-card">
          <History size={40} className="text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No attempts logged</h3>
          <p className="text-sm text-slate-500 max-w-sm text-center mt-1">
            Complete an interactive quiz to see score analytics and historical performance logs here.
          </p>
        </div>
      )}
    </div>
  );
}
