# 灵鲜好物 - SDD文档导航

> 微信小程序卖菜平台 - 软件设计文档(SDD)

## 文档索引

### 1. 需求分析
- [用户端需求](./frontend/user-requirements.md)
- [商家端需求](./frontend/merchant-requirements.md)
- [PC后台需求](./frontend/admin-requirements.md)

### 2. 系统架构设计
- [技术架构](./backend/system-architecture.md)
- [部署架构](./deployment/deployment-architecture.md)

### 3. 数据库设计
- [ER图设计](./backend/database-er.md)
- [表结构定义](./backend/database-schema.md)

### 4. API接口设计
- [API规范说明](./api/api-standards.md)
- [用户相关接口](./api/user-api.md)
- [商品相关接口](./api/product-api.md)
- [订单相关接口](./api/order-api.md)
- [支付相关接口](./api/payment-api.md)
- [配送相关接口](./api/delivery-api.md)
- [积分相关接口](./api/points-api.md)
- [活动相关接口](./api/activity-api.md)

### 5. 部署指南
- [环境配置](./deployment/environment-setup.md)
- [CI/CD流程](./deployment/cicd-guide.md)
- [监控方案](./deployment/monitoring.md)

## 项目概述

**项目名称**: 灵鲜好物
**项目类型**: 微信小程序卖菜平台
**技术栈**:
- 前端: Taro 3.x + React + TDesign
- 后端: Python FastAPI + PostgreSQL + Redis
- PC后台: Vue3 + Element Plus

**核心功能**:
- 推荐商品、热卖商品、拼团商品
- 积分系统（签到、订单积分）
- 配送管理（自提/定时配送）
- 微信支付
- 活动弹窗（优惠券/促销活动）

**开发周期**: 1个月快速上线
