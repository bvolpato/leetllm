---
query: "Research packet for Reinforcement Learning Basics: Markov Decision Processes, discounted returns, Bellman equations, dynamic programming, Q-learning, SARSA, reward specification, policy gradients (REINFORCE, PPO, GRPO), and off-policy evaluation on a 3x4 cliff gridworld."
status: "completed"
---

# Research Notes: Reinforcement Learning Basics

## Running Domain Example: 3x4 Cliff Gridworld

- **Grid layout:** 3 rows by 4 columns (`r in {0, 1, 2}`, `c in {0, 1, 2, 3}`).
  - Row 0 (`(0,0)` to `(0,3)`): safe upper ridge.
  - Row 1: `(1,0)` start state, `(1,1)` and `(1,2)` cliff-edge cells, `(1,3)` pre-goal corner.
  - Row 2: `(2,0)`, `(2,1)`, `(2,2)` terminal cliff cells with reward `-50`; `(2,3)` terminal goal cell with reward `+20`.
- **Actions:** `Up`, `Right`, `Down`, `Left`. Moving into an outer boundary keeps the agent in place and pays `-1`. Standard non-terminal steps pay `-1`. Discount factor `gamma = 0.90`.
- **Deterministic dynamics (`slip = 0.0`):** Shortest path from `(1,0)` runs along the cliff edge (`Right, Right, Right, Down`), taking 4 steps for discounted return `11.87`. The 6-step upper ridge (`Up, Right, Right, Right, Down, Down`) yields `7.71`.
- **Stochastic dynamics (`slip = 0.20`):** Intended move succeeds with probability `0.80` and slips perpendicular left or right with probability `0.10` each. Risk of falling into the `-50` cliff flips the optimal policy on Row 1 from `Right` to `Up` (`V*(1,1) = 6.31`, `Q*((1,1), Up) = 6.31` vs `Q*((1,1), Right) = 1.59`), routing onto the safe upper ridge.
- **Model-free contrast:** Under deterministic transitions and `epsilon = 0.20` exploration, off-policy Q-learning converges to the optimal cliff-edge path (`Start Q[Right] = 11.87`), while on-policy SARSA accounts for exploratory falls and learns the safe upper ridge (`Start Q[Up] > Start Q[Right]`).

## Canonical Primary Sources

- **MDPs, Dynamic Programming, Monte Carlo, TD, SARSA, Policy Gradient Theorem, Importance Sampling:** Richard S. Sutton and Andrew G. Barto, *Reinforcement Learning: An Introduction* (2nd ed., 2018), [http://incompleteideas.net/book/the-book-2nd.html](http://incompleteideas.net/book/the-book-2nd.html).
- **Q-Learning Convergence:** Christopher J. C. H. Watkins and Peter Dayan, "Q-learning," *Machine Learning* 8 (1992): 279-292, [https://doi.org/10.1007/BF00992698](https://doi.org/10.1007/BF00992698).
- **REINFORCE Algorithm:** Ronald J. Williams, "Simple statistical gradient-following algorithms for connectionist reinforcement learning," *Machine Learning* 8 (1992): 229-256, [https://link.springer.com/article/10.1007/BF00992696](https://link.springer.com/article/10.1007/BF00992696).
- **Termination vs. Truncation:** Farama Foundation Gymnasium documentation, "Handling Time Limits," [https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/](https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/).
- **Policy Gradient Baselines:** OpenAI Spinning Up, "Part 3: Intro to Policy Optimization," [https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html](https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html).
- **PPO:** John Schulman et al., "Proximal Policy Optimization Algorithms" (2017), [https://arxiv.org/abs/1707.06347](https://arxiv.org/abs/1707.06347).
- **RLHF with PPO:** Long Ouyang et al., "Training Language Models to Follow Instructions with Human Feedback" (2022), [https://arxiv.org/abs/2203.02155](https://arxiv.org/abs/2203.02155).
- **GRPO:** Zhihong Shao et al., "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models" (2024), [https://arxiv.org/abs/2402.03300](https://arxiv.org/abs/2402.03300); DeepSeek-AI, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning" (2025), [https://arxiv.org/abs/2501.12948](https://arxiv.org/abs/2501.12948).
