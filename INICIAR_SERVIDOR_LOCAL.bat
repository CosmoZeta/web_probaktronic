@echo off
title PROBAKTRONIC - Servidor de Desarrollo Local
color 0A
echo ===================================================================
echo               PROBAKTRONIC - ENTORNO LOCAL SEGURO
echo ===================================================================
echo.
echo  Iniciando servidor local en http://localhost:3000 ...
echo  Abriendo automaticamente http://localhost:3000/index.html ...
echo  Todo cambio, modelo y foto se guardara en tu disco duro.
echo.
echo ===================================================================
start "" "http://localhost:3000/index.html"
node server.js
pause
