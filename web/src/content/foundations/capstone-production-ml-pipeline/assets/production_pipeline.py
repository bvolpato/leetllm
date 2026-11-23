"""End-to-end tabular delay prediction pipeline with point-in-time joins, artifact verification, slice gating, and drift rollback."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    precision_recall_curve,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = [
    "distance_km",
    "declared_weight_kg",
    "night_dispatch",
    "hub_queue_depth",
    "route_speed_kmh",
    "temp_anomaly_c",
    "scan_age_hours",
]
CATEGORICAL_FEATURES = ["region", "priority_tier"]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


@dataclass(frozen=True)
class GatePolicy:
    """Offline release and online canary thresholds for model promotion."""

    min_roc_auc: float = 0.78
    min_pr_auc: float = 0.70
    max_brier: float = 0.19
    min_slice_recall: float = 0.65
    max_ks_stat: float = 0.25
    min_ks_pvalue: float = 0.01
    max_psi: float = 0.25


def generate_shipment_streams(
    seed: int = 19,
    n_shipments: int = 800,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Generate time-ordered dispatches and asynchronous carrier scan events."""
    rng = np.random.default_rng(seed)
    predict_at = np.sort(rng.uniform(2.0, 718.0, size=n_shipments))
    regions = rng.choice(["north", "central", "west"], size=n_shipments, p=[0.34, 0.33, 0.33])
    priority = rng.choice(["standard", "express"], size=n_shipments, p=[0.55, 0.45])
    distance_km = rng.uniform(20.0, 420.0, size=n_shipments).round(1)
    night_dispatch = rng.binomial(1, 0.38, size=n_shipments)
    weight_kg = rng.gamma(shape=3.0, scale=4.5, size=n_shipments).round(1)

    scan_rows: list[dict] = []
    true_late = np.zeros(n_shipments, dtype=int)
    label_avail = np.zeros(n_shipments, dtype=float)

    for sid in range(n_shipments):
        pat = float(predict_at[sid])
        q_true = rng.gamma(4.0, 6.0) + (8.0 if night_dispatch[sid] else 0.0)
        spd_true = float(np.clip(66.0 - 0.55 * q_true + rng.normal(0, 4.0), 16.0, 86.0))
        temp_true = float(rng.normal(0.0, 3.8))

        logit = (
            -3.1
            + 3.4 * float(abs(temp_true) > 4.2)
            + 3.0 * float(q_true > 26.0 and spd_true < 48.0)
            + 2.4 * float(night_dispatch[sid] == 1 and regions[sid] == "west")
            + 0.002 * float(distance_km[sid])
            - 0.25 * float(priority[sid] == "express")
        )
        prob = 1.0 / (1.0 + np.exp(-logit))
        late = int(rng.random() < prob)
        true_late[sid] = late
        label_avail[sid] = pat + float(rng.uniform(8.0, 36.0))

        obs_pre = pat - float(rng.uniform(0.4, 3.0))
        lag_pre = float(rng.choice([0.2, 0.35, 1.8], p=[0.60, 0.30, 0.10]))
        if sid % 14 != 0:
            scan_rows.append(
                {
                    "shipment_id": sid,
                    "observed_at": obs_pre,
                    "available_at": obs_pre + lag_pre,
                    "hub_queue_depth": round(q_true + float(rng.normal(0, 0.8)), 2),
                    "route_speed_kmh": round(spd_true, 2),
                    "temp_anomaly_c": round(temp_true, 2),
                }
            )

        # Post-dispatch scan arrives after predict_at and leaks the delivery outcome if joined naively.
        obs_post = pat + float(rng.uniform(2.0, 12.0))
        scan_rows.append(
            {
                "shipment_id": sid,
                "observed_at": obs_post,
                "available_at": obs_post + 0.25,
                "hub_queue_depth": round(q_true + (22.0 if late else -7.0) + float(rng.normal(0, 1.0)), 2),
                "route_speed_kmh": round(float(np.clip(spd_true + (-26.0 if late else 8.0), 8.0, 90.0)), 2),
                "temp_anomaly_c": round(temp_true + (3.2 if late else 0.0), 2),
            }
        )

    dispatches = pd.DataFrame(
        {
            "shipment_id": np.arange(n_shipments),
            "predict_at": predict_at,
            "region": regions,
            "priority_tier": priority,
            "distance_km": distance_km,
            "night_dispatch": night_dispatch,
            "declared_weight_kg": weight_kg,
            "true_late": true_late,
            "label_available_at": label_avail,
        }
    )
    return dispatches, pd.DataFrame(scan_rows)


