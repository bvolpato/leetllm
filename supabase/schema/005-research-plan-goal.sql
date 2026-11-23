-- =====================================================
-- Migration 005: AI Research Scientist plan goal
-- =====================================================

ALTER TABLE public.user_learning_plans
  DROP CONSTRAINT user_learning_plans_goal_check;

ALTER TABLE public.user_learning_plans
  ADD CONSTRAINT user_learning_plans_goal_check
  CHECK (goal IN ('foundations', 'rag', 'agents', 'inference', 'training', 'research', 'interviews'));
