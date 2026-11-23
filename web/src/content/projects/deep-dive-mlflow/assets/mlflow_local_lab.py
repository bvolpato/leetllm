#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlflow==3.16.1"]
# ///
"""Local SQLite tracking, tracing, prompt aliases, and code-only evaluation."""
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory

os.environ["MLFLOW_DISABLE_TELEMETRY"] = "true"
os.environ["MLFLOW_ENABLE_ASYNC_TRACE_LOGGING"] = "false"
os.environ["MLFLOW_ENABLE_SYSTEM_METRICS_LOGGING"] = "false"

import mlflow
from mlflow.genai.scorers import scorer
from mlflow.tracking import MlflowClient


@mlflow.trace
def retrieve(question: str) -> list[str]:
    return ["DOC-12"] if question == "What is the return window?" else []


@mlflow.trace
def answer(question: str, variant: str) -> dict:
    documents = retrieve(question)
    citations = {"missing": [], "wrong": ["DOC-99"], "valid": documents}[variant]
    return {"text": "30 days", "citations": citations}


@scorer
def citation_contract(outputs: dict, expectations: dict) -> bool:
    citations = outputs.get("citations")
    return (
        isinstance(citations, list)
        and bool(citations)
        and all(isinstance(item, str) and item in expectations["allowed_docs"] for item in citations)
    )


def main() -> None:
    assert mlflow.__version__ == "3.16.1"
    previous_directory = Path.cwd()
    with TemporaryDirectory(prefix="mlflow-local-lab-") as directory:
        work = Path(directory)
        os.chdir(work)
        try:
            uri = f"sqlite:///{work / 'tracking.db'}"
            mlflow.set_tracking_uri(uri)
            mlflow.set_registry_uri(uri)
            experiment_id = mlflow.create_experiment(
                "policy-assistant-lab", artifact_location=(work / "artifacts").as_uri()
            )
            mlflow.set_experiment(experiment_id=experiment_id)
            client = MlflowClient()

            with mlflow.start_run(run_name="hybrid-reranker-v3") as run:
                mlflow.log_params({"retrieval_k": 40, "rerank_k": 8})
                mlflow.log_metric("ndcg_at_8", 0.81)  # Synthetic fixture, not computed here.
                mlflow.set_tags({"git_commit": "8b2f9e1", "dataset_revision": "eval-08-01"})
                mlflow.log_dict({"case_id": "RET-104", "failure": "missing citation"}, "error_slices.json")
                answer("What is the return window?", "missing")
                trace_id = mlflow.get_last_active_trace_id()
                assert trace_id is not None
                trace = mlflow.get_trace(trace_id)
                assert trace is not None
                assert {span.name for span in trace.data.spans} == {"answer", "retrieve"}
                run_id = run.info.run_id

            stored = client.get_run(run_id)
            assert stored.data.params["retrieval_k"] == "40"
            assert stored.data.metrics["ndcg_at_8"] == 0.81
            artifact = client.download_artifacts(run_id, "error_slices.json", str(work))
            assert json.loads(Path(artifact).read_text())["case_id"] == "RET-104"
            print("tracking: run, metric, artifact, and two-span trace read back")

            try:
                client.log_param(run_id, "retrieval_k", 50)
            except mlflow.exceptions.MlflowException:
                assert client.get_run(run_id).data.params["retrieval_k"] == "40"
            else:
                raise AssertionError("existing parameter was overwritten")
            client.set_tag(run_id, "review_state", "pending")
            client.set_tag(run_id, "review_state", "approved")
            assert client.get_run(run_id).data.tags["review_state"] == "approved"

            first = mlflow.genai.register_prompt("support-answer", "Answer {{question}} with citations.")
            second = mlflow.genai.register_prompt("support-answer", "Answer {{question}}; cite or abstain.")
            mlflow.genai.set_prompt_alias("support-answer", "production", first.version)
            old_object = mlflow.genai.load_prompt("prompts:/support-answer@production", cache_ttl_seconds=0)
            mlflow.genai.set_prompt_alias("support-answer", "production", second.version)
            new_object = mlflow.genai.load_prompt("prompts:/support-answer@production", cache_ttl_seconds=0)
            assert old_object.version == first.version and new_object.version == second.version
            assert mlflow.genai.load_prompt(first.uri).template == first.template
            print(f"prompts: old object=v{old_object.version}; fresh alias=v{new_object.version}")
            mlflow.genai.set_prompt_model_config("support-answer", first.version, {"temperature": 0.2})
            configured = mlflow.genai.load_prompt(first.uri, cache_ttl_seconds=0)
            mlflow.genai.set_prompt_model_config("support-answer", first.version, {"temperature": 0.8})
            reconfigured = mlflow.genai.load_prompt(first.uri, cache_ttl_seconds=0)
            assert configured.model_config == {"temperature": 0.2}
            assert reconfigured.model_config == {"temperature": 0.8}
            assert configured.version == reconfigured.version == first.version
            assert configured.template == reconfigured.template == first.template
            print("mutability: parameter fixed; tag and prompt model config changed")

            cases = [
                {
                    "inputs": {"question": "What is the return window?", "variant": variant},
                    "expectations": {"allowed_docs": ["DOC-12"]},
                }
                for variant in ["missing", "wrong", "valid"]
            ]
            result = mlflow.genai.evaluate(data=cases, predict_fn=answer, scorers=[citation_contract])
            mean = result.metrics["citation_contract/mean"]
            assert abs(mean - 1 / 3) < 1e-12
            assert result.result_df is not None and len(result.result_df) == 3
            assert sorted(result.result_df["citation_contract/value"].tolist()) == [False, False, True]
            assert not result.passed
            print("evaluation: missing=False; wrong=False; valid=True; mean=1/3")
            print("release: blocked under the all-required-cases policy")
            print("PASS: local SDK contracts; no server, provider, or judge calls")
        finally:
            os.chdir(previous_directory)


if __name__ == "__main__":
    main()
