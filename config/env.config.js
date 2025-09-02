// Environment Configuration
const ENV_CONFIG = {
  development: {
    // 服务器配置
    server: {
      port: 8080,
      host: 'localhost',
      cors: {
        enabled: true,
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true
      }
    },
    
    // 数据库配置
    database: {
      type: 'sqlite',
      host: 'localhost',
      port: 5432,
      database: 'arbitrage_dev',
      username: 'dev_user',
      password: 'dev_password',
      synchronize: true,
      logging: true,
      ssl: false
    },
    
    // Redis配置
    redis: {
      host: 'localhost',
      port: 6379,
      password: null,
      database: 0,
      keyPrefix: 'arb:dev:'
    },
    
    // 日志配置
    logging: {
      level: 'debug',
      file: './logs/development.log',
      console: true,
      format: 'combined',
      maxFiles: 5,
      maxSize: '10m'
    },
    
    // 交易配置
    trading: {
      testMode: true,
      demoTrading: true,
      maxPositionSize: 1000, // USDT
      minOrderAmount: 10,
      slippage: 0.001,
      useTestnet: true
    },
    
    // 安全配置
    security: {
      jwtSecret: 'dev-jwt-secret-key-2024',
      jwtExpiresIn: '24h',
      bcryptRounds: 10,
      rateLimiting: {
        enabled: false,
        windowMs: 900000, // 15 minutes
        max: 1000 // requests per window
      }
    }
  },
  
  production: {
    // 服务器配置
    server: {
      port: process.env.PORT || 80,
      host: process.env.HOST || '0.0.0.0',
      cors: {
        enabled: true,
        origin: [
          'https://arbitrage-system.com',
          'https://www.arbitrage-system.com'
        ],
        credentials: true
      }
    },
    
    // 数据库配置
    database: {
      type: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'arbitrage_prod',
      username: process.env.DB_USER || 'prod_user',
      password: process.env.DB_PASSWORD || 'prod_password',
      synchronize: false,
      logging: false,
      ssl: {
        rejectUnauthorized: false
      },
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      }
    },
    
    // Redis配置
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      database: parseInt(process.env.REDIS_DB) || 0,
      keyPrefix: 'arb:prod:',
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined
    },
    
    // 日志配置
    logging: {
      level: 'info',
      file: './logs/production.log',
      console: false,
      format: 'json',
      maxFiles: 30,
      maxSize: '50m',
      compress: true
    },
    
    // 交易配置
    trading: {
      testMode: false,
      demoTrading: false,
      maxPositionSize: 50000, // USDT
      minOrderAmount: 100,
      slippage: 0.0005,
      useTestnet: false
    },
    
    // 安全配置
    security: {
      jwtSecret: process.env.JWT_SECRET || 'production-jwt-secret-key',
      jwtExpiresIn: '1h',
      bcryptRounds: 12,
      rateLimiting: {
        enabled: true,
        windowMs: 900000, // 15 minutes
        max: 100 // requests per window
      }
    }
  },
  
  staging: {
    // 继承生产环境配置，但使用测试数据
    ...this.production,
    
    // 覆盖特定配置
    database: {
      ...this.production.database,
      database: 'arbitrage_staging',
      synchronize: true,
      logging: true
    },
    
    trading: {
      ...this.production.trading,
      testMode: true,
      maxPositionSize: 5000,
      useTestnet: true
    },
    
    logging: {
      ...this.production.logging,
      level: 'debug',
      console: true
    }
  }
};

// 获取当前环境配置
function getEnvConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = ENV_CONFIG[env] || ENV_CONFIG.development;
  
  return {
    ...config,
    environment: env,
    isProduction: env === 'production',
    isDevelopment: env === 'development',
    isStaging: env === 'staging'
  };
}

// 验证必要的环境变量
function validateEnvironment() {
  const requiredVars = [];
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    requiredVars.push(
      'JWT_SECRET',
      'DB_HOST',
      'DB_PASSWORD',
      'ENCRYPTION_KEY'
    );
  }
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ENV_CONFIG, 
    getEnvConfig, 
    validateEnvironment 
  };
} else {
  window.ENV_CONFIG = ENV_CONFIG;
  window.getEnvConfig = getEnvConfig;
}
