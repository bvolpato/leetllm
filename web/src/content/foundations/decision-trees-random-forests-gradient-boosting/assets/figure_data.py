#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "scikit-learn"]
# ///
"""Recompute the article's plotted training flowers and boosting updates."""

import json
from pathlib import Path

import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

iris = load_iris()
keep = iris.target > 0
X = iris.data[keep][:, [2, 3]]
y = iris.target[keep] - 1
X_train, _, y_train, _ = train_test_split(X, y, test_size=0.3, stratify=y, random_state=7)
stump = DecisionTreeClassifier(max_depth=1, random_state=0).fit(X_train, y_train)
cut = round(float(stump.tree_.threshold[0]), 2)
left = X_train[:, 1] <= cut
sunlight = np.array([[1.0], [2.0], [5.0]])
growth = np.array([10.0, 20.0, 60.0])
prediction = np.full(3, growth.mean())
rounds = [prediction.tolist()]
corrections = []
for _ in range(4):
    tree = DecisionTreeRegressor(max_depth=1, random_state=0).fit(sunlight, growth - prediction)
    correction = tree.predict(sunlight)
    corrections.append(correction.tolist())
    prediction += 0.1 * correction
    rounds.append(prediction.tolist())

data = {
    "flowers": [
        {"length": float(row[0]), "width": float(row[1]), "species": int(label)}
        for row, label in zip(X_train, y_train)
    ],
    "cut": cut,
    "leftCounts": np.bincount(y_train[left]).tolist(),
    "rightCounts": np.bincount(y_train[~left]).tolist(),
    "sunlight": sunlight[:, 0].tolist(),
    "growth": growth.tolist(),
    "rate": 0.1,
    "corrections": corrections,
    "rounds": rounds,
}
Path(__file__).with_name("figure_data.json").write_text(json.dumps(data, indent=2) + "\n")
print(f"Saved {len(X_train)} training flowers and {len(rounds) - 1} fitted boosting rounds.")
