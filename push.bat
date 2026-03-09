@echo off
cls
echo 🚀 AVVIO DEPLOY SISTEMA BILIARDO...
git add .
set /p msg="Descrizione modifica (es. cartella dinamica): "
git commit -m "%msg%"
git push origin main
echo ---------------------------------------
echo ✅ DATI INVIATI A GITHUB!
echo 🌍 Vercel sta aggiornando il sito...
echo ---------------------------------------
pause