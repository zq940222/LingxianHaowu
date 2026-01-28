-- ============================================
-- 灵鲜好物 - 数据库初始化脚本
-- PostgreSQL 15+
-- 版本: 1.0.0
-- 更新时间: 2026-01-28
-- ============================================
--
-- 使用方法:
-- docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu < database/init.sql
--
-- 或者在 PowerShell 中:
-- Get-Content database/init.sql | docker exec -i lingxian-postgres psql -U postgres -d lingxian_haowu
--
-- ============================================

-- 删除已存在的表（按依赖关系倒序）
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS internal_messages CASCADE;
DROP TABLE IF EXISTS message_logs CASCADE;
DROP TABLE IF EXISTS template_messages CASCADE;

DROP TABLE IF EXISTS order_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

DROP TABLE IF EXISTS group_buy_members CASCADE;
DROP TABLE IF EXISTS group_buys CASCADE;

DROP TABLE IF EXISTS user_coupons CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS activity_records CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

DROP TABLE IF EXISTS pickup_points CASCADE;
DROP TABLE IF EXISTS delivery_zones CASCADE;

DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

DROP TABLE IF EXISTS points_records CASCADE;
DROP TABLE IF EXISTS sign_in_records CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS merchants CASCADE;

DROP TABLE IF EXISTS point_rules CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- ============================================
-- 一、系统配置表
-- ============================================

-- 1.1 管理员表
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    role SMALLINT NOT NULL DEFAULT 1,          -- 1-超级管理员 2-普通管理员
    status SMALLINT DEFAULT 1,                  -- 0-禁用 1-正常
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_username ON admins(username);
COMMENT ON TABLE admins IS '管理员表';

-- 1.2 积分规则表
CREATE TABLE point_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                 -- 规则名称
    type VARCHAR(20) NOT NULL UNIQUE,           -- sign_in, order, first_order, invite, birthday, review
    points INTEGER NOT NULL DEFAULT 0,          -- 积分数量
    daily_limit INTEGER DEFAULT 0,              -- 每日上限，0表示无限制
    description VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rules_type ON point_rules(type);
COMMENT ON TABLE point_rules IS '积分规则表';

-- ============================================
-- 二、商家相关表
-- ============================================

-- 2.1 商家表
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(500),
    phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(50),
    address VARCHAR(500),
    business_hours VARCHAR(100),
    description TEXT,
    status SMALLINT DEFAULT 1,                  -- 0-禁用 1-正常
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_status ON merchants(status);
COMMENT ON TABLE merchants IS '商家表';

-- ============================================
-- 三、用户相关表
-- ============================================

-- 3.1 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL,
    unionid VARCHAR(100),
    nickname VARCHAR(50),
    avatar VARCHAR(500),
    phone VARCHAR(20),
    total_points INTEGER DEFAULT 0,
    status SMALLINT DEFAULT 1,                  -- 0-禁用 1-正常
    last_sign_in_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);
COMMENT ON TABLE users IS '用户表';

-- 3.2 用户地址表
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- 收货人姓名
    phone VARCHAR(20) NOT NULL,
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    full_address VARCHAR(500) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON user_addresses(user_id);
COMMENT ON TABLE user_addresses IS '用户地址表';

-- 3.3 签到记录表
CREATE TABLE sign_in_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sign_date DATE NOT NULL,
    points_gained INTEGER NOT NULL,
    consecutive_days INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sign_date)
);

CREATE INDEX idx_signin_user ON sign_in_records(user_id);
CREATE INDEX idx_signin_date ON sign_in_records(sign_date);
COMMENT ON TABLE sign_in_records IS '签到记录表';

-- 3.4 积分记录表
CREATE TABLE points_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,                  -- sign_in, order, redeem, expire等
    points INTEGER NOT NULL,                    -- 正数增加，负数减少
    balance INTEGER NOT NULL,                   -- 变动后余额
    source VARCHAR(200),                        -- 来源描述
    reference_id INTEGER,                       -- 关联ID（订单ID等）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_user ON points_records(user_id);
CREATE INDEX idx_points_type ON points_records(type);
CREATE INDEX idx_points_created ON points_records(created_at);
COMMENT ON TABLE points_records IS '积分记录表';

