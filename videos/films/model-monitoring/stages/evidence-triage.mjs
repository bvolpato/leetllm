import { chip, cueProgress, cueVisible, dot, footer, line, panel, text } from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (key) => state.cues?.[`m-${'evidence-triage'}-${key}`]?.phase === 'after';
  const smooth = (q) => q * q * (3 - 2 * q);
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    const routes = [
      ['missing / stale', 'repair data path', 'data', themeColors.red],
      ['parity mismatch', 'share feature definition', 'parity', themeColors.yellow],
      ['distribution change', 'inspect context + source', 'shift', themeColors.cyan],
    ];
    if (currentBeat < 2)
      routes.forEach(([a, z, key, col], i) => {
        const y = 320 + i * 125;
        chip(ctx, api, a, 150, y, 480, col);
        line(ctx, api, 630, y + 33, 900, y + 33, themeColors.muted, 2);
        const q = cueProgress(ctx, api, 'evidence-triage', key);
        dot(ctx, api, lerp(660, 860, smooth(q)), y + 33, col, 10);
        if (cueVisible(ctx, api, 'evidence-triage', key) || currentBeat > 0)
          chip(ctx, api, z, 940, y, 780, col);
      });
    if (currentBeat === 1) {
      panel(ctx, api, 190, 740, 1540, 112, themeColors.blue);
      text(
        ctx,
        api,
        'v4 · frozen data + model bytes + features-v3 + τ .50 · previous v3',
        960,
        808,
        29,
        themeColors.blue,
      );
    }
    if (currentBeat === 2) {
      panel(ctx, api, 150, 285, 1580, 425, themeColors.muted);
      text(ctx, api, 'supplied candidate evidence', 960, 335, 31, themeColors.blue);
      if (cueVisible(ctx, api, 'evidence-triage', 'canary'))
        text(
          ctx,
          api,
          '500 requests · error .002 / .005 · p95 44 / 50 ms · queue .72 / .80',
          960,
          420,
          30,
          themeColors.cyan,
        );
      if (cueVisible(ctx, api, 'evidence-triage', 'wider'))
        chip(ctx, api, 'wider traffic', 630, 475, 660, themeColors.green);
      if (cueVisible(ctx, api, 'evidence-triage', 'cohort'))
        text(
          ctx,
          api,
          '500 mature · 10 unnecessary reviews · 2 missed deadlines',
          960,
          610,
          31,
          themeColors.pink,
        );
      if (done('cost'))
        text(ctx, api, '(2×10 + 10×2) × 1,000 / 500 = 80 > 50', 960, 700, 37, themeColors.yellow);
      chip(
        ctx,
        api,
        'v4 · bundle …edde9c2176',
        lerp(210, 1030, smooth(cueProgress(ctx, api, 'evidence-triage', 'wider'))),
        750,
        610,
        done('proposal') ? themeColors.red : themeColors.cyan,
        65,
        28,
      );
      if (done('proposal'))
        text(ctx, api, 'PROPOSAL: return to v3 · no traffic sent', 960, 855, 35, themeColors.red);
    }
    footer(ctx, api, 'Match the repair to the observed failure boundary.');
  }
}
export function drawEvidenceTriage(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('evidence-triage-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'evidence-triage',
  draw: drawEvidenceTriage,
  cues: [
    'evidence-triage-beat-1-focus-1',
    'evidence-triage-beat-1-focus-2',
    'm-evidence-triage-data',
    'm-evidence-triage-parity',
    'm-evidence-triage-shift',
    'evidence-triage-beat-2-focus-1',
    'm-evidence-triage-bundle',
    'evidence-triage-beat-3-focus-2',
    'evidence-triage-beat-3-focus-3',
    'evidence-triage-beat-3-focus-4',
    'evidence-triage-beat-3-focus-1',
    'evidence-triage-beat-3-focus-5',
    'evidence-triage-beat-3-focus-6',
    'm-evidence-triage-canary',
    'm-evidence-triage-wider',
    'm-evidence-triage-cohort',
    'm-evidence-triage-cost',
    'm-evidence-triage-proposal',
  ],
};
