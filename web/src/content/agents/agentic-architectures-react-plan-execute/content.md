---
{
  "id": "agentic-architectures-react-plan-execute",
  "title": "ReAct & Plan-and-Execute",
  "slug": "agentic-architectures-react-plan-execute",
  "category": "LLM Agents & Tool Use",
  "difficulty": "Hard",
  "coverImage": "illustrations/_generated/react_loop_dark.png",
  "companies": [
    "OpenAI",
    "Google",
    "Anthropic",
    "Microsoft",
    "Meta"
  ],
  "shortDescription": "Follow a debugging agent through real tool results, build its control loop, and turn independent checks into a parallel plan. Then add memory, replanning, and search.",
  "keyConceptsTested": [
    "Observation-driven tool selection",
    "ReAct loops and workflow selection",
    "Plan-and-Execute dependency graphs",
    "Parallel scheduling and critical paths",
    "Invalidating results after source changes",
    "Context growth and progress-aware stopping",
    "Routing, Reflexion, self-consistency, and tree search"
  ],
  "section": "Advanced Agents & Retrieval",
  "order": 4
}
---

A softmax function works on `[0, 1]` and crashes on `[1000, 1001]`. A debugging assistant can read its source, run numerical checks, and compare candidate fixes. Its first useful action is to collect evidence. After seeing the error and the offending computation, it can choose a much more informative next action.

This is familiar from ordinary debugging. You rarely write down every command before opening the first traceback. You form a hypothesis, inspect something, and let the result change what you do next. A language-model agent uses the same feedback structure: the model chooses an action, the application executes it, and the resulting observation becomes input to the next choice.

[Function Calling & Tool Use](/learn/function-calling-tool-use-llms) connected one model request to one tool execution. Here we connect those turns into an investigation. We will first follow a complete ReAct loop, then reorganize independent work into a plan, and finally examine memory and search when the task needs several attempts.

## A bug we can actually investigate

Softmax converts a vector of scores into probabilities by exponentiating each score and dividing by the sum. Here is the function our assistant receives:

```python title="baseline-softmax.py"
import math

def baseline(values):
    weights = [math.exp(value) for value in values]
    return [weight / sum(weights) for weight in weights]
```

For `[0, 1]`, the weights are approximately `[1, 2.718]`, giving probabilities `[0.269, 0.731]`. Adding the same constant to every score should preserve those probabilities: multiplying every exponential by the same factor cancels in the division. But evaluating `math.exp(1000)` exceeds the range of Python's floating-point exponential and raises `OverflowError: math range error`.

Our investigation offers three implementations: `baseline`, `clip`, and `shift`. The clipping candidate caps each score between −700 and 700 before exponentiation. The shifting candidate subtracts the largest score from every score. They are ordinary functions in the downloadable [investigation.py](assets/investigation.py), and its tools read their source and execute them against four numerical cases.

Run the following cell with `investigation.py` in an `assets` directory. It executes the same checks used by the agent, printing each implementation's result:

<!-- leetllm: test, output=show -->
```python title="compare-softmax-candidates.py"
import sys
sys.path.insert(0, "assets")
from investigation import evaluate

for candidate in ("baseline", "clip", "shift"):
    result = evaluate(candidate)
    print(f"{candidate}: {result['passed']}/{result['total']} passed")
    for row in result["results"]:
        if not row["passed"]:
            print(" ", row["case"], row.get("error", row.get("actual")))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
baseline: 2/4 passed
  large positive OverflowError: math range error
  large negative ZeroDivisionError: division by zero
clip: 2/4 passed
  large positive [0.5, 0.5]
  large negative [0.5, 0.5]
shift: 4/4 passed
```
<!-- leetllm: output:end -->

The clipping candidate stops the overflow, but it also turns `[1000, 1001]` into `[700, 700]`. The two unequal scores become equal, producing `[0.5, 0.5]`. An exception disappearing is useful evidence; checking the resulting probabilities tells us whether the computation is repaired.

Subtracting the maximum instead produces `[-1, 0]`. Their difference stays one, so the probabilities stay `[0.269, 0.731]`. Algebraically, for any shared shift $m$,

