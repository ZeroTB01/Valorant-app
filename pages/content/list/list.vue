<template>
    <view class="content-list-page">
        <!-- 头部导航 -->
        <view class="page-header">
            <view class="header-left">
                <text class="back-btn" @tap="goBack">←</text>
            </view>

            <view class="header-center">
                <text class="page-title">攻略内容</text>
            </view>

            <view class="header-right"></view>
        </view>

        <!-- 筛选条件展示 -->
        <view class="filter-display">
            <view class="filter-item" v-if="filterParams.mapName">
                <text class="filter-label">地图</text>
                <text class="filter-value">{{ filterParams.mapName }}</text>
            </view>
            <view class="filter-item" v-if="filterParams.heroName">
                <text class="filter-label">英雄</text>
                <text class="filter-value">{{ filterParams.heroName }}</text>
            </view>
            <view class="filter-item" v-if="filterParams.positionName">
                <text class="filter-label">点位</text>
                <text class="filter-value">{{ filterParams.positionName }}</text>
            </view>
        </view>

        <!-- 分类标签 -->
        <view class="category-tabs">
            <view 
                :class="'tab-item ' + (activeCategory === 'all' ? 'active' : '')"
                @tap="switchCategory('all')"
            >
                <text>全部</text>
                <text class="tab-count" v-if="totalCount > 0">{{ totalCount }}</text>
            </view>
            <view 
                :class="'tab-item ' + (activeCategory === 'video' ? 'active' : '')"
                @tap="switchCategory('video')"
            >
                <text>视频</text>
                <text class="tab-count" v-if="videoCount > 0">{{ videoCount }}</text>
            </view>
            <view 
                :class="'tab-item ' + (activeCategory === 'article' ? 'active' : '')"
                @tap="switchCategory('article')"
            >
                <text>图文</text>
                <text class="tab-count" v-if="articleCount > 0">{{ articleCount }}</text>
            </view>
        </view>

        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载内容...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error && !loading">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="loadContents">重新加载</button>
        </view>

        <!-- 内容列表（双列卡片） -->
        <view class="content-list" v-if="!loading && !error && filteredContents.length > 0">
            <view 
                v-for="content in filteredContents"
                :key="content.id"
                class="content-card-item"
                @tap="navigateToDetail(content)"
            >
                <!-- 卡片容器 -->
                <view class="content-card">
                    <!-- 背景容器 -->
                    <view class="content-card-background">
                        <!-- 封面图 -->
                        <image 
                            v-if="content.coverImage"
                            :src="content.coverImage" 
                            class="content-cover"
                            mode="aspectFill"
                            @error="onImageLoadError"
                        />
                        
                        <!-- 占位图 -->
                        <view v-else class="content-cover-placeholder">
                            <text class="placeholder-icon">🎨</text>
                        </view>

                        <!-- 内容类型标签 -->
                        <view class="content-type-badge">
                            <text v-if="content.contentType === 'video'">视频</text>
                            <text v-else-if="content.contentType === 'article'">图文</text>
                        </view>

                        <!-- 精选标签 -->
                        <view class="featured-badge" v-if="content.isFeatured">精选</view>

                        <!-- 官方标签 -->
                        <view class="official-badge" v-if="content.isOfficial">官方</view>
                    </view>

                    <!-- 内容信息 -->
                    <view class="content-info">
                        <text class="content-title">{{ content.title }}</text>
                        <text class="content-description">{{ content.description }}</text>
                        
                        <!-- 视频时长 -->
                        <text class="content-duration" v-if="content.contentType === 'video' && content.videoDuration">
                            ⏱️ {{ formatDuration(content.videoDuration) }}
                        </text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-container" v-if="!loading && !error && filteredContents.length === 0">
            <view class="empty-icon">📭</view>
            <text class="empty-text">暂无相关内容</text>
            <text class="empty-hint">换个筛选条件试试</text>
        </view>
    </view>
</template>

<script>
const { contentAPI, getFullAssetUrl } = require('@/utils/api')