-- ============================================
-- 四、商品相关表
-- ============================================

-- 4.1 商品分类表
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    parent_id INTEGER DEFAULT 0,
    icon VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_parent ON categories(parent_id);
COMMENT ON TABLE categories IS '商品分类表';

-- 4.2 商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    main_image VARCHAR(500) NOT NULL,
    price INTEGER NOT NULL,                     -- 单位：分
    original_price INTEGER,                     -- 原价，单位：分
    group_price INTEGER,                        -- 拼团价，单位：分
    stock INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    is_recommended BOOLEAN DEFAULT FALSE,       -- 推荐商品
    is_hot BOOLEAN DEFAULT FALSE,               -- 热卖商品
    is_group_buy BOOLEAN DEFAULT FALSE,         -- 可拼团
    group_min_count INTEGER DEFAULT 2,          -- 拼团最少人数
    group_max_count INTEGER DEFAULT 0,          -- 拼团最多人数，0表示不限
    group_expire_hours INTEGER DEFAULT 24,      -- 拼团过期时间（小时）
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_recommend ON products(is_recommended, is_active);
CREATE INDEX idx_products_hot ON products(is_hot, is_active);
CREATE INDEX idx_products_group ON products(is_group_buy, is_active);
COMMENT ON TABLE products IS '商品表';

-- 4.3 商品图片表
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_images_product ON product_images(product_id);
COMMENT ON TABLE product_images IS '商品图片表';

-- ============================================
-- 五、配送相关表
-- ============================================

-- 5.1 配送区域表
CREATE TABLE delivery_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    areas TEXT,                                 -- 覆盖区域描述
    delivery_fee INTEGER DEFAULT 0,             -- 配送费，单位：分
    free_delivery_amount INTEGER DEFAULT 0,     -- 免配送费门槛，单位：分
    delivery_time VARCHAR(100),                 -- 配送时间说明
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zones_active ON delivery_zones(is_active);
COMMENT ON TABLE delivery_zones IS '配送区域表';

-- 5.2 自提点表
CREATE TABLE pickup_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    contact_name VARCHAR(50),
    longitude DECIMAL(10,6),
    latitude DECIMAL(10,6),
    business_hours VARCHAR(100),                -- 营业时间，如 "09:00-21:00"
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pickups_active ON pickup_points(is_active);
COMMENT ON TABLE pickup_points IS '自提点表';

-- ============================================
-- 六、活动相关表
-- ============================================

-- 6.1 活动表
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,                  -- popup, banner, groupbuy
    image VARCHAR(500),
    link VARCHAR(500),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_active ON activities(is_active);
CREATE INDEX idx_activities_time ON activities(start_time, end_time);
COMMENT ON TABLE activities IS '活动表';

