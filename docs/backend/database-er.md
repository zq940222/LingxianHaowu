# 数据库ER图设计

## 一、核心实体关系

### 1.1 用户相关实体

```
用户 (users)
├── 1:N ── 用户地址 (user_addresses)
├── 1:N ── 订单 (orders)
├── 1:N ── 签到记录 (sign_in_records)
├── 1:N ── 积分记录 (points_records)
├── 1:N ── 优惠券 (user_coupons)
└── 1:N ── 活动记录 (activity_records)
```

### 1.2 商家相关实体

```
商家 (merchants)
├── 1:N ── 商品 (products)
├── 1:N ── 订单 (orders)
├── 1:N ── 配送小区 (delivery_zones)
├── 1:N ── 自提点 (pickup_points)
└── 1:N ── 活动 (activities)
```

### 1.3 商品相关实体

```
商品 (products)
├── 1:N ── 商品规格 (product_specs)
├── 1:N ── 商品图片 (product_images)
├── 1:N ── 订单商品 (order_items)
├── 1:N ── 拼团记录 (group_buy_records)
├── N:1 ── 商品分类 (categories)
└── N:1 ── 商家 (merchants)
```

### 1.4 订单相关实体

```
订单 (orders)
├── 1:N ── 订单商品 (order_items)
├── 1:N ── 订单日志 (order_logs)
├── N:1 ── 用户 (users)
├── N:1 ── 商家 (merchants)
├── N:1 ── 用户地址 (user_addresses)
└── N:1 ── 配送小区/自提点 (delivery_zones/pickup_points)
```

### 1.5 拼团相关实体

```
拼团 (group_buys)
├── 1:N ── 拼团成员 (group_buy_members)
├── N:1 ── 商品 (products)
└── N:1 ── 发起用户 (users)
```

### 1.6 活动相关实体

```
活动 (activities)
├── 1:N ── 优惠券 (coupons)
├── 1:N ── 用户优惠券 (user_coupons)
├── 1:N ── 活动记录 (activity_records)
└── 1:N ── 活动商品 (activity_products)
```

## 二、完整ER图

