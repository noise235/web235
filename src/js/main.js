// 主业务逻辑和事件处理

// 全局变量
let refreshInterval;
let opportunities = [];
let autoTradingEnabled = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Arbitrage System...');
    
    // 初始化应用
    initializeApplication();
});

// 应用初始化
async function initializeApplication() {
    try {
        // 加载用户设置
        loadUserSettings();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 初始化WebSocket连接
        // wsManager.connect();
        
        // 加载默认页面
        showTab('dashboard');
        
        // 启动自动刷新
        startAutoRefresh();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showNotification('系统初始化失败', 'error');
    }
}

// 加载用户设置
function loadUserSettings() {
    const settings = StorageUtils.get(CONFIG.storage.settings, {});
    const filters = StorageUtils.get(CONFIG.storage.filters, {});
    
    // 应用筛选设置
    Object.assign(STATE.filters, filters);
    
    // 应用界面设置
    if (settings.autoRefresh !== undefined) {
        CONFIG.ui.autoRefresh = settings.autoRefresh;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // WebSocket事件
    EVENT_MANAGER.on('websocket:connected', () => {
        console.log('WebSocket connected');
        showNotification('实时连接已建立', 'success');
    });
    
    EVENT_MANAGER.on('websocket:disconnected', () => {
        console.log('WebSocket disconnected');
        showNotification('实时连接已断开，正在重连...', 'warning');
    });
    
    EVENT_MANAGER.on('opportunities:updated', (data) => {
        STATE.opportunities = data;
        if (STATE.currentTab === 'market-monitoring') {
            MarketMonitorRenderer.renderOpportunities();
        }
    });
    
    // 窗口关闭事件处理
    window.addEventListener('beforeunload', () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
        // wsManager.disconnect();
    });
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.trade-modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 键盘快捷键处理
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + 数字键切换标签页
    if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        const tabs = ['dashboard', 'market-monitoring', 'order-records', 'rules-settings'];
        const tabIndex = parseInt(event.key) - 1;
        if (tabs[tabIndex]) {
            showTab(tabs[tabIndex]);
        }
    }
    
    // ESC键关闭模态框
    if (event.key === 'Escape') {
        ModalManager.hideAll();
    }
    
    // F5刷新当前页面数据
    if (event.key === 'F5') {
        event.preventDefault();
        refreshCurrentTab();
    }
}

// Tab 切换函数
function showTab(tabName) {
    TabManager.showTab(tabName);
}

// 刷新当前标签页数据
async function refreshCurrentTab() {
    showNotification('正在刷新数据...', 'info');
    
    try {
        switch (STATE.currentTab) {
            case 'dashboard':
                await DashboardRenderer.load();
                break;
            case 'market-monitoring':
                await MarketMonitorRenderer.scanOpportunities();
                break;
            case 'order-records':
                await OrderRecordsRenderer.refreshOrderRecords();
                break;
            case 'rules-settings':
                await RulesRenderer.loadRules();
                break;
        }
        showNotification('数据刷新完成', 'success');
    } catch (error) {
        console.error('Failed to refresh tab data:', error);
        showNotification('刷新失败，请重试', 'error');
    }
}

// 扫描套利机会
async function scanOpportunities() {
    await MarketMonitorRenderer.scanOpportunities();
}

// 启用自动交易
function enableAutoTrading() {
    const button = document.getElementById('autoTradingBtn');
    
    if (autoTradingEnabled) {
        // 停止自动交易
        autoTradingEnabled = false;
        button.textContent = '启动自动交易';
        button.className = 'btn btn-success';
        showNotification('自动交易已停止', 'warning');
    } else {
        // 启动自动交易
        if (confirm('确认启动自动交易？\n\n请确保已配置好交易规则和风险参数。')) {
            autoTradingEnabled = true;
            button.textContent = '停止自动交易';
            button.className = 'btn btn-danger';
            showNotification('自动交易已启动', 'success');
        }
    }
    
    STATE.autoTradingEnabled = autoTradingEnabled;
}

// 保存筛选条件
function saveFilters() {
    const filters = MarketMonitorRenderer.getFilters();
    StorageUtils.set(CONFIG.storage.filters, filters);
    Object.assign(STATE.filters, filters);
    showNotification('筛选条件已保存', 'success');
}

