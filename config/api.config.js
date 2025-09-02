// API Configuration
const API_CONFIG = {
  // 环境配置
  environment: process.env.NODE_ENV || 'development',
  
  // API端点配置
  endpoints: {
    development: {
      baseURL: 'http://localhost:8080/api/v1',
      websocketURL: 'ws://localhost:8080/ws'
    },
    production: {
      baseURL: 'https://api.arbitrage-system.com/api/v1',
      websocketURL: 'wss://api.arbitrage-system.com/ws'
    }
  },
  
  // 交易所API配置
  exchanges: {
    binance: {
      name: 'Binance',
      testnet: {
        baseURL: 'https://testnet.binance.vision/api/v3',
        wsURL: 'wss://testnet.binance.vision/ws'
      },
      mainnet: {
        baseURL: 'https://api.binance.com/api/v3',
        wsURL: 'wss://stream.binance.com:9443/ws'
      },
      rateLimits: {
        weight: 1200, // per minute
        orders: 10 // per second
      },
      fees: {
        futures: {
          maker: 0.0002,
          taker: 0.0004
        },
        spot: {
          maker: 0.001,
          taker: 0.001
        }
      }
    },
    okx: {
      name: 'OKX',
      testnet: {
        baseURL: 'https://www.okx.com/api/v5',
        wsURL: 'wss://wspap.okx.com:8443/ws/v5/public'
      },
      mainnet: {
        baseURL: 'https://www.okx.com/api/v5',
        wsURL: 'wss://ws.okx.com:8443/ws/v5/public'
      },
      rateLimits: {
        weight: 20, // per 2 seconds
        orders: 60 // per 2 seconds
      },
      fees: {
        futures: {
          maker: 0.0002,
          taker: 0.0005
        },
        spot: {
          maker: 0.0008,
          taker: 0.001
        }
      }
    },
    bybit: {
      name: 'Bybit',
      testnet: {
        baseURL: 'https://api-testnet.bybit.com/v5',
        wsURL: 'wss://stream-testnet.bybit.com/v5/public/linear'
      },
      mainnet: {
        baseURL: 'https://api.bybit.com/v5',
        wsURL: 'wss://stream.bybit.com/v5/public/linear'
      },
      rateLimits: {
        weight: 120, // per minute
        orders: 10 // per second
      },
      fees: {
        futures: {
          maker: 0.0001,
          taker: 0.0006
        },
        spot: {
          maker: 0.001,
          taker: 0.001
        }
      }
    }
  },
  
  // API端点定义
  routes: {
    // 市场数据
    market: {
      opportunities: '/market/opportunities',
      symbols: '/market/symbols',
      ticker: '/market/ticker',
      orderbook: '/market/orderbook',
      funding: '/market/funding'
    },
    
    // 交易相关
    trading: {
      orders: '/trading/orders',
      positions: '/trading/positions',
      balance: '/trading/balance',
      execute: '/trading/execute',
      close: '/trading/close'
    },
    
    // 策略管理
    strategy: {
      rules: '/strategy/rules',
      active: '/strategy/active',
      performance: '/strategy/performance',
      backtest: '/strategy/backtest'
    },
    
    // 用户管理
    user: {
      profile: '/user/profile',
      settings: '/user/settings',
      keys: '/user/api-keys',
      logs: '/user/logs'
    },
    
    // 系统状态
    system: {
      status: '/system/status',
      health: '/system/health',
      metrics: '/system/metrics'
    }
  },
  
  // 请求配置
  request: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  // WebSocket配置
  websocket: {
    reconnect: true,
    reconnectDelay: 5000,
    maxReconnectAttempts: 10,
    pingInterval: 30000,
    pongTimeout: 5000
  },
  
  // 安全配置
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-dev-key',
    apiKeyEncryption: true,
    requestSigning: true,
    tlsVersion: '1.2'
  }
};

// 根据环境获取当前配置
function getCurrentConfig() {
  const env = API_CONFIG.environment;
  return {
    ...API_CONFIG,
    currentEndpoint: API_CONFIG.endpoints[env],
    isProduction: env === 'production',
    isDevelopment: env === 'development'
  };
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, getCurrentConfig };
} else {
  window.API_CONFIG = API_CONFIG;
  window.getCurrentConfig = getCurrentConfig;
}
