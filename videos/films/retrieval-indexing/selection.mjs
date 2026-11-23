import { FIXTURE_RERANK_SCORES, RELEVANT } from './fixtures.mjs';
import { RANKING, SCORES } from './scoring.mjs';
export const rerankFixture = (ids) =>
  [...ids].sort((a, b) => FIXTURE_RERANK_SCORES[b] - FIXTURE_RERANK_SCORES[a]).slice(0, 2);
export function weaker(left, right) {
  return left.score < right.score || (left.score === right.score && left.docNo > right.docNo);
}
export function heapPush(heap, item) {
  heap.push(item);
  let index = heap.length - 1;
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (!weaker(heap[index], heap[parent])) break;
    [heap[index], heap[parent]] = [heap[parent], heap[index]];
    index = parent;
  }
}
export function heapReplaceRoot(heap, item) {
  heap[0] = item;
  let index = 0;
  while (true) {
    const left = index * 2 + 1,
      right = left + 1;
    let weakest = index;
    if (left < heap.length && weaker(heap[left], heap[weakest])) weakest = left;
    if (right < heap.length && weaker(heap[right], heap[weakest])) weakest = right;
    if (weakest === index) break;
    [heap[index], heap[weakest]] = [heap[weakest], heap[index]];
    index = weakest;
  }
}
export function topKTrace(k = 2) {
  const heap = [];
  const trace = [];
  for (const result of SCORES) {
    const item = {
      ...result,
      docNo: Number(result.docId.slice(1)),
    };
    let action;
    if (heap.length < k) {
      heapPush(heap, item);
      action = 'insert';
    } else if (weaker(heap[0], item)) {
      const evicted = heap[0].docId;
      heapReplaceRoot(heap, item);
      action = `replace ${evicted}`;
    } else {
      action = `discard ${item.docId}`;
    }
    trace.push({
      incoming: item.docId,
      score: item.score,
      action,
      root: heap[0]?.docId ?? null,
      heap: [...heap]
        .sort((a, b) => b.score - a.score || a.docNo - b.docNo)
        .map((candidate) => candidate.docId),
    });
  }
  return trace;
}
export const TOP_K_TRACE = Object.freeze(topKTrace());
export const LEXICAL_TOP_TWO = Object.freeze(RANKING.slice(0, 2).map((result) => result.docId));
export const RECALL_AT_TWO =
  LEXICAL_TOP_TWO.filter((id) => RELEVANT.includes(id)).length / RELEVANT.length;
export const SECOND_LANE_UNION = Object.freeze([...new Set([...LEXICAL_TOP_TWO, 'd2'])]);
