---
{
  "id": "logistic-regression-classification-metrics-from-scratch",
  "title": "Logistic Regression and Metrics",
  "slug": "logistic-regression-classification-metrics-from-scratch",
  "section": "ML Algorithms & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Medium",
  "order": 2,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Turn two features into a probability, derive the loss and gradient, and train logistic regression in NumPy. Then follow the same predictions through thresholds, precision, recall, ranking, and calibration.",
  "keyConceptsTested": [
    "sigmoid activation",
    "log loss / binary cross-entropy",
    "gradient of logistic loss",
    "decision threshold tuning",
    "confusion matrix (TP/FP/TN/FN)",
    "precision, recall, F1-score",
    "ROC curve and AUC",
    "reliability diagram / calibration plot",
    "Expected Calibration Error (ECE)",
    "NumPy from-scratch implementation",
    "scikit-learn comparison",
    "imbalanced classification pitfalls",
    "multiclass softmax extension",
    "maximum-margin support vector machines",
    "hinge loss and RBF kernels",
    "Gaussian-process predictive uncertainty"
  ]
}
---

An assistant drafts replies from retrieved passages. Most are well grounded, yet some slip in an unsupported claim. Suppose only 4% of replies need checking: a model that predicts "safe" on every single reply scores 96% accuracy while catching zero bad claims.

That failure is why classification needs probabilities, cross-entropy, and metrics that separate ranking from thresholding. Instead of predicting a continuous number as in [linear regression](/learn/linear-regression-from-scratch), **logistic regression** outputs a probability that an example belongs to the positive class (`y = 1` for an unsupported claim, `y = 0` for a supported reply). We will build the model from scratch in NumPy, derive its loss and gradient, and follow the exact same predictions through thresholds, precision, recall, ROC-AUC, and calibration.[^hastie2009]

## From two features to one probability

Each response has two numerical features. An **ambiguity score** $x_1$ increases when passages conflict or a claim lacks clear support. A **retrieval-support score** $x_2$ increases when the passages directly support the reply. These features give the model competing evidence: ambiguity should raise the predicted chance of an unsupported claim, while support should lower it.

A linear score combines them:

$$
z=w_0+w_1x_1+w_2x_2.
$$

Here $w_0$ is the intercept, and $w_1,w_2$ are feature weights. To see the calculation, start with $w=[-1,1.2,-0.6]$ and a response with $x_1=3$, $x_2=2$:

$$
z=-1+1.2(3)-0.6(2)=1.4.
$$

A score of $1.4$ is useful for comparing examples, but a probability must lie between zero and one. The **sigmoid**, also called the logistic function, performs that conversion:

$$
p=\sigma(z)=\frac{1}{1+e^{-z}}.
$$

For this response, $p=\sigma(1.4)\approx0.802$. The model predicts about an $80\%$ chance of an unsupported claim. If we choose to verify whenever $p\ge0.5$, this response goes to verification. The weights produce the probability; the threshold turns it into an action.

The score before sigmoid is called a **logit**. Negative logits produce probabilities below $0.5$, zero produces exactly $0.5$, and positive logits produce probabilities above $0.5$:

| Logit $z$ | Probability $\sigma(z)$ |
|---:|---:|
| −4 | 0.018 |
| −1 | 0.269 |
| 0 | 0.500 |
| 1 | 0.731 |
| 4 | 0.982 |

<!-- leetllm: test, deps=numpy, output=show -->
```python title="sigmoid-probabilities.py"
import numpy as np

def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))

scores = np.array([-4.0, -1.0, 0.0, 1.0, 4.0])
print("scores:", scores)
print("probabilities:", sigmoid(scores).round(3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
scores: [-4. -1.  0.  1.  4.]
probabilities: [0.018 0.269 0.5   0.731 0.982]
```
<!-- leetllm: output:end -->

Sigmoid rises most quickly near zero and flattens toward either end. Moving the score from $-1$ to $1$ changes $p$ by about $0.462$, while moving it from $4$ to $6$ changes $p$ by only $0.016$.

Its derivative describes that slope:

$$
\sigma'(z)=\sigma(z)(1-\sigma(z))=p(1-p).
$$

The largest slope is $0.25$, at $p=0.5$. We will use it when tracing how a weight changes the loss.

<figure>
  <img src="illustrations/_generated/sigmoid_saturation_curve_dark.png" alt="Smooth sigmoid and derivative curves from scores minus six to six, showing maximum slope 0.25 at zero and comparing an equal score move from minus one to one with a move from four to six, where probability changes by 0.462 versus 0.016." />
  <figcaption>The derivative peaks at `0.25` when `z = 0`, so a two-point score move near the center changes probability by `0.462`. The same score move in the positive tail changes it by only `0.016`.</figcaption>
</figure>

## Give the model a reason to prefer the right answer

We have a prediction rule, but its weights are still arbitrary. A **loss function** measures how well a prediction matches an observed label. Training changes the weights to lower the average loss.

Suppose the label is $y=1$. A prediction of $p=0.8$ puts more probability on the correct answer than $p=0.2$, so it should receive a smaller loss. **Log loss** uses the negative logarithm of the probability assigned to the answer that actually occurred:

$$
\ell(p,y)=
\begin{cases}
-\log p,&y=1,\\
-\log(1-p),&y=0.
\end{cases}
$$

For a positive example, $p=0.8$ gives $-\log(0.8)\approx0.223$, while $p=0.2$ gives about $1.609$. A confident mistake such as $p=0.01$ costs about $4.605$. The model receives a much stronger penalty for assigning almost no probability to the observed answer.

The logarithm also has an information interpretation: an outcome the model considers surprising requires a longer description. Training with log loss asks the model to make the observed answers less surprising. With natural logarithms, the loss is measured in **nats**.

### Derive the loss from the labels' probability

A binary outcome follows a Bernoulli distribution. The probability of observing label $y_i$ is

$$
P(Y_i=y_i\mid x_i)=p_i^{y_i}(1-p_i)^{1-y_i}.
$$

If $y_i=1$, this expression selects $p_i$; if $y_i=0$, it selects $1-p_i$. Treating the examples as conditionally independent, their joint likelihood is

$$
\mathcal L(w)=\prod_{i=1}^N p_i^{y_i}(1-p_i)^{1-y_i}.
$$

We want weights that make the observed labels likely. Taking a logarithm turns the product into a sum without changing which weights maximize it. Negating that sum and dividing by $N$ gives the mean **binary cross-entropy**, or BCE:[^bishop2006][^murphy2012]

$$
L(w)=-\frac1N\sum_{i=1}^N
\left[y_i\log p_i+(1-y_i)\log(1-p_i)\right].
$$

Cross-entropy measures how well a predicted distribution describes a target distribution. For one binary label, the target is $(1-y_i,y_i)$ and the prediction is $(1-p_i,p_i)$. The formula above is exactly their cross-entropy.

In code, we can compute the same loss directly from the logit:

$$
\ell(z,y)=\log(1+e^z)-yz.
$$

NumPy's `logaddexp(0,z)` evaluates the logarithmic term without constructing a potentially enormous exponential. The mathematical objective stays the same.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="stable-log-loss-from-logits.py"
import numpy as np

def log_loss_from_logits(y: np.ndarray, z: np.ndarray) -> float:
    return float(np.mean(np.logaddexp(0.0, z) - y * z))

