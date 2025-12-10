<template>
    <view class="video-detail-page">
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载视频...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error && !loading">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="loadContent">重新加载</button>
        </view>

        <!-- 主要内容 -->
        <view class="main-content" v-if="!loading && !error && content">
            <!-- 视频播放器 -->
            <view class="video-container">
                <video
                    id="contentVideo"
                    class="video-player"
                    :src="content.videoUrl"
                    :poster="content.videoPoster || content.coverImage"
                    @play="onVideoPlay"
                    @pause="onVideoPause"
                    @ended="onVideoEnded"
                    @timeupdate="onTimeUpdate"
                    controls
                    show-fullscreen-btn
                    show-play-btn
                    show-center-play-btn
                    enable-progress-gesture
                ></video>

                <!-- 视频加载状态 -->
                <view class="video-loading" v-if="videoLoading">
                    <view class="loading-spinner small"></view>
                </view>
            </view>

            <!-- 视频控制栏 -->
            <view class="video-controls">
                <view class="control-row">
                    <text class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
                </view>
            </view>

            <!-- 视频基本信息 -->
            <view class="content-header">
                <text class="content-title">{{ content.title }}</text>

                <!-- 标签 -->
                <view class="content-badges">
                    <view class="badge" v-if="content.isFeatured">
                        <text>⭐ 精选</text>
                    </view>
                    <view class="badge official" v-if="content.isOfficial">
                        <text>✓ 官方</text>
                    </view>
                </view>
            </view>

            <!-- 视频基本信息 -->
            <view class="video-info">
                <view class="info-row">
                    <text class="info-label">时长</text>
                    <text class="info-value">{{ formatDuration(content.videoDuration) }}</text>
                </view>
                <view class="info-row" v-if="content.heroName">
                    <text class="info-label">英雄</text>
                    <text class="info-value">{{ content.heroName }}</text>
                </view>
                <view class="info-row" v-if="content.mapName">
                    <text class="info-label">地图</text>
                    <text class="info-value">{{ content.mapName }}</text>
                </view>
            </view>

            <!-- 视频描述 -->
            <view class="content-description-section" v-if="content.description">
                <text class="section-title">视频描述</text>
                <text class="description-text">{{ content.description }}</text>
            </view>

            <!-- 标签 -->
            <view class="content-tags-section" v-if="content.tags && content.tags.length > 0">
                <text class="section-title">标签</text>
                <view class="tags-container">
                    <view 
                        v-for="(tag, index) in content.tags"
                        :key="index"
                        class="tag-item"
                    >
                        {{ tag }}
                    </view>
                </view>
            </view>

            <!-- 相关信息 -->
            <view class="content-meta-section">
                <text class="section-title">详情</text>
                <view class="meta-row" v-if="content.contentType">
                    <text class="meta-label">内容类型</text>
                    <text class="meta-value">
                        {{ content.contentType === 'video' ? '视频' : content.contentType === 'article' ? '图文' : '混合' }}
                    </text>
                </view>
                <view class="meta-row" v-if="content.createTime">
                    <text class="meta-label">发布时间</text>
                    <text class="meta-value">{{ formatDate(content.createTime) }}</text>
                </view>
            </view>

            <!-- 分享按钮 -->
            <view class="action-buttons">
                <button class="action-btn primary" open-type="share">
                    <text class="btn-icon">📤</text>
                    <text>分享</text>
                </button>
                <button class="action-btn secondary" @tap="addToFavorites">
                    <text class="btn-icon">❤️</text>
                    <text>收藏</text>
                </button>
            </view>

            <!-- 返回按钮 -->
            <view class="back-button" @tap="goBack">
                <text>← 返回</text>
            </view>
        </view>
    </view>
</template>

<script>
const { contentAPI, getFullAssetUrl } = require('@/utils/api')

