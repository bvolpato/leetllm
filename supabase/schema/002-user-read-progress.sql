-- =====================================================
-- Migration 002: User Reading Progress
-- Tracks which articles a user has read (mark as read)
-- =====================================================

CREATE TABLE public.user_read_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_slug TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One read-marker per user per article
  UNIQUE (user_id, article_slug)
);

-- Index for fast queries by user
CREATE INDEX idx_user_read_progress_user_id ON public.user_read_progress(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_read_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own read progress
CREATE POLICY "Users can view own read progress"
  ON public.user_read_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own read progress
CREATE POLICY "Users can insert own read progress"
  ON public.user_read_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own read progress (unmark as read)
CREATE POLICY "Users can delete own read progress"
  ON public.user_read_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do anything (for admin/webhooks)
CREATE POLICY "Service role can manage all read progress"
  ON public.user_read_progress
  FOR ALL
  USING (auth.role() = 'service_role');
