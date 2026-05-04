# Netlify + Supabase 部署清单

## 1. Supabase 数据库

在 Supabase 新建项目后，进入 SQL Editor，按顺序执行：

```text
supabase/migrations/001_init.sql
supabase/migrations/002_reading_feedback_context.sql
supabase/migrations/003_daily_card_preview.sql
supabase/migrations/003_bookings.sql
```

当前后端会使用 Supabase service role client 写入和读取：

- `readings`：保存抽牌、问题、解读文本和分享页 token
- `bookings`：保存预约咨询表单

两张表都启用了 RLS。线上 API 通过 `SUPABASE_SERVICE_ROLE_KEY` 访问数据库；这个变量只能放在服务端环境变量里，不要加 `NEXT_PUBLIC_`。

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
MINIMAX_TIMEOUT_MS=15000
MINIMAX_MAX_RETRIES=0
MINIMAX_INTERPRETATION_MAX_TOKENS=2400
MINIMAX_INTERPRETATION_TIMEOUT_MS=45000
TAROT_INTERPRET_GENERATION_MODE=legacy
TAROT_INTERPRET_API_MODE=legacy
NEXT_PUBLIC_INTERPRET_API_MODE=

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
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
- 暂时清空 Netlify 的 Supabase 变量再部署预览时，分享页不应作为生产验收通过，因为内存 fallback 只适合本地单进程调试。
- 在 Netlify Functions 日志里确认没有 `SUPABASE_SERVICE_ROLE_KEY` 缺失或 RLS 报错。
