---
title: Provenance
importance: 78
---
**Provenance** is a durable record of where an artifact came from, which entities and versions fed it, which activities transformed it, and which agents were responsible. The W3C PROV data model defines it as information about entities, activities, and people involved in producing a piece of data or a thing, used to judge quality, reliability, and trustworthiness. In AI systems that means every trusted object (raw file, parsed page, chunk, feature row, training snapshot, eval set, model checkpoint, or cited answer) should carry enough lineage that you can answer: *what is this, how was it made, from what, by whom or which code, and under which access rule?*

Provenance is the durable paper trail that stays meaningful after the process exits. Operational [tracing](glossary://tracing) explains a single request's path and latency; an [audit trail](glossary://audit-trail) records who acted and what was decided; provenance explains why a *data object* looks the way it does so you can trust, cite, reproduce, or revoke it.

## Intuition

W3C PROV reduces provenance to three node types and the relations among them:

| PROV idea | Plain meaning | AI / LLM example |
| --- | --- | --- |
| **Entity** | A thing with fixed aspects you care about | PDF bytes, normalized page text, chunk, dataset snapshot, model weights |
| **Activity** | A process over time that uses or produces entities | Ingest job, OCR, chunking, embedding, training run, retrieval |
| **Agent** | Who or what bears responsibility | On-call team, service account, parser version, human labeler |

Core relations map cleanly onto pipelines:

- **used** / **wasGeneratedBy**: activity read entity $A$, produced entity $B$
- **wasDerivedFrom**: $B$ was transformed or constructed from $A$ (not every co-use is a derivation)
- **wasAttributedTo** / **wasAssociatedWith**: responsibility for the entity or the activity

A chain such as *source PDF → parse → OCR → chunk → embed → retrieve → cite* is a derivation graph. Without those edges recorded, a wrong citation is an argument about feelings. With them, you ask whether the failure was source, parser, OCR, chunk rule, ACL filter, retriever, or generator.

**Lineage** in warehouse tooling often means "how data moved through tables and jobs." **Provenance** (in PROV and in training-data governance) stresses origin, responsibility, license, and trust as well as the transform path. In practice you want both: the hop graph *and* the identity of source, recipe, and agent at each hop.

## How it works

Build provenance as structured metadata that travels with the object, not as free text buried in a ticket.

1. **Identify the entity.** Stable `doc_id` / `chunk_id` / `dataset_id` / `run_id`, plus a [checksum](glossary://checksum) of the bytes or normalized content you actually trust.
2. **Record the source.** URI or export name, primary source when different from a mirror, collection window, and version or revision id when the upstream has one.
3. **Record the activity graph.** Ordered transforms with code or config versions: parser, OCR engine, normalizer, chunker, redactor, feature job, train command. Each lossy step (OCR, summarization, dedup, synthetic rewrite) must be named.
4. **Record agents and policy.** Owner team, service identity, labeler or judge version, license or allowed-use tag, and the [ACL](glossary://acl) or permission scope that applied at write time (re-check at read time).
5. **Timestamp with meaning.** Prefer event time (when the world or source said this), process time (when your pipeline ran), and availability time (when the row became queryable) as separate fields when they differ.
6. **Pin downstream consumers.** Eval harnesses, training runs, and RAG indexes should reference entity ids + digests, not bare paths like `latest.parquet`.

A minimal mental model for one derivation edge:

$$
B \;\text{wasDerivedFrom}\; A \quad\text{via activity}\; \pi \quad\text{at time}\; t
$$

with $\pi$ identified by name and version (for example `chunk_rule=heading-aware-v4`). If $A$ or $\pi$ changes, record a new derivation even when it produces identical bytes. The content digest can legitimately stay the same; it identifies content, not the recipe or provenance history. Pin both when reproducibility depends on how the content was made.

## Diagram


Each solid edge is a derivation or generation you can store. Dotted edges attach responsibility. If the answer is wrong, walk left from `Ans` until the first edge fails a check (digest mismatch, wrong page, OCR flag, ACL miss, stale `ingested_at`).

## Example

Support RAG retrieves chunk `chk_9f2a` for an on-call query. The chunk record carries provenance alongside its text:

```python
chunk = {
    "chunk_id": "chk_9f2a",
    "doc_id": "runbook-42",
    "source_url": "gs://docs/runbook-42.pdf",
    "primary_source": "https://intranet.example/runbooks/42",
    "page": 3,
    "locator": "page=3;bbox=72,410,540,480",
    "text": "Page the primary on-call within 15 minutes of SEV-1.",
    "content_sha256": "sha256:91bc44d0…",
    "bytes_sha256": "sha256:a3f1c9e2…",  # raw PDF at ingest
    "activities": [
        {"name": "fetch", "version": "ingest@2.4", "at": "2026-03-01T12:00:00Z"},
        {"name": "parse", "version": "pdfium@1.2", "at": "2026-03-01T12:00:02Z"},
        {"name": "ocr", "version": None, "note": "native text layer used"},
        {"name": "chunk", "version": "heading-aware-v4", "at": "2026-03-01T12:00:03Z"},
        {"name": "embed", "version": "e5-large-v2@idx-7", "at": "2026-03-01T12:00:05Z"},
    ],
    "derived_from": ["doc:runbook-42@bytes_sha256:a3f1c9e2…"],
    "agent": "ingest-worker",
    "owner": "eng-oncall",
    "acl": "eng-oncall",
    "license": "internal-only",
    "ingested_at": "2026-03-01T12:00:00Z",
    "source_revised_at": "2026-02-20T09:00:00Z",
}
```

When a user disputes "15 minutes," you do not re-argue the model. You check:

1. Does `content_sha256` still match the active corpus for that day?
2. Is `page` / `locator` correct, or did chunking glue two sections?
3. Was OCR involved (digit swap `S0`/`50`)?
4. Did the PDF revision change after `source_revised_at` while the index kept the old digest?
5. Was the caller in `acl: eng-oncall`, or did a missing filter leak a restricted runbook?

Same idea for training and eval. A fine-tuning mix needs dataset-level provenance (source collections, creators, licenses, filters) in the spirit of large public audits of instruction-tuning data: without source and license lineage, "we trained on open data" is an unverifiable claim. Pin each [dataset record](glossary://dataset-record) with digest, recipe, and allowed-use tags so a model registry entry can point at concrete parents.

## What to record

If a field can change the answer, the metric, or the legal use, store it.

| Field class | Examples | Why |
| --- | --- | --- |
| Identity | `doc_id`, `chunk_id`, URI, revision | Find the object again |
| Integrity | algorithm + content digest | Detect silent rewrite or bad deploy |
| Transform recipe | parser, OCR, chunk rule, feature code version | Reproduce and bisect |
| Time | event / process / availability | Staleness and point-in-time joins |
| Responsibility | owner, service, labeler, judge | Who to ask; who signed off |
| Policy | ACL, license, retention, PII handling | Access and compliance |
| Lossy flags | OCR used, summarized, synthetic, redacted | Trust and error modes |

Store the PDF identity, its content hash, the parser version, and the chunking rule. A bare filename is folklore.

## Production failure modes

- **Orphan text:** chunks or features with no parent id or digest. You cannot reindex, revoke, or prove a citation.
- **Recipe amnesia:** content digest changes every re-run because normalization is unversioned, or stays the same while the parser silently changes meaning.
- **ACL frozen at ingest only:** grants go stale; provenance still says `acl=eng-oncall` but runtime never re-checks.
- **Latest pointers:** training and eval pin `s3://bucket/train.parquet` without version or digest; last month's F1 and this month's F1 describe different rows.
- **License and attribution gaps:** mixed fine-tuning corpora without source and license lineage create legal and policy risk that no offline accuracy number will catch.
- **Provenance of provenance missing:** who wrote the lineage record, and when? When multiple systems assert conflicting parents, you need attribution on the bundle itself (PROV's "bundle" idea).

## Why it matters here

RAG, evaluation, dataset construction, and feature pipelines all depend on trustworthy lineage. Provenance is how learners and operators separate source failure, [document parser](glossary://document-parser) failure, OCR failure, chunking failure, retrieval failure, and model failure. It is also how release packages and model cards stay honest: a score or a citation is only as good as the pinned parents behind it. Treat provenance as part of the evidence contract, not as optional metadata you will "add later."

## Related terms

- [Checksum](glossary://checksum)
- [Dataset record](glossary://dataset-record)
- [Document parser](glossary://document-parser)
- [Audit trail](glossary://audit-trail)
- [ACL](glossary://acl)
