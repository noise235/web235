// 工具函数集合

// 数字格式化工具
const NumberUtils = {
    // 格式化货币
    formatCurrency(amount, currency = 'USD', decimals = 2) {
        if (isNaN(amount)) return '0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    },

    // 格式化百分比
    formatPercentage(value, decimals = 2) {
        if (isNaN(value)) return '0.00%';
        return `${parseFloat(value).toFixed(decimals)}%`;
    },

    // 格式化大数字
    formatLargeNumber(num, decimals = 2) {
        if (isNaN(num)) return '0';
        
        const absNum = Math.abs(num);
        if (absNum >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'B';
        } else if (absNum >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        } else if (absNum >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        } else {
            return num.toFixed(decimals);
        }
    },

    // 安全的数字解析
    parseNumber(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
};

// 时间工具
const TimeUtils = {
    // 格式化时间戳
    formatTimestamp(timestamp, format = 'datetime') {
        const date = new Date(timestamp);
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        switch (format) {
            case 'time':
                return date.toLocaleTimeString();
            case 'date':
                return date.toLocaleDateString();
            case 'datetime':
                return date.toLocaleString();
            case 'relative':
                return this.getRelativeTime(timestamp);
            case 'iso':
                return date.toISOString();
            default:
                return date.toLocaleString();
        }
    },

    // 获取相对时间
    getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - new Date(timestamp).getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    },

    // 计算持续时间
    calculateDuration(startTime, endTime = null) {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    },

    // 获取下一个资金费结算时间
    getNextFundingTime() {
        const now = new Date();
        const hours = now.getUTCHours();
        
        // 假设8小时结算一次 (0:00, 8:00, 16:00 UTC)
        const nextFundingHour = Math.ceil((hours + 1) / 8) * 8;
        const nextFunding = new Date(now);
        
        if (nextFundingHour >= 24) {
            nextFunding.setUTCDate(nextFunding.getUTCDate() + 1);
            nextFunding.setUTCHours(nextFundingHour - 24, 0, 0, 0);
        } else {
            nextFunding.setUTCHours(nextFundingHour, 0, 0, 0);
        }
        
        return nextFunding;
    }
};

// 字符串工具
const StringUtils = {
    // 截断文本
    truncate(text, length = 50, suffix = '...') {
        if (!text || text.length <= length) return text || '';
        return text.substring(0, length) + suffix;
    },

    // 首字母大写
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // 转换为驼峰命名
    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    },

    // 生成随机字符串
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

// 数组工具
const ArrayUtils = {
    // 去重
    unique(array, key = null) {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    },

    // 排序
    sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = key ? a[key] : a;
            const bVal = key ? b[key] : b;
            
            if (direction === 'desc') {
                return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
        });
    },

    // 分组
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    },

    // 分页
    paginate(array, page = 1, size = 10) {
        const start = (page - 1) * size;
        const end = start + size;
        return {
            data: array.slice(start, end),
            page: page,
            size: size,
            total: array.length,
            totalPages: Math.ceil(array.length / size)
        };
    }
};

// 本地存储工具
const StorageUtils = {
    // 设置数据
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    },

    // 获取数据
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to get from localStorage:', error);
            return defaultValue;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    },

    // 清空存储
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }
};

// DOM 工具
const DOMUtils = {
    // 获取元素
    $(selector) {
        return document.querySelector(selector);
    },

    // 获取所有元素
    $$(selector) {
        return document.querySelectorAll(selector);
    },

    // 显示元素
    show(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.style.display = '';
        }
    },

    // 隐藏元素
    hide(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    },

    // 切换显示状态
    toggle(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.style.display = element.style.display === 'none' ? '' : 'none';
        }
    },

    // 添加类名
    addClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element && className) {
            element.classList.add(className);
        }
    },

    // 移除类名
    removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element && className) {
            element.classList.remove(className);
        }
    },

    // 切换类名
    toggleClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element && className) {
            element.classList.toggle(className);
        }
    }
};

// 验证工具
const ValidationUtils = {
    // 验证邮箱
    isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // 验证数字
    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    // 验证正整数
    isPositiveInteger(value) {
        return Number.isInteger(value) && value > 0;
    },

    // 验证百分比
    isPercentage(value) {
        return this.isNumber(value) && value >= 0 && value <= 100;
    },

    // 验证交易所名称
    isValidExchange(exchange) {
        return CONFIG.trading.supportedExchanges.includes(exchange);
    },

    // 验证交易对
    isValidSymbol(symbol) {
        return CONFIG.trading.supportedSymbols.includes(symbol);
    }
};

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 深拷贝
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj);
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
}

// 格式化交易所徽章
function formatExchangeBadge(exchange) {
    const config = CONFIG.exchanges[exchange];
    if (!config) return exchange;
    
    return `<span class="exchange-badge exchange-${exchange}" style="background: ${config.color}; color: ${config.textColor};">
        ${config.name}
    </span>`;
}

// 格式化收益颜色
function formatProfitColor(value) {
    if (value > 0) return 'profit-positive';
    if (value < 0) return 'profit-negative';
    return '';
}

// 生成置信度条
function generateConfidenceBar(confidence) {
    return `<div class="confidence-bar">
        <div class="confidence-fill" style="width: ${confidence}%"></div>
    </div>`;
}

// 导出到全局
window.NumberUtils = NumberUtils;
window.TimeUtils = TimeUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.StorageUtils = StorageUtils;
window.DOMUtils = DOMUtils;
window.ValidationUtils = ValidationUtils;
window.debounce = debounce;
window.throttle = throttle;
window.deepClone = deepClone;
window.formatExchangeBadge = formatExchangeBadge;
window.formatProfitColor = formatProfitColor;
window.generateConfidenceBar = generateConfidenceBar;