```
┌─────────────────┐
│    users        │ 用户表
├─────────────────┤
│ id (PK)         │
│ openid          │ 微信openid
│ unionid         │ 微信unionid
│ nickname        │ 昵称
│ avatar          │ 头像
│ phone           │ 手机号
│ points          │ 积分
│ status          │ 状态
│ created_at      │
│ updated_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│ user_addresses  │ 用户地址表
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ receiver_name   │ 收货人
│ phone           │ 电话
│ province        │ 省份
│ city            │ 城市
│ district        │ 区县
│ address         │ 详细地址
│ is_default      │ 是否默认
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  merchants      │ 商家表
├─────────────────┤
│ id (PK)         │
│ name            │ 商家名称
│ logo            │ Logo
│ phone           │ 联系电话
│ status          │ 状态
│ commission_rate │ 佣金比例
│ created_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  products       │ 商品表
├─────────────────┤
│ id (PK)         │
│ merchant_id(FK) │
│ category_id(FK) │
│ name            │ 商品名称
│ description     │ 描述
│ main_image      │ 主图
│ price           │ 原价
│ group_price     │ 拼团价
│ stock           │ 库存
│ sales_count     │ 销量
│ is_recommend    │ 是否推荐
│ is_hot          │ 是否热卖
│ is_group        │ 是否拼团
│ group_min_count │ 拼团最少人数
│ status          │ 状态
│ created_at      │
│ updated_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│ product_images  │ 商品图片表
├─────────────────┤
│ id (PK)         │
│ product_id(FK)  │
│ image_url       │ 图片URL
│ sort            │ 排序
│ created_at      │
└─────────────────┘

┌─────────────────┐
│   categories    │ 商品分类表
├─────────────────┤
│ id (PK)         │
│ name            │ 分类名称
│ parent_id       │ 父分类ID
│ icon            │ 图标
│ sort            │ 排序
│ status          │ 状态
└─────────────────┘

┌─────────────────┐
│    orders       │ 订单表
├─────────────────┤
│ id (PK)         │
│ order_no        │ 订单号
│ user_id (FK)    │
│ merchant_id(FK) │
│ address_id (FK) │
│ delivery_type   │ 配送类型(1自提/2配送)
│ delivery_zone_id│ 配送小区ID
│ delivery_time   │ 配送时间
│ total_amount    │ 订单总金额
│ discount_amount │ 优惠金额
│ delivery_fee    │ 配送费
│ final_amount    │ 最终金额
│ points_used     │ 使用积分
│ points_gained   │ 获得积分
│ coupon_id       │ 优惠券ID
│ status          │ 状态
│ payment_status  │ 支付状态
│ payment_time    │ 支付时间
│ created_at      │
│ updated_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│  order_items    │ 订单商品表
├─────────────────┤
│ id (PK)         │
│ order_id (FK)   │
│ product_id(FK)  │
│ spec_id         │ 规格ID
│ product_name    │ 商品名称
│ product_image   │ 商品图片
│ price           │ 单价
│ quantity        │ 数量
│ total_amount    │ 小计
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  order_logs     │ 订单日志表
├─────────────────┤
│ id (PK)         │
│ order_id (FK)   │
│ action          │ 操作
│ operator        │ 操作人
│ remark          │ 备注
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  group_buys    │ 拼团表
├─────────────────┤
│ id (PK)         │
│ product_id (FK) │
│ initiator_id(FK)│ 发起人ID
│ required_count  │ 需要人数
│ current_count   │ 当前人数
│ status          │ 状态(1进行中/2成功/3失败)
│ expire_time     │ 过期时间
│ created_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│group_buy_members│ 拼团成员表
├─────────────────┤
│ id (PK)         │
│ group_buy_id(FK)│
│ user_id (FK)    │
│ order_id (FK)   │
│ join_time       │ 加入时间
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  activities    │ 活动表
├─────────────────┤
│ id (PK)         │
│ merchant_id(FK) │
│ type            │ 类型(1弹窗/2优惠券/3促销)
│ title           │ 活动标题
│ image           │ 活动图片
│ content         │ 活动内容
│ start_time      │ 开始时间
│ end_time        │ 结束时间
│ display_rule    │ 展示规则(1每日一次/2首次进入)
│ status          │ 状态
│ created_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│activity_records │ 活动记录表
├─────────────────┤
│ id (PK)         │
│ activity_id(FK) │
│ user_id (FK)    │
│ action          │ 动作(1查看/2领取)
│ created_at      │
└─────────────────┘

┌─────────────────┐
│    coupons     │ 优惠券表
├─────────────────┤
│ id (PK)         │
│ activity_id(FK) │
│ name            │ 优惠券名称
│ type            │ 类型(1满减/2折扣/3无门槛)
│ discount_amount │ 优惠金额
│ discount_rate   │ 折扣率
│ min_amount      │ 最低消费
│ total_count     │ 总数量
│ used_count      │ 已使用数
│ valid_days      │ 有效天数
│ status          │ 状态
│ created_at      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────▼──────────┐
│ user_coupons   │ 用户优惠券表
├─────────────────┤
│ id (PK)         │
│ coupon_id (FK)  │
│ user_id (FK)    │
│ status          │ 状态(1未使用/2已使用/3已过期)
│ used_time       │ 使用时间
│ expire_time     │ 过期时间
└─────────────────┘

┌─────────────────┐
│sign_in_records  │ 签到记录表
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ sign_date       │ 签到日期
│ points_gained   │ 获得积分
│ consecutive_days│ 连续签到天数
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ points_records  │ 积分记录表
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │ 类型(1签到/2订单/3兑换/4调整)
│ points          │ 积分变动
│ balance         │ 变动后余额
│ source          │ 来源说明
│ created_at      │
└─────────────────┘

┌─────────────────┐
│ delivery_zones  │ 配送小区表
├─────────────────┤
│ id (PK)         │
│ merchant_id(FK) │
│ name            │ 小区名称
│ address         │ 地址
│ delivery_fee    │ 配送费
│ min_amount      │ 起送金额
│ delivery_times  │ 配送时间段(JSON)
│ status          │ 状态
└─────────────────┘

┌─────────────────┐
│ pickup_points   │ 自提点表
├─────────────────┤
│ id (PK)         │
│ merchant_id(FK) │
│ name            │ 自提点名称
│ address         │ 地址
│ contact         │ 联系人
│ phone           │ 电话
│ pickup_times    │ 自提时间段(JSON)
│ status          │ 状态
└─────────────────┘

┌─────────────────┐
│  payments      │ 支付记录表
├─────────────────┤
│ id (PK)         │
│ order_id (FK)   │
│ user_id (FK)    │
│ payment_no      │ 支付流水号
│ amount          │ 支付金额
│ payment_method  │ 支付方式
│ transaction_id  │ 微信交易号
│ status          │ 状态
│ paid_at         │ 支付时间
└─────────────────┘

┌─────────────────┐
│   admins       │ 管理员表
├─────────────────┤
│ id (PK)         │
│ username        │ 用户名
│ password_hash   │ 密码哈希
│ real_name       │ 真实姓名
│ role            │ 角色
│ status          │ 状态
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  point_rules   │ 积分规则表
├─────────────────┤
│ id (PK)         │
│ type            │ 类型(1签到/2订单/3兑换)
│ rule_name       │ 规则名称
│ points          │ 积分值
│ ratio           │ 比例(订单积分使用)
│ description     │ 描述
│ status          │ 状态
└─────────────────┘
```

## 三、关系说明

### 3.1 一对多关系 (1:N)
- 用户 → 用户地址
- 用户 → 订单
- 用户 → 签到记录
- 用户 → 积分记录
- 商家 → 商品
- 商家 → 配送小区
- 商家 → 自提点
- 商家 → 活动
- 商品 → 商品图片
- 订单 → 订单商品
- 订单 → 订单日志
- 活动 → 活动记录
- 优惠券 → 用户优惠券

### 3.2 多对一关系 (N:1)
- 用户地址 → 用户
- 订单 → 用户
- 订单 → 商家
- 订单 → 用户地址
- 商品 → 商家
- 商品 → 商品分类
- 订单商品 → 订单
- 订单商品 → 商品

### 3.3 多对多关系 (M:N)
- 用户 ↔ 拼团（通过拼团成员表）
- 活动 ↔ 用户（通过活动记录表）
- 活动 ↔ 商品（通过活动商品表）

## 四、索引设计

### 4.1 核心索引
```sql
-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);

-- 商品表索引
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_recommend ON products(is_recommend);
CREATE INDEX idx_products_hot ON products(is_hot);
CREATE INDEX idx_products_group ON products(is_group);

-- 订单表索引
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_no ON orders(order_no);

-- 拼团表索引
CREATE INDEX idx_group_status ON group_buys(status);
CREATE INDEX idx_group_expire ON group_buys(expire_time);
```

### 4.2 复合索引
```sql
-- 商品查询优化
CREATE INDEX idx_products_cat_status ON products(category_id, status);
CREATE INDEX idx_products_hot_status ON products(is_hot, status);

-- 订单查询优化
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_merchant_status ON orders(merchant_id, status);
```
