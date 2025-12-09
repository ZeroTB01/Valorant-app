<template>
    <!-- pages/content/detail/detail.wxml -->
    <view class="content-detail-page">
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载视频...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="retryLoad">重新加载</button>
        </view>

        <!-- 主要内容 -->
        <view class="main-content" v-if="!loading && !error && contentInfo">
            <!-- 视频播放器区域 -->
            <view class="video-section">
                <video
                    v-if="contentInfo.contentType === 'video'"
                    id="contentVideo"
                    class="video-player"
                    :src="contentInfo.videoUrl"
                    :poster="contentInfo.coverImage"
                    controls
                    show-fullscreen-btn
                    show-play-btn
                    show-center-play-btn
                    show-loading
                    @play="onVideoPlay"
                    @pause="onVideoPause"
                    @timeupdate="onVideoTimeUpdate"
                    @ended="onVideoEnded"
                    @loadeddata="onVideoLoadedData"
                    @error="onVideoError"
                    @fullscreenchange="onVideoFullscreenChange"
                ></video>

                <!-- 图文内容封面 -->
                <view class="content-cover" v-if="contentInfo.contentType !== 'video'">
                    <image class="cover-image" :src="contentInfo.coverImage" mode="aspectFit" />
                </view>

                <!-- 播放器控制栏 -->
                <view class="video-controls" v-if="contentInfo.contentType === 'video'">
                    <view class="progress-info">
                        <text class="time-text">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
                        <text class="progress-text">{{ playProgress.toFixed(1) }}%</text>
                    </view>

                    <view class="control-buttons">
                        <button class="control-btn" @tap="changePlaybackRate">{{ playbackRate }}x</button>
                    </view>
                </view>
            </view>

            <!-- 内容信息区域 -->
            <view class="content-info-section">
                <!-- 标题和基本信息 -->
                <view class="content-header">
                    <text class="content-title">{{ contentInfo.title }}</text>

                    <view class="content-meta">
                        <view class="meta-item">
                            <text class="meta-icon">👁️</text>
                            <text class="meta-text">{{ formatNumber(contentInfo.viewCount) }}次观看</text>
                        </view>

                        <view class="meta-item">
                            <text class="meta-icon">👍</text>
                            <text class="meta-text">{{ formatNumber(contentInfo.likeCount) }}</text>
                        </view>

                        <view class="meta-item">
                            <text class="meta-icon">⭐</text>
                            <text class="meta-text">{{ formatNumber(contentInfo.collectCount) }}收藏</text>
                        </view>

                        <view class="meta-item" v-if="contentInfo.videoDuration">
                            <text class="meta-icon">⏱️</text>
                            <text class="meta-text">{{ formatTime(contentInfo.videoDuration) }}</text>
                        </view>
                    </view>

                    <!-- 操作按钮 -->
                    <view class="action-buttons">
                        <button :class="'action-btn ' + (isFavorited ? 'favorited' : '')" @tap="toggleFavorite">
                            <text class="btn-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
                            <text class="btn-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
                        </button>

                        <button :class="'action-btn ' + (isLiked ? 'liked' : '')" @tap="toggleLike">
                            <text class="btn-icon">{{ isLiked ? '👍' : '👍🏻' }}</text>
                            <text class="btn-text">{{ isLiked ? '已赞' : '点赞' }}</text>
                        </button>

                        <button class="action-btn" open-type="share">
                            <text class="btn-icon">📤</text>
                            <text class="btn-text">分享</text>
                        </button>
                    </view>
                </view>

                <!-- 内容描述 -->
                <view class="content-description" v-if="contentInfo.description">
                    <text class="description-text">{{ contentInfo.description }}</text>
                </view>

                <!-- 标签 -->
                <view class="content-tags" v-if="tags.length > 0">
                    <text class="tag-item" v-for="(item, index) in tags" :key="index">#{{ item }}</text>
                </view>

                <!-- 相关数据 -->
                <view class="related-data" v-if="relatedData">
                    <view class="related-item" v-if="relatedData.hero" @tap="viewHeroDetail">
                        <text class="related-label">相关英雄：</text>
                        <text class="related-value">{{ relatedData.hero.heroName }}</text>
                        <text class="related-arrow">→</text>
                    </view>

                    <view class="related-item" v-if="relatedData.map" @tap="viewMapDetail">
                        <text class="related-label">相关地图：</text>
                        <text class="related-value">{{ relatedData.map.mapName }}</text>
                        <text class="related-arrow">→</text>
                    </view>

                    <view class="related-item" v-if="relatedData.position">
                        <text class="related-label">相关点位：</text>
                        <text class="related-value">{{ relatedData.position.positionName }}</text>
                    </view>
                </view>
            </view>

            <!-- 作者信息区域 -->
            <view class="author-section" v-if="author">
                <view class="author-info" @tap="viewAuthor">
                    <image class="author-avatar" :src="author.avatar" mode="aspectFill" />

                    <view class="author-details">
                        <text class="author-name">{{ author.nickname || author.username }}</text>
                        <text class="author-username">@{{ author.username }}</text>
                    </view>

                    <text class="follow-btn">关注</text>
                </view>
            </view>

            <!-- 图文内容正文 -->
            <view class="content-body" v-if="contentInfo.contentType !== 'video' && contentInfo.contentBody">
                <rich-text class="rich-content" :nodes="contentInfo.contentBody"></rich-text>
            </view>

            <!-- 相关推荐区域 -->
            <view class="related-section">
                <view class="section-title">
                    <text>相关推荐</text>
                    <text class="count-badge" v-if="relatedContents.length > 0">{{ relatedContents.length }}</text>
                </view>

                <!-- 加载中 -->
                <view class="loading-related" v-if="loadingRelated">
                    <view class="loading-spinner small"></view>
                    <text>加载推荐中...</text>
                </view>

                <!-- 推荐内容列表 -->
                <view class="related-list" v-if="!loadingRelated && relatedContents.length > 0">
                    <view class="related-content-item" @tap="viewRelatedContent" :data-id="item.id" v-for="(item, index) in relatedContents" :key="index">
                        <view class="related-cover-container">
                            <image class="related-cover" :src="item.coverImage" mode="aspectFill" />

                            <!-- 视频时长 -->
                            <view class="duration-badge" v-if="item.videoDuration">
                                {{ formatTime(item.videoDuration) }}
                            </view>

                            <!-- 内容类型图标 -->
                            <view class="content-type-icon">
                                {{ item.contentType === 'video' ? '🎬' : '📄' }}
                            </view>
                        </view>

                        <view class="related-info">
                            <text class="related-title">{{ item.title }}</text>

                            <view class="related-meta">
                                <text class="related-views">{{ formatNumber(item.viewCount) }}次观看</text>
                                <text class="related-author" v-if="item.author">{{ item.author }}</text>
                            </view>

                            <!-- 推荐理由 -->
                            <view class="recommend-reason" v-if="item.reason">
                                <text class="reason-text">{{ item.reason }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 空状态 -->
                <view class="empty-related" v-if="!loadingRelated && relatedContents.length === 0">
                    <text class="empty-icon">📺</text>
                    <text class="empty-text">暂无相关推荐</text>
                </view>
            </view>

            <!-- 评论区域（预留） -->
            <view class="comments-section" v-if="showComments">
                <view class="section-title">
                    <text>评论</text>
                    <text class="count-badge">0</text>
                </view>

                <view class="comment-placeholder">
                    <text class="placeholder-text">评论功能开发中...</text>
                </view>
            </view>
        </view>

        <!-- 返回按钮 -->
        <view class="back-button" @tap="goBack">
            <text class="back-icon">←</text>
        </view>

        <!-- 底部操作栏（固定） -->
        <view class="bottom-toolbar" v-if="!loading && !error">
            <view class="toolbar-left">
                <button class="toolbar-btn" @tap="toggleFavorite">
                    <text class="toolbar-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
                </button>

                <button class="toolbar-btn" @tap="toggleLike">
                    <text class="toolbar-icon">{{ isLiked ? '👍' : '👍🏻' }}</text>
                </button>
            </view>

            <view class="toolbar-right">
                <button class="toolbar-btn share-btn" open-type="share">
                    <text class="toolbar-icon">📤</text>
                    <text class="toolbar-text">分享</text>
                </button>
            </view>
        </view>
    </view>
</template>

<script>
// pages/content/detail/detail.js
const app = getApp();
const { contentAPI, favoriteAPI, historyAPI } = require('../../../utils/api');
const { handleContentImages, handleImageUrl, getDefaultImage } = require('../../../utils/image');
export default {
    data() {
        return {
            contentId: null,
            contentInfo: null,
            author: null,
            relatedData: null,
            tags: [],
            relatedContents: [],

            // 视频播放相关
            videoContext: null,

            isPlaying: false,
            currentTime: 0,
            duration: 0,
            playProgress: 0,
            isFullscreen: false,
            playbackRate: 1,

            // 播放速度

            // 用户交互状态
            isFavorited: false,

            isLiked: false,
            showComments: false,

            // 播放速度选项
            speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 2],

            // 加载状态
            loading: true,

            loadingRelated: false,

            // 页面状态
            error: false,

            errorMessage: '',

            // 系统信息
            systemInfo: {},

            heroName: '',
            mapName: '',
            positionName: ''
        };
    },
    onLoad(options) {
        // 获取系统信息
        this.setData({
            systemInfo: app.globalData.getSystemInfo()
        });

        // 获取内容ID
        const contentId = options.id;
        if (!contentId) {
            this.showError('内容ID参数缺失');
            return;
        }
        this.setData({
            contentId
        });

        // 加载内容详情
        this.loadContentDetail();
    },
    onReady() {
        // 创建视频上下文
        this.videoContext = uni.createVideoContext('contentVideo');
    },
    onShow() {
        // 页面显示时恢复播放状态
        if (this.isPlaying && this.videoContext) {
            this.videoContext.play();
        }
    },
    onHide() {
        // 页面隐藏时暂停播放
        if (this.isPlaying && this.videoContext) {
            this.videoContext.pause();
        }

        // 记录播放进度
        this.recordViewHistory();
    },
    onUnload() {
        // 页面卸载时记录观看历史
        this.recordViewHistory();
    },
    // ========== 页面生命周期 ==========

    // 页面分享
    onShareAppMessage() {
        return this.shareContent();
    },
    // 分享到朋友圈
    onShareTimeline() {
        const { contentInfo } = this;
        return {
            title: `${contentInfo.title} - Valorant攻略视频`,
            query: `id=${contentInfo.id}&source=timeline`
        };
    },
    methods: {
        // 加载内容详情
        async loadContentDetail() {
            this.setData({
                loading: true,
                error: false
            });
            try {
                console.log('🔄 加载内容详情...', this.contentId);
                const res = await contentAPI.getContentDetail(this.contentId);
                console.log('内容详情API返回:', res);
                if (res.success && res.data) {
                    const { content, author, relatedData, tags, relatedContents } = res.data;

                    // 处理内容信息
                    const processedContent = handleContentImages(content);

                    // 处理作者头像
                    const processedAuthor = author
                        ? {
                              ...author,
                              avatar: handleImageUrl(author.avatar, getDefaultImage('avatar'))
                          }
                        : null;

                    // 处理相关内容图片
                    const processedRelated = relatedContents
                        ? relatedContents.map((item) => ({
                              ...item,
                              coverImage: handleImageUrl(item.coverImage, getDefaultImage('content'))
                          }))
                        : [];
                    this.setData({
                        contentInfo: processedContent,
                        author: processedAuthor,
                        relatedData: relatedData || {},
                        tags: tags || [],
                        relatedContents: processedRelated
                    });

                    // 更新页面标题
                    uni.setNavigationBarTitle({
                        title: processedContent.title || '视频详情'
                    });

                    // 检查收藏和点赞状态
                    this.checkUserInteractions();

                    // 加载推荐内容
                    this.loadRecommendedContents();

                    // 添加到最近查看
                    this.addToRecentViews(processedContent);
                } else {
                    this.showError(res.message || '获取内容详情失败');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 加载内容详情失败:', error);
                this.showError('网络请求失败，请稍后重试');
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 检查用户交互状态
        async checkUserInteractions() {
            const userInfo = app.globalData.userInfo;
            if (!userInfo || userInfo.isGuest) {
                console.log('游客用户，跳过交互状态检查');
                return;
            }
            try {
                // 检查收藏状态
                const favoriteRes = await favoriteAPI.checkFavorite({
                    targetType: 'content',
                    targetId: this.contentId
                });
                if (favoriteRes.success) {
                    this.setData({
                        isFavorited: favoriteRes.data
                    });
                }

                // TODO: 检查点赞状态（如果有对应API）
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('检查用户交互状态失败:', error);
            }
        },

        // 加载推荐内容
        async loadRecommendedContents() {
            if (this.relatedContents.length > 0) {
                console.log('已有相关内容，跳过推荐加载');
                return;
            }
            this.setData({
                loadingRelated: true
            });
            try {
                const { contentInfo, relatedData } = this;
                const params = {
                    contentId: contentInfo.id,
                    limit: 5
                };

                // 添加英雄和地图参数用于推荐
                if (relatedData.hero) {
                    params.heroId = relatedData.hero.id;
                }
                if (relatedData.map) {
                    params.mapId = relatedData.map.id;
                }
                const res = await contentAPI.getRecommendedContents(params);
                if (res.success && res.data) {
                    const processedRecommended = res.data.map((item) => ({
                        ...item,
                        coverImage: handleImageUrl(item.coverImage, getDefaultImage('content'))
                    }));
                    this.setData({
                        relatedContents: processedRecommended
                    });
                    console.log('✅ 推荐内容加载成功:', processedRecommended.length + '个推荐');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载推荐内容失败:', error);
            } finally {
                this.setData({
                    loadingRelated: false
                });
            }
        },

        // ========== 视频播放控制 ==========

        // 视频播放事件
        onVideoPlay() {
            console.log('🎬 视频开始播放');
            this.setData({
                isPlaying: true
            });
        },

        // 视频暂停事件
        onVideoPause() {
            console.log('⏸️ 视频暂停');
            this.setData({
                isPlaying: false
            });
        },

        // 视频播放进度更新
        onVideoTimeUpdate(e) {
            const { currentTime, duration } = e.detail;
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            this.setData({
                currentTime,
                duration,
                playProgress: progress
            });
        },

        // 视频播放结束
        onVideoEnded() {
            console.log('✅ 视频播放结束');
            this.setData({
                isPlaying: false,
                playProgress: 100
            });

            // 记录完整观看
            this.recordViewHistory();
        },

        // 视频加载完成
        onVideoLoadedData() {
            console.log('📹 视频加载完成');
        },

        // 视频加载失败
        onVideoError(e) {
            console.error('❌ 视频加载失败:', e);
            uni.showToast({
                title: '视频加载失败',
                icon: 'none'
            });
        },

        // 进入/退出全屏
        onVideoFullscreenChange(e) {
            this.setData({
                isFullscreen: e.detail.fullScreen
            });
            console.log('全屏状态:', e.detail.fullScreen);
        },

        // 切换播放速度
        changePlaybackRate() {
            const { speedOptions, playbackRate } = this;
            const currentIndex = speedOptions.indexOf(playbackRate);
            const nextIndex = (currentIndex + 1) % speedOptions.length;
            const newRate = speedOptions[nextIndex];
            if (this.videoContext) {
                this.videoContext.playbackRate(newRate);
            }
            this.setData({
                playbackRate: newRate
            });
            uni.showToast({
                title: `${newRate}x 倍速`,
                icon: 'none',
                duration: 1000
            });
        },

        // ========== 用户交互操作 ==========

        // 切换收藏
        async toggleFavorite() {
            const userInfo = app.globalData.userInfo;
            if (!userInfo || userInfo.isGuest) {
                uni.showModal({
                    title: '提示',
                    content: '请先登录后再收藏',
                    showCancel: false
                });
                return;
            }
            try {
                const { isFavorited, contentId } = this;
                if (isFavorited) {
                    // 取消收藏
                    const res = await favoriteAPI.removeFavorite({
                        targetType: 'content',
                        targetId: contentId
                    });
                    if (res.success) {
                        this.setData({
                            isFavorited: false
                        });
                        uni.showToast({
                            title: '已取消收藏',
                            icon: 'success'
                        });
                    }
                } else {
                    // 添加收藏
                    const res = await favoriteAPI.addFavorite({
                        targetType: 'content',
                        targetId: contentId,
                        folderName: '默认收藏夹'
                    });
                    if (res.success) {
                        this.setData({
                            isFavorited: true
                        });
                        uni.showToast({
                            title: '收藏成功',
                            icon: 'success'
                        });
                    }
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('收藏操作失败:', error);
                uni.showToast({
                    title: '操作失败，请稍后重试',
                    icon: 'none'
                });
            }
        },

        // 点赞操作
        toggleLike() {
            // TODO: 实现点赞功能
            const newLikeStatus = !this.isLiked;
            this.setData({
                isLiked: newLikeStatus
            });
            uni.showToast({
                title: newLikeStatus ? '已点赞' : '已取消点赞',
                icon: 'success'
            });
        },

        // 分享内容
        shareContent() {
            const { contentInfo } = this;
            return {
                title: contentInfo.title,
                path: `/pages/content/detail/detail?id=${contentInfo.id}`,
                imageUrl: contentInfo.coverImage
            };
        },

        // ========== 导航操作 ==========

        // 查看相关内容
        viewRelatedContent(e) {
            const contentId = e.currentTarget.dataset.id;
            uni.navigateTo({
                url: `/pages/content/detail/detail?id=${contentId}`
            });
        },

        // 查看作者
        viewAuthor() {
            if (!this.author) {
                return;
            }

            // TODO: 跳转到作者页面
            uni.showToast({
                title: '作者页面开发中',
                icon: 'none'
            });
        },

        // 查看英雄详情
        viewHeroDetail() {
            const heroId = this.relatedData?.hero?.id;
            if (!heroId) {
                return;
            }
            uni.navigateTo({
                url: `/pages/hero/detail/detail?id=${heroId}`
            });
        },

        // 查看地图详情
        viewMapDetail() {
            const mapId = this.relatedData?.map?.id;
            if (!mapId) {
                return;
            }
            uni.navigateTo({
                url: `/pages/map/detail/detail?id=${mapId}`
            });
        },

        // ========== 工具方法 ==========

        // 记录观看历史
        async recordViewHistory() {
            const userInfo = app.globalData.userInfo;
            if (!userInfo || userInfo.isGuest) {
                return;
            }
            const { contentId, currentTime, duration } = this;
            try {
                await historyAPI.recordHistory({
                    targetType: 'content',
                    targetId: contentId,
                    duration: Math.floor(currentTime),
                    progress: duration > 0 ? Math.floor((currentTime / duration) * 100) : 0
                });
                console.log('📝 观看历史记录成功');
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('记录观看历史失败:', error);
            }
        },

        // 添加到最近查看
        addToRecentViews(contentInfo) {
            try {
                let recentViews = uni.getStorageSync('recentViews') || [];
                const newView = {
                    type: 'content',
                    id: contentInfo.id,
                    name: contentInfo.title,
                    image: contentInfo.coverImage,
                    time: Date.now()
                };

                // 移除已存在的相同记录
                recentViews = recentViews.filter((item) => !(item.type === 'content' && item.id === contentInfo.id));

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
            this.loadContentDetail();
        },

        // 返回上一页
        goBack() {
            uni.navigateBack();
        },

        // 格式化时间
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },

        // 格式化数字
        formatNumber(num) {
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + 'w';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        }
    }
};
</script>
<style>
/* pages/content/detail/detail.wxss */

.content-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1419 0%, #1e2328 100%);
    color: #ececec;
    position: relative;
    padding-bottom: 120rpx;
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
    padding: 0;
}

/* 视频播放器区域 */
.video-section {
    position: relative;
    background: #000;
}

.video-player {
    width: 100%;
    height: 420rpx;
    background: #000;
}

.content-cover {
    width: 100%;
    height: 420rpx;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cover-image {
    width: 100%;
    height: 100%;
}

/* 视频控制栏 */
.video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    padding: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.time-text,
.progress-text {
    font-size: 24rpx;
    color: white;
    text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.8);
}

.control-buttons {
    display: flex;
    gap: 16rpx;
}

.control-btn {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 8rpx 16rpx;
    font-size: 24rpx;
    backdrop-filter: blur(8px);
}

/* 内容信息区域 */
.content-info-section {
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.05);
    margin: 0;
}

.content-header {
    margin-bottom: 24rpx;
}

.content-title {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #ececec;
    line-height: 1.4;
    margin-bottom: 16rpx;
}

.content-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 24rpx;
    margin-bottom: 24rpx;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.meta-icon {
    font-size: 20rpx;
}

.meta-text {
    font-size: 26rpx;
    color: #999;
}

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 16rpx;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    color: #ececec;
    font-size: 26rpx;
    transition: all 0.3s ease;
}

.action-btn.favorited {
    background: rgba(255, 70, 84, 0.2);
    border-color: #ff4654;
    color: #ff4654;
}

.action-btn.liked {
    background: rgba(255, 193, 7, 0.2);
    border-color: #ffc107;
    color: #ffc107;
}

.btn-icon {
    font-size: 28rpx;
}

.btn-text {
    font-size: 24rpx;
}

/* 内容描述 */
.content-description {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
}

.description-text {
    color: #cccccc;
    font-size: 28rpx;
    line-height: 1.6;
}

/* 标签 */
.content-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 24rpx;
}

.tag-item {
    background: rgba(255, 70, 84, 0.2);
    color: #ff4654;
    padding: 8rpx 16rpx;
    border-radius: 16rpx;
    font-size: 22rpx;
    border: 1rpx solid rgba(255, 70, 84, 0.3);
}

/* 相关数据 */
.related-data {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
}

.related-item {
    display: flex;
    align-items: center;
    padding: 12rpx 0;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.related-item:active {
    opacity: 0.7;
}

.related-label {
    font-size: 26rpx;
    color: #999;
    min-width: 120rpx;
}

.related-value {
    flex: 1;
    font-size: 26rpx;
    color: #ececec;
    font-weight: bold;
}

.related-arrow {
    font-size: 24rpx;
    color: #ff4654;
}

/* 作者信息区域 */
.author-section {
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.author-info {
    display: flex;
    align-items: center;
    gap: 20rpx;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.author-info:active {
    opacity: 0.8;
}

.author-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #2a2d31;
}

.author-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.author-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #ececec;
}

.author-username {
    font-size: 24rpx;
    color: #999;
}

.follow-btn {
    background: #ff4654;
    color: white;
    padding: 12rpx 24rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    font-weight: bold;
}

/* 图文内容正文 */
.content-body {
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.rich-content {
    color: #ececec;
    font-size: 28rpx;
    line-height: 1.8;
}

/* 相关推荐区域 */
.related-section {
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 32rpx;
    font-weight: bold;
    color: #ececec;
    margin-bottom: 24rpx;
}

.count-badge {
    background: #ff4654;
    color: white;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    font-size: 20rpx;
    min-width: 32rpx;
    text-align: center;
}

.loading-related {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 60rpx 0;
    color: #999;
    font-size: 26rpx;
}

/* 推荐内容列表 */
.related-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.related-content-item {
    display: flex;
    gap: 20rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    padding: 20rpx;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2rpx solid transparent;
}

.related-content-item:active {
    transform: translateY(2rpx);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 70, 84, 0.3);
}

.related-cover-container {
    flex: 0 0 160rpx;
    position: relative;
}

.related-cover {
    width: 160rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: #2a2d31;
}

.duration-badge {
    position: absolute;
    bottom: 8rpx;
    right: 8rpx;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4rpx 8rpx;
    border-radius: 6rpx;
    font-size: 18rpx;
    backdrop-filter: blur(4px);
}

.content-type-icon {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    font-size: 20rpx;
}

.related-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.related-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #ececec;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.related-meta {
    display: flex;
    gap: 16rpx;
    align-items: center;
}

.related-views,
.related-author {
    font-size: 22rpx;
    color: #999;
}

.recommend-reason {
    background: rgba(255, 70, 84, 0.1);
    border: 1rpx solid rgba(255, 70, 84, 0.3);
    border-radius: 8rpx;
    padding: 6rpx 12rpx;
    align-self: flex-start;
}

.reason-text {
    font-size: 20rpx;
    color: #ff4654;
}

/* 空状态 */
.empty-related {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80rpx 60rpx;
    gap: 16rpx;
}

.empty-icon {
    font-size: 80rpx;
    opacity: 0.5;
}

.empty-text {
    font-size: 28rpx;
    color: #999;
}

/* 评论区域 */
.comments-section {
    padding: 32rpx;
    background: rgba(255, 255, 255, 0.05);
    border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}

.comment-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80rpx 0;
}

