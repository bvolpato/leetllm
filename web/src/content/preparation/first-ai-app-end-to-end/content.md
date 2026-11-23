---
{
  "id": "first-ai-app-end-to-end",
  "title": "First AI App End-to-End",
  "slug": "first-ai-app-end-to-end",
  "section": "Preparation & Prerequisites",
  "category": "MLOps & Deployment",
  "difficulty": "Easy",
  "order": 10,
  "coverImage": "illustrations/_generated/app_flow_dark.png",
  "companies": ["OpenAI", "Anthropic", "Google", "Microsoft", "Amazon"],
  "shortDescription": "Build a useful ticket classifier one layer at a time: train a model, serve predictions, add a browser, handle uncertainty, and save results. Then extend it with streaming and model fallback.",
  "keyConceptsTested": [
    "Text features, learned weights, and model predictions",
    "Building a prediction API and browser interface incrementally",
    "Confidence thresholds and accuracy-coverage tradeoffs",
    "FastAPI request validation and structured LLM fallback parsing",
    "SQLite running-to-terminal trace state transitions and recovery",
    "Model accuracy-coverage evaluation versus HTTP fault-injection tests",
    "Safe error reporting and disconnect recovery in streaming frontends"
  ]
}
---

Someone writes, "I was charged twice." Another person writes, "I cannot log in." A support team wants these messages sent to the right place without reading every ticket first. We will build an application that suggests a category, shows how strongly the model favors it, and asks for review when the message is unclear.

The useful result comes first: a Python program classifies a message. Then we give that program an HTTP endpoint, put a browser form in front of it, and save predictions so they survive a page refresh. Each addition solves a problem we can see. Once that application works, we extend the same design with streaming responses and an optional language-model fallback.

## Train a model and make one prediction

Download [ticket_model.py](assets/ticket_model.py) into an empty folder. It contains 48 labeled support messages and the reusable classifier we will use throughout the chapter. Run it with `uv`, which installs the dependencies declared at the top of the file:

```bash title="terminal"
uv run ticket_model.py
```

The program prints a category and four probabilities for each message. The categories are `billing`, `auth_access` for account access, `gpu_oom` for GPU memory problems, and `latency_slo` for slow responses. Start with the billing example; the other labels make the model choose among several plausible destinations instead of answering only yes or no.

How does a sentence become a prediction? Think of the model as a sorting desk with a score for each destination. Words and short phrases contribute to those scores. During training, the classifier adjusts the contributions until messages with similar features tend to reach their labeled destinations.

The first component, **TF-IDF**, turns text into a numeric feature vector. A feature represents a word or, here, a pair of neighboring words. Its value combines how often it appears in the message with how uncommon it is across the training collection. A phrase such as "credit card" can therefore carry more information than a very common word. The vector is sparse because each message uses only a small part of the vocabulary.[^sklearnTextFeatures2026]

The second component, **logistic regression**, learns a weight for each feature and category. It adds the weighted features to get one score per category, then converts those scores to probabilities. We will study its optimization in the ML lessons; here the important interface is `fit(texts, labels)` to learn from examples, followed by `predict_proba([message])` to score a new message.[^sklearnLogisticRegression2026]

This is the complete training path. The corpus is imported from the download so the program stays focused on the computation:

<!-- leetllm: test, deps=numpy,scikit-learn, id=first-model, output=show -->
```python title="train-and-predict.py"
import sys
from pathlib import Path

sys.path.insert(0, str(Path("assets").resolve()))
from ticket_model import TRAINING_CORPUS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

texts, labels = zip(*TRAINING_CORPUS)
model = Pipeline([
    ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
    ("classifier", LogisticRegression(C=8.0, max_iter=500, random_state=42)),
])
model.fit(texts, labels)

message = "Charged twice on October monthly invoice after upgrading workspace tier"
probabilities = model.predict_proba([message])[0]
for category, probability in sorted(zip(model.classes_, probabilities), key=lambda pair: -pair[1]):
    print(f"{category:12s} {probability:.3f}")
print("prediction:", model.predict([message])[0])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
billing      0.710
auth_access  0.104
gpu_oom      0.098
latency_slo  0.087
prediction: billing
```
<!-- leetllm: output:end -->

The model has learned from the labeled messages; there is no `if "invoice" in message` rule choosing the answer. Change the message and run the prediction again. The same learned weights now combine a different set of features. Keep `fit` outside the prediction path: training happens once when this small app starts, while many requests can reuse the resulting model.

