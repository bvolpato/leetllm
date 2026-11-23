"""Learning-to-rank, IPS position-bias debiasing, and MMR diversity reranking suite."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

RANK_FEATURES = [
    "bm25_score",
    "title_match",
    "historical_ctr",
    "price_competitiveness",
    "seller_rating",
    "stock_depth_norm",
]


@dataclass(frozen=True)
class RankingConfig:
    top_k: int = 5
    maturity_lag_days: int = 2
    ips_clip: float = 5.0
    mmr_lambda: float = 0.72
    max_per_seller: int = 2


def examination_propensity(position: np.ndarray | int) -> np.ndarray | float:
    """Position examination curve decaying as 1 / rank^0.85."""
    return 1.0 / np.power(np.asarray(position, dtype=float), 0.85)


def generate_ranking_sessions(
    n_queries: int = 45,
    items_per_query: int = 12,
    seed: int = 7,
) -> pd.DataFrame:
    """Create chronological search sessions with eligibility flags, true relevance, and biased clicks."""
    rng = np.random.default_rng(seed)
    topics = [
        "thermal label printer",
        "usb barcode scanner",
        "shipping parcel scale",
        "thermal shipping labels",
        "wireless receipt printer",
    ]
    rows: list[dict[str, Any]] = []
    product_counter = 201

    for q_idx in range(n_queries):
        qid = 1000 + q_idx
        query_day = 1 + (q_idx * 20) // n_queries
        label_mature_day = query_day + 2
        topic = topics[q_idx % len(topics)]
        # Assign distinct latent brand clusters so MMR diversity matters cleanly.
        cluster_ids = rng.integers(0, 4, size=items_per_query)

        bm25 = np.clip(rng.uniform(0.35, 0.96, size=items_per_query), 0.1, 0.99)
        title_match = np.clip(0.55 * bm25 + rng.normal(0.15, 0.16, size=items_per_query), 0.05, 0.99)
        hist_ctr = np.clip(rng.beta(2.2, 5.5, size=items_per_query), 0.02, 0.85)
        price_comp = np.clip(rng.uniform(0.25, 0.98, size=items_per_query), 0.1, 0.99)
        seller_rating = np.clip(rng.normal(0.76, 0.14, size=items_per_query), 0.3, 0.99)
        stock_depth = np.clip(rng.uniform(0.1, 1.0, size=items_per_query), 0.05, 1.0)

        # Eligibility rules: top lexical items may be out of stock, policy blocked, or unshippable.
        in_stock = (rng.random(items_per_query) > 0.12).astype(int)
        ships_region = (rng.random(items_per_query) > 0.08).astype(int)
        policy_blocked = (rng.random(items_per_query) < 0.06).astype(int)

        # Guarantee at least two strong ineligible spoilers and >= 7 eligible candidates per query.
        if q_idx % 2 == 0:
            top_spoiler = int(np.argmax(bm25))
            in_stock[top_spoiler] = 0
        if np.sum((in_stock == 1) & (ships_region == 1) & (policy_blocked == 0)) < 7:
            in_stock[:8] = 1
            ships_region[:8] = 1
            policy_blocked[:8] = 0

        eligible = ((in_stock == 1) & (ships_region == 1) & (policy_blocked == 0)).astype(int)

        # Nonlinear true utility combining query-product alignment, value, and quality.
        latent_utility = (
            1.65 * title_match
            + 1.35 * price_comp * seller_rating
            + 0.95 * hist_ctr
            + 0.35 * bm25
            + rng.normal(0.0, 0.12, size=items_per_query)
        )
        # Discretize eligible true relevance into grades 0..3; ineligible stays 0 in serving target.
        q_edges = np.quantile(latent_utility, [0.35, 0.65, 0.85])
        rel_grade = np.digitize(latent_utility, q_edges)
        rel_grade = np.where(eligible == 1, rel_grade, 0)

        # Legacy logging policy sorted primarily by bm25 + stale popularity (poor price/quality balance).
        legacy_score = 0.85 * bm25 + 0.45 * stock_depth - 0.15 * price_comp + rng.normal(0.0, 0.06, size=items_per_query)
        # Position only among eligible candidates (serving filter enforced online).
        elig_idx = np.where(eligible == 1)[0]
        order = elig_idx[np.argsort(-legacy_score[elig_idx])]
        logged_pos = np.zeros(items_per_query, dtype=int)
        for rank_idx, item_idx in enumerate(order, start=1):
            logged_pos[item_idx] = rank_idx

        # Biased click simulation under Examination Hypothesis.
        click_prob = np.zeros(items_per_query, dtype=float)
        for i in elig_idx:
            exam = float(examination_propensity(logged_pos[i]))
            rel_prob = 0.12 + 0.24 * float(rel_grade[i])
            click_prob[i] = np.clip(exam * rel_prob, 0.0, 0.95)
        observed_click = (rng.random(items_per_query) < click_prob).astype(int)

        for i in range(items_per_query):
            rows.append(
                {
                    "query_id": qid,
                    "query_day": query_day,
                    "label_mature_day": label_mature_day,
                    "query_text": topic,
                    "product_id": product_counter,
                    "seller_id": 10 + int(i % 5),
                    "cluster_id": int(cluster_ids[i]),
                    "in_stock": int(in_stock[i]),
                    "ships_region": int(ships_region[i]),
                    "policy_blocked": int(policy_blocked[i]),
                    "eligible": int(eligible[i]),
                    "bm25_score": round(float(bm25[i]), 4),
                    "title_match": round(float(title_match[i]), 4),
                    "historical_ctr": round(float(hist_ctr[i]), 4),
                    "price_competitiveness": round(float(price_comp[i]), 4),
                    "seller_rating": round(float(seller_rating[i]), 4),
                    "stock_depth_norm": round(float(stock_depth[i]), 4),
                    "logged_position": int(logged_pos[i]),
                    "observed_click": int(observed_click[i]),
                    "relevance_grade": int(rel_grade[i]),
                }
            )
            product_counter += 1

    return pd.DataFrame(rows)


def filter_eligible(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only candidates passing stock, shipping region, and policy gates."""
    mask = (df["in_stock"] == 1) & (df["ships_region"] == 1) & (df["policy_blocked"] == 0)
    return df.loc[mask].copy()


