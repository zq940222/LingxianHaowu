# 监控方案

## 一、日志监控

### 1.1 日志收集
```python
# backend/app/middleware/logging.py

from fastapi import Request
import logging
import time
import json

logger = logging.getLogger("lingxian")

async def log_requests(request: Request, call_next):
    start_time = time.time()

    # 记录请求
    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    # 记录响应
    process_time = time.time() - start_time
    log_data = {
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "process_time": round(process_time, 3),
        "client_ip": request.client.host
    }

    logger.info(f"Response: {json.dumps(log_data)}")

    return response
```

### 1.2 日志分级
```python
# 日志级别使用场景
DEBUG   # 开发调试信息
INFO    # 重要业务流程、API调用
WARNING # 警告信息（如库存预警）
ERROR   # 错误信息（如支付失败）
CRITICAL # 严重错误（如数据库连接失败）
```

## 二、性能监控

### 2.1 响应时间监控
```python
# backend/app/utils/metrics.py

from prometheus_client import Counter, Histogram, Gauge
from prometheus_client.aioweb import start_http_server

# 请求计数
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# 请求延迟
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# 活跃用户
ACTIVE_USERS = Gauge('active_users', 'Number of active users')

# 订单数量
ORDERS_TOTAL = Gauge('orders_total', 'Total orders')

# 数据库连接池
DB_POOL_SIZE = Gauge('db_pool_size', 'Database pool size')
DB_POOL_AVAILABLE = Gauge('db_pool_available', 'Database pool available')
```

### 2.2 性能指标
```
关键指标:
- QPS (每秒查询数)
- 响应时间 (P50, P95, P99)
- 错误率
- 并发连接数
- 数据库连接池使用率
- Redis连接数
- CPU使用率
- 内存使用率
```

## 三、业务监控

### 3.1 订单监控
```python
# backend/app/services/monitor/order_monitor.py

class OrderMonitor:
    @staticmethod
    async def check_pending_orders():
        """检查超时未支付订单"""
        timeout = 30 * 60  # 30分钟
        expired_orders = await Order.find_expired(timeout)

        if expired_orders:
            logger.warning(f"Found {len(expired_orders)} expired orders")
            await Order.cancel_expired_orders(expired_orders)

    @staticmethod
    async def check_group_buy_status():
        """检查拼团状态"""
        expired_groups = await GroupBuy.find_expired()
        await GroupBuy.process_expired(expired_groups)

    @staticmethod
    async def monitor_stock():
        """监控库存"""
        low_stock_products = await Product.find_low_stock(threshold=10)
        if low_stock_products:
            logger.warning(f"Low stock for {len(low_stock_products)} products")
```

### 3.2 支付监控
```python
# backend/app/services/monitor/payment_monitor.py

class PaymentMonitor:
    @staticmethod
    async def check_pending_payments():
        """检查待支付订单"""
        pending_orders = await Order.find_pending_payment()
        for order in pending_orders:
            elapsed = time.time() - order.created_at.timestamp()
            if elapsed > 30 * 60:  # 30分钟
                await order.cancel(reason="支付超时")
```

### 3.3 拼团监控
```python
# backend/app/services/monitor/group_monitor.py

class GroupMonitor:
    @staticmethod
    async def monitor_group_status():
        """监控拼团状态"""
        ongoing_groups = await GroupBuy.find_ongoing()

        for group in ongoing_groups:
            # 检查拼团是否成功
            if group.current_count >= group.required_count:
                await group.mark_success()
            # 检查拼团是否超时
            elif group.expire_time < datetime.now():
                await group.mark_failure()
                # 自动退款
                await GroupMonitor.refund_failed_groups(group)
```

## 四、告警配置

### 4.1 告警规则
```yaml
# alerts.yml

groups:
  - name: system
    rules:
      # 系统错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "高错误率告警"
          description: "5分钟内错误率超过5%"

      # 响应时间告警
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "响应时间过长"
          description: "95%请求响应时间超过2秒"

      # 数据库连接失败
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "数据库连接失败"
          description: "PostgreSQL数据库无法连接"

  - name: business
    rules:
      # 支付失败率告警
      - alert: HighPaymentFailureRate
        expr: rate(payment_failures_total[5m]) / rate(payment_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "支付失败率过高"
          description: "5分钟内支付失败率超过10%"

      # 库存预警
      - alert: LowStock
        expr: product_stock < 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "库存预警"
          description: "商品库存低于10"

      # 拼团超时告警
      - alert: GroupBuyTimeout
        expr: group_buy_status == 3
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "拼团超时"
          description: "拼团已超时"
```

### 4.2 告警通知
```python
# backend/app/utils/notifications.py

class AlertNotification:
    @staticmethod
    async def send_alert(alert_type: str, message: str):
        """发送告警通知"""

        # 发送到企业微信
        await AlertNotification.send_wechat_alert(message)

        # 发送到邮件
        await AlertNotification.send_email_alert(alert_type, message)

        # 发送到短信（严重告警）
        if alert_type == "critical":
            await AlertNotification.send_sms_alert(message)

    @staticmethod
    async def send_wechat_alert(message: str):
        """发送企业微信告警"""
        webhook_url = os.getenv("WECHAT_WEBHOOK_URL")
        payload = {
            "msgtype": "text",
            "text": {
                "content": message
            }
        }
        async with aiohttp.ClientSession() as session:
            await session.post(webhook_url, json=payload)
```

## 五、监控面板

### 5.1 Grafana面板配置
```json
{
  "dashboard": {
    "title": "灵鲜好物监控面板",
    "panels": [
      {
        "title": "QPS",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total[1m])"
        }]
      },
      {
        "title": "响应时间",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
        }]
      },
      {
        "title": "错误率",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "活跃用户",
        "type": "stat",
        "targets": [{
          "expr": "active_users"
        }]
      },
      {
        "title": "订单数量",
        "type": "stat",
        "targets": [{
          "expr": "orders_total"
        }]
      }
    ]
  }
}
```

### 5.2 关键指标展示
```
实时监控面板:
├── 系统指标
│   ├── CPU使用率
│   ├── 内存使用率
│   ├── 磁盘使用率
│   └── 网络流量
├── 应用指标
│   ├── QPS
│   ├── 响应时间 (P50/P95/P99)
│   ├── 错误率
│   └── 并发连接数
└── 业务指标
    ├── 活跃用户数
    ├── 今日订单数
    ├── 今日销售额
    ├── 拼团成功率
    └── 支付成功率
```

## 六、日志分析

### 6.1 ELK Stack配置
```yaml
# docker-compose.elasticsearch.yml

version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
```

### 6.2 日志查询示例
```
# 查询错误日志
level:ERROR AND timestamp:[now-1h TO now]

# 查询慢请求
process_time:>2 AND timestamp:[now-1h TO now]

# 查询支付失败
path:/api/v1/payments/* AND status_code:500

# 查询特定用户
user_id:12345
```
