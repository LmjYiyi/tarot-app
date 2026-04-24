# Tarot Source Policy

Arcana Flow 当前的塔罗文案来源遵循“可商用、可追溯、可持续重写”的原则。

## Primary source

- `A. E. Waite, The Pictorial Key to the Tarot`（1911 版）
  - 公开可访问版本可见于 Sacred Texts。
  - Sacred Texts 页面明确说明该文本与插图在美国因发表于 1923 年前而属于 public domain。
  - 产品内文案不直接复制原始英文段落，而是基于公有领域原典做现代中文改写。

## Secondary reference sources

- `dariusk/corpora`
  - 仓库 README 明确采用 `CC0`。
  - 其中 `data/divination/tarot_interpretations.json` 可作为结构参考与语义对照。
  - 但该文件自身标注来源为 Mark McElroy 的《A Guide to Tarot Meanings》，所以它不是 Waite 原典整理，不作为产品主底本。

## Reference-only sources

- Wikipedia 各牌条目
  - 适合交叉核对图像叙述、常见解释与术语。
  - 因其内容为 `CC BY-SA`，不直接进入产品文案。

- `ekelen/tarot-api`
  - 数据内容明显接近 Waite 体系，适合研发阶段做结构和字段参考。
  - 但当前未在仓库元数据中确认出清晰许可证，因此不直接并入产品内容。

## Current policy

- 产品内牌义文案优先来自 Waite 公有领域原典的中文改写。
- 开源 JSON 数据集只作为辅助校对，不作为直接拷贝来源。
- 所有新增牌义都应避免长段英文直译，保持现代中文、可执行、少玄谈的风格。

## Implementation direction

下一步若继续强化数据质量，优先做这两件事：

1. 建立一个 `scripts/import-waite-minors.*`，把 Waite 小阿卡纳的正位 / 逆位原文整理成本地结构化草稿。
2. 在生成脚本后接一层中文改写器，输出符合当前产品语气的数据文件，而不是把英文原文直接塞进运行时。
