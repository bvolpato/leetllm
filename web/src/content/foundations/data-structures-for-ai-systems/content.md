---
{
  "id": "data-structures-for-ai-systems",
  "title": "Data Structures for AI",
  "slug": "data-structures-for-ai-systems",
  "section": "Computing Foundations",
  "category": "MLOps & Deployment",
  "difficulty": "Easy",
  "order": 7,
  "coverImage": "illustrations/_generated/chapter_flow_dark.png",
  "companies": [
    "OpenAI",
    "Anthropic",
    "Google",
    "Meta"
  ],
  "shortDescription": "Three notes can be scanned with a list. The same search gets a different cost once each operation picks a list, index, heap, queue, or cache.",
  "keyConceptsTested": [
    "Python lists and array-shaped sequences",
    "hash maps, dictionaries, and sets",
    "deques and FIFO queues",
    "heaps and top-k selection",
    "inverted indexes",
    "trees, graphs, and tries",
    "bounded and versioned caches",
    "operation-level complexity"
  ],
  "prerequisites": [
    "python-for-ai-engineering"
  ],
  "relatedQuestions": [
    "sql-databases-data-modeling-ai",
    "algorithms-complexity-ml-engineers"
  ]
}
---

In our tiny corpus, a user searches for `red fox`. Document 2 contains both words, document 0 contains one, and document 1 contains neither:

| doc id | text |
|---:|---|
| 0 | `red bird sings` |
| 1 | `blue whale swims` |
| 2 | `red fox sleeps` |

A loop over a Python list can find those matches. You used lists and dictionaries in [Python for AI Engineering](/learn/python-for-ai-engineering): lists keep items in order, while dictionaries retrieve values by key. Here the choice changes how much work a search repeats. A **retriever** finds documents relevant to a query; ours will rank them by the number of distinct query words they contain.

With three notes, scanning every word is cheap. With many notes and repeated queries, we'd rather build a lookup once and reuse it. The same records will help us compare lists, indexes, heaps, and caches without changing the search problem.

## Let the operation choose the shape

Before naming a structure, ask which operation must stay cheap and predictable:

- "Which item is at position 2?" points to a sequence.
- "Which documents contain `red`?" points to a key-value mapping.
- "Have I already seen document 2?" points to a set.
- "Which waiting job is oldest?" points to a queue.
- "Which retained result is weakest?" points to a heap.
- "Which notes share a parent topic, link to each other, or begin with this prefix?" points to a tree, graph, or trie.

These aren't interchangeable labels. Each structure preserves a different promise about position, identity, order, or connection. The useful choice follows from the operation you need to repeat.[^cormen2009]

## Lists and array-shaped sequences

A Python `list` is an ordered, mutable sequence. CPython stores it as a resizable array of object references, so an integer index reaches a known position directly. Our strings fit a list because they're ordinary Python objects.[^python2026designfaq]

That shape differs from `array.array`, which packs a restricted basic value type, and from a <span data-glossary="numpy-array">NumPy array</span> or tensor, which usually holds one numeric type in a rectangular shape and supports vectorized math. The distinction matters here because the corpus needs flexible Python objects, not a rectangular block of one numeric type.

Start with three operations and predict what each one has to move:

| operation | before | after | what had to move |
|---|---|---|---|
| read `docs[2]` | `[doc 0, doc 1, doc 2]` | `doc 2` | nothing |
| append `doc 3` | `[doc 0, doc 1, doc 2]` | `[doc 0, doc 1, doc 2, doc 3]` | usually no existing item |
| insert `doc 3` at front | `[doc 0, doc 1, doc 2]` | `[doc 3, doc 0, doc 1, doc 2]` | every existing reference shifts right |

An append occasionally needs a larger backing array and copies existing references. Spread across many appends, that occasional resize still gives constant work per append on average. The complexity table calls this **amortized** constant time.

That last row explains why a list is a poor first-in, first-out queue when code repeatedly uses `pop(0)`. The output is correct, but removing the first item still moves every later reference. When arrival order becomes the operation to protect, a `deque` fits better. We'll use it later.

The list is still the right starting point here because document order is stable and a complete scan is easy to verify by hand.

Now run the query against the list. The match counts look like this:

| doc id | contains `red` | contains `fox` | total matches |
|---:|---:|---:|---:|
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 0 |
| 2 | 1 | 1 | 2 |

Document 2 should rank above document 0 because it matches both terms. Document 1 contributed nothing, yet the scan still opened it. That unused read is the cost we want the next structure to remove.

To skip irrelevant documents, we'll need extra information prepared before the query arrives. That saves repeated scanning, at the cost of storing and updating an index.

## Building an inverted index

The query starts with a term such as `red`, so let the lookup start there instead of at document 0. The system should jump from the term to matching documents.

An <span data-glossary="inverted-index">inverted index</span> answers that direction of lookup. It reverses the document-to-terms view into a term-to-documents map. The key changes from a document ID to the thing the query already has: a term.

| view | key | value |
|---|---|---|
| forward scan | document ID | terms in one document |
| inverted index | term | document IDs containing that term |

Python calls its built-in <span data-glossary="hash-map">hash map</span> a `dict`. A hash function narrows down where a key could be stored; equality checks distinguish keys that collide. Keys must be **hashable**: their hash stays stable, and keys that compare equal must have equal hashes. Strings and integers work as keys; a mutable list doesn't.[^python2026builtintypes]

Python dictionaries preserve insertion order, but that order isn't what makes lookup fast. For this index, the important behavior is that a term leads to its posting collection, regardless of where that key was inserted.

The hash narrows the lookup; it isn't a document identity. Two unequal keys can have the same hash and still occupy separate dictionary entries. Keep the original term as the key, not `hash(term)`. Likewise, our document IDs are list positions only because this corpus keeps its order. Removing doc 0 would shift later positions and invalidate existing postings. A changing corpus needs stable document IDs or a rebuilt index.

