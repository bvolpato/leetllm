---
{
  "id": "decision-trees-random-forests-gradient-boosting",
  "title": "Decision Trees, Forests, and Boosting",
  "slug": "decision-trees-random-forests-gradient-boosting",
  "section": "ML Algorithms & Evaluation",
  "category": "Model Architecture",
  "difficulty": "Medium",
  "order": 3,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": ["OpenAI", "Anthropic", "Google", "Meta"],
  "shortDescription": "Learn how trees discover useful questions, forests combine different answers, and boosting improves a prediction one correction at a time. Fit and inspect each model on flower measurements.",
  "keyConceptsTested": [
    "Decision-tree splits, leaf probabilities, and rectangular regions",
    "Gini impurity, entropy, and weighted impurity decrease",
    "Tree depth, leaf size, pruning, and held-out evaluation",
    "Bootstrap sampling, feature subsampling, and out-of-bag predictions",
    "Forest averaging and correlated prediction errors",
    "Regression residuals and gradient boosting",
    "Classification gradients, Newton leaf updates, and regularization",
    "Permutation importance and local feature attribution",
    "Missing-value routes and preprocessing conventions"
  ]
}
---

Put two flower species on a table and try to tell them apart. Some have narrow petals; others have wider petals. A useful first question might be, "Is the petal at most 1.75 cm wide?" For many flowers, that one measurement nearly settles the answer. For the remaining flowers, another question about petal length may help.

A <span data-glossary="decision-tree">decision tree</span> learns questions like these from labeled examples. Training chooses the measurements and cutoffs. Prediction follows the resulting branches until it reaches a **leaf**, where the tree stores an answer. The model resembles a field guide whose identification key was learned from data.

We will fit a tree that distinguishes *versicolor* from *virginica*, inspect why it chooses its first question, and then improve on a single tree in two different ways. A random forest averages trees trained with different views of the data. Gradient boosting builds a prediction gradually, with each new tree correcting what remains wrong.

## Fit one useful question

The Iris dataset includes measured flowers and their species. Scikit-learn bundles it locally, so this example needs no download or service account.[^sklearnIrisDataset2026] We will use the 100 versicolor and virginica flowers, with petal length and width as features. Label `0` means versicolor and label `1` means virginica.

Before fitting, reserve 30 flowers for validation. The remaining 70 flowers contain 35 examples of each species. `stratify=y` preserves that balance in the split. We will reuse this exact split throughout the classifier comparison.

A **decision stump** is a tree with just one question. Fit one and ask it about a flower with a 5.0 cm petal length and a 1.8 cm petal width:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=tree-data -->
```python title="first-flower-tree.py"
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

iris = load_iris()
keep = iris.target > 0
X = iris.data[keep][:, [2, 3]]
y = iris.target[keep] - 1
names = ["petal length", "petal width"]
X_train, X_valid, y_train, y_valid = train_test_split(
    X, y, test_size=0.30, stratify=y, random_state=7,
)

stump = DecisionTreeClassifier(max_depth=1, random_state=0).fit(X_train, y_train)
feature = stump.tree_.feature[0]
cut = stump.tree_.threshold[0]
flower = np.array([[5.0, 1.8]])
print(f"question: {names[feature]} <= {cut:.2f} cm?")
print("species:", iris.target_names[1 + stump.predict(flower)[0]])
print("probabilities [versicolor, virginica]:", stump.predict_proba(flower)[0].round(3))
print("training accuracy:", round(stump.score(X_train, y_train), 3))
print("validation accuracy:", round(stump.score(X_valid, y_valid), 3))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
question: petal width <= 1.75 cm?
species: virginica
probabilities [versicolor, virginica]: [0.031 0.969]
training accuracy: 0.929
validation accuracy: 0.967
```
<!-- leetllm: output:end -->

The trained question uses **width**, even though we supplied both measurements. The new flower's width, 1.8 cm, exceeds 1.75 cm, so it takes the right branch. That leaf contains 31 virginica flowers and one versicolor flower. Its virginica probability is therefore $31/32 \approx 0.969$.

The left branch contains 34 versicolor flowers and four virginica flowers. Every flower reaching it receives the same virginica probability, $4/38 \approx 0.105$. A tree's probability comes from the labels collected in its leaf. Within that leaf, moving slightly left or right does not smoothly change the answer as it would in logistic regression.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The 70 training flowers are plotted by petal width and length. A vertical cut at width 1.75 cm separates a left region containing 34 versicolor and four virginica flowers from a right region containing one versicolor and 31 virginica flowers. The regions predict virginica probabilities 0.105 and 0.969." />
  <figcaption>The first question creates two rectangular regions. Most narrow petals belong to versicolor and most wide petals to virginica, but the remaining mixed labels give deeper branches something to work on.</figcaption>
</figure>

Notice two different thresholds. The **feature cutoff**, 1.75 cm, determines a branch. A **classification threshold**, such as virginica probability at least 0.5, turns the leaf's probability into a class. Changing the latter changes the decision without rebuilding the tree. If the two kinds of classification mistake have different consequences, select that operating threshold using the relevant validation metric.

## How training chooses a split

The tree needs a way to compare possible questions. A good question produces children whose labels are less mixed than the parent's labels. **<span data-glossary="gini-impurity">Gini impurity</span>** measures that mixture. If class $k$ occupies fraction $p_k$ of a node, then

$$
G = 1 - \sum_{k=1}^{K} p_k^2.
$$