$$
\frac{e^{z_i-m}}{\sum_j e^{z_j-m}}
=
\frac{e^{-m}e^{z_i}}{e^{-m}\sum_j e^{z_j}}
=
\frac{e^{z_i}}{\sum_j e^{z_j}}.
$$

Choosing $m=\max_j z_j$ makes the largest exponential one, preventing overflow for these finite inputs. This shifted formulation is standard in stable softmax implementations.[^blanchard2019softmax] The numerical issue is now understandable. The architectural question is how an assistant discovers and verifies the fix through a sequence of tool calls.

## ReAct: choose the next action from the last result

**ReAct** connects reasoning and acting in an alternating loop. The original work used observations from external environments to inform the model's next action; an implementation can express those actions as the structured tool calls introduced earlier.[^yao2023a] Think of the model as the investigator and the runtime as its workbench. The investigator decides which measurement would help; the workbench performs that measurement and returns what happened.

A turn has three visible parts:

1. The model receives the task, available tools, and accumulated observations.
2. It requests a tool with concrete arguments.
3. The host executes the tool and appends its result to the history.

A final answer replaces the next tool request when the investigation has reached a useful conclusion. The application still owns execution: a string saying “the checks passed” is distinct from the check result it actually received.

We ran this investigation with a configured Codex model choosing actions and the Python host executing the tools. Its recorded choices were:

| Turn | Model's action | Observation available afterward |
|---|---|---|
| 1 | Read `baseline` source | Exponentials are computed directly from the input scores |
| 2 | Evaluate `baseline` | Two checks pass; large positive scores overflow and large negative scores cause division by zero |
| 3 | Read `shift` source | Each score has the largest score subtracted before exponentiation |
| 4 | Evaluate `shift` | All four numerical cases pass |
| 5 | Finish with `shift` | A conclusion supported by the computed results |

The [recorded run](assets/recorded-run.json) contains the actual prompts, tool choices, and returned observations. The model chose the shifting candidate directly. The clipping comparison above is a separate experiment that explains why merely removing the exception would be insufficient.

<figure>
  <img src="illustrations/_generated/react_loop_dark.png" alt="A model reads the current investigation history, chooses evaluate(baseline), and receives two passing checks plus overflow and division-by-zero errors. The observation returns to the model, which can choose a different next action." />
  <figcaption>The tool result returns to the next model call. Each completed turn changes the evidence available for choosing another action.</figcaption>
</figure>

Notice the timing of knowledge. Before the first evaluation, the model knows what the source says. Afterward, it also knows which inputs fail and how. After testing the shifted candidate, it can connect a mathematical explanation to observed output. Keeping those states separate makes the investigation easy to inspect.

The runtime itself can stay small. This excerpt from the downloadable lab accepts a `choose` function, executes its requested tools, and keeps the history. A candidate enters `verified` only after the numerical checks pass:

```python title="observation-driven-loop.py"
def run(choose, max_turns=8):
    history = []
    verified = set()
    for _ in range(max_turns):
        action = choose({"goal": GOAL, "tools": TOOLS, "history": history})
        if action["tool"] == "finish":
            candidate = action["candidate"]
            return {
                "status": "completed" if candidate in verified else "unverified",
                "answer": action,
                "history": history,
            }
        observation = execute(action)
        history.append({"action": action, "observation": observation})
        if action["tool"] == "evaluate" and observation["passed"] == observation["total"]:
            verified.add(action["candidate"])
    return {"status": "turn_limit", "history": history}
```

The choice function is the replaceable part. A person can choose from the terminal, a model can choose from the same structured state, or a recorded sequence can be replayed through the current tools. The host loop does not contain a special branch saying “if overflow, choose shift.” That choice came from the model's response.

The four tests define completion for this investigation. When designing another task, choose a completion check that matches its goal: a computed answer, a retrieved passage supporting a claim, or a successful run of the relevant test suite. Keep the reasoning in the explanation and the observable result in the tool history.

### Run the investigation yourself

Download [investigation.py](assets/investigation.py) and [recorded-run.json](assets/recorded-run.json) into one directory. Interactive mode prints the current state and asks you for a tool request. Replay mode takes the recorded model choices but executes the tools again, comparing returned values and exception types with the recorded observations:

```bash title="run-the-investigation.sh"
uv run investigation.py
uv run investigation.py --replay recorded-run.json
```

For example, enter `{"tool":"evaluate","candidate":"baseline"}` to run the checks, or `{"tool":"read_source","candidate":"clip"}` to inspect the clipping code. Finish with a candidate and a short summary, such as `{"tool":"finish","candidate":"shift","summary":"Subtracting the maximum preserves the score differences and passes the checks."}`.

With an already configured Codex CLI, download [record_model_run.py](assets/record_model_run.py) beside the lab and record a fresh model-directed investigation:

```bash title="record-a-new-model-run.sh"
uv run record_model_run.py new-run.json
```

The adapter passes the complete current state to each model call and accepts one JSON tool choice. It starts each request in an isolated directory and executes only the lab's named Python tools. A new run can take a different path; inspect its choices and results together.

This cell replays the recorded choices against the current functions and prints the final verified outcome:

<!-- leetllm: test, output=show -->
```python title="replay-model-investigation.py"
import sys
sys.path.insert(0, "assets")
from investigation import replay

result = replay("assets/recorded-run.json")
print("status:", result["status"])
print("candidate:", result["answer"]["candidate"])
print("executed tools:", len(result["history"]))
for turn in result["history"]:
    action = turn["action"]
    print(action["tool"], action["candidate"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
status: completed
candidate: shift
executed tools: 4
read_source baseline
evaluate baseline
read_source shift
evaluate shift
```
<!-- leetllm: output:end -->

## When ordinary code already knows the path

Suppose we want to evaluate all three implementations on the same four inputs. Every operation is already known. A loop over the candidates is the clearest solution, and it is exactly what our first Python cell does.

An agent becomes useful when the next step depends on interpreting an observation that the application has not fully anticipated. A repository investigation might branch into a failing assertion, an unfamiliar dependency, an unexpected data format, or an obsolete function name. The model can interpret those results and choose among tools without requiring a separate handwritten branch for every possible message. Anthropic describes this distinction as **workflows**, whose paths are specified in code, and **agents**, whose process and tool use are directed by the model.[^anthropic2025effectiveagents]

The distinction concerns who chooses the path. Both designs can call a language model. A fixed pipeline that retrieves three documents and asks a model to summarize them is still a workflow. A model that decides which document to retrieve after reading the previous one is directing an agent loop.

```checkpoint
An assistant reads a failing test and discovers that an imported package is missing. What should change compared with the softmax investigation?
---
The next action should investigate the missing dependency or report the setup problem. Comparing numerical implementations would not explain that observation. The same host loop can support either path because its chooser receives the actual tool result.
```

## Plan-and-Execute: arrange the work before running it

Some investigations reveal several independent questions at once. After selecting a softmax candidate, we can check small inputs, large positive inputs, and large negative inputs independently. A **Plan-and-Execute** design makes those tasks and their dependencies explicit before running them. Planning can be model-directed, while scheduling the resulting graph is ordinary application code. HuggingGPT illustrates this separation through task planning, execution, and dependencies between intermediate results.[^shen2023]

A plan can be a simple ordered list. When independent tasks can run concurrently, a directed acyclic graph, or **DAG**, captures more of the structure. A node is a task, and an edge means one task needs another's output. The graph below ends with a report that depends on all three test results.

<figure>
  <img src="illustrations/_generated/plan_execute_dark.png" alt="A source inspection feeds three independent checks for small, large positive, and large negative logits. All three feed a final report. With 40 milliseconds planning, test durations 90, 160, and 70 milliseconds, and 30 milliseconds reporting, parallel completion takes 230 milliseconds and serial completion takes 390 milliseconds." />
  <figcaption>The independent checks can overlap. The report starts after the slowest check, so the parallel path takes 40 + 160 + 30 = 230 ms for these durations.</figcaption>
</figure>

For a worked timing example, let planning take 40 ms, the three checks take 90, 160, and 70 ms, and reporting take 30 ms. Sequential execution takes

$$
T_{\text{serial}} = 40 + 90 + 160 + 70 + 30 = 390\text{ ms}.
$$

Overlapping the three independent checks gives