print("correct positive:", round(log_loss_from_logits(np.array([1.0]), np.array([2.0])), 3))
print("confident wrong:", round(log_loss_from_logits(np.array([1.0]), np.array([-4.0])), 3))
extreme = log_loss_from_logits(np.array([0.0, 1.0]), np.array([1000.0, -1000.0]))
print("extreme logits finite:", np.isfinite(extreme))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
correct positive: 0.127
confident wrong: 4.018
extreme logits finite: True
```
<!-- leetllm: output:end -->

## Eight examples to learn from

Here is the training set. Each row supplies the two features and the observed label:

| Response | Ambiguity $x_1$ | Retrieval support $x_2$ | Unsupported claim $y$ |
|---|---:|---:|---:|
| R1 | 1.0 | 1 | 0 |
| R2 | 1.5 | 2 | 0 |
| R3 | 2.0 | 3 | 1 |
| R4 | 3.5 | 6 | 1 |
| R5 | 4.0 | 7 | 1 |
| R6 | 4.5 | 5 | 1 |
| R7 | 2.8 | 4 | 0 |
| R8 | 3.2 | 8 | 0 |

The labels do not follow either feature alone. R8 has more ambiguity than R3 but also much more support, and their labels differ. A useful fit must consider the two measurements together.

We add a leading $1$ to each row so that the intercept participates in the same matrix multiplication as the feature weights. R4 becomes $x=[1,3.5,6]$. The design matrix $X$ has shape $(8,3)$, the parameter vector $w$ has shape $(3,)$, and $Xw$ computes all eight logits at once.

## How one error changes the weights

At zero weights, R4 has $z=0$ and $p=0.5$. Its label is $1$, so the prediction is too low. To improve it, training must increase the logit for that example.

The key derivative is simple:

$$
\frac{\partial\ell}{\partial z}=p-y.
$$

For R4, it is $0.5-1=-0.5$. Each weight affects the logit through its corresponding input, giving

$$
\frac{\partial\ell}{\partial w_j}=(p-y)x_j.
$$

The row gradient is $-0.5[1,3.5,6]=[-0.5,-1.75,-3]$. Gradient descent **subtracts** a scaled gradient. Starting at zero with learning rate $0.1$, a step on this one example gives $w=[0.05,0.175,0.3]$. Its new logit is $2.4625$, its probability is about $0.921$, and its loss has fallen from $0.693$ to about $0.082$.

This shows the direction of learning. A batch update balances the pushes from all rows, including negative examples that push their logits downward.

### Where the derivative comes from

The chain rule follows the computation $w_j\to z\to p\to\ell$:

$$
\frac{\partial\ell}{\partial w_j}
=\frac{\partial\ell}{\partial p}
\frac{\partial p}{\partial z}
\frac{\partial z}{\partial w_j}.
$$

The three factors are

$$
\frac{\partial\ell}{\partial p}
=-\frac yp+\frac{1-y}{1-p}
=\frac{p-y}{p(1-p)},\qquad
\frac{\partial p}{\partial z}=p(1-p),\qquad
\frac{\partial z}{\partial w_j}=x_j.
$$

Multiplying cancels $p(1-p)$ and leaves $(p-y)x_j$. A confidently wrong positive example at $z=-8$ has $p\approx0.000335$, but its logit derivative is still close to $-1$. The flat sigmoid tail does not stop cross-entropy from correcting that mistake.

We can check the derivative by nudging one weight up and down and measuring the loss difference. This **central finite difference** should agree with the analytic gradient:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="check-gradient-with-finite-differences.py"
import numpy as np

def sigmoid(z: float) -> float:
    return float(1.0 / (1.0 + np.exp(-z)))

def loss(w: np.ndarray, x: np.ndarray, y: float) -> float:
    z = x @ w
    return float(np.logaddexp(0.0, z) - y * z)

x = np.array([1.0, 3.5, 6.0])
y = 1.0
w = np.zeros(3)
analytic = (sigmoid(x @ w) - y) * x
eps = 1e-6
numeric = np.array([
    (loss(w + eps * np.eye(3)[j], x, y) - loss(w - eps * np.eye(3)[j], x, y)) / (2 * eps)
    for j in range(3)
])
print("analytic:", analytic.round(3))
print("numeric :", numeric.round(3))
print("match:", np.allclose(analytic, numeric, atol=1e-6))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
analytic: [-0.5  -1.75 -3.  ]
numeric : [-0.5  -1.75 -3.  ]
match: True
```
<!-- leetllm: output:end -->

For the average of all $N$ losses, collect the predictions into $p=\sigma(Xw)$. The batch gradient is

$$
\nabla_wL=\frac1N X^\top(p-y),\qquad
w\leftarrow w-\eta\nabla_wL.
$$

$X^\top$ collects each feature's contributions across examples. The factor $1/N$ comes from averaging the losses. If you used half mean squared error in linear regression, the matrix structure is identical; logistic regression changes the predictions to $\sigma(Xw)$.

For our eight rows, the initial mean gradient is $[0,-0.34375,-0.375]$. With learning rate $0.2$, the first update gives $[0,0.06875,0.075]$.

<figure>
  <img src="illustrations/_generated/gradient_update_signal_dark.png" alt="Logistic-regression gradient heatmap for eight candidate responses at zero weights, showing each row contribution to intercept, ambiguity, and retrieval-support gradients, their average gradient, and the first update to weights 0, 0.069, and 0.075." />
  <figcaption>At zero weights, every response starts at `p = 0.5`. Multiplying each signed error by its feature <span data-glossary="vector">vector</span> creates the row heatmap; column averages give `g = [0, -0.344, -0.375]`, so the first `lr = 0.2` update becomes `w = [0, 0.069, 0.075]`.</figcaption>
</figure>

## Train the model in NumPy

The training loop repeats four operations: compute logits, apply sigmoid, compute the batch gradient, and update the weights. The code uses the stable logit form of the loss and prints its progress.[^numpy2020]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="logistic-regression-numpy.py"
import numpy as np

def sigmoid(z: np.ndarray) -> np.ndarray:
    # exp(-log(1 + exp(-z))) avoids overflow without clipping the score.
    return np.exp(-np.logaddexp(0.0, -z))

def log_loss_from_logits(y_true: np.ndarray, z: np.ndarray) -> float:
    return float(np.mean(np.logaddexp(0.0, z) - y_true * z))

def fit_logistic(X: np.ndarray, y: np.ndarray, lr: float = 0.2, epochs: int = 3000, verbose: bool = True) -> np.ndarray:
    n, d = X.shape
    w = np.zeros(d)
    for epoch in range(epochs):
        z = X @ w
        p = sigmoid(z)
        grad = (1 / n) * (X.T @ (p - y))
        w -= lr * grad
        if verbose and epoch in (0, 200, 500, 1000, 2999):
            loss = log_loss_from_logits(y, X @ w)
            print(f"after_epoch={epoch + 1:4d}  loss={loss:.4f}  w={np.round(w, 3)}")
    return w

def predict_proba(X: np.ndarray, w: np.ndarray) -> np.ndarray:
    return sigmoid(X @ w)

# Historical responses: [ambiguity, retrieval support]
X_raw = np.array([
    [1.0, 1.0], [1.5, 2.0], [2.0, 3.0], [3.5, 6.0],
    [4.0, 7.0], [4.5, 5.0], [2.8, 4.0], [3.2, 8.0],
])
y = np.array([0, 0, 1, 1, 1, 1, 0, 0])

X = np.c_[np.ones((len(X_raw), 1)), X_raw]   # add intercept column

w = fit_logistic(X, y, lr=0.2, epochs=3000)
p = predict_proba(X, w)
print("\nFinal weights (w0, w1, w2):", w.round(3))
print("Probabilities:", p.round(3))
print("weights_match_reference", np.allclose(w, [-4.894, 3.399, -0.959], atol=0.01))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after_epoch=   1  loss=0.6830  w=[0.    0.069 0.075]
after_epoch= 201  loss=0.4648  w=[-2.205  1.615 -0.462]
after_epoch= 501  loss=0.4206  w=[-3.524  2.452 -0.686]
after_epoch=1001  loss=0.4092  w=[-4.356  3.023 -0.85 ]
after_epoch=3000  loss=0.4072  w=[-4.894  3.399 -0.959]

