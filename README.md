# Automated MCQ Generator from Educational Text Using Natural Language Processing

A complete, full-stack, GUI-based web application that automatically generates Multiple Choice Questions (MCQs) from educational text (pasted text, PDF documents, or TXT files) using local Natural Language Processing (NLP) techniques.

Designed for students and teachers to create, review, customize, export, and practice quizzes from textbooks, lecture notes, academic summaries, and study materials **without requiring any paid external API keys**.

---

## 🌟 Key Highlights & Features

### 1. Modern Academic GUI & Dashboard
- **Analytics KPIs:** Real-time counts of documents processed, total MCQs formulated, quizzes attempted, and average score.
- **Difficulty Distribution:** Visual tracking of Easy, Medium, and Hard question ratios.
- **Performance Trends:** History of recent quiz attempts and mastery percentages.
- **Quick-Start Topics:** 1-click loading of sample study materials across Machine Learning, AI, Computer Networks, Operating Systems, and Data Structures.

### 2. Multi-Modal Educational Content Ingestion
- **Direct Text Input:** Paste large educational passages with live word and character counters.
- **PDF Document Upload:** High-fidelity text extraction via **PyMuPDF** (`pymupdf`).
- **Plain Text (TXT) Upload:** Multi-encoding text reader (UTF-8, Latin-1, CP1252).
- **Validation & Error Handling:** Graceful guards against empty text, unreadable/scanned PDFs, unsupported file formats, and insufficient content (< 25 words).

### 3. True NLP Processing Pipeline (100% Free & Local)
1. **Text Preprocessing & Normalization:** Unicode normalization, whitespace cleanup, cross-paragraph sentence preservation.
2. **Sentence Segmentation & Ranking:** **spaCy** sentence parsing, TF-IDF scoring, and **TextRank graph centrality** (PageRank power iteration on sentence cosine similarity matrix). Educational definition pattern detectors (`is defined as`, `refers to`, `is an algorithm that`, `plays a crucial role in`).
3. **Concept & Entity Extraction:** **spaCy NER** (Named Entity Recognition for Persons, Organizations, Dates), noun chunk analysis, and TF-IDF keyphrase extraction.
4. **Question Generation Strategies:**
   - **Definition-based:** *"Which concept matches the description: 'Ensemble bagging method that builds multiple decision trees...'?"*
   - **Concept & Mechanism:** *"Which technique or mechanism is used to minimize residual errors...?"*
   - **Cloze / Fill-in-the-Blank:** *"When datasets are not linearly separable, SVM applies the ________ to map input vectors..."*
   - **Named-Entity / Fact:** *"Who coined the term Artificial Intelligence in 1956...?"*
   - **Statement Verification (Hard):** *"Based on the educational text, which of the following statements is strictly correct?"*
5. **Contextual & Semantic Distractor Generation:**
   - Co-occurring domain concepts extracted from the same document (contextually realistic options).
   - **NLTK WordNet** coordinate terms (sister terms sharing hypernyms).
   - Domain-specific academic taxonomic fallback pools.
   - Distinctness enforcement: distractors are never duplicates of the answer or each other.
6. **Validation & Grounding:**
   - Guarantees the correct answer is present among the 4 options.
   - Randomizes option positions while maintaining an accurate `correct_index`.
   - Links every question to its exact source sentence and generates an explanatory rationale.

### 4. MCQ Review & Customization
- **Card-Based Interface:** View questions with option tags, difficulty badges, and collapsible source sentence quotes.
- **Inline Editing:** Modify question wording, options A-D, correct answer, and explanation via an interactive modal.
- **Targeted & Bulk Regeneration:** Regenerate individual questions or select multiple questions to re-query the NLP engine without duplicates.
- **Search & Filter:** Instant search by keyword and filter by difficulty tier.
- **Export Options:** Download as **CSV** spreadsheet, structured **JSON**, or print-formatted **PDF**.

### 5. Interactive Student Quiz Mode
- **Palette Navigator:** Live grid showing Current, Answered, Flagged, and Unanswered questions.
- **Timer & Flagging:** Track elapsed time and flag difficult questions for later review.
- **Instant Grading & Confetti:** Immediate scoring upon submission with celebratory confetti for scores $\ge 70\%$.
- **Comprehensive Post-Quiz Review:** Side-by-side comparison of student choices versus correct answers, with detailed explanations and original passage context.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Canvas-Confetti, Custom Academic CSS |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **NLP Engine** | spaCy (`en_core_web_sm`), NLTK (`punkt`, `stopwords`, `wordnet`), Scikit-Learn |
| **Document Processing** | PyMuPDF (`pymupdf`) |
| **Database** | SQLite3 (`mcq_generator.db`) |

---

## 📂 Project Directory Structure