// 开仓模态框
function openPositionModal(oppJson) {
    try {
        if (typeof JSON === 'undefined') throw new Error("JSON is not defined.");
        if (typeof decodeURIComponent === 'undefined') throw new Error("decodeURIComponent is not defined.");
        
        const opp = JSON.parse(decodeURIComponent(oppJson));
        if (!opp) throw new Error("Opportunity data is null or undefined.");

        const modal = document.getElementById('positionModal');
        if (!modal) throw new Error("Modal element 'positionModal' not found.");

        const modalBody = document.getElementById('positionModalBody');
        if (!modalBody) throw new Error("Modal body element 'positionModalBody' not found.");

        if (typeof formatExchangeBadge === 'undefined') throw new Error("formatExchangeBadge function is not defined.");
        
        const profitClass = (opp.estimated_profit || 0) > 0 ? 'profit-positive' : 'profit-negative';

        const content = `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <h5 style="color: #10b981; margin: 0;">
                    套利机会: ${opp.symbol}
                </h5>
                <div style="font-size: 13px; color: #ccc;">
                    价差: <span class="${profitClass}">${(opp.spot_spread || 0).toFixed(3)}%</span> | 
                    预期收益: <span class="${profitClass}">${(opp.estimated_profit || 0).toFixed(3)}%</span>
                </div>
            </div>

            <div class="trade-form-section">
                <h5>套利详情</h5>
                <div style="display: flex; gap: 20px; justify-content: space-around; text-align: center;">
                    <div style="border: 1px solid #10b981; border-radius: 8px; padding: 15px; flex: 1;">
                        <h6 style="color: #10b981; margin-bottom: 10px;">买入 (多头)</h6>
                        <div>${formatExchangeBadge(opp.buy_exchange)}</div>
                        <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">$${(opp.buy_price || 0).toFixed(2)}</div>
                    </div>
                    <div style="border: 1px solid #ef4444; border-radius: 8px; padding: 15px; flex: 1;">
                        <h6 style="color: #ef4444; margin-bottom: 10px;">卖出 (空头)</h6>
                        <div>${formatExchangeBadge(opp.sell_exchange)}</div>
                        <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">$${(opp.sell_price || 0).toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div class="trade-form-section">
                <h5>开仓模式</h5>
                <div class="price-mode-selector">
                    <button type="button" class="price-mode-btn active" onclick="selectPriceMode('market')">市价开仓</button>
                    <button type="button" class="price-mode-btn" onclick="selectPriceMode('limit')">限价开仓</button>
                </div>
                <div class="market-warning" id="market-price-warning">
                    <strong>市价开仓警告:</strong> 市价单将以最优市场价立即执行，但最终执行价格可能与显示价格不同。
                </div>
            </div>

            <div class="trade-form-section">
                <h5>开仓金额</h5>
                <div class="control-group">
                    <label for="openAmount">金额 (USDT)</label>
                    <input type="number" id="openAmount" value="1000" min="100" max="50000" step="100">
                    <small style="color: #888; margin-top: 4px;">建议金额: $1000 - $5000 | 最小金额: $100</small>
                </div>
            </div>

            <div style="text-align: right; margin-top: 25px;">
                <button class="btn btn-secondary" onclick="closePositionModal()" style="margin-right: 10px;">取消</button>
                <button class="btn btn-success" onclick="executeOpenPosition('${encodeURIComponent(JSON.stringify(opp))}')">执行开仓</button>
            </div>
        `;
        
        modalBody.innerHTML = content;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Failed to open position modal:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Opportunity data:', oppJson);
        showNotification(`打开开仓窗口失败: ${error.message}`, 'error');
    }
}