`LocalTriageClassifier` in the download wraps this pipeline and returns a convenient dictionary containing the category, probability vector, and strongest positive feature contributions for the chosen class. Those contributions explain which input features pushed its score upward. They are especially useful when a prediction surprises us.

## Turn that prediction into an API

Our Python program can classify text, but a browser needs a way to ask it a question. An **HTTP API** gives the model an address. The browser sends a JSON request to `/predict`, and the server returns a JSON response containing the result.

Download [starter_app.py](assets/starter_app.py) and [starter.html](assets/starter.html) beside `ticket_model.py`. The server uses FastAPI, a Python framework that maps URLs to functions. Its central prediction path looks like this:

```python title="prediction-endpoint.py"
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field
from ticket_model import LocalTriageClassifier

app = FastAPI()
model = LocalTriageClassifier()

class Ticket(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=1000)

@app.post("/predict")
def predict(ticket: Ticket):
    return model.predict_with_evidence(ticket.text)
```

`Ticket` describes the incoming data. FastAPI reads the JSON body, uses Pydantic to check that it contains suitable text, and passes a `Ticket` object to the function. A successful return value becomes JSON automatically. If someone sends an empty message, the server responds with HTTP `422` before calling the model.[^fastapi_docs][^pydanticModels2026]

Run the downloadable server from the folder containing all three files:

```bash title="terminal"
uv run starter_app.py
```

In another terminal, send the same billing message over HTTP. The model is doing the same work as before; we have added a way to reach it:

```bash title="terminal"
curl http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"Charged twice on October monthly invoice after upgrading workspace tier"}'
```

Open `http://127.0.0.1:8000/docs` to try the endpoint through FastAPI's generated API page. Changing the JSON there is a useful way to connect the request format to the Python function that receives it.

## Put a browser in front of the model

Open `http://127.0.0.1:8000`. The form in `starter.html` sends the text to the same endpoint and draws the returned probabilities as bars. The browser needs no model weights and no Python environment. Its job is to collect input, make a request, and display the response.

The essential browser operation is a `fetch` call. `JSON.stringify` converts a JavaScript object into the request body, and `response.json()` converts the returned body into an object the page can use:

```javascript title="submit-ticket.js"
const response = await fetch('/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: document.querySelector('#ticket').value }),
});
const prediction = await response.json();
document.querySelector('#result').textContent = prediction.category;
```

The complete page adds three small pieces of feedback: it says "Classifying..." while a request is running, disables the submit button to avoid accidental repeated clicks, and displays a helpful message if the request fails. It inserts returned text with `textContent`, so a response is displayed as text rather than interpreted as HTML. The score bars make uncertainty visible instead of hiding it behind a single category name.

We can test the browser's server interaction without starting a second process. FastAPI's `TestClient` sends an HTTP-shaped request through the actual application and returns its response.[^fastapiTesting2026]

<!-- leetllm: test, deps=numpy,scikit-learn,fastapi,pydantic,httpx, id=first-api, output=show -->
```python title="check-prediction-api.py"
import sys
from pathlib import Path
sys.path.insert(0, str(Path("assets").resolve()))

from fastapi.testclient import TestClient
from starter_app import create_app

with TestClient(create_app()) as client:
    response = client.post("/predict", json={
        "text": "Charged twice on October monthly invoice after upgrading workspace tier",
    })
    result = response.json()
    print(response.status_code, result["category"], result["route"])
    assert result["category"] == "billing"
    assert client.post("/predict", json={"text": "   "}).status_code == 422
    assert "Where should this ticket go?" in client.get("/").text
```

<!-- leetllm: output:start -->
```text title="Output" output compact
200 billing automated
```
<!-- leetllm: output:end -->

The message has now completed the full trip: form → HTTP request → Python model → JSON response → visible result. We can improve the model or the interface independently because the `/predict` response connects them.

## Let uncertain tickets take another route

Try "Slow login timeout while checking GPU billing dashboard quota status." It mentions several categories, so the model spreads its probability across them. Picking the largest value still produces a label, but the small winning margin tells us this is a less decisive prediction.

The starter app uses the largest probability as a routing score. At `0.55` or higher it suggests automatic handling; below that it displays "Needs review." A threshold is a product choice: raising it sends more work to people, while lowering it lets the model handle more tickets. Evaluate that choice on labeled messages instead of choosing it because a number looks reassuring.

```python title="choose-a-route.py"
result = model.predict_with_evidence(ticket.text)
result["route"] = "automated" if result["confidence"] >= 0.55 else "human_review"
```