def build_point_in_time_features(dispatches: pd.DataFrame, scans: pd.DataFrame) -> pd.DataFrame:
    """Assemble features as of predict_at using only scans ingested at or before decision time."""
    eligible = scans[scans["observed_at"] <= scans["available_at"]].sort_values("available_at")
    joined = pd.merge_asof(
        dispatches.sort_values("predict_at"),
        eligible,
        left_on="predict_at",
        right_on="available_at",
        by="shipment_id",
        direction="backward",
        allow_exact_matches=True,
    )
    valid_mask = joined["available_at"].isna() | (joined["available_at"] <= joined["predict_at"])
    assert bool(valid_mask.all()), "Point-in-time invariant violated"
    joined["scan_age_hours"] = (joined["predict_at"] - joined["available_at"]).where(
        joined["available_at"].notna(), np.nan
    )
    return joined.sort_values("predict_at").reset_index(drop=True)


def build_leaky_latest_features(dispatches: pd.DataFrame, scans: pd.DataFrame) -> pd.DataFrame:
    """Demonstrate lookahead leakage by taking each shipment's latest scan regardless of timestamp."""
    latest = scans.sort_values("observed_at").drop_duplicates("shipment_id", keep="last")
    leaky = dispatches.merge(latest, on="shipment_id", how="left")
    leaky["scan_age_hours"] = leaky["predict_at"] - leaky["available_at"]
    return leaky.sort_values("predict_at").reset_index(drop=True)


