-- Personalized Markdown contains trusted renderer input after server validation.
-- Browsers may read their own cache rows, but only service-role routes may mutate them.

DROP POLICY IF EXISTS "Users can create own personalized lessons"
  ON public.user_personalized_lessons;
DROP POLICY IF EXISTS "Users can update own personalized lessons"
  ON public.user_personalized_lessons;
DROP POLICY IF EXISTS "Users can delete own personalized lessons"
  ON public.user_personalized_lessons;

REVOKE ALL PRIVILEGES
  ON public.user_personalized_lessons
  FROM anon, authenticated;

GRANT SELECT
  ON public.user_personalized_lessons
  TO authenticated;
