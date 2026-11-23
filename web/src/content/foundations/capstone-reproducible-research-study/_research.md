# Research packet: reproducible ML study

Verified: 2026-07-30

## Scope

This capstone should teach a complete, public-safe research workflow through one small offline study. The running study compares sparse reward with potential-based reward shaping in a seven-state corridor. It uses tabular Q-learning, synthetic transitions, NumPy, fixed random tapes, and no user data, network service, paid API, or specialized hardware.

The intended claim is narrow: potential-based shaping may improve early learning speed in this simulator while preserving the final greedy policy. The artifact must not generalize that result to deep reinforcement learning, robotics, deployed agents, or human behavior.

## Paper triage and claim extraction

### Keshav, How to Read a Paper

Primary publication page and PDF:

- https://dl.acm.org/doi/10.1145/1273445.1273458
- https://cse.buffalo.edu/~stevko/courses/cse704/fall10/papers/p83-keshav.pdf

Keshav describes a three-pass method. First pass reads title, abstract, introduction, headings, conclusions, and references to classify a paper. Second pass studies figures, evidence, and major arguments without getting stuck on every proof. Third pass attempts to reconstruct the work and challenge its assumptions. The lesson can adapt those passes into a paper-triage card without claiming that every paper needs the same reading time.

### Ng, Harada, and Russell, policy invariance under reward transformations

Primary author page:

- https://wordpress.andrewng.org/index.php/publication/policy-invariance-under-reward-transformations-theory-and-application-to-reward-shaping/

The paper studies reward transformations in a Markov decision process. Its potential-based form is:

`F(s, a, s') = gamma * Phi(s') - Phi(s)`

Under the paper's assumptions, adding this transition reward preserves optimal policies. The lesson should say "under the theorem's assumptions," not "reward shaping is always safe." Non-potential bonuses can change which policy is optimal.

The corridor study uses `Phi(s) = -(goal - s) / goal`. Moving toward the goal increases potential. The environment reward remains one at the goal and zero elsewhere. Training receives environment reward plus shaping reward, while final evaluation uses only environment reward.

## Variance and uncertainty

### Henderson et al., Deep Reinforcement Learning That Matters

Primary proceedings page and PDF:

- https://ojs.aaai.org/index.php/AAAI/article/view/11694
- https://ojs.aaai.org/index.php/AAAI/article/download/11694/11553

The paper documents how nondeterminism, random seeds, environment variation, hyperparameters, and codebase differences can make reinforcement-learning results hard to interpret. It argues for significance metrics and tighter experimental reporting. The capstone should use paired seeds, report the whole seed-difference distribution, and keep exact hyperparameters in a manifest.

### Agarwal et al., Deep Reinforcement Learning at the Edge of the Statistical Precipice

Primary proceedings page and PDF:

- https://proceedings.neurips.cc/paper/2021/hash/f514cec81cb148559cf475e7426eed5e-Abstract.html
- https://proceedings.neurips.cc/paper/2021/file/f514cec81cb148559cf475e7426eed5e-Paper.pdf

The paper argues that finite-run reinforcement-learning comparisons shouldn't report only point estimates. It advocates interval estimates and more robust aggregate views. The capstone is smaller than the benchmark suites studied in that paper, so it should borrow the uncertainty habit without presenting one bootstrap interval as universal proof.

## Reproducibility and preregistration

### Pineau et al., Improving Reproducibility in Machine Learning Research

Primary JMLR page and PDF:

- https://www.jmlr.org/papers/v22/20-303.html
- https://www.jmlr.org/papers/volume22/20-303/20-303.pdf

The NeurIPS reproducibility program combined a code-submission policy, reproducibility challenge, and checklist. Relevant checklist fields include model description, hyperparameters, data splits, random seeds, compute environment, and enough instructions to reproduce results.

The repository already has reference key `reproducible_research_seeds` for the Machine Learning Reproducibility Checklist PDF:

- https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf

### Open Science Framework registration guidance

Official guidance:

- https://help.osf.io/article/330-welcome-to-registrations

OSF defines preregistration as posting a time-stamped, read-only study plan before data collection or analysis. Its guidance asks researchers to specify hypotheses, variables, statistical tests, decision criteria, exclusions, and anticipated deviations. The capstone can use a committed `study_plan.md` as a local teaching approximation and describe public OSF registration as optional. It must not claim that a Git commit is equivalent to an independent registry.

## Artifact expectations

### ACM artifact review and badging

Official policy:

- https://www.acm.org/publications/policies/artifact-review-and-badging-current
- https://prod-www.acm.bloomreach.cloud/publications/policies/artifact-review-and-badging-current

ACM currently distinguishes repeatability, reproducibility, and replicability. Its Artifacts Evaluated Functional criteria include documented, consistent, complete, exercisable artifacts with verification and validation evidence. The capstone should teach those properties as a review checklist, not promise an ACM badge.

