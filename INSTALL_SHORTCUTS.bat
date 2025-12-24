@echo off
REM ADHD Calendar Shortcut Installation Script
REM This script creates Desktop and Start Menu shortcuts

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "APP_EXE=%SCRIPT_DIR%ADHD Calendar.exe"

REM Check if the exe exists
if not exist "!APP_EXE!" (
    echo Error: ADHD Calendar.exe not found!
    echo Please make sure this script is in the same folder as ADHD Calendar.exe
    pause
    exit /b 1
)

REM Create Desktop shortcut
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=!DESKTOP!\ADHD Calendar.lnk"

echo Creating Desktop shortcut...
powershell -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); " ^
    "$Shortcut.TargetPath = '%APP_EXE%'; " ^
    "$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; " ^
    "$Shortcut.IconLocation = '%APP_EXE%'; " ^
    "$Shortcut.Save()"

if errorlevel 1 (
    echo Failed to create Desktop shortcut
) else (
    echo Desktop shortcut created successfully!
)

REM Create Start Menu shortcut
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "START_SHORTCUT=!START_MENU!\ADHD Calendar.lnk"

echo Creating Start Menu shortcut...
powershell -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$Shortcut = $WshShell.CreateShortcut('%START_SHORTCUT%'); " ^
    "$Shortcut.TargetPath = '%APP_EXE%'; " ^
    "$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; " ^
    "$Shortcut.IconLocation = '%APP_EXE%'; " ^
    "$Shortcut.Save()"

if errorlevel 1 (
    echo Failed to create Start Menu shortcut
) else (
    echo Start Menu shortcut created successfully!
)

echo.
echo Installation complete! You can now launch ADHD Calendar from:
echo - Desktop (shortcut icon)
echo - Start Menu (search for ADHD Calendar)
echo.
pause
