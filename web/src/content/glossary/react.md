---
title: ReAct
aliases: ["Reasoning and Acting"]
importance: 88
kind: code
---
**ReAct** is an agent pattern that interleaves reasoning about the next step with an **action** in an external environment and an **observation** returned by that action. Yao et al. introduced it in [*ReAct: Synergizing Reasoning and Acting in Language Models*](https://arxiv.org/abs/2210.03629) (ICLR 2023). Its key contribution is the closed loop:

$$
s_t \xrightarrow{\text{decide}} a_t
\xrightarrow{\text{environment}} o_{t+1}
\xrightarrow{\text{update}} s_{t+1}
$$

The model can search, read, run a test, or call an API, then use fresh evidence to revise its next step. Use structured action rationale, state summaries, or next-step fields for planning; tools and policy remain the deterministic control surfaces.

## The loop and its boundary

A ReAct-style agent has four distinct responsibilities:

1. **State:** trusted task inputs, prior observations, budgets, and progress.
2. **Decision:** the model proposes either a tool action or a final answer.
3. **Environment:** application code validates and executes an allowed action.
4. **Observation:** a bounded, typed result returns to the next model turn.

This separation matters. The model may *propose* `deploy(service="api")`; an [action allowlist](glossary://action-allowlist), schema validator, authorization layer, and approval policy decide whether it runs. ReAct is an orchestration pattern, not an authorization mechanism.

The original paper used visible `Thought`, `Action`, and `Observation` trajectories for research tasks. Product implementations often keep only structured state and tool events because unrestricted reasoning text can leak secrets, inflate context, and create a false impression that fluent explanations prove correct execution.


## Example

**Bounded incident lookup.**

The loop below keeps control in ordinary code. The model can choose among declared actions, but it can't invent an executable tool or exceed the step budget:

```python
MAX_STEPS = 6
ALLOWED = {"read_ci", "search_repo", "run_test"}

def investigate_ci(model, run_validated_tool, truncate, verify_evidence_support):
    state = {"goal": "explain the current CI failure", "observations": []}

    for step in range(MAX_STEPS):
        decision = model.decide(state)  # validated: {kind, tool?, args?, answer?}

        if decision.kind == "finish":
            if verify_evidence_support(decision.answer, state["observations"]):
                return decision.answer
            state["observations"].append({"error": "finish_not_supported"})
            continue

        if decision.kind != "action" or decision.tool not in ALLOWED:
            observation = {"ok": False, "error": "tool_not_allowed"}
        else:
            observation = run_validated_tool(decision.tool, decision.args)

        state["observations"].append({
            "step": step,
            "tool": decision.tool,
            "result": truncate(observation, max_chars=8_000),
        })

    raise RuntimeError(f"step_budget_exceeded: {MAX_STEPS}")
```

The injected helpers are application contracts: validate decisions and tool arguments, enforce resource authorization, bound observations, and verify freshness and answer support. A nonempty observation list alone is insufficient because it may contain only denials or stale logs.

Suppose the first CI log is stale. A one-shot answer may confidently diagnose an old failure. ReAct lets the agent inspect the current run, search the failing symbol, run the targeted test, and stop only when observations support the explanation. Each observation should include identity and freshness, such as run ID, commit SHA, timestamp, and exit code.

## Where it helps and where it doesn't

| Good fit | Poor fit |
| --- | --- |
| Facts must be read from live systems | Pure transformation with all inputs already present |
| Tool results change the next decision | Fixed workflow where code can call every step directly |
| Failure can be observed and corrected safely | Irreversible side effects without approval or reconciliation |
| Search space benefits from incremental evidence | Open-ended browsing with no budget or stop condition |

ReAct adds model calls, tool latency, context growth, and more failure states. If the sequence is known (`fetch -> validate -> write`), a normal function or explicit [state machine](glossary://state-machine) is cheaper and easier to prove. Use model choice only where the next action genuinely depends on semantic interpretation.

## Failure modes and checks

- **Looping:** the agent repeats the same search or tool error. Track normalized action signatures and stop repeated no-progress transitions.
- **Observation poisoning:** retrieved text tells the agent to ignore policy. Mark tool data as untrusted and keep instructions outside observations.
- **Context overflow:** raw logs accumulate until current evidence is buried. Store full artifacts externally and feed bounded summaries plus handles.
- **Premature finish:** a plausible answer appears before required evidence. Make completion predicates explicit and machine-checkable.
- **Side-effect replay:** retries repeat writes. Require [idempotency](glossary://idempotency), reconciliation, or human approval.
- **Untraceable behavior:** only final text is logged. Preserve action name, validated arguments, result identity, latency, error class, policy decision, and state version.

Evaluate the full trajectory alongside final-answer quality. Useful metrics include task success, tool-call validity, unnecessary calls, repeated actions, policy denials, step count, latency, cost, and whether cited observations actually support the result.

## Why it matters here

ReAct is the conceptual bridge from [tool calling](glossary://tool-calling) to a working agent. Tool schemas describe individual actions; ReAct explains how a model chooses an action, learns from its result, and chooses again. Production quality comes from wrapping that loop in typed state, limits, policy, checkpoints, and trajectory evaluation.

## Related terms

- [Tool calling](glossary://tool-calling)
- [Agent scaffold](glossary://agent-scaffold)
- [State machine](glossary://state-machine)
- [Action allowlist](glossary://action-allowlist)
- [Workflow checkpoint](glossary://workflow-checkpoint)
- [Trajectory evaluation](glossary://trajectory-evaluation)
- [Reflexion](glossary://reflexion)
