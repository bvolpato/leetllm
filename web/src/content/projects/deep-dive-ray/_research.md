# Research notes: Ray tasks, actors, object ownership, and orchestration limits

## Follow one distributed object before naming a platform

Can three deterministic document-feature tasks and one stateful counting actor explain which part of Ray owns scheduling, object placement, cluster metadata, retries, actor state, and an LLM engine hosted under Serve? These features aren't learned embeddings.

## Foundational research and project-maintained evidence

- The OSDI 2018 Ray paper introduces the unified task-plus-actor execution model for dynamic distributed workloads: https://www.usenix.org/conference/osdi18/presentation/moritz
- The NSDI 2021 ownership paper explains scalable object ownership, reference counting, and decentralized distributed execution: https://www.usenix.org/conference/nsdi21/presentation/cheng
- Ray Core's walkthrough defines current remote tasks, actors, object references, and scheduling APIs: https://docs.ray.io/en/latest/ray-core/walkthrough.html
- Object fault-tolerance documentation distinguishes reconstructable task outputs from objects without replayable lineage: https://docs.ray.io/en/latest/ray-core/fault_tolerance/objects.html
- Ray Serve LLM architecture specifies orchestration boundaries around a separately owned inference engine: https://docs.ray.io/en/latest/serve/llm/architecture/overview.html
- The current repository and governance pages establish package ownership, maintainer roles, and foundation stewardship: https://github.com/ray-project/ray and https://docs.ray.io/en/latest/ray-governance/index.html
- The PyTorch Foundation project listing and Anyscale's company description distinguish foundation-governed Ray from a separately operated commercial platform: https://pytorch.org/projects/ray/ and https://www.anyscale.com/about

## Tiny job, distinct state lifetimes

Three `features` task references represent immutable remote values. Passing those handles as top-level arguments into `BatchLedger.record` preserves a distributed dependency. Eagerly calling `ray.get` in the driver adds a synchronization point and materializes values there: ordinary Python objects require deserialization, while eligible NumPy arrays use zero-copy shared-memory views. A list containing ObjectRefs remains a list of handles rather than being recursively resolved.

The actor's `completed=3` is mutable process-heap state. Restarting a constructor doesn't automatically recover that count without an application checkpoint. A lineage-backed task result can be regenerated when its computation and dependencies remain replayable, the owner survives, and retries remain. Replayable tasks must be deterministic and idempotent; these are separate requirements. A `ray.put` object has no generating task to replay. Actor-method outputs aren't reconstructable by default.

## Boundaries that keep comparisons honest

Raylets schedule work against logical resource declarations; requested CPUs and GPUs aren't by themselves OS-level memory, thread, or security isolation. The GCS stores cluster/control metadata rather than executing every actor method. Ray Train can launch a DeepSpeed or PyTorch job but doesn't replace its optimizer or collective semantics. Ray Serve can coordinate vLLM/SGLang replicas but doesn't become their token scheduler, KV allocator, attention kernel, or model license.

Governance, ownership transitions, library internals, and exact fault-recovery defaults can change. Keep the original papers as historical evidence and consult the deployed Ray version for present-tense operational behavior.