For two species, write $p$ for the virginica fraction. The expression becomes $G=2p(1-p)$. A node containing one species has impurity zero. A 50/50 mixture has impurity 0.5. One way to understand the formula is to draw two labels independently from the node's class proportions: $G$ is the probability that they disagree.

Our root contains 35 flowers of each species, so its impurity is $0.5$. For the learned width cutoff, the calculation is:

| Region | Versicolor | Virginica | Gini impurity |
|---|---:|---:|---:|
| All training flowers | 35 | 35 | $2(35/70)(35/70)=0.5000$ |
| Width $\le 1.75$ cm | 34 | 4 | $2(34/38)(4/38)\approx0.1884$ |
| Width $>1.75$ cm | 1 | 31 | $2(1/32)(31/32)\approx0.0605$ |

We weight each child's impurity by the fraction of flowers it contains. A large mixed child should matter more than a tiny mixed child:

$$
G_{\text{children}}
= \frac{38}{70}(0.1884)+\frac{32}{70}(0.0605)
\approx 0.1299.
$$

The **impurity decrease**, or Gini gain, is about $0.5000-0.1299=0.3701$. The cut removes a large part of the original label mixture, while leaving five flowers on the minority side of their respective leaves.

Where do candidate cutoffs come from? Sort the distinct observed widths and examine the gaps. Widths 1.7 and 1.8 cm are adjacent observations here, so 1.75 cm is a convenient midpoint. Any cutoff in $[1.7,1.8)$ gives the same training partition when the comparison is `<=`. Testing more numbers inside that gap cannot reveal another grouping of these training rows.

This small search computes both features' best cuts directly from the data. Its result should agree with the library stump:

<!-- leetllm: test, continue=tree-data, output=show, id=tree-split -->
```python title="search-the-feature-gaps.py"
def gini(labels):
    p = labels.mean()
    return 2 * p * (1 - p)


def best_split(X, y):
    best = None
    for column in range(X.shape[1]):
        values = np.unique(X[:, column])
        candidates = (values[:-1] + values[1:]) / 2
        for threshold in candidates:
            left = X[:, column] <= threshold
            child_impurity = (
                left.mean() * gini(y[left])
                + (~left).mean() * gini(y[~left])
            )
            gain = gini(y) - child_impurity
            if best is None or gain > best["gain"]:
                best = {"feature": column, "threshold": threshold, "gain": gain}
    return best


for column, name in enumerate(names):
    candidate = best_split(X_train[:, [column]], y_train)
    print(f"{name}: cut={candidate['threshold']:.2f}, gain={candidate['gain']:.4f}")

chosen = best_split(X_train, y_train)
left = X_train[:, chosen["feature"]] <= chosen["threshold"]
for side, labels in [("left", y_train[left]), ("right", y_train[~left])]:
    print(f"{side}: counts={np.bincount(labels).tolist()}, P(virginica)={labels.mean():.3f}")
assert chosen["feature"] == stump.tree_.feature[0]
assert np.isclose(chosen["threshold"], stump.tree_.threshold[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
petal length: cut=4.75, gain=0.3478
petal width: cut=1.75, gain=0.3701
left: counts=[34, 4], P(virginica)=0.105
right: counts=[1, 31], P(virginica)=0.969
```
<!-- leetllm: output:end -->

This is a greedy choice: choose the best question *now*, then repeat the search separately inside each child. The algorithm does not search every possible complete tree. Two locally attractive choices can lead to different later structures, which helps explain why a small change in the training data can produce a visibly different tree.

The teaching implementation rescans the labels for each candidate. With $D$ features and $N$ rows, that takes roughly $O(DN^2)$ work at one node, plus sorting. Efficient implementations update class counts as a sorted threshold moves; histogram methods group feature values into bins before searching. The objective is the same idea, but the bookkeeping is much faster.[^sklearn2026treemissing]

### Entropy gives another measure of mixture

**Entropy** measures uncertainty in bits when we use base-two logarithms:[^shannon1948]

$$
H = -\sum_{k=1}^{K}p_k\log_2p_k.
$$

A pure node has zero entropy; an evenly mixed binary node has one bit. The expression $0\log 0$ contributes zero, its limiting value. Replacing Gini with entropy gives the same weighted-child calculation, and the decrease is called **<span data-glossary="information-gain">information gain</span>**.

The criteria often choose similar cuts, but their preferences are not identical. Consider a balanced node with 24 labels. Cut A isolates four class-0 labels and leaves eight class-0 plus twelve class-1 labels. Cut B produces two twelve-row leaves with class proportions 3/9 and 9/3. Gini gains are 0.100 and 0.125, favoring B. Entropy gains are about 0.191 and 0.189, favoring A. Both reward purity, with slightly different tradeoffs between pure and partially mixed children.

## Grow branches, then check new flowers

After the first cut, repeat the search inside each child. A question about petal length produces a horizontal cut in our plot; another width question produces a vertical cut. A path through several questions describes the intersection of those half-planes, so an ordinary numeric tree divides the feature plane into rectangles.

This geometry is useful when the answer depends on conditions: a feature may matter only after another feature falls in a certain range. A straight boundary can be represented by a linear model with one equation, while a tree approximates a diagonal with a staircase of rectangles. Depth gives it more steps, at the cost of estimating each region from fewer examples.

Fit several depths and compare both training and validation accuracy. The leaf count tells us how much the model has subdivided the original 70 flowers:

<!-- leetllm: test, continue=tree-split, output=show, id=tree-depth -->
```python title="depth-and-new-flowers.py"
for depth in [1, 2, 3, None]:
    tree = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X_train, y_train)
    print(
        f"depth={str(depth):4} leaves={tree.get_n_leaves():2d} "
        f"train={tree.score(X_train, y_train):.3f} valid={tree.score(X_valid, y_valid):.3f}"
    )
```

<!-- leetllm: output:start -->
```text title="Output" output compact
depth=1    leaves= 2 train=0.929 valid=0.967
depth=2    leaves= 4 train=0.957 valid=0.967
depth=3    leaves= 5 train=0.957 valid=0.967
depth=None leaves= 8 train=0.986 valid=0.967
```
<!-- leetllm: output:end -->

Extra branches give the model room to fit exceptions. In this run, validation accuracy stays at 0.967 while training accuracy rises. Even the unrestricted tree stops short of perfect training accuracy: the measurements `[4.8, 1.8]` occur for both species. More branches cannot separate identical inputs; another useful measurement could.

Branches can also isolate a measurement error or an unusual training flower in a tiny leaf. **Overfitting** means that this extra detail improves the fit to training examples without transferring well to new ones. Comparing the two accuracy columns lets us see what happens in this particular run instead of assuming every deeper tree must be worse.

Three controls are especially useful:

- `max_depth` limits how many successive questions a path can ask.
- `min_samples_leaf` requires enough flowers in each final region to support its prediction.
- `ccp_alpha` controls cost-complexity pruning, trading training fit against the number of leaves. A larger penalty favors a smaller tree.[^sklearn2026treemissing]

Tune those choices on validation data or cross-validation. After choosing them, use a separate test set for the final performance estimate. Our 30 held-out flowers are a validation set because we inspect them while comparing models.

### Why trees usually do not need feature scaling

Changing petal width from centimeters to millimeters multiplies every value and the learned cutoff by ten. The same flowers still take each branch. A tree's split search uses ordering and label counts, so ordinary standardization is unnecessary.

A strictly increasing transformation preserves candidate *training partitions*. A nonlinear transformation can change where a midpoint falls for an unseen value: between training values 1 and 4, the midpoint is 2.5, while the midpoint after squaring is 8.5. An unseen value 2.8 is above the first cutoff but its square, 7.84, is below the second. This distinction matters when interpreting claims of exact invariance; the familiar linear changes of units preserve the cutoff geometry too.

## Forests combine different trees

Imagine asking several field guides to identify the same flower. If they all ask the same questions and make the same mistake, collecting more answers adds little. If they make different mistakes, combining their answers can be more stable than trusting one guide.

A **random forest** creates useful variety in two places. Each tree receives a **bootstrap sample**, drawn with replacement from the training rows, so some flowers repeat and others are omitted. At each split, the tree considers a randomly selected subset of features. A dominant feature therefore cannot force every member down the same sequence of questions.[^breiman2001]

The trees are fitted separately and can be trained in parallel. For classification, scikit-learn averages their class probabilities. Here a tree's contribution is its leaf's species proportion, and the forest's probability is the mean of those contributions.[^sklearn2026forestmissing]

Fit 100 trees, with at least two training observations per leaf and one candidate feature per split. The code finds a validation flower on which the members disagree, then verifies that their average equals the forest's reported probability:

<!-- leetllm: test, continue=tree-depth, output=show, id=tree-forest -->
```python title="watch-the-forest-average.py"
from sklearn.ensemble import RandomForestClassifier

forest = RandomForestClassifier(
    n_estimators=100, min_samples_leaf=2, max_features=1,
    oob_score=True, random_state=0,
).fit(X_train, y_train)
member_scores = np.array([
    member.predict_proba(X_valid)[:, 1] for member in forest.estimators_
])
example = member_scores.var(axis=0).argmax()
print("flower [length, width]:", X_valid[example].tolist())
print("first five tree scores:", member_scores[:5, example].round(3).tolist())
print("mean of all 100:", round(member_scores[:, example].mean(), 3))
print("forest score:", round(forest.predict_proba(X_valid)[example, 1], 3))
print("validation accuracy:", round(forest.score(X_valid, y_valid), 3))
print("out-of-bag accuracy:", round(forest.oob_score_, 3))
assert np.allclose(member_scores.mean(axis=0), forest.predict_proba(X_valid)[:, 1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
flower [length, width]: [5.1, 1.5]
first five tree scores: [0.25, 0.25, 0.0, 0.0, 0.429]
mean of all 100: 0.556
forest score: 0.556
validation accuracy: 1.0
out-of-bag accuracy: 0.929
```
<!-- leetllm: output:end -->

Averaging probabilities keeps more information than first turning every score into a hard vote. For example, scores 0.2, 0.8, and 0.8 average to 0.6; thresholding each at 0.5 and counting votes gives two out of three. They are different combination rules. Breiman's original forest classifier used majority voting; the library above uses probability averaging.

<figure>
  <img src="illustrations/_generated/ensemble_contrast_dark.png" alt="A forest fits trees separately and averages their probability scores. Boosting starts with one prediction and adds fitted corrections in sequence. The forest branches are parallel; each boosting stage depends on the prediction from the previous stage." />
  <figcaption>A forest combines independently fitted members. Boosting changes the target of each new tree using the ensemble's current errors, so the order of fitting matters.</figcaption>
</figure>

### Why averaging helps

