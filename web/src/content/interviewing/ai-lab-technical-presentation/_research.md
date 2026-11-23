# Verification Notes: AI Lab Technical Presentation

1. Reworked the walkthrough around an authentic Two-Stage Hybrid BM25 + Cross-Encoder Reranker migration (`148/200 -> 162/200` `hit@5`, `+7 pp`, `22` improved vs `8` regressed, exact two-sided McNemar `p = 0.0161` via `scipy.stats.binomtest`) replacing connector-adapter boilerplate and `type(...) is not` checks.
2. Verified all cited sources (`openai2026interview`, `deepmind2026interviewing`, `neurips2026paperChecklist`, `sreMonitoringDistributedSystems`, `google2026mlops`) match claims cleanly and preserved `/learn/deep-dive-vllm` Next target.
3. Removed plain bullet-slide `talk_time_budget.tsx` (replaced with structured Markdown 15-minute pacing table) and oversized vertical `connector_request_path.tsx` (replaced with Vizmatic `rag_rerank_path.tsx`); refactored `paired_retrieval_evidence.tsx` onto pure Vizmatic `Matrix` + `BarChart` (`660x760`) and rebuilt `social_banner.png`.
