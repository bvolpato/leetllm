---
{
  "id": "bitter-lesson-compute-over-heuristics",
  "title": "The Bitter Lesson & Compute",
  "slug": "bitter-lesson-compute-over-heuristics",
  "section": "Core LLM Foundations",
  "category": "Reasoning & Scaling",
  "difficulty": "Medium",
  "coverImage": "illustrations/_generated/compute_crossover_curve_dark.png",
  "companies": [
    "Google DeepMind",
    "OpenAI",
    "Meta",
    "Anthropic",
    "Microsoft",
    "NVIDIA"
  ],
  "shortDescription": "General search and gradient learning turn extra FLOPs into new capability long after hand-crafted heuristics hit a ceiling. Measure crossover curves across game search, neural feature learning, Chinchilla pretraining, lifetime serving, and test-time verification.",
  "keyConceptsTested": [
    "Sutton's historical thesis on search and learning",
    "Crossover depth between alpha-beta search and domain heuristics",
    "Learned neural representations versus fixed polynomial bases",
    "Dense Transformer training FLOPs approximation (6ND)",
    "Kaplan versus Hoffmann Chinchilla IsoFLOP allocation",
    "Inference-aware overtraining and lifetime FLOPs break-even",
    "Test-time compute scaling under exact vs proxy verifiers",
    "When hard constraints and inductive biases remain necessary"
  ],
  "order": 1
}
---

For decades, computer chess teams hand-crafted positional weights with grandmasters: rook-on-seventh bonuses, king-safety tables, pawn-structure heuristics. Then Deep Blue crushed Garry Kasparov with massively parallel alpha-beta tree search, and two decades later AlphaZero threw out human board heuristics altogether, learning from self-play and Monte Carlo tree search.[^silver2017] The same upset repeated in speech recognition, computer vision (where convolutional networks swept aside hand-designed SIFT and HOG descriptors once GPUs accelerated backpropagation), and modern language modeling.[^krizhevsky2012]

In 2019, Rich Sutton distilled this recurring pattern into *The Bitter Lesson*: whenever hardware grows by orders of magnitude, general methods built on **learning** and **search** overtake systems built on hand-crafted human knowledge.[^sutton2019] The lesson feels bitter because hand-engineering usually wins on day one. Careful domain rules give quick gains on scarce hardware, yet they bake human assumptions into the system that become rigid ceilings once data and compute scale.[^sutton2019]

This is not an argument against thoughtful architecture. Convolutional weight sharing encodes spatial translation equivariance, and Transformer attention encodes token-to-token routing.[^krizhevsky2012] What breaks with scale is hard-coding task answers instead of giving a general learner or search procedure a clean objective and enough compute to explore the space itself.[^sutton2019][^mnih2015]

## Search scaling versus domain heuristics

A clean way to observe the Bitter Lesson firsthand is to pit two strategies against each other in a finite two-player game where neither player receives any human opening book. On a compact 5-by-6 Connect-Four board, we build a **domain tactical heuristic** that looks one move ahead and explicitly scores center-column occupancy plus open two-in-a-row and three-in-a-row threats using hand-tuned weights. Against it, we pit a **pure alpha-beta search** player whose leaf evaluator knows nothing beyond terminal wins (`+100`) and losses (`-100`), returning `0.0` for every non-terminal board state.[^sutton2018] At depth 1, pure terminal search is blind to threats more than one ply away, so the tactical heuristic dominates it effortlessly. Yet every additional ply of lookahead expands the search tree exponentially (`b` branches per ply before alpha-beta pruning cuts off dominated subtrees), allowing pure search to discover forks and forced traps that the one-ply heuristic writer never had to enumerate by hand.[^sutton2019]

<figure>
  <img src="illustrations/_generated/compute_crossover_curve_light.png" alt="Connect-Four 5-by-6 match score of pure alpha-beta terminal search against a one-ply domain tactical heuristic: 0.000 at depth 1 (26 nodes), overtaking the 0.500 parity line at depth 2 with 0.583 (268 nodes), reaching 0.667 at depth 3 (621 nodes), and reaching 0.750 at depth 6 (14,015 nodes)." />
  <figcaption>On a 5x6 Connect-Four board, pure terminal alpha-beta search loses every game at depth 1 (0.000) against hand-tuned tactical weights, overtakes parity at depth 2 (0.583), and reaches 0.750 by depth 6 purely by expanding more search nodes per move.</figcaption>
