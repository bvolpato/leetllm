---
{
  "id": "neural-networks-from-scratch",
  "title": "Neural Networks from Scratch",
  "slug": "neural-networks-from-scratch",
  "section": "Deep Learning Foundations",
  "category": "Model Architecture",
  "difficulty": "Easy",
  "order": 1,
  "coverImage": "illustrations/_generated/xor_feature_map_dark.png",
  "companies": [
    "Google",
    "Meta",
    "OpenAI",
    "Anthropic",
    "Microsoft",
    "Amazon",
    "Apple"
  ],
  "shortDescription": "Four points reveal why neural networks need hidden layers. Build a network, trace its gradients, train it in NumPy, and reproduce the same computation in PyTorch.",
  "keyConceptsTested": [
    "Weighted sums, biases, and sigmoid outputs",
    "XOR and learned nonlinear representations",
    "ReLU hidden units and complete forward passes",
    "Batched tensor shapes and parameter counts",
    "Binary cross-entropy and backpropagation",
    "NumPy training and PyTorch autograd",
    "Activation functions, initialization, and numerical stability"
  ]
}
---

Place four points at the corners of a square. Color the bottom-left and top-right corners blue, and the other two orange. Try to draw one straight line that puts both orange points on one side and both blue points on the other. Whichever way you turn the line, one corner ends up on the wrong side.

A small neural network can separate these points. Its hidden layer changes how the points are represented, making a distinction that was awkward in the original coordinates easy in the new ones. We will build that transformation by hand, follow one prediction through every multiplication, and then teach the network to find useful weights itself. The [vectors and matrices lesson](/learn/numpy-and-tensor-shapes) supplies the dot products; here those calculations become a model that learns.

## Four examples and a prediction rule

Our input is a pair of numbers, $x = [x_1, x_2]$. The target $y$ is `1` when exactly one input is `1`, and `0` when the inputs agree. This rule is called **exclusive or**, usually shortened to XOR:

| $x_1$ | $x_2$ | Target $y$ | Color |
|---:|---:|---:|---|
| 0 | 0 | 0 | Blue |
| 0 | 1 | 1 | Orange |
| 1 | 0 | 1 | Orange |
| 1 | 1 | 0 | Blue |

A **feature** is one number describing an example, so each point has two input features. A **model** takes those features and computes a prediction. During **training**, we compare predictions with targets and adjust the model's parameters to reduce the errors. These four examples are small enough that we can keep the entire dataset in view while doing the arithmetic.

XOR is useful because a network's hidden layer has real work to do. If every orange point were simply to the right of every blue point, a single weighted sum would suffice. The alternating corners force us to understand what an extra layer contributes.[^goodfellow2016]

## One neuron: add weighted inputs, then apply an activation

A neuron starts with a weighted sum and a bias:

$$
z = w_1 x_1 + w_2 x_2 + b.
$$

The weights $w_1$ and $w_2$ control how strongly each input affects the result. The bias $b$ shifts the result up or down for every input. Together they are adjustable knobs: turning a weight changes the influence of one feature, while turning the bias changes the starting point.

For example, choose $w_1 = 2$, $w_2 = -1$, and $b = -0.5$. At the orange point $x = [1,0]$, the result is $z = 2(1) - 1(0) - 0.5 = 1.5$. At the other orange point $[0,1]$, the same rule gives $z = -1.5$. One point receives a positive score and the other a negative one, even though we want the same label for both.

For binary classification, an output neuron commonly passes $z$ through the **sigmoid** function:

$$
p = \sigma(z) = \frac{1}{1 + e^{-z}}.
$$

Here $e$ is the base of the natural exponential, approximately $2.718$, and $p$ is the model's predicted probability of class `1`. Sigmoid turns a real-valued score into a number between zero and one: $\sigma(0)=0.5$, $\sigma(1.5)\approx0.818$, and $\sigma(-1.5)\approx0.182$. We call the score immediately before this binary probability mapping a **logit**. Predicting class `1` when $p \ge 0.5$ is equivalent to checking whether $z \ge 0$.

This NumPy example evaluates our neuron on all four points. Each row of `X` is one example, and `X @ w` computes its dot product with the same weights:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="one-neuron.py"
import numpy as np

