DROP POLICY IF EXISTS "Public can view approved submissions" ON public.trend_submissions;
CREATE POLICY "Public can view approved submissions"
ON public.trend_submissions
FOR SELECT
TO anon
USING (status = 'approved');

GRANT SELECT ON public.trend_submissions TO anon;