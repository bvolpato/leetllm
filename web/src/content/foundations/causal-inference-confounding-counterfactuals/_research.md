# Research brief: why a stronger policy can lose an unadjusted comparison

## Question the evidence must answer

Did a retrieval-augmented generation (RAG) model improve query pass rates, or did the production router send it a harder share of long-context queries than the Base model received?

## Primary causal framework

- Judea Pearl, Madelyn Glymour, and Nicholas Jewell's *Causal Inference in Statistics: A Primer* lays out the graphical foundation for causal diagrams, interventions, confounding, adjustment, and counterfactual reasoning: https://bayes.cs.ucla.edu/PRIMER/
- Judea Pearl's UCLA research portal collects primary causal-inference papers and clarifies how causal graphs connect identification to interventional queries: https://bayes.cs.ucla.edu/jp_home.html
- Miguel Hernán and James Robins' freely available *Causal Inference: What If* develops potential outcomes, exchangeability, positivity, standardization, and causal-effect identification: https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/

## Reproduce the reversal before introducing notation

- Short-context queries (`<= 2k` tokens): RAG `9 / 10 = 90%`, Base `72 / 90 = 80%`, within-stratum difference `+10` percentage points.
- Long-context queries (`> 2k` tokens): RAG `45 / 90 = 50%`, Base `4 / 10 = 40%`, within-stratum difference `+10` percentage points.
- Unadjusted totals: RAG `(9 + 45) / 100 = 54%`, Base `(72 + 4) / 100 = 76%`, raw aggregate difference `-22` percentage points.
- Standardizing both policies to a `70%` short-context and `30%` long-context target mix yields `0.7 * (0.90 - 0.80) + 0.3 * (0.50 - 0.40) = 0.10`, or `+10` percentage points (`78%` versus `68%`).

The reversal comes from assignment imbalance: `90%` of logged RAG queries are long-context, whereas `90%` of logged Base queries are short-context. This hypothetical query log isolates the mechanics of confounding before adding sampling variance or multi-feature adjustment.

## Identification is stronger than adjustment arithmetic

`Y(1)` and `Y(0)` denote potential outcomes under RAG and Base routing, yet at most one outcome is realized for a single query. Estimating an average treatment effect requires an explicit target distribution, a single well-defined version of each routing arm, a clear evaluation horizon, and structural identification assumptions.

- Context length is an admissible adjustment variable only when recorded before routing and when it blocks every common cause of routing and pass outcome.
- Unmeasured query complexity, differing evaluator criteria, dropped traces, or cross-request cache contention can leave residual bias after stratifying on context tier.
- Post-routing artifacts such as reasoning trace length or citation count occur after `A` is chosen and can act as mediators or colliders; conditioning on them alters or biases the total causal effect.
- If every long-context query were sent to RAG with probability `1.0`, positivity fails in that stratum and the Base counterfactual rate cannot be recovered from logs without external structural assumptions.
- Randomization balances pre-treatment covariates in expectation, yet does not repair post-assignment attrition, interference across shared batch slots, or a mismatched target population.

## Terms worth cross-linking at first use

Causal inference, counterfactual, potential outcome, confounder, causal graph, backdoor adjustment, average treatment effect, propensity score, positivity, and randomized experiment should link to their glossary entries where first introduced.
