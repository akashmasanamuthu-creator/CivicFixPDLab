@echo off
REM Starts the CivicFix Flask API on http://localhost:5000
REM Uses "python -m pip" so packages install into the SAME Python that runs the app.
cd /d "%~dp0backend"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install Python 3.10+ and tick "Add Python to PATH".
    pause
    exit /b 1
)

echo Using Python:
python -c "import sys; print('  ' + sys.executable)"
echo.
echo Installing required packages (first run only takes a moment)...
python -m pip install -q -r requirements.txt
if errorlevel 1 (
    echo Package install failed. See the message above.
    pause
    exit /b 1
)

echo.
echo Starting CivicFix... open http://localhost:5000 in your browser.
echo Do NOT click inside this window while the app is running.
echo.
python app.py
pause