For a fixed flower, imagine refitting models on many possible training samples. A tree's prediction varies from sample to sample. Suppose each member's prediction has variance $\sigma^2$ and every pair has correlation $\rho$. For $B$ members, the variance of their mean is

$$
\operatorname{Var}(\bar T)
= \rho\sigma^2 + \frac{1-\rho}{B}\sigma^2.
$$

The formula comes from adding $B$ individual variances and $B(B-1)$ pairwise covariances, then dividing by $B^2$. With $\sigma^2=0.04$, $\rho=0.25$, and $B=10$, the result is $0.01+0.003=0.013$. Ten members have reduced variability substantially. As more members are added, the shared component $0.01$ remains. That is why forests seek disagreement as well as strong individual trees.

Here the variance is over the training and fitting procedure for one fixed input. It explains a stabilizing mechanism; classification accuracy also depends on whether the average lands on the correct side of the decision threshold. More members do not replace useful features, representative labels, or evaluation.

### Flowers left out of a bootstrap become extra checks

A particular training flower has probability $(1-1/N)^N$ of being omitted from a bootstrap sample of $N$ draws. For large $N$, this approaches $e^{-1}\approx0.368$. Thus a tree leaves out about 37% of the original rows.

An **out-of-bag (OOB)** prediction for a flower uses only members whose bootstrap did not contain it. The forest can assemble such predictions across its training set to estimate performance without fitting those members on the evaluated row. A full-forest prediction of a training flower is different: it also includes trees that saw that flower.

The printed OOB score is useful for checking this training procedure. Use a time-based or group-based split when future periods or related samples are the real generalization challenge; random row omission does not create that separation. A very small forest may also omit too few trees for some rows, which is one reason the example uses 100 members.

## Boosting improves a prediction through corrections

A forest asks many models the original question. **Gradient boosting** asks a new question at each round: "What correction would improve the prediction we already have?" The answer is another small tree, added to the ensemble.[^friedman2001gbm]

It is easiest to see with a numerical target. Suppose three plants receive 1, 2, and 5 hours of sunlight per day and grow 10, 20, and 60 mm in a week. Start with one prediction for every plant: their mean growth, 30 mm. The residuals, actual minus predicted, are $[-20,-10,+30]$ mm.

A regression stump can split the first two plants from the third. The first leaf's mean residual is $(-20-10)/2=-15$; the other leaf's correction is $+30$. The fitted correction asks us to lower two predictions and raise the third.

A learning rate of 0.1 applies one tenth of that correction:

$$
F_1(x)=F_0(x)+0.1h_1(x),
$$

so the predictions become $[28.5,28.5,33.0]$. The next round recomputes residuals against these new predictions. It does not keep fitting the original residuals.

This program fits the correction trees, rather than supplying their answers. Run it to see the first four rounds:

<!-- leetllm: test, deps=numpy,scikit-learn, output=show, id=tree-regression -->
```python title="grow-a-prediction.py"
import numpy as np
from sklearn.tree import DecisionTreeRegressor

sunlight = np.array([[1.0], [2.0], [5.0]])
growth = np.array([10.0, 20.0, 60.0])
prediction = np.full(3, growth.mean())
rate = 0.10
print("round=0", prediction.round(2).tolist())
for round_number in range(1, 5):
    residual = growth - prediction
    correction_tree = DecisionTreeRegressor(max_depth=1, random_state=0).fit(sunlight, residual)
    correction = correction_tree.predict(sunlight)
    prediction += rate * correction
    mse = np.mean((growth - prediction) ** 2)
    print(f"round={round_number} prediction={prediction.round(2).tolist()} MSE={mse:.2f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
round=0 [30.0, 30.0, 30.0]
round=1 prediction=[28.5, 28.5, 33.0] MSE=381.17
round=2 prediction=[27.15, 27.15, 35.7] MSE=311.91
round=3 prediction=[25.94, 25.94, 38.13] MSE=255.82
round=4 prediction=[24.84, 24.84, 40.32] MSE=210.38
```
<!-- leetllm: output:end -->

<figure>
  <img src="illustrations/_generated/boosting_residual_step_dark.png" alt="Plant growth targets 10, 20, and 60 mm start from predictions of 30 mm. A fitted stump assigns residual corrections minus 15, minus 15, and plus 30. Applying one tenth of those corrections moves the predictions to 28.5, 28.5, and 33 mm." />
  <figcaption>The vertical gaps are the errors still to be corrected. A small learning rate moves each prediction partway toward its fitted correction; later rounds recompute the remaining gaps.</figcaption>
</figure>

Regression trees choose their splits using squared error, and each leaf predicts the mean target in its region. For the original targets $[10,20,60]$, the unsplit mean-squared error is $466.67$. Splitting into $[10,20]$ and $[60]$ produces means 15 and 60, with weighted child error $(2/3)25+(1/3)0=16.67$. The gain is 450.

These are means of squared training errors, so the denominator in a node is its row count $N$, rather than the $N-1$ used for an unbiased sample-variance estimate. A singleton leaf has zero training error. For squared loss, fitting a regression tree to residuals applies exactly the same mechanism to the errors instead of to the original targets.

The learning rate is also called **shrinkage**. Smaller steps usually require more rounds. In this example, using 0.05 for four rounds leaves more training error than using 0.10 for four rounds, because we have moved a shorter distance. Choose the rate, tree depth, and stopping round together by measuring validation performance.

## Classification boosting corrects logits

Return to the flowers. For binary classification, the ensemble maintains a logit $F(x)$ and converts it to a virginica probability using the sigmoid:

$$
p(x)=\sigma(F(x))=\frac{1}{1+e^{-F(x)}}.
$$

A positive correction raises the logit and therefore raises the probability. A negative correction lowers both. With cross-entropy loss,

$$
L(y,F)=-y\ln\sigma(F)-(1-y)\ln(1-\sigma(F)),
$$

its derivative with respect to $F$ is $p-y$. The **negative gradient**, also called a pseudo-residual, is therefore $y-p$. A virginica flower with $y=1$ and current probability 0.2 asks for a positive correction of 0.8. A versicolor flower with $y=0$ and current probability 0.8 asks for a negative correction of -0.8.

This is gradient descent in **function space**: the quantities we improve are predictions on the training examples. We fit a tree to approximate the desired corrections, then add the tree to the prediction function.[^friedman2001gbm]

### Work through the first classification update

Our 70 training labels are balanced, so the best constant starting probability is 0.5, corresponding to logit zero. A residual stump again chooses width 1.75 cm. Its left leaf contains four positive labels and 34 negative labels; its residuals sum to $4-38(0.5)=-15$. The right leaf's residuals sum to $31-32(0.5)=+15$.

To choose a useful step in logit units, a Newton update also uses the second derivative, $p(1-p)$. For leaf $j$,

$$
\gamma_j=\frac{\sum_{i\in I_j}(y_i-p_i)}{\sum_{i\in I_j}p_i(1-p_i)}.
$$

At the initial probability 0.5, every row contributes 0.25 to the denominator. The left update is $-15/(38\times0.25)\approx-1.579$; the right update is $15/(32\times0.25)=1.875$. Apply learning rate 0.1 to those logits and convert back to probabilities:

<!-- leetllm: test, continue=tree-forest, output=show, id=tree-newton -->
```python title="first-classification-correction.py"
from sklearn.tree import DecisionTreeRegressor

p = np.full(len(y_train), 0.5)
residual = y_train - p
hessian = p * (1 - p)
correction_tree = DecisionTreeRegressor(max_depth=1, random_state=0).fit(X_train, residual)
leaf_ids = correction_tree.apply(X_train)
for leaf in np.unique(leaf_ids):
    members = leaf_ids == leaf
    step = residual[members].sum() / hessian[members].sum()
    updated_logit = 0.1 * step
    updated_probability = 1 / (1 + np.exp(-updated_logit))
    print(f"rows={members.sum():2d} step={step:+.3f} probability={updated_probability:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
rows=38 step=-1.579 probability=0.461
rows=32 step=+1.875 probability=0.547
```
<!-- leetllm: output:end -->

The probabilities have moved from 0.5 toward the appropriate species. They have not jumped immediately to the ordinary stump's leaf frequencies of 0.105 and 0.969. Boosting adds a correction to an existing score, and shrinkage controls how much of that correction to use.

A Newton step minimizes a local quadratic approximation of the loss. Later rounds rebuild the residuals and curvature at the new probabilities. Modern boosting libraries handle that repeated calculation, along with controls on depth, sampling, and regularization.

Fit a complete classifier and inspect several stages. Here `max_depth=2` permits interactions between successive questions, while `staged_predict_proba` lets us inspect the model as trees are added:

<!-- leetllm: test, continue=tree-newton, output=show, id=tree-boosting -->
```python title="follow-classification-boosting.py"
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import log_loss

booster = GradientBoostingClassifier(
    n_estimators=50, learning_rate=0.1, max_depth=2,
    min_samples_leaf=2, random_state=0,
).fit(X_train, y_train)
train_stages = booster.staged_predict_proba(X_train)
valid_stages = booster.staged_predict_proba(X_valid)
for number, (train_p, valid_p) in enumerate(zip(train_stages, valid_stages), start=1):
    if number in [1, 10, 50]:
        print(f"trees={number:2d} train loss={log_loss(y_train, train_p):.3f} "
              f"validation loss={log_loss(y_valid, valid_p):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
trees= 1 train loss=0.612 validation loss=0.609
trees=10 train loss=0.257 validation loss=0.228
trees=50 train loss=0.077 validation loss=0.057
```
<!-- leetllm: output:end -->

Log loss evaluates the probabilities, including how confidently the model makes errors. Accuracy evaluates the final class decisions. A probability can improve without crossing 0.5, so these metrics need not move together. Stop adding trees according to the validation objective that matters for the task.[^sklearnGradientBoostingMechanics2026]

### How XGBoost uses gradients and curvature

The Newton calculation also explains an important part of XGBoost. For a proposed tree, collect gradient sums $G_j=\sum_i(p_i-y_i)$ and curvature sums $H_j=\sum_i p_i(1-p_i)$ in each leaf. With an $L_2$ penalty $\lambda$ on leaf values, the optimal leaf value for the quadratic approximation is[^xgboostTreeObjective2026]

$$
w_j^*=-\frac{G_j}{H_j+\lambda}.
$$

The penalty enlarges the denominator, shrinking the update. A proposed split into left and right leaves receives the score

$$
\text{gain}=\frac12\left[
\frac{G_L^2}{H_L+\lambda}
+\frac{G_R^2}{H_R+\lambda}
-\frac{(G_L+G_R)^2}{H_L+H_R+\lambda}
\right]-\gamma_{\text{split}}.
$$

The first two terms reward the two children's fit. The third subtracts the parent's fit, and $\gamma_{\text{split}}$ charges for the additional leaf. Once the charge is subtracted, a positive gain favors the split. XGBoost uses these gradient and curvature statistics during split search, whereas our small Newton example first chose regions by squared error on the pseudo-residuals. This difference can change which tree is grown.

