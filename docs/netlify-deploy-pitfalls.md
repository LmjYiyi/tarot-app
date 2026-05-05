# Netlify 部署避坑指南

这份记录来自 2026-05-05 的 `tarot-app` 首次 Netlify + Supabase 部署。重点不是“理论正确”，而是以后遇到同类问题时能快速判断和处理。

## 当前推荐配置

`package.json`：

```json
{
  "scripts": {
    "build": "next build --webpack"
  }
}
```

`next.config.ts`：

```ts
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
};
```

`netlify.toml`：

```toml
[build]
command = "npm run build"
publish = ".next"

[build.environment]
NODE_VERSION = "20"
```

`public/_redirects`：

```text
/_next/image?url=:url&w=:width&q=:quality  /.netlify/images?url=:url&w=:width&q=:quality  200
/_ipx/*  /.netlify/images?url=:url&w=:width&q=:quality  200
```

## 坑 1：Turbopack NFT tracing warning 会阻断 Netlify CLI deploy

### 现象

本地 `next build` 能成功，但 `npx netlify deploy --json` 失败，输出类似：

```text
Turbopack build encountered 1 warnings:
Encountered unexpected file in NFT list
```

### 原因

`src/lib/tarot-kb/loader.ts` 运行时读取 `tarot-data/...` 文件。Turbopack 的 tracing 会把这类文件系统读取识别成“可能追踪整个项目”，Netlify CLI 在部署流程里把 warning 当成失败处理。

### 处理

用 webpack 构建：

```json
"build": "next build --webpack"
```

项目本地 dev 本来也使用 `next dev --webpack`，所以这个选择和当前项目更一致。

## 坑 2：Windows 本地 Netlify Next 插件可能在发布静态目录阶段失败

### 现象

`npm run build` 成功，Netlify 插件也生成了函数，但 `netlify deploy` / `netlify build` 失败：

```text
Plugin "@netlify/plugin-nextjs" failed
Error: Failed publishing static content
```

### 原因

发生在 `@netlify/plugin-nextjs` 的 `publishStaticDir` 阶段，插件会 rename `.next` 和 `.netlify/static`。Windows 本地文件锁、目录状态或插件行为可能导致这个步骤失败。

### 处理

如果 `.netlify/static` 和 `.netlify/functions-internal` 已经生成，可以绕过本地 build 阶段直接上传：

```powershell
npx netlify deploy --no-build --dir .netlify/static --functions .netlify/functions-internal --json
```

预览确认正常后，把成功的 deploy 提升为生产：

```powershell
node -e "const { spawnSync } = require('child_process'); const bin='C:/Users/admin/AppData/Local/npm-cache/_npx/90d26507e643fcc0/node_modules/netlify/bin/run.js'; const data=JSON.stringify({site_id:'<site_id>', deploy_id:'<deploy_id>'}); const r=spawnSync(process.execPath,[bin,'api','restoreSiteDeploy','--data',data],{encoding:'utf8'}); console.log(r.stdout); console.error(r.stderr); process.exit(r.status ?? 1);"
```

注意：PowerShell 直接传 JSON 给 `npx netlify api ... --data` 容易转义失败，用 Node `spawnSync` 更稳。

## 坑 3：图片原文件 200，但页面图片加载失败

### 现象

这些原图能打开：

```text
/tarot/the-fool.jpg
/spreads/site-edge-background-clean.jpg
```

但页面里的图片不显示，检查 HTML 发现 Next 输出的是：

```text
/_next/image?url=%2Ftarot%2Fthe-fool.jpg&w=3840&q=75
```

访问 `/_next/image?...` 返回 500。

### 原因

这次部署曾绕过 Netlify 插件的完整发布步骤，导致 Next Image 优化路由/redirect 没有按正常方式生效。Netlify Image CDN 的底层路径其实可用：

```text
/.netlify/images?url=%2Ftarot%2Fthe-fool.jpg&w=3840&q=75
```

但页面仍请求 `/_next/image?...`，于是线上图片失败。

### 推荐处理

对当前项目，直接关闭 Next 图片优化：

```ts
images: {
  unoptimized: true,
}
```

理由：

- 当前图片都在 `public/` 下，原图路径稳定。
- 部署路径里已经出现过 Netlify Image rewrite 缺失。
- 塔罗牌图和 spread 图优先需要稳定显示，而不是依赖优化链路。

发布后验收 HTML：

```powershell
$html = (Invoke-WebRequest -Uri "https://lmjyiyi-tarot-app.netlify.app/spreads" -UseBasicParsing).Content
[regex]::Matches($html, 'src="([^"]+)"') |
  ForEach-Object { $_.Groups[1].Value } |
  Where-Object { $_ -match '_next/image|spreads|visuals|tarot' } |
  Select-Object -First 12
```

通过标准：不应再看到 `/_next/image?...`，应该看到 `/spreads/...`、`/visuals/...`、`/tarot/...`。

## 坑 4：Netlify blob 上传偶发失败

### 现象

