import {
  FFN,
  FFN_CUT,
  HEAD_CUT,
  HEAD_SCORES,
  IDS,
  MODULE_RATIO,
  MODULE_SCORES,
  RANK_RATIO,
  RANK_SCORES,
  TOKEN_COST,
} from './fixtures.mjs';
import { keepAbove } from './arithmetic.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  IDS.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          stage: 0,
        },
      },
      cues: [0, 1, 2].map((stage) => ({
        id: id + '-stage-' + stage,
        beat: stage,
        at: 0,
        snapshot: {
          stage,
        },
      })),
    }),
  ]),
);
export const HEAD_SELECTION = keepAbove(HEAD_SCORES, HEAD_CUT);
export const FFN_SELECTION = keepAbove(
  FFN.map((row) => row.score),
  FFN_CUT,
);
export const MODULE_SELECTION = keepAbove(MODULE_SCORES, MODULE_RATIO);
export const RANK_SELECTION = keepAbove(RANK_SCORES, RANK_RATIO);
export const DENSE_PAIRS_PER_TOKEN = Object.values(TOKEN_COST).reduce(
  (sum, value) => sum + value,
  0,
);
export const ADAPTER_PAIRS_AT_RANK_ONE = 8 * 1 + 1 * 8;
