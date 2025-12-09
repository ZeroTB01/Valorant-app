# Valorant 助手 · UniApp(Android)

这是将 `valorant-project/valorant-miniprogram` 微信小程序完整迁移后的 UniApp 工程，放置在 `HbuilderX_Project/valorant-app` 目录，主要面向 Android App/Harmony App 端构建，同时可一键同步到 H5 及多端小程序。

## 项目结构

```
valorant-app
├── App.vue                 # 全局应用逻辑、主题、缓存
├── main.js                 # Vue2/3 自动适配入口（含 setData mixin）
├── manifest.json           # App/H5/小程序运行时配置（已预置安卓权限）
├── pages.json              # 路由&TabBar 配置（含英雄/地图/武器等12个页面）
├── pages/                  # 页面（索引/搜索/英雄/地图/武器/收藏/登录...）
├── components/navigation-bar
├── utils/                  # api/auth/image/storage 等工具
├── static/assets/          # 统一静态资源（icons/images）
└── uni_modules/            # mp-html、zp-mixins 等三方能力
```

## 运行方式

### HBuilderX（推荐）
1. 打开 HBuilderX → `文件` → `打开目录` → 选择 `HbuilderX_Project/valorant-app`
2. 可直接选择「运行至 内置浏览器 / H5 / Android 模拟器 / 真机」
3. Android 真机调试：连接 USB，安装调试基座后点击「运行到手机」

### CLI（可选）
该工程同样可通过 `uni-app cli` 运行：
```bash
pnpm install         # 或 npm install / yarn
npx uni build --platform h5
npx uni run  --platform app-android
```

## 后端接口与环境
- 接口封装集中在 `utils/api.js`，默认 `baseUrl` 为 `http://127.0.0.1:8088/api`
- 若需要切换到线上/内网，请统一修改 `API_CONFIG`
- 登录/收藏/浏览历史等模块依赖后端鉴权，若无后端可切换为游客模式（内置 `authUtils.guestLogin`）

## Android 构建提示
1. `manifest.json` 已限制竖屏、开放常用权限，可根据渠道补充 `icons/splash`、`签名`
2. 发布正式包请使用 HBuilderX 的「发行」→「原生App-云打包」或自定义基座
3. 若需 CDN/混淆等高级配置，可在 `manifest.json -> app-plus` 中继续拓展

## 常见问题
- **API 404 / CORS**：确认 `utils/api.js` 的地址以及后端 CORS 设置；H5 调试建议使用内置浏览器。
- **资源缺失**：所有图片/图标均已统一到 `static/assets`，确保新增静态资源也放在该目录。
- **历史/反馈页面**：目前菜单会弹 Toast 提示“敬请期待”，可按需新增页面后将 `menuItems` 的 `url` 指向真实路径。

## 下一步建议
- 接入正式接口域名、完善 token 刷新逻辑
- 根据终端体验补充动画/骨架屏/离线缓存
- 按需拓展 `uni_modules`，如 uView、vk-uview 等 UI 组件库

欢迎继续在此项目上开发，若需再次迁移或新增平台，只需围绕本 UniApp 工程即可。祝开发顺利！
