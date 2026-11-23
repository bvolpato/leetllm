import { clamp, phase } from './arithmetic.mjs';
import { request, sceneIds, spans } from './fixtures.mjs';
import { policyCases, runFixture, validateRequest } from './model.mjs';
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
export const completeResult = (state, id) => state.cues?.[id]?.phase === 'after';
export function requestFrame(beat, p) {
  const run = runFixture();
  const seconds = p * (beat === 1 ? spans.provider : spans.terminal);
  const index =
    beat === 0
      ? 1
      : beat === 1
        ? seconds < 8.575
          ? 2
          : 3
        : seconds < 2.525
          ? 3
          : seconds < 5.9
            ? 4
            : 5;
  return {
    run,
    index,
    current: run.journal[index],
  };
}
export function joinGeometry(progress) {
  const x = 835 + 240 * clamp(progress);
  const actor = {
    x: x - 65,
    y: 660,
    width: 130,
    height: 62,
  };
  const segments = [];
  if (actor.x - 20 > 830)
    segments.push([
      {
        x: 830,
        y: 690,
      },
      {
        x: actor.x - 20,
        y: 690,
      },
    ]);
  if (actor.x + actor.width + 20 < 1090)
    segments.push([
      {
        x: actor.x + actor.width + 20,
        y: 690,
      },
      {
        x: 1090,
        y: 690,
      },
    ]);
  return {
    actor,
    segments,
  };
}
export function openingRequestState(beat, p, cues) {
  const run = runFixture(),
    checked = cues?.['application-trace-b2-1'];
  const index = beat === 0 ? 0 : beat > 1 ? 5 : checked && checked.phase !== 'before' ? 3 : 2;
  return {
    run,
    index,
    current: run.journal[index],
    validation: index >= 3 ? run.journal[3] : null,
  };
}
export function sampleModel(id, state) {
  const beat = tracks[id].sample({
      ...state,
      beatP: Math.min(0.999999, state.beatP ?? 0),
    }).snapshot.beat,
    p = clamp(state.beatP ?? 0);
  const currentCase =
    beat === 0
      ? 0
      : beat === 1
        ? p * spans.policyKnown < 4.575
          ? 1
          : 2
        : p * spans.policyMissing < 3.825
          ? 3
          : 4;
  const cases = policyCases();
  const inspected = beat === 0 ? Math.min(5, 1 + Math.floor(phase(p, 0.05, 0.83) * 5)) : 5;
  const browser =
    beat === 0 || (beat === 1 && p * spans.browser < 0.575)
      ? 'waiting'
      : beat === 2 && p * spans.reload >= 0.575
        ? 'reloaded'
        : 'completed';
  const browserFields =
    beat === 1 ? [1.7875, 2.6375, 4.3].filter((at) => p * spans.browser >= at).length : 3;
  return {
    openingTrace: id === 'opening' ? openingRequestState(beat, p, state.cues) : null,
    beat,
    p,
    cases,
    currentCase,
    inspected,
    inspectedCases: cases.slice(0, inspected),
    trace: requestFrame(beat, p),
    browser,
    browserFields,
    failure: runFixture({
      fault: beat === 0 ? 'initial' : 'terminal',
    }),
    inputAccepted:
      validateRequest(
        beat === 2
          ? {
              ...request,
              credential_age_days: 999,
            }
          : request,
      ) === 'accepted',
    join: beat === 0 ? 0 : beat === 1 ? phase(p, 0.08, 0.8) : 1,
  };
}