</figure>

Notice in the experiment below how little domain insight the winning agent possesses once precomputed winning 4-cell windows and center-first move ordering make branch pruning effective. Increasing a single integer parameter (`depth`) steadily turns raw CPU evaluations into stronger tactical play without encoding any opening heuristic or board intuition. Even more striking, doubling the budget per move shifts the entire outcome distribution smoothly rather than saturating at human design limits.

<!-- leetllm: test, output=show -->
```python title="Connect-Four search depth overtakes a domain heuristic" file="01-connect4-search-crossover.py"
ROWS, COLS = 5, 6
ORDER = (2, 3, 1, 4, 0, 5)
WINDOWS = (
    [[(r, c + k) for k in range(4)] for r in range(ROWS) for c in range(COLS - 3)]
    + [[(r + k, c) for k in range(4)] for r in range(ROWS - 3) for c in range(COLS)]
    + [[(r + k, c + k) for k in range(4)] for r in range(ROWS - 3) for c in range(COLS - 3)]
    + [[(r + k, c - k) for k in range(4)] for r in range(ROWS - 3) for c in range(3, COLS)]
)


def has_four(board, player):
    return any(all(board[r][c] == player for r, c in win) for win in WINDOWS)


def domain_heuristic(board, me):
    opp = -me
    score = sum(2.0 for r in range(ROWS) if board[r][2] == me or board[r][3] == me)
    for win in WINDOWS:
        m = sum(1 for r, c in win if board[r][c] == me)
        o = sum(1 for r, c in win if board[r][c] == opp)
        if m == 4:
            return 1000.0
        if o == 4:
            return -1000.0
        if o == 0:
            score += (0.0, 1.0, 6.0, 25.0)[m]
        elif m == 0:
            score -= (0.0, 1.0, 6.0, 28.0)[o]
    return score


def legal_moves(board):
    return [c for c in ORDER if board[0][c] == 0]


def drop_piece(board, col, player):
    for r in range(ROWS - 1, -1, -1):
        if board[r][col] == 0:
            board[r][col] = player
            return r
    raise ValueError("Column is full")


def alphabeta(board, depth, alpha, beta, turn, me, nodes):
    nodes[0] += 1
    if has_four(board, me):
        return 100.0 + depth
    if has_four(board, -me):
        return -100.0 - depth
    moves = legal_moves(board)
    if not moves or depth == 0:
        return 0.0
    if turn == me:
        val = -1e9
        for col in moves:
            r = drop_piece(board, col, turn)
            val = max(val, alphabeta(board, depth - 1, alpha, beta, -turn, me, nodes))
            board[r][col] = 0
            alpha = max(alpha, val)
            if alpha >= beta:
                break
        return val
    val = 1e9
    for col in moves:
        r = drop_piece(board, col, turn)
        val = min(val, alphabeta(board, depth - 1, alpha, beta, -turn, me, nodes))
        board[r][col] = 0
        beta = min(beta, val)
        if alpha >= beta:
            break
    return val


def search_move(board, depth, me):
    nodes = [0]
    best_col, best_val = None, -1e9
    for col in legal_moves(board):
        r = drop_piece(board, col, me)
        val = alphabeta(board, depth - 1, -1e9, 1e9, -me, me, nodes)
        board[r][col] = 0
        if val > best_val:
            best_val, best_col = val, col
    return best_col, nodes[0]


def heuristic_move(board, me):
    best_col, best_val = None, -1e9
    for col in legal_moves(board):
        r = drop_piece(board, col, me)
        val = domain_heuristic(board, me)
        board[r][col] = 0
        if val > best_val:
            best_val, best_col = val, col
    return best_col


OPENINGS = [(0, 1), (1, 2), (2, 3), (3, 1), (4, 2), (5, 2)]
for depth in range(1, 7):
    total_score, total_nodes = 0.0, 0
    for c1, c2 in OPENINGS:
        for search_side in (1, -1):
            board = [[0] * COLS for _ in range(ROWS)]
            drop_piece(board, c1, 1)
            drop_piece(board, c2, -1)
            turn = 1
            while True:
                if turn == search_side:
                    col, nd = search_move(board, depth, turn)
                    total_nodes += nd
                else:
                    col = heuristic_move(board, turn)
                drop_piece(board, col, turn)
                if has_four(board, turn):
                    total_score += 1.0 if turn == search_side else 0.0
                    break
                if not legal_moves(board):
                    total_score += 0.5
                    break
                turn = -turn
    games = len(OPENINGS) * 2
    print(f"depth={depth} score={total_score / games:.3f} avg_nodes={total_nodes / games:.0f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
depth=1 score=0.000 avg_nodes=26
depth=2 score=0.583 avg_nodes=268
depth=3 score=0.667 avg_nodes=621
depth=4 score=0.667 avg_nodes=2132
depth=5 score=0.667 avg_nodes=4620
depth=6 score=0.750 avg_nodes=14015
```
<!-- leetllm: output:end -->

