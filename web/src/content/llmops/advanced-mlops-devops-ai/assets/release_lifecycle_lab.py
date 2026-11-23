#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Local SQLite release lifecycle lab for generation-guarded rollouts and sustained breach checks."""
from contextlib import closing
from hashlib import sha256
import json
import math
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory


def canonical_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def manifest_digest(value: object) -> str:
    return sha256(canonical_json(value).encode("utf-8")).hexdigest()[:12]


def normalize_vector(values: list[float], mode: str) -> list[float]:
    if not values:
        raise ValueError("feature vector cannot be empty")
    if mode == "none":
        return [float(x) for x in values]
    if mode != "l2":
        raise ValueError(f"unsupported normalization mode: {mode}")
    scale = max(abs(float(x)) for x in values)
    if scale == 0.0:
        raise ValueError("zero vector has undefined L2 direction")
    scaled = [float(x) / scale for x in values]
    norm = math.hypot(*scaled)
    return [x / norm for x in scaled]


def verify_feature_parity(offline_mode: str, online_mode: str) -> None:
    probes = [[3.0, 4.0], [2.0, 0.0], [-4.0, 3.0]]
    for vec in probes:
        a = normalize_vector(vec, offline_mode)
        b = normalize_vector(vec, online_mode)
        if not all(math.isclose(x, y, rel_tol=1e-9, abs_tol=1e-12) for x, y in zip(a, b, strict=True)):
            raise ValueError(f"feature transform mismatch: offline={offline_mode}, online={online_mode}")


def register_release(db: sqlite3.Connection, manifest: dict[str, object]) -> str:
    rid = manifest_digest(manifest)
    db.execute("INSERT OR IGNORE INTO releases VALUES (?, ?)", (rid, canonical_json(manifest)))
    db.commit()
    return rid


def get_routing_token(db: sqlite3.Connection) -> tuple[str, int]:
    return db.execute("SELECT release_id, generation FROM routing WHERE name='production'").fetchone()


def atomic_switch(
    db: sqlite3.Connection,
    expected: tuple[str, int],
    target: str,
    ready_ids: set[str],
    reason: str,
) -> tuple[str, int]:
    if target not in ready_ids:
        raise ValueError(f"release {target} failed readiness verification")
    with db:
        rows = db.execute(
            "UPDATE routing SET release_id=?, generation=generation+1 "
            "WHERE name='production' AND release_id=? AND generation=?",
            (target, expected[0], expected[1]),
        ).rowcount
        if rows != 1:
            raise ValueError("stale routing token; refresh release and generation before acting")
        new_gen = expected[1] + 1
        db.execute(
            "INSERT INTO audit (previous_id, target_id, generation, reason) VALUES (?, ?, ?, ?)",
            (expected[0], target, new_gen, reason),
        )
        return target, new_gen


def check_sustained_breach(windows_ms: list[float], *, limit_ms: float = 850.0, required: int = 3) -> bool:
    streak = 0
    for val in windows_ms:
        if math.isnan(val) or math.isinf(val) or val < 0:
            raise ValueError("invalid metric sample requires rollout pause")
        streak = streak + 1 if val > limit_ms else 0
        if streak >= required:
            return True
    return False


def main() -> None:
    with TemporaryDirectory(prefix="release-lifecycle-") as tmpdir:
        with closing(sqlite3.connect(Path(tmpdir) / "registry.sqlite")) as db:
            db.execute("CREATE TABLE releases (id TEXT PRIMARY KEY, manifest TEXT NOT NULL)")
            db.execute("CREATE TABLE routing (name TEXT PRIMARY KEY, release_id TEXT NOT NULL, generation INTEGER NOT NULL)")
            db.execute("CREATE TABLE audit (id INTEGER PRIMARY KEY AUTOINCREMENT, previous_id TEXT, target_id TEXT, generation INTEGER, reason TEXT)")

            base = {"prompt": "support@v2.8", "model": "base@42", "norm": "l2", "corpus": "rev4"}
            skewed = {"prompt": "support@v2.8", "model": "base@42", "norm": "none", "corpus": "rev5"}
            fixed = {"prompt": "support@v2.8", "model": "base@42", "norm": "l2", "corpus": "rev5"}

            try:
                verify_feature_parity(str(base["norm"]), str(skewed["norm"]))
            except ValueError as err:
                print(f"Skew blocked cleanly: {err}")

            verify_feature_parity(str(base["norm"]), str(fixed["norm"]))
            base_id = register_release(db, base)
            cand_id = register_release(db, fixed)
            ready = {base_id, cand_id}

            db.execute("INSERT INTO routing VALUES ('production', ?, 0)", (base_id,))
            db.commit()

            tok0 = get_routing_token(db)
            tok1 = atomic_switch(db, tok0, cand_id, ready, "promote candidate")
            tok2 = atomic_switch(db, tok1, base_id, ready, "drill restore baseline")
            tok3 = atomic_switch(db, tok2, cand_id, ready, "redeploy candidate")

            try:
                atomic_switch(db, tok1, base_id, ready, "stale rollback attempt")
            except ValueError as err:
                print(f"Stale controller token rejected at gen 3: {err}")

            if check_sustained_breach([790.0, 910.0, 930.0, 905.0], limit_ms=850.0, required=3):
                tok4 = atomic_switch(db, tok3, base_id, ready, "sustained TTFT rollback")
                print(f"Final active state: {tok4}")


if __name__ == "__main__":
    main()
