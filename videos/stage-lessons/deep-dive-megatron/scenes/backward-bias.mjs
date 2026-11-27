// Scene 09: Reduce input gradients and add output bias once (partials 1+2 + bias 3 once = 6 vs duplicate bias on both shards = 9!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function backwardBias(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b718', '#fb71851c');
  const title = heroTitle(['Reduce Input Grads &', 'Add Output Bias Once'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'BACKWARD ALL-REDUCE · DUPLICATE BIAS TRAP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;

    const nodes = [
      // Top: Backward input gradient combination
      glassCell(0, -145, 1480, 142, st < 2 ? ROLE.tp : COSMOS.dim, {
        fill: '#0f1d36',
        glow: st < 2 ? 9 : 3,
      }),
      txt('BACKWARD THROUGH COLUMN-PARALLEL SHARDS', 0, -182, 26, ROLE.tp, 'mono'),
      txt(
        'Each column shard produces a partial dL/dx -> all-reduce (or SP reduce-scatter) combines them',
        0,
        -122,
        26,
        COSMOS.ink,
        'sans',
      ),

      // Bottom left: Correct bias once (1 + 2 + 3 = 6)
      glassCell(-420, 118, 760, 232, st >= 3 ? ROLE.good : COSMOS.dim, {
        fill: st >= 3 ? '#0d2924' : '#0a0f1c',
        glow: st >= 3 ? 10 : 2,
      }),
      txt('CORRECT: ADD BIAS AFTER SUM', -420, 44, 28, ROLE.good, 'mono'),
      txt(
        'Partials: 1 + 2 = 3   ->   + bias(3) = 6',
        -420,
        114,
        30,
        st >= 3 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt('Shared output bias applied ONCE', -420, 180, 26, COSMOS.muted, 'sans'),

      // Bottom right: Duplicate bias trap (1+3 + 2+3 = 9!)
      glassCell(420, 118, 760, 232, st >= 4 ? ROLE.bad : COSMOS.dim, {
        fill: st >= 4 ? '#2d1222' : '#0a0f1c',
        glow: st >= 4 ? 10 : 2,
      }),
      txt('BUG: ADD BIAS ON EVERY SHARD', 420, 44, 28, ROLE.bad, 'mono'),
      txt(
        '(1 + 3) + (2 + 3) = 9!  (+3 duplicate!)',
        420,
        114,
        30,
        st >= 4 ? ROLE.bad : COSMOS.dim,
        'mono',
      ),
      txt('Check Q heads & KV groups divide across TP', 420, 180, 26, COSMOS.muted, 'sans'),
    ];

    nodes.push(
      txt(
        'Forward row-parallel adds partials (bias once after sum); backward column-parallel combines dL/dx',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-backward-bias-b0', 0],
    ['mg-backward-sum', 1],
    ['mg-backward-bias-b1', 2],
    ['mg-bias-six', 3],
    ['mg-bias-nine', 4],
  ]);
}
