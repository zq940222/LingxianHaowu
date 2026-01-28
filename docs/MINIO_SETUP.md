# MinIO 对象存储配置指南

## 📦 概述

MinIO是一个高性能的分布式对象存储服务，兼容Amazon S3 API。本项目使用MinIO来存储用户头像、商品图片、商家logo等文件。

## 🚀 快速启动

### 1. 启动MinIO服务

```bash
# 启动所有服务（包括MinIO）
docker-compose up -d

# 查看MinIO日志
docker-compose logs -f minio

# 检查服务状态
docker-compose ps
```

### 2. 初始化MinIO（首次使用）

```bash
# 运行初始化脚本
cd scripts
python init-minio.py
```

### 3. 访问MinIO控制台

- **API地址**: http://localhost:9000
- **控制台地址**: http://localhost:9001
- **用户名**: `minioadmin`
- **密码**: `minioadmin123`

## 📁 存储桶结构

系统会自动创建以下存储桶：

| 存储桶名称 | 用途 | 说明 |
|-----------|------|------|
| `lingxian-haowu` | 通用存储 | 默认存储桶，所有文件 |
| `lingxian-haowu-products` | 商品图片 | 存储商品相关图片 |
| `lingxian-haowu-merchants` | 商家图片 | 存储商家logo和图片 |
| `lingxian-haowu-users` | 用户头像 | 存储用户头像 |

## 🔧 后端配置

### 配置文件 (`.env`)

```bash
# MinIO配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=lingxian-haowu
MINIO_SECURE=False
MINIO_INTERNAL_ENDPOINT=http://minio:9000
```

### 代码使用

```python
from app.services.minio_storage import minio_storage

# 上传单个文件
file_url = await minio_storage.upload_file(file, folder="products")

# 上传多个文件
file_urls = await minio_storage.upload_multiple_files(files, folder="products")

# 上传字节数据
file_url = minio_storage.upload_bytes(data, filename="image.jpg", folder="merchants")

# 删除文件
minio_storage.delete_file("products/image.jpg")

# 获取文件URL
file_url = minio_storage.get_file_url("products/image.jpg")

# 生成预签名URL（临时）
temp_url = minio_storage.get_file_url("products/image.jpg", expires=3600)

# 列出文件
files = minio_storage.list_files(prefix="products/", recursive=True)
```

## 📱 前端使用

### 用户端小程序

```typescript
import Taro from '@tarojs/taro'

// 上传图片到后端，后端再上传到MinIO
async function uploadImage(filePath: string) {
  const res = await Taro.uploadFile({
    url: 'http://localhost:8000/api/v1/upload/image',
    filePath: filePath,
    name: 'file'
  })
  const data = JSON.parse(res.data)
  return data.url  // MinIO文件URL
}

// 使用示例
const chooseImage = async () => {
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  })

  const filePath = res.tempFilePaths[0]
  const imageUrl = await uploadImage(filePath)
  console.log('图片URL:', imageUrl)
}
```

### 商家端小程序

```typescript
// 上传商品图片
async function uploadProductImages(filePaths: string[]) {
  const urls = []
  for (const filePath of filePaths) {
    const res = await Taro.uploadFile({
      url: 'http://localhost:8000/api/v1/upload/product',
      filePath: filePath,
      name: 'file'
    })
    const data = JSON.parse(res.data)
    urls.push(data.url)
  }
  return urls
}
```

### PC管理后台

```vue
<template>
  <el-upload
    action="http://localhost:8000/api/v1/upload/admin"
    :on-success="handleSuccess"
    list-type="picture-card"
  >
    <el-icon><Plus /></el-icon>
  </el-upload>
</template>

<script setup>
const handleSuccess = (response) => {
  console.log('上传成功:', response.url)
}
</script>
```

## 🔌 创建上传API

### 后端API端点

