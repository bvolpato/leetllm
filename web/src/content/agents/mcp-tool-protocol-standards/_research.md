---
query: "We are creating a research-backed page for the following: \"MCP & Tool Protocol Standards\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: agents\nCurrent page scope: Trace a pinned MCP compatibility session, build a working stdio integration, and apply current deprecation and trust-boundary guidance.\nResearch refresh ID: 2026-08-13\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Prefer plain Markdown links like `[label](https://...)`. Avoid `(Source: Vendor)` wrappers, even when a link is present, and never use footnote-style or opaque citations without the URL.\n- Link directly to the source page. Never use search-result or search-redirect URLs.\n- Do not embed external images, image-search thumbnails, data URLs, or inline SVG. Describe useful visual ideas in text instead.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL.\n\nQuality correction attempt 2: previous response failed validation:\n- research body has 15 opaque source annotation(s) without direct URLs\n- research body embeds 1 external Markdown image(s)\n\nReplace it with a complete research packet. Keep useful Markdown structure, include at least 3 direct primary-source URLs, and avoid opaque source labels without links."
model: "Pro"
task_id: "1ccfd02b8bf49a4df02e87dca66137b6"
status: "completed"
---

Manual correction verified September 23, 2026: the released Current revision is 2026-07-28. The July 28 stable release is distinct from the earlier release candidate. The original research request above is historical context. [Official revision status](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning), [stable release announcement](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

# Research Packet: MCP & Tool Protocol Standards

## 1. Narrative Order & Prerequisites

**Target Audience:** Agent developers and platform engineers building tool integrations.

**Prerequisites:** Students must understand JSON-RPC 2.0 semantics, standard Unix I/O (`stdio`) mechanics, and basic LLM tool-calling flows.

**Teaching Sequence:**

1. **Protocol Primitives:** Define the Actor model and the core payload types.
2. **Transport Mechanisms:** Trace independent local `stdio` requests with per-request metadata, discovery, and correlated replies. Explain the initialization handshake only as compatibility with 2025-11-25 and earlier revisions.
3. **Advanced Capabilities:** Introduce multi round-trip requests for client input, then distinguish optional extensions and deprecated features from the current core.
4. **Security & Deprecation:** Map trust boundaries and explain the feature lifecycle.

## 2. Core Concepts & Mechanisms

**The Actor Model:** The host is the AI application and owns its clients. Each client connects to a server exposing capabilities. Host policy, server authorization, and protocol connectivity are separate responsibilities. [Official architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)

**Server Primitives:** Servers offer Tools (callable functions), Resources (URI-addressable context), and Prompts (server-defined templates). JSON Schema 2020-12 is the default dialect; a schema may explicitly declare another dialect. Servers must implement `server/discover`, but clients need not invoke discovery before every operation. [Core messages and schemas](https://modelcontextprotocol.io/specification/2026-07-28/basic), [discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)

**Client Input and Compatibility Features:**

- **Sampling:** Deprecated in 2026-07-28 and retained for compatibility; new implementations should use provider APIs directly. [Deprecation registry](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
- **Roots:** Deprecated, informational filesystem guidance. MCP does not enforce a filesystem sandbox; actual access controls belong in the implementation. [Roots](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- **Elicitation:** A server can return `resultType: "input_required"` with input requests. The client collects input and retries the original method with input responses and a new JSON-RPC ID. This replaces reverse JSON-RPC requests in the modern core. [Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- **Tasks:** Long-running tasks are an optional extension, rather than a required core primitive. [Tasks extension](https://modelcontextprotocol.io/extensions/tasks/overview)

## 3. Implementation Lab: stdio Transport

**Transport Tradeoffs:** With `stdio`, a client launches a server subprocess and exchanges newline-delimited JSON-RPC messages over its standard streams. HTTP is a separate binding, useful for remote deployments. Containerization alone does not dictate the transport. [stdio binding](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)

**Request Flow:**

- **Request context:** Modern requests carry version and client capabilities in `params._meta`; client identity metadata is self-reported, not authentication. There is no core initialization handshake or negotiated protocol session. HTTP also carries the required protocol version and method headers. [Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning), [HTTP binding](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- **Discovery:** `server/discover` reports versions and capabilities; `tools/list` and `resources/list` enumerate their respective catalogs. [Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- **Execution:** The client submits `tools/call`; a correlated result reports completion or required input. A protocol error and a tool-domain failure are different outcomes. [Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)

**Common Failure Modes:** Debug logs on stdout violate the stdio binding and can break message parsing. A transport crash is not a guaranteed consequence. Send logs to stderr, and correlate replies by ID rather than arrival order. [stdio binding](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)

## 4. Feature Deprecation & Versioning

**Current Standards:** As verified September 23, 2026, the Current specification date is 2026-07-28. Dated older specifications remain useful for explicitly pinned integrations, and a draft is not a released specification. [Official revision status](https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning)

**Lifecycle Policy:** Features move through Active, Deprecated, and Removed states. The ordinary minimum deprecation window is twelve months from release, with an approved active-security-risk exception of at least ninety days. Eligibility does not guarantee removal on that date; removed features remain recorded in the registry and historical revisions. [Feature lifecycle policy](https://modelcontextprotocol.io/community/feature-lifecycle)

## 5. Trust Boundaries & Security Failures

**Trust Boundary Failures:** Treat tool descriptions and returned content as untrusted input. Host approval cannot substitute for server-side caller and resource authorization, and a schema-valid response may still describe the wrong target. Distinguish these failures from OAuth confused-deputy, token-passthrough, and local-server compromise risks. [Official security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)

**Server Identity:** A server may wrap an API or local program; its deployment determines its privileges. `serverInfo` identifies an implementation for display, not a trusted service principal. Authenticate callers separately and authorize access to the requested tenant and resource. [Discovery identity](https://modelcontextprotocol.io/specification/2026-07-28/server/discover), [authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

**Security Guidance:** MCP does not require every JSON-RPC message to have a signature and expiration timestamp. Apply the transport and authorization requirements, including token audience validation and the prohibition on token passthrough. Bind application state handles to the authenticated caller; integrity-protect client-echoed server state where required. Repeated writes also need application-level idempotency, rather than relying on a new RPC ID to prevent duplicate effects. [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [state-handle security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), [MRTR state](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
