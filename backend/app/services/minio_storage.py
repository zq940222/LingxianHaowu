"""
MinIO对象存储服务
"""
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException
from datetime import timedelta
from typing import Optional, List
import uuid
import os
import io
import json

from app.core.config import settings
from app.core.logger import logger


class MinIOStorage:
    """MinIO存储服务类"""

    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.secure = settings.MINIO_SECURE
        self.bucket_name = settings.MINIO_BUCKET
        self.internal_endpoint = settings.MINIO_INTERNAL_ENDPOINT

        self._client: Optional[Minio] = None
        self._init_client()

    def _init_client(self):
        """初始化MinIO客户端"""
        try:
            # 优先使用内部endpoint（Docker环境）
            endpoint = self.internal_endpoint if os.environ.get('DOCKER_ENV') else self.endpoint
            endpoint = endpoint.replace('http://', '').replace('https://', '')

            self._client = Minio(
                endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure
            )

            # 确保bucket存在
            self._ensure_bucket()

            logger.info(f"MinIO客户端初始化成功: {endpoint}")
        except Exception as e:
            logger.error(f"MinIO客户端初始化失败: {str(e)}")
            raise

    def _ensure_bucket(self):
        """确保bucket存在"""
        try:
            if not self._client.bucket_exists(self.bucket_name):
                self._client.make_bucket(self.bucket_name)
                # 设置bucket为公共读取
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                        }
                    ]
                }
                self._client.set_bucket_policy(self.bucket_name, json.dumps(policy))
                logger.info(f"创建bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"创建bucket失败: {str(e)}")
            raise

    async def upload_file(
        self,
        file: UploadFile,
        folder: str = "",
        filename: Optional[str] = None
    ) -> str:
        """
        上传文件到MinIO

        Args:
            file: 上传的文件
            folder: 文件夹路径
            filename: 自定义文件名（可选）

        Returns:
            文件访问URL
        """
        try:
            # 生成文件名
            if not filename:
                ext = os.path.splitext(file.filename)[1] if file.filename else ''
                filename = f"{uuid.uuid4().hex}{ext}"

            # 构建对象名称
            object_name = f"{folder}/{filename}" if folder else filename

            # 读取文件内容（Minio SDK 需要 file-like 对象）
            file_content = await file.read()
            file_size = len(file_content)
            data_stream = io.BytesIO(file_content)

            # 上传文件
            self._client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=data_stream,
                length=file_size,
                content_type=file.content_type or "application/octet-stream"
            )

            # 返回访问URL（外部访问）
            file_url = f"http://{self.endpoint}/{self.bucket_name}/{object_name}"
            logger.info(f"文件上传成功: {object_name}")
            return file_url

        except S3Error as e:
            logger.error(f"MinIO上传失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")
        except Exception as e:
            logger.error(f"上传文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")

    def upload_bytes(
        self,
        data: bytes,
        filename: str,
        content_type: str = "application/octet-stream",
        folder: str = ""
    ) -> str:
        """
        上传字节数据到MinIO

        Args:
            data: 字节数据
            filename: 文件名
            content_type: 内容类型
            folder: 文件夹路径

        Returns:
            文件访问URL
        """
        try:
            # 构建对象名称
            object_name = f"{folder}/{filename}" if folder else filename

            data_stream = io.BytesIO(data)

            # 上传数据
            self._client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=data_stream,
                length=len(data),
                content_type=content_type
            )

            # 返回访问URL
            file_url = f"http://{self.endpoint}/{self.bucket_name}/{object_name}"
            logger.info(f"数据上传成功: {object_name}")
            return file_url

        except S3Error as e:
            logger.error(f"MinIO上传失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"数据上传失败: {str(e)}")
        except Exception as e:
            logger.error(f"上传数据失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"上传数据失败: {str(e)}")

    def delete_file(self, object_name: str) -> bool:
        """
        删除文件

        Args:
            object_name: 对象名称（不包含bucket前缀）

        Returns:
            是否删除成功
        """
        try:
            self._client.remove_object(self.bucket_name, object_name)
            logger.info(f"文件删除成功: {object_name}")
            return True
        except S3Error as e:
            logger.error(f"MinIO删除失败: {str(e)}")
            return False

    def get_file_url(self, object_name: str, expires: Optional[int] = None) -> str:
        """
        获取文件访问URL

        Args:
            object_name: 对象名称
            expires: 过期时间（秒），不设置则返回永久URL

        Returns:
            文件访问URL
        """
        try:
            if expires:
                # 生成预签名URL
                url = self._client.presigned_get_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    expires=timedelta(seconds=expires)
                )
            else:
                # 返回永久URL
                url = f"http://{self.endpoint}/{self.bucket_name}/{object_name}"

            return url
        except S3Error as e:
            logger.error(f"获取文件URL失败: {str(e)}")
            raise

    def list_files(self, prefix: str = "", recursive: bool = False) -> List[str]:
        """
        列出文件

        Args:
            prefix: 前缀过滤
            recursive: 是否递归

        Returns:
            文件列表
        """
        try:
            objects = self._client.list_objects(
                bucket_name=self.bucket_name,
                prefix=prefix,
                recursive=recursive
            )
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"列出文件失败: {str(e)}")
            raise

    async def upload_multiple_files(
        self,
        files: List[UploadFile],
        folder: str = ""
    ) -> List[str]:
        """
        批量上传文件

        Args:
            files: 文件列表
            folder: 文件夹路径

        Returns:
            文件URL列表
        """
        urls = []
        for file in files:
            url = await self.upload_file(file, folder)
            urls.append(url)
        return urls


# 创建全局实例
minio_storage = MinIOStorage()
