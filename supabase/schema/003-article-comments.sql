-- =====================================================
-- Migration 003: Article Comments & Upvotes
-- Threaded comment system with votes, like the screenshot
-- =====================================================

-- ─── Comments table ───
CREATE TABLE public.article_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_article_comments_slug ON public.article_comments(article_slug);
CREATE INDEX idx_article_comments_parent ON public.article_comments(parent_id);
CREATE INDEX idx_article_comments_user ON public.article_comments(user_id);

-- Auto-update timestamp
CREATE TRIGGER update_article_comments_updated_at
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments (even unauthenticated)
CREATE POLICY "Anyone can read comments"
  ON public.article_comments
  FOR SELECT
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.article_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.article_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.article_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role can manage all comments"
  ON public.article_comments
  FOR ALL
  USING (auth.role() = 'service_role');


-- ─── Comment Votes (upvotes) ───
CREATE TABLE public.comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One vote per user per comment
  UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_votes_comment ON public.comment_votes(comment_id);

-- Enable RLS
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
  ON public.comment_votes
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own votes
CREATE POLICY "Users can insert own votes"
  ON public.comment_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own votes
CREATE POLICY "Users can delete own votes"
  ON public.comment_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role can manage all votes"
  ON public.comment_votes
  FOR ALL
  USING (auth.role() = 'service_role');