Here `model` is the reusable `LocalTriageClassifier` from the endpoint. Its probabilities rank the categories. To interpret a score of `0.8` as an 80% success rate, we would additionally measure calibration on labeled data. For this app, we choose the threshold directly from the observed routing results.

<figure>
  <img src="illustrations/_generated/app_flow_dark.png" alt="A support message becomes a probability vector. A top probability at least 0.55 sends the ticket to automatic routing; a lower score sends it to human review. Both routes return the category and probabilities to the browser." />
  <figcaption>The model scores the categories once. A separate threshold decides whether to suggest automatic routing or ask for review, while the browser shows the same probability vector in either case.</figcaption>
</figure>

## Measure the routing tradeoff

For a ticket $x$, write its feature vector as $\phi(x)$, with one entry per vocabulary item. Each category $k$ has a learned weight vector $w_k$ and bias $b_k$. The score $w_k^\top\phi(x)+b_k$ is the same weighted-sum mechanism from the neural-network lessons. Softmax compares the four scores and produces probabilities that add to one:[^sklearnLogisticRegression2026]

$$
P(y = k \mid x)
= \frac{\exp\!\left(w_k^\top \phi(x) + b_k\right)}
       {\sum_{j=1}^{K} \exp\!\left(w_j^\top \phi(x) + b_j\right)}
$$

The denominator sums over the $K=4$ categories. We use the largest probability, $c(x)=\max_k P(y=k\mid x)$, as the routing score and call the threshold $\tau$. Two measurements tell us whether that choice is useful: **coverage** is the fraction of tickets handled automatically, and **selective accuracy** is the fraction of those automatic predictions that are correct. For example, ten correct automatic predictions out of fourteen total tickets give coverage $10/14\approx71.4\%$ and selective accuracy $10/10=100\%$.

Evaluate several thresholds on these fourteen labeled tickets. They were held out from training and include two messages that mix topics. The program also prints macro-F1, which averages a precision-and-recall score across categories; we will study that metric in the classification lessons.

<!-- leetllm: test, deps=numpy,scikit-learn,fastapi,pydantic,httpx, id=triage-train, output=show, output_title="Model metrics and confidence gate curve" -->
```python title="evaluate-local-classifier.py"
import sys
from pathlib import Path

sys.path.insert(0, str(Path("assets").resolve()))
from ticket_model import LocalTriageClassifier

classifier = LocalTriageClassifier()

eval_tickets = [
    ("GPU VRAM exhausted allocating KV cache blocks for 32k context", "gpu_oom"),
    ("CUDA out of memory error during mixed precision training backward pass", "gpu_oom"),
    ("Worker crashed from device memory overflow at batch size 128", "gpu_oom"),
    ("HTTP 403 forbidden because service token lacks inference invoke scope", "auth_access"),
    ("Expired bearer API key rejected with 401 unauthorized on gateway", "auth_access"),
    ("OAuth token signature check failed when authenticating client request", "auth_access"),
    ("Streaming TTFT latency rose to 1.6 seconds under concurrent prefill load", "latency_slo"),
    ("P99 token generation latency breached 800 ms SLO during traffic burst", "latency_slo"),
    ("Decode throughput stalled waiting behind long context prefill queue", "latency_slo"),
    ("Charged twice on October monthly invoice after upgrading workspace tier", "billing"),
    ("Prepaid token credits omitted from November statement billing calculation", "billing"),
    ("Spending limit alert failed to stop usage billing past monthly cap", "billing"),
    ("Slow login timeout while checking GPU billing dashboard quota status", "auth_access"),
    ("Unexpected charge after retrying timed out batch inference job", "billing"),
]

metrics = classifier.evaluate(eval_tickets, thresholds=(0.25, 0.35, 0.45, 0.55, 0.65))
print("overall accuracy:", metrics["accuracy"], "macro_f1:", metrics["macro_f1"])
for row in metrics["curve"]:
    print(f"tau={row['threshold']:.2f} coverage={row['coverage']:.3f} sel_acc={row['selective_accuracy']:.3f}")

sample = classifier.predict_with_evidence(eval_tickets[0][0])
print("sample:", sample["category"], "conf:", sample["confidence"], "features:", sample["top_features"])
```

<!-- leetllm: output:start -->
```text title="Model metrics and confidence gate curve" output compact
overall accuracy: 0.929 macro_f1: 0.929
tau=0.25 coverage=1.000 sel_acc=0.929
tau=0.35 coverage=0.857 sel_acc=1.000
tau=0.45 coverage=0.786 sel_acc=1.000
tau=0.55 coverage=0.714 sel_acc=1.000
tau=0.65 coverage=0.429 sel_acc=1.000
sample: gpu_oom conf: 0.7062 features: ['vram', 'exhausted', 'cache']
```
<!-- leetllm: output:end -->