The index maps each term to its **posting list**. A posting records a matching document ID; larger indexes can also store term positions or frequency. In this first version, a Python `set[int]` is enough because our score asks only whether each query term appears in each document.[^manning2008ir]

### Build the index by hand

Split each document into terms and store the matching document IDs. Notice which rows match `red` before checking the full table:

| term | document IDs |
|---|---|
| `red` | `{0, 2}` |
| `bird` | `{0}` |
| `sings` | `{0}` |
| `blue` | `{1}` |
| `whale` | `{1}` |
| `swims` | `{1}` |
| `fox` | `{2}` |
| `sleeps` | `{2}` |

Now the query can enter through the index. It asks for two posting lists instead of reopening all three documents:

| query term | posting list |
|---|---|
| `red` | `{0, 2}` |
| `fox` | `{2}` |

Turn those posting lists into match counts by adding one for each query term that contains a document:

| doc id | matches from `red` | matches from `fox` | final score |
|---:|---:|---:|---:|
| 0 | 1 | 0 | 1 |
| 2 | 1 | 1 | 2 |

Document 2 wins because it matches both terms. Document 0 still matters because it matches one term. The index removed document 1 from scoring entirely, keeping lookup and scoring cleanly separated.

<figure>
  <img src="illustrations/_generated/chapter_flow_dark.png" alt="Query-time comparison for red fox. A linear list scan sequentially checks every document in memory, reading doc 1 for zero matches. An inverted index jumps from query terms directly to posting sets {doc 0, doc 2} and {doc 2}, bypassing doc 1 completely." />
  <figcaption>The query-time paths differ. A linear scan rereads every document in memory; an existing inverted index visits only matching posting lists, bypassing non-matching documents entirely.</figcaption>
</figure>

### Why a set lives inside the dictionary

The dictionary solves exact term lookup. The set solves uniqueness and membership. Keeping those jobs separate makes the index easier to reason about.

Suppose document 2 were `red red fox`. The posting list for `red` should still contain document 2 once, not twice. That's why the value is a set of document IDs instead of a list of document IDs.

Keep the two operations separate:

- Dictionary asks: "given this term, which collection is its value?"
- Set asks: "is this document ID already in that collection?"

Python sets don't promise a useful iteration order, so examples sort them before printing. Production lexical indexes commonly keep ordered, compressed posting lists and richer statistics. The Python set is a teaching choice: it makes membership and duplicate prevention visible before storage layout and fast posting intersections enter the design.[^manning2008ir]

A repeated term is the smallest proof. In the demo below, document 2 says `red` twice, but membership in the `red` posting set still contributes one document ID.

<!-- leetllm: test, output=show -->
```python title="posting-list-membership.py"
from collections import defaultdict

docs_with_repeat = [
    "red bird sings",
    "blue whale swims",
    "red red fox",
]
postings: dict[str, set[int]] = defaultdict(set)

for doc_id, text in enumerate(docs_with_repeat):
    for term in text.split():
        postings[term].add(doc_id)

print("red postings", sorted(postings["red"]))
print("document 2 counted once", len(postings["red"]) == 2)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
red postings [0, 2]
document 2 counted once True
```
<!-- leetllm: output:end -->

```checkpoint
Why does the inverted index store document IDs in a set instead of a list in this binary-match scorer?
---
A set keeps each document ID unique. Repeating `red` inside one document must not add multiple posting entries or inflate its binary match score.
```

## Keep only the winners

The index has narrowed the query to scored candidates. Now the system needs the best few results, not a fully sorted report of the corpus. That distinction determines the next structure.

A heap maintains a small group of winners while candidates arrive. If you need two results out of thousands, it can avoid fully sorting candidates you won't return. With only two matches in our current corpus, a sort is perfectly reasonable; add one more candidate to expose the selection decision.

For the three notes, the scored candidates are:

| doc id | score |
|---:|---:|
| 2 | 2 |
| 0 | 1 |

A binary heap stores a partial order rather than a fully sorted list. The `heapq` operations used here maintain a <span data-glossary="min-heap">min-heap</span>: the smallest key is always at index 0. The remaining list isn't globally sorted, which is fine because the root is the only position we need to inspect for eviction.[^python2026heapq][^cormen2009]

That root guarantee fits <span data-glossary="top-k">top-k</span> retrieval. Keep only `k` winners, with the weakest winner at the root. You often want the best 5, 10, or 20 candidates rather than a complete ranking of every candidate. The root tells you exactly which retained result can leave when a stronger candidate appears.

Suppose doc 3, `red fox runs`, arrives with score 2. Keep only two results. Doc 0 should leave because its score is 1, while docs 2 and 3 each score 2. Which tied result should come first?

Use keys `(score, -doc_id)`. Python compares tuples from left to right, so score wins first. When scores tie, doc 2 has key `(2, -2)`, which is larger than doc 3's `(2, -3)`. The lower document ID wins the tie. Inside a min-heap, however, the *smaller* key goes at the root so it's ready for eviction:

<figure>
  <img src="illustrations/_generated/retriever_pipeline_dark.png" alt="A top-two min-heap retriever pipeline. Candidate doc 3 arrives with score 2, key (2, -3) and outscores root doc 0 key (1, 0). Doc 0 is evicted, doc 3 enters the heap at the root because (-3) is smaller than doc 2 (-2), and the retriever yields descending top-2 results: doc 2 first, then doc 3." />
  <figcaption>The root stores the weakest retained key. Candidate doc 3 replaces doc 0. Its key (2, -3) is smaller than doc 2's (2, -2), so doc 3 becomes the new root. Descending key order returns doc 2, then doc 3.</figcaption>
</figure>

Real rankers need an explicit tie-break rule. The heap demo and retriever lab both prefer the lower document ID when scores tie, which keeps output deterministic.

