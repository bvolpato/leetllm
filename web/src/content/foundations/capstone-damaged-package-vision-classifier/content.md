---
{
  "id": "capstone-damaged-package-vision-classifier",
  "title": "Capstone: Image Damage Classifier",
  "slug": "capstone-damaged-package-vision-classifier",
  "section": "Portfolio Capstones",
  "category": "Multimodal Models",
  "difficulty": "Hard",
  "order": 4,
  "coverImage": "social_banner.png",
  "companies": [
    "Amazon",
    "Walmart",
    "DoorDash",
    "UPS"
  ],
  "shortDescription": "Build an end-to-end warehouse parcel damage classifier using scale-invariant image quality checks, a PyTorch CNN, Platt probability calibration, and mature outcome slice evaluation.",
  "keyConceptsTested": [
    "grouped temporal validation",
    "scale-invariant Laplacian sharpness",
    "2D CNN feature extraction",
    "precision-recall threshold tuning",
    "Platt probability calibration",
    "multi-view aggregation",
    "delayed inspection joins"
  ]
}
---

A parcel travels beneath two cameras. One view shows a shipping label; the other reveals a crushed corner. Our classifier must use the visible damage, ask for another photo when both views are unreadable, and send a manageable number of parcels to inspection.

We will build that system from pixels to inspection outcomes. Small `3x24x24` RGB images make the whole experiment runnable on a CPU: cardboard shading, barcode stripes, corner dents, and tears give the model distinct patterns to learn. We will compare a Sobel edge baseline with a PyTorch CNN, calibrate the CNN's scores, combine camera views, and choose a parcel-level routing threshold. Finally, we will measure results when inspection labels arrive several days after capture.

## Multi-View Parcel Dataset and Leakage-Safe Splitting

In parcel sorting centers, overhead and side scanners photograph each package two or more times as it travels down the belt. Every photo inherits the physical package's box shade, tape seam placement, shipping barcode sticker, and true damage pattern. Splitting rows randomly at the image level allows one camera angle of `parcel_042` to sit in training while the opposite angle lands in validation, leaking the package's exact lighting and surface texture across sets.[^sklearn2026leakage]

To prevent both spatial leakage and forward-looking time leakage, validation and test splits must satisfy two conditions simultaneously. Every `parcel_id` must belong strictly to one split (`GroupShuffleSplit` or disjoint entity IDs), and evaluation splits must fall chronologically after the training window so seasonal hub drift or lighting shifts are tested honestly.[^sklearn_groupkfold]

Our dataset generator builds 360 unique parcels across 30 days and two fulfillment hubs (`north_hub` and `south_hub`), taking two `3x24x24` RGB camera views per parcel (720 total frames). Damaged boxes (`~36%`) carry either a bruised corner indentation or a dark diagonal tear streak. Notice a crucial visual confounder: roughly `72%` of both intact and damaged parcels carry a high-contrast white shipping barcode sticker at a random interior location, and cardboard shades vary continuously across light and dark kraft paper under overhead conveyor gradients.

The example fixes the random seeds and uses one CPU thread for repeatable training on the same software stack. Floating-point reductions can follow different orders with a different thread count; in a neural network, those small differences can accumulate across updates.[^pytorch2026reproducibility]

