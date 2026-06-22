alter table public.trend_submissions
  add column if not exists score smallint;

alter table public.trend_submissions
  add constraint trend_submissions_score_range check (score is null or (score >= 1 and score <= 3));
