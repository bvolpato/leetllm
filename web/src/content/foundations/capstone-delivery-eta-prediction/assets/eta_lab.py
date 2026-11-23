"""Point-in-time delivery ETA regression, conformal intervals, and cost-aware alerting."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, HistGradientBoostingRegressor
from sklearn.frozen import FrozenEstimator
from sklearn.calibration import CalibratedClassifierCV
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import brier_score_loss, mean_absolute_error, root_mean_squared_error
from sklearn.model_selection import cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

NUMERIC_FEATURES = [
    "distance_remaining_km",
    "hub_queue_depth",
    "traffic_index",
    "weather_severity",
    "courier_speed_kmh",
    "dispatch_hour_of_day",
    "telemetry_missing",
]
CATEGORICAL_FEATURES = ["courier_tier", "weather_band"]
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES
RISK_NUMERIC_FEATURES = NUMERIC_FEATURES + ["promise_hours"]
RISK_FEATURE_COLUMNS = RISK_NUMERIC_FEATURES + CATEGORICAL_FEATURES


@dataclass(frozen=True)
class EtaCostConfig:
    missed_late_cost: float = 22.0
    false_alert_cost: float = 3.0
    alpha: float = 0.10


def generate_delivery_dataset(
    n_parcels: int = 720,
    seed: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Generate parcel dispatch records and dual-clock telemetry events."""
    rng = np.random.default_rng(seed)
    courier_tiers = np.array(["metro", "regional", "freight"])
    weather_bands = np.array(["clear", "rain", "storm"])
    tier_speed = {"metro": 42.0, "regional": 54.0, "freight": 48.0}
    weather_sev_map = {"clear": 0.0, "rain": 1.0, "storm": 2.4}

    parcel_ids = np.arange(1001, 1001 + n_parcels)
    cutoff_hours = np.sort(rng.uniform(2.0, 960.0, size=n_parcels))
    tiers = rng.choice(courier_tiers, size=n_parcels, p=[0.45, 0.35, 0.20])
    weathers = rng.choice(weather_bands, size=n_parcels, p=[0.55, 0.30, 0.15])

    distance_km = np.where(
        tiers == "metro",
        rng.uniform(8.0, 48.0, size=n_parcels),
        np.where(
            tiers == "regional",
            rng.uniform(35.0, 145.0, size=n_parcels),
            rng.uniform(80.0, 260.0, size=n_parcels),
        ),
    )
    queue_depth = rng.integers(2, 26, size=n_parcels).astype(float)
    hour_of_day = cutoff_hours % 24.0
    rush_bump = 0.45 * np.exp(-0.5 * ((hour_of_day - 17.0) / 2.5) ** 2)
    traffic_index = np.clip(rng.normal(1.05 + rush_bump, 0.22, size=n_parcels), 0.7, 2.2)

    weather_sev = np.array([weather_sev_map[w] for w in weathers], dtype=float)
    base_speed = np.array([tier_speed[t] for t in tiers], dtype=float)

    # Nonlinear interaction: storms amplify hub congestion and slowdown disproportionately.
    queue_congestion = 0.055 * queue_depth * (1.0 + 0.85 * weather_sev)
    highway_hours = (distance_km / base_speed) * (1.0 + 0.42 * (traffic_index - 0.85) + 0.25 * weather_sev)
    interaction_penalty = np.where((weather_sev >= 2.0) & (queue_depth >= 12.0), 1.9, 0.0)
    evening_bottleneck = np.where((hour_of_day >= 16.0) & (hour_of_day <= 19.0) & (traffic_index > 1.3), 1.15, 0.0)

    noise_scale = 0.26 + 0.28 * weather_sev + 0.0022 * distance_km
    true_noise = rng.normal(0.0, noise_scale, size=n_parcels)
    remaining_hours = np.clip(
        highway_hours + queue_congestion + interaction_penalty + evening_bottleneck + true_noise,
        0.4,
        18.0,
    )

    # Promised SLA margin adds operational slack above normal transit speed.
    promise_hours = np.round((distance_km / base_speed) * 1.42 + 0.95 + 0.025 * queue_depth, 2)
    is_late = (remaining_hours > promise_hours).astype(int)
    delivered_hours = cutoff_hours + remaining_hours

    deliveries = pd.DataFrame(
        {
            "parcel_id": parcel_ids,
            "cutoff_hour": np.round(cutoff_hours, 3),
            "delivered_hour": np.round(delivered_hours, 3),
            "courier_tier": tiers,
            "weather_band": weathers,
            "weather_severity": weather_sev,
            "courier_speed_kmh": base_speed,
            "dispatch_hour_of_day": np.round(hour_of_day, 2),
            "promise_hours": promise_hours,
            "remaining_hours": np.round(remaining_hours, 3),
            "is_late": is_late,
        }
    )

    telemetry_rows: list[dict[str, Any]] = []
    for idx in range(n_parcels):
        pid = int(parcel_ids[idx])
        cutoff = float(cutoff_hours[idx])
        dist = float(distance_km[idx])
        q_dep = float(queue_depth[idx])
        traf = float(traffic_index[idx])

        # Pre-cutoff baseline scan: mostly ingested promptly, occasionally delayed past cutoff.
        early_event = round(cutoff - rng.uniform(0.6, 2.2), 3)
        early_ingest_delay = float(rng.choice([0.05, 0.15, 2.5], p=[0.65, 0.25, 0.10]))
        telemetry_rows.append(
            {
                "parcel_id": pid,
                "event_hour": early_event,
                "ingested_hour": round(early_event + early_ingest_delay, 3),
                "distance_remaining_km": round(dist + rng.uniform(3.0, 9.0), 2),
                "hub_queue_depth": max(1.0, q_dep - rng.integers(0, 3)),
                "traffic_index": round(max(0.65, traf - rng.uniform(0.0, 0.12)), 3),
            }
        )

        # Near-cutoff scan: always occurs before cutoff, but ~22% arrives late in storage.
        near_event = round(cutoff - rng.uniform(0.05, 0.35), 3)
        near_delay = float(rng.choice([0.04, 0.90], p=[0.78, 0.22]))
        telemetry_rows.append(
            {
                "parcel_id": pid,
                "event_hour": near_event,
                "ingested_hour": round(near_event + near_delay, 3),
                "distance_remaining_km": round(dist, 2),
                "hub_queue_depth": q_dep,
                "traffic_index": round(traf, 3),
            }
        )

        # Post-cutoff scan reflecting final slowdowns (only visible if a leaky join peaks ahead).
        post_event = round(cutoff + rng.uniform(0.3, 1.5), 3)
        telemetry_rows.append(
            {
                "parcel_id": pid,
                "event_hour": post_event,
                "ingested_hour": round(post_event + 0.05, 3),
                "distance_remaining_km": round(max(0.5, dist * 0.45), 2),
                "hub_queue_depth": float(q_dep + (8.0 if is_late[idx] else -2.0)),
                "traffic_index": round(max(0.7, traf + (0.55 if is_late[idx] else -0.15)), 3),
            }
        )

    telemetry = pd.DataFrame(telemetry_rows)
    return deliveries, telemetry


