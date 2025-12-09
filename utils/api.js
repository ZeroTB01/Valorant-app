// utils/api.js - Valorant助手API接口封装

// API配置
const API_CONFIG = {
    baseUrl: 'http://192.168.1.12:8080/api',
    Url: 'http://192.168.1.12:8080',
    timeout: 10000,
    retryCount: 2,
    retryDelay: 1000
};

/**
 * 统一的网络请求方法
 * @param {string} url - 接口路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据
 * @param {object} options - 额外配置
 * @returns {Promise} 响应结果
 */
const apiRequest = (url, method = 'GET', data = {}, options = {}) => {
    return new Promise((resolve, reject) => {
        const requestConfig = {
            url: API_CONFIG.baseUrl + url,
            method: method.toUpperCase(),
            timeout: options.timeout || API_CONFIG.timeout,
            header: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
                ...options.header
            },
            success: (res) => {
                console.log(`✅ API请求成功: ${method} ${url}`, res.data);

                // 处理响应数据
                const result = handleResponse(res);
                resolve(result);
            },
            fail: (error) => {
                console.error(`❌ API请求失败: ${method} ${url}`, error);

                // 处理网络错误
                const errorResult = handleNetworkError(error, url);
                reject(errorResult);
            }
        };

        // 根据请求方法设置数据
        if (method.toUpperCase() === 'GET') {
            if (Object.keys(data).length > 0) {
                requestConfig.url += '?' + buildQueryString(data);
            }
        } else {
            requestConfig.data = data;
        }
        console.log(` 发起API请求: ${method} ${url}`, data);

        // 发起请求
        uni.request(requestConfig);
    });
};

/**
 * 拼接资源完整地址（用于图片等静态资源）
 * @param {string} relativePath - 相对路径，如 "/upload/xxx.jpg"
 * @returns {string} 完整 HTTPS 地址
 */
const getFullAssetUrl = (relativePath) => {
    if (!relativePath) {
        return '';
    }
    // 如果已经是完整URL（如 https://xxx），直接返回
    if (/^https?:\/\//i.test(relativePath)) {
        return relativePath;
    }
    return API_CONFIG.Url + relativePath;
};

/**
 * 处理响应数据
 * @param {object} res - 微信请求响应对象
 * @returns {object} 处理后的结果
 */
const handleResponse = (res) => {
    const { statusCode, data } = res;

    // HTTP状态码检查
    if (statusCode >= 200 && statusCode < 300) {
        // 检查业务状态码
        if (data && typeof data === 'object') {
            if (data.success === true || data.code === 200) {
                return {
                    success: true,
                    data: data.data || data,
                    message: data.message || '请求成功'
                };
            } else {
                // 业务逻辑错误
                handleBusinessError(data);
                return {
                    success: false,
                    code: data.code || 'BUSINESS_ERROR',
                    message: data.message || '业务处理失败',
                    data: null
                };
            }
        }

        // 直接返回数据（兼容简单API）
        return {
            success: true,
            data: data,
            message: '请求成功'
        };
    } else {
        // HTTP错误
        return {
            success: false,
            code: `HTTP_${statusCode}`,
            message: `网络错误 (${statusCode})`,
            data: null
        };
    }
};

/**
 * 处理网络错误
 * @param {object} error - 错误对象
 * @param {string} url - 请求URL
 * @returns {object} 错误结果
 */
const handleNetworkError = (error, url) => {
    let message = '网络连接失败';
    let code = 'NETWORK_ERROR';
    if (error.errMsg) {
        if (error.errMsg.includes('timeout')) {
            message = '请求超时，请检查网络连接';
            code = 'TIMEOUT';
        } else if (error.errMsg.includes('fail')) {
            message = '网络请求失败，请检查网络连接';
            code = 'REQUEST_FAIL';
        }
    }

    // 显示错误提示
    uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
    });
    return {
        success: false,
        code,
        message,
        data: null,
        url
    };
};

/**
 * 处理业务错误
 * @param {object} data - 错误数据
 */