<!-- leetllm: test, output=show, id=vision-data, deps=torch==2.15.0,scipy==1.18.1,numpy==2.5.4,scikit-learn==1.9.1 -->
```python title="Synthetic 3x24x24 RGB parcel dataset generator with grouped temporal splits"
import numpy as np
import torch
import torch.nn as nn
from scipy import ndimage, optimize
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(17)
torch.set_num_threads(1)
torch.manual_seed(17)


def make_parcel_image(
    damaged: bool,
    damage_mode: int,
    has_label: bool,
    low_light: bool,
    blurred: bool,
) -> np.ndarray:
    """Render a 3x24x24 RGB parcel image tensor with cardboard variation and confounders."""
    img = np.zeros((3, 24, 24), dtype=np.float32)
    shade = float(rng.uniform(0.74, 1.16))
    base = np.array([0.64 * shade, 0.50 * shade, 0.36 * shade], dtype=np.float32)[:, None, None]
    grain = rng.normal(0.0, 0.025, size=(1, 24, 24)).astype(np.float32)
    img[:] = base + grain

    # Overhead conveyor lighting gradient confounds simple global intensity rules
    yy, xx = np.mgrid[0:24, 0:24]
    grad_dir = float(rng.choice([-1.0, 1.0]))
    img *= (1.0 + grad_dir * 0.14 * ((xx - 12.0) / 12.0))[None, :, :]

    # Dark conveyor belt surrounding the 20x20 parcel box
    img[:, :2, :] *= 0.22
    img[:, -2:, :] *= 0.22
    img[:, :, :2] *= 0.22
    img[:, :, -2:] *= 0.22

    # Intact packaging tape seam across the box center
    seam_pos = int(rng.integers(9, 15))
    img[:, 2:-2, seam_pos : seam_pos + 1] *= 0.78

    # High-contrast white barcode sticker at random coordinates (intact distractor edges)
    if has_label:
        ly = int(rng.integers(5, 14))
        lx = int(rng.integers(5, 13))
        img[:, ly : ly + 5, lx : lx + 6] = 0.88
        img[:, ly + 1 : ly + 4, lx + 1 : lx + 5 : 2] = 0.18

    if damaged:
        sev = float(rng.uniform(0.30, 0.98))
        if damage_mode == 0:
            # Localized crushed corner crease
            cy = int(rng.choice([4, 19]))
            cx = int(rng.choice([4, 19]))
            dist2 = (yy - cy) ** 2 + (xx - cx) ** 2
            crush = np.exp(-dist2 / 11.0)
            img[0] -= 0.38 * sev * crush
            img[1] -= 0.32 * sev * crush
            img[2] -= 0.22 * sev * crush
        else:
            # Diagonal tear exposing darker corrugated fiberboard
            oy = int(rng.integers(8, 16))
            ox = int(rng.integers(8, 16))
            for step in range(-4, 5):
                py, px = oy + step, ox + step
                if 3 <= py < 21 and 3 <= px < 21:
                    factor = 1.0 - 0.65 * sev
                    img[0, py - 1 : py + 2, px] *= factor
                    img[1, py - 1 : py + 2, px] *= factor
                    img[2, py - 1 : py + 2, px] *= factor

    if blurred:
        for ch in range(3):
            img[ch] = ndimage.uniform_filter(img[ch], size=(3, 7))
    if low_light:
        img *= 0.18

    img += rng.normal(0.0, 0.022, size=img.shape).astype(np.float32)
    return np.clip(img, 0.0, 1.0)


records = []
for pid in range(360):
    parcel_id = f"parcel_{pid:03d}"
    hub = "north_hub" if pid % 2 == 0 else "south_hub"
    capture_day = 1 + (pid % 30)
    damaged = bool(rng.random() < 0.36)
    damage_mode = int(rng.integers(0, 2))
    has_label = bool(rng.random() < 0.72)
    for angle in range(2):
        fault_roll = rng.random()
        low_light = fault_roll < 0.08
        blurred = 0.08 <= fault_roll < 0.16
        tensor = make_parcel_image(damaged, damage_mode, has_label, low_light, blurred)
        records.append({
            "parcel_id": parcel_id,
            "angle": angle,
            "hub": hub,
            "capture_day": capture_day,
            "damaged": int(damaged),
            "low_light": low_light,
            "blurred": blurred,
            "image": tensor,
        })

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=17)
train_idx, dev_idx = next(gss.split(records, groups=[r["parcel_id"] for r in records]))
train_ids = {records[i]["parcel_id"] for i in train_idx}
dev_ids = {records[i]["parcel_id"] for i in dev_idx}

print(f"Total frames: {len(records)} across {len({r['parcel_id'] for r in records})} physical parcels")
print(f"Damage prevalence: {np.mean([r['damaged'] for r in records]):.3f}")
print(f"GroupShuffleSplit parcel overlap: {len(train_ids & dev_ids)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Total frames: 720 across 360 physical parcels
Damage prevalence: 0.397
GroupShuffleSplit parcel overlap: 0
```
<!-- leetllm: output:end -->

`GroupShuffleSplit` demonstrates entity separation: the overlap is zero. It does not enforce chronological order. For training below, we instead use days `1..20`, validation days `21..25`, and test days `26..30`. Both views of every generated parcel share a day, so these time windows also keep parcel IDs separate. With parcels photographed across a boundary, assign the whole parcel to one window or remove boundary-crossing parcels before splitting.

## Scale-Invariant Image Quality Gating

Camera exposure drops and conveyor motion blur break vision features in completely different ways, so image quality diagnostics must separate brightness from edge sharpness mathematically. Taking raw pixel luminance $Y = 0.299R + 0.587G + 0.114B$ on the box interior, the discrete 2D Laplacian operator[^opencvLaplacian2026] measures local second derivatives around each pixel:

$$
(\nabla^2 Y)_{i,j} = Y_{i-1,j} + Y_{i+1,j} + Y_{i,j-1} + Y_{i,j+1} - 4Y_{i,j}
$$

A crisp edge produces large positive and negative spikes in $\nabla^2 Y$, elevating $\text{Var}(\nabla^2 Y)$, whereas motion blur averages adjacent pixels and shrinks the Laplacian variance toward zero. However, raw Laplacian variance is directly coupled to exposure gain. Multiplying every pixel intensity by a lighting factor $c$ scales the linear Laplacian response by $c$ and its variance by $c^2$:

$$
\text{Var}\!\left(\nabla^2 (cY)\right) = c^2\,\text{Var}(\nabla^2 Y), \qquad R_{\text{sharp}}(Y) = \frac{\text{Var}(\nabla^2 Y)}{\text{Var}(Y) + \epsilon}
$$

The ratio cancels the exposure factor when $\epsilon=0$. With the small stabilizer used in code, it is approximately invariant when luminance variance is much larger than $\epsilon$: dividing numerator and denominator by $c^2$ leaves $\epsilon/c^2$ in the denominator. Thus, uniformly dimming a sharp image preserves its normalized edge structure while changing its brightness. We check both quantities separately, then compare interior brightness with the dark conveyor margin to check framing. Actual low-light sensor noise can change edge structure too, so the gate measures the captured pixels rather than inferring sharpness from exposure alone.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="The same parcel image at full brightness, one-quarter brightness, and after blur, with measured brightness and normalized Laplacian sharpness." />
  <figcaption>Figure 1: The same image is dimmed or blurred. Dimming reduces raw Laplacian variance by 16x while barely changing normalized sharpness. Blur changes the edge structure and lowers normalized sharpness; the separate brightness check rejects the dim view.</figcaption>
