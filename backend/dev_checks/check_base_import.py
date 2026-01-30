#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试base.py导入
"""
import sys
import os
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

try:
    # 先单独测试导入
    print("Step 1: Testing individual imports...")
    from datetime import datetime
    print("  datetime: OK")

    from sqlalchemy import Column
    print("  Column: OK")

    from sqlalchemy import DateTime
    print("  DateTime: OK")

    from sqlalchemy.ext.declarative import declared_attr
    print("  declared_attr: OK")

    print("\nStep 2: Importing base.py...")
    from app.models.base import TimestampMixin
    print("  TimestampMixin: OK")

    print("\nStep 3: Using TimestampMixin...")
    # 测试使用TimestampMixin
    from sqlalchemy import Column, Integer, String

    class TestModel(TimestampMixin):
        __tablename__ = "test"
        id = Column(Integer, primary_key=True)
        name = Column(String(50))

    print("  TestModel: OK")
    print(f"  created_at type: {TestModel.created_at.property.columns[0].type}")

except Exception as e:
    print(f"\nERROR: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