Every ply of lookahead compounds search coverage without rewriting the evaluator. A human tuning weights for two-in-a-row versus three-in-a-row threats must anticipate every tactical motif upfront, whereas alpha-beta search turns extra evaluations directly into deeper forced calculation.

> **Key insight:** When hardware speeds up tenfold, a fixed heuristic merely finishes slightly faster, while a depth-bounded search climbs to a fundamentally higher quality curve.

## Representation learning versus fixed features

Search is only half of Sutton's argument; the other half is **learning representations directly from data** instead of freezing human feature sets. Classical pattern recognition asked practitioners to craft polynomial interactions, n-gram templates, or texture filters and then fit a linear model on top. Those fixed feature maps make training convex and fast when labeled samples are scarce, yet their representational ceiling is baked in the day the engineer picks the basis.[^krizhevsky2012] Consider classifying points drawn from a smooth nonlinear radial-and-angular pattern $y(x_1, x_2) = \mathbb{I}[\sin(3.2 r) + 0.55 \cos(4\theta) > 0]$, where $r = \sqrt{x_1^2 + x_2^2}$ and $\theta = \operatorname{atan2}(x_2, x_1)$. A ridge-regularized linear classifier over fixed degree-2 polynomials $\phi(x) = [1, x_1, x_2, x_1^2, x_1 x_2, x_2^2]$ can capture ellipses and parabolas, whereas a two-hidden-layer multilayer perceptron (MLP) trained with AdamW learns its own nonlinear basis functions directly from raw $(x_1, x_2)$ coordinates.[^mnih2015]

<!-- leetllm: test, deps=torch,numpy, output=show -->
```python title="Fixed quadratic basis hits a ceiling while a learned MLP scales" file="02-mlp-vs-fixed-features.py"
import numpy as np
import torch
import torch.nn as nn

rng = np.random.default_rng(7)


def make_dataset(n):
    x = rng.uniform(-1.5, 1.5, size=(n, 2)).astype(np.float32)
    r = np.sqrt(x[:, 0] ** 2 + x[:, 1] ** 2)
    theta = np.arctan2(x[:, 1], x[:, 0])
    y = ((np.sin(3.2 * r) + 0.55 * np.cos(4.0 * theta)) > 0).astype(np.float32)
    return x, y


def poly2_features(x):
    return np.column_stack(
        [np.ones(len(x)), x[:, 0], x[:, 1], x[:, 0] ** 2, x[:, 0] * x[:, 1], x[:, 1] ** 2]
    ).astype(np.float32)


x_test, y_test = make_dataset(2000)

for n_train in (40, 120, 400, 1600):
    x_tr, y_tr = make_dataset(n_train)

    phi_tr = poly2_features(x_tr)
    phi_te = poly2_features(x_test)
    w = np.linalg.solve(phi_tr.T @ phi_tr + 0.1 * np.eye(phi_tr.shape[1]), phi_tr.T @ y_tr)
    acc_fixed = float(np.mean((phi_te @ w > 0.5) == y_test))

    torch.manual_seed(42)
    net = nn.Sequential(nn.Linear(2, 64), nn.GELU(), nn.Linear(64, 64), nn.GELU(), nn.Linear(64, 1))
    opt = torch.optim.AdamW(net.parameters(), lr=8e-3, weight_decay=1e-4)
    xt = torch.from_numpy(x_tr)
    yt = torch.from_numpy(y_tr).unsqueeze(1)
    for _ in range(220):
        opt.zero_grad()
        loss = nn.functional.binary_cross_entropy_with_logits(net(xt), yt)
        loss.backward()
        opt.step()

    with torch.no_grad():
        acc_mlp = float(((net(torch.from_numpy(x_test)).squeeze(1) > 0).numpy() == y_test).mean())

    print(f"n={n_train:4d} fixed_poly2={acc_fixed:.3f} learned_mlp={acc_mlp:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
n=  40 fixed_poly2=0.880 learned_mlp=0.897
n= 120 fixed_poly2=0.916 learned_mlp=0.950
n= 400 fixed_poly2=0.914 learned_mlp=0.982
n=1600 fixed_poly2=0.908 learned_mlp=0.989
```
<!-- leetllm: output:end -->