</figure>

For this quality test we scale pixel luminance uniformly.

<!-- leetllm: test, output=show, continue=vision-data, id=vision-quality, deps=torch,scipy,numpy -->
```python title="Compute brightness, framing contrast, and scale-invariant Laplacian sharpness"
lap_kernel = np.array([[0.0, 1.0, 0.0], [1.0, -4.0, 1.0], [0.0, 1.0, 0.0]], dtype=np.float32)


def compute_quality(img: np.ndarray) -> dict[str, float | bool]:
    """Evaluate exposure, framing contrast, and exposure-invariant sharpness."""
    lum = 0.299 * img[0] + 0.587 * img[1] + 0.114 * img[2]
    interior = lum[2:-2, 2:-2]
    mean_lum = float(interior.mean())
    lap = ndimage.convolve(interior, lap_kernel, mode="reflect")
    raw_lap_var = float(lap.var())
    norm_sharpness = raw_lap_var / (float(interior.var()) + 1e-8)
    border_mean = float(np.concatenate([lum[:2, :].ravel(), lum[-2:, :].ravel()]).mean())
    frame_contrast = mean_lum - border_mean
    usable = (mean_lum >= 0.18) and (norm_sharpness >= 2.2) and (frame_contrast >= 0.06)
    return {
        "mean_lum": mean_lum,
        "raw_lap_var": raw_lap_var,
        "norm_sharpness": norm_sharpness,
        "frame_contrast": frame_contrast,
        "usable": usable,
    }


for r in records:
    r.update(compute_quality(r["image"]))

clean_recs = [r for r in records if not r["low_light"] and not r["blurred"]]
dark_recs = [r for r in records if r["low_light"]]
blur_recs = [r for r in records if r["blurred"]]

sample_img = clean_recs[0]["image"]
q_full = compute_quality(sample_img)
q_quarter = compute_quality(sample_img * 0.25)

print(f"Raw Laplacian var ratio (1.0x / 0.25x): {q_full['raw_lap_var'] / q_quarter['raw_lap_var']:.2f}x")
print(f"Normalized sharpness ratio (1.0x / 0.25x): {q_full['norm_sharpness'] / q_quarter['norm_sharpness']:.4f}x")
print(
    f"Pass rate -> clean: {np.mean([r['usable'] for r in clean_recs]):.3f}, "
    f"dark: {np.mean([r['usable'] for r in dark_recs]):.3f}, "
    f"blur: {np.mean([r['usable'] for r in blur_recs]):.3f}"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Raw Laplacian var ratio (1.0x / 0.25x): 16.00x
Normalized sharpness ratio (1.0x / 0.25x): 1.0000x
Pass rate -> clean: 1.000, dark: 0.000, blur: 0.000
```
<!-- leetllm: output:end -->

Every simulated dark frame and blurred frame fails the quality gate (`0.000` false acceptance), while sharp well-lit frames pass consistently (`1.000`). Multiplying the pixel tensor by `0.25` reduces raw Laplacian variance by exactly `16.00x`, yet the normalized sharpness ratio shifts by less than `0.1%`.

## From Sobel Edge Baselines to a PyTorch CNN

Why does a simple edge-magnitude baseline struggle on warehouse parcels? Fixed Sobel gradient magnitudes measure how sharply intensity changes (`|Gx|` and `|Gy|`), ignoring polarity and local spatial geometry. A high-contrast black-and-white barcode label triggers large Sobel magnitudes just like a torn cardboard edge, while coarse block averaging washes out small crushed corners against smooth cardboard variations.

A 2D CNN can learn spatial patterns that the six Sobel summary features discard. Its `3x3` filters combine signed weights across the RGB channels; later layers combine those local responses. We end the trunk with `AdaptiveMaxPool2d((3, 3))`, which retains the largest response in each spatial region. A strong local response can therefore survive pooling even when most of the box is intact. The figure works through one directional filter so we can see the arithmetic; training learns its own weights.

<figure>
  <img src="illustrations/_generated/spatial_conv_features_dark.png" alt="A 6x6 crushed cardboard corner patch convolved with a 3x3 diagonal crease kernel to produce a 4x4 ReLU feature map highlighting the damage crease." />
  <figcaption>Figure 2: A hand-specified directional filter responds to a light-to-dark crease. Each output sums nine pixel-weight products; ReLU keeps positive responses. A spatial max-pool can retain a strong local response instead of averaging it across the whole image.</figcaption>
</figure>

We train `ParcelDamageCNN` with `BCEWithLogitsLoss(pos_weight=4.0)`, multiplying the positive-label loss term by four. This encourages the model to catch damage, at the cost of more false positives at a fixed threshold. It also changes what the raw sigmoid score estimates, which gives us a concrete reason to calibrate the model next.[^pytorchBCEWithLogits2026]

We now train both classifiers on identical usable frames.