def split_temporal_sessions(
    df: pd.DataFrame,
    train_cutoff_day: int = 12,
    val_cutoff_day: int = 16,
    maturity_lag_days: int = 2,
) -> dict[str, pd.DataFrame]:
    """Chronological split guarding train cutoff against immature conversion labels."""
    train = df[
        (df["query_day"] <= train_cutoff_day)
        & (df["label_mature_day"] <= train_cutoff_day + maturity_lag_days)
    ].copy()
    validation = df[(df["query_day"] > train_cutoff_day) & (df["query_day"] <= val_cutoff_day)].copy()
    test = df[df["query_day"] > val_cutoff_day].copy()
    return {"train": train, "validation": validation, "test": test}


def ndcg_at_k(relevances: np.ndarray, k: int = 5) -> float:
    """Compute Normalized Discounted Cumulative Gain at cutoff k."""
    rel = np.asarray(relevances, dtype=float)[:k]
    if len(rel) == 0:
        return 0.0
    discounts = 1.0 / np.log2(np.arange(2, len(rel) + 2))
    dcg = float(np.sum((np.power(2.0, rel) - 1.0) * discounts))
    ideal = np.sort(np.asarray(relevances, dtype=float))[::-1][:k]
    idcg = float(np.sum((np.power(2.0, ideal) - 1.0) * discounts[: len(ideal)]))
    return dcg / idcg if idcg > 0.0 else 0.0


def evaluate_ranking_metrics(
    df: pd.DataFrame,
    scores: np.ndarray,
    k: int = 5,
) -> dict[str, float]:
    """Compute mean NDCG@k and Recall@k of grade >= 2 items over queries."""
    work = df.copy()
    work["_score"] = scores
    ndcgs: list[float] = []
    recalls: list[float] = []
    for _, qdf in work.groupby("query_id", sort=False):
        ranked = qdf.sort_values("_score", ascending=False)
        ndcgs.append(ndcg_at_k(ranked["relevance_grade"].to_numpy(), k=k))
        all_rel = int(np.sum(qdf["relevance_grade"] >= 2))
        if all_rel > 0:
            hit_rel = int(np.sum(ranked.iloc[:k]["relevance_grade"] >= 2))
            recalls.append(hit_rel / all_rel)
    return {
        f"ndcg@{k}": round(float(np.mean(ndcgs)), 4),
        f"recall@{k}": round(float(np.mean(recalls)) if recalls else 1.0, 4),
    }


