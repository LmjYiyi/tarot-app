// api-smoke-test.mjs
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const smokeTests = [
  {
    id: "T01",
    name: "面试顺利吗 (Career/Advice, Swords 10 Upright)",
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
    name: "面试失败焦虑 (Career/Advice, Swords 10 Upright)",
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
    name: "感情复合 (Love/Trend, Cups 4)",
    payload: {
      question: "前任会回来吗？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "love", goal: "trend" },
      cards: [{ cardId: "cups-04-cups-four", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T08",
    name: "对方想法 (Love/Other view, Cups 2)",
    payload: {
      question: "他还爱我吗？",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "love", goal: "other_view" },
      cards: [{ cardId: "cups-02-cups-two", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T11",
    name: "明天考试 (Study/Advice, Pentacles 8)",
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
    name: "投资 all in (Decision/Decision, Swords 3)",
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
    name: "坏 cardId (Invalid ID)",
    payload: {
      question: "针对“单张建议牌”，我想看看当前的个人能量状态和内在指引。",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "self", goal: "advice" },
      cards: [{ cardId: "swords-ten", positionOrder: 1, reversed: false }],
    }
  },
  {
    id: "T24",
    name: "三张牌基础 (Three-card spread)",
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
  }
];

async function runTest(test) {
  console.log(`\n--- Running Test: ${test.id} - ${test.name} ---`);
  try {
    const res = await fetch(`${BASE}/api/interpret`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(test.payload),
    });

    console.log("status=", res.status);
    console.log("x-model=", res.headers.get("x-model"));
    console.log("x-pipeline=", res.headers.get("x-interpretation-pipeline"));
    console.log("x-fallback=", res.headers.get("x-interpretation-fallback-reason"));
    
    const body = await res.text();
    console.log("Body:");
    console.log(body);
    console.log(`--- End of Test: ${test.id} ---\n`);
  } catch (err) {
    console.error(`Error running test ${test.id}:`, err.message);
  }
}

async function main() {
  const targetId = process.argv[2];
  if (targetId) {
    const test = smokeTests.find(t => t.id === targetId);
    if (test) {
      await runTest(test);
    } else {
      console.error(`Test ID ${targetId} not found.`);
    }
  } else {
    for (const test of smokeTests) {
      await runTest(test);
    }
  }
}

main();
