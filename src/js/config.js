// 全局配置和常量
const CONFIG = {
  // 基础配置
  app: {
    name: 'Impossible Arbitrage System',
    version: '1.0.0',
    updateInterval: 30000, // 30秒
    maxRetries: 3
  },
  
  // 交易配置
  trading: {
    minSpread: 0.05,
    minProfit: 0.02,
    maxPositionSize: 10000,
    defaultLeverage: 1,
    supportedExchanges: ['binance', 'okx', 'bybit'],
    supportedSymbols: ['BTC-USDT', 'ETH-USDT', 'ADA-USDT', 'SOL-USDT'],
    arbitrageTypes: {
      'futures-futures': '期期套利',
      'futures-spot': '期现套利',
      'spot-spot': '现现套利'
    }
  },
  
  // UI配置
  ui: {
    defaultTab: 'dashboard',
    autoRefresh: true,
    notifications: true,
    theme: 'dark',
    pageSize: 20
  },
  
  // API配置
  api: {
    baseURL: window.location.hostname === 'localhost' 
      ? 'http://localhost:8080/api/v1' 
      : 'https://api.arbitrage-system.com/api/v1',
    timeout: 30000,
    retryDelay: 1000
  },
  
  // WebSocket配置
  websocket: {
    url: window.location.hostname === 'localhost' 
      ? 'ws://localhost:8080/ws' 
      : 'wss://api.arbitrage-system.com/ws',
    reconnectDelay: 5000,
    maxReconnectAttempts: 10
  },
  
  // 交易所配置
  exchanges: {
    binance: {
      name: 'Binance',
      color: '#f59e0b',
      textColor: '#000',
      fees: { maker: 0.0002, taker: 0.0004 }
    },
    okx: {
      name: 'OKX',
      color: '#3b82f6',
      textColor: '#fff',
      fees: { maker: 0.0002, taker: 0.0005 }
    },
    bybit: {
      name: 'Bybit',
      color: '#8b5cf6',
      textColor: '#fff',
      fees: { maker: 0.0001, taker: 0.0006 }
    }
  },
  
  // 本地存储键名
  storage: {
    filters: 'arbitrage_filters',
    rules: 'arbitrage_rules',
    settings: 'arbitrage_settings',
    apiKeys: 'arbitrage_api_keys'
  }
};

// 状态管理
const STATE = {
  // 全局状态
  isLoading: false,
  currentTab: 'dashboard',
  autoTradingEnabled: false,
  
  // 数据状态
  opportunities: [],
  activeStrategies: [],
  orderRecords: [],
  rules: [],
  
  // 筛选状态
  filters: {
    arbitrageType: 'futures-futures',
    minSpread: 0.05,
    minProfit: 0.02,
    symbolFilter: '',
    exchangeA: '',
    exchangeB: '',
    fundingPeriod: '',
    openSpreadThreshold: 0.06
  },
  
  // WebSocket连接状态
  websocket: {
    connected: false,
    reconnectAttempts: 0,
    lastPing: null
  },
  
  // 用户状态
  user: {
    authenticated: false,
    profile: null,
    settings: {}
  }
};

// 事件管理器
const EVENT_MANAGER = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },
  
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
};

// 导出到全局
window.CONFIG = CONFIG;
window.STATE = STATE;
window.EVENT_MANAGER = EVENT_MANAGER;
