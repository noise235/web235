# 部署指南

## 概述

本文档详细介绍了Impossible Arbitrage System的部署流程，支持开发环境、测试环境和生产环境的部署。

## 🏗️ 项目架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend API   │
│   (Port 80/443) │───▶│   (Static)      │───▶│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │     Redis       │
                       │   (Port 5432)   │◀───│   (Port 6379)   │
                       └─────────────────┘    └─────────────────┘
```

## 📋 部署前准备

### 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Docker支持
- **内存**: 最低2GB，推荐4GB+
- **存储**: 最低10GB，推荐50GB+
- **CPU**: 最低2核，推荐4核+
- **网络**: 稳定的互联网连接

### 必需软件
- Node.js 18.0.0+
- npm 8.0.0+
- Docker 20.10.0+ (推荐)
- Docker Compose 2.0.0+
- Git

### 前置步骤
1. 获取各交易所API密钥
2. 准备域名和SSL证书 (生产环境)
3. 配置服务器防火墙规则

## 🚀 部署方式

### 方式一: Docker Compose (推荐)

#### 1. 克隆项目
```bash
git clone https://github.com/your-org/impossible-arbitrage-system.git
cd impossible-arbitrage-system
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp config/env.template .env

# 编辑配置文件
nano .env
```

#### 3. 启动服务
```bash
# 开发环境
docker-compose up -d

# 生产环境 (包含监控)
docker-compose --profile production --profile monitoring up -d
```

#### 4. 验证部署
```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 健康检查
curl http://localhost/health
```

### 方式二: 手动部署

#### 1. 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-org/impossible-arbitrage-system.git
cd impossible-arbitrage-system

# 安装Node.js依赖
npm ci --production
```

#### 2. 配置数据库
```bash
# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE arbitrage_system;
CREATE USER arbitrage_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE arbitrage_system TO arbitrage_user;
\q

# 安装Redis
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 3. 构建应用
```bash
# 构建生产版本
npm run build

# 或使用构建脚本
node scripts/build.js --production
```

#### 4. 配置Nginx
```bash
# 安装Nginx
sudo apt install nginx

# 复制配置文件
sudo cp config/nginx.conf /etc/nginx/nginx.conf
sudo cp config/default.conf /etc/nginx/sites-available/arbitrage-system
sudo ln -s /etc/nginx/sites-available/arbitrage-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### 5. 启动应用
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start npm --name "arbitrage-system" -- start
pm2 save
pm2 startup
```

### 方式三: 使用部署脚本

```bash
# 自动化部署到不同环境
node scripts/deploy.js development
node scripts/deploy.js staging  
node scripts/deploy.js production --no-backup
```

## 🔧 环境配置

### 开发环境配置
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
REDIS_HOST=localhost
BINANCE_TESTNET=true
OKX_TESTNET=true
BYBIT_TESTNET=true
TRADING_TEST_MODE=true
LOG_LEVEL=debug
```

### 生产环境配置
```bash
NODE_ENV=production
PORT=8080
DB_HOST=postgres-prod.example.com
REDIS_HOST=redis-prod.example.com
BINANCE_TESTNET=false
OKX_TESTNET=false
BYBIT_TESTNET=false
TRADING_TEST_MODE=false
LOG_LEVEL=info

# 安全配置
JWT_SECRET=your-super-secure-jwt-secret
ENCRYPTION_KEY=your-super-secure-encryption-key
RATE_LIMIT_ENABLED=true
```

## 🔐 SSL证书配置

### 使用Let's Encrypt
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 手动证书配置
```bash
# 创建SSL目录
mkdir -p ssl

# 复制证书文件
cp your-certificate.crt ssl/
cp your-private.key ssl/

# 更新Nginx配置
sudo nano /etc/nginx/sites-available/arbitrage-system
```

## 📊 监控和日志

### 日志管理
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 性能监控
```bash
# 启动监控服务
docker-compose --profile monitoring up -d

# 访问监控面板
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

### 系统监控脚本
```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h /)"
echo ""
echo "=== Service Status ==="
docker-compose ps
echo ""
echo "=== Health Check ==="
curl -s http://localhost/health | jq .
EOF

