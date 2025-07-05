@echo off
REM 🧪 Launcher pour les tests TriggVest APIs
REM ETHGlobal Cannes 2025

echo 🚀 Lancement des tests TriggVest APIs...
echo.

REM Exécuter le script PowerShell
powershell -ExecutionPolicy Bypass -File "scripts\test-api-routes.ps1"

echo.
echo 💡 Pour relancer les tests: .\scripts\run-tests.bat
pause 