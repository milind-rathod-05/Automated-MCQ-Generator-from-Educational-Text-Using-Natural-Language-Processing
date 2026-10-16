import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { api } from './services/api';

import Dashboard from './pages/Dashboard';
import GenerateMCQ from './pages/GenerateMCQ';
import MCQReview from './pages/MCQReview';
import QuizMode from './pages/QuizMode';
import SavedQuizzes from './pages/SavedQuizzes';
import QuizHistory from './pages/QuizHistory';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeQuiz, setActiveQuiz] = useState({
    title: 'Educational Quiz',
    subject: 'Computer Science',
    topic: 'Foundations',
    difficulty: 'medium',
    questions: []
  });
  const [activeSourceText, setActiveSourceText] = useState('');
  const [prefilledSample, setPrefilledSample] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Toast alert manager
  const addToast = ({ type = 'info', title = '', message = '' }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Generation Success Transition
  const handleGenerationSuccess = (result, rawText) => {
    setActiveQuiz({
      id: result.metadata?.document_id || null,
      title: result.title || 'Educational Quiz',
      subject: result.subject || 'General',
      topic: result.topic || 'General',
      difficulty: result.difficulty || 'medium',
      questions: result.questions || []
    });
    setActiveSourceText(rawText);
    setCurrentTab('review');
  };

  // Update questions after user edits or regenerations
  const handleUpdateQuestions = (newQuestions) => {
    setActiveQuiz((prev) => ({
      ...prev,
      questions: newQuestions
    }));
  };

  // Launch Interactive Quiz Mode
  const handleLaunchQuiz = (quizToTake) => {
    if (quizToTake) {
      setActiveQuiz(quizToTake);
    }
    setCurrentTab('quiz');
  };

  // Open saved quiz in review mode
  const handleLoadQuizForReview = (quizToReview) => {
    if (quizToReview) {
      setActiveQuiz(quizToReview);
    }
    setCurrentTab('review');
  };

  // Pre-load a sample educational passage and open generate tab
  const handleLoadSampleText = (sampleSubject) => {
    setPrefilledSample(sampleSubject);
    setCurrentTab('generate');
  };

  return (
    <div className="app-layout">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeQuestionsCount={activeQuiz?.questions?.length || 0}
      />

      {/* Main App Content Area */}
      <div className="app-main-viewport">
        <Navbar
          onQuickGenerate={() => setCurrentTab('generate')}
          activeQuizTitle={activeQuiz?.questions?.length > 0 ? activeQuiz.title : null}
        />

        <main className="app-content-body">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateToGenerate={() => setCurrentTab('generate')}
              onNavigateToQuiz={() => {
                if (activeQuiz?.questions?.length > 0) {
                  setCurrentTab('quiz');
                } else {
                  addToast({
                    type: 'info',
                    title: 'No Active Quiz',
                    message: 'Generate questions or select a saved quiz first.'
                  });
                  setCurrentTab('generate');
                }
              }}
              onLoadSampleText={handleLoadSampleText}
              onLoadQuizForReview={async (quizId) => {
                try {
                  const res = await api.getQuizById(quizId);
                  if (res?.quiz) {
                    handleLoadQuizForReview(res.quiz);
                  }
                } catch (e) {
                  addToast({ type: 'error', message: 'Failed to load quiz.' });
                }
              }}
            />
          )}

          {currentTab === 'generate' && (
            <GenerateMCQ
              onGenerationSuccess={handleGenerationSuccess}
              prefilledSample={prefilledSample}
              addToast={addToast}
            />
          )}

          {currentTab === 'review' && (
            <MCQReview
              quizData={activeQuiz}
              sourceText={activeSourceText}
              onUpdateQuestions={handleUpdateQuestions}
              onLaunchQuiz={handleLaunchQuiz}
              addToast={addToast}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizMode
              quizData={activeQuiz}
              onBackToReview={() => setCurrentTab('review')}
              onBackToDashboard={() => setCurrentTab('dashboard')}
              addToast={addToast}
            />
          )}

          {currentTab === 'saved' && (
            <SavedQuizzes
              onLaunchQuiz={handleLaunchQuiz}
              onLoadForReview={handleLoadQuizForReview}
              onNavigateToGenerate={() => setCurrentTab('generate')}
              addToast={addToast}
            />
          )}

          {currentTab === 'history' && (
            <QuizHistory
              onRetakeQuiz={handleLaunchQuiz}
              addToast={addToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
