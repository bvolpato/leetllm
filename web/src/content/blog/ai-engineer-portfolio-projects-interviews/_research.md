# Portfolio evidence research, checked September 23, 2026

## What the public hiring sources show

Anthropic explicitly invites independent research, thoughtful writing, and open-source contributions on a resume. Its careers page doesn't promise an interview or prescribe a portfolio project count. Source: https://www.anthropic.com/careers

OpenAI's engineering interview guide generally looks for well-designed solutions, high-quality code, optimal performance, and test coverage. Formats and tool permissions vary by team and interview. This supports making reasoning and verification inspectable, not claiming that employers all share one portfolio rubric. Source: https://openai.com/interview-guide/

These five project suggestions are editorial choices, not measured hiring predictors. A reader should choose one relevant question, rather than equating five shipped apps with employability.

## The five projects and what each comparison means

- Document QA uses self-authored or authorized runbooks, an explicit active/superseded source manifest, and three case types. Valid citation IDs don't prove support; save source passages and claim-level judgments. Parsing and chunking improvements won't necessarily repair source-precedence or generation errors.
- The dashboard begins with already-graded rows. Its CPU example doesn't judge model answers. Baseline scores 2/4 (50%) and candidate scores 3/4 (75%); both return HOLD under the four required cases because the candidate newly fails injection. An all-pass run returns REVIEW, not automatic deployment. Missing, duplicate, or unknown rows and string booleans invalidate the report. A four-case wiring test alone is not proof of production reliability.
- Support copilot approval binds the exact revision, content, policy evidence, and recipient. Editing a draft invalidates old approval. The executor is a local simulated outbox, not a real sending capability. An idempotency key needs durable execution semantics; a UI toggle alone isn't evidence.
- Repository repair uses a pinned starting revision, a reproducing test, and trusted evaluation tests outside model write scope. Host-enforced path, diff, resource, secret, and network restrictions are distinct from a prompt requesting scoped edits. The project isn't a comparable SWE-bench score.
- Cost and latency comparison pins tasks, model and generation settings, concurrency, and rate-card date. Include errors, retries, and quality; distinguish cold and warm prefixes and successful-request latency from all-attempt behavior. Batch turnaround isn't interactive latency.

SWE-bench's original paper studies issue descriptions and repository-level code changes, and its benchmark evaluates repairs. Only that task structure is reused; no leaderboard number or current model ranking appears in the article. Source: https://arxiv.org/abs/2310.06770

## Current provider facts actually checked

OpenAI prompt caching reuses matching prefix computation, not the previous answer. The current guide is model-dependent for minimum prefix, retention and control fields, and charges. It reports cached reads via `cached_tokens`; models using `cache_write_tokens` require separate write accounting. Its cost example separates ordinary input, cached reads, and writes. A cold write followed by no reuse can fail to save money. No universal minimum length, discount, or cached price is claimed. Source: https://developers.openai.com/api/docs/guides/prompt-caching

Batch advertises 50% lower cost versus synchronous APIs and a 24-hour completion window. Expired batches cancel unfinished requests, expose completed outputs and errors, and charge completed work. Reconcile each `custom_id`; don't assume a completed or expired batch contains every requested success. Source: https://developers.openai.com/api/docs/guides/batch

The earlier draft quoted outdated prices and implied stacking savings without a model-specific checked rate card, prescribed arbitrary reviewer rules, and overstated autonomous support behavior. The revised text removes unverified assumptions and focuses on inspectability and human approval for this project's draft-only scope.

## Evidence produced in this review

One marked local CPU program evaluates saved `CaseResult` rows. The example has assertions for all-pass `REVIEW`, the injection failure reason, and unknown-row `INVALID`; generated output is refreshed from that execution. The added checkpoint explains why deleting a newly failing case invalidates a pinned comparison and why legitimate manifest changes require rerunning both systems.

The body figure and reproducible social banner use the same four outcomes, 50%/75% and HOLD/HOLD. They aren't provider benchmarks. No API, model run, GPU workload, live send, or sandboxed model repair was executed by this review. Readers must produce those measurements for their own projects before reporting them as real results.
