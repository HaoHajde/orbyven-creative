@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ORBYVEN] Node.js nu este instalat sau nu este in PATH.
  echo Instaleaza Node.js 22.13+ si ruleaza din nou acest fisier.
  echo.
  pause
  exit /b 1
)

node -e "const v=process.versions.node.split('.').map(Number); if(v[0] < 22 || (v[0] === 22 && v[1] < 13)){console.error('[ORBYVEN] Este necesar Node.js 22.13+; versiunea curenta este '+process.versions.node); process.exit(1)}"
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\expo\package.json" (
  echo.
  echo [ORBYVEN] Pregatesc dependentele iOS pentru prima rulare...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo [ORBYVEN] Instalarea dependentelor a esuat.
    pause
    exit /b 1
  )
)

echo.
echo ===============================================
echo   ORBYVEN iOS Alpha 0.7 - iPhone Dev Launcher
echo ===============================================
echo.
echo 1. Deschide Expo Go pe iPhone.
echo 2. Tine iPhone-ul si PC-ul pe aceeasi retea Wi-Fi.
echo 3. Scaneaza QR-ul care va aparea in terminal.
echo.
echo Inchide acest terminal pentru a opri serverul.
echo.

if /I "%~1"=="tunnel" (
  echo [ORBYVEN] Pornesc modul TUNNEL...
  echo.
  call npm run start:tunnel
) else (
  echo [ORBYVEN] Pornesc modul LAN...
  echo Daca telefonul nu vede serverul, ruleaza start-iphone-tunnel.cmd.
  echo.
  call npm run start:go
)

if errorlevel 1 (
  echo.
  echo [ORBYVEN] Serverul Expo s-a oprit cu eroare.
  echo Verifica mesajul de mai sus si incearca din nou.
  echo.
  pause
  exit /b 1
)

endlocal
