export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    { error: "Adaptive questions have been removed from the instant reading flow." },
    { status: 410 },
  );
}