Going from `120` to `1,600` training points brings no progress to the fixed quadratic basis (`0.916` to `0.908`), leaving an error floor near `9%` that more data cannot break through. Over the exact same jump in sample size, gradient descent over a general GELU network pushes held-out accuracy from `0.950` to `0.989`, cutting error roughly ninefold compared to the fixed basis because optimization sculpts arbitrary piecewise curves out of raw coordinates. If the task shifts tomorrow to higher spatial frequencies, no engineer has to derive cubic or Fourier basis terms by hand because additional labeled examples reshape the hidden weights automatically.

## Dense Transformer training compute and scaling laws

Modern foundation models push that representation-learning dynamic to web scale. Before choosing how many parameters $N$ to train on how many tokens $D$, engineers need an accurate FLOPs accounting formula. For a dense decoder-only Transformer whose linear projections dominate embedding lookups and attention softmax overhead, one forward pass through all $N$ parameters requires roughly two floating-point operations per parameter per token (one multiply and one add for every weight in $y = Wx$).[^kaplan2020][^hoffmann2022] During training, backpropagation adds two more matrix multiplications per linear layer: one to propagate activation gradients backward (`2N` FLOPs) and one to accumulate parameter gradients (`2N` FLOPs). Summing those three passes gives the standard training compute approximation for $N$ non-embedding parameters and $D$ tokens:[^kaplan2020][^hoffmann2022]

$$
\begin{aligned}
C_{\text{train}} &\approx 6ND \\
L(N, D) &= E + \frac{A}{N^\alpha} + \frac{B}{D^\beta}
\end{aligned}
$$

Kaplan et al. (2020) initially fit power laws suggesting that at a fixed compute budget $C$, most extra compute should expand parameter count $N$ faster than token count $D$ ($N \propto C^{0.73}$, $D \propto C^{0.27}$), producing undertrained giant models.[^kaplan2020] Hoffmann et al. (2022) revisited that fit in the Chinchilla study by tuning learning-rate cosine schedules individually for each training horizon and fitting the additive IsoFLOP surface above ($E = 1.69$, $A = 406.4$, $\alpha = 0.34$, $B = 410.7$, $\beta = 0.28$), showing that parameters and tokens should scale nearly in lockstep at roughly 20 tokens per parameter in the $10^{22}$–$10^{24}$ FLOP range, with small shifts determined by $\alpha > \beta$.[^hoffmann2022] Notice how evaluating this analytical IsoFLOP surface across compute budgets yields concrete model-versus-data trade-offs directly in NumPy.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="Chinchilla IsoFLOP optimal parameter-to-token allocation" file="03-chinchilla-compute-allocation.py"
import numpy as np

E, A, alpha, B, beta = 1.69, 406.4, 0.34, 410.7, 0.28

