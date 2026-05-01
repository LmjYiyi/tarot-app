import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const bookingTopics = [
  "love",
  "career",
  "study",
  "relationship",
  "self",
  "decision",
  "other",
] as const;

export const bookingContactTypes = ["wechat", "phone", "email"] as const;

export const bookingInputSchema = z.object({
  name: z.string().trim().min(1, "请填写称呼").max(40),
  contact: z.string().trim().min(2, "请填写联系方式").max(80),
  contactType: z.enum(bookingContactTypes).default("wechat"),
  topic: z.enum(bookingTopics),
  preferredTime: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

export type BookingRecord = BookingInput & {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
};

type SupabaseBookingRow = {
  id: string;
  name: string;
  contact: string;
  contact_type: string;
  topic: string;
  preferred_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const globalStore = globalThis as typeof globalThis & {
  __tarotBookings?: Map<string, BookingRecord>;
};

function getMemoryStore() {
  if (!globalStore.__tarotBookings) {
    globalStore.__tarotBookings = new Map<string, BookingRecord>();
  }
  return globalStore.__tarotBookings;
}

function toRecord(row: SupabaseBookingRow): BookingRecord {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    contactType: (bookingContactTypes as readonly string[]).includes(row.contact_type)
      ? (row.contact_type as BookingRecord["contactType"])
      : "wechat",
    topic: (bookingTopics as readonly string[]).includes(row.topic)
      ? (row.topic as BookingRecord["topic"])
      : "other",
    preferredTime: row.preferred_time ?? "",
    message: row.message ?? "",
    status: (["pending", "confirmed", "completed", "cancelled"] as const).includes(
      row.status as BookingRecord["status"],
    )
      ? (row.status as BookingRecord["status"])
      : "pending",
    createdAt: row.created_at,
  };
}

export async function createBooking(input: BookingInput): Promise<BookingRecord> {
  const parsed = bookingInputSchema.parse(input);
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        name: parsed.name,
        contact: parsed.contact,
        contact_type: parsed.contactType,
        topic: parsed.topic,
        preferred_time: parsed.preferredTime || null,
        message: parsed.message || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toRecord(data as SupabaseBookingRow);
  }

  const record: BookingRecord = {
    ...parsed,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  getMemoryStore().set(record.id, record);
  return record;
}

export async function listRecentBookings(limit = 50): Promise<BookingRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as SupabaseBookingRow[]).map(toRecord);
  }
  return Array.from(getMemoryStore().values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
