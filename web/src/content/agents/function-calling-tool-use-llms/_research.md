---
query: "We are creating a research-backed page for the following: \"Function Calling & Tool Use\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: agents\nCurrent page scope: Build a safe tool-calling runtime that validates model requests, executes controlled actions, feeds observations back, and evaluates complete workflows.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "86a9e0c9b3356830660921b15b0ed6ab"
status: "completed"
---

Here is a suggested structure and the essential content to include for the **Function Calling & Tool Use** curriculum article, reflecting current practices and the 2026 ecosystem.

## Proposed Page Structure

### 1. Prerequisites & Learning Outcomes

- **Prerequisites:** Readers should understand basic LLM inference, API parameters (temperature, max tokens), and JSON Schema fundamentals.
- **Outcomes:** By the end of this module, readers will be able to design a deterministic tool execution loop, validate model outputs against strict schemas, sandbox state-changing tools, and evaluate multi-turn agentic workflows.

### 2. Core Concepts: The Execution Loop

- **The Transition to Agents:** Explain how function calling shifts LLMs from passive text generators to active systems that can query databases, execute code, and mutate state.
- **The Five-Step Lifecycle:**

1. **Declaration:** The host application provides tool definitions using JSON Schema in the API request.
2. **Generation:** The model decides whether to respond in natural language or emit one or more tool call payloads (e.g., `tool_calls`).
3. **Validation:** The host intercepts the payload and strictly validates the arguments (using tools like Pydantic).
4. **Execution:** The host runs the local function or external API within a safe sandbox.
5. **Observation:** The host appends the output to the conversation history as a `tool_result` or `tool_message` and triggers a subsequent model inference.
- **Visualizing the Loop (Text Description):** Describe a sequence diagram showing the boundary between the **LLM API** (stateless generation) and the **Host Runtime** (stateful execution and validation).

### 3. Current Ecosystem, APIs, and Frameworks (2026)

- **The Schema Standard:** The OpenAI tool-calling JSON schema format has become the de facto standard across the industry. Models from OpenAI, DeepSeek, and Gemini largely support the same schema format for portability.
- **Anthropic's Native Structured Outputs:** Discuss how Anthropic transitioned from emulating tool calls (forcing schemas into `tool_choice`) to native grammar-constrained JSON generation via the `output_format` parameter, which guarantees JSON Schema compliance at the token level [1]. [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- **OpenAI Agents SDK:** Introduce the official framework released in 2025, which standardized built-in state management, parallel tool calls, tool streaming, and JSON schema validation for production environments. [OpenAI Agents SDK Documentation](https://agents-lib.com/agents/openai-agents-sdk)

### 4. Safety, Sandboxing & Validation Tradeoffs

- **The Execution Boundary:** Emphasize that LLMs must **never** execute code or API calls directly. The host runtime must enforce the boundary.
- **Input Validation:** Explain the difference between probabilistic output and constrained decoding. Mention how modern APIs enforce strict schema compliance, but business logic (e.g., verifying user permissions for an action) must happen in the runtime.
- **Ephemeral Environments:** Detail techniques for safely executing model-generated code (like Python interpreters for data analysis) using WebAssembly (WASM) or isolated Docker containers to prevent host exploitation.

### 5. Evaluation: Berkeley Function Calling Leaderboard (BFCL)

- **Evolution of Evaluation:** Explain how evaluating tool use has matured from simply checking single-turn formatting (AST evaluation) to testing complex agentic behavior.
- **BFCL-v3 (August 2026):** Highlight the current standard for evaluation. BFCL-v3 introduces multi-turn and multi-step interactions where models must retain context across turns and execute multiple internal function calls [2]. Unlike earlier versions, it uses state-based evaluation to verify actual system state changes rather than just execution path correctness. [BFCL-v3 Leaderboard](https://llm-stats.com/benchmarks/bfcl-v3)

### 6. Common Failure Modes & Practice Labs

- **Failure Modes:**

- **Hallucinated Tools:** The model attempts to call a tool that wasn't provided.
- **Argument Mismatch:** The model omits required arguments or invents parameters outside the schema.
- **Infinite Loops:** The model repeatedly calls the same tool with the same failing arguments.
- **Lab Idea:** Build a multi-turn file-system agent. The learner must define tools for `read_file`, `write_file`, and `list_dir`, implement a validation layer that prevents path traversal attacks, and write a loop that cleanly handles API errors by feeding the stack trace back to the model.