.placeholder-text {
    font-size: 28rpx;
    color: #999;
}

/* 返回按钮 */
.back-button {
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

.back-button:active {
    transform: scale(0.95);
    background: rgba(0, 0, 0, 0.8);
}

.back-icon {
    color: white;
    font-size: 32rpx;
    font-weight: bold;
}

/* 底部操作栏 */
.bottom-toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(30, 35, 40, 0.95);
    backdrop-filter: blur(10px);
    border-top: 2rpx solid rgba(255, 255, 255, 0.1);
    padding: 20rpx 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 90;
}

.toolbar-left {
    display: flex;
    gap: 20rpx;
}

.toolbar-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: transparent;
    border: none;
    color: #ececec;
    font-size: 24rpx;
    padding: 12rpx;
}

.toolbar-icon {
    font-size: 32rpx;
}

.share-btn {
    background: #ff4654;
    color: white;
    padding: 16rpx 32rpx;
    border-radius: 20rpx;
    font-weight: bold;
}

.toolbar-text {
    font-size: 26rpx;
}

/* 响应式适配 */
@media (max-width: 768rpx) {
    .video-player {
        height: 360rpx;
    }

    .content-cover {
        height: 360rpx;
    }

    .action-buttons {
        flex-direction: column;
        gap: 12rpx;
    }

    .action-btn {
        justify-content: center;
    }

    .related-content-item {
        flex-direction: column;
    }

    .related-cover-container {
        flex: none;
        align-self: center;
    }

    .content-meta {
        justify-content: space-between;
    }

    .bottom-toolbar {
        flex-direction: column;
        gap: 16rpx;
        padding: 24rpx 32rpx;
    }

    .toolbar-left {
        justify-content: center;
    }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
    .content-detail-page {
        background: linear-gradient(135deg, #000000 0%, #111111 100%);
    }

    .content-info-section,
    .author-section,
    .related-section,
    .comments-section {
        background: rgba(255, 255, 255, 0.03);
    }
}

/* 动画效果 */
.related-content-item {
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

.action-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:active {
    transform: scale(0.98);
}
</style>
