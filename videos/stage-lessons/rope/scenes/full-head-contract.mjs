// Scene 13: full-head-contract: Partial RoPE prefix + untouched suffix, sqrt(d_head) scaling, complex equivalence.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  cinemaAura,
  cinemaStars,
  clockDial,
  glowTex,
  heroTitle,
  rotatePair,
  txt,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-full-head-contract-0-0',
  'rp-full-head-contract-0-1',
  'rp-full-head-contract-0-2',
  'rp-full-head-contract-0-3',
  'rp-full-head-contract-0-4',
  'rp-full-head-contract-1-0',
  'rp-full-head-contract-1-1',
  'rp-full-head-contract-1-2',
  'rp-full-head-contract-1-3',
];

export default function fullHeadContract(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 13, ROLE.query);
  const stageAura = cinemaAura(0, 30, 680, '#5ce1e61c', '#a78bfa16');

  const title = heroTitle(['Rotate the prefix,', 'sum every part'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'PARTIAL ROPE & COMPLEX FORM',
  });

  const complexEq = glowTex(String.raw`(x + iy)(\cos\alpha + i\sin\alpha)`, {
    x: 410,
    y: -375,
    size: 38,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const st = step.value;
    const angle = Math.min(1.1, 0.2 + st * 0.16);
    const complexFocus = Math.max(0, Math.min(1, st - 5.5));
    const nodes = [];

    // 8-channel head bar: channels 0..3 = rotary prefix (cyan/blue), 4..7 = untouched suffix (emerald)
    const chW = 185;
    const startX = -740 + chW * 0.5;
    const barY = -140;
    const qVals = [1.0, 0.0, 0.8, 0.6, 0.5, 0.5, 0.7, 0.3];
    const kVals = [1.0, 0.0, 0.8, 0.6, 0.5, 0.5, 0.7, 0.3];
    const p0q = rotatePair([qVals[0], qVals[1]], angle);
    const p0k = rotatePair([kVals[0], kVals[1]], 0);
    const p1q = rotatePair([qVals[2], qVals[3]], angle * 0.1);
    const p1k = rotatePair([kVals[2], kVals[3]], 0);
    const prefixDot = p0q[0] * p0k[0] + p0q[1] * p0k[1] + p1q[0] * p1k[0] + p1q[1] * p1k[1];
    const suffixDot =
      qVals[4] * kVals[4] + qVals[5] * kVals[5] + qVals[6] * kVals[6] + qVals[7] * kVals[7];
    const fullDot = prefixDot + suffixDot;

    nodes.push(
      txt('Rotary prefix (d_rot = 4)', -370, barY - 68, 28, ROLE.query, 'mono'),
      txt('Untouched suffix (4 dims)', 370, barY - 68, 28, ROLE.score, 'mono'),
    );

    qVals.forEach((v, idx) => {
      const cx = startX + idx * chW;
      const isRot = idx < 4;
      const col = isRot ? (idx < 2 ? ROLE.query : COSMOS.blue) : ROLE.score;
      nodes.push(
        rect(chW - 14, 66, {
          fill: isRot ? '#102038' : '#102a24',
          stroke: col,
          width: isRot ? 2.6 : 2.0,
          radius: 10,
        }).at(cx, barY),
        txt(`d${idx}: ${v.toFixed(1)}`, cx, barY, 26, COSMOS.ink, 'mono'),
      );
    });

    // Lower-left: Full dot product + divide by sqrt(d_head = 8), NOT sqrt(d_rot = 4)
    nodes.push(
      txt(`Prefix rotated dot:  ${prefixDot.toFixed(3)}`, -855, 30, 30, ROLE.query, 'mono', 'left'),
      txt(
        `Suffix untouched dot:  ${suffixDot.toFixed(3)}`,
        -855,
        86,
        30,
        ROLE.score,
        'mono',
        'left',
      ),
      line([-855, 130], [-210, 130], { stroke: '#3a4b73', width: 2.2 }),
      txt(
        `Full dot = ${fullDot.toFixed(3)}   ÷  √8 = ${(fullDot / Math.sqrt(8)).toFixed(3)}`,
        -855,
        175,
        32,
        COSMOS.gold,
        'mono',
        'left',
      ).glow(6, COSMOS.gold),
      txt('Divide by √d_head (8), not √d_rot (4)', -855, 245, 27, COSMOS.muted, 'sans', 'left'),
      txt(
        'Pure rotation preserves norm; elementwise cos/sin avoids sparse matrices',
        -855,
        325,
        26,
        complexFocus > 0.3 ? ROLE.shift : COSMOS.dim,
        'sans',
        'left',
      ),
    );

    // Lower-right: Glowing complex plane dial illustrating z' = z * e^(i*alpha)
    nodes.push(
      clockDial({
        cx: 530,
        cy: 165,
        radius: 148,
        queryAngle: angle,
        keyAngle: 0,
        showAxes: true,
        showWake: true,
        showAngleArc: true,
        title: `z·e^(iα)   α = ${angle.toFixed(2)}`,
        titleColor: complexFocus > 0.3 ? COSMOS.gold : COSMOS.muted,
      }),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, complexEq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
