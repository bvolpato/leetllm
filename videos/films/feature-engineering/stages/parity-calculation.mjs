import { featureFrame } from '../model.mjs';

const age = 0.5;
const common = 0.02 * age - 4;
const logit = (backlog) => common + 0.01 * backlog;
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export function drawParityCalculation(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  if (f.b < 2) {
    api.focus.target('parity-scores', () => {
      const repaired = f.completed('feature-parity-restore', 1);
      t('J-204   /   09:00', 154, 247, 33, C.muted, 'left');
      t('logit = 0.02 × heartbeat hours + 0.01 × backlog − 4', 960, 354, 45);
      ['Backlog', 'Logit', 'Sigmoid score'].forEach((s, i) =>
        t(s, [865, 1222, 1590][i], 477, 32, C.muted),
      );
      const rows = [
        ['Captured request', 0, C.pink],
        ['Historical source', 18, C.cyan],
      ];
      if (repaired) rows.push(['Repaired replay', 18, C.green]);
      rows.forEach(([label, backlog, color], i) => {
        const y = 566 + 111 * i;
        api.line(ctx, 157, y - 46, 1770, y - 46, C.panel, 4);
        t(label, 175, y + 12, 40, color, 'left');
        t(String(backlog), 865, y + 12, 44, color);
        const computed = f.started(i === 0 ? 'parity-base' : 'parity-delta', 0);
        t(computed ? logit(backlog).toFixed(2) : '?', 1222, y + 12, 47, computed ? color : C.muted);
        t(
          f.completed('feature-parity-scores', 0) ? sigmoid(logit(backlog)).toFixed(6) : '?',
          1590,
          y + 12,
          45,
          color,
        );
      });
      t('Fixed heartbeat   ' + age + ' h     /     illustrative weights', 960, 952, 34, C.muted);
    });
    return;
  }
  if (f.b === 2) {
    api.focus.target('parity-type-check', () => {
      t('Priority source field', 165, 297, 35, C.muted, 'left');
      t('Reference', 470, 407, 35, C.cyan);
      t('Capture', 1430, 407, 35, C.pink);
      t('False', 470, 550, 83, C.ink);
      t('==', 953, 550, 70, C.muted);
      t('0', 1430, 550, 83, C.ink);
      if (f.completed('parity-type', 2)) {
        t('Python equality passes', 950, 714, 47, C.green);
        t('bool', 470, 856, 49, C.cyan);
        t('Required type', 953, 855, 33, C.muted);
        t('int  ·  fails', 1430, 856, 49, C.pink);
      }
    });
    return;
  }
  api.focus.target('parity-feedback', () => {
    t('This job', 195, 344, 34, C.muted);
    api.line(ctx, 184, 538, 1745, 538, C.muted, 3);
    const nodes = [
      [287, 'Backlog 18', C.cyan],
      [770, 'Score ' + sigmoid(logit(18)).toFixed(4), C.cyan],
      [1230, 'Requeue?', C.yellow],
      [1644, 'Next backlog?', C.yellow],
    ];
    nodes.slice(0, f.started('feature-parity-feedback', 3) ? 4 : 2).forEach(([x, label, color]) => {
      api.circle(ctx, x, 538, 16, color);
      t(label, x, 655, 41, color);
    });
    t('Look for the controller action and its later outcome.', 960, 885, 42);
  });
}

export default {
  id: 'parity-calculation',
  draw: drawParityCalculation,
  cues: [
    'parity-base',
    'parity-delta',
    'feature-parity-scores',
    'feature-parity-restore',
    'parity-type',
    'feature-parity-feedback',
  ],
};
