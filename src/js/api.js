// API 请求管理器
class ApiManager {
    constructor() {
        this.baseURL = CONFIG.api.baseURL;
        this.timeout = CONFIG.api.timeout;
        this.retryDelay = CONFIG.api.retryDelay;
        this.maxRetries = CONFIG.app.maxRetries;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            data = null,
            headers = {},
            retries = this.maxRetries
        } = options;

        const url = `${this.baseURL}${endpoint}`;
        const requestOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            body: data ? JSON.stringify(data) : null
        };

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, requestOptions);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                return result;
            } catch (error) {
                console.error(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, error);
                
                if (attempt === retries) {
                    throw error;
                }
                
                // 等待后重试
                await this.delay(this.retryDelay * Math.pow(2, attempt));
            }
        }
    }

    // 工具方法：延迟
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // GET 请求
    async get(endpoint, params = {}) {
        const queryString = Object.keys(params).length > 0 
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return this.request(`${endpoint}${queryString}`);
    }

    // POST 请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            data
        });
    }

    // PUT 请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            data
        });
    }

    // DELETE 请求
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// API 服务类
class ApiService {
    constructor() {
        this.api = new ApiManager();
    }

    // 市场数据相关
    async getOpportunities(filters = {}) {
        try {
            // 在真实环境中，这里会调用实际的API
            // return await this.api.get('/market/opportunities', filters);
            
            // 现在返回模拟数据
            return this.generateMockOpportunities(filters);
        } catch (error) {
            console.error('Failed to fetch opportunities:', error);
            throw error;
        }
    }

    async getActiveStrategies() {
        try {
            // return await this.api.get('/strategy/active');
            return this.generateMockActiveStrategies();
        } catch (error) {
            console.error('Failed to fetch active strategies:', error);
            throw error;
        }
    }

    async getOrderRecords(filters = {}) {
        try {
            // return await this.api.get('/trading/orders', filters);
            return this.generateMockOrderRecords(filters);
        } catch (error) {
            console.error('Failed to fetch order records:', error);
            throw error;
        }
    }