for compute in (1e21, 1e22, 1e23):
    n_grid = np.geomspace(1e7, compute / 6e8, 2000)
    d_grid = compute / (6.0 * n_grid)
    losses = E + A / (n_grid**alpha) + B / (d_grid**beta)
    idx = int(np.argmin(losses))
    n_opt = float(n_grid[idx])
    d_opt = float(d_grid[idx])
    print(
        f"C={compute:.0e} N_opt={n_opt:.2e} D_opt={d_opt:.2e} "
        f"tokens_per_param={d_opt / n_opt:.1f} L_min={losses[idx]:.4f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
C=1e+21 N_opt=1.83e+09 D_opt=9.11e+10 tokens_per_param=49.8 L_min=2.3289
C=1e+22 N_opt=5.18e+09 D_opt=3.22e+11 tokens_per_param=62.2 L_min=2.1386
C=1e+23 N_opt=1.46e+10 D_opt=1.14e+12 tokens_per_param=78.0 L_min=2.0050
```
<!-- leetllm: output:end -->

Every tenfold increase in pretraining FLOPs lowers the parametric cross-entropy floor smoothly without architectural heroics. Crucially, the exact optimal ratio shifts with scale because the parameter exponent $\alpha = 0.34$ exceeds the data exponent $\beta = 0.28$ in Hoffmann's third fitting approach, explaining why empirical token-to-parameter ratios depend heavily on which compute regime and IsoFLOP slice a team fits.[^hoffmann2022] That single empirical curve replaced countless hand-tuned heuristics about vocabulary capacity and hidden layer depth with a concrete resource-allocation equation.

## Inference-aware overtraining and lifetime compute

Chinchilla minimizes held-out validation loss for a single training budget, ignoring what happens after the weights ship. Once deployed, every prompt and generated token triggers a forward pass (`2N` FLOPs per token, neglecting KV-cache bandwidth bottlenecks). If an engineering organization expects to serve $Q$ total tokens across a model's operational lifetime, total compute combines training and inference via $C_{\text{lifetime}}(Q) = 6ND + 2NQ$. That linear serving term explains why open-weight releases such as Llama 3 intentionally train compact parameter counts (`8B` or `3B`) on massive corpora well beyond Chinchilla ratios (`15T` tokens, exceeding 1,800 tokens per parameter for `8B`).[^dubey2024] Paying extra training FLOPs once on the training cluster shrinks `2N` permanently on every serving GPU downstream, turning training compute into inference efficiency.

<figure>
  <img src="illustrations/_generated/train_inference_compute_split_light.png" alt="Total lifetime compute FLOPs equal 6ND for training plus 2NQ for serving Q tokens. A 7B model trained on 140B tokens starts lower at 5.88 zettaFLOPs than a 3B model overtrained on 400B tokens at 7.20 zettaFLOPs, but crosses over at 165B served tokens (8.19 zettaFLOPs) and costs 12.88 vs 10.20 zettaFLOPs at 500B served tokens." />
  <figcaption>Compare a Chinchilla-proportioned 7B model (140B training tokens, 5.88 zettaFLOPs upfront) against an overtrained 3B model (400B training tokens, 7.20 zettaFLOPs upfront). Once serving traffic passes 165B tokens, the smaller overtrained model pulls permanently ahead in total lifetime compute.</figcaption>
</figure>

Solving for the exact break-even traffic volume sets the two lifetime curves equal:

$$
Q^* = \frac{6(N_{\text{small}} D_{\text{small}} - N_{\text{large}} D_{\text{large}})}{2(N_{\text{large}} - N_{\text{small}})}
$$

For our `7B / 140B` baseline versus the `3B / 400B` overtrained candidate, the upfront difference of $1.32 \times 10^{21}$ training FLOPs divided by the $8 \times 10^9$ FLOPs saved on every served token equals exactly $165 \times 10^9$ served tokens. Below that volume, the Chinchilla-sized `7B` model uses less cumulative compute because training dominates the budget. Running the break-even sweep across served volumes shows how quickly higher inference traffic flips that upfront advantage toward the overtrained smaller architecture.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="Lifetime compute crossover between Chinchilla-sized and overtrained models" file="04-lifetime-serving-breakeven.py"
import numpy as np

n_7b, d_7b = 7e9, 140e9
n_3b, d_3b = 3e9, 400e9

q_crossover = (6 * n_3b * d_3b - 6 * n_7b * d_7b) / (2 * (n_7b - n_3b))
print(f"exact_crossover={q_crossover / 1e9:.1f}B tokens")

for q_b in (0, 50, 100, 165, 300, 500):
    q = q_b * 1e9
    total_7b = (6 * n_7b * d_7b + 2 * n_7b * q) / 1e21
    total_3b = (6 * n_3b * d_3b + 2 * n_3b * q) / 1e21
    print(f"Q={q_b:3d}B 7B_total={total_7b:.2f}ZF 3B_total={total_3b:.2f}ZF")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
exact_crossover=165.0B tokens
Q=  0B 7B_total=5.88ZF 3B_total=7.20ZF
Q= 50B 7B_total=6.58ZF 3B_total=7.50ZF
Q=100B 7B_total=7.28ZF 3B_total=7.80ZF
Q=165B 7B_total=8.19ZF 3B_total=8.19ZF
Q=300B 7B_total=10.08ZF 3B_total=9.00ZF
Q=500B 7B_total=12.88ZF 3B_total=10.20ZF
```
<!-- leetllm: output:end -->

Equal FLOPs alone do not ensure identical quality, latency, or KV-cache footprint on every prompt. Teams first match target quality on held-out evaluations across parameter-token pairs, then minimize lifetime serving cost within their latency budget.[^dubey2024]

> **Key insight:** Overtraining a smaller model pays extra FLOPs once on the training cluster to shrink the `2N` per-token cost permanently across every serving GPU downstream.

Once inference budgets become an explicit design knob, the same compute-allocation lens also explains why spending extra compute *per query* at test time can rival training a much larger model.

## Test-time compute, search, and verifiable objectives

Over the past few years, the Bitter Lesson's search axis returned to center stage inside large language models. Instead of forcing a network to emit its final answer in one greedy pass, reasoning systems such as OpenAI o1 and DeepSeek-R1 spend extra inference FLOPs generating long chains of thought, sampling multiple solution trajectories, or guiding tree search with a verifier before answering.[^openai_learning_reasoning_2024][^deepseekai2025][^snell2024scaling_test_time] On verifiable math, coding, and formal proof tasks, scaling test-time compute trades inference FLOPs directly for higher solve rates, letting smaller models surpass much larger single-pass models on hard problems.[^snell2024][^cobbe2021][^lightman2023] Yet extra search brings a sharp failure mode whenever the selection signal diverges from ground truth. Under **Best-of-$N$** sampling, drawing $k$ candidate completions amplifies whatever objective ranks them: an exact unit test or proof checker lifts true pass rates cleanly toward `1.0`, whereas maximizing an imperfect proxy reward score eventually selects for reward hacking (Goodhart's law), causing true correctness to peak and then fall as $k$ grows.