export default {
    data() {
        return {
            filterParams: {
                mapId: null,
                mapName: '',
                heroId: null,
                heroName: '',
                positionId: null,
                positionName: ''
            },
            activeCategory: 'all',
            contents: [],
            loading: false,
            error: false,
            errorMessage: ''
        }
    },

    computed: {
        filteredContents() {
            let filtered = this.contents
            
            // 按分类过滤
            if (this.activeCategory !== 'all') {
                filtered = filtered.filter(c => c.contentType === this.activeCategory)
            }
            
            return filtered
        },
        
        videoCount() {
            return this.contents.filter(c => c.contentType === 'video').length
        },
        
        articleCount() {
            return this.contents.filter(c => c.contentType === 'article').length
        },
        
        totalCount() {
            return this.contents.length
        }
    },

    onLoad(options) {
        console.log('📋 内容列表页面加载, 传入参数:', options)
        
        // 获取传递的筛选参数
        if (options.mapId) {
            this.filterParams.mapId = parseInt(options.mapId)
            this.filterParams.mapName = options.mapName ? decodeURIComponent(options.mapName) : ''
        }
        if (options.heroId) {
            this.filterParams.heroId = parseInt(options.heroId)
            this.filterParams.heroName = options.heroName ? decodeURIComponent(options.heroName) : ''
        }
        if (options.positionId) {
            this.filterParams.positionId = parseInt(options.positionId)
            this.filterParams.positionName = options.positionName ? decodeURIComponent(options.positionName) : ''
        }

        console.log('📋 筛选参数设置完成:', this.filterParams)
        
        // 加载内容
        this.loadContents()
    },

    methods: {
        async loadContents() {
            this.loading = true
            this.error = false
            this.errorMessage = ''
            
            try {
                // 构建请求参数，只发送非null的参数
                const params = {
                    current: 1,
                    size: 100
                }
                if (this.filterParams.heroId) params.heroId = this.filterParams.heroId
                if (this.filterParams.mapId) params.mapId = this.filterParams.mapId
                if (this.filterParams.positionId) params.positionId = this.filterParams.positionId
                
                console.log('📡 调用API获取内容列表，参数:', params)
                
                // 首先尝试使用 getContentsByRelation 端点
                let res
                try {
                    res = await contentAPI.getContentsByRelation(params)
                    console.log('📡 /content/relation 返回:', res)
                } catch (e) {
                    // 如果 relation 端点不存在，降级到 page 端点
                    console.warn('⚠️ /content/relation 端点失败，降级到 /content/page')
                    res = await contentAPI.getContentPage(params)
                    console.log('📡 /content/page 返回:', res)
                }

                // 检查响应格式
                if (res && res.data) {
                    let contentList = []
                    
                    // 如果返回的是数组
                    if (Array.isArray(res.data)) {
                        contentList = res.data
                        console.log('✅ 获取内容成功，共', contentList.length, '条')
                    } 
                    // 如果返回的是对象，检查是否有records字段（分页结果）
                    else if (res.data.records && Array.isArray(res.data.records)) {
                        contentList = res.data.records
                        console.log('✅ 获取内容成功，共', contentList.length, '条')
                    }
                    // 其他对象格式
                    else if (typeof res.data === 'object') {
                        contentList = Array.isArray(res.data) ? res.data : [res.data]
                        console.log('✅ 获取内容成功')
                    }
                    else {
                        throw new Error('内容数据格式不正确')
                    }
                    
                    // 处理每条内容的 URL
                    this.contents = contentList.map(content => ({
                        ...content,
                        coverImage: content.coverImage ? getFullAssetUrl(content.coverImage) : null
                    }))
                    console.log('✅ URL 处理完成，共', this.contents.length, '条内容')
                } else {
                    throw new Error(res?.message || '获取内容失败')
                }
            } catch (error) {
                console.error('❌ 加载内容失败:', error)
                this.error = true
                this.errorMessage = error.message || '网络请求失败，请稍后重试'
                this.contents = []
            } finally {
                this.loading = false
            }
        },

        switchCategory(category) {
            this.activeCategory = category
        },

        navigateToDetail(content) {
            if (content.contentType === 'video') {
                uni.navigateTo({
                    url: `/pages/content/video-detail/video-detail?contentId=${content.id}`
                })
            } else if (content.contentType === 'article') {
                uni.navigateTo({
                    url: `/pages/content/article-detail/article-detail?contentId=${content.id}`
                })
            } else {
                // 混合类型优先显示视频
                uni.navigateTo({
                    url: `/pages/content/video-detail/video-detail?contentId=${content.id}`
                })
            }
        },

        formatDuration(seconds) {
            if (!seconds) return ''
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
        },

        onImageLoadError(event) {
            console.warn('❌ 图片加载失败:', event)
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
.content-list-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1419 0%, #1e2328 100%);
    color: #ececec;
}

/* 头部样式 */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100rpx;
    padding: 0 32rpx;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-left,
.header-right {
    flex: 0 0 80rpx;
}

.header-center {
    flex: 1;
    text-align: center;
}

.back-btn {
    font-size: 36rpx;
    color: #ff4654;
    font-weight: bold;
}

.page-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #ececec;
}

/* 筛选条件展示 */
.filter-display {
    display: flex;
    gap: 16rpx;
    padding: 20rpx 32rpx;
    background: rgba(255, 255, 255, 0.05);
    overflow-x: auto;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 16rpx;
    background: rgba(255, 70, 84, 0.2);
    border: 1rpx solid #ff4654;
    border-radius: 20rpx;
    white-space: nowrap;
}

.filter-label {
    font-size: 22rpx;
    color: #ff4654;
    font-weight: bold;
}

.filter-value {
    font-size: 22rpx;
    color: #ececec;
}

/* 分类标签 */
.category-tabs {
    display: flex;
    gap: 16rpx;
    padding: 20rpx 32rpx;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.tab-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 20rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid transparent;
    border-radius: 20rpx;
    font-size: 26rpx;
    color: #999;
    transition: all 0.3s;
}

.tab-item.active {
    background: rgba(255, 70, 84, 0.2);
    border-color: #ff4654;
    color: #ff4654;
    font-weight: bold;
}

.tab-count {
    font-size: 20rpx;
    background: #ff4654;
    color: white;
    padding: 2rpx 8rpx;
    border-radius: 12rpx;
    font-weight: bold;
}

/* 内容列表 */
.content-list {
    padding: 20rpx 32rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.content-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding: 12rpx;
}

.content-card-item {
    width: 100%;
}

.content-card {
    position: relative;
    background: transparent;
    border-radius: 12rpx;
    overflow: hidden;
    transition: all 0.3s;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.content-card:active {
    transform: scale(0.98);
    opacity: 0.9;
}

/* 背景容器（包含图片和标签） */
.content-card-background {
    position: relative;
    width: 100%;
    aspect-ratio: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(42, 45, 49, 0.8), rgba(60, 64, 67, 0.8));
    border-radius: 12rpx;
    overflow: hidden;
    margin-bottom: 8rpx;
}

/* 封面图 */
.content-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
}

