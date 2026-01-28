# 用户相关接口

## 用户认证

### 1. 微信登录
**接口描述**: 用户微信登录

**请求方式**: POST

**请求路径**: `/api/v1/auth/login`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 微信登录code |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "openid": "oxxxxx",
      "nickname": "用户昵称",
      "avatar": "https://xxx.com/avatar.jpg",
      "phone": null,
      "points": 0,
      "created_at": "2024-01-01T12:00:00+08:00"
    }
  },
  "timestamp": 1640000000
}
```

### 2. 绑定手机号
**接口描述**: 绑定用户手机号

**请求方式**: POST

**请求路径**: `/api/v1/user/bind-phone`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码 |

**响应示例**:

```json
{
  "code": 200,
  "message": "绑定成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 3. 刷新Token
**接口描述**: 刷新访问Token

**请求方式**: POST

**请求路径**: `/api/v1/auth/refresh`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| refresh_token | string | 是 | 刷新Token |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1640000000
}
```

## 用户信息

### 4. 获取用户信息
**接口描述**: 获取当前登录用户信息

**请求方式**: GET

**请求路径**: `/api/v1/user/info`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "avatar": "https://xxx.com/avatar.jpg",
    "phone": "13800138000",
    "points": 100,
    "created_at": "2024-01-01T12:00:00+08:00"
  },
  "timestamp": 1640000000
}
```

### 5. 更新用户信息
**接口描述**: 更新用户信息

**请求方式**: PUT

**请求路径**: `/api/v1/user/info`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像URL |

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null,
  "timestamp": 1640000000
}
```

## 用户地址

### 6. 获取地址列表
**接口描述**: 获取用户收货地址列表

**请求方式**: GET

**请求路径**: `/api/v1/user/addresses`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "receiver_name": "张三",
      "phone": "13800138000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "address": "科技园XX路XX号",
      "is_default": 1
    }
  ],
  "timestamp": 1640000000
}
```

### 7. 添加地址
**接口描述**: 添加收货地址

**请求方式**: POST

**请求路径**: `/api/v1/user/addresses`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| receiver_name | string | 是 | 收货人姓名 |
| phone | string | 是 | 收货人电话 |
| province | string | 是 | 省份 |
| city | string | 是 | 城市 |
| district | string | 是 | 区县 |
| address | string | 是 | 详细地址 |
| is_default | integer | 否 | 是否默认地址 |

**响应示例**:

```json
{
  "code": 201,
  "message": "添加成功",
  "data": {
    "id": 2
  },
  "timestamp": 1640000000
}
```

### 8. 更新地址
**接口描述**: 更新收货地址

**请求方式**: PUT

**请求路径**: `/api/v1/user/addresses/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": null,
  "timestamp": 1640000000
}
```

### 9. 删除地址
**接口描述**: 删除收货地址

**请求方式**: DELETE

**请求路径**: `/api/v1/user/addresses/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1640000000
}
```

## 积分相关

### 10. 每日签到
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

### 11. 获取积分记录
**接口描述**: 获取用户积分明细

**请求方式**: GET

**请求路径**: `/api/v1/user/points-records`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
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

## 活动弹窗

### 12. 获取活动弹窗
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

### 13. 记录活动查看
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
