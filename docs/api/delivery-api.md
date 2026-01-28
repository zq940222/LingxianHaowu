# 配送相关接口

## 配送小区

### 1. 获取配送小区列表
**接口描述**: 获取商家配送小区列表

**请求方式**: GET

**请求路径**: `/api/v1/delivery-zones`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| merchant_id | integer | 否 | 商家ID，不传则返回当前商家 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "merchant_id": 1,
      "name": "XX小区",
      "address": "广东省深圳市南山区XX路XX号",
      "delivery_fee": 5.00,
      "min_amount": 20.00,
      "delivery_times": [
        "09:00-12:00",
        "14:00-18:00"
      ],
      "status": 1
    }
  ],
  "timestamp": 1640000000
}
```

### 2. 添加配送小区
**接口描述**: 商家添加配送小区

**请求方式**: POST

**请求路径**: `/api/v1/merchant/delivery-zones`

**请求参数**:

```json
{
  "name": "XX小区",
  "address": "广东省深圳市南山区XX路XX号",
  "delivery_fee": 5.00,
  "min_amount": 20.00,
  "delivery_times": [
    "09:00-12:00",
    "14:00-18:00"
  ]
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "添加成功",
  "data": {
    "id": 1
  },
  "timestamp": 1640000000
}
```

### 3. 更新配送小区
**接口描述**: 更新配送小区信息

**请求方式**: PUT

**请求路径**: `/api/v1/merchant/delivery-zones/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 4. 删除配送小区
**接口描述**: 删除配送小区

**请求方式**: DELETE

**请求路径**: `/api/v1/merchant/delivery-zones/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1640000000
}
```

## 自提点

### 5. 获取自提点列表
**接口描述**: 获取商家自提点列表

**请求方式**: GET

**请求路径**: `/api/v1/pickup-points`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| merchant_id | integer | 否 | 商家ID，不传则返回当前商家 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "merchant_id": 1,
      "name": "XX自提点",
      "address": "广东省深圳市南山区XX路XX号",
      "contact": "张三",
      "phone": "13800138000",
      "pickup_times": [
        "09:00-12:00",
        "14:00-18:00"
      ],
      "status": 1
    }
  ],
  "timestamp": 1640000000
}
```

### 6. 添加自提点
**接口描述**: 商家添加自提点

**请求方式**: POST

**请求路径**: `/api/v1/merchant/pickup-points`

**请求参数**:

```json
{
  "name": "XX自提点",
  "address": "广东省深圳市南山区XX路XX号",
  "contact": "张三",
  "phone": "13800138000",
  "pickup_times": [
    "09:00-12:00",
    "14:00-18:00"
  ]
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "添加成功",
  "data": {
    "id": 1
  },
  "timestamp": 1640000000
}
```

### 7. 更新自提点
**接口描述**: 更新自提点信息

**请求方式**: PUT

**请求路径**: `/api/v1/merchant/pickup-points/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 8. 删除自提点
**接口描述**: 删除自提点

**请求方式**: DELETE

**请求路径**: `/api/v1/merchant/pickup-points/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1640000000
}
```

## 配送费用

### 9. 计算配送费
**接口描述**: 根据配送小区和订单金额计算配送费

**请求方式**: GET

**请求路径**: `/api/v1/delivery/calculate-fee`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| delivery_zone_id | integer | 是 | 配送小区ID |
| order_amount | number | 是 | 订单金额 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "delivery_fee": 5.00,
    "min_amount": 20.00,
    "is_free_delivery": false,
    "message": "订单满30元免配送费"
  },
  "timestamp": 1640000000
}
```

## 配送管理

### 10. 获取待配送订单
**接口描述**: 商家获取待配送订单列表

**请求方式**: GET

**请求路径**: `/api/v1/merchant/delivery/pending`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| delivery_type | integer | 否 | 配送类型: 1自提 2配送 |
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
        "order_id": 1,
        "order_no": "202401011200001",
        "user": {
          "nickname": "张三",
          "phone": "13800138000"
        },
        "delivery_type": 2,
        "delivery_time": "2024-01-01T14:00:00+08:00",
        "address": "广东省深圳市南山区XX路XX号",
        "total_amount": 59.80,
        "created_at": "2024-01-01T12:00:00+08:00"
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

### 11. 开始配送
**接口描述**: 商家开始配送

**请求方式**: POST

**请求路径**: `/api/v1/merchant/delivery/{order_id}/start`

**响应示例**:

```json
{
  "code": 200,
  "message": "配送已开始",
  "data": null,
  "timestamp": 1640000000
}
```

### 12. 完成配送
**接口描述**: 商家完成配送

**请求方式**: POST

**请求路径**: `/api/v1/merchant/delivery/{order_id}/complete`

**响应示例**:

```json
{
  "code": 200,
  "message": "配送已完成",
  "data": null,
  "timestamp": 1640000000
}
```