## Compare models on the same flowers

We now have several ways to map the same measurements to a species. Compare them with a logistic-regression baseline, using the same training and validation rows for every candidate. Standardization belongs inside the logistic pipeline; its fitted statistics come only from the training data.

<!-- leetllm: test, continue=tree-boosting, output=show, id=tree-comparison -->
```python title="compare-the-fitted-models.py"
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

models = {
    "logistic": make_pipeline(StandardScaler(), LogisticRegression()),
    "stump": stump,
    "deep tree": DecisionTreeClassifier(random_state=0),
    "forest": forest,
    "boosting": booster,
}
for name, model in models.items():
    model.fit(X_train, y_train)
    print(f"{name:9} accuracy={model.score(X_valid, y_valid):.3f} "
          f"log loss={log_loss(y_valid, model.predict_proba(X_valid)):.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
logistic  accuracy=0.967 log loss=0.102
stump     accuracy=0.967 log loss=0.145
deep tree accuracy=0.967 log loss=1.201
forest    accuracy=1.000 log loss=0.047
boosting  accuracy=0.967 log loss=0.057
```
<!-- leetllm: output:end -->

A confident wrong leaf can have a large log-loss penalty even if its accuracy looks respectable. A forest can soften individual tree predictions by averaging; boosting can gradually change both the probabilities and the regions. Neither operation makes a larger model the automatic winner. Read the resulting errors, and use repeated or cross-validated comparisons when a few flowers can change the ranking.

The two ensemble mechanisms also address different aspects of fitting:

| Question | Random forest | Gradient boosting |
|---|---|---|
| What does each member learn? | Original targets on perturbed data | A correction based on the current ensemble |
| How are members combined? | Average their scores | Add their scaled corrections |
| Which work can run independently? | Separate trees | Work within a round; rounds depend on earlier predictions |
| What controls flexibility? | Depth, leaf size, feature sampling | Depth, rate, rounds, sampling, penalties |
| What does adding members do? | Stabilizes an average | Continues changing the fitted function |

For squared-error regression, prediction error can be decomposed into squared bias, variance across training samples, and outcome noise:

$$
\mathbb E[(Y-\hat f_D(x))^2]
=(\mathbb E_D[\hat f_D(x)]-f_*(x))^2
+\operatorname{Var}_D(\hat f_D(x))+\sigma_\epsilon^2.
$$

Here $Y=f_*(x)+\epsilon$, with zero-mean noise independent of the training set $D$. The formula helps explain why averaging variable trees can help and why adding corrective functions can reduce approximation error. In classification, inspect the chosen probability or decision metric directly; the squared-error decomposition is not a formula for classification accuracy.

## Find out which features the model uses

A tree library's default **mean decrease in impurity** (MDI) importance sums the training impurity reductions credited to each feature. It is fast and useful for seeing what the fitted trees split on. A feature with many distinct values, however, offers many opportunities to fit chance patterns.[^sklearn2026permutation]

We can make that effect visible with a controlled experiment. Generate labels, a binary feature that agrees with them 70% of the time, and an independent continuous noise feature. Fit a forest on 40 rows and evaluate it on 2,000 new rows from the same process. The model computes its own predictions; the experiment lets us know which feature actually contains signal.

<!-- leetllm: test, deps=numpy,scikit-learn, output=show -->
```python title="training-importance-versus-new-data.py"
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import f1_score

rng = np.random.default_rng(1)
def make_rows(n):
    labels = rng.integers(0, 2, size=n)
    signal = np.where(rng.random(n) < 0.70, labels, 1 - labels)
    noise = rng.random(n)
    return np.column_stack([signal, noise]), labels

train_x, train_y = make_rows(40)
valid_x, valid_y = make_rows(2000)
model = RandomForestClassifier(
    n_estimators=20, max_depth=5, max_features=1, random_state=0,
).fit(train_x, train_y)
importance = permutation_importance(
    model, valid_x, valid_y, scoring="f1", n_repeats=15, random_state=0,
)
print(f"held-out F1={f1_score(valid_y, model.predict(valid_x)):.3f}")
for index, name in enumerate(["binary signal", "continuous noise"]):
    print(f"{name}: MDI={model.feature_importances_[index]:.3f}; "
          f"permutation drop={importance.importances_mean[index]:.3f} "
          f"shuffle SD={importance.importances_std[index]:.3f}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
held-out F1=0.575
binary signal: MDI=0.080; permutation drop=0.097 shuffle SD=0.007
continuous noise: MDI=0.920; permutation drop=0.003 shuffle SD=0.007
```
<!-- leetllm: output:end -->

**Permutation importance** shuffles one feature across validation rows and measures the change in a selected metric. In this run, the noise feature receives most of the training split credit, but shuffling it barely changes held-out F1. Shuffling the binary signal causes a much larger drop. The two methods answer different questions: what helped the training splits, and what this fitted model needs to perform on new rows.

The reported standard deviation comes from repeated shuffles of the same model and validation batch. Correlated features require extra care: another feature may preserve much of the same information after one is shuffled. Grouping related features can reveal a dependence that single-column shuffles hide.[^sklearn2026multicollinear]

### Explain one flower's score

For an individual prediction, **SHAP** decomposes a chosen model output into a baseline plus feature contributions:[^lundberg2017]

