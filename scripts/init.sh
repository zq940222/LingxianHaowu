#!/bin/bash

# 灵鲜好物项目初始化脚本

set -e

echo "🚀 开始初始化灵鲜好物项目..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 1. 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. 创建环境变量文件
echo "⚙️  创建环境变量文件..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env 2>/dev/null || echo "请手动创建 backend/.env 文件"
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 3. 启动数据库和Redis
echo "🗄️  启动数据库和Redis..."
docker-compose up -d postgres redis

# 4. 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 5. 初始化数据库
echo "💾 初始化数据库..."
docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu < database/init.sql

# 6. 初始化MinIO
echo "📁 初始化MinIO..."
docker-compose up -d minio
sleep 5
cd backend && python ../scripts/init-minio.py && cd ..

echo ""
echo "✅ 初始化完成！"
echo ""
echo "下一步操作："
echo "1. 编辑 backend/.env 配置文件"
echo "2. 启动后端服务: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "3. 访问 API 文档: http://localhost:8000/docs"
echo ""
echo "管理员账号: admin / admin123"
