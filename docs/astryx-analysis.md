# Astryx Analysis for teti.bot MVP

## 1. Astryx 项目结构理解

Astryx 是一个 React + StyleX 的设计系统 monorepo。核心结论：它不是一个只提供 UI 外观的组件库，而是包含主题 token、组件 API、布局约定、文档元数据、CLI 和示例工程的一套完整系统。

本次重点阅读路径：

- `/Users/macstudio/Documents/AICoRun/astryx/packages/core/src`: 核心组件和主题系统。
- `/Users/macstudio/Documents/AICoRun/astryx/packages/core/src/theme`: `defineTheme`、token 默认值、类型、CSS var helper。
- `/Users/macstudio/Documents/AICoRun/astryx/packages/themes/neutral/src`: 最适合 Teti 初版的中性主题基础。
- `/Users/macstudio/Documents/AICoRun/astryx/packages/core/src/*/*.doc.mjs`: 组件设计意图、props、best practices。
- `/Users/macstudio/Documents/AICoRun/astryx/apps/example-nextjs` 与 `apps/example-vite`: 框架接入方式参考。

包结构：

- `@astryxdesign/core`: 组件、主题系统、工具函数、公共 CSS。
- `@astryxdesign/theme-neutral`: 推荐作为 Teti 初版基础主题。它是灰度骨架 + OKLCH 色彩系统 + Lucide 风格 icon registry。
- `@astryxdesign/cli`: 组件文档、模板、主题构建、swizzle 等工具。Teti 不应 swizzle Astryx 源码，除非未来确实需要深度自定义。
- `@astryxdesign/build`: StyleX source build 支持。MVP 阶段优先使用预编译 CSS，避免引入复杂构建链。

Astryx 的主题系统：

- `defineTheme` 接收 `tokens`、`typography`、`radius`、`motion`、`color`、`components`、`icons`。
- token 是 CSS custom properties，例如 `--color-accent`、`--spacing-4`、`--radius-container`。
- token 支持 light/dark tuple，例如 `['#ffffff', '#171717']`，最终转换为 `light-dark(...)`。
- `tokenVar` / `tokenVars` 可以让非 StyleX 代码或 Tailwind/CSS Modules 仍然引用 Astryx token。

对 teti.bot 的含义：

- 不需要复制 Astryx 源码。
- 应通过 npm 包使用 `@astryxdesign/core` 与 `@astryxdesign/theme-neutral`。
- Teti 品牌层应通过 `defineTheme({ extends: neutralTheme, ... })` 或 theme CSS 构建来完成，而不是 fork / copy 组件。

## 2. 最适合 teti.bot 的组件列表

| Component | MVP 用途 | 是否采用 | 说明 |
| --- | --- | --- | --- |
| `Theme` / `defineTheme` | Teti 品牌主题入口 | 采用 | 扩展 `neutralTheme`，覆盖 Teti Blue、radius、typography 等。 |
| `Text` / `Heading` | 页面标题、说明、能力文本 | 采用 | 内置 display/body/supporting/label 语义，适合从 Figma 映射。 |
| `Stack` / `VStack` / `HStack` | 页面和行内基础排布 | 采用 | 比 `Layout` 更适合首页内容块内部排布。 |
| `Layout` | 顶层页面区域、header/content/footer | 谨慎采用 | 适合有明确 header/content/footer 的页面；MVP 首页可用 `height="auto"`，不要做 dashboard shell。 |
| `AppShell` | 应用级导航框架 | 暂不采用 | 它是 dashboard/app chrome，带 side nav / top nav / mobile nav，第一版官网入口不需要。 |
| `Grid` | 少量 stats / ability chips / responsive supplemental layout | 局部采用 | 不建议把 Teti 主列表做成 card grid。 |
| `Section` | 页面 full-width band 或 registry 区段 | 采用 | 比包一堆 Card 更符合 Astryx 设计建议。 |
| `Card` | 单个高度独立的信息块 | 少量采用 | Astryx 明确提醒 Card 不是默认布局工具；可用于 registry 外层容器或单个 featured Teti，但不应用来堆满页面。 |
| `List` / `ListItem` | Teti Registry 列表 | 强采用 | 天然支持 start/end content、description、divider、density、href/onClick。 |
| `Item` | 自定义 `TetiRow` 的底层结构 | 强采用 | `ListItem` 本身基于 `Item`，适合做 GitHub profile + agent registry 风格行项目。 |
| `Badge` | 状态标签、能力标签、版本/协议标签 | 采用 | `success/warning/error/info/neutral` 与 categorical variants 可直接表达状态和能力。 |
| `StatusDot` | online / thinking / offline presence | 强采用 | 有 accessible label、tooltip、pulse，并且专门用于 presence/status。 |
| `Button` | Connect / Download / secondary actions | 强采用 | `primary` 做 Connect；`secondary` 或 `ghost` 做 Download / Learn more。无原生 `outline` variant。 |
| `Avatar` / `AvatarStatusDot` | Teti logo 或未来个体头像 | 谨慎采用 | 当前只有 Teti logo，第一版可用 logo asset；未来多 Teti avatar 可切到 `Avatar`。 |
| `Icon` / `IconButton` | 小型辅助 icon、外链、复制、系统状态 | 采用 | 支持语义 icon registry，也可接自定义 SVG component。 |
| `Banner` | 未安装 Teti Desktop 的下载提示 | 采用 | 适合系统级提示，不要用 Card 伪装 alert。 |
| `EmptyState` | registry 为空或加载失败兜底 | 采用 | 与 MVP 数据加载状态匹配。 |
| `Spinner` / `Skeleton` | registry 加载状态 | 采用 | 连接/加载流程需要明确反馈。 |

