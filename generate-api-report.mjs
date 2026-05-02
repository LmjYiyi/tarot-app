import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const allTests = [
  {
    id: "T01",
    name: "面试顺利吗 (事业/建议, 宝剑十正位)",
    payload: {
      question: "我明天的面试会顺利吗？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "career", goal: "advice" },
      cards: [{ cardId: "swords-10-swords-ten", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T02",
    name: "面试失败焦虑 (事业/建议, 触发降级)",
    payload: {
      question: "我明天面试会不会失败？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "career", goal: "advice" },
      cards: [{ cardId: "swords-10-swords-ten", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T07",
    name: "感情复合 (感情/趋势, 圣杯四)",
    payload: {
      question: "前任会回来吗？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "love", goal: "trend" },
      cards: [{ cardId: "cups-04-cups-four", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T11",
    name: "明天考试 (学业/建议, 星币八)",
    payload: {
      question: "明天考试能过吗？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "study", goal: "advice" },
      cards: [{ cardId: "pentacles-08-pentacles-eight", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T16",
    name: "投资 All-in (决策/降风险, 宝剑三)",
    payload: {
      question: "我要不要 all in 买这只股票？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "decision", goal: "decision" },
      cards: [{ cardId: "swords-03-swords-three", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T20",
    name: "异常 CardId 处理",
    payload: {
      question: "我想看看当前的个人能量状态。",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "self", goal: "advice" },
      cards: [{ cardId: "invalid-card-id-123", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T24",
    name: "三张牌阵基础 (时间线结构)",
    payload: {
      question: "最近的工作状态怎么样？",
      spreadSlug: "three-card",
      locale: "zh-CN",
      readingIntent: { domain: "career", goal: "trend" },
      cards: [
        { cardId: "wands-06-wands-six", positionOrder: 1, reversed: false },
        { cardId: "cups-04-cups-four", positionOrder: 2, reversed: false },
        { cardId: "pentacles-08-pentacles-eight", positionOrder: 3, reversed: false },
      ],
    }
  },
  {
    id: "T29",
    name: "用户反馈吸收验证",
    payload: {
      question: "我想看看当前的内在指引。",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "self", goal: "advice" },
      cards: [{ cardId: "wands-06-wands-six", positionOrder: 1, reversed: false }],
      userFeedback: { overallFeeling: "我今天感觉非常自信，但也担心这种状态不能持久。" }
    }
  }
];

async function generate() {
  let report = `# Arcana Flow API 测试报告\n\n`;
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  report += `测试基准: ${BASE}/api/interpret\n\n`;
  
  report += `## 1. 测试概览\n\n`;
  report += `| ID | 场景名称 | 状态 | 模型 | Pipeline | 结论 |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const details = [];

  for (const test of allTests) {
    console.log(`Running ${test.id}...`);
    try {
      const res = await fetch(`${BASE}/api/interpret`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(test.payload),
      });

      const status = res.status;
      const model = res.headers.get("x-model") || "N/A";
      const pipeline = res.headers.get("x-interpretation-pipeline") || "N/A";
      const body = await res.text();

      report += `| ${test.id} | ${test.name} | ${status} | ${model} | ${pipeline} | ✅ 通过 |\n`;
      
      details.push(`### Case ${test.id}: ${test.name}\n\n` +
        `**Metadata:**\n` +
        `- Status: \`${status}\`\n` +
        `- Model: \`${model}\`\n` +
        `- Pipeline: \`${pipeline}\`\n` +
        `- Fallback Reason: \`${res.headers.get("x-interpretation-fallback-reason") || 'none'}\`\n\n` +
        `**Request Payload:**\n\`\`\`json\n${JSON.stringify(test.payload, null, 2)}\n\`\`\`\n\n` +
        `**Response Body:**\n\n${body}\n\n---\n`);
    } catch (err) {
      report += `| ${test.id} | ${test.name} | ERR | - | - | ❌ 失败 |\n`;
      details.push(`### Case ${test.id}: ${test.name}\n\n**Error:** ${err.message}\n\n---\n`);
    }
  }

  report += `\n## 2. 详细解读结果\n\n`;
  report += details.join("\n");

  fs.writeFileSync('API_TEST_REPORT.md', report, 'utf8');
  console.log("Report generated: API_TEST_REPORT.md");
}

generate();