/* 占位图 */
.content-cover-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 70, 84, 0.1), rgba(76, 175, 80, 0.1));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
}

.placeholder-text {
    font-size: 22rpx;
    color: #999;
    opacity: 0.7;
}

/* 内容类型标签 */
.content-type-badge {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    background: rgba(0, 0, 0, 0.8);
    padding: 4rpx 8rpx;
    border-radius: 4rpx;
    font-size: 18rpx;
    color: white;
    z-index: 10;
    font-weight: 500;
}

.featured-badge {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    background: rgba(255, 70, 84, 0.9);
    padding: 4rpx 8rpx;
    border-radius: 4rpx;
    font-size: 16rpx;
    color: white;
    z-index: 10;
    font-weight: 500;
}

.official-badge {
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    background: rgba(76, 175, 80, 0.9);
    padding: 4rpx 8rpx;
    border-radius: 4rpx;
    font-size: 16rpx;
    color: white;
    z-index: 10;
    font-weight: 500;
}

/* 内容信息 */
.content-info {
    flex: 1;
    padding: 10rpx;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
    background: rgba(30, 35, 40, 0.95);
    border-radius: 0 0 12rpx 12rpx;
}

.content-title {
    font-size: 22rpx;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.content-description {
    font-size: 18rpx;
    color: #999999;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.content-duration {
    font-size: 16rpx;
    color: #ff4654;
    margin-top: 2rpx;
    font-weight: 500;
}

/* 加载状态 */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400rpx;
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

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-text {
    font-size: 26rpx;
    color: #999;
}

/* 错误状态 */
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400rpx;
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

/* 空状态 */
.empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400rpx;
    gap: 16rpx;
}

.empty-icon {
    font-size: 80rpx;
}

.empty-text {
    font-size: 28rpx;
    color: #ececec;
    font-weight: bold;
}

.empty-hint {
    font-size: 22rpx;
    color: #999;
}
</style>
