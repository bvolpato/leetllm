---
query: "We are creating a research-backed page for the following: \"Design an Automated Support Agent\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: system-design\nCurrent page scope: Assemble a stateful support agent that grounds replies, gates credit actions, preserves gateway policy, and hands difficult cases to humans.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "e964dcf3755d5910b5256b5d9e0f47cb"
status: "completed"
---

Here is a suggested structure and content breakdown for your LeetLLM system design curriculum page. It builds a progressive narrative from a basic execution loop up to a fully gated, multi-agent orchestration architecture.

This outline balances architectural theory with implementation realities, ensuring students understand *why* the components are necessary before showing *how* they are built.

# Page Outline: Design an Automated Support Agent

**Target Audience:** Backend/AI engineers familiar with basic RAG and prompt engineering, now scaling into stateful agentic workflows.
**Prerequisites:** LLM tool calling, basic API gateway concepts, and RAG fundamentals.

## 1. The Stateful Agent Architecture

**Core Concept:** Shift the learner’s mental model from "single-pass chatbots" to an iterative execution loop.

- **The Agent Loop:** Define the five-stage runtime loop: Perceive, Reason, Plan, Act, Observe. Emphasize that the key differentiator of an agent is *acting* iteratively until a stopping condition is met.
- **State Management:** Explain how short-term memory (state) is maintained across the graph. The agent must retain conversation history and extracted variables (like order numbers or customer tiers) so subsequent tool calls or agent handoffs remain contextualized.
- **Choosing a Multi-Agent Pattern:** Contrast single-agent setups with multi-agent orchestration. For support agents, teach the **Supervisor / Worker (Subagent)** and **Handoff** patterns. Explain the trade-off: Subagents maintain context isolation but increase latency due to centralized routing, whereas direct handoffs save tokens on repeat requests.

## 2. Grounding Responses with Guardrails

**Core Concept:** LLMs cannot be trusted to self-regulate outputs out of the box. Guardrails must be first-class execution logic embedded directly within the agent loop.

- **Pre-LLM vs. Post-LLM Guardrails:**

- *Pre-LLM:* Fast, deterministic filters that run before the prompt hits the model (e.g., regex-based PII redaction, prompt injection defense).
- *Post-LLM:* Model-based evaluations that check outputs for hallucinations, toxicity, or unsupported claims before rendering them to the user.
- **The Self-Correction Loop:** Teach the mechanism where a failed post-LLM guardrail does *not* throw an error to the user. Instead, the system intercepts the failure, isolates the unsupported claim, and feeds it back to the LLM with a targeted correction prompt to revise mid-execution.
- **Placement Strategy:** Contrast managed guardrails (like AWS Bedrock's `ApplyGuardrail` running in an Action Group Lambda) versus self-orchestrated in-app guardrails (like Datadog AI Guard) that have full visibility into the orchestration loop.

## 3. Gating Credit Actions and Gateway Policies

**Core Concept:** Agents making state-changing API calls (e.g., issuing refunds, applying account credits) require strict authorization gating that the LLM physically cannot bypass.

- **Rule-Based vs. Risk-Based Gates:**

- *Rule-Based:* Deterministic policies hardcoded at the gateway (e.g., "Reject any refund API call > $50 without a supervisor token").
- *Risk-Based:* An agent dynamically scores the risk of the action based on live context. If the score exceeds a set threshold, the execution pauses.
- **Gateway Enforcement:** Teach how to decouple the policy engine from the LLM. The agent proposes a tool call, but the API gateway validates the token, user tier, and business rules before executing the mutation.

## 4. Human-in-the-Loop (HITL) Handoffs

**Core Concept:** Modern HITL does not mean a human reviews every action; it means the system gracefully pauses execution when confidence is low or policies demand intervention.

- **Triggering the Handoff:** Define the conditions for escalation: explicit user requests, high risk-scores, rule-based blocks, or consecutive tool failures.
- **Agentic Handoff Mechanisms:** Explain how handoffs physically work in frameworks like LangGraph. Teach the difference between **Static Routing** (using conditional edges based on explicit LLM strings) and **Dynamic Routing** (returning Command objects to update state at runtime).
- **The Interactive Callback:** Show how the system pauses execution, preserves the current state graph, alerts a human operator, and resumes the loop (or hands it over entirely) once the human injects a decision.

## 5. Common Pitfalls & Misconceptions

- **The "Review Everything" Fallacy:** Applying traditional code-review-style HITL to production agent actions destroys velocity. Teach developers to gate by risk and rule, not by default.
- **Token Bloat During Handoffs:** A common failure mode where passing the complete conversational memory between specialized agents exceeds the context window or causes attention drift.
- **Guardrails as Afterthoughts:** Treating guardrails as an optional wrapper rather than integrating them into the hot-path telemetry. Failed guardrail interventions should emit traces just like failed tool calls.

### Primary Sources for Verification

- **Multi-Agent Architectures & Trade-offs:** LangChain's guide on architectural patterns ([https://www.langchain.com/blog/choosing-the-right-multi-agent-architecture](https://www.langchain.com/blog/choosing-the-right-multi-agent-architecture))
- **Agentic Handoffs & State:** Towards Data Science deep-dive on LangGraph routing ([https://towardsdatascience.com/how-agent-handoffs-work-in-multi-agent-systems/](https://towardsdatascience.com/how-agent-handoffs-work-in-multi-agent-systems/))
- **The Agent Execution Loop:** Oracle's definition of the core architecture ([https://blogs.oracle.com/developers/what-is-the-ai-agent-loop-the-core-architecture-behind-autonomous-ai-systems](https://blogs.oracle.com/developers/what-is-the-ai-agent-loop-the-core-architecture-behind-autonomous-ai-systems))
- **Guardrail Placement Strategies:** Datadog's analysis of managed vs. custom orchestration loops ([https://www.datadoghq.com/blog/securing-ai-agents-guardrail-placement/](https://www.datadoghq.com/blog/securing-ai-agents-guardrail-placement/))
- **Self-Correction & Guardrail Best Practices:** Arthur AI's execution logic guidelines ([https://www.arthur.ai/blog/best-practices-for-building-agents-guardrails](https://www.arthur.ai/blog/best-practices-for-building-agents-guardrails))
- **Risk vs. Rule-Based Gating:** Port.io's breakdown of modern HITL and agent thresholds ([https://www.port.io/blog/human-in-the-loop-for-ai-coding-agents](https://www.port.io/blog/human-in-the-loop-for-ai-coding-agents))
