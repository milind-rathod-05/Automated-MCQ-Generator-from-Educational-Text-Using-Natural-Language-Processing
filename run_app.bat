@echo off
title Automated MCQ Generator from Educational Text Using NLP
echo =====================================================================
echo  Automated MCQ Generator from Educational Text Using NLP
echo =====================================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/3] Checking Backend Python Environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo Virtual environment not found. Creating backend\venv...
    python -m venv backend\venv
    echo Installing backend dependencies...
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
    echo Downloading spaCy model and NLTK data...
    backend\venv\Scripts\python.exe -m spacy download en_core_web_sm
    backend\venv\Scripts\python.exe -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4'); nltk.download('averaged_perceptron_tagger')"
)

echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AutoMCQ Backend (FastAPI)" cmd /k "cd /d "%SCRIPT_DIR%backend" && venv\Scripts\python.exe run_backend.py"

echo [3/3] Starting React Frontend on http://localhost:5173 ...
start "AutoMCQ Frontend (React)" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo =====================================================================
echo  Application is launching!
echo  - Backend API: http://127.0.0.1:8000 (Docs at /docs)
echo  - Frontend GUI: http://localhost:5173
echo =====================================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
pause
