@echo off
title GameBizarre - Serveur local
echo.
echo  ==========================================
echo   Demarrage de GameBizarre...
echo  ==========================================
echo.

REM Cherche Python (essaie plusieurs commandes)
where python >nul 2>nul && (set PY=python) || (
    where py >nul 2>nul && (set PY=py) || (
        where python3 >nul 2>nul && (set PY=python3) || (
            echo  [ERREUR] Python n'est pas installe sur ce PC.
            echo.
            echo  Installe-le depuis https://python.org
            echo  ou ouvre simplement index.html dans ton navigateur
            echo  ^(certaines fonctions ne marcheront pas en file://^)
            echo.
            pause
            exit /b 1
        )
    )
)

echo  Python detecte: %PY%
echo  Le site sera accessible sur: http://localhost:8000
echo.
echo  Ferme cette fenetre pour arreter le serveur.
echo.

REM Ouvre le navigateur apres 1.5s (pendant que le serveur demarre)
start "" timeout /t 2 /nobreak >nul && start http://localhost:8000

REM Lance le serveur Python
%PY% -m http.server 8000