没有发现独立公开的 `Container` 组件。Astryx 的 container 是 `Card` / `Section` / `Dialog` 内部 padding utility。Teti 页面宽度建议使用 `Layout contentWidth`、`Section`、普通 wrapper class，或者项目自己的轻量 page constraint。

## 3. teti.bot Design System 初版建议

### 颜色

Teti 初版应采用“中性界面 + 明确蓝色身份”的策略，而不是全屏蓝色 SaaS 风格。

推荐基础：

- Base theme: `neutralTheme`
- Brand accent: `--color-accent`
- Text accent: `--color-text-accent`
- Icon accent: `--color-icon-accent`
- Blue categorical: `--color-background-blue`、`--color-border-blue`、`--color-icon-blue`、`--color-text-blue`
- Status: `--color-success`、`--color-warning`、`--color-error`

可直接借用的 Astryx 蓝色：

- Core default accent: light `#0064E0` / dark `#2694FE`
- Neutral theme vivid blue: `#0074e2`
- Neutral theme blue text/icon/background token set:
  - `--color-background-blue`: light `#c4ddfb` / dark `#9eb7ff3D`
  - `--color-border-blue`: light `#b1c9e7` / dark `#6d9cfe`
  - `--color-icon-blue`: light `#00458c` / dark `#9eb7ff`
  - `--color-text-blue`: light `#00458c` / dark `#c7d3ff`

Teti Blue 初版建议：

- Primary/Teti Blue: `#0064E0` 或 `#0074E2`
- Dark-mode active blue: `#2694FE` 或 neutral theme 的 `#6D9CFE`
- Muted blue surface: 使用 `--color-background-blue`，不要手写透明蓝。
- Connect button: 使用 `--color-accent` + `--color-on-accent`。

状态映射：

- `online`: `StatusDot variant="success"`，可在真正在线/实时可连接时 `isPulsing`。
- `thinking`: `StatusDot variant="accent"` 或 `variant="warning"`。如果代表正在推理/处理中，建议 `accent + isPulsing`；如果代表需要等待/不稳定，才用 warning。
- `offline`: `StatusDot variant="neutral"`。避免用 error，offline 不一定是故障。
- `error/unreachable`: `StatusDot variant="error"`，仅用于连接失败或异常。

### Typography

Astryx 默认 type scale 是 base 14px、ratio 1.2，`neutralTheme` 使用 Figtree。对 teti.bot：

- 保留 Astryx semantic types：`display-*`、`heading-*`、`body`、`supporting`、`label`。
- 官网首屏可以用 `Heading level={1} type="display-1"`，但 registry 行内文字应使用 `Text type="body/supporting/label"`。
- 不建议把全部文字放大成 marketing hero 风格。Teti 是 companion network explorer，核心是可浏览、可比较、可连接。
- 如果品牌需要更强的技术感，可后续在 Teti theme 覆盖 `typography.body.family` / `heading.family`，但第一版可沿用 Figtree。

### Radius

Astryx 默认：

- `--radius-inner`: `4px`
- `--radius-element`: `8px`
- `--radius-container`: `12px`
- `--radius-page`: `28px`
- `--radius-full`: `9999px`

`neutralTheme` 稍微更圆：

- `--radius-inner`: `0.375rem`
- `--radius-element`: `0.625rem`
- `--radius-container`: `0.75rem`
- `--radius-page`: `1.75rem`

Teti 初版建议：

- Buttons / items: 使用 `--radius-element`
- List outer surface / registry panel: 使用 `--radius-container`
- 大页面背景区域不要都做成大圆角卡片
- Avatar/logo/presence: 使用 `--radius-full`

