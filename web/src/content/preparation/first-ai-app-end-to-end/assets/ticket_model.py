#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "scikit-learn"]
# ///
"""Train a small text classifier and inspect its predictions."""

from typing import Literal

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.pipeline import Pipeline

Category = Literal["auth_access", "billing", "gpu_oom", "latency_slo"]

TRAINING_CORPUS: tuple[tuple[str, Category], ...] = (
    ("CUDA out of memory allocating tensor during batch prefill on A100", "gpu_oom"),
    ("RuntimeError torch.OutOfMemoryError tried to allocate 2.4 GiB on GPU 0", "gpu_oom"),
    ("KV cache exhausted VRAM when context length hit 32768 tokens", "gpu_oom"),
    ("Training job crashed with cuDNN allocation error during gradient accumulation", "gpu_oom"),
    ("vLLM worker exited with OOM when max_num_seqs exceeded memory limit", "gpu_oom"),
    ("Gradient checkpointing disabled caused peak GPU memory spike in backward pass", "gpu_oom"),
    ("PyTorch CUDA allocator failed because reserved VRAM hit 80 GB ceiling", "gpu_oom"),
    ("Batch size 64 overflowed H100 memory during FlashAttention prefill", "gpu_oom"),
    ("NCCL worker process killed by Linux OOM killer while loading checkpoint weights", "gpu_oom"),
    ("cudaMalloc failed allocating paged attention cache blocks on worker node", "gpu_oom"),
    ("LoRA fine-tuning raised out of memory with sequence length 16384 in bf16", "gpu_oom"),
    ("Tensor core GEMM workspace buffer exhausted device VRAM on shard 3", "gpu_oom"),
    ("HTTP 401 invalid API key rejected at embeddings gateway", "auth_access"),
    ("Bearer token expired returning unauthorized permission denied on completions", "auth_access"),
    ("Organization role lacks read scope for fine-tuning checkpoints endpoint", "auth_access"),
    ("SSO SAML assertion signature mismatch blocked developer portal login", "auth_access"),
    ("Service token revoked after workspace role update returns 403 forbidden", "auth_access"),
    ("Missing API authorization header fails gateway authentication check", "auth_access"),
    ("JWT audience claim invalid when calling batch inference endpoint", "auth_access"),
    ("OAuth refresh token rejected with invalid_grant for workspace client", "auth_access"),
    ("Project member receives 403 unauthorized calling private model deployment", "auth_access"),
    ("Rotated API secret not recognized by staging inference proxy middleware", "auth_access"),
    ("HMAC webhook signature verification failed with unauthorized credential status", "auth_access"),
    ("Client certificate expired causing mutual TLS rejection at model gateway", "auth_access"),
    ("Time to first token jumped from 190 ms to 1800 ms on eu-west cluster", "latency_slo"),
    ("P99 decode latency spiked above 3 seconds during morning traffic surge", "latency_slo"),
    ("Queue wait time exceeded 900 ms before scheduler dispatched prefill batch", "latency_slo"),
    ("Slow tail response time on 70B model when streaming SSE chunks stalls", "latency_slo"),
    ("Throughput dropped from 420 tokens per second to 95 after quantization change", "latency_slo"),
    ("Cold start container pull added 14 seconds to autoscaled replica startup", "latency_slo"),
    ("Request deadline of 2000 ms breached from head-of-line blocking in batcher", "latency_slo"),
    ("High network round-trip latency between proxy and GPU inference worker", "latency_slo"),
    ("Inter-token latency degraded to 120 ms per token during concurrent decode", "latency_slo"),
    ("Autoscaler lag kept p95 inference latency above target for ten minutes", "latency_slo"),
    ("Prefill phase took 4.2 seconds for 24k token prompt delaying stream start", "latency_slo"),
    ("Timeout after 5000 ms waiting for upstream reranker response under burst load", "latency_slo"),
    ("Duplicate invoice charge appeared on monthly Pro workspace statement", "billing"),
    ("Credit card payment declined during automatic seat upgrade renewal", "billing"),
    ("Token usage overage billed twice for October batch inference run", "billing"),
    ("Requesting VAT invoice PDF and updated billing email on organization account", "billing"),
    ("Prepaid compute credits did not apply before charging monthly subscription", "billing"),
    ("Seat count proration miscalculated after removing five team members", "billing"),
    ("Refund needed for accidental enterprise tier checkout on sandbox project", "billing"),
    ("Spending cap alert failed to pause usage after reaching 500 dollar budget", "billing"),
    ("Stripe webhook missed invoice payment confirmation for annual plan", "billing"),
    ("Overcharge on cached prompt tokens billed at full uncached price rate", "billing"),
    ("Need PO number added to Q4 enterprise inference billing invoice", "billing"),
    ("Currency conversion fee added unexpectedly on monthly card settlement", "billing"),
)


