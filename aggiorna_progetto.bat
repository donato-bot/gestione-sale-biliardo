@echo off
echo ==========================================
echo SINCRONIZZAZIONE PROGETTO: IL CAMPIONE
echo ==========================================
echo.
echo Spostamento nella cartella di progetto...
cd /d C:\progetti\gestione-sale-biliardo
echo.
echo 1. Rilevamento delle modifiche in corso...
git add .
echo.
echo 2. Creazione del pacchetto di aggiornamento...
git commit -m "Aggiornamento automatico tramite batch"
echo.
echo 3. Spedizione verso la cassaforte GitHub...
git push -u origin main
echo.
echo ==========================================
echo AGGIORNAMENTO COMPLETATO CON SUCCESSO!
echo ==========================================
pause