#!/usr/bin/env python
"""
MinIO初始化脚本
创建bucket和必要的策略
"""
from minio import Minio
from minio.error import S3Error
import sys
import os


def init_minio():
    """初始化MinIO"""
    # MinIO配置
    endpoint = "localhost:9000"
    access_key = "minioadmin"
    secret_key = "minioadmin123"
    secure = False

    print("正在连接MinIO...")

    try:
        # 创建客户端
        client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )

        # 检查连接
        buckets = client.list_buckets()
        print(f"✓ MinIO连接成功")
        print(f"  现有buckets: {[bucket.name for bucket in buckets]}")

        # 创建buckets
        buckets_to_create = [
            "lingxian-haowu",  # 主存储桶
            "lingxian-haowu-products",  # 商品图片
            "lingxian-haowu-merchants",  # 商家图片
            "lingxian-haowu-users",  # 用户头像
        ]

        for bucket_name in buckets_to_create:
            try:
                if not client.bucket_exists(bucket_name):
                    client.make_bucket(bucket_name)
                    print(f"✓ 创建bucket: {bucket_name}")

                    # 设置公共读取策略
                    policy = {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {"AWS": "*"},
                                "Action": ["s3:GetObject"],
                                "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                            }
                        ]
                    }
                    import json
                    client.set_bucket_policy(bucket_name, json.dumps(policy))
                    print(f"✓ 设置bucket策略: {bucket_name} (公共读取)")
                else:
                    print(f"✓ bucket已存在: {bucket_name}")
            except S3Error as e:
                print(f"✗ 创建bucket失败 {bucket_name}: {e}")
                return False

        print("\n========================================")
        print("MinIO初始化完成！")
        print("========================================")
        print("\n访问地址:")
        print(f"  - API: http://{endpoint}")
        print(f"  - 控制台: http://localhost:9001")
        print(f"\n登录信息:")
        print(f"  - 用户名: {access_key}")
        print(f"  - 密码: {secret_key}")

        return True

    except S3Error as e:
        print(f"✗ MinIO连接失败: {e}")
        return False
    except Exception as e:
        print(f"✗ 初始化失败: {e}")
        return False


if __name__ == "__main__":
    success = init_minio()
    sys.exit(0 if success else 1)