At `tau=0.25`, all fourteen tickets are handled automatically, including one mistake. At `tau=0.55`, ten tickets remain on the automatic path and all ten are correct. The other four need another decision. Raising the threshold to `0.65` removes four more correct predictions without improving accuracy on this set. That is why a threshold should be chosen by examining both measurements together. A new collection of tickets may produce a different curve.

<figure>
  <img src="illustrations/_generated/selective_routing_tradeoff_dark.png" alt="Two charts show coverage and selective accuracy on fourteen evaluation tickets, plus probabilities for six selected messages. At threshold 0.55, ten tickets are handled automatically and all ten predictions are correct." />
  <figcaption>At a threshold of 0.55, this evaluation sends ten of fourteen tickets to automatic routing and all ten predictions are correct. Increasing the threshold further reduces coverage without improving this set's selective accuracy.</figcaption>
</figure>

## Save a result so it survives the browser

Refresh the page after making a prediction. The browser forgets its result because it held that result only in memory. Add a small database when you want to review recent predictions, compare model versions, or return to an earlier answer.

Stop the starter server with Ctrl+C, then start it with saving enabled:

```bash title="terminal"
uv run starter_app.py --save
```

Now each prediction gets a numeric ID, and `http://127.0.0.1:8000/history` lists the latest twenty results. SQLite stores them in `predictions.sqlite3` beside the script. The application records the predicted category, confidence, and route; the original message is unnecessary for this first history view.

The database operation is short. Question marks stand for values supplied separately to `execute`, and exiting the transaction block commits the insert.[^pythonSqlite2026]

```python title="save-prediction.py"
with closing(sqlite3.connect(database)) as db, db:
    cursor = db.execute(
        "INSERT INTO predictions (category, confidence, route) VALUES (?, ?, ?)",
        (result["category"], result["confidence"], result["route"]),
    )
    result["id"] = cursor.lastrowid
```

The download creates that table when saving is enabled. We can verify persistence by making a prediction, closing the application, and creating a fresh application that opens the same file:

<!-- leetllm: test, continue=first-api, output=show -->
```python title="check-saved-prediction.py"
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    database = Path(directory) / "predictions.sqlite3"
    with TestClient(create_app(database)) as client:
        prediction = client.post("/predict", json={
            "text": "Charged twice on October monthly invoice after upgrading workspace tier",
        }).json()
    with TestClient(create_app(database)) as restarted:
        saved = restarted.get("/history").json()[0]
        assert saved["id"] == prediction["id"]
        assert saved["category"] == prediction["category"]
        print("after restart:", saved["id"], saved["category"], saved["route"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
after restart: 1 billing automated
```
<!-- leetllm: output:end -->

We now have a complete local application: a real trained model, a usable interface, an explicit decision for uncertain inputs, and saved results. Try adding a new labeled message to the training corpus and restarting. Compare the probability bars before and after the change, then run the held-out evaluation again. That connects a data change to both model behavior and the user experience.

## Extend the app with a language-model fallback

Some ambiguous messages need more contextual reasoning than this word-feature model provides. An extension can pass those messages to a language model and keep the local classifier for clear cases. The model call from the [previous lesson](/learn/calling-llm-apis-production) fits here: it receives the message and category descriptions, then returns a category and a brief explanation.

The advanced download, [triage_app.py](assets/triage_app.py), adds that adapter interface, streaming, and request-state tracking. Put it beside `ticket_model.py` and [index.html](assets/index.html), then run `uv run triage_app.py` after stopping the starter server. It works immediately with the local classifier and sends uncertain messages to human review. A hosted-model adapter can be passed to `create_app(..., fallback_model=adapter)` when you want to add that path.

The adapter's `classify(ticket_text, local_probs)` method returns a category, confidence, rationale, and supporting feature labels. Its `stream_rationale(...)` method yields text chunks for the browser. Keep the model's request construction in that adapter so changing providers does not rewrite the HTTP endpoints or database code.

### Give incoming messages and outgoing answers a shape

The advanced server uses `TriageRequest` to describe incoming messages and `TriageCandidate` to describe fallback answers. These are separate objects because a valid question can still receive an unusable answer. The input schema trims whitespace, requires at least twelve characters, and rejects unexpected fields. The output schema requires one of the four categories, a confidence between zero and one, a short explanation, and supporting feature labels.[^pydanticModels2026][^fastapi_docs]

