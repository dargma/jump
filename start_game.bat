@echo off
rem ===== Doodle Prince - PC one-click launcher =====
rem Double-click this file to play. Keep the black window open while playing.
cd /d "%~dp0"
echo Starting local server and opening the game...
echo Open URL: http://localhost:8000
echo (Keep this window open. Close it to stop the game.)
start "" http://localhost:8000
python -m http.server 8000 || py -m http.server 8000
