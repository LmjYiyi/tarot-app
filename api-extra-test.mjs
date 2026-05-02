// api-extra-test.mjs
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const extraTests = [
  {
    id: "T29",
    name: "用户反馈 (User feedback inclusion)",
    payload: {
      question: "针对“单张建议牌”，我想看看当前的个人能量状态和内在指引。",
      spreadSlug: "single-guidance",
      locale: "zh-CN",
      readingIntent: { domain: "self", goal: "advice" },
      cards: [{ cardId: "wands-06-wands-six", positionOrder: 1, reversed: false }],
      userFeedback: { overallFeeling: "我今天感觉非常自信，但也担心这种状态不能持久。" }
    }
  },
  {
    id: "T30",
    name: "长问题 (Long question test)",
    payload: {
      question: "我目前在一家初创互联网公司担任高级产品经理已经两年了，最近公司面临融资困难，团队士气比较低迷。我个人在过去几个月里负责的项目虽然上线了但反馈平平，这让我开始怀疑自己的能力。同时，我收到了一家大型外企的面试邀请，那里的企业文化和现在的环境完全不同。我非常纠结是应该留下来陪公司度过难关，毕竟这里有我投入了很多心血的产品，还是应该选择去更稳定的平台。我担心离开会被认为是不负责任，也担心留下来会浪费职业生涯的黄金期。我明天的面试准备并不充分，因为我还在处理现在的紧急bug，我该怎么办？这种纠结已经严重影响了我的睡眠和日常生活，我希望通过这次占卜能看清我内心真正的声音，以及在职业发展上最理智的下一步动作是什么。我是否应该在面试中坦诚我现在的纠结，还是表现得全力以赴？如果我留下来，我的努力会被看到吗？如果我离开，我的产品会夭折吗？我真的很难做决定。",
      spreadSlug: "career-five",
      locale: "zh-CN",
      readingIntent: { domain: "career", goal: "decision" },
      cards: [
        { cardId: "pentacles-10-pentacles-ten", positionOrder: 1, reversed: false },
        { cardId: "swords-03-swords-three", positionOrder: 2, reversed: false },
        { cardId: "wands-06-wands-six", positionOrder: 3, reversed: false },
        { cardId: "cups-02-cups-two", positionOrder: 4, reversed: false },
        { cardId: "pentacles-08-pentacles-eight", positionOrder: 5, reversed: false },
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
    
    const body = await res.text();
    console.log("Body Length:", body.length);
    if (body.includes("自信") && test.id === "T29") console.log("Found user feedback in response!");
    console.log(body.substring(0, 500) + "...");
    console.log(`--- End of Test: ${test.id} ---\n`);
  } catch (err) {
    console.error(`Error running test ${test.id}:`, err.message);
  }
}

async function main() {
  for (const test of extraTests) {
    await runTest(test);
  }
}

main();
