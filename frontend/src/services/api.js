const API_BASE_URL = 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Server error (${response.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Stats
  getDashboardStats: () => request('/dashboard-stats'),
  
  // Samples
  getSampleTexts: () => request('/samples'),

  // Upload
  uploadDocument: (formData) => {
    return request('/upload-document', {
      method: 'POST',
      body: formData,
    });
  },

  // MCQ Generation
  generateMCQs: (payload) => {
    return request('/generate-mcqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Regenerate Single Question
  regenerateQuestion: (payload) => {
    return request('/regenerate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // Quizzes CRUD
  getSavedQuizzes: () => request('/quizzes'),
  getQuizById: (id) => request(`/quizzes/${id}`),
  saveQuiz: (payload) => {
    return request('/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  deleteQuiz: (id) => {
    return request(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  // Quiz Results / History
  submitQuizResult: (payload) => {
    return request('/quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  getQuizResults: (limit = 50) => request(`/quiz-results?limit=${limit}`),
  getQuizResultById: (id) => request(`/quiz-results/${id}`),
};
