# 灵鲜好物后端

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 项目结构

```
backend/
├── app/
│   ├── api/              # API路由
│   │   ├── v1/        # v1版本API
│   │   │   └── endpoints/  # 各模块端点
│   ├── core/            # 核心配置
│   ├── models/          # 数据库模型（待实现）
│   ├── schemas/         # Pydantic模型（待实现）
│   ├── services/        # 业务逻辑（待实现）
│   └── utils/           # 工具函数（待实现）
├── main.py             # 应用入口
├── requirements.txt     # Python依赖
└── schema.sql          # 数据库初始化脚本
```

## API文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
