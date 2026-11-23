import { forwardWave } from '../construction.mjs';
import { spokenProgress } from '../defaults.mjs';

const globalBatch = 64;
const pairSize = 2;

function wave(ctx, api, { y, replicas, microbatches, built, time, showRatio, solo = false }) {
  const { C } = api;
  const plan = forwardWave(microbatches);
  const pitch = solo ? 345 : 126;
  const x0 = solo ? 640 : 338;
  const cellHeight = solo ? 120 : 65;
  const stepY = cellHeight + 12;
  const header = solo
    ? 'One microbatch of two examples'
    : replicas +
      ' replicas     ·     64 ÷ (' +
      replicas +
      ' × 2) = ' +
      (built ? microbatches : '?') +
      ' pairs per replica';
  api.text(ctx, header, solo ? 960 : 135, y - 41, solo ? 48 : 39, C.ink, solo ? 'center' : 'left');
  for (let stage = 0; stage < plan.stages; stage++) {
    const top = y + stage * stepY;
    api.text(
      ctx,
      stage ? 'Late layers' : 'Early layers',
      x0 - 25,
      top + cellHeight / 2 + 13,
      32,
      C.muted,
      'right',
    );
    if (!built) {
      api.line(ctx, x0, top + cellHeight / 2, x0 + 9 * pitch - 8, top + cellHeight / 2, C.muted, 2);
      continue;
    }
    for (let tick = 0; tick < plan.ticks; tick++) {
      const x = x0 + tick * pitch;
      const pair = tick - stage + 1;
      const idle = pair < 1 || pair > microbatches;
      const elapsed = Math.max(0, Math.min(1, time - tick));
      api.rect(ctx, x, top, pitch - 8, cellHeight, C.panel, C.muted, 4);
      if (elapsed <= 0) continue;
      const fill = idle ? C.pink : pair % 2 ? C.cyan : C.blue;
      if (!idle) api.rect(ctx, x, top, elapsed * (pitch - 8), cellHeight, fill, undefined, 4);
      if (elapsed >= 0.95) {
        api.text(
          ctx,
          idle ? 'idle' : (solo ? 'Pair ' : '') + pair,
          x + (pitch - 8) / 2,
          top + cellHeight / 2 + 13,
          solo ? 43 : 32,
          idle ? fill : C.bg,
          'center',
        );
      }
    }
  }
  if (showRatio) {
    const numerator = plan.idle;
    const label = numerator + ' / ' + plan.slots + ' idle';
    api.text(
      ctx,
      label,
      solo ? 960 : 1635,
      solo ? y + 2 * stepY + 85 : y + 67,
      40,
      C.pink,
      'center',
    );
    if (!solo) api.text(ctx, '= 1 / ' + plan.slots / numerator, 1635, y + 130, 46, C.ink, 'center');
  }
}

export function drawPipeline(ctx, scene, state, api) {
  const { C } = api;
  const { beat } = state;
  const cue = (id, b, start, end) => spokenProgress(state, api, id, b, start, end);
  if (beat === 0) {
    const first = cue('pipe-first-stage', 0, 0.04, 0.17);
    const next = cue('pipe-handoff', 0, 0.49, 0.68);
    api.focus.target('first-wave', () =>
      wave(ctx, api, {
        y: 395,
        microbatches: 1,
        built: true,
        solo: true,
        time: first + next,
        showRatio: next === 1,
      }),
    );
    api.text(ctx, 'One tick = one stage processing one pair', 960, 947, 34, C.muted, 'center');
    return;
  }

  const m4 = globalBatch / (pairSize * 4);
  const m8 = globalBatch / (pairSize * 8);
  const upperReady = cue('pipe-eight-pairs', 1, 0.25, 0.37) === 1;
  api.focus.target('four-replicas', () =>
    wave(ctx, api, {
      y: 350,
      replicas: 4,
      microbatches: m4,
      built: upperReady,
      time: (m4 + 1) * cue('pipe-eight-wave', 1, 0.46, 0.72),
      showRatio: cue('pipe-eight-idle', 1, 0.77, 0.91) === 1,
    }),
  );
  if (beat >= 2 && cue('pipe-change-dp', 2, 0.17, 0.39) > 0) {
    api.focus.target('eight-replicas', () =>
      wave(ctx, api, {
        y: 691,
        replicas: 8,
        microbatches: m8,
        built: cue('pipe-four-pairs', 3, 0.08, 0.18) === 1,
        time: (m8 + 1) * cue('pipe-short-wave', 3, 0.19, 0.32),
        showRatio: cue('pipe-four-idle', 3, 0.33, 0.42) === 1,
      }),
    );
  }
  api.text(
    ctx,
    beat === 2
      ? 'How many pairs per replica? What fraction of stage slots will be idle?'
      : 'Forward pass on one replica   ·   equal stage times   ·   one numbered cell per pair per stage',
    960,
    976,
    31,
    C.muted,
    'center',
  );
}

export default {
  id: 'pipeline',
  draw: drawPipeline,
  cues: [
    'pipe-first-stage',
    'pipe-handoff',
    'pipe-eight-pairs',
    'pipe-eight-wave',
    'pipe-eight-idle',
    'pipe-change-dp',
    'pipe-four-pairs',
    'pipe-short-wave',
    'pipe-four-idle',
  ],
};
