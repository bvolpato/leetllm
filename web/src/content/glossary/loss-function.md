---
title: Loss function
aliases: ["objective function", "cost function", "training objective"]
importance: 98
---
A **loss function** maps a model's predictions and training targets to a scalar that optimization tries to minimize. That scalar defines what "better" means for one example, token, pair, batch, or full dataset. [Backpropagation](glossary://backpropagation) differentiates loss with respect to model parameters, and an [optimizer](glossary://optimizer) uses those [gradients](glossary://gradient) to update weights.

In machine-learning practice, **objective function**, **cost function**, **training objective**, and **loss function** are often used interchangeably. A precise distinction is sometimes useful: *loss* can mean data-fit penalty for one example, *cost* its aggregate over data, and *objective* complete scalar including regularization or constraints. Code and papers do not apply that distinction consistently, so read formula rather than relying on noun alone.

## Intuition

A model cannot optimize "be useful" directly. Training needs a number. Loss function converts behavior into that number: wrong class probability, next-token surprise, distance between embeddings, ranking violation, or policy penalty. Lower loss should correspond to behavior training process wants more often.

Loss expresses the training specification in mathematics. If the scalar rewards a shortcut, the model can learn that shortcut. Masking important examples or giving them too little weight weakens their contribution to training. Falling loss shows improvement on the chosen objective; evaluate product quality, safety, and factuality with their own task checks.

## Example

For next-token language modeling, target token is $y$ and model assigns it probability $p_\theta(y \mid x)$. Per-token cross-entropy loss is

$$
\mathcal{L}(\theta; x,y) = -\log p_\theta(y \mid x).
$$

If the correct token receives probability $0.8$, loss is about $0.223$. At probability $0.01$, loss is about $4.605$. For softmax cross-entropy, the gradient with respect to that token's logit is $p_y-1$, so its magnitude rises from $0.2$ to $0.99$. A larger loss does not imply an arbitrarily larger parameter gradient; that also depends on the model's Jacobian and the loss reduction.

A regularized training objective may add weight penalty:

$$
J(\theta) = \frac{1}{N}\sum_{i=1}^{N}\mathcal{L}(\theta;x_i,y_i) + \lambda R(\theta).
$$

Here per-example loss is $\mathcal{L}$, dataset cost is average, and complete objective is $J$. Many codebases still name all three `loss`.

## Why it matters here

Pretraining, supervised fine-tuning, DPO, PPO, GRPO, contrastive learning, and reward modeling differ largely in objective they optimize and data used to compute it. Debugging training starts by checking loss definition, masks, reductions, weights, and signs before tuning optimizer. A perfectly efficient distributed run can learn wrong behavior when objective is wrong.

## Related terms

- [Cross-entropy](glossary://cross-entropy)
- [Gradient](glossary://gradient)
- [Backpropagation](glossary://backpropagation)
- [Optimizer](glossary://optimizer)
- [Reward function](glossary://reward-function)
