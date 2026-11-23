import { clamp, pairedEvidence, smooth } from './arithmetic.mjs';
import {
  PAGINATION_BEAT_SECONDS,
  PAIR_FIXTURE,
  REPEATED_CURSOR_PAGES,
  SCENES,
  TALK_BUDGET,
} from './fixtures.mjs';
import { INCIDENT_RATES, PAIRED, SERVICE_CHECK, inspectPageTrace } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  SCENES.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-claim`,
        snapshot: {
          step: 0,
        },
      },
      cues: [
        {
          id: `${id}-evidence`,
          beat: 1,
          at: 0,
          snapshot: {
            step: 1,
          },
        },
      ],
    }),
  ]),
);
export function pairedPlayback(beat, progress, cues) {
  const p = cues ? (cues['paired-population']?.progress ?? 0) : progress / 0.68;
  const count = beat > 0 ? 200 : Math.floor(clamp(p) * 200),
    rows = PAIR_FIXTURE.slice(0, count);
  const result = count
    ? pairedEvidence(
        Object.fromEntries(rows.map((x) => [x.id, x.baseline])),
        Object.fromEntries(rows.map((x) => [x.id, x.candidate])),
      )
    : {
        n: 0,
        counts: {
          both: 0,
          baselineOnly: 0,
          candidateOnly: 0,
          neither: 0,
        },
        baselineHits: 0,
        candidateHits: 0,
      };
  return {
    ...result,
    latest: rows.at(-1) ?? null,
  };
}
export function sampleModel(sceneId, state) {
  if (!tracks[sceneId]) throw new Error(`unknown presentation scene: ${sceneId}`);
  const held = tracks[sceneId].sample({
    beat: state.beat ?? 0,
    beatP: state.beatP ?? 0,
  });
  const step = held.snapshot.step,
    q = smooth(state.beatP ?? 0);
  return {
    step,
    q,
    project: {
      sources: 8,
      onboardingBeforeDays: 20,
      onboardingAfterDays: 6,
      latencyBeforeMs: 720,
      latencyAfterMs: 680,
      latencyTargetMs: 800,
    },
    claims: ['problem', 'constraint', 'decision', 'alternative', 'evidence', 'limit'],
    paired: PAIRED,
    incidentRates: INCIDENT_RATES,
    service: SERVICE_CHECK,
    talkMinutes: TALK_BUDGET.reduce((sum, part) => sum + part.value, 0),
    talkBudget: TALK_BUDGET,
    routeProgress: step ? q : 0,
    queryHold: step ? 1 : q,
    ablation: {
      fixed: ['query IDs', 'corpus revision', 'labels', 'tenant context'],
      variable: 'connector path',
      result: 'pending measurement',
    },
    owners: {
      adapter: 'presenter owns contract + tests',
      tenantStore: 'another team owns tenant store',
    },
  };
}
export function paginationSnapshot(beat, p, cues) {
  const elapsed = clamp(p) * PAGINATION_BEAT_SECONDS;
  const cueProgress = cues?.['pagination-repeat']?.progress ?? 0;
  const count =
    beat === 0
      ? 0
      : cues
        ? Number(cueProgress >= 0.15) + Number(cueProgress >= 0.5)
        : Number(elapsed >= 2.4) + Number(elapsed >= 5.1);
  return {
    ...inspectPageTrace(REPEATED_CURSOR_PAGES.slice(0, count)),
    requestId: 'req-42',
    sourceId: 'source-8',
  };
}
export function cueProgress(state, id, beat, at = 0.5) {
  const cue = state.cues?.[id];
  if (cue) return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : clamp(cue.progress ?? 0);
  return (state.beat ?? 0) > beat
    ? 1
    : (state.beat ?? 0) < beat
      ? 0
      : clamp(((state.beatP ?? 0) - at) / 0.15);
}
export function cueDone(state, id, beat, at = 0.5) {
  return cueProgress(state, id, beat, at) >= 0.999;
}