$$
T_{\text{parallel}} = 40 + \max(90,160,70) + 30 = 230\text{ ms}.
$$

The longest chain of dependent work is the **critical path**. Extra workers can overlap independent tasks, but they cannot make a report use a result that has not arrived. For this calculation we ignore scheduling overhead; a real implementation should measure its end-to-end duration.

### Execute a dependency graph

Python's `TopologicalSorter` tells us which tasks have no unfinished prerequisites. A thread pool can execute those ready tasks together. Here, each check computes probabilities with the shifted implementation; the report collects those actual results.

<!-- leetllm: test, output=show -->
```python title="execute-independent-checks.py"
from concurrent.futures import ThreadPoolExecutor
from graphlib import TopologicalSorter
import math
import sys
sys.path.insert(0, "assets")
from investigation import shift, PAIR

inputs = {
    "small": [0.0, 1.0],
    "positive": [1000.0, 1001.0],
    "negative": [-1001.0, -1000.0],
}
graph = {name: [] for name in inputs}
graph["report"] = list(inputs)
results = {}

def execute_step(name):
    if name == "report":
        return f"{sum(results.values())}/{len(inputs)} checks passed"
    actual = shift(inputs[name])
    return all(math.isclose(a, b, rel_tol=1e-9) for a, b in zip(actual, PAIR))

scheduler = TopologicalSorter(graph)
scheduler.prepare()
with ThreadPoolExecutor(max_workers=3) as pool:
    while scheduler.is_active():
        ready = sorted(scheduler.get_ready())
        print("ready:", ", ".join(ready))
        completed = list(pool.map(execute_step, ready))
        results.update(zip(ready, completed))
        scheduler.done(*ready)
print(results["report"])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
ready: negative, positive, small
ready: report
3/3 checks passed
```
<!-- leetllm: output:end -->

The first wave contains three checks. The second contains the report. If a tool raises an exception, `pool.map` raises before that wave is marked complete, so its dependent report does not run. A failed numerical check is different: it is a completed task with a useful negative result, which the report should include.

This small executor waits for a whole wave before advancing. A larger scheduler can call `done` as each future finishes, allowing a task to start as soon as its particular prerequisites are ready.

These tiny checks demonstrate dependency scheduling. Overlap becomes useful when the tasks involve substantial work that can proceed independently, such as calls to separate services or separate worker processes.

ReAct and planning also work together. Use a loop while discovering what the problem is, plan a batch once the independent checks become clear, and return to the loop if a surprising result changes the investigation. The control structure can follow the shape of the work.

## A changed input makes its conclusions old

Imagine that the agent tests the clipping candidate, then changes the chosen implementation to the shifted candidate. The old test report still exists, but it describes the clipping code. Reusing it because it was produced a few seconds ago would attach the wrong evidence to the new implementation.

Treat derived results like spreadsheet cells. Changing one input invalidates every dependent result, while unrelated cells remain usable. The numerical reference values can stay the same when the candidate source changes. The candidate's test results and the report derived from them must be recomputed.

<figure>
  <img src="illustrations/_generated/dependency_invalidation_dark.png" alt="Changing candidate source from version 1 to version 2 invalidates its check results and final report. Expected probabilities remain reusable because they depend only on the unchanged test cases." />
  <figcaption>Changing the source invalidates the checks and their report. Expected probabilities remain reusable because their inputs did not change.</figcaption>
</figure>

A source hash gives us a concrete way to distinguish versions. The following cache uses the source hash as part of each check's key. Evaluating the shifted candidate therefore performs new checks even when clipping results already exist:

<!-- leetllm: test, output=show -->
```python title="cache-results-by-source-version.py"
import hashlib
import inspect
import sys
sys.path.insert(0, "assets")
from investigation import CANDIDATES, evaluate

cache = {}
def checked(candidate):
    source = inspect.getsource(CANDIDATES[candidate])
    version = hashlib.sha256(source.encode()).hexdigest()
    if version not in cache:
        cache[version] = evaluate(candidate)
        print("computed:", candidate)
    return cache[version]

before = checked("clip")
after = checked("shift")
again = checked("shift")
print("old report:", before["passed"], "/", before["total"])
print("new report:", after["passed"], "/", after["total"])
print("reused shifted result:", again is after)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
computed: clip
computed: shift
old report: 2 / 4
new report: 4 / 4
reused shifted result: True
```
<!-- leetllm: output:end -->

