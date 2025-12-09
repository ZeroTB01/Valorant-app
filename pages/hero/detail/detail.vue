<template>
    <!-- pages/hero/detail/detail.wxml -->
    <view class="hero-detail-page">
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载英雄信息...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="retryLoad">重新加载</button>
        </view>

        <!-- 主要内容 -->
        <view class="main-content" v-if="!loading && !error && heroInfo">
            <!-- 英雄基本信息区域 -->
            <view class="hero-info-section">
                <!-- 左侧：英雄大图 -->
                <view class="hero-avatar-container">
                    <image class="hero-avatar" :src="heroInfo.avatar" mode="aspectFit" lazy-load />
                    <view class="avatar-overlay">
                        <view :class="'hero-type-badge ' + heroInfo.typeClass">
                            {{ heroInfo.typeLabel }}
                        </view>
                    </view>
                </view>

                <!-- 右侧：英雄信息 -->
                <view class="hero-details">
                    <view class="hero-header">
                        <text class="hero-name">{{ heroInfo.heroName }}</text>
                        <text class="hero-key">{{ heroInfo.heroKey }}</text>
                    </view>

                    <view class="hero-description">
                        <text>{{ heroInfo.description }}</text>
                    </view>

                    <view class="hero-stats">
                        <view class="stat-item">
                            <text class="stat-label">难度等级</text>
                            <view class="difficulty-stars">
                                <text :class="'star ' + (item.filled ? 'filled' : '')" v-for="(item, index) in heroInfo.difficultyStars" :key="index">★</text>
                            </view>
                        </view>
                    </view>

                    <!-- 操作按钮 -->
                    <view class="action-buttons">
                        <button class="action-btn primary" @tap="addToFavorites">
                            <text class="btn-icon">❤️</text>
                            <text>收藏</text>
                        </button>
                        <button class="action-btn secondary" open-type="share">
                            <text class="btn-icon">📤</text>
                            <text>分享</text>
                        </button>
                    </view>
                </view>
            </view>

            <!-- 技能展示区域 -->
            <view class="skills-section">
                <view class="section-title">
                    <text>技能介绍</text>
                </view>

                <!-- 技能选择器 -->
                <view class="skills-selector">
                    <view
                        :class="'skill-tab ' + (currentSkill && currentSkill.id === item.id ? 'active' : '')"
                        @tap="switchSkill"
                        :data-index="index"
                        v-for="(item, index) in skills"
                        :key="index"
                    >
                        <view :class="'skill-icon ' + item.iconClass">
                            <text class="skill-hotkey">{{ item.hotkey }}</text>
                        </view>

                        <text class="skill-name">{{ item.skillName }}</text>
                    </view>
                </view>

                <!-- 当前技能详情 -->
                <view class="current-skill-detail" v-if="currentSkill">
                    <view class="skill-header">
                        <text class="skill-title">{{ currentSkill.skillName }}</text>
                        <view class="skill-meta">
                            <text class="skill-cooldown" v-if="currentSkill.cooldown">冷却: {{ currentSkill.cooldown }}</text>
                            <text class="skill-cost" v-if="currentSkill.cost">费用: {{ currentSkill.cost }}</text>
                        </view>
                    </view>

                    <view class="skill-description">
                        <text>{{ currentSkill.description }}</text>
                    </view>
                </view>

                <!-- 视频演示区域 -->
                <view class="video-section">
                    <view class="video-header">
                        <text class="video-title">技能演示</text>
                        <text class="video-subtitle" v-if="currentSkill">{{ currentSkill.skillName }}</text>
                    </view>

                    <view class="video-container">
                        <!-- 视频加载状态 -->
                        <view class="video-loading" v-if="loadingVideo">
                            <view class="loading-spinner small"></view>
                            <text>加载视频中...</text>
                        </view>

                        <!-- 视频播放器 -->
                        <video
                            v-if="!loadingVideo && currentSkill && currentSkill.videoUrl"
                            id="heroVideo"
                            class="skill-video"
                            :src="currentSkill.videoUrl"
                            :poster="currentSkill.videoPoster || currentSkill.skillIcon"
                            @loadeddata="onVideoLoad"
                            @error="onVideoError"
                            controls
                            show-fullscreen-btn
                            show-play-btn
                            show-center-play-btn
                        ></video>

                        <view class="video-placeholder" v-else-if="!loadingVideo && currentSkill && !currentSkill.videoUrl">
                            <text class="placeholder-icon">🎞️</text>
                            <text class="placeholder-text">暂未提供技能演示视频</text>
                        </view>

                        <!-- 视频占位符 -->
                        <view class="video-placeholder" v-if="!loadingVideo && !currentSkill">
                            <text class="placeholder-icon">🎬</text>
                            <text class="placeholder-text">选择技能查看演示视频</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 返回顶部按钮 -->
        <view class="back-to-top" @tap="goBack">
            <text class="back-icon">←</text>
        </view>
    </view>
