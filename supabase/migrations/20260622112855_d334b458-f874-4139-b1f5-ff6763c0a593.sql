-- Deduplicate URLs before adding unique constraint
DELETE FROM public.trend_submissions a
USING public.trend_submissions b
WHERE a.url = b.url AND a.created_at > b.created_at;

DELETE FROM public.trend_submissions a
USING public.trend_submissions b
WHERE a.url = b.url AND a.created_at = b.created_at AND a.id > b.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trend_submissions_url_key'
      AND conrelid = 'public.trend_submissions'::regclass
  ) THEN
    ALTER TABLE public.trend_submissions
      ADD CONSTRAINT trend_submissions_url_key UNIQUE (url);
  END IF;
END $$;

-- Reschedule poll-gmail cron to use production URL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-gmail-every-15min') THEN
    PERFORM cron.unschedule('poll-gmail-every-15min');
  END IF;
END $$;

SELECT cron.schedule(
  'poll-gmail-every-15min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://trendzn-starhotels.lovable.app/api/public/hooks/poll-gmail',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);