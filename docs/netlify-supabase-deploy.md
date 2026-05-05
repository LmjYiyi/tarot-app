# Netlify + Supabase 部署清单

## 1. Supabase 数据库

在 Supabase 新建项目后，进入 SQL Editor，按顺序执行：

```text
supabase/migrations/001_init.sql
supabase/migrations/002_reading_feedback_context.sql
supabase/migrations/003_daily_card_preview.sql
supabase/migrations/003_bookings.sql
supabase/migrations/004_secure_public_tables.sql
```

当前后端会使用 Supabase service role client 写入和读取：

- `readings`：保存抽牌、问题、解读文本和分享页 token
- `bookings`：保存预约咨询表单

两张表都启用了 RLS。线上 API 通过 `SUPABASE_SERVICE_ROLE_KEY` 访问数据库；这个变量只能放在服务端环境变量里，不要加 `NEXT_PUBLIC_`。

`004_secure_public_tables.sql` 会移除浏览器 publishable key 对 `readings` / `bookings` 的直接写入权限。当前网站保存解读和预约都走 Next.js API route，再由服务端 Supabase client 写库，所以前端只需要公开 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，不要在浏览器直连插入这些表。

## 2. Netlify 环境变量

在 Netlify Site settings -> Environment variables 中添加：

```text
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
NEXT_PUBLIC_TAROT_REVERSED_RATE=0.35

MINIMAX_API_KEY=...
MINIMAX_MODEL=MiniMax-M2.7
MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic
MINIMAX_MAX_TOKENS=1800
MINIMAX_TEMPERATURE=0.8
MINIMAX_TIMEOUT_MS=12000
MINIMAX_MAX_RETRIES=0
MINIMAX_INTERPRETATION_MAX_TOKENS=2400
MINIMAX_INTERPRETATION_TIMEOUT_MS=22000
MINIMAX_INTERPRETATION_IDLE_TIMEOUT_MS=8000
TAROT_INTERPRET_GENERATION_MODE=legacy
TAROT_INTERPRET_API_MODE=legacy
NEXT_PUBLIC_INTERPRET_API_MODE=

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

KNOWLEDGE_MODE=static
RAG_TOP_K=8
RAG_MIN_SCORE=0.75
RAG_ENABLE_HISTORY=false
```

## 3. Netlify 构建设置

项目已包含 `netlify.toml`：

```toml
[build]
command = "npm run build"
publish = ".next"

[build.environment]
NODE_VERSION = "20"
```

Next.js App Router 的 API routes 会由 Netlify 的 Next.js adapter 自动部署为函数，不需要手写 Netlify Functions。

## 4. 部署命令

本机登录 Netlify 后执行：

```powershell
npx netlify login
npx netlify link --git-remote-url https://github.com/LmjYiyi/tarot-app.git
npx netlify deploy
```

预览地址确认无误后，再发布生产：

```powershell
npx netlify deploy --prod
```

## 5. 功能测试要点

- 完成一次抽牌解读，确认 `/api/readings` 返回分享 token。
- 打开 `/r/{token}`，确认刷新后仍能从 Supabase 读到同一条记录。
- 提交一次预约咨询，确认 Supabase `bookings` 表新增记录。
- 用 Supabase SQL Editor 执行：
  ```sql
  select count(*) from readings;
  select count(*) from bookings;
  ```
  确认解读和预约分别落库。
- 用匿名 key 直接向 `readings` / `bookings` 插入应被 RLS 拒绝；网站自己的 `/api/readings` 和 `/api/booking` 仍应成功。
- 暂时清空 Netlify 的 Supabase 变量再部署预览时，分享页不应作为生产验收通过，因为内存 fallback 只适合本地单进程调试。
- 在 Netlify Functions 日志里确认没有 `SUPABASE_SERVICE_ROLE_KEY` 缺失或 RLS 报错。

## 6. Supabase 项目创建步骤

1. 在 Supabase Dashboard 新建项目，区域优先选离主要用户近的区域。
2. 进入 Project Settings -> API，复制：
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - publishable key -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - service_role secret key -> `SUPABASE_SERVICE_ROLE_KEY`
3. 进入 SQL Editor，按第 1 节顺序执行全部迁移 SQL。
4. 本地 `.env.local` 和 Netlify 环境变量都填入同一组 Supabase 值。
5. 重新启动本地开发服务或重新部署 Netlify，让环境变量生效。
