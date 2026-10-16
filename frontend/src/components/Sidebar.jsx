import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  PlayCircle,
  FolderBookmark,
  History,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, activeQuestionsCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate MCQs', icon: FilePlus2, badge: 'NLP' },
    {
      id: 'review',
      label: 'Question Review',
      icon: ListChecks,
      badge: activeQuestionsCount > 0 ? `${activeQuestionsCount}` : null
    },
    { id: 'quiz', label: 'Interactive Quiz', icon: PlayCircle },
    { id: 'saved', label: 'Saved Quizzes', icon: FolderBookmark },
    { id: 'history', label: 'Quiz History', icon: History },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div className="brand-text">
          <span className="brand-name">AutoMCQ</span>
          <span className="brand-sub">NLP Education Engine</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${item.badge === 'NLP' ? 'nlp-badge' : 'count-badge'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="nlp-tag-card">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">Local NLP Architecture</span>
          </div>
          <p className="text-xs text-slate-400">
            Powered by spaCy NER, TextRank centrality & WordNet synset ontologies.
          </p>
        </div>
      </div>
    </aside>
  );
}