<figure>
  <img src="illustrations/_generated/bitter_lesson_decision_matrix_light.png" alt="Best-of-N test-time compute scaling under an exact verifier versus a flawed proxy reward model across 2,000 simulated tasks: an exact verifier climbs from 0.226 at k=1 to 0.653 at k=4, 0.985 at k=16, and 1.000 at k=64 and k=256, whereas maximizing a proxy reward peaks at 0.453 at k=16 before degrading to 0.419 at k=256 due to Goodhart overoptimization." />
  <figcaption>Best-of-N pass rate across 2,000 simulated tasks as test-time sample budget k expands. Exact verification scales monotonically to 1.000, whereas maximizing a flawed proxy reward peaks at k=16 (0.453) and falls to 0.419 at k=256.</figcaption>
</figure>

Let us run that exact simulation in NumPy to measure how fast an uncalibrated proxy breaks down when extreme tail draws exploit loopholes in the reward function.[^lightman2023][^openai2026reasoning] By tracking both oracle verification and flawed proxy maximization across the same pool of `2,000` simulated tasks as $k$ sweeps from `1` to `256`, the code exposes the exact divergence between true capability and Goodhart overoptimization. Notice how the proxy curve actually tracks the true solver until $k=16$, making proxy failures notoriously easy to miss in small evaluations.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="Test-time Best-of-N under an exact verifier vs Goodhart proxy" file="05-test-time-search-goodhart.py"
import numpy as np

rng = np.random.default_rng(11)
n_tasks = 2000

