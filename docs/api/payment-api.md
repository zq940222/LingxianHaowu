# 支付相关接口

## 微信支付

### 1. 创建支付订单
**接口描述**: 创建微信支付订单

**请求方式**: POST

**请求路径**: `/api/v1/payments/create`

**请求参数**:

```json
{
  "order_id": 1,
  "payment_method": 1
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_id | integer | 是 | 订单ID |
| payment_method | integer | 是 | 支付方式: 1微信支付 |

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "payment_no": "PAY202401011200001",
    "prepay_id": "wx1234567890",
    "timeStamp": "1640000000",
    "nonceStr": "abc123",
    "package": "prepay_id=wx1234567890",
    "signType": "RSA",
    "paySign": "abc123"
  },
  "timestamp": 1640000000
}
```

### 2. 查询支付状态
**接口描述**: 查询支付状态

**请求方式**: GET

**请求路径**: `/api/v1/payments/{payment_no}/status`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "payment_no": "PAY202401011200001",
    "status": 2,
    "status_name": "已支付",
    "amount": 54.80,
    "transaction_id": "4200001234567890",
    "paid_at": "2024-01-01T12:05:00+08:00"
  },
  "timestamp": 1640000000
}
```

### 3. 支付回调
**接口描述**: 微信支付结果回调

**请求方式**: POST

**请求路径**: `/api/v1/payments/notify`

**说明**: 此接口由微信服务器调用，需要验证签名

### 4. 申请退款
**接口描述**: 申请退款

**请求方式**: POST

**请求路径**: `/api/v1/payments/refund`

**请求参数**:

```json
{
  "order_id": 1,
  "refund_amount": 54.80,
  "reason": "商品有瑕疵"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| order_id | integer | 是 | 订单ID |
| refund_amount | number | 是 | 退款金额 |
| reason | string | 是 | 退款原因 |

**响应示例**:

```json
{
  "code": 200,
  "message": "退款申请成功",
  "data": {
    "refund_no": "REF202401011200001",
    "refund_id": "50000000000000000000000000000000"
  },
  "timestamp": 1640000000
}
```

### 5. 查询退款状态
**接口描述**: 查询退款状态

**请求方式**: GET

**请求路径**: `/api/v1/payments/refunds/{refund_no}/status`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "refund_no": "REF202401011200001",
    "status": 2,
    "status_name": "退款成功",
    "refund_amount": 54.80,
    "refund_id": "50000000000000000000000000000000",
    "refunded_at": "2024-01-01T12:10:00+08:00"
  },
  "timestamp": 1640000000
}
```
