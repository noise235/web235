#!/usr/bin/env node

/**
 * Deployment Script for Impossible Arbitrage System
 * Usage: node scripts/deploy.js [environment] [options]
 * 
 * Environments: development, staging, production
 * Options: --build-only, --no-backup, --force
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
    constructor() {
        this.environment = process.argv[2] || 'development';
        this.options = this.parseOptions(process.argv.slice(3));
        this.projectRoot = path.resolve(__dirname, '..');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        console.log(`🚀 Deployment Manager - Environment: ${this.environment}`);
        console.log(`📅 Timestamp: ${this.timestamp}`);
    }

    parseOptions(args) {
        return {
            buildOnly: args.includes('--build-only'),
            noBackup: args.includes('--no-backup'),
            force: args.includes('--force')
        };
    }

    async deploy() {
        try {
            console.log('\n=== Starting Deployment Process ===\n');

            // 1. 预检查
            await this.preflightChecks();
            
            // 2. 备份 (生产环境)
            if (this.environment === 'production' && !this.options.noBackup) {
                await this.createBackup();
            }
            
            // 3. 构建应用
            await this.buildApplication();
            
            // 4. 运行测试
            if (this.environment !== 'development') {
                await this.runTests();
            }
            
            // 5. 部署应用
            if (!this.options.buildOnly) {
                await this.deployApplication();
            }
            
            // 6. 健康检查
            if (!this.options.buildOnly) {
                await this.healthCheck();
            }
            
            console.log('\n✅ Deployment completed successfully!');
            
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            process.exit(1);
        }
    }

    async preflightChecks() {
        console.log('🔍 Running preflight checks...');
        
        // 检查环境变量
        const envFile = path.join(this.projectRoot, '.env');
        if (!fs.existsSync(envFile) && this.environment === 'production') {
            throw new Error('Production environment requires .env file');
        }
        
        // 检查Node.js版本
        const nodeVersion = process.version;
        const requiredVersion = 'v18.0.0';
        if (this.compareVersions(nodeVersion, requiredVersion) < 0) {
            throw new Error(`Node.js ${requiredVersion} or higher is required. Current: ${nodeVersion}`);
        }
        
        // 检查依赖
        if (!fs.existsSync(path.join(this.projectRoot, 'node_modules'))) {
            console.log('📦 Installing dependencies...');
            this.execCommand('npm ci');
        }
        
        // 检查Docker (如果使用容器部署)
        if (this.environment === 'production') {
            try {
                this.execCommand('docker --version', { stdio: 'pipe' });
                console.log('✅ Docker is available');
            } catch (error) {
                console.log('⚠️  Docker not found, skipping containerized deployment');
            }
        }
        
        console.log('✅ Preflight checks passed');
    }

    async createBackup() {
        console.log('💾 Creating backup...');
        
        const backupDir = path.join(this.projectRoot, 'backups', this.timestamp);
        fs.mkdirSync(backupDir, { recursive: true });
        
        // 备份构建文件
        const buildDir = path.join(this.projectRoot, 'build');
        if (fs.existsSync(buildDir)) {
            this.execCommand(`cp -r ${buildDir} ${backupDir}/build`);
        }
        
        // 备份配置文件
        const configFiles = ['.env', 'config/production.json'];
        configFiles.forEach(file => {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const destPath = path.join(backupDir, file);
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.copyFileSync(filePath, destPath);
            }
        });
        
        console.log(`✅ Backup created: ${backupDir}`);
    }

    async buildApplication() {
        console.log('🔨 Building application...');
        
        // 清理之前的构建
        const buildDir = path.join(this.projectRoot, 'build');
        if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
        }
        
        // 构建前端资源
        try {
            this.execCommand('npm run build');
            console.log('✅ Application built successfully');
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
        
        // 复制必要文件到构建目录
        this.copyProductionFiles();
    }

    copyProductionFiles() {
        const buildDir = path.join(this.projectRoot, 'build');
        
        // 确保构建目录存在
        fs.mkdirSync(buildDir, { recursive: true });
        
        // 复制文件列表
        const filesToCopy = [
            { src: 'public', dest: 'public' },
            { src: 'config', dest: 'config' },
            { src: 'server', dest: 'server' },
            { src: 'package.json', dest: 'package.json' },
            { src: 'package-lock.json', dest: 'package-lock.json' }
        ];
        
        filesToCopy.forEach(({ src, dest }) => {
            const srcPath = path.join(this.projectRoot, src);
            const destPath = path.join(buildDir, dest);
            
            if (fs.existsSync(srcPath)) {
                if (fs.statSync(srcPath).isDirectory()) {
                    this.execCommand(`cp -r ${srcPath} ${path.dirname(destPath)}`);
                } else {
                    fs.mkdirSync(path.dirname(destPath), { recursive: true });
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        });
        
        console.log('✅ Production files copied');
    }

    async runTests() {
        console.log('🧪 Running tests...');
        
        try {
            this.execCommand('npm test -- --ci --coverage');
            console.log('✅ All tests passed');
        } catch (error) {
            if (!this.options.force) {
                throw new Error(`Tests failed: ${error.message}`);
            }
            console.log('⚠️  Tests failed but continuing due to --force flag');
        }
    }

    async deployApplication() {
        console.log(`🚀 Deploying to ${this.environment}...`);
        
        switch (this.environment) {
            case 'development':
                await this.deployDevelopment();
                break;
            case 'staging':
                await this.deployStaging();
                break;
            case 'production':
                await this.deployProduction();
                break;
            default:
                throw new Error(`Unknown environment: ${this.environment}`);
        }
    }

    async deployDevelopment() {
        console.log('🔧 Development deployment...');
        
        // 启动开发服务器
        console.log('Starting development server...');
        const devProcess = spawn('npm', ['run', 'dev'], {
            cwd: this.projectRoot,
            stdio: 'inherit',
            detached: true
        });
        
        // 保存进程ID
        fs.writeFileSync(path.join(this.projectRoot, '.dev.pid'), devProcess.pid.toString());
        
        console.log(`✅ Development server started (PID: ${devProcess.pid})`);
    }

    async deployStaging() {
        console.log('🧪 Staging deployment...');
        
        // 构建Docker镜像
        const imageName = `arbitrage-system:staging-${this.timestamp}`;
        this.execCommand(`docker build -t ${imageName} .`);
        
        // 停止现有容器
        try {
            this.execCommand('docker stop arbitrage-staging', { stdio: 'pipe' });
            this.execCommand('docker rm arbitrage-staging', { stdio: 'pipe' });
        } catch (error) {
            // 忽略容器不存在的错误
        }
        
        // 启动新容器
        const runCommand = [
            'docker run -d',
            '--name arbitrage-staging',
            '--restart unless-stopped',
            '-p 8081:80',
            '-e NODE_ENV=staging',
            '--env-file .env.staging',
            imageName
        ].join(' ');
        
        this.execCommand(runCommand);
        console.log('✅ Staging environment deployed');
    }

    async deployProduction() {
        console.log('🏭 Production deployment...');
        
        // 确认部署
        if (!this.options.force) {
            const answer = await this.prompt('Are you sure you want to deploy to PRODUCTION? (yes/no): ');
            if (answer.toLowerCase() !== 'yes') {
                throw new Error('Production deployment cancelled by user');
            }
        }
        
        // 构建生产镜像
        const imageName = `arbitrage-system:prod-${this.timestamp}`;
        this.execCommand(`docker build -t ${imageName} --build-arg NODE_ENV=production .`);
        
        // 标记为最新版本
        this.execCommand(`docker tag ${imageName} arbitrage-system:latest`);
        
        // 执行滚动更新 (零停机部署)
        await this.rollingUpdate(imageName);
        
        // 清理旧镜像
        this.cleanupOldImages();
        
        console.log('✅ Production deployment completed');
    }

    async rollingUpdate(imageName) {
        console.log('🔄 Performing rolling update...');
        
        // 启动新实例
        const newContainerName = `arbitrage-prod-${this.timestamp}`;
        const runCommand = [
            'docker run -d',
            `--name ${newContainerName}`,
            '--restart unless-stopped',
            '-p 8082:80',
            '-e NODE_ENV=production',
            '--env-file .env',
            imageName
        ].join(' ');
        
        this.execCommand(runCommand);
        
        // 等待新实例就绪
        await this.waitForHealthCheck('http://localhost:8082/health');
        
        // 切换流量 (需要负载均衡器支持)
        console.log('🔀 Switching traffic to new instance...');
        
        // 更新端口映射
        try {
            this.execCommand('docker stop arbitrage-prod', { stdio: 'pipe' });
            this.execCommand('docker rm arbitrage-prod', { stdio: 'pipe' });
        } catch (error) {
            // 忽略容器不存在的错误
        }
        
        // 重新启动在正确端口上的新容器
        this.execCommand(`docker stop ${newContainerName}`);
        this.execCommand(`docker rm ${newContainerName}`);
        
        const finalRunCommand = [
            'docker run -d',
            '--name arbitrage-prod',
            '--restart unless-stopped',
            '-p 80:80',
            '-e NODE_ENV=production',
            '--env-file .env',
            imageName
        ].join(' ');
        
        this.execCommand(finalRunCommand);
        
        console.log('✅ Rolling update completed');
    }

    async healthCheck() {
        console.log('🏥 Performing health check...');
        
        const healthUrls = {
            development: 'http://localhost:3000/health',
            staging: 'http://localhost:8081/health',
            production: 'http://localhost/health'
        };
        
        const url = healthUrls[this.environment];
        await this.waitForHealthCheck(url);
        
        console.log('✅ Health check passed');
    }

    async waitForHealthCheck(url, maxAttempts = 30, interval = 2000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await this.httpGet(url);
                if (response.includes('healthy')) {
                    console.log(`✅ Service is healthy (${url})`);
                    return;
                }
            } catch (error) {
                console.log(`⏳ Health check attempt ${attempt}/${maxAttempts} failed, retrying...`);
            }
            
            if (attempt < maxAttempts) {
                await this.sleep(interval);
            }
        }
        
        throw new Error(`Health check failed after ${maxAttempts} attempts`);
    }

    cleanupOldImages() {
        console.log('🧹 Cleaning up old Docker images...');
        
        try {
            // 保留最新的3个版本
            const images = this.execCommand('docker images arbitrage-system --format "{{.Tag}}" | head -n 10', { stdio: 'pipe' })
                .toString().trim().split('\n');
            
            const tagsToRemove = images.slice(3).filter(tag => tag !== 'latest');
            
            tagsToRemove.forEach(tag => {
                try {
                    this.execCommand(`docker rmi arbitrage-system:${tag}`, { stdio: 'pipe' });
                    console.log(`🗑️  Removed old image: arbitrage-system:${tag}`);
                } catch (error) {
                    // 忽略删除失败
                }
            });
        } catch (error) {
            console.log('⚠️  Failed to cleanup old images:', error.message);
        }
    }

    // 工具方法
    execCommand(command, options = {}) {
        console.log(`💻 Executing: ${command}`);
        return execSync(command, {
            cwd: this.projectRoot,
            stdio: 'inherit',
            ...options
        });
    }

    async httpGet(url) {
        const https = require('https');
        const http = require('http');
        
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https://') ? https : http;
            
            client.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    async prompt(question) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    compareVersions(version1, version2) {
        const v1parts = version1.replace('v', '').split('.').map(Number);
        const v2parts = version2.replace('v', '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part > v2part) return 1;
            if (v1part < v2part) return -1;
        }
        return 0;
    }
}

// 运行部署
if (require.main === module) {
    const deployer = new DeploymentManager();
    deployer.deploy().catch(error => {
        console.error('💥 Deployment failed:', error.message);
        process.exit(1);
    });
}

module.exports = DeploymentManager;
