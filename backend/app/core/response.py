"""
API响应工具
"""
from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel
from fastapi import status

DataT = TypeVar("DataT")


class ApiResponse(BaseModel, Generic[DataT]):
    """统一API响应格式"""
    code: int = 200
    message: str = "success"
    data: Optional[DataT] = None
    timestamp: int = 0


def success_response(data: Any = None, message: str = "success") -> ApiResponse:
    """
    成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
    
    Returns:
        ApiResponse
    """
    import time
    return ApiResponse(
        code=200,
        message=message,
        data=data,
        timestamp=int(time.time())
    )


def error_response(code: int, message: str, data: Any = None) -> ApiResponse:
    """
    错误响应
    
    Args:
        code: 错误码
        message: 错误消息
        data: 响应数据
    
    Returns:
        ApiResponse
    """
    import time
    return ApiResponse(
        code=code,
        message=message,
        data=data,
        timestamp=int(time.time())
    )
