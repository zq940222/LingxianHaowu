# 活动相关接口

## 活动弹窗

### 1. 获取活动弹窗
**接口描述**: 获取当前用户的活动弹窗信息

**请求方式**: GET

**请求路径**: `/api/v1/activities/popup`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "type": 1,
    "title": "新用户专享优惠",
    "image": "https://xxx.com/popup.jpg",
    "content": "首次下单立减20元",
    "button_text": "立即领取",
    "jump_url": "/pages/coupon/detail?id=1"
  },
  "timestamp": 1640000000
}
```

### 2. 记录活动查看
**接口描述**: 记录用户查看活动弹窗

**请求方式**: POST

**请求路径**: `/api/v1/activities/{id}/view`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1640000000
}
```

### 3. 关闭活动弹窗
**接口描述**: 关闭活动弹窗

**请求方式**: POST

**请求路径**: `/api/v1/activities/{id}/close`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": null,
  "timestamp": 1640000000
}
```

## 活动管理（商家端）

### 4. 创建活动
**接口描述**: 商家创建活动

**请求方式**: POST

**请求路径**: `/api/v1/merchant/activities`

**请求参数**:

```json
{
  "type": 1,
  "title": "新用户专享优惠",
  "image": "https://xxx.com/popup.jpg",
  "content": "首次下单立减20元",
  "start_time": "2024-01-01T00:00:00+08:00",
  "end_time": "2024-01-31T23:59:59+08:00",
  "display_rule": 2,
  "button_text": "立即领取",
  "jump_url": "/pages/coupon/detail?id=1"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | integer | 是 | 活动类型: 1弹窗 2优惠券 3促销 |
| title | string | 是 | 活动标题 |
| image | string | 否 | 活动图片 |
| content | string | 是 | 活动内容 |
| start_time | string | 是 | 开始时间 |
| end_time | string | 是 | 结束时间 |
| display_rule | integer | 是 | 展示规则: 1每日一次 2首次进入 |
| button_text | string | 否 | 按钮文字 |
| jump_url | string | 否 | 跳转链接 |

**响应示例**:

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1
  },
  "timestamp": 1640000000
}
```

### 5. 获取活动列表
**接口描述**: 商家获取活动列表

**请求方式**: GET

**请求路径**: `/api/v1/merchant/activities`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | integer | 否 | 活动类型 |
| status | integer | 否 | 状态: 1启用 2禁用 |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "type": 1,
        "type_name": "活动弹窗",
        "title": "新用户专享优惠",
        "image": "https://xxx.com/popup.jpg",
        "start_time": "2024-01-01T00:00:00+08:00",
        "end_time": "2024-01-31T23:59:59+08:00",
        "display_rule": 2,
        "status": 1,
        "view_count": 1000,
        "created_at": "2024-01-01T00:00:00+08:00"
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20,
    "pages": 1
  },
  "timestamp": 1640000000
}
```

### 6. 更新活动
**接口描述**: 更新活动信息

**请求方式**: PUT

**请求路径**: `/api/v1/merchant/activities/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 7. 删除活动
**接口描述**: 删除活动

**请求方式**: DELETE

**请求路径**: `/api/v1/merchant/activities/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1640000000
}
```

## 优惠券

### 8. 领取优惠券
**接口描述**: 用户领取优惠券

**请求方式**: POST

**请求路径**: `/api/v1/coupons/{id}/claim`

**响应示例**:

```json
{
  "code": 200,
  "message": "领取成功",
  "data": {
    "user_coupon_id": 1,
    "expire_time": "2024-02-01T23:59:59+08:00"
  },
  "timestamp": 1640000000
}
```

### 9. 获取用户优惠券列表
**接口描述**: 获取用户优惠券列表

**请求方式**: GET

**请求路径**: `/api/v1/user/coupons`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | integer | 否 | 状态: 1未使用 2已使用 3已过期 |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "coupon_id": 1,
        "name": "新用户专享券",
        "type": 1,
        "type_name": "满减券",
        "discount_amount": 20.00,
        "min_amount": 50.00,
        "status": 1,
        "status_name": "未使用",
        "expire_time": "2024-02-01T23:59:59+08:00"
      }
    ],
    "total": 5,
    "page": 1,
    "size": 20,
    "pages": 1
  },
  "timestamp": 1640000000
}
```

### 10. 创建优惠券
**接口描述**: 商家创建优惠券

**请求方式**: POST

**请求路径**: `/api/v1/merchant/coupons`

**请求参数**:

```json
{
  "activity_id": 1,
  "name": "新用户专享券",
  "type": 1,
  "discount_amount": 20.00,
  "min_amount": 50.00,
  "total_count": 1000,
  "valid_days": 30
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| activity_id | integer | 是 | 活动ID |
| name | string | 是 | 优惠券名称 |
| type | integer | 是 | 类型: 1满减 2折扣 3无门槛 |
| discount_amount | number | 否 | 优惠金额 |
| discount_rate | number | 否 | 折扣率 |
| min_amount | number | 是 | 最低消费 |
| total_count | integer | 是 | 总数量 |
| valid_days | integer | 是 | 有效天数 |

**响应示例**:

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 1
  },
  "timestamp": 1640000000
}
```

### 11. 获取优惠券列表
**接口描述**: 商家获取优惠券列表

**请求方式**: GET

**请求路径**: `/api/v1/merchant/coupons`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| activity_id | integer | 否 | 活动ID |
| status | integer | 否 | 状态: 1启用 2禁用 |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "新用户专享券",
        "type": 1,
        "type_name": "满减券",
        "discount_amount": 20.00,
        "min_amount": 50.00,
        "total_count": 1000,
        "used_count": 200,
        "valid_days": 30,
        "status": 1
      }
    ],
    "total": 10,
    "page": 1,
    "size": 20,
    "pages": 1
  },
  "timestamp": 1640000000
}
```

### 12. 优惠券使用
**接口描述**: 计算优惠券抵扣金额

**请求方式**: POST

**请求路径**: `/api/v1/coupons/calculate`

**请求参数**:

```json
{
  "user_coupon_id": 1,
  "order_amount": 100.00
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_coupon_id | integer | 是 | 用户优惠券ID |
| order_amount | number | 是 | 订单金额 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "discount_amount": 20.00,
    "final_amount": 80.00,
    "can_use": true
  },
  "timestamp": 1640000000
}
```

## 活动数据统计

### 13. 活动数据统计
**接口描述**: 获取活动数据统计

**请求方式**: GET

**请求路径**: `/api/v1/merchant/activities/{id}/statistics`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "view_count": 10000,
    "click_count": 5000,
    "conversion_rate": 0.5,
    "issued_coupons": 2000,
    "used_coupons": 1000,
    "usage_rate": 0.5,
    "orders_count": 500,
    "sales_amount": 25000.00
  },
  "timestamp": 1640000000
}
```

### 14. 获取活动记录
**接口描述**: 获取活动用户记录

**请求方式**: GET

**请求路径**: `/api/v1/merchant/activities/{id}/records`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | integer | 否 | 动作: 1查看 2领取 |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "nickname": "张三",
          "avatar": "https://xxx.com/avatar.jpg"
        },
        "action": 2,
        "action_name": "领取",
        "created_at": "2024-01-01T12:00:00+08:00"
      }
    ],
    "total": 200,
    "page": 1,
    "size": 20,
    "pages": 10
  },
  "timestamp": 1640000000
}
```
