# china-tourism-weather-dashboard

基于 `Vite + React + TypeScript + ECharts` 的中国旅游天气与景区人流可视化大屏 demo。当前项目已经改造成适合部署到 Vercel 的版本：前端只请求同域 `/api/weather`，和风天气 `API KEY` 只保存在服务端环境变量，不暴露到浏览器。

## 当前部署模式

- 前端：Vite 构建为静态站点
- 天气接口：Vercel Serverless Function `api/weather.ts`
- 本地开发：`npm run dev` 时由 Vite Node 中间件代理 `/api/weather`
- 线上部署：Vercel 运行 `api/weather.ts`，前端通过同域接口取天气

## 功能特性

- 中国地图可视化，支持省份 hover 高亮、点击省份查看概览、点击城市查看城市级天气与景区数据
- 科技感蓝黑主题，半透明玻璃卡片，桌面端大屏布局与移动端单列布局
- 搜索省份、城市或景点名称，并定位到对应地区
- `WeatherService` 与 `CrowdService` 抽象层，方便从 mock 平滑切换到真实 API
- 展示天气卡片、热门景点排行、景点列表、拥挤趋势和出行提示
- 所有敏感天气凭据通过服务端环境变量配置，前端代码不硬编码 key

## 本地运行

```bash
npm install
npm run dev
```

如果 PowerShell 遇到 `npm.ps1` 执行策略限制，可改用：

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
- `QWEATHER_API_HOST` 和 `QWEATHER_KEY` 不会进入浏览器，只在本地 Node 中间件和 Vercel 服务端使用
- 如果你只想看纯 mock 演示，可把 `VITE_WEATHER_PROVIDER=mock`

## Vercel 部署

### 1. 推送到 GitHub

把项目推到你自己的 GitHub 仓库。

### 2. 在 Vercel 导入仓库

1. 打开 [Vercel](https://vercel.com/)
2. 点击 `Add New...` -> `Project`
3. 选择你的 GitHub 仓库
4. Framework Preset 选择 `Vite`
5. Build Command 保持 `npm run build`
6. Output Directory 保持 `dist`

### 3. 配置 Environment Variables

在 Vercel 项目的 `Settings` -> `Environment Variables` 中添加：

- `VITE_WEATHER_PROVIDER` = `qweather_proxy`
- `VITE_CROWD_PROVIDER` = `mock`
- `QWEATHER_API_HOST` = 你的和风天气 API Host
- `QWEATHER_KEY` = 你的和风天气 API KEY

如果未来天气代理放到其他域名，再额外配置：

- `VITE_WEATHER_API_BASE_URL` = `https://your-domain.vercel.app`

通常同域部署时，这一项留空即可。

### 4. 重新部署

保存环境变量后，在 Vercel 里触发一次 Redeploy。

部署成功后，站点会自动拥有一个公网网址，比如：

`https://china-tourism-weather-dashboard.vercel.app`

## 项目中的关键文件

- [src/services/weatherService.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/src/services/weatherService.ts)
  前端天气抽象层，走 `/api/weather`
- [api/weather.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/api/weather.ts)
  Vercel Serverless 天气代理接口
- [server/qweather.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/server/qweather.ts)
  和风天气请求与字段映射逻辑
- [vite.config.ts](/C:/Users/17295/Desktop/AI/china-tourism-weather-dashboard/vite.config.ts)
  本地开发时的 `/api/weather` Node 中间件

## 当前 mock 数据说明

- 包含北京、上海、广州、西安、成都、杭州、重庆、哈尔滨、沈阳、南京 10 个城市
- 每个城市至少 3 个景点
- 所有天气与人流字段都带有 `isMock` 标记
- 页面文案会明确提示当前为 mock 演示，不伪装成真实实时数据

## 未来接入真实人流 API

推荐数据源：

- 百度慧眼
- 高德商业/位置数据
- 景区官方开放接口
- 地方文旅数据平台

建议接入步骤：

1. 在 `crowdService.ts` 中新增真实 provider
2. 统一将外部字段转换为 `AttractionCrowdData`
3. 将趋势数据整理成 `TrendPoint[]`
4. 为不同来源补充 `source` 与可信度字段
5. 增加缓存、更新时间和降级提示

## TODO

1. 给 `/api/weather` 增加更细的缓存与限流
2. 为城市目录补充更多省份、城市、景点与行政编码
3. 增加地图 drill-down，支持从省到市的更精细 GeoJSON
4. 接入真实景区客流 API，并区分官方数据与估算数据来源
5. 增加多条件筛选，比如天气类型、拥挤等级、温度区间
6. 增加自动轮播模式，适合会议室或指挥大屏循环展示
7. 增加单元测试与组件测试