<!-- leetllm: test, output=show -->
```python title="bounded-top-k-heap.py"
import heapq

candidate_scores = [(0, 1), (2, 2), (3, 2), (4, 0)]
k = 2
top_k: list[tuple[int, int]] = []

for doc_id, score in candidate_scores:
    # Same key rule as search(): higher score wins; lower doc_id wins ties.
    candidate = (score, -doc_id)
    if len(top_k) < k:
        heapq.heappush(top_k, candidate)
    elif candidate > top_k[0]:
        evicted = heapq.heapreplace(top_k, candidate)
        print("evicted", (evicted[0], -evicted[1]))
    else:
        print("discarded", (score, doc_id))

print("top k", [(score, -doc_key) for score, doc_key in sorted(top_k, reverse=True)])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
evicted (1, 0)
discarded (0, 4)
top k [(2, 2), (2, 3)]
```
<!-- leetllm: output:end -->

The lab later calls `heapq.nlargest`, which returns results in descending key order. It's suited to selecting a small `k` from many candidates.[^python2026heapq] CPython can use a full sort when `k` is at least the number of candidates, so the tiny lab isn't a demonstration of a speedup. The explicit heap above shows what bounded selection does.

The `candidate > top_k[0]` check matters: `heapreplace` always removes the old root, even when the incoming candidate is weaker. The final candidate, doc 4 with score 0, is discarded. Replacing the root unconditionally would remove a score-2 winner and retain score 0.[^python2026heapq]

```checkpoint
You need the best 10 results from a long stream of scored documents. What does a capped min-heap avoid doing?
---
It avoids fully sorting every candidate. The heap retains only 10 winners and exposes the weakest winner for replacement, while an explicit tie rule keeps output deterministic.
```

## Building a tiny retriever

Return to the original three notes. First implement the scan, then build an index and accumulate scores from postings. This is the retrieval part of <span data-glossary="rag">RAG</span> (retrieval-augmented generation): a language model could later read the returned documents. There's no language model in this lab.

Put this in `data_structures_demo.py`. The tokenizer lowercases and splits on whitespace. Production tokenizers also handle punctuation and language-specific rules, but keeping normalization tiny makes the structure visible. Returning a set means this example scores binary term membership: each distinct query term contributes at most once.

<!-- leetllm: test, id=retriever, output=show -->
```python title="data_structures_demo.py"
from collections import defaultdict
import heapq

docs = [
    "red bird sings",
    "blue whale swims",
    "red fox sleeps",
]

def tokenize(text: str) -> set[str]:
    return set(text.lower().split())

def slow_search(query: str) -> list[tuple[int, int]]:
    terms = tokenize(query)
    matches: list[tuple[int, int]] = []
    for doc_id, text in enumerate(docs):
        words = tokenize(text)
        score = sum(term in words for term in terms)
        if score:
            matches.append((doc_id, score))
    return matches

def build_index(documents: list[str]) -> dict[str, set[int]]:
    postings: dict[str, set[int]] = defaultdict(set)
    for doc_id, text in enumerate(documents):
        for term in tokenize(text):
            postings[term].add(doc_id)
    return postings

index = build_index(docs)

def search(query: str, k: int = 2) -> list[int]:
    if k < 1 or not query.strip():
        return []

    scores: dict[int, int] = defaultdict(int)
    for term in tokenize(query):
        for doc_id in index.get(term, set()):
            scores[doc_id] += 1

    best = heapq.nlargest(
        k,
        scores.items(),
        key=lambda item: (item[1], -item[0]),
    )
    return [doc_id for doc_id, _score in best]

print("slow scan", slow_search("red fox"))
print("posting list", sorted(index["red"]))
print("search", search("red fox"))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
slow scan [(0, 1), (2, 2)]
posting list [0, 2]
search [2, 0]
```
<!-- leetllm: output:end -->

Read the two outputs as two distinct interfaces. `slow_search` returns score tuples in corpus order, so `(2, 2)` appears after `(0, 1)`. Those tuples expose the score trace without ranking it. `search` uses the posting lists, applies top-`k` selection, and returns `[2, 0]`.

`defaultdict(set)` creates an empty set when a missing key is accessed with brackets during indexing. During search, `index.get(term, set())` returns an empty set for an unknown term without inserting it into the index. A query for `otter` therefore returns `[]`. Repeated query words are removed by `tokenize`, so `red red fox` scores exactly like `red fox`.

### Map each operation to one structure

| Job | Structure | Why it fits |
|---|---|---|
| keep the original corpus order | list | the documents start as an ordered sequence |
| jump from term to matching docs | dictionary of sets | the query starts with a term |
| count how many terms matched | dictionary of integers | each document needs a score |
| keep the best few results | heap | the system wants top-k rather than a full sorted list |

The heap key uses score first and negative document ID second. Higher scores win; lower IDs win ties. That small rule makes repeated runs predictable, so a later debugging trace can distinguish a ranking bug from a tie-break choice.

## When order and reuse become the problem

The retriever chose structures by lookup and ranking. Ingestion asks a different question: which job arrived first? Repeated queries ask another: can this result be reused without becoming stale?

### Process arrivals in order

New documents arrive and wait to be indexed. Later systems may also split them into chunks and encode each chunk as an <span data-glossary="embedding">embedding</span>, a numerical representation used for similarity search. For one class of equal-priority jobs, arrival order is a clean baseline. The operation isn't "find by key" or "keep the best"; it removes the oldest item.

A queue is the behavior: first in, first out (FIFO). Python's <span data-glossary="collections-deque">collections.deque</span> is the container used here. Its name means **double-ended queue**, and it supports appends and pops at either end in approximately constant time: more waiting jobs don't require shifting all existing references. Middle indexing becomes slower, so it isn't a replacement for a list when random position access is the main job.[^python2026collections]

