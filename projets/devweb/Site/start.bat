@echo off
title GameBizarre - Serveur PHP
color 0A
cd /d "%~dp0"

echo.
echo  ==========================================
echo    GameBizarre - Serveur PHP + MySQL
echo  ==========================================
echo.

REM --- Detection de PHP ---
set "PHP="
set "PHPDIR="
where php >nul 2>nul && (
  for /f "delims=" %%P in ('where php') do if not defined PHP set "PHP=%%P"
)
if "%PHP%"=="" (
  for /d %%D in ("%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.*") do (
    if exist "%%D\php.exe" set "PHP=%%D\php.exe"
  )
)
if "%PHP%"=="" goto NO_PHP

REM Dossier de PHP (pour trouver le sous-dossier ext\)
for %%F in ("%PHP%") do set "PHPDIR=%%~dpF"

echo  PHP detecte : %PHP%
"%PHP%" --version | findstr /i "PHP "
echo.
echo  Site : http://localhost:8000
echo.
echo  RAPPELS :
echo   - MySQL doit etre demarre
echo   - Config serveur dans includes\database.php
echo   - Ne ferme pas cette fenetre pendant l'utilisation
echo.
echo  ==========================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

REM On force l'activation des extensions MySQL via -d (portable :
REM marche meme si php.ini n'active pas pdo_mysql par defaut)
"%PHP%" ^
  -d extension_dir="%PHPDIR%ext" ^
  -d extension=pdo_mysql ^
  -d extension=mysqli ^
  -d extension=mbstring ^
  -d extension=openssl ^
  -S localhost:8000 -t public

echo.
echo  Serveur arrete.
pause
exit /b 0


:NO_PHP
color 0C
echo  [ERREUR] PHP introuvable.
echo.
echo  Installe PHP :  winget install PHP.PHP.8.3
echo  puis relance ce fichier.
echo  (ou XAMPP : https://www.apachefriends.org )
echo.
pause
exit /b 1
