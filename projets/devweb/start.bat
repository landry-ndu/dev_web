@echo off
title GameBizarre - Serveur local
color 0A

echo.
echo  ==========================================
echo    GameBizarre - Demarrage du serveur
echo  ==========================================
echo.

REM Detection Python (essaye dans cet ordre : py, python, python3)
set PY=
where py >nul 2>nul && set PY=py
if "%PY%"=="" where python >nul 2>nul && set PY=python
if "%PY%"=="" where python3 >nul 2>nul && set PY=python3

if "%PY%"=="" goto NO_PYTHON

echo  Python detecte : %PY%
%PY% --version
echo.
echo  Le site va s'ouvrir sur : http://localhost:8000
echo.
echo  IMPORTANT : Ne ferme pas cette fenetre tant que tu utilises le site.
echo  Pour arreter le serveur : ferme cette fenetre.
echo.
echo  ==========================================
echo.

REM Ouvre le navigateur dans 2 sec (en arriere-plan)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

REM Lance le serveur
%PY% -m http.server 8000

REM Si le serveur s'arrete, garder la fenetre ouverte pour voir l'erreur
echo.
echo  Le serveur s'est arrete.
pause
exit /b 0


:NO_PYTHON
color 0C
echo  ==========================================
echo   [ERREUR] Python n'est pas installe.
echo  ==========================================
echo.
echo  Pour faire fonctionner ce script, tu dois installer Python :
echo.
echo    1. Va sur https://www.python.org/downloads/
echo    2. Clique "Download Python 3.x.x"
echo    3. Lance l'installateur
echo    4. *** IMPORTANT *** : coche la case "Add Python to PATH"
echo       avant de cliquer sur "Install Now"
echo    5. Une fois installe, relance ce start.bat
echo.
echo  ----------------------------------------
echo   ALTERNATIVE : tu peux utiliser le site en ligne sans rien installer :
echo.
echo     https://landry-ndu.github.io/dev_web/
echo  ----------------------------------------
echo.
pause
exit /b 1
