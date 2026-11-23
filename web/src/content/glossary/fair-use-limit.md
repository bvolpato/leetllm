---
title: Fair use limit
aliases: ["fair-use limit"]
importance: 72
---
A fair use limit is a product-facing capacity cap that keeps one tenant's "normal" use of a shared AI service from degrading latency, cost, or availability for everyone else. It sits between a hard metered quota ("you bought $N of tokens") and pure rate limiting ("60 RPM forever"). Marketing often says "unlimited" or "virtually unlimited"; the fair use limit is the real contract: casual interactive traffic is expected, while sustained premium or automated load consumes shared capacity and can trigger a limit.

Fair use is both **policy** (what the plan page and terms promise) and **enforcement** (what the gateway, scheduler, and billing stack actually do). Plan packaging changes, so vendor examples illustrate controls and the exact plan terms remain the current contract. Checked September 23, 2026, [OpenAI's Enterprise model limits](https://help.openai.com/en/articles/11165333-chatgpt-enterprise-and-edu-models-limits) describe virtually unlimited messages for eligible base models subject to misuse guardrails. [Claude's usage guidance](https://support.claude.com/en/articles/9797557-usage-limit-best-practices) describes five-hour session and weekly limits for its listed paid plans. Features and models can have additional caps; inspect the exact plan and workspace settings before promising capacity.

## How it differs from nearby controls

| Control | Question it answers | Typical failure mode |
| --- | --- | --- |
| [Rate limit](glossary://rate-limit) | How fast can this identity hit the API right now? | Burst storms, gateway overload |
| [Quota](glossary://quota) | How much allowance remains in this plan window? | Exhaustion after legitimate heavy use |
| [Metered billing](glossary://metered-billing) | Who pays for each unit after the free tier? | Surprise invoices or runaway spend |
| **Fair use limit** | Is this usage still "ordinary" for the plan? | One tenant crowds shared premium capacity |

Rate limits and quotas are usually crisp numbers. Fair use often starts softer: percentile-based, plan-relative, or "sustained premium burn above peer median," then hardens into a documented threshold when support volume rises. Good systems still make the threshold measurable in code so support, finance, and engineering share one story.

## What it actually counts

"Unlimited chat" almost never means infinite premium GPUs. Count the scarce resource that actually hurts:

- **Tokens or model minutes** on premium routes (long context, reasoning, multi-step agents)
- **Concurrent generations** and tool runs (decode slots and KV pressure)
- **Batch or automated extraction** that resells or proxies the product as an API
- **Cost exposure** (provider bill or internal COGS) relative to plan revenue
- **Feature-class burn** (image, code-agent, deep research) when those lanes are shared

Pick units that match serving cost, not vanity metrics. One 64K-context premium call can cost more GPU time than hundreds of short chat turns; request counts alone will not protect the fleet.

## Example

Consider a hypothetical team plan marketing "unlimited assistant messages" at $30/seat/month. The invented thresholds below show how enforcement could work; check the selected vendor's published plan for actual allowances:

- Interactive chat on the standard model is uncapped for ordinary human pacing.
- Premium-model traffic is fair-use limited at **about 2M combined input+output tokens per seat per rolling 24h**, or **8 concurrent premium streams** per workspace, whichever binds first.
- Overnight agent loops and bulk document extraction count at **2x weight** because they hold decode capacity longer.

Seat A sends ~40 short chats (~8k tokens total) during the workday. Well under fair use; no change.

Seat B runs a codebase agent that burns ~180k tokens/hour for 14 hours (~2.5M tokens) plus 12 parallel tool sessions. The gateway:

1. Accepts traffic until the rolling window crosses the fair-use threshold.
2. Moves new premium work to a lower-priority queue (higher queue wait, same model when capacity frees).
3. Surfaces a usage banner: "Premium capacity limited until ~14:00 tomorrow; upgrade or wait."
4. Leaves standard-model chat open so the product does not feel fully "down."

If seat B were a silent hard block with no remaining lane, support would call it a broken unlimited plan. If it were silent quality degradation with no banner, users would distrust the model. Fair use only works when the counted unit, window, and post-threshold path are explicit.

## Product contract

A Redis counter can enforce usage units; the customer contract also needs consistent policy across these surfaces:

1. **Plan page and terms**: what "unlimited" includes and excludes.
2. **Usage UI**: current burn, window, reset time, which feature class is constrained.
3. **API / product errors**: which limit fired, whether retry helps, what fallback remains.
4. **Support tooling**: tenant id, plan, route, counted units, window, decision, fallback path.

Log at decision time: `tenant_id`, `plan`, `route`, `unit`, `window`, `value`, `threshold`, `action` (`allow` / `warn` / `deprioritize` / `fallback` / `block`). Without that ledger, every outage becomes a he-said-she-said about "unlimited."

## Enforcement patterns

Common implementations stack rather than replace each other:

- **Edge rate limits** (RPM/TPM) protect the gateway from bursts.
- **Fair-use window** (rolling hours/days) protects sustained premium burn and COGS.
- **Scheduler priority** deprioritizes over-threshold tenants inside continuous batching without hard-killing everyone.
- **Fallback lane** routes excess work to a cheaper model or async batch path.
- **Overage / upgrade** converts fair-use overflow into metered spend when the customer wants more.

Reserve estimated cost before admission when output length is unknown, then reconcile actual tokens after the stream ends. Concurrent agents otherwise overspend the fair-use window the same way they overspend hard quotas.

## Why it matters here

AI products sell shared, expensive inference as a fixed-price experience. Fair use limits are how packaging, capacity planning, routing, and customer trust stay consistent. Without them, a few agent loops or bulk extractors can raise p95 latency for every interactive user on the same pool. With opaque enforcement, "unlimited" becomes a trust incident. Curriculum and production work on multi-tenant serving, routing policy, and plan design all need this term: it is the bridge between marketing language and GPU reality.

## Related terms

- [Quota](glossary://quota)
- [Rate limit](glossary://rate-limit)
- [Usage shape](glossary://usage-shape)
- [Metered billing](glossary://metered-billing)
- [Fallback lane](glossary://fallback-lane)
