---
title: Context rot
importance: 86
kind: code
---
**Context rot** is the observed degradation of answer quality as more input is added to a model's context, even when the prompt remains below the advertised [context window](glossary://context-window). [Chroma's 2025 study](https://research.trychroma.com/context-rot) used the term while testing retrieval, copying, and related tasks across 18 models. The term describes an empirical pattern; its causes and magnitude depend on the model, task, and context.

A larger window answers **how many tokens the API accepts**. Evidence usability varies with position, distractor mix, and conversation length. Additional tokens can dilute attention, introduce contradictions, bury instructions, or make the relevant relationship less explicit. Sometimes more context helps; sometimes it leaves quality flat; sometimes it hurts.

## Separate four failures

| Failure | What happened | Best first check |
| --- | --- | --- |
| **Truncation** | Required text fell outside hard token limit | Count tokens and inspect exact serialized prompt |
| **Lost in the middle** | Position changes retrieval/use of a relevant item | Sweep same fact across beginning, middle, and end |
| **Retrieval miss** | Correct document never entered prompt | Measure candidate recall before generation |
| **Context rot** | Quality falls as context grows or distractors accumulate | Hold answer fact fixed; vary length and composition |

These can overlap, but they imply different fixes. Expanding the model window fixes truncation only. Moving one passage may diagnose position sensitivity but not contradiction or distractor load. Better retrieval can't help if the generator ignores evidence already present.

## Measure context quality

Define a task score $Q(L, p, d)$ for prompt length $L$, answer position $p$, and distractor policy $d$. A simple degradation curve relative to a short controlled baseline is:

$$
\Delta Q(L, p, d) = Q(L, p, d) - Q(L_0, p_0, d_0)
$$

No single curve describes a model. Measure at least:

- several lengths, including normal production percentiles;
- answer/evidence at beginning, middle, and end;
- relevant-only context versus plausible and adversarial distractors;
- explicit versus indirect query-to-evidence relationships;
- single-turn and accumulated conversation shapes;
- exact model version, prompt template, and decoding policy.

Use deterministic graders where possible: exact copied string, cited document ID, executable answer, or structured field. An LLM judge can supplement those checks but may itself be sensitive to long inputs.

## Example: positional and length sweep

```python
lengths = [2_000, 8_000, 32_000]
positions = ["start", "middle", "end"]

rows = []
for length in lengths:
    for position in positions:
        prompt = build_controlled_prompt(
            target_tokens=length,
            gold_fact="rotation_window=24h",
            gold_position=position,
            distractor_policy="plausible_runbooks",
        )
        answer = call_model(prompt, temperature=0)
        rows.append({
            "length": length,
            "position": position,
            "correct": "24h" in answer,
            "cited_gold": "credential-policy-v4" in answer,
        })
```

This is scheduler pseudocode: prompt construction and model calls are application-defined. Its substring checks are only a sketch; "not 24h" would pass the first one. A real grader should validate the extracted value and whether the cited source supports it. If the serialized prompt retains the gold fact and accuracy falls only with added distractors, that comparison points to distractor effects rather than hard truncation. If middle placement fails while start/end succeed with identical evidence, position is a stronger signal. Repeat fixtures to estimate uncertainty before setting a context policy.

## Mitigations by information flow

1. **Select:** retrieve fewer, higher-recall candidates and rerank them.
2. **Compress:** summarize old turns or tool output, preserving source handles and decisions.
3. **Order:** place instructions and decisive evidence where your tested model uses them reliably.
4. **Isolate:** give subproblems separate contexts, then merge verified outputs.
5. **Externalize:** keep full logs, files, and memory outside prompt; load only what current step needs.
6. **Refresh:** remove stale or contradicted context instead of appending corrections forever.

Compression can destroy exact identifiers or qualifiers, and summaries can hallucinate. Keep raw artifacts addressable and test whether compressed context still supports exact answers. A [token budget](glossary://token-budget) should allocate space by expected utility, not fill the maximum because capacity exists.

## Common mistakes

- Treating context rot as another name for truncation or lost-in-the-middle.
- Quoting one model's benchmark curve as a universal threshold.
- Testing random filler when production contains semantically plausible distractors.
- Changing length, position, model, and prompt template in the same comparison.
- Measuring only answer style instead of evidence use and task correctness.
- Solving long prompts with aggressive summaries that erase permissions, dates, or negation.

## Why it matters here

Long-context RAG, agent memory, and million-token APIs tempt teams to replace retrieval and state design with prompt accumulation. Evaluate whether the model still finds and uses the right evidence under real length, order, and distractor distributions.

## Related terms

- [Context window](glossary://context-window)
- [Context engineering](glossary://context-engineering)
- [Token budget](glossary://token-budget)
- [Chunking](glossary://chunking)
- [Reranker](glossary://reranker)
- [Dense retrieval](glossary://dense-retrieval)
- [Offline evaluation](glossary://offline-evaluation)