部署上传阶段失败：

```text
Error uploading blobs to deploy store: fetch failed
```

### 处理

先重试。这个错误可能是临时网络或 Netlify CLI 上传阶段的问题。

```powershell
npx netlify deploy --no-build --dir .netlify/static --functions .netlify/functions-internal --json
```

如果连续失败：

1. 先确认本地 build 和 `.netlify/static` 没问题。
2. 降低对 Netlify Image / blobs 的依赖，比如关闭 Next Image 优化。
3. 成功生成 preview 后，用 `restoreSiteDeploy` 提升到 production，避免重复上传同一份产物。

## Supabase 建表和验收

用 Supabase MCP 应用幂等迁移，确保：

- `public.readings` 存在
- `public.bookings` 存在
- 两张表 RLS 开启
- `anon` / publishable key 不能直接写表
- `service_role` 只能放服务端环境变量

MCP 验收：

```text
list_tables schemas=["public"] verbose=true
get_advisors type="security"
```

这次结果：

- `readings` / `bookings` 均存在
- RLS 已开启
- security advisor 无 lint

## Netlify 环境变量

必须有：

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MINIMAX_API_KEY
MINIMAX_MODEL
MINIMAX_BASE_URL
MINIMAX_TIMEOUT_MS
MINIMAX_INTERPRETATION_TIMEOUT_MS
MINIMAX_INTERPRETATION_IDLE_TIMEOUT_MS
KNOWLEDGE_MODE
RAG_TOP_K
RAG_MIN_SCORE
RAG_ENABLE_HISTORY
```

线上 MiniMax 超时要短于 Netlify 函数实际可用时间。当前建议：

```text
MINIMAX_TIMEOUT_MS=12000
MINIMAX_INTERPRETATION_TIMEOUT_MS=22000
MINIMAX_INTERPRETATION_IDLE_TIMEOUT_MS=8000
```

如果这里设成 `45000` 或 `60000`，MiniMax 没及时返回时，Netlify 可能先把函数切掉，用户看到的是 `502`，而不是应用自己的 `ai_failed_fallback`。

检查 Netlify 环境变量 key，不要打印值：

```powershell
$raw = npx netlify env:list --json
$obj = $raw | ConvertFrom-Json
$obj.PSObject.Properties.Name | Sort-Object
```

## 生产验收清单

部署后至少检查：

```powershell
Invoke-WebRequest -Uri "https://lmjyiyi-tarot-app.netlify.app" -UseBasicParsing
Invoke-WebRequest -Uri "https://lmjyiyi-tarot-app.netlify.app/api/kb-health" -UseBasicParsing
Invoke-WebRequest -Uri "https://lmjyiyi-tarot-app.netlify.app/tarot/the-fool.jpg" -Method Head -UseBasicParsing
Invoke-WebRequest -Uri "https://lmjyiyi-tarot-app.netlify.app/spreads/site-edge-background-clean.jpg" -Method Head -UseBasicParsing
```

通过标准：

- 首页 `200`
- `/api/kb-health` `200`
- 牌图 `200 image/jpeg`
- spread 背景图 `200 image/jpeg`
- 页面 HTML 不再包含 `/_next/image?...`

## 安全提醒

如果 `SUPABASE_SERVICE_ROLE_KEY` 曾经出现在聊天、日志、截图或任何公共位置，上线前应在 Supabase Dashboard 轮换密钥。这个 key 可以绕过 RLS，不能放进任何 `NEXT_PUBLIC_` 变量，也不能提交到 git。

## 坑 5：线上 AI 生成超过 10 秒时，不要只依赖 `process.env.NETLIFY`

本地 `/api/interpret` 可以正常返回但耗时约 13 秒时，部署到 Netlify 后如果仍走 streamed response，可能遇到更短的 streaming 连接限制，前端表现为失败、空响应、502 或连接中断。

项目在 Netlify 上应该把 `ReadableStream` 先读成完整文本再返回，走 buffered synchronous function。判断线上函数运行时不要只看 `process.env.NETLIFY`，因为 Netlify 函数运行时默认保证的只读变量主要是 `SITE_NAME`、`SITE_ID`、`URL` 以及 AWS 运行时变量。更稳的判断条件：

```ts
process.env.NETLIFY ||
process.env.SITE_ID ||
process.env.AWS_LAMBDA_FUNCTION_NAME ||
process.env.LAMBDA_TASK_ROOT
```

同时保持 MiniMax 超时短于平台可用时间：

```text
MINIMAX_TIMEOUT_MS=12000
MINIMAX_INTERPRETATION_TIMEOUT_MS=22000
MINIMAX_INTERPRETATION_IDLE_TIMEOUT_MS=8000
```

部署后看响应头或 Functions 日志：

```text
x-interpretation-pipeline
x-interpretation-fallback-reason
x-interpretation-ms
```

如果看到 `ai_failed_fallback`，说明应用层兜底生效；如果仍是 502/连接中断，优先检查环境变量是否带有 Functions scope，并重新 build/deploy。
