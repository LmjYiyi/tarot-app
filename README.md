# Arcana Flow

Arcana Flow 是一个为中文用户设计的塔罗占卜 Web MVP，当前聚焦 `Phase 1`：

- 匿名访客体验
- 五种常用牌阵
- 洗牌 / 翻牌动画
- AI 解读接口
- 分享页
- 牌义与牌阵 SEO 页

当前实现采用：

- `Next.js 16` App Router
- `MiniMax` 文本模型，走 Anthropic-compatible endpoint
- `Supabase` 作为分享记录存储
- `Static knowledge provider`，并为未来 `RAG` 预留接口

## Content provenance

牌义内容当前按以下策略维护：

- 主底本优先使用 `A. E. Waite` 公有领域原典做现代中文改写
- 开源 JSON 数据集仅作为结构参考和语义校对
- `CC BY-SA` 类来源只作研究参考，不直接进入产品文案

详细说明见 [docs/tarot-sources.md](docs/tarot-sources.md)。

## Local development

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
copy .env.example .env.local
```

3. 填写最少所需配置

- `MINIMAX_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

如果没有配置 `MINIMAX_API_KEY`，应用会自动退回到本地 mock 解读，方便先跑通界面。

如果没有配置 Supabase，分享记录会退回到开发态内存存储，只适合同一进程内演示。

4. 启动开发服务器

```bash
npm run dev
```

5. 构建验证

```bash
npm run lint
npm run build
```

## Project structure

```text
src/
  app/
    api/interpret      MiniMax 解读接口
    api/readings       保存分享记录
    spreads/           牌阵页
    cards/             牌义 SEO 页
    r/[token]          分享页
  components/
    DeckShuffle        洗牌动画
    CardReveal         翻牌卡片
    ReadingExperience  抽牌与生成主流程
  content/
    cards.ts           78 张牌的版本化内容
    spreads.ts         牌阵定义
  lib/
    ai/provider.ts     模型调用
    knowledge/         知识 provider 抽象
    readings/          Supabase / memory 存储层
    tarot/             牌库与抽牌逻辑
```

## AI integration

默认模型配置：

- `MINIMAX_MODEL=MiniMax-M2.7`
- `MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic`

当前策略不是 RAG，而是：

- 静态牌义内容作为知识源
- provider 统一产出上下文
- 模型调用层注入缓存型 system/context blocks
- `/api/interpret` 可用 `TAROT_INTERPRET_GENERATION_MODE=grounded_ai` 进入实验模式：保留旧接口的咨询式生成作为主体，并把 tarot engine / v2 检索结果作为补充资料交给模型，用来增强牌位细节、组合联动和安全边界；AI 失败、质量不过或高风险命中时统一退回 KB fallback
- 后续如切到 `RAG`，只需要替换 `lib/knowledge/*`

## Future RAG hook

仓库已经预留以下开关，但当前未启用真实向量检索：

- `KNOWLEDGE_MODE=static|rag`
- `RAG_TOP_K`
- `RAG_MIN_SCORE`
- `RAG_ENABLE_HISTORY`

未来接入 RAG 时，优先沿用 Supabase：

- `knowledge_documents`
- `knowledge_chunks`
- `pgvector`

这样不需要改前端页面、抽牌流程或 `/api/interpret` 的外部协议。

## Database

初始化 SQL 已放在：

- `supabase/migrations/001_init.sql`

当前只有 `readings` 表是 Phase 1 必需。`knowledge_*` 相关表被刻意留到 Phase 2，以避免现在过早引入复杂基础设施。
