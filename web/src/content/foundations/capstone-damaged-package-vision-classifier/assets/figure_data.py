#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy==2.5.4", "torch==2.15.0", "scipy==1.18.1", "scikit-learn==1.9.1"]
# ///
"""Run the article's cells and export their measured figure data."""

import argparse
import contextlib
import hashlib
import io
import json
import re
from pathlib import Path

import numpy as np
import scipy
import sklearn
import torch
from scipy import ndimage
from sklearn.metrics import average_precision_score, brier_score_loss, precision_recall_curve, roc_auc_score

parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
parser.add_argument("--output", type=Path)
args = parser.parse_args()
bundle = Path(__file__).resolve().parents[1]
cells = re.findall(r"```python[^\n]*\n(.*?)\n```", (bundle / "content.md").read_text(), re.S)
namespace = {"__name__": "__main__"}
with contextlib.redirect_stdout(io.StringIO()):
    for index, cell in enumerate(cells):
        exec(compile(cell, f"content.md:cell{index + 1}", "exec"), namespace)

y = namespace["y_te"]
models = {}
for name, scores in [("sobel", namespace["p_te_sobel"]), ("raw", namespace["p_te_raw"]), ("platt", namespace["p_te_cal"])]:
    precision, recall, _ = precision_recall_curve(y, scores)
    bins = []
    for lo, hi in zip(np.linspace(0, 1, 6)[:-1], np.linspace(0, 1, 6)[1:]):
        mask = (scores >= lo) & ((scores <= hi) if hi == 1 else (scores < hi))
        if mask.any():
            bins.append({"x": float(scores[mask].mean()), "y": float(y[mask].mean()), "n": int(mask.sum())})
    models[name] = {
        "ap": float(average_precision_score(y, scores)),
        "auc": float(roc_auc_score(y, scores)),
        "brier": float(brier_score_loss(y, scores)),
        "ece": namespace["compute_ece"](y, scores),
        "pr": [{"x": float(r), "y": float(p)} for r, p in zip(recall, precision)],
        "reliability": bins,
    }

sample = namespace["sample_img"]
quality = []
for name, image in [("Full light", sample), ("Quarter light", sample * 0.25), ("Blurred", ndimage.uniform_filter(sample, size=(1, 3, 7)))]:
    q = namespace["compute_quality"](image)
    quality.append({
        "name": name,
        "pixels": np.rint(np.moveaxis(image, 0, -1) * 255).astype(int).tolist(),
        "brightness": q["mean_lum"],
        "raw": q["raw_lap_var"],
        "sharpness": q["norm_sharpness"],
        "usable": bool(q["usable"]),
    })

data = {
    "codeSha256": hashlib.sha256("\n\n".join(cells).encode()).hexdigest(),
    "versions": {"torch": torch.__version__, "numpy": np.__version__, "scipy": scipy.__version__, "sklearn": sklearn.__version__},
    "threads": torch.get_num_threads(),
    "seed": 17,
    "frames": len(y),
    "models": models,
    "quality": quality,
}
output = args.output or bundle / "assets/figure_data.json"
serialized = json.dumps(data, indent=2) + "\n"
if args.check:
    assert output.read_text() == serialized, "Figure data differs from the current article execution"
    print("Figure data exactly matches the executed article cells.")
else:
    output.write_text(serialized)
    print(f"Saved measured curves for {len(y)} test frames and three image-quality comparisons.")
