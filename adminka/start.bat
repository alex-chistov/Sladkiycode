@echo off
chcp 65001 >nul
echo =======================================
echo 🚀 Запуск сервера Adminka
echo =======================================
echo.

REM Проверка установки Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен!
    echo.
    echo Скачайте и установите Node.js с:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js установлен
node --version
echo.

REM Проверка наличия node_modules
if not exist "node_modules\" (
    echo 📦 Установка зависимостей...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
    echo.
    echo ✅ Зависимости установлены
    echo.
)

echo 🚀 Запуск сервера...
echo.
echo Приложение будет доступно по адресу:
echo http://localhost:3000
echo.
echo Для остановки сервера нажмите Ctrl+C
echo =======================================
echo.

node server.js

pause

