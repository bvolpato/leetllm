---
query: "We are creating a research-backed page for the following: \"Scaled Dot-Product Attention\". Suggest a useful structure and the content that must be present and is relevant.\n\nPage type: curriculum article\nCurriculum section: fundamentals\nCurrent page scope: Learn scaled dot-product attention from first principles, including Q/K/V routing, variance scaling, masks, multi-head shapes, KV-cache costs, and FlashAttention.\nResearch refresh ID: 2026-07-15-soft-v1\n\nThis is a curriculum article. Prefer teaching order, mechanisms, worked examples, and mastery outcomes when useful, but do not force a stock lesson template.\n\nPublished LeetLLM pages do not use one fixed H2 template. `_research.md` is editorial context only: humans and agents use it while writing or updating `content.md`. It is not rendered on the site. Adapt the outline to this topic.\n\nSuggested coverage to include when relevant:\n- teaching or narrative order and prerequisites\n- core concepts, mechanisms, equations, implementation details, and tradeoffs\n- current tools, model versions, APIs, benchmarks, prices, policies, or standards when relevant\n- concrete examples, labs, analogies, diagrams, tables, and practice ideas\n- common mistakes, misconceptions, failure modes, and expected reader outcomes\n- claims that may already be stale, disputed, or incomplete\n- primary-source URLs that verify the important claims\n\nGuidance, not rigid requirements:\n- Use clear Markdown headings. Rename, merge, split, or omit suggested themes when the topic calls for it.\n- Prefer concise bullets and short sections over long essays.\n- Attach exact dates and direct URLs to volatile claims such as versions, prices, benchmarks, policies, and current product capabilities.\n- Prefer primary sources, official docs, standards, and original papers.\n- Every source mention must include a full `https://...` URL in the same bullet or row. Never write `(Source: Vendor)`, `(Sources: Vendor + 1)`, footnote-style markers, or other opaque citations without the link.\n- Separate stable foundations from facts that need periodic reverification.\n- State uncertainty and source disagreement directly.\n\nResearch the current state of this topic instead of relying only on general memory. Do not invent citations, metrics, product details, release information, or future products. Omit any specific claim you cannot support with a direct source URL."
model: "Pro"
task_id: "077fe5d7f39ce8e30299c5807dcb0421"
status: "completed"
---

This article structure breaks down Scaled Dot-Product Attention from its first principles in the original Transformer paper to the modern hardware-aware implementations powering today's Large Language Models (LLMs).

## 1. The Core Mechanism: Queries, Keys, and Values

Scaled dot-product attention maps a **Query (Q)** and a set of **Key-Value (K, V)** pairs to an output. It functions like a soft, differentiable dictionary lookup: the query represents what the model is looking for, the keys represent what each token contains, and the values are the actual content extracted.

