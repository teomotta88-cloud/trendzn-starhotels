-- Permette all'utente anonimo di eliminare righe da trend_submissions.
-- L'app è ad uso interno, non esposta pubblicamente.
CREATE POLICY "Anon users can delete submissions"
ON public.trend_submissions
FOR DELETE
TO anon
USING (true);