For this lab, the cases and execution environment stay fixed. A production cache key should also include other inputs that can change the result, such as the dataset version and tool configuration. The important relationship is explicit: a result belongs to the inputs that produced it.

Time-based expiry can complement versioning when a tool reads changing external data, while dependency tracking remains necessary whenever inputs change. Refreshing a source makes it available for a new computation; it leaves the bytes of an already stored report unchanged.

## Keep the useful state as an investigation grows

A short investigation can resend its whole history at every turn. A long one benefits from a compact working record: the goal, candidate hypotheses, verified observations, unresolved questions, and the next useful check. Detailed logs can remain available through a retrieval tool.

The cost of replaying an ever-growing history is easy to calculate. Suppose the task and tool descriptions occupy $P$ tokens, and each completed turn adds $\Delta$ tokens. The $k$th model call receives

$$
I_k = P + (k-1)\Delta.
$$

Across $K$ calls, the arithmetic series becomes

$$
I_{\text{total}}
= \sum_{k=1}^{K} I_k
= KP + \frac{K(K-1)}{2}\Delta.
$$

For $P=2{,}000$, $\Delta=1{,}500$, and ten calls, the last input has 15,500 tokens and the submitted inputs total 87,500. Retaining only two completed turns changes the per-call growth:

<!-- leetllm: test, output=show -->
```python title="count-replayed-history.py"
base, increment, calls = 2000, 1500, 10
full = [base + turn * increment for turn in range(calls)]
window = [base + min(turn, 2) * increment for turn in range(calls)]
print("full history:", sum(full), "tokens; last call:", full[-1])
print("two-turn window:", sum(window), "tokens; last call:", window[-1])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
full history: 87500 tokens; last call: 15500
two-turn window: 45500 tokens; last call: 5000
```
<!-- leetllm: output:end -->

These sums count submitted input tokens. To estimate an invoice, use the provider's reported usage and its cache pricing. To preserve the investigation, retain the important findings before discarding old turns. A two-turn window that forgets the failed clipping test would save space while losing the reason to avoid that candidate.

A useful summary is specific: “Baseline overflows on large positive inputs. Clipping returns equal probabilities for unequal scores. Shifted inputs preserve the difference and pass all four checks.” That record lets the next turn continue the work without rereading every source listing.

## Stop when work is complete or progress has stopped

Our loop limits the number of turns and checks whether the chosen candidate passed. Larger agents need a time limit and a spending limit as well. Those limits belong in the code that dispatches work, where they can actually stop another call.

Repeated actions require interpretation. Running the same test after changing the source is productive. Running it repeatedly against the same source and getting the same failure adds no information. Track an action together with its input version and observation. A repeated pattern with unchanged state can trigger a summary and a new plan.

A good stopping report makes the result usable: name the candidate, state which checks passed, and retain any unresolved observation. In our investigation, selecting `shift` after its numerical checks is a natural finish. Publishing a fix or modifying an external system is a separate tool action with its own application rules.

For tools that change external state, also define retry behavior. If a request times out after an external service accepted it, sending it again can repeat the change. Services that support idempotency keys can recognize a retry of the same operation; keep that identity when retrying and query its status when possible.[^awsIdempotentApis2026] Online, [Agent Reliability, Recovery & Human Approval](/learn/agent-failure-states-retry-fallback) develops that lifecycle in detail.

## Add a different control pattern when the task needs it

The basic loop tells us how to take one step. Other patterns change how we choose, remember, or compare steps. Each can be understood as a small extension of the investigation we have already built.

### Route a familiar task to a known procedure

A router chooses one of several existing handlers. A request for numerical checks can go to the evaluation workflow; a request to explain source can go to a code-reading workflow. The router may be a model when the input is natural language, but the selected handler can remain ordinary code.

Routing works well when the categories and procedures are stable. It avoids rediscovering a known path on every request. Ambiguous inputs can ask for clarification or go to a more exploratory loop.

### Use feedback to improve the next attempt