def train_pytorch_ranknet(
    train_df: pd.DataFrame,
    epochs: int = 120,
    lr: float = 0.04,
    seed: int = 7,
) -> tuple[torch.nn.Module, StandardScaler]:
    """Fit a PyTorch pairwise RankNet MLP minimizing logistic pairwise loss."""
    torch.manual_seed(seed)
    scaler = StandardScaler()
    X_np = scaler.fit_transform(train_df[RANK_FEATURES].to_numpy(dtype=np.float32))
    X = torch.tensor(X_np, dtype=torch.float32)

    pairs_i: list[int] = []
    pairs_j: list[int] = []
    rel = train_df["relevance_grade"].to_numpy()
    qids = train_df["query_id"].to_numpy()
    for qid in np.unique(qids):
        idx = np.where(qids == qid)[0]
        for a in idx:
            for b in idx:
                if rel[a] > rel[b]:
                    pairs_i.append(int(a))
                    pairs_j.append(int(b))

    idx_i = torch.tensor(pairs_i, dtype=torch.long)
    idx_j = torch.tensor(pairs_j, dtype=torch.long)

    model = torch.nn.Sequential(
        torch.nn.Linear(len(RANK_FEATURES), 16),
        torch.nn.ReLU(),
        torch.nn.Linear(16, 1),
    )
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-3)
    loss_fn = torch.nn.BCEWithLogitsLoss()

    for _ in range(epochs):
        opt.zero_grad()
        scores = model(X).squeeze(-1)
        logits = scores[idx_i] - scores[idx_j]
        loss = loss_fn(logits, torch.ones_like(logits))
        loss.backward()
        opt.step()

    model.eval()
    return model, scaler


def score_ranknet(model: torch.nn.Module, scaler: StandardScaler, df: pd.DataFrame) -> np.ndarray:
    """Predict pairwise RankNet scores on any candidate dataframe."""
    X_scaled = scaler.transform(df[RANK_FEATURES].to_numpy(dtype=np.float32))
    with torch.no_grad():
        return model(torch.tensor(X_scaled, dtype=torch.float32)).squeeze(-1).numpy()


def train_ips_click_rankers(
    train_df: pd.DataFrame,
    ips_clip: float = 5.0,
) -> dict[str, tuple[LogisticRegression, StandardScaler]]:
    """Train naive unweighted vs clipped-IPS weighted logistic click models."""
    scaler = StandardScaler()
    X_train = scaler.fit_transform(train_df[RANK_FEATURES].to_numpy())
    y_click = train_df["observed_click"].to_numpy()
    pos = np.maximum(train_df["logged_position"].to_numpy(), 1)
    prop = examination_propensity(pos)

    naive_clf = LogisticRegression(max_iter=500, random_state=7)
    naive_clf.fit(X_train, y_click)

    # Positive clicks receive inverse propensity weights clipped to control gradient variance.
    ips_weights = np.where(y_click == 1, np.minimum(1.0 / prop, ips_clip), 1.0)
    ips_clf = LogisticRegression(max_iter=500, random_state=7)
    ips_clf.fit(X_train, y_click, sample_weight=ips_weights)

    return {"naive": (naive_clf, scaler), "ips_clipped": (ips_clf, scaler)}


def mmr_rerank_query(
    qdf: pd.DataFrame,
    scores: np.ndarray,
    k: int = 5,
    lam: float = 0.72,
    max_per_seller: int = 2,
) -> tuple[pd.DataFrame, float]:
    """Greedy Maximal Marginal Relevance reranking with per-seller diversity constraint."""
    raw_num = qdf[RANK_FEATURES].to_numpy(dtype=float)
    centered = (raw_num - np.mean(raw_num, axis=0, keepdims=True)) / np.maximum(np.std(raw_num, axis=0, keepdims=True), 1e-4)
    clusters = qdf["cluster_id"].to_numpy(dtype=int)
    one_hot = np.zeros((len(qdf), 4), dtype=float)
    one_hot[np.arange(len(qdf)), np.clip(clusters, 0, 3)] = 2.0
    feats = np.hstack([centered * 0.4, one_hot])
    norms = np.linalg.norm(feats, axis=1, keepdims=True)
    emb = feats / np.maximum(norms, 1e-8)
    sim_matrix = emb @ emb.T
    # Normalize relevance scores to [0, 1] inside query for clean lambda interpolation.
    s_min, s_max = float(np.min(scores)), float(np.max(scores))
    norm_rel = (scores - s_min) / max(s_max - s_min, 1e-6)
    sellers = qdf["seller_id"].to_numpy()

    selected: list[int] = []
    remaining = list(range(len(qdf)))
    seller_counts: dict[int, int] = {}

    while len(selected) < min(k, len(qdf)) and remaining:
        best_idx = None
        best_mmr = -1e9
        for idx in remaining:
            sid = int(sellers[idx])
            if seller_counts.get(sid, 0) >= max_per_seller:
                continue
            max_sim = max(float(sim_matrix[idx, s]) for s in selected) if selected else 0.0
            mmr_val = lam * float(norm_rel[idx]) - (1.0 - lam) * max_sim
            if mmr_val > best_mmr:
                best_mmr = mmr_val
                best_idx = idx
        if best_idx is None:
            break
        selected.append(best_idx)
        remaining.remove(best_idx)
        sid = int(sellers[best_idx])
        seller_counts[sid] = seller_counts.get(sid, 0) + 1

    # Mean pairwise dissimilarity (1 - cosine) among selected top-k items.
    if len(selected) >= 2:
        pair_sims = [
            float(sim_matrix[selected[a], selected[b]])
            for a in range(len(selected))
            for b in range(a + 1, len(selected))
        ]
        diversity = 1.0 - float(np.mean(pair_sims))
    else:
        diversity = 0.0
    return qdf.iloc[selected].copy(), round(diversity, 4)


