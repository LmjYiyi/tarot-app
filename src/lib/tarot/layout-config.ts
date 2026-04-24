export type LayoutPreset = {
  aspectRatio: string;
  cardWidth: string; // Tailwind 响应式宽度类名，桌面端为主
  positions: Record<number, { x: number; y: number; rotate?: number }>;
};

export const layoutPresets: Record<string, LayoutPreset> = {
  "single-guidance": {
    aspectRatio: "aspect-[4/3]",
    cardWidth: "md:w-[16%] lg:w-[14%]",
    positions: { 1: { x: 50, y: 50 } },
  },
  "three-card": {
    aspectRatio: "aspect-[2/1]",
    cardWidth: "md:w-[14%] lg:w-[12%]",
    positions: {
      1: { x: 25, y: 50 },
      2: { x: 50, y: 50 },
      3: { x: 75, y: 50 },
    },
  },
  "career-five": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%] lg:w-[11%]",
    // 中心 + 四向，坐标彻底拉开，避免遮挡
    positions: {
      1: { x: 50, y: 52 }, // 现状 (中心)
      2: { x: 76, y: 52 }, // 阻碍 (右侧)
      3: { x: 24, y: 52 }, // 优势 (左侧)
      4: { x: 50, y: 18 }, // 近期发展 (上方)
      5: { x: 50, y: 86 }, // 结果建议 (下方)
    },
  },
  "cross-five": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%] lg:w-[11%]",
    // 标准十字分布
    positions: {
      1: { x: 50, y: 50 }, // 核心
      2: { x: 24, y: 50 }, // 过去
      3: { x: 50, y: 18 }, // 现在
      4: { x: 76, y: 50 }, // 未来
      5: { x: 50, y: 86 }, // 阻碍/帮助
    },
  },
  "relationship-six": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[11%] lg:w-[10%]",
    // 2x3 结构
    positions: {
      1: { x: 25, y: 30 }, // 我
      2: { x: 75, y: 30 }, // 对方
      3: { x: 50, y: 30 }, // 现状
      4: { x: 50, y: 75 }, // 阻碍
      5: { x: 25, y: 75 }, // 未来
      6: { x: 75, y: 75 }, // 建议
    },
  },
  "lovers-pyramid": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%] lg:w-[11%]",
    // 金字塔：上1，中2，下1
    positions: {
      1: { x: 32, y: 65 }, // 你
      2: { x: 68, y: 65 }, // 对方
      3: { x: 50, y: 35 }, // 关系
      4: { x: 50, y: 10 }, // 发展 (塔尖)
    },
  },
  "path-of-choice": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[10%] lg:w-[9.5%]",
    // A/B 路线对比，中间夹着建议
    positions: {
      1: { x: 22, y: 35 }, // A现状
      2: { x: 22, y: 75 }, // A结果
      3: { x: 78, y: 35 }, // B现状
      4: { x: 78, y: 75 }, // B结果
      5: { x: 50, y: 20 }, // 隐藏因素
      6: { x: 50, y: 55 }, // 建议
      7: { x: 50, y: 90 }, // 总结
    },
  },
  "self-state": {
    aspectRatio: "aspect-[16/10]",
    cardWidth: "md:w-[12%] lg:w-[11%]",
    // 另一种五点布局：内外左右，下沉建议
    positions: {
      1: { x: 50, y: 22 }, // 外在
      2: { x: 50, y: 54 }, // 内在
      3: { x: 22, y: 54 }, // 压力源
      4: { x: 78, y: 54 }, // 需看见
      5: { x: 50, y: 88 }, // 调整方向
    },
  },
  "celtic-cross": {
    aspectRatio: "aspect-[16/11]",
    cardWidth: "md:w-[10%] lg:w-[9.5%]",
    // 经典的复杂布局，唯一允许重叠的牌阵
    positions: {
      1: { x: 35, y: 50 }, // 核心
      2: { x: 35, y: 50, rotate: 90 }, // 阻碍 (重叠交叉)
      3: { x: 15, y: 50 }, // 过去
      4: { x: 35, y: 20 }, // 理想
      5: { x: 35, y: 80 }, // 远因
      6: { x: 55, y: 50 }, // 未来走向
      7: { x: 80, y: 85 }, // 态度
      8: { x: 80, y: 65 }, // 环境
      9: { x: 80, y: 45 }, // 希望/担心
      10: { x: 80, y: 25 }, // 最终
    },
  },
};