### Spacing

Astryx spacing 是 4px 基准：

- `--spacing-1`: 4px
- `--spacing-2`: 8px
- `--spacing-3`: 12px
- `--spacing-4`: 16px
- `--spacing-6`: 24px
- `--spacing-8`: 32px
- `--spacing-10`: 40px
- `--spacing-12`: 48px

Teti 初版建议：

- Page horizontal padding: 16px mobile / 24-32px desktop
- Registry row padding: 8-12px block, 12-16px inline
- Teti row internal gap: 8-12px
- Section gap: 32-48px
- 不要用 card grid 的大间距造成“营销展示墙”。

### Shadow

Astryx 提供 `--shadow-low`、`--shadow-med`、`--shadow-high` 与 inset selection/status shadow。Teti 初版应克制使用：

- Registry 外层可用低强度 border/background，不优先用 heavy shadow。
- Hover / selected 用 `--color-overlay-hover`、`--color-accent-muted`、`--shadow-inset-selected`。
- 连接状态不要通过阴影表达，优先用 `StatusDot` + text label。

## 4. 推荐技术架构

推荐：React + Vite + TypeScript + Astryx + Cloudflare Pages + Worker API + KV。

原因：

- MVP 是一个静态 explorer + API 数据读取，不需要 Next.js 的 SSR / RSC / app router。
- Cloudflare Pages 对 Vite 静态产物非常自然，部署链简单。
- Worker API 可以独立演进 `/api/tetis`、`/api/tetis/:id/connect`、`/api/desktop/resolve` 等接口。
- KV 足够承载第一版 Teti Registry：列表、状态摘要、能力标签、desktop deep link metadata。
- Durable Objects 可留给未来实时 presence、连接会话、agent event stream，不应第一版引入。
- Astryx 支持通过 npm 包接入，MVP 不需要 fork/copy/swizzle。

建议分层：

```text
teti-site
  apps/web or src/
    React + Vite static frontend
    Astryx Theme provider
    Teti Network Explorer UI

  workers/api or worker/
    Cloudflare Worker
    /api/tetis
    /api/tetis/:id
    /api/connect

  Cloudflare KV
    Teti Registry records
    Desktop download metadata
```

前端行为建议：

- 初始页面请求 Worker API 获取 registry。
- Connect 点击后先调用 Worker 获取 connect intent。
- 浏览器尝试打开本地 Teti Desktop deep link。
- 若未安装或超时，展示 `DownloadBanner` 引导下载安装。
- 不做用户系统、不做 chat、不做 social feed。

## 5. 第一版组件规划

建议组件目录：

```text
components/
  TetiLogo
  NetworkHero
  NetworkStats
  TetiRegistry
  TetiList
  TetiRow
  TetiStatus
  CapabilityBadges
  ConnectButton
  DownloadBanner
  SiteFooter
```

组件映射：

- `TetiLogo`: 项目自己的 logo asset。当前不要用 `Avatar` 假装有头像体系。
- `NetworkHero`: `Heading` + `Text` + `Stack`。克制表达 “An open AI companion network”。
- `NetworkStats`: 小型 `Stack` / `Grid` + `Text`。只展示必要数据，例如 active Tetis / online / capabilities。
- `TetiRegistry`: registry 区域容器，可用 `Section` 或轻 wrapper。
- `TetiList`: `List hasDividers density="balanced"`。
- `TetiRow`: 优先组合 `Item` 或 `ListItem`，用 `startContent` 放 logo/status，用 `endContent` 放 `ConnectButton`。
- `TetiStatus`: `StatusDot` + visible label。不要只给颜色点。
- `CapabilityBadges`: `Badge` variants，例如 `blue`、`teal`、`purple`、`neutral`。
- `ConnectButton`: `Button variant="primary"`；连接中用 `isLoading` 或 `clickAction`。
- `DownloadBanner`: `Banner`，当未检测到 desktop 或连接失败时出现。
- `SiteFooter`: 简单 links / version / protocol note，使用 `Text type="supporting"`。

不建议第一版组件：

- `DashboardShell`
- `SideNav`
- `ChatPage`
- `UserProfile`
- `Feed`
- `CMSRenderer`
- 大量 `TetiCard` grid

## 6. Cloudflare 部署建议

### Pages

- 使用 Cloudflare Pages 部署 Vite 静态产物。
- Build command: `npm run build`
- Output directory: `dist`
- 环境变量只放公开配置，例如 API base path。敏感配置放 Worker。

### Workers

Worker 负责 registry API 和连接 intent：

