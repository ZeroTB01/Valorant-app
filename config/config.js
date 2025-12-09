// config/pages.js

/**
 * 小程序页面路径配置
 */

const PAGES = {
    // Tab页面
    TAB: {
        INDEX: '/pages/index/index',
        SEARCH: '/pages/search/search',
        PROFILE: '/pages/profile/profile'
    },
    // 英雄相关页面
    HERO: {
        LIST: '/pages/hero/list/list',
        DETAIL: '/pages/hero/detail/detail'
    },
    // 地图相关页面
    MAP: {
        LIST: '/pages/map/list/list',
        DETAIL: '/pages/map/detail/detail'
    },
    // 武器相关页面
    WEAPON: {
        LIST: '/pages/weapon/list/list',
        DETAIL: '/pages/weapon/detail/detail'
    },
    // 点位相关页面
    POSITION: {
        LIST: '/pages/position/list/list',
        DETAIL: '/pages/position/detail/detail'
    },
    // 内容相关页面
    CONTENT: {
        DETAIL: '/pages/content/detail/detail',
        VIDEO: '/pages/content/video/video'
    },
    // 用户相关页面
    USER: {
        EDIT: '/pages/profile/edit/edit',
        SETTINGS: '/pages/profile/settings/settings'
    },
    // 收藏相关页面
    FAVORITE: {
        LIST: '/pages/favorite/list/list',
        FOLDER: '/pages/favorite/folder/folder'
    },
    // 历史记录相关页面
    HISTORY: {
        LIST: '/pages/history/list/list',
        RECENT: '/pages/recent/list/list'
    },
    // 其他页面
    OTHER: {
        ABOUT: '/pages/about/index/index',
        FEEDBACK: '/pages/feedback/index/index',
        WEBVIEW: '/pages/webview/index/index'
    }
};

/**
 * 获取页面路径
 * @param {string} category - 分类
 * @param {string} page - 页面
 * @param {object} params - 参数
 * @returns {string} 完整的页面路径
 */
const getPagePath = (category, page, params = {}) => {
    const path = PAGES[category]?.[page];
    if (!path) {
        console.error(`页面路径不存在: ${category}.${page}`);
        return '';
    }

    // 如果有参数，拼接查询字符串
    const queryString = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
    return queryString ? `${path}?${queryString}` : path;
};

/**
 * 页面跳转工具
 */
const navigator = {
    // 跳转到Tab页
    switchTab: (page) => {
        uni.switchTab({
            url: PAGES.TAB[page] || page
        });
    },
    // 普通跳转
    navigateTo: (category, page, params = {}) => {
        const url = getPagePath(category, page, params);
        if (url) {
            uni.navigateTo({
                url
            });
        }
    },
    // 重定向
    redirectTo: (category, page, params = {}) => {
        const url = getPagePath(category, page, params);
        if (url) {
            uni.redirectTo({
                url
            });
        }
    },
    // 返回
    navigateBack: (delta = 1) => {
        uni.navigateBack({
            delta
        });
    },
    // 重启应用
    reLaunch: (page = 'INDEX') => {
        uni.reLaunch({
            url: PAGES.TAB[page]
        });
    }
};
module.exports = {
    PAGES,
    getPagePath,
    navigator
};
