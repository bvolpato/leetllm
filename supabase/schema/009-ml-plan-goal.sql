-- =====================================================
-- Migration 009: Production ML engineer learning plan goal
-- Aligns user_learning_plans.goal with LearnerGoal in
-- web/src/lib/learning-plan.ts.
-- =====================================================

ALTER TABLE public.user_learning_plans
  DROP CONSTRAINT IF EXISTS user_learning_plans_goal_check;

ALTER TABLE public.user_learning_plans
  ADD CONSTRAINT user_learning_plans_goal_check
  CHECK (goal IN ('foundations', 'ml', 'rag', 'agents', 'inference', 'training', 'research', 'interviews'));
