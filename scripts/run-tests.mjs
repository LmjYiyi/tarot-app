import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { setTimeout as sleep } from 'timers/promises';

const cwd = process.cwd();
const port = 3000;
const baseUrl = `http://127.0.0.1:${port}`;

async function main() {
  console.log('Starting Next.js server on port 3000...');
  const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');
  const server = spawn(process.execPath, [nextBin, 'dev', '-p', String(port)], { cwd });
  
  // Output some logs to see if it's starting
  server.stdout.on('data', d => process.stdout.write(d));
  server.stderr.on('data', d => process.stderr.write(d));

  try {
    // Wait for server
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(`${baseUrl}/api/kb-health`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch (e) {}
      await sleep(1000);
    }
    
    if (!ready) {
      throw new Error('Next.js server failed to start or timeout.');
    }
    
    console.log('\nServer is ready. Starting tests...\n');

    const data = JSON.parse(await fs.readFile('docs/interpret-v2-api-test-cases.json', 'utf8'));
    const cases = data.cases;
    
    let mdOutput = '# Tarot API `/api/interpret-v2` 批量测试结果\n\n';
    
    for (const c of cases) {
      console.log(`Testing case: ${c.caseId}`);
      mdOutput += `## 测试用例: \`${c.caseId}\`\n`;
      mdOutput += `- **类别**: ${c.category}\n`;
      mdOutput += `- **优先级**: ${c.priority}\n`;
      mdOutput += `- **问题**: ${c.request.question || '(无问题)'}\n`;
      mdOutput += `- **牌阵**: ${c.request.spreadSlug}\n\n`;

      const reqBody = { ...c.request };
      // Fallback intent if omitted in the test case? No, just send what's there.

      const res = await fetch(`${baseUrl}/api/interpret-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      
      const status = res.status;
      const resJson = await res.json();
      
      mdOutput += `### 响应状态: ${status}\n\n`;
      
      if (!res.ok) {
        mdOutput += `**错误信息**:\n\`\`\`json\n${JSON.stringify(resJson, null, 2)}\n\`\`\`\n\n`;
      } else {
        const responseData = resJson.data;
        mdOutput += `### 占卜结果\n\n`;
        if (responseData.reading && responseData.reading.summary) {
          mdOutput += `**总结**:\n${responseData.reading.summary}\n\n`;
        }
        
        if (responseData.cards && responseData.cards.length > 0) {
          mdOutput += `**牌面解读**:\n`;
          responseData.cards.forEach(card => {
            mdOutput += `- **${card.positionName} - ${card.cardName}**: ${card.meaning}\n`;
          });
          mdOutput += `\n`;
        }
        
        if (responseData.combinations && responseData.combinations.length > 0) {
          mdOutput += `**组合解读**:\n`;
          responseData.combinations.forEach(comb => {
            mdOutput += `- ${comb.summary}\n`;
          });
          mdOutput += `\n`;
        }
        
        if (responseData.reading && responseData.reading.advice && responseData.reading.advice.length > 0) {
          mdOutput += `**建议**:\n`;
          responseData.reading.advice.forEach(adv => mdOutput += `- ${adv}\n`);
          mdOutput += `\n`;
        }
        
        if (responseData.reading && responseData.reading.feedbackQuestions && responseData.reading.feedbackQuestions.length > 0) {
          mdOutput += `**反思问题**:\n`;
          responseData.reading.feedbackQuestions.forEach(q => mdOutput += `- ${q}\n`);
          mdOutput += `\n`;
        }
        
        if (responseData.safety) {
           mdOutput += `**安全策略**: Hits=${responseData.safety.hits}, Note=${responseData.safety.note || 'None'}\n\n`;
        }
      }
      
      mdOutput += `---\n\n`;
    }
    
    await fs.writeFile('docs/interpret-v2-api-test-results.md', mdOutput, 'utf8');
    console.log('Results written to docs/interpret-v2-api-test-results.md');
    
  } finally {
    if (process.platform === "win32" && server.pid) {
      await new Promise((resolve) => {
        const killer = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"]);
        killer.once("exit", resolve);
        killer.once("error", resolve);
      });
    } else {
      server.kill("SIGTERM");
    }
  }
}

main().catch(console.error);