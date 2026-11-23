import { documents } from './fixtures.mjs';
import { dcg, localNdcg, rankScore } from './arithmetic.mjs';
export const eligible = documents.filter((item) => item.current && item.permitted);
export const retrievalOrder = [...eligible].sort((a, b) => b.retrieval - a.retrieval);
export const ranked = [...eligible].sort((a, b) => rankScore(b) - rankScore(a));
export const idealGrades = [...eligible.map((item) => item.relevance)].sort((a, b) => b - a);
export const ndcg = (grades) => dcg(grades) / dcg(idealGrades.slice(0, grades.length));
export const candidateRecall = (limit) => {
  const relevant = new Set(eligible.filter((item) => item.relevance > 0).map((item) => item.id));
  const found = retrievalOrder.slice(0, limit).filter((item) => relevant.has(item.id)).length;
  return found / relevant.size;
};
export const retrievalTopThreeGrades = retrievalOrder.slice(0, 3).map((item) => item.relevance);
export const localTopThreeNdcg = localNdcg(retrievalTopThreeGrades);
export const systemTopThreeNdcg = ndcg(retrievalTopThreeGrades);
export const constrained = () => {
  const counts = new Map(),
    result = [];
  for (const item of ranked) {
    const count = counts.get(item.source) ?? 0;
    if (count >= 2 && result.length < 3) continue;
    counts.set(item.source, count + 1);
    result.push(item);
  }
  return result.slice(0, 3);
};
