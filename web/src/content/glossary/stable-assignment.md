---
title: Stable assignment
aliases: ["sticky assignment", "sticky bucketing"]
importance: 72
---
**Stable assignment** (also called sticky assignment or sticky bucketing) is the rule that a chosen **randomization unit** keeps the same experiment arm, model route, feature flag value, or shard for the life of the experiment. Here, "stable" means sticky bucketing under a hash or stored enrollment record. Gale–Shapley uses "stable matching" for a separate combinatorial problem. The unit is usually a user, tenant, conversation, session, or device. Assignment is **deterministic**: the same encoded key and experiment salt always hash to the same bucket, and a fixed bucket-to-arm map turns that bucket into a stable arm on every request. For ordinary distinct keys, a suitable hash approximates independent, uniform assignments; adversarial key selection can violate that assumption.

Persistent assignment is a correctness requirement for online controlled experiments. Kohavi, Tang, and Xu define the **randomization unit** as the entity a pseudo-randomization process (typically hashing) maps to a variant, and require that mapping to be **persistent**: if the unit is a user, that user should consistently see the same experience for the life of the experiment. Keeping the unit on the same arm prevents multi-turn memory, prompt style, tool state, and caches from leaking across arms and mixing treatment effect with assignment noise.

## Intuition

Assignment is a deterministic label fixed for the unit at enrollment and reused on every request. The first eligible event for `user-42` under experiment salt `rerank-v2:v1` lands in treatment. Every later turn, tab, retry, and device that resolves to the same key must reuse that label until the experiment ends, eligibility ends, or you deliberately reassign with a new salt or profile store.

Per-request random assignment is fine only when events are independent and there is no shared state: pure latency probes, one-shot shadow traffic, or synthetic load. Chat agents, RAG sessions with memory, multi-model routing, and tenant-scoped canaries almost always need a sticky key.

## How it works

