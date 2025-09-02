# API 接口文档

## 基本信息

- **Base URL**: `https://api.arbitrage-system.com/api/v1`
- **协议**: HTTPS
- **认证**: JWT Bearer Token
- **数据格式**: JSON
- **编码**: UTF-8

## 认证

所有API请求都需要在Header中携带JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

### 获取Token

```http
POST /auth/login
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

**响应**:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_in": 86400,
        "user": {
            "id": "12345",
            "username": "your_username",
            "email": "user@example.com"
        }
    }
}
```

## 通用响应格式

### 成功响应
```json
{
    "success": true,
    "data": {
        // 响应数据
    },
    "message": "Success"
}
```

### 错误响应
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
```

## 系统状态 API

### 获取系统状态
```http
GET /system/status
```

**响应**:
```json
{
    "success": true,
    "data": {
        "status": "online",
        "uptime": 86400,
        "version": "1.0.0",
        "active_strategies": 5,
        "total_opportunities": 12,
        "today_profit": 2.45,
        "total_balance": 75000.00,
        "success_rate": 87.3,
        "timestamp": "2024-01-20T10:30:00Z"
    }
}
```

### 健康检查
```http
GET /system/health
```

**响应**:
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "services": {
            "database": "healthy",
            "redis": "healthy",
            "exchanges": {
                "binance": "healthy",
                "okx": "healthy",
                "bybit": "healthy"
            }
        },
        "timestamp": "2024-01-20T10:30:00Z"
    }
}
```

## 市场数据 API

### 获取套利机会
```http
GET /market/opportunities
```

**查询参数**:
- `type` (string): 套利类型 (futures-futures, futures-spot, spot-spot)
- `symbol` (string): 交易对
- `min_spread` (number): 最小价差百分比
- `min_profit` (number): 最小利润百分比
- `exchange_a` (string): 买入交易所
- `exchange_b` (string): 卖出交易所
- `limit` (number): 返回数量限制 (默认 20)
- `offset` (number): 偏移量 (默认 0)

**响应**:
```json
{
    "success": true,
    "data": {
        "opportunities": [
            {
                "id": "OPP_1642675800_1",
                "symbol": "BTC-USDT",
                "type": "futures-futures",
                "buy_exchange": "binance",
                "sell_exchange": "okx",
                "buy_price": 42850.50,
                "sell_price": 42975.20,
                "spread_percent": 0.29,
                "estimated_profit": 0.24,
                "volume_24h": 1250000.00,
                "position_size": 5000.00,
                "confidence": 85.2,
                "buy_funding_rate": 0.0001,
                "sell_funding_rate": -0.0002,
                "funding_end_time": "2024-01-20T16:00:00Z",
                "created_at": "2024-01-20T10:30:15Z"
            }
        ],
        "total_count": 15,
        "pagination": {
            "limit": 20,
            "offset": 0,
            "has_more": false
        }
    }
}
```

### 获取交易对列表
```http
GET /market/symbols
```

**响应**:
```json
{
    "success": true,
    "data": {
        "symbols": [
            {
                "symbol": "BTC-USDT",
                "base_asset": "BTC",
                "quote_asset": "USDT",
                "status": "active",
                "exchanges": ["binance", "okx", "bybit"]
            }
        ]
    }
}
```

### 获取实时价格
```http
GET /market/ticker?symbol=BTC-USDT&exchange=binance
```

**响应**:
```json
{
    "success": true,
    "data": {
        "symbol": "BTC-USDT",
        "exchange": "binance",
        "price": 42850.50,
        "bid": 42848.20,
        "ask": 42852.80,
        "volume_24h": 15420.50,
        "change_24h": 1.25,
        "timestamp": "2024-01-20T10:30:00Z"
    }
}
```

## 交易管理 API

### 执行交易
```http
POST /trading/execute
```

**请求体**:
```json
{
    "symbol": "BTC-USDT",
    "type": "arbitrage",
    "buy_exchange": "binance",
    "sell_exchange": "okx",
    "amount": 1000.00,
    "mode": "market", // market 或 limit
    "buy_price": 42850.50,  // 限价模式必填
    "sell_price": 42975.20, // 限价模式必填
    "leverage": 1,
    "opportunity_id": "OPP_1642675800_1"
}
```

**响应**:
```json
{
    "success": true,
    "data": {
        "order_id": "ORDER_1642675900_1",
        "status": "submitted",
        "buy_order": {
            "exchange": "binance",
            "order_id": "BIN_12345",
            "status": "pending"
        },
        "sell_order": {
            "exchange": "okx",
            "order_id": "OKX_67890",
            "status": "pending"
        },
        "estimated_profit": 124.70,
        "created_at": "2024-01-20T10:31:30Z"
    }
}
```

### 获取持仓
```http
GET /trading/positions
```

**响应**:
```json
{
    "success": true,
    "data": {
        "positions": [
            {
                "id": "POS_1642675900_1",
                "symbol": "BTC-USDT",
                "type": "arbitrage",
                "status": "open",
                "buy_exchange": "binance",
                "sell_exchange": "okx",
                "amount": 1000.00,
                "entry_time": "2024-01-20T10:31:30Z",
                "unrealized_pnl": 45.20,
                "unrealized_pnl_percent": 4.52,
                "duration": "2h 15m",
                "buy_filled": 1000.00,
                "sell_filled": 1000.00
            }
        ]
    }
}
```

### 平仓
```http
POST /trading/close
```

**请求体**:
```json
{
    "position_id": "POS_1642675900_1",
    "mode": "market", // market 或 limit
    "percentage": 100, // 平仓百分比
    "reason": "take_profit" // take_profit, stop_loss, manual, time_limit
}
```