def assemble_point_in_time_features(
    deliveries: pd.DataFrame,
    telemetry: pd.DataFrame,
    enforce_ingestion_time: bool = True,
) -> pd.DataFrame:
    """Join each parcel to the latest telemetry state strictly visible at cutoff_hour."""
    telem_joined = telemetry.merge(
        deliveries[["parcel_id", "cutoff_hour"]],
        on="parcel_id",
        how="inner",
    )
    visible_mask = telem_joined["event_hour"] <= telem_joined["cutoff_hour"]
    if enforce_ingestion_time:
        visible_mask = visible_mask & (telem_joined["ingested_hour"] <= telem_joined["cutoff_hour"])

    eligible = telem_joined.loc[visible_mask].sort_values(
        ["event_hour", "ingested_hour", "parcel_id"]
    )
    # Keep last visible telemetry row per parcel strictly prior to scoring cutoff.
    latest_telem = eligible.groupby("parcel_id", as_index=False).tail(1)[
        [
            "parcel_id",
            "event_hour",
            "ingested_hour",
            "distance_remaining_km",
            "hub_queue_depth",
            "traffic_index",
        ]
    ]

    merged = deliveries.merge(latest_telem, on="parcel_id", how="left")
    merged["telemetry_missing"] = merged["distance_remaining_km"].isna().astype(int)
    return merged.sort_values("cutoff_hour").reset_index(drop=True)