Why does `list.pop(0)` hurt? A standard Python list stores item references in a single contiguous array. Calling `pop(0)` removes the head element, which forces CPython to shift every subsequent reference left by one slot. If 50,000 document ingestion jobs or token chunks sit in a queue, draining them item by item incurs quadratic $O(n^2)$ total work.

FIFO ordering doesn't require one particular layout. For example, vLLM's first-come, first-served request queue uses a deque.[^vllm2026requestqueue] Another implementation is a **circular ring buffer**: a fixed-size array whose read and write positions advance modulo capacity (`(tail + 1) % capacity`). Appends and pops update offsets without shifting existing elements. A full buffer still needs a policy: wait, reject the new item, or overwrite an old one.

Which policy would you choose for an embedding job queue? Overwriting can be useful for a recent-token history, but silently dropping the oldest unprocessed document loses work. Python's `deque(maxlen=...)` discards items from the opposite end when an append fills a bounded deque, so adding `maxlen` isn't a safe job-queue capacity limit by itself.[^python2026collections]

Trace the state from left (oldest) to right (newest) to follow which job sits at the head after each operation:

| operation | deque state | next job |
|---|---|---|
| start | `[doc-3, doc-4]` | `doc-3` |
| `append("doc-5")` | `[doc-3, doc-4, doc-5]` | `doc-3` |
| `popleft()` | `[doc-4, doc-5]` | `doc-4` |

<!-- leetllm: test, output=show -->
```python title="queues-for-background-work.py"
from collections import deque

embedding_jobs = deque(["doc-3", "doc-4", "doc-5"])
next_job = embedding_jobs.popleft()

print("next job", next_job)
print("remaining", list(embedding_jobs))
```

<!-- leetllm: output:start -->
```text title="Output" output compact
next job doc-3
remaining ['doc-4', 'doc-5']
```
<!-- leetllm: output:end -->

The rule is simple:

- append new work on one side
- pop the oldest work from the other side

That's FIFO behavior. If you accidentally process newest work first, old jobs can wait indefinitely while new jobs keep arriving. A test should fail when the newest job leaves first.

An in-memory `deque` shows ordering, not durability. If a worker writes an embedding and crashes before recording completion, a broker may retry the job. The downstream write needs a durable <span data-glossary="idempotency">idempotency</span> key so the retry can't create a duplicate vector. The next chapter puts that guarantee in a database transaction and a uniqueness constraint.

The failure case makes the ordering bug visible. New jobs belong at the tail; putting them at the front lets recent uploads jump ahead of old work. Run it before trusting the queue:

<!-- leetllm: test, output=show -->
```python title="queue-order-failure.py"
from collections import deque

fifo_jobs = deque(["oldest-doc"])
fifo_jobs.extend(["new-doc-a", "new-doc-b"])

newest_first_jobs = deque(["oldest-doc"])
newest_first_jobs.appendleft("new-doc-a")
newest_first_jobs.appendleft("new-doc-b")

print("FIFO runs", fifo_jobs.popleft())
print("wrong order runs", newest_first_jobs.popleft())
```

<!-- leetllm: output:start -->
```text title="Output" output compact
FIFO runs oldest-doc
wrong order runs new-doc-b
```
<!-- leetllm: output:end -->

FIFO also describes claim order, not completion order. Two workers may claim doc 3 and then doc 4, yet doc 4 can finish first. Code that publishes embeddings must bind each result to its document ID rather than assume completion order matches arrival order.

Sharing a container introduces another promise: one worker must claim each item through one synchronized operation. Separate checks and mutations don't become one transaction because a container supports thread-safe individual operations. The following program deliberately interleaves two workers without threads, so the race is reproducible. It also contrasts a history buffer that drops work with a job queue that rejects excess work.[^python2026collections]

<!-- leetllm: test, output=show -->
```python title="queue-claims-and-capacity.py"
from collections import deque
from queue import Empty, Full, Queue

jobs = deque(["doc-3"])
worker_a_saw_work = bool(jobs)
print("worker B claimed", jobs.popleft())
if worker_a_saw_work:
    try:
        jobs.popleft()
    except IndexError:
        print("worker A's earlier check is stale")

history = deque(["doc-3"], maxlen=1)
history.append("doc-4")
print("bounded deque retained", list(history))

work = Queue(maxsize=1)
work.put_nowait("doc-3")
try:
    work.put_nowait("doc-4")
except Full:
    print("doc-4 rejected; producer must retry or defer it")
print("claimed", work.get_nowait())
try:
    work.get_nowait()
except Empty:
    print("no work available at the moment of claim")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
worker B claimed doc-3
worker A's earlier check is stale
bounded deque retained ['doc-4']
doc-4 rejected; producer must retry or defer it
claimed doc-3
no work available at the moment of claim
```
<!-- leetllm: output:end -->

`Queue` provides thread locking and bounded capacity. Use `get_nowait()` and handle `Empty`, or wait with `get(timeout=...)`; don't treat an earlier `empty()` check as a reservation. A rejected producer still owns its unaccepted job. This example neither performs embedding work nor acknowledges completion, and the queue remains in memory.[^python2026queue]

### Reuse results without serving stale answers

If users ask the same question repeatedly, recomputing retrieval results per request wastes work. A cache can remove that repeated computation, but only if its hit is still valid.

A retrieval cache stores prior ranked document IDs so the system can reuse them. A cache isn't one primitive structure. It combines a mapping from key to value with policies for freshness and eviction. The mapping finds a candidate result; policies decide whether keeping that result stays safe.

<!-- leetllm: test, continue=retriever, id=cache-demo, output=show -->
```python title="caches-for-repeated-queries.py"
cache: dict[tuple[int, str, int], list[int]] = {}
corpus_version = 1
query = "red fox"
k = 2

cache_key = (corpus_version, query, k)
if cache_key not in cache:
    cache[cache_key] = search(query, k)

print("cached", cache[cache_key])
```

