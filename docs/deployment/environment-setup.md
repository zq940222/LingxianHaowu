# 环境配置

## 一、开发环境配置

### 1.1 前端环境

#### 用户端/商家端小程序
```bash
# 安装Node.js (v16+)
node --version

# 安装Taro CLI
npm install -g @tarojs/cli

# 创建项目
taro init lingxian-haowu-mini

# 安装依赖
cd lingxian-haowu-mini
npm install

# 安装TDesign组件库
npm install tdesign-miniprogram

# 安装Zustand
npm install zustand

# 启动开发服务器
npm run dev:weapp
```

#### PC后台
```bash
# 安装Vue CLI
npm install -g @vue/cli

# 创建项目
vue create lingxian-haowu-admin

# 安装Element Plus
npm install element-plus

# 安装Pinia
npm install pinia

# 安装Axios
npm install axios

# 启动开发服务器
npm run serve
```

### 1.2 后端环境

#### Python环境
```bash
# 安装Python 3.9+
python --version

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install fastapi uvicorn sqlalchemy psycopg2-binary redis celery pydantic
pip install "python-jose[cryptography]" passlib[bcrypt] python-multipart
pip install requests

# 启动开发服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 1.3 数据库环境

#### PostgreSQL
```bash
# 安装PostgreSQL 15
# Windows: 下载安装包
# Linux: apt-get install postgresql-15
# Mac: brew install postgresql@15

# 创建数据库
createdb lingxian_haowu

# 运行迁移脚本
psql -d lingxian_haowu -f schema.sql
```

#### Redis
```bash
# 安装Redis 7
# Windows: 下载安装包
# Linux: apt-get install redis-server
# Mac: brew install redis

# 启动Redis
redis-server

# 测试连接
redis-cli ping
# 输出: PONG
```

## 二、生产环境配置

### 2.1 目录结构
```
lingxian-haowu/
├── frontend/
│   ├── mini/                    # 小程序前端
│   └── admin/                   # PC后台
├── backend/
│   ├── app/
│   │   ├── api/                 # API路由
│   │   ├── models/              # 数据库模型
│   │   ├── schemas/             # Pydantic模型
│   │   ├── services/            # 业务逻辑
│   │   └── utils/               # 工具函数
│   ├── main.py                  # FastAPI应用入口
│   ├── requirements.txt         # Python依赖
│   └── Dockerfile               # Docker镜像
├── nginx/
│   └── nginx.conf               # Nginx配置
├── docker-compose.yml           # Docker Compose配置
└── .env                         # 环境变量
```

### 2.2 环境变量配置
```env
# .env文件

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/lingxian_haowu

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 微信小程序配置
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=abcdef1234567890

# 微信支付配置
WECHAT_MCH_ID=1234567890
WECHAT_API_KEY=abcdef1234567890
WECHAT_CERT_PATH=/path/to/apiclient_cert.pem
WECHAT_KEY_PATH=/path/to/apiclient_key.pem

# JWT配置
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080

# OSS配置
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret-key
OSS_BUCKET=lingxian-haowu
OSS_ENDPOINT=oss-cn-shenzhen.aliyuncs.com

# 服务配置
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# 日志配置
LOG_LEVEL=INFO
```

### 2.3 Nginx配置
```nginx
# nginx/nginx.conf

upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name your-domain.com;

    # 后端API代理
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 小程序静态资源
    location /mini {
        alias /usr/share/nginx/html/mini;
        try_files $uri $uri/ /mini/index.html;
    }

    # PC后台静态资源
    location /admin {
        alias /usr/share/nginx/html/admin;
        try_files $uri $uri/ /admin/index.html;
    }
}
```

## 三、Docker部署

### 3.1 Docker Compose配置
```yaml
# docker-compose.yml

version: '3.8'

services:
  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    container_name: lingxian-postgres
    environment:
      POSTGRES_DB: lingxian_haowu
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - lingxian-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: lingxian-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - lingxian-network

  # FastAPI后端
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: lingxian-backend
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/lingxian_haowu
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    networks:
      - lingxian-network

  # Nginx
  nginx:
    image: nginx:alpine
    container_name: lingxian-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/mini/dist:/usr/share/nginx/html/mini
      - ./frontend/admin/dist:/usr/share/nginx/html/admin
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - lingxian-network

volumes:
  postgres_data:
  redis_data:

networks:
  lingxian-network:
    driver: bridge
```

### 3.2 Dockerfile配置
```dockerfile
# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.3 部署命令
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

## 四、监控配置

### 4.1 日志配置
```python
# backend/app/utils/logger.py

import logging
from logging.handlers import RotatingFileHandler

def setup_logger():
    logger = logging.getLogger("lingxian")
    logger.setLevel(logging.INFO)

    # 文件处理器
    file_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    ))

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s"
    ))

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
```

### 4.2 性能监控
```python
# backend/app/middleware/monitoring.py

from fastapi import Request
import time
import logging

logger = logging.getLogger("lingxian")

async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )

    response.headers["X-Process-Time"] = str(process_time)
    return response
```