Final weights (w0, w1, w2): [-4.894  3.399 -0.959]
Probabilities: [0.079 0.153 0.274 0.777 0.88  0.996 0.687 0.156]
weights_match_reference True
```
<!-- leetllm: output:end -->

The loss falls from about $0.693$ at initialization to $0.407$. The fitted ambiguity weight is positive and the support weight is negative, matching the roles of the inputs.

Both slopes increased on the first step because the positive examples initially contributed larger feature values on average. Later updates find the **conditional** effect of each feature while accounting for the other one. Holding support fixed, more ambiguity raises the fitted logit; holding ambiguity fixed, more support lowers it.

The model still makes mistakes at threshold $0.5$. R3 is positive but receives $p=0.274$; R7 is negative but receives $p=0.687$. A straight boundary cannot separate this training set perfectly. These two examples will help us distinguish model fit from the choice of a decision threshold.

### Read the weights as changes in odds

The **odds** of a positive label are $p/(1-p)$. At $p=0.8$, the odds are $4$ to $1$. Logistic regression makes their logarithm linear in the features:

$$
\log\frac p{1-p}=w_0+w_1x_1+w_2x_2=z.
$$

Exponentiating and solving for $p$ recovers sigmoid: $p/(1-p)=e^z$, so $p=e^z/(1+e^z)$. A one-unit increase in $x_j$, holding the other features fixed, multiplies the odds by $e^{w_j}$. It does not add a fixed amount to the probability, because sigmoid has different slopes at different logits.

### Compare the fit with scikit-learn

A library implementation gives us an independent check of the model and optimizer.[^sklearn2011] For the same objective, use `C=np.inf` to remove the regularization penalty and `fit_intercept=False` because our matrix already contains the intercept column. Scikit-learn's L-BFGS solver takes different steps from our gradient descent but should reach nearly the same solution.[^sklearnLogisticRegression2026]

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="compare-with-scikit-learn.py"
import numpy as np
from sklearn.linear_model import LogisticRegression

X_raw = np.array([
    [1.0, 1.0], [1.5, 2.0], [2.0, 3.0], [3.5, 6.0],
    [4.0, 7.0], [4.5, 5.0], [2.8, 4.0], [3.2, 8.0],
])
y = np.array([0, 0, 1, 1, 1, 1, 0, 0])
X = np.c_[np.ones((len(X_raw), 1)), X_raw]
w_ours = np.array([-4.894, 3.399, -0.959])
X_val_raw = np.array([
    [1.2, 2.0], [2.1, 4.0], [2.4, 3.0], [3.0, 5.0],
    [3.6, 4.0], [3.2, 7.0], [4.2, 5.0], [2.8, 6.0],
])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])
X_val = np.c_[np.ones(len(X_val_raw)), X_val_raw]

clf = LogisticRegression(C=np.inf, solver="lbfgs", max_iter=5000, fit_intercept=False)
clf.fit(X, y)
w_sk = clf.coef_[0]
print("sklearn weights:", np.round(w_sk, 3))
print("our weights   :", w_ours)
print("weights close :", np.allclose(w_sk, w_ours, atol=0.05))
p_val = clf.predict_proba(X_val)[:, 1]
p_ours = 1.0 / (1.0 + np.exp(-(X_val @ w_ours)))
print("largest probability difference:", round(float(np.max(np.abs(p_val - p_ours))), 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
sklearn weights: [-4.914  3.414 -0.964]
our weights   : [-4.894  3.399 -0.959]
weights close : True
largest probability difference: 0.0012
```
<!-- leetllm: output:end -->

The fitted coefficients are close, and the predictions on new examples differ by at most about 0.0012. Matching the objective matters: scikit-learn normally regularizes its coefficients, which would make a default fit a different optimization problem.

### Why this objective is convenient to optimize

For a linear logit, binary cross-entropy is convex in the weights. Its Hessian is

$$
\nabla^2L=\frac1N X^\top\operatorname{diag}(p_i(1-p_i))X.
$$

For any vector $v$, multiplying on both sides gives a sum of nonnegative terms $p_i(1-p_i)(x_i^\top v)^2/N$. This establishes positive semidefiniteness. At finite weights, a full-column-rank $X$ makes that sum positive for every nonzero $v$, so there is at most one finite minimizer.

If a dataset is perfectly separable, increasing the separating weights can keep reducing unregularized log loss without reaching a finite optimum. An L2 penalty, such as $\lambda\|\beta\|_2^2/2$ on the feature coefficients $\beta=[w_1,w_2]^\top$, discourages unbounded growth and adds $\lambda\beta$ to their gradient. Feature standardization also helps gradient descent when columns have very different scales.

Squared error on probabilities is a valid scoring rule, the **Brier score**. Its optimization differs: for $(p-y)^2$, the logit derivative is $2(p-y)p(1-p)$, so the confidently wrong example at $z=-8,y=1$ produces only about $-0.000670$. Cross-entropy produces about $-0.999665$. Squared error after sigmoid is also generally nonconvex in the weights.

Fitting a straight line directly to binary labels is possible too, but the line can predict values outside $[0,1]$. Bernoulli labels also have conditional variance $p(x)(1-p(x))$, which changes with the input. Least squares can still be computed; the usual constant-variance standard-error formulas then need adjustment. Logistic regression builds the probability range and Bernoulli likelihood into the model.

## A threshold moves a line through feature space

Let $b=w_0$ and $\beta=[w_1,w_2]^\top$. Since sigmoid is increasing, the rule $p\ge0.5$ is equivalent to

$$
\beta^\top x+b\ge0.
$$

Its boundary is a straight line in two dimensions and a hyperplane in higher dimensions. With two features and $w_2\ne0$, the line is $x_2=-(w_1/w_2)x_1-w_0/w_2$. Changing the weights changes its direction; changing the intercept slides it.

A different probability threshold $t$ corresponds to a different logit cutoff:

$$
\beta^\top x+b=\log\frac t{1-t}.
$$

At $t=0.2$, that cutoff is about $-1.386$. Lowering the threshold admits responses with lower logits, so more responses go to verification. The weights stay fixed and the boundary moves parallel to itself.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Fitted logistic-regression boundaries over ambiguity and retrieval support, with eight labeled training responses and straight decision contours at thresholds 0.20, 0.50, and 0.80. R3 sits on the direct side of the 0.50 contour even though it needed verification; R7 sits on the verification side even though direct delivery was grounded." />
  <figcaption>Changing the threshold moves the straight decision line without refitting the weights. At `t = 0.50`, `R3` is a missed verification (`p = 0.274`) and `R7` is an unnecessary check (`p = 0.687`).</figcaption>
</figure>

For nonzero $\beta$, its direction is perpendicular to the boundary and points toward increasing probability. The signed distance to the $p=0.5$ boundary is $z/\|\beta\|_2$. This is a distance in the chosen feature units; rescaling a feature changes the geometry. If one slope is zero, solve the boundary using the other coordinate. If both are zero, the model predicts one constant probability.

## Read the predictions on new examples

We fitted weights using the training rows. We now use a separate **validation set** to examine the predictions and choose a threshold. Its scores, rounded to three decimals, are:

| Response | Ambiguity | Support | Actual $y$ | Predicted $p$ |
|---|---:|---:|---:|---:|
| V1 | 1.2 | 2 | 0 | 0.061 |
| V2 | 2.1 | 4 | 0 | 0.169 |
| V3 | 2.4 | 3 | 1 | 0.595 |
| V4 | 3.0 | 5 | 0 | 0.624 |
| V5 | 3.6 | 4 | 1 | 0.971 |
| V6 | 3.2 | 7 | 0 | 0.325 |
| V7 | 4.2 | 5 | 1 | 0.990 |
| V8 | 2.8 | 6 | 1 | 0.244 |

Try a threshold of $0.2$. V1 and V2 stay below it; the other six responses go to verification. Of those six, four actually contain unsupported claims and two are unnecessary checks. All four positive examples have been caught.

These outcomes form a **confusion matrix**:

| | Predict supported | Predict unsupported |
|---|---:|---:|
| Actually supported | TN = 2 | FP = 2 |
| Actually unsupported | FN = 0 | TP = 4 |

A **true positive** is a caught unsupported claim. A **false positive** is a supported reply selected unnecessarily. A **false negative** is a missed unsupported claim. A **true negative** is a supported reply correctly left alone. The names compare the predicted label with the actual label.

<figure>
  <img src="illustrations/_generated/confusion_matrix_quadrants_dark.png" alt="Eight validation scores in two actual-class lanes, divided by a vertical threshold at 0.20. V1 and V2 are true negatives left of the cut. Right of it are four true positives and two false positives, V6 and V4. There are no false negatives. The validation table gives each point its exact score." />
  <figcaption>Position is the score; the vertical cut is the cutoff rule. At `t = 0.20`, every response needing verification is to the right of the cut. The two extra checks are `V6` and `V4`.</figcaption>
</figure>

### Precision and recall ask different questions

**Precision** starts with the selected responses: what fraction were actually positive?