def split_chronological(
    frame: pd.DataFrame,
    fractions: tuple[float, float, float, float] = (0.45, 0.20, 0.175, 0.175),
    maturity_buffer_hours: float = 12.0,
) -> dict[str, pd.DataFrame]:
    """Partition chronologically into train, calibration, validation, and test with maturity guard."""
    ordered = frame.sort_values("cutoff_hour").reset_index(drop=True)
    n = len(ordered)
    i1 = int(n * fractions[0])
    i2 = int(n * (fractions[0] + fractions[1]))
    i3 = int(n * (fractions[0] + fractions[1] + fractions[2]))

    train_end_cutoff = float(ordered.iloc[i1 - 1]["cutoff_hour"])
    calib_end_cutoff = float(ordered.iloc[i2 - 1]["cutoff_hour"])
    val_end_cutoff = float(ordered.iloc[i3 - 1]["cutoff_hour"])

    # Drop any immature deliveries near split boundaries whose outcome had not completed at freeze time.
    train = ordered.iloc[:i1]
    train = train[train["delivered_hour"] <= train_end_cutoff + maturity_buffer_hours].copy()

    calibration = ordered.iloc[i1:i2]
    calibration = calibration[
        (calibration["cutoff_hour"] > train_end_cutoff)
        & (calibration["delivered_hour"] <= calib_end_cutoff + maturity_buffer_hours)
    ].copy()

    validation = ordered.iloc[i2:i3]
    validation = validation[validation["cutoff_hour"] > calib_end_cutoff].copy()

    test = ordered.iloc[i3:]
    test = test[test["cutoff_hour"] > val_end_cutoff].copy()

    return {
        "train": train.reset_index(drop=True),
        "calibration": calibration.reset_index(drop=True),
        "validation": validation.reset_index(drop=True),
        "test": test.reset_index(drop=True),
    }


def _make_preprocessor(numeric_cols: list[str] | None = None) -> ColumnTransformer:
    cols = numeric_cols if numeric_cols is not None else NUMERIC_FEATURES
    return ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]),
                cols,
            ),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def compute_ece(y_true: np.ndarray, probs: np.ndarray, n_bins: int = 8) -> float:
    """Compute equal-width Expected Calibration Error across probability bins."""
    edges = np.linspace(0.0, 1.0, n_bins + 1)
    total = float(len(y_true))
    ece = 0.0
    for low, high in zip(edges[:-1], edges[1:]):
        if high == 1.0:
            mask = (probs >= low) & (probs <= high)
        else:
            mask = (probs >= low) & (probs < high)
        if np.any(mask):
            bin_acc = float(np.mean(y_true[mask]))
            bin_conf = float(np.mean(probs[mask]))
            ece += float(np.sum(mask) / total) * abs(bin_acc - bin_conf)
    return round(float(ece), 4)


def split_conformal_quantile(residuals: np.ndarray, alpha: float = 0.10) -> float:
    """Return finite-sample split conformal quantile ceil((n + 1) * (1 - alpha)) / n."""
    n = len(residuals)
    level = min(1.0, np.ceil((n + 1) * (1.0 - alpha)) / n)
    return float(np.quantile(residuals, level, method="higher"))


