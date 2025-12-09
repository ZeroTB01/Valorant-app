<script>
// app.js - Valorant助手全局应用逻辑
const { authUtils } = require('./utils/auth.js');
const { storageUtils } = require('./utils/storage.js');
export default {
    data() {
        return {};
    },
    // 全局数据
    globalData: {
        userInfo: null,
        isLogin: false,
        isGuest: false,
        token: null,
        systemInfo: null,

        // API配置
        apiConfig: {
            baseUrl: 'http://4af08d69.r32.cpolar.top/api',
            timeout: 10000
        },

        // 主题配置
        theme: {
            mode: 'dark',
            // 默认深色主题
            primaryColor: '#FF4654',
            backgroundColor: '#0F1419'
        },

        // 缓存配置
        cache: {
            heroList: null,
            mapList: null,
            weaponList: null,
            lastUpdateTime: null
        },

        // 初始化系统信息
        initSystemInfo() {
            try {
                const systemInfo = uni.getSystemInfoSync();
                this.systemInfo = systemInfo;
                console.log(' 系统信息:', {
                    platform: systemInfo.platform,
                    version: systemInfo.version,
                    screenWidth: systemInfo.screenWidth,
                    screenHeight: systemInfo.screenHeight
                });

                // 设置状态栏高度等样式变量
                this.setSystemStyle(systemInfo);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 获取系统信息失败:', error);
            }
        },

        // 设置系统样式变量
        setSystemStyle(systemInfo) {
            const { statusBarHeight, platform } = systemInfo;

            // 计算导航栏高度
            const navBarHeight = platform === 'ios' ? 44 : 48;
            const totalNavHeight = statusBarHeight + navBarHeight;

            // 将样式信息存储到全局
            this.systemStyle = {
                statusBarHeight,
                navBarHeight,
                totalNavHeight,
                platform
            };
        },

        // 检查登录状态
        async checkLoginStatus() {
            try {
                const token = storageUtils.getToken();
                const userInfo = storageUtils.getUserInfo();
                if (token && userInfo) {
                    // 验证token有效性
                    const isValid = await authUtils.validateToken(token);
                    if (isValid) {
                        this.token = token;
                        this.userInfo = userInfo;
                        this.isLogin = true;
                        this.isGuest = userInfo.isGuest || false;
                        console.log('✅ 用户已登录:', userInfo.username || '游客');
                    } else {
                        // token无效，清除本地数据
                        this.clearUserData();
                        console.log('⚠️ Token已失效，已清除登录状态');
                    }
                } else {
                    console.log('ℹ️ 用户未登录');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 检查登录状态失败:', error);
                this.clearUserData();
            }
        },

        // 检查token过期
        async checkTokenExpiry() {
            if (!this.token) {
                return;
            }
            try {
                const isValid = await authUtils.validateToken(this.token);
                if (!isValid) {
                    this.clearUserData();

                    // 提示用户重新登录
                    uni.showModal({
                        title: '登录过期',
                        content: '您的登录状态已过期，请重新登录',
                        showCancel: false,
                        success: () => {
                            // 跳转到个人中心进行登录
                            uni.switchTab({
                                url: '/pages/profile/profile'
                            });
                        }
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 检查token过期失败:', error);
            }
        },

        // 初始化主题
        initTheme() {
            try {
                const savedTheme = storageUtils.getTheme();
                if (savedTheme) {
                    this.theme = {
                        ...this.theme,
                        ...savedTheme
                    };
                }

                // 应用主题样式
                this.applyTheme();
                console.log(' 主题初始化完成:', this.theme.mode);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 初始化主题失败:', error);
            }
        },

        // 应用主题
        applyTheme() {
            const { mode } = this.theme;

            // 设置状态栏样式
            uni.setNavigationBarColor({
                frontColor: mode === 'dark' ? '#ffffff' : '#000000',
                backgroundColor: mode === 'dark' ? '#0F1419' : '#ffffff'
            });

            // 设置tabBar样式
            uni.setTabBarStyle({
                color: mode === 'dark' ? '#ECECEC' : '#666666',
                selectedColor: '#FF4654',
                backgroundColor: mode === 'dark' ? '#1E2328' : '#ffffff',
                borderStyle: mode === 'dark' ? 'white' : 'black'
            });
        },

        // 预加载基础数据
        async preloadBasicData() {
            try {
                // 检查缓存是否有效（1小时内）
                const lastUpdate = this.cache.lastUpdateTime;
                const now = Date.now();
                if (lastUpdate && now - lastUpdate < 3600000) {
                    console.log('✅ 使用缓存的基础数据');
                    return;
                }
                console.log(' 开始预加载基础数据...');

                // 预加载英雄数据（优先级最高）
                this.preloadHeroData();

                // 延迟加载其他数据，避免启动时网络拥堵
                setTimeout(() => {
                    this.preloadMapData();
                    this.preloadWeaponData();
                }, 2000);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 预加载基础数据失败:', error);
            }
        },

        // 预加载英雄数据
        async preloadHeroData() {
            try {
                const { apiRequest } = require('./utils/api.js');
                const result = await apiRequest('/hero/list', 'GET');
                if (result.success && result.data) {
                    this.cache.heroList = result.data;
                    console.log('✅ 英雄数据预加载完成:', result.data.length + '个英雄');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 预加载英雄数据失败:', error);
            }
        },

        // 预加载地图数据
        async preloadMapData() {
            try {
                const { apiRequest } = require('./utils/api.js');
                const result = await apiRequest('/map/list', 'GET');
                if (result.success && result.data) {
                    this.cache.mapList = result.data;
                    console.log('✅ 地图数据预加载完成:', result.data.length + '个地图');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 预加载地图数据失败:', error);
            }
        },

        // 预加载武器数据
        async preloadWeaponData() {
            try {
                const { apiRequest } = require('./utils/api.js');
                const result = await apiRequest('/weapon/list', 'GET');
                if (result.success && result.data) {
                    this.cache.weaponList = result.data;
                    console.log('✅ 武器数据预加载完成:', result.data.length + '个武器');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 预加载武器数据失败:', error);
            }
        },

        // 用户登录成功
        onUserLogin(userInfo, token) {
            this.userInfo = userInfo;
            this.token = token;
            this.isLogin = true;
            this.isGuest = userInfo.isGuest || false;

            // 保存到本地存储
            storageUtils.setToken(token);
            storageUtils.setUserInfo(userInfo);
            console.log('✅ 用户登录成功:', userInfo.username || '游客');

            // 触发登录成功事件
            this.$emit('onUserLogin', {
                detail: userInfo
            });
        },

        // 用户登出
        onUserLogout() {
            this.clearUserData();
            console.log(' 用户已登出');

            // 触发登出事件
            this.$emit('onUserLogout');

            // 提示用户
            uni.showToast({
                title: '已退出登录',
                icon: 'success'
            });
        },

        // 清除用户数据
        clearUserData() {
            this.userInfo = null;
            this.token = null;
            this.isLogin = false;
            this.isGuest = false;

            // 清除本地存储
            storageUtils.clearAuth();
        },

        // 保存用户数据
        saveUserData() {
            if (this.isLogin && this.userInfo) {
                storageUtils.setUserInfo(this.userInfo);
            }

            // 保存主题设置
            storageUtils.setTheme(this.theme);

            // 更新缓存时间
            this.cache.lastUpdateTime = Date.now();
        },

        // 切换主题
        switchTheme(mode) {
            this.theme.mode = mode;
            this.applyTheme();
            storageUtils.setTheme(this.theme);
            console.log(' 主题已切换:', mode);

            // 触发主题切换事件
            this.$emit('onThemeChange', {
                detail: mode
            });
        },

        // 触发全局事件
        triggerEvent(eventName, data) {
            // 这里可以实现全局事件系统
            console.log(' 全局事件:', eventName, data);
        },

        // 获取用户信息
        getUserInfo() {
            return this.userInfo;
        },

        // 检查是否登录
        checkLogin() {
            return this.isLogin;
        },

        // 检查是否游客
        checkGuest() {
            return this.isGuest;
        },

        // 获取系统信息
        getSystemInfo() {
            return this.systemInfo;
        },

        // 获取系统样式
        getSystemStyle() {
            return this.systemStyle;
        },

        // 获取API配置
        getApiConfig() {
            return this.apiConfig;
        },

        // 获取主题配置
        getTheme() {
            return this.theme;
        },

        // 获取缓存数据
        getCacheData(key) {
            return this.cache[key];
        },

        // 设置缓存数据
        setCacheData(key, data) {
            this.cache[key] = data;
            this.cache.lastUpdateTime = Date.now();
        },

        // 清除缓存
        clearCache() {
            this.cache = {
                heroList: null,
                mapList: null,
                weaponList: null,
                lastUpdateTime: null
            };
            console.log('️ 缓存已清除');
        },

        // 错误处理
        handleError(error, context = '') {
            console.error(`❌ ${context}错误:`, error);

            // 根据错误类型进行处理
            if (error.message && error.message.includes('网络')) {
                uni.showToast({
                    title: '网络连接失败',
                    icon: 'none'
                });
            } else if (error.message && error.message.includes('token')) {
                this.clearUserData();
            } else {
                uni.showToast({
                    title: context || '操作失败',
                    icon: 'none'
                });
            }
        },

        systemStyle: ''
    },
    // 应用启动
    onLaunch() {
        console.log(' Valorant助手启动中...');

        // 初始化系统信息
        this.globalData.initSystemInfo();

        // 检查登录状态
        this.globalData.checkLoginStatus();

        // 初始化主题
        this.globalData.initTheme();

        // 预加载基础数据
        this.globalData.preloadBasicData();
        console.log('✅ Valorant助手启动完成');
    },
    // 应用激活
    onShow() {
        console.log(' 应用激活');

        // 检查token是否过期
        this.globalData.checkTokenExpiry();
    },
    // 应用隐藏
    onHide() {
        console.log(' 应用隐藏');

        // 保存用户数据
        this.globalData.saveUserData();
    }
};
</script>
<style>
/* app.wxss */
:root {
    /* 主题色 */
    --primary-red: #ff4654;
    --primary-red-dark: #cc3844;
    --primary-red-light: #ff6b78;

    /* 辅助色 */
    --accent-blue: #00f5ff;
    --accent-purple: #bd93f9;
    --accent-gold: #ffd700;
    --accent-green: #50fa7b;

    /* 背景色 */
    --bg-primary: #0f1419;
    --bg-secondary: #1e2328;
    --bg-tertiary: #2a2e34;
    --bg-card: #1e2328;

    /* 文字色 */
    --text-primary: #ececec;
    --text-secondary: #a8a8a8;
    --text-tertiary: #7b7b7b;
    --text-disabled: #4a4a4a;

    /* 边框色 */
    --border-primary: #2a2e34;
    --border-secondary: #383d43;

    /* 阴影 */
    --shadow-light: rgba(0, 0, 0, 0.2);
    --shadow-medium: rgba(0, 0, 0, 0.4);
    --shadow-heavy: rgba(0, 0, 0, 0.6);

    /* 间距 */
    --spacing-xs: 8rpx;
    --spacing-sm: 16rpx;
    --spacing-md: 24rpx;
    --spacing-lg: 32rpx;
    --spacing-xl: 48rpx;

    /* 圆角 */
    --radius-small: 8rpx;
    --radius-medium: 16rpx;
    --radius-large: 24rpx;
    --radius-round: 50%;

    /* 动画时长 */
    --transition-fast: 0.2s;
    --transition-normal: 0.3s;
    --transition-slow: 0.5s;

    /* 渐变 */
    --gradient-primary: linear-gradient(135deg, #ff4654 0%, #ff6b78 100%);
    --gradient-dark: linear-gradient(135deg, #1e2328 0%, #0f1419 100%);
}

/* ===========================================
     全局重置和基础样式
     =========================================== */
page {
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 28rpx;
    color: var(--text-primary);
    background-color: var(--bg-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
}

view,
scroll-view,
swiper,
movable-view,
cover-view {
    box-sizing: border-box;
}

image {
    display: block;
    height: auto;
}

button {
    background-color: transparent;
    padding: 0;
    margin: 0;
    line-height: inherit;
    font-size: inherit;
    border-radius: 0;
}

button::after {
    border: none;
}

input {
    outline: none;
    border: none;
    background-color: transparent;
    color: inherit;
}

/* ===========================================
     安全区域适配
     =========================================== */
.safe-area-bottom {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-top {
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
}

.safe-padding {
    padding-left: constant(safe-area-inset-left);
    padding-left: env(safe-area-inset-left);
    padding-right: constant(safe-area-inset-right);
    padding-right: env(safe-area-inset-right);
}

/* ===========================================
     Flex布局工具类
     =========================================== */
.flex {
    display: flex;
}

.flex-column {
    display: flex;
    flex-direction: column;
}

.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.flex-around {
    display: flex;
    align-items: center;
    justify-content: space-around;
}

.flex-start {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.flex-end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.flex-1 {
    flex: 1;
}

.flex-wrap {
    flex-wrap: wrap;
}

/* ===========================================
     文字样式
     =========================================== */
.text-primary {
    color: var(--text-primary);
}

.text-secondary {
    color: var(--text-secondary);
}

.text-tertiary {
    color: var(--text-tertiary);
}

.text-disabled {
    color: var(--text-disabled);
}

.text-red {
    color: var(--primary-red);
}

.text-blue {
    color: var(--accent-blue);
}

.text-gold {
    color: var(--accent-gold);
}

.text-green {
    color: var(--accent-green);
}

/* 字体大小 */
.text-xs {
    font-size: 20rpx;
}

.text-sm {
    font-size: 24rpx;
}

.text-base {
    font-size: 28rpx;
}

.text-lg {
    font-size: 32rpx;
}

.text-xl {
    font-size: 36rpx;
}

.text-2xl {
    font-size: 40rpx;
}

.text-3xl {
    font-size: 48rpx;
}

/* 字体粗细 */
.font-light {
    font-weight: 300;
}

.font-normal {
    font-weight: 400;
}

.font-medium {
    font-weight: 500;
}

.font-bold {
    font-weight: 600;
}

.font-black {
    font-weight: 700;
}

/* 文字对齐 */
.text-left {
    text-align: left;
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

/* 文字省略 */
.text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.text-ellipsis-2 {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.text-ellipsis-3 {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
}

/* ===========================================
     间距样式
     =========================================== */
.m-0 {
    margin: 0;
}
.m-xs {
    margin: var(--spacing-xs);
}
.m-sm {
    margin: var(--spacing-sm);
}
.m-md {
    margin: var(--spacing-md);
}
.m-lg {
    margin: var(--spacing-lg);
}
.m-xl {
    margin: var(--spacing-xl);
}

/* Margin Top */
.mt-0 {
    margin-top: 0;
}
.mt-xs {
    margin-top: var(--spacing-xs);
}
.mt-sm {
    margin-top: var(--spacing-sm);
}
.mt-md {
    margin-top: var(--spacing-md);
}
.mt-lg {
    margin-top: var(--spacing-lg);
}
.mt-xl {
    margin-top: var(--spacing-xl);
}

/* Margin Bottom */
.mb-0 {
    margin-bottom: 0;
}
.mb-xs {
    margin-bottom: var(--spacing-xs);
}
.mb-sm {
    margin-bottom: var(--spacing-sm);
}
.mb-md {
    margin-bottom: var(--spacing-md);
}
.mb-lg {
    margin-bottom: var(--spacing-lg);
}
.mb-xl {
    margin-bottom: var(--spacing-xl);
}

/* Margin Left */
.ml-0 {
    margin-left: 0;
}
.ml-xs {
    margin-left: var(--spacing-xs);
}
.ml-sm {
    margin-left: var(--spacing-sm);
}
.ml-md {
    margin-left: var(--spacing-md);
}
.ml-lg {
    margin-left: var(--spacing-lg);
}
.ml-xl {
    margin-left: var(--spacing-xl);
}

/* Margin Right */
.mr-0 {
    margin-right: 0;
}
.mr-xs {
    margin-right: var(--spacing-xs);
}
.mr-sm {
    margin-right: var(--spacing-sm);
}
.mr-md {
    margin-right: var(--spacing-md);
}
.mr-lg {
    margin-right: var(--spacing-lg);
}
.mr-xl {
    margin-right: var(--spacing-xl);
}

/* Padding - 相同的模式 */
.p-0 {
    padding: 0;
}
.p-xs {
    padding: var(--spacing-xs);
}
.p-sm {
    padding: var(--spacing-sm);
}
.p-md {
    padding: var(--spacing-md);
}
.p-lg {
    padding: var(--spacing-lg);
}
.p-xl {
    padding: var(--spacing-xl);
}

/* Padding各方向 */
.pt-0 {
    padding-top: 0;
}
.pt-xs {
    padding-top: var(--spacing-xs);
}
.pt-sm {
    padding-top: var(--spacing-sm);
}
.pt-md {
    padding-top: var(--spacing-md);
}
.pt-lg {
    padding-top: var(--spacing-lg);
}
.pt-xl {
    padding-top: var(--spacing-xl);
}

.pb-0 {
    padding-bottom: 0;
}
.pb-xs {
    padding-bottom: var(--spacing-xs);
}
.pb-sm {
    padding-bottom: var(--spacing-sm);
}
.pb-md {
    padding-bottom: var(--spacing-md);
}
.pb-lg {
    padding-bottom: var(--spacing-lg);
}
.pb-xl {
    padding-bottom: var(--spacing-xl);
}

.pl-0 {
    padding-left: 0;
}
.pl-xs {
    padding-left: var(--spacing-xs);
}
.pl-sm {
    padding-left: var(--spacing-sm);
}
.pl-md {
    padding-left: var(--spacing-md);
}
.pl-lg {
    padding-left: var(--spacing-lg);
}
.pl-xl {
    padding-left: var(--spacing-xl);
}

.pr-0 {
    padding-right: 0;
}
.pr-xs {
    padding-right: var(--spacing-xs);
}
.pr-sm {
    padding-right: var(--spacing-sm);
}
.pr-md {
    padding-right: var(--spacing-md);
}
.pr-lg {
    padding-right: var(--spacing-lg);
}
.pr-xl {
    padding-right: var(--spacing-xl);
}

/* ===========================================
     卡片和容器样式
     =========================================== */
.card {
    background-color: var(--bg-card);
    border-radius: var(--radius-medium);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    border: 1rpx solid var(--border-secondary);
    box-shadow: 0 4rpx 12rpx var(--shadow-light);
}

.card-hover {
    transition: all 0.3s ease;
}

.card-hover:active {
    transform: translateY(2rpx);
    box-shadow: 0 2rpx 8rpx var(--shadow-medium);
}

.section {
    margin-bottom: var(--spacing-xl);
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    padding-left: var(--spacing-sm);
    border-left: 6rpx solid var(--primary-red);
}

.section-subtitle {
    font-size: 28rpx;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
}

/* ===========================================
     按钮样式
     =========================================== */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-medium);
    font-size: 28rpx;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    min-height: 80rpx;
    line-height: 1;
}

.btn-primary {
    background: var(--gradient-primary);
    color: var(--text-primary);
    box-shadow: 0 4rpx 12rpx var(--shadow-light);
}

.btn-primary:active {
    background: var(--primary-red-dark);
    transform: translateY(2rpx);
}

.btn-secondary {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1rpx solid var(--border-primary);
}

.btn-secondary:active {
    background-color: var(--bg-tertiary);
}

.btn-outline {
    background-color: transparent;
    color: var(--primary-red);
    border: 2rpx solid var(--primary-red);
}

.btn-outline:active {
    background-color: var(--primary-red);
    color: var(--text-primary);
}

.btn-ghost {
    background-color: transparent;
    color: var(--text-secondary);
}

.btn-ghost:active {
    background-color: var(--bg-secondary);
}

.btn-small {
    min-height: 64rpx;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 24rpx;
}

.btn-large {
    min-height: 96rpx;
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 32rpx;
}

.btn-block {
    width: 100%;
}

.btn-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ===========================================
     表单样式
     =========================================== */
.form-group {
    margin-bottom: var(--spacing-lg);
}

.form-label {
    display: block;
    margin-bottom: var(--spacing-sm);
    font-size: 28rpx;
    font-weight: 500;
    color: var(--text-primary);
}

.form-input {
    width: 100%;
    padding: var(--spacing-md);
    background-color: var(--bg-tertiary);
    border: 1rpx solid var(--border-secondary);
    border-radius: var(--radius-medium);
    font-size: 28rpx;
    color: var(--text-primary);
    transition: all 0.3s ease;
}

.form-input:focus {
    border-color: var(--primary-red);
    background-color: var(--bg-secondary);
}

/* ===========================================
     标签样式
     =========================================== */
.tag {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--bg-tertiary);
    border: 1rpx solid var(--border-secondary);
    border-radius: var(--radius-small);
    font-size: 24rpx;
    color: var(--text-secondary);
    margin-right: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
}

.tag.active {
    background-color: var(--primary-red);
    border-color: var(--primary-red);
    color: var(--text-primary);
}

.tag.hero-duelist {
    border-color: var(--primary-red);
    color: var(--primary-red);
}

.tag.hero-sentinel {
    border-color: var(--accent-blue);
    color: var(--accent-blue);
}

.tag.hero-controller {
    border-color: var(--accent-purple);
    color: var(--accent-purple);
}

.tag.hero-initiator {
    border-color: var(--accent-gold);
    color: var(--accent-gold);
}

/* ===========================================
     列表和网格样式
     =========================================== */
.list {
    background-color: var(--bg-card);
    border-radius: var(--radius-medium);
    overflow: hidden;
}

.list-item {
    padding: var(--spacing-md);
    border-bottom: 1rpx solid var(--border-secondary);
    transition: background-color 0.3s ease;
}

.list-item:last-child {
    border-bottom: none;
}

.list-item:active {
    background-color: var(--bg-tertiary);
}

.grid {
    display: grid;
    gap: var(--spacing-sm);
}

.grid-2 {
    grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
    grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
    grid-template-columns: repeat(4, 1fr);
}

/* ===========================================
     图片和媒体样式
     =========================================== */
.image {
    display: block;
    width: 100%;
    height: auto;
}

.image-round {
    border-radius: var(--radius-round);
}

.image-rounded {
    border-radius: var(--radius-medium);
}

.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: var(--radius-round);
    object-fit: cover;
}

.avatar-small {
    width: 60rpx;
    height: 60rpx;
}

.avatar-large {
    width: 120rpx;
    height: 120rpx;
}

/* ===========================================
     加载和状态样式
     =========================================== */
.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary);
}

.loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid var(--border-secondary);
    border-top: 4rpx solid var(--primary-red);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl) var(--spacing-lg);
    color: var(--text-tertiary);
}

.empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: var(--spacing-lg);
    opacity: 0.5;
}

.empty-text {
    font-size: 28rpx;
    margin-bottom: var(--spacing-sm);
}

.empty-action {
    margin-top: var(--spacing-md);
}

/* ===========================================
     动画
     =========================================== */
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
    }
    to {
        transform: translateY(0);
    }
}

/* ===========================================
     工具类
     =========================================== */
.hidden {
    display: none !important;
}

.invisible {
    visibility: hidden !important;
}

.clearfix::after {
    content: '';
    display: table;
    clear: both;
}

.no-scroll {
    overflow: hidden;
}

.scroll-x {
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
}

.scroll-y {
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

/* ===========================================
     英雄类型标签
     =========================================== */
.hero-type-tag {
    display: inline-block;
    padding: 4rpx 12rpx;
    border-radius: var(--radius-small);
    font-size: 20rpx;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1rpx;
}

.hero-type-duelist {
    background-color: rgba(255, 70, 84, 0.2);
    color: var(--primary-red);
    border: 1rpx solid var(--primary-red);
}

.hero-type-sentinel {
    background-color: rgba(0, 245, 255, 0.2);
    color: var(--accent-blue);
    border: 1rpx solid var(--accent-blue);
}

.hero-type-controller {
    background-color: rgba(189, 147, 249, 0.2);
    color: var(--accent-purple);
    border: 1rpx solid var(--accent-purple);
}

.hero-type-initiator {
    background-color: rgba(255, 215, 0, 0.2);
    color: var(--accent-gold);
    border: 1rpx solid var(--accent-gold);
}

/* ===========================================
     响应式设计
     =========================================== */
@media screen and (max-width: 750rpx) {
    .grid-4 {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media screen and (max-width: 600rpx) {
    .grid-3 {
        grid-template-columns: repeat(2, 1fr);
    }

    .grid-4 {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* ===========================================
     暗黑模式支持
     =========================================== */
@media (prefers-color-scheme: dark) {
    page {
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }
}
</style>