const handleBusinessError = (data) => {
    const { code, message } = data;

    // 特殊错误码处理
    switch (code) {
        case 401:
        case 'TOKEN_INVALID':
        case 'TOKEN_EXPIRED':
            // Token失效，清除登录状态
            try {
                const app = getApp();
                if (app && app.globalData.clearUserData) {
                    app.globalData.clearUserData();
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.warn('清除用户数据失败:', error);
            }
            uni.showModal({
                title: '登录过期',
                content: '您的登录状态已过期，请重新登录',
                showCancel: false,
                success: () => {
                    uni.switchTab({
                        url: '/pages/profile/profile'
                    });
                }
            });
            break;
        case 403:
        case 'PERMISSION_DENIED':
            uni.showToast({
                title: '权限不足',
                icon: 'none'
            });
            break;
        case 404:
        case 'DATA_NOT_EXISTS':
            uni.showToast({
                title: '数据不存在',
                icon: 'none'
            });
            break;
        case 500:
        case 'INTERNAL_SERVER_ERROR':
            uni.showToast({
                title: '服务器内部错误',
                icon: 'none'
            });
            break;
        default:
            if (message) {
                uni.showToast({
                    title: message,
                    icon: 'none'
                });
            }
    }
};

/**
 * 获取认证头
 * @returns {object} 认证头对象
 */
const getAuthHeader = () => {
    try {
        const app = getApp();
        const token = app && app.globalData ? app.globalData.token : null;
        if (token) {
            return {
                Authorization: `Bearer ${token}`
            };
        }
        return {};
    } catch (error) {
        console.log('CatchClause', error);
        console.log('CatchClause', error);
        console.warn('获取认证头失败:', error);
        return {};
    }
};

/**
 * 构建查询字符串
 * @param {object} params - 参数对象
 * @returns {string} 查询字符串
 */
const buildQueryString = (params) => {
    return Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
};

/**
 * 带重试的请求方法
 * @param {string} url - 接口路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据
 * @param {object} options - 额外配置
 * @returns {Promise} 响应结果
 */
const apiRequestWithRetry = async (url, method = 'GET', data = {}, options = {}) => {
    const maxRetries = options.retryCount || API_CONFIG.retryCount;
    const retryDelay = options.retryDelay || API_CONFIG.retryDelay;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const result = await apiRequest(url, method, data, options);
            return result;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            if (attempt === maxRetries + 1) {
                throw error;
            }
            console.log(` 第${attempt}次重试请求: ${url}`);

            // 等待后重试
            await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
        }
    }
};

// ===========================================
// 具体业务API方法
// ===========================================

/**
 * 认证相关API
 */
