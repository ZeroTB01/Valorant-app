// utils/image.js
const { getFullAssetUrl } = require('./api');

/**
 * 图片地址处理工具
 * 处理数据库中的相对路径，转换为完整的URL
 */

/**
 * 处理图片URL
 * @param {string} url - 原始图片地址
 * @param {string} defaultImage - 默认图片
 * @returns {string} 处理后的完整URL
 */
const handleImageUrl = (url, defaultImage = '/static/assets/images/placeholder.png') => {
    if (!url) {
        return defaultImage;
    }

    // 使用API中的getFullAssetUrl方法处理图片地址
    return getFullAssetUrl(url);
};

/**
 * 处理英雄头像
 * @param {object} hero - 英雄对象
 * @returns {object} 处理后的英雄对象
 */
const handleHeroAvatar = (hero) => {
    if (!hero) {
        return hero;
    }
    return {
        ...hero,
        avatar: handleImageUrl(hero.avatar, '/static/assets/images/default-hero.png')
    };
};

/**
 * 处理地图缩略图
 * @param {object} map - 地图对象
 * @returns {object} 处理后的地图对象
 */
const handleMapImages = (map) => {
    if (!map) {
        return map;
    }
    return {
        ...map,
        minimapUrl: handleImageUrl(map.minimapUrl, '/static/assets/images/default-map.png'),
        overviewUrl: handleImageUrl(map.overviewUrl, '/static/assets/images/default-map.png')
    };
};

/**
 * 处理武器图片
 * @param {object} weapon - 武器对象
 * @returns {object} 处理后的武器对象
 */
const handleWeaponImage = (weapon) => {
    if (!weapon) {
        return weapon;
    }
    return {
        ...weapon,
        imageUrl: handleImageUrl(weapon.imageUrl, '/static/assets/images/default-weapon.png')
    };
};

/**
 * 处理点位图片
 * @param {object} position - 点位对象
 * @returns {object} 处理后的点位对象
 */
const handlePositionImages = (position) => {
    if (!position) {
        return position;
    }
    return {
        ...position,
        setupImage: handleImageUrl(position.setupImage, '/static/assets/images/default-position.png'),
        throwImage: handleImageUrl(position.throwImage, '/static/assets/images/default-position.png'),
        landingImage: handleImageUrl(position.landingImage, '/static/assets/images/default-position.png')
    };
};

/**
 * 处理内容图片
 * @param {object} content - 内容对象
 * @returns {object} 处理后的内容对象
 */
const handleContentImages = (content) => {
    if (!content) {
        return content;
    }
    return {
        ...content,
        coverImage: handleImageUrl(content.coverImage, '/static/assets/images/default-content.png'),
        videoUrl: handleImageUrl(content.videoUrl)
    };
};

/**
 * 处理技能图片
 * @param {object} skill - 技能对象
 * @returns {object} 处理后的技能对象
 */
const handleSkillImage = (skill) => {
    if (!skill) {
        return skill;
    }
    return {
        ...skill,
        icon: handleImageUrl(skill.icon, '/static/assets/images/default-skill.png')
    };
};

/**
 * 批量处理英雄列表
 * @param {array} heroes - 英雄列表
 * @returns {array} 处理后的英雄列表
 */
const handleHeroList = (heroes) => {
    if (!Array.isArray(heroes)) {
        return [];
    }
    return heroes.map(handleHeroAvatar);
};

/**
 * 批量处理地图列表
 * @param {array} maps - 地图列表
 * @returns {array} 处理后的地图列表
 */
const handleMapList = (maps) => {
    if (!Array.isArray(maps)) {
        return [];
    }
    return maps.map(handleMapImages);
};

/**
 * 批量处理武器列表
 * @param {array} weapons - 武器列表
 * @returns {array} 处理后的武器列表
 */
const handleWeaponList = (weapons) => {
    if (!Array.isArray(weapons)) {
        return [];
    }
    return weapons.map(handleWeaponImage);
};

/**
 * 批量处理点位列表
 * @param {array} positions - 点位列表
 * @returns {array} 处理后的点位列表
 */
const handlePositionList = (positions) => {
    if (!Array.isArray(positions)) {
        return [];
    }
    return positions.map(handlePositionImages);
};

/**
 * 批量处理内容列表
 * @param {array} contents - 内容列表
 * @returns {array} 处理后的内容列表
 */
const handleContentList = (contents) => {
    if (!Array.isArray(contents)) {
        return [];
    }
    return contents.map(handleContentImages);
};

/**
 * 批量处理技能列表
 * @param {array} skills - 技能列表
 * @returns {array} 处理后的技能列表
 */
const handleSkillList = (skills) => {
    if (!Array.isArray(skills)) {
        return [];
    }
    return skills.map(handleSkillImage);
};

/**
 * 获取默认图片
 * @param {string} type - 图片类型
 * @returns {string} 默认图片路径
 */
const getDefaultImage = (type) => {
    const defaultImages = {
        hero: '/static/assets/images/default-hero.png',
        map: '/static/assets/images/default-map.png',
        weapon: '/static/assets/images/default-weapon.png',
        position: '/static/assets/images/default-position.png',
        content: '/static/assets/images/default-content.png',
        avatar: '/static/assets/images/default-avatar.png',
        skill: '/static/assets/images/default-skill.png'
    };
    return defaultImages[type] || '/static/assets/images/placeholder.png';
};

/**
 * 预加载图片
 * @param {string|array} urls - 图片URL或URL数组
 * @returns {Promise}
 */
const preloadImages = (urls) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    const promises = urlArray.map((url) => {
        return new Promise((resolve, reject) => {
            uni.getImageInfo({
                src: handleImageUrl(url),
                success: resolve,
                fail: reject
            });
        });
    });
    return Promise.allSettled(promises);
};
module.exports = {
    handleImageUrl,
    handleHeroAvatar,
    handleMapImages,
    handleWeaponImage,
    handlePositionImages,
    handleContentImages,
    handleSkillImage,
    handleHeroList,
    handleMapList,
    handleWeaponList,
    handlePositionList,
    handleContentList,
    handleSkillList,
    getDefaultImage,
    preloadImages
};
