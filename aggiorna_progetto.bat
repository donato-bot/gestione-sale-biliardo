@echo off
echo ========================================
echo   AGGIORNAMENTO AUTOMATICO SALA GIOCO
echo ========================================
echo.

:: Si sposta nella cartella corretta
cd /d "%~dp0"

:: 1. Scarica aggiornamenti dal server (Pull)
echo [1/4] Verifica aggiornamenti remoti...
git pull origin main --rebase

:: 2. Aggiunge le modifiche locali
echo [2/4] Preparazione file modificati...
git add .

:: 3. Crea il commit con data e ora
set msg=Aggiornamento automatico %date% %time%
echo [3/4] Creazione pacchetto: %msg%
git commit -m "%msg%"

:: 4. Invia i dati al server (Push)
echo [4/4] Invio al server in corso...
git push origin main

echo.
echo ========================================
echo   SISTEMA AGGIORNATO CON SUCCESSO!
echo ========================================
pause