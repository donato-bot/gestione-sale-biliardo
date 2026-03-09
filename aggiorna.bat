@echo off
cls
echo --------------------------------------------------
echo   🚀 PROTOCOLLO LANCIO: SISTEMA GESTIONE SALE
echo --------------------------------------------------
echo.

:: 1. Recupera eventuali modifiche dal server per evitare conflitti
echo 📡 Sincronizzazione con il satellite...
git pull origin main

:: 2. Prepara tutti i nuovi file (comprese le cartelle [sala])
echo 📦 Preparazione pacchetti dati...
git add .

:: 3. Chiede a te cosa hai modificato (per il registro di bordo)
set /p msg="Inserisci nota modifica (es: fix cartelle): "

:: 4. Firma il lancio
echo ✍️ Firma del commit...
git commit -m "%msg%"

:: 5. Spinta finale verso GitHub
echo 🛰️ Lancio verso GitHub in corso...
git push origin main

echo.
echo --------------------------------------------------
echo   ✅ MISSIONE COMPIUTA! Il sito si aggiornera.
echo --------------------------------------------------
pause