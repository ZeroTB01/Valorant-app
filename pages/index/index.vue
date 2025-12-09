<template>
    <!-- pages/index/index.wxml -->
    <view class="index-page">
        <!-- 顶部搜索栏 -->
        <!-- <view class="search-header">
    <view class="search-box" bindtap="goToSearch">
      <icon type="search" size="16" color="#999" />
      <text class="search-placeholder">搜索英雄、地图、武器...</text>
    </view>
  </view> -->

        <!-- 最近查看 -->
        <!-- <view class="recent-section" wx:if="{{recentViews.length > 0}}">
    <view class="section-header">
      <text class="section-title">最近查看</text>
      <text class="view-all" bindtap="viewAll" data-type="recent">查看全部</text>
    </view>
    <scroll-view class="recent-list" scroll-x>
      <view class="recent-item" 
            wx:for="{{recentViews}}" 
            wx:key="index"
            bindtap="goToDetail"
            data-type="{{item.type}}"
            data-id="{{item.id}}"
            data-data="{{item}}">
        <image class="recent-image" 
               src="{{item.image}}" 
               mode="aspectFill"
               lazy-load />
        <text class="recent-name">{{item.name}}</text>
      </view>
    </scroll-view>
  </view> -->

        <!-- 分类切换 -->
        <view class="category-tabs">
            <view class="tabs-container">
                <view
                    :class="'tab-item ' + (currentCategory === item.key ? 'active' : '')"
                    @tap="switchCategory"
                    :data-category="item.key"
                    v-for="(item, index) in categories"
                    :key="index"
                >
                    <text class="tab-text">{{ item.name }}</text>

                    <view class="tab-indicator" v-if="currentCategory === item.key"></view>
                </view>
            </view>
        </view>

        <!-- 内容区域 -->
        <view class="content-area">
            <!-- 骨架屏 -->
            <view class="skeleton-container" v-if="showSkeleton">
                <view class="skeleton-grid">
                    <view class="skeleton-item" v-for="(item, index) in 6" :key="index">
                        <view class="skeleton-image"></view>

                        <view class="skeleton-text"></view>
                    </view>
                </view>
            </view>

            <!-- 英雄列表 -->
            <view class="hero-container" v-if="currentCategory === 'hero'">
                <!-- 英雄类型筛选 -->
                <view class="filter-tabs">
                    <view
                        :class="'filter-tab ' + (currentHeroType === item.key ? 'active' : '')"
                        @tap="switchHeroType"
                        :data-type="item.key"
                        v-for="(item, index) in heroTypes"
                        :key="index"
                    >
                        {{ item.name }}
                    </view>
                </view>
                <view class="grid-container">
                    <view class="hero-item" @tap="goToDetail" data-type="hero" :data-id="item.id" :data-data="item" v-for="(item, index) in filteredHeroList" :key="index">
                        <view class="hero-image-wrapper">
                            <image class="hero-image" :src="item.avatar" mode="widthFix" lazy-load />
                            <view :class="'hero-type-tag ' + item.typeClass">
                                {{ item.typeLabel }}
                            </view>
                        </view>

                        <text class="hero-name">{{ item.heroName }}</text>
                    </view>
                </view>
            </view>

            <!-- 地图列表 -->
            <view class="map-container" v-if="currentCategory === 'map'">
                <view class="map-grid">
                    <view class="map-item" @tap="goToDetail" data-type="map" :data-id="item.id" :data-data="item" v-for="(item, index) in mapList" :key="index">
                        <view class="map-image-wrapper">
                            <image class="map-image" :src="item.minimapUrl" mode="aspectFill" lazy-load />
                            <view class="map-overlay">
                                <text class="map-name">{{ item.mapName }}</text>
                                <text class="map-key">{{ item.mapKey }}</text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 武器列表 -->
            <view class="weapon-container" v-if="currentCategory === 'weapon'">
                <!-- 武器类型筛选 -->
                <view class="filter-tabs">
                    <view
                        :class="'filter-tab ' + (currentWeaponType === item.key ? 'active' : '')"
                        @tap="switchWeaponType"
                        :data-type="item.key"
                        v-for="(item, index) in weaponTypes"
                        :key="index"
                    >
                        {{ item.name }}
                    </view>
                </view>

                <view class="weapon-grid">
                    <view class="weapon-item" @tap="goToDetail" data-type="weapon" :data-id="item.id" :data-data="item" v-for="(item, index) in filteredWeaponList" :key="index">
                        <view class="weapon-image-wrapper">
                            <image class="weapon-image" :src="item.imageUrl" mode="aspectFit" lazy-load />
                        </view>

                        <text class="weapon-name">{{ item.weaponName }}</text>

                        <text class="weapon-price">¥{{ item.price }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 加载提示 -->
        <view class="loading-tip" v-if="loading[currentCategory]">
            <text>正在加载...</text>
        </view>
    </view>
</template>

<script>
// pages/index/index.js
const app = getApp();
const { heroAPI, mapAPI, weaponAPI } = require('../../utils/api');
const { handleHeroList, handleMapList, handleWeaponList } = require('../../utils/image');
export default {
    data() {
        return {
            // 当前选中的分类
            currentCategory: 'hero',
            // 分类配置
            categories: [
                {
                    key: 'hero',
                    name: '英雄',
                    icon: '/static/assets/icons/hero.png'
                },
                {
                    key: 'map',
                    name: '地图',
                    icon: '/static/assets/icons/map.png'
                },
                {
                    key: 'weapon',
                    name: '武器',
                    icon: '/static/assets/icons/weapon.png'
                }
            ],
            // 英雄类型筛选
            heroTypes: [
                {
                    key: 'duelist',
                    name: '决斗'
                },
                {
                    key: 'sentinel',
                    name: '哨卫'
                },
                {
                    key: 'controller',
                    name: '控场'
                },
                {
                    key: 'initiator',
                    name: '先锋'
                }
            ],
            currentHeroType: 'duelist',
            // 默认显示决斗者

            // 武器类型筛选
            weaponTypes: [
                {
                    key: 'sidearm',
                    name: '手枪'
                },
                {
                    key: 'smg',
                    name: '冲锋枪'
                },
                {
                    key: 'rifle',
                    name: '步枪'
                },
                {
                    key: 'sniper',
                    name: '狙击枪'
                },
                {
                    key: 'machine_gun',
                    name: '机枪'
                }
            ],
            currentWeaponType: 'sidearm',
            // 默认显示手枪

            // 数据列表
            heroList: [],
            mapList: [],
            weaponList: [],
            // 筛选后的数据
            filteredHeroList: [],
            filteredWeaponList: [],
            // 加载状态
            loading: {
                hero: false,
                map: false,
                weapon: false
            },
            // 骨架屏显示
            showSkeleton: true,
            // 最近查看
            recentViews: [],
            // 刷新状态
            isRefreshing: false,
            // 系统信息
            systemInfo: {}
        };
    },
    onLoad() {
        // 获取系统信息
        this.setData({
            systemInfo: app.globalData.getSystemInfo()
        });

        // 初始化数据
        this.initData();

        // 获取最近查看
        this.loadRecentViews();
        console.log('英雄类型数据：', this.heroTypes);
    },
    onShow() {
        // 页面显示时刷新最近查看
        this.loadRecentViews();
    },
    // 下拉刷新
    async onPullDownRefresh() {
        this.setData({
            isRefreshing: true
        });

        // 重新加载当前分类数据
        try {
            switch (this.currentCategory) {
                case 'hero':
                    await this.loadHeroList();
                    break;
                case 'map':
                    await this.loadMapList();
                    break;
                case 'weapon':
                    await this.loadWeaponList();
                    break;
            }
        } finally {
            uni.stopPullDownRefresh();
            this.setData({
                isRefreshing: false
            });
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
        // 初始化数据
        async initData() {
            // 优先从缓存加载
            this.loadFromCache();

            // 然后从服务器更新
            await this.loadAllData();

            // 隐藏骨架屏
            setTimeout(() => {
                this.setData({
                    showSkeleton: false
                });
            }, 500);
        },

        // 从缓存加载数据
        loadFromCache() {
            const heroCache = app.globalData.getCacheData('heroList');
            const mapCache = app.globalData.getCacheData('mapList');
            const weaponCache = app.globalData.getCacheData('weaponList');
            if (heroCache) {
                this.setData({
                    heroList: heroCache
                });
                // 立即筛选英雄
                this.filterHeroes();
            }
            if (mapCache) {
                this.setData({
                    mapList: mapCache
                });
            }
            if (weaponCache) {
                this.setData({
                    weaponList: weaponCache
                });
                // 立即筛选武器
                this.filterWeapons();
            }
        },

        // 加载所有数据
        async loadAllData() {
            // 并行加载三个分类的数据
            const promises = [this.loadHeroList(), this.loadMapList(), this.loadWeaponList()];
            try {
                await Promise.all(promises);
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载数据失败:', error);
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
                const res = await heroAPI.getHeroList();
                if (res.success && res.data) {
                    // 处理图片地址
                    const processedList = handleHeroList(res.data);

                    // 处理英雄类型标签
                    const heroList = processedList.map((hero) => ({
                        ...hero,
                        typeLabel: this.getHeroTypeLabel(hero.heroType),
                        typeClass: `hero-type-${hero.heroType}`
                    }));
                    this.setData({
                        heroList
                    });

                    // 更新缓存
                    app.globalData.setCacheData('heroList', heroList);

                    // 筛选当前类型的英雄
                    this.filterHeroes();
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载英雄列表失败:', error);
                uni.showToast({
                    title: '加载英雄失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    'loading.hero': false
                });
            }
        },

        // 加载地图列表
        async loadMapList() {
            if (this.loading.map) {
                return;
            }
            this.setData({
                'loading.map': true
            });
            try {
                const res = await mapAPI.getMapList();
                if (res.success && res.data) {
                    // 处理图片地址
                    const mapList = handleMapList(res.data);
                    this.setData({
                        mapList
                    });

                    // 更新缓存
                    app.globalData.setCacheData('mapList', mapList);
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载地图列表失败:', error);
                uni.showToast({
                    title: '加载地图失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    'loading.map': false
                });
            }
        },

        // 加载武器列表
        async loadWeaponList() {
            if (this.loading.weapon) {
                return;
            }
            this.setData({
                'loading.weapon': true
            });
            try {
                const res = await weaponAPI.getWeaponList();
                if (res.success && res.data) {
                    // 处理图片地址
                    const processedWeapons = handleWeaponList(res.data);

                    // 按武器类型分组
                    const weaponsByType = this.groupWeaponsByType(processedWeapons);
                    this.setData({
                        weaponList: weaponsByType
                    });

                    // 更新缓存
                    app.globalData.setCacheData('weaponList', weaponsByType);

                    // 筛选当前类型的武器
                    this.filterWeapons();
                }
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载武器列表失败:', error);
                uni.showToast({
                    title: '加载武器失败',
                    icon: 'none'
                });
            } finally {
                this.setData({
                    'loading.weapon': false
                });
            }
        },

        // 加载最近查看
        loadRecentViews() {
            try {
                const recentViews = uni.getStorageSync('recentViews') || [];
                this.setData({
                    recentViews: recentViews.slice(0, 4)
                });
            } catch (error) {
                console.log('CatchClause', error);
                console.log('CatchClause', error);
                console.error('加载最近查看失败:', error);
            }
        },

        // 切换分类
        switchCategory(e) {
            const category = e.currentTarget.dataset.category;
            if (category === this.currentCategory) {
                return;
            }
            this.setData({
                currentCategory: category
            });

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 跳转到详情页
        goToDetail(e) {
            const { type, id, data } = e.currentTarget.dataset;

            // 添加到最近查看
            this.addToRecentViews(type, data);

            // 跳转到对应详情页
            let url = '';
            switch (type) {
                case 'hero':
                    url = `/pages/hero/detail/detail?id=${id}`;
                    break;
                case 'map':
                    url = `/pages/map/detail/detail?id=${id}`;
                    break;
                case 'weapon':
                    url = `/pages/weapon/detail/detail?id=${id}`;
                    break;
            }
            if (url) {
                uni.navigateTo({
                    url
                });
            }
        },

        // 添加到最近查看
        addToRecentViews(type, data) {
            try {
                let recentViews = uni.getStorageSync('recentViews') || [];

                // 创建新的查看记录
                const newView = {
                    type,
                    id: data.id,
                    name: data.heroName || data.mapName || data.weaponName,
                    image: data.avatar || data.thumbnail || data.image,
                    time: Date.now()
                };

                // 移除已存在的相同记录
                recentViews = recentViews.filter((item) => !(item.type === type && item.id === data.id));

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

        // 查看全部
        viewAll(e) {
            const type = e.currentTarget.dataset.type;
            let url = '';
            switch (type) {
                case 'hero':
                    url = '/pages/hero/list/list';
                    break;
                case 'map':
                    url = '/pages/map/list/list';
                    break;
                case 'weapon':
                    url = '/pages/weapon/list/list';
                    break;
                case 'recent':
                    url = '/pages/recent/list/list';
                    break;
            }
            if (url) {
                uni.navigateTo({
                    url
                });
            }
        },

        // 搜索
        goToSearch() {
            uni.switchTab({
                url: '/pages/search/search'
            });
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

        // 工具方法：按类型分组武器
        groupWeaponsByType(weapons) {
            const groups = {
                sidearm: {
                    name: '手枪',
                    items: []
                },
                smg: {
                    name: '冲锋枪',
                    items: []
                },
                rifle: {
                    name: '步枪',
                    items: []
                },
                sniper: {
                    name: '狙击枪',
                    items: []
                },
                machine_gun: {
                    name: '机枪',
                    items: []
                },
                melee: {
                    name: '近战',
                    items: []
                }
            };
            weapons.forEach((weapon) => {
                if (groups[weapon.weaponType]) {
                    groups[weapon.weaponType].items.push(weapon);
                }
            });

            // 转换为数组格式
            return Object.entries(groups)
                .filter(([_, group]) => group.items.length > 0)
                .map(([type, group]) => ({
                    type,
                    name: group.name,
                    items: group.items
                }));
        },

        // 切换英雄类型
        switchHeroType(e) {
            const type = e.currentTarget.dataset.type;
            if (type === this.currentHeroType) {
                return;
            }
            this.setData({
                currentHeroType: type
            });
            this.filterHeroes();

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 切换武器类型
        switchWeaponType(e) {
            const type = e.currentTarget.dataset.type;
            if (type === this.currentWeaponType) {
                return;
            }
            this.setData({
                currentWeaponType: type
            });
            this.filterWeapons();

            // 触发振动反馈
            uni.vibrateShort({
                type: 'light'
            });
        },

        // 筛选英雄
        filterHeroes() {
            const { heroList, currentHeroType } = this;
            if (!heroList || heroList.length === 0) {
                console.log('英雄列表为空，无法筛选');
                return;
            }
            const filtered = heroList.filter((hero) => hero.heroType === currentHeroType);
            console.log(`筛选${currentHeroType}类型英雄，结果:`, filtered);
            this.setData({
                filteredHeroList: filtered
            });
        },

        // 筛选武器
        filterWeapons() {
            const { weaponList, currentWeaponType } = this;
            if (!weaponList || weaponList.length === 0) {
                console.log('武器列表为空，无法筛选');
                return;
            }
            const currentGroup = weaponList.find((group) => group.type === currentWeaponType);
            console.log(`筛选${currentWeaponType}类型武器，结果:`, currentGroup);
            this.setData({
                filteredWeaponList: currentGroup ? currentGroup.items : []
            });
        }
    }
};
</script>
<style>
/* pages/index/index.wxss */

.index-page {
    min-height: 100vh;
    background-color: var(--bg-primary);
}

/* ===========================================
   搜索栏
   =========================================== */
.search-header {
    padding: 20rpx 30rpx;
    background-color: var(--bg-secondary);
    position: sticky;
    top: 0;
    z-index: 100;
}

.search-box {
    display: flex;
    align-items: center;
    background-color: var(--bg-tertiary);
    border-radius: 40rpx;
    padding: 16rpx 30rpx;
    border: 1rpx solid var(--border-secondary);
}

.search-placeholder {
    margin-left: 16rpx;
    color: var(--text-tertiary);
    font-size: 28rpx;
}

/* ===========================================
   最近查看
   =========================================== */
.recent-section {
    padding: 20rpx 0;
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

.recent-list {
    padding: 0 30rpx;
    white-space: nowrap;
}

.recent-item {
    display: inline-block;
    width: 160rpx;
    margin-right: 20rpx;
    text-align: center;
}

.recent-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: var(--radius-medium);
    background-color: var(--bg-tertiary);
    border: 2rpx solid var(--border-secondary);
}

.recent-name {
    display: block;
    margin-top: 10rpx;
    font-size: 24rpx;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ===========================================
   分类切换
   =========================================== */
.category-tabs {
    background-color: var(--bg-secondary);
    padding: 20rpx 0;
    border-bottom: 1rpx solid var(--border-secondary);
    position: sticky;
    top: 10rpx;
    z-index: 99;
	height:100rpx;
}

.tabs-container {
    display: flex;
    justify-content: space-around;
    padding: 0 60rpx;
}

.tab-item {
    flex: 1;
    text-align: center;
    position: relative;
    padding: 16rpx 0;
}

.tab-text {
    font-size: 32rpx;
    font-weight: 500;
    color: var(--text-tertiary);
    transition: color 0.3s;
}

.tab-item.active .tab-text {
    color: var(--primary-red);
    font-weight: 600;
}

.tab-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60rpx;
    height: 6rpx;
    background-color: var(--primary-red);
    border-radius: 3rpx;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        width: 0;
    }
    to {
        width: 60rpx;
    }
}

/* ===========================================
   内容区域
   =========================================== */
.content-area {
    padding: 30rpx;
    min-height: 60vh;
}

/* ===========================================
   骨架屏
   =========================================== */
.skeleton-container {
    padding: 20rpx 0;
}

.skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
}

.skeleton-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.skeleton-image {
    width: 100%;
    aspect-ratio: 1;
    background: linear-gradient(90deg, #1a1d21 25%, #252830 50%, #1a1d21 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: var(--radius-medium);
}

.skeleton-text {
    width: 80%;
    height: 32rpx;
    background: linear-gradient(90deg, #1a1d21 25%, #252830 50%, #1a1d21 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    margin-top: 16rpx;
    border-radius: var(--radius-small);
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

/* ===========================================
   筛选标签
   =========================================== */
.filter-tabs {
    display: flex;
    gap: 16rpx;
    margin-bottom: 30rpx;
    padding: 20rpx 0;
    overflow-x: auto;
    justify-content: center;
}

.filter-tab {
    padding: 16rpx 32rpx;
    background-color: var(--bg-tertiary);
    border-radius: 30rpx;
    font-size: 28rpx;
    color: var(--text-secondary);
    white-space: nowrap;
    transition: all 0.3s;
    border: 2rpx solid transparent;
}

.filter-tab.active {
    background-color: rgba(255, 70, 84, 0.1);
    color: var(--primary-red);
    border-color: var(--primary-red);
    font-weight: 500;
}

.filter-tab:active {
    transform: scale(0.95);
}

/* ===========================================
   英雄列表
   =========================================== */
.hero-container {
    animation: fadeIn 0.3s ease;
    margin-top: 20rpx;
}

.grid-container {
    display: grid;
	grid-template-columns: repeat(3, 33.33%);
    gap: 20rpx;
    margin-bottom: 40rpx;
}

.hero-item {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    transition: transform 0.3s;
}

.hero-item:active {
    transform: scale(0.95);
}

.hero-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    background: linear-gradient(135deg, #1a1d21 0%, #0f1419 100%);
    border: 2rpx solid var(--border-secondary);
}

.hero-image {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
}

.hero-type-tag {
    position: absolute;
    top: 10rpx;
    right: 10rpx;
    padding: 4rpx 12rpx;
    border-radius: var(--radius-small);
    font-size: 20rpx;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1rpx;
}

.hero-type-duelist {
    background-color: rgba(255, 70, 84, 0.9);
    color: #fff;
}

.hero-type-sentinel {
    background-color: rgba(0, 245, 255, 0.9);
    color: #000;
}

.hero-type-controller {
    background-color: rgba(189, 147, 249, 0.9);
    color: #fff;
}

.hero-type-initiator {
    background-color: rgba(255, 215, 0, 0.9);
    color: #000;
}

.hero-name {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: var(--text-primary);
    font-weight: 500;
}

/* ===========================================
   地图列表
   =========================================== */
.map-container {
    animation: fadeIn 0.3s ease;
}

.map-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    margin-bottom: 40rpx;
}

.map-item {
    position: relative;
    border-radius: var(--radius-medium);
    overflow: hidden;
    transition: transform 0.3s;
    aspect-ratio: 16/9;
}

.map-item:active {
    transform: scale(0.95);
}

.map-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.map-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
    padding: 30rpx 20rpx 20rpx;
}

.map-name {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 4rpx;
}

.map-key {
    display: block;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
}

/* ===========================================
   武器列表
   =========================================== */
.weapon-container {
    animation: fadeIn 0.3s ease;
    margin-top: 20rpx;
}

.weapon-groups {
    margin-bottom: 40rpx;
}

.weapon-group {
    margin-bottom: 40rpx;
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.group-name {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary);
}

.group-count {
    font-size: 24rpx;
    color: var(--text-tertiary);
    background-color: var(--bg-tertiary);
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
}

.weapon-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
}

.weapon-item {
    background-color: var(--bg-card);
    border-radius: var(--radius-medium);
    padding: 20rpx;
    border: 1rpx solid var(--border-secondary);
    transition: all 0.3s;
}

.weapon-item:active {
    transform: scale(0.95);
    border-color: var(--primary-red);
}

.weapon-image-wrapper {
    width: 100%;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16rpx;
}

.weapon-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.weapon-name {
    display: block;
    font-size: 26rpx;
    color: var(--text-primary);
    font-weight: 500;
    text-align: center;
    margin-bottom: 8rpx;
}

.weapon-price {
    display: block;
    font-size: 24rpx;
    color: var(--accent-gold);
    text-align: center;
    font-weight: 600;
}

/* ===========================================
   查看全部按钮
   =========================================== */
.view-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx;
    background-color: var(--bg-card);
    border-radius: var(--radius-medium);
    border: 2rpx dashed var(--border-secondary);
    transition: all 0.3s;
}

.view-all-btn:active {
    background-color: var(--bg-tertiary);
    border-color: var(--primary-red);
}

.view-all-btn text {
    font-size: 28rpx;
    color: var(--text-secondary);
}

.view-all-btn .arrow {
    margin-left: 10rpx;
    font-size: 32rpx;
    color: var(--primary-red);
}

/* ===========================================
   加载提示
   =========================================== */
.loading-tip {
    display: flex;
    justify-content: center;
    padding: 40rpx;
    color: var(--text-tertiary);
    font-size: 26rpx;
}

/* ===========================================
   动画效果
   =========================================== */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
