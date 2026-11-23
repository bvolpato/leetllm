import {
  LEARNING_UNKNOWN_REPORT_AT,
  SEARCH_FOUR_CANDIDATES_AT,
  SEARCH_UNSAFE_ACTION_AT,
  sceneIds,
} from './fixtures.mjs';
import { sceneSnapshot, searchState } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: id + '-initial',
        snapshot: {
          step: 0,
        },
      },
      cues:
        id === 'learning'
          ? [
              {
                id: 'learning-unknown-report',
                beat: 1,
                at: LEARNING_UNKNOWN_REPORT_AT,
                snapshot: {
                  step: 1,
                },
              },
              {
                id: 'learning-reviewed-correction',
                beat: 2,
                at: 0,
                snapshot: {
                  step: 2,
                },
              },
            ]
          : id === 'search'
            ? [
                {
                  id: 'search-two-candidates',
                  beat: 1,
                  at: 0,
                  snapshot: {
                    step: 1,
                  },
                },
                {
                  id: 'search-four-candidates',
                  beat: 1,
                  at: SEARCH_FOUR_CANDIDATES_AT,
                  snapshot: {
                    step: 2,
                  },
                },
              ]
            : [1, 2].map((step) => ({
                id: id + '-' + step,
                beat: step,
                at: 0,
                snapshot: {
                  step,
                },
              })),
    }),
  ]),
);
export function sampleModel(sceneId, state) {
  const sampled = tracks[sceneId].sample(state).snapshot.step;
  const snapshot = sceneSnapshot(sceneId, sampled);
  if (sceneId === 'search') {
    const beat = state.beat ?? 0;
    if (
      state.cues?.['search-four-candidates'] &&
      state.cues['search-four-candidates'].phase !== 'before'
    )
      Object.assign(snapshot, searchState(2));
    snapshot.unsafeVisible =
      beat > 2 || (beat === 2 && (state.beatP ?? 0) >= SEARCH_UNSAFE_ACTION_AT);
  }
  if (sceneId === 'serving-break-even') {
    const p = sampled > (state.beat ?? 0) ? 0 : Math.max(0, Math.min(1, state.beatP ?? 0));
    snapshot.q =
      sampled < 2
        ? 0
        : p < 0.5
          ? 165e9 * Math.max(0, (p - 0.08) / 0.42)
          : p < 0.78
            ? 165e9
            : 165e9 + 35e9 * Math.min(1, (p - 0.78) / 0.16);
    snapshot.largeTotal = snapshot.large.train + 2 * snapshot.large.parameters * snapshot.q;
    snapshot.smallTotal = snapshot.small.train + 2 * snapshot.small.parameters * snapshot.q;
    snapshot.difference = snapshot.smallTotal - snapshot.largeTotal;
  }
  return snapshot;
}
