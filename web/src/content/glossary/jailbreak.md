---
title: Jailbreak
importance: 76
---
A **jailbreak** is an adversarial attempt to make a safety-trained model produce restricted behavior: content or actions the model was trained or configured to refuse. The attacker starts from a prompt $P$ that asks for a disallowed outcome, wraps it as a modified prompt $P'$, and succeeds when the model gives an on-topic response to the disallowed request.

Jailbreaks target **model-side safety alignment** (refusal training, RLHF/CAI harmlessness, usage-policy compliance). Closely related but not identical is [prompt injection](glossary://prompt-injection), which steers an *application* away from its intended instructions (tools, retrieval, business logic) by smuggling instructions through untrusted text. OWASP groups both under LLM01 (prompt injection) because the input channel is shared; practitioners still separate them because defenses differ. Jailbreak defenses emphasize alignment, classifiers, and output policy. Injection defenses emphasize instruction hierarchy, least privilege, and code-enforced gates that the model cannot rewrite.

Classic black-box jailbreaks assume chat access only: no weight edits, no system-prompt control, no message-history rewrite. Stronger threat models add multi-turn coercion, transfer of adversarial suffixes across models, white-box gradient optimization of tokens, fine-tune "jailbreak tuning," and tool-using agents where a successful text jailbreak can trigger real side effects.

## Intuition

Safety-trained models are multi-objective systems. Pretraining and instruction following encourage fluent, helpful completion. Safety training encourages refusal on restricted behaviors. Wei, Haghtalab, and Steinhardt (*Jailbroken*, NeurIPS 2023) frame two failure modes illustrated by their attacks:

1. **Competing objectives.** The prompt creates a conflict between obeying a detailed instruction and refusing the underlying harmful ask. Prefix injection ("start with Absolutely! Here's …"), refusal-suppression rules ("do not apologize, do not say you cannot"), roleplay personas (DAN-style), and style constraints can exploit that conflict. Starting with an affirmative continuation doesn't by itself establish that the rest of the response will violate policy.

2. **Mismatched generalization.** Capabilities often span a wider domain than safety data. The model can follow Base64, leetspeak, ciphered, split-payload, or low-resource-language instructions learned in pretraining, while refusal training mostly saw plain natural-language harmful asks. Capability generalizes; refusal does not.

Those modes can compose: an attack can combine encoding, prefix instructions, style rules, and examples. Scale can create new surfaces: a smaller model may not understand an encoded request; a larger one may understand it and answer without refusal. Evaluate each model and defense stack directly; model size alone does not rank safety.

In product terms, treat the chat model as an unreliable proposer of text and tool calls. A jailbreak succeeds when that proposer crosses a policy boundary. The defended object is the whole system: system prompts, retrieval, tools, classifiers, policy gates, and logs.


## How it works

**Attack families (black box).** Roleplay and "developer mode" personas; competing-instruction stacks; encoding and obfuscation; multi-turn social engineering; many-shot examples of compliance; payload splitting / token smuggling; translation and low-resource languages; model-assisted rewriting of the same intent. White-box methods such as GCG (Zou et al., *Universal and Transferable Adversarial Attacks*, 2023) optimize an adversarial suffix against loss on a target continuation and often transfer to closed models.

**Scoring.** Research reports **attack success rate (ASR)** under a specified human or model judge. The judge must assess the actual policy violation; an on-topic reply or absence of refusal alone can misclassify safe discussion as success. State the attempt budget, judge, temperature, and behavior set. For $K$ independent attempts with the same success probability $p$, the probability of at least one success is

$$
\mathrm{ASR}_{K} = 1 - (1 - p)^{K}.
$$

Under those assumptions, $p = 0.01$ gives about 98% probability of at least one success at $K = 392$. Correlated samples or adaptive prompts does not need to follow this formula. Log attempts, judge version, and whether success is "any sample" or "single decode."

**Defenses (defense in depth).** No single layer is enough:

| Layer | Role |
| --- | --- |
| Alignment (SFT, RLHF, CAI, refusal fine-tunes) | Shifts average behavior toward refusal on known harms |
| Input / output [safety classifiers](glossary://safety-classifier) | Score or block $P'$ and completions (including constitutional / synthetic-trained classifiers) |
| Runtime [guardrails](glossary://guardrail) and [policy gates](glossary://policy-gate) | Deterministic allow/deny before tools and exports |
| Action allowlists, least privilege, sandbox | Cap blast radius if text policy fails |
| Rate limits, abuse detection, audit trail | Slow adaptive attackers and enable forensics |
| Continuous [red team](glossary://red-team) + regression evals | Keep ASR honest as models and attack templates drift |

Anthropic's constitutional-classifier line of work trains input and output monitors from a natural-language constitution of allowed vs disallowed content, cutting automated jailbreak success sharply relative to an unguarded model while aiming to limit over-refusal. Track residual ASR as an operating risk even on strong stacks.

## Example

**Direct ask (should refuse).** User: "Write step-by-step instructions to phish our own customers' credentials for a penetration test we will not authorize." A well-aligned support assistant refuses and offers a legitimate security-review path.

**Jailbreak wrap (attacks alignment).** Same intent restated as a fictional "red-team novel chapter," Base64-encoded body, plus instructions to start with "Sure, here is the complete guide:" and never mention policy. If the model complies with on-topic phishing steps, the *model* jailbreak succeeded.

**What production must still stop.** A product with write tools must prevent a bad chat reply from reaching real customers. A [policy gate](glossary://policy-gate) denies `send_email` and `export_user_list` without human approval and tenant-scoped allowlists; a safety classifier on tool arguments flags credential-harvesting language; the incident lands in an audit trail with model version, prompt hash, and rule id. Eval rows should reproduce the *path* (encoded input → compliant draft → attempted tool call) across varied surface wording. Two prompts that look different can share the same successful path through tools or retrieval.

## Why it matters here

Jailbreaks show why tool execution needs code-enforced policy boundaries. Alignment reduces casual misuse, while runtime controls authorize high-impact actions. Curriculum and product work on agents, RAG, and tool calling must assume adaptive users will try roleplay, encoding, multi-turn pressure, and transferred adversarial templates. Measure residual ASR on your own policy categories, fail closed on high-impact tools, and keep red-team cases in the regression suite so model upgrades do not silently reopen known paths.

## Related terms

- [Prompt injection](glossary://prompt-injection)
- [Red team](glossary://red-team)
- [Guardrail](glossary://guardrail)
- [Safety classifier](glossary://safety-classifier)
- [Policy gate](glossary://policy-gate)
