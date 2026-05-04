import { handleInterpretRoute } from "@/lib/interpretation/api-route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleInterpretRoute(request, { mode: "engine" });
}
