---
title: MoE router
aliases: ["Mixture-of-Experts router", "Mixture of Experts router", "MoE routing", "Mixture-of-Experts routing", "Mixture of Experts routing", "expert router", "expert routing", "routing gate", "gating network", "router network", "MoE gate", "MoE gating", "expert gate"]
importance: 89
---
An **MoE router** is the small learned module that decides which experts process each token inside a sparse [mixture-of-experts](glossary://mixture-of-experts) layer. It reads a token's hidden state, produces one score per routed expert, selects a small top-$k$ set, and supplies weights used to combine selected expert outputs.

Router creates conditional computation. Two tokens can pass through the same Transformer layer yet activate different feed-forward networks. The full expert bank adds model capacity, while top-$k$ choice limits expert computation performed for each token.

## From hidden state to expert output

For hidden state $h \in \mathbb{R}^{d}$ and $E$ routed experts, common router starts with linear projection:

$$
z = W_r h, \qquad W_r \in \mathbb{R}^{E \times d}.
$$

Scores $z$ are transformed into routing weights $g$. Implementations may use softmax, sigmoid, score biases, normalization before or after selection, or specialized grouping rules. Generic token-choice top-$k$ path is:

$$
\mathcal{T}(h)=\operatorname{TopK}(g(h), k), \qquad
y=\sum_{i\in\mathcal{T}(h)} \tilde g_i(h)E_i(h).
$$

$\mathcal{T}(h)$ contains selected expert IDs, $E_i$ is expert $i$, and $\tilde g_i$ is that expert's combine weight. Top-$k$ identity is discrete: a tiny score change near cutoff can select a different expert. Within a fixed selection, differentiable combine weights can carry ordinary gradients to router parameters. That depends on the gate: renormalizing a single selected weight to exactly one removes that particular main-loss gradient path, so top-1 routing may rely on an unnormalized gate or auxiliary objectives.

Router doesn't move token tensors between GPUs by itself. [Expert parallelism](glossary://expert-parallelism) and token dispatcher own all-to-all transfer, local expert execution, and return path. Codebases sometimes call complete score-select-dispatch-combine sequence "routing," so check which boundary a metric or configuration flag measures.

## Balance and specialization

Router must learn useful specialization without concentrating most tokens on few experts. Too little balance pressure creates hot experts, idle experts, stragglers, and capacity overflow. Too much pressure can force uniform-looking traffic that weakens specialization.

Common control mechanisms include:

| Mechanism | What it changes | Main risk |
|---|---|---|
| Auxiliary load-balancing loss | Adds gradient encouraging balanced expert use | Can compete with main language-model objective |
| Expert-wise score bias | Raises underused experts and lowers overloaded experts before top-$k$ | Controller can oscillate or hide weak specialization |
| Capacity limit | Caps assignments accepted by each expert | Overflow routes may drop, skip, or be reassigned |
| Shared expert | Runs an always-on path beside routed experts | Shared path can dominate while routed experts weaken |

Useful metrics include assignments per expert, routed probability mass, load coefficient of variation, router entropy, top-$k$ margin, overflow or dropped-route rate, expert gradient norms, and dispatch/combine latency. Average load alone can hide one dead expert, one hot device, or domain-specific collapse.

## Example

Suppose router scores four experts for one token:

$$
g(h)=[0.51,\ 0.27,\ 0.20,\ 0.02], \qquad k=2.
$$

Experts 1 and 2 run. If selected weights are renormalized, combine weights become approximately $0.65$ and $0.35$, producing:

$$
y \approx 0.65E_1(h)+0.35E_2(h).
$$

Expert 3 is close to cutoff. Small FP8-versus-BF16 score difference could swap experts 2 and 3, changing whole expert path. [Rollout Routing Replay](glossary://router-replay) records rollout's selected IDs so learner can reproduce discrete choice while recomputing live weights and gradients.

GLM-5.3 applies this pattern at large scale: each sparse layer chooses eight of 256 routed experts per token, while one shared expert remains active. Router choice explains why stored parameter count can be far larger than active expert computation, but it also creates expert-balance and rollout-to-learner parity work.

## Boundary with request routing

"Router" also names systems that choose a model endpoint or serving replica. They aren't the same component:

| Router | Input | Chooses | Runs when |
|---|---|---|---|
| MoE router | one token hidden state | experts inside model layer | every token and MoE layer |
| [vLLM Router](glossary://vllm-router) | serving request | engine or replica | request admission |
| [Routing policy](glossary://routing-policy) | request and product context | model, provider, tools, or plan | application control plane |

Changing a request router can't repair expert collapse. Changing an MoE balance loss won't fix an overloaded serving endpoint.

## Why it matters here

The GLM-5.3 candidate needs router correctness and efficiency in both its rollout engine and learner. A routing mismatch can make the same token traverse different expert networks, corrupt policy-ratio comparisons, and look like generic logprob drift. Balanced routing also determines whether EP ranks perform similar work or wait for one overloaded rank.

When debugging, separate four questions: Were expert IDs same? Were combine weights same? Did dispatch preserve token order? Did selected expert kernels produce close outputs? "Routing mismatch" is too broad until one of those boundaries fails.

Primary references: [Sparsely-Gated Mixture-of-Experts](https://arxiv.org/abs/1701.06538), [Switch Transformers](https://www.jmlr.org/papers/v23/21-0998.html), [Auxiliary-Loss-Free Load Balancing](https://arxiv.org/abs/2408.15664), and [GLM-5.3 BF16 configuration](https://huggingface.co/zai-org/GLM-5.3-BF16/blob/304b8051cfb2b260b61ce0cbe330e02a98e73639/config.json).

## Related terms

- [Mixture of experts](glossary://mixture-of-experts)
- [Expert parallelism](glossary://expert-parallelism)
- [Top-k](glossary://top-k)
- [Policy entropy](glossary://policy-entropy)
- [Rollout Routing Replay](glossary://router-replay)
- [All-to-all](glossary://all-to-all)
