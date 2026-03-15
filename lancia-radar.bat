@echo off
color 0B
echo ===================================================
echo         RADAR NUCLEARE - SISTEMA DI LANCIO
echo ===================================================
echo.

:: Chiede cosa hai modificato
set /p msg="Cosa hai modificato? (Scrivi e premi Invio, o premi solo Invio per testo automatico): "

:: Se non scrivi nulla, usa un messaggio automatico con data e ora per forzare Vercel
if "%msg%"=="" set msg=Aggiornamento automatico Radar - %date% %time%

echo.
echo [1/3] Preparazione dei file in corso (git add)...
git add .

echo.
echo [2/3] Impacchettamento modifiche (git commit)...
git commit -m "%msg%"

echo.
echo [3/3] Spedizione verso GitHub e Vercel (git push)...
git push origin main

echo.
echo ===================================================
echo   MISSIONE COMPIUTA! Il codice e' in viaggio.
echo ===================================================
echo Controlla Vercel tra pochi secondi.
echo.
pause