```
NLP/
├── run_app.bat                       # One-click Windows startup script
├── README.md                         # Documentation & user guide
├── sample_documents/                 # Sample PDFs & TXT files for testing
│   ├── artificial_intelligence_notes.pdf
│   ├── machine_learning_study_guide.txt
│   └── operating_systems_summary.pdf
│
├── backend/
│   ├── requirements.txt              # Python dependencies
│   ├── run_backend.py                # FastAPI runner script
│   ├── test_nlp.py                   # NLP pipeline unit tests
│   ├── test_api_endpoints.py         # Full API integration tests
│   ├── mcq_generator.db              # SQLite database (auto-created)
│   ├── venv/                         # Python virtual environment
│   └── app/
│       ├── main.py                   # FastAPI application & API routes
│       ├── database.py               # SQLite schema & database queries
│       ├── models.py                 # Pydantic data schemas
│       ├── nlp/
│       │   ├── preprocessor.py       # Cleaning, segmentation, lemmatization
│       │   ├── sentence_ranker.py    # TextRank & definition heuristic scoring
│       │   ├── keyword_extractor.py  # spaCy NER & noun chunk extraction
│       │   ├── distractor_gen.py     # WordNet & domain distractor engine
│       │   ├── question_generator.py # Question formulation strategies
│       │   └── validator.py          # Validation, deduplication & pipeline
│       └── utils/
│           ├── document_parser.py    # PDF & TXT parser with PyMuPDF
│           └── sample_texts.py       # Educational study passages
│
└── frontend/
    ├── index.html                    # Application HTML shell
    ├── package.json                  # Node dependencies & build scripts
    ├── vite.config.js                # Vite build configuration
    └── src/
        ├── main.jsx                  # React application entrypoint
        ├── App.jsx                   # Main layout & state router
        ├── index.css                 # Custom academic stylesheet
        ├── components/
        │   ├── Navbar.jsx            # Top app bar
        │   ├── Sidebar.jsx           # Navigation panel
        │   ├── StatsCard.jsx         # KPI metric card
        │   ├── QuestionCard.jsx      # Individual question card
        │   ├── EditQuestionModal.jsx # Question editing dialog
        │   ├── LoadingSpinner.jsx    # NLP progress visualizer
        │   └── Toast.jsx             # Notification alerts
        ├── pages/
        │   ├── Dashboard.jsx         # Main dashboard & analytics
        │   ├── GenerateMCQ.jsx       # Input & document upload page
        │   ├── MCQReview.jsx         # Question review & export page
        │   ├── QuizMode.jsx          # Interactive test & evaluation page
        │   ├── SavedQuizzes.jsx      # Saved quizzes library
        │   └── QuizHistory.jsx       # Past attempt reviews
        ├── services/
        │   └── api.js                # Fetch client for FastAPI backend
        └── utils/
            └── exportUtils.js        # CSV, JSON, and PDF export logic
```

---

## 🚀 Quick Start Guide (Windows)

### Option 1: One-Click Launch (Recommended)
Double-click `run_app.bat` in the project root directory:
```powershell
.\run_app.bat
```
This script automatically starts both the FastAPI backend and the React frontend and opens `http://localhost:5173` in your default browser.

---

### Option 2: Manual Terminal Execution

#### 1. Start the Backend
Open a terminal in the `backend` directory:
```powershell
cd "c:\Users\Milind Rathod\Downloads\BCC\NLP\backend"

# If virtual environment is not already active:
.\venv\Scripts\activate

# Run the FastAPI server:
python run_backend.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/docs`

#### 2. Start the Frontend
Open a second terminal in the `frontend` directory:
```powershell
cd "c:\Users\Milind Rathod\Downloads\BCC\NLP\frontend"

# Start the Vite development server:
npm run dev
```
Open your browser to: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the standalone test suites to verify NLP and API operations:

1. **NLP Pipeline Unit Tests:**
   ```powershell
   & "backend\venv\Scripts\python.exe" "backend\test_nlp.py"
   ```
   *Verifies sentence segmentation, TextRank scoring, distractor uniqueness, and question generation.*

2. **Full API Integration Tests:**
   ```powershell
   & "backend\venv\Scripts\python.exe" "backend\test_api_endpoints.py"
   ```
   *Tests PDF upload parsing, MCQ generation, SQLite storage, quiz grading, and single-question regeneration.*

---

## 📊 Testing with Sample Documents
Sample educational files are provided in `sample_documents/`:
- `sample_documents/artificial_intelligence_notes.pdf`: Search strategies, BFS/DFS, A* Search, Alpha-Beta pruning.
- `sample_documents/machine_learning_study_guide.txt`: Supervised learning, Linear/Logistic regression, SVM, Random Forest.
- `sample_documents/operating_systems_summary.pdf`: CPU scheduling, semaphores, deadlock conditions, Banker's algorithm.

Upload any of these in the **Generate MCQs** tab to test PDF and TXT processing live!
"# Automated-MCQ-Generator-from-Educational-Text-Using-Natural-Language-Processing" 
