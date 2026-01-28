#!/bin/bash

# 灵鲜好物 - 开发环境启动脚本

set -e

echo ""
echo "========================================"
echo "  灵鲜好物 - 开发环境启动"
echo "========================================"
echo ""

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 1. 启动数据库和Redis
echo "[1/4] 启动数据库和Redis..."
docker-compose up -d postgres redis minio

# 2. 等待数据库启动
echo "[2/4] 等待数据库启动..."
sleep 5

# 3. 检查是否需要初始化数据库
echo "[3/4] 检查数据库..."
if ! docker exec lingxian-postgres psql -U postgres -d lingxian_haowu -c "SELECT 1 FROM admins LIMIT 1" > /dev/null 2>&1; then
    echo "       初始化数据库..."
    docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu < database/init.sql
fi

# 4. 启动后端服务
echo "[4/4] 启动后端服务..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

echo ""
echo "========================================"
echo "  启动完成!"
echo "========================================"
echo ""
echo "  后端 API: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo "  MinIO:    http://localhost:9001"
echo ""
echo "  管理员:   admin / admin123"
echo ""
echo "  后端 PID: $BACKEND_PID"
echo "  停止服务: kill $BACKEND_PID"
echo ""
echo "========================================"
