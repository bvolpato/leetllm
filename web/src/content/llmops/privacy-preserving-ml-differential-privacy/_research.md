# Research brief: user-level privacy is a protected-unit claim

## Threat model and central question

What can a released support model reveal about one person's participation, and why don't name redaction, a passing membership audit, or clipping an already averaged gradient establish differential privacy?

## Original mechanisms, accounting, and modern user-level evidence

- Cynthia Dwork and collaborators' original differential-privacy work formalizes neighboring databases and calibrated sensitivity-based randomization: https://people.csail.mit.edu/asmith/PS/sensitivity-tcc-final.pdf
- Dwork and Roth's *The Algorithmic Foundations of Differential Privacy* develops formal `(epsilon, delta)` guarantees, composition, sensitivity, and mechanism assumptions: https://www.microsoft.com/en-us/research/publication/algorithmic-foundations-differential-privacy/
- Abadi and collaborators' *Deep Learning with Differential Privacy* establishes per-example gradient clipping, calibrated Gaussian noise, subsampling, and a moments-accountant approach for DP-SGD: https://arxiv.org/abs/1607.00133
- Charles and collaborators study fine-tuning large language models with **user-level** differential privacy, directly supporting the distinction between one training row and all contributions from one protected person: https://arxiv.org/abs/2407.07737
- Opacus documents concrete DP-SGD privacy accounting and required inputs such as noise multiplier, sampling rate, steps, and `delta`: https://opacus.ai/api/compute_dp_sgd_privacy.html
- Shokri and collaborators introduce a concrete membership-inference attack against machine-learning models; an attack is evidence of one threat model, not a replacement for a formal privacy proof: https://arxiv.org/abs/1610.05820

## Claims and worked values that need exact qualification

The definition is `P(M(D) in S) <= exp(epsilon) * P(M(D') in S) + delta` for every output event and neighboring protected-unit datasets. State whether neighboring datasets add/remove or replace one unit, because that choice changes sensitivity conventions.

- A row-level guarantee protects one row. If one person contributes twelve rows, it doesn't by itself provide the same numerical user-level guarantee for removing that whole person's contribution.
- Independent scalar gradients `0.5` and `5.0` clipped individually at `1.0` become `0.5` and `1.0`, with clipped mean `0.75`. Their unclipped mean would be `2.75`.
- That deterministic calculation is **not** differentially private. A valid release also requires correctly calibrated random noise, valid protected-unit sampling, a contribution bound, a defensible accountant, and accounting across exposed outputs.
- The example ledger sums previous epsilon values `1.2 + 1.1 = 2.3`; adding `0.9` yields `3.2`, above a stated cap of `3.0`. This is a simplified conservative composition illustration, not an assertion that every DP-SGD accountant computes final epsilon by ordinary addition.
- User-level fine-tuning needs explicit grouping or contribution handling. Merely renaming a row-level privacy report as "user-level" isn't sufficient.

## Evidence boundaries for publication

Redaction and access controls reduce specific disclosure paths but don't imply the neighboring-dataset inequality. A failed membership test only constrains the tested attacker, population, interface, and threshold. Publishing checkpoints, private hyperparameter-search outputs, diagnostics, or repeated model releases can create additional composed exposure.

The protected unit, neighbor relation, `epsilon`, `delta`, clipping norm, noise multiplier, sampling assumption, total steps, released artifacts, and accountant version must travel together. Model utility, legal compliance, consent, retention, and security still require separate evidence.

## Glossary placement

Cross-link differential privacy, neighboring dataset, protected unit, privacy budget, privacy composition, DP-SGD, per-example gradient, gradient clipping, Gaussian noise, privacy accountant, and membership inference at the first technically meaningful use.