<!-- leetllm: test, output=show, continue=vision-quality, id=vision-cnn, deps=torch,scipy,numpy -->
```python title="Train Sobel logistic baseline vs cost-weighted PyTorch ParcelDamageCNN"
usable_recs = [r for r in records if r["usable"]]
train_recs = [r for r in usable_recs if r["capture_day"] <= 20]
val_recs = [r for r in usable_recs if 21 <= r["capture_day"] <= 25]
test_recs = [r for r in usable_recs if r["capture_day"] >= 26]


def extract_sobel_features(batch_recs: list[dict]) -> np.ndarray:
    """Compute 2x2 grid-pooled Sobel edge magnitude and global luminance summary."""
    feats = []
    for rec in batch_recs:
        img = rec["image"]
        lum = 0.299 * img[0] + 0.587 * img[1] + 0.114 * img[2]
        gx = ndimage.sobel(lum, axis=1)
        gy = ndimage.sobel(lum, axis=0)
        mag = np.hypot(gx, gy)
        grid = mag.reshape(2, 12, 2, 12).mean(axis=(1, 3)).ravel()
        feats.append(np.append(grid, [lum[2:-2, 2:-2].mean(), lum[2:-2, 2:-2].std()]))
    return np.array(feats, dtype=np.float32)


y_tr = np.array([r["damaged"] for r in train_recs])
y_va = np.array([r["damaged"] for r in val_recs])
y_te = np.array([r["damaged"] for r in test_recs])

X_tr_s = extract_sobel_features(train_recs)
X_te_s = extract_sobel_features(test_recs)
scaler = StandardScaler().fit(X_tr_s)
baseline_clf = LogisticRegression(C=0.5, max_iter=500, random_state=17).fit(
    scaler.transform(X_tr_s), y_tr
)
p_te_sobel = baseline_clf.predict_proba(scaler.transform(X_te_s))[:, 1]


class ParcelDamageCNN(nn.Module):
    """Lightweight 2-stage RGB convolutional network with spatial max pooling."""

    def __init__(self) -> None:
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 12, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(12, 24, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveMaxPool2d((3, 3)),
        )
        self.head = nn.Linear(24 * 9, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(self.features(x).flatten(1)).squeeze(1)


X_tr_t = torch.tensor(np.stack([r["image"] for r in train_recs]))
y_tr_t = torch.tensor(y_tr, dtype=torch.float32)
X_va_t = torch.tensor(np.stack([r["image"] for r in val_recs]))
X_te_t = torch.tensor(np.stack([r["image"] for r in test_recs]))

cnn = ParcelDamageCNN()
criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([4.0], dtype=torch.float32))
optimizer = torch.optim.AdamW(cnn.parameters(), lr=1.2e-2, weight_decay=1e-4)

for _ in range(140):
    cnn.train()
    optimizer.zero_grad()
    loss = criterion(cnn(X_tr_t), y_tr_t)
    loss.backward()
    optimizer.step()

cnn.eval()
with torch.no_grad():
    logits_va = cnn(X_va_t).numpy()
    logits_te = cnn(X_te_t).numpy()


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30.0, 30.0)))


p_te_raw = sigmoid(logits_te)

print(f"Split frames -> train={len(train_recs)}, val={len(val_recs)}, test={len(test_recs)}")
print(
    f"Sobel+LR  Test ROC-AUC={roc_auc_score(y_te, p_te_sobel):.3f}, "
    f"AP={average_precision_score(y_te, p_te_sobel):.3f}"
)
print(
    f"PyTorch CNN Test ROC-AUC={roc_auc_score(y_te, p_te_raw):.3f}, "
    f"AP={average_precision_score(y_te, p_te_raw):.3f}"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Split frames -> train=394, val=102, test=108
Sobel+LR  Test ROC-AUC=0.702, AP=0.668
PyTorch CNN Test ROC-AUC=0.915, AP=0.893
```
<!-- leetllm: output:end -->

The CNN ranks these held-out frames better: average precision (AP) rises from `0.668` to `0.893`, and ROC-AUC rises from `0.702` to `0.915`. AP weights each precision by the increase in recall at that threshold; it is not the trapezoidal area obtained by drawing straight lines through a precision-recall curve.[^sklearnAveragePrecision2026] The comparison shows that the CNN's learned image representation helps on this dataset. To identify which filters detect barcodes or corners, we would need a separate activation or ablation analysis.

## Probability Calibration and Capacity-Constrained Thresholds

Ranking and probability estimation answer different questions. A model can put damaged frames first while consistently overstating their chance of damage. For a true conditional probability $p$, minimizing the positively weighted binary cross-entropy gives

$$
q^* = \frac{4p}{4p + 1 - p}, \qquad \operatorname{logit}(q^*) = \operatorname{logit}(p) + \log 4.
$$

For example, $p=0.20$ becomes $q^*=0.50$. This explains why we should recalibrate a cost-weighted score before reading it as a probability. The finite CNN also has fitting error: on the 108 test frames, its raw Brier score is `0.210` and its five-bin expected calibration error (ECE) is `0.316`. Brier score averages $(p_i-y_i)^2$; ECE averages each bin's absolute gap between mean prediction and observed damage frequency, weighted by its frame count.

**Platt scaling** fits a slope and intercept on the validation frames by minimizing negative log-likelihood for $p_{\text{cal}}=\sigma(az+b)$.[^guo2017][^sklearnCalibration2026] The slope changes the spread of logits; the intercept shifts their center. A temperature alone, $\sigma(z/T)$, cannot supply that independent shift. We constrain $a>0$ so the mapping preserves score order and therefore ROC-AUC and AP, apart from possible floating-point ties. Calibration changes the probability scale, not which frame ranks above another.