A category such as `admin_override` cannot become a fifth destination merely because a model emits it. An answer with a valid category can still be factually wrong, so category checks and labeled evaluation solve different problems. This program exercises the data-shape checks on both sides:

<!-- leetllm: test, continue=triage-train, id=triage-validation, output=show, output_title="Schema validation on inputs and LLM outputs" -->
```python title="validate-schemas.py"
from pydantic import ValidationError
from triage_app import TriageRequest, verify_llm_candidate

valid_req = TriageRequest.model_validate({"ticket_text": "  CUDA OOM allocating KV cache  "})
print("accepted ticket:", repr(valid_req.ticket_text))

for bad_payload in [
    {"ticket_text": " " * 20},
    {"ticket_text": "Valid length ticket text", "route": "automated"},
    {"ticket_text": "Valid length ticket text", "escalate_if_uncertain": "yes"},
]:
    try:
        TriageRequest.model_validate(bad_payload)
    except ValidationError:
        print("rejected input")

valid_llm = verify_llm_candidate({
    "category": "auth_access",
    "confidence": 0.91,
    "rationale": "Expired OAuth token caused login error alongside quota check.",
    "top_features": ["login", "quota"],
})
print("verified candidate:", valid_llm.category, valid_llm.confidence)

for bad_candidate in [
    {"category": "admin_override", "confidence": 0.99, "rationale": "injected", "top_features": ["x"]},
    {"category": "billing", "confidence": 1.4, "rationale": "out of range", "top_features": ["x"]},
    {"category": "billing", "confidence": 0.8, "rationale": "missing tags", "top_features": []},
]:
    try:
        verify_llm_candidate(bad_candidate)
    except ValidationError:
        print("rejected candidate")
```

<!-- leetllm: output:start -->
```text title="Schema validation on inputs and LLM outputs" output compact
accepted ticket: 'CUDA OOM allocating KV cache'
rejected input
rejected input
rejected input
verified candidate: auth_access 0.91
rejected candidate
rejected candidate
rejected candidate
```
<!-- leetllm: output:end -->

### Show progress while a slower model is working

When a model response takes time, the browser can show useful progress instead of waiting for one final JSON object. **Server-sent events**, or SSE, represent a stream of named events, each carrying a data payload.[^whatwgSse2026] Our `POST /v1/triage/stream` endpoint first sends the local probabilities, then explanation chunks, and finally a completion or error event. The browser uses `fetch` to read this response as it arrives.

Longer requests also make saved state more useful. The advanced server inserts a `running` row before model work begins and gives its ID to the browser. When processing finishes, it updates the row to `completed` or `failed`. If the browser disconnects, `/v1/traces/{trace_id}` can tell it what happened without asking the model to run again.

The update below matches only a row still at `running`, version 1. A completed row is version 2, so a late worker cannot overwrite it. This is the database equivalent of crossing a task off a shared list once:

```sql title="Conditional SQLite terminal transition"
UPDATE traces
SET status = ?, version = 2, route = ?, category = ?, confidence = ?,
    probabilities_json = ?, top_features_json = ?, rationale = ?,
    model_version = ?, latency_ms = ?, error_code = ?
WHERE trace_id = ? AND status = 'running' AND version = 1;
```

<figure>
  <img src="illustrations/_generated/streaming_lifecycle_seq_dark.png" alt="Time moves down three lanes: browser, server, and SQLite. The server saves a running row before sending local_signal and token events. It saves the completed result before sending done to the browser." />
  <figcaption>The successful request has two important ordering rules: save <code>running</code> before streaming, and save <code>completed</code> before sending <code>done</code>. A broken connection can interrupt the browser's view while the database still records the outcome.</figcaption>
</figure>

The browser UI in [index.html](assets/index.html) reads the HTTP stream chunk by chunk with `ReadableStream`, parses SSE `event:` and `data:` lines as packets arrive, and renders provisional class probabilities immediately upon receiving `local_signal`. To prevent cross-site scripting when untrusted ticket snippets or rationale text are displayed back to operators, every field is inserted via DOM `textContent` rather than raw HTML interpolation. Explicit UI state banners distinguish provisional streaming frames, committed terminal traces, server error codes, and mid-stream disconnects:

| UI state | Stream or HTTP event | What the browser learns |
|---|---|---|
| Idle | Ready | No request submitted yet |
| Streaming | `local_signal` and `token` frames arrived | Trace row exists (`running` or `completed`), confidence bars are provisional until `done` |
| Completed | `event: done` with `status == "completed"` | SQLite committed `completed` (`v2`) under displayed `route` and `trace_id` |
| Model failure | `event: error` with sanitized `error_code` | Upstream timeout or bad output recorded as `failed`; no raw upstream text leaked |
| Validation error (`422`) | Rejected by Pydantic before stream starts | No model call ran and no SQLite trace was written |
| Storage error (`503`) | Initial insert failed or terminal commit blocked | Caller warned whether upstream model work may already have run |
| Connection lost mid-stream | Stream closed without `done` or `error` | Server outcome unknown; user can click **Verify Saved Trace** (`GET /v1/traces/{id}`) |

### Check the complete request and its failure paths

Test a clear message through the local path and an uncertain message through the fallback path. `StubLLM` below is a test adapter: it supplies a chosen response so we can check the server's routing and saved state repeatedly. The local classifier, HTTP handlers, database, and event parsing all execute. Evaluate an actual hosted model separately with labeled inputs when connecting its adapter.

<details>
<summary>Run the streaming and recovery checks</summary>

<!-- leetllm: test, continue=triage-validation, id=triage-http, output=show, output_title="Live HTTP, SQLite, and SSE stream tests" -->
```python title="test-http-and-sse.py"
import json
import sqlite3
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient
from triage_app import create_app

class StubLLM:
    name = "stub-llm@2026"
    def __init__(self, payload=None, error=None):
        self.payload = payload or {
            "category": "auth_access",
            "confidence": 0.88,
            "rationale": "Credential rejection occurred before GPU dashboard check.",
            "top_features": ["login", "quota"],
        }
        self.error = error
        self.calls = 0

    def classify(self, ticket_text, local_probs):
        self.calls += 1
        if self.error is not None:
            raise self.error
        return self.payload

    def stream_rationale(self, ticket_text, local_probs):
        for word in ["Checking", "mixed", "signals..."]:
            yield word + " "

lab = TemporaryDirectory()
db_path = Path(lab.name) / "triage.sqlite3"
llm = StubLLM()
app = create_app(db_path, fallback_model=llm)
client = TestClient(app)

assert client.get("/healthz").json()["status"] == "ok" and llm.calls == 0

fast = client.post("/v1/triage", json={
    "ticket_text": "CUDA out of memory error during mixed precision training backward pass",
}).json()
assert fast["route"] == "automated" and fast["category"] == "gpu_oom" and llm.calls == 0
print("fast path:", fast["category"], "conf:", fast["confidence"], "llm_calls:", llm.calls)

with client.stream("POST", "/v1/triage/stream", json={
    "ticket_text": "Slow login timeout while checking GPU billing dashboard quota status",
}) as stream_resp:
    body = "".join(stream_resp.iter_text())

events = []
for block in body.strip().split("\n\n"):
    lines = dict(line.split(": ", 1) for line in block.splitlines())
    events.append((lines["event"], json.loads(lines["data"])))

done_payload = dict(events)["done"]
saved = client.get(f"/v1/traces/{done_payload['trace_id']}").json()
assert saved["status"] == "completed" and saved["route"] == "llm_fallback"
assert llm.calls == 1
print("sse events:", [e[0] for e in events])
print("recovered trace:", saved["status"], saved["route"], saved["category"])
```

<!-- leetllm: output:start -->
```text title="Live HTTP, SQLite, and SSE stream tests" output compact
fast path: gpu_oom conf: 0.7872 llm_calls: 0
sse events: ['local_signal', 'token', 'token', 'token', 'done']
recovered trace: completed llm_fallback auth_access
```
<!-- leetllm: output:end -->

Now make the fallback time out, return an invalid category, and raise an exception. Each case should produce a useful error code without exposing the message inside the exception. Finally, stop SQLite writes before the initial insert and before the final update. The first failure prevents model work; the second happens after the model has run, leaving the earlier `running` row available for inspection.[^fastapiErrors2026]