const authAPI = {
    // 游客登录
    guestLogin: () => {
        return apiRequest('/auth/guest-login', 'POST');
    },
    // 微信登录
    wxLogin: (data) => {
        return apiRequest('/auth/wx-login', 'POST', data);
    },
    // 验证Token
    validateToken: (token) => {
        return apiRequest(
            '/auth/validate',
            'GET',
            {},
            {
                header: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    },
    // 获取用户信息
    getUserProfile: () => {
        return apiRequest('/auth/profile', 'GET');
    },
    // 刷新Token
    refreshToken: (refreshToken) => {
        return apiRequest('/auth/refresh', 'POST', {
            refreshToken
        });
    },
    // 登出
    logout: () => {
        return apiRequest('/auth/logout', 'POST');
    }
};

/**
 * 英雄相关API
 */
const heroAPI = {
    // 获取英雄列表
    getHeroList: () => {
        return apiRequest('/hero/list', 'GET');
    },
    // 获取英雄详情
    getHeroDetail: (heroId) => {
        return apiRequest(`/hero/${heroId}`, 'GET');
    },
    // 根据英雄标识获取英雄
    getHeroByKey: (heroKey) => {
        return apiRequest(`/hero/key/${heroKey}`, 'GET');
    },
    // 获取英雄技能
    getHeroSkills: (heroId) => {
        return apiRequest(`/hero/${heroId}/skills`, 'GET');
    },
    // 根据类型获取英雄
    getHeroesByType: (heroType) => {
        return apiRequest('/hero/type', 'GET', {
            heroType
        });
    },
    // 分页获取英雄
    getHeroPage: (page = 1, size = 20, params = {}) => {
        return apiRequest('/hero/page', 'GET', {
            current: page,
            size,
            ...params
        });
    },
    // 获取英雄类型统计
    getHeroTypeStats: () => {
        return apiRequest('/hero/statistics/types', 'GET');
    },
    // 获取英雄筛选选项
    getHeroFilterOptions: () => {
        return apiRequest('/hero/filter-options', 'GET');
    }
};

/**
 * 地图相关API
 */
const mapAPI = {
    // 获取地图列表
    getMapList: () => {
        return apiRequest('/map/list', 'GET');
    },
    // 获取地图详情
    getMapDetail: (mapId) => {
        return apiRequest(`/map/${mapId}`, 'GET');
    },
    // 分页获取地图
    getMapPage: (page = 1, size = 20) => {
        return apiRequest('/map/page', 'GET', {
            current: page,
            size
        });
    }
};

/**
 * 武器相关API
 */
const weaponAPI = {
    // 获取武器列表
    getWeaponList: () => {
        return apiRequest('/weapon/list', 'GET'); // 改为单数
    },
    // 获取武器详情
    getWeaponDetail: (weaponId) => {
        return apiRequest(`/weapon/${weaponId}`, 'GET'); // 改为单数
    },
    // 根据类型获取武器
    getWeaponsByType: (weaponType) => {
        return apiRequest('/weapon/type', 'GET', {
            weaponType
        }); // 改为单数
    },
    // 分页获取武器
    getWeaponPage: (page = 1, size = 20, params = {}) => {
        return apiRequest('/weapon/page', 'GET', {
            // 改为单数
            current: page,
            size,
            ...params
        });
    }
};

/**
 * 点位相关API - 修复版本
 */
const positionAPI = {
    /**
     * 三级筛选点位（核心功能）
     * @param {object} params - 筛选参数
     * @param {number} params.mapId - 地图ID（必填）
     * @param {number} params.heroId - 英雄ID（可选）
     * @param {string} params.side - 攻防方：attack/defense（必填）
     * @returns {Promise<object>} 点位列表
     */
    filterPositions: (params) => {
        return apiRequest('/position/filter', 'GET', params);
    },
    /**
     * 获取点位详情
     * @param {number} positionId - 点位ID
     * @returns {Promise<object>} 点位详情数据
     */
    getPositionDetail: (positionId) => {
        return apiRequest(`/position/${positionId}`, 'GET');
    },
    /**
     * 获取筛选选项
     * @returns {Promise<object>} 筛选选项数据
     */
    getFilterOptions: () => {
        return apiRequest('/position/filter-options', 'GET');
    }
};

/**
 * 内容相关API - 修复版本
 */
const contentAPI = {
    /**
     * 获取内容详情
     * @param {number} contentId - 内容ID
     * @returns {Promise<object>} 内容详情数据
     */
    getContentDetail: (contentId) => {
        return apiRequest(`/content/${contentId}`, 'GET');
    },
    /**
     * 按类型获取内容
     * @param {string} contentType - 内容类型：video, article, mixed
     * @returns {Promise<object>} 内容列表
     */
    getContentsByType: (contentType) => {
        return apiRequest(`/content/type/${contentType}`, 'GET');
    },
    /**
     * 获取热门内容
     * @param {object} params - 查询参数
     * @param {number} params.limit - 返回数量
     * @param {string} params.contentType - 内容类型筛选
     * @param {number} params.days - 最近N天
     * @returns {Promise<object>} 热门内容列表
     */
    getHotContents: (params = {}) => {
        return apiRequest('/content/hot', 'GET', params);
    },
    /**
     * 获取推荐内容
     * @param {object} params - 推荐参数
     * @param {number} params.contentId - 基于此内容推荐
     * @param {number} params.heroId - 基于英雄推荐
     * @param {number} params.mapId - 基于地图推荐
     * @param {number} params.limit - 返回数量
     * @returns {Promise<object>} 推荐内容列表
     */
    getRecommendedContents: (params = {}) => {
        return apiRequest('/content/recommend', 'GET', params);
    },
    /**
     * 分页查询内容
     * @param {object} params - 查询参数
     * @returns {Promise<object>} 内容分页数据
     */
    getContentPage: (params = {}) => {
        return apiRequest('/content/page', 'GET', params);
    }
};

/**
 * 收藏相关API - 修复版本（参数格式修正）
 */
const favoriteAPI = {
    /**
     * 添加收藏
     * @param {object} params - 收藏参数
     * @param {string} params.targetType - 收藏目标类型
     * @param {number} params.targetId - 收藏目标ID
     * @param {string} params.folderName - 收藏夹名称
     * @returns {Promise<object>} 收藏结果
     */
    addFavorite: (params) => {
        return apiRequest('/favorite/add', 'POST', params);
    },
    /**
     * 取消收藏
     * @param {object} params - 取消收藏参数
     * @param {string} params.targetType - 收藏目标类型
     * @param {number} params.targetId - 收藏目标ID
     * @returns {Promise<object>} 取消收藏结果
     */
    removeFavorite: (params) => {
        return apiRequest('/favorite/remove', 'DELETE', params);
    },
    /**
     * 检查收藏状态
     * @param {object} params - 检查参数
     * @param {string} params.targetType - 收藏目标类型
     * @param {number} params.targetId - 收藏目标ID
     * @returns {Promise<object>} 收藏状态
     */
    checkFavorite: (params) => {
        return apiRequest('/favorite/check', 'GET', params);
    },
    /**
     * 获取收藏列表
     * @param {object} params - 查询参数
     * @returns {Promise<object>} 收藏列表
     */
    getFavoriteList: (params = {}) => {
        return apiRequest('/favorite/list', 'GET', params);
    }
};

/**
 * 浏览历史相关API - 修复版本
 */
const historyAPI = {
    /**
     * 记录浏览历史
     * @param {object} params - 历史记录参数
     * @param {string} params.targetType - 目标类型
     * @param {number} params.targetId - 目标ID
     * @param {number} params.duration - 观看时长（秒）
     * @param {number} params.progress - 观看进度（百分比）
     * @returns {Promise<object>} 记录结果
     */
    recordHistory: (params) => {
        return apiRequest('/history/record', 'POST', params);
    },
    /**
     * 获取浏览历史
     * @param {object} params - 查询参数
     * @param {number} params.current - 当前页
     * @param {number} params.size - 每页大小
     * @param {string} params.targetType - 筛选类型
     * @returns {Promise<object>} 历史记录列表
     */
    getHistoryList: (params = {}) => {
        return apiRequest('/history/list', 'GET', params);
    }
};
/**
 * 搜索相关API
 */
const searchAPI = {
    // 全文搜索
    search: (keyword, filters = {}) => {
        return apiRequest('/search', 'GET', {
            keyword,
            ...filters
        });
    },
    // 搜索建议
    searchSuggestions: (keyword) => {
        return apiRequest('/search/suggestions', 'GET', {
            keyword
        });
    },
    // 热门搜索
    getHotSearches: () => {
        return apiRequest('/search/hot', 'GET');
    }
};

/**
 * 标签相关API
 */
const tagAPI = {
    // 获取标签列表
    getTagList: () => {
        return apiRequest('/tags/list', 'GET');
    },
    // 根据类型获取标签
    getTagsByType: (type) => {
        return apiRequest('/tags/type', 'GET', {
            type
        });
    }
};

/**
 * 用户相关API
 */
const userAPI = {
    // 获取用户信息
    getUserProfile: () => {
        return apiRequest('/user/profile', 'GET');
    },
    // 更新用户信息
    updateUserProfile: (data) => {
        return apiRequest('/user/profile', 'PUT', data);
    },
    // 修改密码
    changePassword: (oldPassword, newPassword) => {
        return apiRequest('/user/password', 'PUT', {
            oldPassword,
            newPassword
        });
    },
    // 获取用户统计
    getStatistics: () => {
        return apiRequest('/user/statistics', 'GET');
    },
    // 获取偏好设置
    getPreferences: () => {
        return apiRequest('/user/preferences', 'GET');
    },
    // 更新偏好设置
    updatePreferences: (preferences) => {
        return apiRequest('/user/preferences', 'PUT', preferences);
    }
};

// ===========================================
// 工具方法
// ===========================================

/**
 * 上传文件
 * @param {string} filePath - 本地文件路径
 * @param {string} uploadUrl - 上传接口URL
 * @param {object} formData - 表单数据
 * @returns {Promise} 上传结果
 */
const uploadFile = (filePath, uploadUrl = '/upload', formData = {}) => {
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: API_CONFIG.baseUrl + uploadUrl,
            filePath: filePath,
            name: 'file',
            formData: formData,
            header: getAuthHeader(),
            success: (res) => {
                console.log('✅ 文件上传成功', res);
                try {
                    const data = JSON.parse(res.data);
                    if (data.success) {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                } catch (error) {
                    console.log('CatchClause', error);
                    console.log('CatchClause', error);
                    reject({
                        success: false,
                        message: '上传响应解析失败'
                    });
                }
            },
            fail: (error) => {
                console.error('❌ 文件上传失败', error);
                reject({
                    success: false,
                    message: '文件上传失败'
                });
            }
        });
    });
};

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} fileName - 文件名
 * @returns {Promise} 下载结果
 */