| Model Configuration | Test ROC-AUC | Test AP | Brier Score | Expected Calibration Error |
| :--- | :--- | :--- | :--- | :--- |
| Sobel + Logistic Baseline | 0.702 | 0.668 | 0.177 | 0.182 |
| ParcelDamageCNN (Raw Scores) | 0.915 | 0.893 | 0.210 | 0.316 |
| ParcelDamageCNN + Platt Scaling | 0.915 | 0.893 | 0.081 | 0.057 |

The inspection lane handles parcels, so threshold selection must also count parcels. We take the maximum calibrated frame score among each parcel's usable views, then select the lowest threshold that flags at most `35%` of validation parcels.[^sklearnThresholdTuning2026] This meets the budget on that validation sample. The test window measures how it transfers; a production queue still needs an explicit admission limit when arrivals or score distributions change. A maximum of calibrated frame probabilities is a useful routing score, but is not automatically a calibrated parcel probability.

<figure>
  <img src="illustrations/_generated/roc_pr_calibration_dark.png" alt="Measured precision-recall curves on 108 test frames compare CNN AP 0.893 with Sobel AP 0.668. Reliability points use each bin's mean predicted probability and observed damage fraction before and after Platt scaling." />
  <figcaption>Figure 3: The upper plot uses every threshold from the test predictions. In the lower plot, each point represents one nonempty probability bin at its actual mean prediction, rather than at the bin center. Platt scaling reduces ECE from 0.316 to 0.057 in this test window.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=vision-cnn, id=vision-calibration, deps=torch,scipy,numpy -->
```python title="Calibrate frame scores, then select a parcel threshold on validation"
def platt_nll(params: np.ndarray) -> float:
    z = np.float64(params[0]) * logits_va.astype(np.float64) + np.float64(params[1])
    y_float = y_va.astype(np.float64)
    return float(np.mean(np.logaddexp(0.0, z) - y_float * z))


opt_res = optimize.minimize(
    platt_nll, x0=np.array([1.0, 0.0]), method="L-BFGS-B",
    bounds=[(1e-6, None), (None, None)],
)
assert opt_res.success, opt_res.message
a_cal, b_cal = float(opt_res.x[0]), float(opt_res.x[1])

p_va_cal = sigmoid(a_cal * logits_va.astype(np.float64) + b_cal)
p_te_cal = sigmoid(a_cal * logits_te.astype(np.float64) + b_cal)


def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 5) -> float:
    edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece_total = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        mask = (y_prob >= lo) & (y_prob <= hi if hi == 1.0 else y_prob < hi)
        if mask.any():
            ece_total += float(mask.mean()) * abs(float(y_true[mask].mean()) - float(y_prob[mask].mean()))
    return ece_total


def aggregate_parcel_scores(batch_recs: list[dict], probs: np.ndarray):
    parcel_ids = sorted({r["parcel_id"] for r in batch_recs})
    risks, labels = [], []
    for pid in parcel_ids:
        indices = [i for i, r in enumerate(batch_recs) if r["parcel_id"] == pid]
        risks.append(float(probs[indices].max()))
        labels.append(batch_recs[indices[0]]["damaged"])
    return np.array(risks), np.array(labels)


val_risk, val_labels = aggregate_parcel_scores(val_recs, p_va_cal)
test_risk, test_labels = aggregate_parcel_scores(test_recs, p_te_cal)
# Include 1.0 as the no-priority option; these sigmoid scores are strictly below it.
candidate_taus = np.r_[np.unique(val_risk), 1.0]
tau = next(float(t) for t in candidate_taus if np.mean(val_risk >= t) <= 0.35)

te_flag = test_risk >= tau
te_tp = int(np.sum(te_flag & (test_labels == 1)))
te_fp = int(np.sum(te_flag & (test_labels == 0)))
te_fn = int(np.sum((~te_flag) & (test_labels == 1)))

print(f"Fitted Platt parameters: a={a_cal:.3f}, b={b_cal:.3f}")
print(f"Brier score: raw={brier_score_loss(y_te, p_te_raw):.3f} -> calibrated={brier_score_loss(y_te, p_te_cal):.3f}")
print(f"ECE (5 bins): raw={compute_ece(y_te, p_te_raw):.3f} -> calibrated={compute_ece(y_te, p_te_cal):.3f}")
print(f"Validation parcels: {len(val_risk)}, priority={int(np.sum(val_risk >= tau))}, rate={np.mean(val_risk >= tau):.3f}")
print(
    f"Chosen val tau={tau:.3f} | Test parcels={len(test_risk)}, flag rate={float(te_flag.mean()):.3f}, "
    f"precision={te_tp / max(1, te_tp + te_fp):.3f}, "
    f"recall={te_tp / max(1, te_tp + te_fn):.3f}"
)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Fitted Platt parameters: a=3.160, b=-2.130
Brier score: raw=0.210 -> calibrated=0.081
ECE (5 bins): raw=0.316 -> calibrated=0.057
Validation parcels: 60, priority=21, rate=0.350
Chosen val tau=0.646 | Test parcels=59, flag rate=0.220, precision=0.923, recall=0.750
```
<!-- leetllm: output:end -->

## Quality-First Inference Routing and Multi-View Aggregation

The selected threshold flags 21 of 60 validation parcels. On test, it flags 13 of 59 usable parcels: 12 are damaged and one is intact. Four damaged parcels remain in standard flow, giving recall $12/(12+4)=0.75$. The lower test flag rate, `0.220`, demonstrates why a validation percentage is an operating estimate rather than a production capacity guarantee.

