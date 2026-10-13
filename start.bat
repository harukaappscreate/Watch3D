@echo off
rem Watch3D — local server (Windows: double-click)
cd /d %~dp0
start "" http://localhost:8080/
python -m http.server 8080
