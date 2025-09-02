# Impossible Arbitrage System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

高级多市场套利机会检测和执行平台 - Advanced multi-market arbitrage opportunities detection and execution platform

## 🚀 核心功能

- **实时套利检测**: 支持期期套利、期现套利、现现套利
- **多交易所支持**: Binance、OKX、Bybit 等主流交易所
- **智能风险管理**: 自动止盈止损、仓位管理、时间控制
- **高性能架构**: WebSocket实时数据、Redis缓存、负载均衡
- **专业界面**: 现代化暗色主题、实时Dashboard、响应式设计
- **自动化交易**: 规则引擎、策略模板、批量执行

## 📁 项目结构

```
web235/
├── public/                 # 前端页面
│   └── index.html         # 主页面
├── src/                   # 源代码
│   ├── css/               # 样式文件
│   │   └── styles.css     # 主样式
│   └── js/                # JavaScript代码
│       ├── config.js      # 全局配置
│       ├── api.js         # API管理
│       ├── utils.js       # 工具函数
│       ├── components.js  # UI组件
│       └── main.js        # 主业务逻辑
├── config/                # 配置文件
│   ├── api.config.js      # API配置
│   ├── env.config.js      # 环境配置
│   ├── nginx.conf         # Nginx配置
│   ├── default.conf       # 站点配置
│   └── env.template       # 环境变量模板
├── scripts/               # 构建脚本
│   ├── build.js           # 构建脚本
│   └── deploy.js          # 部署脚本
├── build/                 # 构建输出
├── logs/                  # 日志文件
├── package.json           # 项目配置
├── Dockerfile            # Docker配置
├── docker-compose.yml    # 容器编排
└── README.md             # 项目文档
```

## 🛠️ 技术栈

### 前端
- **HTML5 + CSS3 + ES6+**: 现代Web技术
- **WebSocket**: 实时数据通信
- **LocalStorage**: 客户端存储
- **Responsive Design**: 响应式设计

### 后端 (准备接入)
- **Node.js + Express**: 服务器框架
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **WebSocket**: 实时通信
- **JWT**: 身份认证

### 部署
- **Docker**: 容器化部署
- **Nginx**: 反向代理和负载均衡
- **PM2**: 进程管理
- **Docker Compose**: 容器编排

### 交易所集成
- **CCXT**: 统一交易所API
- **WebSocket**: 实时市场数据
- **REST API**: 账户和交易管理

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker (可选)

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/noise235/web235.git
cd impossible-arbitrage-system

# 安装依赖
npm install
```

### 配置环境

```bash
# 复制环境变量模板
cp config/env.template .env

# 编辑配置文件
nano .env
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或使用本地服务器
npm run serve
```

访问 http://localhost:3000 查看应用

### 生产部署

```bash
# 构建应用
npm run build

# 使用 Docker
docker-compose up -d

# 或使用部署脚本
npm run deploy:production
```

## 📖 详细配置

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# 服务配置
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_system
DB_USER=your_user
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 安全配置
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-encryption-key

# 交易所API密钥
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
OKX_API_KEY=your_okx_api_key
OKX_SECRET_KEY=your_okx_secret_key
BYBIT_API_KEY=your_bybit_api_key
BYBIT_SECRET_KEY=your_bybit_secret_key
```

### 交易所配置

支持的交易所：
- **Binance**: 全球最大加密货币交易所
- **OKX**: 综合性数字资产服务平台
- **Bybit**: 专业加密货币衍生品交易所

配置步骤：
1. 在各交易所创建API密钥
2. 设置IP白名单
3. 启用必要的权限（现货交易、期货交易）
4. 配置到环境变量中

### 数据库配置

系统使用PostgreSQL作为主数据库：

```sql
-- 创建数据库
CREATE DATABASE arbitrage_system;

-- 创建用户
CREATE USER arbitrage_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE arbitrage_system TO arbitrage_user;
```

## 🎯 功能模块

### 1. Dashboard 仪表板
- 实时系统状态监控
- 活跃策略展示
- 收益统计分析
- 系统健康检查

### 2. Market Monitoring 市场监控
- 多交易所价差扫描
- 实时套利机会展示
- 高级筛选和排序
- 置信度评估

### 3. Order Records 订单管理
- 历史订单查询
- 交易记录分析
- 盈亏统计
- 数据导出功能

### 4. Rules Settings 规则配置
- 套利策略规则设置
- 风险管理参数
- 自动交易配置
- 规则模板管理

## 🔧 API 接口

### 系统状态
```
GET /api/v1/system/status      # 获取系统状态
GET /api/v1/system/health      # 健康检查
```

### 市场数据
```
GET /api/v1/market/opportunities    # 获取套利机会
GET /api/v1/market/symbols         # 获取交易对
GET /api/v1/market/ticker          # 获取价格数据
```

### 交易管理
```
POST /api/v1/trading/execute       # 执行交易
GET  /api/v1/trading/positions     # 获取持仓
POST /api/v1/trading/close         # 平仓操作
```

### WebSocket 事件
```
ws://localhost:8080/ws

events:
- opportunities_update    # 套利机会更新
- system_status_update   # 系统状态更新
- order_update           # 订单状态更新
```

## 🐳 Docker 部署

### 单容器部署
```bash
# 构建镜像
docker build -t arbitrage-system .

# 运行容器
docker run -d \
  --name arbitrage-system \
  -p 80:80 \
  -p 8080:8080 \
  --env-file .env \
  arbitrage-system
```

### 编排部署
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

## 📊 监控和日志

### 日志配置
- 应用日志: `logs/app.log`
- 错误日志: `logs/error.log`
- 访问日志: `logs/access.log`

### 监控指标
- 系统性能指标
- 交易成功率
- API响应时间
- 错误率统计

### 健康检查
```bash
# 检查应用健康状态
curl http://localhost/health

# 检查API服务
curl http://localhost:8080/api/v1/system/health
```

## 🔒 安全配置

### 基本安全措施
- JWT身份认证
- API密钥加密存储
- HTTPS强制重定向
- 请求频率限制
- SQL注入防护
- XSS防护

### 生产环境安全
- 定期更新依赖
- 使用专用数据库用户
- 配置防火墙规则
- 启用访问日志
- 定期备份数据

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

## 📈 性能优化

### 前端优化
- CSS/JS压缩和合并
- 资源缓存策略
- 懒加载和代码分割
- Service Worker离线支持

### 后端优化
- Redis缓存热点数据
- 数据库索引优化
- API响应缓存
- 负载均衡配置

## 🛠️ 开发工具

### 代码质量
```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

### 构建工具
```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build:prod

# 分析构建结果
npm run build:analyze
```

## 🤝 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持和帮助

### 常见问题
1. **连接交易所失败**: 检查API密钥和网络连接
2. **数据不更新**: 检查WebSocket连接状态
3. **部署失败**: 检查Docker配置和环境变量

### 获取帮助
- 📧 邮箱: support@arbitrage-system.com
- 💬 微信群: [加入群聊]
- 📝 Issues: [GitHub Issues](https://github.com/your-org/impossible-arbitrage-system/issues)
- 📖 文档: [在线文档](https://docs.arbitrage-system.com)

### 更新日志
查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新内容

---

**⚠️ 风险提示**: 加密货币交易存在风险，请在充分了解风险的前提下使用本系统。本系统仅为技术工具，不构成投资建议。

**🔧 技术支持**: 如需技术支持或定制开发，请联系开发团队。