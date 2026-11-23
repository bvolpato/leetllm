import { describe, expect, test } from "vitest"
import { parseLearningSections } from "./learning-sections"

describe("parseLearningSections", () => {
    test("extracts mastery details from marked markdown sections", () => {
        const sections = parseLearningSections(`
Body.

<!-- leetllm: mastery:start -->

## Mastery check

### Key concepts

- Chunk overlap

### Evaluation rubric

- **Foundational:** Explains fixed windows.
- **Advanced:** Compares late chunking with early chunking.

### Follow-up questions

\`\`\`checkpoint
What chunk overlap works best?
---
Measure it against recall. Do not use overlap by default.
\`\`\`

### Common pitfalls

- Using one-size-fits-all chunking.

<!-- leetllm: mastery:end -->
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Explains fixed windows.",
            "Advanced: Compares late chunking with early chunking.",
        ])
        expect(sections.followUpQuestions).toEqual([
            {
                question: "What chunk overlap works best?",
                answer: "Measure it against recall. Do not use overlap by default.",
            },
        ])
        expect(sections.commonPitfalls).toEqual([
            "Using one-size-fits-all chunking.",
        ])
    })

    test("extracts fallback H2 mastery sections without explicit markers", () => {
        const sections = parseLearningSections(`
## What to check before moving on

- Foundational: Explains chunk overlap.
- Advanced: Chooses late chunking only after measuring retrieval.

## Practice checkpoints

\`\`\`checkpoint
What overlap should you start with?
---
Start small and measure recall against a golden set.
\`\`\`

## Common pitfalls

**Symptom:** Retrieved chunks repeat themselves.
**Cause:** Overlap is too large.
**Fix:** Reduce overlap and deduplicate retrieval results.
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Explains chunk overlap.",
            "Advanced: Chooses late chunking only after measuring retrieval.",
        ])
        expect(sections.followUpQuestions).toEqual([
            {
                question: "What overlap should you start with?",
                answer: "Start small and measure recall against a golden set.",
            },
        ])
        expect(sections.commonPitfalls).toEqual([
            "Symptom: Retrieved chunks repeat themselves. Cause: Overlap is too large. Fix: Reduce overlap and deduplicate retrieval results.",
        ])
    })

    test("extracts review details and numbered defend lists", () => {
        const sections = parseLearningSections(`
## What a good answer can defend

1. Pins weights, prompts, and container images together.
2. Defines rollback triggers before canary traffic grows.

Common mistakes follow from those points: deploying without eval gates, using floating model names, and routing canaries without sticky keys.

## Review questions

<details>
<summary>Why is sticky routing required during a canary?</summary>

Without a stable key, a refresh can jump the same conversation between model versions and corrupt the comparison.

</details>
`)

        expect(sections.rubricPoints).toEqual([
            "Pins weights, prompts, and container images together.",
            "Defines rollback triggers before canary traffic grows.",
        ])
        expect(sections.followUpQuestions).toEqual([
            {
                question: "Why is sticky routing required during a canary?",
                answer: "Without a stable key, a refresh can jump the same conversation between model versions and corrupt the comparison.",
            },
        ])
        expect(sections.commonPitfalls).toEqual([
            "deploying without eval gates",
            "using floating model names",
            "routing canaries without sticky keys",
        ])
    })

    test("extracts table rubrics and headed design questions", () => {
        const sections = parseLearningSections(`
## What to check before moving on

| Tier | You should be able to defend |
|------|------------------------------|
| Foundational | Map encoder, projector, and backbone roles. |
| Advanced | Diagnose KV-cache growth from visual prefixes. |

### Production questions to answer

#### How do you keep visual prefixes from overrunning context?

Compress them before the LLM and cap the visual token budget.

### Common design failures

- Ignoring projector bottlenecks.
- Treating MoE as a substitute for token budgeting.
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Map encoder, projector, and backbone roles.",
            "Advanced: Diagnose KV-cache growth from visual prefixes.",
        ])
        expect(sections.followUpQuestions).toEqual([
            {
                question: "How do you keep visual prefixes from overrunning context?",
                answer: "Compress them before the LLM and cap the visual token budget.",
            },
        ])
        expect(sections.commonPitfalls).toEqual([
            "Ignoring projector bottlenecks.",
            "Treating MoE as a substitute for token budgeting.",
        ])
    })

    test("extracts alternate defend titles, mastery checklists, and table-based pitfalls", () => {
        const sections = parseLearningSections(`
## What reviewers should be able to defend

| Layer | What to defend |
|---|---|
| Foundational | Freeze splits and baseline first. |
| Advanced | Add rollback criteria and live guardrails. |

## Failure modes to catch in review

| Failure | Symptom | Fix |
|---|---|---|
| Full-file STT | Long pause before first reply | Stream partial transcripts into the LLM. |
| No sticky routing | Audio breaks after rebalance | Keep session affinity at the media worker. |

## Mastery checklist

- Explain a sub-500ms budget across VAD, STT, LLM, TTS, and playout.
- Justify sticky routing, barge-in cancellation, and playout-confirmed history.
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Freeze splits and baseline first.",
            "Advanced: Add rollback criteria and live guardrails.",
            "Explain a sub-500ms budget across VAD, STT, LLM, TTS, and playout.",
            "Justify sticky routing, barge-in cancellation, and playout-confirmed history.",
        ])
        expect(sections.commonPitfalls).toEqual([
            "Failure: Full-file STT Symptom: Long pause before first reply Fix: Stream partial transcripts into the LLM.",
            "Failure: No sticky routing Symptom: Audio breaks after rebalance Fix: Keep session affinity at the media worker.",
        ])
    })

    test("extracts nested pitfall headings and symptom blocks before code", () => {
        const sections = parseLearningSections(`
## Common mistakes

### Picking LoRA before diagnosing the problem

Adapters can hide a knowledge gap instead of fixing it.

### Saving weights without resume state

That is an inference artifact, not a resumable checkpoint.

## Common mistake: no data fingerprint

**Symptom:** Two identical commands produce different validation scores.
**Cause:** Training rows changed between runs.
**Fix:** Log dataset version, split id, and checksum.

\`\`\`python
print("still part of article")
\`\`\`
`)

        expect(sections.commonPitfalls).toEqual([
            "Picking LoRA before diagnosing the problem",
            "Saving weights without resume state",
            "Symptom: Two identical commands produce different validation scores. Cause: Training rows changed between runs. Fix: Log dataset version, split id, and checksum.",
        ])
    })

    test("extracts strong-answer and when-breaks sections", () => {
        const sections = parseLearningSections(`
## What strong answers show

| Evidence | What a strong answer shows |
|---|---|
| routing | Separates replica scaling from tensor parallel fit. |

## When model serving breaks down

| Symptom | Cause | Fix |
|---|---|---|
| TTFT rises | Cross-node collectives dominate | Keep tensor parallel groups inside fast links. |
`)

        expect(sections.rubricPoints).toEqual([
            "routing: Separates replica scaling from tensor parallel fit.",
        ])
        expect(sections.commonPitfalls).toEqual([
            "Symptom: TTFT rises Cause: Cross-node collectives dominate Fix: Keep tensor parallel groups inside fast links.",
        ])
    })

    test("extracts before-you-continue rubric and when-misleads pitfalls", () => {
        const sections = parseLearningSections(`
## When embeddings mislead

- Trusting cosine without an evaluation set.

## Before you continue

- Explain why soft labels carry more information than hard labels.
- Decide whether a distilled student passes release gates.
`)

        expect(sections.rubricPoints).toEqual([
            "Explain why soft labels carry more information than hard labels.",
            "Decide whether a distilled student passes release gates.",
        ])
        expect(sections.commonPitfalls).toEqual([
            "Trusting cosine without an evaluation set.",
        ])
    })

    test("extracts skill-level rubric sections", () => {
        const sections = parseLearningSections(`
## Skill levels to aim for

- Foundational: Explain why top-k retrieval can underrepresent global queries.
- Advanced: Design a hybrid graph-vector architecture.
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Explain why top-k retrieval can underrepresent global queries.",
            "Advanced: Design a hybrid graph-vector architecture.",
        ])
    })

    test("extracts checklist-style rubric sections", () => {
        const sections = parseLearningSections(`
## Practice goals

- Foundational: Keep unauthorized chunks outside app-visible candidates.

## Tie the ideas together

1. **Identify the bottleneck.** Explain when HBM traffic dominates attention.

## Skills to defend in review

- Advanced: Show the classifier-free guidance interpolation formula.

## Final design checklist

- Choose a routing strategy for trivial, medium, and hard verifiable tasks.
`)

        expect(sections.rubricPoints).toEqual([
            "Foundational: Keep unauthorized chunks outside app-visible candidates.",
            "**Identify the bottleneck.** Explain when HBM traffic dominates attention.",
            "Advanced: Show the classifier-free guidance interpolation formula.",
            "Choose a routing strategy for trivial, medium, and hard verifiable tasks.",
        ])
    })

    test("derives compact review support from checkpoints and mastery distractors", () => {
        const sections = parseLearningSections(`
\`\`\`checkpoint
Why must an eval split stay frozen?
---
Changing rows makes release scores incomparable.
\`\`\`

\`\`\`mastery-quiz
[
  {
    "question": "Which split supports a release comparison?",
    "options": ["A frozen versioned split", "A newly sampled split for every run"],
    "answer": "A frozen versioned split",
    "explanation": "A stable split makes scores comparable."
  }
]
\`\`\`
`)

        expect(sections.rubricPoints).toEqual([
            "Why must an eval split stay frozen?",
        ])
        expect(sections.followUpQuestions).toEqual([
            {
                question: "Why must an eval split stay frozen?",
                answer: "Changing rows makes release scores incomparable.",
            },
        ])
        expect(sections.commonPitfalls).toEqual([
            "Mistake: A newly sampled split for every run Correction: A frozen versioned split",
        ])
    })
})
