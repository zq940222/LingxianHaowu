# 数据库脚本

## 目录结构

```
database/
├── init.sql          # 完整初始化脚本（包含表结构+初始数据）
└── README.md         # 本文档
```

## 使用方法

### 初始化数据库

**方式1: Docker (推荐)**

```bash
# PowerShell
Get-Content database/init.sql | docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu

# Linux/Mac
docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu < database/init.sql
```

**方式2: 直接连接**

```bash
psql -U postgres -d lingxian_haowu -f database/init.sql
```

### 重置管理员密码

如果管理员密码验证失败，使用以下命令重置：

```bash
cd backend
python ../scripts/reset-admin-password.py
```

## 初始数据

初始化脚本包含以下测试数据：

| 类型 | 数量 | 说明 |
|------|------|------|
| 管理员 | 1 | admin / admin123 |
| 积分规则 | 4 | 签到、订单、首单、评价 |
| 商家 | 1 | 测试商家 |
| 商品分类 | 5 | 蔬菜、水果、肉类、海鲜、蛋奶 |
| 配送区域 | 2 | 市中心、东区 |
| 自提点 | 2 | 中心广场、东区超市 |
| 模板消息 | 3 | 支付、发货、签到通知 |

## 表结构说明

### 系统配置
- `admins` - 管理员表
- `point_rules` - 积分规则表

### 商家
- `merchants` - 商家表

### 用户
- `users` - 用户表
- `user_addresses` - 用户地址表
- `sign_in_records` - 签到记录表
- `points_records` - 积分记录表

### 商品
- `categories` - 商品分类表
- `products` - 商品表
- `product_images` - 商品图片表

### 配送
- `delivery_zones` - 配送区域表
- `pickup_points` - 自提点表

### 活动
- `activities` - 活动表
- `activity_records` - 活动记录表
- `coupons` - 优惠券表
- `user_coupons` - 用户优惠券表

### 订单
- `orders` - 订单表
- `order_items` - 订单商品表
- `order_logs` - 订单日志表
- `payments` - 支付记录表

### 拼团
- `group_buys` - 拼团表
- `group_buy_members` - 拼团成员表

### 消息
- `template_messages` - 模板消息配置表
- `message_logs` - 消息发送记录表
- `internal_messages` - 站内消息表
- `sms_logs` - 短信发送记录表