<!-- leetllm: output:start -->
```text title="Output" output compact
cached [2, 0]
```
<!-- leetllm: output:end -->

Who owns that list after a cache hit? If the caller removes an inaccessible document from the cached list itself, it alters what the next request receives, as the second hit below demonstrates:

<!-- leetllm: test, continue=cache-demo, id=cache-ownership, output=show -->
```python title="cached-result-ownership.py"
borrowed = cache[cache_key]
borrowed.remove(2)
print("next hit after caller mutation", cache[cache_key])

# Store an immutable sequence; each request owns its own working list.
frozen_cache = {cache_key: tuple(search(query, k))}
request_result = list(frozen_cache[cache_key])
request_result.remove(2)
print("request-local filtered result", request_result)
print("unchanged cached ranking", list(frozen_cache[cache_key]))
cache[cache_key] = search(query, k)  # Restore the original cached entry.
```

<!-- leetllm: output:start -->
```text title="Output" output compact
next hit after caller mutation [0]
request-local filtered result [0]
unchanged cached ranking [2, 0]
```
<!-- leetllm: output:end -->

This repairs shared mutation, not permission correctness. Filter or scope retrieval before selecting top-k; removing forbidden items afterward can leave too few results or miss accessible winners. The tuple is immutable and contains immutable integers. A tuple containing mutable document objects would still share those objects.[^python2026builtintypes]

### Make freshness part of the key

| cache key part | why it exists |
|---|---|
| `query` | separates one repeated request from another |
| `corpus_version` | forces refresh after the document collection changes |
| `k` | separates a request for one result from a request for two |

If document 2 changes to `fox sleeps`, its score falls to 1. It now ties with doc 0, so the correct ranking becomes `[0, 2]`, not the cached `[2, 0]`. Rebuild the affected index and advance `corpus_version` before serving queries against the new corpus. Changing the version alone can't repair an old index.

Every input that can change the result belongs in the key or in an invalidation rule. Our lab fixes the scoring rule and has no user-specific documents. A shared service must also separate permission scopes and invalidate results when scoring or normalization changes. Two people sending identical text aren't necessarily allowed to retrieve the same notes.

The demo dictionary can grow without limit. A long-running service also needs a bound such as a maximum entry count or byte budget, plus an eviction policy. **Least recently used (LRU)** discards the entry that hasn't been accessed for the longest time. With two cache slots, the order changes even on a hit:

| request | least recent to most recent | action |
|---|---|---|
| `red` | `[red]` | compute and store |
| `fox` | `[red, fox]` | compute and store |
| `red` again | `[fox, red]` | reuse and move to most recent |
| `bird` | `[red, bird]` | evict `fox`, then store `bird` |

Versioning prevents stale hits. Eviction bounds storage, even when all entries are still valid. A plain insertion-ordered dictionary doesn't implement LRU by itself: reading a key doesn't move it to the end. `OrderedDict.move_to_end()` and `popitem(last=False)` provide the operations needed for this recency order.[^python2026collections]

Keep `k=2` fixed for this failure example. A text-only key finds yesterday's ranking after an update; a versioned key misses and forces recomputation from the updated index.

<!-- leetllm: test, continue=cache-ownership, id=cache-freshness, output=show -->
```python title="cache-invalidation-failure.py"
query = "red fox"
old_version = 1
new_version = 2

text_only_cache = {query: [2, 0]}
versioned_cache = {(old_version, query, 2): [2, 0]}

print("text-only stale hit", query in text_only_cache)
print("versioned stale hit", (new_version, query, 2) in versioned_cache)

updated_docs = docs.copy()
updated_docs[2] = "fox sleeps"
original_index = index
print("new version with old index", search(query))
index = build_index(updated_docs)
print("rebuilt index ranking", search(query))
assert search(query) == [0, 2]
index = original_index  # Keep later exercises on the original corpus.
```

<!-- leetllm: output:start -->
```text title="Output" output compact
text-only stale hit True
versioned stale hit False
new version with old index [2, 0]
rebuilt index ranking [0, 2]
```
<!-- leetllm: output:end -->

The miss only triggers a computation; it does not guarantee that computation used current postings. In a shared service, build a replacement corpus/index snapshot, then publish it together with its version under the service's synchronization rule. Each query must use one matching snapshot and version throughout. Updating the version first and the index later exposes a window where a stale ranking can be stored under the new key.

```checkpoint
Why should a retrieval-cache key include `corpus_version` as well as the query text?
---
The same query can have a different correct ranking after documents change. A new version forces a cache miss instead of serving a fast but stale result.
```

## Use paths, links, and prefixes

Lists, dictionaries, sets, deques, and heaps covered position, identity, arrival order, and priority. What if the query asks for a path instead? Three other shapes become useful when the question is about hierarchy, a relationship, or a shared prefix.[^cormen2009]

### A tree gives each node one parent path

A **rooted tree** has a chosen root, parent-child edges, and no cycles. Every node except the root has exactly one parent. In a topic taxonomy, each note follows one path from the root:

```text title="note-topic-tree.txt"
notes
├── red animals
│   ├── doc 0: red bird sings
│   └── doc 2: red fox sleeps
└── blue animals
    └── doc 1: blue whale swims
```

That shape makes subtree questions natural: "show every note under `red animals`." A **binary search tree** solves a different problem: it orders keys so smaller keys lie in a node's left subtree and larger keys in its right subtree. Each comparison chooses a branch. A balanced tree needs only a logarithmic number of such choices; a badly skewed tree becomes a chain. A topic hierarchy isn't automatically a search tree.

A heap is also drawn as a tree, but it isn't a binary search tree. A min-heap guarantees only that each parent is no larger than its children. It doesn't support arbitrary key search the way a search tree does. Its job is still priority eviction.

### A graph allows many-to-many links

