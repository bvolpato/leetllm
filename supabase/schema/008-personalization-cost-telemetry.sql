-- Persist provider token usage and paid-tier list-price estimates for personalization.

ALTER TABLE public.personalization_generation_usage
  ADD COLUMN input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  ADD COLUMN cached_input_tokens INTEGER CHECK (cached_input_tokens IS NULL OR cached_input_tokens >= 0),
  ADD COLUMN output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  ADD COLUMN thinking_tokens INTEGER CHECK (thinking_tokens IS NULL OR thinking_tokens >= 0),
  ADD COLUMN total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  ADD COLUMN provider_calls INTEGER CHECK (provider_calls IS NULL OR provider_calls >= 0),
  ADD COLUMN estimated_cost_microusd BIGINT CHECK (estimated_cost_microusd IS NULL OR estimated_cost_microusd >= 0),
  ADD COLUMN pricing_version TEXT CHECK (pricing_version IS NULL OR char_length(pricing_version) BETWEEN 1 AND 50),
  ADD COLUMN prompt_version TEXT CHECK (prompt_version IS NULL OR char_length(prompt_version) BETWEEN 1 AND 50);

GRANT UPDATE (
  status,
  duration_ms,
  input_chars,
  output_chars,
  error_code,
  input_tokens,
  cached_input_tokens,
  output_tokens,
  thinking_tokens,
  total_tokens,
  provider_calls,
  estimated_cost_microusd,
  pricing_version,
  prompt_version
) ON public.personalization_generation_usage TO authenticated;
