// UI 组件和渲染逻辑

// Tab 管理组件
const TabManager = {
    showTab(tabName) {
        // 隐藏所有 tab 内容
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有按钮的激活状态
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // 显示目标 tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // 激活对应按钮
        const targetButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }

        // 更新状态
        STATE.currentTab = tabName;

        // 根据tab类型加载相应数据
        this.loadTabData(tabName);
    },

    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await DashboardRenderer.load();
                break;
            case 'market-monitoring':
                await MarketMonitorRenderer.load();
                break;
            case 'order-records':
                await OrderRecordsRenderer.load();
                break;
            case 'rules-settings':
                await RulesRenderer.load();
                break;
        }
    }
};

// Dashboard 渲染器
const DashboardRenderer = {
    async load() {
        await this.updateMetrics();
        await this.loadActiveStrategies();
    },

    async updateMetrics() {
        try {
            const status = await apiService.getSystemStatus();
            
            document.getElementById('activeStrategies').textContent = status.activeStrategies;
            document.getElementById('totalOpportunities').textContent = status.totalOpportunities;
            document.getElementById('todayProfit').textContent = `${status.todayProfit > 0 ? '+' : ''}${status.todayProfit}%`;
            document.getElementById('totalBalance').textContent = `$${NumberUtils.formatLargeNumber(status.totalBalance)}`;
            document.getElementById('successRate').textContent = `${status.successRate}%`;
            document.getElementById('systemStatus').textContent = '🟢';

            // 更新颜色
            const profitElement = document.getElementById('todayProfit');
            profitElement.className = `status-value ${formatProfitColor(parseFloat(status.todayProfit))}`;

        } catch (error) {
            console.error('Failed to update dashboard metrics:', error);
        }
    },

    async loadActiveStrategies() {
        const content = document.getElementById('activeStrategiesContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            const data = await apiService.getActiveStrategies();
            const strategies = data.strategies || [];

            if (strategies.length === 0) {
                content.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">暂无活跃策略</p>';
                return;
            }

            const table = `
                <table class="opportunities-table">
                    <thead>
                        <tr>
                            <th>策略ID</th>
                            <th>交易对</th>
                            <th>交易所</th>
                            <th>类型</th>
                            <th>持续时间</th>
                            <th>P&L</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${strategies.map(strategy => this.renderStrategyRow(strategy)).join('')}
                    </tbody>
                </table>
            `;

            content.innerHTML = table;
        } catch (error) {
            console.error('Failed to load active strategies:', error);
            content.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 40px;">加载失败</p>';
        }
    },

    renderStrategyRow(strategy) {
        const pnlClass = formatProfitColor(strategy.pnl);
        const typeClass = strategy.type === 'long' ? 'badge-long' : 'badge-short';
        
        return `
            <tr>
                <td><small>${StringUtils.truncate(strategy.id, 12)}</small></td>
                <td><strong>${strategy.symbol}</strong></td>
                <td>${formatExchangeBadge(strategy.exchange)}</td>
                <td><span class="trade-type-badge ${typeClass}">${strategy.type}</span></td>
                <td>${strategy.duration}</td>
                <td class="${pnlClass}">
                    $${strategy.pnl.toFixed(2)}
                    <br><small>(${strategy.pnl_percent.toFixed(2)}%)</small>
                </td>
                <td><span class="order-status status-${strategy.status}">${strategy.status}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="closeStrategy('${strategy.id}')" style="font-size: 11px; padding: 4px 8px;">
                        平仓
                    </button>
                </td>
            </tr>
        `;
    }
};