Suppose doc 2 belongs under both `red animals` and `foxes`, or doc 0 links directly to doc 2. One-parent taxonomy no longer captures the relationship cleanly. A graph stores **vertices** (nodes) and **edges** (links); edges may be directed or undirected, and graphs may contain cycles. Choose it when the links themselves are the data you need to traverse.

Python code commonly represents a sparse graph as a dictionary of neighbor sets:

<!-- leetllm: test, output=show -->
```python title="note-links.py"
from collections import deque

links = {
    0: {2},
    1: set(),
    2: {0},
}

print("neighbors of doc 0", sorted(links[0]))
pending = deque([0])
discovered = {0}
visit_order = []
while pending:
    doc_id = pending.popleft()
    visit_order.append(doc_id)
    for neighbor in sorted(links.get(doc_id, set())):
        if neighbor not in discovered:
            discovered.add(neighbor)  # Mark when queued, not after expansion.
            pending.append(neighbor)
print("reachable from doc 0", visit_order)
```

<!-- leetllm: output:start -->
```text title="Output" output compact
neighbors of doc 0 [2]
reachable from doc 0 [0, 2]
```
<!-- leetllm: output:end -->

The first printout `[2]` exposes one edge. The second shows a bounded traversal: doc 2's reverse link reaches doc 0, but doc 0 is already discovered and isn't queued again. Marking a node when it's queued also prevents several parents from adding duplicate pending work before that node is processed. With a fixed graph, each reachable node enters this queue once.

If a traversal can encounter `0 -> 2 -> 0`, it needs a `visited` set. Without one, the search can loop forever. Graph cost depends on representation: an adjacency list stores outgoing neighbors compactly for sparse links, while a <span data-glossary="matrix">matrix</span> makes every possible pair explicit. Representation follows the density and operation of the links.

### A trie follows one symbol per edge

A <span data-glossary="trie">trie</span>, also called a prefix tree, organizes strings by shared prefixes. If the product asks "what completions start with `fo`?", shared characters should be traversed once. Allowed terms `fox`, `food`, and `fog` share the path `f -> o`, then branch:

```text title="term-prefix-trie.txt"
(root)
└── f
    └── o
        ├── x              fox [end]
        ├── o -> d         food [end]
        └── g              fog [end]
```

Looking up prefix `fo` follows two edges from the empty root before enumerating matching suffixes. An end marker distinguishes a complete term from a prefix: if `fox` were also a prefix of a longer allowed term, its node would still need an end marker even though it had children. Reaching the prefix depends on prefix length, not on how many unrelated words exist. Returning completions still costs time to traverse and produce those matches. Tries can use substantial memory for nodes and child links, so compressed variants merge unbranched paths.

Prefix trees answer "what strings start with this prefix?" Graphs model dependencies and knowledge links. Trees model module, configuration, and taxonomy hierarchies. The shape still follows the operation, even when several shapes can represent the same records.

## Compare the work each operation does

<span data-glossary="big-o-notation">Big-O</span> describes how an upper bound on work grows with input size. `O(1)` stays bounded as the collection grows; `O(n)` grows linearly. `O(log n)` grows slowly: doubling the input adds only a constant number of steps for a balanced-tree lookup. These labels don't predict wall-clock time. The later [complexity lesson](/learn/algorithms-complexity-ml-engineers) develops the notation more carefully.

In this table, `n` is items in a structure, `m` is scored candidates, `k` is retained winners, `V` is graph vertices, `E` is graph edges, and `p` is prefix length. The bounds assume bounded-cost key comparisons and hashes; reading a long string key has its own cost.[^cormen2009]

Use the table to compare operations, not to crown one structure fastest. A list index is cheap when the position is known. A list scan is cheap to write but grows with every item. The right row depends on the question that dominates your workload.

| structure and operation | typical cost | caveat |
|---|---:|---|
| Python list index | `O(1)` | position must already be known |
| Python list append | amortized `O(1)` | occasional resize copies references |
| Python list scan or front insert/delete | `O(n)` | scan checks items; front mutation shifts references |
| Python dict lookup / set membership | expected `O(1)` | worst case is `O(n)`; keys need stable hashes |
| deque append / `popleft()` | `O(1)` | middle access is `O(n)` |
| heap root peek | `O(1)` | only root is guaranteed best or weakest |
| heap push or pop | `O(log n)` | heap list isn't globally sorted |
| bounded top-`k` over `m` candidates | `O(m log k)` time, `O(k)` extra space for `2 <= k <= m` | `k=1` takes a linear scan; full sorting may be simpler when `k` is close to `m` |
| balanced search-tree lookup | `O(log n)` | an unbalanced tree may degrade to `O(n)` |
| breadth-first or depth-first graph traversal | `O(V + E)` with adjacency lists | traversal still needs a visited set when cycles are possible |
| trie prefix descent | `O(p)` before output | assumes constant or expected-constant child-edge lookup; completions add output cost |

The retriever has more than one cost. Expected dictionary lookup reaches each posting set quickly, but it still scans returned postings. A common term may appear in almost every document. If `m` candidates receive scores, bounded selection adds `O(m log k)` work for `2 <= k <= m`. The `scores` dictionary also holds up to `m` entries, so the lab's total query memory includes those scores as well as the heap's `O(k)` storage. Constant-time key lookup never makes the whole query constant-time.

## Diagnose the wrong shape

The first working loop often feels good enough, so it stays even after it becomes slow, duplicated, stale, or impossible to finish. Diagnose the operation before choosing a structure:

