---
query: "We are creating a research-backed page for the following: \"Calling LLM APIs in Production\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: preparation\nCurrent page scope: Turn a grounded prompt into a reliable API boundary with server-side secrets, typed results, bounded retries, safe actions, and useful telemetry.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "d7756759cf35031b9597f003c33adf9e"
status: "completed"
---

This curriculum article prepares engineers to integrate Large Language Models (LLMs) into production software.

The focus of this module is transforming raw, unpredictable text generation into a hardened API boundary. We will cover the 2026 standards for schema enforcement, resilience patterns, and observability.

## The Shift: From Text Generator to API Boundary

When building prototypes, developers often call LLM APIs directly from a client application and rely on prompt engineering (e.g., `"Return only JSON"`) to format the response. In a production environment, this approach fails.

LLMs are fundamentally text generators predicting token probabilities. Your application, however, requires rigid data structures, bounded latency, and predictable failure modes. Bridging this gap requires treating the LLM not as a chatbot, but as an unreliable external microservice.

### Core Objectives

By the end of this module, you should be able to:

1. **Secure the boundary:** Proxy all LLM calls through a server-side layer.
2. **Enforce schemas:** Use native structured outputs to guarantee type-safe responses.
3. **Handle failures:** Implement bounded retries that respect API rate limits and model refusals.
4. **Instrument the pipeline:** Set up OpenTelemetry to track token usage and latency across parent-child spans.

## 1. The Architecture of Trust: Server-Side Proxies

**Never call an LLM API directly from a web or mobile client.**

Client-side calls expose your provider API keys (OpenAI, Anthropic, Google) directly to the end-user. Beyond the risk of key theft, a direct connection removes your ability to enforce rate limits, sanitize inputs, or intercept malicious prompt injections.

**The Solution:** Build a backend proxy service.

1. The client sends a request to your backend proxy.
2. The proxy authenticates the user, checks business logic rate limits, and sanitizes the input.
3. The proxy securely holds the API keys and calls the LLM provider.
4. The proxy parses and validates the response before returning structured data to the client.

## 2. Typed Data Contracts: Structured Outputs in 2026

If you are still extracting JSON from markdown code fences using regex, your system is fragile.

The primary challenge with LLM output repair is that there is no formal grammar to parse against when an output is malformed (e.g., missing keys, trailing commas, mixed encodings)([https://www.reddit.com/r/Python/comments/1tagc2g/i_tested_structured_output_from_288_llm_calls_and/](https://www.reddit.com/r/Python/comments/1tagc2g/i_tested_structured_output_from_288_llm_calls_and/)). In 2026, major LLM providers offer mechanisms to enforce output structure at the token generation level.

### Prompt Engineering vs. Constrained Decoding

### The 2026 Landscape

How you implement structured outputs depends on the provider:

| Provider | Mechanism | Implementation |
| --- | --- | --- |
| OpenAI / Gemini | Constrained Decoding | Uses an underlying Finite State Machine (FSM) to mask invalid tokens during generation. Guarantees 100% schema compliance in strict mode( https://dev.to/pockit_tools/llm-structured-output-in-2026-stop-parsing-json-with-regex-and-do-it-right-34pk ). |
| Anthropic (Claude) | Tool Use (Function Calling) | You define a tool with a JSON schema, and Claude returns the structured output as if calling that tool( https://dev.to/pockit_tools/llm-structured-output-in-2026-stop-parsing-json-with-regex-and-do-it-right-34pk ). |

### Implementation Pattern

Use validation libraries like **Pydantic** (Python) or **Zod** (TypeScript) to define your data contract. Instead of manually writing a JSON schema for the prompt, auto-generate it from your typed models to keep them in sync([https://collinwilkins.com/articles/structured-output](https://collinwilkins.com/articles/structured-output)).

> **Common Pitfall:** When using Pydantic in strict mode, ensure optional fields are explicitly unioned with `null` (e.g., `Optional[str]`). Hand-rolled schemas that use `required: false` will be rejected by strict parsers([https://collinwilkins.com/articles/structured-output](https://collinwilkins.com/articles/structured-output)).

## 3. Resilience: Bounded Retries and Fallbacks

Network requests fail, API providers enforce `HTTP 429` rate limits, and even with constrained decoding, the model might produce a value that is structurally valid but semantically incorrect (e.g., an age of -5).

### The Exponential Backoff Standard

When a transient error occurs, immediate retries overwhelm the provider. Use exponential backoff with jitter to space out retry attempts:

t=b⋅2c

Where t is the delay time, b is the base delay, and c is the attempt count. Adding random "jitter" prevents multiple failing instances from retrying at the exact same millisecond.

### The "Infinite Refusal Loop" Danger

A common mistake in production is wrapping LLM calls in a blind retry loop. If a user submits a prompt that triggers the provider's safety filters, the API will return a refusal object (not schema-compliant JSON). If your code assumes this is a standard validation failure and retries it blindly, it will loop indefinitely, burning time and token budgets([https://collinwilkins.com/articles/structured-output](https://collinwilkins.com/articles/structured-output)).

**The Fix:** Always inspect the response for provider refusal flags before triggering a retry.

## 4. Telemetry: Tracing the Pipeline

When an LLM agent loops unexpectedly or burns through a token budget, traditional text logs are useless. In 2026, **OpenTelemetry (OTel)** is the standard for instrumenting LLM pipelines.

### Parent-Child Span Relationships

Because modern AI features involve multiple steps (e.g., embedding generation, database retrieval, tool execution, and final generation), tracing requires a hierarchical approach([https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/](https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/)):

1. **Root Span:** Represents the entire user-facing operation (e.g., `Summarize Ticket`). Create this first; otherwise, batch processors cannot aggregate the child data.
2. **Child Spans:** Wrap specific model invocations using the `gen_ai.` semantic prefix.

### Essential Attributes

For every LLM call span, record the following attributes to attribute latency and cost([https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/](https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/)):

- `gen_ai.request.model`
- `gen_ai.usage.input_tokens`
- `gen_ai.usage.output_tokens`

> **Security Note:** Automate prompt data scrubbing inside your instrumentation wrapper. Prompts often contain PII, and stripping sensitive data before it reaches your observability backend is mandatory([https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/](https://mlflow.org/articles/setting-up-llm-observability-pipelines-in-2026/)).
