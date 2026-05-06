import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InterpretationJobRow } from "@/lib/interpretation/jobs";

export const runtime = "nodejs";

const JOBS_TABLE = "interpretation_jobs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!id) {
    return Response.json({ error: "Missing job id." }, { status: 400 });
  }

  if (!token) {
    return Response.json({ error: "Missing job token." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return Response.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select(
      "id, status, mode, result_text, result_headers, model, pipeline, generation_mode, error, created_at, updated_at",
    )
    .eq("id", id)
    .eq("client_token", token)
    .maybeSingle<Omit<InterpretationJobRow, "payload">>();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(
    {
      id: data.id,
      status: data.status,
      mode: data.mode,
      result: data.status === "succeeded" ? data.result_text : null,
      headers: data.status === "succeeded" ? data.result_headers : null,
      model: data.model,
      pipeline: data.pipeline,
      generationMode: data.generation_mode,
      error: data.status === "failed" ? data.error : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
