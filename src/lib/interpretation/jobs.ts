import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  buildStreamHeaders,
  parseInterpretInput,
  readStreamAsText,
  resolveSwitchMode,
  runInterpretation,
  type InterpretRequestInput,
  type InterpretRouteMode,
} from "./api-route";

export type InterpretationJobStatus = "pending" | "running" | "succeeded" | "failed";

export type InterpretationJobRow = {
  id: string;
  client_token: string;
  status: InterpretationJobStatus;
  mode: InterpretRouteMode;
  payload: InterpretRequestInput;
  result_text: string | null;
  result_headers: Record<string, string> | null;
  model: string | null;
  pipeline: string | null;
  generation_mode: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const JOBS_TABLE = "interpretation_jobs";

function resolveBackgroundFunctionUrl(request: Request, jobId: string) {
  const explicit = process.env.NETLIFY_BACKGROUND_FUNCTION_URL?.trim();
  if (explicit) {
    const base = explicit.replace(/\/$/, "");
    return `${base}?jobId=${encodeURIComponent(jobId)}`;
  }

  const siteUrl =
    process.env.DEPLOY_PRIME_URL?.trim() ||
    process.env.DEPLOY_URL?.trim() ||
    process.env.URL?.trim();

  const base = siteUrl
    ? siteUrl.replace(/\/$/, "")
    : new URL(request.url).origin.replace(/\/$/, "");

  return `${base}/.netlify/functions/interpret-background?jobId=${encodeURIComponent(jobId)}`;
}

export async function handleInterpretJobCreate(
  request: Request,
  options: { mode?: InterpretRouteMode } = {},
) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Supabase service role is not configured for background interpretation." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseInterpretInput(json);
  if (!parsed.ok) return parsed.response;

  const mode = options.mode ?? resolveSwitchMode(request);

  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .insert({
      status: "pending",
      mode,
      payload: parsed.input,
    })
    .select("id, client_token")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.message ?? "Failed to enqueue interpretation job." },
      { status: 500 },
    );
  }

  const jobId = data.id as string;
  const jobToken = data.client_token as string;
  const triggerUrl = resolveBackgroundFunctionUrl(request, jobId);

  // 触发 Netlify background function。它会立即返回 202，本身不会阻塞这次请求。
  // 失败也仅记录，前端仍能通过轮询/Realtime 看到 pending 状态。
  try {
    const triggerResponse = await fetch(triggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-job-trigger": "interpret",
      },
      body: JSON.stringify({ jobId }),
    });

    if (!triggerResponse.ok && triggerResponse.status !== 202) {
      console.warn(
        "[interpret-jobs] background trigger returned",
        triggerResponse.status,
        triggerResponse.statusText,
      );
    }
  } catch (triggerError) {
    console.error("[interpret-jobs] background trigger failed", triggerError);
  }

  return Response.json(
    { jobId, jobToken, status: "pending" satisfies InterpretationJobStatus },
    {
      status: 202,
      headers: {
        "Cache-Control": "no-store",
        "x-interpretation-job-id": jobId,
        "x-interpretation-job-token": jobToken,
        "x-interpretation-mode": mode,
      },
    },
  );
}

export async function processInterpretationJob(jobId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: job, error: loadError } = await supabase
    .from(JOBS_TABLE)
    .select("*")
    .eq("id", jobId)
    .single<InterpretationJobRow>();

  if (loadError || !job) {
    throw new Error(`Job ${jobId} not found: ${loadError?.message ?? "unknown"}`);
  }

  if (job.status === "succeeded") {
    return job;
  }

  await supabase
    .from(JOBS_TABLE)
    .update({ status: "running", error: null })
    .eq("id", jobId);

  try {
    const result = await runInterpretation(job.payload, job.mode);
    const text = await readStreamAsText(result.stream);
    const engineHeaders = "headers" in result ? result.headers : undefined;
    const headers = buildStreamHeaders({
      mode: job.mode,
      model: result.model,
      pipeline: result.pipeline,
      generationMode: result.generationMode,
      debug: result.debug,
      engineHeaders,
    });

    await supabase
      .from(JOBS_TABLE)
      .update({
        status: "succeeded",
        result_text: text,
        result_headers: headers,
        model: result.model,
        pipeline: result.pipeline ?? null,
        generation_mode: result.generationMode ?? null,
        error: null,
      })
      .eq("id", jobId);

    return { ok: true } as const;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Interpretation failed.";
    await supabase
      .from(JOBS_TABLE)
      .update({ status: "failed", error: message })
      .eq("id", jobId);
    throw error;
  }
}
