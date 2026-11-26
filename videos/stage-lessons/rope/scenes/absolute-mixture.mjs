// Scene 6: absolute-mixture: Addition creates 4 score terms; non-commuting W breaks shift invariance; d -> 2d cost.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  absoluteExpansion,
  aura,
  bindStepCues,
  glowTex,
  heroTitle,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-absolute-mixture-0-0',
  'rp-absolute-mixture-0-1',
  'rp-absolute-mixture-0-2',
  'rp-absolute-mixture-0-3',
  'rp-absolute-mixture-1-0',
  'rp-absolute-mixture-1-1',
  'rp-absolute-mixture-1-2',
  'rp-absolute-mixture-1-3',
  'rp-absolute-mixture-1-4',
  'rp-absolute-mixture-2-0',
  'rp-absolute-mixture-2-1',
  'rp-absolute-mixture-2-2',
  'rp-absolute-mixture-2-3',
  'rp-absolute-mixture-2-4',
];

const ID_MAT = [
  [1, 0],
  [0, 1],
];
const GEN_MAT = [
  [1.2, 0.4],
  [-0.3, 0.7],
];

export default function absoluteMixture(s, c) {
  const step = s.value(0);
  const stageAura = aura(0, 40, 700, '#a78bfa20', '#ff6b8b14');

  const title = heroTitle(['Addition creates', 'four score terms'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.shift,
    eyebrow: 'CONTENT + POSITION MIXING',
  });

  const eq = glowTex(String.raw`(x_m + p_m)^\top W (x_n + p_n)`, {
    x: 345,
    y: -375,
    size: 40,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const st = step.value;
    const shift = st >= 5 ? Math.min(6, (st - 4.5) * 1.6) : 0;
    const useGen = st >= 6.2;
    const showConcat = Math.max(0, Math.min(1, st - 9.5));

    const exp = absoluteExpansion(shift, useGen ? GEN_MAT : ID_MAT);
    const baseExp = absoluteExpansion(0, useGen ? GEN_MAT : ID_MAT);
    const nodes = [];

    // Upper stage: 4 live score terms with glowing horizontal bars
    const labels = [
      { name: 'content · content', col: COSMOS.blue, val: exp.terms[0], base: baseExp.terms[0] },
      { name: 'content · position', col: ROLE.danger, val: exp.terms[1], base: baseExp.terms[1] },
      { name: 'position · content', col: ROLE.danger, val: exp.terms[2], base: baseExp.terms[2] },
      { name: 'position · position', col: ROLE.score, val: exp.terms[3], base: baseExp.terms[3] },
    ];

    const topY = -175;
    const rowStep = 94;
    const barZero = 135;
    const barScale = 190;

    nodes.push(
      txt(
        useGen ? 'General bilinear W  (Rᵀ W R ≠ W)' : 'Identity W = I  (p·p = cos Δθ)',
        -850,
        topY - 58,
        26,
        useGen ? ROLE.danger : ROLE.score,
        'mono',
        'left',
      ),
      txt(`shift = +${shift.toFixed(1)}`, 680, topY - 58, 28, ROLE.shift, 'mono', 'right'),
      line([barZero, topY - 26], [barZero, topY + rowStep * 3 + 32], {
        stroke: '#435582',
        width: 2,
      }),
    );

    labels.forEach((item, i) => {
      const y = topY + i * rowStep;
      const dx = item.val * barScale;
      const changed = Math.abs(item.val - item.base) > 0.02;
      const barCol = changed ? ROLE.danger : item.col;
      nodes.push(
        txt(item.name, -850, y, 28, item.col, 'mono', 'left'),
        rect(Math.max(8, Math.abs(dx)), 34, { fill: barCol, stroke: null, radius: 6 })
          .at(barZero + dx * 0.5, y)
          .opacity(0.84)
          .glow(8, barCol)
          .set('blend', 'screen'),
        txt(
          `${item.val >= 0 ? '+' : ''}${item.val.toFixed(3)}`,
          690,
          y,
          28,
          changed ? ROLE.danger : COSMOS.ink,
          'mono',
          'right',
        ),
      );
    });

    // Total score readout
    nodes.push(
      txt(
        `Total = ${exp.total.toFixed(3)}`,
        845,
        topY + rowStep * 1.5,
        32,
        COSMOS.gold,
        'mono',
        'right',
      ).glow(6, COSMOS.gold),
    );

    // Lower stage: Addition (d = 256 -> 65,536) vs Concatenation (2d = 512 -> 262,144, 4x)
    const botY = 265;
    const op = 0.45 + 0.55 * showConcat;
    nodes.push(
      txt('Add: width d = 256', -850, botY - 28, 28, ROLE.query, 'mono', 'left').opacity(op),
      rect(140, 140, { fill: '#112238', stroke: ROLE.query, width: 2.4, radius: 10 })
        .at(-780, botY + 80)
        .opacity(op),
      txt('65,536', -675, botY + 80, 32, ROLE.query, 'mono', 'left').opacity(op),

      txt(
        'Concat: width 2d = 512  (4× entries)',
        -60,
        botY - 28,
        28,
        ROLE.danger,
        'mono',
        'left',
      ).opacity(op),
      rect(220, 140, { fill: '#2a1324', stroke: ROLE.danger, width: 2.8, radius: 10 })
        .at(50, botY + 80)
        .opacity(op)
        .glow(showConcat > 0.3 ? 8 : 0, ROLE.danger),
      txt('262,144', 200, botY + 80, 34, ROLE.danger, 'mono', 'left')
        .opacity(op)
        .glow(showConcat > 0.3 ? 6 : 0, ROLE.danger),
    );

    return group(...nodes);
  });

  s.add(stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