const downloadFile = (url, fileName) => {
    return new Promise((resolve, reject) => {
        uni.downloadFile({
            url: url,
            success: (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ 文件下载成功', res.tempFilePath);
                    resolve(res.tempFilePath);
                } else {
                    reject({
                        success: false,
                        message: '文件下载失败'
                    });
                }
            },
            fail: (error) => {
                console.error('❌ 文件下载失败', error);
                reject({
                    success: false,
                    message: '文件下载失败'
                });
            }
        });
    });
};

/**
 * 批量请求工具
 * @param {Array} requests - 请求数组
 * @param {number} maxConcurrency - 最大并发数
 * @returns {Promise} 批量请求结果
 */
const batchRequest = async (requests, maxConcurrency = 5) => {
    const results = [];
    const executing = [];
    for (const request of requests) {
        const promise = apiRequest(...request).then((result) => {
            executing.splice(executing.indexOf(promise), 1);
            return result;
        });
        results.push(promise);
        if (requests.length >= maxConcurrency) {
            executing.push(promise);
        }
        if (executing.length >= maxConcurrency) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
};

/**
 * 请求缓存工具
 */
const requestCache = {
    cache: new Map(),
    maxSize: 50,
    // 获取缓存键
    getCacheKey: (url, method, data) => {
        return `${method}:${url}:${JSON.stringify(data)}`;
    },
    // 设置缓存
    set: function (key, value, ttl = 300000) {
        // 默认5分钟
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            ttl
        });
    },
    // 获取缓存
    get: function (key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    },
    // 清除缓存
    clear: function () {
        this.cache.clear();
    }
};

