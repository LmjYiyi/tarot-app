// Netlify Background Function：文件名以 `-background` 结尾会被 Netlify 识别为后台任务，
// 调用方收到 202 后函数继续执行（最长 15 分钟），足以承载 MiniMax 的长解读。
// 文档：https://docs.netlify.com/build/functions/background-functions/

import { processInterpretationJob } from "../../src/lib/interpretation/jobs";

const handler = async (request: Request) => {
  let jobId: string | null = null;

  try {
    const url = new URL(request.url);
    jobId = url.searchParams.get("jobId");

    if (!jobId && request.method !== "GET") {
      const text = await request.text();
      if (text) {
        try {
          const body = JSON.parse(text) as { jobId?: string };
          jobId = body.jobId ?? null;
        } catch {
          // ignore parse error，下面会按缺少 jobId 处理
        }
      }
    }
  } catch (error) {
    console.error("[interpret-background] failed to parse request", error);
  }

  if (!jobId) {
    return new Response("missing jobId", { status: 400 });
  }

  try {
    await processInterpretationJob(jobId);
  } catch (error) {
    console.error("[interpret-background] job processing failed", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return new Response(null, { status: 202 });
};

export default handler;
