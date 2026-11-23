import { rlvrRepair } from '../arithmetic.mjs';
import { freshRecords, freshProduct } from '../capacity.mjs';
import { signed, spokenProgress } from '../drawing.mjs';

export function drawFreshBatchRepair(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const old = p('batch-buffer', 0, 0.78, 0.88);
  const remove = p('batch-quarantine', 1, 0.25, 0.43);
  const weakStats = p('batch-weak-stats', 1, 0.69, 0.83);
  const strict = p('batch-strict', 2, 0.4, 0.58);
  const strictStats = p('batch-strict-stats', 2, 0.66, 0.78);
  const weak = rlvrRepair(1),
    fixed = rlvrRepair(2);
  const active = strict > 0 ? fixed : remove > 0 ? weak : rlvrRepair(0);
  const observations = [
    p('batch-first', 0, 0.18, 0.29),
    p('batch-second', 0, 0.3, 0.45),
    p('batch-timeout', 0, 0.49, 0.63),
    p('batch-lost', 0, 0.65, 0.74),
  ];
  const targets = ['first-record', 'second-record', 'third-record', 'fourth-record'];
  api.focus.target('task-and-rows', () => {
    api.text(ctx, '18 workers × 14 slots', 164, 270, 45, C.ink);
    if (state.beat >= 2) api.text(ctx, 'Reference   ' + freshProduct, 810, 267, 37, C.cyan);
    api.text(ctx, 'Record', 164, 367, 29, C.muted);
    api.text(ctx, 'Submission or runner observation', 330, 367, 29, C.muted);
    freshRecords.forEach((record, i) => {
      const y = 467 + i * 108;
      api.focus.target(targets[i], () => {
        api.text(ctx, record.id, 164, y, 40, C.blue);
        if (observations[i] > 0) {
          api.text(
            ctx,
            record.response ?? record.description,
            330,
            y,
            record.response ? 35 : 31,
            C.ink,
            'left',
            record.response ? 'mono' : 'sans',
          );
        }
      });
      api.line(ctx, 164, y + 31, 1760, y + 31, C.muted, 1);
    });
  });
  api.focus.target('reward-column', () => {
    api.text(ctx, strict > 0 ? 'Reward' : 'Old score', 1160, 367, 30, C.muted, 'center');
    freshRecords.forEach((record, i) => {
      const y = 467 + i * 108;
      if (i === 3 && remove > 0) {
        api.focus.target('fourth-record', () => {
          const x = 1160 + 378 * remove;
          api.text(
            ctx,
            remove < 1 ? 'Unscored' : 'Quarantine · retry R4',
            x,
            y,
            30,
            C.yellow,
            'center',
          );
        });
        return;
      }
      const value = active.rewards[i];
      api.text(
        ctx,
        old > 0 ? String(value) : '?',
        1160,
        y,
        43,
        old > 0 ? (value ? C.green : C.pink) : C.muted,
        'center',
      );
    });
  });
  api.focus.target('batch-stats', () => {
    if (weakStats > 0) {
      const stage = strictStats > 0 ? fixed : weak;
      if (strict === 0 || strictStats > 0)
        api.text(
          ctx,
          'Mean   ' +
            (strictStats > 0 ? '1/3' : '2/3') +
            '      Population spread   ' +
            stage.std.toFixed(4),
          165,
          905,
          36,
          C.cyan,
        );
      api.text(ctx, 'Advantage by parser', 1542, 274, 32, C.muted, 'center');
      api.text(ctx, 'First box', 1435, 367, 29, C.muted, 'center');
      if (strict > 0) api.text(ctx, 'Single box', 1668, 367, 29, C.muted, 'center');
      weak.advantages.forEach((a, i) => {
        const row = () => {
          api.text(ctx, signed(a, 3), 1435, 467 + i * 108, 36, C.blue, 'center');
          if (strictStats > 0) {
            const v = fixed.advantages[i];
            api.text(
              ctx,
              signed(v, 3),
              1668,
              467 + i * 108,
              36,
              v > 0 ? C.green : C.pink,
              'center',
            );
          }
        };
        if (i === 1) api.focus.target('second-advantages', row);
        else row();
      });
    }
  });
  if (state.beat === 3)
    api.text(ctx, 'Which parser should supply the next update?', 165, 988, 34, C.ink);
}
export default {
  id: 'fresh-batch-repair',
  draw: drawFreshBatchRepair,
  cues: [
    'batch-inputs',
    'batch-first',
    'batch-second',
    'batch-timeout',
    'batch-lost',
    'batch-buffer',
    'batch-quarantine',
    'batch-weak-stats',
    'batch-fields',
    'batch-strict',
    'batch-strict-stats',
    'batch-flip',
  ],
};
