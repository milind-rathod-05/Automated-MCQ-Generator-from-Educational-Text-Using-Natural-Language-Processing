import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  RotateCcw,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileUp,
  FileCheck,
  FileType
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function GenerateMCQ({
  onGenerationSuccess,
  prefilledSample = null,
  addToast
}) {
  const [activeInputTab, setActiveInputTab] = useState('text'); // 'text', 'pdf', 'txt'
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Foundational Concepts');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [numOptions, setNumOptions] = useState(4);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  // Samples catalog
  const [samples, setSamples] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSamples();
  }, []);

  useEffect(() => {
    if (prefilledSample && samples[prefilledSample]) {
      applySample(prefilledSample);
    }
  }, [prefilledSample, samples]);

  const loadSamples = async () => {
    try {
      const res = await api.getSampleTexts();
      if (res?.samples) {
        setSamples(res.samples);
      }
    } catch (err) {
      console.warn("Could not load sample texts:", err);
    }
  };

  const applySample = (sampleKey) => {
    const item = samples[sampleKey];
    if (item) {
      setText(item.text);
      setTitle(item.title);
      setSubject(item.subject);
      setTopic(item.topic);
      setActiveInputTab('text');
      addToast({
        type: 'info',
        title: 'Sample Content Loaded',
        message: `Loaded educational text for "${item.subject}". Ready to generate MCQs.`
      });
    }
  };

  const handleClear = () => {
    setText('');
    setTitle('');
    setUploadedFile(null);
    setUploadStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast({
      type: 'info',
      message: 'Input text and document cleared.'
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      addToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: `Please upload a .pdf or .txt file. Received .${ext}`
      });
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ""));
      formData.append('subject', subject);
      formData.append('topic', topic);

      const res = await api.uploadDocument(formData);
      if (res.success && res.extracted_text) {
        setText(res.extracted_text);
        if (!title) setTitle(res.title);
        setUploadStats(res.metadata);
        addToast({
          type: 'success',
          title: 'Document Parsed Successfully',
          message: `Extracted ${res.metadata.word_count} words from "${file.name}".`
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      addToast({
        type: 'error',
        title: 'Document Extraction Error',
        message: err.message || "Failed to extract text from document."
      });
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      addToast({
        type: 'error',
        title: 'Missing Content',
        message: 'Please paste educational text or upload a PDF/TXT document before generating MCQs.'
      });
      return;
    }

    const wordCount = trimmedText.split(/\s+/).length;
    if (wordCount < 20) {
      addToast({
        type: 'error',
        title: 'Insufficient Content',
        message: `The text contains only ${wordCount} words. A minimum of 25 words is required to extract educational concepts and factual distractors.`
      });
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        text: trimmedText,
        title: title.trim() || 'Educational Quiz',
        subject: subject.trim() || 'General',
        topic: topic.trim() || 'General',
        num_questions: parseInt(numQuestions, 10),
        difficulty: difficulty,
        num_options: parseInt(numOptions, 10)
      };

      const result = await api.generateMCQs(payload);

      if (result.success) {
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warn => {
            addToast({ type: 'warning', title: 'NLP Pipeline Notice', message: warn });
          });
        }

        addToast({
          type: 'success',
          title: 'MCQs Generated Successfully',
          message: `Generated ${result.total_generated} verified multiple choice questions!`
        });

        onGenerationSuccess(result, trimmedText);
      }
    } catch (err) {
      console.error("MCQ generation error:", err);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || "Failed to generate multiple choice questions."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="page-container">
      {isProcessing && <LoadingSpinner message="NLP pipeline extracting concepts, definitions & distractors..." />}

      <div className="page-header">
        <div>
          <h2 className="page-title">Generate Multiple Choice Questions</h2>
          <p className="page-subtitle">
            Provide educational text via direct input or document upload to synthesize high-quality assessment items.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="quick-samples-bar">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">
            Load Sample:
          </span>
          {Object.keys(samples).map((sampleName) => (
            <button
              key={sampleName}
              type="button"
              onClick={() => applySample(sampleName)}
              className="sample-pill-btn"
            >
              {sampleName}
            </button>
          ))}
        </div>
      </div>

      <div className="generate-layout-grid">
        {/* Left Column: Educational Content Input */}
        <div className="input-column">
          <div className="section-card">
            {/* Input Mode Tabs */}
            <div className="input-tab-header">
              <button
                type="button"
                className={`input-tab-btn ${activeInputTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('text')}
              >
                <FileText size={16} />
                <span>Paste Educational Text</span>
              </button>
              <button
                type="button"
                className={`input-tab-btn ${activeInputTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('pdf')}
              >
                <FileType size={16} />
                <span>Upload PDF Document</span>
              </button>
              <button
                type="button"
                className={`input-tab-btn ${activeInputTab === 'txt' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('txt')}
              >
                <FileUp size={16} />
                <span>Upload TXT File</span>
              </button>
            </div>

            {/* Document Metadata Fields */}
            <div className="metadata-row">
              <div className="form-group flex-1">
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 4: Supervised Learning Models"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group w-48">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Machine Learning"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="form-group w-48">
                <label className="form-label">Chapter / Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Support Vector Machines"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>

            {/* Upload Area for PDF / TXT */}
            {(activeInputTab === 'pdf' || activeInputTab === 'txt') && (
              <div className="file-upload-dropzone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeInputTab === 'pdf' ? '.pdf' : '.txt'}
                  onChange={handleFileChange}
                  className="hidden-file-input"
                  id="doc-file-input"
                />
                <label htmlFor="doc-file-input" className="dropzone-label">
                  <Upload size={32} className="text-indigo-500 mb-2" />
                  <span className="font-semibold text-slate-800">
                    Click to browse and upload {activeInputTab.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Accepts educational textbooks, lecture notes, academic papers
                  </span>
                </label>

                {isUploading && (
                  <div className="upload-progress-text">
                    <Sparkles size={16} className="spin text-indigo-600" />
                    <span>Extracting text via PyMuPDF...</span>
                  </div>
                )}

                {uploadedFile && (
                  <div className="file-info-badge">
                    <FileCheck size={18} className="text-emerald-600" />
                    <span className="font-medium text-slate-700">{uploadedFile.name}</span>
                    <span className="text-xs text-slate-500">
                      ({Math.round(uploadedFile.size / 1024)} KB)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Text Area */}
            <div className="text-input-wrap">
              <label className="form-label flex justify-between">
                <span>Educational Text Content</span>
                <span className="text-xs text-slate-500 font-normal">
                  {wordCount} words &bull; {charCount} characters
                </span>
              </label>
              <textarea
                className="educational-textarea"
                rows={14}
                placeholder="Paste educational textbook excerpts, lecture slides, academic summaries, or definition notes here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Action Buttons Row */}
            <div className="input-actions-bar">
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary"
                disabled={!text && !uploadedFile}
              >
                <RotateCcw size={16} />
                <span>Clear Text</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="btn-primary"
                disabled={isProcessing || isUploading}
              >
                <Sparkles size={18} />
                <span>Generate MCQs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generation Controls & Parameters */}
        <div className="controls-column">
          <div className="section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <Sliders size={18} className="text-indigo-600" />
                <h3 className="section-title">Generation Parameters</h3>
              </div>
            </div>

            {/* Number of Questions */}
            <div className="form-group mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Question Count</label>
                <span className="counter-pill">{numQuestions} Questions</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                className="range-slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>10</span>
                <span>25</span>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="form-group mb-6">
              <label className="form-label">Target Difficulty</label>
              <div className="difficulty-radio-group">
                {[
                  { id: 'easy', label: 'Easy', desc: 'Direct definitions & basic cloze facts' },
                  { id: 'medium', label: 'Medium', desc: 'Concept functions & relationship analysis' },
                  { id: 'hard', label: 'Hard', desc: 'Application reasoning & statement verification' },
                  { id: 'all', label: 'Mixed', desc: 'Balanced combination of all difficulty tiers' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`diff-choice-card ${difficulty === item.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={item.id}
                      checked={difficulty === item.id}
                      onChange={() => setDifficulty(item.id)}
                      className="hidden-radio"
                    />
                    <div className="diff-card-content">
                      <div className="diff-card-title">{item.label}</div>
                      <div className="diff-card-desc">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Options Per Question */}
            <div className="form-group mb-6">
              <label className="form-label">Options Per Question</label>
              <div className="options-count-selector">
                {[3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setNumOptions(count)}
                    className={`opt-count-btn ${numOptions === count ? 'active' : ''}`}
                  >
                    {count} Options {count === 4 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Features info box */}
            <div className="nlp-pipeline-info-box">
              <h4 className="info-box-title">Natural Language Pipeline:</h4>
              <ul className="info-box-list">
                <li>&bull; spaCy Tokenization & Lemmatization</li>
                <li>&bull; TF-IDF & TextRank Sentence Ranking</li>
                <li>&bull; Definition Pattern Recognition</li>
                <li>&bull; WordNet Sister-Term Distractors</li>
                <li>&bull; Zero API Key Required & 100% Local</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
