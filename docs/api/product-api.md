# 商品相关接口

## 商品列表

### 1. 获取商品列表
**接口描述**: 获取商品列表，支持筛选和分页

**请求方式**: GET

**请求路径**: `/api/v1/products`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| category_id | integer | 否 | 分类ID |
| is_recommend | integer | 否 | 是否推荐: 0否 1是 |
| is_hot | integer | 否 | 是否热卖: 0否 1是 |
| is_group | integer | 否 | 是否拼团: 0否 1是 |
| keyword | string | 否 | 搜索关键词 |
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
        "name": "新鲜有机蔬菜",
        "main_image": "https://xxx.com/product.jpg",
        "price": 29.90,
        "group_price": 19.90,
        "is_group": 1,
        "stock": 100,
        "sales_count": 500,
        "is_recommend": 1,
        "is_hot": 1
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5
  },
  "timestamp": 1640000000
}
```

## 商品详情

### 2. 获取商品详情
**接口描述**: 获取商品详细信息

**请求方式**: GET

**请求路径**: `/api/v1/products/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "merchant_id": 1,
    "merchant_name": "XX生鲜店",
    "category_id": 1,
    "category_name": "蔬菜",
    "name": "新鲜有机蔬菜",
    "description": "精选有机蔬菜，新鲜直达",
    "main_image": "https://xxx.com/product.jpg",
    "images": [
      "https://xxx.com/product1.jpg",
      "https://xxx.com/product2.jpg"
    ],
    "price": 29.90,
    "group_price": 19.90,
    "stock": 100,
    "sales_count": 500,
    "is_recommend": 1,
    "is_hot": 1,
    "is_group": 1,
    "group_min_count": 2,
    "group_max_count": 0,
    "group_expire_hours": 24
  },
  "timestamp": 1640000000
}
```

## 商品分类

### 3. 获取分类列表
**接口描述**: 获取商品分类列表

**请求方式**: GET

**请求路径**: `/api/v1/categories`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "蔬菜",
      "parent_id": 0,
      "icon": "https://xxx.com/icon.png",
      "sort": 1,
      "children": [
        {
          "id": 11,
          "name": "叶菜类",
          "parent_id": 1,
          "icon": "https://xxx.com/icon.png",
          "sort": 1
        }
      ]
    }
  ],
  "timestamp": 1640000000
}
```

## 拼团商品

### 4. 获取拼团商品列表
**接口描述**: 获取正在拼团的商品列表

**请求方式**: GET

**请求路径**: `/api/v1/products/group-buying`

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
        "name": "新鲜有机蔬菜",
        "main_image": "https://xxx.com/product.jpg",
        "price": 29.90,
        "group_price": 19.90,
        "group_min_count": 2,
        "current_groups": [
          {
            "id": 1,
            "initiator": {
              "id": 1,
              "nickname": "张三",
              "avatar": "https://xxx.com/avatar.jpg"
            },
            "required_count": 2,
            "current_count": 1,
            "expire_time": "2024-01-01T12:00:00+08:00"
          }
        ]
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

### 5. 发起拼团
**接口描述**: 发起拼团

**请求方式**: POST

**请求路径**: `/api/v1/group-buys`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| product_id | integer | 是 | 商品ID |

**响应示例**:

```json
{
  "code": 201,
  "message": "发起成功",
  "data": {
    "group_buy_id": 1,
    "required_count": 2,
    "expire_time": "2024-01-01T12:00:00+08:00"
  },
  "timestamp": 1640000000
}
```

### 6. 参与拼团
**接口描述**: 参与已有拼团

**请求方式**: POST

**请求路径**: `/api/v1/group-buys/{id}/join`

**响应示例**:

```json
{
  "code": 200,
  "message": "参与成功",
  "data": {
    "group_buy_id": 1,
    "current_count": 2,
    "status": 2
  },
  "timestamp": 1640000000
}
```

### 7. 获取拼团详情
**接口描述**: 获取拼团详细信息

**请求方式**: GET

**请求路径**: `/api/v1/group-buys/{id}`

**响应示例**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "product": {
      "id": 1,
      "name": "新鲜有机蔬菜",
      "main_image": "https://xxx.com/product.jpg",
      "group_price": 19.90
    },
    "initiator": {
      "id": 1,
      "nickname": "张三",
      "avatar": "https://xxx.com/avatar.jpg"
    },
    "required_count": 2,
    "current_count": 1,
    "status": 1,
    "expire_time": "2024-01-01T12:00:00+08:00",
    "members": [
      {
        "id": 1,
        "nickname": "张三",
        "avatar": "https://xxx.com/avatar.jpg",
        "join_time": "2024-01-01T10:00:00+08:00"
      }
    ]
  },
  "timestamp": 1640000000
}
```
