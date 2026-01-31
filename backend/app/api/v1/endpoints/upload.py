"""上传相关端点

用于：
- 小程序端 Taro.uploadFile -> /upload
- 后台管理（admin）图片上传

当前实现：上传到 MinIO 公共 bucket，返回可访问 URL。
"""

from fastapi import APIRouter, UploadFile, File
from app.core.response import success_response, error_response
from app.services.minio_storage import minio_storage

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """通用上传接口"""
    if not file:
        return error_response(message="缺少文件")

    # 简单校验：只允许图片
    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        return error_response(message="仅支持图片上传")

    url = await minio_storage.upload_file(file, folder="images")
    return success_response(data={"url": url})
