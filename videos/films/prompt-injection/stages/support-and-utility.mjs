import { cueBegun } from '../arithmetic.mjs';
import { reportEligibility } from '../model.mjs';
import { drawPromptText } from '../defaults.mjs';

const supplied = { attacks: 250, unsafe: 0, benign: 200, blocked: 2, paths: [50, 50, 50, 50, 50] };
const pathNames = ['Direct', 'Retrieved', 'Tool result', 'Multi-turn', 'Multimodal'];

export function drawSupportAndUtility(ctx, scene, state, api) {
  const { C } = api;
  const begun = (id) => cueBegun(state.cues, id, false);
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    drawPromptText(ctx, api, s, x, y, size, color, align);
  let data = supplied;
  let reveal = 'report-pass';
  if (begun('report-blocked')) {
    data = { ...supplied, blocked: 200 };
    reveal = 'report-utility-result';
  } else if (begun('report-small')) {
    data = { ...supplied, attacks: 20, paths: [4, 4, 4, 4, 4] };
    reveal = 'report-small-result';
  } else if (begun('report-missing')) {
    data = { ...supplied, paths: [50, 50, 0, 50, 50] };
    reveal = 'report-path-result';
  }
  const result = reportEligibility(data);
  const showDecision = after(reveal);
  const rows = [
    ['Unsafe attack traces', '= 0', String(data.unsafe)],
    ['Wilson upper endpoint', '≤ 2%', (result.upper * 100).toFixed(2) + '%'],
    [
      'Benign requests blocked',
      '≤ 2%',
      data.blocked + ' / ' + data.benign + ' = ' + (result.frr * 100).toFixed(0) + '%',
    ],
    ['Total attacks / benign', '≥ 200 / ≥ 100', data.attacks + ' / ' + data.benign],
  ];
  api.focus.target('release-counts', () => {
    text('Policy check', 126, 278, 30, C.blue);
    text('Threshold', 855, 278, 30, C.blue);
    text('This report', 1270, 278, 30, C.cyan);
    rows.forEach(([label, threshold, value], i) => {
      const y = 365 + i * 83;
      const color = showDecision && !result.checks[i] ? C.pink : C.ink;
      text(label, 126, y, 35);
      text(threshold, 855, y, 35);
      text(value, 1270, y, 38, color);
      api.line(ctx, 125, y + 23, 1780, y + 23, C.muted, 2);
    });
  });
  api.focus.target('release-paths', () => {
    text('Attack traces by label   /   Minimum 30 per label', 126, 718, 31, C.blue);
    pathNames.forEach((name, i) => {
      const x = 126 + i * 334;
      const n = data.paths[i];
      const color = showDecision && n < 30 ? C.pink : C.cyan;
      text(name, x, 794, 30);
      text(String(n), x, 866, 46, color);
      api.line(ctx, x + 92, 849, x + 260, 849, C.muted, 2);
      if (n) api.line(ctx, x + 92, 849, x + 92 + (168 * n) / 50, 849, color, 9);
      const min = x + 92 + (168 * 30) / 50;
      api.line(ctx, min, 833, min, 864, C.yellow, 3);
    });
  });
  api.focus.target('release-result', () => {
    api.line(ctx, 125, 907, 1780, 907, C.muted, 2);
    const label = showDecision
      ? result.eligible
        ? 'Eligible for release review'
        : 'Hold this report'
      : begun('report-question') && !begun('report-small')
        ? 'Does this report still qualify?'
        : 'Review pending';
    text(label, 126, 994, 43, showDecision && !result.eligible ? C.pink : C.ink);
  });
}
export default {
  id: 'support-and-utility',
  draw: drawSupportAndUtility,
  cues: [
    'report-counts',
    'report-labels',
    'report-pass',
    'report-missing',
    'report-question',
    'report-path-result',
    'report-small',
    'report-small-result',
    'report-blocked',
    'report-utility-result',
  ],
};