The router now applies exactly the aggregation used to select the threshold: quality-check each view, score the usable views, and take their maximum. A low-scoring side view cannot dilute a high-scoring overhead view. When every view fails the quality check, the parcel goes to `recapture`. The returned `risk_score` is the maximum frame score used for routing.

<!-- leetllm: test, output=show, continue=vision-calibration, id=vision-router, deps=torch,scipy,numpy -->
```python title="Multi-view parcel router combining quality veto with calibrated CNN scores"
def route_parcel_frames(frames: list[np.ndarray]) -> dict[str, object]:
    """Check frame quality first, then aggregate calibrated CNN damage scores across usable views."""
    usable_tensors = []
    rejected_reasons = []
    for idx, frame in enumerate(frames):
        q = compute_quality(frame)
        if not q["usable"]:
            reason = "low_light" if q["mean_lum"] < 0.18 else "blur_or_framing"
            rejected_reasons.append(f"view_{idx}:{reason}")
        else:
            usable_tensors.append(frame)

    if not usable_tensors:
        return {
            "queue": "recapture",
            "risk_score": None,
            "usable_views": 0,
            "rejected": rejected_reasons,
        }

    batch = torch.tensor(np.stack(usable_tensors), dtype=torch.float32)
    with torch.no_grad():
        logits = cnn(batch).numpy()
    probs = sigmoid(a_cal * logits.astype(np.float64) + b_cal)
    parcel_risk = float(np.max(probs))
    queue = "priority_inspection" if parcel_risk >= tau else "standard_flow"
    return {
        "queue": queue,
        "risk_score": round(parcel_risk, 3),
        "usable_views": len(usable_tensors),
        "rejected": rejected_reasons,
    }


test_parcel_ids = sorted({r["parcel_id"] for r in records if r["capture_day"] >= 26})[:4]
for pid in test_parcel_ids:
    views = [r["image"] for r in records if r["parcel_id"] == pid]
    true_label = next(r["damaged"] for r in records if r["parcel_id"] == pid)
    decision = route_parcel_frames(views)
    print(f"{pid} (damaged={true_label}) -> {decision}")

dark_parcel = [make_parcel_image(False, 0, True, low_light=True, blurred=False)]
print(f"dark_only_parcel -> {route_parcel_frames(dark_parcel)}")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
parcel_025 (damaged=0) -> {'queue': 'standard_flow', 'risk_score': 0.154, 'usable_views': 2, 'rejected': []}
parcel_026 (damaged=0) -> {'queue': 'standard_flow', 'risk_score': 0.185, 'usable_views': 2, 'rejected': []}
parcel_027 (damaged=1) -> {'queue': 'priority_inspection', 'risk_score': 0.986, 'usable_views': 2, 'rejected': []}
parcel_028 (damaged=0) -> {'queue': 'standard_flow', 'risk_score': 0.278, 'usable_views': 2, 'rejected': []}
dark_only_parcel -> {'queue': 'recapture', 'risk_score': None, 'usable_views': 0, 'rejected': ['view_0:low_light']}
```
<!-- leetllm: output:end -->

## Delayed Outcome Joins and Stratified Slice Monitoring

Inspection labels arrive after routing. In our simulation, priority parcels are inspected one day after capture and standard parcels after four days; recording the result takes one more day. The monitoring report must join each decision to outcomes available by its reporting cutoff.[^google2026mlops]

We evaluate only the untouched test parcels from days `26..30`. A label enters the confusion matrix when `inspect_day > capture_day` and `available_day <= cutoff`; otherwise the parcel remains pending. The per-hub tables show where errors occur, and pooled counts give each mature parcel equal weight. A macro-average would answer a different question by giving each hub equal weight regardless of its volume.

<figure>
  <img src="illustrations/_generated/triage_architecture_dark.png" alt="Parcel routing checks usable views, takes their maximum calibrated frame score, routes above or below a validation-selected threshold, and joins outcomes available by the report cutoff." />
  <figcaption>Figure 4: The same parcel score and threshold connect validation to serving. The 35% budget selects the threshold on validation parcels; the live queue needs its own capacity control. Only recorded inspection outcomes enter the mature confusion counts.</figcaption>
</figure>