/**
 * 带缓存的API请求
 * @param {string} url - 接口路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据
 * @param {object} options - 额外配置
 * @returns {Promise} 响应结果
 */
const apiRequestWithCache = async (url, method = 'GET', data = {}, options = {}) => {
    // 只对GET请求使用缓存
    if (method.toUpperCase() === 'GET' && !options.noCache) {
        const cacheKey = requestCache.getCacheKey(url, method, data);
        const cachedResult = requestCache.get(cacheKey);
        if (cachedResult) {
            console.log(` 使用缓存数据: ${url}`);
            return cachedResult;
        }
    }
    const result = await apiRequest(url, method, data, options);

    // 缓存成功的GET请求结果
    if (method.toUpperCase() === 'GET' && result.success && !options.noCache) {
        const cacheKey = requestCache.getCacheKey(url, method, data);
        const ttl = options.cacheTTL || 300000; // 默认5分钟
        requestCache.set(cacheKey, result, ttl);
    }
    return result;
};

/**
 * 网络状态检查
 */
const networkUtils = {
    // 检查网络状态
    checkNetworkStatus: () => {
        return new Promise((resolve) => {
            uni.getNetworkType({
                success: (res) => {
                    resolve({
                        isConnected: res.networkType !== 'none',
                        networkType: res.networkType
                    });
                },
                fail: () => {
                    resolve({
                        isConnected: false,
                        networkType: 'unknown'
                    });
                }
            });
        });
    },
    // 监听网络状态变化
    onNetworkStatusChange: (callback) => {
        uni.onNetworkStatusChange(callback);
    },
    // 检查服务器连通性
    checkServerConnectivity: async () => {
        try {
            const result = await apiRequest(
                '/health/check',
                'GET',
                {},
                {
                    timeout: 5000
                }
            );
            return result.success;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            return false;
        }
    }
};

/**
 * API请求拦截器
 */
const apiInterceptor = {
    // 请求拦截器
    requestInterceptors: [],
    // 响应拦截器
    responseInterceptors: [],
    // 添加请求拦截器
    addRequestInterceptor: function (interceptor) {
        this.requestInterceptors.push(interceptor);
    },
    // 添加响应拦截器
    addResponseInterceptor: function (interceptor) {
        this.responseInterceptors.push(interceptor);
    },
    // 执行请求拦截器
    executeRequestInterceptors: function (config) {
        let result = config;
        this.requestInterceptors.forEach((interceptor) => {
            result = interceptor(result);
        });
        return result;
    },
    // 执行响应拦截器
    executeResponseInterceptors: function (response) {
        let result = response;
        this.responseInterceptors.forEach((interceptor) => {
            result = interceptor(result);
        });
        return result;
    }
};

// 导出所有API和工具
module.exports = {
    apiRequest,
    apiRequestWithRetry,
    apiRequestWithCache,
    authAPI,
    heroAPI,
    mapAPI,
    weaponAPI,
    positionAPI,
    contentAPI,
    favoriteAPI,
    searchAPI,
    tagAPI,
    userAPI,
    historyAPI,
    uploadFile,
    downloadFile,
    batchRequest,
    requestCache,
    networkUtils,
    apiInterceptor,
    getFullAssetUrl
};
