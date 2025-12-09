<template>
    <!-- pages/profile/profile.wxml -->
    <view class="profile-page">
        <!-- 用户信息区域 -->
        <view class="user-section">
            <!-- 未登录状态 -->
            <view class="login-box" v-if="!isLogin">
                <image src="/static/assets/images/logo.png" class="app-logo" />
                <text class="login-title">欢迎使用Valorant助手</text>
                <text class="login-desc">登录后可以收藏内容、同步浏览记录</text>

                <button class="btn btn-primary btn-block" @tap="wxLogin" :loading="loading">
                    <image src="/static/assets/icons/wechat.png" class="btn-icon" />
                    <text>微信快速登录</text>
                </button>

                <button class="btn btn-ghost btn-block mt-sm" @tap="guestLogin" :loading="loading">游客模式浏览</button>
            </view>

            <!-- 已登录状态 -->
            <view class="user-info" v-else>
                <view class="user-header">
                    <image class="user-avatar" :src="userInfo.avatar || '/static/assets/images/default-avatar.png'" />
                    <view class="user-detail">
                        <view class="user-name">
                            {{ userInfo.nickname || userInfo.username }}
                            <view class="guest-tag" v-if="isGuest">游客</view>
                        </view>
                        <text class="user-id">ID: {{ userInfo.id }}</text>
                    </view>
                    <view class="edit-btn" @tap="editProfile" v-if="!isGuest">
                        <text>编辑</text>
                    </view>
                </view>

                <!-- 统计数据 -->
                <view class="statistics-grid">
                    <view class="stat-item" @tap="onMenuTap" :data-item="menuItems[0]">
                        <text class="stat-value">{{ statistics.favoriteCount }}</text>
                        <text class="stat-label">收藏</text>
                    </view>
                    <view class="stat-item" @tap="onMenuTap" :data-item="menuItems[1]">
                        <text class="stat-value">{{ statistics.historyCount }}</text>
                        <text class="stat-label">历史</text>
                    </view>
                    <view class="stat-item">
                        <text class="stat-value">{{ statistics.todayViews }}</text>
                        <text class="stat-label">今日</text>
                    </view>
                </view>

                <!-- 游客提示 -->
                <view class="guest-tip" v-if="isGuest">
                    <text>游客模式部分功能受限，建议您</text>
                    <text class="link" @tap="wxLogin">使用微信登录</text>
                </view>
            </view>
        </view>

        <!-- 收藏夹快速入口 -->
        <view class="folder-section" v-if="isLogin && !isGuest && favoriteFolders.length > 0">
            <view class="section-header">
                <text class="section-title">我的收藏夹</text>
                <text class="view-all" @tap="onMenuTap" :data-item="menuItems[0]">查看全部</text>
            </view>
            <scroll-view class="folder-list" scroll-x>
                <view class="folder-item" :data-folder="item.folderName" @tap="goToFavoriteFolder" v-for="(item, index) in favoriteFolders" :key="index">
                    <view class="folder-icon">
                        <image src="/static/assets/icons/folder.png" />
                    </view>

                    <text class="folder-name">{{ item.folderName }}</text>

                    <text class="folder-count">{{ item.count }}个</text>
                </view>
            </scroll-view>
        </view>

        <!-- 功能菜单 -->
        <view class="menu-section">
            <view class="menu-item" @tap="onMenuTap" :data-item="item" v-for="(item, index) in menuItems" :key="index">
                <view class="menu-left">
                    <image class="menu-icon" :src="item.icon" />
                    <view class="menu-info">
                        <text class="menu-title">{{ item.title }}</text>
                        <text class="menu-desc">{{ item.desc }}</text>
                    </view>
                </view>

                <view class="menu-arrow">›</view>
            </view>
        </view>

        <!-- 设置选项 -->
        <view class="settings-section" v-if="isLogin">
            <view class="section-title">设置</view>

            <view class="setting-item" v-if="!isGuest">
                <text class="setting-label">接收通知</text>
                <switch class="setting-switch" :checked="settings.enableNotification" @change="onSettingChange" data-key="enableNotification" />
            </view>

            <view class="setting-item">
                <text class="setting-label">自动播放视频</text>
                <switch class="setting-switch" :checked="settings.autoPlayVideo" @change="onSettingChange" data-key="autoPlayVideo" />
            </view>

            <view class="setting-item">
                <text class="setting-label">图片质量</text>
                <picker
                    class="setting-picker"
                    mode="selector"
                    :range="['高清', '标准', '省流量']"
                    :value="settings.imageQuality === 'high' ? 0 : settings.imageQuality === 'normal' ? 1 : 2"
                    @change="onImageQualityChange"
                >
                    <view class="picker-value">
                        {{ settings.imageQuality === 'high' ? '高清' : settings.imageQuality === 'normal' ? '标准' : '省流量' }}
                        <text class="picker-arrow">›</text>
                    </view>
                </picker>
            </view>
        </view>

        <!-- 退出登录 -->
        <view class="logout-section" v-if="isLogin">
            <button class="btn btn-outline btn-block" @tap="logout">
                {{ isGuest ? '退出游客模式' : '退出登录' }}
            </button>
        </view>

        <!-- 版本信息 -->
        <view class="version-info">
            <text>Valorant助手 v1.0.0</text>
            <text class="copyright">© 2025 All Rights Reserved</text>
        </view>
    </view>
