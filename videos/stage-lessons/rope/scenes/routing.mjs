// Scene 16: routing: Position steers which values arrive (glowing proportional flow streams to fixed Values).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowDot,
  glowingCurve,
  heroTitle,
  rotaryScore,
  softmax,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-routing-0-0',
  'routing-routed-query-b1-1',
  'rp-routing-0-1',
  'rp-routing-0-2',
  'rp-routing-1-0',
  'routing-rotary-source-weight-0-b2-1',
  'rp-routing-1-1',
  'rp-routing-1-2',
  'rp-routing-2-0',
  'routing-unrotated-value-0-b3-1',
  'rp-routing-2-1',
  'rp-routing-2-2',
];

const Q_BASE = [1, 0];
const KEYS = [
  { pos: 1, vec: [1, 0], val: [2.0, 0.2], name: 'k₁ (pos 1)', col: COSMOS.cyan },
  { pos: 4, vec: [1, 0], val: [0.4, 2.0], name: 'k₂ (pos 4)', col: COSMOS.gold },
  { pos: 7, vec: [1, 0], val: [1.4, 1.4], name: 'k₃ (pos 7)', col: COSMOS.violet },
];
const FREQ = [0.55];

export default function routing(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(130, 16, ROLE.query);
  const stageAura = cinemaAura(140, 20, 680, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['Position steers', 'which values arrive'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'ROTARY ROUTING TO FIXED VALUES',
  });

  const live = dynamic(() => {
    const st = step.value;
    // Query position sweeps smoothly from 1.0 -> 7.2 across the scene
    const qPos = 1.0 + Math.min(6.2, Math.max(0, (st - 1.2) * 0.72));
    const scores = KEYS.map((k) => rotaryScore(Q_BASE, k.vec, qPos, k.pos, FREQ) * 1.9);
    const weights = softmax(scores);
    const out0 = weights.reduce((acc, w, i) => acc + w * KEYS[i].val[0], 0);
    const out1 = weights.reduce((acc, w, i) => acc + w * KEYS[i].val[1], 0);

    const nodes = [];

    // Left: Rotating Query dial at current qPos
    nodes.push(
      clockDial({
        cx: -610,
        cy: 30,
        radius: 155,
        queryAngle: qPos * FREQ[0],
        showAxes: true,
        showWake: true,
        queryColor: ROLE.query,
        title: `Query pos m = ${qPos.toFixed(1)}`,
        subtitle: `angle = ${(qPos * FREQ[0]).toFixed(2)} rad`,
        titleColor: ROLE.query,
        subColor: COSMOS.muted,
      }),
    );

    // Center-left: 3 rotated keys -> glowing curved attention weight streams -> 3 unrotated Values -> Output
    const keyX = -150;
    const valX = 290;
    const outX = 720;
    const rowYs = [-175, 30, 235];

    nodes.push(
      txt('Rotated Keys', keyX, -280, 26, COSMOS.muted, 'mono'),
      txt('Unrotated Values V', valX, -280, 26, ROLE.score, 'mono'),
      txt('Output Mix', outX, -280, 26, COSMOS.gold, 'mono'),
    );

    KEYS.forEach((k, i) => {
      const y = rowYs[i];
      const w = weights[i];
      const streamW = 2.0 + w * 16;

      // Glowing bezier-like flow curve from key -> value -> output
      const ptsKV = [];
      const ptsVO = [];
      for (let t = 0; t <= 16; t++) {
        const u = t / 16;
        ptsKV.push([keyX + 120 + u * (valX - keyX - 240), y]);
        const ox = valX + 125 + u * (outX - valX - 240);
        const oy = y + (30 - y) * (0.5 - 0.5 * Math.cos(Math.PI * u));
        ptsVO.push([ox, oy]);
      }

      nodes.push(
        rect(220, 74, { fill: '#11192e', stroke: k.col, width: 2.4, radius: 12 }).at(keyX, y),
        txt(k.name, keyX, y, 27, k.col, 'mono'),
        glowingCurve(ptsKV, k.col, { width: streamW * 0.65, glow: 9 }).opacity(0.32 + 0.68 * w),
        txt(`${(w * 100).toFixed(0)}%`, (keyX + valX) * 0.5, y - 34, 28, k.col, 'mono').glow(
          w > 0.45 ? 7 : 0,
          k.col,
        ),
        rect(220, 74, { fill: '#102424', stroke: ROLE.score, width: 2.2, radius: 12 }).at(valX, y),
        txt(
          `v${i + 1} [${k.val[0].toFixed(1)}, ${k.val[1].toFixed(1)}]`,
          valX,
          y,
          26,
          COSMOS.ink,
          'mono',
        ),
        glowingCurve(ptsVO, k.col, { width: streamW, glow: 11 }).opacity(0.28 + 0.72 * w),
      );
    });

    // Right output node collecting all 3 glowing streams
    nodes.push(
      rect(220, 120, { fill: '#171d32', stroke: COSMOS.gold, width: 3.2, radius: 16 })
        .at(outX, 30)
        .glow(10, COSMOS.gold),
      txt(`[${out0.toFixed(2)}, ${out1.toFixed(2)}]`, outX, 30, 30, COSMOS.gold, 'mono'),
      txt(
        'RoPE rotates Q & K to steer weights; Values keep fixed orientation',
        -860,
        390,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
