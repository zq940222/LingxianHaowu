# 订单相关接口

## 订单创建

### 1. 创建订单
**接口描述**: 创建订单

**请求方式**: POST

**请求路径**: `/api/v1/orders`

**请求参数**:

```json
{
  "address_id": 1,
  "delivery_type": 2,
  "delivery_zone_id": 1,
  "delivery_time": "2024-01-01T14:00:00+08:00",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "coupon_id": 1,
  "points_used": 10,
  "group_buy_id": 1,
  "remark": "请尽快配送"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| address_id | integer | 否 | 地址ID（自提可为空） |
| delivery_type | integer | 是 | 配送类型: 1自提 2配送 |
| delivery_zone_id | integer | 否 | 配送小区ID |
| pickup_point_id | integer | 否 | 自提点ID |
| delivery_time | string | 否 | 配送时间 |
| items | array | 是 | 订单商品列表 |
| coupon_id | integer | 否 | 优惠券ID |
| points_used | integer | 否 | 使用积分 |
| group_buy_id | integer | 否 | 拼团ID |
| remark | string | 否 | 订单备注 |

**响应示例**:

```json
{
  "code": 201,
  "message": "订单创建成功",
  "data": {
    "order_id": 1,
    "order_no": "202401011200001",
    "total_amount": 59.80,
    "discount_amount": 10.00,
    "delivery_fee": 5.00,
    "final_amount": 54.80,
    "payment_no": "PAY202401011200001"
  },
  "timestamp": 1640000000
}
```

## 订单查询

### 2. 获取订单列表
**接口描述**: 获取用户订单列表

**请求方式**: GET

**请求路径**: `/api/v1/orders`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | integer | 否 | 订单状态 |
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
        "order_no": "202401011200001",
        "merchant": {
          "id": 1,
          "name": "XX生鲜店",
          "logo": "https://xxx.com/logo.jpg"
        },
        "status": 2,
        "status_name": "待发货",
        "payment_status": 2,
        "total_amount": 59.80,
        "final_amount": 54.80,
        "items": [
          {
            "product_id": 1,
            "product_name": "新鲜有机蔬菜",
            "product_image": "https://xxx.com/product.jpg",
            "price": 29.90,
            "quantity": 2,
            "total_amount": 59.80
          }
        ],
        "created_at": "2024-01-01T12:00:00+08:00"
      }
    ],
    "total": 50,
    "page": 1,
    "size": 20,
    "pages": 3
  },
  "timestamp": 1640000000
}
```

### 3. 获取订单详情
**接口描述**: 获取订单详细信息

**请求方式**: GET

**请求路径**: `/api/v1/orders/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "order_no": "202401011200001",
    "merchant": {
      "id": 1,
      "name": "XX生鲜店",
      "logo": "https://xxx.com/logo.jpg"
    },
    "user": {
      "id": 1,
      "nickname": "张三"
    },
    "address": {
      "receiver_name": "张三",
      "phone": "13800138000",
      "address": "广东省深圳市南山区XX路XX号"
    },
    "delivery_type": 2,
    "delivery_time": "2024-01-01T14:00:00+08:00",
    "status": 2,
    "status_name": "待发货",
    "payment_status": 2,
    "payment_time": "2024-01-01T12:05:00+08:00",
    "total_amount": 59.80,
    "discount_amount": 10.00,
    "delivery_fee": 5.00,
    "final_amount": 54.80,
    "points_used": 10,
    "points_gained": 5,
    "remark": "请尽快配送",
    "items": [
      {
        "product_id": 1,
        "product_name": "新鲜有机蔬菜",
        "product_image": "https://xxx.com/product.jpg",
        "price": 29.90,
        "quantity": 2,
        "total_amount": 59.80
      }
    ],
    "logs": [
      {
        "action": "创建订单",
        "operator": "用户",
        "remark": "",
        "created_at": "2024-01-01T12:00:00+08:00"
      }
    ],
    "created_at": "2024-01-01T12:00:00+08:00",
    "updated_at": "2024-01-01T12:05:00+08:00"
  },
  "timestamp": 1640000000
}
```

## 订单操作

### 4. 取消订单
**接口描述**: 取消订单

**请求方式**: POST

**请求路径**: `/api/v1/orders/{id}/cancel`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 是 | 取消原因 |

**响应示例**:

```json
{
  "code": 200,
  "message": "订单已取消",
  "data": null,
  "timestamp": 1640000000
}
```

### 5. 确认收货
**接口描述**: 确认收货

**请求方式**: POST

**请求路径**: `/api/v1/orders/{id}/confirm`

**响应示例**:

```json
{
  "code": 200,
  "message": "收货成功",
  "data": {
    "points_gained": 5
  },
  "timestamp": 1640000000
}
```

### 6. 申请退款
**接口描述**: 申请退款

**请求方式**: POST

**请求路径**: `/api/v1/orders/{id}/refund`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 是 | 退款原因 |
| amount | number | 否 | 退款金额 |

**响应示例**:

```json
{
  "code": 200,
  "message": "退款申请已提交",
  "data": null,
  "timestamp": 1640000000
}
```

## 商家端订单接口

### 7. 商家获取订单列表
**接口描述**: 商家获取订单列表

**请求方式**: GET

**请求路径**: `/api/v1/merchant/orders`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | integer | 否 | 订单状态 |
| delivery_type | integer | 否 | 配送类型 |
| keyword | string | 否 | 搜索关键词 |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5
  },
  "timestamp": 1640000000
}
```

### 8. 接单
**接口描述**: 商家接单

**请求方式**: POST

**请求路径**: `/api/v1/merchant/orders/{id}/accept`

**响应示例**:

```json
{
  "code": 200,
  "message": "接单成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 9. 发货
**接口描述**: 商家发货

**请求方式**: POST

**请求路径**: `/api/v1/merchant/orders/{id}/ship`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| remark | string | 否 | 备注 |

**响应示例**:

```json
{
  "code": 200,
  "message": "发货成功",
  "data": null,
  "timestamp": 1640000000
}
```
