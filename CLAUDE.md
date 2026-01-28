# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Backend Development
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

uvicorn main:app --reload --host 0.0.0.0 --port 8000
# API docs at http://localhost:8000/docs

pytest                          # Run all tests
pytest tests/test_orders.py     # Single test file
alembic upgrade head            # Database migrations
```

### Frontend (User Mini Program - Taro)
```bash
cd frontend/mini
npm install
npm run dev:weapp    # Development
npm run build:weapp  # Production
```

### Frontend (Merchant Mini Program - Taro)
```bash
cd frontend/merchant
npm install
npm run dev:weapp    # Development
npm run build:weapp  # Production
```

### Frontend (Admin Panel - Vite + React)
```bash
cd frontend/admin
npm install
npm run dev      # Development
npm run build    # Production
npm run lint
```

### Docker Services
```bash
docker-compose up -d postgres redis  # Start database and cache
docker-compose up -d                 # Start all services (includes MinIO)
docker-compose logs -f               # View logs

# Quick start (Windows)
scripts\start-dev.bat

# Initialize MinIO buckets
python scripts/init-minio.py

# Load test data
psql -d lingxian_haowu -f scripts/init-test-data.sql
```

### Database
```bash
# Initialize schema (auto-runs on Docker first start)
psql -d lingxian_haowu -f backend/schema.sql

# Docker backup/restore
docker exec lingxian-postgres pg_dump -U postgres lingxian_haowu > backup.sql
cat backup.sql | docker exec -i lingxian-postgres psql -U postgres lingxian_haowu
```

## Architecture Overview

**Project**: LingxianHaowu (灵鲜好物) - Fresh food e-commerce platform with WeChat mini-programs

### Tech Stack
- **Mini Programs (User/Merchant)**: Taro 4.x + React 18 + TypeScript + Sass
- **Admin Panel**: Vite + React 19 + TypeScript
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + Pydantic 2.x
- **Database**: PostgreSQL 15 + Redis 7
- **File Storage**: MinIO (S3-compatible, ports 9000/9001)

### Backend Structure
The FastAPI backend (`backend/app/`) is organized as a modular monolith:
- `api/` - API route handlers
- `models/` - SQLAlchemy database models
- `schemas/` - Pydantic request/response models
- `services/` - Business logic layer
- `core/` - Configuration, dependencies, utilities

### Service Domains (8 modules)
- **User**: Authentication, profiles, addresses, daily sign-in
- **Product**: Products, categories, inventory, search, tags (recommended/hot/group-buy)
- **Order**: Order lifecycle, status management, refunds
- **Payment**: WeChat Pay integration, callbacks, reconciliation
- **Delivery**: Zones, pickup points, time slots, fee calculation
- **Points**: Rules, sign-in rewards, order points, redemption
- **Activity**: Popups, coupons, group-buy campaigns, promotions
- **Message**: Template messages, SMS, in-app notifications

### Database Schema (19 tables)
Organized by domain:
- User: `users`, `user_addresses`, `sign_in_records`, `points_records`
- Product: `products`, `product_images`, `categories`
- Order: `orders`, `order_items`, `order_logs`, `payments`
- Group-buy: `group_buys`, `group_buy_members`
- Activity: `activities`, `activity_records`, `coupons`, `user_coupons`
- Delivery: `delivery_zones`, `pickup_points`
- Config: `point_rules`, `admins`, `merchants`

### Key Data Flows
- **Order**: Products → Delivery fees → Coupons → Order creation → WeChat Pay → Callbacks → Status update → Notifications
- **Group-Buy**: Activity initiation → Redis status cache → Member joins → Completion validation → Batch order creation
- **Points**: Sign-in/order completion → Points calculation → PostgreSQL record → Redis cache update

### Caching Strategy (Redis)
- Product data: 5-10 min TTL
- User points: 1 hour TTL (invalidated on update)
- Activity popups: 1 hour TTL
- Group-buy status: Real-time cache
- Sessions and rate limiting

### API Design
- RESTful with versioning: `/api/v1/`
- Response format: `{code, message, data, timestamp}`
- JWT authentication (7-day expiry) for user/merchant/admin roles
- Business error codes: 1xxx (user), 2xxx (product), 3xxx (order), 4xxx (payment), 5xxx (group-buy), 6xxx (points), 7xxx (coupon)

## Git Conventions
```
feat: 新功能        fix: 修复bug
docs: 文档更新      style: 代码格式化
refactor: 重构      test: 测试
chore: 构建/工具链
```

Branch strategy: `main` (prod), `develop` (dev), `feature/*`, `hotfix/*`

## Key Files
- `backend/main.py` - FastAPI entry point
- `backend/schema.sql` - Database initialization
- `docker-compose.yml` - PostgreSQL, Redis, MinIO services
- `docs/api/api-standards.md` - API design specs and error codes
- `scripts/` - Initialization and utility scripts
