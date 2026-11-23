---
title: Query plan
importance: 88
---
A **query plan** describes the operations a database chooses to execute a SQL statement. Depending on its statistics and available indexes, the planner may scan a complete table, seek an index, join filtered rows in a particular order, sort results, or aggregate groups. Inspect the plan to see which path the engine selected for a given query and dataset.

SQLite exposes candidate operations through `EXPLAIN QUERY PLAN`. PostgreSQL's `EXPLAIN` reports an estimated plan, while `EXPLAIN ANALYZE` executes the query and includes observed row counts and timing. Because the latter really runs the statement, analyzing a write can cause side effects unless it is safely isolated or rolled back.

## Inspect access work alongside elapsed time

If seven permission rows exist and four belong to one agent, an index on `(principal, chunk_id)` can let the database begin with those four rows instead of scanning all seven. Workspace and validity checks must still remove unauthorized or retired matches. The index changes access cost while the query retains its authorization checks.

## Example

```sql
EXPLAIN QUERY PLAN
SELECT chunk_id
FROM chunk_permissions
WHERE principal = 'agent:u3';
```

After creating an index beginning with `principal`, inspect whether the reported plan uses that index. Verify with representative data because tiny fixtures and production distributions can produce different plans.

## Why it matters here

Retrieval queries combine tenant scope, permissions, version validity, ranking, and vector search. Query plans expose which filters execute efficiently and help teams improve latency without weakening correctness or cross-tenant isolation.

## Related terms

- [SQL](glossary://sql)
- [PostgreSQL](glossary://postgresql)
- [Latency budget](glossary://latency-budget)
- [HNSW](glossary://hnsw)
