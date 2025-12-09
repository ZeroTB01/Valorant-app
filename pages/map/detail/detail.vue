<template>
    <!-- pages/map/detail/detail.wxml -->
    <view class="map-detail-page">
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载地图信息...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="retryLoad">重新加载</button>
        </view>

        <!-- 主要内容 -->
        <view class="main-content" v-if="!loading && !error && mapInfo">
            <!-- 地图基本信息区域 -->
            <view class="map-info-section">
                <view class="map-header">
                    <view class="map-title-area">
                        <text class="map-name">{{ mapInfo.mapName }}</text>
                        <text class="map-key">{{ mapInfo.mapKey }}</text>
                    </view>

                    <!-- 操作按钮 -->
                    <view class="action-buttons">
                        <button class="action-btn primary" @tap="addToFavorites">
                            <text class="btn-icon">❤️</text>
                        </button>
                        <button class="action-btn secondary" open-type="share">
                            <text class="btn-icon">📤</text>
                        </button>
                    </view>
                </view>

                <view class="map-description" v-if="mapInfo.description">
                    <text>{{ mapInfo.description }}</text>
                </view>

                <!-- 地图统计信息 -->
                <view class="map-stats" v-if="positionStats">
                    <view class="stat-card">
                        <text class="stat-number">{{ positionStats.total }}</text>
                        <text class="stat-label">总点位</text>
                    </view>
                    <view class="stat-card">
                        <text class="stat-number">{{ positionStats.attack }}</text>
                        <text class="stat-label">进攻点位</text>
                    </view>
                    <view class="stat-card">
                        <text class="stat-number">{{ positionStats.defense }}</text>
                        <text class="stat-label">防守点位</text>
                    </view>
                </view>
            </view>

            <!-- 交互式地图区域 -->
            <view class="interactive-map-section">
                <view class="section-header">
                    <text class="section-title">地图概览</text>
                    <button class="reset-btn" @tap="resetMapView">重置视图</button>
                </view>

                <view class="map-container">
                    <movable-area class="map-movable-area">
                        <movable-view
                            class="map-movable-view"
                            direction="all"
                            :scale="true"
                            scale-min="0.5"
                            scale-max="3"
                            :scale-value="mapScale"
                            :x="mapX"
                            :y="mapY"
                            @scale="onMapScale"
                            @change="onMapMove"
                        >
                            <image class="map-overview" :src="mapInfo.overview || mapInfo.minimap" mode="widthFix" lazy-load />

                            <!-- 点位标记点（可以后续添加） -->
                            <view class="position-markers" v-if="filteredPositions.length > 0">
                                <view
                                    class="position-marker"
                                    :style="'background-color: ' + item.typeColor + ';'"
                                    @tap="viewPositionDetail"
                                    :data-id="item.id"
                                    :data-position="item"
                                    v-for="(item, index) in filteredPositions"
                                    :key="index"
                                >
                                    <text class="marker-text">{{ item.site }}</text>
                                </view>
                            </view>
                        </movable-view>
                    </movable-area>

                    <!-- 地图控制说明 -->
                    <view class="map-controls-tip">
                        <text>💡 双指缩放 | 拖拽移动</text>
                    </view>
                </view>
            </view>

            <!-- 筛选器区域 -->
            <view class="filter-section">
                <view class="filter-header" @tap="toggleFilter">
                    <text class="filter-title">点位筛选</text>
                    <text class="filter-toggle">{{ showFilter ? '收起' : '展开' }} {{ showFilter ? '▲' : '▼' }}</text>
                </view>

                <view class="filter-content" v-if="showFilter">
                    <!-- 攻防方筛选 -->
                    <view class="filter-group">
                        <text class="filter-label">攻防方</text>
                        <view class="filter-tabs">
                            <view
                                :class="'filter-tab ' + (currentSide === item.key ? 'active' : '')"
                                :style="'border-color: ' + item.color + '; ' + (currentSide === item.key ? 'background-color: ' + item.color + '20;' : '')"
                                @tap="switchSide"
                                :data-side="item.key"
                                v-for="(item, index) in sides"
                                :key="index"
                            >
                                <text class="tab-icon">{{ item.icon }}</text>

                                <text class="tab-text">{{ item.name }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 站点筛选 -->
                    <view class="filter-group" v-if="sites.length > 1">
                        <text class="filter-label">站点</text>
                        <view class="filter-tabs">
                            <view
                                :class="'filter-tab ' + (currentSite === item.key ? 'active' : '')"
                                :style="'border-color: ' + item.color + '; ' + (currentSite === item.key ? 'background-color: ' + item.color + '20;' : '')"
                                @tap="switchSite"
                                :data-site="item.key"
                                v-for="(item, index) in sites"
                                :key="index"
                            >
                                <text class="tab-text">{{ item.name }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 英雄筛选 -->
                    <view class="filter-group">
                        <text class="filter-label">英雄</text>
                        <scroll-view class="hero-filter-scroll" scroll-x>
                            <view
                                :class="'hero-filter-item ' + (currentHero === item.key ? 'active' : '')"
                                @tap="switchHero"
                                :data-hero="item.key"
                                v-for="(item, index) in heroes"
                                :key="index"
                            >
                                <image class="hero-avatar-small" :src="item.avatar" mode="aspectFill" />

                                <text class="hero-name-small">{{ item.name }}</text>
                            </view>
                        </scroll-view>
                    </view>
                </view>
            </view>

            <!-- 点位列表区域 -->
            <view class="positions-section">
                <view class="section-header">
                    <text class="section-title">
                        点位列表
                        <text class="position-count" v-if="filteredPositions.length > 0">({{ filteredPositions.length }})</text>
                    </text>
                </view>

                <!-- 加载中 -->
                <view class="loading-positions" v-if="loadingPositions">
                    <view class="loading-spinner small"></view>
                    <text>加载点位中...</text>
                </view>

                <!-- 点位列表 -->
                <view class="positions-list" v-if="!loadingPositions">
                    <view class="position-item" @tap="viewPositionDetail" :data-id="item.id" :data-position="item" v-for="(item, index) in filteredPositions" :key="index">
                        <view class="position-image-container">
                            <image class="position-image" :src="item.setupImage" mode="aspectFill" lazy-load />
                            <view class="position-type-badge" :style="'background-color: ' + item.typeColor + ';'">
                                {{ item.positionType }}
                            </view>
                        </view>

                        <view class="position-info">
                            <view class="position-header">
                                <text class="position-name">{{ item.positionName }}</text>
                                <view class="position-site" :style="'background-color: ' + (item.site === 'A' ? '#FF6B6B' : item.site === 'B' ? '#4ECDC4' : '#45B7D1') + ';'">
                                    {{ item.site }}点
                                </view>
                            </view>

                            <view class="position-meta">
                                <view class="difficulty-stars">
                                    <text :class="'star ' + (item.filled ? 'filled' : '')" v-for="(star, index1) in item.difficultyStars" :key="index1">★</text>
                                </view>
                                <text class="view-count">{{ item.viewCount }}次观看</text>
                            </view>

                            <view class="position-description">
                                <text>{{ item.description }}</text>
                            </view>

                            <view class="position-tags" v-if="item.tags && item.tags.length > 0">
                                <text class="tag" v-for="(item, index1) in item.tags" :key="index1">#{{ item }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 空状态 -->
                <view class="empty-positions" v-if="!loadingPositions && filteredPositions.length === 0">
                    <text class="empty-icon">📍</text>
                    <text class="empty-text">暂无符合条件的点位</text>
                    <text class="empty-tip">试试调整筛选条件</text>
                </view>
            </view>

            <!-- 热门英雄区域 -->
            <view class="popular-heroes-section" v-if="popularHeroes.length > 0">
                <view class="section-title">该地图热门英雄</view>
                <scroll-view class="heroes-scroll" scroll-x>
                    <view class="hero-item" @tap="switchHero" :data-hero="item.heroId" v-for="(item, index) in popularHeroes" :key="index">
                        <image class="hero-avatar" :src="item.avatar" mode="aspectFill" />

                        <text class="hero-name">{{ item.heroName }}</text>

                        <text class="position-count">{{ item.positionCount }}个点位</text>
                    </view>
                </scroll-view>
            </view>
        </view>

        <!-- 点位详情弹窗 -->
        <view class="position-modal" v-if="selectedPosition" @tap="closePositionDetail">
            <view class="modal-content" @tap.stop.prevent="">
                <view class="modal-header">
                    <text class="modal-title">{{ selectedPosition.positionName }}</text>
                    <text class="modal-close" @tap="closePositionDetail">✕</text>
                </view>

                <view class="modal-body">
                    <image class="modal-image" :src="selectedPosition.setupImage" mode="aspectFit" />
                    <text class="modal-description">{{ selectedPosition.description }}</text>
                </view>
            </view>
        </view>

        <!-- 返回按钮 -->
        <view class="back-to-top" @tap="goBack">
            <text class="back-icon">←</text>
        </view>
    </view>
</template>

<script>
// pages/map/detail/detail.js
const app = getApp();
const { mapAPI, positionAPI } = require('../../../utils/api');
const { handleMapImages, handlePositionList, handleImageUrl, getDefaultImage } = require('../../../utils/image');
export default {
    data() {
        return {
            mapId: null,
            mapInfo: null,
            positionStats: null,
            popularHeroes: [],
            // 点位相关
            positions: [],
            filteredPositions: [],
            // 筛选条件
            currentSide: 'attack',
            // attack, defense, both
            currentSite: 'all',
            // all, A, B, C
            currentHero: 'all',
            // all, 或具体heroId

            // 筛选选项
            sides: [
                {
                    key: 'attack',
                    name: '进攻方',
                    icon: '⚔️',
                    color: '#FF4654'
                },
                {
                    key: 'defense',
                    name: '防守方',
                    icon: '🛡️',
                    color: '#4ECDC4'
                },
                {
                    key: 'both',
                    name: '通用',
                    icon: '🔄',
                    color: '#FFA07A'
                }
            ],
            sites: [],
            // 动态生成，根据地图的sites字段
            heroes: [],
            // 该地图有点位的英雄列表

            // 交互状态
            loading: true,
            loadingPositions: false,
            showFilter: false,
            selectedPosition: null,
            // 地图交互
            mapScale: 1,
            mapX: 0,
            mapY: 0,
            // 系统信息
            systemInfo: {},
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

        // 获取地图ID
        const mapId = options.id;
        if (!mapId) {
            this.showError('地图ID参数缺失');
            return;
        }
        this.setData({
            mapId
        });

        // 加载地图详情
        this.loadMapDetail();
    },
    // 页面分享
    onShareAppMessage() {
        return this.shareMap();
    },
    // 分享到朋友圈
    onShareTimeline() {
        const { mapInfo } = this;
        return {
            title: `${mapInfo.mapName} - Valorant地图攻略`,
            query: `id=${mapInfo.id}&source=timeline`
        };
    },
    methods: {
        // 加载地图详情
        async loadMapDetail() {
            this.setData({
                loading: true,
                error: false
            });
            try {
                // 调用API获取地图详情
                const res = await mapAPI.getMapDetail(this.mapId);
                console.log('地图详情API返回:', res);
                if (res.success && res.data) {
                    console.log('API返回的完整数据结构:', res.data);

                    // 根据实际API返回的数据结构调整
                    const { map, positionCount, positionStats, popularHeroes } = res.data;

                    // 处理地图信息（使用图片处理工具）
                    const processedMap = handleMapImages(map);

                    // 处理统计信息 - 如果API没有返回positionStats，则构造一个
                    const stats = positionStats || {
                        total: positionCount || 0,
                        attack: Math.floor((positionCount || 0) / 2),
                        defense: Math.ceil((positionCount || 0) / 2),
                        bySite: {}
                    };

                    // 处理热门英雄列表 - 如果API没有返回，则设为空数组
                    const processedHeroes = popularHeroes
                        ? popularHeroes.map((hero) => ({
                              ...hero,
                              avatar: handleImageUrl(hero.avatar, getDefaultImage('hero'))
                          }))
                        : [];

                    // 生成站点选项
                    const sites = this.generateSiteOptions(map.sites);

                    // 生成英雄选项 - 如果没有热门英雄数据，先用空数组
                    const heroes = this.generateHeroOptions(processedHeroes);
                    this.setData({
                        mapInfo: processedMap,
                        positionStats: stats,
                        popularHeroes: processedHeroes,
                        sites,
                        heroes
                    });
                    console.log('处理后的地图信息:', processedMap);
                    console.log('处理后的统计信息:', stats);

                    // 更新页面标题
                    uni.setNavigationBarTitle({
                        title: processedMap.mapName || '地图详情'
                    });

                    // 加载点位数据
                    await this.loadPositions();

                    // 添加到最近查看
                    this.addToRecentViews(processedMap);
                } else {
                    this.showError(res.message || '获取地图详情失败');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载地图详情失败:', error);
                this.showError('网络请求失败，请稍后重试');
            } finally {
                this.setData({
                    loading: false
                });
            }
        },

        // 加载点位数据
        async loadPositions() {
            this.setData({
                loadingPositions: true
            });
            try {
                const { mapId, currentSide, currentHero } = this;
                console.log('加载点位参数:', {
                    mapId,
                    currentSide,
                    currentHero
                });

                // 构建请求参数
                const params = {
                    mapId,
                    side: currentSide === 'both' ? undefined : currentSide
                };
                if (currentHero !== 'all') {
                    params.heroId = currentHero;
                }
                console.log('点位请求参数:', params);
                const res = await positionAPI.filterPositions(params);
                console.log('点位API返回:', res);
                if (res.success && res.data) {
                    // 处理点位数据（使用图片处理工具）
                    const processedPositions = handlePositionList(res.data).map((position) => ({
                        ...position,
                        typeColor: this.getPositionTypeColor(position.positionType),
                        difficultyStars: this.generateStars(position.difficulty || 1)
                    }));
                    console.log('处理后的点位数据:', processedPositions);
                    this.setData({
                        positions: processedPositions
                    });

                    // 应用当前筛选条件
                    this.filterPositions();
                } else {
                    console.warn('点位API返回失败:', res);
                    // 如果API失败，设置空数组避免错误
                    this.setData({
                        positions: []
                    });
                    this.filterPositions();
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载点位数据失败:', error);

                // 设置空数组避免页面崩溃
                this.setData({
                    positions: []
                });
                this.filterPositions();
                uni.showToast({
                    title: '加载点位失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    loadingPositions: false
                });
            }
        },

        // 切换攻防方
        switchSide(e) {
            const side = e.currentTarget.dataset.side;
            if (side === this.currentSide) {
                return;
            }
            this.setData({
                currentSide: side
            });
            this.loadPositions();

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 切换站点
        switchSite(e) {
            const site = e.currentTarget.dataset.site;
            if (site === this.currentSite) {
                return;
            }
            this.setData({
                currentSite: site
            });
            this.filterPositions();

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 切换英雄
        switchHero(e) {
            const hero = e.currentTarget.dataset.hero;
            if (hero === this.currentHero) {
                return;
            }
            this.setData({
                currentHero: hero
            });
            this.loadPositions();

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 筛选点位
        filterPositions() {
            const { positions, currentSite } = this;
            if (currentSite === 'all') {
                this.setData({
                    filteredPositions: positions
                });
            } else {
                const filtered = positions.filter((position) => position.site === currentSite);
                this.setData({
                    filteredPositions: filtered
                });
            }
        },

        // 显示/隐藏筛选器
        toggleFilter() {
            this.setData({
                showFilter: !this.showFilter
            });
        },

        // 查看点位详情
        viewPositionDetail(e) {
            const positionId = e.currentTarget.dataset.id;
            const position = e.currentTarget.dataset.position;

            // 跳转到点位详情页（如果有的话）
            // wx.navigateTo({
            //   url: `/pages/position/detail/detail?id=${positionId}`
            // })

            // 或者显示在当前页面的弹窗中
            this.setData({
                selectedPosition: position
            });
        },

        // 关闭点位详情
        closePositionDetail() {
            this.setData({
                selectedPosition: null
            });
        },

        // 地图缩放
        onMapScale(e) {
            const { scale } = e.detail;
            this.setData({
                mapScale: scale
            });
        },

        // 地图移动
        onMapMove(e) {
            const { x, y } = e.detail;
            this.setData({
                mapX: x,
                mapY: y
            });
        },

        // 重置地图视图
        resetMapView() {
            this.setData({
                mapScale: 1,
                mapX: 0,
                mapY: 0
            });
        },

        // 添加到收藏
        addToFavorites() {
            // TODO: 实现收藏功能
            uni.showToast({
                title: '收藏成功',
                icon: 'success'
            });
        },

        // 分享地图
        shareMap() {
            const { mapInfo } = this;
            return {
                title: `${mapInfo.mapName} - 地图详情`,
                path: `/pages/map/detail/detail?id=${mapInfo.id}`,
                imageUrl: mapInfo.overview || mapInfo.minimap
            };
        },

        // 添加到最近查看
        addToRecentViews(mapInfo) {
            try {
                let recentViews = uni.getStorageSync('recentViews') || [];
                const newView = {
                    type: 'map',
                    id: mapInfo.id,
                    name: mapInfo.mapName,
                    image: mapInfo.minimap,
                    time: Date.now()
                };

                // 移除已存在的相同记录
                recentViews = recentViews.filter((item) => !(item.type === 'map' && item.id === mapInfo.id));

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
            this.loadMapDetail();
        },

        // 返回上一页
        goBack() {
            uni.navigateBack();
        },

        // 工具方法：生成站点选项
        generateSiteOptions(sitesString) {
            console.log('生成站点选项，输入:', sitesString);
            if (!sitesString) {
                console.log('站点字符串为空，返回默认选项');
                return [
                    {
                        key: 'all',
                        name: '全部站点',
                        color: '#999'
                    }
                ];
            }
            const allOption = {
                key: 'all',
                name: '全部站点',
                color: '#999'
            };
            const siteOptions = sitesString.split(',').map((site) => ({
                key: site.trim(),
                name: `${site.trim()}点`,
                color: this.getSiteColor(site.trim())
            }));
            const result = [allOption, ...siteOptions];
            console.log('生成的站点选项:', result);
            return result;
        },

        // 工具方法：生成英雄选项
        generateHeroOptions(popularHeroes) {
            console.log('生成英雄选项，输入:', popularHeroes);
            const allOption = {
                key: 'all',
                name: '全部英雄',
                avatar: getDefaultImage('hero')
            };
            if (!popularHeroes || popularHeroes.length === 0) {
                console.log('热门英雄为空，只返回全部选项');
                return [allOption];
            }
            const heroOptions = popularHeroes.map((hero) => ({
                key: hero.heroId ? hero.heroId.toString() : hero.id ? hero.id.toString() : 'unknown',
                name: hero.heroName || hero.name || '未知英雄',
                avatar: handleImageUrl(hero.avatar, getDefaultImage('hero'))
            }));
            const result = [allOption, ...heroOptions];
            console.log('生成的英雄选项:', result);
            return result;
        },

        // 工具方法：获取站点颜色
        getSiteColor(site) {
            const colorMap = {
                A: '#FF6B6B',
                B: '#4ECDC4',
                C: '#45B7D1'
            };
            return colorMap[site] || '#999';
        },

        // 工具方法：获取点位类型颜色
        getPositionTypeColor(type) {
            const colorMap = {
                smoke: '#9E9E9E',
                flash: '#FFC107',
                molly: '#FF5722',
                wall: '#2196F3',
                orb: '#9C27B0',
                trap: '#795548',
                general: '#607D8B'
            };
            return colorMap[type] || '#999';
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
        }
    }
};
</script>
<style>
/* pages/map/detail/detail.wxss */

.map-detail-page {
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

/* 地图信息区域 */
.map-info-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 32rpx;
    backdrop-filter: blur(10px);
}

.map-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
}

.map-title-area {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.map-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #ff4654;
    line-height: 1.2;
}

.map-key {
    font-size: 24rpx;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 2rpx;
}

.action-buttons {
    display: flex;
    gap: 16rpx;
    width: 150px;
}

.action-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
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

.map-description {
    color: #cccccc;
    font-size: 28rpx;
    line-height: 1.6;
    margin-bottom: 24rpx;
}

.map-stats {
    display: flex;
    gap: 16rpx;
}

.stat-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16rpx;
    padding: 24rpx;
    text-align: center;
    border: 2rpx solid rgba(255, 70, 84, 0.3);
}

.stat-number {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #ff4654;
    margin-bottom: 8rpx;
}

.stat-label {
    font-size: 24rpx;
    color: #999;
}

/* 交互式地图区域 */
.interactive-map-section {
    margin-bottom: 32rpx;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
}

.section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ececec;
}

.reset-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #ececec;
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    border-radius: 8rpx;
    padding: 12rpx 20rpx;
    font-size: 24rpx;
}

.map-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    overflow: hidden;
    position: relative;
}

.map-movable-area {
    width: 100%;
    height: 500rpx;
    background: #000;
}

.map-movable-view {
    width: 100%;
    height: 100%;
}

.map-overview {
    width: 100%;
    min-height: 100%;
}

.position-markers {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.position-marker {
    position: absolute;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid white;
    pointer-events: auto;
    cursor: pointer;
}

.marker-text {
    color: white;
    font-size: 20rpx;
    font-weight: bold;
}

.map-controls-tip {
    position: absolute;
    bottom: 16rpx;
    right: 16rpx;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    backdrop-filter: blur(8px);
}

/* 筛选器区域 */
.filter-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    margin-bottom: 32rpx;
    overflow: hidden;
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 32rpx;
    cursor: pointer;
    border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.filter-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #ececec;
}

.filter-toggle {
    font-size: 24rpx;
    color: #999;
}

.filter-content {
    padding: 32rpx;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.filter-group {
    margin-bottom: 32rpx;
}

.filter-group:last-child {
    margin-bottom: 0;
}

.filter-label {
    display: block;
    font-size: 26rpx;
    color: #cccccc;
    margin-bottom: 16rpx;
}

.filter-tabs {
    display: flex;
    gap: 12rpx;
    flex-wrap: wrap;
}

.filter-tab {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.filter-tab.active {
    transform: translateY(-2rpx);
}

.tab-icon {
    font-size: 20rpx;
}

.tab-text {
    font-size: 24rpx;
    color: #ececec;
}

/* 英雄筛选滚动 */
.hero-filter-scroll {
    white-space: nowrap;
    overflow-x: auto;
}

.hero-filter-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx;
    margin-right: 16rpx;
    border-radius: 12rpx;
    background: rgba(255, 255, 255, 0.1);
    border: 2rpx solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120rpx;
}

.hero-filter-item.active {
    background: rgba(255, 70, 84, 0.2);
    border-color: #ff4654;
    transform: translateY(-4rpx);
}

.hero-avatar-small {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: #2a2d31;
}

.hero-name-small {
    font-size: 22rpx;
    color: #ececec;
    text-align: center;
    white-space: nowrap;
}

/* 点位列表区域 */
.positions-section {
    margin-bottom: 32rpx;
}

.position-count {
    font-size: 24rpx;
    color: #999;
    font-weight: normal;
}

.loading-positions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 80rpx 0;
    color: #999;
    font-size: 26rpx;
}

.positions-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.position-item {
    display: flex;
    gap: 20rpx;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    padding: 24rpx;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2rpx solid transparent;
}

.position-item:active {
    transform: translateY(2rpx);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 70, 84, 0.3);
}

.position-image-container {
    flex: 0 0 120rpx;
    position: relative;
}

.position-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: #2a2d31;
}

.position-type-badge {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    color: white;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    font-weight: bold;
}

.position-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.position-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16rpx;
}

.position-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #ececec;
    flex: 1;
    line-height: 1.3;
}

