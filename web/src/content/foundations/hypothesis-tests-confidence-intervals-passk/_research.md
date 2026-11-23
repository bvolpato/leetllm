---
query: "We are creating a research-backed page for the following: \"Hypothesis Tests, Intervals, and pass@k\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: foundations\nCurrent page scope: Compare a code-generation model with paired evidence, uncertainty for lift, and pass@k under a fixed sampling budget.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "76254d9113fb6b6c21d26de9b2591105"
status: "completed"
---

Here is a proposed structure and content guide for the "Hypothesis Tests, Intervals, and pass@k" module of the LeetLLM foundations curriculum.

This structure bridges the theoretical statistics of the pass@k metric with the practical engineering constraints of running inference optimizations under strict compute budgets.

## Prerequisites & Context

Before beginning this module, students should understand basic probability, LLM text generation mechanics, and standard code-generation benchmarks like HumanEval and MBPP.

**Narrative hook:** Moving from "Did the model get it right?" (point-estimate accuracy) to "How likely is the model to succeed given a fixed compute budget?" Students need to see evaluation not as a static grade, but as a statistical sampling problem constrained by hardware limitations.

## 1. Core Mechanisms: The Math of pass@k

This section defines the metric, explains why the intuitive math is wrong, and introduces the industry-standard unbiased estimator.

- **The Conceptual Goal:** pass@k measures the probability that at least one out of k independent generation attempts contains a correct solution. It explicitly models the reality that code generation relies on exploration and search, not just zero-shot recall.
- **The Naive Estimator (Biased):** Intuitively, if the empirical success rate is p^​=nc​ (where c is correct attempts out of n total samples), the chance of all k samples failing is (1−p^​)k. Thus, the naive pass@k is 1−(1−p^​)k. However, this is biased because it assumes sampling *with* replacement, whereas practical evaluation draws from a finite pool of generated samples *without* replacement. [https://leehanchung.github.io/blogs/2025/09/08/pass-at-k/](https://leehanchung.github.io/blogs/2025/09/08/pass-at-k/)
- **The Unbiased Estimator (U-Statistic):** The standard established by OpenAI evaluates pass@k using a minimum-variance unbiased U-statistic that accounts for finite sampling:

pass@k=1−(kn​)(kn−c​)​

This calculates the exact probability of drawing k consecutive failures from our finite pool of n generated candidates. [https://leehanchung.github.io/blogs/2025/09/08/pass-at-k/](https://leehanchung.github.io/blogs/2025/09/08/pass-at-k/)

## 2. Measuring Uncertainty: Confidence Intervals & Lift

Point estimates are insufficient for model comparison. This section teaches how to prove that "Model A is better than Model B" statistically.

- **Variance in Estimates:** pass@k can be highly unstable when the sample size n is small, particularly as k scales up. [https://www.emergentmind.com/topics/pass-k-objective](https://www.emergentmind.com/topics/pass-k-objective)
- **Bootstrap Confidence Intervals:** Because pass@k is a non-linear U-statistic rather than a simple binomial proportion, students must learn to use bootstrap resampling over the tasks to establish 95% confidence intervals.
- **Paired Testing for Lift:** When comparing a baseline to a new iteration, independent intervals are too conservative. Students should calculate the *paired difference* (lift) per task, then bootstrap the mean difference to determine if the improvement is statistically significant and avoids regressions.

## 3. Systems Tradeoffs: Fixed Sampling Budgets

Theory meets hardware here. Generating n=100 samples per task to calculate pass@100 is easy on a massive API budget, but challenging when maximizing throughput via vLLM on a local RTX 5070 or a Mac Mini cluster.

- **The Exploration-Exploitation Tradeoff:** Optimizing purely for pass@1 forces the model to concentrate probability mass on safe, high-confidence outputs, which can actually hurt pass@k at higher k values where diversity is required. [https://www.emergentmind.com/topics/pass-k-objective](https://www.emergentmind.com/topics/pass-k-objective)
- **Inference-Scaling Strategies:** When the inference budget N is capped, how do we select the best k responses?

- **Majority Voting:** Selects the most frequent outputs. Fails to scale monotonically with k.
- **Best-of-N (BoN):** Picks the top k candidates using a reward model. Susceptible to reward hacking.
- **Best-of-Majority (BoM):** A minimax-optimal strategy that restricts candidates to high-frequency responses before selecting the top k via reward. Proven to scale optimally at k![Image](<data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"%3E<path d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"%3E</path%3E</svg%3E>)​1​. [https://openreview.net/forum?id=a6CVQpjbXq](https://openreview.net/forum?id=a6CVQpjbXq) [https://www.emergentmind.com/topics/pass-k-metric-b5b58688-14e3-4ed9-b1f7-504db4b60803](https://www.emergentmind.com/topics/pass-k-metric-b5b58688-14e3-4ed9-b1f7-504db4b60803)

## 4. Common Pitfalls & Misconceptions

Highlight standard mistakes engineers make when building evaluation pipelines.

| Failure Mode | Reality |
| --- | --- |
| Deduplicating samples | Deduplication is for calculating coverage@k (diversity of solutions). For pass@k , duplicate correct answers still count toward the success pool c . https://medium.com/@ggfincke/how-pass-k-is-used-to-evaluate-llm-coding-performance-296e5c4565bc |
| Temperature myths | Raising temperature does not automatically degrade solve rates; it often flattens the pass@k curve at high k while significantly increasing the diversity of correct solutions ( coverage@k ). https://medium.com/@ggfincke/how-pass-k-is-used-to-evaluate-llm-coding-performance-296e5c4565bc |
| Ignoring debugging | pass@k is a strict zero-shot / single-pass metric. It inherently fails to capture an LLM's ability to iteratively debug and refine code across multiple conversational turns. https://pmc.ncbi.nlm.nih.gov/articles/PMC12715212/ |

## Proposed Lab Exercise

**"The VRAM-Constrained Evaluator"**
Provide students with a pre-generated dataset of N=200 problem completions from an open-weight model (e.g., a quantized Qwen or Llama).

1. Ask them to write a Python script implementing the unbiased U-statistic to calculate pass@1, pass@5, and pass@10.
2. Have them calculate a 95% bootstrap confidence interval for pass@10.
3. **Constraint task:** Give them a strict "compute budget" (e.g., they can only afford to evaluate N=15 generations per task) and ask them to compare BoN and BoM selection strategies for maximizing pass@5.
