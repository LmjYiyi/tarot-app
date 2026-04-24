# Arcana Flow 项目指南 (GEMINI.md)

## 项目概览
Arcana Flow 是一个为中文用户设计的塔罗占卜 Web MVP。它通过现代化的 Web 技术提供沉浸式的占卜体验，结合 AI 技术提供深度且个性化的牌义解读。

### 核心技术栈
- **前端框架**: Next.js 16 (App Router)
- **UI 库**: React 19, Tailwind CSS v4
- **动画引擎**: Framer Motion (用于洗牌、翻牌等交互)
- **AI 集成**: MiniMax (通过 Anthropic SDK 兼容接口调用)
- **后端/数据库**: Supabase (用于存储分享记录，预留 RAG 支持)
- **数据校验**: Zod

## 项目结构
- `src/app/`: 路由页面和 API 端点。
  - `api/interpret/`: AI 解读核心接口。
  - `api/readings/`: 存储和获取分享记录。
  - `spreads/`, `cards/`: 牌阵和牌义 SEO 页面。
- `src/components/`: 交互组件。
  - `DeckShuffle.tsx`: 洗牌动画逻辑。
  - `CardReveal.tsx`: 翻牌动画逻辑。
  - `ReadingExperience.tsx`: 抽牌主流程容器。
- `src/content/`: 静态知识库。
  - `cards.ts`: 78 张牌的核心定义与中文描述。
  - `spreads.ts`: 常用牌阵（如凯尔特十字、身心灵等）的定义。
- `src/lib/`: 核心业务逻辑。
  - `ai/`: 模型调用层，支持 Mock 模式。
  - `interpretation/`: 提示词工程（Prompt Engineering）与上下文构建逻辑。
  - `knowledge/`: 知识 Provider 抽象层，支持 static 和 RAG 模式。
  - `tarot/`: 牌库管理、抽牌算法与类型定义。
- `tarot-data/`: 牌义的原始文案数据（用于构建 `src/content/`）。
- `supabase/`: 数据库初始化与迁移脚本。

## 关键流程
1. **抽牌流程**: `ReadingExperience` 协调 `DeckShuffle` 进行洗牌，用户点击卡片触发 `CardReveal`。
2. **AI 解读**: 
   - 前端收集问题、牌阵、抽牌结果和用户反馈。
   - `src/lib/interpretation/context.ts` 根据牌阵 slug 选择对应的 `ResponseBlueprint`。
   - 构建包含系统提示词、知识块和用户输入的高质量上下文。
   - 调用 `generateInterpretation` 获取流式响应。
3. **分享机制**: 用户可将解读保存到 Supabase，生成唯一的 `share_token` 进行分享。

## 开发与运维
### 常用命令
- `npm install`: 安装依赖。
- `npm run dev`: 启动开发服务器（默认启用 Webpack 以兼容某些旧版构建需求）。
- `npm run build`: 执行生产环境构建。
- `npm run lint`: 执行代码规范检查。

> **注意**：改动后的代码，不需要重新执行 `npm build`。用户会自行停止工程项目，然后手动运行。

### 环境变量
参考 `.env.example`：
- `MINIMAX_API_KEY`: 必须。若缺失则自动回退至本地 Mock 解读。
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: 可选。用于开启云端存储支持。

## 开发约定
- **类型安全**: 严格使用 `src/lib/tarot/types.ts` 中定义的类型。
- **提示词工程**: 修改解读逻辑时，优先调整 `src/lib/interpretation/context.ts` 中的 `ResponseBlueprint` 或推理规则。
- **组件规范**: 动画交互组件优先使用 `framer-motion`。
- **内容来源**: 牌义文案遵循现代中文改写规范，参考 `docs/tarot-sources.md`。

## 未来规划 (Phase 2+)
- **RAG 支持**: 接入 `pgvector` 实现基于用户历史或更深层典籍的向量检索。
- **适配性追问**: 增强抽牌后的 AI 引导交互。
- **用户系统**: 引入正式的用户账户管理（当前为匿名/分享模式）。
