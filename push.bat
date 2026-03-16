@echo off
echo ========================================
echo   Git Push Automatico per Vercel
echo ========================================
echo.

:: Chiede il messaggio del commit, se premi solo Invio usa un testo predefinito
set /p msg="Inserisci il messaggio del commit (o premi Invio per 'Aggiornamento'): "
if "%msg%"=="" set msg=Aggiornamento automatico

echo.
echo [1/3] Aggiungo i file modificati...
git add .

echo.
echo [2/3] Creo il commit...
git commit -m "%msg%"

echo.
echo [3/3] Invio il codice a GitHub...
git push

echo.
echo ========================================
echo   Fatto! Vercel sta aggiornando il sito.
echo ========================================
pause