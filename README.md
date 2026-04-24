# china-tourism-weather-dashboard

基于 `Vite + React + TypeScript + ECharts` 的中国旅游天气与景区人流可视化大屏 demo。

当前项目支持三种运行方式：

- 本地开发：`npm run dev`
- Vercel：前端 + `api/weather.ts`
- Cloudflare Pages：前端 + `functions/api/weather.js`

项目已经把天气接口改成了代理模式：

- 浏览器只请求同域 `/api/weather`
- 和风天气 `API Host` 与 `API KEY` 只放在服务端环境变量里
- 前端不会直接暴露 `QWEATHER_KEY`

## 本地运行

```bash
npm install
npm run dev
```

如果 PowerShell 遇到执行策略限制，可以改用：

```bash
npm.cmd install
npm.cmd run dev
```

## 本地环境变量

复制 `.env.example` 为 `.env`：

```env
VITE_WEATHER_PROVIDER=qweather_proxy
VITE_CROWD_PROVIDER=mock
VITE_WEATHER_API_BASE_URL=
QWEATHER_API_HOST=your-api-host.qweatherapi.com
QWEATHER_KEY=your-qweather-api-key
```

说明：

- `VITE_` 开头的变量会进入前端构建
- `QWEATHER_API_HOST` 和 `QWEATHER_KEY` 只给本地 dev 中间件、Vercel Function、Cloudflare Function 使用
- 如果只想看前端效果，可把 `VITE_WEATHER_PROVIDER=mock`

## Cloudflare Pages 部署

如果你主要想要比 Vercel 更稳一些的海外/CDN 访问体验，推荐优先试 Cloudflare Pages。

官方文档：

- [Pages Git 部署](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/)
- [Pages 环境变量](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)
- [Vite on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite-site/)

### 1. 导入 GitHub 仓库

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Workers & Pages`
3. 点击 `Create application`
4. 选择 `Pages`
5. 选择 `Connect to Git`
6. 连接 GitHub 并选择仓库 `xuezhijingzhu/china-tourism-weather-dashboard`

### 2. 构建配置

如果 Cloudflare 没有自动识别为 Vite，就手动填：

- `Production branch`: `main`
- `Framework preset`: `Vite`
- `Build command`: `npm run build`
- `Build output directory`: `dist`
- `Root directory`: 留空

### 3. 环境变量

在 Cloudflare Pages 的 `Settings` 或导入流程里添加：

```env
VITE_WEATHER_PROVIDER=qweather_proxy
VITE_CROWD_PROVIDER=mock
QWEATHER_API_HOST=nu5u9x4hxp.re.qweatherapi.com
QWEATHER_KEY=你的和风天气 API KEY
```

说明：

- 如果前后端都部署在同一个 Cloudflare Pages 项目里，不需要配置 `VITE_WEATHER_API_BASE_URL`
- 前端会直接请求同域 `/api/weather`
- `QWEATHER_KEY` 只存在 Cloudflare Pages Functions 运行时

### 4. 部署后如何验证

部署完成后先验证接口：

```text
https://你的-pages-域名/api/weather?city=北京
```

如果返回 JSON，说明：

- Cloudflare Functions 已生效
- 和风天气凭据已正确接入

再打开首页，看天气卡片是否显示实时数据状态。

## Vercel 部署

如果仍然保留 Vercel，环境变量如下：

```env
VITE_WEATHER_PROVIDER=qweather_proxy
VITE_CROWD_PROVIDER=mock
QWEATHER_API_HOST=nu5u9x4hxp.re.qweatherapi.com
QWEATHER_KEY=你的和风天气 API KEY
```

项目中的 [api/weather.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/api/weather.ts) 会作为 Vercel Function 运行。

## 为什么帽子云静态托管不能直接放真实天气 key

因为静态站点只有前端资源：

- HTML
- JS
- CSS

如果把 `QWEATHER_KEY` 放进静态前端环境变量，它最终会出现在浏览器可下载的前端代码里。

所以如果使用纯静态平台：

- 要么天气继续用 `mock`
- 要么把真实天气代理部署在支持函数的平台上，再让前端请求那个代理

Cloudflare Pages 正好可以把这两部分放在同一个项目里解决。

## 当前关键文件

- [src/services/weatherService.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/src/services/weatherService.ts)
  前端天气抽象层，默认走 `/api/weather`
- [functions/api/weather.js](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/functions/api/weather.js)
  Cloudflare Pages Functions 版本的天气代理
- [api/weather.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/api/weather.ts)
  Vercel 版本的天气代理
- [server/qweather.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/server/qweather.ts)
  和风天气字段映射逻辑
- [src/components/ChinaMap.tsx](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/src/components/ChinaMap.tsx)
  中国地图与省级下钻
- [src/data/attractionCandidates.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/src/data/attractionCandidates.ts)
  联网整理的地级市候选景点

## 当前 mock 数据说明

- 包含北京、上海、广州、西安、成都、杭州、重庆、哈尔滨、沈阳、南京等城市
- 每个城市至少 3 个景点
- 页面会明确区分 mock 与真实天气
- 人流量当前仍以 mock 为主

## 后续接入真实人流 API 的建议

优先考虑这些来源：

- 百度慧眼
- 高德商业位置数据
- 景区官方开放接口
- 各地文旅平台开放数据

推荐接入步骤：

1. 在 `crowdService.ts` 中新增真实 provider
2. 统一把外部字段映射成 `AttractionCrowdData`
3. 为每条景点数据补充 `source` 字段
4. 给趋势数据增加更新时间和缓存策略
5. 明确区分“官方实时数据”和“模型估算/模拟数据”

## 推送更新

后续只要继续推 GitHub，Cloudflare Pages 就会自动重新部署：

```bash
git add .
git commit -m "your message"
git push origin main
```

或者 GitHub Desktop：

1. 填写 commit message
2. 点击 `Commit to main`
3. 点击 `Push origin`
