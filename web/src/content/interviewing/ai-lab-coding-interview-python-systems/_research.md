# Verification Notes: AI Lab Coding Interview: Python Systems

1. Audited core serving and ML systems coding patterns: vLLM PagedAttention Copy-on-Write block allocation (`kwon2023`), Orca continuous iteration-level batching (`yu2022`), scaled dot-product / grouped-query attention (`vaswani2017`, `dao2022`), top-k and nucleus sampling (`fan2018`, `holtzman2020`), exponential backoff with jitter (`awsbackoff`), and Python 3.14 concurrency primitives (`python_free_threading2026`, `python2026asyncioTasks`, `python314Executors2026`, `pythonPickle2026`, `pythonContextlib2026`).
2. Verified all four embedded runnable Python examples via `validate-python-examples.py`:
   - `kv_cache_allocator.py`: verified thread-safe `PagedKVCacheAllocator` refcounting, Copy-on-Write fork splitting under a `threading.Barrier(2)` contention test, rollback cleanup on block exhaustion, and complete block reclamation (`(0, 12)`).
   - `batched_causal_attention.py`: verified batched NumPy grouped-query attention with causal offset `s_k - s_q`, key padding mask, and all-masked-row `NaN` protection.
   - `nucleus_sampling.py`: verified temperature scaling, `np.partition` top-k truncation, shifted exclusive prefix mask `(cum_probs - sorted_probs) >= top_p` on `[0.42, 0.28, 0.16, 0.08, 0.06]` (keeping `#1-#3` -> `[0.4884, 0.3256, 0.1860]`), and seeded sampling with zero tail leakage.
   - `continuous_batch_scheduler.py`: verified step-level decode-first token budgeting, jittered retry preemption with mock clock + seeded RNG, and `asyncio.Queue(maxsize=4)` streaming dispatch.
3. Rebuilt Vizmatic illustrations (`paged_kv_allocator.tsx`, `sampling_truncation.tsx`) and `social_banner.png` cleanly.
