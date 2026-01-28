# 灵鲜好物 - 微信小程序卖菜平台

## 项目简介

灵鲜好物是一款基于微信小程序的生鲜卖菜平台，支持用户端、商家端和PC后台管理系统。

## 技术栈

### 前端
- **用户端/商家端**: Taro 3.x + React + TDesign
- **PC后台**: Vue 3.x + Element Plus

### 后端
- **框架**: Python FastAPI
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **ORM**: SQLAlchemy 2.0

## 核心功能

### 用户端
- 商品浏览（推荐/热卖/拼团）
- 购物车和订单管理
- 在线支付（微信支付）
- 配送管理（自提/定时配送）
- 积分系统（签到/订单积分）
- 活动弹窗（优惠券/促销）

### 商家端
- 商品管理（CRUD、拼团设置）
- 订单管理（接单、发货、配送）
- 配送管理（小区、自提点）
- 用户管理（积分调整）
- 活动管理（弹窗、优惠券）

### PC后台
- 数据统计看板
- 商家管理
- 用户管理
- 系统配置
- 权限管理

## 快速开始

### 环境要求
- Node.js 16+
- Python 3.9+
- PostgreSQL 15
- Redis 7

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-repo/lingxian-haowu.git
cd lingxian-haowu

# 安装前端依赖
cd frontend/mini
npm install

cd ../admin
npm install

# 安装后端依赖
cd ../../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑.env文件，配置数据库、Redis、微信等参数
```

### 启动服务

**快速启动（推荐）：**

```bash
# Windows用户
scripts\start-dev.bat

# Linux/Mac用户
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

**手动启动：**

```bash
# 启动数据库和Redis
docker-compose up -d postgres redis

# 启动后端服务
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 访问API文档
# http://localhost:8000/docs
```

## 项目结构

```
lingxian-haowu/
├── docs/                 # 文档目录
│   ├── frontend/        # 前端需求文档
│   ├── backend/         # 后端设计文档
│   ├── api/            # API接口文档
│   └── deployment/     # 部署文档
├── frontend/
│   ├── mini/           # 小程序前端
│   └── admin/          # PC后台
├── backend/            # 后端服务
│   ├── app/
│   │   ├── api/        # API路由
│   │   ├── models/     # 数据库模型
│   │   ├── schemas/    # Pydantic模型
│   │   ├── services/   # 业务逻辑
│   │   └── utils/      # 工具函数
│   └── main.py         # 应用入口
├── docker-compose.yml  # Docker编排
└── README.md           # 项目说明
```

## 文档

详细的文档请查看 [docs](./docs) 目录：
- [需求分析](./docs/frontend/)
- [系统架构](./docs/backend/system-architecture.md)
- [数据库设计](./docs/backend/)
- [API接口](./docs/api/)
- [部署指南](./docs/deployment/)

## 开发规范

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式化
refactor: 重构
test: 测试
chore: 构建/工具链
```

### 分支策略
- `main`: 生产环境
- `develop`: 开发环境
- `feature/*`: 功能分支
- `hotfix/*`: 修复分支

## 联系方式

- 项目负责人: XXX
- 技术支持: tech@example.com

## License

MIT License