class LocalTriageClassifier:
    """Linear text classifier over word unigrams and bigrams."""

    def __init__(
        self,
        samples: tuple[tuple[str, Category], ...] = TRAINING_CORPUS,
        *,
        version: str = "tfidf-logreg@1",
    ) -> None:
        self.version = version
        texts = [text for text, _ in samples]
        labels = [label for _, label in samples]
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)),
            ("clf", LogisticRegression(C=8.0, max_iter=500, random_state=42)),
        ])
        self.pipeline.fit(texts, labels)
        self.vectorizer: TfidfVectorizer = self.pipeline.named_steps["tfidf"]
        self.clf: LogisticRegression = self.pipeline.named_steps["clf"]
        self.classes: list[str] = [str(label) for label in self.clf.classes_]

    def predict_with_evidence(self, text: str, top_k: int = 3) -> dict:
        x_vec = self.vectorizer.transform([text])
        probs = self.clf.predict_proba(x_vec)[0]
        order = np.argsort(probs)[::-1]
        best_idx = int(order[0])
        second_idx = int(order[1])
        category = self.classes[best_idx]
        confidence = float(probs[best_idx])
        margin = float(probs[best_idx] - probs[second_idx])

        feature_names = self.vectorizer.get_feature_names_out()
        contrib = x_vec.multiply(self.clf.coef_[best_idx]).toarray()[0]
        nonzero = np.flatnonzero(contrib > 0)
        if len(nonzero) > 0:
            ranked = nonzero[np.argsort(contrib[nonzero])[::-1]][:top_k]
            top_features = [str(feature_names[i]) for i in ranked]
        else:
            top_features = ["general_text"]

        return {
            "category": category,
            "confidence": round(confidence, 4),
            "margin": round(margin, 4),
            "probabilities": {cls: round(float(p), 4) for cls, p in zip(self.classes, probs)},
            "top_features": top_features,
        }

    def evaluate(
        self,
        eval_samples: list[tuple[str, Category]],
        thresholds: tuple[float, ...] = (0.35, 0.45, 0.55, 0.65),
    ) -> dict:
        texts = [text for text, _ in eval_samples]
        y_true = np.array([label for _, label in eval_samples])
        probs = self.pipeline.predict_proba(texts)
        y_pred = np.array([self.classes[i] for i in probs.argmax(axis=1)])
        max_conf = probs.max(axis=1)

        curve = []
        for tau in thresholds:
            mask = max_conf >= tau
            coverage = float(mask.mean())
            sel_acc = float(accuracy_score(y_true[mask], y_pred[mask])) if mask.any() else 1.0
            curve.append({
                "threshold": tau,
                "coverage": round(coverage, 3),
                "selective_accuracy": round(sel_acc, 3),
            })

        return {
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 3),
            "macro_f1": round(float(f1_score(y_true, y_pred, average="macro")), 3),
            "curve": curve,
        }


if __name__ == "__main__":
    classifier = LocalTriageClassifier()
    for ticket in (
        "Charged twice on October monthly invoice after upgrading workspace tier",
        "Slow login timeout while checking GPU billing dashboard quota status",
    ):
        result = classifier.predict_with_evidence(ticket)
        print(ticket)
        print(result["category"], result["confidence"])
        print(result["probabilities"])
