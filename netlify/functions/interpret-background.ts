import { processInterpretationJob } from "../../src/lib/interpretation/jobs";

type BackgroundEvent = {
  body?: string | null;
  httpMethod?: string;
  isBase64Encoded?: boolean;
  queryStringParameters?: Record<string, string | undefined> | null;
};

function parseBody(event: BackgroundEvent) {
  if (!event.body) return null;
  const text = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(text) as { jobId?: string };
  } catch {
    return null;
  }
}

export const handler = async (event: BackgroundEvent) => {
  const jobId = event.queryStringParameters?.jobId ?? parseBody(event)?.jobId ?? null;

  if (!jobId) {
    console.error("[interpret-background] missing jobId", {
      method: event.httpMethod,
      hasBody: Boolean(event.body),
    });
    return;
  }

  console.log("[interpret-background] processing job", { jobId });

  try {
    await processInterpretationJob(jobId);
    console.log("[interpret-background] completed job", { jobId });
  } catch (error) {
    console.error("[interpret-background] job processing failed", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
