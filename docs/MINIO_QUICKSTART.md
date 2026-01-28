# 🚀 MinIO快速开始指南

## 1. 启动MinIO

```bash
# 启动所有服务（包括MinIO）
docker-compose up -d

# 查看MinIO状态
docker-compose ps minio
```

## 2. 初始化MinIO

```bash
# 运行初始化脚本
cd scripts
python init-minio.py
```

## 3. 访问MinIO控制台

- **控制台地址**: http://localhost:9001
- **用户名**: `minioadmin`
- **密码**: `minioadmin123`

## 4. 测试MinIO功能

```bash
# 运行测试脚本
python test-minio.py
```

## 5. 在代码中使用

### 后端Python代码

```python
from app.services.minio_storage import minio_storage

# 上传文件
url = await minio_storage.upload_file(file, folder="products")

# 批量上传
urls = await minio_storage.upload_multiple_files(files, folder="products")

# 删除文件
minio_storage.delete_file("products/image.jpg")

# 获取文件URL
url = minio_storage.get_file_url("products/image.jpg")
```

### 前端小程序

```typescript
// 上传图片
async function uploadImage(filePath: string) {
  const res = await Taro.uploadFile({
    url: 'http://localhost:8000/api/v1/upload/image',
    filePath: filePath,
    name: 'file'
  })
  return JSON.parse(res.data).url
}
```

## 6. 配置说明

在 `backend/.env` 文件中配置：

```bash
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=lingxian-haowu
MINIO_SECURE=False
```

## 7. 存储桶结构

- `lingxian-haowu` - 通用存储
- `lingxian-haowu-products` - 商品图片
- `lingxian-haowu-merchants` - 商家图片
- `lingxian-haowu-users` - 用户头像

## 8. 常用命令

```bash
# 查看MinIO日志
docker-compose logs -f minio

# 重启MinIO
docker-compose restart minio

# 停止MinIO
docker-compose stop minio

# 查看存储使用情况
# 访问控制台 http://localhost:9001
```

## 9. 故障排查

### 连接失败

```bash
# 检查服务状态
docker-compose ps minio

# 查看日志
docker-compose logs minio

# 重启服务
docker-compose restart minio
```

### 文件无法访问

1. 检查存储桶是否设置为公共读取
2. 检查防火墙设置
3. 确认endpoint地址正确

## 10. 更多信息

详细文档请查看: `docs/MINIO_SETUP.md`

---

快速开始完成！现在可以使用MinIO存储图片和文件了。
