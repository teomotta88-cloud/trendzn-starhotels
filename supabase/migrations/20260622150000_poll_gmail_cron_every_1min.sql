SELECT cron.unschedule('poll-gmail-every-15min');

SELECT cron.schedule(
  'poll-gmail-every-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://trendzn-starhotels.lovable.app/api/public/hooks/poll-gmail',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
