#!/usr/bin/env node

/**
 * Build Script for Impossible Arbitrage System
 * Usage: node scripts/build.js [options]
 * 
 * Options: --production, --watch, --analyze
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildManager {
    constructor() {
        this.options = this.parseOptions(process.argv.slice(2));
        this.projectRoot = path.resolve(__dirname, '..');
        this.isProduction = this.options.production || process.env.NODE_ENV === 'production';
        
        console.log(`🔨 Build Manager - Mode: ${this.isProduction ? 'Production' : 'Development'}`);
    }

    parseOptions(args) {
        return {
            production: args.includes('--production'),
            watch: args.includes('--watch'),
            analyze: args.includes('--analyze')
        };
    }

    async build() {
        try {
            console.log('\n=== Starting Build Process ===\n');

            // 1. 清理构建目录
            await this.cleanBuildDirectory();
            
            // 2. 构建CSS
            await this.buildCSS();
            
            // 3. 构建JavaScript
            await this.buildJavaScript();
            
            // 4. 优化资源
            if (this.isProduction) {
                await this.optimizeAssets();
            }
            
            // 5. 生成资源映射
            await this.generateAssetManifest();
            
            // 6. 生成Service Worker (PWA支持)
            if (this.isProduction) {
                await this.generateServiceWorker();
            }
            
            console.log('\n✅ Build completed successfully!');
            this.printBuildStats();
            
        } catch (error) {
            console.error('\n❌ Build failed:', error.message);
            process.exit(1);
        }
    }

    async cleanBuildDirectory() {
        console.log('🧹 Cleaning build directory...');
        
        const buildDir = path.join(this.projectRoot, 'build');
        if (fs.existsSync(buildDir)) {
            fs.rmSync(buildDir, { recursive: true, force: true });
        }
        
        // 创建构建目录结构
        const dirs = [
            'build/css',
            'build/js', 
            'build/assets',
            'build/fonts'
        ];
        
        dirs.forEach(dir => {
            fs.mkdirSync(path.join(this.projectRoot, dir), { recursive: true });
        });
        
        console.log('✅ Build directory cleaned');
    }

    async buildCSS() {
        console.log('🎨 Building CSS...');
        
        const cssSource = path.join(this.projectRoot, 'src/css/styles.css');
        const cssOutput = path.join(this.projectRoot, 'build/css/styles.css');
        const cssMinOutput = path.join(this.projectRoot, 'build/css/styles.min.css');
        
        // 复制原始CSS
        fs.copyFileSync(cssSource, cssOutput);
        
        if (this.isProduction) {
            // 使用PostCSS进行处理和压缩
            try {
                const postcssConfig = this.createPostCSSConfig();
                this.execCommand(`npx postcss ${cssSource} -o ${cssMinOutput} --config ${postcssConfig}`);
                console.log('✅ CSS minified successfully');
            } catch (error) {
                console.log('⚠️  PostCSS not available, using basic minification');
                await this.minifyCSSBasic(cssSource, cssMinOutput);
            }
        }
        
        console.log('✅ CSS build completed');
    }

    createPostCSSConfig() {
        const configPath = path.join(this.projectRoot, 'postcss.config.js');
        
        const config = `
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default'
    })
  ]
};
        `.trim();
        
        fs.writeFileSync(configPath, config);
        return configPath;
    }

    async minifyCSSBasic(input, output) {
        const css = fs.readFileSync(input, 'utf8');
        const minified = css
            .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
            .replace(/\s+/g, ' ')             // 压缩空白
            .replace(/;\s*}/g, '}')           // 移除最后的分号
            .replace(/,\s*/g, ',')            // 压缩逗号后的空格
            .replace(/:\s*/g, ':')            // 压缩冒号后的空格
            .replace(/{\s*/g, '{')            // 压缩大括号后的空格
            .replace(/}\s*/g, '}')            // 压缩大括号前的空格
            .trim();
            
        fs.writeFileSync(output, minified);
    }

    async buildJavaScript() {
        console.log('📦 Building JavaScript...');
        
        const jsFiles = [
            'config.js',
            'utils.js', 
            'api.js',
            'components.js',
            'main.js'
        ];
        
        const buildJsDir = path.join(this.projectRoot, 'build/js');
        
        // 复制并处理JavaScript文件
        for (const file of jsFiles) {
            const source = path.join(this.projectRoot, 'src/js', file);
            const dest = path.join(buildJsDir, file);
            
            if (fs.existsSync(source)) {
                if (this.isProduction) {
                    await this.minifyJavaScript(source, dest);
                } else {
                    fs.copyFileSync(source, dest);
                }
            }
        }
        
        // 创建合并的bundle (可选)
        if (this.isProduction) {
            await this.createBundle(jsFiles, buildJsDir);
        }
        
        console.log('✅ JavaScript build completed');
    }

    async minifyJavaScript(input, output) {
        const js = fs.readFileSync(input, 'utf8');
        
        // 基本的JS压缩 (移除注释和多余空白)
        const minified = js
            .replace(/\/\*[\s\S]*?\*\//g, '')    // 移除块注释
            .replace(/\/\/.*$/gm, '')            // 移除行注释
            .replace(/\s+/g, ' ')                // 压缩空白
            .replace(/;\s*}/g, '}')              // 移除分号
            .replace(/,\s*/g, ',')               // 压缩逗号
            .replace(/{\s*/g, '{')               // 压缩大括号
            .replace(/}\s*/g, '}')               // 压缩大括号
            .trim();
        
        fs.writeFileSync(output, minified);
    }

    async createBundle(jsFiles, buildJsDir) {
        console.log('📦 Creating JavaScript bundle...');
        
        let bundleContent = '';
        
        jsFiles.forEach(file => {
            const filePath = path.join(buildJsDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                bundleContent += `\n// === ${file} ===\n${content}\n`;
            }
        });
        
        const bundlePath = path.join(buildJsDir, 'bundle.min.js');
        fs.writeFileSync(bundlePath, bundleContent);
        
        console.log('✅ Bundle created');
    }

    async optimizeAssets() {
        console.log('🖼️  Optimizing assets...');
        
        const assetsDir = path.join(this.projectRoot, 'src/assets');
        const buildAssetsDir = path.join(this.projectRoot, 'build/assets');
        
        if (fs.existsSync(assetsDir)) {
            // 复制并优化图片 (如果有的话)
            this.execCommand(`cp -r ${assetsDir}/* ${buildAssetsDir}/`);
            
            // 这里可以添加图片压缩逻辑
            console.log('✅ Assets optimized');
        }
    }

    async generateAssetManifest() {
        console.log('📋 Generating asset manifest...');
        
        const buildDir = path.join(this.projectRoot, 'build');
        const manifest = {};
        
        // 扫描构建文件并生成清单
        const scanDirectory = (dir, prefix = '') => {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    scanDirectory(filePath, `${prefix}${file}/`);
                } else {
                    const relativePath = `${prefix}${file}`;
                    const stats = fs.statSync(filePath);
                    
                    manifest[relativePath] = {
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        hash: this.generateFileHash(filePath)
                    };
                }
            });
        };
        
        scanDirectory(buildDir);
        
        const manifestPath = path.join(buildDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log('✅ Asset manifest generated');
    }

    generateFileHash(filePath) {
        const crypto = require('crypto');
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('md5');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex').substring(0, 8);
    }

    async generateServiceWorker() {
        console.log('🔧 Generating Service Worker...');
        
        const swContent = `
// Service Worker for Arbitrage System
const CACHE_NAME = 'arbitrage-system-v${Date.now()}';
const urlsToCache = [
  '/',
  '/css/styles.min.css',
  '/js/bundle.min.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 返回缓存版本或从网络获取
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
        `.trim();
        
        const swPath = path.join(this.projectRoot, 'build/sw.js');
        fs.writeFileSync(swPath, swContent);
        
        console.log('✅ Service Worker generated');
    }

    printBuildStats() {
        console.log('\n📊 Build Statistics:');
        
        const buildDir = path.join(this.projectRoot, 'build');
        const manifestPath = path.join(buildDir, 'manifest.json');
        
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            let totalSize = 0;
            let fileCount = 0;
            
            Object.entries(manifest).forEach(([file, info]) => {
                totalSize += info.size;
                fileCount++;
                console.log(`  📄 ${file}: ${this.formatFileSize(info.size)}`);
            });
            
            console.log(`\n📦 Total: ${fileCount} files, ${this.formatFileSize(totalSize)}`);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    execCommand(command, options = {}) {
        console.log(`💻 Executing: ${command}`);
        return execSync(command, {
            cwd: this.projectRoot,
            stdio: 'inherit',
            ...options
        });
    }
}

// 运行构建
if (require.main === module) {
    const builder = new BuildManager();
    builder.build().catch(error => {
        console.error('💥 Build failed:', error.message);
        process.exit(1);
    });
}

module.exports = BuildManager;
