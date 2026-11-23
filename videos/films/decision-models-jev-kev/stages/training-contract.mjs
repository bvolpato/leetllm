import { phraseProgress, phraseStarted } from '../clock.mjs';

function drawIncidentGroup(ctx, state, api) {
  const { C } = api;
  const retry = phraseStarted(state, 'retry-line', 0, 0.6);
  const motion = phraseProgress(state, api, 'move-group', 1, 0.01, 0.2);
  const y = 332 + 317 * motion;
  api.focus.target('training-record', () => {
    api.text(ctx, 'RUN-842   /   policy v3', 110, 273, 39, C.muted);
    api.text(ctx, '401 Unauthorized from registry', 110, 398, 42, C.ink);
    api.text(ctx, 'What should triage investigate first?', 110, 483, 39, C.ink);
    api.text(ctx, 'A   Test regression', 112, 598, 36, C.muted);
    api.text(ctx, 'B   Registry authentication', 112, 667, 36, C.cyan);
    api.text(ctx, 'C   Insufficient evidence', 112, 736, 36, C.muted);
    api.text(ctx, 'Reviewed label   B', 110, 864, 43, C.cyan);
  });
  api.focus.target('split-destination', () => {
    api.line(ctx, 1010, 620, 1800, 620, C.blue, 3);
    api.text(
      ctx,
      motion > 0 ? 'Training incidents' : 'Training or final test?',
      1020,
      955,
      39,
      C.blue,
    );
  });
  api.focus.target('incident-group', () => {
    api.rect(ctx, 1030, y, 745, 229, C.panel, C.cyan, 9);
    api.text(ctx, 'Incident 17', 1074, y + 64, 44, C.cyan);
    api.text(ctx, 'First image pull   /   401', 1074, y + 130, 35, C.ink);
    if (retry) api.text(ctx, 'Retried image pull   /   401', 1074, y + 191, 35, C.ink);
  });
}

function drawObjectives(ctx, api) {
  const { C } = api;
  api.text(ctx, 'One reviewed answer   /   B', 110, 279, 46, C.cyan);
  api.line(ctx, 110, 322, 1806, 322, C.muted, 2);
  api.focus.target('head-loss', () => {
    api.text(ctx, 'Option head', 111, 459, 46, C.ink);
    api.text(ctx, 'A', 653, 461, 46, C.muted);
    api.text(ctx, 'B', 773, 461, 46, C.cyan);
    api.text(ctx, 'C', 893, 461, 46, C.muted);
    api.line(ctx, 762, 487, 816, 487, C.cyan, 6);
    api.text(ctx, 'Loss = −ln p(B)', 1190, 461, 47, C.cyan);
  });
  api.focus.target('letter-loss', () => {
    api.text(ctx, 'Letter completion', 111, 675, 46, C.ink);
    api.text(ctx, 'Log + question + options', 652, 670, 39, C.muted);
    api.text(ctx, 'B', 1520, 670, 49, C.cyan);
    api.line(ctx, 1505, 698, 1560, 698, C.cyan, 6);
    api.text(ctx, 'Context tokens', 652, 751, 32, C.muted);
    api.text(ctx, 'Supervised token', 1390, 751, 32, C.cyan);
  });
  api.line(ctx, 110, 836, 1806, 836, C.muted, 2);
  api.text(
    ctx,
    'Smaller Kev models: adapters + head     /     Kev-27B v2: full-weight fine-tuning',
    111,
    934,
    37,
    C.ink,
  );
}

function drawSplits(ctx, state, api) {
  const { C } = api;
  const rows = [
    ['Calibration incidents', 'Fit a positive temperature', 'calibration', 'calibrate'],
    ['Development incidents', 'Choose the cutoff at that scale', 'development', 'choose-gate'],
    [
      'Final incident groups',
      'Measure errors, coverage and uncertainty',
      'final-groups',
      'final-test',
    ],
  ];
  rows.forEach(([name, task, target, cue], i) => {
    const y = 361 + 196 * i;
    const open = i === 0 || phraseStarted(state, cue, 3, [0, 0.24, 0.45][i]);
    api.focus.target(target, () => {
      api.text(ctx, name, 111, y, 45, open ? C.ink : C.muted);
      api.line(ctx, 111, y + 34, 1806, y + 34, C.muted, 2);
      api.text(
        ctx,
        open ? task : 'Held aside',
        832,
        y,
        42,
        open ? (i === 2 ? C.green : C.cyan) : C.muted,
      );
    });
  });
  if (phraseStarted(state, 'final-test', 3, 0.45))
    api.text(ctx, 'Temperature and cutoff frozen before the final test', 111, 946, 42, C.yellow);
}
export function drawTrainingContract(ctx, scene, state, api) {
  if (state.beat < 2) drawIncidentGroup(ctx, state, api);
  else if (state.beat === 2) drawObjectives(ctx, api);
  else drawSplits(ctx, state, api);
}
export default {
  id: 'training-contract',
  draw: drawTrainingContract,
  cues: [
    'training-row',
    'retry-line',
    'move-group',
    'head-loss',
    'letter-loss',
    'calibrate',
    'choose-gate',
    'final-test',
  ],
};