### FAIR principles

Original open-access paper:

- https://www.nature.com/articles/sdata201618
- https://doi.org/10.1038/sdata.2016.18

Wilkinson et al. define FAIR as Findable, Accessible, Interoperable, and Reusable. A small code artifact can support those goals through persistent identifiers, machine-readable manifests, open formats, clear licensing, and provenance. FAIR doesn't mean unrestricted access: metadata can remain findable while sensitive data stays controlled. This study avoids that issue by generating all data locally.

### CITATION.cff

Official GitHub and Citation File Format documentation:

- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files
- https://citation-file-format.github.io/

A root `CITATION.cff` provides human-readable and machine-readable software citation metadata. GitHub renders it in the repository's Cite panel. The capstone tree should include it alongside a license and release version.

## Locked study design

### Research question

Does potential-based reward shaping increase early goal-reaching frequency for tabular Q-learning in a stochastic seven-state corridor, compared with sparse terminal reward, without changing final greedy-policy success under the original environment reward?

### Confirmatory hypothesis

Across paired seeds 0 through 23, the candidate must satisfy both conditions:

1. Mean paired difference in first-30-episode success rate is at least `+0.10`, and the 90% paired bootstrap interval has a lower bound above zero.
2. Absolute mean paired difference in final greedy-policy success is at most `0.02` when both arms are evaluated on original environment reward.

Condition one tests learning speed. Condition two is a guardrail against a changed end task. Failure of either condition rejects the release claim.

### Expected result and rejection

Expected result: shaping improves early success while both arms converge to the same greedy policy. The expected sign comes from the distance potential providing denser feedback, while policy-invariance theory motivates the final-performance guardrail.

Reject the claim when early improvement is below `0.10`, its 90% interval includes zero, or final original-reward success differs by more than `0.02`. A rejected result still ships with full tables, plots, environment details, and a short diagnosis.

### Baseline and candidate

- Baseline: tabular Q-learning with sparse terminal reward.
- Candidate: identical Q-learning with `gamma * Phi(s') - Phi(s)` added during training.
- Environment: states 0 through 6, start at 0, goal at 6, left/right actions, 15% action reversal, 12-step episode cap.
- Shared hyperparameters: `gamma=0.95`, `alpha=0.35`, `epsilon=0.20`, 80 training episodes.
- Evaluation: 200 greedy episodes per seed with fixed slip tapes and original environment reward.

### Randomness and sample plan

- Pilot seeds: 900, 901, 902 for debugging. They never enter the report.
- Confirmatory seeds: integers 0 through 23, locked before the run.
- Paired training tape: exploration draw, random action, tie-break draw, and slip draw are pre-generated for every episode and step.
- Paired evaluation tape: both arms receive the same evaluation slips for a seed.
- Bootstrap: 10,000 paired resamples of the 24 seed differences, seeded with 20260731.
- No optional stopping: all 24 seed pairs run even if an interim mean looks decisive.

Twenty-four seeds are a bounded capstone budget, not a universal power recommendation. The report must show five negative per-seed differences in the expected fixture rather than hiding them behind the positive mean.

### Ablations and controls

- Zero-potential control: `Phi(s)=0` must reproduce sparse-reward training exactly under the same tape.
- Shaping-off control: environment, optimizer, steps, and evaluation stay identical; only training reward changes.
- Original-reward evaluation: evaluating on shaped return is a measurement error, not a favorable ablation.
- Unpaired-analysis ablation: shuffle candidate seed labels and show why the primary estimator must remain paired.
- Potential-sign stress test: reverse the distance potential as exploratory work and label it after the confirmatory analysis.

## Expected fixture output

The deterministic NumPy fixture currently produces:

- Sparse first-30 success mean: 0.439
- Shaped first-30 success mean: 0.582
- Mean paired difference: +0.143
- 90% paired bootstrap interval: [+0.061, +0.225]
- Improved/tied/regressed seeds: 19/0/5
- Sparse final success: 0.911
- Shaped final success: 0.911
- Mean final difference: +0.000

These numbers are fixture evidence, not a general reward-shaping benchmark.

## Public-safety boundaries

The study has no people, private logs, production services, external agents, or live decision authority. It generates all transitions from a small simulator. Repository examples must contain no tokens, credentials, account identifiers, unpublished datasets, or copied proprietary environments.

The report should state limits plainly: one corridor, one tabular algorithm, one potential function, one hyperparameter setting, and a small seed budget. It may support a claim about this artifact. It can't support claims about deep reinforcement learning or deployed agents.

## Lesson citation keys

Pre-existing:

- `reproducible_research_seeds`
- `sutton2018`

Additions required by this lesson:

- `keshav2007`
- `ng1999`
- `henderson2018`
- `agarwal2021rl`
- `acm2020artifacts`
- `wilkinson2016`
- `githubCitationFiles`
- `osf2026preregistration`