**响应**:
```json
{
    "success": true,
    "data": {
        "close_order_id": "CLOSE_1642683500_1",
        "status": "submitted",
        "realized_pnl": 124.70,
        "realized_pnl_percent": 12.47,
        "close_time": "2024-01-20T12:45:00Z"
    }
}
```

### 获取订单记录
```http
GET /trading/orders
```

**查询参数**:
- `symbol` (string): 交易对筛选
- `exchange` (string): 交易所筛选
- `status` (string): 订单状态筛选
- `start_time` (string): 开始时间 (ISO 8601)
- `end_time` (string): 结束时间 (ISO 8601)
- `limit` (number): 返回数量限制
- `offset` (number): 偏移量

**响应**:
```json
{
    "success": true,
    "data": {
        "orders": [
            {
                "id": "ORDER_1642675900_1",
                "symbol": "BTC-USDT",
                "exchange": "binance",
                "side": "buy",
                "type": "market",
                "amount": 1000.00,
                "price": 42850.50,
                "filled": 1000.00,
                "status": "filled",
                "fee": 0.85,
                "pnl": 124.70,
                "created_at": "2024-01-20T10:31:30Z",
                "updated_at": "2024-01-20T10:31:45Z"
            }
        ],
        "total_count": 150,
        "pagination": {
            "limit": 20,
            "offset": 0,
            "has_more": true
        }
    }
}
```

## 策略规则 API

### 获取规则列表
```http
GET /strategy/rules
```

**响应**:
```json
{
    "success": true,
    "data": {
        "rules": [
            {
                "id": "RULE_1642675900_1",
                "name": "BTC保守套利策略",
                "symbol": "BTC-USDT",
                "type": "futures-futures",
                "status": "active",
                "min_profit": 0.02,
                "max_order_amount": 10000.00,
                "stop_loss_percent": -1.0,
                "take_profit_percent": 2.5,
                "max_holding_time": 48,
                "long_exchange": "binance",
                "short_exchange": "okx",
                "created_at": "2024-01-20T08:00:00Z",
                "updated_at": "2024-01-20T09:30:00Z"
            }
        ]
    }
}
```

### 创建规则
```http
POST /strategy/rules
```

**请求体**:
```json
{
    "name": "BTC保守套利策略",
    "symbol": "BTC-USDT",
    "type": "futures-futures",
    "min_profit": 0.02,
    "max_order_amount": 10000.00,
    "min_order_amount": 100.00,
    "stop_loss_percent": -1.0,
    "take_profit_percent": 2.5,
    "max_holding_time": 48,
    "long_exchange": "binance",
    "short_exchange": "okx",
    "long_leverage": 1,
    "short_leverage": 1,
    "enabled": true
}
```

### 更新规则
```http
PUT /strategy/rules/{rule_id}
```

### 删除规则
```http
DELETE /strategy/rules/{rule_id}
```

## 用户管理 API

### 获取用户信息
```http
GET /user/profile
```

**响应**:
```json
{
    "success": true,
    "data": {
        "id": "12345",
        "username": "trader001",
        "email": "trader@example.com",
        "verified": true,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-20T08:00:00Z",
        "settings": {
            "timezone": "UTC+8",
            "notification_enabled": true,
            "auto_trading_enabled": false
        }
    }
}
```

### 获取API密钥管理
```http
GET /user/api-keys
```

**响应**:
```json
{
    "success": true,
    "data": {
        "keys": [
            {
                "id": "KEY_001",
                "exchange": "binance",
                "label": "Binance主账户",
                "status": "active",
                "permissions": ["spot", "futures"],
                "created_at": "2024-01-15T10:00:00Z",
                "last_used": "2024-01-20T10:30:00Z"
            }
        ]
    }
}
```

## WebSocket API

### 连接信息
- **URL**: `wss://api.arbitrage-system.com/ws`
- **认证**: 连接时发送 `{"type": "auth", "token": "your_jwt_token"}`

### 订阅套利机会更新
```json
{
    "type": "subscribe",
    "channel": "opportunities",
    "params": {
        "symbol": "BTC-USDT",
        "min_profit": 0.02
    }
}
```

**推送数据**:
```json
{
    "type": "opportunities_update",
    "data": {
        "opportunities": [
            // 套利机会列表
        ],
        "timestamp": "2024-01-20T10:30:00Z"
    }
}
```

### 订阅系统状态更新
```json
{
    "type": "subscribe",
    "channel": "system_status"
}
```

### 订阅订单状态更新
```json
{
    "type": "subscribe",
    "channel": "orders",
    "params": {
        "user_id": "12345"
    }
}
```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| AUTH_001 | 401 | 未授权访问 |
| AUTH_002 | 401 | Token已过期 |
| AUTH_003 | 403 | 权限不足 |
| PARAM_001 | 400 | 参数错误 |
| PARAM_002 | 400 | 必填参数缺失 |
| EXCHANGE_001 | 503 | 交易所连接失败 |
| EXCHANGE_002 | 429 | 请求频率超限 |
| TRADE_001 | 400 | 交易参数错误 |
| TRADE_002 | 402 | 余额不足 |
| TRADE_003 | 409 | 订单状态冲突 |
| SYSTEM_001 | 500 | 系统内部错误 |
| SYSTEM_002 | 503 | 服务暂不可用 |

## 请求限制

- **认证请求**: 100次/分钟
- **市场数据**: 300次/分钟
- **交易请求**: 60次/分钟
- **WebSocket连接**: 10个/用户

## 版本控制

API采用版本控制，当前版本为 `v1`。版本信息包含在URL路径中：
- `https://api.arbitrage-system.com/api/v1/`

## 更新日志

### v1.0.0 (2024-01-20)
- 初始API版本发布
- 支持基础套利功能
- 多交易所集成
- WebSocket实时数据推送
