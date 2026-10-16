export function exportToCSV(quizTitle, questions) {
  if (!questions || questions.length === 0) return;

  const headers = [
    "Question Number",
    "Question",
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "Correct Answer",
    "Explanation",
    "Difficulty",
    "Source Passage"
  ];

  const rows = questions.map((q, idx) => {
    const opts = q.options || [];
    return [
      q.question_number || (idx + 1),
      `"${(q.question || '').replace(/"/g, '""')}"`,
      `"${(opts[0] || '').replace(/"/g, '""')}"`,
      `"${(opts[1] || '').replace(/"/g, '""')}"`,
      `"${(opts[2] || '').replace(/"/g, '""')}"`,
      `"${(opts[3] || '').replace(/"/g, '""')}"`,
      `"${(opts[4] || '').replace(/"/g, '""')}"`,
      `"${(q.correct_answer || '').replace(/"/g, '""')}"`,
      `"${(q.explanation || '').replace(/"/g, '""')}"`,
      `"${(q.difficulty || '').replace(/"/g, '""')}"`,
      `"${(q.source_sentence || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const safeTitle = (quizTitle || "quiz").replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  link.setAttribute("download", `${safeTitle}_mcqs.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(quizTitle, questions, metadata = {}) {
  if (!questions || questions.length === 0) return;

  const data = {
    title: quizTitle || "Educational Quiz",
    generated_at: new Date().toISOString(),
    total_questions: questions.length,
    metadata,
    questions
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = (quizTitle || "quiz").replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  link.download = `${safeTitle}_mcqs.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printQuizPDF(quizTitle, questions, subject = "General", topic = "General") {
  if (!questions || questions.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print/export the quiz.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${quizTitle} - Multiple Choice Quiz</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #1e293b;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .meta {
      font-size: 14px;
      color: #64748b;
    }
    .meta span {
      margin-right: 18px;
    }
    .question-block {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .q-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .difficulty-badge {
      font-size: 11px;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      background: #e2e8f0;
      color: #334155;
      margin-left: 8px;
      font-weight: normal;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      margin-left: 12px;
      margin-bottom: 10px;
    }
    .opt-item {
      font-size: 14px;
      color: #334155;
    }
    .answer-key-section {
      margin-top: 40px;
      page-break-before: always;
      border-top: 2px dashed #94a3b8;
      padding-top: 20px;
    }
    .ans-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
    }
    .ans-card {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .ans-correct {
      font-weight: 600;
      color: #15803d;
    }
    .ans-exp {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }
    @media print {
      body { margin: 20mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${quizTitle}</h1>
    <div class="meta">
      <span><strong>Subject:</strong> ${subject}</span>
      <span><strong>Topic:</strong> ${topic}</span>
      <span><strong>Total Questions:</strong> ${questions.length}</span>
      <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  <div class="questions-container">
    ${questions.map((q, idx) => `
      <div class="question-block">
        <div class="q-title">
          ${idx + 1}. ${q.question}
          <span class="difficulty-badge">${q.difficulty || 'medium'}</span>
        </div>
        <div class="options-grid">
          ${(q.options || []).map((opt, oIdx) => `
            <div class="opt-item"><strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}</div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>

  <div class="answer-key-section">
    <div class="ans-title">Answer Key & Explanations</div>
    ${questions.map((q, idx) => `
      <div class="ans-card">
        <div><strong>Q${idx + 1}:</strong> <span class="ans-correct">${q.correct_answer}</span></div>
        <div class="ans-exp"><strong>Explanation:</strong> ${q.explanation || 'Verified from educational text.'}</div>
        ${q.source_sentence ? `<div class="ans-exp" style="font-style: italic;"><strong>Source:</strong> "${q.source_sentence}"</div>` : ''}
      </div>
    `).join('')}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