1. **Pick the unit.** Match the product decision. User-level assignment is the usual default for product metrics (retention, satisfaction). Conversation-level assignment fits multi-turn assistants where each thread should stay on one model. Tenant-level assignment fits B2B rollouts where one company must not see mixed policies. Request-level assignment is rare for user-facing quality experiments.
2. **Build a stable key.** Prefer durable identifiers: authenticated user id, tenant id, conversation id, or a hashed combination. Avoid raw request ids, timestamps, or load-balancer connection ids. If identity is incomplete (anonymous web), use a cookie or device id and document how multi-device stitching works.
3. **Hash with an experiment salt.** Concatenate key and salt (experiment name + version), run a deterministic hash (SHA-256, MurmurHash, etc.), map into a large bucket space, and threshold by planned traffic share. The salt must stay fixed for the experiment; changing it reassigns the population.
4. **Route and log.** Apply the arm on every related event. Log arm, assignment key, experiment version, eligibility, and as-served model/route so analysis can detect flips and fallbacks.
5. **Keep stickiness under change.** Raising treatment from $5\%$ to $25\%$ can keep previously treated units treated if bucket ranges expand without reshuffle, but some prior controls move to treatment. Preserve stored enrollments or account for that ramp explicitly. Some platforms can reshuffle ranges when traffic drops to $0\%$ and restarts; a pure hash with the same restored map returns its previous assignments. Rotating the salt can rebucket units. Any change can complicate the experiment and may trigger [sample ratio mismatch](glossary://sample-ratio-mismatch).

Commercial platforms call the same idea **consistent / sticky bucketing**: Optimizely hashes user id with experiment id into $10{,}000$ buckets; Amplitude's sticky bucketing reuses the last stored variant when configuration would otherwise rebucket.

## Formula

A common two-arm split with treatment share $p \in [0, 1]$ is

$$
b = H(\textit{key} \parallel \textit{salt}) \bmod M, \qquad
\text{arm} =
\begin{cases}
\text{treatment} & \text{if } b < p \cdot M \\
\text{control} & \text{otherwise}
\end{cases}
$$

where $H$ is a stable hash to a non-negative integer, $M$ is the bucket count (often $100$, $1{,}000$, or $10{,}000$), and $\parallel$ denotes an unambiguous encoding of both fields. A separator alone is insufficient if either field can contain it. Treating $H$ as effectively uniform over distinct keys supplies the approximate randomization model. Integer buckets also quantize attainable shares. Persistence requires a fixed key, salt, bucket count, and arm map, or a stored assignment for each enrolled unit. Expanding a treatment threshold preserves old treatment assignments but changes some old controls; shrinking it changes some treated units.

For three arms with shares $p_A + p_B + p_C = 1$, partition the bucket range into contiguous intervals whose integer lengths approximate $p_A M$, $p_B M$, $p_C M$. Separately reserving an unallocated enrollment range lets traffic expand into unused buckets without moving previously enrolled units; a fully allocated three-arm map has no such open range.

```python
import hashlib
import json

def arm_for(key: str, salt: str, treatment_pct: int = 10) -> str:
    if type(treatment_pct) is not int or not 0 <= treatment_pct <= 100:
        raise ValueError("treatment_pct must be an integer from 0 to 100")
    payload = json.dumps([salt, key], ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    bucket = int.from_bytes(hashlib.sha256(payload).digest()[:8], "big") % 100
    return "treatment" if bucket < treatment_pct else "control"

assert arm_for("user-42", "rerank-v2:v1") == arm_for("user-42", "rerank-v2:v1")
# A new salt changes the hash input; this particular unit can still land in the same arm.
```


## Example

You A/B test a new cross-encoder reranker on support chat. Assignment unit is **conversation id** so every turn in a thread shares memory, prompt version, and ranking stack.

- Salt: `support-rerank-xenc:v1`
- Split: $10\%$ treatment ($p = 0.1$, $M = 100$)
- Key for the thread: `conv-9f3a`

Suppose this experiment's specified hash maps the first message to bucket $7$, so treatment (an illustrative bucket, not the output of the Python function above). The user opens a second tab, the gateway retries once after a timeout, and turn three runs tool calling. All three resolve `conv-9f3a` + salt to bucket $7$ again and stay on the new reranker. Impression and outcome rows all carry `arm=treatment`, `assignment_key=conv-9f3a`, `experiment=support-rerank-xenc:v1`.

If instead each HTTP request flipped a coin at $10\%$, turn 1 might hit treatment, turn 2 control, and turn 3 treatment. The transcript mixes ranking quality and latency; the user-facing metric (acceptance of the drafted reply) no longer estimates a single system. Analysts cannot tell whether a bad outcome came from the new model or from thrashing mid-thread.

## What must stay stable

| Stay fixed for the window | Why |
|---|---|
| Assignment key definition | Changing user id → device id mid-flight rebuckets people |
| Experiment salt / version | New salt is a new experiment; do not rename silently |
| Bucket map and arm thresholds for enrolled units | Preserve stored enrollments or ranges; verify platform behavior when pausing/ramping |
| Variant-scoped caches and memory | Prompt cache, conversation summary, and KV-style session state must not cross arms |
| Logging of assigned vs as-served | Fallbacks break stickiness of *experience* even if assignment is sticky |

Document when reassignment is allowed: experiment end, logout and new anonymous identity, eligibility change (locale, consent, plan), or an explicit forced override for dogfood. Those cases should be rare, logged, and excluded or stratified in analysis when they bias the comparison.

## What fails in production

- **Request-level randomness on multi-turn paths.** The classic LLM bug: gateway `random() < 0.1` per request. Conversations thrash; A/B results become uninterpretable.
- **Unstable or missing keys.** Guest users without a cookie, hash of full URL (includes `utm_` noise), or hashing only after auth so pre-login and post-login arms differ.
- **Salt or config thrash.** Changing the hash salt, bucket count, or arm map can rebucket users and create SRM or carryover bias. A pause/restart with an identical pure hash map restores the same labels; platform-managed maps may behave differently.
- **Sticky assignment, non-sticky experience.** Assignment log says treatment, but fallback, canary shard, or cache still serves control. Report both intent-to-treat (assigned arm) and as-served.
- **Multi-device and multi-surface identity.** Same person on phone and desktop with different keys looks like two independent units; same conversation id across web and mobile is usually better for chat quality tests.
- **Overlapping experiments without coordination.** Two sticky hashes on the same key are fine if salts differ; mutual exclusion and interaction analysis still need a plan so arms do not confound each other.

## Why it matters here

A/B tests, canaries, feature flags, and multi-model routing produce clean lessons when the unit of assignment stays put long enough to measure behavior. In LLM products the unit almost always carries state: chat history, retrieved context, tool results, and user memory. Unstable assignment turns that state into cross-arm contamination. Stable assignment keeps treatment mapped to one continuous system throughout the experiment.

## Related terms

- [A/B testing](glossary://ab-testing)
- [Traffic split](glossary://traffic-split)
- [Canary rollout](glossary://canary-rollout)
- [Sample ratio mismatch](glossary://sample-ratio-mismatch)
- [Feature flag](glossary://feature-flag)