    async getSystemStatus() {
        try {
            // return await this.api.get('/system/status');
            return {
                status: 'online',
                activeStrategies: Math.floor(Math.random() * 5),
                totalOpportunities: Math.floor(Math.random() * 20),
                todayProfit: (Math.random() * 10 - 2).toFixed(2),
                totalBalance: (50000 + Math.random() * 50000).toFixed(0),
                successRate: (Math.random() * 30 + 70).toFixed(1),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to fetch system status:', error);
            throw error;
        }
    }

    // 交易相关
    async executeOrder(orderData) {
        try {
            // return await this.api.post('/trading/execute', orderData);
            console.log('Executing order:', orderData);
            return {
                success: true,
                orderId: 'ORD_' + Date.now(),
                message: 'Order executed successfully'
            };
        } catch (error) {
            console.error('Failed to execute order:', error);
            throw error;
        }
    }

    async closePosition(positionId, closeData) {
        try {
            // return await this.api.post(`/trading/close/${positionId}`, closeData);
            console.log('Closing position:', positionId, closeData);
            return {
                success: true,
                message: 'Position closed successfully'
            };
        } catch (error) {
            console.error('Failed to close position:', error);
            throw error;
        }
    }

    // 规则管理
    async saveRule(ruleData) {
        try {
            // return await this.api.post('/strategy/rules', ruleData);
            const rules = this.getRulesFromStorage();
            const newRule = {
                id: 'RULE_' + Date.now(),
                ...ruleData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            rules.push(newRule);
            this.saveRulesToStorage(rules);
            return newRule;
        } catch (error) {
            console.error('Failed to save rule:', error);
            throw error;
        }
    }

    async deleteRule(ruleId) {
        try {
            // return await this.api.delete(`/strategy/rules/${ruleId}`);
            const rules = this.getRulesFromStorage();
            const updatedRules = rules.filter(rule => rule.id !== ruleId);
            this.saveRulesToStorage(updatedRules);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete rule:', error);
            throw error;
        }
    }

    // 本地存储辅助方法
    getRulesFromStorage() {
        try {
            const rules = localStorage.getItem(CONFIG.storage.rules);
            return rules ? JSON.parse(rules) : [];
        } catch (error) {
            console.error('Failed to get rules from storage:', error);
            return [];
        }
    }

    saveRulesToStorage(rules) {
        try {
            localStorage.setItem(CONFIG.storage.rules, JSON.stringify(rules));
        } catch (error) {
            console.error('Failed to save rules to storage:', error);
        }
    }

    async getRules() {
        try {
            // 在实际环境中，这里会调用API获取规则列表
            // return await this.api.get('/strategy/rules');
            
            // 目前使用本地存储的规则
            return this.getRulesFromStorage();
        } catch (error) {
            console.error('Failed to get rules:', error);
            return [];
        }
    }

    // 模拟数据生成方法
    generateMockOpportunities(filters = {}) {
        const symbols = CONFIG.trading.supportedSymbols;
        const exchanges = CONFIG.trading.supportedExchanges;
        const mockOpportunities = [];
        const count = Math.floor(Math.random() * 8) + 12; // More data

        for (let i = 0; i < count; i++) {
            const symbol = symbols[i % symbols.length];
            const buyExchange = exchanges[i % exchanges.length];
            let sellExchange = exchanges[(i + 1) % exchanges.length];
            if (buyExchange === sellExchange) {
                sellExchange = exchanges[(i + 2) % exchanges.length];
            }

            const basePrice = Math.random() * 50000 + 20000;
            const spread = (Math.random() * 0.3 + 0.05);
            const buyPrice = basePrice * (1 - spread / 200);
            const sellPrice = basePrice * (1 + spread / 200);

            const buyBid = buyPrice * (1 - Math.random() * 0.0002);
            const buyAsk = buyPrice * (1 + Math.random() * 0.0002);
            const sellBid = sellPrice * (1 - Math.random() * 0.0002);
            const sellAsk = sellPrice * (1 + Math.random() * 0.0002);

            const spotSpread = (sellPrice - buyPrice) / buyPrice * 100;
            const buySpreadPercent = (buyAsk - buyBid) / buyBid * 100;
            const sellSpreadPercent = (sellAsk - sellBid) / sellBid * 100;
            const estimatedProfit = spotSpread - (buySpreadPercent + sellSpreadPercent) / 2 - 0.04;
            const amplitude24h = Math.random() * 8 + 2;
            const volume24h = Math.random() * 10000000 + 500000;
            const buyFundingRate = (Math.random() * 0.0004 - 0.0002);
            const sellFundingRate = (Math.random() * 0.0004 - 0.0002);
            
            const now = new Date();
            const nextSettlement = new Date(now.getTime() + Math.random() * 8 * 60 * 60 * 1000);
            
            const positionSize = Math.random() * 8 + 2; // e.g., 2-10 BTC/ETH

            mockOpportunities.push({
                id: `OPP_${Date.now()}_${i}`,
                symbol: symbol,
                buy_exchange: buyExchange,
                sell_exchange: sellExchange,
                buy_price: buyPrice,
                sell_price: sellPrice,
                spot_spread: spotSpread,
                buy_bid: buyBid,
                buy_ask: buyAsk,
                buy_spread_percent: buySpreadPercent,
                sell_bid: sellBid,
                sell_ask: sellAsk,
                sell_spread_percent: sellSpreadPercent,
                estimated_profit: estimatedProfit,
                amplitude_24h: amplitude24h,
                volume_24h: volume24h,
                buy_funding_rate: buyFundingRate,
                sell_funding_rate: sellFundingRate,
                funding_end_time: nextSettlement.toISOString(),
                funding_cycle: '8H', // Settlement cycle
                position_size: positionSize,
                type: 'futures-futures',
                confidence: Math.random() * 40 + 60,
                created_at: new Date().toISOString()
            });
        }
        
        return {
            opportunities: mockOpportunities.sort((a, b) => b.estimated_profit - a.estimated_profit),
            total_count: mockOpportunities.length,
            filters_applied: filters
        };
    }

    generateMockActiveStrategies() {
        const strategies = [];
        const count = Math.floor(Math.random() * 8) + 2;
        
        for (let i = 0; i < count; i++) {
            const symbol = CONFIG.trading.supportedSymbols[i % CONFIG.trading.supportedSymbols.length];
            const exchange = CONFIG.trading.supportedExchanges[i % CONFIG.trading.supportedExchanges.length];
            
            strategies.push({
                id: `STRAT_${Date.now()}_${i}`,
                symbol: symbol,
                exchange: exchange,
                type: Math.random() > 0.5 ? 'long' : 'short',
                duration: `${Math.floor(Math.random() * 12)}h ${Math.floor(Math.random() * 60)}m`,
                pnl: Math.random() * 600 - 100,
                pnl_percent: Math.random() * 10 - 2,
                status: Math.random() > 0.2 ? 'running' : 'pending',
                created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
            });
        }
        
        return {
            strategies: strategies,
            total_count: strategies.length
        };
    }

    generateMockOrderRecords(filters = {}) {
        const orders = [];
        const count = Math.floor(Math.random() * 5) + 5; // 5-10 arbitrage pairs
        
        for (let i = 0; i < count; i++) {
            const symbol = CONFIG.trading.supportedSymbols[i % CONFIG.trading.supportedSymbols.length];
            const arbitrage_id = `ARB-${String(i + 1).padStart(3, '0')}`;
            const amount = Math.random() * 2000 + 500;
            const pnl = Math.random() * 20 - 5;
            const created_at = new Date(Date.now() - Math.random() * 7 * 86400000).toISOString();
            
            const longExchange = CONFIG.trading.supportedExchanges[i % CONFIG.trading.supportedExchanges.length];
            let shortExchange = CONFIG.trading.supportedExchanges[(i + 1) % CONFIG.trading.supportedExchanges.length];
            if (longExchange === shortExchange) shortExchange = CONFIG.trading.supportedExchanges[(i + 2) % CONFIG.trading.supportedExchanges.length];

            const basePrice = 40000 + Math.random() * 10000;
            const longPrice = basePrice * (1 - Math.random() * 0.001);
            const shortPrice = basePrice * (1 + Math.random() * 0.001);

            const all_statuses = ['filled', 'partial', 'cancelled'];
            const long_status = all_statuses[Math.floor(Math.random() * all_statuses.length)];
            const short_status = all_statuses[Math.floor(Math.random() * all_statuses.length)];

            // Create LONG record
            orders.push({
                id: `ORDER_L_${Date.now()}_${i}`,
                arbitrage_id: arbitrage_id,
                symbol: symbol,
                exchange: longExchange,
                side: 'buy',
                arbitrage_type: '期期套利',
                price: longPrice,
                status: long_status,
                amount: amount,
                quantity: amount / longPrice,
                base_quantity: amount / longPrice,
                fee_open: amount * 0.0004,
                fee_close: amount * 0.0004,
                funding_rate: (Math.random() * 0.001 - 0.0005),
                pnl: pnl,
                created_at: created_at,
            });
            
            // Create SHORT record
            orders.push({
                id: `ORDER_S_${Date.now()}_${i}`,
                arbitrage_id: arbitrage_id,
                symbol: symbol,
                exchange: shortExchange,
                side: 'sell',
                arbitrage_type: '期期套利',
                price: shortPrice,
                status: short_status,
                amount: amount,
                quantity: amount / shortPrice,
                base_quantity: amount / shortPrice,
                fee_open: amount * 0.0005,
                fee_close: amount * 0.0005,
                funding_rate: (Math.random() * 0.001 - 0.0005),
                pnl: -pnl,
                created_at: created_at,
            });
        }
        
        return {
            orders: orders,
            total_count: orders.length,
            filters_applied: filters
        };
    }
}

// WebSocket 管理器
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.url = CONFIG.websocket.url;
        this.reconnectDelay = CONFIG.websocket.reconnectDelay;
        this.maxReconnectAttempts = CONFIG.websocket.maxReconnectAttempts;
        this.reconnectAttempts = 0;
        this.isConnecting = false;
    }

    connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;
        console.log('Connecting to WebSocket...');

        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                STATE.websocket.connected = true;
                STATE.websocket.reconnectAttempts = 0;
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                EVENT_MANAGER.emit('websocket:connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                STATE.websocket.connected = false;
                this.isConnecting = false;
                EVENT_MANAGER.emit('websocket:disconnected');
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        STATE.websocket.connected = false;
        this.reconnectAttempts = this.maxReconnectAttempts; // 防止自动重连
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'opportunities':
                STATE.opportunities = data.data;
                EVENT_MANAGER.emit('opportunities:updated', data.data);
                break;
            case 'system_status':
                EVENT_MANAGER.emit('system_status:updated', data.data);
                break;
            case 'order_update':
                EVENT_MANAGER.emit('order:updated', data.data);
                break;
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached, giving up');
            return;
        }

        this.reconnectAttempts++;
        STATE.websocket.reconnectAttempts = this.reconnectAttempts;

        console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }
}

// 创建全局实例
const apiService = new ApiService();
const wsManager = new WebSocketManager();

// 导出到全局
window.apiService = apiService;
window.wsManager = wsManager;