// Market Monitor 渲染器
const MarketMonitorRenderer = {
    async load() {
        this.setupFilterEventListeners();
        await this.scanOpportunities();
    },

    setupFilterEventListeners() {
        const filters = [
            'arbitrageType', 'minSpread', 'minProfit', 
            'symbolFilter', 'exchangeA', 'exchangeB', 'fundingPeriod', 'openSpreadThreshold'
        ];
        
        filters.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const eventType = element.tagName.toLowerCase() === 'select' ? 'change' : 'input';
                element.addEventListener(eventType, debounce(() => {
                    this.renderOpportunities();
                }, 300));
            }
        });
    },

    async scanOpportunities() {
        this.showLoading();
        
        try {
            const filters = this.getFilters();
            const data = await apiService.getOpportunities(filters);
            STATE.opportunities = data.opportunities || [];
            this.renderOpportunities();
        } catch (error) {
            console.error('Failed to scan opportunities:', error);
            this.showError('扫描失败，请重试');
        }
    },

    getFilters() {
        return {
            arbitrageType: document.getElementById('arbitrageType')?.value || 'futures-futures',
            minSpread: NumberUtils.parseNumber(document.getElementById('minSpread')?.value, 0.05),
            minProfit: NumberUtils.parseNumber(document.getElementById('minProfit')?.value, 0.02),
            symbolFilter: document.getElementById('symbolFilter')?.value || '',
            exchangeA: document.getElementById('exchangeA')?.value || '',
            exchangeB: document.getElementById('exchangeB')?.value || '',
            fundingPeriod: document.getElementById('fundingPeriod')?.value || '',
            openSpreadThreshold: NumberUtils.parseNumber(document.getElementById('openSpreadThreshold')?.value, 0.06)
        };
    },

    renderOpportunities() {
        const content = document.getElementById('opportunitiesContent');
        let opportunities = [...STATE.opportunities];

        // 应用筛选
        const filters = this.getFilters();
        opportunities = this.applyFilters(opportunities, filters);

        if (opportunities.length === 0) {
            content.innerHTML = `
                <div class="loading">
                    <p style="color: #888;">暂无套利机会</p>
                    <p style="color: #666;">调整筛选条件或等待市场变化</p>
                </div>
            `;
            return;
        }

        // 按预期收益排序
        opportunities.sort((a, b) => b.estimated_profit - a.estimated_profit);

        const table = `
            <table class="opportunities-table">
                <thead>
                    <tr>
                        <th>交易对</th>
                        <th>策略</th>
                        <th>价差</th>
                        <th>盘差（Buy）</th>
                        <th>盘差（Sell）</th>
                        <th>24H 振幅（%）</th>
                        <th>24H 交易额</th>
                        <th>净资金费</th>
                        <th>仓位状态</th>
                        <th>预期收益</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${opportunities.map((opp, index) => this.renderOpportunityRow(opp, index)).join('')}
                </tbody>
            </table>
        `;

        content.innerHTML = table;
    },

    applyFilters(opportunities, filters) {
        return opportunities.filter(opp => {
            if (filters.symbolFilter && opp.symbol !== filters.symbolFilter) return false;
            if (filters.exchangeA && opp.buy_exchange !== filters.exchangeA) return false;
            if (filters.exchangeB && opp.sell_exchange !== filters.exchangeB) return false;
            if (opp.spread_percent < filters.minSpread) return false;
            if (opp.estimated_profit < filters.minProfit) return false;
            return true;
        });
    },

    renderOpportunityRow(opp, index) {
        const profitClass = (opp.estimated_profit || 0) > 0 ? 'profit-positive' : 'profit-negative';
        
        // Format funding end time
        const fundingEndTime = new Date(opp.funding_end_time || Date.now());
        
        // Calculate time to settlement
        const now = new Date();
        const timeToSettlement = Math.floor((fundingEndTime - now) / (1000 * 60)); // minutes
        const hoursToSettlement = Math.floor(timeToSettlement / 60);
        const minutesToSettlement = timeToSettlement % 60;
        const timeToSettlementStr = `${hoursToSettlement}h${minutesToSettlement}m`;
        
        // Format volume
        const volumeStr = (opp.volume_24h || 0) >= 1000000 ? 
            `${((opp.volume_24h || 0) / 1000000).toFixed(1)}M` : 
            `${((opp.volume_24h || 0) / 1000).toFixed(0)}K`;
        
        return `
            <tr class="opportunity-row" style="animation-delay: ${index * 0.1}s;">
                <td>
                    <strong>${opp.symbol}</strong><br>
                    <small style="color: #888;">永续合约</small>
                </td>
                <td>
                    <div style="font-size: 12px;">
                        <div style="margin-bottom: 4px;">
                            Buy: <span class="exchange-badge exchange-${opp.buy_exchange}">${(opp.buy_exchange || '').toUpperCase()}</span> 
                            $${(opp.buy_price || 0).toFixed(2)}
                        </div>
                        <div>
                            Sell: <span class="exchange-badge exchange-${opp.sell_exchange}">${(opp.sell_exchange || '').toUpperCase()}</span> 
                            $${(opp.sell_price || 0).toFixed(2)}
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px; text-align: center;">
                        <div style="color: #10b981; font-weight: bold; margin-bottom: 2px;">
                            +${(opp.spot_spread || 0).toFixed(3)}%
                        </div>
                        <div style="font-size: 10px; color: #888;">
                            $${((opp.sell_price || 0) - (opp.buy_price || 0)).toFixed(2)}
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 11px;">
                        <div style="margin-bottom: 2px;">
                            买一: <span style="color: #10b981;">$${(opp.buy_bid || 0).toFixed(2)}</span>
                        </div>
                        <div style="margin-bottom: 2px;">
                            卖一: <span style="color: #ef4444;">$${(opp.buy_ask || 0).toFixed(2)}</span>
                        </div>
                        <div class="profit-positive">
                            ${(opp.buy_spread_percent || 0).toFixed(3)}%
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 11px;">
                        <div style="margin-bottom: 2px;">
                            买一: <span style="color: #10b981;">$${(opp.sell_bid || 0).toFixed(2)}</span>
                        </div>
                        <div style="margin-bottom: 2px;">
                            卖一: <span style="color: #ef4444;">$${(opp.sell_ask || 0).toFixed(2)}</span>
                        </div>
                        <div class="profit-positive">
                            ${(opp.sell_spread_percent || 0).toFixed(3)}%
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px; text-align: center;">
                        <span class="profit-positive">±${(opp.amplitude_24h || 0).toFixed(2)}%</span>
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px; text-align: center;">
                        <strong>$${volumeStr}</strong><br>
                        <small style="color: #888;">USDT</small>
                    </div>
                </td>
                <td>
                    <div style="font-size: 10px;">
                        <div style="margin-bottom: 3px;">
                            Buy: <span class="${(opp.buy_funding_rate || 0) >= 0 ? 'profit-positive' : 'profit-negative'}">
                                ${(opp.buy_funding_rate || 0) >= 0 ? '+' : ''}${((opp.buy_funding_rate || 0) * 100).toFixed(3)}%
                            </span> | ${timeToSettlementStr} | ${opp.funding_cycle || '8H'}
                        </div>
                        <div>
                            Sell: <span class="${(opp.sell_funding_rate || 0) >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${(opp.sell_funding_rate || 0) >= 0 ? '+' : ''}${((opp.sell_funding_rate || 0) * 100).toFixed(3)}%
                            </span> | ${timeToSettlementStr} | ${opp.funding_cycle || '8H'}
                        </div>
                    </div>
                </td>
                <td style="font-size: 12px;">
                    <div>多: ${(opp.position_size || 0).toFixed(1)} ${(opp.symbol || '').split('-')[0]}</div>
                    <div>空: ${(opp.position_size || 0).toFixed(1)} ${(opp.symbol || '').split('-')[0]}</div>
                </td>
                <td>
                    <span class="${profitClass}">+${(opp.estimated_profit || 0).toFixed(3)}%</span>
                </td>
                <td>
                    <button class="btn btn-success" style="padding: 6px 12px; font-size: 12px;" onclick="openPositionModal('${encodeURIComponent(JSON.stringify(opp))}')">
                        开仓
                    </button>
                </td>
            </tr>
        `;
    },

    showLoading() {
        const spinner = document.getElementById('scanSpinner');
        if (spinner) {
            spinner.style.display = 'inline-block';
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 2000);
        }
    },

    showError(message) {
        const content = document.getElementById('opportunitiesContent');
        content.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 40px;">${message}</p>`;
    }
};