-- 6.2 活动记录表
CREATE TABLE activity_records (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,                -- view, click, join等
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_records_activity ON activity_records(activity_id);
CREATE INDEX idx_records_user ON activity_records(user_id);
COMMENT ON TABLE activity_records IS '活动记录表';

-- 6.3 优惠券表
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,                  -- fixed-满减, percent-折扣
    value INTEGER NOT NULL,                     -- fixed时为分，percent时为折扣值(如85表示8.5折)
    min_amount INTEGER DEFAULT 0,               -- 使用门槛，单位：分
    total_count INTEGER NOT NULL,               -- 发放总量
    claimed_count INTEGER DEFAULT 0,            -- 已领取数量
    used_count INTEGER DEFAULT 0,               -- 已使用数量
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_active ON coupons(is_active);
CREATE INDEX idx_coupons_time ON coupons(start_time, end_time);
COMMENT ON TABLE coupons IS '优惠券表';

-- 6.4 用户优惠券表
CREATE TABLE user_coupons (
    id SERIAL PRIMARY KEY,
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status SMALLINT DEFAULT 1,                  -- 1-未使用 2-已使用 3-已过期
    used_time TIMESTAMP,
    used_order_id INTEGER,
    expire_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);
CREATE INDEX idx_user_coupons_expire ON user_coupons(expire_time);
COMMENT ON TABLE user_coupons IS '用户优惠券表';

-- ============================================
-- 七、订单相关表
-- ============================================

-- 7.1 订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(32) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,

    -- 配送信息
    delivery_type VARCHAR(20) NOT NULL,         -- delivery-配送, pickup-自提
    address_snapshot JSONB,                     -- 收货地址快照
    pickup_point VARCHAR(200),                  -- 自提点信息
    delivery_time VARCHAR(100),                 -- 期望送达时间

    -- 金额信息（单位：分）
    total_amount INTEGER NOT NULL,              -- 商品总额
    discount_amount INTEGER DEFAULT 0,          -- 优惠金额
    delivery_fee INTEGER DEFAULT 0,             -- 配送费
    pay_amount INTEGER NOT NULL,                -- 实付金额

    -- 积分和优惠券
    points_used INTEGER DEFAULT 0,
    points_gained INTEGER DEFAULT 0,
    coupon_id INTEGER,

    -- 状态
    status VARCHAR(20) DEFAULT 'pending_payment', -- pending_payment, pending_confirm, processing, shipping, completed, cancelled, refunding, refunded
    payment_method VARCHAR(20),                 -- wechat等
    payment_time TIMESTAMP,

    remark VARCHAR(500),
    cancel_reason VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_no ON orders(order_no);
COMMENT ON TABLE orders IS '订单表';

-- 7.2 订单商品表
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image VARCHAR(500),
    spec VARCHAR(100),                          -- 规格
    price INTEGER NOT NULL,                     -- 单价，单位：分
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_order ON order_items(order_id);
COMMENT ON TABLE order_items IS '订单商品表';

-- 7.3 订单日志表
CREATE TABLE order_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    operator VARCHAR(50),
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_order ON order_logs(order_id);
COMMENT ON TABLE order_logs IS '订单日志表';

-- 7.4 支付记录表
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    payment_no VARCHAR(32) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,                    -- 单位：分
    payment_method VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(64),                 -- 第三方交易号
    prepay_id VARCHAR(64),
    status SMALLINT DEFAULT 1,                  -- 1-待支付 2-已支付 3-已退款 4-支付失败
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_no ON payments(payment_no);
COMMENT ON TABLE payments IS '支付记录表';

-- ============================================
-- 八、拼团相关表
-- ============================================

-- 8.1 拼团表
CREATE TABLE group_buys (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    initiator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    required_count INTEGER NOT NULL,            -- 需要人数
    current_count INTEGER DEFAULT 1,            -- 当前人数
    status SMALLINT DEFAULT 1,                  -- 1-进行中 2-成功 3-失败
    expire_time TIMESTAMP NOT NULL,
    success_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_group_status ON group_buys(status);
CREATE INDEX idx_group_expire ON group_buys(expire_time);
COMMENT ON TABLE group_buys IS '拼团表';

-- 8.2 拼团成员表
CREATE TABLE group_buy_members (
    id SERIAL PRIMARY KEY,
    group_buy_id INTEGER NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_buy_id, user_id)
);

CREATE INDEX idx_members_group ON group_buy_members(group_buy_id);
CREATE INDEX idx_members_user ON group_buy_members(user_id);
COMMENT ON TABLE group_buy_members IS '拼团成员表';

-- ============================================
-- 九、消息相关表
-- ============================================

-- 9.1 模板消息配置表
CREATE TABLE template_messages (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    example TEXT,
    type SMALLINT NOT NULL,                     -- 1-签到 2-订单 3-发货 4-活动
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_type ON template_messages(type);
COMMENT ON TABLE template_messages IS '模板消息配置表';

-- 9.2 消息发送记录表
CREATE TABLE message_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type SMALLINT NOT NULL,
    template_id VARCHAR(64),
    content TEXT,
    data JSONB,
    send_status SMALLINT DEFAULT 0,             -- 0-待发送 1-已发送 2-发送失败
    error_msg TEXT,
    send_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_msg_logs_user ON message_logs(user_id);
CREATE INDEX idx_msg_logs_type ON message_logs(message_type);
CREATE INDEX idx_msg_logs_status ON message_logs(send_status);
COMMENT ON TABLE message_logs IS '消息发送记录表';

-- 9.3 站内消息表
CREATE TABLE internal_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    message_type SMALLINT DEFAULT 1,            -- 1-系统 2-订单 3-活动
    is_read BOOLEAN DEFAULT FALSE,
    read_time TIMESTAMP,
    reference_type VARCHAR(20),                 -- order, activity等
    reference_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_internal_user ON internal_messages(user_id);
CREATE INDEX idx_internal_read ON internal_messages(is_read);
COMMENT ON TABLE internal_messages IS '站内消息表';

-- 9.4 短信发送记录表
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    template_code VARCHAR(50),
    content TEXT NOT NULL,
    send_status SMALLINT DEFAULT 0,
    error_msg TEXT,
    send_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_phone ON sms_logs(phone);
CREATE INDEX idx_sms_status ON sms_logs(send_status);
COMMENT ON TABLE sms_logs IS '短信发送记录表';

-- ============================================
-- 十、初始数据
-- ============================================

-- 10.1 创建管理员账号
-- 默认密码: admin123
-- 注意: 如果密码验证失败，请使用 scripts/reset-admin-password.py 重新生成密码哈希
INSERT INTO admins (username, password_hash, real_name, phone, email, role, status)
VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqT8YjgKq9K', '超级管理员', '13800000001', 'admin@lingxian.com', 1, 1);

-- 10.2 积分规则
INSERT INTO point_rules (name, type, points, daily_limit, description, is_active)
VALUES
('每日签到', 'sign_in', 10, 1, '每日签到获得10积分', TRUE),
('订单奖励', 'order', 1, 0, '每消费1元获得1积分', TRUE),
('首单奖励', 'first_order', 100, 1, '首次下单获得100积分', TRUE),
('评价奖励', 'review', 5, 5, '评价订单获得5积分', TRUE);

-- 10.3 测试商家
INSERT INTO merchants (name, logo, phone, contact_name, address, business_hours, description, status)
VALUES
('灵鲜生鲜店', 'https://via.placeholder.com/200', '13800138000', '张店长', '测试市测试区测试路123号', '08:00-22:00', '新鲜直达，品质保证', 1);

-- 10.4 商品分类
INSERT INTO categories (name, parent_id, icon, sort_order, is_active) VALUES
('蔬菜', 0, NULL, 1, TRUE),
('水果', 0, NULL, 2, TRUE),
('肉类', 0, NULL, 3, TRUE),
('海鲜', 0, NULL, 4, TRUE),
('蛋奶', 0, NULL, 5, TRUE);

-- 10.5 配送区域
INSERT INTO delivery_zones (name, areas, delivery_fee, free_delivery_amount, delivery_time, sort_order, is_active)
VALUES
('市中心', '市中心3公里范围', 500, 5000, '每日9:00-21:00', 1, TRUE),
('东区', '东区配送范围', 600, 6000, '每日9:00-20:00', 2, TRUE);

-- 10.6 自提点
INSERT INTO pickup_points (name, address, phone, contact_name, business_hours, sort_order, is_active)
VALUES
('中心广场自提点', '市中心广场A座1楼', '13800138100', '李师傅', '09:00-21:00', 1, TRUE),
('东区超市自提点', '东区大润发超市门口', '13800138101', '王师傅', '09:00-20:00', 2, TRUE);

-- 10.7 模板消息
INSERT INTO template_messages (template_id, title, content, type, is_active) VALUES
('order_pay_success', '支付成功通知', '您的订单{{order_no}}支付成功，金额¥{{amount}}元', 2, TRUE),
('order_shipped', '订单发货通知', '您的订单{{order_no}}已发货，请注意查收', 3, TRUE),
('sign_in_success', '签到成功', '您已成功签到，获得{{points}}积分', 1, TRUE);

-- ============================================
-- 完成
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '灵鲜好物数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '管理员账号: admin / admin123';
    RAISE NOTICE '';
    RAISE NOTICE '如果密码验证失败，请执行:';
    RAISE NOTICE '  python scripts/reset-admin-password.py';
    RAISE NOTICE '========================================';
END $$;