- `GET /api/tetis`: 返回 Teti 列表摘要。
- `GET /api/tetis/:id`: 返回单个 Teti 详情。
- `POST /api/tetis/:id/connect`: 返回 desktop deep link、fallback download URL、intent expiration。
- `GET /api/desktop`: 返回当前平台下载信息。

Worker 返回数据应直接服务 MVP UI，不要把 CMS 或复杂用户状态提前塞进去。

### KV

KV 初版存储：

- `teti:list`: registry ordering / featured ids
- `teti:{id}`: name、summary、status、capabilities、connect metadata
- `desktop:latest`: macOS / Windows / Linux 下载地址和版本

注意：

- KV 是 eventually consistent，不适合未来实时 presence。
- 第一版 `online/thinking/offline` 可以是 registry snapshot 或 Worker 聚合结果。
- 未来如果状态需要强一致、实时连接、session routing，再引入 Durable Objects。

### Durable Objects

暂不进入 MVP。未来使用场景：

- 实时 Teti presence
- connection session
- pairing handshake
- per-Teti event stream

## 关键判断

### 1. 为什么 teti.bot 不应该使用传统 SaaS Dashboard UI？

teti.bot 第一版不是登录后的工作台，也不是用户管理后台。用户来到首页的任务是理解网络、浏览当前存在的 Teti、判断状态与能力、点击 Connect。传统 dashboard 的 side nav、复杂表格、设置页、密集 KPI 会把“AI companion identity network”的入口感变成管理软件。Astryx 的 `AppShell` 很强，但它服务 dashboard/app chrome；Teti MVP 更适合 registry layout：轻顶部、清晰 hero、可扫描列表、少量状态和行动。

### 2. 为什么 Teti List 应该优先使用 List/Item 而不是 Card Grid？

Teti 列表的核心是比较和选择：名称、身份说明、在线状态、能力、连接动作。行式 list 比 card grid 更利于扫描、排序、状态对齐和移动端压缩。Astryx 自己的 Card 文档也强调：Card 只适合“可独立重排/移除/比较的离散对象”，不是默认布局工具。Teti registry 可以把每个 Teti 当作 item，但不需要把每个 item 都包装成大 card。最佳形态更接近 GitHub profile row + AI agent registry row：左侧身份，中间状态/能力，右侧 Connect。

### 3. 哪些 Astryx 组件可以直接帮助实现 Figma 设计稿？

最直接可映射：

- Typography: `Heading`、`Text`
- Layout: `Stack`、`VStack`、`HStack`、`Grid`、`Section`、`Layout`
- Registry rows: `List`、`ListItem`、`Item`
- Actions: `Button`、`IconButton`
- Status: `StatusDot`、`Badge`、`Banner`
- Identity/media: `Avatar`、`AvatarStatusDot`、`Icon`
- Loading/empty: `Spinner`、`Skeleton`、`EmptyState`

Figma 设计稿里如果出现“描边按钮”，需要注意 Astryx Button 没有原生 `outline` variant。可以先映射为 `secondary` / `ghost`，若视觉必须是 outline，再通过 Teti theme 的 `components.button` 增加 variant override。

### 4. 未来 Figma 设计稿如何映射到 React Component？

建议映射规则：

- Figma color styles -> Astryx tokens / Teti theme tokens。
- Figma text styles -> `Heading` / `Text` semantic type，而不是逐个写 font-size。
- Figma spacing -> Astryx spacing steps，优先 4px scale。
- Figma radius -> `--radius-element` / `--radius-container` / `--radius-full`。
- Figma row/list component -> `TetiRow` built from `Item` or `ListItem`。
- Figma status chip -> `Badge` + optional `StatusDot`。
- Figma primary CTA -> `Button variant="primary"`。
- Figma secondary CTA -> `Button variant="secondary"` 或 `ghost`，必要时主题扩展。
- Figma page sections -> `Section` / `Stack`，不要默认包 Card。

下一阶段拿到 Figma 链接后，应该先建立一张 mapping 表：

| Figma node | React component | Astryx primitive | Token dependency |
| --- | --- | --- | --- |
| Hero title | `NetworkHero` | `Heading` | `--text-display-*` |
| Registry row | `TetiRow` | `Item` / `ListItem` | spacing, text, status tokens |
| Connect CTA | `ConnectButton` | `Button` | `--color-accent` |
| Status | `TetiStatus` | `StatusDot` + `Text` | success/accent/neutral |
| Capability | `CapabilityBadges` | `Badge` | categorical color tokens |

## 当前阶段约束

本报告只完成 Astryx 学习、架构分析和设计系统准备。没有修改 Astryx 源码，没有 fork/copy Astryx，没有创建页面，没有生成 UI，没有创建 React 组件。
