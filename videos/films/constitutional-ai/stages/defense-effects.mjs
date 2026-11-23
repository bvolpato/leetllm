import { accessResult } from '../arithmetic.mjs';
import { voice } from '../construction.mjs';

export function drawDefenseEffects(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  if (state.beat === 0) {
    const checked = voice(state, 'effect-check', 0);
    const denied = voice(state, 'effect-destination', 0) > 0;
    t('Read request    /    INC-8821', 130, 305, 49);
    api.focus.target('effect-boundary', () => {
      t('Signed-in engineer', 130, 478, 42, C.blue);
      t('No grant for this incident', 130, 558, 36, C.ink);
      if (checked) api.arrow(ctx, 650, 520, 658 + 238 * checked, 520, C.blue, 5);
      api.line(ctx, 915, 410, 915, 642, C.yellow, 6);
      t('Application permission check', 1005, 479, 40, C.yellow);
      if (denied)
        t('Private records fetched    ' + Number(accessResult().fetched), 1005, 574, 44, C.green);
    });
    t('The receipt covers the caller, record, action and destination.', 130, 869, 39, C.muted);
    return;
  }
  if (state.beat === 1) {
    const chunks = voice(state, 'output-buffer', 1);
    const scan = voice(state, 'output-check', 1);
    t('Output buffer    /    synthetic marker CASE-17', 130, 314, 45);
    t('Pending chunks', 130, 471, 34, C.muted);
    api.focus.target('buffer', () => {
      const x = 645 - 213 * scan;
      api.components.card({
        label: 'CASE-',
        x: 130,
        y: 520,
        width: 295,
        height: 145,
        fill: C.panel,
        stroke: C.cyan,
        textColor: C.cyan,
        fontSize: 58,
      });
      if (chunks)
        api.components.card({
          label: '17',
          x,
          y: 520,
          width: 190,
          height: 145,
          fill: C.panel,
          stroke: C.cyan,
          textColor: C.cyan,
          fontSize: 58,
        });
      if (scan === 1) t('Full marker matched    /    held', 130, 793, 41, C.yellow);
    });
    api.line(ctx, 1010, 481, 1010, 819, C.yellow, 5);
    t('Bytes released', 1135, 520, 38, C.muted);
    t('0', 1135, 701, 126, C.green);
    t('Check the assembled text before delivery.', 130, 974, 37);
    return;
  }

  t('One request    /    three observations', 130, 305, 47);
  const entries = [
    ['model-proposal', 'effect-proposal', 'Model proposed', 'Read the incident timeline', C.pink],
    ['executed-read', 'effect-denied', 'Application executed', '0 private reads', C.green],
    [
      'delivered-answer',
      'defense-effects-2',
      'Engineer received',
      'Portal address  •  0 disclosures',
      C.ink,
    ],
  ];
  entries.forEach(([id, cue, label, value, tone], i) => {
    const y = 483 + 181 * i;
    api.focus.target(id, () => {
      t(label, 130, y, 39, C.muted);
      t(voice(state, cue, 2) > 0 ? value : '…', 776, y, 50, tone);
    });
  });
}
export default {
  id: 'defense-effects',
  draw: drawDefenseEffects,
  cues: [
    'effect-check',
    'effect-destination',
    'output-buffer',
    'output-check',
    'effect-proposal',
    'effect-denied',
    'defense-effects-2',
  ],
};