.position-site {
    color: white;
    padding: 6rpx 12rpx;
    border-radius: 12rpx;
    font-size: 20rpx;
    font-weight: bold;
    min-width: 48rpx;
    text-align: center;
}

.position-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.difficulty-stars {
    display: flex;
    gap: 2rpx;
}

.star {
    font-size: 24rpx;
    color: #3c4043;
}

.star.filled {
    color: #ffd700;
}

.view-count {
    font-size: 22rpx;
    color: #999;
}

.position-description {
    color: #cccccc;
    font-size: 26rpx;
    line-height: 1.4;
}

.position-tags {
    display: flex;
    gap: 8rpx;
    flex-wrap: wrap;
}

.tag {
    background: rgba(255, 70, 84, 0.2);
    color: #ff4654;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
    font-size: 20rpx;
    border: 1rpx solid rgba(255, 70, 84, 0.3);
}

/* 空状态 */
.empty-positions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 120rpx 60rpx;
    gap: 16rpx;
}

.empty-icon {
    font-size: 100rpx;
    opacity: 0.5;
}

.empty-text {
    font-size: 32rpx;
    color: #999;
}

.empty-tip {
    font-size: 24rpx;
    color: #666;
}

/* 热门英雄区域 */
.popular-heroes-section {
    margin-bottom: 32rpx;
}