**Reflexion** adds a memory of feedback between attempts. An evaluator scores or checks an outcome, and the model writes a compact reflection that influences the next attempt without updating its neural weights.[^shinn2023]

For the clipping candidate, useful feedback is concrete: “Both large scores are clipped to the same value, so their probability difference disappears. Try a transformation that preserves score differences.” The next attempt can use that observation to propose shifting. A generic note such as “be more careful” carries little usable information.

The reflection should stay tied to the result that motivated it. A mistaken evaluator can teach the next attempt the wrong lesson. Executable checks give this debugging task particularly useful feedback because they can directly compare the returned probabilities with the expected values.

### Compare several proposed answers

**Self-consistency** samples multiple reasoning paths and aggregates their final answers.[^wang2022c] It is useful when a task has a comparable final answer, such as a number or a label. The aggregation rule needs a shared representation: `0.731059` and `73.1059%` should count as the same probability after normalization.

For code repair, candidate implementations can instead be tested against the same cases. If most proposals use clipping but a shifted implementation preserves the required outputs, the tests give a better selection rule for this task than a vote. Choose the evaluator that measures the goal.

### Search through alternative action sequences

**Language Agent Tree Search**, or LATS, extends an agent's trajectory into a tree of alternatives. A node represents a state reached so far; a child represents another action and its resulting state. Selection, expansion, evaluation, and value updates let the search spend more effort on promising paths while continuing to explore alternatives.[^zhou2023b]

An upper-confidence selection score balances the average reward of a child with an exploration bonus:

$$
\mathrm{UCT}(i)
=
\frac{W_i}{N_i}
+
c\sqrt{\frac{\ln N_p}{N_i}}.
$$

Here $W_i$ is accumulated reward for child $i$, $N_i$ is its visit count, $N_p$ is the parent's visit count, and $c$ controls exploration. A child with a strong average looks promising. A child with few visits receives a larger bonus because less is known about it. Visit an untried child before applying the formula, which would otherwise divide by zero.

This calculation selects between two already visited branches using the standard exploration constant $c = \sqrt{2}$ and parent visits $N_p = 16 + 4 = 20$. The inputs represent stored search statistics; the code computes the next selection:

<!-- leetllm: test, output=show -->
```python title="select-a-search-branch.py"
import math

branches = {
    "A": {"reward": 12.8, "visits": 16},
    "B": {"reward": 1.6, "visits": 4},
}
def uct(branch):
    return branch["reward"] / branch["visits"] + math.sqrt(
        2 * math.log(20) / branch["visits"]
    )

for name, branch in branches.items():
    print(name, "score:", round(uct(branch), 3))
chosen = max(branches, key=lambda name: uct(branches[name]))
print("next branch:", chosen)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
A score: 1.412
B score: 1.624
next branch: B
```
<!-- leetllm: output:end -->

B wins because its exploration bonus outweighs A's higher observed average. After a rollout, add its reward and visit to the branch statistics and propagate the result toward the root. This updates the search tree; model training is a separate process.

Search costs additional calls and requires a way to represent alternative states. Numerical candidate evaluation is easy to isolate because each function takes values and returns probabilities. File edits need separate working copies or a way to restore the previous state. A purchase or sent message cannot be undone by moving back to an earlier search node.

## Choosing an architecture from the task

Start with the information available and the uncertainty that remains. If every step is known, write the workflow. If observations determine the next useful question, use an adaptive loop. If several useful tasks are independent, represent their dependencies and overlap them. If one attempt is unlikely to be enough, add feedback memory or search with an evaluator that measures the actual objective.

| What the work needs | Useful structure | What to keep visible |
|---|---|---|
| A fixed sequence | Workflow | Inputs and outputs of each step |
| Interpretation after each result | ReAct loop | Tool choices and returned observations |
| Independent branches and a join | Plan-and-Execute DAG | Dependencies and completed results |
| Selecting a known procedure | Router | Chosen handler and routing evidence |
| Improvement across attempts | Reflexion | Feedback and the change it motivates |
| Agreement among answer samples | Self-consistency | Comparable final answers |
| Exploring alternative trajectories | Tree search | Branch state, visits, and rewards |

The architecture follows the task's information flow. In our debugging example, an adaptive loop found a useful candidate, independent numerical checks verified it, and versioned results kept the report attached to the code that was tested.

