# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Common Commands

### Backend Development
```bash
# Create and activate Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run single test file
pytest tests/test_orders.py

# Run database migrations
alembic upgrade head
```

### Frontend (Mini Program)
```bash
cd frontend/mini

# Install dependencies
npm install

# Start WeChat mini program development
npm run dev:weapp

# Build for production
npm run build:weapp

# Lint code
npm run lint
```

### Frontend (Admin Panel)
```bash
cd frontend/admin

# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build

# Lint code
npm run lint
```

### Docker Operations
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend
```

### Database
```bash
# Create database
createdb lingxian_haowu

# Run schema initialization
psql -d lingxian_haowu -f backend/schema.sql

# Connect to database
psql -d lingxian_haowu

# Backup database
docker exec lingxian-postgres pg_dump -U postgres lingxian_haowu > backup.sql

# Restore database
cat backup.sql | docker exec -i lingxian-postgres psql -U postgres lingxian_haowu
```

## Architecture Overview

This is a multi-terminal fresh food e-commerce platform consisting of three frontends (user mini-program, merchant mini-program, PC admin panel) and a FastAPI backend.

### System Architecture

The system follows a layered architecture:
- **Frontend Layer**: Two Taro-based WeChat mini-programs (user/merchant) and Vue 3 admin panel
- **API Gateway Layer**: Nginx for reverse proxy and load balancing
- **Application Layer**: FastAPI monolithic application with domain-driven design (DDD) modular organization
- **Data Access Layer**: SQLAlchemy 2.0 ORM with async support
- **Data Layer**: PostgreSQL for persistent storage, Redis for caching
- **External Services**: WeChat mini-program APIs, WeChat payment APIs, OSS for file storage

### Backend Structure

The backend is organized as a modular monolith with 8 core service modules:

**User Service**: Handles authentication, user profiles, address management, and daily sign-in
**Product Service**: Manages products, categories, inventory, search, and product tags (recommended/hot/group-buy)
**Order Service**: Order creation, status management, queries, and refund processing
**Payment Service**: WeChat payment integration, payment callbacks, status queries, refunds, and reconciliation
**Delivery Service**: Delivery zones, pickup points, delivery time slots, fee calculation, and route planning
**Points Service**: Points rules configuration, sign-in rewards, order points calculation, points history, and redemption
**Activity Service**: Popup configuration, activity display logic, coupon management, group-buy campaigns, and promotions
**Message Service**: Template messages, SMS notifications, and in-app messages

### Key Data Flow Patterns

**Order Creation Flow**: User selects products → Product Service queries details → Delivery Service calculates fees → Activity Service fetches coupons → Order Service creates order → Payment Service initiates WeChat payment → Payment callback updates status → Order Service updates order status → Message Service notifications

**Group-Buy Flow**: Activity Service initiates group → Redis caches group status → Friends join → Activity Service validates completion → Order Service creates orders → Payment Service processes payments → Success/failure triggers Message Service notifications to all participants

**Points Flow**: User sign-in → Points Service awards points → PostgreSQL records → Redis updates cache; Order completion → Order Service notifies Points Service → Points Service calculates points → PostgreSQL records → Redis updates cache

### Caching Strategy

Redis is heavily used for performance:
- Product lists and details (5-10 min TTL)
- User points (1 hour TTL, invalidated on update)
- Activity popups (1 hour TTL)
- Group-buy status (real-time cache)
- Session storage and rate limiting

### Database Schema

PostgreSQL database with 19 core tables organized by domain:
- User domain: users, user_addresses, sign_in_records, points_records
- Merchant domain: merchants
- Product domain: products, product_images, categories
- Order domain: orders, order_items, order_logs, payments
- Group-buy domain: group_buys, group_buy_members
- Activity domain: activities, activity_records, coupons, user_coupons
- Delivery domain: delivery_zones, pickup_points
- Configuration: point_rules, admins

Key relationships: Users have many orders and addresses; Products belong to merchants and categories; Orders contain order items; Group buys have members; Activities have coupons and user records.

### Frontend Applications

**Mini Programs (Taro)**: Share codebase between user and merchant terminals. Uses TDesign components, Zustand for state management. User app focuses on shopping flow; Merchant app focuses on order processing and resource management.

**Admin Panel (Vue 3)**: Element Plus UI, Pinia state management, Vue Router. Provides data dashboard, merchant/user management, system configuration, and monitoring.

### API Design

RESTful API with versioning (/api/v1). Consistent response format with code, message, data, and timestamp. JWT authentication for all three user roles (7-day expiry). Business error codes in 1000-1999 range.

### Security & Performance

Authentication via JWT tokens, password encryption with bcrypt, sensitive data AES encrypted, HTTPS enforced. Rate limiting with Redis sliding window. Payment callbacks require signature verification.

Performance optimizations: Database indexes on frequent query fields, read/write separation planned, order tables sharded by month. Async processing for payment callbacks and message notifications using Celery.

### Deployment

Docker-based deployment with docker-compose orchestrating PostgreSQL, Redis, FastAPI backend, and Nginx. CI/CD via GitHub Actions for testing, building, and deploying. Health check endpoints for monitoring. Database backups automated with cron jobs.

### Development Workflow

Feature branches from `develop`, merged to `main` after review. Git commit format: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`. Documentation in `docs/` directory includes requirements, architecture, database schemas, API specs, and deployment guides.
