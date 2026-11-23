---
title: Checkpoint manifest
aliases: ["model checkpoint manifest", "checkpoint inventory"]
importance: 78
kind: term
---
A **checkpoint manifest** is a machine-readable inventory describing checkpoint as one complete artifact. It names expected shards and related state, usually with byte sizes, hashes, completion status, model graph or configuration identity, training step, and format version.

Validate required files, hashes, and a completion manifest before allocating the model. Distributed ranks may finish at different times, uploads can fail after some shards arrive, and the latest-path pointer can move before every object is durable. Publish the manifest or completion marker only after all required pieces pass validation.

Required pieces depend on the restore target: inference may need only weights and model/tokenizer configuration, while resuming training also needs the appropriate optimizer and execution state. Shard layouts vary by format: replicated state can be saved once, and distributed checkpoints can restore with different sharding. [PyTorch distributed checkpoint documentation](https://docs.pytorch.org/docs/stable/distributed.checkpoint.html)

## Minimum fields

- checkpoint and parent identity;
- global step, policy version, and format version;
- expected file names, sizes, and cryptographic hashes;
- architecture, tokenizer, precision, and parallelism metadata needed for restore;
- optimizer, scheduler, RNG, and data-cursor presence for resumable training;
- completion state and writer revision.

## Example

Distributed save expects weight shards from every rank plus optimizer and scheduler state. Manifest lists every file and hash, declares training step and parent checkpoint, then gains `complete=true` only after all objects verify. Restore refuses directory when one rank shard is absent even if latest-checkpoint pointer already references it.

Publish the latest pointer only after the complete manifest is durable, using an atomic or conditional update appropriate to storage. Hashes establish agreement with the manifest; they do not prove who produced the checkpoint unless the manifest itself comes from a trusted or authenticated source.

## Why it matters here

Trainer, converter, evaluator, and rollout fleet must agree on exact policy artifact. A path string or “save finished” log can't prove every rank loaded same bytes.

## Related terms

- [Model checkpoint](glossary://model-checkpoint)
- [Checksum](glossary://checksum)
- [SafeTensors](glossary://safetensors)
- [Provenance](glossary://provenance)
