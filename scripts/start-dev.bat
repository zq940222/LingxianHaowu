@echo off
chcp 65001 >nul
REM Windows开发环境启动脚本

echo.
echo ========================================
echo   灵鲜好物 - 开发环境启动
echo ========================================
echo.

REM 获取项目根目录
cd /d "%~dp0\.."

REM 启动数据库和Redis
echo [1/4] 启动数据库和Redis...
docker-compose up -d postgres redis minio

REM 等待数据库启动
echo [2/4] 等待数据库启动...
timeout /t 5 /nobreak >nul

REM 检查是否需要初始化数据库
echo [3/4] 检查数据库...
docker exec lingxian-postgres psql -U postgres -d lingxian_haowu -c "SELECT 1 FROM admins LIMIT 1" >nul 2>&1
if errorlevel 1 (
    echo        初始化数据库...
    type database\init.sql | docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu
)

REM 激活虚拟环境并启动后端
echo [4/4] 启动后端服务...
cd backend
call venv\Scripts\activate.bat
start "Backend" uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo.
echo ========================================
echo   启动完成!
echo ========================================
echo.
echo   后端 API: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo   MinIO:    http://localhost:9001
echo.
echo   管理员:   admin / admin123
echo.
echo ========================================
echo.
pause