</template>

<script>
// pages/hero/detail/detail.js
const app = getApp();
const { heroAPI } = require('../../../utils/api');
const { handleHeroAvatar, handleSkillList, handleImageUrl, getDefaultImage } = require('../../../utils/image');
export default {
    data() {
        return {
            heroId: null,
            heroInfo: null,
            skills: [],
            currentSkill: null,
            loading: true,
            loadingVideo: false,
            // 系统信息
            systemInfo: {},
            // 视频播放状态
            videoContext: null,
            // 错误状态
            error: false,
            errorMessage: ''
        };
    },
    onLoad(options) {
        // 获取系统信息
        this.setData({
            systemInfo: app.globalData.getSystemInfo()
        });

        // 获取英雄ID
        const heroId = options.id;
        if (!heroId) {
            this.showError('英雄ID参数缺失');
            return;
        }
        this.setData({
            heroId
        });

        // 加载英雄详情
        this.loadHeroDetail();
    },
    onReady() {
        // 创建视频上下文
        this.videoContext = uni.createVideoContext('heroVideo');
    },
    // 页面分享
    onShareAppMessage() {
        return this.shareHero();
    },
    // 分享到朋友圈
    onShareTimeline() {
        const { heroInfo } = this;
        return {
            title: `${heroInfo.heroName} - Valorant英雄详情`,
            query: `id=${heroInfo.id}&source=timeline`
        };
    },
    methods: {
        // 加载英雄详情
        async loadHeroDetail() {
            this.setData({
                loading: true,
                error: false
            });
            try {
                // 调用API获取英雄详情
                const res = await heroAPI.getHeroDetail(this.heroId);
                console.log('英雄详情API返回:', res);
                if (res.success && res.data) {
                    const { hero, skills } = res.data;

                    // 处理英雄信息（使用图片处理工具）
                    const processedHero = handleHeroAvatar(hero);
                    const heroInfo = {
                        ...processedHero,
                        typeLabel: this.getHeroTypeLabel(hero.heroType),
                        typeClass: `hero-type-${hero.heroType}`,
                        difficultyStars: this.generateStars(hero.difficulty || 3)
                    };

                    // 处理技能信息（使用图片处理工具）
                    const processedSkills = handleSkillList(skills).map((skill) => ({
                        ...skill,
                        iconClass: this.getSkillIcon(skill.skillKey),
                        hotkey: this.getSkillHotkey(skill.skillKey),
                        // 确保技能图标和视频地址正确处理
                        skillIcon: handleImageUrl(skill.icon || skill.skillIcon, getDefaultImage('skill')),
                        videoUrl: skill.videoUrl ? handleImageUrl(skill.videoUrl) : null,
                        videoPoster: skill.videoPoster ? handleImageUrl(skill.videoPoster) : null
                    }));
                    this.setData({
                        heroInfo,
                        skills: processedSkills,
                        currentSkill: processedSkills[0] || null // 默认选中第一个技能
                    });

                    // 更新页面标题
                    uni.setNavigationBarTitle({
                        title: heroInfo.heroName || '英雄详情'
                    });

                    // 添加到最近查看
                    this.addToRecentViews(heroInfo);
                } else {
                    this.showError(res.message || '获取英雄详情失败');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载英雄详情失败:', error);
                this.showError('网络请求失败，请稍后重试');
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 切换技能
        switchSkill(e) {
            const skillIndex = e.currentTarget.dataset.index;
            const skill = this.skills[skillIndex];
            if (!skill || skill.id === this.currentSkill?.id) {
                return;
            }
            this.setData({
                currentSkill: skill,
                loadingVideo: true
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });

            // 模拟视频加载延迟
            setTimeout(() => {
                this.setData({
                    loadingVideo: false
                });
            }, 800);
        },

        // 视频加载完成
        onVideoLoad() {
            this.setData({
                loadingVideo: false
            });
        },

        // 视频加载错误
        onVideoError(e) {
            console.error('视频加载失败:', e);
            uni.showToast({
                title: '视频加载失败',
                icon: 'none'
            });
            this.setData({
                loadingVideo: false
            });
        },

        // 播放视频
        playVideo() {
            if (this.videoContext) {
                this.videoContext.play();
            }
        },

        // 暂停视频
        pauseVideo() {
            if (this.videoContext) {
                this.videoContext.pause();
            }
        },

        // 添加到收藏
        addToFavorites() {
            // TODO: 实现收藏功能
            uni.showToast({
                title: '收藏成功',
                icon: 'success'
            });
        },

        // 分享功能
        shareHero() {
            const { heroInfo } = this;
            return {
                title: `${heroInfo.heroName} - ${heroInfo.typeLabel}`,
                path: `/pages/hero/detail/detail?id=${heroInfo.id}`,
                imageUrl: heroInfo.avatar
            };
        },

        // 添加到最近查看
        addToRecentViews(heroInfo) {
            try {
                let recentViews = uni.getStorageSync('recentViews') || [];
                const newView = {
                    type: 'hero',
                    id: heroInfo.id,
                    name: heroInfo.heroName,
                    image: heroInfo.avatar,
                    time: Date.now()
                };

                // 移除已存在的相同记录
                recentViews = recentViews.filter((item) => !(item.type === 'hero' && item.id === heroInfo.id));

                // 添加到开头
                recentViews.unshift(newView);

                // 最多保存20条
                recentViews = recentViews.slice(0, 20);

                // 保存到本地
                uni.setStorageSync('recentViews', recentViews);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('保存最近查看失败:', error);
            }
        },

        // 显示错误信息
        showError(message) {
            this.setData({
                error: true,
                errorMessage: message,
                loading: false
            });
        },

        // 重新加载
        retryLoad() {
            this.loadHeroDetail();
        },

        // 返回上一页
        goBack() {
            uni.navigateBack();
        },

        // 工具方法：获取英雄类型标签
        getHeroTypeLabel(type) {
            const typeMap = {
                duelist: '决斗者',
                sentinel: '哨卫',
                controller: '控场者',
                initiator: '先锋'
            };
            return typeMap[type] || type;
        },

        // 工具方法：生成难度星级
        generateStars(difficulty) {
            const stars = [];
            for (let i = 1; i <= 5; i++) {
                stars.push({
                    filled: i <= difficulty,
                    index: i
                });
            }
            return stars;
        },

        // 工具方法：获取技能图标样式
        getSkillIcon(skillKey) {
            const iconMap = {
                c_skill: 'skill-c',
                q_skill: 'skill-q',
                e_skill: 'skill-e',
                x_ultimate: 'skill-x'
            };
            return iconMap[skillKey] || 'skill-default';
        },

        // 工具方法：获取技能快捷键
        getSkillHotkey(skillKey) {
            const hotkeyMap = {
                c_skill: 'C',
                q_skill: 'Q',
                e_skill: 'E',
                x_ultimate: 'X'
            };
            return hotkeyMap[skillKey] || '?';
        }
    }
};
</script>
<style>
/* pages/hero/detail/detail.wxss */

.hero-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1419 0%, #1e2328 100%);
    color: #ececec;
    position: relative;
}

/* 加载状态 */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 32rpx;
}

.loading-spinner {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid #3c4043;
    border-top: 6rpx solid #ff4654;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-spinner.small {
    width: 60rpx;
    height: 60rpx;
    border-width: 4rpx;
}

.loading-text {
    font-size: 28rpx;
    color: #999;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

/* 错误状态 */
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 32rpx;
    padding: 0 60rpx;
}

.error-icon {
    font-size: 120rpx;
}

.error-message {
    font-size: 32rpx;
    color: #999;
    text-align: center;
    line-height: 1.5;
}

.retry-btn {
    background: #ff4654;
    color: white;
    border: none;
    border-radius: 12rpx;
    padding: 24rpx 48rpx;
    font-size: 28rpx;
}

/* 主要内容 */
.main-content {
    padding: 32rpx;
    padding-bottom: 120rpx;
}

/* 英雄信息区域 */
.hero-info-section {
    display: flex;
    gap: 32rpx;
    margin-bottom: 48rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 24rpx;
    padding: 32rpx;
    backdrop-filter: blur(10px);
}

.hero-avatar-container {
    flex: 0 0 280rpx;
    position: relative;
}

.hero-avatar {
    width: 100%;
    height: 360rpx;
    border-radius: 16rpx;
    background: linear-gradient(45deg, #2a2d31, #3c4043);
}

.avatar-overlay {
    position: absolute;
    bottom: 16rpx;
    left: 16rpx;
    right: 16rpx;
}

.hero-type-badge {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    text-align: center;
    backdrop-filter: blur(8px);
}

.hero-type-duelist {
    border: 2rpx solid #ff6b6b;
}
.hero-type-sentinel {
    border: 2rpx solid #4ecdc4;
}
.hero-type-controller {
    border: 2rpx solid #45b7d1;
}
.hero-type-initiator {
    border: 2rpx solid #ffa07a;
}

.hero-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.hero-header {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.hero-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #ff4654;
    line-height: 1.2;
}

.hero-key {
    font-size: 24rpx;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 2rpx;
}

.hero-description {
    color: #cccccc;
    font-size: 28rpx;
    line-height: 1.6;
}

.hero-stats {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.stat-label {
    font-size: 26rpx;
    color: #999;
    min-width: 120rpx;
}

.difficulty-stars {
    display: flex;
    gap: 4rpx;
}

.star {
    font-size: 28rpx;
    color: #3c4043;
    transition: color 0.3s ease;
}

.star.filled {
    color: #ffd700;
}

.action-buttons {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
    width: 150px;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    font-size: 26rpx;
    border: none;
    flex: 1;
    justify-content: center;
}

.action-btn.primary {
    background: #ff4654;
    color: white;
}

.action-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #ececec;
    border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.btn-icon {
    font-size: 28rpx;
}

/* 技能区域 */
.skills-section {
    display: flex;
    flex-direction: column;
    gap: 32rpx;
}

.section-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #ececec;
    margin-bottom: 8rpx;
}

/* 技能选择器 */
.skills-selector {
    display: flex;
    gap: 16rpx;
    padding: 16rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    overflow-x: auto;
}

.skill-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx;
    border-radius: 12rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    min-width: 120rpx;
    cursor: pointer;
}

.skill-tab.active {
    background: rgba(255, 70, 84, 0.2);
    border-color: #ff4654;
    transform: translateY(-4rpx);
}

.skill-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(45deg, #2a2d31, #3c4043);
    position: relative;
}

.skill-c {
    background: linear-gradient(45deg, #4a90e2, #357abd);
}
.skill-q {
    background: linear-gradient(45deg, #7ed321, #5ba700);
}
.skill-e {
    background: linear-gradient(45deg, #f5a623, #d68400);
}
.skill-x {
    background: linear-gradient(45deg, #d0021b, #9f0000);
}

.skill-hotkey {
    color: white;
    font-size: 28rpx;
    font-weight: bold;
}

.skill-name {
    font-size: 22rpx;
    color: #cccccc;
    text-align: center;
    line-height: 1.3;
}

/* 当前技能详情 */
.current-skill-detail {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    padding: 32rpx;
    border-left: 6rpx solid #ff4654;
}

.skill-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;
    flex-wrap: wrap;
    gap: 16rpx;
}

.skill-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ff4654;
}

.skill-meta {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;
}

.skill-cooldown,
.skill-cost {
    background: rgba(255, 255, 255, 0.1);
    padding: 6rpx 12rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    color: #cccccc;
}

.skill-description {
    color: #cccccc;
    font-size: 28rpx;
    line-height: 1.6;
}

/* 视频区域 */
.video-section {
    margin-top: 24rpx;
}

.video-header {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    margin-bottom: 20rpx;
}

.video-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ececec;
}

.video-subtitle {
    font-size: 24rpx;
    color: #999;
}

.video-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    overflow: hidden;
    position: relative;
    min-height: 360rpx;
}

.video-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 360rpx;
    gap: 16rpx;
    color: #999;
    font-size: 26rpx;
}