<!-- leetllm: test, continue=triage-http, id=triage-faults, output=show, output_title="Error scrubbing and database fault isolation" -->
```python title="test-fault-isolation.py"
secret_ticket = "Secret prompt payload timeout billing mixed crash token xyz"

for fault_llm, expected_code in [
    (StubLLM(error=TimeoutError(secret_ticket)), "upstream_timeout"),
    (StubLLM(payload={"category": "bad_label"}), "invalid_model_output"),
    (StubLLM(error=RuntimeError(secret_ticket)), "upstream_error"),
]:
    app.state.fallback_model = fault_llm
    res = client.post("/v1/triage", json={"ticket_text": secret_ticket}).json()
    assert res["status"] == "failed" and res["error_code"] == expected_code
    assert secret_ticket not in json.dumps(res)
    print("scrubbed fault:", res["status"], res["error_code"])

bad_req = client.post("/v1/triage", json={"ticket_text": " " * 20})
assert bad_req.status_code == 422 and bad_req.json() == {"error_code": "invalid_request"}

for op in ("INSERT", "UPDATE"):
    with TemporaryDirectory() as tmp:
        fault_db = Path(tmp) / "fault.sqlite3"
        spy_llm = StubLLM()
        fault_app = create_app(fault_db, fallback_model=spy_llm)
        with closing(sqlite3.connect(fault_db)) as db, db:
            db.execute(f"""
                CREATE TRIGGER block_{op} BEFORE {op} ON traces
                BEGIN SELECT RAISE(ABORT, 'disk full'); END;
            """)
        with TestClient(fault_app) as fault_client:
            r = fault_client.post("/v1/triage", json={"ticket_text": secret_ticket})
            assert r.status_code == 503 and r.json() == {"error_code": "storage_unavailable"}
        print("db fault", op, "-> http:", r.status_code, "llm_calls:", spy_llm.calls)

client.close()
lab.cleanup()
```

<!-- leetllm: output:start -->
```text title="Error scrubbing and database fault isolation" output compact
scrubbed fault: failed upstream_timeout
scrubbed fault: failed invalid_model_output
scrubbed fault: failed upstream_error
db fault INSERT -> http: 503 llm_calls: 0
db fault UPDATE -> http: 503 llm_calls: 1
```
<!-- leetllm: output:end -->

</details>

The model evaluation asks whether the predicted category is useful. The application checks ask whether a request reaches the model, produces a readable response, and leaves the expected saved result. Both matter because a useful model can sit behind a broken endpoint, and a reliable endpoint can serve poor predictions.

## Take the local project further

Several natural projects grow from this working application. Improve the training set and compare its routing curve, connect a hosted-model adapter for uncertain messages, or add a page where reviewers correct predictions. Use corrected examples in a later training set and measure whether the changes help on a separate evaluation set.

When deploying for other people, add authentication and keep saved records scoped to their owner. Use persistent storage that survives replacement of the application container, configure deadlines for model calls, and limit request volume. These changes become easier to reason about now that you can follow one request through the complete app:

1. **Authentication and authorization:** Require bearer or session authentication on `/v1/triage`, `/v1/triage/stream`, and `/v1/traces/{trace_id}`, and scope trace lookups to the owning organization so callers cannot read another tenant's records.
2. **External LLM timeouts and budgets:** Configure explicit connect and read deadlines on the `httpx` or vendor SDK client inside `StructuredEscalationModel`, cap max output tokens, and track token spend per trace.
3. **Managed persistent storage:** A local SQLite file on a disposable container filesystem vanishes on redeploy; migrate `TraceLedger` to managed PostgreSQL with connection pooling and a periodic job that sweeps abandoned `running` traces older than the request deadline.
4. **Input retention and secret hygiene:** Rotate and protect the HMAC key via a secret manager, and keep raw error tracebacks in restricted server logs rather than browser responses.
5. **Rate limiting and concurrency:** Protect `/v1/triage/stream` against connection exhaustion with per-tenant concurrency limits and bounded FastAPI worker pools.
6. **Dataset versioning and continuous evaluation:** Pin `scikit-learn` and model artifact versions alongside prompt versions so accuracy and confidence-threshold curves remain reproducible across deployments.

```checkpoint
Why run a fast local classifier ahead of an LLM fallback instead of sending every ticket straight to a hosted API?
---
The local model can handle messages whose word features strongly favor one category. A threshold sends uncertain messages to another path, so the application spends additional model calls or human attention where they may be useful. Choose the threshold from measured coverage and accuracy on representative messages.
```

```checkpoint
If the browser drops its SSE connection mid-stream after receiving local_signal, what does the UI know and how should it recover?
---
Receiving local_signal confirms only that the server started a running trace and computed local probabilities; it does not confirm whether the terminal SQLite update committed. Calling GET /v1/traces/{trace_id} checks the committed server state safely without spawning a duplicate inference request.
```

## Check your understanding

