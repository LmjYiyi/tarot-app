import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type InterpretationJobStatus = "pending" | "running" | "succeeded" | "failed";

export type InterpretationJobSnapshot = {
  id: string;
  status: InterpretationJobStatus;
  result: string | null;
  error: string | null;
  model: string | null;
  pipeline: string | null;
  generationMode: string | null;
  headers: Record<string, string> | null;
};

export type InterpretationJobUpdate = {
  status: InterpretationJobStatus;
  result?: string;
  error?: string;
  model?: string;
  pipeline?: string;
  generationMode?: string;
  headers?: Record<string, string>;
};

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

async function fetchJob(jobId: string, jobToken: string, signal: AbortSignal) {
  const params = new URLSearchParams({ token: jobToken });
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}?${params}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`查询解读任务失败：HTTP ${response.status}`);
  }

  return (await response.json()) as InterpretationJobSnapshot;
}

function rowToStatus(row: Record<string, unknown>): InterpretationJobStatus {
  const status = row.status;
  return status === "pending" || status === "running" || status === "succeeded" || status === "failed"
    ? status
    : "pending";
}

function snapshotToUpdate(snapshot: InterpretationJobSnapshot): InterpretationJobUpdate {
  return {
    status: snapshot.status,
    result: snapshot.result ?? undefined,
    error: snapshot.error ?? undefined,
    model: snapshot.model ?? undefined,
    pipeline: snapshot.pipeline ?? undefined,
    generationMode: snapshot.generationMode ?? undefined,
    headers: snapshot.headers ?? undefined,
  };
}

export type SubscribeResult = {
  cleanup: () => void;
  done: Promise<InterpretationJobUpdate>;
};

/**
 * 订阅一个解读任务直到 succeeded/failed。
 * 优先使用 Supabase Realtime；同时附带轮询做兜底（Realtime 未启用 / 网络中断都能恢复）。
 */
export function subscribeInterpretationJob(
  jobId: string,
  jobToken: string,
  onUpdate: (update: InterpretationJobUpdate) => void,
): SubscribeResult {
  const abortController = new AbortController();
  let resolved = false;
  let resolvePromise: (value: InterpretationJobUpdate) => void = () => {};
  let rejectPromise: (reason?: unknown) => void = () => {};
  const done = new Promise<InterpretationJobUpdate>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const timeoutId = window.setTimeout(() => {
    if (resolved) return;
    rejectPromise(new Error("解读超时未返回，请稍后重试。"));
    cleanup();
  }, POLL_TIMEOUT_MS);

  function finalize(update: InterpretationJobUpdate) {
    if (resolved) return;
    if (update.status !== "succeeded" && update.status !== "failed") return;
    resolved = true;
    resolvePromise(update);
    cleanup();
  }

  function emit(update: InterpretationJobUpdate) {
    if (resolved) return;
    onUpdate(update);
    finalize(update);
  }

  const supabase = getSupabaseBrowserClient();
  let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

  if (supabase) {
    channel = supabase
      .channel(`interpretation-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "interpretation_jobs",
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {
          if (resolved) return;
          // 出于隐私收紧，anon 只能从 Realtime 拿到 status 等非敏感列。
          // 拿到终态信号后，再走 /api/jobs/[id]（service role）取真正的内容。
          const status = rowToStatus(payload.new as Record<string, unknown>);
          if (status === "succeeded" || status === "failed") {
            try {
              const snapshot = await fetchJob(jobId, jobToken, abortController.signal);
              emit(snapshotToUpdate(snapshot));
            } catch (error) {
              if ((error as Error)?.name === "AbortError") return;
              console.warn("[job-client] realtime->fetch failed", error);
            }
          } else {
            onUpdate({ status });
          }
        },
      )
      .subscribe();
  }

  let pollTimer: number | null = null;

  function schedulePoll(intervalMs: number) {
    if (resolved) return;
    pollTimer = window.setTimeout(async () => {
      if (resolved) return;
      try {
        const snapshot = await fetchJob(jobId, jobToken, abortController.signal);
        emit(snapshotToUpdate(snapshot));
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.warn("[job-client] poll failed", error);
      }
      if (!resolved) schedulePoll(POLL_INTERVAL_MS);
    }, intervalMs);
  }

  // 立刻拉一次，避免任务在订阅前就已经完成。
  schedulePoll(0);

  function cleanup() {
    if (timeoutId) window.clearTimeout(timeoutId);
    if (pollTimer) window.clearTimeout(pollTimer);
    if (channel && supabase) {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    abortController.abort();
  }

  return { cleanup, done };
}
