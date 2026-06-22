CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'poll-gmail-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://trendzn-starhotels.lovable.app/api/public/hooks/poll-gmail',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);