```mastery-quiz
[
  {
    "question": "Why does the app fit its classifier once and reuse it for incoming requests?",
    "options": [
      "Fitting once fixes the vocabulary, while prediction learns fresh weights from each message",
      "Training learns weights; prediction applies those weights to each new message",
      "Refitting on every incoming message would give more reliable probabilities without labels",
      "Training is only needed to select a category threshold; prediction creates its own feature weights"
    ],
    "answer": "Training learns weights; prediction applies those weights to each new message",
    "explanation": "Training uses labeled examples to learn the vocabulary and weights. Prediction reuses both: it transforms the new text and computes scores. An unlabeled incoming message does not provide the target needed for supervised fitting."
  },
  {
    "question": "A browser sends {\"text\":\"I was charged twice\"} to /predict. What connects this request to the Python model?",
    "options": [
      "FastAPI parses the JSON into Ticket and calls the prediction function",
      "The browser converts the text to TF-IDF and sends the feature vector to FastAPI",
      "FastAPI runs prediction first, then checks whether the input matches Ticket",
      "The endpoint returns a Python dictionary that fetch reads directly without JSON encoding"
    ],
    "answer": "FastAPI parses the JSON into Ticket and calls the prediction function",
    "explanation": "The browser serializes text as JSON. FastAPI validates it as Ticket before calling the model, then serializes the returned dictionary as response JSON. Feature extraction and prediction both happen on the server."
  },
  {
    "question": "Ten of fourteen tickets pass the threshold, and nine of those ten predictions are correct. What are coverage and selective accuracy?",
    "options": [
      "Coverage is 9/10; selective accuracy is 10/14",
      "Coverage is 9/14; selective accuracy is 10/10",
      "Coverage is 10/10; selective accuracy is 9/14",
      "Coverage is 10/14; selective accuracy is 9/10"
    ],
    "answer": "Coverage is 10/14; selective accuracy is 9/10",
    "explanation": "Coverage measures how much work is automated. Selective accuracy measures correctness within that automated subset, so the two fractions have different denominators."
  },
  {
    "question": "A ticket has top probability 0.52 and the automatic-routing threshold is 0.55. What does the starter app do?",
    "options": [
      "Changes its largest probability to 0.55 and routes automatically",
      "Retrains the model until the top probability exceeds 0.55",
      "Returns its best guess and marks the ticket for human review",
      "Rejects the HTTP request because probabilities must exceed 0.55"
    ],
    "answer": "Returns its best guess and marks the ticket for human review",
    "explanation": "Prediction and routing are separate steps. The model still produces a category and probability vector; the threshold determines whether to use the automatic path."
  },
  {
    "question": "A saved prediction remains in /history after the server restarts. What makes that possible?",
    "options": [
      "The new process restores the earlier result from the model weights saved during prediction",
      "SQLite committed the result to a file that the new process opens",
      "The browser sends the previous response back whenever it requests /history",
      "The new application reuses the in-memory database connection from the stopped process"
    ],
    "answer": "SQLite committed the result to a file that the new process opens",
    "explanation": "The transaction writes a row to a database file. A new process opens a new connection to that same file. The browser and model weights are not where this application stores prediction history."
  },
  {
    "question": "The streaming browser receives local probabilities and then disconnects. How can it learn whether processing finished?",
    "options": [
      "Read /v1/traces/{trace_id} to inspect the saved request state",
      "Submit a fresh prediction and assume its result describes the earlier request",
      "Treat the local probability event as proof that the final result was saved",
      "Read /healthz to obtain that individual request result"
    ],
    "answer": "Read /v1/traces/{trace_id} to inspect the saved request state",
    "explanation": "The early event includes an ID for the running request. Looking up that ID retrieves its stored state without starting another model call."
  },
  {
    "question": "The application passes its HTTP and streaming tests, but users say the categories are often wrong. What should you examine next?",
    "options": [
      "Raise the automatic-routing threshold until HTTP tests also reject uncertain messages",
      "Increase the training iterations on the original messages before collecting examples of the reported errors",
      "Check response latency first, because HTTP success means the model selected the right class",
      "Evaluate predictions on labeled messages representative of those users"
    ],
    "answer": "Evaluate predictions on labeled messages representative of those users",
    "explanation": "Labeled messages from those users reveal whether the problem comes from class confusion, missing training examples, or a changed input distribution. A higher threshold can route more cases to review, but it does not by itself improve the underlying category predictions."
  }
]
```

> **Next:** Continue to [The LLM Lifecycle](/learn/llm-lifecycle-training-to-deployment) to see how local classifiers, generative models, evaluation suites, and deployment monitoring connect across an entire model's lifetime.
