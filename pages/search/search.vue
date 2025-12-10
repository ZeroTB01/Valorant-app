<template>
    <!-- pages/search/search.wxml -->
    <view class="create-page">
        <!-- 顶部导航栏 -->
        <!-- <view class="page-header">
            <view class="header-left">
                <text class="back-btn" @tap="goBack">
                    {{ currentStep === 'map' ? '✕' : '←' }}
                </text>
            </view>

            <view class="header-center">
                <text class="page-title">攻略快查</text>
            </view>

            <view class="header-right">
                <text class="reset-btn" @tap="resetFilter" v-if="selectedMap">重置</text>
            </view>
        </view> -->

        <!-- 进度指示器 -->
        <view class="progress-indicator">
            <!-- 第一步：选择地图 -->
            <view 
                :class="'step-item ' + (currentStep === 'map' ? 'active' : selectedMap ? 'completed' : '')"
                @tap="goToStep('map')"
            >
                <view class="step-circle">1</view>
                <text class="step-text">选择地图</text>
            </view>

            <view :class="'step-line ' + (selectedMap ? 'active' : '')"></view>

            <!-- 第二步：选择英雄 -->
            <view 
                :class="'step-item ' + (currentStep === 'hero' ? 'active' : selectedHero ? 'completed' : '')"
                @tap="goToStep('hero')"
                :style="selectedMap ? '' : 'opacity: 0.5; cursor: not-allowed;'"
            >
                <view class="step-circle">2</view>
                <text class="step-text">选择英雄</text>
            </view>

            <view :class="'step-line ' + (selectedHero ? 'active' : '')"></view>

            <!-- 第三步：查看点位 -->
            <view 
                :class="'step-item ' + (currentStep === 'position' ? 'active' : '')"
                @tap="goToStep('position')"
                :style="selectedHero ? '' : 'opacity: 0.5; cursor: not-allowed;'"
            >
                <view class="step-circle">3</view>
                <text class="step-text">查看点位</text>
            </view>
        </view>

        <!-- 当前选择显示 -->
        <view class="current-selection" v-if="selectedMap || selectedHero">
            <view class="selection-item" v-if="selectedMap">
                <text class="selection-label">地图：</text>
                <text class="selection-value">{{ selectedMap.mapName }}</text>
            </view>

            <view class="selection-item" v-if="selectedHero">
                <text class="selection-label">英雄：</text>
                <text class="selection-value">{{ selectedHero.heroName }}</text>
            </view>

            <view class="selection-item" v-if="selectedSide">
                <text class="selection-label">攻防：</text>
                <text class="selection-value">{{ selectedSide === 'attack' ? '进攻方' : '防守方' }}</text>
            </view>
        </view>

        <!-- 错误提示 -->
        <view class="error-banner" v-if="error" @tap="hideError">
            <text class="error-icon">⚠️</text>
            <text class="error-text">{{ errorMessage }}</text>
            <text class="error-close">✕</text>
        </view>

        <!-- 主要内容区域 -->
        <view class="main-content">
            <!-- 骨架屏 -->
            <view class="skeleton-container" v-if="showSkeleton">
                <view class="skeleton-grid">
                    <view class="skeleton-item" v-for="(item, index) in 6" :key="index">
                        <view class="skeleton-image"></view>

                        <view class="skeleton-text"></view>
                    </view>
                </view>
            </view>

            <!-- 第一步：地图选择 -->
            <view class="map-selection" v-if="currentStep === 'map' && !showSkeleton">
                <view class="section-title">
                    <text>选择地图</text>
                    <text class="count-badge" v-if="mapList.length > 0">{{ mapList.length }}</text>
                </view>

                <!-- 地图网格 -->
                <view class="map-grid">
                    <view class="map-item" @tap="selectMap" :data-index="index" v-for="(item, index) in mapList" :key="index">
                        <view class="map-image-wrapper">
                            <image class="map-image" :src="item.minimapUrl" mode="aspectFill" lazy-load />
                            <view class="map-overlay">
                                <text class="map-name">{{ item.mapName }}</text>
                                <text class="map-key">{{ item.mapKey }}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 加载中 -->
                <view class="loading-indicator" v-if="loading.map">
                    <view class="loading-spinner"></view>
                    <text>加载地图中...</text>
                </view>
            </view>

            <!-- 第二步：英雄选择 -->
            <view class="hero-selection" v-if="currentStep === 'hero'">
                <view class="section-title">
                    <text>选择英雄</text>
                    <text class="count-badge" v-if="heroList.length > 0">{{ heroList.length }}</text>
                </view>

                <!-- 定位筛选标签 -->
                <view class="hero-type-filter" v-if="!loading.hero">
                    <view 
                        :class="'filter-tag ' + (currentHeroTypeFilter === 'all' ? 'active' : '')"
                        @tap="filterHeroByType"
                        :data-type="'all'"
                    >
                        全部
                    </view>
                    <view 
                        v-for="heroType in heroTypes"
                        :key="heroType.key"
                        :class="'filter-tag ' + heroType.key + ' ' + (currentHeroTypeFilter === heroType.key ? 'active' : '')"
                        @tap="filterHeroByType"
                        :data-type="heroType.key"
                    >
                        {{ heroType.name }}
                    </view>
                </view>

                <!-- 英雄网格 -->
                <view class="hero-grid-by-type" v-if="!loading.hero && filteredHeroListByType.length > 0">
                    <view 
                        class="hero-item-compact" 
                        @tap="selectHero" 
                        :data-index="getHeroIndexByTypeAndId('', item.id)" 
                        v-for="item in filteredHeroListByType" 
                        :key="item.id"
                    >
                        <view class="hero-image-wrapper-compact">
                            <image class="hero-image-compact" :src="item.avatar" mode="aspectFit" lazy-load />
                        </view>
                        <text class="hero-name-compact">{{ item.heroName }}</text>
                    </view>
                </view>

                <!-- 空状态 -->
                <view class="empty-state" v-if="!loading.hero && filteredHeroListByType.length === 0">
                    <text class="empty-text">暂无该定位的英雄</text>
                </view>

                <!-- 加载中 -->
                <view class="loading-indicator" v-if="loading.hero">
                    <view class="loading-spinner"></view>
                    <text>加载英雄中...</text>
                </view>
            </view>

            <!-- 第三步：点位列表 -->
            <view class="position-selection" v-if="currentStep === 'position'">
                <!-- 攻防方选择器 -->
                <view class="side-selector">
                    <view class="section-title">
                        <text>选择攻防方</text>
                        <text class="optional-label">(可选)</text>
                    </view>

                    <view class="side-options">
                        <view
                            :class="'side-option ' + (selectedSide === item.key ? 'active' : '')"
                            :style="'border-color: ' + item.color + '; ' + (selectedSide === item.key ? 'background-color: ' + item.color + '20;' : '')"
                            @tap="selectSide"
                            :data-side="item.key"
                            v-for="(item, index) in sideOptions"
                            :key="index"
                        >
                            <!-- <text class="side-icon">{{ item.icon }}</text> -->

                            <text class="side-name">{{ item.name }}</text>
                        </view>
                    </view>
                </view>

                <!-- 点位列表 -->
                <view class="position-list-section">
                    <view class="section-title">
                        <text>点位列表</text>
                        <text class="count-badge" v-if="positionList.length > 0">{{ positionList.length }}</text>
                    </view>

                    <!-- 加载中 -->
                    <view class="loading-indicator" v-if="loading.position">
                        <view class="loading-spinner"></view>
                        <text>加载点位中...</text>
                    </view>

                    <!-- 点位列表 -->
                    <view class="position-list" v-if="!loading.position">
                        <view class="position-item" @tap="goToPositionDetail" :data-index="index" v-for="(item, index) in positionList" :key="index">
                            <!-- 点位图片 -->

                            <view class="position-image-container">
                                <image class="position-image" :src="item.setupImage" mode="aspectFill" lazy-load />

                                <!-- 点位类型标签 -->
                                <view class="position-type-badge" :style="'background-color: ' + item.typeColor + ';'">
                                    {{ item.positionType }}
                                </view>

                                <!-- 攻防方标签 -->
                                <view class="position-side-badge" :style="'background-color: ' + item.sideColor + ';'">
                                    {{ item.sideLabel }}
                                </view>
                            </view>

                            <!-- 点位信息 -->

                            <view class="position-info">
                                <view class="position-header">
                                    <text class="position-name">{{ item.positionName }}</text>
                                    <view class="position-site" :style="'background-color: ' + (item.site === 'A' ? '#FF6B6B' : item.site === 'B' ? '#4ECDC4' : '#45B7D1') + ';'">
                                        {{ item.site }}点
                                    </view>
                                </view>

                                <view class="position-meta">
                                    <view class="difficulty-stars">
                                        <text :class="'star ' + (star.filled ? 'filled' : '')" v-for="(star, index1) in item.difficultyStars" :key="index1">★</text>
                                    </view>
                                    <text class="view-count">{{ item.viewCount || 0 }}次观看</text>
                                </view>

                                <view class="position-description">
                                    <text>{{ item.description }}</text>
                                </view>

                                <!-- 标签 -->
                                <view class="position-tags" v-if="item.tags && item.tags.length > 0">
                                    <text class="tag" v-for="(item, index1) in item.tags" :key="index1">#{{ item }}</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 空状态 -->
                    <view class="empty-positions" v-if="!loading.position && positionList.length === 0">
                        <text class="empty-icon">📍</text>
                        <text class="empty-text">暂无符合条件的点位</text>
                        <text class="empty-tip">试试选择其他英雄或调整攻防方</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 底部提示 -->
        <!-- <view class="bottom-tips" wx:if="{{currentStep === 'map'}}">
    <text class="tip-text">💡 选择地图开始您的点位发现之旅</text>
  </view>
  
  <view class="bottom-tips" wx:if="{{currentStep === 'hero'}}">
    <text class="tip-text">🦸 选择您想学习的英雄</text>
  </view>
  
  <view class="bottom-tips" wx:if="{{currentStep === 'position'}}">
    <text class="tip-text">🎯 点击点位查看详细教学</text>
  </view> -->
    </view>
