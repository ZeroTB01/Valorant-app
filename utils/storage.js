// utils/storage.js - Valorant助手存储工具

/**
 * 存储工具类
 * 封装微信小程序的本地存储功能
 */
const storageUtils = {
    // 存储键名常量
    KEYS: {
        TOKEN: 'valorant_token',
        REFRESH_TOKEN: 'valorant_refresh_token',
        USER_INFO: 'valorant_user_info',
        THEME: 'valorant_theme',
        SETTINGS: 'valorant_settings',
        SEARCH_HISTORY: 'valorant_search_history',
        FAVORITE_CACHE: 'valorant_favorite_cache',
        VIEW_HISTORY: 'valorant_view_history',
        FILTER_CACHE: 'valorant_filter_cache',
        APP_CONFIG: 'valorant_app_config'
    },
    /**
     * 设置数据到本地存储
     * @param {string} key - 存储键
     * @param {any} data - 要存储的数据
     * @param {boolean} sync - 是否同步存储
     * @returns {boolean} 是否成功
     */
    setItem(key, data, sync = false) {
        try {
            const value = JSON.stringify({
                data,
                timestamp: Date.now(),
                version: '1.0.0'
            });
            if (sync) {
                uni.setStorageSync(key, value);
            } else {
                uni.setStorage({
                    key,
                    data: value,
                    success: () => {
                        console.log(`✅ 存储成功: ${key}`);
                    },
                    fail: (error) => {
                        console.error(`❌ 存储失败: ${key}`, error);
                    }
                });
            }
            return true;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error(`❌ 存储数据失败: ${key}`, error);
            return false;
        }
    },
    /**
     * 从本地存储获取数据
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值
     * @param {boolean} sync - 是否同步获取
     * @returns {any} 存储的数据
     */
    getItem(key, defaultValue = null, sync = true) {
        try {
            let value;
            if (sync) {
                value = uni.getStorageSync(key);
            } else {
                // 异步获取需要使用Promise包装
                return new Promise((resolve) => {
                    uni.getStorage({
                        key,
                        success: (res) => {
                            const parsedData = this.parseStorageData(res.data, defaultValue);
                            resolve(parsedData);
                        },
                        fail: () => {
                            resolve(defaultValue);
                        }
                    });
                });
            }
            return this.parseStorageData(value, defaultValue);
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error(`❌ 获取存储数据失败: ${key}`, error);
            return defaultValue;
        }
    },
    /**
     * 解析存储数据
     * @param {string} value - 存储的原始值
     * @param {any} defaultValue - 默认值
     * @returns {any} 解析后的数据
     */
    parseStorageData(value, defaultValue) {
        if (!value) {
            return defaultValue;
        }
        try {
            const parsed = JSON.parse(value);

            // 检查数据格式和版本
            if (parsed && typeof parsed === 'object' && parsed.data !== undefined) {
                return parsed.data;
            }

            // 兼容旧版本数据格式
            return parsed || defaultValue;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 解析存储数据失败:', error);
            return defaultValue;
        }
    },
    /**
     * 移除本地存储数据
     * @param {string} key - 存储键
     * @param {boolean} sync - 是否同步移除
     * @returns {boolean} 是否成功
     */
    removeItem(key, sync = true) {
        try {
            if (sync) {
                uni.removeStorageSync(key);
            } else {
                uni.removeStorage({
                    key,
                    success: () => {
                        console.log(`✅ 移除存储成功: ${key}`);
                    },
                    fail: (error) => {
                        console.error(`❌ 移除存储失败: ${key}`, error);
                    }
                });
            }
            return true;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error(`❌ 移除存储数据失败: ${key}`, error);
            return false;
        }
    },
    /**
     * 清空所有存储数据
     * @param {boolean} sync - 是否同步清空
     */
    clear(sync = true) {
        try {
            if (sync) {
                uni.clearStorageSync();
            } else {
                uni.clearStorage({
                    success: () => {
                        console.log('✅ 清空存储成功');
                    },
                    fail: (error) => {
                        console.error('❌ 清空存储失败:', error);
                    }
                });
            }
            console.log('️ 已清空所有本地存储');
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 清空存储失败:', error);
        }
    },
    /**
     * 获取存储信息
     * @returns {object} 存储信息
     */
    getStorageInfo() {
        try {
            return uni.getStorageInfoSync();
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 获取存储信息失败:', error);
            return {
                keys: [],
                currentSize: 0,
                limitSize: 0
            };
        }
    },
    // ===========================================
    // 具体业务存储方法
    // ===========================================

    /**
     * 设置访问Token
     * @param {string} token - 访问Token
     */
    setToken(token) {
        return this.setItem(this.KEYS.TOKEN, token, true);
    },
    /**
     * 获取访问Token
     * @returns {string|null} 访问Token
     */
    getToken() {
        return this.getItem(this.KEYS.TOKEN, null, true);
    },
    /**
     * 设置刷新Token
     * @param {string} refreshToken - 刷新Token
     */
    setRefreshToken(refreshToken) {
        return this.setItem(this.KEYS.REFRESH_TOKEN, refreshToken, true);
    },
    /**
     * 获取刷新Token
     * @returns {string|null} 刷新Token
     */
    getRefreshToken() {
        return this.getItem(this.KEYS.REFRESH_TOKEN, null, true);
    },
    /**
     * 设置用户信息
     * @param {object} userInfo - 用户信息
     */
    setUserInfo(userInfo) {
        return this.setItem(this.KEYS.USER_INFO, userInfo, true);
    },
    /**
     * 获取用户信息
     * @returns {object|null} 用户信息
     */
    getUserInfo() {
        return this.getItem(this.KEYS.USER_INFO, null, true);
    },
    /**
     * 清除认证相关数据
     */
    clearAuth() {
        this.removeItem(this.KEYS.TOKEN, true);
        this.removeItem(this.KEYS.REFRESH_TOKEN, true);
        this.removeItem(this.KEYS.USER_INFO, true);
        console.log('️ 已清除认证数据');
    },
    /**
     * 设置主题配置
     * @param {object} theme - 主题配置
     */
    setTheme(theme) {
        return this.setItem(this.KEYS.THEME, theme, true);
    },
    /**
     * 获取主题配置
     * @returns {object} 主题配置
     */
    getTheme() {
        return this.getItem(
            this.KEYS.THEME,
            {
                mode: 'dark',
                primaryColor: '#FF4654'
            },
            true
        );
    },
    /**
     * 设置应用设置
     * @param {object} settings - 应用设置
     */
    setSettings(settings) {
        return this.setItem(this.KEYS.SETTINGS, settings, true);
    },
    /**
     * 获取应用设置
     * @returns {object} 应用设置
     */
    getSettings() {
        return this.getItem(
            this.KEYS.SETTINGS,
            {
                videoQuality: 'auto',
                autoPlayVideo: true,
                notificationEnabled: true,
                cacheEnabled: true,
                maxCacheSize: 100 // MB
            },
            true
        );
    },
    /**
     * 设置搜索历史
     * @param {Array} history - 搜索历史
     */
    setSearchHistory(history) {
        // 限制搜索历史数量
        const maxHistory = 20;
        const limitedHistory = history.slice(0, maxHistory);
        return this.setItem(this.KEYS.SEARCH_HISTORY, limitedHistory, true);
    },
    /**
     * 获取搜索历史
     * @returns {Array} 搜索历史
     */
    getSearchHistory() {
        return this.getItem(this.KEYS.SEARCH_HISTORY, [], true);
    },
    /**
     * 添加搜索记录
     * @param {string} keyword - 搜索关键词
     */
    addSearchHistory(keyword) {
        if (!keyword || keyword.trim() === '') {
            return;
        }
        const history = this.getSearchHistory();

        // 移除重复项
        const filteredHistory = history.filter((item) => item !== keyword);

        // 添加到开头
        const newHistory = [keyword, ...filteredHistory];
        this.setSearchHistory(newHistory);
    },
    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        this.removeItem(this.KEYS.SEARCH_HISTORY, true);
    },
    /**
     * 设置收藏缓存
     * @param {object} cache - 收藏缓存数据
     */
    setFavoriteCache(cache) {
        return this.setItem(this.KEYS.FAVORITE_CACHE, cache, true);
    },
    /**
     * 获取收藏缓存
     * @returns {object} 收藏缓存数据
     */
    getFavoriteCache() {
        return this.getItem(
            this.KEYS.FAVORITE_CACHE,
            {
                list: [],
                lastUpdateTime: 0
            },
            true
        );
    },
    /**
     * 设置浏览历史
     * @param {Array} history - 浏览历史
     */
    setViewHistory(history) {
        // 限制浏览历史数量
        const maxHistory = 50;
        const limitedHistory = history.slice(0, maxHistory);
        return this.setItem(this.KEYS.VIEW_HISTORY, limitedHistory, true);
    },
    /**
     * 获取浏览历史
     * @returns {Array} 浏览历史
     */
    getViewHistory() {
        return this.getItem(this.KEYS.VIEW_HISTORY, [], true);
    },
    /**
     * 添加浏览记录
     * @param {object} record - 浏览记录
     */
    addViewHistory(record) {
        if (!record || !record.id) {
            return;
        }
        const history = this.getViewHistory();

        // 移除重复项（相同ID和类型）
        const filteredHistory = history.filter((item) => !(item.id === record.id && item.type === record.type));

        // 添加时间戳
        const newRecord = {
            ...record,
            timestamp: Date.now()
        };

        // 添加到开头
        const newHistory = [newRecord, ...filteredHistory];
        this.setViewHistory(newHistory);
    },
    /**
     * 清除浏览历史
     */
    clearViewHistory() {
        this.removeItem(this.KEYS.VIEW_HISTORY, true);
    },
    /**
     * 设置筛选缓存
     * @param {object} cache - 筛选缓存数据
     */
    setFilterCache(cache) {
        return this.setItem(this.KEYS.FILTER_CACHE, cache, true);
    },
    /**
     * 获取筛选缓存
     * @returns {object} 筛选缓存数据
     */
    getFilterCache() {
        return this.getItem(
            this.KEYS.FILTER_CACHE,
            {
                lastQuery: {},
                results: [],
                lastUpdateTime: 0
            },
            true
        );
    },
    /**
     * 设置应用配置
     * @param {object} config - 应用配置
     */
    setAppConfig(config) {
        return this.setItem(this.KEYS.APP_CONFIG, config, true);
    },
    /**
     * 获取应用配置
     * @returns {object} 应用配置
     */
    getAppConfig() {
        return this.getItem(
            this.KEYS.APP_CONFIG,
            {
                version: '1.0.0',
                firstLaunch: true,
                lastLaunchTime: 0,
                launchCount: 0
            },
            true
        );
    },
    /**
     * 更新启动统计
     */
    updateLaunchStats() {
        const config = this.getAppConfig();
        const newConfig = {
            ...config,
            firstLaunch: false,
            lastLaunchTime: Date.now(),
            launchCount: (config.launchCount || 0) + 1
        };
        this.setAppConfig(newConfig);
        return newConfig;
    },
    // ===========================================
    // 存储管理工具方法
    // ===========================================

    /**
     * 检查存储空间使用情况
     * @returns {object} 存储使用情况
     */
    checkStorageUsage() {
        const info = this.getStorageInfo();
        const usagePercent = ((info.currentSize / info.limitSize) * 100).toFixed(2);
        return {
            currentSize: info.currentSize,
            limitSize: info.limitSize,
            usagePercent: parseFloat(usagePercent),
            availableSize: info.limitSize - info.currentSize,
            keys: info.keys
        };
    },
    /**
     * 清理过期数据
     * @param {number} maxAge - 最大保存时间（毫秒）
     */
    cleanExpiredData(maxAge = 10080 * 60 * 1000) {
        // 默认7天
        const info = this.getStorageInfo();
        const now = Date.now();
        let cleanedCount = 0;
        info.keys.forEach((key) => {
            try {
                const value = uni.getStorageSync(key);
                if (value) {
                    const parsed = JSON.parse(value);
                    if (parsed && parsed.timestamp) {
                        if (now - parsed.timestamp > maxAge) {
                            uni.removeStorageSync(key);
                            cleanedCount++;
                            console.log(`️ 清理过期数据: ${key}`);
                        }
                    }
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
            } // 忽略解析错误，可能是其他格式的数据
        });
        console.log(`✅ 清理完成，共清理 ${cleanedCount} 项过期数据`);
        return cleanedCount;
    },
    /**
     * 压缩存储数据
     * @param {string} key - 存储键
     * @param {any} data - 要压缩的数据
     */
    compressData(key, data) {
        try {
            // 简单的数据压缩：移除不必要的字段
            let compressedData = data;
            if (Array.isArray(data)) {
                compressedData = data.map((item) => {
                    if (typeof item === 'object' && item !== null) {
                        // 移除一些可能不必要的字段
                        const { __typename, __id, ...rest } = item;
                        return rest;
                    }
                    return item;
                });
            } else if (typeof data === 'object' && data !== null) {
                const { __typename, __id, ...rest } = data;
                compressedData = rest;
            }
            return this.setItem(key, compressedData, true);
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 数据压缩失败:', error);
            return this.setItem(key, data, true);
        }
    },
    /**
     * 批量设置数据
     * @param {object} dataMap - 数据映射对象
     */
    setBatch(dataMap) {
        const results = {};
        Object.entries(dataMap).forEach(([key, value]) => {
            results[key] = this.setItem(key, value, true);
        });
        return results;
    },
    /**
     * 批量获取数据
     * @param {Array} keys - 存储键数组
     * @returns {object} 批量获取的数据
     */
    getBatch(keys) {
        const results = {};
        keys.forEach((key) => {
            results[key] = this.getItem(key, null, true);
        });
        return results;
    },
    /**
     * 导出存储数据
     * @param {Array} keys - 要导出的键名数组，为空则导出所有
     * @returns {object} 导出的数据
     */
    exportData(keys = []) {
        const info = this.getStorageInfo();
        const targetKeys = keys.length > 0 ? keys : info.keys;
        const exportData = {};
        targetKeys.forEach((key) => {
            try {
                const value = uni.getStorageSync(key);
                if (value) {
                    exportData[key] = value;
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error(`❌ 导出数据失败: ${key}`, error);
            }
        });
        return {
            version: '1.0.0',
            timestamp: Date.now(),
            data: exportData
        };
    },
    /**
     * 导入存储数据
     * @param {object} importData - 要导入的数据
     * @param {boolean} overwrite - 是否覆盖现有数据
     */
    importData(importData, overwrite = false) {
        if (!importData || !importData.data) {
            console.error('❌ 导入数据格式错误');
            return false;
        }
        let successCount = 0;
        let skipCount = 0;
        Object.entries(importData.data).forEach(([key, value]) => {
            try {
                const exists = !!uni.getStorageSync(key);
                if (!exists || overwrite) {
                    uni.setStorageSync(key, value);
                    successCount++;
                } else {
                    skipCount++;
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error(`❌ 导入数据失败: ${key}`, error);
            }
        });
        console.log(`✅ 导入完成: 成功 ${successCount} 项，跳过 ${skipCount} 项`);
        return {
            success: true,
            successCount,
            skipCount
        };
    }
};

// 导出存储工具
module.exports = {
    storageUtils
};
