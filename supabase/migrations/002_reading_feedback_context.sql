alter table readings
  add column if not exists draw_log jsonb,
  add column if not exists reading_intent jsonb,
  add column if not exists user_feedback jsonb,
  add column if not exists adaptive_answers jsonb;