</template>

<script>
// pages/search/search.js
const app = getApp();
const { mapAPI, heroAPI, positionAPI } = require('../../utils/api');
const { handleMapList, handleHeroList, handlePositionList, handleImageUrl, getDefaultImage } = require('../../utils/image');
export default {
    data() {
        return {
            // 当前步骤：map -> hero -> position
            currentStep: 'map',

            // map, hero, position

            // 选择的筛选条件
            selectedMap: null,

            selectedHero: null,
            selectedSide: null,

            // attack, defense, null(全部)

            // 各级数据
            mapList: [],

            heroList: [],
            filteredHeroListByType: [],
            currentHeroTypeFilter: 'all',
            positionList: [],

            // 英雄定位类型
            heroTypes: [
                { key: 'duelist', name: '决斗者' },
                { key: 'sentinel', name: '哨卫' },
                { key: 'controller', name: '控场者' },
                { key: 'initiator', name: '先锋' }
            ],

            // 加载状态
            loading: {
                map: false,
                hero: false,
                position: false
            },

            // 攻防选项
            sideOptions: [
                {
                    key: 'attack',
                    name: '进攻',
                    icon: '⚔️',
                    color: '#FF4654'
                },
                {
                    key: 'defense',
                    name: '防守',
                    icon: '🛡️',
                    color: '#4ECDC4'
                }
            ],

            // 页面状态
            showSkeleton: true,

            error: false,
            errorMessage: '',

            // 系统信息
            systemInfo: {},

            star: {
                filled: false
            }
        };
    },
    onLoad() {
        // 获取系统信息
        this.setData({
            systemInfo: app.globalData.getSystemInfo()
        });

        // 初始化加载地图列表
        this.loadMapList();
    },
    onShow() {
        // 页面显示时可以刷新数据
        console.log('创建页面显示，当前步骤:', this.currentStep);
    },
    // ========== 页面生命周期 ==========

    // 下拉刷新
    async onPullDownRefresh() {
        console.log('🔄 下拉刷新');
        const { currentStep } = this;
        try {
            switch (currentStep) {
                case 'map':
                    await this.loadMapList();
                    break;
                case 'hero':
                    await this.loadHeroList();
                    break;
                case 'position':
                    await this.loadPositionList();
                    break;
            }
        } finally {
            uni.stopPullDownRefresh();
        }
    },
    // 页面分享
    onShareAppMessage() {
        const { selectedMap, selectedHero } = this;
        let title = 'Valorant 点位创建工具';
        let path = '/pages/create/create';
        if (selectedMap && selectedHero) {
            title = `${selectedMap.mapName} - ${selectedHero.heroName} 点位攻略`;
        } else if (selectedMap) {
            title = `${selectedMap.mapName} 地图攻略`;
        }
        return {
            title,
            path,
            imageUrl: selectedMap?.minimap || '/static/assets/images/share-cover.png'
        };
    },
    // 分享到朋友圈
    onShareTimeline() {
        return {
            title: 'Valorant 点位创建工具 - 三级筛选找点位',
            query: 'source=timeline'
        };
    },
    methods: {
        // ========== 数据加载方法 ==========

        // 加载地图列表
        async loadMapList() {
            if (this.loading.map) {
                return;
            }
            this.setData({
                'loading.map': true,
                showSkeleton: true,
                error: false
            });
            try {
                console.log('🔄 加载地图列表...');
                const res = await mapAPI.getMapList();
                if (res.success && res.data) {
                    // 处理地图列表图片
                    const processedMaps = handleMapList(res.data);
                    this.setData({
                        mapList: processedMaps,
                        currentStep: 'map'
                    });
                    console.log('✅ 地图列表加载成功:', processedMaps.length + '个地图');
                } else {
                    this.showError(res.message || '加载地图列表失败');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 加载地图列表失败:', error);
                this.showError('网络请求失败，请稍后重试');
            } finally {
                this.setData({
                    'loading.map': false,
                    showSkeleton: false
                });
            }
        },

        // 加载英雄列表
        async loadHeroList() {
            if (this.loading.hero) {
                return;
            }
            this.setData({
                'loading.hero': true
            });
            try {
                console.log('🔄 加载英雄列表...');
                const res = await heroAPI.getHeroList();
                if (res.success && res.data) {
                    // 处理英雄列表图片
                    const processedHeroes = handleHeroList(res.data).map((hero) => ({
                        ...hero,
                        typeLabel: this.getHeroTypeLabel(hero.heroType),
                        typeClass: `hero-type-${hero.heroType}`
                    }));
                    this.setData({
                        heroList: processedHeroes,
                        currentHeroTypeFilter: 'all',
                        filteredHeroListByType: processedHeroes,
                        currentStep: 'hero'
                    });
                    console.log('✅ 英雄列表加载成功:', processedHeroes.length + '个英雄');
                } else {
                    this.showError(res.message || '加载英雄列表失败');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 加载英雄列表失败:', error);
                this.showError('网络请求失败，请稍后重试');
            } finally {
                this.setData({
                    'loading.hero': false
                });
            }
        },

        // 加载点位列表
        async loadPositionList() {
            if (this.loading.position) {
                return;
            }
            this.setData({
                'loading.position': true
            });
            try {
                const { selectedMap, selectedHero, selectedSide } = this;
                console.log('🔄 加载点位列表...', {
                    mapId: selectedMap?.id,
                    heroId: selectedHero?.id,
                    side: selectedSide
                });

                // 构建请求参数
                const params = {
                    mapId: selectedMap.id,
                    heroId: selectedHero.id
                };

                // 如果选择了攻防方，添加到参数中
                if (selectedSide) {
                    params.side = selectedSide;
                }
                const res = await positionAPI.filterPositions(params);
                if (res.success && res.data) {
                    // 处理点位列表图片
                    const processedPositions = handlePositionList(res.data).map((position) => ({
                        ...position,
                        typeColor: this.getPositionTypeColor(position.positionType),
                        difficultyStars: this.generateStars(position.difficulty || 1),
                        sideLabel: this.getSideLabel(position.side),
                        sideColor: this.getSideColor(position.side)
                    }));
                    this.setData({
                        positionList: processedPositions,
                        currentStep: 'position'
                    });
                    console.log('✅ 点位列表加载成功:', processedPositions.length + '个点位');
                } else {
                    // 如果没有数据，显示空列表而不是错误
                    this.setData({
                        positionList: [],
                        currentStep: 'position'
                    });
                    console.log('⚠️ 暂无符合条件的点位');
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('❌ 加载点位列表失败:', error);
                // 点位加载失败时显示空列表
                this.setData({
                    positionList: [],
                    currentStep: 'position'
                });
                uni.showToast({
                    title: '加载点位失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    'loading.position': false
                });
            }
        },

        // ========== 选择操作方法 ==========

        // 选择地图
        selectMap(e) {
            const mapIndex = e.currentTarget.dataset.index;
            const map = this.mapList[mapIndex];
            if (!map) {
                return;
            }
            console.log('📍 选择地图:', map.mapName);
            this.setData({
                selectedMap: map,
                selectedHero: null,
                selectedSide: null,
                heroList: [],
                positionList: []
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });

            // 加载英雄列表
            this.loadHeroList();
        },

        // 选择英雄
        selectHero(e) {
            const heroIndex = e.currentTarget.dataset.index;
            const hero = this.heroList[heroIndex];
            if (!hero) {
                return;
            }
            console.log('🦸 选择英雄:', hero.heroName);
            this.setData({
                selectedHero: hero,
                selectedSide: null,
                positionList: []
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });

            // 加载点位列表
            this.loadPositionList();
        },

        // 定位筛选
        filterHeroByType(e) {
            const typeKey = e.currentTarget.dataset.type;
            console.log('🎯 筛选英雄定位:', typeKey);
            
            let filteredList = this.heroList;
            if (typeKey !== 'all') {
                filteredList = this.heroList.filter(hero => hero.heroType === typeKey);
            }
            
            this.setData({
                currentHeroTypeFilter: typeKey,
                filteredHeroListByType: filteredList
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 选择攻防方
        selectSide(e) {
            const side = e.currentTarget.dataset.side;
            console.log('⚔️ 选择攻防方:', side);

            // 如果点击的是当前选中的攻防方，则取消选择
            const newSide = this.selectedSide === side ? null : side;
            this.setData({
                selectedSide: newSide
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });

            // 重新加载点位列表
            this.loadPositionList();
        },

        // 跳转到指定步骤
        goToStep(stepName) {
            console.log('📍 跳转到步骤:', stepName);

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });

            switch (stepName) {
                case 'map':
                    // 点击第一步，重置所有选择
                    this.setData({
                        currentStep: 'map',
                        selectedMap: null,
                        selectedHero: null,
                        selectedSide: null,
                        heroList: [],
                        positionList: [],
                        currentHeroTypeFilter: 'all',
                        filteredHeroListByType: []
                    });
                    break;

                case 'hero':
                    // 点击第二步，只有已选地图才能跳转
                    if (!this.selectedMap) {
                        uni.showToast({
                            title: '请先选择地图',
                            icon: 'none'
                        });
                        return;
                    }
                    // 重置英雄和点位选择
                    this.setData({
                        currentStep: 'hero',
                        selectedHero: null,
                        selectedSide: null,
                        positionList: [],
                        currentHeroTypeFilter: 'all',
                        filteredHeroListByType: this.heroList
                    });
                    break;

                case 'position':
                    // 点击第三步，只有已选英雄才能跳转
                    if (!this.selectedHero) {
                        uni.showToast({
                            title: '请先选择英雄',
                            icon: 'none'
                        });
                        return;
                    }
                    // 重置点位选择
                    this.setData({
                        currentStep: 'position',
                        selectedSide: null,
                        positionList: []
                    });
                    // 重新加载点位列表
                    this.loadPositionList();
                    break;
            }
        },

        // ========== 导航操作方法 ==========

        // 返回上一步
        goBack() {
            const { currentStep } = this;
            switch (currentStep) {
                case 'hero':
                    // 从英雄选择返回地图选择
                    this.setData({
                        currentStep: 'map',
                        selectedMap: null,
                        selectedHero: null,
                        selectedSide: null,
                        heroList: [],
                        positionList: []
                    });
                    break;
                case 'position':
                    // 从点位列表返回英雄选择
                    this.setData({
                        currentStep: 'hero',
                        selectedHero: null,
                        selectedSide: null,
                        positionList: []
                    });
                    break;
                default:
                    // 从地图选择退出页面
                    uni.navigateBack();
                    break;
            }

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 重置筛选
        resetFilter() {
            this.setData({
                currentStep: 'map',
                selectedMap: null,
                selectedHero: null,
                selectedSide: null,
                heroList: [],
                positionList: []
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'medium'
            });
            console.log('🔄 重置筛选条件');
        },

        // ========== 页面跳转方法 ==========

        // 跳转到内容列表
        goToPositionDetail(e) {
            const positionIndex = e.currentTarget.dataset.index;
            const position = this.positionList[positionIndex];
            if (!position) {
                return;
            }
            console.log('📍 跳转到内容列表:', position.positionName);

            // 跳转到内容列表页，传递筛选条件
            const params = {
                mapId: this.selectedMap.id,
                mapName: this.selectedMap.name,
                heroId: this.selectedHero.id,
                heroName: this.selectedHero.name,
                positionId: position.id,
                positionName: position.positionName
            };
            
            // 构建查询字符串
            const queryString = Object.entries(params)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');

            uni.navigateTo({
                url: `/pages/content/list/list?${queryString}`
            });
        },

        // ========== 工具方法 ==========

        // 显示错误信息
        showError(message) {
            this.setData({
                error: true,
                errorMessage: message
            });
        },

        // 隐藏错误信息
        hideError() {
            this.setData({
                error: false,
                errorMessage: ''
            });
        },

        // 添加到最近查看
        addToRecentViews(position) {
            try {
                let recentViews = uni.getStorageSync('recentViews') || [];
                const newView = {
                    type: 'position',
                    id: position.id,
                    name: position.positionName,
                    image: position.setupImage,
                    time: Date.now()
                };

                // 移除已存在的相同记录
                recentViews = recentViews.filter((item) => !(item.type === 'position' && item.id === position.id));

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

        // 获取英雄类型标签
        getHeroTypeLabel(type) {
            const typeMap = {
                duelist: '决斗者',
                sentinel: '哨卫',
                controller: '控场者',
                initiator: '先锋'
            };
            return typeMap[type] || type;
        },

        // 获取点位类型颜色
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

        // 获取攻防方标签
        getSideLabel(side) {
            const sideMap = {
                attack: '进攻',
                defense: '防守',
                both: '通用'
            };
            return sideMap[side] || side;
        },

        // 获取攻防方颜色
        getSideColor(side) {
            const colorMap = {
                attack: '#FF4654',
                defense: '#4ECDC4',
                both: '#FFA07A'
            };
            return colorMap[side] || '#999';
        },

        // 生成难度星级
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

        // 按定位获取英雄列表
        getHeroesByType(typeKey) {
            return this.heroList.filter(hero => hero.heroType === typeKey);
        },

        // 获取定位下的英雄数量
        getHeroCountByType(typeKey) {
            return this.getHeroesByType(typeKey).length;
        },

        // 获取英雄在原列表中的索引（用于选择时定位）
        getHeroIndexByTypeAndId(typeKey, heroId) {
            return this.heroList.findIndex(hero => hero.id === heroId);
        }
    }
};
</script>
<style>
/* pages/search/search.wxss */

.create-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f1419 0%, #1e2328 100%);
    color: #ececec;
}

/* 顶部导航栏 */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 32rpx;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-left,
.header-right {
    width: 120rpx;
}

.back-btn {
    font-size: 40rpx;
    color: #ececec;
    padding: 16rpx;
    cursor: pointer;
    transition: color 0.3s ease;
}

.back-btn:active {
    color: #ff4654;
}

.header-center {
    flex: 1;
    text-align: center;
}

.page-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #ececec;
}

.reset-btn {
    font-size: 28rpx;
    color: #ff4654;
    padding: 16rpx;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.reset-btn:active {
    opacity: 0.7;
}

/* 进度指示器 */
.progress-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40rpx 32rpx;
    background: rgba(255, 255, 255, 0.05);
    margin: 0 32rpx;
    border-radius: 16rpx;
    margin-top: 24rpx;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 12rpx;
    border-radius: 12rpx;
}

.step-item:active {
    transform: scale(0.95);
}

.step-item:not([style*="opacity: 0.5"]):hover {
    transform: scale(1.05);
}

.step-circle {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 3rpx solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: bold;
    color: #999;
    transition: all 0.3s ease;
}

.step-item.active .step-circle {
    background: #ff4654;
    border-color: #ff4654;
    color: white;
    transform: scale(1.1);
}

.step-item.completed .step-circle {
    background: #4ecdc4;
    border-color: #4ecdc4;
    color: white;
}

.step-text {
    font-size: 24rpx;
    color: #999;
    transition: color 0.3s ease;
}

.step-item.active .step-text {
    color: #ff4654;
    font-weight: bold;
}

.step-item.completed .step-text {
    color: #4ecdc4;
}

.step-line {
    width: 80rpx;
    height: 4rpx;
    background: rgba(255, 255, 255, 0.2);
    margin: 0 20rpx;
    transition: background 0.3s ease;
}

.step-line.active {
    background: #4ecdc4;
}

/* 当前选择显示 */
.current-selection {
    background: rgba(255, 70, 84, 0.1);
    border: 2rpx solid rgba(255, 70, 84, 0.3);
    border-radius: 16rpx;
    padding: 24rpx 32rpx;
    margin: 24rpx 32rpx;
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.selection-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.selection-label {
    font-size: 26rpx;
    color: #999;
}

.selection-value {
    font-size: 26rpx;
    color: #ff4654;
    font-weight: bold;
}

/* 错误提示 */
.error-banner {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: rgba(255, 70, 84, 0.1);
    border: 2rpx solid #ff4654;
    border-radius: 12rpx;
    padding: 20rpx 24rpx;
    margin: 24rpx 32rpx;
    cursor: pointer;
}

.error-icon {
    font-size: 32rpx;
}

.error-text {
    flex: 1;
    font-size: 28rpx;
    color: #ff4654;
}

.error-close {
    font-size: 32rpx;
    color: #ff4654;
    opacity: 0.7;
}

/* 主要内容 */
.main-content {
    padding: 0 32rpx 120rpx 32rpx;
}

/* 骨架屏 */
.skeleton-container {
    margin-top: 32rpx;
}

.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
}

.skeleton-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16rpx;
    overflow: hidden;
}

.skeleton-image {
    width: 100%;
    height: 200rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400rpx 100%;
    animation: skeleton-loading 1.4s ease-in-out infinite;
}

.skeleton-text {
    height: 40rpx;
    margin: 16rpx;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
    background-size: 400rpx 100%;
    animation: skeleton-loading 1.4s ease-in-out infinite;
    border-radius: 8rpx;
}

@keyframes skeleton-loading {
    0% {
        background-position: -200rpx 0;
    }
    100% {
        background-position: calc(200rpx + 100%) 0;
    }
}

/* 通用区域标题 */
.section-title {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 32rpx;
    font-weight: bold;
    color: #ececec;
    margin-bottom: 24rpx;
    margin-top: 32rpx;
}

.count-badge {
    background: #ff4654;
    color: white;
    padding: 6rpx 12rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    font-weight: bold;
    min-width: 40rpx;
    text-align: center;
}

/* 地图选择 */
.map-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
}

.map-item {
    cursor: pointer;
    transition: transform 0.3s ease;
}

.map-item:active {
    transform: scale(0.98);
}

.map-image-wrapper {
    position: relative;
    border-radius: 16rpx;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
}

.map-image {
    width: 100%;
    height: 240rpx;
    background: #2a2d31;
}

.map-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    padding: 32rpx 20rpx 20rpx;
    color: white;
}

.map-name {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 4rpx;
}

.map-key {
    font-size: 22rpx;
    opacity: 0.8;
    text-transform: uppercase;
}

/* 英雄选择 */
.hero-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
}

.hero-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.hero-item:active {
    transform: scale(0.95);
}

/* 定位筛选标签 */
.hero-type-filter {
    display: flex;
    gap: 12rpx;
    margin-bottom: 24rpx;
    flex-wrap: wrap;
}

.filter-tag {
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    background: rgba(255, 255, 255, 0.08);
    color: #999;
    font-size: 22rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
}

.filter-tag.active {
    color: white;
    border-color: #ff4654;
    background: rgba(255, 70, 84, 0.2);
}

.filter-tag.duelist.active {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.2);
}

