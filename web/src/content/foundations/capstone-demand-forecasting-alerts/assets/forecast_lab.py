"""Rolling-origin parcel demand forecasting, conformal bands, and newsvendor staffing."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_pinball_loss, root_mean_squared_error
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FORECAST_FEATURES = [
    "horizon",
    "dow_sin",
    "dow_cos",
    "biweekly_sin",
    "biweekly_cos",
    "is_weekend",
    "trend_day",
    "lag_1_at_origin",
    "lag_7_from_target",
    "rolling_7_mean",
    "rolling_7_std",
    "known_promo",
    "promo_x_weekend",
]


@dataclass(frozen=True)
class NewsvendorCostConfig:
    understaff_cost: float = 72.0
    overstaff_cost: float = 18.0
    fixed_capacity: float = 260.0
    alpha: float = 0.10


def generate_demand_history(n_days: int = 120, seed: int = 19) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Create 120 daily parcel counts for north_sort plus scheduled promotion notices."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2025-01-01", periods=n_days, freq="D")

    events_spec = [
        ("2025-01-19", 38.0, 7, "winter_clearance"),
        ("2025-02-02", 42.0, 7, "electronics_flash"),
        ("2025-02-16", 46.0, 1, "late_flash_sale"),
        ("2025-03-02", 48.0, 6, "spring_launch"),
        ("2025-03-16", 54.0, 5, "member_weekend"),
        ("2025-03-29", 56.0, 1, "unplanned_surge"),
        ("2025-04-13", 52.0, 6, "mid_april_drop"),
        ("2025-04-26", 62.0, 5, "month_end_push"),
    ]
    events_rows = []
    for target_str, lift, lead_days, campaign in events_spec:
        t_dt = pd.Timestamp(target_str)
        ann_dt = t_dt - pd.Timedelta(days=lead_days)
        events_rows.append(
            {
                "target_date": t_dt.strftime("%Y-%m-%d"),
                "announced_date": ann_dt.strftime("%Y-%m-%d"),
                "hub": "north_sort",
                "campaign": campaign,
                "expected_lift": lift,
            }
        )
    events_df = pd.DataFrame(events_rows)
    event_map = {pd.Timestamp(r["target_date"]): r["expected_lift"] for _, r in events_df.iterrows()}

    counts: list[int] = []
    dow_effect = np.array([12.0, 8.0, 5.0, 9.0, 18.0, -24.0, -28.0])
    for idx, dt in enumerate(dates):
        trend = 195.0 + 0.35 * idx
        weekly = float(dow_effect[dt.day_of_week])
        biweekly = 8.0 * np.sin(2.0 * np.pi * idx / 14.0)
        promo = float(event_map.get(dt, 0.0))
        weekend_mult = 1.25 if (promo > 0 and dt.day_of_week >= 4) else 1.0
        sigma = 9.0 + 0.14 * promo
        val = int(round(max(80.0, trend + weekly + biweekly + promo * weekend_mult + rng.normal(0.0, sigma))))
        counts.append(val)

    daily_df = pd.DataFrame(
        {
            "date": dates.strftime("%Y-%m-%d"),
            "hub": "north_sort",
            "parcel_count": counts,
            "data_ready_hour": 6,
        }
    )
    return daily_df, events_df


def build_horizon_frame(
    daily_df: pd.DataFrame,
    events_df: pd.DataFrame,
    horizons: tuple[int, ...] = (1, 2, 3),
    enforce_event_notice: bool = True,
) -> pd.DataFrame:
    """Build multi-horizon (origin_date -> target_date) supervised rows without peeking."""
    df = daily_df.copy()
    df["dt"] = pd.to_datetime(df["date"])
    df = df.sort_values("dt").reset_index(drop=True)
    y_by_idx = df["parcel_count"].to_numpy(dtype=float)

    ev_lookup: dict[pd.Timestamp, tuple[pd.Timestamp, float]] = {}
    for _, er in events_df.iterrows():
        ev_lookup[pd.Timestamp(er["target_date"])] = (pd.Timestamp(er["announced_date"]), float(er["expected_lift"]))

    records: list[dict[str, Any]] = []
    # Origin index t uses counts strictly up to t - 1 (prior day completed by morning freeze).
    for origin_idx in range(14, len(df)):
        origin_dt = df.loc[origin_idx, "dt"]
        lag_1_at_origin = float(y_by_idx[origin_idx - 1])
        win_7 = y_by_idx[origin_idx - 7 : origin_idx]
        roll_mean = float(np.mean(win_7))
        roll_std = float(np.std(win_7))

        for h in horizons:
            target_idx = origin_idx + (h - 1)
            if target_idx >= len(df):
                continue
            target_dt = df.loc[target_idx, "dt"]
            dow = int(target_dt.day_of_week)
            lag_7_from_target = float(y_by_idx[target_idx - 7])

            known_promo = 0.0
            if target_dt in ev_lookup:
                ann_dt, lift = ev_lookup[target_dt]
                if (not enforce_event_notice) or (ann_dt <= origin_dt):
                    known_promo = lift

            is_wknd = 1.0 if dow >= 5 else 0.0
            records.append(
                {
                    "origin_date": origin_dt.strftime("%Y-%m-%d"),
                    "target_date": target_dt.strftime("%Y-%m-%d"),
                    "origin_idx": origin_idx,
                    "target_idx": target_idx,
                    "horizon": float(h),
                    "dow_sin": float(np.sin(2.0 * np.pi * dow / 7.0)),
                    "dow_cos": float(np.cos(2.0 * np.pi * dow / 7.0)),
                    "biweekly_sin": float(np.sin(2.0 * np.pi * target_idx / 14.0)),
                    "biweekly_cos": float(np.cos(2.0 * np.pi * target_idx / 14.0)),
                    "is_weekend": is_wknd,
                    "trend_day": float(target_idx),
                    "lag_1_at_origin": lag_1_at_origin,
                    "lag_7_from_target": lag_7_from_target,
                    "rolling_7_mean": roll_mean,
                    "rolling_7_std": roll_std,
                    "known_promo": known_promo,
                    "promo_x_weekend": known_promo * is_wknd,
                    "actual_parcels": float(y_by_idx[target_idx]),
                }
            )

    return pd.DataFrame(records)


def rolling_origin_predictions(
    frame: pd.DataFrame,
    min_train_origin: int = 56,
    cal_end_origin: int = 86,
    refit_every: int = 7,
    seed: int = 19,
) -> dict[str, pd.DataFrame]:
    """Run causal expanding-window rolling-origin training with scheduled weekly refits."""
    ridge_pipe = Pipeline([("scale", StandardScaler()), ("reg", Ridge(alpha=4.0))])
    gbdt_kw = dict(max_depth=3, learning_rate=0.09, max_iter=80, min_samples_leaf=8, random_state=seed)

    cal_rows: list[pd.DataFrame] = []
    test_rows: list[pd.DataFrame] = []
    last_refit_origin: int | None = None
    gbdt_mean = gbdt_q50 = gbdt_q80 = gbdt_q90 = None

    unique_origins = sorted(frame["origin_idx"].unique())
    for origin in unique_origins:
        if origin < min_train_origin:
            continue
        # Only rows whose target_date finished strictly before the origin may enter training.
        train_sub = frame[frame["target_idx"] < origin]
        pred_sub = frame[frame["origin_idx"] == origin].copy()
        if len(train_sub) < 30 or pred_sub.empty:
            continue

        if last_refit_origin is None or (origin - last_refit_origin) >= refit_every:
            X_tr = train_sub[FORECAST_FEATURES].to_numpy()
            y_tr = train_sub["actual_parcels"].to_numpy()
            ridge_pipe.fit(X_tr, y_tr)
            gbdt_mean = HistGradientBoostingRegressor(**gbdt_kw).fit(X_tr, y_tr)
            gbdt_q50 = HistGradientBoostingRegressor(loss="quantile", quantile=0.50, **gbdt_kw).fit(X_tr, y_tr)
            gbdt_q80 = HistGradientBoostingRegressor(loss="quantile", quantile=0.80, **gbdt_kw).fit(X_tr, y_tr)
            gbdt_q90 = HistGradientBoostingRegressor(loss="quantile", quantile=0.90, **gbdt_kw).fit(X_tr, y_tr)
            last_refit_origin = int(origin)

        X_cur = pred_sub[FORECAST_FEATURES].to_numpy()
        pred_sub["naive_s7"] = pred_sub["lag_7_from_target"].to_numpy()
        pred_sub["ridge_pred"] = ridge_pipe.predict(X_cur)
        pred_sub["gbdt_pred"] = gbdt_mean.predict(X_cur)
        pred_sub["q50_pred"] = gbdt_q50.predict(X_cur)
        pred_sub["q80_pred"] = gbdt_q80.predict(X_cur)
        pred_sub["q90_pred"] = gbdt_q90.predict(X_cur)

        if origin <= cal_end_origin:
            cal_rows.append(pred_sub)
        else:
            test_rows.append(pred_sub)

    return {
        "calibration": pd.concat(cal_rows, ignore_index=True),
        "test": pd.concat(test_rows, ignore_index=True),
    }


def evaluate_newsvendor_cost(
    actual: np.ndarray,
    planned_staff: np.ndarray,
    cfg: NewsvendorCostConfig,
) -> dict[str, float]:
    """Compute asymmetric staffing cost for deficits (overtime) and surpluses (idle shift)."""
    shortfall = np.maximum(actual - planned_staff, 0.0)
    surplus = np.maximum(planned_staff - actual, 0.0)
    cost = shortfall * cfg.understaff_cost + surplus * cfg.overstaff_cost
    surge_alerts = int(np.sum(planned_staff > cfg.fixed_capacity))
    return {
        "mean_daily_cost": round(float(np.mean(cost)), 2),
        "shortfall_days": int(np.sum(actual > planned_staff)),
        "mean_shortfall_units": round(float(np.mean(shortfall)), 2),
        "surge_alert_days": surge_alerts,
    }


def run_forecast_suite(seed: int = 19) -> dict[str, Any]:
    """Execute rolling forecasting, split conformal bands, pinball loss, and k-fold leakage comparison."""
    cfg = NewsvendorCostConfig()
    data_dir = Path(__file__).resolve().parent
    daily_path, ev_path = data_dir / "daily_counts.csv", data_dir / "planned_events.csv"
    if daily_path.exists() and ev_path.exists():
        daily_df = pd.read_csv(daily_path)
        events_df = pd.read_csv(ev_path)
    else:
        daily_df, events_df = generate_demand_history(n_days=120, seed=seed)

    frame = build_horizon_frame(daily_df, events_df, horizons=(1, 2, 3), enforce_event_notice=True)
    rolled = rolling_origin_predictions(frame, min_train_origin=56, cal_end_origin=86, seed=seed)
    cal_df, test_df = rolled["calibration"], rolled["test"]

    y_test = test_df["actual_parcels"].to_numpy()
    mae_naive = float(mean_absolute_error(y_test, test_df["naive_s7"]))
    mae_ridge = float(mean_absolute_error(y_test, test_df["ridge_pred"]))
    mae_gbdt = float(mean_absolute_error(y_test, test_df["gbdt_pred"]))
    rmse_gbdt = float(root_mean_squared_error(y_test, test_df["gbdt_pred"]))

    # Split conformal intervals from rolling calibration residuals.
    cal_res = np.abs(cal_df["actual_parcels"].to_numpy() - cal_df["gbdt_pred"].to_numpy())
    n_cal = len(cal_res)
    level = min(1.0, np.ceil((n_cal + 1) * (1.0 - cfg.alpha)) / n_cal)
    q90 = float(np.quantile(cal_res, level, method="higher"))

    test_pred = test_df["gbdt_pred"].to_numpy()
    conf_cov = float(np.mean((y_test >= test_pred - q90) & (y_test <= test_pred + q90)))

    # Newsvendor sweep on quantile forecasts vs median & seasonal naive.
    nv_median = evaluate_newsvendor_cost(y_test, test_df["q50_pred"].to_numpy(), cfg)
    nv_q80 = evaluate_newsvendor_cost(y_test, test_df["q80_pred"].to_numpy(), cfg)
    nv_q90 = evaluate_newsvendor_cost(y_test, test_df["q90_pred"].to_numpy(), cfg)
    nv_naive = evaluate_newsvendor_cost(y_test, test_df["naive_s7"].to_numpy(), cfg)

    # Pinball loss at critical fractile tau* = 0.80.
    pinball_q50 = float(mean_pinball_loss(y_test, test_df["q50_pred"].to_numpy(), alpha=0.80))
    pinball_q80 = float(mean_pinball_loss(y_test, test_df["q80_pred"].to_numpy(), alpha=0.80))

    # Shuffled K-Fold leakage check vs causal rolling MAE.
    kf = KFold(n_splits=5, shuffle=True, random_state=seed)
    X_all, y_all = frame[FORECAST_FEATURES].to_numpy(), frame["actual_parcels"].to_numpy()
    kfold_maes = []
    for tr_i, te_i in kf.split(X_all):
        m = HistGradientBoostingRegressor(max_depth=3, learning_rate=0.09, max_iter=80, min_samples_leaf=8, random_state=seed)
        m.fit(X_all[tr_i], y_all[tr_i])
        kfold_maes.append(mean_absolute_error(y_all[te_i], m.predict(X_all[te_i])))

    # Export clean compact arrays for article plots/verification (horizon h=1 test window).
    h1_test = test_df[test_df["horizon"] == 1.0].reset_index(drop=True)
    return {
        "counts": {"days": len(daily_df), "cal_rows": len(cal_df), "test_rows": len(test_df)},
        "mae_test": {
            "seasonal_naive": round(mae_naive, 2),
            "ridge": round(mae_ridge, 2),
            "gbdt": round(mae_gbdt, 2),
            "gbdt_rmse": round(rmse_gbdt, 2),
            "shuffled_kfold_leaky_mae": round(float(np.mean(kfold_maes)), 2),
        },
        "conformal_90": {
            "q90_radius": round(q90, 2),
            "test_coverage": round(conf_cov, 3),
        },
        "newsvendor_test": {
            "critical_fractile": round(cfg.understaff_cost / (cfg.understaff_cost + cfg.overstaff_cost), 3),
            "seasonal_naive": nv_naive,
            "quantile_050": nv_median,
            "quantile_080": nv_q80,
            "quantile_090": nv_q90,
            "pinball_q80_loss_at_q50": round(pinball_q50, 2),
            "pinball_q80_loss_at_q80": round(pinball_q80, 2),
        },
        "h1_series": {
            "dates": h1_test["target_date"].str.slice(5).tolist(),
            "actual": [round(float(v), 1) for v in h1_test["actual_parcels"]],
            "gbdt": [round(float(v), 1) for v in h1_test["gbdt_pred"]],
            "low_90": [round(float(v - q90), 1) for v in h1_test["gbdt_pred"]],
            "high_90": [round(float(v + q90), 1) for v in h1_test["gbdt_pred"]],
            "q80": [round(float(v), 1) for v in h1_test["q80_pred"]],
        },
    }


if __name__ == "__main__":
    daily_df, events_df = generate_demand_history(n_days=120, seed=19)
    data_dir = Path(__file__).resolve().parent
    daily_df.to_csv(data_dir / "daily_counts.csv", index=False)
    events_df.to_csv(data_dir / "planned_events.csv", index=False)
    print(json.dumps(run_forecast_suite(), indent=2))
