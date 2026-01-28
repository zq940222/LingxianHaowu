# CI/CD流程

## 一、GitHub Actions配置

### 1.1 后端CI/CD
```yaml
# .github/workflows/backend.yml

name: Backend CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      run: |
        pytest --cov=./app --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: lingxian/backend:latest
        cache-from: type=registry,ref=lingxian/backend:buildcache
        cache-to: type=registry,ref=lingxian/backend:buildcache,mode=max
```

### 1.2 前端CI/CD
```yaml
# .github/workflows/frontend.yml

name: Frontend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'

jobs:
  build-mini:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'

    - name: Install dependencies
      working-directory: ./frontend/mini
      run: npm ci

    - name: Lint
      working-directory: ./frontend/mini
      run: npm run lint

    - name: Build
      working-directory: ./frontend/mini
      run: npm run build:weapp

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: mini-dist
        path: frontend/mini/dist

  build-admin:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'

    - name: Install dependencies
      working-directory: ./frontend/admin
      run: npm ci

    - name: Lint
      working-directory: ./frontend/admin
      run: npm run lint

    - name: Build
      working-directory: ./frontend/admin
      run: npm run build

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: admin-dist
        path: frontend/admin/dist

  deploy:
    needs: [build-mini, build-admin]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/lingxian-haowu
          docker-compose pull
          docker-compose up -d
          docker exec lingxian-nginx nginx -s reload
```

## 二、自动化部署流程

### 2.1 部署流程图
```
代码提交 → 自动触发测试 → 测试通过 → 构建Docker镜像
→ 推送到镜像仓库 → 服务器拉取镜像 → 更新服务 → 健康检查 → 完成部署
```

### 2.2 部署脚本
```bash
#!/bin/bash
# deploy.sh

set -e

echo "开始部署..."

# 拉取最新代码
git pull origin main

# 停止旧容器
docker-compose down

# 拉取最新镜像
docker-compose pull

# 启动新容器
docker-compose up -d

# 等待服务启动
sleep 10

# 健康检查
curl -f http://localhost:8000/api/v1/health || exit 1

echo "部署成功!"
```

### 2.3 回滚脚本
```bash
#!/bin/bash
# rollback.sh

set -e

echo "开始回滚..."

# 停止当前容器
docker-compose down

# 拉取上一个版本镜像
docker-compose pull:backend-rollback

# 启动回滚版本
docker-compose up -d

echo "回滚成功!"
```

## 三、版本管理

### 3.1 分支策略
```
main          # 生产环境分支
├── develop    # 开发环境分支
    ├── feature/user-auth      # 功能分支
    ├── feature/order-module   # 功能分支
    └── hotfix/bug-123         # 修复分支
```

### 3.2 提交规范
```bash
# 格式: <type>(<scope>): <subject>

# 示例
feat(user): 添加用户登录功能
fix(order): 修复订单金额计算错误
docs(api): 更新API文档
style(code): 代码格式化
refactor(db): 重构数据库查询逻辑
test(api): 添加单元测试
chore(deploy): 更新部署配置
```

## 四、监控告警

### 4.1 健康检查端点
```python
# backend/app/api/health.py

from fastapi import APIRouter
from sqlalchemy import text
from app.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }

@router.get("/health/db")
async def db_check(db = next(get_db())):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

@router.get("/health/redis")
async def redis_check():
    try:
        from app.redis import redis_client
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "redis": str(e)}
```

### 4.2 告警配置
```yaml
# prometheus/alerts.yml

groups:
  - name: lingxian_haowu
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "高错误率告警"
          description: "错误率超过10%"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        annotations:
          summary: "响应时间过长"
          description: "95%请求响应时间超过1秒"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "数据库连接失败"
          description: "PostgreSQL数据库无法连接"
```

## 五、备份恢复

### 5.1 数据库备份
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lingxian_haowu_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec lingxian-postgres pg_dump -U postgres lingxian_haowu > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_FILE.gz"
```

### 5.2 数据库恢复
```bash
#!/bin/bash
# restore-db.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "请指定备份文件"
    exit 1
fi

# 解压备份文件
gunzip -c $BACKUP_FILE | docker exec -i lingxian-postgres psql -U postgres lingxian_haowu

echo "恢复完成"
```

### 5.3 定时备份
```bash
# 添加到crontab
# 每天凌晨2点备份
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup.log 2>&1
```