.heroes-scroll {
    white-space: nowrap;
    overflow-x: auto;
    padding: 16rpx 0;
}

.hero-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx;
    margin-right: 20rpx;
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140rpx;
}

.hero-item:active {
    transform: translateY(-4rpx);
    background: rgba(255, 255, 255, 0.1);
}

.hero-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: #2a2d31;
}

.hero-name {
    font-size: 26rpx;
    color: #ececec;
    text-align: center;
}

.position-count {
    font-size: 22rpx;
    color: #999;
    text-align: center;
}

/* 点位详情弹窗 */
.position-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 40rpx;
}

.modal-content {
    background: #1e2328;
    border-radius: 24rpx;
    max-width: 600rpx;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
}

.modal-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #ececec;
}

.modal-close {
    font-size: 40rpx;
    color: #999;
    cursor: pointer;
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-body {
    padding: 32rpx;
}

.modal-image {
    width: 100%;
    height: 300rpx;
    border-radius: 12rpx;
    background: #2a2d31;
    margin-bottom: 24rpx;
}

.modal-description {
    color: #cccccc;
    font-size: 28rpx;
    line-height: 1.6;
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
    .map-header {
        flex-direction: column;
        gap: 20rpx;
        align-items: flex-start;
    }

    .map-stats {
        flex-direction: column;
    }

    .position-item {
        flex-direction: column;
    }

    .position-image-container {
        flex: none;
        align-self: center;
    }

    .filter-tabs {
        justify-content: space-between;
    }

    .filter-tab {
        flex: 1;
        justify-content: center;
    }
}
</style>
