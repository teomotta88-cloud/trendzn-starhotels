CREATE POLICY "Public can view approved submissions"
ON public.trend_submissions
FOR SELECT
TO anon
USING (status = 'approved');
