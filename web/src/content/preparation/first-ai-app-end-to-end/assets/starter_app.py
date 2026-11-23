#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fastapi", "numpy", "pydantic", "scikit-learn", "uvicorn"]
# ///
"""A local ticket classifier with a browser and optional saved predictions."""

import argparse
from contextlib import closing
from pathlib import Path
import sqlite3

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, Field

from ticket_model import LocalTriageClassifier


class Ticket(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=1000)


def create_app(database: Path | None = None) -> FastAPI:
    app = FastAPI(title="My first AI app")
    model = LocalTriageClassifier()

    if database is not None:
        with closing(sqlite3.connect(database)) as db, db:
            db.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY,
                    category TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    route TEXT NOT NULL
                )
            """)

    @app.post("/predict")
    def predict(ticket: Ticket):
        result = model.predict_with_evidence(ticket.text)
        result["route"] = "automated" if result["confidence"] >= 0.55 else "human_review"
        if database is not None:
            with closing(sqlite3.connect(database)) as db, db:
                cursor = db.execute(
                    "INSERT INTO predictions (category, confidence, route) VALUES (?, ?, ?)",
                    (result["category"], result["confidence"], result["route"]),
                )
                result["id"] = cursor.lastrowid
        return result

    @app.get("/history")
    def history():
        if database is None:
            return []
        with closing(sqlite3.connect(database)) as db:
            db.row_factory = sqlite3.Row
            rows = db.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT 20")
            return [dict(row) for row in rows]

    @app.get("/", response_class=HTMLResponse)
    def index():
        return Path(__file__).with_name("starter.html").read_text(encoding="utf-8")

    return app


if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--save", action="store_true", help="Save predictions in SQLite")
    args = parser.parse_args()
    database = Path(__file__).with_name("predictions.sqlite3") if args.save else None
    uvicorn.run(create_app(database), host="127.0.0.1", port=8000)
