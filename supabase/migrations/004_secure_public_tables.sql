-- The app writes through server-side API routes with SUPABASE_SERVICE_ROLE_KEY.
-- Do not allow direct anonymous writes to public tables from the browser key.

drop policy if exists "anonymous insert readings" on readings;
drop policy if exists "anonymous insert bookings" on bookings;

create or replace function pg_temp.add_check_constraint_if_missing(
  target_table regclass,
  constraint_name text,
  check_expression text
) returns void
language plpgsql
as $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = target_table
      and conname = constraint_name
  ) then
    execute format(
      'alter table %s add constraint %I check (%s) not valid',
      target_table,
      constraint_name,
      check_expression
    );
  end if;
end;
$$;

select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_share_token_length',
  'char_length(share_token) between 12 and 64'
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_cards_array',
  'jsonb_typeof(cards) = ''array'''
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_draw_log_object',
  'draw_log is null or jsonb_typeof(draw_log) = ''object'''
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_reading_intent_object',
  'reading_intent is null or jsonb_typeof(reading_intent) = ''object'''
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_user_feedback_object',
  'user_feedback is null or jsonb_typeof(user_feedback) = ''object'''
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_adaptive_answers_array',
  'adaptive_answers is null or jsonb_typeof(adaptive_answers) = ''array'''
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_question_length',
  'char_length(question) <= 500'
);
select pg_temp.add_check_constraint_if_missing(
  'readings',
  'readings_card_preview_length',
  'card_preview_text is null or char_length(card_preview_text) <= 4000'
);

select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_contact_type_known',
  'contact_type in (''wechat'', ''phone'', ''email'')'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_topic_known',
  'topic in (''love'', ''career'', ''study'', ''relationship'', ''self'', ''decision'', ''other'')'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_status_known',
  'status in (''pending'', ''confirmed'', ''completed'', ''cancelled'')'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_name_length',
  'char_length(name) between 1 and 40'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_contact_length',
  'char_length(contact) between 2 and 80'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_preferred_time_length',
  'preferred_time is null or char_length(preferred_time) <= 80'
);
select pg_temp.add_check_constraint_if_missing(
  'bookings',
  'bookings_message_length',
  'message is null or char_length(message) <= 500'
);