$$
\text{precision}=\frac{TP}{TP+FP}=\frac46\approx0.667.
$$

**Recall** starts with all actual positives: what fraction did we catch?

$$
\text{recall}=\frac{TP}{TP+FN}=\frac44=1.
$$

Imagine two piles on a desk. Precision inspects the pile the model selected. Recall checks the pile that truly needed attention. A threshold can make the selected pile very pure by accepting only the highest scores, while leaving many real positives behind.

**F1** is the harmonic mean of precision and recall:

$$
F_1=\frac{2PR}{P+R}=\frac{2TP}{2TP+FP+FN}.
$$

Here F1 is $8/(8+2)=0.8$. The harmonic mean gives a low result when either component is low. If a classifier catches only one of 100 positives and makes no false-positive errors, its precision is $1$ and its recall is $0.01$. Their arithmetic mean is $0.505$, but F1 is only about $0.0198$, reflecting the missed positives.

Precision is undefined if nothing is selected; recall is undefined if the dataset contains no positives. The code below returns zero for those empty-denominator cases. Keeping the raw counts visible makes that convention clear.

### Why accuracy can hide the problem

Accuracy counts all correct labels, including true negatives. If only four of 100 responses need checking, a model that selects nothing still reaches $96\%$ accuracy:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="accuracy-fails-on-rare-review-cases.py"
import numpy as np

y_true = np.array([1] * 4 + [0] * 96)
predict_direct_everything = np.zeros(100, dtype=int)
accuracy = (predict_direct_everything == y_true).mean()
recall = ((predict_direct_everything == 1) & (y_true == 1)).sum() / (y_true == 1).sum()
print("accuracy:", round(float(accuracy), 3))
print("verification recall:", round(float(recall), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
accuracy: 0.96
verification recall: 0.0
```
<!-- leetllm: output:end -->

The zero recall tells us what the accuracy concealed: the rule missed every unsupported claim. Compare a classifier with this majority-class baseline and inspect the errors that matter for the task.

## Choose a threshold using the cost of mistakes

Different mistakes can have different consequences. For this example, assign a missed unsupported claim a cost of `$120` and an unnecessary verification a cost of `$18`. Correct decisions have zero incremental error cost. The observed validation cost is therefore

$$
\text{cost}=120\,FN+18\,FP.
$$

At threshold $0.5$, the model misses V8 and unnecessarily selects V4: a total cost of `$138`. Lowering the threshold to $0.2$ catches V8 but also selects V6, leaving two unnecessary checks and no misses: cost `$36`. One prevented miss is worth the extra check under these costs.

The following program computes probabilities from the validation features and compares three thresholds. It reports precision, recall, F1, and cost together so each choice remains connected to its consequences.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="choose-threshold-on-validation.py"
import numpy as np

def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))

def metrics(y: np.ndarray, p: np.ndarray, threshold: float) -> tuple[float, float, float, int]:
    pred = (p >= threshold).astype(int)
    tp = int(((pred == 1) & (y == 1)).sum())
    fp = int(((pred == 1) & (y == 0)).sum())
    fn = int(((pred == 0) & (y == 1)).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    cost = 120 * fn + 18 * fp
    return precision, recall, f1, cost

w = np.array([-4.894, 3.399, -0.959])
X_val_raw = np.array([
    [1.2, 2.0], [2.1, 4.0], [2.4, 3.0], [3.0, 5.0],
    [3.6, 4.0], [3.2, 7.0], [4.2, 5.0], [2.8, 6.0],
])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])
X_val = np.c_[np.ones(len(X_val_raw)), X_val_raw]
p_val = sigmoid(X_val @ w)

for t in (0.20, 0.50, 0.80):
    precision, recall, f1, cost = metrics(y_val, p_val, t)
    print(f"t={t:.2f} precision={precision:.3f} recall={recall:.3f} f1={f1:.3f} cost=${cost}")

print("p_val:", np.round(p_val, 3))
print("cheapest tested cut:", min((0.20, 0.50, 0.80), key=lambda t: metrics(y_val, p_val, t)[3]))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
t=0.20 precision=0.667 recall=1.000 f1=0.800 cost=$36
t=0.50 precision=0.750 recall=0.750 f1=0.750 cost=$138
t=0.80 precision=1.000 recall=0.500 f1=0.667 cost=$240
p_val: [0.061 0.169 0.595 0.624 0.971 0.325 0.99  0.244]
cheapest tested cut: 0.2
```
<!-- leetllm: output:end -->

Threshold $0.2$ has the lowest cost among the three tested choices, saving `$102` compared with $0.5$. Raising the cutoff to $0.8$ gives perfect precision but misses half the positives. Its `$240` error cost is the highest of the three.

<figure>
  <img src="illustrations/_generated/threshold_calibration_audit_dark.png" alt="Three threshold cuts show validation error cost split into unnecessary-verification cost and missed-verification cost. At thresholds 0.20, 0.50, and 0.80, totals are 36, 138, and 240 dollars; the lowest tested total comes from two false positives and no false negatives." />
  <figcaption>Threshold `0.20` wins this validation comparison because two `$18` verification checks cost less than one `$120` missed error. The cost model makes preventing a miss worth an additional check.</figcaption>
</figure>

Threshold selection is part of fitting a decision rule. Choose it on validation data, then evaluate the finished rule on an untouched test set.[^sklearnThresholdTuning2026] If verification capacity is limited, include the selected count $TP+FP$ alongside cost when comparing thresholds.

## Ranking: follow the threshold through every score

A threshold picks one operating point. To understand the whole ranking, lower it from above the largest score to below the smallest score. Each response enters the selected set when the threshold crosses its score.

The **ROC curve** plots true-positive rate, which is recall, against false-positive rate:

$$
\mathrm{TPR}=\frac{TP}{TP+FN},\qquad
\mathrm{FPR}=\frac{FP}{FP+TN}.
$$

A positive example entering the set moves the curve upward; a negative example moves it right. In our validation set there are four of each class, so each move is $1/4$. At threshold $0.2$, the point is $(0.5,1)$ because two of four negatives and all four positives are selected.

The area under this curve, **ROC-AUC**, also has a pairwise meaning: choose one positive and one negative example. How often does the positive have the higher score? Count a tie as half a win. Our four positives and four negatives create 16 pairs:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="auc-from-positive-negative-pairs.py"
import numpy as np

p_val = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])
positive = p_val[y_val == 1]
negative = p_val[y_val == 0]
pair_scores = [(pos > neg) + 0.5 * (pos == neg) for pos in positive for neg in negative]
auc = float(np.mean(pair_scores))
print("positive-negative pairs:", len(pair_scores))
print("validation AUC:", round(auc, 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
positive-negative pairs: 16
validation AUC: 0.812
```
<!-- leetllm: output:end -->

The positives win 13 pairs, so AUC is $13/16=0.8125$. AUC measures ordering across thresholds. The cost table measures the consequences of a particular threshold. They answer different questions.

<figure>
  <img src="illustrations/_generated/roc_threshold_sweep_dark.png" alt="Validation ROC staircase with threshold checkpoints 0.80, 0.50, and 0.20 alongside a four-by-four positive-versus-negative score matrix with 13 ranking wins out of 16 pairs, producing AUC 0.8125." />
  <figcaption>The staircase sweeps every validation score. The matrix gives the equivalent ranking view: positive responses outrank negatives in `13` of `16` pairs, so AUC is `13 / 16 = 0.8125`.</figcaption>
</figure>

### Precision-recall curves show the selected set

A **precision-recall curve** follows the same threshold sweep, plotting precision against recall. Recall rises as more positives enter. Precision can rise or fall depending on the label of the next response.

For example, V4 is negative and scores $0.624$, just above positive V3 at $0.595$. When V4 enters, precision falls to $2/3$. When V3 enters next, it rises to $3/4$. The order of these two responses explains the dip and recovery in the curve.

<figure>
  <img src="illustrations/_generated/precision_recall_focus_dark.png" alt="Validation precision-recall threshold points, including the dip to precision 0.667 when false positive V4 enters before true positive V3, and final precision 0.5 when all eight rows enter. Beside them are verification queues at thresholds 0.80, 0.50, and 0.20." />
  <figcaption>Precision isn't monotonic as you lower the threshold. `V4` (score `0.624`, actual 0) enters before `V3` (score `0.595`, actual 1), so precision drops to `0.667` and then recovers to `0.75` at `t = 0.50`. The `(0, 1)` endpoint represents an empty selected set.</figcaption>
</figure>

**Average precision (AP)** summarizes the curve by weighting each precision value by the increase in recall at that step:

$$
\mathrm{AP}=\sum_k(R_k-R_{k-1})P_k.
$$

With distinct scores, each positive contributes an equal recall increase, so AP is the mean precision at the positive ranks. Our positives occur at ranks $1,2,4,6$, giving

$$
\mathrm{AP}=\frac{1+1+3/4+4/6}{4}\approx0.854.
$$

Tied scores enter together. For scores and labels $(0.9,1),(0.8,0),(0.8,1),(0.3,0)$, recall rises by $1/2$ at score $0.9$ and by $1/2$ when both $0.8$ rows enter. AP is then $(1/2)(1)+(1/2)(2/3)=5/6$. Scikit-learn's `average_precision_score` handles those groups. AP uses recall steps; trapezoidal integration under a precision-recall plot can produce a different value.[^sklearnAveragePrecision2026]

<!-- leetllm: test, deps=numpy, output=show -->
```python title="average-precision-on-validation.py"
import numpy as np

p_val = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])