$$
f(x)=\phi_0+\sum_j\phi_j(x).
$$

The contributions depend on how we define an absent feature. Here use the training flowers as an **interventional background**: hold the features we know at the new flower's values and fill the others from each background row, then average the predictions.[^shapTreeExplainer2026]

With two features, each contribution averages two changes: adding that feature first, and adding it after the other feature. We can calculate the complete result directly. Our stump uses width alone, so petal length should receive zero credit under this background calculation:

<!-- leetllm: test, continue=tree-comparison, output=show -->
```python title="explain-the-stumps-prediction.py"
flower = np.array([5.0, 1.8])
def value(known):
    completed = X_train.copy()
    for feature in known:
        completed[:, feature] = flower[feature]
    return stump.predict_proba(completed)[:, 1].mean()

base = value([])
length_only, width_only, both = value([0]), value([1]), value([0, 1])
length_credit = 0.5 * ((length_only - base) + (both - width_only))
width_credit = 0.5 * ((width_only - base) + (both - length_only))
print(f"baseline={base:.3f} length={length_credit:+.3f} width={width_credit:+.3f}")
print(f"reconstructed probability={base + length_credit + width_credit:.3f}")
assert np.isclose(base + length_credit + width_credit, both)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline=0.500 length=+0.000 width=+0.469
reconstructed probability=0.969
```
<!-- leetllm: output:end -->

The baseline is 0.5 and width contributes about +0.469, reconstructing the right leaf's 0.969 probability. This explains the model's computation for the flower. Checking whether its species label is correct is a separate comparison with the observed label.

For larger models, TreeExplainer computes these attributions efficiently. Record the background, `feature_perturbation`, and `model_output`: contributions to log odds have different units from contributions to probability. An explainer that conditions on correlated measurements can assign different contributions because observing one measurement conveys information about another. The choice should match the question the explanation is meant to answer.

## Handle missing measurements deliberately

A missing petal width still needs a route through a fitted tree. Some estimators learn whether missing rows should go left or right; others require preprocessing. The same consideration applies to sparse inputs, where an absent entry may mean a missing measurement or a numeric zero.

| Estimator or representation | Behavior to account for |
|---|---|
| Scikit-learn decision trees with supported classification criteria and `splitter="best"` | Learn missing-value directions. If the feature had no missing training values, prediction sends a missing value toward the child with more samples.[^sklearn2026treemissing] |
| Scikit-learn random forests | Support learned missing-value directions through their trees.[^sklearn2026forestmissing] |
| XGBoost tree boosters with default `missing=NaN` | An absent sparse entry is missing; an explicitly stored zero is a value.[^xgboostFaq2026] |
| LightGBM with default `zero_as_missing=false` | Absent sparse entries count as zero. Setting `zero_as_missing=true` makes zeros and absent entries count as missing.[^lightgbm2026missing] |

When replacing a preprocessing step or estimator, replay inputs containing a genuine zero, a missing value, and an absent sparse entry. Compare the resulting routes before assuming the new representation preserves the old meaning. Our flower dataset is complete, so these decisions arise when we extend the example to measurements collected less consistently.

Trees also make constant predictions outside their outermost splits. A petal wider than any training flower follows the same final branch as other sufficiently wide petals. In regression, the corresponding leaf mean remains constant too. Use that behavior consciously when a task requires extrapolation beyond the measured range.

## Try a change and explain the result

The chapter's models all start from the same question: can petal measurements distinguish two species? A stump creates one useful partition. A deeper tree divides mixed regions further. A forest combines different fitted partitions, while boosting keeps adding corrections to its current prediction.

Change `min_samples_leaf` in the forest from 2 to 10 and inspect the probabilities as well as accuracy. Larger leaves pool more flowers, so fewer predictions will come from very small, nearly pure groups. Then change the booster's learning rate from 0.1 to 0.05 while keeping 50 rounds. Explain the smaller update before checking whether it helps validation loss.

```checkpoint
A node contains eight versicolor flowers and two virginica flowers. What probability does its leaf assign to virginica, and what is its Gini impurity?
---
The virginica probability is 2/10 = 0.2. Gini is 2 × 0.2 × 0.8 = 0.32. The probability describes one class; impurity describes the mixture of all labels in the leaf.
```

```checkpoint
Why can a forest give a different answer when one training flower is removed, even though no prediction-time code changed?
---
Removing the flower changes the data available to the bootstrap samples and split searches. Some learned thresholds and leaf proportions can change. The prediction procedure is unchanged, but the learned trees it follows are different.
```

```checkpoint
In the plant-growth example, a fitted residual tree proposes -15 mm for a plant currently predicted to grow 30 mm. What happens at learning rates 0.1 and 0.05?
---
The new predictions are 30 + 0.1(-15) = 28.5 mm and 30 + 0.05(-15) = 29.25 mm. The smaller rate applies less of the same fitted correction in this round.
```

## Check your understanding