def run_capstone_suite(seed: int = 7) -> dict[str, Any]:
    """Execute eligibility filtering, RankNet, GBDT, IPS debiasing, and MMR evaluation."""
    cfg = RankingConfig()
    data_path = Path(__file__).resolve().parent / "temporal-ranking.csv"
    if data_path.exists():
        raw_df = pd.read_csv(data_path)
    else:
        raw_df = generate_ranking_sessions(n_queries=45, items_per_query=12, seed=seed)

    elig_df = filter_eligible(raw_df)
    splits = split_temporal_sessions(elig_df, maturity_lag_days=cfg.maturity_lag_days)
    train_df, val_df, test_df = splits["train"], splits["validation"], splits["test"]

    # 1) Models trained on ground-truth relevance judgments (test comparison).
    gbdt = HistGradientBoostingRegressor(max_depth=3, learning_rate=0.08, max_iter=80, random_state=seed)
    gbdt.fit(train_df[RANK_FEATURES], train_df["relevance_grade"].to_numpy())
    gbdt_test_scores = gbdt.predict(test_df[RANK_FEATURES])

    ranknet, r_scaler = train_pytorch_ranknet(train_df, seed=seed)
    ranknet_test_scores = score_ranknet(ranknet, r_scaler, test_df)

    # 2) Models trained purely from position-biased click logs (naive vs IPS).
    click_models = train_ips_click_rankers(train_df, ips_clip=cfg.ips_clip)
    naive_clf, c_scaler = click_models["naive"]
    ips_clf, _ = click_models["ips_clipped"]

    X_test_scaled = c_scaler.transform(test_df[RANK_FEATURES].to_numpy())
    naive_click_scores = naive_clf.predict_proba(X_test_scaled)[:, 1]
    ips_click_scores = ips_clf.predict_proba(X_test_scaled)[:, 1]

    # 3) Evaluate MMR trade-off on test queries using RankNet scores.
    mmr_summary: dict[str, dict[str, float]] = {}
    for lam in (1.0, 0.72, 0.45):
        ndcgs: list[float] = []
        divs: list[float] = []
        test_work = test_df.copy()
        test_work["_rn"] = ranknet_test_scores
        for _, qdf in test_work.groupby("query_id", sort=False):
            reranked, div = mmr_rerank_query(
                qdf, qdf["_rn"].to_numpy(), k=cfg.top_k, lam=lam, max_per_seller=cfg.max_per_seller
            )
            divs.append(div)
            # Compare against ideal DCG computed from full eligible query pool.
            discounts = 1.0 / np.log2(np.arange(2, len(reranked) + 2))
            dcg = float(np.sum((np.power(2.0, reranked["relevance_grade"].to_numpy()) - 1.0) * discounts))
            ideal = np.sort(qdf["relevance_grade"].to_numpy())[::-1][: cfg.top_k]
            idcg = float(np.sum((np.power(2.0, ideal) - 1.0) * discounts[: len(ideal)]))
            ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
        mmr_summary[f"lambda={lam:.2f}"] = {
            "ndcg@5": round(float(np.mean(ndcgs)), 4),
            "diversity": round(float(np.mean(divs)), 4),
        }

    return {
        "counts": {
            "total_rows": len(raw_df),
            "eligible_rows": len(elig_df),
            "blocked_rows": len(raw_df) - len(elig_df),
            "train_rows": len(train_df),
            "val_rows": len(val_df),
            "test_rows": len(test_df),
        },
        "test_metrics": {
            "bm25_heuristic": evaluate_ranking_metrics(test_df, test_df["bm25_score"].to_numpy(), k=cfg.top_k),
            "pointwise_gbdt": evaluate_ranking_metrics(test_df, gbdt_test_scores, k=cfg.top_k),
            "pytorch_ranknet": evaluate_ranking_metrics(test_df, ranknet_test_scores, k=cfg.top_k),
            "naive_click_log": evaluate_ranking_metrics(test_df, naive_click_scores, k=cfg.top_k),
            "clipped_ips_click": evaluate_ranking_metrics(test_df, ips_click_scores, k=cfg.top_k),
        },
        "mmr_tradeoff": mmr_summary,
    }


if __name__ == "__main__":
    df = generate_ranking_sessions(n_queries=45, items_per_query=12, seed=7)
    csv_out = Path(__file__).resolve().parent / "temporal-ranking.csv"
    df.to_csv(csv_out, index=False)
    print(json.dumps(run_capstone_suite(), indent=2))
