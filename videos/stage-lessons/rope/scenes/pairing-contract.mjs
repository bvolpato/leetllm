// Scene 15: pairing-contract: Equal norms hide wrong coordinate pairing: adjacent (-0.760) vs split (-1.616) vs permuted (-0.760).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  glowDot,
  heroTitle,
  pairingTrace,
  txt,
} from '../parts.mjs';

const TRACE = pairingTrace();
const ALL_CUES = [
  'rp-pairing-contract-0-0',
  'rp-pairing-contract-0-1',
  'rp-pairing-contract-0-2',
  'rp-pairing-contract-0-3',
  'rp-pairing-contract-1-0',
  'rp-pairing-contract-1-1',
  'rp-pairing-contract-1-2',
  'rp-pairing-contract-1-3',
  'rp-pairing-contract-2-0',
  'rp-pairing-contract-2-1',
  'rp-pairing-contract-2-2',
  'rp-pairing-contract-2-3',
];

export default function pairingContract(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 15, ROLE.danger);
  const stageAura = cinemaAura(0, 30, 680, '#5ce1e61c', '#ff6b8b14');

  const title = heroTitle(['Equal norms can hide', 'wrong coordinate pairings'], {
    x: -860,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.danger,
    eyebrow: 'ADJACENT VS SPLIT-HALF LAYOUT',
  });

  const live = dynamic(() => {
    const st = step.value;
    // Mode 0: adjacent (-0.760), Mode 1: wrong split (-1.616), Mode 2: converted permuted (-0.760)
    const mode = st < 5.0 ? 0 : st < 6.5 ? 1 : 2;
    const normQ = Math.hypot(...TRACE.q);
    const normK = Math.hypot(...TRACE.k);
    const nodes = [];

    // Left: 4-coordinate Q = [1, 2, 3, 4] and K = [4, 3, 2, 1] with live pairing arcs
    const cellXs = [-690, -490, -290, -90];
    const qY = -95;
    const kY = 145;
    const qArr = mode === 2 ? TRACE.permutation.map((i) => TRACE.q[i]) : TRACE.q;
    const kArr = mode === 2 ? TRACE.permutation.map((i) => TRACE.k[i]) : TRACE.k;
    const labelsAdj = ['x₀', 'y₀', 'x₁', 'y₁'];
    const labelsSplit = ['x₀', 'x₁', 'y₀', 'y₁'];
    const slotLabels = mode === 0 ? labelsAdj : labelsSplit;

    nodes.push(
      txt('Q = [1, 2, 3, 4]', -860, qY - 78, 28, ROLE.query, 'mono', 'left'),
      txt('K = [4, 3, 2, 1]', -860, kY - 78, 28, ROLE.key, 'mono', 'left'),
    );

    cellXs.forEach((cx, i) => {
      const pairIdx = mode === 0 ? Math.floor(i / 2) : i % 2;
      const col = pairIdx === 0 ? ROLE.query : COSMOS.gold;
      nodes.push(
        rect(154, 64, { fill: '#111a2e', stroke: col, width: 2.6, radius: 12 }).at(cx, qY),
        txt(`${slotLabels[i]}: ${qArr[i]}`, cx, qY, 27, COSMOS.ink, 'mono'),
        rect(154, 64, { fill: '#181a2c', stroke: col, width: 2.6, radius: 12 }).at(cx, kY),
        txt(`${slotLabels[i]}: ${kArr[i]}`, cx, kY, 27, COSMOS.ink, 'mono'),
      );
    });

    // Pairing connector brackets cleanly below Q row (no crossing text!)
    const brY = qY + 54;
    if (mode === 0) {
      nodes.push(
        line([cellXs[0], brY], [cellXs[1], brY], { stroke: ROLE.query, width: 4.0 }).glow(
          8,
          ROLE.query,
        ),
        line([cellXs[2], brY], [cellXs[3], brY], { stroke: COSMOS.gold, width: 4.0 }).glow(
          8,
          COSMOS.gold,
        ),
        glowDot(cellXs[0], brY, { radius: 5, color: ROLE.query, glow: 8 }),
        glowDot(cellXs[1], brY, { radius: 5, color: ROLE.query, glow: 8 }),
        glowDot(cellXs[2], brY, { radius: 5, color: COSMOS.gold, glow: 8 }),
        glowDot(cellXs[3], brY, { radius: 5, color: COSMOS.gold, glow: 8 }),
      );
    } else {
      const brCol1 = mode === 1 ? ROLE.danger : ROLE.score;
      nodes.push(
        line([cellXs[0], brY - 8], [cellXs[2], brY - 8], { stroke: brCol1, width: 3.6 }).glow(
          8,
          brCol1,
        ),
        line([cellXs[1], brY + 12], [cellXs[3], brY + 12], {
          stroke: COSMOS.gold,
          width: 3.6,
        }).glow(8, COSMOS.gold),
      );
    }

    // Right: Three side-by-side live score results proving norm preservation hides pairing bugs!
    const rx = 140;
    const rows = [
      {
        title: 'Adjacent (reference)',
        val: TRACE.adjacent.toFixed(3),
        col: ROLE.score,
        active: mode === 0,
      },
      {
        title: 'Split helper, unconverted',
        val: TRACE.wrong.toFixed(3),
        col: ROLE.danger,
        active: mode === 1,
      },
      {
        title: 'Permuted [0,2,1,3] + split',
        val: TRACE.converted.toFixed(3),
        col: ROLE.score,
        active: mode === 2,
      },
    ];
    rows.forEach((item, i) => {
      const ry = -165 + i * 145;
      const op = item.active ? 1 : 0.45;
      nodes.push(
        txt(item.title, rx, ry - 26, 26, item.col, 'mono', 'left').opacity(op),
        txt(item.val, rx, ry + 26, 48, item.col, 'mono', 'left')
          .opacity(op)
          .glow(item.active ? 9 : 0, item.col),
      );
    });

    // Bottom norm invariance trap & checkpoint rule
    nodes.push(
      txt(
        `Norms stay identical: ||R q|| = ${normQ.toFixed(3)}, ||R k|| = ${normK.toFixed(3)}`,
        -860,
        295,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'Permute Q & K projection weights inside rotary prefix when converting layouts',
        -860,
        365,
        27,
        mode === 2 ? ROLE.score : COSMOS.dim,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