chmod +x monitor.sh
```

## 🔄 更新和维护

### 应用更新
```bash
# 1. 备份当前版本
cp -r /opt/arbitrage-system /opt/arbitrage-system.backup.$(date +%Y%m%d)

# 2. 拉取最新代码
git pull origin main

# 3. 更新依赖
npm ci --production

# 4. 构建应用
npm run build

# 5. 重启服务
docker-compose restart app
# 或
pm2 restart arbitrage-system
```

### 数据库维护
```bash
# 创建数据备份
pg_dump -U arbitrage_user -h localhost arbitrage_system > backup_$(date +%Y%m%d).sql

# 恢复数据
psql -U arbitrage_user -h localhost arbitrage_system < backup.sql

# 清理旧日志
find logs/ -name "*.log" -mtime +30 -delete
```

### 定期维护任务
```bash
# 创建定时任务
crontab -e

# 添加以下任务
# 每日数据备份 (凌晨2点)
0 2 * * * /usr/bin/pg_dump -U arbitrage_user arbitrage_system > /backups/daily_$(date +\%Y\%m\%d).sql

# 每周清理日志 (周日凌晨3点)
0 3 * * 0 find /opt/arbitrage-system/logs/ -name "*.log" -mtime +7 -delete

# 每月重启服务 (每月1号凌晨4点)
0 4 1 * * docker-compose -f /opt/arbitrage-system/docker-compose.yml restart
```

## 🚨 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :8080

# 检查日志
docker-compose logs app
journalctl -u arbitrage-system
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
systemctl status postgresql
docker-compose ps postgres

# 测试连接
psql -U arbitrage_user -h localhost -d arbitrage_system -c "SELECT 1;"
```

#### 3. Redis连接失败
```bash
# 检查Redis状态
systemctl status redis-server
docker-compose ps redis

# 测试连接
redis-cli ping
```

#### 4. 交易所API连接失败
```bash
# 检查网络连接
curl -I https://api.binance.com/api/v3/time
curl -I https://www.okx.com/api/v5/public/time
curl -I https://api.bybit.com/v3/public/time

# 检查API密钥权限
# 确保IP白名单已配置
# 确保权限已启用（现货交易、期货交易）
```

### 紧急恢复

#### 快速回滚
```bash
# 停止当前服务
docker-compose down

# 恢复备份版本
cp -r /opt/arbitrage-system.backup.20240120 /opt/arbitrage-system

# 重启服务
docker-compose up -d
```

#### 数据恢复
```bash
# 恢复数据库
psql -U arbitrage_user -h localhost arbitrage_system < backup_20240120.sql

# 清理Redis缓存
redis-cli FLUSHALL
```

## 📈 性能优化

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_opportunities_symbol ON opportunities(symbol);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 定期清理旧数据
DELETE FROM opportunities WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
```

### 应用优化
```bash
# 启用Gzip压缩
echo "gzip on;" >> /etc/nginx/nginx.conf

# 配置缓存
echo "expires 1y;" >> /etc/nginx/sites-available/arbitrage-system

# 优化Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
```

## 🔒 安全加固

### 系统安全
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置防火墙
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp  
sudo ufw allow 443/tcp
sudo ufw enable

# 禁用不必要的服务
sudo systemctl disable apache2
sudo systemctl disable sendmail
```

### 应用安全
```bash
# 设置文件权限
chmod 600 .env
chmod 600 ssl/*
chown -R www-data:www-data /opt/arbitrage-system

# 定期更新依赖
npm audit
npm update
```

## 📞 技术支持

如遇到部署问题，请联系技术支持团队：

- **邮箱**: support@arbitrage-system.com  
- **文档**: https://docs.arbitrage-system.com
- **Issues**: https://github.com/your-org/impossible-arbitrage-system/issues

---

**注意**: 请确保在生产环境部署前进行充分测试，并定期备份重要数据。
