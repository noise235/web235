#!/bin/bash

# 构建脚本，用于 Netlify 部署

echo "===== 开始构建 ====="

# 安装依赖
npm ci

# 构建项目
npm run build

# 确保 build 目录存在
mkdir -p build/css

# 创建目录结构以匹配原始引用路径
mkdir -p build/src/css
# 复制 CSS 文件到匹配原始引用路径的位置
cp src/css/styles.css build/src/css/

# 复制 public 目录内容到 build 目录
cp -r public/* build/

# 复制 JS 文件到匹配原始引用路径的位置
mkdir -p build/src/js
cp src/js/*.js build/src/js/

# 检查文件是否正确复制
echo "===== 检查关键文件 ====="
if [ -f "build/src/css/styles.css" ]; then
  echo "✅ CSS 文件已正确复制"
else
  echo "❌ CSS 文件复制失败!"
  exit 1
fi

if [ -f "build/src/js/main.js" ]; then
  echo "✅ JS 文件已正确复制"
else
  echo "❌ JS 文件复制失败!"
  exit 1
fi

if [ -f "build/index.html" ]; then
  echo "✅ HTML 文件已正确复制"
else
  echo "❌ HTML 文件复制失败!"
  exit 1
fi

echo "===== 构建完成 ====="
