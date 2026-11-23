-- =====================================================
-- Migration 004: User study state
-- Syncs plans, bookmarks, notes, and quiz history.
-- =====================================================

ALTER TABLE public.user_read_progress
  ADD COLUMN completed BOOLEAN DEFAULT TRUE NOT NULL,
  ADD COLUMN updated_at TIMESTAMPTZ;

UPDATE public.user_read_progress SET updated_at = read_at;

ALTER TABLE public.user_read_progress
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE POLICY "Users can update own read progress"
  ON public.user_read_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_learning_plans (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  goal TEXT NOT NULL CHECK (goal IN ('foundations', 'rag', 'agents', 'inference', 'training', 'interviews')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('new', 'working', 'advanced')),
  weekly_hours SMALLINT NOT NULL CHECK (weekly_hours IN (2, 4, 6)),
  track_slug TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.user_bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_slug TEXT NOT NULL,
  bookmarked BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, article_slug)
);

CREATE TABLE public.user_notes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_slug TEXT NOT NULL,
  body TEXT DEFAULT '' NOT NULL CHECK (char_length(body) <= 10000),
  deleted BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, article_slug)
);

CREATE TABLE public.user_quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_slug TEXT NOT NULL,
  quiz_kind TEXT NOT NULL CHECK (quiz_kind IN ('mastery', 'theory')),
  correct SMALLINT NOT NULL CHECK (correct >= 0),
  total SMALLINT NOT NULL CHECK (total > 0),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_quiz_attempts_user_time
  ON public.user_quiz_attempts(user_id, attempted_at DESC);

ALTER TABLE public.user_learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning plan"
  ON public.user_learning_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
  ON public.user_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes"
  ON public.user_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own quiz attempts"
  ON public.user_quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_learning_plans_updated_at
  BEFORE UPDATE ON public.user_learning_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_bookmarks_updated_at
  BEFORE UPDATE ON public.user_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
