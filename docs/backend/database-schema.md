# 数据库表结构定义

## 一、用户相关表

### 1.1 users - 用户表
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
    unionid VARCHAR(100) COMMENT '微信unionid',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(500) COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '手机号',
    points INTEGER DEFAULT 0 COMMENT '积分余额',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1正常 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);
```

### 1.2 user_addresses - 用户地址表
```sql
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(50) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) NOT NULL COMMENT '区县',
    address VARCHAR(500) NOT NULL COMMENT '详细地址',
    is_default SMALLINT DEFAULT 0 COMMENT '是否默认地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_addresses_user ON user_addresses(user_id);
```

### 1.3 sign_in_records - 签到记录表
```sql
CREATE TABLE sign_in_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sign_date DATE NOT NULL COMMENT '签到日期',
    points_gained INTEGER NOT NULL COMMENT '获得积分',
    consecutive_days INTEGER NOT NULL COMMENT '连续签到天数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, sign_date)
);

CREATE INDEX idx_signin_user ON sign_in_records(user_id);
CREATE INDEX idx_signin_date ON sign_in_records(sign_date);
```

### 1.4 points_records - 积分记录表
```sql
CREATE TABLE points_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type SMALLINT NOT NULL COMMENT '类型: 1签到 2订单 3兑换 4调整',
    points INTEGER NOT NULL COMMENT '积分变动(正数增加/负数减少)',
    balance INTEGER NOT NULL COMMENT '变动后余额',
    source VARCHAR(200) COMMENT '来源说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_points_user ON points_records(user_id);
CREATE INDEX idx_points_type ON points_records(type);
CREATE INDEX idx_points_created ON points_records(created_at);
```

## 二、商家相关表

### 2.1 merchants - 商家表
```sql
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '商家名称',
    logo VARCHAR(500) COMMENT 'Logo URL',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1正常 2冻结 3审核中',
    commission_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '佣金比例',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_status ON merchants(status);
```

## 三、商品相关表

### 3.1 categories - 商品分类表
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    parent_id INTEGER DEFAULT 0 COMMENT '父分类ID，0表示顶级分类',
    icon VARCHAR(500) COMMENT '分类图标',
    sort INTEGER DEFAULT 0 COMMENT '排序',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_category_parent ON categories(parent_id);
```

### 3.2 products - 商品表
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    main_image VARCHAR(500) NOT NULL COMMENT '主图URL',
    price DECIMAL(10,2) NOT NULL COMMENT '原价',
    group_price DECIMAL(10,2) COMMENT '拼团价',
    stock INTEGER DEFAULT 0 COMMENT '库存',
    sales_count INTEGER DEFAULT 0 COMMENT '销量',
    is_recommend SMALLINT DEFAULT 0 COMMENT '是否推荐: 0否 1是',
    is_hot SMALLINT DEFAULT 0 COMMENT '是否热卖: 0否 1是',
    is_group SMALLINT DEFAULT 0 COMMENT '是否拼团: 0否 1是',
    group_min_count INTEGER DEFAULT 2 COMMENT '拼团最少人数',
    group_max_count INTEGER DEFAULT 0 COMMENT '拼团最多人数，0表示无限制',
    group_expire_hours INTEGER DEFAULT 24 COMMENT '拼团有效期(小时)',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1上架 2下架',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_recommend ON products(is_recommend, status);
CREATE INDEX idx_products_hot ON products(is_hot, status);
CREATE INDEX idx_products_group ON products(is_group, status);
```

### 3.3 product_images - 商品图片表
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    sort INTEGER DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_image_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_product ON product_images(product_id);
```

## 四、订单相关表

### 4.1 orders - 订单表
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(32) UNIQUE NOT NULL COMMENT '订单号',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    address_id INTEGER REFERENCES user_addresses(id) ON DELETE SET NULL,
    delivery_type SMALLINT NOT NULL COMMENT '配送类型: 1自提 2配送',
    delivery_zone_id INTEGER REFERENCES delivery_zones(id) ON DELETE SET NULL,
    pickup_point_id INTEGER REFERENCES pickup_points(id) ON DELETE SET NULL,
    delivery_time TIMESTAMP COMMENT '配送时间',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
    delivery_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '配送费',
    final_amount DECIMAL(10,2) NOT NULL COMMENT '最终金额',
    points_used INTEGER DEFAULT 0 COMMENT '使用积分',
    points_gained INTEGER DEFAULT 0 COMMENT '获得积分',
    coupon_id INTEGER REFERENCES user_coupons(id) ON DELETE SET NULL,
    status SMALLINT DEFAULT 1 COMMENT '状态: 1待付款 2待发货 3待收货 4已完成 5已取消 6退款中 7已退款',
    payment_status SMALLINT DEFAULT 1 COMMENT '支付状态: 1待支付 2已支付 3已退款',
    payment_time TIMESTAMP COMMENT '支付时间',
    cancel_reason VARCHAR(500) COMMENT '取消原因',
    remark VARCHAR(500) COMMENT '订单备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_no ON orders(order_no);
```

### 4.2 order_items - 订单商品表
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(200) NOT NULL COMMENT '商品名称',
    product_image VARCHAR(500) NOT NULL COMMENT '商品图片',
    price DECIMAL(10,2) NOT NULL COMMENT '单价',
    quantity INTEGER NOT NULL COMMENT '数量',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '小计',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_items_order ON order_items(order_id);
```

### 4.3 order_logs - 订单日志表
```sql
CREATE TABLE order_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL COMMENT '操作',
    operator VARCHAR(50) COMMENT '操作人',
    remark VARCHAR(500) COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_order ON order_logs(order_id);
```