# For distinct scores, AP is the mean precision at each positive row's rank.
order = np.argsort(-p_val)
y_sorted = y_val[order]
tp_cum = np.cumsum(y_sorted)
fp_cum = np.cumsum(1 - y_sorted)
precision_at = tp_cum / (tp_cum + fp_cum)
ap = float(precision_at[y_sorted == 1].mean())
print("validation average precision:", round(ap, 3))
print("validation ROC-AUC:   ", 0.812)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
validation average precision: 0.854
validation ROC-AUC:    0.812
```
<!-- leetllm: output:end -->

### Class balance changes precision

Suppose recall is $0.9$ and false-positive rate is $0.1$. In a population of 100 positives and 100 negatives, that means 90 true positives and 10 false positives, giving precision $90\%$. In a population of 100 positives and 9,900 negatives, the same rates produce 90 true positives and 990 false positives, giving precision about $8.3\%$.

The ROC point is $(0.1,0.9)$ in both cases. Each ROC axis divides by its own actual class count, while precision mixes the two classes in the selected set. Precision-recall curves therefore show the effect of rare positives on the work created by a classifier.

This comparison holds the score distribution within each class fixed. The following program makes the distinction concrete. Repeating all negative scores 25 times preserves their mix; appending 100 easy zero-score negatives changes it.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="prevalence-invariance-needs-the-same-score-mix.py"
import numpy as np

p = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y = np.array([0, 0, 1, 0, 1, 0, 1, 1])
positive = p[y == 1]
negative = p[y == 0]

def evaluate_slice(labels: np.ndarray, scores: np.ndarray) -> tuple[float, float, float]:
    pos = scores[labels == 1]
    neg = scores[labels == 0]
    pairs = (pos[:, None] > neg[None, :]) + 0.5 * (pos[:, None] == neg[None, :])
    selected = scores >= 0.20
    precision = float(np.mean(labels[selected]))
    return float(np.mean(neg >= 0.20)), float(np.mean(pairs)), precision

same_mix_y = np.r_[np.ones(len(positive), dtype=int), np.zeros(25 * len(negative), dtype=int)]
same_mix_p = np.r_[positive, np.repeat(negative, 25)]
easy_y = np.r_[y, np.zeros(100, dtype=int)]
easy_p = np.r_[p, np.zeros(100)]

for name, labels, scores in (
    ("original", y, p),
    ("same-negative-mix", same_mix_y, same_mix_p),
    ("extra-easy-negatives", easy_y, easy_p),
):
    fpr, auc, precision = evaluate_slice(labels, scores)
    print(name, "fpr", round(fpr, 4), "auc", round(auc, 4), "precision", round(precision, 4))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
original fpr 0.5 auc 0.8125 precision 0.6667
same-negative-mix fpr 0.5 auc 0.8125 precision 0.0741
extra-easy-negatives fpr 0.0192 auc 0.9928 precision 0.6667
```
<!-- leetllm: output:end -->

Repeating the negative mix leaves AUC at $0.8125$ while creating 50 false positives alongside four true positives, dropping precision to $4/54\approx0.0741$. Appending 100 easy zero-score negatives lifts AUC to $0.9928$ without changing the selected set or its mistakes at all.

> **Key insight:** ROC-AUC measures ranking within fixed class score distributions; precision-recall reflects the real false-alarm burden when positives are rare. Always read classification metrics alongside class prevalence.

## Calibration: does 0.8 mean about eight in ten?

Ranking asks whether positives tend to score above negatives. **Calibration** asks whether the probability values match observed frequencies. Among many responses assigned probabilities near $0.8$, about eight in ten should be positive if those probabilities are calibrated.

A monotonic change to scores can preserve their order while changing their meaning as probabilities. Making every logit twice as large pushes probabilities away from $0.5$ without changing which example ranks above another. AUC stays the same, while log loss and calibration can change.

A **reliability diagram** groups nearby probabilities into bins. Each point compares a bin's mean prediction with its observed positive fraction. Perfect calibration lies on the diagonal. In our lowest bin, the mean prediction is about $0.158$, while one of its three responses is positive, giving an observed fraction of $1/3$.

**Expected calibration error (ECE)** averages the absolute bin gaps, weighting each by the fraction of examples in that bin:

$$
\mathrm{ECE}=\sum_b\frac{|B_b|}{n}
\left|\operatorname{mean}_{i\in B_b}p_i-
\operatorname{mean}_{i\in B_b}y_i\right|.
$$

The lowest bin contributes $(3/8)|0.158-0.333|\approx0.066$. The following calculation includes all four bins and also computes the **Brier score**, the mean squared probability error:

$$
\mathrm{Brier}=\frac1n\sum_i(p_i-y_i)^2.
$$

<!-- leetllm: test, deps=numpy, output=show -->
```python title="calibration-on-validation-labels.py"
import numpy as np

p_val = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
y_val = np.array([0, 0, 1, 0, 1, 0, 1, 1])
edges = np.linspace(0.0, 1.0, 5)
ece = 0.0
for lo, hi in zip(edges[:-1], edges[1:]):
    mask = (p_val >= lo) & ((p_val < hi) if hi < 1.0 else (p_val <= hi))
    if mask.any():
        avg_p = p_val[mask].mean()
        frac_pos = y_val[mask].mean()
        ece += mask.mean() * abs(avg_p - frac_pos)
        closing = "]" if hi == 1.0 else ")"
        print(f"[{lo:.2f}, {hi:.2f}{closing} n={mask.sum()} avg_p={avg_p:.3f} frac_pos={frac_pos:.3f}")
print("validation ECE:", round(float(ece), 3))
print("validation Brier:", round(float(np.mean((p_val - y_val)**2)), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
[0.00, 0.25) n=3 avg_p=0.158 frac_pos=0.333
[0.25, 0.50) n=1 avg_p=0.325 frac_pos=0.000
[0.50, 0.75) n=2 avg_p=0.609 frac_pos=0.500
[0.75, 1.00] n=2 avg_p=0.980 frac_pos=1.000
validation ECE: 0.139
validation Brier: 0.158
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/reliability_diagram_dark.png" alt="Four calibration-bin points compare mean predicted verification score with observed verification frequency against the perfect-calibration diagonal. Their bin sizes weight absolute gaps of 0.175, 0.325, 0.110, and 0.020 into ECE contributions 0.066, 0.041, 0.027, and 0.005, totaling 0.139." />
  <figcaption>Each bin contributes its score-frequency gap weighted by its share of the eight validation responses: `0.066 + 0.041 + 0.027 + 0.005 ≈ 0.139`. The bin counts show how many responses support each observed frequency.</figcaption>
</figure>

ECE is about $0.139$ and the Brier score is about $0.158$. ECE depends on the bins: errors within a wide bin can cancel before its absolute gap is taken. Brier score uses individual predictions and needs no bins, but it reflects both probability reliability and the model's ability to distinguish outcomes.[^sklearnCalibration2026]

### Why the number of examples in each bin matters

A bin containing one response has an observed fraction of either zero or one. Adding a few responses can move that fraction substantially. Our small table makes the arithmetic visible; a reliability curve for a deployed model should be supported by many more examples per region.

Changing V4's label illustrates the effect. It improves F1 at threshold $0.5$, yet raises the four-bin ECE:

<!-- leetllm: test, deps=numpy, output=show -->
```python title="one-label-changes-small-sample-conclusions.py"
import numpy as np

