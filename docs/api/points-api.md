# 积分相关接口

## 积分获取

### 1. 每日签到
**接口描述**: 用户每日签到获取积分

**请求方式**: POST

**请求路径**: `/api/v1/user/sign-in`

**响应示例**:

```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "points_gained": 5,
    "consecutive_days": 7,
    "total_points": 100
  },
  "timestamp": 1640000000
}
```

### 2. 查询签到状态
**接口描述**: 查询今日是否已签到

**请求方式**: GET

**请求路径**: `/api/v1/user/sign-in/status`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "signed_in": true,
    "consecutive_days": 7,
    "today_points": 5
  },
  "timestamp": 1640000000
}
```

### 3. 获取积分记录
**接口描述**: 获取用户积分明细

**请求方式**: GET

**请求路径**: `/api/v1/user/points-records`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | integer | 否 | 类型: 1签到 2订单 3兑换 4调整 |
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
        "type_name": "签到",
        "points": 5,
        "balance": 100,
        "source": "每日签到",
        "created_at": "2024-01-01T12:00:00+08:00"
      },
      {
        "id": 2,
        "type": 2,
        "type_name": "订单",
        "points": 10,
        "balance": 95,
        "source": "订单完成",
        "created_at": "2024-01-01T10:00:00+08:00"
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

## 积分规则

### 4. 获取积分规则
**接口描述**: 获取积分规则说明

**请求方式**: GET

**请求路径**: `/api/v1/points/rules`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "type": 1,
      "type_name": "签到",
      "rule_name": "每日签到积分",
      "points": 5,
      "description": "每日签到获得5积分，连续签到有额外奖励",
      "status": 1
    },
    {
      "type": 2,
      "type_name": "订单",
      "rule_name": "订单积分",
      "points": 0,
      "ratio": 10.00,
      "description": "每消费10元获得1积分",
      "status": 1
    }
  ],
  "timestamp": 1640000000
}
```

## 商家积分管理

### 5. 调整用户积分
**接口描述**: 商家调整用户积分

**请求方式**: POST

**请求路径**: `/api/v1/merchant/user/{user_id}/points/adjust`

**请求参数**:

```json
{
  "points": 100,
  "type": 4,
  "remark": "活动奖励"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| points | integer | 是 | 积分值（正数增加/负数减少） |
| type | integer | 是 | 类型: 4调整 |
| remark | string | 是 | 调整原因 |

**响应示例**:

```json
{
  "code": 200,
  "message": "积分调整成功",
  "data": {
    "points": 100,
    "new_balance": 200
  },
  "timestamp": 1640000000
}
```

### 6. 查询用户积分
**接口描述**: 商家查询用户积分

**请求方式**: GET

**请求路径**: `/api/v1/merchant/user/{user_id}/points`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": 1,
    "nickname": "张三",
    "phone": "13800138000",
    "total_points": 100,
    "total_earned": 150,
    "total_spent": 50,
    "records_count": 20
  },
  "timestamp": 1640000000
}
```

## 积分统计

### 7. 积分统计
**接口描述**: 获取积分统计数据

**请求方式**: GET

**请求路径**: `/api/v1/points/statistics`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start_date | string | 否 | 开始日期 YYYY-MM-DD |
| end_date | string | 否 | 结束日期 YYYY-MM-DD |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_issued": 50000,
    "total_consumed": 30000,
    "current_balance": 20000,
    "sign_in_count": 1000,
    "order_points_count": 500,
    "user_count": 200
  },
  "timestamp": 1640000000
}
```
