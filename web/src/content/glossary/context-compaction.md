---
title: Context compaction
aliases: ["conversation compaction", "history compaction"]
importance: 85
---
Context compaction replaces part of a long conversation with a smaller representation so an agent can continue within its context budget. It often summarizes earlier work while retaining recent turns and selected evidence. Compaction changes the model's input. It doesn't enlarge the context window, retrain the model, or preserve every detail automatically.

## Preserve decisions and evidence separately


A useful compacted state records the current objective, constraints, completed actions, unresolved questions, and identifiers for supporting artifacts. Exact error text, tool-call identities, and numerical evidence may need to remain verbatim or retrievable. A summary that preserves the conclusion but drops its evidence can make the next decision less reliable.

[Anthropic's context-engineering discussion](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) describes compaction as one approach to long-running agent context management. The engineering trade exchanges some historical detail for room to do future work.

## Example

An incident investigation has 80,000 tokens of repeated logs. A compacted record keeps the alert, the tested hypotheses, the trace IDs showing database-network delay, and the next unanswered question. Full logs remain in an authorized artifact store. The agent can retrieve a trace again instead of treating a summary sentence as fresh evidence.

## Why it matters here

Compaction affects long-context agents and RL trajectories. Record when it happened, which history was replaced, and what tokens the policy actually saw afterward. Reconstructing an old rollout with a newly written summary changes its conditioning context and invalidates a same-input likelihood comparison. Cache reuse also needs to respect the changed prefix.

## Related terms

- [Context window](glossary://context-window)
- [Context engineering](glossary://context-engineering)
- [Token budget](glossary://token-budget)
- [Chat template](glossary://chat-template)
- [RL rollout](glossary://rl-rollout)
