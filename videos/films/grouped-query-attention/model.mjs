import { HEADS } from './fixtures.mjs';
export const groupSize = (queryHeads, kvHeads) => queryHeads / kvHeads;
export const kvGroupForQuery = (queryHead, queryHeads = HEADS.queries, kvHeads = HEADS.gqaKV) =>
  Math.floor(queryHead / groupSize(queryHeads, kvHeads));
export const cacheBytes = ({
  layers = HEADS.layers,
  batch = HEADS.batch,
  tokens = HEADS.tokens,
  kvHeads,
  width = HEADS.width,
  bytes = HEADS.bytes,
}) => 2 * layers * batch * tokens * kvHeads * width * bytes;
export const physicalHeads = (queries, kv, ranks) => {
  if (![queries, kv, ranks].every((x) => Number.isInteger(x) && x > 0)) return null;
  if (queries % kv || queries % ranks || (ranks <= kv ? kv % ranks : ranks % kv)) return null;
  return {
    queriesPerRank: queries / ranks,
    kvPerRank: Math.max(1, kv / ranks),
    copies: ranks * Math.max(1, kv / ranks),
    replicas: Math.max(1, ranks / kv),
  };
};
export const meanVisible = (values) => values.reduce((a, b) => a + b, 0) / values.length;
