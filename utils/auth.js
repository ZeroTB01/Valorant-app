// utils/auth.js - Valorant助手认证工具
const { apiRequest } = require('./api.js');
const { storageUtils } = require('./storage.js');
const app = getApp();

/**
 * 认证工具类
 */
const authUtils = {
    /**
     * 游客登录
     * @returns {Promise<object>} 登录结果
     */
    async guestLogin() {
        try {
            console.log(' 开始游客登录...');
            const result = await apiRequest('/auth/guest-login', 'POST');
            if (result.success && result.data) {
                const { token, refreshToken, userInfo } = result.data;

                // 标记为游客用户
                const guestUserInfo = {
                    ...userInfo,
                    isGuest: true,
                    username: userInfo.username || '游客',
                    nickname: userInfo.nickname || '游客用户'
                };

                // 保存登录信息
                this.saveLoginInfo(token, refreshToken, guestUserInfo);
                console.log('✅ 游客登录成功:', guestUserInfo.username);
                return {
                    success: true,
                    userInfo: guestUserInfo,
                    token
                };
            } else {
                throw new Error(result.message || '游客登录失败');
            }
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 游客登录失败:', error);
            uni.showToast({
                title: '登录失败，请稍后重试',
                icon: 'none'
            });
            return {
                success: false,
                message: error.message || '游客登录失败'
            };
        }
    },
    /**
     * 微信授权登录（预留接口，暂未实现）
     * @returns {Promise<object>} 登录结果
     */
    async wechatLogin() {
        try {
            console.log(' 开始微信授权登录...');

            // 获取微信授权
            const loginResult = await this.getWechatAuth();
            if (!loginResult.success) {
                throw new Error('微信授权失败');
            }

            // 调用后端微信登录接口（待后端实现）
            const result = await apiRequest('/auth/wechat-login', 'POST', {
                code: loginResult.code,
                userInfo: loginResult.userInfo
            });
            if (result.success && result.data) {
                const { token, refreshToken, userInfo } = result.data;

                // 保存登录信息
                this.saveLoginInfo(token, refreshToken, userInfo);
                console.log('✅ 微信登录成功:', userInfo.nickname);
                return {
                    success: true,
                    userInfo,
                    token
                };
            } else {
                throw new Error(result.message || '微信登录失败');
            }
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 微信登录失败:', error);

            // 微信登录失败，尝试游客登录
            uni.showModal({
                title: '登录提示',
                content: '微信登录暂不可用，是否使用游客模式？',
                confirmText: '游客登录',
                cancelText: '稍后再试',
                success: (res) => {
                    if (res.confirm) {
                        this.guestLogin();
                    }
                }
            });
            return {
                success: false,
                message: error.message || '微信登录失败'
            };
        }
    },
    /**
     * 获取微信授权信息
     * @returns {Promise<object>} 授权结果
     */
    async getWechatAuth() {
        try {
            // 获取微信登录凭证
            const loginRes = await new Promise((resolve, reject) => {
                uni.login({
                    success: resolve,
                    fail: reject
                });
            });
            if (!loginRes.code) {
                throw new Error('获取微信登录凭证失败');
            }

            // 获取用户信息授权
            const settingRes = await new Promise((resolve, reject) => {
                uni.getSetting({
                    success: resolve,
                    fail: reject
                });
            });
            let userInfo = null;
            if (settingRes.authSetting['scope.userInfo']) {
                // 已授权，直接获取用户信息
                const userInfoRes = await new Promise((resolve, reject) => {
                    uni.getUserInfo({
                        success: resolve,
                        fail: reject
                    });
                });
                userInfo = userInfoRes.userInfo;
            } else {
                // 未授权，引导用户授权
                const authorizeRes = await new Promise((resolve, reject) => {
                    uni.authorize({
                        scope: 'scope.userInfo',
                        success: resolve,
                        fail: reject
                    });
                });
                if (authorizeRes) {
                    const userInfoRes = await new Promise((resolve, reject) => {
                        uni.getUserInfo({
                            success: resolve,
                            fail: reject
                        });
                    });
                    userInfo = userInfoRes.userInfo;
                }
            }
            return {
                success: true,
                code: loginRes.code,
                userInfo
            };
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 微信授权失败:', error);
            return {
                success: false,
                message: error.message || '微信授权失败'
            };
        }
    },
    /**
     * 验证Token有效性
     * @param {string} token - 要验证的token
     * @returns {Promise<boolean>} 是否有效
     */
    async validateToken(token) {
        try {
            if (!token) {
                return false;
            }
            const result = await apiRequest(
                '/auth/validate',
                'GET',
                {},
                {
                    header: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return result.success;
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ Token验证失败:', error);
            return false;
        }
    },
    /**
     * 刷新Token
     * @returns {Promise<object>} 刷新结果
     */
    async refreshToken() {
        try {
            const refreshToken = storageUtils.getRefreshToken();
            if (!refreshToken) {
                throw new Error('没有刷新令牌');
            }
            const result = await apiRequest('/auth/refresh', 'POST', {
                refreshToken
            });
            if (result.success && result.data) {
                const { token, refreshToken: newRefreshToken, userInfo } = result.data;

                // 更新本地存储
                storageUtils.setToken(token);
                if (newRefreshToken) {
                    storageUtils.setRefreshToken(newRefreshToken);
                }
                if (userInfo) {
                    storageUtils.setUserInfo(userInfo);
                }

                // 更新全局状态
                app.globalData.token = token;
                if (userInfo) {
                    app.globalData.userInfo = userInfo;
                }
                console.log('✅ Token刷新成功');
                return {
                    success: true,
                    token,
                    userInfo
                };
            } else {
                throw new Error(result.message || 'Token刷新失败');
            }
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ Token刷新失败:', error);

            // 刷新失败，清除登录状态
            this.logout();
            return {
                success: false,
                message: error.message || 'Token刷新失败'
            };
        }
    },
    /**
     * 用户登出
     * @param {boolean} showToast - 是否显示提示
     */
    async logout(showToast = true) {
        try {
            // 调用后端登出接口
            if (app.globalData.token) {
                await apiRequest('/auth/logout', 'POST');
            }
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 后端登出失败:', error);
        } finally {
            // 清除本地数据
            this.clearLoginInfo();
            if (showToast) {
                uni.showToast({
                    title: '已退出登录',
                    icon: 'success'
                });
            }
            console.log(' 用户已登出');
        }
    },
    /**
     * 保存登录信息
     * @param {string} token - 访问令牌
     * @param {string} refreshToken - 刷新令牌
     * @param {object} userInfo - 用户信息
     */
    saveLoginInfo(token, refreshToken, userInfo) {
        // 保存到本地存储
        storageUtils.setToken(token);
        storageUtils.setRefreshToken(refreshToken);
        storageUtils.setUserInfo(userInfo);

        // 更新全局状态
        app.globalData.onUserLogin(userInfo, token);
    },
    /**
     * 清除登录信息
     */
    clearLoginInfo() {
        // 清除本地存储
        storageUtils.clearAuth();

        // 清除全局状态
        app.globalData.onUserLogout();
    },
    /**
     * 检查登录状态
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return app.globalData.isLogin && !!app.globalData.token;
    },
    /**
     * 检查是否为游客
     * @returns {boolean} 是否为游客
     */
    isGuest() {
        return app.globalData.isGuest;
    },
    /**
     * 获取当前用户信息
     * @returns {object|null} 用户信息
     */
    getCurrentUser() {
        return app.globalData.userInfo;
    },
    /**
     * 获取当前Token
     * @returns {string|null} 当前Token
     */
    getCurrentToken() {
        return app.globalData.token;
    },
    /**
     * 要求登录（如果未登录则引导登录）
     * @param {object} options - 配置选项
     * @returns {Promise<boolean>} 是否已登录
     */
    async requireLogin(options = {}) {
        const { title = '需要登录', content = '此功能需要登录后使用，是否立即登录？', allowGuest = true, redirectTo = null } = options;
        if (this.isLoggedIn()) {
            return true;
        }
        return new Promise((resolve) => {
            uni.showModal({
                title,
                content,
                confirmText: allowGuest ? '游客登录' : '立即登录',
                cancelText: '稍后再说',
                success: async (res) => {
                    if (res.confirm) {
                        if (allowGuest) {
                            const result = await this.guestLogin();
                            if (result.success) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        } else {
                            // 跳转到登录页面
                            const url = redirectTo || '/pages/auth/login/login';
                            uni.navigateTo({
                                url,
                                success: () => resolve(false),
                                fail: () => resolve(false)
                            });
                        }
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    },
    /**
     * 检查权限
     * @param {string|Array} permissions - 需要的权限
     * @returns {boolean} 是否有权限
     */
    hasPermission(permissions) {
        if (!this.isLoggedIn()) {
            return false;
        }
        const userInfo = this.getCurrentUser();
        const userRoles = userInfo.roles || [];

        // 游客只有基础权限
        if (this.isGuest()) {
            const guestPermissions = ['view', 'favorite', 'history'];
            if (Array.isArray(permissions)) {
                return permissions.every((p) => guestPermissions.includes(p));
            }
            return guestPermissions.includes(permissions);
        }

        // 检查角色权限
        if (Array.isArray(permissions)) {
            return permissions.some((permission) => userRoles.some((role) => this.roleHasPermission(role, permission)));
        }
        return userRoles.some((role) => this.roleHasPermission(role, permissions));
    },
    /**
     * 检查角色是否有指定权限
     * @param {string} role - 角色
     * @param {string} permission - 权限
     * @returns {boolean} 是否有权限
     */
    roleHasPermission(role, permission) {
        const rolePermissions = {
            SUPER_ADMIN: ['*'],
            // 超级管理员有所有权限
            ADMIN: ['manage', 'create', 'edit', 'delete', 'view', 'favorite', 'history'],
            CONTENT_MANAGER: ['create', 'edit', 'view', 'favorite', 'history'],
            USER: ['view', 'favorite', 'history', 'comment'],
            GUEST: ['view', 'favorite', 'history']
        };
        const permissions = rolePermissions[role] || [];
        return permissions.includes('*') || permissions.includes(permission);
    },
    /**
     * 自动登录（应用启动时调用）
     */
    async autoLogin() {
        try {
            const token = storageUtils.getToken();
            const userInfo = storageUtils.getUserInfo();
            if (!token || !userInfo) {
                console.log('ℹ️ 没有本地登录信息，尝试游客登录');
                await this.guestLogin();
                return;
            }

            // 验证token有效性
            const isValid = await this.validateToken(token);
            if (isValid) {
                // Token有效，恢复登录状态
                app.globalData.onUserLogin(userInfo, token);
                console.log('✅ 自动登录成功:', userInfo.username || userInfo.nickname);
            } else {
                // Token无效，尝试刷新
                console.log('⚠️ Token已过期，尝试刷新...');
                const refreshResult = await this.refreshToken();
                if (!refreshResult.success) {
                    // 刷新失败，游客登录
                    console.log('❌ Token刷新失败，使用游客登录');
                    await this.guestLogin();
                }
            }
        } catch (error) {
            console.log('CatchClause', error);
            console.log('CatchClause', error);
            console.error('❌ 自动登录失败:', error);
            // 发生错误，使用游客登录
            await this.guestLogin();
        }
    },
    /**
     * 监听登录状态变化
     * @param {Function} callback - 回调函数
     */
    onLoginStatusChange(callback) {
        // 这里可以实现登录状态监听机制
        if (typeof callback === 'function') {
            // 可以将回调存储起来，在状态变化时调用
            this._loginStatusCallbacks = this._loginStatusCallbacks || [];
            this._loginStatusCallbacks.push(callback);
        }
    },
    /**
     * 触发登录状态变化事件
     * @param {boolean} isLoggedIn - 是否已登录
     * @param {object} userInfo - 用户信息
     */
    triggerLoginStatusChange(isLoggedIn, userInfo) {
        if (this._loginStatusCallbacks) {
            this._loginStatusCallbacks.forEach((callback) => {
                try {
                    callback(isLoggedIn, userInfo);
                } catch (error) {
                    console.log('CatchClause', error);
                    console.log('CatchClause', error);
                    console.error('❌ 登录状态回调执行失败:', error);
                }
            });
        }
    }
};

// 导出认证工具
module.exports = {
    authUtils
};
