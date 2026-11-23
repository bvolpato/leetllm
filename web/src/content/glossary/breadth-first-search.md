---
title: Breadth-first search
aliases: ["BFS"]
importance: 76
---

Breadth-first search (BFS) explores a graph one distance layer at a time. It begins at a starting node, visits that node's immediate neighbors, then visits the neighbors of those neighbors. A first-in, first-out work queue preserves this order. In an unweighted graph, the first time a node is discovered determines a shortest path in number of edges, provided each node is claimed before it can be queued again.

## Queue order and the visited invariant

Maintain a queue of discovered work plus a `visited` set. Remove one node from the front, inspect its outgoing neighbors, and add each previously unseen neighbor to the back. Mark a neighbor visited when it is enqueued, not after an expensive network fetch. Otherwise two parents can queue the same destination, and concurrent workers can repeat a side effect.

With adjacency lists and constant-time visited checks, traversal costs $O(V+E)$ time and $O(V)$ space. An adjacency matrix instead requires scanning whole rows. Parallel fetches need more than an atomic visited set to preserve shortest-distance layers: a fast deeper branch can claim a node before a slower shallower branch. Use layer barriers or distance relaxation if shortest paths are required.

## Example

A crawler starts at `/`, whose same-host links are `/tests` and `/ci`. The `/tests` page also links to `/ci`. Queueing both children immediately and claiming each URL under one lock produces the visitation sequence `/`, `/tests`, `/ci`; the second reference to `/ci` is ignored. If workers mark URLs visited only after fetching, both the root worker and `/tests` worker can fetch `/ci`, violating the one-fetch contract.

## Why it matters here

The coding-interview lesson uses BFS to test state ownership under changing requirements: same-host filtering, cancellation, retries, rate limiting, and worker fanout. The algorithm matters less than the invariant those features must preserve. A polished threaded implementation that claims after the network call can be slower, duplicate work, and fail hidden tests even when its sequential output initially appears correct.

## Related terms

- [FIFO work queue](glossary://fifo-work-queue)
- [Depth-first search](glossary://depth-first-search)
- [Thread safety](glossary://thread-safety)
- [Rate limit](glossary://rate-limit)
