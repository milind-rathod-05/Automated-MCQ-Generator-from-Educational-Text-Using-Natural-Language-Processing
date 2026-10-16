import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  Award,
  TrendingUp,
  Sparkles,
  Play,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { api } from '../services/api';

export default function Dashboard({
  onNavigateToGenerate,
  onNavigateToQuiz,
  onLoadSampleText,
  onLoadQuizForReview
}) {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_mcqs: 0,
    total_quizzes_attempted: 0,
    average_score: 0.0,
    recent_quizzes: [],
    recent_results: [],
    difficulty_distribution: { easy: 0, medium: 0, hard: 0 },
    score_trend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setError("Unable to load live analytics. Backend service may be starting.");
    } finally {
      setLoading(false);
    }
  };

  const sampleTopics = [
    {
      name: "Machine Learning",
      topic: "Supervised Models & Hyperplanes",
      tag: "Popular",
      color: "border-indigo-500"
    },
    {
      name: "Artificial Intelligence",
      topic: "A* Search & Adversarial Minimax",
      tag: "Foundations",
      color: "border-blue-500"
    },
    {
      name: "Computer Networks",
      topic: "OSI Layers & TCP/IP Protocols",
      tag: "Core CS",
      color: "border-emerald-500"
    },
    {
      name: "Operating Systems",
      topic: "Process Scheduling & Deadlocks",
      tag: "Systems",
      color: "border-amber-500"
    },
    {
      name: "Data Structures",
      topic: "BST, Balanced Trees & Graphs",
      tag: "Algorithms",
      color: "border-purple-500"
    }
  ];

  return (
    <div className="page-container dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-amber-300" />
            <span>AI-Driven Assessment Architecture</span>
          </div>
          <h2 className="hero-title">Automated MCQ Generation Platform</h2>
          <p className="hero-subtitle">
            Transform educational textbooks, study material, PDFs, and lecture notes into rigorous,
            distractor-grounded multiple choice quizzes using natural language processing.
          </p>
          <div className="hero-actions">
            <button
              onClick={() => onNavigateToGenerate()}
              className="hero-btn-primary"
            >
              <FileText size={18} />
              <span>Generate Questions</span>
            </button>
            <button
              onClick={() => onNavigateToQuiz()}
              className="hero-btn-secondary"
            >
              <Play size={18} />
              <span>Take Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="warning-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Documents Processed"
          value={stats.total_documents}
          subtext="Educational texts ingested"
          icon={FileText}
          color="indigo"
        />
        <StatsCard
          title="MCQs Formulated"
          value={stats.total_mcqs}
          subtext="Verified questions generated"
          icon={HelpCircle}
          color="blue"
        />
        <StatsCard
          title="Quizzes Attempted"
          value={stats.total_quizzes_attempted}
          subtext="Interactive practice sessions"
          icon={Award}
          color="emerald"
        />
        <StatsCard
          title="Average Quiz Score"
          value={`${stats.average_score}%`}
          subtext="Overall student mastery"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Quick Load Educational Samples */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title-wrap">
            <BookOpen size={20} className="text-indigo-600" />
            <h3 className="section-title">Quick-Start Educational Topics</h3>
          </div>
          <span className="section-subtext">Click any topic to pre-fill content and generate questions instantly</span>
        </div>

        <div className="sample-cards-grid">
          {sampleTopics.map((item, idx) => (
            <div
              key={idx}
              className={`sample-card ${item.color}`}
              onClick={() => onLoadSampleText(item.name)}
            >
              <div className="sample-card-top">
                <span className="sample-subject">{item.name}</span>
                <span className="sample-tag">{item.tag}</span>
              </div>
              <div className="sample-topic">{item.topic}</div>
              <div className="sample-action">
                <span>Generate MCQs</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics & Breakdown Row */}
      <div className="dashboard-grid-2">
        {/* Difficulty Distribution */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title-wrap">
              <Layers size={18} className="text-indigo-600" />
              <h3 className="section-title">Difficulty Distribution</h3>
            </div>
          </div>

          <div className="diff-breakdown-container">
            {['easy', 'medium', 'hard'].map((lvl) => {
              const count = stats.difficulty_distribution[lvl] || 0;
              const total = (stats.difficulty_distribution.easy || 0) +
                (stats.difficulty_distribution.medium || 0) +
                (stats.difficulty_distribution.hard || 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={lvl} className="diff-bar-item">
                  <div className="diff-bar-header">
                    <span className="capitalize font-semibold text-slate-700">{lvl}</span>
                    <span className="text-sm text-slate-500">{count} MCQs ({pct}%)</span>
                  </div>
                  <div className="diff-progress-track">
                    <div
                      className={`diff-progress-fill fill-${lvl}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Performance Trend */}
        <div className="section-card">
          <div className="section-header">
            <div className="section-title-wrap">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="section-title">Recent Quiz Outcomes</h3>
            </div>
          </div>

          {stats.recent_results && stats.recent_results.length > 0 ? (
            <div className="recent-results-list">
              {stats.recent_results.map((res, i) => (
                <div key={i} className="result-mini-row">
                  <div className="result-mini-info">
                    <div className="result-mini-title">{res.quiz_title}</div>
                    <div className="result-mini-date">
                      {res.score}/{res.total_questions} correct
                    </div>
                  </div>
                  <div className={`score-badge ${res.percentage >= 70 ? 'badge-good' : 'badge-mid'}`}>
                    {res.percentage}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-subtext">
              <CheckCircle2 size={32} className="text-slate-300 mb-2" />
              <p>No quizzes attempted yet. Generate a quiz and test your knowledge!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Quizzes Table */}
      <div className="section-card">
        <div className="section-header">
          <div className="section-title-wrap">
            <BookOpen size={18} className="text-blue-600" />
            <h3 className="section-title">Recent Saved Quizzes</h3>
          </div>
          <button
            onClick={() => onNavigateToGenerate()}
            className="btn-link"
          >
            Create New Quiz &rarr;
          </button>
        </div>

        {stats.recent_quizzes && stats.recent_quizzes.length > 0 ? (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Difficulty</th>
                  <th>Questions</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="font-medium text-slate-800">{quiz.title}</td>
                    <td>{quiz.subject || 'General'}</td>
                    <td>
                      <span className={`diff-pill badge-${quiz.difficulty?.toLowerCase() || 'medium'}`}>
                        {quiz.difficulty || 'medium'}
                      </span>
                    </td>
                    <td>{quiz.question_count} MCQs</td>
                    <td className="text-sm text-slate-500">
                      {quiz.created_at ? new Date(quiz.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td>
                      <button
                        onClick={() => onLoadQuizForReview(quiz.id)}
                        className="btn-table-action"
                      >
                        Open Quiz
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-state">
            <p className="text-slate-500">No quizzes saved yet. Use the "Generate MCQs" tool to formulate your first quiz!</p>
          </div>
        )}
      </div>
    </div>
  );
}
