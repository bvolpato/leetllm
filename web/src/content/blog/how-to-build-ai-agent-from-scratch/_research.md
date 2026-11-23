---
query: "Research packet for How to Build an AI Agent from Scratch"
model: "Pro"
task_id: "e83f263ddd06b44d2a49f8b515ad39eb"
status: "completed"
---

Research-backed outline and editorial notes for building an AI agent from scratch, anchored in primary documentation and verified local Python execution.

## Blog Post Outline: How to Build an AI Agent from Scratch

### 1. Introduction: The Agent Illusion

- **The Core Concept:** Strip away framework buzzwords, and an AI agent is a stateful control loop. The large language model (LLM) does not touch files, databases, or APIs itself. It emits structured intent, and *your Python code* handles validation and execution.
- **The Three Pillars of an Agent:**
  - An LLM capable of deciding whether to answer a user or request a tool.
  - A set of tools your runtime environment can safely execute (e.g., search, file reading, test execution).
  - A capped loop that repeats until the goal is achieved or a safety limit stops execution.
- **When to Use Agents:** Start with the simplest solution that works. [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) distinguishes predefined workflows from agents that dynamically direct their own processes. A fixed workflow is often easier to control when the route is known; a model-directed loop can help when new evidence determines the next step. This isn't a universal performance ranking.

### 2. Anatomy of the Core Loop (ReAct Pattern)

- **The ReAct Connection:** The [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) paper interleaves explicit reasoning traces and task-specific actions. The tutorial uses the related action/observation feedback shape without claiming to reproduce the paper's prompting method or results:
  1. **Decide:** The model evaluates the current state and chooses to either use a tool or provide a final answer.
  2. **Act:** Your runtime intercepts the request, validates the tool choice and arguments, and executes the allowed tool.
  3. **Observe:** The runtime captures the result, appends it to history with the matching call identifier, and prompts the model again if budget remains.
- **Key Insight:** This is a stateful control loop, not a four-step checklist. The loop allows the system to retry after errors, switch tools, and aggregate evidence over multiple turns.

### 3. Implementation Prerequisites & Code Architecture

- **Tool Registries:** Before calling the model, you need a schema mapping and a registry of executable Python functions. Tools should be narrow, typed, capped, and explicit about when the model should use them. A description guides selection; runtime policy still determines whether execution is allowed.
- **Preserving History:** According to the [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling), you must preserve the exact order of the provider's `function_call`, reasoning, and message items. Do not rebuild the conversation history from visible text alone; a `function_call_output` must carry the exact `call_id` of the request that generated it.
- **Frameworks vs. Scratch:** The raw loop exposes isolation and control points that frameworks may package. [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) is an orchestration runtime with persistence and durable execution; [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro) standardizes connections to external tools and resources. MCP isn't itself the agent's planning or stop policy.

### 4. Security: Observations are Untrusted Data

- **The Indirect Prompt Injection Threat:** Tool outputs (like file contents, CI logs, or web pages) re-enter the model as conversation state. Malicious strings hidden in these documents can hijack the model to rewrite instructions, request extra tools, or bypass logic.
- **Defense Strategies:**
  - Treat all observations as untrusted data, not control instructions.
  - Never allow an observation to expand the tool allowlist or elevate privileges.
  - Enforce length caps and redactions on tool outputs before they crowd out the task instructions or leak secrets.
  - Keep approval gates (like human-in-the-loop for deployments) securely in *your Python runtime*, never relying on the LLM to enforce the gate via prompting.

### 5. Failure Modes and Production Controls

- **Where Agents Break First:**
  - **Infinite Loops:** The model gets stuck repeatedly calling a failing tool.
  - **Hallucinated Tools:** The model invents a tool name that doesn't exist.
  - **Context Overflow:** Dumping massive logs or files exceeds the context window.
  - **Malformed Arguments:** The model passes invalid JSON or violates type constraints.
- **Production Wrapping:** The raw loop is just the middle of a production agent. Wrap it in hard runtime controls:
  - **Step and Cost Caps:** Stop the loop when it hits a defined token budget or iteration limit.
  - **Strict Schemas:** Use validation-error retries to recover from bad tool arguments.
  - **Timeouts:** Implement both per-tool timeouts and a global task deadline.
  - **Separation of State:** Keep exact state, permissions, and workflow variables in a real database. Do not rely on vector databases or the model's message array as the source of truth for exact state.

### 6. Evaluation: Grading the Trajectory

- **Beyond the Final Answer:** A major misconception is evaluating an agent purely on whether it got the final answer right. Two agent runs can produce the correct answer, but one might have taken a highly risky or inefficient path to get there.
- **What to Measure:** Score the agent's full tool trajectory. Evaluate whether it chose the permitted tools, stopped at the appropriate time, recovered cleanly from execution errors, and accurately interpreted the evidence it gathered.

## Manual verification corrections (2026-09-23)

The reviewed tutorial uses an explicitly configured `OPENAI_MODEL`, a sample configuration snapshot, a deterministic offline replay, and a separate optional Responses adapter. That offline replay verifies runtime control flow rather than live model accuracy.

- The architecture distinction is a design heuristic, not a measured universal claim that fixed workflows "beat" agents. Anthropic recommends starting with the simplest solution that works, then using model-directed agents when flexibility earns added latency and cost. The canonical page is [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents), replacing the older `/research/` URL in this packet.
- The [ReAct paper](https://arxiv.org/abs/2210.03629) interleaves reasoning traces with task-specific actions. The tutorial borrows its action/observation feedback shape; a generic tool loop without those explicit traces doesn't reproduce the paper's experimental method or results.
- [Responses function calling](https://developers.openai.com/api/docs/guides/function-calling) confirms matching `call_id` outputs, retaining reasoning items, strict object requirements, and zero-or-one tool call when `parallel_tool_calls=False`. A valid string argument can still name a denied resource. Runtime authorization and application-specific value limits remain necessary.
- The current [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-without-stored-responses) says `store=False` reasoning items contain encrypted reasoning by default. Legacy `include=["reasoning.encrypted_content"]` remains accepted but isn't required by the current guide. The adapter preserves complete outputs and disables response storage.
- [Data controls](https://developers.openai.com/api/docs/guides/your-data) distinguish application-state storage from abuse-monitoring retention. `store=False` doesn't imply that every form of provider retention is disabled.
- The [official Python SDK](https://github.com/openai/openai-python#timeouts) supports `timeout` and `max_retries=0`. A network timeout isn't a preemptive total task deadline, and a thread timeout doesn't terminate arbitrary tool code.
- The original instruction to return every error as an observation is too broad. The reviewed runtime returns expected invalid tool requests as data; provider failures and incomplete responses abort the command-line program rather than impersonating tool results. Side effects need application policy, approval where required, durable operation identity, and reconciliation after unknown outcomes.
- [Indirect prompt injection research](https://arxiv.org/abs/2302.12173) supports treating retrieved tool content as attacker-controlled input. Prompt wording is only one defense; the snapshot tool registry has no upload, shell, or credential-reading capability.

Verification limits: the three linked standard-library Python cells were executed on CPU. No provider API call, model comparison, production migration, sandbox escape test, or live-agent success-rate experiment was performed.