.filter-tag.sentinel.active {
    border-color: #4ecdc4;
    background: rgba(78, 205, 196, 0.2);
}

.filter-tag.controller.active {
    border-color: #45b7d1;
    background: rgba(69, 183, 209, 0.2);
}

.filter-tag.initiator.active {
    border-color: #ffa07a;
    background: rgba(255, 160, 122, 0.2);
}

/* 英雄网格 */
.hero-grid-by-type {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12rpx;
    margin-bottom: 24rpx;
}

.hero-item-compact {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.hero-item-compact:active {
    transform: scale(0.95);
}

.hero-image-wrapper-compact {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12rpx;
    overflow: hidden;
    background: #2a2d31;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-image-compact {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.hero-name-compact {
    font-size: 20rpx;
    color: #ececec;
    text-align: center;
    font-weight: 500;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 80rpx 40rpx;
    color: #666;
    font-size: 24rpx;
}

.empty-text {
    display: block;
    font-size: 28rpx;
    color: #999;
}

.hero-image-wrapper {
    position: relative;
    width: 100%;
}

.hero-image {
    width: 100%;
    height: 160rpx;
    border-radius: 12rpx;
    background: #2a2d31;
}

.hero-type-tag {
    position: absolute;
    bottom: 8rpx;
    left: 8rpx;
    right: 8rpx;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
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

.hero-name {
    font-size: 24rpx;
    color: #ececec;
    text-align: center;
    font-weight: bold;
}

/* 攻防方选择器 */
.side-selector {
    margin-bottom: 32rpx;
}

.optional-label {
    font-size: 24rpx;
    color: #999;
    font-weight: normal;
    margin-left: 8rpx;
}

.side-options {
    display: flex;
    gap: 20rpx;
    justify-content: center;
}

.side-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx 32rpx;
    border-radius: 16rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 3rpx solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    max-width: 200rpx;
}

.side-option.active {
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
}

.side-icon {
    font-size: 40rpx;
}

.side-name {
    font-size: 26rpx;
    color: #ececec;
    font-weight: bold;
}

/* 点位列表 */
.position-list {
/*    display: flex;
    flex-direction: column; */
	display: grid;
	grid-template-columns: repeat(2,50%);
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
    flex: 0 0 140rpx;
    position: relative;
}

.position-image {
    width: 140rpx;
    height: 140rpx;
    border-radius: 12rpx;
    background: #2a2d31;
}

.position-type-badge {
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    color: white;
    padding: 4rpx 8rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    font-weight: bold;
}

.position-side-badge {
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
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

.position-action {
    flex: 0 0 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-icon {
    font-size: 32rpx;
    color: #ff4654;
    opacity: 0.7;
    transition: all 0.3s ease;
}

.position-item:active .action-icon {
    opacity: 1;
    transform: translateX(4rpx);
}

/* 加载指示器 */
.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    padding: 80rpx 0;
    color: #999;
    font-size: 26rpx;
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
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
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
    text-align: center;
}

.empty-tip {
    font-size: 24rpx;
    color: #666;
    text-align: center;
}

/* 底部提示 */
.bottom-tips {
    position: fixed;
    bottom: 40rpx;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #ececec;
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    backdrop-filter: blur(10px);
    border: 2rpx solid rgba(255, 255, 255, 0.2);
    z-index: 90;
}

.tip-text {
    font-size: 26rpx;
}

/* 响应式适配 */
@media (max-width: 768rpx) {
    .map-grid {
        grid-template-columns: 1fr;
    }

    .hero-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .side-options {
        flex-direction: row;
    }

    .position-item {
        flex-direction: column;
    }

    .position-image-container {
        flex: none;
        align-self: center;
    }

    .position-action {
        flex: none;
        align-self: center;
    }

    .progress-indicator {
        flex-direction: row;
        gap: 20rpx;
    }

    .step-line {
        width: 4rpx;
        height: 40rpx;
        margin: 10rpx 0;
    }
}
</style>
