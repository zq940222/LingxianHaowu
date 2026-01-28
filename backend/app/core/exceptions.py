"""
异常处理
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.core.response import error_response


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    请求验证异常处理
    
    Args:
        request: 请求对象
        exc: 验证异常
    
    Returns:
        JSONResponse
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": error["loc"][-1],
            "message": error["msg"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            code=400,
            message="参数验证失败",
            data=errors
        ).dict()
    )


async def integrity_error_handler(request: Request, exc: IntegrityError):
    """
    数据库完整性错误处理
    
    Args:
        request: 请求对象
        exc: 完整性异常
    
    Returns:
        JSONResponse
    """
    error_message = str(exc.orig)
    
    if "users_openid_key" in error_message:
        message = "该openid已被使用"
    elif "users_phone_key" in error_message:
        message = "该手机号已被使用"
    elif "admins_username_key" in error_message:
        message = "该用户名已存在"
    else:
        message = "数据冲突，请检查输入"
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=error_response(
            code=409,
            message=message
        ).dict()
    )


async def general_exception_handler(request: Request, exc: Exception):
    """
    通用异常处理
    
    Args:
        request: 请求对象
        exc: 异常对象
    
    Returns:
        JSONResponse
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            code=500,
            message=f"服务器内部错误: {str(exc)}"
        ).dict()
    )
