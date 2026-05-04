import fs from "fs/promises";
import path from "path";

const cwd = process.cwd();
const jsonPath = path.join(cwd, "docs", "interpret-v2-ai-enhancer-full-results.json");
const mdPath = path.join(cwd, "docs", "interpret-v2-ai-enhancer-full-results-detail.md");

async function main() {
  const data = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  let mdOutput = "# Tarot API `/api/interpret-v2` AI Enhancer Detailed Results\n\n";

  for (const row of data.results) {
    mdOutput += `## 测试用例: \`${row.caseId}\`\n`;
    mdOutput += `- **类别**: ${row.category}\n`;
    mdOutput += `- **优先级**: ${row.priority}\n`;
    mdOutput += `- **问题**: ${row.request.question || "(无问题)"}\n`;
    mdOutput += `- **牌阵**: ${row.request.spreadSlug}\n\n`;

    mdOutput += `### 响应状态: ${row.status}\n`;
    mdOutput += `- **Pipeline**: ${row.derived.pipeline}\n`;
    mdOutput += `- **AI Enhancer Eligible**: ${row.derived.aiEnhancerEligible}\n`;
    mdOutput += `- **AI Enhancer Failure Reason**: ${row.derived.aiEnhancerFailureReason || "none"}\n\n`;

    if (!row.ok) {
      mdOutput += `**错误信息**:\n\`\`\`json\n${JSON.stringify(row.response, null, 2)}\n\`\`\`\n\n`;
    } else {
      const responseData = row.response.data;
      mdOutput += `### 占卜结果\n\n`;
      if (responseData.reading && responseData.reading.summary) {
        mdOutput += `**总结**:\n${responseData.reading.summary}\n\n`;
      }

      if (responseData.cards && responseData.cards.length > 0) {
        mdOutput += `**牌面解读**:\n`;
        responseData.cards.forEach((card) => {
          mdOutput += `- **${card.positionName} - ${card.cardName}**: ${card.meaning}\n`;
        });
        mdOutput += `\n`;
      }

      if (responseData.combinations && responseData.combinations.length > 0) {
        mdOutput += `**组合解读**:\n`;
        responseData.combinations.forEach((comb) => {
          mdOutput += `- **[${comb.reason}]** ${comb.cardNames ? comb.cardNames.join(" + ") : ""} : ${comb.summary}\n`;
        });
        mdOutput += `\n`;
      }

      if (responseData.reading && responseData.reading.advice && responseData.reading.advice.length > 0) {
        mdOutput += `**建议**:\n`;
        responseData.reading.advice.forEach((adv) => (mdOutput += `- ${adv}\n`));
        mdOutput += `\n`;
      }

      if (responseData.reading && responseData.reading.feedbackQuestions && responseData.reading.feedbackQuestions.length > 0) {
        mdOutput += `**反思问题**:\n`;
        responseData.reading.feedbackQuestions.forEach((q) => (mdOutput += `- ${q}\n`));
        mdOutput += `\n`;
      }

      if (responseData.safety) {
        mdOutput += `**安全策略**: Hits=${responseData.safety.hits}, Note=${responseData.safety.note || "None"}\n\n`;
      }
    }

    mdOutput += `---\n\n`;
  }

  await fs.writeFile(mdPath, mdOutput, "utf8");
  console.log(`Detailed markdown report generated at ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