```mastery-quiz
[
  {
    "question": "A balanced ten-row node splits into a pure four-row child and a six-row child with five positive labels and one negative label. What is the Gini gain?",
    "options": [
      "1/2",
      "1/6",
      "1/3",
      "13/36"
    ],
    "answer": "1/3",
    "explanation": "The parent has Gini 1/2. The mixed child has Gini 2(5/6)(1/6)=5/18. Its weight is 6/10, giving total child impurity 1/6. The gain is 1/2−1/6=1/3. Averaging the children equally would ignore their different sizes."
  },
  {
    "question": "An exact stump trainer sees feature values [2, 4, 9, 15]. Which midpoint thresholds represent its distinct training partitions?",
    "options": [
      "3, 6.5, 12",
      "2, 4, 9, 15",
      "3, 5.5, 8.5",
      "1, 2.5, 3"
    ],
    "answer": "3, 6.5, 12",
    "explanation": "Average adjacent distinct values: (2+4)/2, (4+9)/2, and (9+15)/2. Any threshold inside the same gap gives the same training grouping; the midpoint is a representative cutoff."
  },
  {
    "question": "A tree asks whether width is at most 1.75 cm. Its left leaf gives virginica probability 0.3. The classification threshold changes from 0.5 to 0.2. What changes?",
    "options": [
      "The width cutoff moves to 0.2 cm",
      "The left leaf's probability rises to 0.5",
      "The tree refits using the new threshold",
      "The left leaf is now classified as virginica"
    ],
    "answer": "The left leaf is now classified as virginica",
    "explanation": "The fitted feature cutoff and leaf probability stay the same. A probability of 0.3 is below the old operating threshold and above the new one, so the resulting class changes."
  },
  {
    "question": "A deeper tree raises training accuracy from 0.93 to 1.00 while validation accuracy falls from 0.95 to 0.87. What is the most useful next comparison?",
    "options": [
      "Keep the deeper tree because its leaves are pure",
      "Compare depth, leaf-size, or pruning settings on the same validation split",
      "Refit on the validation labels before comparing both trees there",
      "Change the random seed until the deeper tree wins"
    ],
    "answer": "Compare depth, leaf-size, or pruning settings on the same validation split",
    "explanation": "The extra training detail transferred poorly on this split. Complexity controls test whether pooling more observations improves transfer. Fitting on validation labels or searching for a favorable split would make that comparison unreliable."
  },
  {
    "question": "Three forest members predict probabilities 0.1, 0.6, and 0.8. What does probability averaging return?",
    "options": [
      "0.60",
      "0.67",
      "0.50",
      "0.80"
    ],
    "answer": "0.50",
    "explanation": "The mean is (0.1+0.6+0.8)/3=0.5. Turning each probability into a vote at 0.5 gives 2/3, a different rule. The middle value is 0.6 and the largest is 0.8; neither is the average."
  },
  {
    "question": "A training flower appeared in the bootstrap samples for trees 1 and 3, but not trees 2 and 4. Which members form its out-of-bag prediction?",
    "options": [
      "Trees 2 and 4",
      "Trees 1 and 3",
      "All four trees",
      "Only whichever tree has the largest leaf"
    ],
    "answer": "Trees 2 and 4",
    "explanation": "An OOB prediction uses only trees that did not train on that row. Averaging all four would include members whose fitting data contained the evaluated flower."
  },
  {
    "question": "Predictions are [40, 40, 40]. A fitted residual tree predicts [-10, 5, 20]. With learning rate 0.2, what are the updated predictions?",
    "options": [
      "[30, 45, 60]",
      "[38, 41, 44]",
      "[42, 39, 36]",
      "[-2, 1, 4]"
    ],
    "answer": "[38, 41, 44]",
    "explanation": "Add the scaled correction to the current prediction: [40−2,40+1,40+4]. Using the entire correction omits shrinkage; subtracting it moves in the opposite direction; reporting only the correction discards the current model."
  },
  {
    "question": "Ten rows in a boosting leaf all have probability 0.5. Seven labels are 1 and three are 0. What is the unshrunk Newton step, sum(y−p)/sum(p(1−p))?",
    "options": [
      "0.20",
      "0.70",
      "8.00",
      "0.80"
    ],
    "answer": "0.80",
    "explanation": "Residuals sum to 7(0.5)+3(−0.5)=2. Curvature sums to 10(0.25)=2.5. The step is 2/2.5=0.8 logit units. The mean residual is 0.2, which is a different quantity."
  },
  {
    "question": "A noise feature gets MDI importance 0.9. Shuffling it on validation data barely changes F1, while shuffling another feature causes a large drop. What best explains the result?",
    "options": [
      "The two importance methods must rank features identically",
      "MDI credited training splits; the shuffle checks what the fitted model needs on validation rows",
      "Permutation importance refitted the forest and removed the noise feature",
      "A high MDI value measures how strongly the feature causes the label"
    ],
    "answer": "MDI credited training splits; the shuffle checks what the fitted model needs on validation rows",
    "explanation": "Many candidate cuts can give continuous noise substantial training credit. Permutation importance evaluates the already-fitted model after shuffling one column; it does not retrain the model or measure causal effects."
  },
  {
    "question": "A stump uses width alone. Its background mean probability is 0.4 and a new flower scores 0.7. Under the chapter's interventional calculation, what are the length and width contributions?",
    "options": [
      "Length +0.3; width 0",
      "Length +0.15; width +0.15",
      "Length 0; width +0.3",
      "Length 0; width +0.7"
    ],
    "answer": "Length 0; width +0.3",
    "explanation": "Fixing length never changes this stump's output. Width accounts for the increase from baseline 0.4 to prediction 0.7, so its contribution is +0.3. The contributions reconstruct a model output, not the true species label."
  }
]
```

> **Next:** Continue to [Reinforcement Learning Basics](/learn/introduction-to-reinforcement-learning-fundamentals). These models learn a mapping from measurements to labeled answers. Reinforcement learning adds actions that change what happens next, such as a robot choosing moves through a grid and learning from the rewards along its route.
