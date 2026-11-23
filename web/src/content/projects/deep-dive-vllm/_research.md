# Research notes: vLLM's memory idea versus its current V1 engine

## Question for a source reader

Which vLLM properties come from the original PagedAttention paper, and which require inspecting the current V1 scheduler, process architecture, block pool, security boundary, and release-specific backend?

## Claims mapped to first-party evidence

- Kwon and collaborators introduce logical-to-physical KV blocks, shared blocks, memory-management motivation, and the paper's historical serving comparison: https://arxiv.org/abs/2309.06180
- The vLLM architecture guide defines current engine-core, worker, API-server, and data-parallel process responsibilities: https://docs.vllm.ai/en/stable/design/arch_overview/
- The V1 guide documents engine-generation changes and compatibility boundaries: https://docs.vllm.ai/en/stable/usage/v1_guide/
- The optimization guide explains chunked prefill, token budgets, scheduler pressure, and tuning tradeoffs: https://docs.vllm.ai/en/latest/configuration/optimization.html
- Prefix-cache design documents the hash/key contract and cache-reuse limitations: https://docs.vllm.ai/en/stable/design/prefix_caching/
- Online-serving and security docs bound what API compatibility does and doesn't guarantee: https://docs.vllm.ai/en/stable/serving/online_serving/ and https://docs.vllm.ai/en/stable/usage/security/
- Project governance and the article's v0.28.0 Apache-2.0 license support contributor authority and source-license claims: https://github.com/vllm-project/vllm/blob/main/docs/governance/process.md and https://github.com/vllm-project/vllm/blob/v0.28.0/LICENSE

## Preserve the article's concrete invariants

For block size four, requests `R0` and `R1` share physical block `12` for full prefix `A B C D`; their suffixes occupy different blocks, and a partial block isn't automatically reusable. Decode-first scheduling with budget six admits one `R0` token plus five `R1` prefill tokens, then one plus four, then one token from each request.

The illustrated V1 process counts assume the documented default API-server deployment. `TP=4, DP=1` on four GPUs gives one API server, one engine core, and four workers, or six processes. `TP=2, DP=4` on eight GPUs gives four API servers, four cores, eight workers, and one coordinator, or seventeen. Deployment flags and revisions can change those assumptions.

## What the evidence cannot establish

The PagedAttention paper's 2023 throughput comparisons describe its original traces, hardware, baselines, and software, not current service-level guarantees. Paged KV organization doesn't identify the exact active GPU kernel. Prefix reuse requires matching token IDs and compatible cache identity; it isn't an authorization policy. Reverify API defaults, process topology, kernel backends, supported models, and metrics against the installed release before making a present-tense claim.

## September 23, 2026 manual check

- Latest release is v0.30.0, published September 22: https://github.com/vllm-project/vllm/releases/tag/v0.30.0. Read highlights and breaking changes. Scale-out routes now require `--enable-scale-out` on ordinary serving; keep the v0.28.0 trace reproducible rather than silently assigning its defaults and paths to the latest release.
- Read the complete v0.30.0 API-server shim through GitHub's content API: https://github.com/vllm-project/vllm/blob/v0.30.0/vllm/entrypoints/openai/api_server.py. It warns that the module and command are deprecated. The v0.28.0 implementation's main block still starts the server. Current serving docs show `vllm serve`; the shim's warning contains `vllm server`, which is not copied as a startup recipe.
- Read v0.28.0's full-attention lookup selection (`prompt_length - 1` and block alignment), GPU-worker runner-construction selection, and complete license through primary GitHub content. Sources: https://github.com/vllm-project/vllm/blob/v0.28.0/vllm/v1/core/kv_cache_manager.py and https://github.com/vllm-project/vllm/blob/v0.28.0/vllm/v1/worker/gpu_worker.py. CPU fixtures model these mechanisms; they do not execute vLLM.
- Read current architecture process-count/many-to-many selections, V1 deprecation/hardware/model selections, optimization preemption/chunked-prefill selections, prefix hashes/pool/allocation/free/eviction selections, metrics population selections, security network/route/media selections, serving route/scale-out selections, and governance selections. The V1 guide's Mamba-prefix exclusion conflicts with v0.28.0 release defaults and later model-specific behavior. The new exercise teaches revision-specific verification, not universal hybrid support.
- The metrics histogram samples output events, not a per-request p99 pass predicate: https://docs.vllm.ai/en/stable/design/metrics/. Applying that population distinction to the lesson's SLO is a pedagogical inference; request timelines are still required.
- Reread PagedAttention abstract and evaluation setup/baseline/latency/trace/shared-prefix selections: https://arxiv.org/html/2309.06180. Added the omitted LLaMA-13B/WMT16 shared-prefix workload, distinct from OPT basic-sampling fixtures. Reused prior manual serving review's DistServe TPOT distinction.
- Reproduced the original arithmetic helper returning `4.0` for 6.5 shared tokens and accepting `True` as block size one. Exact integer checks and assertions reject those chosen inputs. All four marked examples match local outputs on Python 3.12.

Only the listed source selections were read, except the complete shim and license. No installed vLLM/model/GPU test, network-hardening test, benchmark rerun, or deployment is claimed.
