---
title: pass@k
aliases: ["pass-at-k"]
importance: 84
---
**pass@k** is the probability that *at least one* of $k$ independent samples solves a task under an automatic checker (usually unit tests or a sandbox suite). It is the standard functional metric for code-synthesis benchmarks such as HumanEval (Chen et al., 2021), and for any setting where you can sample many candidates and grade them with a verifier.

It measures how often the model produces a passing artifact within a budget of $k$ tries. A product that shows one completion should report pass@1, or best-of-$k$ when an automatic selector chooses the winner.

## Intuition

Code models are stochastic. On a hard problem they may emit a correct program only occasionally. pass@k credits that rare hit as long as it appears within the attempt budget. Raising $k$ almost always raises the score, because more draws give more chances to hit a correct region of the output distribution.

That is useful for research (how much headroom does sampling buy?) and for systems that truly generate multiple candidates and verify them. It is misleading if you report pass@100 while users only ever see the first sample, or if a human cherry-picks the best of $k$ without counting that labor in the metric.

Related idea: Tau-Bench’s **pass^k** asks the opposite reliability question (all $k$ independent reruns succeed). More attempts help pass@k; more required clean reruns make pass^k stricter.

## Formula

For one problem, generate $n \ge k$ samples and let $c$ of them pass the checker. The unbiased estimator used in HumanEval / Codex (Chen et al., 2021) is the hypergeometric “at least one correct in a draw of $k$ without replacement” probability:

$$
\mathrm{pass@}k \;=\; 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}
$$

when $n-c \ge k$. If $n-c < k$ (fewer failures than $k$), every $k$-subset contains a success and the estimate is $1$. Dataset-level pass@k is the mean of this quantity over problems.

The plug-in $1-(1-\hat p)^k$ with $\hat p = c/n$ is **biased low** for finite $n$ (Appendix A of the Codex paper). The combinatorial form is an unbiased U-statistic for the true pass@k under i.i.d. sampling.

Direct binomials overflow for large $n$. The paper’s numerically stable product is equivalent:

```python
import numpy as np

def pass_at_k(n: int, c: int, k: int) -> float:
    """Unbiased pass@k for one problem (Chen et al., 2021)."""
    if not (0 <= c <= n and 1 <= k <= n):
        raise ValueError("require 0 <= c <= n and 1 <= k <= n")
    if n - c < k:
        return 1.0
    return float(1.0 - np.prod(1.0 - k / np.arange(n - c + 1, n + 1)))
```

You need $n \ge k$. OpenAI's `human-eval` harness refuses to estimate pass@k when fewer than $k$ samples exist for a problem.

The unbiased claim assumes samples are independent draws from the same fixed policy for that problem. Adaptive retries that use previous test failures, shared random state, or correlated candidate generation need a separate evaluation of the search procedure. Passing the checker means passing those tests, not proving correctness on every possible input.

## Worked numbers

Suppose $n = 20$ samples, $c = 2$ correct:

| $k$ | Unbiased pass@k | Naive $1-(1-c/n)^k$ |
| ---: | ---: | ---: |
| 1 | $0.100$ | $0.100$ |
| 5 | $0.447$ | $0.410$ |
| 10 | $0.763$ | $0.651$ |

Same success rate ($c/n = 0.1$), very different claims at large $k$. The naive estimates are lower, with substantial gaps at the larger $k$ values shown. The gap need not grow across all possible $k$. Averaging over a full suite, report mean pass@k with the same $k$, $n$, and decoding policy on every problem.


## Example

HumanEval-style coding: the model sees a function signature and docstring, not the full [hidden tests](glossary://hidden-tests). You sample $n = 200$ completions at a fixed temperature, execute each in a sandbox, and count how many pass. For $k = 100$, a problem with $c = 5$ passers contributes about $0.97$ to the mean (almost every $100$-subset still includes at least one correct sample). Table-reported Codex-12B HumanEval figures are $28.8\%$ pass@1 and $72.3\%$ pass@100 (the paper abstract also quotes $\sim 70.2\%$ at 100 samples in places); temperatures optimized per $k$ (about $0.2$ for pass@1, $0.8$ for pass@100) follow the paper's size-sweep practice, including the hull illustrated on a 679M model. The classic lesson remains: multi-sample search can look far stronger than single-shot UX.

In a product that returns one answer, the honest headline is pass@1 (greedy or temperature-matched to production). Report pass@5 or pass@100 as a secondary “search capacity” number only if the deployed system actually generates multiple candidates and a verifier or ranker selects among them.

## Sampling budget is the claim

pass@k folds the attempt budget into the score. Success once in five samples measures any-of-five capability; success on the first answer measures one-shot reliability. Both numbers can be valid because they answer different questions.

Also part of the claim:

- **Decoding:** temperature, top-$p$, top-$k$, nucleus settings. Optimal temperature for pass@1 is often lower than for pass@100 (Codex paper: roughly $0.2$ vs $0.8$ on HumanEval).
- **Sample count $n$:** larger $n$ reduces variance of the unbiased estimator; $n$ must be at least $k$.
- **Checker:** public sample tests vs private suites; thin suites inflate scores (EvalPlus-style expansions cut reported pass rates sharply).
- **Selection policy:** random among $k$, best-of-$k$ by mean log-prob, test-filter then rank, or human pick. Users see best-of-$k$ reliability when the product includes an automatic selector; a human pick describes a different workflow.

## Why it matters here

pass@k changes what “solved” means. Curriculum and production reports should always publish $k$, $n$, decoding policy, checker identity, and how a winner is chosen. Use pass@1 (or production-matched sampling) to report single-response quality, and pass@k to report search capacity when a system evaluates multiple candidates. Present both when users receive the best of several verified candidates.

## Related terms

- [Hidden tests](glossary://hidden-tests)
- [Offline evaluation](glossary://offline-evaluation)
- [Temperature](glossary://temperature)
- [Unit test](glossary://unit-test)
- [Eval harness](glossary://eval-harness)
