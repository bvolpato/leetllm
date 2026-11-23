---
title: Big-O notation
aliases: ["Big O notation", "O-notation", "order notation"]
importance: 58
---
Big-O notation classifies how a cost function $f(n)$ grows as the input size $n$ gets large. In algorithm analysis, $f(n)=O(g(n))$ means $f$ is at most a constant multiple of $g$ for all sufficiently large $n$: there exist constants $c>0$ and $n_0$ such that $0 \leq f(n) \leq c\,g(n)$ for every $n \geq n_0$. This is an **asymptotic upper bound**. Benchmark concrete inputs to measure elapsed time, such as at $n=10$.

You drop constant factors and lower-order terms to compare scaling. $O(n)$ bounds cost by linear growth. It also includes constant and logarithmic functions. Constant, linear, or logarithmic functions can also satisfy $O(n^2)$, so that bound alone says nothing about a tight quadratic rate. In this notation, the "$=$" writes membership. A tight two-sided claim uses $\Theta(g(n))$ when $f$ is both $O(g)$ and $\Omega(g)$.

In AI systems, name $n$ carefully before arguing about class: tokens in a sequence, corpus size, candidates retrieved, tool calls, graph edges, batch size, or concurrent workers. Token length and candidate count often dominate "number of rows" in a notebook.

## Formula

For non-negative $f$ and $g$ on positive integers (the usual CS setting as $n \to \infty$):

$$
f(n)=O\bigl(g(n)\bigr)
\quad\text{iff}\quad
\exists\, c>0,\; n_0\geq 0
\text{ such that }
\forall n\geq n_0:\quad
0 \leq f(n) \leq c\,g(n).
$$

Equivalently, the ratio $f(n)/g(n)$ stays bounded above for large $n$. Related Landau symbols:

| Symbol | Role (CS usage) | Rough meaning |
|---|---|---|
| $O(g)$ | Upper bound | $f$ grows no faster than $g$ (up to constants) |
| $\Omega(g)$ | Lower bound | $f$ grows at least like $g$ |
| $\Theta(g)$ | Tight class | both $O$ and $\Omega$ |
| $o(g)$ | Strictly slower | $f/g \to 0$ |

People often write $O(n^2)$ when they mean $\Theta(n^2)$; for capacity planning, the tight class matters more than a loose upper bound such as "everything is $O(n^{100})$."

## Interpret growth rates

Tight growth rates describe asymptotic work. For a linear or quadratic leading term, a tenfold larger input gives roughly tenfold or hundredfold work asymptotically. Hardware, caching, batching, and constants still determine elapsed time.

## Common classes

| Class | Growth sketch | Typical LLM / systems examples |
|---|---|---|
| $O(1)$ | Bounded | Expected hash lookup under suitable hashing (worst case can be linear), fixed-size tensor op |
| $O(\log n)$ | Slow climb | Tree height, binary search; HNSW is often ~polylog / sublinear in practice under typical `efSearch` (heuristic, not a tight $\Theta(\log n)$ guarantee) |
| $O(n)$ | Linear | Scan $n$ chunks, stream tokens, exact dense scan of $n$ vectors |
| $O(n\log n)$ | Near-linear | Sort, many divide-and-conquer builds |
| $O(n^2)$ | Quadratic | Naive all-pairs, dense self-attention scores over length $n$ |
| $O(2^n)$ | Explosive | Brute-force subsets; avoid at production $n$ |

Constants still matter on GPUs and in p95 latency. Class tells you what breaks first when $n$ scales $10\times$.

## Example

**Pairwise chunk compare.** Scanning $n$ chunks is $O(n)$. Comparing every pair is $O(n^2)$:

| $n$ | Pair ops $\sim n^2$ |
|---:|---:|
| $1{,}000$ | $\sim 10^6$ |
| $10{,}000$ | $\sim 10^8$ |
| $100{,}000$ | $\sim 10^{10}$ |

A notebook that feels fine at $n=1{,}000$ can stall or timeout at $n=100{,}000$ even if each pair is cheap.

**Dense self-attention.** Vaswani et al. (2017) give per-layer complexity for full self-attention as $O(n^2 d)$ in sequence length $n$ and representation width $d$ (Table 1: self-attention complexity $O(n^2\cdot d)$). Scores fill an $n\times n$ query-key matrix; each entry is a $d$-dimensional product (or the equivalent batched matmul). Across heads with fixed model width, people often summarize the attention core as $O(n^2 d_{\mathrm{model}})$. Dense linear projections around attention are $O(n\,d_{\mathrm{model}}^2)$.

Worked scale for the quadratic score surface alone (ignoring $d$ for a moment): doubling context from $4{,}096$ to $8{,}192$ multiplies $n^2$ by $4$. That is why long-context work cares about efficient attention kernels, retrieval, and chunking instead of stuffing unbounded history into one dense softmax.

**ANN vs exact search.** Exact nearest-neighbor scan over a corpus of size $N$ is $O(N)$ distance evaluations per query. Approximate indexes (HNSW, IVF) aim for far sublinear *observed* work per query at the cost of imperfect recall. Big-O for the exact baseline is the reason you index; measured recall@k is the reason you validate the index.

When code slows down, find the growing variable before tuning constants. Time a small case and a $10\times$ larger case and check whether growth matches the claimed class.

## Intuition

Big-O answers: "If the load grows, does cost stay flat, climb gently, or explode?" It deliberately ignores:

- Constant factors ($3n$ and $300n$ are both $O(n)$)
- Hardware details (GPU vs CPU, cache effects)
- Small-$n$ behavior

So use Big-O for design: "Is this quadratic in tokens?" Use profiling, FLOPs, and bytes moved for the next $2\times$ latency win. FlashAttention is a good example of the split: it still performs the dense $O(n^2)$ attention interactions, but cuts HBM traffic so long sequences become practical. The asymptotic class of the math did not change; the constant factors and memory hierarchy did.

Also watch multi-variable costs. Prefill attention over prompt length $L$ is dominated by $O(L^2)$ interactions; autoregressive decode with a KV cache often pays work linear in current context *per new token*, so total decode cost over $T$ generated tokens grows with how long the context already is. Naming which phase and which $n$ you mean keeps the claim honest.

## Why it matters here

Big-O reasoning predicts when a notebook pipeline fails at production scale: quadratic eval loops over candidates, naive all-pairs RAG chunk scoring, full-corpus exact search instead of ANN, fanout that multiplies work by worker count, and dense attention as context windows grow. In LeetLLM lessons on transformers, retrieval, and serving, the first debugging move is often "what is $n$, and what is the growth class?" before micro-optimizing kernels.

## Related terms

- [Self-attention](glossary://self-attention)
- [FlashAttention](glossary://flashattention)
- [ANN search](glossary://ann-search)
- [Context window](glossary://context-window)
- [KV cache](glossary://kv-cache)
