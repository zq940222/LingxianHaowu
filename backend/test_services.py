#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试服务导入
"""
import sys
import os
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

services = [
    'user_service',
    'product_service',
    'order_service',
    'payment_service',
    'points_service',
    'activity_service',
    'delivery_service',
    'message_service'
]

for service_name in services:
    try:
        print(f"Testing {service_name}...")
        module = __import__(f'app.services.{service_name}', fromlist=[''])
        print(f"  [OK] {service_name}")
    except Exception as e:
        print(f"  [ERROR] {service_name}: {e}")
        print(f"  Traceback:")
        traceback.print_exc()
        print()