### 4.4 payments - 支付记录表
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_no VARCHAR(32) UNIQUE NOT NULL COMMENT '支付流水号',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    payment_method SMALLINT NOT NULL COMMENT '支付方式: 1微信支付',
    transaction_id VARCHAR(64) COMMENT '微信交易号',
    prepay_id VARCHAR(64) COMMENT '微信预支付ID',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1待支付 2已支付 3支付失败 4已退款',
    paid_at TIMESTAMP COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_no ON payments(payment_no);
```

## 五、拼团相关表

### 5.1 group_buys - 拼团表
```sql
CREATE TABLE group_buys (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    required_count INTEGER NOT NULL COMMENT '需要人数',
    current_count INTEGER DEFAULT 1 COMMENT '当前人数',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1进行中 2成功 3失败',
    expire_time TIMESTAMP NOT NULL COMMENT '过期时间',
    success_time TIMESTAMP COMMENT '成功时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_group_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_user FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_group_status ON group_buys(status);
CREATE INDEX idx_group_expire ON group_buys(expire_time);
```

### 5.2 group_buy_members - 拼团成员表
```sql
CREATE TABLE group_buy_members (
    id SERIAL PRIMARY KEY,
    group_buy_id INTEGER NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_member_group FOREIGN KEY (group_buy_id) REFERENCES group_buys(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_members_group ON group_buy_members(group_buy_id);
CREATE INDEX idx_members_user ON group_buy_members(user_id);
```

## 六、活动相关表

### 6.1 activities - 活动表
```sql
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE COMMENT '平台活动为NULL',
    type SMALLINT NOT NULL COMMENT '类型: 1弹窗 2优惠券 3促销',
    title VARCHAR(100) NOT NULL COMMENT '活动标题',
    image VARCHAR(500) COMMENT '活动图片',
    content TEXT COMMENT '活动内容',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP NOT NULL COMMENT '结束时间',
    display_rule SMALLINT NOT NULL COMMENT '展示规则: 1每日一次 2首次进入',
    priority INTEGER DEFAULT 0 COMMENT '优先级',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_time ON activities(start_time, end_time);
```

### 6.2 activity_records - 活动记录表
```sql
CREATE TABLE activity_records (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action SMALLINT NOT NULL COMMENT '动作: 1查看 2领取',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_record_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    CONSTRAINT fk_record_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_records_activity ON activity_records(activity_id);
CREATE INDEX idx_records_user ON activity_records(user_id);
```

### 6.3 coupons - 优惠券表
```sql
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    type SMALLINT NOT NULL COMMENT '类型: 1满减 2折扣 3无门槛',
    discount_amount DECIMAL(10,2) COMMENT '优惠金额',
    discount_rate DECIMAL(5,2) COMMENT '折扣率',
    min_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '最低消费',
    total_count INTEGER NOT NULL COMMENT '总数量',
    used_count INTEGER DEFAULT 0 COMMENT '已使用数',
    valid_days INTEGER NOT NULL COMMENT '有效天数',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_coupon_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE INDEX idx_coupons_activity ON coupons(activity_id);
```

### 6.4 user_coupons - 用户优惠券表
```sql
CREATE TABLE user_coupons (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status SMALLINT DEFAULT 1 COMMENT '状态: 1未使用 2已使用 3已过期',
    used_time TIMESTAMP COMMENT '使用时间',
    used_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    expire_time TIMESTAMP NOT NULL COMMENT '过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_coupon_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_coupon_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);
CREATE INDEX idx_user_coupons_expire ON user_coupons(expire_time);
```

## 七、配送相关表

### 7.1 delivery_zones - 配送小区表
```sql
CREATE TABLE delivery_zones (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL COMMENT '小区名称',
    address VARCHAR(500) NOT NULL COMMENT '地址',
    delivery_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '配送费',
    min_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '起送金额',
    delivery_times JSONB COMMENT '配送时间段',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_zone_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_zones_merchant ON delivery_zones(merchant_id);
```

### 7.2 pickup_points - 自提点表
```sql
CREATE TABLE pickup_points (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL COMMENT '自提点名称',
    address VARCHAR(500) NOT NULL COMMENT '地址',
    contact VARCHAR(50) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '联系电话',
    pickup_times JSONB COMMENT '自提时间段',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pickup_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE INDEX idx_pickups_merchant ON pickup_points(merchant_id);
```

## 八、系统配置表

### 8.1 point_rules - 积分规则表
```sql
CREATE TABLE point_rules (
    id SERIAL PRIMARY KEY,
    type SMALLINT NOT NULL UNIQUE COMMENT '类型: 1签到 2订单 3兑换',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    points INTEGER NOT NULL DEFAULT 0 COMMENT '积分值',
    ratio DECIMAL(5,2) DEFAULT 0.00 COMMENT '比例(订单积分使用，每X元得1积分)',
    description VARCHAR(500) COMMENT '描述',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1启用 2禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rules_type ON point_rules(type);
```

### 8.2 admins - 管理员表
```sql
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) COMMENT '真实姓名',
    role SMALLINT NOT NULL COMMENT '角色: 1超级管理员 2运营 3财务 4客服 5系统',
    status SMALLINT DEFAULT 1 COMMENT '状态: 1正常 2禁用',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_username ON admins(username);
```

## 九、初始数据

### 9.1 积分规则初始数据
```sql
INSERT INTO point_rules (type, rule_name, points, ratio, description, status) VALUES
(1, '每日签到积分', 5, 0.00, '每日签到获得5积分', 1),
(2, '订单积分比例', 0, 10.00, '每消费10元获得1积分', 1);
```
