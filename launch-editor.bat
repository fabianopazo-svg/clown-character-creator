@echo off
setlocal

rem This script assumes it lives at the ROOT of your repo, next to the "editor" folder.
cd /d "%~dp0editor"

rem --- Check Node.js is installed at all ---
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js doesn't seem to be installed on this computer.
    echo Download and install it from https://nodejs.org, then run this again.
    echo.
    pause
    exit /b 1
)

rem --- First-run bootstrap: install dependencies if this is the first launch ---
if not exist node_modules (
    echo Installing dependencies for the first time - this can take a minute...
    call npm install
    if errorlevel 1 (
        echo.
        echo Something went wrong during npm install. See the error above.
        echo.
        pause
        exit /b 1
    )
)

echo Building the editor...
call npm run build
if errorlevel 1 (
    echo.
    echo Build failed. See the error above.
    echo.
    pause
    exit /b 1
)

echo Starting the editor server...
start "CLOWN Editor Server" /min cmd /k "npm start"

rem Give the server a moment to actually bind to the port before opening the browser.
timeout /t 2 /nobreak >nul

start "" http://localhost:5175

echo.
echo The editor should now be open in your browser.
echo A minimized window called "CLOWN Editor Server" is running in your taskbar -
echo that IS the server. Close that window when you're done editing to stop it.
echo.
echo This window will close on its own in a few seconds.
timeout /t 6