.skill-video {
    width: 100%;
    height: 360rpx;
    background: #000;
}

.video-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 360rpx;
    gap: 16rpx;
    color: #666;
}

.placeholder-icon {
    font-size: 80rpx;
}

.placeholder-text {
    font-size: 28rpx;
}

/* 返回按钮 */
.back-to-top {
    position: fixed;
    top: 120rpx;
    left: 32rpx;
    width: 80rpx;
    height: 80rpx;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    z-index: 100;
    transition: all 0.3s ease;
}

.back-to-top:active {
    transform: scale(0.95);
    background: rgba(0, 0, 0, 0.8);
}

.back-icon {
    color: white;
    font-size: 32rpx;
    font-weight: bold;
}

/* 响应式适配 */
@media (max-width: 768rpx) {
    .hero-info-section {
        flex-direction: column;
        gap: 24rpx;
    }

    .hero-avatar-container {
        flex: none;
        align-self: center;
    }

    .hero-avatar {
        width: 240rpx;
        height: 300rpx;
    }

    .action-buttons {
        flex-direction: column;
    }

    .skills-selector {
        justify-content: space-between;
    }

    .skill-tab {
        min-width: 100rpx;
    }

    .skill-header {
        flex-direction: column;
        align-items: flex-start;
    }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
    .hero-detail-page {
        background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
    }

    .hero-info-section,
    .current-skill-detail,
    .video-container {
        background: rgba(255, 255, 255, 0.03);
    }

    .skills-selector {
        background: rgba(255, 255, 255, 0.03);
    }
}

/* 动画效果 */
.hero-avatar {
    transition: transform 0.3s ease;
}

.hero-avatar:active {
    transform: scale(1.05);
}

.skill-tab {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-tab:active {
    transform: translateY(-2rpx) scale(0.98);
}

.current-skill-detail {
    animation: slideInUp 0.4s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.video-container {
    transition: all 0.3s ease;
}

.skill-video {
    transition: opacity 0.3s ease;
}

/* 骨架屏动画 */
@keyframes skeleton-loading {
    0% {
        background-position: -200rpx 0;
    }
    100% {
        background-position: calc(200rpx + 100%) 0;
    }
}

.skeleton-item {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400rpx 100%;
    animation: skeleton-loading 1.4s ease-in-out infinite;
}
</style>
