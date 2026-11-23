#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi", "numpy", "pydantic", "scikit-learn", "uvicorn"]
# ///
"""End-to-end AI support triage service: TF-IDF + LogisticRegression classifier,
confidence-gated structured LLM fallback, SSE streaming, and SQLite trace ledger.
"""

from contextlib import closing
from datetime import datetime, timezone
from hashlib import sha256
import hmac
import json
from pathlib import Path
import sqlite3
from time import perf_counter
from typing import Iterator, Literal, Protocol
from uuid import uuid4

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from ticket_model import Category, LocalTriageClassifier, TRAINING_CORPUS

RouteKind = Literal["automated", "llm_fallback", "human_review"]


class TriageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, str_strip_whitespace=True)
    ticket_text: str = Field(min_length=12, max_length=1000)
    escalate_if_uncertain: bool = True


class TriageCandidate(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)
    category: Category
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=4, max_length=240)
    top_features: list[str] = Field(min_length=1, max_length=5)


class TriageResponse(BaseModel):
    trace_id: str
    status: Literal["running", "completed", "failed"]
    route: RouteKind | None = None
    category: Category | None = None
    confidence: float | None = None
    probabilities: dict[str, float] = Field(default_factory=dict)
    top_features: list[str] = Field(default_factory=list)
    rationale: str | None = None
    model_version: str | None = None
    error_code: str | None = None


class StructuredEscalationModel(Protocol):
    name: str

    def classify(self, ticket_text: str, local_probs: dict[str, float]) -> object: ...

    def stream_rationale(self, ticket_text: str, local_probs: dict[str, float]) -> Iterator[str]: ...