def evaluate_policy_cost(
    y_true: np.ndarray,
    probs: np.ndarray,
    threshold: float,
    costs: EtaCostConfig,
) -> dict[str, float]:
    """Compute dispatch alert rate, recall, precision, and total operational cost."""
    alerts = (probs >= threshold).astype(int)
    false_alerts = int(np.sum((alerts == 1) & (y_true == 0)))
    missed_late = int(np.sum((alerts == 0) & (y_true == 1)))
    true_alerts = int(np.sum((alerts == 1) & (y_true == 1)))
    positives = int(np.sum(y_true == 1))

    total_cost = false_alerts * costs.false_alert_cost + missed_late * costs.missed_late_cost
    return {
        "threshold": round(float(threshold), 3),
        "alert_rate": round(float(np.mean(alerts)), 4),
        "recall": round(true_alerts / positives, 4) if positives else 1.0,
        "precision": round(true_alerts / max(1, int(np.sum(alerts))), 4),
        "false_alerts": false_alerts,
        "missed_late": missed_late,
        "total_cost": round(float(total_cost), 2),
        "mean_cost_per_parcel": round(float(total_cost) / len(y_true), 3),
    }


def train_and_evaluate_pipeline(
    seed: int = 42,
    costs: EtaCostConfig | None = None,
) -> dict[str, Any]:
    """Run the full point-in-time ETA regression, conformal, calibration, and cost suite."""
    cfg = costs or EtaCostConfig()
    deliveries, telemetry = generate_delivery_dataset(n_parcels=720, seed=seed)
    pit = assemble_point_in_time_features(deliveries, telemetry, enforce_ingestion_time=True)
    splits = split_chronological(pit)

    train_df = splits["train"]
    cal_df = splits["calibration"]
    val_df = splits["validation"]
    test_df = splits["test"]

    X_train, y_train_reg, y_train_cls = train_df[FEATURE_COLUMNS], train_df["remaining_hours"].to_numpy(), train_df["is_late"].to_numpy()
    X_cal, y_cal_reg, y_cal_cls = cal_df[FEATURE_COLUMNS], cal_df["remaining_hours"].to_numpy(), cal_df["is_late"].to_numpy()
    X_val, y_val_reg, y_val_cls = val_df[FEATURE_COLUMNS], val_df["remaining_hours"].to_numpy(), val_df["is_late"].to_numpy()
    X_test, y_test_reg, y_test_cls = test_df[FEATURE_COLUMNS], test_df["remaining_hours"].to_numpy(), test_df["is_late"].to_numpy()

    ridge_eta = Pipeline([("prep", _make_preprocessor()), ("reg", Ridge(alpha=2.0))])
    gbdt_eta = Pipeline(
        [
            ("prep", _make_preprocessor()),
            (
                "reg",
                HistGradientBoostingRegressor(
                    max_depth=4,
                    learning_rate=0.08,
                    max_iter=120,
                    min_samples_leaf=8,
                    random_state=seed,
                ),
            ),
        ]
    )
    ridge_eta.fit(X_train, y_train_reg)
    gbdt_eta.fit(X_train, y_train_reg)

    mean_baseline = np.full_like(y_test_reg, fill_value=float(np.mean(y_train_reg)))
    ridge_test_pred = ridge_eta.predict(X_test)
    gbdt_test_pred = gbdt_eta.predict(X_test)

    # Fit secondary difficulty scale sigma(x) on cross-fitted training residuals.
    train_oof_pred = cross_val_predict(gbdt_eta, X_train, y_train_reg, cv=4)
    train_abs_res = np.abs(y_train_reg - train_oof_pred)
    scale_model = Pipeline(
        [
            ("prep", _make_preprocessor()),
            (
                "reg",
                HistGradientBoostingRegressor(
                    max_depth=2,
                    learning_rate=0.06,
                    max_iter=40,
                    min_samples_leaf=20,
                    random_state=seed,
                ),
            ),
        ]
    )
    scale_model.fit(X_train, np.maximum(train_abs_res, 0.25))

    cal_pred = gbdt_eta.predict(X_cal)
    cal_res = np.abs(y_cal_reg - cal_pred)
    q_const = split_conformal_quantile(cal_res, alpha=cfg.alpha)

    cal_sigma = np.maximum(scale_model.predict(X_cal), 0.35)
    q_norm = split_conformal_quantile(cal_res / cal_sigma, alpha=cfg.alpha)

    test_sigma = np.maximum(scale_model.predict(X_test), 0.35)
    const_low, const_high = gbdt_test_pred - q_const, gbdt_test_pred + q_const
    norm_low, norm_high = gbdt_test_pred - q_norm * test_sigma, gbdt_test_pred + q_norm * test_sigma

    const_cov = float(np.mean((y_test_reg >= const_low) & (y_test_reg <= const_high)))
    norm_cov = float(np.mean((y_test_reg >= norm_low) & (y_test_reg <= norm_high)))

    # Classifier calibration + threshold optimization (includes SLA promise_hours).
    Xr_train = train_df[RISK_FEATURE_COLUMNS]
    Xr_cal = cal_df[RISK_FEATURE_COLUMNS]
    Xr_val = val_df[RISK_FEATURE_COLUMNS]
    Xr_test = test_df[RISK_FEATURE_COLUMNS]

    raw_clf = Pipeline(
        [
            ("prep", _make_preprocessor(RISK_NUMERIC_FEATURES)),
            (
                "clf",
                HistGradientBoostingClassifier(
                    max_depth=6,
                    learning_rate=0.14,
                    max_iter=150,
                    min_samples_leaf=4,
                    random_state=seed,
                ),
            ),
        ]
    )
    raw_clf.fit(Xr_train, y_train_cls)
    cal_clf = CalibratedClassifierCV(FrozenEstimator(raw_clf), method="sigmoid")
    cal_clf.fit(Xr_cal, y_cal_cls)

    raw_val_prob = raw_clf.predict_proba(Xr_val)[:, 1]
    cal_val_prob = cal_clf.predict_proba(Xr_val)[:, 1]
    raw_test_prob = raw_clf.predict_proba(Xr_test)[:, 1]
    cal_test_prob = cal_clf.predict_proba(Xr_test)[:, 1]

    thresholds = np.round(np.arange(0.06, 0.86, 0.04), 2)
    sweep_cal = [evaluate_policy_cost(y_val_cls, cal_val_prob, float(t), cfg) for t in thresholds]
    sweep_raw = [evaluate_policy_cost(y_val_cls, raw_val_prob, float(t), cfg) for t in thresholds]
    best_val_entry = min(sweep_cal, key=lambda r: r["mean_cost_per_parcel"])
    bayes_t = cfg.false_alert_cost / (cfg.false_alert_cost + cfg.missed_late_cost)

    return {
        "split_sizes": {k: len(v) for k, v in splits.items()},
        "missing_telemetry_rate": round(float(pit["telemetry_missing"].mean()), 4),
        "eta_regression_test": {
            "mean_mae": round(float(mean_absolute_error(y_test_reg, mean_baseline)), 3),
            "ridge_mae": round(float(mean_absolute_error(y_test_reg, ridge_test_pred)), 3),
            "gbdt_mae": round(float(mean_absolute_error(y_test_reg, gbdt_test_pred)), 3),
            "gbdt_rmse": round(float(root_mean_squared_error(y_test_reg, gbdt_test_pred)), 3),
        },
        "conformal_90pct_test": {
            "const_q": round(q_const, 3),
            "const_coverage": round(const_cov, 3),
            "const_mean_width": round(float(np.mean(const_high - const_low)), 3),
            "norm_q": round(q_norm, 3),
            "norm_coverage": round(norm_cov, 3),
            "norm_mean_width": round(float(np.mean(norm_high - norm_low)), 3),
            "sample_intervals": [
                {
                    "parcel_id": int(test_df.iloc[i]["parcel_id"]),
                    "weather": str(test_df.iloc[i]["weather_band"]),
                    "actual": round(float(y_test_reg[i]), 2),
                    "pred": round(float(gbdt_test_pred[i]), 2),
                    "low": round(float(max(0.0, norm_low[i])), 2),
                    "high": round(float(norm_high[i]), 2),
                }
                for i in range(min(5, len(test_df)))
            ],
        },
        "calibration_test": {
            "raw_brier": round(float(brier_score_loss(y_test_cls, raw_test_prob)), 4),
            "calibrated_brier": round(float(brier_score_loss(y_test_cls, cal_test_prob)), 4),
            "raw_ece": compute_ece(y_test_cls, raw_test_prob),
            "calibrated_ece": compute_ece(y_test_cls, cal_test_prob),
        },
        "policy": {
            "bayes_optimal_threshold": round(bayes_t, 3),
            "validation_optimal_threshold": best_val_entry["threshold"],
            "validation_sweep": sweep_cal,
            "validation_sweep_raw": sweep_raw,
            "test_at_val_optimal": evaluate_policy_cost(
                y_test_cls, cal_test_prob, best_val_entry["threshold"], cfg
            ),
            "test_at_bayes": evaluate_policy_cost(y_test_cls, cal_test_prob, bayes_t, cfg),
            "test_at_naive_050": evaluate_policy_cost(y_test_cls, cal_test_prob, 0.50, cfg),
        },
    }