Attention(Q,K,V)=softmax(dk​![Image](<data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"%3E<path d="M95,702
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
M834 80h400000v40h-400000z"%3E</path%3E</svg%3E>)​QKT​)V

[![Original Scaled Dot-Product Attention Architecture, AI generated](<https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrtBWAgoq23o22_kRZolTHVZwrhp8_ScB2Z_boW8-p8e2znc5rsavhTRo&s=10>)](<https://machinelearningmastery.com/wp-content/uploads/2022/03/dotproduct_1.png>)

*Original Scaled Dot-Product Attention Architecture. Source: Machine Learning Mastery*

### Step-by-Step Execution

1. **Alignment Scores (QKT)**: The model computes the dot product between every query and every key. This produces a matrix of raw similarity scores where higher values indicate stronger relevance between tokens.
2. **Variance Scaling (dk​![Image](<data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"%3E<path d="M95,702
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
M834 80h400000v40h-400000z"%3E</path%3E</svg%3E>)​1​)**: The raw scores are divided by the square root of the key dimension (dk​).
3. **Probability Weights (softmax)**: A softmax function converts the scaled scores into positive weights that sum to 1, creating the attention matrix.
4. **Weighted Output**: The attention weights are multiplied by the Value matrix (V). The final output for each query is a weighted sum of all values, dominated by the values whose keys most strongly matched the query.

## 2. The Softmax Bottleneck: Why Variance Scaling?

In their 2017 paper *Attention Is All You Need* ([https://arxiv.org/html/1706.03762v7](https://arxiv.org/html/1706.03762v7)), Vaswani et al. explain that without scaling, the dot products can grow extremely large in magnitude.

If q and k are independent random variables with mean 0 and variance 1, their dot product will have mean 0 and variance dk​. For large embedding dimensions (e.g., dk​=64 or higher), the variance of the dot product is high. These large values push the softmax function into regions where the gradient is extremely small, causing the "vanishing gradient" problem. By scaling the dot product by dk​![Image](<data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400em" height="1.08em" viewBox="0 0 400000 1080" preserveAspectRatio="xMinYMin slice"%3E<path d="M95,702
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
M834 80h400000v40h-400000z"%3E</path%3E</svg%3E>)​1​, the variance is normalized back to 1, ensuring the softmax gradients remain stable during training.

## 3. Multi-Head Attention (MHA)

Instead of performing a single attention function over high-dimensional vectors, the Transformer linearly projects queries, keys, and values h times with different learned weights ([https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf](https://papers.neurips.cc/paper/7181-attention-is-all-you-need.pdf)).

This **Multi-Head Attention (MHA)** allows the model to jointly attend to information from different representation subspaces at different positions.

MultiHead(Q,K,V)=Concat(head1​,…,headh​)WO

## 4. Autoregressive Decoding and the KV Cache

During inference, generating tokens with a Transformer is sequential. For each new token, the model must attend to *all* previous tokens. Recomputing the Keys and Values for every past token at every step would result in O(N2) complexity, making generation prohibitively slow ([https://lyceum.technology/magazine/kv-cache-memory-calculation-llm/](https://lyceum.technology/magazine/kv-cache-memory-calculation-llm/)).

To solve this, models use a **KV Cache**: they store the computed Key and Value tensors for every token as they are generated.

- **The Tradeoff**: While the KV cache saves massive amounts of floating-point operations (FLOPs), it shifts the bottleneck entirely to memory capacity and bandwidth.
- **Memory Footprint**: The memory formula is `2 * layers * heads * head_dim * seq_len * batch_size * bytes_per_element`. For example, a 32-layer, 32-head model with a 128 head dimension at 2048 sequence length and batch size 1 in FP16 consumes exactly 1 GB of VRAM just for the cache of a single request.

## 5. Shrinking the Cache: MQA and GQA

As context lengths and batch sizes scaled, the memory bandwidth required to load the massive MHA KV cache at every step became the primary inference bottleneck. This led to variations in how queries route to keys and values:

[![MQA, GQA, MHA, and MLA Architectures, AI generated](<https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_h3M-wP4tumOV-ROIxJo00_Mh03Lerc6wPf2dO69u7NhW3nvq2vPBxIVu&s=10>)](<https://miro.medium.com/v2/resize:fit:1200/1*oZq5NCt0BZbcSwhCztL-cQ.png>)

*MQA, GQA, MHA, and MLA Architectures. Source: Medium*

- **Multi-Query Attention (MQA)**: Uses multiple Query heads, but only a *single* Key and Value head shared across all queries ([https://towardsdatascience.com/demystifying-gqa-grouped-query-attention-3fb97b678e4a/](https://towardsdatascience.com/demystifying-gqa-grouped-query-attention-3fb97b678e4a/)). This drastically reduces the KV cache memory size but can noticeably degrade model quality.
- **Grouped-Query Attention (GQA)**: A middle ground where query heads are divided into G groups, and each group shares a single Key and Value head. GQA achieves inference speeds comparable to MQA while maintaining quality close to standard MHA.

## 6. Hardware Realities: FlashAttention

While KV caching addresses the redundant computation of K and V, computing the attention matrix itself (QKT) requires loading Q,K, and V from the GPU's high-capacity but slow High Bandwidth Memory (HBM) to its fast but small SRAM. Standard attention materializes the entire N×N attention matrix in HBM, causing a massive I/O bottleneck that scales quadratically with sequence length ([https://medium.com/@saurabhk1/flashattention-the-io-aware-breakthrough-powering-faster-transformers-e8728edcc7a9](https://medium.com/@saurabhk1/flashattention-the-io-aware-breakthrough-powering-faster-transformers-e8728edcc7a9)).

**FlashAttention**, introduced by Dao et al. in 2022 ([https://hai.stanford.edu/research/flashattention-fast-and-memory-efficient-exact-attention-with-io-awareness](https://hai.stanford.edu/research/flashattention-fast-and-memory-efficient-exact-attention-with-io-awareness)), fundamentally solved this by being **IO-Aware**. Instead of moving massive matrices in and out of HBM, it:

1. **Tiles the computation**: It loads blocks of Q, K, and V into SRAM.
2. **Fuses the operations**: It computes the softmax and the multiplication with V locally in SRAM without ever writing the intermediate N×N matrix back to HBM.
3. **Recomputes on the fly**: During training, rather than storing the huge attention matrix for the backward pass, FlashAttention recomputes it. This saves time because mathematically calculating the values on the compute cores is faster than waiting on memory access.

> **Periodic Reverification Note:** Hardware-specific kernel implementations change rapidly. As of 2026, FlashAttention-2 and FlashAttention-3/4 natively support newer Nvidia Hopper (H100) and Blackwell (B200) instruction sets via CuTe DSL, and AMD support continues to evolve ([https://github.com/dao-ailab/flash-attention](https://github.com/dao-ailab/flash-attention)). Future iterations will likely continue heavily modifying tiling logic for new accelerator architectures.