| Symptom | Likely cause | Fix |
|---|---|---|
| query gets slower as documents grow | the code still scans the whole list per query | build an index keyed by the query field |
| same document appears more than once | a list was used where uniqueness matters | store posting lists as sets |
| FIFO worker slows as queue grows | code repeatedly calls `list.pop(0)` | use `deque.append()` with `deque.popleft()` |
| heap output looks partly out of order | code assumes every heap position is sorted | trust the root invariant or explicitly sort final winners |
| old jobs starve | work is being popped in the wrong order | use a FIFO queue and test the order explicitly |
| cached result looks right until documents change | cache has no version or invalidation rule | tie the cache key to corpus updates |
| cache memory keeps growing | dictionary has no size or byte bound | add an eviction budget and measure it |
| graph traversal never finishes | a cycle revisits the same nodes | record visited nodes in a set |
| prefix lookup is fast but returning results is slow | trie walk is cheap, but completion set is large | cap output or rank completions separately |
| ranking feels mysterious | scores are hidden inside loops | print one query's per-document score table |

The fastest way to debug is still the same: trace one tiny example by hand. Make the operation and its promise visible before changing the container.

## Check the structures when the ranking looks right

The final ranking can look right while an intermediate promise is broken. These tests check the structures as well as the result:

<!-- leetllm: test, continue=cache-freshness, id=retriever-tests, output=show -->
```python title="protect-the-promises-with-tests.py"
from collections import deque

def test_red_lookup_has_two_docs():
    assert index["red"] == {0, 2}

def test_empty_query_returns_empty_list():
    assert search("") == []

def test_indexed_search_matches_ranked_scan():
    for query in ["red fox", "red", "Red FOX", "red red fox", "otter", ""]:
        ranked = sorted(slow_search(query), key=lambda item: (-item[1], item[0]))
        for k in [0, 1, 2, 5]:
            assert search(query, k) == [doc_id for doc_id, _score in ranked[:k]]

def test_search_normalizes_case():
    assert search("Red FOX") == [2, 0]

def test_queue_is_fifo():
    jobs = deque(["doc-3", "doc-4"])
    assert jobs.popleft() == "doc-3"

def test_graph_cycle_is_bounded_by_visited_set():
    links = {0: {2}, 2: {0}}
    visited: set[int] = {0}
    pending = deque([0])
    while pending:
        doc_id = pending.popleft()
        for neighbor in links.get(doc_id, set()):
            if neighbor not in visited:
                visited.add(neighbor)
                pending.append(neighbor)
    assert visited == {0, 2}

test_red_lookup_has_two_docs()
test_empty_query_returns_empty_list()
test_indexed_search_matches_ranked_scan()
test_search_normalizes_case()
test_queue_is_fifo()
test_graph_cycle_is_bounded_by_visited_set()
print("six structural tests passed")
```

<!-- leetllm: output:start -->
```text title="Output" output compact
six structural tests passed
```
<!-- leetllm: output:end -->

Each test checks one promise:

- the index maps terms to the right documents
- empty input is predictable
- indexed ranking matches the scan, including ties, unknown terms, repeated terms, and different result limits
- query normalization is consistent
- queue order stays first-in, first-out
- graph traversal terminates across a cycle

## Trace operations on paper

Work through each trace below before checking the solution sketches, naming the structure that keeps the step cheap or safe:

1. Add a fourth document with `docs.append("red fox runs")`, then rebuild with `index = build_index(docs)`.
2. Trace `sorted(index["red"])`.
3. Trace `search("red fox")`.
4. Run `search("otter")` and explain why it shouldn't crash.
5. Change document 2 so it no longer contains `red`, then explain what must happen to the cache.
6. Choose a structure for each new requirement: autocomplete the prefix `fo`; represent notes with several cross-links; process oldest upload first.
7. Explain why a min-heap isn't a sorted list and why a heap isn't a binary search tree.

### Solution sketches

Use these to check your reasoning, not to skip the exercise.

| Practice item | What a good answer should show |
|---|---|
| Add `red fox runs` | `red` and `fox` both gain the new document ID. |
| Trace `sorted(index["red"])` | `[0, 2, 3]` after the new document is added. |
| Trace `search("red fox")` | `[2, 3]`. Documents 2 and 3 tie with score 2, so the lower document ID wins the deterministic tie-break. |
| Query `otter` | `index.get(term, set())` returns an empty set, so the function returns `[]` instead of crashing. |
| Change document 2 | Rebuild the affected posting lists and advance the corpus version used in cache keys. Remove obsolete entries through cleanup or eviction. |
| Prefix, cross-links, oldest upload | Use a trie, graph, and deque, respectively. Each requirement asks for a different path or order. |
| Heap distinctions | Only heap root satisfies the global minimum rule. A binary search tree instead orders left and right subtrees to support arbitrary key search. |

If an answer is hard to check, go back to the score table and trace the exact work each operation performs before code hides it.

## Hand the promises to durable storage

The inverted index, deque, and versioned cache you built live in one process. Close the process and they're gone. Share them across two workers and you also need identity, uniqueness, and freshness that survive a restart.

A list is for position, a hash map for identity, a deque for oldest work, a heap for the weakest retained result, and a trie for a prefix. Those promises are still local to one process. Two processes that must return the same lookup after a restart need those promises stored where the restart cannot erase them.

