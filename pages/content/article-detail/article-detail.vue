<template>
    <view class="article-detail-page">
        <!-- 加载状态 -->
        <view class="loading-container" v-if="loading">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载教程...</text>
        </view>

        <!-- 错误状态 -->
        <view class="error-container" v-if="error && !loading">
            <view class="error-icon">⚠️</view>
            <text class="error-message">{{ errorMessage }}</text>
            <button class="retry-btn" @tap="loadContent">重新加载</button>
        </view>

        <!-- 主要内容 -->
        <view class="main-content" v-if="!loading && !error && content">
            <!-- 内容标题 -->
            <view class="content-header">
                <text class="content-title">{{ content.title }}</text>
                <view class="content-badges">
                    <view class="badge" v-if="content.isFeatured">
                        <text>⭐ 精选</text>
                    </view>
                    <view class="badge official" v-if="content.isOfficial">
                        <text>✓ 官方</text>
                    </view>
                </view>
            </view>

            <!-- 基本信息 -->
            <view class="content-info">
                <view class="info-row" v-if="content.heroName">
                    <text class="info-label">英雄</text>
                    <text class="info-value">{{ content.heroName }}</text>
                </view>
                <view class="info-row" v-if="content.mapName">
                    <text class="info-label">地图</text>
                    <text class="info-value">{{ content.mapName }}</text>
                </view>
            </view>

            <!-- 图文教程容器（可滑动）-->
            <view class="tutorial-container">
                <!-- 图文滑块 -->
                <swiper
                    :current="currentStep"
                    class="tutorial-swiper"
                    @change="onSwiperChange"
                    :duration="300"
                >
                    <swiper-item 
                        v-for="(step, index) in tutorialSteps"
                        :key="index"
                        class="swiper-item"
                    >
                        <view class="step-content">
                            <!-- 步骤图片 -->
                            <view class="step-image-container">
                                <image 
                                    v-if="step.image"
                                    :src="step.image"
                                    class="step-image"
                                    mode="aspectFit"
                                />
                                <view v-else class="image-placeholder">
                                    <text>📷</text>
                                </view>

                                <!-- 步骤指示器 -->
                                <view class="step-indicator">
                                    <text>{{ index + 1 }} / {{ tutorialSteps.length }}</text>
                                </view>
                            </view>

                            <!-- 步骤描述 -->
                            <view class="step-description">
                                <view class="step-title" v-if="step.title">
                                    <text>{{ step.title }}</text>
                                </view>
                                <text class="step-text">{{ step.description }}</text>
                            </view>
                        </view>
                    </swiper-item>
                </swiper>

                <!-- 进度指示点 -->
                <view class="progress-dots">
                    <view 
                        v-for="(step, index) in tutorialSteps"
                        :key="index"
                        :class="'dot ' + (index === currentStep ? 'active' : '')"
                        @tap="jumpToStep(index)"
                    ></view>
                </view>
            </view>

            <!-- 步骤导航 -->
            <view class="step-navigation">
                <button 
                    class="nav-btn prev"
                    :disabled="currentStep === 0"
                    @tap="prevStep"
                >
                    <text>← 上一步</text>
                </button>

                <view class="step-counter">
                    <text>{{ currentStep + 1 }} / {{ tutorialSteps.length }}</text>
                </view>

                <button 
                    class="nav-btn next"
                    :disabled="currentStep === tutorialSteps.length - 1"
                    @tap="nextStep"
                >
                    <text>下一步 →</text>
                </button>
            </view>

            <!-- 内容描述 -->
            <view class="content-description-section" v-if="content.description">
                <text class="section-title">教程说明</text>
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
            currentStep: 0,
            tutorialSteps: []
        }
    },

    onLoad(options) {
        this.contentId = options.contentId
        if (this.contentId) {
            this.loadContent()
        }
    },

    // 分享功能
    onShareAppMessage() {
        return {
            title: this.content?.title || '精彩图文教程',
            path: `/pages/content/article-detail/article-detail?contentId=${this.contentId}`,
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
                console.log('📡 文章详情API返回:', res)

                if (res && res.data) {
                    this.content = res.data
                    console.log('✅ 获取文章详情成功:', this.content)
                    
                    // 处理封面图URL
                    if (this.content.coverImage) {
                        this.content.coverImage = getFullAssetUrl(this.content.coverImage)
                    }
                    
                    this.parseTutorialSteps()
                    
                    // 更新页面标题
                    uni.setNavigationBarTitle({
                        title: this.content.title || '图文教程'
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

        parseTutorialSteps() {
            // 解析教程步骤
            // 支持 JSON 格式的 content_body
            
            console.log('🔍 开始解析教程步骤，contentBody 类型:', typeof this.content.contentBody)
            console.log('🔍 contentBody 内容:', this.content.contentBody)
            
            if (!this.content.contentBody) {
                // 没有内容体时，使用封面、标题、描述作为单一步骤
                console.warn('⚠️ contentBody 为空，使用默认步骤')
                this.tutorialSteps = [{
                    image: this.content.coverImage,
                    title: this.content.title,
                    description: this.content.description || '暂无描述'
                }]
                return
            }

            try {
                // 尝试将 content_body 解析为 JSON
                let bodyData = null
                let parseSuccess = false
                
                // 情况1：已经是对象
                if (typeof this.content.contentBody === 'object' && this.content.contentBody !== null) {
                    console.log('✅ contentBody 已经是对象格式')
                    bodyData = this.content.contentBody
                    parseSuccess = true
                } 
                // 情况2：是字符串，尝试解析为 JSON
                else if (typeof this.content.contentBody === 'string') {
                    const trimmedBody = this.content.contentBody.trim()
                    console.log('🔍 尝试解析字符串，长度:', trimmedBody.length)
                    console.log('🔍 字符串首字符:', trimmedBody.charAt(0))
                    
                    // 检查是否看起来像 JSON
                    if (trimmedBody.startsWith('{') || trimmedBody.startsWith('[')) {
                        try {
                            bodyData = JSON.parse(trimmedBody)
                            console.log('✅ JSON 解析成功')
                            parseSuccess = true
                        } catch (parseError) {
                            console.error('❌ JSON 解析失败:', parseError.message)
                            console.error('❌ 问题位置:', parseError)
                        }
                    } else {
                        console.warn('⚠️ 字符串不以 { 或 [ 开头，不是 JSON 格式')
                    }
                }

                // 验证解析结果
                if (parseSuccess && bodyData && Array.isArray(bodyData.steps) && bodyData.steps.length > 0) {
                    console.log('✅ 使用 JSON 格式的步骤数据，共', bodyData.steps.length, '个步骤')
                    
                    // 验证每个步骤的数据
                    this.tutorialSteps = bodyData.steps.map((step, idx) => {
                        console.log(`  📄 步骤 ${idx + 1}:`, step)
                        return {
                            image: step.image ? getFullAssetUrl(step.image) : this.content.coverImage,
                            title: step.title || '',
                            description: step.description || '',
                            tips: step.tips || '',
                            difficulty: step.difficulty || 0
                        }
                    })
                    console.log('✅ 步骤处理完成，总数:', this.tutorialSteps.length)
                    return
                }

                // 解析失败或数据格式不符
                if (!parseSuccess) {
                    console.warn('⚠️ 无法解析 JSON，使用后备方案（纯文本解析）')
                } else if (!bodyData) {
                    console.warn('⚠️ 解析结果为空，使用后备方案')
                } else if (!bodyData.steps) {
                    console.warn('⚠️ 数据中没有 steps 字段，使用后备方案')
                } else if (!Array.isArray(bodyData.steps)) {
                    console.warn('⚠️ steps 不是数组，使用后备方案')
                } else {
                    console.warn('⚠️ steps 数组为空，使用后备方案')
                }
                
                this.parseTextualSteps()
            } catch (error) {
                console.error('❌ 解析教程步骤发生异常:', error)
                // 出错时使用后备方案
                this.parseTextualSteps()
            }
        },

        parseTextualSteps() {
            // 后备方案：简单的换行符分割解析
            // 格式示例: 图片URL\n步骤标题\n步骤描述\n\n图片URL\n步骤标题\n步骤描述
            
            const bodyLines = this.content.contentBody.split('\n').filter(line => line.trim())
            const steps = []

            let currentStep = {
                image: this.content.coverImage,
                title: '',
                description: ''
            }

            for (let i = 0; i < bodyLines.length; i++) {
                const line = bodyLines[i].trim()
                
                // 检查是否是图片URL
                if (line.startsWith('http') || line.startsWith('/') || line.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    // 如果当前步骤有内容，保存后新建
                    if (currentStep.description || currentStep.title) {
                        steps.push(currentStep)
                        currentStep = {
                            image: getFullAssetUrl(line),
                            title: '',
                            description: ''
                        }
                    } else {
                        currentStep.image = getFullAssetUrl(line)
                    }
                } 
                // 检查是否是标题（第一行非URL内容）
                else if (!currentStep.title && !currentStep.description) {
                    currentStep.title = line
                } 
                // 其余作为描述
                else {
                    currentStep.description += (currentStep.description ? '\n' : '') + line
                }
            }

            // 添加最后一个步骤
            if (currentStep.description || currentStep.title || currentStep.image !== this.content.coverImage) {
                steps.push(currentStep)
            }

            this.tutorialSteps = steps.length > 0 ? steps : [{
                image: this.content.coverImage,
                title: this.content.title,
                description: this.content.description || '暂无描述'
            }]

            console.log('📄 使用后备方案解析，得到', this.tutorialSteps.length, '个步骤')
        },

        onSwiperChange(e) {
            this.currentStep = e.detail.current
        },

        jumpToStep(index) {
            this.currentStep = index
        },

        nextStep() {
            if (this.currentStep < this.tutorialSteps.length - 1) {
                this.currentStep++
            }
        },

        prevStep() {
            if (this.currentStep > 0) {
                this.currentStep--
            }
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
.article-detail-page {
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

/* 基本信息 */
.content-info {
    padding: 20rpx 32rpx;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8rpx 0;
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

/* 图文教程容器 */
.tutorial-container {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.tutorial-swiper {
    width: 100%;
    height: 600rpx;
}

.swiper-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

.step-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 32rpx;
}

/* 步骤图片 */
.step-image-container {
    position: relative;
    width: 100%;
    height: 400rpx;
    background: linear-gradient(45deg, #2a2d31, #3c4043);
    border-radius: 12rpx;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
}

.step-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.image-placeholder {
    font-size: 100rpx;
    opacity: 0.5;
}

/* 步骤指示器 */
.step-indicator {
    position: absolute;
    bottom: 12rpx;
    right: 12rpx;
    background: rgba(0, 0, 0, 0.7);
    padding: 6rpx 12rpx;
    border-radius: 8rpx;
    font-size: 18rpx;
    color: #ff4654;
    font-weight: bold;
    backdrop-filter: blur(10px);
}

/* 步骤描述 */
.step-description {
    flex: 1;
    width: 100%;
}

.step-title {
    font-size: 26rpx;
    font-weight: bold;
    color: #ff4654;
    margin-bottom: 12rpx;
}

.step-text {
    font-size: 22rpx;
    color: #cccccc;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* 进度指示点 */
.progress-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 16rpx 0;
}

.dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s;
    cursor: pointer;
}

.dot.active {
    width: 32rpx;
    background: #ff4654;
    border-radius: 6rpx;
}

/* 步骤导航 */
.step-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 20rpx 32rpx;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.nav-btn {
    flex: 1;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    border: 2rpx solid #ff4654;
    background: transparent;
    color: #ff4654;
    transition: all 0.3s;
}

.nav-btn:active:not(:disabled) {
    background: rgba(255, 70, 84, 0.2);
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.step-counter {
    flex: 0 0 auto;
    padding: 0 16rpx;
    font-size: 22rpx;
    color: #ff4654;
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
