# Multi-stage build for Impossible Arbitrage System
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境镜像
FROM nginx:alpine AS production

# 安装Node.js (用于运行后端API)
RUN apk add --no-cache nodejs npm

# 创建应用用户
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/config ./config
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# 复制Nginx配置
COPY config/nginx.conf /etc/nginx/nginx.conf
COPY config/default.conf /etc/nginx/conf.d/default.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx /var/log/app && \
    chown -R appuser:appuser /var/log/app /app

# 创建启动脚本
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Arbitrage System..."' >> /start.sh && \
    echo '# 启动后端API服务' >> /start.sh && \
    echo 'su appuser -c "cd /app && npm start &"' >> /start.sh && \
    echo 'echo "Backend API started"' >> /start.sh && \
    echo '# 启动Nginx' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/v1/system/health || exit 1

# 暴露端口
EXPOSE 80 8080

# 启动服务
CMD ["/start.sh"]