```python
from fastapi import APIRouter, UploadFile, File
from app.services.minio_storage import minio_storage

router = APIRouter()

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """上传通用图片"""
    url = await minio_storage.upload_file(file, folder="images")
    return {"url": url}

@router.post("/upload/product")
async def upload_product_image(file: UploadFile = File(...)):
    """上传商品图片"""
    url = await minio_storage.upload_file(file, folder="products")
    return {"url": url}

@router.post("/upload/merchant")
async def upload_merchant_image(file: UploadFile = File(...)):
    """上传商家图片"""
    url = await minio_storage.upload_file(file, folder="merchants")
    return {"url": url}

@router.post("/upload/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """上传用户头像"""
    url = await minio_storage.upload_file(file, folder="users")
    return {"url": url}

@router.post("/upload/multiple")
async def upload_multiple(files: List[UploadFile] = File(...)):
    """批量上传文件"""
    urls = await minio_storage.upload_multiple_files(files)
    return {"urls": urls}
```

## 🔐 安全配置

### 生产环境建议

1. **更改默认凭证**
```bash
# 在docker-compose.yml中修改
MINIO_ROOT_USER=your_secure_username
MINIO_ROOT_PASSWORD=your_strong_password
```

2. **启用HTTPS**
```bash
MINIO_SECURE=True
MINIO_ENDPOINT=https://your-domain.com
```

3. **使用专用存储桶**
```python
# 不同类型文件使用不同存储桶
MINIO_BUCKET=lingxian-haowu
```

4. **限制文件大小**
```python
# 在FastAPI中配置
from fastapi import UploadFile

# 限制文件大小为10MB
MAX_FILE_SIZE = 10 * 1024 * 1024
```

## 📊 监控和管理

### MinIO控制台功能

- **浏览器**: 查看所有存储桶和文件
- **上传/下载**: 直接在控制台操作文件
- **访问策略**: 配置存储桶的访问权限
- **监控**: 查看存储使用情况和请求统计
- **用户管理**: 创建和管理MinIO用户

### 命令行工具 (mc)

```bash
# 安装MinIO客户端
# Windows: 下载 https://dl.min.io/client/mc/release/windows-amd64/mc.exe

# 配置客户端
mc alias set local http://localhost:9000 minioadmin minioadmin123

# 列出存储桶
mc ls local

# 列出文件
mc ls local/lingxian-haowu

# 复制文件
mc cp test.jpg local/lingxian-haowu/

# 删除文件
mc rm local/lingxian-haowu/test.jpg

# 查看存储信息
mc admin info local
```

## 🐛 常见问题

### 1. 连接失败

```bash
# 检查MinIO是否运行
docker-compose ps minio

# 查看日志
docker-compose logs minio

# 重启服务
docker-compose restart minio
```

### 2. Bucket已存在

首次运行初始化脚本时，bucket可能已存在。这是正常的，脚本会跳过已存在的bucket。

### 3. 文件上传失败

- 检查文件大小是否超过限制
- 检查存储桶是否存在
- 查看后端日志获取详细错误信息

### 4. 图片无法访问

- 确认存储桶策略已设置为公共读取
- 检查防火墙设置
- 确认endpoint地址正确

## 🔄 迁移到生产环境

### 1. 备份数据

```bash
# 使用mc工具备份
mc mirror local/lingxian-haowu /backup/lingxian-haowu
```

### 2. 更新配置

```bash
# .env
MINIO_ENDPOINT=your-production-domain.com
MINIO_ACCESS_KEY=production_access_key
MINIO_SECRET_KEY=production_secret_key
MINIO_SECURE=True
```

### 3. 迁移数据

```bash
# 从开发环境导出
mc mirror dev/lingxian-haowu ./backup

# 导入到生产环境
mc mirror ./backup prod/lingxian-haowu
```

## 📚 参考资料

- [MinIO官方文档](https://min.io/docs/minio/linux/index.html)
- [MinIO Python SDK](https://min.io/docs/minio/linux/developers/python/minio-py.html)
- [FastAPI文件上传](https://fastapi.tiangolo.com/tutorial/request-files/)

## 💡 最佳实践

1. **文件命名**: 使用UUID或时间戳避免冲突
2. **文件夹结构**: 按类型和日期组织文件
3. **图片压缩**: 上传前压缩图片减少存储空间
4. **CDN集成**: 生产环境建议配置CDN加速
5. **定期清理**: 清理无用的临时文件
6. **监控告警**: 设置存储空间监控和告警

---

如有问题，请查看MinIO控制台或联系技术支持。