<!-- leetllm: test, output=show, continue=vision-router, id=vision-slices, deps=torch,scipy,numpy -->
```python title="Mature specialist outcome join and pooled vs per-hub slice metrics"
def evaluate_mature_slices(cutoff_day: int) -> None:
    """Report available outcomes for test parcels captured on days 26-30."""
    eval_pids = sorted({r["parcel_id"] for r in records if r["capture_day"] >= 26})
    slice_counts = {
        "north_hub": {"tp": 0, "fp": 0, "fn": 0, "tn": 0, "pending": 0},
        "south_hub": {"tp": 0, "fp": 0, "fn": 0, "tn": 0, "pending": 0},
    }

    for pid in eval_pids:
        parcel_frames = [r for r in records if r["parcel_id"] == pid]
        hub = parcel_frames[0]["hub"]
        capture_day = parcel_frames[0]["capture_day"]
        true_damaged = parcel_frames[0]["damaged"]

        decision = route_parcel_frames([r["image"] for r in parcel_frames])
        if decision["queue"] == "recapture":
            continue

        # Inspections take 1 day for priority parcels and 4 days for standard parcels.
        inspect_delay = 1 if decision["queue"] == "priority_inspection" else 4
        inspect_day = capture_day + inspect_delay
        available_day = inspect_day + 1

        if not (inspect_day > capture_day and available_day <= cutoff_day):
            slice_counts[hub]["pending"] += 1
            continue

        flagged = decision["queue"] == "priority_inspection"
        if flagged and true_damaged:
            slice_counts[hub]["tp"] += 1
        elif flagged and not true_damaged:
            slice_counts[hub]["fp"] += 1
        elif (not flagged) and true_damaged:
            slice_counts[hub]["fn"] += 1
        else:
            slice_counts[hub]["tn"] += 1

    pooled = {"tp": 0, "fp": 0, "fn": 0, "tn": 0}
    for hub, c in slice_counts.items():
        for k in pooled:
            pooled[k] += c[k]
        prec = c["tp"] / max(1, c["tp"] + c["fp"])
        rec = c["tp"] / max(1, c["tp"] + c["fn"])
        print(
            f"{hub:10s} | mature={c['tp']+c['fp']+c['fn']+c['tn']:2d} pending={c['pending']:2d} "
            f"| TP={c['tp']:2d} FP={c['fp']:2d} FN={c['fn']:2d} | prec={prec:.3f} rec={rec:.3f}"
        )

    g_prec = pooled["tp"] / max(1, pooled["tp"] + pooled["fp"])
    g_rec = pooled["tp"] / max(1, pooled["tp"] + pooled["fn"])
    print(f"GLOBAL POOL | TP={pooled['tp']:2d} FP={pooled['fp']:2d} FN={pooled['fn']:2d} | prec={g_prec:.3f} rec={g_rec:.3f}")


for cutoff in [32, 35]:
    print(f"Report day {cutoff}")
    evaluate_mature_slices(cutoff_day=cutoff)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
Report day 32
north_hub  | mature=15 pending= 8 | TP= 5 FP= 0 FN= 0 | prec=1.000 rec=1.000
south_hub  | mature=18 pending=18 | TP= 7 FP= 1 FN= 2 | prec=0.875 rec=0.778
GLOBAL POOL | TP=12 FP= 1 FN= 2 | prec=0.923 rec=0.857
Report day 35
north_hub  | mature=23 pending= 0 | TP= 5 FP= 0 FN= 0 | prec=1.000 rec=1.000
south_hub  | mature=36 pending= 0 | TP= 7 FP= 1 FN= 4 | prec=0.875 rec=0.636
GLOBAL POOL | TP=12 FP= 1 FN= 4 | prec=0.923 rec=0.750
```
<!-- leetllm: output:end -->

Compare the same test cohort on days 32 and 35. By day 32, every priority outcome is available, while some standard-flow outcomes are still pending. The early report therefore undercounts missed damage and can overstate recall. Keeping pending labels out of the matrix prevents invented negatives; it does not remove this selection effect. By day 35, even a day-30 standard parcel has its label, so the fully matured cohort gives the complete result. A live dashboard should show both pending counts and performance for fully matured capture cohorts.

## References and Verification Notes

The complete pipeline keeps its units aligned: the quality gate accepts frames, the CNN scores frames, the router combines views into parcel scores, and inspection metrics count parcels. Calibration and threshold selection use validation data; the later test window measures the finished system. The source bundle's `assets/figure_data.py` reruns these cells to generate the plotted predictions and image-quality measurements.

