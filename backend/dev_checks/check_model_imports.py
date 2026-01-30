#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试模型导入
"""
import sys
import os

# 添加backend目录到Python路径
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

try:
    from app.models.base import TimestampMixin
    print("TimestampMixin: OK")
except Exception as e:
    print(f"TimestampMixin: ERROR - {e}")

try:
    from app.models.merchant import Merchant
    print("Merchant: OK")
except Exception as e:
    print(f"Merchant: ERROR - {e}")

try:
    from app.models.user import User
    print("User: OK")
except Exception as e:
    print(f"User: ERROR - {e}")