// Order Records 渲染器
const OrderRecordsRenderer = {
    async load() {
        await this.refreshOrderRecords();
    },

    async refreshOrderRecords() {
        const content = document.getElementById('orderRecordsContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            const filters = this.getFilters();
            const data = await apiService.getOrderRecords(filters);
            const orders = data.orders || [];

            if (orders.length === 0) {
                content.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">暂无订单记录</p>';
                return;
            }

            const table = `
                <table class="opportunities-table">
                    <thead>
                        <tr>
                            <th>套利ID</th>
                            <th>交易类型</th>
                            <th>交易对</th>
                            <th>交易所</th>
                            <th>订单状态</th>
                            <th>金额</th>
                            <th>数量</th>
                            <th>手续费</th>
                            <th>资金费率</th>
                            <th>当前盈亏</th>
                            <th>时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => this.renderOrderRow(order)).join('')}
                    </tbody>
                </table>
            `;

            content.innerHTML = table;
        } catch (error) {
            console.error('Failed to load order records:', error);
            content.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 40px;">加载失败</p>';
        }
    },

    getFilters() {
        return {
            timeRange: document.getElementById('orderTimeRange')?.value || 'week',
            symbol: document.getElementById('orderSymbolFilter')?.value || '',
            status: document.getElementById('orderStatusFilter')?.value || '',
            exchange: document.getElementById('orderExchangeFilter')?.value || ''
        };
    },

    renderOrderRow(order) {
        const pnlClass = formatProfitColor(order.pnl);
        const sideClass = order.side === 'buy' ? 'trade-long' : 'trade-short';
        const statusMap = {
            filled: { text: '已成交', class: 'status-filled' },
            partial: { text: '部分成交', class: 'status-partial' },
            pending: { text: '挂单中', class: 'status-pending' },
            cancelled: { text: '已取消', class: 'status-cancelled' },
            closing: { text: '关单中', class: 'status-closing' }
        };
        const status = statusMap[order.status] || { text: order.status, class: '' };

        return `
            <tr class="${sideClass}">
                <td>
                    <strong>${order.arbitrage_id}</strong>
                </td>
                <td>
                    <span class="trade-type-badge ${order.side === 'buy' ? 'badge-long' : 'badge-short'}">
                        ${order.side === 'buy' ? 'LONG' : 'SHORT'}
                    </span>
                    <small style="color: #888; margin-left: 5px;">${order.side === 'buy' ? '买入' : '卖出'}</small>
                </td>
                <td>
                    <strong>${order.symbol}</strong><br>
                    <small style="color: #888;">${order.arbitrage_type || '期期套利'}</small>
                </td>
                <td>
                    ${formatExchangeBadge(order.exchange)}<br>
                    <small style="color: #888;">$${(order.price || 0).toFixed(2)}</small>
                </td>
                <td>
                    <span class="order-status ${status.class}">${status.text}</span>
                </td>
                <td>$${NumberUtils.formatLargeNumber(order.amount, 0)}</td>
                <td>
                    ${(order.quantity || 0).toFixed(4)}<br>
                    <small style="color: #888;">/ ${(order.base_quantity || 0).toFixed(4)} ${order.symbol.split('-')[0]}</small>
                </td>
                <td style="font-size: 11px;">
                    <div>开仓: <span class="profit-negative">-$${(order.fee_open || 0).toFixed(2)}</span></div>
                    <div>平仓: <span class="profit-negative">-$${(order.fee_close || 0).toFixed(2)}</span></div>
                    <div>总计: <span class="profit-negative">-$${((order.fee_open || 0) + (order.fee_close || 0)).toFixed(2)}</span></div>
                </td>
                <td class="${formatProfitColor(order.funding_rate)}">
                    ${NumberUtils.formatPercentage((order.funding_rate || 0) * 100, 3)}<br>
                    <small style="color: #888;">${order.funding_time_left || '49m'}</small>
                </td>
                <td class="${pnlClass}">
                    <strong>${order.pnl >= 0 ? '+' : '-'}$${Math.abs(order.pnl || 0).toFixed(2)}</strong>
                </td>
                <td style="font-size: 11px;">
                    创建: ${TimeUtils.formatTimestamp(order.created_at, 'date')}<br>
                    <small>${TimeUtils.formatTimestamp(order.created_at, 'time')}</small>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; flex-direction: column;">
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" 
                                onclick="openClosePositionModal('${encodeURIComponent(JSON.stringify(order))}')"
                                ${order.status !== 'filled' && order.status !== 'partial' ? 'disabled' : ''}>
                            平仓
                        </button>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;"
                                onclick="openDetailsModal('${encodeURIComponent(JSON.stringify(order))}')">
                            详情
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
};

// Rules 渲染器
const RulesRenderer = {
    async load() {
        await this.loadRules();
    },

    async loadRules() {
        const content = document.getElementById('rulesContent');
        content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            const rules = await apiService.getRules();

            let contentHtml = ``;

            if (rules && rules.length > 0) {
                contentHtml += this.renderRulesList(rules);
            } else {
                contentHtml += `
                    <div class="empty-state">
                        <h4>暂无配置规则</h4>
                        <p>点击“新建规则”开始创建您的第一个套利策略规则。</p>
                        <button class="btn btn-primary" onclick="openRulesModal()">新建规则</button>
                    </div>
                `;
            }
            content.innerHTML = contentHtml;
        } catch (error) {
            console.error('Failed to load rules:', error);
            content.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 40px;">加载失败</p>';
        }
    },

    renderRuleRow(rule) {
        return `
            <tr>
                <td>
                    <div class="rule-name">${rule.name || '未命名规则'}</div>
                    <div class="rule-meta">ID: ${StringUtils.truncate(rule.id, 12)}</div>
                </td>
                <td><strong>${rule.symbol || 'ALL'}</strong></td>
                <td>
                    <div>${formatExchangeBadge(rule.longExchange || 'binance')} ⟷ ${formatExchangeBadge(rule.shortExchange || 'okx')}</div>
                </td>
                <td>${NumberUtils.formatPercentage(rule.minProfit || 0.02)}</td>
                <td>$${NumberUtils.formatLargeNumber(rule.maxOrderAmount || 10000)}</td>
                <td><small>${TimeUtils.formatTimestamp(rule.createdAt, 'relative')}</small></td>
                <td>
                    <div style="display: flex; gap: 4px; flex-direction: column;">
                        <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="editRule('${rule.id}')">
                            编辑
                        </button>
                        <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="deleteRule('${rule.id}')">
                            删除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
};

// Modal 管理器
const ModalManager = {
    show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    },

    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },

    hideAll() {
        const modals = document.querySelectorAll('.trade-modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
};

// 导出到全局
window.TabManager = TabManager;
window.DashboardRenderer = DashboardRenderer;
window.MarketMonitorRenderer = MarketMonitorRenderer;
window.OrderRecordsRenderer = OrderRecordsRenderer;
window.RulesRenderer = RulesRenderer;
window.ModalManager = ModalManager;