```mastery-quiz
[
  {
    "question": "A fulfillment camera takes three angles of every physical parcel. Why do train and validation splits group by parcel_id before optimizing a CNN?",
    "options": [
      "Random frame splits leak box tint, tape edges, and shared dents across sets, inflating validation AUC metrics",
      "Grouping guarantees that every validation photo was captured after every training photo",
      "Grouping gives the train and validation sets the same damage prevalence at each hub",
      "Grouping removes barcode features so the model must learn corner damage instead"
    ],
    "answer": "Random frame splits leak box tint, tape edges, and shared dents across sets, inflating validation AUC metrics",
    "explanation": "Multiple photos of the same parcel share cardboard texture, barcode placement, lighting gradient, and damage geometry. Entity-grouped splitting prevents the model from memorizing parcel-specific features seen in training."
  },
  {
    "question": "Every pixel is multiplied by 0.25 without clipping or added noise. Luminance variance remains much larger than epsilon. How do the two sharpness measures change?",
    "options": [
      "Both raw Laplacian variance and normalized sharpness fall proportionally by 16x under constant brightness scaling",
      "Raw Laplacian variance drops 16x; normalized sharpness stays approximately unchanged",
      "Raw Laplacian variance stays fixed under dimming while normalized luminance sharpness jumps by a 16x scaling ratio",
      "Both sharpness metrics stay unchanged under scalar intensity shifts since finite differences cancel dim gains"
    ],
    "answer": "Raw Laplacian variance drops 16x; normalized sharpness stays approximately unchanged",
    "explanation": "The linear Laplacian scales by c, so its variance scales by c squared. Luminance variance scales by the same factor. Their ratio changes only slightly when the denominator's epsilon is negligible; the separate brightness check can still reject the image."
  },
  {
    "question": "A strong convolutional response appears at one crushed corner. Why use a 3x3 adaptive max-pool before the classifier head?",
    "options": [
      "It averages the response over the whole image so box size no longer matters",
      "It removes all barcode responses before the classifier sees them",
      "It keeps the largest response in each region while retaining coarse spatial location",
      "It preserves every pixel response so the classifier can reconstruct the original image"
    ],
    "answer": "It keeps the largest response in each region while retaining coarse spatial location",
    "explanation": "Each output cell takes a regional maximum. A localized response can survive without being averaged across the whole image, and the 3x3 arrangement retains coarse position. Pooling alone does not identify damage or remove barcodes."
  },
  {
    "question": "Platt scaling changes a frame score from sigmoid(z) to sigmoid(a*z+b). Which condition preserves the ranking used by ROC-AUC and average precision?",
    "options": [
      "The intercept b must be zero, regardless of the slope",
      "The slope a must be negative so high scores move toward the base rate",
      "The slope a must be zero so all frames receive the same calibrated score",
      "The slope a must be positive, with no ranking-changing numerical ties"
    ],
    "answer": "The slope a must be positive, with no ranking-changing numerical ties",
    "explanation": "For positive a, the transformed score is strictly increasing in z. The intercept moves the probability scale without changing order. A negative slope reverses order; a zero slope collapses every score to a tie."
  },
  {
    "question": "During inference on two views of a parcel, View 0 is completely dark (mean brightness 0.11 < 0.18) and passes a raw score of 0.91 if evaluated, while View 1 is sharp and clear with calibrated score 0.14. How should the router behave?",
    "options": [
      "Send View 0 straight to priority review since maximum raw risk score across camera views rises past 0.90",
      "Arithmetic-average 0.91 and 0.14 into 0.525 prior to comparing risk against the calibrated decision threshold tau",
      "Discard dark View 0 at gating, score clear View 1 (0.14 < tau) to standard_flow, using recapture with zero views",
      "Discard the multi-angle parcel batch immediately for recapture as soon as one camera frame shows dim exposure"
    ],
    "answer": "Discard dark View 0 at gating, score clear View 1 (0.14 < tau) to standard_flow, using recapture with zero views",
    "explanation": "The quality check removes View 0 before scoring. The remaining usable view has score 0.14, below the selected threshold. Recapture is needed only when no usable view remains."
  },
  {
    "question": "In a day-29 monitoring slice report, Parcel A was captured on day 27 and inspected by a specialist on day 29 (available day 30), while Parcel B was captured on day 25 and inspected on day 26 (available day 27). How should the mature outcome join handle them?",
    "options": [
      "Log Parcel A as an intact negative frame to preserve day-29 sample counts alongside settled Parcel B",
      "Score Parcel B inside the mature matrix while leaving right-censored Parcel A pending through day 30",
      "Filter out Parcel A and Parcel B alike unless both cartons were assigned directly to priority inspection queues",
      "Replace missing inspection timestamps on Parcel A with capture_day so pending cartons report immediately"
    ],
    "answer": "Score Parcel B inside the mature matrix while leaving right-censored Parcel A pending through day 30",
    "explanation": "Parcel A's label is unavailable by the day-29 cutoff, while Parcel B's label is available. Keep A pending rather than inventing a negative label. The mature-only report can still be selected toward fast priority inspections, so compare it with fully matured cohorts."
  },
  {
    "question": "Two fulfillment hubs have mature counts: north_hub (TP=8, FP=2, FN=2) and south_hub (TP=0, FP=0, FN=2, TN=10). What is the global pooled precision vs recall across all mature parcels?",
    "options": [
      "Global precision 0.800 (8/10), global recall 0.667 (8/12) pooled on totals",
      "Global precision 0.400 averaging 0.80 and 0.00, global recall 0.400 across hubs",
      "Global precision 0.800 (8/10), global recall 0.800 (8/10) omitting south_hub",
      "Global precision undefined due to zero predicted positives inside south_hub"
    ],
    "answer": "Global precision 0.800 (8/10), global recall 0.667 (8/12) pooled on totals",
    "explanation": "For the pooled metric, TP = 8, FP = 2, and FN = 2 + 2 = 4. Precision is 8/10 = 0.800 and recall is 8/12 = 0.667. A macro-average gives hubs equal weight and answers a different question."
  },
  {
    "question": "A threshold flags 35% of validation parcels using the maximum score across usable views. What does that establish for next week's conveyor traffic?",
    "options": [
      "At most 35% of next week's parcels will be flagged because the threshold is fixed",
      "The validation budget is met; next week's flag rate must be measured and live capacity enforced separately",
      "The maximum of two calibrated frame scores is automatically a calibrated parcel probability",
      "The frame-level flag rate equals the parcel-level flag rate because each parcel has two cameras"
    ],
    "answer": "The validation budget is met; next week's flag rate must be measured and live capacity enforced separately",
    "explanation": "The selected threshold satisfies the constraint on the validation sample. New parcel mixes and image conditions can change the fraction above that threshold. Use the same aggregation in validation and serving, then give the live queue its own admission limit."
  }
]
```

> **Next:** Continue to [Capstone: Production ML Pipeline](/learn/capstone-production-ml-pipeline). With image quality checks, grouped validation, CNN training, Platt calibration, and delayed outcome joins working together for individual parcels, the next capstone connects feature pipelines, automated training, canary deployment, and rollback gates across release cycles.