def split_temporal_windows(
    frame: pd.DataFrame,
    val_start: float = 420.0,
    live_start: float = 576.0,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split chronological data while holding back dispatches whose outcomes settle after val_start."""
    train = frame[(frame["predict_at"] < val_start) & (frame["label_available_at"] <= val_start)].copy()
    val = frame[(frame["predict_at"] >= val_start) & (frame["predict_at"] < live_start)].copy()
    live = frame[frame["predict_at"] >= live_start].copy()
    return train, val, live


def build_training_pipeline(model_kind: str = "hgb", seed: int = 19) -> Pipeline:
    """Construct an atomic scikit-learn preprocessing and classification pipeline."""
    preprocessor = ColumnTransformer(
        [
            (
                "num",
                Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]),
                NUMERIC_FEATURES,
            ),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )
    if model_kind == "lr":
        estimator = LogisticRegression(max_iter=500, random_state=seed)
    elif model_kind == "hgb":
        estimator = HistGradientBoostingClassifier(
            max_depth=4,
            max_iter=80,
            learning_rate=0.08,
            min_samples_leaf=12,
            random_state=seed,
        )
    else:
        raise ValueError(f"Unsupported model_kind: {model_kind}")
    return Pipeline([("prep", preprocessor), ("clf", estimator)])


def select_f1_threshold(y_true: np.ndarray, probs: np.ndarray) -> float:
    """Select probability cutoff maximizing F1 on validation predictions."""
    precision, recall, thresholds = precision_recall_curve(y_true, probs)
    best_f1, best_tau = -1.0, 0.5
    for p, r, tau in zip(precision[:-1], recall[:-1], thresholds):
        score = (2.0 * p * r / (p + r)) if (p + r) > 0 else 0.0
        if score > best_f1:
            best_f1, best_tau = float(score), float(tau)
    return best_tau


def evaluate_release_slices(
    frame: pd.DataFrame,
    probs: np.ndarray,
    threshold: float,
    policy: GatePolicy,
) -> dict:
    """Evaluate aggregate and slice metrics against offline release thresholds."""
    y_true = frame["true_late"].to_numpy()
    preds = (probs >= threshold).astype(int)

    roc_auc = float(roc_auc_score(y_true, probs))
    pr_auc = float(average_precision_score(y_true, probs))
    brier = float(brier_score_loss(y_true, probs))

    slice_masks = {
        "express": frame["priority_tier"] == "express",
        "night_dispatch": frame["night_dispatch"] == 1,
        "west_region": frame["region"] == "west",
    }
    slice_recall: dict[str, float] = {}
    for name, mask in slice_masks.items():
        idx = mask.to_numpy()
        positives = int((y_true[idx] == 1).sum())
        tp = int(((preds[idx] == 1) & (y_true[idx] == 1)).sum())
        slice_recall[name] = round(tp / max(positives, 1), 3)

    worst_slice_recall = min(slice_recall.values())
    passed = (
        roc_auc >= policy.min_roc_auc
        and pr_auc >= policy.min_pr_auc
        and brier <= policy.max_brier
        and worst_slice_recall >= policy.min_slice_recall
    )
    return {
        "roc_auc": round(roc_auc, 3),
        "pr_auc": round(pr_auc, 3),
        "brier": round(brier, 3),
        "threshold": round(threshold, 3),
        "slice_recall": slice_recall,
        "passed_offline_gate": passed,
    }


def compute_psi(reference: np.ndarray, current: np.ndarray, n_bins: int = 5) -> float:
    """Compute Population Stability Index using reference quantile bin edges."""
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]
    quantiles = np.linspace(0.0, 1.0, n_bins + 1)
    edges = np.quantile(ref_clean, quantiles)
    edges[0] = -np.inf
    edges[-1] = np.inf
    edges = np.unique(edges)

    ref_hist, _ = np.histogram(ref_clean, bins=edges)
    cur_hist, _ = np.histogram(cur_clean, bins=edges)
    ref_pct = np.clip(ref_hist / max(len(ref_clean), 1), 1e-4, None)
    cur_pct = np.clip(cur_hist / max(len(cur_clean), 1), 1e-4, None)
    return float(np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct)))


def save_verified_bundle(
    bundle_dir: Path,
    model_pipe: Pipeline,
    train_df: pd.DataFrame,
    threshold: float,
    metrics: dict,
    version: str,
) -> Path:
    """Serialize fitted pipeline, drift reference arrays, and SHA-256 manifest."""
    bundle_dir.mkdir(parents=True, exist_ok=True)
    model_path = bundle_dir / "model.joblib"
    joblib.dump(model_pipe, model_path)
    digest = hashlib.sha256(model_path.read_bytes()).hexdigest()

    manifest = {
        "version": version,
        "feature_columns": FEATURE_COLUMNS,
        "threshold": float(threshold),
        "metrics": metrics,
        "model_sha256": digest,
        "ref_hub_queue": train_df["hub_queue_depth"].dropna().round(3).tolist(),
        "ref_route_speed": train_df["route_speed_kmh"].dropna().round(3).tolist(),
    }
    (bundle_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    return bundle_dir


def load_verified_bundle(bundle_dir: Path) -> tuple[Pipeline, dict]:
    """Load serialized pipeline only after SHA-256 checksum matches its manifest."""
    manifest = json.loads((bundle_dir / "manifest.json").read_text())
    model_path = bundle_dir / "model.joblib"
    observed_sha = hashlib.sha256(model_path.read_bytes()).hexdigest()
    if observed_sha != manifest["model_sha256"]:
        raise ValueError(f"Checksum mismatch for {model_path}: expected {manifest['model_sha256']}, got {observed_sha}")
    loaded_pipe = joblib.load(model_path)
    return loaded_pipe, manifest


def monitor_canary_batch(
    batch_df: pd.DataFrame,
    model_pipe: Pipeline,
    manifest: dict,
    policy: GatePolicy,
) -> dict:
    """Score a live canary batch and decide promotion or rollback from drift statistics."""
    probs = model_pipe.predict_proba(batch_df[manifest["feature_columns"]])[:, 1]
    preds = (probs >= manifest["threshold"]).astype(int)

    ref_q = np.array(manifest["ref_hub_queue"], dtype=float)
    cur_q = batch_df["hub_queue_depth"].dropna().to_numpy()
    ks_q = ks_2samp(ref_q, cur_q)
    psi_q = compute_psi(ref_q, cur_q)

    ref_spd = np.array(manifest["ref_route_speed"], dtype=float)
    cur_spd = batch_df["route_speed_kmh"].dropna().to_numpy()
    ks_spd = ks_2samp(ref_spd, cur_spd)
    psi_spd = compute_psi(ref_spd, cur_spd)

    drift_detected = (
        float(ks_q.statistic) > policy.max_ks_stat
        or float(ks_spd.statistic) > policy.max_ks_stat
        or float(ks_q.pvalue) < policy.min_ks_pvalue
        or float(ks_spd.pvalue) < policy.min_ks_pvalue
        or max(psi_q, psi_spd) > policy.max_psi
    )
    action = "rollback_to_previous" if drift_detected else "promote_canary"
    return {
        "n_rows": int(len(batch_df)),
        "mean_pred_risk": round(float(probs.mean()), 3),
        "flagged_rate": round(float(preds.mean()), 3),
        "queue_ks": round(float(ks_q.statistic), 3),
        "queue_psi": round(psi_q, 3),
        "speed_ks": round(float(ks_spd.statistic), 3),
        "speed_psi": round(psi_spd, 3),
        "decision": action,
    }