export default {
    data() {
        return {
            contentId: null,
            content: null,
            loading: false,
            error: false,
            errorMessage: '',
            videoLoading: false,
            currentTime: 0,
            duration: 0,
            videoContext: null
        }
    },

    onLoad(options) {
        this.contentId = options.contentId
        if (this.contentId) {
            this.loadContent()
        }
    },

    onReady() {
        this.videoContext = uni.createVideoContext('contentVideo')
    },

    // 分享功能
    onShareAppMessage() {
        return {
            title: this.content?.title || '精彩视频教程',
            path: `/pages/content/video-detail/video-detail?contentId=${this.contentId}`,
            imageUrl: this.content?.coverImage
        }
    },

    methods: {
        async loadContent() {
            this.loading = true
            this.error = false
            try {
                console.log('📡 调用 getContentDetail，ID:', this.contentId)
                const res = await contentAPI.getContentDetail(this.contentId)
                console.log('📡 视频详情API返回:', res)

                if (res && res.data) {
                    this.content = res.data
                    console.log('✅ 获取视频详情成功:', this.content)
                    
                    // 处理视频URL
                    if (this.content.videoUrl) {
                        this.content.videoUrl = getFullAssetUrl(this.content.videoUrl)
                        console.log('📹 处理后的videoUrl:', this.content.videoUrl)
                    }
                    
                    // 处理封面图URL
                    if (this.content.coverImage) {
                        this.content.coverImage = getFullAssetUrl(this.content.coverImage)
                    }
                    
                    // 更新页面标题
                    uni.setNavigationBarTitle({
                        title: this.content.title || '视频详情'
                    })
                } else {
                    throw new Error(res?.message || '获取内容失败')
                }
            } catch (error) {
                console.error('❌ 加载内容失败:', error)
                this.showError('网络请求失败，请稍后重试')
            } finally {
                this.loading = false
            }
        },

        onVideoPlay() {
            console.log('视频播放')
        },

        onVideoPause() {
            console.log('视频暂停')
        },

        onVideoEnded() {
            console.log('视频播放完成')
        },

        onTimeUpdate(e) {
            this.currentTime = e.detail.currentTime
            this.duration = e.detail.duration
        },

        formatTime(seconds) {
            if (!seconds || isNaN(seconds)) return '00:00'
            const mins = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        },

        formatDuration(seconds) {
            if (!seconds) return '--'
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            if (mins === 0) return `${secs}秒`
            return `${mins}分${secs}秒`
        },

        formatDate(dateStr) {
            if (!dateStr) return '--'
            try {
                const date = new Date(dateStr)
                return date.toLocaleDateString('zh-CN')
            } catch (e) {
                return dateStr
            }
        },

        addToFavorites() {
            uni.showToast({
                title: '已收藏',
                icon: 'success'
            })
        },

        showError(message) {
            this.error = true
            this.errorMessage = message
        },

        goBack() {
            uni.navigateBack()
        }
    }
}
</script>

<style scoped lang="scss">
.video-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1419 0%, #1e2328 100%);
    color: #ececec;
    padding-bottom: 40rpx;
}

/* 加载状态 */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 20rpx;
}

.loading-spinner {
    width: 60rpx;
    height: 60rpx;
    border: 4rpx solid #3c4043;
    border-top: 4rpx solid #ff4654;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.loading-spinner.small {
    width: 40rpx;
    height: 40rpx;
    border-width: 3rpx;
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

@keyframes spin {
    to {
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
    gap: 20rpx;
}

.error-icon {
    font-size: 80rpx;
}

.error-message {
    font-size: 26rpx;
    color: #999;
    text-align: center;
}

.retry-btn {
    background: #ff4654;
    color: white;
    border: none;
    padding: 16rpx 32rpx;
    border-radius: 12rpx;
    font-size: 24rpx;
}

/* 主要内容 */
.main-content {
    width: 100%;
}

/* 视频播放器 */
.video-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    background: #000;
}

.video-player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.video-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}

/* 视频控制栏 */
.video-controls {
    padding: 12rpx 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.time-display {
    font-size: 20rpx;
    color: #999;
}

/* 内容头部 */
.content-header {
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.content-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ff4654;
    line-height: 1.4;
    display: block;
    margin-bottom: 12rpx;
}

/* 标签 */
.content-badges {
    display: flex;
    gap: 12rpx;
}

.badge {
    background: rgba(255, 215, 0, 0.2);
    border: 1rpx solid #ffd700;
    padding: 6rpx 12rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    color: #ffd700;
}

.badge.official {
    background: rgba(76, 175, 80, 0.2);
    border-color: #4caf50;
    color: #4caf50;
}

/* 视频基本信息 */
.video-info {
    padding: 20rpx 32rpx;
    background: rgba(255, 255, 255, 0.03);
}

.info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    font-size: 22rpx;
    color: #999;
}

.info-value {
    font-size: 22rpx;
    color: #ececec;
    font-weight: bold;
}

/* 分段内容 */
.content-description-section,
.content-tags-section,
.content-meta-section {
    padding: 24rpx 32rpx;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.section-title {
    font-size: 24rpx;
    font-weight: bold;
    color: #ececec;
    display: block;
    margin-bottom: 12rpx;
}

.description-text {
    font-size: 22rpx;
    color: #cccccc;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* 标签 */
.tags-container {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.tag-item {
    background: rgba(255, 70, 84, 0.2);
    border: 1rpx solid #ff4654;
    padding: 8rpx 16rpx;
    border-radius: 16rpx;
    font-size: 20rpx;
    color: #ff4654;
}

/* 元数据 */
.meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.meta-row:last-child {
    border-bottom: none;
}

.meta-label {
    font-size: 22rpx;
    color: #999;
}

.meta-value {
    font-size: 22rpx;
    color: #ececec;
}

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    flex: 1;
    padding: 16rpx 0;
    border-radius: 12rpx;
    font-size: 24rpx;
    border: none;
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

/* 返回按钮 */
.back-button {
    padding: 16rpx 32rpx;
    text-align: center;
    color: #ff4654;
    font-size: 24rpx;
    font-weight: bold;
}
</style>
