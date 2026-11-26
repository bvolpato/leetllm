// Scene 8: rotation: A position becomes an angle (2D glowing compass needle preserving norm).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  bindStepCues,
  clockDial,
  glowDot,
  glowTex,
  heroTitle,
  rotatePair,
  txt,
  verticalGauge,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-rotation-0-0',
  'rp-rotation-0-1',
  'rotation-rotating-coordinate-pair-b1-1',
  'rp-rotation-0-2',
  'rp-rotation-1-0',
  'rotation-position-frequency-product-b2-1',
  'rp-rotation-1-1',
  'rp-rotation-1-2',
  'rp-rotation-2-0',
  'rotation-preserved-vector-length-b3-1',
  'rp-rotation-2-1',
  'rp-rotation-2-2',
];

const Q0 = [0.8, 0.6]; // Exact unit vector ||Q0|| = 1
const THETA = 0.5;

export default function rotation(s, c) {
  const step = s.value(0);
  const stageAura = aura(240, 10, 620, '#5ce1e626', '#4c2f8a18');

  const title = heroTitle(['A position becomes', 'an angle'], {
    x: -860,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: ROLE.query,
    eyebrow: '2D ROTARY OPERATION',
  });

  const eq = glowTex(String.raw`\alpha = m \cdot \theta, \quad \|R(\alpha)q\| = \|q\|`, {
    x: -545,
    y: -155,
    size: 40,
    color: COSMOS.gold,
    glow: 6,
  });

  const live = dynamic(() => {
    const st = step.value;
    // Position m glides smoothly from 0 to 6 across the cues
    const m = Math.max(0, Math.min(6, (st - 0.8) * 0.72));
    const angle = m * THETA;
    const baseAng = Math.atan2(Q0[1], Q0[0]);
    const [rx, ry] = rotatePair(Q0, angle);
    const norm = Math.hypot(rx, ry);

    const cx = 230;
    const cy = 15;
    const rad = 258;
    const tipX = cx + rx * rad;
    const tipY = cy - ry * rad;

    const nodes = [
      clockDial({
        cx,
        cy,
        radius: rad,
        queryAngle: baseAng + angle,
        showAxes: true,
        showWake: true,
        queryColor: ROLE.query,
        title: `m = ${m.toFixed(1)}   ·   α = mθ = ${angle.toFixed(2)} rad`,
        titleColor: ROLE.query,
      }),
      // Dashed orthogonal projections to x and y axes
      line([tipX, tipY], [tipX, cy], { stroke: ROLE.query, width: 2.2, dash: [5, 5] }).opacity(
        0.72,
      ),
      line([tipX, tipY], [cx, tipY], { stroke: ROLE.shift, width: 2.2, dash: [5, 5] }).opacity(
        0.72,
      ),
      glowDot(tipX, cy, { radius: 6, color: ROLE.query, glow: 10 }),
      glowDot(cx, tipY, { radius: 6, color: ROLE.shift, glow: 10 }),
      // Right synchronized vertical gauge showing cos(alpha)
      verticalGauge({
        x: 740,
        top: -200,
        bot: 210,
        value: rx,
        color: ROLE.query,
        caption: 'x(m)',
        tag: `||q||=${norm.toFixed(2)}`,
      }),
      // Left live numeric readouts (no boxes, pure floating telemetry!)
      txt(`Position m`, -855, 25, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${m.toFixed(1)}`, -855, 78, 56, ROLE.query, 'mono', 'left').glow(8, ROLE.query),
      txt(`Frequency θ = ${THETA} rad/pos`, -560, 25, 26, COSMOS.muted, 'mono', 'left'),
      txt(`α = ${angle.toFixed(2)} rad`, -560, 78, 42, COSMOS.gold, 'mono', 'left').glow(
        6,
        COSMOS.gold,
      ),
      txt(
        `Rotated coordinates:  (${rx.toFixed(3)}, ${ry.toFixed(3)})`,
        -855,
        195,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        `Norm preserved:  √(x² + y²) = ${norm.toFixed(3)}`,
        -855,
        262,
        30,
        ROLE.score,
        'mono',
        'left',
      ).glow(5, ROLE.score),
      // Glowing position slider bar on lower left
      line([-855, 350], [-235, 350], { stroke: '#35456d', width: 4 }),
      line([-855, 350], [-855 + (m / 6) * 620, 350], { stroke: ROLE.query, width: 6 })
        .glow(10, ROLE.query)
        .set('blend', 'screen'),
      glowDot(-855 + (m / 6) * 620, 350, { radius: 9, color: '#ffffff', glow: 14 }),
      txt('0', -855, 390, 26, COSMOS.dim, 'mono'),
      txt('6', -235, 390, 26, COSMOS.dim, 'mono'),
    ];

    return group(...nodes);
  });

  s.add(stageAura, title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