```mastery-quiz
[
  {
    "question": "A tool reports that a numerical test cannot import its dependency. Which next action best follows the ReAct pattern?",
    "options": ["Evaluate another numerical candidate with the same unavailable dependency.", "Exclude the check that could not run and select from the remaining results.", "Inspect the missing dependency and execution setup.", "Treat the import error as a failed numerical comparison and reject the candidate."],
    "answer": "Inspect the missing dependency and execution setup.",
    "explanation": "The observation changes the useful next question. The loop should investigate why the test could not run before interpreting it as a numerical failure."
  },
  {
    "question": "What does the model choose in the downloadable investigation?",
    "options": ["The next named tool and its candidate argument.", "The pass/fail results returned by each numerical check.", "The actual value returned by math.exp.", "The rule that marks a candidate verified in the host."],
    "answer": "The next named tool and its candidate argument.",
    "explanation": "The model requests actions. The host executes those actions and derives verification from their computed results."
  },
  {
    "question": "A report needs three independent checks taking 30, 70, and 40 ms. Planning takes 20 ms and reporting takes 10 ms. Ignoring scheduling overhead, how long does parallel execution take?",
    "options": ["170 ms.", "80 ms.", "100 ms.", "140 ms."],
    "answer": "100 ms.",
    "explanation": "The checks overlap, so their stage lasts max(30, 70, 40) = 70 ms. Adding planning and reporting gives 20 + 70 + 10 = 100 ms. Adding all three check durations would give the sequential total of 170 ms."
  },
  {
    "question": "The candidate source changes, while the test inputs and expected probabilities remain fixed. Which cached material can be reused immediately?",
    "options": ["The old test report, because it was generated recently.", "Candidate checks, while only the report's title changes.", "All results, provided the new function has the same name.", "Expected probabilities, while candidate checks and their report are recomputed."],
    "answer": "Expected probabilities, while candidate checks and their report are recomputed.",
    "explanation": "The expected probabilities do not depend on the candidate source. The checks do, and the report depends on those checks."
  },
  {
    "question": "Six model calls start with 700 task tokens and add 100 tokens per completed turn. How many input tokens does full-history replay submit in total?",
    "options": ["6,300.", "4,200.", "1,200.", "5,700."],
    "answer": "5,700.",
    "explanation": "The inputs have 700, 800, 900, 1,000, 1,100, and 1,200 tokens. Their sum is 6 × 700 + 100 × 15 = 5,700."
  },
  {
    "question": "An agent repeats the same test command after changing the candidate source. What should a progress detector consider?",
    "options": ["Only whether the command text repeats.", "The changed source version and the new observation.", "Only whether the output changed, regardless of the source version.", "Only whether the source changed, regardless of the returned observation."],
    "answer": "The changed source version and the new observation.",
    "explanation": "The same action on a new input can produce useful evidence. A stalled cycle repeats work while the relevant state and observations stay unchanged."
  },
  {
    "question": "Which reflection would most help a second attempt after clipping large logits produced [0.5, 0.5]?",
    "options": ["Use a narrower clipping range to keep exponentials farther from overflow.", "Use higher precision after clipping to recover the original score difference.", "Clipping erased the difference between scores; try preserving that difference.", "Normalize the clipped exponentials a second time to restore the expected probabilities."],
    "answer": "Clipping erased the difference between scores; try preserving that difference.",
    "explanation": "Useful feedback explains the observed failure and suggests what the next candidate must preserve."
  },
  {
    "question": "Why can a less-visited branch beat a branch with a higher average reward under UCT?",
    "options": ["The selection score uses total reward instead of average reward.", "Its exploration bonus can outweigh the difference in average reward.", "The exploration coefficient makes all branches equally likely to be selected.", "The parent visit count replaces the child's count in the average-reward term."],
    "answer": "Its exploration bonus can outweigh the difference in average reward.",
    "explanation": "UCT adds an uncertainty-related exploration term to average reward. Fewer visits make that bonus larger, encouraging the search to investigate alternatives."
  }
]
```

> **Next:** Continue to [Context Engineering](/learn/long-context-engineering-beyond-management).
