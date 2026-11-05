@echo off
chcp 65001 >nul

set "PROJECT_ROOT=E:\Университет\3 курс\2 семестр\Программирование серверных кроссплатформенных приложений\Курсовой проект\volley_hub"
set "CLIENT_DIR=%PROJECT_ROOT%\volley-hub-client"

if not exist "%CLIENT_DIR%\" (
    echo [ERROR] Client dir not found: "%CLIENT_DIR%"
    goto :end
)

pushd "%CLIENT_DIR%" || (echo [ERROR] Cannot cd to client dir & goto :end)
call npm run build
if errorlevel 1 (echo [ERROR] npm build failed & popd & goto :end)
popd

pushd "%PROJECT_ROOT%" || (echo [ERROR] Cannot cd to project root & goto :end)
docker compose up --build -d
if errorlevel 1 (echo [ERROR] docker compose failed & popd & goto :end)
popd

echo [OK] Done.
:end
pause