import { clamp, phase } from './arithmetic.mjs';
import { cases, facts, good, newPass, oldPass, sceneIds, spans } from './fixtures.mjs';
import { promptSections, responseChecks, triageDecision } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  sceneIds.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          beat: 0,
        },
      },
      cues: [0, 1, 2].map((beat) => ({
        id: `${id}-${beat}`,
        beat,
        at: 0,
        snapshot: {
          beat,
        },
      })),
    }),
  ]),
);
export function clockElapsed(beat, p) {
  if (beat === 0) return 12;
  if (beat === 2) return 31;
  const seconds = p * spans.clock;
  if (seconds >= 8.5875) return 31;
  return Math.min(30, 12 + Math.floor(phase(seconds, 0.1, 5.3125) * 18));
}
export function assembledResponse(beat, p) {
  const seconds = p * (beat === 0 ? spans.response : beat === 1 ? spans.checks : spans.wrong);
  const fieldCount =
    beat === 0 ? [2.7875, 3.675, 4.6, 6.0875].filter((at) => seconds >= at).length : 4;
  const complete = beat > 0 || seconds >= 11.575;
  const wrong = beat === 2 && seconds >= 1.6125;
  const current = {
    ...good,
    deadline_minutes: wrong ? 90 : 30,
  };
  const lines = JSON.stringify(current, null, 2).split('\n');
  const displayed = complete
    ? lines
    : [
        '{',
        ...Object.entries(current)
          .slice(0, fieldCount)
          .map(
            ([key, value], index) =>
              `  ${JSON.stringify(key)}: ${JSON.stringify(value)}${index < 3 ? ',' : ''}`,
          ),
      ];
  const raw = complete ? JSON.stringify(current) : displayed.join('\n');
  const checkCount =
    beat === 0
      ? 0
      : beat === 1
        ? [1.1875, 3.6375, 8.3].filter((at) => seconds >= at).length
        : wrong && seconds < 6.8875
          ? 2
          : 3;
  return {
    fieldCount,
    complete,
    wrong,
    current,
    displayed,
    raw,
    checks: responseChecks(raw),
    checkCount,
  };
}
export function regressionState(beat, p) {
  const inspected =
    beat === 0
      ? 0
      : beat === 1
        ? Math.min(6, Math.ceil(phase(p * spans.regression, 0.1, 4.1) * 6))
        : 6;
  return pairedResults(inspected);
}
export function pairedResults(inspected) {
  const rows = cases.slice(0, inspected).map((name, i) => ({
    name,
    old: oldPass[i],
    next: newPass[i],
  }));
  return {
    inspected,
    rows,
    oldTotal: rows.filter((x) => x.old).length,
    newTotal: rows.filter((x) => x.next).length,
  };
}
export function sampleModel(id, state) {
  const beat = tracks[id].sample({
    ...state,
    beatP: Math.min(0.999999, state.beatP ?? 0),
  }).snapshot.beat;
  const p = clamp(state.beatP ?? 0);
  const elapsed = clockElapsed(beat, p);
  const wording = state.cues?.['revision-wording'];
  const revised = wording
    ? wording.phase !== 'before'
    : beat === 2 || (beat === 1 && p * spans.revision >= 1.375);
  return {
    beat,
    p,
    elapsed,
    decision: triageDecision({
      ...facts,
      elapsed,
    }),
    sections: promptSections(revised),
    revised,
    sectionCount:
      id === 'prompt-assembly'
        ? beat === 0
          ? p * spans.assembly >= 8.4125
            ? 2
            : 1
          : beat === 1
            ? 3
            : 4
        : 4,
    response: assembledResponse(beat, p),
    regression: regressionState(beat, p),
  };
}
