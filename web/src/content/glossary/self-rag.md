---
title: Self-RAG
aliases: ["self-reflective retrieval-augmented generation"]
importance: 79
---

**Self-RAG** is a retrieval-augmented generation method that trains a model to emit special reflection tokens controlling whether to retrieve evidence and how to judge candidate answer segments. Asai and colleagues describe the training and inference design in [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511). The model can evaluate whether a retrieved passage is relevant, whether a segment is supported by that passage, and whether the answer is useful before choosing a continuation.

## Learned reflection tokens

Self-RAG uses reflection-token behavior learned during model training and those token probabilities during segment-level decoding. Asking an unchanged model to "check your answer" can imitate part of the workflow; the trained behavior and reported evaluation results depend on the learned method.

## Example

A developer asks which retry budget applies to an embedding endpoint. Self-RAG retrieves policy passages, produces competing answer segments, and prefers the segment supported by the relevant endpoint policy. A fluent candidate naming an invented budget should receive lower support even if its prose sounds confident.

Keep authentication, tenant isolation, and document lineage as separate controls from reflection scores. Filter unauthorized passages at the retrieval perimeter before any model sees them, and expose evidence with the chosen answer so the product can inspect it.

## Why it matters here

Advanced retrieval lessons separate three mechanisms: rewriting the question, generating a hypothetical retrieval probe, and training a model to make retrieval and critique decisions. Recognizing that distinction prevents teams from claiming Self-RAG behavior for an ordinary prompt-and-retry pipeline.

## Related terms

- [RAG](glossary://rag)
- [Guardrail](glossary://guardrail)
- [Beam search](glossary://beam-search)
- [lineage](glossary://provenance)