```mastery-quiz
[
  {
    "question": "An authored dynamic array has size 4 and capacity 4. It doubles capacity when full. Append one item, append another, and then insert at the front. Count movements of pre-existing references only, excluding stores of incoming references. How many movements occur?",
    "options": [
      "4",
      "6",
      "12",
      "10"
    ],
    "answer": "10",
    "explanation": "The first append copies 4 old references; the second needs no resize. Before front insertion there are 6 existing references, all shifted once. Total 4+0+6=10. Counting just one operation or adding incoming-item stores changes the requested count."
  },
  {
    "question": "Two unequal hashable keys `orbit` and `comet` both have assigned hash 7. Their values are respectively {10, 11} and {12}. A Python dictionary stores the original keys, with equality comparing their full strings. Which pair of lookups orbit/comet follows?",
    "options": [
      "{12} / {12}",
      "{10, 11} / {12}",
      "{10, 11, 12} / {10, 11, 12}",
      "{10, 11} / {10, 11}"
    ],
    "answer": "{10, 11} / {12}",
    "explanation": "Equal hashes narrow a search but do not make unequal keys equal. Original-key equality preserves two entries and their separate values. Storing the hash number as the key instead would overwrite one entry; combining posting sets would change term semantics."
  },
  {
    "question": "Three records are D4=\"amber amber cloud\", D7=\"cloud\" and D9=\"amber rain\". Score one point per distinct case-normalized query term present, return top 2 and break ties by lower ID. For query \"AMBER amber cloud\", which IDs follow?",
    "options": [
      "[4,9]",
      "[7,9]",
      "[4,7]",
      "[4,4]"
    ],
    "answer": "[4,7]",
    "explanation": "The query set is {amber, cloud}. D4 scores 2; D7 and D9 score 1. Return D4 then the lower tied ID D7. Repeated occurrences do not duplicate a document or add another binary-query point."
  },
  {
    "question": "A top-3 min-heap retains keys (2, -4), (3, -8), (3, -1), using (score, -ID) so lower IDs win ties. Candidate D6 with key (2, -6) arrives, then D2 with key (2, -2). Which eviction sequence follows?",
    "options": [
      "No eviction, then D4 leaves.",
      "D4 leaves, then D6 leaves.",
      "D8 leaves, then no eviction.",
      "No eviction, then D8 leaves."
    ],
    "answer": "No eviction, then D4 leaves.",
    "explanation": "The initial root is (2, -4). D6 is weaker because -6 < -4, so discard it. D2 is stronger because -2 > -4, so replace D4. Calling heapreplace unconditionally would eject the retained root even for the weaker candidate."
  },
  {
    "question": "An LRU cache holds three entries in least-to-most-recent order [A, B, C]. It reads A, then inserts D under the same three-entry budget. What least-to-most-recent order remains?",
    "options": [
      "[B, C, D]",
      "[A, C, D]",
      "[C, A, D]",
      "[D, C, A]"
    ],
    "answer": "[C, A, D]",
    "explanation": "The hit moves A to the most-recent end, producing [B, C, A]. Inserting D evicts the least-recent B, leaving [C, A, D]. An insertion-only dictionary would wrongly evict A; the read is a recency update, not just a value lookup."
  },
  {
    "question": "A deque(maxlen=2) and a synchronized Queue(maxsize=2) both contain oldest A then B. Each receives a nonblocking call to append/put C while full. Which retained-state and enqueue pair follows?",
    "options": [
      "Deque [A, B]; Queue accepts C.",
      "Deque [B, C]; Queue rejects C and retains [A, B].",
      "Deque [A, C]; Queue rejects C and retains [A, B].",
      "Deque [B, C]; Queue accepts C and retains [B, C]."
    ],
    "answer": "Deque [B, C]; Queue rejects C and retains [A, B].",
    "explanation": "A full bounded deque drops the opposite end on append, so A is lost. Queue.put_nowait raises Full while preserving A/B; the producer still owns unaccepted C. Neither outcome claims durable processing or completion."
  },
  {
    "question": "A directed graph has S→A, S→B, A→C, B→C, C→S. Breadth-first traversal starts with S queued and discovered, and marks every new vertex when enqueuing it. Neighbors are visited in the written order. Which enqueue trace follows?",
    "options": [
      "S, A, B, C, C",
      "S, A, B, C, S",
      "S, A, C, B",
      "S, A, B, C"
    ],
    "answer": "S, A, B, C",
    "explanation": "After S, A and B enter once. Expanding A queues C and marks it; B then sees C already discovered. The back edge sees S already discovered. Queue and set serve different roles; marking only after expansion can permit duplicate pending C."
  },
  {
    "question": "The three-node tree stored as array [1, 7, 3] has root 1, left child 7 and right child 3. Which min-heap/BST verdict follows under strict distinct-key BST ordering?",
    "options": [
      "Valid min-heap / invalid BST.",
      "Invalid min-heap / valid BST.",
      "Valid min-heap / valid BST.",
      "Invalid min-heap / invalid BST."
    ],
    "answer": "Valid min-heap / invalid BST.",
    "explanation": "The parent 1 is no greater than either child, so the min-heap invariant holds. BST ordering fails because left child 7 is greater than root 1. Sibling order 7 then 3 need not be sorted in a heap."
  },
  {
    "question": "Two distinct query-term posting sets contain 4 and 5 document IDs, with 3 IDs in both. Scoring visits each posting and keeps one score counter per distinct document. Before top-k selection, which posting-visits/counter-count pair follows?",
    "options": [
      "6 / 6",
      "2 / 6",
      "9 / 9",
      "9 / 6"
    ],
    "answer": "9 / 6",
    "explanation": "Every posting is visited: 4+5=9. The union has 4+5-3=6 IDs, so six keyed counters suffice. Constant expected dictionary lookup reaches a posting set; it does not eliminate posting iteration or make heap storage the entire query-memory bill."
  },
  {
    "question": "A query scores D8=4, D3=3, D6=2. The caller may read only D3 and D6 and asks for top 2. A cached global top-2 tuple is [D8, D3]. Which post-filtered-global result / permission-first result follows?",
    "options": [
      "[3,6] / [3,6]",
      "[3] / [3,6]",
      "[3] / [8,3]",
      "[8,3] / [3,6]"
    ],
    "answer": "[3] / [3,6]",
    "explanation": "Removing forbidden D8 from the global pair leaves only D3. Filtering all scored candidates before selection allows D6 to fill the second requested slot. A request-local copy repairs mutation ownership but does not repair this post-filter ordering."
  }
]
```

> **Next:** Continue to [SQL and Data Modeling](/learn/sql-databases-data-modeling-ai). The in-memory structures stay inside one process and vanish when that process exits. Durable tables, constraints, joins, and transactions let a second worker share the same lookup after a restart, and pgvector keeps similarity search beside those checks.