def compare_leaky_vs_pit(seed: int = 42) -> dict[str, float]:
    """Show offline-to-serving collapse when models train on unguarded future telemetry."""
    deliveries, telemetry = generate_delivery_dataset(n_parcels=720, seed=seed)
    pit_df = assemble_point_in_time_features(deliveries, telemetry, enforce_ingestion_time=True)

    # Naive unguarded join picks the latest row per parcel regardless of cutoff timestamps.
    leaky_latest = (
        telemetry.sort_values(["event_hour", "ingested_hour", "parcel_id"])
        .groupby("parcel_id", as_index=False)
        .tail(1)[["parcel_id", "distance_remaining_km", "hub_queue_depth", "traffic_index"]]
    )
    leaky_df = deliveries.merge(leaky_latest, on="parcel_id", how="left").sort_values("cutoff_hour").reset_index(drop=True)
    leaky_df["telemetry_missing"] = 0

    pit_splits = split_chronological(pit_df)
    leaky_splits = split_chronological(leaky_df)

    model_kw = dict(max_depth=4, learning_rate=0.08, max_iter=120, min_samples_leaf=8, random_state=seed)
    pit_model = Pipeline([("prep", _make_preprocessor()), ("reg", HistGradientBoostingRegressor(**model_kw))])
    leaky_model = Pipeline([("prep", _make_preprocessor()), ("reg", HistGradientBoostingRegressor(**model_kw))])

    pit_model.fit(pit_splits["train"][FEATURE_COLUMNS], pit_splits["train"]["remaining_hours"].to_numpy())
    leaky_model.fit(leaky_splits["train"][FEATURE_COLUMNS], leaky_splits["train"]["remaining_hours"].to_numpy())

    y_val = pit_splits["validation"]["remaining_hours"].to_numpy()
    y_test = pit_splits["test"]["remaining_hours"].to_numpy()
    return {
        "leaky_offline_val_mae": round(float(mean_absolute_error(y_val, leaky_model.predict(leaky_splits["validation"][FEATURE_COLUMNS]))), 3),
        "leaky_serving_test_mae": round(float(mean_absolute_error(y_test, leaky_model.predict(pit_splits["test"][FEATURE_COLUMNS]))), 3),
        "pit_serving_test_mae": round(float(mean_absolute_error(y_test, pit_model.predict(pit_splits["test"][FEATURE_COLUMNS]))), 3),
    }


if __name__ == "__main__":
    summary = train_and_evaluate_pipeline()
    summary["leakage_check"] = compare_leaky_vs_pit()
    print(json.dumps(summary, indent=2))