X = np.array([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
y = np.array([0, 1, 1, 0])
w = np.array([2., -1.])
b = -0.5

logits = X @ w + b
probabilities = 1 / (1 + np.exp(-logits))
print("logits:     ", logits)
print("probability:", probabilities.round(3))
print("prediction: ", (probabilities >= 0.5).astype(int))
print("target:     ", y)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logits:      [-0.5 -1.5  1.5  0.5]
probability: [0.378 0.182 0.818 0.622]
prediction:  [0 0 1 1]
target:      [0 1 1 0]
```
<!-- leetllm: output:end -->

### Why changing the weights cannot solve XOR

The points where the neuron changes its prediction satisfy $w_1x_1+w_2x_2+b=0$. In two dimensions that equation describes a straight line, called the **decision boundary**. Changing the weights rotates or moves the line, and changing the bias slides it without changing its orientation. Sigmoid changes the scale of the score, but its `0.5` threshold still follows that same line.

We can also prove the difficulty directly. To classify both orange points correctly, we need $w_1+b\ge0$ and $w_2+b\ge0$. Adding those inequalities gives $w_1+w_2+2b\ge0$. To classify both blue points correctly, we need $b<0$ and $w_1+w_2+b<0$, whose sum gives $w_1+w_2+2b<0$. The two requirements contradict each other. No choice of three parameters can satisfy them all.

Adding another weighted sum without a nonlinear activation would leave the same limitation. For example, doubling an input and adding `1`, then tripling the result and subtracting `2`, is just $3(2x+1)-2=6x+1$. For vectors, two affine layers combine in exactly the same way:

$$
W_2(W_1x+b_1)+b_2=(W_2W_1)x+(W_2b_1+b_2).
$$

An **affine** transformation is a linear transformation plus a bias. However many affine layers we stack, their composition is another affine transformation. We need an operation between them that bends this relationship.

## Two hidden neurons change the geometry

The **rectified linear unit**, or **ReLU**, keeps positive inputs and replaces negative inputs with zero:

$$
\operatorname{ReLU}(z)=\max(0,z).
$$

Its graph has a hinge at zero. That hinge lets different parts of the input space follow different linear rules. We can use two ReLU neurons to detect the two ways the inputs disagree:

$$
h_1=\operatorname{ReLU}(x_1-x_2),
\qquad
h_2=\operatorname{ReLU}(x_2-x_1).
$$

The first neuron lights up when $x_1$ exceeds $x_2$; the second lights up when $x_2$ exceeds $x_1$. Both stay at zero when the inputs are equal. These values form a **hidden layer**: they are intermediate features computed inside the network, rather than input measurements or the final answer.

| Input $x$ | Difference $x_1-x_2$ | Hidden features $[h_1,h_2]$ | Target |
|---|---:|---|---:|
| `[0, 0]` | 0 | `[0, 0]` | 0 |
| `[0, 1]` | −1 | `[0, 1]` | 1 |
| `[1, 0]` | 1 | `[1, 0]` | 1 |
| `[1, 1]` | 0 | `[0, 0]` | 0 |

The blue points now occupy the same location, `[0,0]`. The two orange points lie along the positive axes. A single line, $h_1+h_2=0.5$, separates the colors in this new coordinate system. The hidden layer has made a useful representation of the data.

<figure>
  <img src="illustrations/_generated/xor_feature_map_dark.png" alt="The four XOR points in input space map through h1=max(0,x1-x2) and h2=max(0,x2-x1). The two blue points both map to the origin in hidden space, while orange points map to (1,0) and (0,1). The line h1+h2=0.5 separates the colors in hidden space." />
  <figcaption>Follow each point from its input coordinates to its two hidden features. Both blue points reach the origin, while the orange points remain on opposite axes. The hidden-space line h₁ + h₂ = 0.5 now separates them.</figcaption>
</figure>

It helps to picture the hidden layer as changing the measuring instruments. The original coordinates tell us the two input values; the new coordinates measure which input exceeds the other, and by how much. A network learns such measurements by adjusting its hidden weights. For XOR we can choose them ourselves and see why they work before asking an optimizer to discover them.

### Complete the network with an output neuron

Choose output weights `4` and `4` and output bias `−2`:

$$
z_2=4h_1+4h_2-2,
\qquad
p=\sigma(z_2).
$$

At either blue point, $h_1+h_2=0$, so $z_2=-2$ and $p\approx0.119$. At either orange point, $h_1+h_2=1$, so $z_2=2$ and $p\approx0.881$. A `0.5` threshold gives the correct label for all four points. We have built a **feedforward neural network**: values move from inputs through hidden units to an output, with no feedback loop in this calculation.

For the point `[1,0]`, the entire forward pass is:

$$
\begin{aligned}
z_{1,1}&=1(1)-1(0)=1, & h_1&=\max(0,1)=1,\\
z_{1,2}&=-1(1)+1(0)=-1, & h_2&=\max(0,-1)=0,\\
z_2&=4(1)+4(0)-2=2, & p&=\sigma(2)\approx0.881.
\end{aligned}
$$

<figure>
  <img src="illustrations/_generated/neural_network_anatomy_dark.png" alt="A two-input, two-hidden-unit, one-output network traces x=(1,0). Hidden pre-activations are 1 and -1; ReLU produces 1 and 0. Output weights 4 and 4 and bias -2 produce logit 2 and sigmoid probability 0.881. The inactive second hidden path is dimmed." />
  <figcaption>For x = [1,0], the first hidden neuron contributes 4 to the output, while ReLU switches off the second path. The output bias subtracts 2, leaving a logit of 2 and a probability of 0.881.</figcaption>
</figure>

```checkpoint
What happens to the prediction at x = [1,1] if we remove the two ReLUs but keep every weight unchanged?
---
The two hidden differences are both zero, so this particular point still gets p = sigmoid(−2) ≈ 0.119. But for every input the differences now cancel: (x₁−x₂)+(x₂−x₁)=0. The network predicts the same 0.119 for all four points. ReLU prevents the positive difference from being canceled by the negative one.
```

## Compute a whole batch with matrices

A layer with several neurons is a collection of dot products. Put one neuron's weights in each row of a matrix, and matrix multiplication evaluates the layer. We will use the same layout as PyTorch's `Linear`: weights have shape `(output_features, input_features)`.[^pytorchLinear2026]

For our network, the two rows of $W_1$ compute the two differences, and the one row of $W_2$ combines them:

$$
W_1=\begin{bmatrix}1&-1\\-1&1\end{bmatrix},
\quad b_1=\begin{bmatrix}0&0\end{bmatrix},
\quad W_2=\begin{bmatrix}4&4\end{bmatrix},
\quad b_2=-2.
$$

Stack $B$ input examples as the rows of $X$. Since each example is now a row, multiply by the transpose of each weight matrix:

$$
Z_1=XW_1^\top+b_1,
\qquad H=\operatorname{ReLU}(Z_1),
\qquad Z_2=HW_2^\top+b_2,
\qquad P=\sigma(Z_2).
$$

The superscript $\top$ transposes rows and columns. The bias vector is added to every row by broadcasting. Notice that the batch size stays in the first dimension throughout: each example gets its own activations, while all examples share the same parameters.

| Quantity | Shape | Meaning |
|---|---|---|
| $X$ | `(B, 2)` | Two coordinates for each input |
| $W_1$ | `(2, 2)` | Two hidden neurons, each with two weights |
| $b_1$ | `(2,)` | One bias per hidden neuron |
| $H$ | `(B, 2)` | Two computed features for each input |
| $W_2$ | `(1, 2)` | One output neuron reading two hidden features |
| $b_2$ | `(1,)` | One output bias |
| $P$ | `(B, 1)` | One predicted probability per input |

This complete program computes all four predictions and prints the hidden representation. Compare each row of the output with the table above:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="xor-forward-pass.py"
import numpy as np

X = np.array([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
W1 = np.array([[1., -1.], [-1., 1.]])
b1 = np.zeros(2)
W2 = np.array([[4., 4.]])
b2 = np.array([-2.])

Z1 = X @ W1.T + b1
H = np.maximum(0, Z1)
logits = H @ W2.T + b2
probabilities = 1 / (1 + np.exp(-logits))

print("hidden features:\n", H)
print("probabilities:", probabilities[:, 0].round(3))
print("predictions:  ", (probabilities[:, 0] >= 0.5).astype(int))
print("shapes:", X.shape, H.shape, probabilities.shape)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
hidden features:
 [[0. 0.]
 [0. 1.]
 [1. 0.]
 [0. 0.]]
probabilities: [0.119 0.881 0.881 0.119]
predictions:   [0 1 1 0]
shapes: (4, 2) (4, 2) (4, 1)
```
<!-- leetllm: output:end -->

A dense layer with $n_{\text{in}}$ inputs and $n_{\text{out}}$ outputs has $n_{\text{in}}n_{\text{out}}+n_{\text{out}}$ parameters: one weight for every connection and one bias per output. Our first layer has $2\times2+2=6$, and our second has $2\times1+1=3$, giving **nine trainable parameters**. Processing a thousand examples changes the amount of computation and activation storage, but still uses the same nine numbers.

## Turn a prediction into a learning signal

We chose the weights above by inspecting the four points. For images, text, or hundreds of input features, we want training to find useful weights from labeled examples. To do that, we need a number that measures how well a prediction matches its target: a **loss**.

For a binary target $y$ and predicted probability $p$, **binary cross-entropy** is

$$
\ell(p,y)=-y\log p-(1-y)\log(1-p).
$$

The logarithm is natural. When the target is `1`, the formula selects $-\log p$; a high probability gives a small loss. When the target is `0`, it selects $-\log(1-p)$; a low probability gives a small loss. For example, assigning `0.9` to the correct class costs about `0.105`, whereas assigning `0.1` costs about `2.303`. Confident mistakes are expensive.

For our orange point `[1,0]`, $y=1$ and $p=0.881$, so the loss is about $0.127$. Although the thresholded label is already correct, increasing its probability would reduce the loss further. This smooth objective gives the optimizer a direction even when the discrete prediction does not change.

The derivative of this loss with respect to the output logit has a particularly simple form:

$$
\delta_2=\frac{\partial\ell}{\partial z_2}=p-y.
$$

The symbol $\partial\ell/\partial z_2$ means the rate at which the loss changes when we nudge $z_2$, holding the other inputs fixed. For our positive example, $\delta_2=0.881-1=-0.119$. The negative sign says that increasing the logit decreases the loss. For a negative example with the same probability, the derivative would be `+0.881`, pushing the logit downward instead.

Here is why the sigmoid and cross-entropy combine so neatly. The chain rule multiplies the loss's sensitivity to $p$ by sigmoid's sensitivity to $z_2$:

$$
\frac{\partial\ell}{\partial p}=\frac{p-y}{p(1-p)},
\qquad
\frac{\partial p}{\partial z_2}=p(1-p),
\qquad
\frac{\partial\ell}{\partial z_2}=p-y.
$$

The intermediate factors cancel. We can now send this one error signal backward through the network to learn how each parameter should move.

## Backpropagation follows the same connections backward

**Backpropagation** applies the chain rule to a computation graph, working backward from the loss and reusing intermediate results.[^rumelhart1986] Each operation receives a sensitivity from the operation after it, then multiplies by its own local derivative. You can think of it as asking, at each connection, “If this value moved a little, how much of that movement would reach the loss?”

Start with the output equation $z_2=v_1h_1+v_2h_2+b_2$, where $v_1=v_2=4$. A small change in $v_1$ changes $z_2$ by $h_1$ times as much. Multiplying by the output sensitivity gives:

$$
\frac{\partial\ell}{\partial v_j}=\delta_2h_j,
\qquad
\frac{\partial\ell}{\partial b_2}=\delta_2.
$$

On our `[1,0]` example, $h=[1,0]$. The output-weight gradients are therefore `[-0.119, 0]`, and the output-bias gradient is `−0.119`. The inactive second feature contributes nothing to the output-weight update for this example.

The hidden features receive sensitivity through their outgoing weights:

$$
\frac{\partial\ell}{\partial h_j}=\delta_2v_j.
$$

Both outgoing weights are `4`, so both hidden sensitivities are approximately `−0.477`. Now pass them through ReLU. A positive pre-activation has derivative `1`, so the first unit passes its sensitivity through. A negative pre-activation has derivative `0`, so the second unit stops it. Our implementation also uses derivative zero exactly at the hinge.

Finally, the first hidden pre-activation is $z_{1,1}=w_{1,1}x_1+w_{1,2}x_2+b_{1,1}$. Multiply its sensitivity by each input to obtain the weight gradients. Since $x=[1,0]$, the first row of $W_1$ receives `[-0.477, 0]`; the second row receives `[0,0]`. The hidden biases receive `[-0.477,0]`.

<figure>
  <img src="illustrations/_generated/tiny_forward_pass_trace_dark.png" alt="The loss gradient -0.119 flows backward from the output to the first hidden unit through weight 4, becoming -0.477. The second unit has a negative pre-activation, so its ReLU derivative is zero and that branch's gradient stops. Multiplication by input (1,0) gives first-row weight gradients (-0.477,0)." />
  <figcaption>The backward pass reuses the forward values. The active first path carries the loss gradient through its weight and ReLU; the inactive second path contributes zero to the first-layer gradients for this example.</figcaption>
</figure>

### Take one gradient step

**Gradient descent** subtracts a small multiple of each gradient from its parameter:

$$
\theta_{\text{new}}=\theta_{\text{old}}-\eta\frac{\partial\ell}{\partial\theta}.
$$

Here $\theta$ stands for any weight or bias, and $\eta$ is the **learning rate**. With $\eta=0.1$, the first output weight changes from `4` to about `4.0119`. Its gradient was negative, so subtraction increases the weight. The first hidden weight and hidden bias also increase, strengthening the active path for this orange point.

The following program computes all these gradients, updates the parameters together, and evaluates the same example again. The forward and backward lines correspond directly to the equations we just followed:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="one-backward-pass.py"
import numpy as np

X = np.array([[1., 0.]])
y = np.array([[1.]])
W1 = np.array([[1., -1.], [-1., 1.]])
b1 = np.zeros(2)
W2 = np.array([[4., 4.]])
b2 = np.array([-2.])

Z1 = X @ W1.T + b1
H = np.maximum(0, Z1)
logits = H @ W2.T + b2
p = 1 / (1 + np.exp(-logits))
loss = np.mean(np.logaddexp(0, logits) - y * logits)

dZ2 = p - y
dW2, db2 = dZ2.T @ H, dZ2.sum(axis=0)
dZ1 = (dZ2 @ W2) * (Z1 > 0)
dW1, db1 = dZ1.T @ X, dZ1.sum(axis=0)

print("dW2:", dW2.round(3), "db2:", db2.round(3))
print("dW1:\n", dW1.round(3))
print("db1:", db1.round(3))

learning_rate = 0.1
W1 -= learning_rate * dW1
b1 -= learning_rate * db1
W2 -= learning_rate * dW2
b2 -= learning_rate * db2
new_logits = np.maximum(0, X @ W1.T + b1) @ W2.T + b2
new_loss = np.mean(np.logaddexp(0, new_logits) - y * new_logits)
print(f"loss: {loss:.4f} -> {new_loss:.4f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
dW2: [[-0.119  0.   ]] db2: [-0.119]
dW1:
 [[-0.477  0.   ]
 [ 0.     0.   ]]
db1: [-0.477  0.   ]
loss: 0.1269 -> 0.0863
```
<!-- leetllm: output:end -->

The code evaluates cross-entropy directly from logits using $\log(1+e^z)-yz$, with NumPy's `logaddexp` computing the logarithmic sum stably. It is the same loss we derived from probabilities. PyTorch provides this combined calculation as `BCEWithLogitsLoss`.[^pytorchBCEWithLogits2026]

### Average the gradients over a batch

For several examples, minimize the mean loss $\mathcal L=\frac{1}{B}\sum_i\ell_i$. The output sensitivity becomes $(P-Y)/B$; everything else follows the same connections. Matrix multiplication collects the contributions from all examples:

$$
\begin{aligned}
D_2&=(P-Y)/B,\\
\nabla_{W_2}\mathcal L&=D_2^\top H,
&\nabla_{b_2}\mathcal L&=\sum_iD_{2,i},\\
D_1&=(D_2W_2)\odot\mathbf 1_{Z_1>0},\\
\nabla_{W_1}\mathcal L&=D_1^\top X,
&\nabla_{b_1}\mathcal L&=\sum_iD_{1,i}.
\end{aligned}
$$

$D_2$ and $D_1$ are the output and hidden pre-activation sensitivities. The symbol $\odot$ means elementwise multiplication, and $\mathbf 1_{Z_1>0}$ is a mask containing `1` where ReLU was active and `0` elsewhere. The gradient symbol $\nabla_{W_1}$ collects all partial derivatives for the entries of $W_1$ into an array with the same shape as that matrix.

For example, two hidden rows `[2,0]` and `[1,3]`, with output sensitivities `−0.2` and `0.1`, contribute $-0.2[2,0]+0.1[1,3]=[-0.3,0.3]$ to the output weights. This sum is exactly what `D2.T @ H` computes. The transpose turns the batch dimension into the dimension being summed over.

## Let the network learn its own features

We now have everything needed for training: a forward pass, a loss, a backward pass, and an update rule. Initialize the weights with small random values, repeat those four steps, and watch the loss decrease. Random initialization gives hidden units different starting directions so they can learn different features.

The program below trains a two-hidden-unit network on XOR. The generator seed makes the run reproducible. Each epoch processes all four examples, computes their average gradient, and applies one update. We keep the intermediate arrays because backward propagation needs the inputs, hidden activations, and ReLU signs.

<!-- leetllm: test, deps=numpy, id=xor-training, output=show -->
```python title="train-xor-numpy.py"
import numpy as np

X = np.array([[0., 0.], [0., 1.], [1., 0.], [1., 1.]])
y = np.array([[0.], [1.], [1.], [0.]])
rng = np.random.default_rng(1)
W1 = rng.normal(0, 1, size=(2, 2))
b1 = np.full(2, 0.1)
W2 = rng.normal(0, 1, size=(1, 2))
b2 = np.zeros(1)
learning_rate = 0.1

for epoch in range(4001):
    Z1 = X @ W1.T + b1
    H = np.maximum(0, Z1)
    logits = H @ W2.T + b2
    p = np.exp(-np.logaddexp(0, -logits))
    loss = np.mean(np.logaddexp(0, logits) - y * logits)
    if epoch in (0, 100, 1000, 4000):
        print(f"epoch {epoch:4d}  loss={loss:.4f}")
    if epoch == 4000:
        break

    dZ2 = (p - y) / len(X)
    dW2, db2 = dZ2.T @ H, dZ2.sum(axis=0)
    dZ1 = (dZ2 @ W2) * (Z1 > 0)
    dW1, db1 = dZ1.T @ X, dZ1.sum(axis=0)

    W1 -= learning_rate * dW1
    b1 -= learning_rate * db1
    W2 -= learning_rate * dW2
    b2 -= learning_rate * db2

print("probabilities:", p[:, 0].round(3))
print("predictions:  ", (p[:, 0] >= 0.5).astype(int))
print("hidden weights:\n", W1.round(3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
epoch    0  loss=0.7464
epoch  100  loss=0.5769
epoch 1000  loss=0.0268
epoch 4000  loss=0.0044
probabilities: [0.007 0.998 0.998 0.007]
predictions:   [0 1 1 0]
hidden weights:
 [[-2.841  2.841]
 [ 2.914 -2.914]]
```
<!-- leetllm: output:end -->

Look at the two learned rows of `W1`. One has a negative first weight and positive second weight; the other has the reverse signs. Training has discovered detectors for the two directions of disagreement, closely related to the features we built by hand. Their magnitudes differ from our chosen weights because several parameter settings can express the same classification rule.

The loss falls to about `0.0044`, and the four predictions match the targets. A different initialization can leave this very small network with an unhelpful inactive unit; try other seeds to observe that behavior. With only two hidden units, each one carries a large share of the representation. Increasing the hidden width gives training more possible features to work with.

Fitting these four examples teaches the mechanics of learning. In an application, we also need a separate validation set to choose training settings and a test set to assess predictions on unseen data. The four corners do not uniquely specify what should happen at every point between them. A model's architecture, initialization, and training data together shape that behavior.

## Check the mathematics with PyTorch

PyTorch can execute the same forward equations and obtain the derivatives automatically. A tensor with `requires_grad=True` records the operations that use it; calling `backward()` on the loss traverses that graph and accumulates parameter gradients.[^pytorch2026autograd] This removes the need to write the derivative arrays manually, while the mathematical computation remains the same.

For a useful check, use a fresh input batch and parameters whose hidden pre-activations stay away from ReLU's hinge. Compute the gradients once by hand in NumPy and once with PyTorch, then compare all four parameter arrays. This catches transposes, missing batch averaging, and incorrect activation derivatives:

<!-- leetllm: test, deps=numpy,torch, output=show -->
```python title="verify-backprop-with-autograd.py"
import numpy as np
import torch

X = np.array([[0.2, 0.8], [0.9, 0.1]])
y = np.array([[1.], [1.]])
parameters = [
    np.array([[1., -1.], [-1., 1.]]),
    np.array([0.1, 0.1]),
    np.array([[2., 3.]]),
    np.array([-1.]),
]
W1, b1, W2, b2 = parameters
Z1 = X @ W1.T + b1
H = np.maximum(0, Z1)
logits = H @ W2.T + b2
p = 1 / (1 + np.exp(-logits))
dZ2 = (p - y) / len(X)
dZ1 = (dZ2 @ W2) * (Z1 > 0)
manual = [dZ1.T @ X, dZ1.sum(0), dZ2.T @ H, dZ2.sum(0)]

weights = [torch.tensor(a, requires_grad=True) for a in parameters]
tW1, tb1, tW2, tb2 = weights
tH = torch.relu(torch.tensor(X) @ tW1.T + tb1)
tlogits = tH @ tW2.T + tb2
loss = torch.nn.functional.binary_cross_entropy_with_logits(tlogits, torch.tensor(y))
loss.backward()

for name, expected, actual in zip(("W1", "b1", "W2", "b2"), manual, weights):
    error = np.max(np.abs(expected - actual.grad.numpy()))
    print(f"{name}: gradients agree = {np.allclose(expected, actual.grad.numpy())}")
    assert error < 1e-12
```

<!-- leetllm: output:start -->
```text title="Output" output compact
W1: gradients agree = True
b1: gradients agree = True
W2: gradients agree = True
b2: gradients agree = True
```
<!-- leetllm: output:end -->

### Express the network as layers

`nn.Linear(2, 2)` stores our first weight matrix and bias, `nn.ReLU()` applies the hidden nonlinearity, and `nn.Linear(2, 1)` produces the output logit. For training, give that logit directly to `binary_cross_entropy_with_logits`; apply sigmoid only when converting the result to a displayed probability. The optimizer's `step()` performs the parameter updates, and `zero_grad()` clears the previous step's accumulated gradients.

This continuation copies the NumPy-trained parameters into the corresponding PyTorch layers and checks the predictions. It makes the connection between each array and each layer explicit:

<!-- leetllm: test, deps=numpy,torch, continue=xor-training, output=show -->
```python title="same-network-in-pytorch.py"
import torch
from torch import nn

model = nn.Sequential(nn.Linear(2, 2), nn.ReLU(), nn.Linear(2, 1)).double()
with torch.no_grad():
    model[0].weight.copy_(torch.from_numpy(W1))
    model[0].bias.copy_(torch.from_numpy(b1))
    model[2].weight.copy_(torch.from_numpy(W2))
    model[2].bias.copy_(torch.from_numpy(b2))
    torch_probabilities = torch.sigmoid(model(torch.from_numpy(X))).numpy()

print("same predictions:", np.allclose(torch_probabilities, p))
print("PyTorch probabilities:", torch_probabilities[:, 0].round(3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
same predictions: True
PyTorch probabilities: [0.007 0.998 0.998 0.007]
```
<!-- leetllm: output:end -->

To train these layers directly, the equivalent training step is short. `features` and `targets` below are the input and target tensors for a batch, and `optimizer` is an optimizer such as `torch.optim.SGD(model.parameters(), lr=0.1)`:

```python title="pytorch-training-step.py"
optimizer.zero_grad()
logits = model(features)
loss = torch.nn.functional.binary_cross_entropy_with_logits(logits, targets)
loss.backward()
optimizer.step()
```

The short version is useful because we now know what it stands for. The forward call computes hidden features, the loss compares predictions with labels, backward multiplies local sensitivities, and the optimizer changes the same weights and biases we updated ourselves.

## Explore the choices behind a larger network

Our two-unit network exposes the essential mechanism. Larger networks repeat that mechanism with more features and more layers. Three design choices determine how those computations develop: the activation, the initial parameter scale, and the network's width and depth.

### What changes when we choose another activation?

An activation changes both the feature that a neuron computes and the derivative that passes backward. ReLU is easy to inspect because its positive half has slope one and its negative half has slope zero. Other activations provide smooth transitions, bounded outputs, or nonzero derivatives on part of the negative side.

<figure>
  <img src="illustrations/_generated/activation_functions_break_linearity_dark.png" alt="Six activation curves share input and output scales from -3 to 3: linear, sigmoid, tanh, ReLU, GELU, and SiLU. Sigmoid and tanh flatten in their tails; ReLU clips negative inputs; GELU and SiLU retain small negative outputs." />
  <figcaption>Compare the curves at the same input. Their heights determine the forward value, while their local slopes determine how much gradient travels backward.</figcaption>
</figure>

| Activation | Formula | What to notice |
|---|---|---|
| Sigmoid | $1/(1+e^{-z})$ | Produces binary probabilities; its tails have small slopes |
| Tanh | $\tanh z$ | Ranges from −1 to 1 and also flattens in its tails |
| ReLU | $\max(0,z)$ | Keeps positive values and clips negative ones |
| GELU | $z\Phi(z)$ | Smoothly weights inputs using the standard normal cumulative distribution $\Phi$ |
| SiLU | $z\sigma(z)$ | Smoothly weights inputs using sigmoid |

GELU and SiLU can return small negative values, unlike ReLU. They are useful examples of smooth nonlinearities used in neural networks; the GELU paper develops the Gaussian-weighted form.[^hendrycks2016] Their names matter less than being able to follow their curves through the forward and backward computations. For any activation $h=f(z)$, the backward rule is still $\partial\ell/\partial z=(\partial\ell/\partial h)f'(z)$.

For instance, an incoming sensitivity of `0.5` and a local slope of `0.07` give an outgoing sensitivity of `0.035`. A negative local slope reverses the direction. Sigmoid's derivative is $p(1-p)$, at most `0.25`, and becomes small near zero or one. Repeated multiplication by small local derivatives can shrink gradients as they pass through many layers.

### Give hidden units different starting points

If hidden units start with identical weights and biases, receive the same inputs, and have identical outgoing weights, they receive identical updates. They remain copies of each other. Random initialization breaks that symmetry so different units can learn different features.

Scale matters as well. Very large initial values can push sigmoid or tanh into flat regions; very small values can shrink signals across layers. For a ReLU layer with $n_{\text{in}}$ inputs, a common initialization draws zero-mean weights with variance $2/n_{\text{in}}$, giving standard deviation $\sqrt{2/n_{\text{in}}}$. This choice accounts for the rectifier when balancing signal magnitudes across layers.[^he2015Initialization] Our first layer has two inputs, so its standard deviation of `1` follows that rule.

### More units and more layers

With ReLU, each hidden neuron introduces a hinge. Combining many such units produces a piecewise-linear function, and composing layers builds more elaborate regions from earlier features. A network can therefore learn curved-looking decision boundaries through collections of linear pieces. The sigmoid output then maps the final score to a probability.

A small construction makes that flexibility tangible. Three shifted ReLUs form a triangle:

$$
t(x)=\operatorname{ReLU}(x)-2\operatorname{ReLU}(x-1)+\operatorname{ReLU}(x-2).
$$

It rises from zero to one on $[0,1]$, falls back to zero on $[1,2]$, and stays at zero outside that interval. Shifting and scaling these pieces lets a network approximate a one-dimensional curve. Universal approximation results formalize this idea: with sufficient width and a suitable nonlinear activation, a hidden-layer network can approximate continuous functions on a compact domain.[^cybenko1989][^leshno1992UniversalApproximation]

Depth lets the model reuse intermediate features. An image network might combine local edges into textures and larger shapes; a language network combines information about tokens and their context. Learning those useful representations remains a separate problem from having enough capacity to express them. Training examples and evaluation on new examples tell us whether the chosen network has learned a useful rule.

## When a working network behaves unexpectedly

Once the forward and backward passes make sense, debugging becomes a matter of locating which part of that computation changed. These are especially useful checks when you adapt the code above.

**Check a single example when shapes look right but values look wrong.** Our convention stores one neuron's weights per row, so a row-batched input uses `X @ W.T`. A square matrix can also make `X @ W` legal while computing different numbers. With $x=[1,3]$ and $W=[[0.2,0.7],[-0.4,0.1]]$, the intended output is `[2.3,−0.1]`, while the other multiplication gives `[−1,1]`. Writing out one dot product identifies the layout immediately.

**Inspect hidden activations when learning stalls.** A ReLU unit that is negative on every training example receives zero gradient through that gate. Look at `Z1` before changing the optimizer. An initialization with useful positive activations, a smaller learning rate, or a leaky activation can give the model a path to learn. In a deeper network, changes in earlier layers can also change which units are active.

**Put input features on useful scales.** If one feature is measured in thousands and another in fractions, equal weights give them very different contributions. For numeric tabular features, a common starting point is $(x-\mu)/s$, using the training-set mean $\mu$ and standard deviation $s$. Reuse those same values for validation and inference. For image pixels, consistent scaling such as dividing byte values by `255` makes the input range explicit.

**Compute the loss from logits.** Extreme sigmoid outputs can round to zero or one, making a subsequent logarithm troublesome. `np.logaddexp(0, logits) - y * logits` and PyTorch's `BCEWithLogitsLoss` evaluate the combined expression directly. For logits `[-1000,1000]` with targets `[1,0]`, both examples have a finite loss of about `1000`, reflecting two confident mistakes.[^pytorchBCEWithLogits2026]

**Use gradient checks on smooth parts of the function.** A two-sided finite difference estimates a derivative by nudging one parameter up and down. It is useful for checking custom backward code, but a perturbation that crosses ReLU's hinge measures two different slopes. Start with double precision and parameters away from those hinges, as in the PyTorch comparison above.

## Practice with the network

The exercises below change the mechanism you have already built. Work through the arithmetic first, then use the programs to check it.

1. Change the hand-built output bias from `−2` to `−3`. What probabilities do the blue and orange corners receive? Where does the separating line move in hidden space?
2. For the input `[0.8,0.2]`, compute both hidden features, the output logit, and the probability using the hand-built weights.
3. Expand a dense network to three input features, four hidden units, and one output. Give the parameter shapes and total parameter count. What changes if you evaluate a batch of 20 examples?
4. A hidden unit has inputs `[−3,2]`, pre-activation sensitivity `0.2`, and weights `[0.5,0.5]`. Compute its weight gradient and the new weights after a gradient-descent step with learning rate `0.1`.
5. In `train-xor-numpy.py`, try a hidden width of four and several random seeds. Keep the labels unchanged. Inspect the loss and predicted labels, then explain why the learned hidden features need not match the hand-built pair.

```checkpoint
Worked solutions
---
1. Blue points have z = −3 and p ≈ 0.047; orange points have z = 1 and p ≈ 0.731. The threshold equation becomes 4h₁ + 4h₂ − 3 = 0, or h₁ + h₂ = 0.75. All four labels remain correct.
2. The differences are 0.6 and −0.6, so the hidden features are [0.6,0]. The logit is 4(0.6) − 2 = 0.4, giving p ≈ 0.599.
3. W₁ is (4,3), b₁ is (4,), W₂ is (1,4), and b₂ is (1,). There are 12 + 4 + 4 + 1 = 21 parameters. A batch of 20 has input, hidden, and output shapes (20,3), (20,4), and (20,1), using the same parameters.
4. The gradient is 0.2[−3,2] = [−0.6,0.4]. Subtracting 0.1 times it gives [0.56,0.46]. The sign of each input matters.
5. Set W₁ to shape (4,2), b₁ to (4,), and W₂ to (1,4). Multiple hidden units can share the work, and their order can be permuted without changing the function if the output weights follow that permutation. Compare the resulting predictions and hidden activations rather than requiring identical parameter values.
```

## Mastery check

```mastery-quiz
[
  {
    "question": "Why can a single sigmoid neuron not classify all four XOR corners correctly?",
    "options": ["Its 0.5 threshold follows one straight line.", "Its sigmoid needs a steeper slope to separate the corners.", "Its training loop needs more epochs to find the curved boundary.", "Its bias must be fixed at zero to make both classes reachable."],
    "answer": "Its 0.5 threshold follows one straight line.",
    "explanation": "The threshold is w₁x₁ + w₂x₂ + b = 0. No straight line separates the two alternating orange corners from both blue corners. Hidden nonlinear features change the geometry."
  },
  {
    "question": "For x = [0.8,0.2], what does the hidden map h = [ReLU(x₁−x₂), ReLU(x₂−x₁)] produce?",
    "options": ["[0.6,−0.6]", "[0.6,0]", "[0.8,0.2]", "[0,0.6]"],
    "answer": "[0.6,0]",
    "explanation": "The differences are 0.6 and −0.6. ReLU keeps 0.6 and clips −0.6 to zero. The output can now use the magnitude of the positive difference."
  },
  {
    "question": "What changes if every hidden activation in a network is replaced with the identity function?",
    "options": ["Each matrix multiplication still adds a new bend to the boundary.", "The network becomes equivalent to one affine map before its output activation.", "Hidden biases still create piecewise-linear features by themselves.", "Its output sigmoid can still separate XOR by bending the hidden coordinates."],
    "answer": "The network becomes equivalent to one affine map before its output activation.",
    "explanation": "Substitution combines the matrices into one product and the biases into one offset. Nonlinear hidden activations give stacked layers their additional representational power."
  },
  {
    "question": "A batch has 7 examples and 3 features. A biased dense network has widths 3 → 4 → 2. What are its output shape and parameter count?",
    "options": ["(7,2) and 26", "(2,7) and 26", "(7,2) and 20", "(7,4) and 26"],
    "answer": "(7,2) and 26",
    "explanation": "The example axis stays first. Layer one has 3×4 + 4 = 16 parameters and layer two has 4×2 + 2 = 10, totaling 26."
  },
  {
    "question": "For one positive example, p = 0.8 and y = 1. What is the binary-cross-entropy derivative with respect to its logit?",
    "options": ["0.8", "0.2", "−0.2", "−0.8"],
    "answer": "−0.2",
    "explanation": "The sigmoid and cross-entropy derivatives combine to p−y = 0.8−1 = −0.2. Increasing the logit lowers the loss for this positive example."
  },
  {
    "question": "A hidden unit has pre-activation −0.3 and receives sensitivity 0.4 at its ReLU output. What sensitivity reaches its pre-activation?",
    "options": ["0.4", "−0.12", "−0.4", "0"],
    "answer": "0",
    "explanation": "ReLU's negative branch has slope zero. The chain rule multiplies the incoming 0.4 by that zero, so this example sends no gradient through the unit."
  },
  {
    "question": "A weight is 0.5, its loss gradient is −0.6, and the learning rate is 0.1. What is its next value under gradient descent?",
    "options": ["0.44", "0.56", "0.06", "0.6"],
    "answer": "0.56",
    "explanation": "Subtract the scaled gradient: 0.5 − 0.1(−0.6) = 0.56. A negative gradient increases the parameter under gradient descent."
  },
  {
    "question": "Why does the batch backward pass divide P−Y by B in this lesson's one-output network?",
    "options": ["The objective is the mean of B example losses.", "It normalizes each input vector to unit length.", "The sigmoid derivative contributes a factor of 1/B.", "It reverses the broadcasting of the output bias."],
    "answer": "The objective is the mean of B example losses.",
    "explanation": "Differentiating the average loss carries its factor 1/B into every example's contribution. The weight and bias gradients then sum those contributions."
  },
  {
    "question": "Why give otherwise identical hidden units different random starting weights?",
    "options": ["To make identical units receive the same gradient more quickly.", "To guarantee that every hidden unit stays active on every example.", "To let them receive different updates and learn different features.", "To guarantee that every initialization reaches the same weights."],
    "answer": "To let them receive different updates and learn different features.",
    "explanation": "Identical units with identical outgoing connections receive the same gradients and remain duplicates. Different initial weights break that symmetry."
  },
  {
    "question": "After adapting this network to a larger classification dataset, training loss is low. Which check addresses whether the learned rule also works on new data?",
    "options": ["Repeat training with several seeds and select the lowest training loss.", "Compare predictions with labels on held-out examples from the intended task.", "Increase hidden width until every training label is predicted correctly.", "Evaluate the training examples again using a different batch size."],
    "answer": "Compare predictions with labels on held-out examples from the intended task.",
    "explanation": "Training fit measures the examples used to choose parameters. Held-out examples test whether the learned representation carries over to new inputs."
  }
]
```

> **Next:** Continue to [PyTorch Training Loops](/learn/pytorch-training-loops).
