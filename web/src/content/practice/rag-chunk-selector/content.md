Search can return the same fact in several chunks, or crowd the context with passages from one source. Select <span data-glossary="rag">retrieval-augmented generation (RAG)</span> chunks by rank while limiting repeated text and how many chunks come from one document.

## Requirements

- Define `select_chunks(chunks, k, max_per_doc=2)`.
- Each chunk is a dict with `id`, `doc_id`, `text`, and `score`.
- Return selected chunk IDs.
- Higher `score` wins.
- Ties sort by `id` alphabetically.
- Skip chunks whose normalized text was already selected.
- Normalized text is lowercase with whitespace collapsed.
- Select at most `max_per_doc` chunks per document.
- Return an empty list when `k <= 0` or `max_per_doc <= 0`.

## Example

```python
chunks = [
    {"id": "a", "doc_id": "d1", "text": "Hello world", "score": 0.9},
    {"id": "b", "doc_id": "d2", "text": "hello   world", "score": 0.8},
]
assert select_chunks(chunks, 2) == ["a"]
```

## Constraints

- Don't mutate input chunks.
- Use deterministic ordering.
- Empty or whitespace-only text can still be selected once.
- All fields are present. Chunk IDs are unique, case-sensitive ASCII strings; document IDs and text are strings. Scores are finite numbers, and `k` and `max_per_doc` are integers.
- Return IDs in rank order. Scan that order greedily until `k` chunks are selected or candidates run out. Skipping a chunk leaves both the document and normalized-text slots available.

For example, with a one-chunk document limit, select a top-ranked chunk from `d1`, skip a second `d1` chunk with text `"shared fact"`, then allow a lower-ranked `d2` chunk with the same text. The skipped text was never selected. This greedy policy enforces diversity constraints; maximizing the total score across all possible selections requires a different algorithm.