// 设置价格模式
function selectPriceMode(mode) {
    const buttons = document.querySelectorAll('#positionModal .price-mode-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeButton = document.querySelector(`#positionModal [onclick="selectPriceMode('${mode}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    const warningSection = document.getElementById('market-price-warning');
    
    if (mode === 'market') {
        warningSection.style.display = 'block';
    } else {
        warningSection.style.display = 'none';
    }
}

// 执行开仓
async function executeOpenPosition(oppJson) {
    try {
        const opp = JSON.parse(decodeURIComponent(oppJson));
        const amount = NumberUtils.parseNumber(document.getElementById('openAmount').value, 1000);
        const leverage = 1; // 杠杆倍数暂时固定为1
        const priceMode = document.querySelector('#positionModal .price-mode-btn.active').textContent.includes('市价') ? 'market' : 'limit';
        
        // 基本验证
        if (amount < 100) {
            showNotification('开仓金额不能少于 $100', 'error');
            return;
        }
        
        const orderData = {
            symbol: opp.symbol,
            buyExchange: opp.buy_exchange,
            sellExchange: opp.sell_exchange,
            amount: amount,
            leverage: leverage,
            mode: priceMode,
            opportunityId: opp.id
        };
        
        if (priceMode === 'limit') {
            orderData.buyPrice = NumberUtils.parseNumber(document.getElementById('buyLimitPrice').value);
            orderData.sellPrice = NumberUtils.parseNumber(document.getElementById('sellLimitPrice').value);
        }
        
        // 确认对话框
        const confirmMessage = `确认开仓套利 ${opp.symbol}？\n\n` +
                             `交易对: ${opp.symbol}\n` +
                             `金额: $${amount.toLocaleString()}\n` +
                             `杠杆: ${leverage}x\n` +
                             `模式: ${priceMode === 'market' ? '市价' : '限价'}`;
        
        if (confirm(confirmMessage)) {
            showNotification('正在执行开仓...', 'info');
            
            const result = await apiService.executeOrder(orderData);
            
            if (result.success) {
                showNotification('开仓成功！', 'success');
                closePositionModal();
                
                // 刷新相关数据
                if (STATE.currentTab === 'dashboard') {
                    DashboardRenderer.load();
                }
            } else {
                showNotification(result.message || '开仓失败', 'error');
            }
        }
        
    } catch (error) {
        console.error('Failed to execute position:', error);
        showNotification('开仓执行失败', 'error');
    }
}

// 关闭开仓模态框
function closePositionModal() {
    ModalManager.hide('positionModal');
}

// 显示套利机会详情
function showOpportunityDetails(oppId) {
    const opp = STATE.opportunities.find(o => o.id === oppId);
    if (!opp) {
        showNotification('套利机会不存在', 'error');
        return;
    }
    
    const modal = document.getElementById('detailsModal');
    const modalBody = document.getElementById('detailsModalBody');
    
    const content = `
        <div class="trade-form-section">
            <h5>基本信息</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <p><strong>交易对:</strong> ${opp.symbol}</p>
                    <p><strong>套利类型:</strong> ${CONFIG.trading.arbitrageTypes[opp.type] || opp.type}</p>
                    <p><strong>价差:</strong> <span class="${formatProfitColor(opp.spread_percent)}">${NumberUtils.formatPercentage(opp.spread_percent)}</span></p>
                    <p><strong>预期收益:</strong> <span class="${formatProfitColor(opp.estimated_profit)}">${NumberUtils.formatPercentage(opp.estimated_profit)}</span></p>
                </div>
                <div>
                    <p><strong>买入交易所:</strong> ${formatExchangeBadge(opp.buy_exchange)}</p>
                    <p><strong>卖出交易所:</strong> ${formatExchangeBadge(opp.sell_exchange)}</p>
                    <p><strong>买入价格:</strong> $${opp.buy_price.toFixed(2)}</p>
                    <p><strong>卖出价格:</strong> $${opp.sell_price.toFixed(2)}</p>
                </div>
            </div>
        </div>
        
        <div class="trade-form-section">
            <h5>市场数据</h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <p><strong>24H交易量:</strong> $${NumberUtils.formatLargeNumber(opp.volume_24h)}</p>
                    <p><strong>建议仓位:</strong> $${NumberUtils.formatLargeNumber(opp.position_size)}</p>
                </div>
                <div>
                    <p><strong>置信度:</strong> ${generateConfidenceBar(opp.confidence)} ${opp.confidence.toFixed(1)}%</p>
                    <p><strong>创建时间:</strong> ${TimeUtils.formatTimestamp(opp.created_at)}</p>
                </div>
            </div>
        </div>
    `;
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

/**
 * 打开订单详情模态框
 * @param {string} orderJson - 订单对象的 JSON 字符串
 */
function openDetailsModal(orderJson) {
    try {
        const order = JSON.parse(decodeURIComponent(orderJson));
        const modal = document.getElementById('detailsModal');
        const modalBody = document.getElementById('detailsModalBody');

        if (!modal || !modalBody) {
            console.error("Details modal elements not found.");
            showNotification("无法打开详情窗口: 缺少必要的页面元素。", "error");
            return;
        }

        const pnlClass = formatProfitColor(order.pnl);
        const statusMap = {
            filled: { text: '已成交', class: 'status-filled' },
            partial: { text: '部分成交', class: 'status-partial' },
            pending: { text: '挂单中', class: 'status-pending' },
            cancelled: { text: '已取消', class: 'status-cancelled' },
            closing: { text: '关单中', class: 'status-closing' }
        };
        const status = statusMap[order.status] || { text: order.status, class: '' };

        const content = `
            <div class="details-reimagined-compact">
                <p class="details-main-title">交易详情: ${order.arbitrage_id}-${order.side.toUpperCase()}</p>
                <div class="details-columns">
                    <div class="details-column">
                        <div class="details-section">
                            <p class="section-title"><span class="icon">📊</span> 交易信息</p>
                            <div class="details-kv-grid">
                                <p><span class="key">套利组合:</span><span class="value">${order.arbitrage_id}</span></p>
                                <p><span class="key">交易类型:</span><span class="value"><span class="trade-type-badge ${order.side === 'buy' ? 'badge-long' : 'badge-short'}">${order.side.toUpperCase()} (${order.side === 'buy' ? '买入' : '卖出'})</span></span></p>
                                <p><span class="key">交易对:</span><span class="value">${order.symbol}</span></p>
                                <p><span class="key">交易所:</span><span class="value">${formatExchangeBadge(order.exchange)}</span></p>
                                <p><span class="key">价格:</span><span class="value">$${order.price.toFixed(2)}</span></p>
                                <p><span class="key">订单状态:</span><span class="value"><span class="order-status ${status.class}">${status.text}</span></span></p>
                            </div>
                        </div>
                        <div class="details-section">
                            <p class="section-title"><span class="icon">📦</span> 数量信息</p>
                            <div class="details-kv-grid">
                                <p><span class="key">总数量:</span><span class="value">${order.quantity.toFixed(5)} ${order.symbol.split('-')[0]}</span></p>
                                <p><span class="key">当前数量:</span><span class="value">${order.base_quantity.toFixed(5)} ${order.symbol.split('-')[0]}</span></p>
                                <p><span class="key">成交比例:</span><span class="value">100.00%</span></p>
                            </div>
                        </div>
                    </div>
                    <div class="details-column">
                        <div class="details-section">
                            <p class="section-title"><span class="icon">📈</span> 盈亏分析</p>
                            <div class="details-kv-grid">
                                <p><span class="key">交易金额:</span><span class="value">$${order.amount.toFixed(2)}</span></p>
                                <p><span class="key">当前盈亏:</span><span class="value"><strong class="${pnlClass}">${order.pnl >= 0 ? '+' : '-'}$${Math.abs(order.pnl).toFixed(2)}</strong></span></p>
                                <p><span class="key">开仓手续费:</span><span class="value">$${(order.fee_open || 0).toFixed(2)}</span></p>
                                <p><span class="key">平仓手续费:</span><span class="value">$${(order.fee_close || 0).toFixed(2)}</span></p>
                                <p><span class="key">手续费总计:</span><span class="value">$${((order.fee_open || 0) + (order.fee_close || 0)).toFixed(2)}</span></p>
                                <p><span class="key">资金费率:</span><span class="value"><span class="${formatProfitColor(order.funding_rate)}">${NumberUtils.formatPercentage(order.funding_rate * 100, 3)}</span></span></p>
                            </div>
                        </div>
                        <div class="details-section">
                            <p class="section-title"><span class="icon">⏱️</span> 时间信息</p>
                            <div class="details-kv-grid">
                                <p><span class="key">创建时间:</span><span class="value">${TimeUtils.formatTimestamp(order.created_at)}</span></p>
                                <p><span class="key">预计关闭时间:</span><span class="value">${TimeUtils.formatTimestamp(new Date(new Date(order.created_at).getTime() + 86400000).toISOString())}</span></p>
                                <p><span class="key">资金缴付到期:</span><span class="value">${order.funding_time_left || '34m'}</span></p>
                                <p><span class="key">套利状态:</span><span class="value"><span style="color: #10b981;">已关闭</span></span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <div style="text-align: right; margin-top: 20px;">
                <button class="btn btn-secondary" onclick="closeDetailsModal()">关闭</button>
            </div>
        `;

        modalBody.innerHTML = content;
        modal.style.display = 'block';
    } catch (error) {
        console.error('Failed to open details modal:', error);
        showNotification(`打开详情失败: ${error.message}`, 'error');
    }
}

/**
 * 关闭订单详情模态框
 */
function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.style.display = 'none';
}

/**
 * 打开平仓模态框
 * @param {string} orderJson - 订单对象的 JSON 字符串
 */
function openClosePositionModal(orderJson) {
    try {
        const order = JSON.parse(decodeURIComponent(orderJson));
        const modal = document.getElementById('closePositionModal');
        const modalBody = document.getElementById('closePositionModalBody');

        if (!modal || !modalBody) {
            console.error("Close position modal elements not found.");
            return showNotification("无法打平仓开窗口: 缺少页面元素。", "error");
        }

        const pnlClass = formatProfitColor(order.pnl);

        const content = `
            <div class="close-modal-header">
                <div style="border: 1px solid #ef4444; border-radius: 8px; padding: 15px; text-align: center; background: rgba(239, 68, 68, 0.1);">
                    <h5 style="color: #ef4444; margin: 0;">平仓交易: ${order.arbitrage_id}-${order.side.toUpperCase()}</h5>
                    <small style="color: #ccc;">${order.side.toUpperCase()} ${order.symbol} @ ${order.exchange.toUpperCase()}</small>
                </div>
            </div>

            <div class="trade-status-grid">
                <div>
                    <small>当前价格</small>
                    <p>$${order.price.toFixed(2)}</p>
                </div>
                <div>
                    <small>持仓数量</small>
                    <p>${order.quantity.toFixed(5)}</p>
                </div>
                <div>
                    <small>当前盈亏</small>
                    <p class="${pnlClass}" style="font-weight: bold;">${order.pnl >= 0 ? '+' : '-'}$${Math.abs(order.pnl).toFixed(2)}</p>
                </div>
            </div>

            <div class="trade-form-section">
                <h5>平仓模式</h5>
                <div class="price-mode-selector">
                    <button type="button" class="price-mode-btn active" id="close-market-mode" onclick="selectClosePriceMode('market')">市价平仓</button>
                    <button type="button" class="price-mode-btn" id="close-limit-mode" onclick="selectClosePriceMode('limit')">限价平仓</button>
                </div>
                <div class="market-warning" id="close-market-warning">
                    <strong>市价平仓警告:</strong> 市价单将以最优市场价立即执行。由于市场波动和滑点，最终执行价格可能与当前价格不同。
                </div>
                <div class="limit-warning" id="close-limit-warning" style="display: none;">
                    <div class="control-group">
                        <label for="closePrice">平仓价格 (USDT)</label>
                        <input type="number" id="closePrice" value="${order.price.toFixed(2)}" step="0.01">
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeClosePositionModal()">取消</button>
                <button class="btn btn-danger" onclick="executeClosePosition('${encodeURIComponent(JSON.stringify(order))}')">执行平仓</button>
            </div>
        `;
        
        modalBody.innerHTML = content;
        modal.style.display = 'block';

    } catch (error) {
        console.error('Failed to open close position modal:', error);
        showNotification(`平仓操作失败: ${error.message}`, 'error');
    }
}

/**
 * 关闭平仓模态框
 */
function closeClosePositionModal() {
    const modal = document.getElementById('closePositionModal');
    if (modal) modal.style.display = 'none';
}

/**
 * 在平仓模态框中选择价格模式 (市价/限价)
 * @param {string} mode - 'market' or 'limit'
 */
function selectClosePriceMode(mode) {
    document.getElementById('close-market-mode').classList.toggle('active', mode === 'market');
    document.getElementById('close-limit-mode').classList.toggle('active', mode === 'limit');
    document.getElementById('close-market-warning').style.display = mode === 'market' ? 'block' : 'none';
    document.getElementById('close-limit-warning').style.display = mode === 'limit' ? 'block' : 'none';
}

/**
 * 执行平仓操作
 * @param {string} orderJson - 订单对象的 JSON 字符串
 */
async function executeClosePosition(orderJson) {
    try {
        const order = JSON.parse(decodeURIComponent(orderJson));
        const priceMode = document.querySelector('#closePositionModal .price-mode-btn.active').id.includes('market') ? 'market' : 'limit';
        let closePrice = 'market';

        let confirmMessage = `确认以 ${priceMode === 'market' ? '市价' : '限价'} 平仓套利 ${order.arbitrage_id}？\n\n`;

        if (priceMode === 'limit') {
            const priceInput = document.getElementById('closePrice');
            if (!priceInput || !priceInput.value) {
                return showNotification('请输入有效的平仓价格!', 'error');
            }
            closePrice = parseFloat(priceInput.value);
            confirmMessage += `平仓价格: $${closePrice.toFixed(2)}\n`;
        }
        
        const confirmed = confirm(confirmMessage);
        
        if (confirmed) {
            showNotification(`正在发送平仓指令 for ${order.arbitrage_id}...`, 'info');
            
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            showNotification(`套利 ${order.arbitrage_id} 已成功平仓！`, 'success');
            closeClosePositionModal();
            
            if (window.navManager && navManager.getActivePage() === 'orderRecords') {
                OrderRecordsRenderer.refreshOrderRecords();
            }
        }
    } catch (error) {
        console.error('Failed to execute close position:', error);
        showNotification(`执行平仓失败: ${error.message}`, 'error');
    }
}


// 关闭策略
async function closeStrategy(strategyId) {
    if (confirm('确认关闭此策略？\n\n关闭后将自动平仓所有相关仓位。')) {
        try {
            showNotification('正在关闭策略...', 'info');
            
            const result = await apiService.closePosition(strategyId, {
                mode: 'market',
                reason: 'manual_close'
            });
            
            if (result.success) {
                showNotification('策略关闭成功！', 'success');
                // 刷新策略列表
                DashboardRenderer.loadActiveStrategies();
            } else {
                showNotification(result.message || '策略关闭失败', 'error');
            }
        } catch (error) {
            console.error('Failed to close strategy:', error);
            showNotification('策略关闭失败', 'error');
        }
    }
}

// 刷新订单记录
async function refreshOrderRecords() {
    await OrderRecordsRenderer.refreshOrderRecords();
}

// 导出订单记录
function exportOrderRecords() {
    showNotification('导出功能开发中...', 'info');
}

// 规则管理相关函数
function createNewRule() {
    ModalManager.show('rulesModal');
    // 重置表单
    resetRuleForm();
}

function useTemplate() {
    showNotification('模板功能开发中...', 'info');
}

function exportRules() {
    const rules = apiService.getRulesFromStorage();
    if (rules.length === 0) {
        showNotification('暂无规则可导出', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(rules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `arbitrage_rules_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('规则已导出', 'success');
}

function importRules() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const rules = JSON.parse(event.target.result);
                if (Array.isArray(rules)) {
                    apiService.saveRulesToStorage(rules);
                    showNotification(`成功导入 ${rules.length} 条规则`, 'success');
                    RulesRenderer.loadRules();
                } else {
                    showNotification('文件格式错误', 'error');
                }
            } catch (error) {
                console.error('Import rules failed:', error);
                showNotification('导入失败，请检查文件格式', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// 编辑规则
function editRule(ruleId) {
    const rules = apiService.getRulesFromStorage();
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) {
        showNotification('规则不存在', 'error');
        return;
    }
    
    // 加载规则数据到表单
    loadRuleToForm(rule);
    ModalManager.show('rulesModal');
}

// 删除规则
async function deleteRule(ruleId) {
    if (confirm('确认删除此规则？\n\n删除后无法恢复。')) {
        try {
            await apiService.deleteRule(ruleId);
            showNotification('规则删除成功', 'success');
            RulesRenderer.loadRules();
        } catch (error) {
            console.error('Failed to delete rule:', error);
            showNotification('删除失败', 'error');
        }
    }
}

// 重置规则表单
function resetRuleForm() {
    const inputs = document.querySelectorAll('#rulesModal input, #rulesModal select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

// 加载规则到表单
function loadRuleToForm(rule) {
    Object.keys(rule).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = rule[key];
            } else {
                element.value = rule[key];
            }
        }
    });
}

// 关闭规则模态框
function closeRulesModal() {
    ModalManager.hide('rulesModal');
}

// 自动刷新功能
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(async () => {
        if (!autoTradingEnabled && CONFIG.ui.autoRefresh) {
            try {
                // 更新Dashboard指标
                if (STATE.currentTab === 'dashboard') {
                    DashboardRenderer.updateMetrics();
                }
                
                // 更新当前页面数据
                if (STATE.currentTab === 'market-monitoring') {
                    // 静默扫描机会，不显示加载状态
                    const data = await apiService.getOpportunities(MarketMonitorRenderer.getFilters());
                    STATE.opportunities = data.opportunities || [];
                    MarketMonitorRenderer.renderOpportunities();
                }
            } catch (error) {
                console.error('Auto refresh failed:', error);
            }
        }
    }, CONFIG.app.updateInterval);
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        word-wrap: break-word;
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    // 设置背景色
    switch (type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        case 'warning':
            notification.style.background = '#f59e0b';
            break;
        default:
            notification.style.background = '#3b82f6';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动消失
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// 导出主要函数到全局作用域
window.showTab = showTab;
window.scanOpportunities = scanOpportunities;
window.enableAutoTrading = enableAutoTrading;
window.saveFilters = saveFilters;
window.openPositionModal = openPositionModal;
window.selectPriceMode = selectPriceMode;
window.executeOpenPosition = executeOpenPosition;
window.closePositionModal = closePositionModal;
window.showOpportunityDetails = showOpportunityDetails;
window.closeDetailsModal = closeDetailsModal;
window.closeStrategy = closeStrategy;
window.refreshOrderRecords = refreshOrderRecords;
window.exportOrderRecords = exportOrderRecords;
window.createNewRule = createNewRule;
window.useTemplate = useTemplate;
window.exportRules = exportRules;
window.importRules = importRules;
window.editRule = editRule;
window.deleteRule = deleteRule;
window.closeRulesModal = closeRulesModal;
window.showNotification = showNotification;
window.openDetailsModal = openDetailsModal;
window.openClosePositionModal = openClosePositionModal;
window.closeClosePositionModal = closeClosePositionModal;
window.selectClosePriceMode = selectClosePriceMode;
window.executeClosePosition = executeClosePosition;

function openRulesModal() {
    const modal = document.getElementById('rulesModal');
    const modalBody = document.getElementById('rulesModalBody');
    if (!modal || !modalBody) {
        console.error("Rules modal elements not found.");
        return showNotification("无法打开规则窗口: 缺少页面元素。", "error");
    }

    console.log("Opening rules modal...");
    
    // 添加切换标签页的函数
    window.switchRuleTab = function(tabId) {
        // 隐藏所有标签内容
        document.querySelectorAll('.rule-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 取消所有标签按钮的激活状态
        document.querySelectorAll('.rule-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 激活选中的标签内容和按钮
        document.getElementById(tabId).classList.add('active');
        document.querySelector(`[onclick="switchRuleTab('${tabId}')"]`).classList.add('active');
    };
    
    modalBody.innerHTML = `
        <div class="rule-tab-nav">
            <button class="rule-tab-btn active" onclick="switchRuleTab('basic-info')">基本信息</button>
            <button class="rule-tab-btn" onclick="switchRuleTab('trading-setup')">交易设置</button>
            <button class="rule-tab-btn" onclick="switchRuleTab('position-management')">平仓管理</button>
        </div>
        
        <div class="rules-settings-form">
            <div id="basic-info" class="rule-tab-content active">
                <div class="form-section">
                    <label for="ruleName" class="form-label">规则名称</label>
                    <div class="input-group">
                        <input type="text" id="ruleName" class="form-control" placeholder="输入规则名称，如: BTC套利策略-保守型">
                        <button class="btn btn-primary" onclick="saveRule()">保存规则</button>
                        <button class="btn btn-secondary" onclick="fillRuleTemplate()">使用模板填充</button>
                    </div>
                    <div class="saved-rules mt-3">
                        <p class="text-muted">已保存规则</p>
                        <div class="no-rules-message">
                            <p>暂无保存的规则</p>
                            <p>填写配置并输入规则名称后点击"保存规则"来创建</p>
                        </div>
                        <button class="btn btn-link btn-sm toggle-rules-list">隐藏列表</button>
                    </div>
                </div>
            </div>
            
            <div id="trading-setup" class="rule-tab-content">

                <h5 class="section-title"><i class="fas fa-exchange-alt"></i> 双向创建 (建议仅用于期货)</h5>
                <div class="row compact-form">
                    <div class="col-md-6">
                        <div class="card arbitrage-direction-card">
                            <div class="card-body">
                                <h6 class="card-title">做多快捷输入</h6>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="longSelectExchange">选择多头</label>
                                        <select class="form-control" id="longSelectExchange">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="longExchange">做多交易所</label>
                                        <select class="form-control" id="longExchange">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="longAccount">做多账户</label>
                                        <select class="form-control" id="longAccount">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="longAccountType">账户类型</label>
                                        <select class="form-control" id="longAccountType">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="longSettleCurrency">结算币</label>
                                        <select class="form-control" id="longSettleCurrency">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="longCurrency">币名</label>
                                        <select class="form-control" id="longCurrency">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-4">
                                        <label for="longLeverage">杠杆倍数</label>
                                        <input type="number" class="form-control" id="longLeverage" value="1">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="longOpenFee">开仓手续费(%)</label>
                                        <input type="number" class="form-control" id="longOpenFee" value="0">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="longCloseFee">平仓手续费(%)</label>
                                        <input type="number" class="form-control" id="longCloseFee" value="0">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card arbitrage-direction-card">
                            <div class="card-body">
                                <h6 class="card-title">做空快捷输入</h6>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="shortSelectExchange">选择空头</label>
                                        <select class="form-control" id="shortSelectExchange">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="shortExchange">做空交易所</label>
                                        <select class="form-control" id="shortExchange">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="shortAccount">做空账户</label>
                                        <select class="form-control" id="shortAccount">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="shortAccountType">账户类型</label>
                                        <select class="form-control" id="shortAccountType">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="shortSettleCurrency">结算币</label>
                                        <select class="form-control" id="shortSettleCurrency">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="shortCurrency">币名</label>
                                        <select class="form-control" id="shortCurrency">
                                            <option>请选择</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-4">
                                        <label for="shortLeverage">杠杆倍数</label>
                                        <input type="number" class="form-control" id="shortLeverage" value="1">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="shortOpenFee">开仓手续费(%)</label>
                                        <input type="number" class="form-control" id="shortOpenFee" value="0">
                                    </div>
                                    <div class="form-group col-md-4">
                                        <label for="shortCloseFee">平仓手续费(%)</label>
                                        <input type="number" class="form-control" id="shortCloseFee" value="0">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h5 class="section-title">全局设置</h5>
                    <div class="form-row">
                        <div class="form-group col-md-4">
                            <label for="capitalSettlementPeriod">资金费结算周期</label>
                            <select class="form-control" id="capitalSettlementPeriod">
                                <option>不作要求</option>
                            </select>
                        </div>
                        <div class="form-group col-md-4">
                            <label for="minOrderAmount">最小下单金额 (USDT)</label>
                            <input type="number" class="form-control" id="minOrderAmount" value="100">
                        </div>
                        <div class="form-group col-md-4">
                            <label for="maxOrderAmount">最大下单金额 (USDT)</label>
                            <input type="number" class="form-control" id="maxOrderAmount" value="10000">
                        </div>
                    </div>
                    <div class="alert alert-info mt-2">
                        <h6>下单金额说明:</h6>
                        <ul class="compact-list">
                            <li>最小下单金额：单次套利的最小投入资金，用于控制最小交易规模</li>
                            <li>最大下单金额：单次套利的最大投入资金，用于风险控制和资金管理</li>
                            <li>实际下单资金在此范围内根据账户余额和风险设置自动调整</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div id="position-management" class="rule-tab-content">
                <h5 class="section-title">平仓管理</h5>
                <div class="row compact-form">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><i class="fas fa-chart-line"></i> 盈亏控制指标</div>
                            <div class="card-body">
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="takeProfitPercentage">止盈百分比(%)</label>
                                        <input type="number" class="form-control" id="takeProfitPercentage" value="2.5">
                                        <small class="form-text">达到此收益率自动平仓</small>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="stopLossPercentage">止损百分比(%)</label>
                                        <input type="number" class="form-control" id="stopLossPercentage" value="-1.0">
                                        <small class="form-text">达到此亏损率强制平仓</small>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="maxFloatingLoss">最大浮亏金额 (USDT)</label>
                                        <input type="number" class="form-control" id="maxFloatingLoss" value="500">
                                        <small class="form-text">绝对金额止损线</small>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="profitLossRatio">盈亏比要求</label>
                                        <select class="form-control" id="profitLossRatio">
                                            <option>2:1 (推荐)</option>
                                        </select>
                                        <small class="form-text">当前比例: 计算中...</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header"><i class="fas fa-clock"></i> 时间管理指标</div>
                            <div class="card-body">
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="maxHoldingTime">最大持仓时间 (小时)</label>
                                        <input type="number" class="form-control" id="maxHoldingTime" value="48">
                                        <small class="form-text">超时自动平仓</small>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="capitalSettlementPreClose">资金费结算前平仓 (分钟)</label>
                                        <input type="number" class="form-control" id="capitalSettlementPreClose" value="45">
                                        <small class="form-text">结算前多久平仓</small>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group col-md-6">
                                        <label for="forcedCloseTime">强制平仓时间</label>
                                        <select class="form-control" id="forcedCloseTime">
                                            <option>不设置</option>
                                        </select>
                                        <small class="form-text">每日固定平仓时间</small>
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="closeTimeOffset">平仓时间偏移 (分钟)</label>
                                        <input type="number" class="form-control" id="closeTimeOffset" value="0">
                                        <small class="form-text">相对于强制时间的偏移</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-warning">
                    <h6>平仓管理说明:</h6>
                    <ul class="compact-list">
                        <li>盈亏控制：系统将根据设定的止盈止损条件自动触发平仓，优先保护资金安全</li>
                        <li>时间管理：通过时间限制避免长期持仓风险，特别关注资金费结算时间点</li>
                        <li>执行优先级：止损 > 时间限制 > 止盈，确保风险优先控制</li>
                        <li>平仓方式：默认市价平仓确保快速执行，紧急情况下可强制平仓</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

/**
 * Helper function to create input form for one leg (long/short)
 * @param {string} side - 'long' or 'short'
 */
function createLegInputForm(side) {
    const sideText = side === 'long' ? '做多' : '做空';
    const options = ['请选择', '选项A', '选项B'];
    const createSelect = (label) => `
        <div class="control-group">
            <label>${sideText}${label}</label>
            <select>
                ${options.map(o => `<option>${o}</option>`).join('')}
            </select>
        </div>
    `;
    return `
        ${createSelect('快捷输入')}
        ${createSelect('交易所')}
        ${createSelect('账户')}
        ${createSelect('账户类型')}
        ${createSelect('结算币')}
        ${createSelect('币种名')}
        <div class="control-group">
            <label>${sideText}杠杆倍数</label>
            <input type="number" value="1">
        </div>
        <div class="control-group">
            <label>${sideText}开仓手续费(%)</label>
            <input type="number" value="0">
        </div>
        <div class="control-group">
            <label>${sideText}平仓手续费(%)</label>
            <input type="number" value="0">
        </div>
    `;
}

/**
 * Mock function for saving a rule
 */
function saveRule() {
    const ruleName = document.getElementById('ruleName')?.value;
    if (!ruleName) {
        return showNotification('请输入规则名称!', 'error');
    }
    showNotification(`规则 "${ruleName}" 已保存! (模拟)`, 'success');
    closeRulesModal();
}

/**
 * Mock function for filling form from a template
 */
function fillRuleTemplate() {
    showNotification('使用模板填充表单 (模拟)', 'info');
    // Here you would populate the form with template data
    const fieldsToFill = {
        '#ruleName': 'BTC套利策略-保守型',
        'input[type="number"]': (el, index) => {
            const defaults = [100, 10000, 2.5, -1.0, 500, 48, 45, 0, 1, 0, 0, 1, 0, 0];
            const matchingDefault = defaults.find((val, i) => el.value === '1' || el.value === '0' || el.value === '100' || el.value === '10000' || el.value === '2.5' || el.value === '-1.0'); // Basic check to find corresponding default
            if(el.parentElement.innerHTML.includes('做多') || el.parentElement.innerHTML.includes('做空')) {
                // leave leverage and fees
            } else {
                 const valueMap = {
                    '100': 100, '10000': 5000,
                    '2.5': 2.0, '-1.0': -1.0, '500': 300,
                    '48': 24, '45': 30, '0': 0
                };
                el.value = valueMap[el.value] || el.value;
            }
        }
    };
     document.querySelector('#ruleName').value = 'BTC套利策略-模板';
     // Fill P&L controls
     const pnlControls = document.querySelectorAll('.sub-card:first-of-type input[type="number"]');
     if(pnlControls.length >= 3) {
        pnlControls[0].value = 2.0;
        pnlControls[1].value = -1.0;
        pnlControls[2].value = 300;
     }
      // Fill Time controls
     const timeControls = document.querySelectorAll('.sub-card:last-of-type input[type="number"]');
     if(timeControls.length >= 2) {
        timeControls[0].value = 24;
        timeControls[1].value = 15;
     }
}