def f1_at_half(y: np.ndarray, p: np.ndarray) -> float:
    pred = p >= 0.5
    tp = ((pred == 1) & (y == 1)).sum()
    fp = ((pred == 1) & (y == 0)).sum()
    fn = ((pred == 0) & (y == 1)).sum()
    return float(2 * tp / (2 * tp + fp + fn))

def ece(y: np.ndarray, p: np.ndarray) -> float:
    edges = np.linspace(0.0, 1.0, 5)
    total = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        mask = (p >= lo) & ((p < hi) if hi < 1.0 else (p <= hi))
        if mask.any():
            total += mask.mean() * abs(p[mask].mean() - y[mask].mean())
    return float(total)

p = np.array([0.061, 0.169, 0.595, 0.624, 0.971, 0.325, 0.990, 0.244])
base = np.array([0, 0, 1, 0, 1, 0, 1, 1])
one_flip = base.copy()
one_flip[3] = 1
for name, labels in (("base", base), ("one flip", one_flip)):
    print(f"{name:8s} f1={f1_at_half(labels, p):.3f} ece={ece(labels, p):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
base     f1=0.750 ece=0.139
one flip f1=0.889 ece=0.209
```
<!-- leetllm: output:end -->

These metrics measure different properties. F1 uses thresholded labels, while ECE compares group frequencies with probability values. Inspect the bin counts and points as well as the aggregate score.

If probabilities need adjustment, fit a calibration map on examples not used to train the base model. **Platt scaling** fits a sigmoid to the model's scores. **Isotonic regression** fits a nondecreasing step function. **Temperature scaling** uses $\sigma(z/T)$ in the binary case: $T>1$ softens probabilities toward $0.5$, while $0<T<1$ sharpens them. A positive temperature preserves ranking. Select the resulting threshold using validation data and reserve a test set for the completed pipeline.[^guo2017][^sklearnCalibration2026]

### Derive a threshold from expected cost

Calibrated probabilities let us compare the expected cost of two actions for one response. At probability $p$, leaving it unchecked costs $120p$ on average. Checking it costs $18(1-p)$ under our convention that only unnecessary checks incur this error cost. Verification is cheaper when

$$
18(1-p)\le120p
\quad\Longleftrightarrow\quad
p\ge\frac{18}{120+18}\approx0.130.
$$

At $p=0.2$, those expected costs are `$24` and `$14.40`, so checking is preferable. This analytical cutoff uses a probability model and a cost model. The earlier table directly compared observed costs on validation examples. They are two ways to reason about the same decision, and their best numerical cutoffs need not coincide on a finite sample.

## More than two classes: softmax regression

Suppose the labels now describe three outcomes: a supported response suitable for direct delivery, a response needing verification, or a response that should be withheld and replaced. Give each class its own weight vector and compute one logit per class.

Using weight matrix $W\in\mathbb R^{d\times K}$ and a row-oriented batch $X$, the logits are $Z=XW$. **Softmax** converts each row of logits into probabilities that sum to one:[^bishop2006][^goodfellow2016]

$$
p_k=\frac{e^{z_k}}{\sum_{j=1}^K e^{z_j}}.
$$

Only differences between logits matter. Adding the same constant to every logit multiplies the numerator and denominator by the same factor, leaving the probabilities unchanged. For two classes,

$$
p_1=\frac{e^{z_1}}{e^{z_0}+e^{z_1}}=\sigma(z_1-z_0).
$$

Binary logistic regression is the two-class case with one reference logit fixed at zero.

For a one-hot target vector $y$, categorical cross-entropy is $-\sum_k y_k\log p_k$, which selects the negative log probability of the true class. The batch gradient has the same form as before:

$$
L(W)=-\frac1N\sum_i\sum_k y_{i,k}\log p_{i,k},
\qquad
\nabla_WL=\frac1N X^\top(P-Y).
$$

Here $P$ and $Y$ both have shape $(N,K)$. Adding the same vector to every column of $W$ shifts every class logit equally and leaves predictions unchanged; a reference class or regularization convention can remove that parameter ambiguity.

To evaluate softmax safely, subtract the largest logit in each row before exponentiating. Every shifted value is at most zero, and the common shift cancels from the ratio. Compute cross-entropy from the shifted log probabilities too, so a confident mistake retains its full loss.

<!-- leetllm: test, deps=numpy, output=show -->
```python title="multiclass-softmax-routing.py"
import numpy as np

def softmax(Z: np.ndarray) -> np.ndarray:
    shift_Z = Z - np.max(Z, axis=1, keepdims=True)
    exp_Z = np.exp(shift_Z)
    return exp_Z / np.sum(exp_Z, axis=1, keepdims=True)

def categorical_cross_entropy_from_logits(Y_onehot: np.ndarray, Z: np.ndarray) -> float:
    shifted = Z - np.max(Z, axis=1, keepdims=True)
    log_normalizer = np.log(np.sum(np.exp(shifted), axis=1, keepdims=True))
    log_probabilities = shifted - log_normalizer
    return float(-np.mean(np.sum(Y_onehot * log_probabilities, axis=1)))

# 6 candidate responses: [ambiguity, retrieval support] + intercept column
# Target routing classes: 0: Direct, 1: Verify, 2: Block
X_raw = np.array([
    [1.0, 8.0],
    [1.5, 7.0],
    [2.5, 4.0],
    [3.2, 5.0],
    [4.8, 1.5],
    [5.0, 1.0],
])
X = np.c_[np.ones(len(X_raw)), X_raw]
y_classes = np.array([0, 0, 1, 1, 2, 2])
K = 3
N, d = X.shape
Y_onehot = np.eye(K)[y_classes]

W = np.zeros((d, K))
lr = 0.2
for epoch in range(1000):
    P = softmax(X @ W)
    grad = (1 / N) * (X.T @ (P - Y_onehot))
    W -= lr * grad

P_final = softmax(X @ W)
preds = np.argmax(P_final, axis=1)
loss = categorical_cross_entropy_from_logits(Y_onehot, X @ W)
print("final loss:", round(loss, 4))
print("predicted classes:", preds.tolist())
print("all correct:", bool((preds == y_classes).all()))
print("sample probabilities row 0 (direct):", P_final[0].round(3).tolist())
print("sample probabilities row 4 (block):", P_final[4].round(3).tolist())

extreme_logits = np.array([[1000.0, 0.0, -1000.0]])
extreme_target = np.array([[0.0, 0.0, 1.0]])
extreme_loss = categorical_cross_entropy_from_logits(extreme_target, extreme_logits)
assert np.isfinite(extreme_loss) and np.isclose(extreme_loss, 2000.0)
print("extreme wrong log loss:", round(extreme_loss, 1))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
final loss: 0.0055
predicted classes: [0, 0, 1, 1, 2, 2]
all correct: True
sample probabilities row 0 (direct): [1.0, 0.0, 0.0]
sample probabilities row 4 (block): [0.0, 0.005, 0.995]
extreme wrong log loss: 2000.0
```
<!-- leetllm: output:end -->

The six training examples are correctly classified. Printed zeros and ones are rounded probabilities. On these separable examples, an unregularized model can keep reducing loss by increasing its weight magnitudes. The extreme-logit check shows why the logit formulation matters: assigning the true class a score 2000 below the winning class produces a loss of about 2000 nats.

## Other ways to use a score or a similarity

Logistic regression gave us one complete approach: form a linear score, convert it to probabilities, and learn with log loss. Two related model families emphasize different properties of that computation. They provide useful comparisons once the logistic model and its metrics are clear.

### Support vector machines learn a margin

A **support vector machine (SVM)** also begins with $f(x)=w^\top x+b$. It seeks a separating boundary with a wide buffer between the classes. Encode the labels as $+1$ and $-1$, so the **functional margin** $yf(x)$ is positive for a correct classification and negative for a mistake.[^sklearn2026svm]

The ordinary **hinge loss** is

$$
\ell_{\mathrm{hinge}}=\max(0,1-yf(x)).
$$

A positive example with score $0.4$ is on the correct side but inside the unit margin, so its loss is $0.6$. At score $1.4$, it clears the margin and has zero hinge loss. Logistic loss still gives that example a small loss, about $0.220$. Hinge loss concentrates its pressure on points at or inside the margin; these include the support vectors in a soft-margin SVM.

Dividing $yf(x)$ by $\|w\|_2$ converts the functional margin into signed geometric distance. The SVM objective balances a weight penalty with the hinge losses, rather than treating the raw margin score as a probability. Libraries may use ordinary or squared hinge loss, so match that choice when comparing implementations.

### Kernels compare nearby examples

A linear SVM has a straight boundary, like logistic regression. A **kernel** lets it use a richer notion of similarity. The radial basis function, or **RBF kernel**, is

$$
k(x,x')=\exp\left(-\frac{\|x-x'\|^2}{2\ell^2}\right).
$$

The length scale $\ell$ controls how far similarity reaches. At $\ell=1$, identical points have similarity $1$, points one unit apart have similarity about $0.607$, and points three units apart have similarity about $0.011$. An RBF SVM combines similarities to support vectors, allowing a curved decision boundary without explicitly storing all the corresponding feature coordinates. Feature scaling and the length scale determine which points count as nearby.

### Gaussian processes put uncertainty around a function

A **Gaussian process (GP)** uses a kernel as a covariance function: it describes how strongly the unknown function values at two inputs should move together. After observing data, it produces a posterior distribution over functions, including a prediction mean and variance.[^rasmussenWilliams2006Regression]

A one-observation regression example makes the conditioning visible. Start with prior mean zero, prior variance one, and an RBF kernel of length scale one. Observe $y=2$ at $x=0$ with Gaussian noise variance $0.04$. For a test input $x$,

$$
\mu_*(x)=\frac{2k(x,0)}{1.04},\qquad
\sigma_*^2(x)=1-\frac{k(x,0)^2}{1.04}.
$$

At the observed location, $k=1$, so the mean is about $1.923$ and latent variance is about $0.0385$. Far away, similarity tends to zero: the mean returns to zero and latent variance returns to one. Predicting a **new noisy observation** adds $0.04$ to the latent variance before taking a square root for its standard deviation.

The program compares the margin losses and computes this GP prediction at three distances:

<!-- leetllm: test, output=show -->
```python title="compare-margin-loss-and-kernel-uncertainty.py"
from math import exp, log1p, sqrt

examples = [
    ("needs-verify", 1, 0.4),
    ("confident-verify", 1, 1.4),
    ("missed-verify", 1, -0.2),
    ("safe-direct", -1, -1.2),
]

for name, label, score in examples:
    margin = label * score
    hinge = max(0.0, 1.0 - margin)
    logistic = log1p(exp(-margin))
    print(f"{name:16} margin={margin:4.1f} hinge={hinge:.3f} logistic={logistic:.3f}")

print("distance  kernel  gp_mean  gp_std")
for distance in [0.0, 1.0, 3.0]:
    similarity = exp(-(distance**2) / 2.0)
    mean = 2.0 * similarity / 1.04
    standard_deviation = sqrt(1.0 - similarity**2 / 1.04)
    print(f"{distance:8.1f}  {similarity:.3f}   {mean:.3f}    {standard_deviation:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
needs-verify     margin= 0.4 hinge=0.600 logistic=0.513
confident-verify margin= 1.4 hinge=0.000 logistic=0.220
missed-verify    margin=-0.2 hinge=1.200 logistic=0.798
safe-direct      margin= 1.2 hinge=0.000 logistic=0.263
distance  kernel  gp_mean  gp_std
     0.0  1.000   1.923    0.196
     1.0  0.607   1.166    0.804
     3.0  0.011   0.021    1.000
```
<!-- leetllm: output:end -->

The GP example is regression, where Gaussian noise gives closed-form conditioning. GP classification uses a binary likelihood and generally needs approximate inference. Exact dense GP training takes roughly $O(n^3)$ computation and $O(n^2)$ storage, so larger datasets often use approximations. With several observations, uncertainty depends on their combined arrangement and the chosen kernel, rather than distance to one point alone.

| Model | Central idea | Output |
|---|---|---|
| Logistic regression | Fit linear log-odds using log loss | Class probability estimate |
| Linear SVM | Separate classes with a large margin | Signed decision score |
| RBF SVM | Combine similarities to support vectors | Nonlinear decision score |
| Gaussian process | Condition a distribution over functions | Predictive mean and uncertainty |

## When a training run behaves unexpectedly

If NumPy and scikit-learn disagree, first match the objective: intercept handling, regularization, and stopping criteria. Then compare logits and loss values. Different parameter vectors can describe the same predictions when the parameterization has redundant directions.

If loss grows after updates, inspect the learning rate and feature scales. A gradient gives a local downhill direction, but a large step can cross the valley. Printing the first few losses often makes overshooting visible.

If a loss has a plausible value but the gradients are wrong, inspect array shapes. In our binary code, logits and labels both have shape $(8,)$. Combining logits of shape $(8,)$ with labels of shape $(8,1)$ can broadcast into an $(8,8)$ table. The intended objective pairs each prediction with its own label.

If probabilities cluster near the base rate, compare with a constant predictor and inspect the features, regularization, and convergence. If ranking is good but probabilities are too extreme, inspect the reliability diagram and consider calibration. These observations point to different parts of the model.

## Practice with the same predictions

1. Starting at zero weights, compute the batch gradient from the eight training rows and take one step with learning rate $0.2$.
2. Train with learning rate $2.0$ and print the first ten losses. Explain any increases using the gradient and feature scales.
3. Compare validation thresholds $[0.2,0.35,0.5,0.65,0.8]$. Compute selected counts, precision, recall, F1, and the stated error cost.
4. Compute ECE using four equal-width bins, then eight. Explain how a changed grouping can change ECE without changing a single prediction.
5. Multiply every validation logit by two. Which response ordering and ranking metrics stay the same? Recompute log loss and Brier score to see whether the sharper probabilities improve them.

```checkpoint
Worked answers
---
1. The mean gradient is [0,−0.34375,−0.375], giving new weights [0,0.06875,0.075].
2. The first ten losses at learning rate 2.0 are approximately [2.1775,10.3821,6.7627,4.0487,10.9055,1.2343,10.2505,6.5729,3.9065,10.7451]. They repeatedly jump upward because the step is too large for this feature scale. The original 0.2 run makes much smaller updates.
3. Threshold 0.20 selects six responses: precision 2/3, recall 1, F1 0.8, cost `$36`. Thresholds 0.35 and 0.50 each select four: precision 0.75, recall 0.75, F1 0.75, cost `$138`. Thresholds 0.65 and 0.80 each select two: precision 1, recall 0.5, F1 about 0.667, cost `$240`.
4. With the three-decimal scores, four-bin ECE is about 0.139 and eight-bin ECE is about 0.154. Wider bins can combine gaps of opposite signs before the absolute value is taken.
5. Multiplication by a positive constant preserves logit order, and sigmoid is increasing, so AUC stays at 0.8125 and AP at about 0.8542. Using the displayed probabilities, doubling their logits raises log loss from about 0.4486 to 0.5398 and Brier score from about 0.1580 to 0.1870. Sharper probabilities make the mistakes more costly even though ranking is unchanged.
```

## Mastery check

```mastery-quiz
[
  {
    "question": "A logistic model has intercept −1.1 and coefficients [3, −4]. For input [2,1], what probability does it predict, and does it cross a threshold of 0.8?",
    "options": [
      "p ≈ 0.711; it stays below the threshold.",
      "p = 0.9; it crosses the threshold.",
      "p ≈ 0.881; it crosses the threshold.",
      "p ≈ 0.289; it stays below the threshold."
    ],
    "answer": "p ≈ 0.711; it stays below the threshold.",
    "explanation": "The logit is −1.1 + 3×2 − 4×1 = 0.9. Sigmoid gives about 0.711. Comparing the logit directly with 0.8 skips the probability mapping; 0.881 omits the intercept, and 0.289 reverses the sign."
  },
  {
    "question": "A positive example receives logit −8. Why does binary cross-entropy still produce a strong correction?",
    "options": [
      "Its logit derivative is p−1, close to −1.",
      "Its logit derivative is the sigmoid slope, close to zero.",
      "Its logit derivative is p, close to zero.",
      "Its logit derivative is 1−p, so gradient descent lowers the logit."
    ],
    "answer": "Its logit derivative is p−1, close to −1.",
    "explanation": "The cross-entropy and sigmoid derivatives simplify to p−y. With y=1 and p≈0.000335, the derivative is about −0.999665. Subtracting the gradient raises the logit and reduces this confident error."
  },
  {
    "question": "A two-row mean-BCE update starts at zero weights with design rows [1, 2] and [1, −1], and labels [1, 0]. Use learning rate 0.4. What are the mean weight gradient and new weights?",
    "options": [
      "Gradient [0, 0.75]; weights [0, −0.3].",
      "Gradient [0, −1.5]; weights [0, 0.6].",
      "Gradient [0, −0.1875]; weights [0, 0.075].",
      "Gradient [0, −0.75]; weights [0, 0.3]."
    ],
    "answer": "Gradient [0, −0.75]; weights [0, 0.3].",
    "explanation": "Both predictions begin at 0.5. The row contributions are [−0.5, −1] and [0.5, −0.5]. Their mean is [0, −0.75]; subtracting 0.4 times that gradient gives [0, 0.3]. The other values reverse descent, use the sum rather than the mean, or multiply by the sigmoid derivative again."
  },
  {
    "question": "Two thresholds produce these validation counts: H has TP=4, FP=1, FN=2; L has TP=6, FP=3, FN=0. An unnecessary check costs $20 and a missed claim costs $80. Which threshold has lower error cost?",
    "options": [
      "H, with cost $180.",
      "L, with cost $60.",
      "H, with cost $100.",
      "L, with cost $180."
    ],
    "answer": "L, with cost $60.",
    "explanation": "H costs 1×$20 + 2×$80 = $180. L costs 3×$20 + 0×$80 = $60. L selects more responses, but its additional false positives cost less than the misses it prevents."
  },
  {
    "question": "A classifier has recall 0.8 and false-positive rate 0.02 on 100 positives and 19,900 negatives. What are its precision and ROC point (FPR, TPR)?",
    "options": [
      "Precision 80.00%; ROC (0.02, 0.8).",
      "Precision 16.74%; ROC (0.8, 0.02).",
      "Precision 16.74%; ROC (0.02, 0.8).",
      "Precision 99.50%; ROC (0.02, 0.8)."
    ],
    "answer": "Precision 16.74%; ROC (0.02, 0.8).",
    "explanation": "There are 80 true positives and 398 false positives, so precision is 80/478, about 16.74%. The ROC point is (FPR,TPR) = (0.02,0.8). Recall uses actual positives as its denominator; precision uses all selected examples."
  },
  {
    "question": "Four rows have (score,label): (0.9,1), (0.8,0), (0.8,1), (0.3,0). Count AUC ties as half a win and admit tied scores together for AP. What are ROC-AUC and average precision?",
    "options": [
      "AUC 0.750, AP 0.833.",
      "AUC 1.000, AP 1.000.",
      "AUC 0.875, AP 0.833.",
      "AUC 0.875, AP 1.000."
    ],
    "answer": "AUC 0.875, AP 0.833.",
    "explanation": "The four positive-negative pairs give three wins and one tie, so AUC is 3.5/4 = 0.875. Counting the tie as a loss gives 0.750. Recall rises by half at 0.9 and by half when both 0.8 rows enter. Precision at those steps is 1 and 2/3, so AP is 0.5×1 + 0.5×(2/3) = 5/6, about 0.833. Putting the tied positive first for AP alone gives AP 1.000 with AUC 0.875. Breaking the tie that way for both metrics gives 1.000 for each."
  },
  {
    "question": "Predictions [0.1, 0.3, 0.6, 0.8] have labels [0, 1, 0, 1]. For binary positive-class ECE, use bins [0, 0.5) and [0.5, 1]. What are ECE and mean Brier score?",
    "options": [
      "ECE 0.25; Brier 0.225.",
      "ECE 0.05; Brier 0.225.",
      "ECE 0.25; Brier 0.90.",
      "ECE 0.50; Brier 0.25."
    ],
    "answer": "ECE 0.25; Brier 0.225.",
    "explanation": "The bin means are 0.2 and 0.7, each observed rate is 0.5, and each bin owns half the rows. ECE is 0.5×0.3 + 0.5×0.2 = 0.25. Squared errors sum to 0.90 and average to 0.225. Signed gap cancellation, omitting mean normalization, and confusing prevalence with error give the alternatives."
  },
  {
    "question": "A three-class model emits logits [1003,1001,1000], with the middle class as target. What are its cross-entropy loss and derivative with respect to the target logit? Round to three decimals.",
    "options": [
      "Loss 0.170, target derivative −0.886.",
      "Loss 2.170, target derivative +0.114.",
      "Loss 2.000, target derivative −0.865.",
      "Loss 2.170, target derivative −0.886."
    ],
    "answer": "Loss 2.170, target derivative −0.886.",
    "explanation": "Subtracting 1003 gives [0, −2, −3]. Their exponentials sum to about 1.18512. The loss is ln(1.18512) − (−2) ≈ 2.170. A loss of 0.170 omits the shifted target logit. The target probability is exp(−2)/1.18512 ≈ 0.114. Its one-hot label is 1, so the loss derivative is 0.114 − 1 ≈ −0.886. The +0.114 choice skips that subtraction. The loss of 2.000 and derivative of −0.865 use exp(−2) as the probability without dividing by the sum."
  },
  {
    "question": "An SVM example has label −1 and score +0.3. An RBF kernel compares points distance 2 apart with length scale 2. What are the margin, hinge loss, and similarity?",
    "options": [
      "Margin +0.3; hinge 0.7; kernel 0.607.",
      "Margin −0.3; hinge 1.3; kernel 0.607.",
      "Margin −0.3; hinge 1.0; kernel 0.607.",
      "Margin −0.3; hinge 1.3; kernel 0.135."
    ],
    "answer": "Margin −0.3; hinge 1.3; kernel 0.607.",
    "explanation": "The signed margin is (−1)×0.3 = −0.3, so ordinary hinge loss is max(0, 1 − (−0.3)) = 1.3. The score predicts +1 and the label is −1, so 0/1 loss charges 1.0 for the wrong sign. Dropping the label sign gives a margin of +0.3 and a hinge loss of 0.7. The kernel is exp(−(2/2)²/2) ≈ 0.607. Omitting the length scale gives exp(−2²/2) ≈ 0.135."
  },
  {
    "question": "A zero-mean GP has one observation y=3, unit prior variance, and noise variance 0.25. A test point has kernel similarity 0.5 to that observation and prior variance 1. What are its posterior mean, latent variance, and new-observation variance?",
    "options": [
      "Mean 1.2; latent variance 0.8; observation variance 1.05.",
      "Mean 1.5; latent variance 0.75; observation variance 1.00.",
      "Mean 1.2; latent variance 0.8; observation variance 0.8.",
      "Mean 1.2; latent variance 0.6; observation variance 0.85."
    ],
    "answer": "Mean 1.2; latent variance 0.8; observation variance 1.05.",
    "explanation": "The conditioning denominator is 1+0.25 = 1.25. Mean is 3×0.5/1.25 = 1.2; latent variance is 1−0.5²/1.25 = 0.8. Add the new observation’s 0.25 noise variance for 1.05. Omitting training noise, omitting future noise, or failing to square the cross-covariance yields the alternatives."
  }
]
```

> **Next:** Continue to [Decision Trees, Forests, and Boosting](/learn/decision-trees-random-forests-gradient-boosting). Logistic regression uses one straight boundary. The next lesson uses flower measurements to show how a sequence of feature-based splits creates more flexible regions.