class TraceLedger:
    """SQLite ledger tracking active and terminal inference requests."""

    def __init__(self, path: Path) -> None:
        self.path = path
        with closing(sqlite3.connect(path)) as db, db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS traces (
                    trace_id TEXT PRIMARY KEY NOT NULL,
                    created_at TEXT NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
                    version INTEGER NOT NULL,
                    input_hmac TEXT NOT NULL,
                    route TEXT,
                    category TEXT,
                    confidence REAL,
                    probabilities_json TEXT,
                    top_features_json TEXT,
                    rationale TEXT,
                    model_version TEXT NOT NULL,
                    latency_ms INTEGER,
                    error_code TEXT
                )
            """)

    def ping(self) -> None:
        with closing(sqlite3.connect(self.path)) as db:
            db.execute("SELECT 1").fetchone()

    def start(self, trace_id: str, ticket_text: str, model_version: str, hmac_key: bytes) -> None:
        digest = hmac.new(hmac_key, ticket_text.encode("utf-8"), sha256).hexdigest()
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute(
                """
                INSERT INTO traces (
                    trace_id, created_at, status, version, input_hmac, model_version
                ) VALUES (?, ?, 'running', 1, ?, ?)
                """,
                (trace_id, datetime.now(timezone.utc).isoformat(), digest, model_version),
            )

    def finish(self, response: TriageResponse, latency_ms: int) -> None:
        with closing(sqlite3.connect(self.path)) as db, db:
            changed = db.execute(
                """
                UPDATE traces
                SET status = ?, version = 2, route = ?, category = ?, confidence = ?,
                    probabilities_json = ?, top_features_json = ?, rationale = ?,
                    model_version = ?, latency_ms = ?, error_code = ?
                WHERE trace_id = ? AND status = 'running' AND version = 1
                """,
                (
                    response.status,
                    response.route,
                    response.category,
                    response.confidence,
                    json.dumps(response.probabilities),
                    json.dumps(response.top_features),
                    response.rationale,
                    response.model_version or "unknown",
                    latency_ms,
                    response.error_code,
                    response.trace_id,
                ),
            )
            if changed.rowcount != 1:
                raise RuntimeError("terminal state already committed")

    def read(self, trace_id: str) -> dict | None:
        with closing(sqlite3.connect(self.path)) as db:
            db.row_factory = sqlite3.Row
            row = db.execute("SELECT * FROM traces WHERE trace_id = ?", (trace_id,)).fetchone()
            return dict(row) if row else None

    def count(self) -> int:
        with closing(sqlite3.connect(self.path)) as db:
            return int(db.execute("SELECT COUNT(*) FROM traces").fetchone()[0])


def verify_llm_candidate(candidate: object) -> TriageCandidate:
    return TriageCandidate.model_validate(candidate)


def run_triage(
    req: TriageRequest,
    classifier: LocalTriageClassifier,
    fallback_model: StructuredEscalationModel | None,
    ledger: TraceLedger,
    hmac_key: bytes,
    confidence_threshold: float,
) -> tuple[TriageResponse, dict]:
    trace_id = uuid4().hex
    ledger.start(trace_id, req.ticket_text, classifier.version, hmac_key)
    started = perf_counter()

    local = classifier.predict_with_evidence(req.ticket_text)
    if local["confidence"] >= confidence_threshold:
        rationale = f"Local linear model matched: {', '.join(local['top_features'])}."
        response = TriageResponse(
            trace_id=trace_id,
            status="completed",
            route="automated",
            category=local["category"],
            confidence=local["confidence"],
            probabilities=local["probabilities"],
            top_features=local["top_features"],
            rationale=rationale,
            model_version=classifier.version,
        )
    elif not req.escalate_if_uncertain or fallback_model is None:
        rationale = (
            f"Top class {local['category']} ({local['confidence']:.2f}) below gate "
            f"{confidence_threshold:.2f}; queued for review."
        )
        response = TriageResponse(
            trace_id=trace_id,
            status="completed",
            route="human_review",
            category=local["category"],
            confidence=local["confidence"],
            probabilities=local["probabilities"],
            top_features=local["top_features"],
            rationale=rationale,
            model_version=classifier.version,
        )
    else:
        try:
            raw_candidate = fallback_model.classify(req.ticket_text, local["probabilities"])
        except TimeoutError:
            response = TriageResponse(
                trace_id=trace_id,
                status="failed",
                probabilities=local["probabilities"],
                top_features=local["top_features"],
                model_version=fallback_model.name,
                error_code="upstream_timeout",
            )
        except Exception:
            response = TriageResponse(
                trace_id=trace_id,
                status="failed",
                probabilities=local["probabilities"],
                top_features=local["top_features"],
                model_version=fallback_model.name,
                error_code="upstream_error",
            )
        else:
            try:
                parsed = verify_llm_candidate(raw_candidate)
            except (ValidationError, ValueError):
                response = TriageResponse(
                    trace_id=trace_id,
                    status="failed",
                    probabilities=local["probabilities"],
                    top_features=local["top_features"],
                    model_version=fallback_model.name,
                    error_code="invalid_model_output",
                )
            else:
                response = TriageResponse(
                    trace_id=trace_id,
                    status="completed",
                    route="llm_fallback",
                    category=parsed.category,
                    confidence=parsed.confidence,
                    probabilities=local["probabilities"],
                    top_features=parsed.top_features,
                    rationale=parsed.rationale,
                    model_version=fallback_model.name,
                )

    ledger.finish(response, int((perf_counter() - started) * 1000))
    return response, local


def _format_sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


def create_app(
    db_path: Path,
    classifier: LocalTriageClassifier | None = None,
    fallback_model: StructuredEscalationModel | None = None,
    *,
    confidence_threshold: float = 0.55,
    hmac_key: bytes = b"local-dev-triage-hmac-key",
) -> FastAPI:
    app = FastAPI(title="Support Triage Service")
    app.state.classifier = classifier if classifier is not None else LocalTriageClassifier()
    app.state.fallback_model = fallback_model
    app.state.ledger = TraceLedger(db_path)
    app.state.confidence_threshold = confidence_threshold
    app.state.hmac_key = hmac_key

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request, _error):
        return JSONResponse(status_code=422, content={"error_code": "invalid_request"})

    @app.post("/v1/triage", response_model=TriageResponse)
    def triage(req: TriageRequest):
        try:
            response, _local = run_triage(
                req,
                app.state.classifier,
                app.state.fallback_model,
                app.state.ledger,
                app.state.hmac_key,
                app.state.confidence_threshold,
            )
            return response
        except (sqlite3.Error, RuntimeError):
            return JSONResponse(status_code=503, content={"error_code": "storage_unavailable"})

    @app.post("/v1/triage/stream")
    def triage_stream(req: TriageRequest):
        trace_id = uuid4().hex
        try:
            app.state.ledger.start(
                trace_id,
                req.ticket_text,
                app.state.classifier.version,
                app.state.hmac_key,
            )
        except sqlite3.Error:
            return JSONResponse(status_code=503, content={"error_code": "storage_unavailable"})

        def event_stream() -> Iterator[str]:
            started = perf_counter()
            local = app.state.classifier.predict_with_evidence(req.ticket_text)
            threshold = app.state.confidence_threshold
            above_gate = local["confidence"] >= threshold
            yield _format_sse(
                "local_signal",
                {
                    "trace_id": trace_id,
                    "probabilities": local["probabilities"],
                    "top_features": local["top_features"],
                    "above_gate": above_gate,
                },
            )

            fallback = app.state.fallback_model
            if above_gate or not req.escalate_if_uncertain or fallback is None:
                route: RouteKind = "automated" if above_gate else "human_review"
                rationale = (
                    f"Matched salient features: {', '.join(local['top_features'])}."
                    if above_gate
                    else f"Confidence {local['confidence']:.2f} < {threshold:.2f}; queued for review."
                )
                for chunk in rationale.split():
                    yield _format_sse("token", {"text": chunk + " "})
                response = TriageResponse(
                    trace_id=trace_id,
                    status="completed",
                    route=route,
                    category=local["category"],
                    confidence=local["confidence"],
                    probabilities=local["probabilities"],
                    top_features=local["top_features"],
                    rationale=rationale,
                    model_version=app.state.classifier.version,
                )
            else:
                try:
                    for token in fallback.stream_rationale(req.ticket_text, local["probabilities"]):
                        yield _format_sse("token", {"text": token})
                    raw_candidate = fallback.classify(req.ticket_text, local["probabilities"])
                    parsed = verify_llm_candidate(raw_candidate)
                except TimeoutError:
                    response = TriageResponse(
                        trace_id=trace_id,
                        status="failed",
                        probabilities=local["probabilities"],
                        top_features=local["top_features"],
                        model_version=fallback.name,
                        error_code="upstream_timeout",
                    )
                except (ValidationError, ValueError):
                    response = TriageResponse(
                        trace_id=trace_id,
                        status="failed",
                        probabilities=local["probabilities"],
                        top_features=local["top_features"],
                        model_version=fallback.name,
                        error_code="invalid_model_output",
                    )
                except Exception:
                    response = TriageResponse(
                        trace_id=trace_id,
                        status="failed",
                        probabilities=local["probabilities"],
                        top_features=local["top_features"],
                        model_version=fallback.name,
                        error_code="upstream_error",
                    )
                else:
                    response = TriageResponse(
                        trace_id=trace_id,
                        status="completed",
                        route="llm_fallback",
                        category=parsed.category,
                        confidence=parsed.confidence,
                        probabilities=local["probabilities"],
                        top_features=parsed.top_features,
                        rationale=parsed.rationale,
                        model_version=fallback.name,
                    )

            try:
                app.state.ledger.finish(response, int((perf_counter() - started) * 1000))
            except (sqlite3.Error, RuntimeError):
                yield _format_sse("error", {"trace_id": trace_id, "error_code": "storage_unavailable"})
                return

            if response.status == "failed":
                yield _format_sse(
                    "error",
                    {"trace_id": trace_id, "error_code": response.error_code},
                )
            else:
                yield _format_sse("done", response.model_dump())

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    @app.get("/v1/traces/{trace_id}")
    def get_trace(trace_id: str):
        row = app.state.ledger.read(trace_id)
        if row is None:
            return JSONResponse(status_code=404, content={"error_code": "trace_not_found"})
        return {
            "trace_id": row["trace_id"],
            "status": row["status"],
            "route": row["route"],
            "category": row["category"],
            "confidence": row["confidence"],
            "probabilities": json.loads(row["probabilities_json"] or "{}"),
            "model_version": row["model_version"],
            "latency_ms": row["latency_ms"],
            "error_code": row["error_code"],
        }

    @app.get("/healthz")
    def healthz():
        try:
            app.state.ledger.ping()
        except sqlite3.Error:
            return JSONResponse(status_code=503, content={"status": "degraded"})
        return {
            "status": "ok",
            "model_version": app.state.classifier.version,
            "classes": len(app.state.classifier.classes),
        }

    @app.get("/", response_class=HTMLResponse)
    def index():
        return Path(__file__).with_name("index.html").read_text(encoding="utf-8")

    return app


if __name__ == "__main__":
    import uvicorn

    local_app = create_app(Path(__file__).with_name("triage_traces.sqlite3"))
    uvicorn.run(local_app, host="127.0.0.1", port=8000)
