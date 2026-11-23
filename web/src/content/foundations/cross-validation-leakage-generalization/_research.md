---
query: "Research context for Validation and Leakage: prompt-safety triage across decision time, grouped user splits, preprocessing isolation, temporal rollouts, and LLM benchmark contamination."
model: "Pro"
task_id: "66be483097e90c636a6f3f7c8d0d959f"
status: "completed"
---

Research context for "Validation and Leakage" in the LeetLLM foundations curriculum.

## Curriculum Article: Validation and Leakage

### 1. Prerequisites and Teaching Order

- **Prerequisites:** Basic supervised learning (train/test splits), cross-validation, and standard LLM evaluation metrics (MMLU, HumanEval).
- **Teaching Order:**
  1. **The Decision Moment:** Define inference-time visibility in predictive modeling.
  2. **Tabular and Feature Leakage:** Target leakage and preprocessing contamination.
  3. **Grouping and Temporal Splitting:** Handling users, episodes, and chronology cleanly.
  4. **LLM Data Contamination:** When pretraining corpora absorb evaluation benchmarks.
- **Mastery Outcomes:** Readers can audit features at prediction time, wrap preprocessing in a scikit-learn `Pipeline`, partition data cleanly by user and timestamp, and implement n-gram overlap screens for benchmark contamination.

### 2. The Decision Moment and Target Leakage

Models may only observe information readable by the serving runtime at the exact prediction timestamp.

- **Core Concept:** Target leakage happens when a feature unavailable at inference time enters training inputs.
- **Worked Example:** Predicting prompt escalation or user churn at inference time.
  - *Leakage Feature:* Post-routing human edit latency or downstream audit override logged after the model runs.
  - *Valid Feature:* Account history counters and prompt ambiguity computed strictly prior to inference.
- **Implementation Rule:** Audit every column and aggregation window against its system observation time rather than event generation time alone.

### 3. Preprocessing Leakage

Fitting scalers, imputers, or selectors across the full dataset before splitting leaks held-out statistics into training.

- **Mechanism:** Computing global statistics or class separations over validation rows inflates held-out accuracy unfairly.
- **Implementation Detail:** Split first, fit parameters strictly inside each training fold, and transform validation and test folds with those frozen estimators.
- **Reference:** [Scikit-learn: Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html)

### 4. Splitting Prompt Episodes by Time and User

Random row splitting fails when records cluster by user, document, or chronological regime shift.

- **User/Group Leakage:** When multiple samples from the same entity appear across both splits, memorization mimics generalization. Use `GroupKFold` for new-entity claims.
- **Temporal Leakage:** Evaluating earlier windows with models fit on future traffic breaks chronology. Use expanding-window `TimeSeriesSplit` and check label availability at each fit cutoff.

### 5. Auditing LLM Evaluation Contamination

At foundation scale, pretraining web scrapes can absorb public benchmarks such as GSM8K, MMLU, or HumanEval.

- **Detection Mechanisms:** Exact n-gram overlap screens (8-grams to 32-grams), MinHash near-duplicate search, embedding similarity, and held-out loss checks paired with dataset origin tracking.
- **References:**
  - [Llama 3 Technical Report (arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) - Details decontamination pipelines and 8-gram overlap scoring.
  - [GPT-4 Technical Report (arXiv:2303.08774)](https://arxiv.org/abs/2303.08774) - Discusses measuring contamination on public benchmarks.
  - [LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) - Open-source LLM evaluation harness with reproducible task configuration.