for k in (1, 4, 16, 64, 256):
    latent_skill = rng.normal(0.0, 1.0, size=(n_tasks, k))
    style_exploit = rng.normal(0.0, 1.0, size=(n_tasks, k))
    proxy_reward = 0.65 * latent_skill + 0.90 * style_exploit
    true_solved = (latent_skill - 0.95 * np.maximum(0.0, style_exploit - 1.0) > 0.70).astype(float)

    best_oracle = float(true_solved[np.arange(n_tasks), np.argmax(true_solved + 1e-3 * latent_skill, axis=1)].mean())
    best_proxy = float(true_solved[np.arange(n_tasks), np.argmax(proxy_reward, axis=1)].mean())
    print(f"k={k:3d} oracle={best_oracle:.3f} proxy={best_proxy:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
k=  1 oracle=0.226 proxy=0.226
k=  4 oracle=0.653 proxy=0.399
k= 16 oracle=0.985 proxy=0.453
k= 64 oracle=1.000 proxy=0.427
k=256 oracle=1.000 proxy=0.419
```
<!-- leetllm: output:end -->

> **Common mistake:** Scaling Best-of-N sampling against a learned preference proxy without an executable check. The proxy often tracks true accuracy at small `k` (here up to `k=16`) before collapsing as extreme samples exploit reward loopholes.

When you add test-time compute, verifier reliability sets the ceiling on how much search stays constructive. Exact unit tests, deterministic compilers, and process-supervised step verifiers sustain far deeper search than vague scalar preference proxies.[^cobbe2021][^lightman2023][^deepseekai2024] Building trustworthy verification signals is therefore where engineering effort multiplies compute returns instead of fighting them.

## Where inductive bias and explicit structure still win

Misreading *The Bitter Lesson* to mean "never design anything" causes real engineering mistakes. Explicit structure remains indispensable in three regimes, even in Sutton's own later writing on continually learning agents:[^sutton2025]

1. **Architectural inductive bias:** Self-attention, causal masking, rotary positional embeddings, and grouped-query KV sharing govern how information routes across hardware at reasonable memory bandwidth; none hard-code task answers, yet all make general gradient scaling dramatically cheaper.
2. **Low-data and latency-constrained domains:** When only dozens of examples exist or inference must fit tight edge-device budgets, strong parametric priors or analytical solvers beat under-constrained networks on accuracy per FLOP.
3. **Hard rules and exact checks:** Cryptographic signatures, arithmetic rules, SQL schema validators, and permission checks enforce exact binary guarantees where approximate probability is the wrong tool at any model scale.

The practical synthesis is simple: encode symmetries, hardware-friendly structure, and exact rules into the substrate, build verifiable evaluation targets, and let general learning and search spend the compute discovering representations and strategies inside that space.[^sutton2019][^sutton2025] Before adding any heuristic, ask whether it supplies a durable structural property or merely patches today's compute shortage. Once that boundary is clear, the natural first representation bottleneck to study in language models is how raw text enters the network as tokens.

<!-- leetllm: mastery:start -->

## Check your intuition on search overoptimization

```checkpoint
Suppose a code-generation pipeline increases Best-of-N sampling from k=16 to k=256, selecting the final solution solely by highest score from a learned style-and-length reward model rather than running the test suite. Why can pass@1 correctness drop even though average chosen reward rises?
---
Drawing 256 samples exposes extreme outliers that maximize the proxy reward's loopholes (such as verbose comments or superficial formatting cues) while breaking subtle program logic, producing classic Goodhart overoptimization. Replacing or filtering selection with an executable unit-test verifier restores monotonic scaling with test-time compute.
```

<!-- leetllm: mastery:end -->

## Mastery Quiz

```mastery-quiz
[
  {
    "question": "In Rich Sutton's 2019 essay 'The Bitter Lesson', which two classes of general methods consistently turn orders-of-magnitude growth in computation into long-term performance gains?",
    "options": [
      "Hand-crafted domain taxonomies and sparse decision rules",
      "General learning from experience and scalable tree search",
      "Static polynomial basis maps and manual threshold tuning",
      "Symbolic grammar parsers with fixed feature extractors"
    ],
    "answer": "General learning from experience and scalable tree search",
    "explanation": "Sutton highlights learning (updating models from data or experience) and search (exploring and evaluating candidate trajectories) as the two methods whose effectiveness keeps compounding as raw hardware FLOPs grow exponentially."
  },
  {
    "question": "In the 5x6 Connect-Four experiment, why does depth-6 pure alpha-beta search reach a 0.750 match score against a one-ply tactical heuristic despite assigning 0.0 to every non-terminal board position?",
    "options": [
      "Alpha-beta updates human center-control weights after each finished match",
      "Six plies of lookahead reach forced tactical wins directly at terminal nodes",
      "One-ply heuristic evaluations skip checking terminal four-in-a-row states",
      "Alpha-beta pruning scores drawn endgames higher for deeper search trees"
    ],
    "answer": "Six plies of lookahead reach forced tactical wins directly at terminal nodes",
    "explanation": "Expanding the game tree six plies deep lets the searcher verify forced sequences leading to terminal +100/-100 states directly, overtaking shallow hand-tuned positional estimates without encoding strategic concepts."
  },
  {
    "question": "A dense Transformer pretraining run is planned with 10B parameters over 250B tokens using the standard C ≈ 6ND FLOPs approximation. If the team holds total training compute fixed and expands the model to 12.5B parameters, how many training tokens can it afford?",
    "options": [
      "312.5B tokens",
      "250B tokens",
      "200B tokens",
      "125B tokens"
    ],
    "answer": "200B tokens",
    "explanation": "Holding C = 6ND constant keeps the product N * D fixed: (10B * 250B) / 12.5B = 200B tokens. Increasing N under a fixed FLOP budget requires proportionally fewer training steps."
  },
  {
    "question": "Compare Model A (8B parameters trained on 160B tokens) and Model B (4B parameters trained on 500B tokens) under lifetime compute C_total = 6ND + 2NQ. At what volume of served tokens Q do their cumulative FLOPs cross?",
    "options": [
      "Q = 540B tokens",
      "Q = 270B tokens",
      "Q = 1,080B tokens",
      "Q = 135B tokens"
    ],
    "answer": "Q = 540B tokens",
    "explanation": "Model A starts with 6 * 8e9 * 160e9 = 7.68e21 FLOPs and Model B with 6 * 4e9 * 500e9 = 1.20e22 FLOPs, an upfront gap of 4.32e21 FLOPs. Serving Model B saves 2 * (8e9 - 4e9) = 8e9 FLOPs per token, so break-even occurs at 4.32e21 / 8e9 = 5.4e11 = 540B tokens."
  },
  {
    "question": "Why did Hoffmann et al. (2022) recommend training tokens roughly proportionally with parameter count compared to Kaplan et al. (2020)?",
    "options": [
      "Hoffmann et al. dropped attention layers, cutting backward pass work from 6ND to 2ND",
      "Kaplan et al. kept one long cosine decay schedule, misjudging short-horizon losses",
      "Hoffmann et al. trained models on synthetic game rollouts built by search trees",
      "Kaplan et al. used single-example batches that stalled parameter gradient norms"
    ],
    "answer": "Kaplan et al. kept one long cosine decay schedule, misjudging short-horizon losses",
    "explanation": "By tuning learning-rate decay endpoints to each token horizon and analyzing IsoFLOP curves and parametric fits jointly, the Chinchilla study found that optimal N and D grow nearly together (~20 tokens per parameter at Frontier compute scales) rather than favoring huge undertrained models."
  },
  {
    "question": "What happens in Best-of-N test-time search when candidates are ranked solely by an imperfect learned proxy reward instead of an exact verifier, as N grows from 16 to 256?",
    "options": [
      "True pass rate climbs toward 1.0 as rollouts exceed the base vocabulary size",
      "Tail optimization exploits proxy gaps, making true pass rate peak and decline",
      "Inference FLOPs drop to zero once rollout ranking picks a winning solution",
      "Variance across rollouts keeps proxy rewards aligned with exact pass rates"
    ],
    "answer": "Tail optimization exploits proxy gaps, making true pass rate peak and decline",
    "explanation": "Sampling hundreds of rollouts finds extreme candidates that score artificially high on proxy biases without solving the problem, degrading true accuracy once search pressure exceeds the verifier's fidelity."
  }
]
```

> **Next:** Continue to [BPE, WordPiece, and SentencePiece](/learn/tokenization-bpe-wordpiece-sentencepiece). Even general gradient learners first slice raw UTF-8 text into discrete vocabulary units; next, examine how subword tokenizers balance vocabulary size, sequence length, and out-of-vocabulary resilience without hand-written grammar rules.