</template>

<script>
// pages/profile/profile.js
const app = getApp();
const { authAPI, userAPI, favoriteAPI } = require('../../utils/api');
export default {
    data() {
        return {
            // 用户信息
            userInfo: null,
            isLogin: false,
            isGuest: true,
            // 统计数据
            statistics: {
                favoriteCount: 0,
                historyCount: 0,
                todayViews: 0
            },
            // 收藏夹
            favoriteFolders: [],
            // 功能菜单
            menuItems: [
                {
                    icon: '/static/assets/icons/favorite.png',
                    title: '我的收藏',
                    desc: '查看收藏的内容',
                    url: '/pages/favorite/list/list',
                    needLogin: true
                },
                {
                    icon: '/static/assets/icons/history.png',
                    title: '浏览历史',
                    desc: '查看最近浏览',
                    url: '/pages/history/list/list',
                    needLogin: true
                },
                {
                    icon: '/static/assets/icons/share.png',
                    title: '分享好友',
                    desc: '推荐给朋友',
                    action: 'share',
                    needLogin: false
                },
                {
                    icon: '/static/assets/icons/feedback.png',
                    title: '意见反馈',
                    desc: '帮助我们改进',
                    url: '/pages/feedback/index/index',
                    needLogin: false
                },
                {
                    icon: '/static/assets/icons/about.png',
                    title: '关于我们',
                    desc: '了解更多信息',
                    url: '/pages/about/index/index',
                    needLogin: false
                }
            ],
            // 设置项
            settings: {
                enableNotification: true,
                autoPlayVideo: false,
                imageQuality: 'high'
            },
            // 加载状态
            loading: false
        };
    },
    onLoad() {
        // 检查登录状态
        this.checkLoginStatus();
    },
    onShow() {
        // 如果已登录，刷新用户数据
        if (this.isLogin) {
            this.refreshUserData();
        }
    },
    // 分享
    onShareAppMessage() {
        return {
            title: 'Valorant助手 - 您的游戏攻略专家',
            path: '/pages/index/index',
            imageUrl: '/static/assets/images/share-cover.png'
        };
    },
    // 分享到朋友圈
    onShareTimeline() {
        return {
            title: 'Valorant助手 - 游戏攻略大全',
            query: 'source=timeline'
        };
    },
    methods: {
        // 检查登录状态
        async checkLoginStatus() {
            const userInfo = app.globalData.getUserInfo();
            const isLogin = app.globalData.checkLogin();
            const isGuest = app.globalData.checkGuest();
            this.setData({
                userInfo,
                isLogin,
                isGuest
            });

            // 如果已登录，加载用户数据
            if (isLogin && !isGuest) {
                await this.loadUserData();
            }
        },

        // 微信登录
        async wxLogin() {
            if (this.loading) {
                return;
            }
            this.setData({
                loading: true
            });
            try {
                // 1. 获取微信用户信息
                const wxUserInfo = await this.getWxUserInfo();
                if (!wxUserInfo) {
                    uni.showToast({
                        title: '需要授权才能登录',
                        icon: 'none'
                    });
                    return;
                }

                // 2. 获取微信登录凭证
                const loginRes = await uni.login();
                if (!loginRes.code) {
                    throw new Error('获取登录凭证失败');
                }

                // 3. 调用后端接口进行登录
                const res = await authAPI.wxLogin({
                    code: loginRes.code,
                    userInfo: wxUserInfo
                });
                if (res.success && res.data) {
                    // 4. 保存用户信息
                    app.globalData.setUserData(res.data);

                    // 5. 更新页面状态
                    this.setData({
                        userInfo: res.data,
                        isLogin: true,
                        isGuest: false
                    });

                    // 6. 加载用户数据
                    await this.loadUserData();
                    uni.showToast({
                        title: '登录成功',
                        icon: 'success'
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('登录失败:', error);
                uni.showToast({
                    title: error.message || '登录失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 获取微信用户信息
        getWxUserInfo() {
            return new Promise((resolve) => {
                // 先尝试获取用户信息
                uni.getUserProfile({
                    desc: '用于完善用户资料',
                    success: (res) => {
                        resolve(res.userInfo);
                    },
                    fail: () => {
                        // 如果失败，尝试获取基础信息
                        uni.getUserInfo({
                            success: (res) => {
                                resolve(res.userInfo);
                            },
                            fail: () => {
                                resolve(null);
                            }
                        });
                    }
                });
            });
        },

        // 游客模式
        async guestLogin() {
            if (this.loading) {
                return;
            }
            this.setData({
                loading: true
            });
            try {
                const res = await authAPI.guestLogin();
                if (res.success && res.data) {
                    // 保存游客信息
                    app.globalData.setUserData({
                        ...res.data,
                        isGuest: true
                    });

                    // 更新页面状态
                    this.setData({
                        userInfo: res.data,
                        isLogin: true,
                        isGuest: true
                    });
                    uni.showToast({
                        title: '已进入游客模式',
                        icon: 'success'
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('游客登录失败:', error);
                uni.showToast({
                    title: '进入游客模式失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 加载用户数据
        async loadUserData() {
            try {
                // 并行加载多个数据
                const promises = [this.loadStatistics(), this.loadFavoriteFolders()];
                await Promise.all(promises);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载用户数据失败:', error);
            }
        },

        // 加载统计数据
        async loadStatistics() {
            try {
                const res = await userAPI.getStatistics();
                if (res.success && res.data) {
                    this.setData({
                        statistics: res.data
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载统计数据失败:', error);
            }
        },

        // 加载收藏夹
        async loadFavoriteFolders() {
            try {
                const res = await favoriteAPI.getFolderList();
                if (res.success && res.data) {
                    this.setData({
                        favoriteFolders: res.data
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载收藏夹失败:', error);
            }
        },

        // 刷新用户数据
        async refreshUserData() {
            // 获取最新的用户信息
            try {
                const res = await userAPI.getUserProfile();
                if (res.success && res.data) {
                    app.globalData.setUserData(res.data);
                    this.setData({
                        userInfo: res.data
                    });
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('刷新用户信息失败:', error);
            }

            // 重新加载其他数据
            await this.loadUserData();
        },

        // 菜单点击
        onMenuTap(e) {
            const item = e.currentTarget.dataset.item;

            // 检查是否需要登录
            if (item.needLogin && !this.isLogin) {
                uni.showModal({
                    title: '提示',
                    content: '请先登录后使用此功能',
                    confirmText: '去登录',
                    success: (res) => {
                        if (res.confirm) {
                            // 滚动到顶部显示登录按钮
                            uni.pageScrollTo({
                                scrollTop: 0,
                                duration: 300
                            });
                        }
                    }
                });
                return;
            }

            // 游客限制
            if (item.needLogin && this.isGuest) {
                uni.showModal({
                    title: '提示',
                    content: '游客模式下无法使用此功能，请使用微信登录',
                    confirmText: '微信登录',
                    success: (res) => {
                        if (res.confirm) {
                            this.wxLogin();
                        }
                    }
                });
                return;
            }

            // 执行对应操作
            if (item.action === 'share') {
                // 触发分享
                uni.showShareMenu({
                    withShareTicket: true,
                    menus: ['shareAppMessage', 'shareTimeline']
                });
            } else if (item.url) {
                // 跳转页面
                uni.navigateTo({
                    url: item.url
                });
            }
        },

        // 设置开关切换
        onSettingChange(e) {
            const { key } = e.currentTarget.dataset;
            const value = e.detail.value;
            this.setData({
                [`settings.${key}`]: value
            });

            // 保存到本地
            uni.setStorageSync(`setting_${key}`, value);

            // 根据不同设置执行操作
            switch (key) {
                case 'enableNotification':
                    if (value) {
                        // 请求通知权限
                        uni.requestSubscribeMessage({
                            tmplIds: ['your-template-id'],
                            success: (res) => {
                                console.log('订阅成功', res);
                            }
                        });
                    }
                    break;
                case 'autoPlayVideo':
                    // 更新全局设置
                    app.globalData.settings.autoPlayVideo = value;
                    break;
            }
        },

        // 退出登录
        logout() {
            uni.showModal({
                title: '提示',
                content: '确定要退出登录吗？',
                success: (res) => {
                    if (res.confirm) {
                        // 清除用户数据
                        app.globalData.clearUserData();

                        // 重置页面状态
                        this.setData({
                            userInfo: null,
                            isLogin: false,
                            isGuest: true,
                            statistics: {
                                favoriteCount: 0,
                                historyCount: 0,
                                todayViews: 0
                            },
                            favoriteFolders: []
                        });
                        uni.showToast({
                            title: '已退出登录',
                            icon: 'success'
                        });
                    }
                }
            });
        },

        // 编辑资料
        editProfile() {
            uni.navigateTo({
                url: '/pages/profile/edit/edit'
            });
        },

        goToFavoriteFolder() {
            console.log('占位：函数 goToFavoriteFolder 未声明');
        },

        onImageQualityChange() {
            console.log('占位：函数 onImageQualityChange 未声明');
        }
    }
};
</script>
<style>
/* pages/profile/profile.wxss */

.profile-page {
    min-height: 100vh;
    background-color: var(--bg-primary);
    padding-bottom: 40rpx;
}

/* ===========================================
   用户信息区域
   =========================================== */
.user-section {
    background: linear-gradient(135deg, #1e2328 0%, #2a2e34 100%);
    padding: 40rpx 30rpx;
    position: relative;
    overflow: hidden;
}

.user-section::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, rgba(255, 70, 84, 0.1) 0%, transparent 70%);
    border-radius: 50%;
}

/* 未登录状态 */
.login-box {
    text-align: center;
    padding: 60rpx 0;
    position: relative;
    z-index: 1;
}

.app-logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 40rpx;
}

.login-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16rpx;
}

.login-desc {
    display: block;
    font-size: 28rpx;
    color: var(--text-secondary);
    margin-bottom: 60rpx;
}

.btn-icon {
    width: 40rpx;
    height: 40rpx;
    margin-right: 12rpx;
}

/* 已登录状态 */
.user-info {
    position: relative;
    z-index: 1;
}

.user-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
}

.user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid var(--primary-red);
    margin-right: 30rpx;
}

.user-detail {
    flex: 1;
}

.user-name {
    display: flex;
    align-items: center;
    font-size: 36rpx;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8rpx;
}

.guest-tag {
    display: inline-block;
    margin-left: 16rpx;
    padding: 4rpx 16rpx;
    background-color: var(--accent-gold);
    color: #000;
    font-size: 22rpx;
    font-weight: 500;
    border-radius: 20rpx;
}

.user-id {
    font-size: 26rpx;
    color: var(--text-tertiary);
}

.edit-btn {
    padding: 12rpx 24rpx;
    background-color: var(--bg-tertiary);
    border-radius: 30rpx;
    font-size: 26rpx;
    color: var(--text-secondary);
    transition: all 0.3s;
}

.edit-btn:active {
    background-color: var(--primary-red);
    color: #fff;
}

/* 统计数据 */
.statistics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
    margin-top: 40rpx;
}

.stat-item {
    text-align: center;
    padding: 20rpx;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-medium);
    transition: all 0.3s;
}

.stat-item:active {
    background-color: rgba(255, 70, 84, 0.2);
}

.stat-value {
    display: block;
    font-size: 40rpx;
    font-weight: 600;
    color: var(--primary-red);
    margin-bottom: 8rpx;
}

.stat-label {
    display: block;
    font-size: 24rpx;
    color: var(--text-secondary);
}

/* 游客提示 */
.guest-tip {
    margin-top: 30rpx;
    padding: 20rpx;
    background-color: rgba(255, 215, 0, 0.1);
    border-radius: var(--radius-medium);
    text-align: center;
    font-size: 26rpx;
    color: var(--text-secondary);
}

.guest-tip .link {
    color: var(--primary-red);
    text-decoration: underline;
    margin-left: 8rpx;
}

/* ===========================================
   收藏夹快速入口
   =========================================== */
.folder-section {
    padding: 30rpx 0;
    background-color: var(--bg-secondary);
    margin-bottom: 20rpx;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 30rpx 20rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--text-primary);
}

.view-all {
    font-size: 26rpx;
    color: var(--primary-red);
}

.folder-list {
    padding: 0 30rpx;
    white-space: nowrap;
}

.folder-item {
    display: inline-block;
    width: 200rpx;
    padding: 20rpx;
    margin-right: 20rpx;
    background-color: var(--bg-card);
    border-radius: var(--radius-medium);
    border: 1rpx solid var(--border-secondary);
    text-align: center;
    transition: all 0.3s;
}

.folder-item:active {
    border-color: var(--primary-red);
    transform: scale(0.95);
}

.folder-icon {
    width: 80rpx;
    height: 80rpx;
    margin: 0 auto 16rpx;
}

.folder-icon image {
    width: 100%;
    height: 100%;
}

.folder-name {
    display: block;
    font-size: 28rpx;
    color: var(--text-primary);
    margin-bottom: 8rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.folder-count {
    display: block;
    font-size: 24rpx;
    color: var(--text-tertiary);
}

/* ===========================================
   功能菜单
   =========================================== */
.menu-section {
    background-color: var(--bg-secondary);
    margin-bottom: 20rpx;
    padding: 10rpx 0;
}

.menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    transition: background-color 0.3s;
}

.menu-item:active {
    background-color: var(--bg-tertiary);
}

.menu-item:not(:last-child) {
    border-bottom: 1rpx solid var(--border-secondary);
}

.menu-left {
    display: flex;
    align-items: center;
    flex: 1;
}

.menu-icon {
    width: 48rpx;
    height: 48rpx;
    margin-right: 24rpx;
}

.menu-info {
    flex: 1;
}

.menu-title {
    display: block;
    font-size: 30rpx;
    color: var(--text-primary);
    margin-bottom: 8rpx;
}

.menu-desc {
    display: block;
    font-size: 24rpx;
    color: var(--text-tertiary);
}

.menu-arrow {
    font-size: 36rpx;
    color: var(--text-tertiary);
}

/* ===========================================
   设置选项
   =========================================== */
.settings-section {
    background-color: var(--bg-secondary);
    padding: 30rpx;
    margin-bottom: 20rpx;
}

.settings-section .section-title {
    margin-bottom: 30rpx;
    padding-left: 0;
    border-left: none;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 0;
}

.setting-item:not(:last-child) {
    border-bottom: 1rpx solid var(--border-secondary);
}

.setting-label {
    font-size: 30rpx;
    color: var(--text-primary);
}

.setting-switch {
    transform: scale(0.8);
}

.setting-picker {
    flex: 1;
    text-align: right;
}

.picker-value {
    font-size: 28rpx;
    color: var(--text-secondary);
}

.picker-arrow {
    margin-left: 8rpx;
    color: var(--text-tertiary);
}

/* ===========================================
   退出登录
   =========================================== */
.logout-section {
    padding: 0 30rpx;
    margin: 40rpx 0;
}

/* ===========================================
   版本信息
   =========================================== */
.version-info {
    text-align: center;
    padding: 40rpx;
    color: var(--text-tertiary);
    font-size: 24rpx;
}

.version-info .copyright {
    display: block;
    margin-top: 8rpx;
}
</style>
