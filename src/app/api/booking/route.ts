import { z } from "zod";

import { bookingInputSchema, createBooking } from "@/lib/bookings/store";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = bookingInputSchema.parse(json);
    const booking = await createBooking(payload);

    return Response.json({
      ok: true,
      id: booking.id,
      createdAt: booking.createdAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return Response.json(
        { ok: false, error: first?.message ?? "提交内容不合法" },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "提交失败，请稍后再试";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
