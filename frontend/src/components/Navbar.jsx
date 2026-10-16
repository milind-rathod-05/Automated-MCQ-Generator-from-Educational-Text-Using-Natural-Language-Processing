import React from 'react';
import { Activity, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function Navbar({ onQuickGenerate, activeQuizTitle }) {
  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <h1 className="navbar-page-title">
          Automated MCQ Generator
        </h1>
        <span className="navbar-tagline">
          Natural Language Processing for Educational Assessment
        </span>
      </div>

      <div className="navbar-right">
        {activeQuizTitle && (
          <div className="active-quiz-pill" title="Currently loaded session">
            <BookOpen size={14} className="text-indigo-600" />
            <span className="truncate max-w-xs">{activeQuizTitle}</span>
          </div>
        )}

        <div className="engine-status-pill">
          <span className="status-dot-pulse" />
          <span className="text-xs font-medium text-slate-700">NLP Backend: Connected</span>
        </div>

        <button
          onClick={onQuickGenerate}
          className="navbar-cta-btn"
          title="Create new quiz from educational content"
        >
          <Sparkles size={15} />
          <span>New Quiz</span>
        </button>
      </div>
    </header>
  );
}
