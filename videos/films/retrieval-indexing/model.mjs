import { GAP_IDS, RELEVANT } from './fixtures.mjs';
import { POSTINGS, QUERY_INTERSECTION, TERMS, TOKENS, countsGrid } from './analysis.mjs';
import { AVERAGE_LENGTH, DOC_FREQUENCY, RANKING, bm25, idf } from './scoring.mjs';
import { LEXICAL_TOP_TWO, RECALL_AT_TWO, SECOND_LANE_UNION, TOP_K_TRACE } from './selection.mjs';
import { GAP_VALUES } from './storage.mjs';
import { createCueTrack } from 'vizmatic';
export const sceneSnapshots = {
  postings: [
    {
      counts: countsGrid,
      focus: 0,
      label: 'term counts in d1',
    },
    {
      counts: countsGrid,
      focus: 3,
      label: 'term counts in d4',
    },
    {
      counts: countsGrid,
      focus: -1,
      label: 'all posting lists',
      postings: POSTINGS,
    },
  ],
  query: [
    {
      mode: 'single',
      term: TERMS[0],
      list: POSTINGS[TERMS[0]],
      combined: POSTINGS[TERMS[0]],
      missing: 'd2',
    },
    {
      mode: 'pair',
      term: `${TERMS[0]} + ${TERMS[1]}`,
      list: POSTINGS[TERMS[0]],
      other: POSTINGS[TERMS[1]],
      combined: [...new Set([...POSTINGS[TERMS[0]], ...POSTINGS[TERMS[1]]])],
      intersection: QUERY_INTERSECTION,
      missing: 'd2',
    },
    {
      mode: 'merge',
      term: 'OR merge',
      list: POSTINGS[TERMS[0]],
      other: POSTINGS[TERMS[1]],
      combined: [...new Set([...POSTINGS[TERMS[0]], ...POSTINGS[TERMS[1]]])],
      intersection: QUERY_INTERSECTION,
      missing: 'd2',
      work: {
        entries: [POSTINGS[TERMS[0]].length, POSTINGS[TERMS[1]].length],
        scanned: POSTINGS[TERMS[0]].length + POSTINGS[TERMS[1]].length,
      },
    },
  ],
  bm25: [
    {
      docId: 'd1',
      term: TERMS[0],
      ...bm25('d1'),
      df: DOC_FREQUENCY[TERMS[0]],
      idf: idf(TERMS[0]),
      averageLength: AVERAGE_LENGTH,
      lengthFactor: 1 - 0.75 + (0.75 * TOKENS.d1.length) / AVERAGE_LENGTH,
    },
    {
      docId: 'd1',
      term: TERMS[1],
      ...bm25('d1'),
      df: DOC_FREQUENCY[TERMS[1]],
      idf: idf(TERMS[1]),
      averageLength: AVERAGE_LENGTH,
      lengthFactor: 1 - 0.75 + (0.75 * TOKENS.d1.length) / AVERAGE_LENGTH,
    },
    {
      docId: 'd1',
      term: 'total',
      ...bm25('d1'),
      df: DOC_FREQUENCY[TERMS[1]],
      idf: idf(TERMS[1]),
      averageLength: AVERAGE_LENGTH,
      lengthFactor: 1 - 0.75 + (0.75 * TOKENS.d1.length) / AVERAGE_LENGTH,
    },
  ],
  ranking: [
    {
      ranking: RANKING,
      relevant: RELEVANT,
      selected: 0,
    },
    {
      ranking: RANKING,
      relevant: RELEVANT,
      selected: 3,
    },
    {
      ranking: RANKING,
      relevant: RELEVANT,
      selected: -1,
    },
  ],
  'top-k': TOP_K_TRACE.map((row, index) => ({
    ...row,
    index,
    k: 2,
  })),
  storage: [
    {
      ids: GAP_IDS,
      gaps: GAP_VALUES,
      mode: 'ids',
    },
    {
      ids: GAP_IDS,
      gaps: GAP_VALUES,
      mode: 'gaps',
    },
    {
      ids: GAP_IDS,
      gaps: GAP_VALUES,
      mode: 'decoded',
    },
  ],
  evaluation: [
    {
      selected: LEXICAL_TOP_TWO,
      relevant: RELEVANT,
      recall: RECALL_AT_TWO,
      lane: 'sparse',
    },
    {
      selected: SECOND_LANE_UNION,
      relevant: RELEVANT,
      recall: SECOND_LANE_UNION.filter((id) => RELEVANT.includes(id)).length / RELEVANT.length,
      lane: 'illustrative second lane',
    },
    {
      selected: SECOND_LANE_UNION,
      relevant: RELEVANT,
      recall: SECOND_LANE_UNION.filter((id) => RELEVANT.includes(id)).length / RELEVANT.length,
      lane: 'evaluate on judged queries',
    },
  ],
};
export function makeTrack(sceneId, snapshots) {
  return createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
}
export const TRACKS = Object.fromEntries(
  Object.entries(sceneSnapshots).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
