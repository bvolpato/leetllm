# Research Notes: RAG vs Fine-Tuning vs Prompting

## Verified Literature and References
- `brown2020`: Brown et al. (2020), *Language Models are Few-Shot Learners* (NeurIPS): establishes in-context task demonstrations without gradient updates at inference time.
- `openai_structured_outputs`: OpenAI Structured Outputs documentation: confirms JSON Schema decoding constrains syntactic structure (`fields`, `enums`) while semantic value correctness still requires independent evaluation.
- `lewis2020`: Lewis et al. (2020), *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (NeurIPS): demonstrates external non-parametric document retrieval combined with parametric language generation.
- `huggingface2026sfttrainer`: Hugging Face TRL `SFTTrainer` documentation: covers supervised fine-tuning objective, completion masking, and dataset formatting.
- `hu2021`: Hu et al. (2021), *LoRA: Low-Rank Adaptation of Large Language Models* (ICLR 2022): defines frozen base weights with low-rank trainable updates $\Delta W = B A$, keeping trainable parameters well below full fine-tuning.
- `ovadia2024`: Ovadia et al. (2024), *Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs*: compares unsupervised fine-tuning against RAG for factual knowledge injection and shows RAG outperforms unsupervised weight updates on new factual material.

## Editorial and Technical Revisions (2026-11-15)
- Replaced the deployment release-hour roleplay (`Atlas`, `Friday 17:00`, `release-policy@v11/v12`) with a domain-native inference runtime upgrade scenario (`v2.4` vs `v2.5` `--kv-cache-dtype fp16` vs `fp8` parity) demonstrating retrieval freshness, version filtering, abstention formatting, and SFT vs RAG selection cleanly.
- Replaced abstract set notation in the ablation walkthrough with an executable NumPy script (`ablation_and_lora_budget.py`) computing exact LoRA `r=16` parameter counts (`16,777,216`, `0.21%` of `8.03B` base, `32.0 MiB` BF16) alongside a 2x2 factorial comparison (`Base+RAG=70%`, `Base+Oracle=95%`, `Tuned+RAG=71%`, `Tuned+Oracle=98%`) and per-query regression tracking (`10 fixed / 9 regressed`).
- Upgraded illustrations (`three_approaches.tsx`, `rag_index_query.tsx`) to `withDensity(baseC, 2.0)` Vizmatic `GraphDiagram` layouts (`<= 700px` wide, `ratio <= 1.1`) and refreshed `social_banner.{tsx,txt,png}` and the Mermaid oracle-ablation flowchart to remove stale domain terms and match readability bounds.
