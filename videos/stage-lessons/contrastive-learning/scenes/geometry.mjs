// Scene 9: geometry - "Turn the query on the unit circle"
// Pure Cinema: glowing unit circle with live angular wake trail as the query rotates through
// 30 exact gradient-descent steps, paired with Start-vs-Now telemetry and a live loss curve.
import { arc, line, linear } from 'vizmatic/stage';
import {
  ANGLES,
  COLORS,
  COSMOS,
  NAMES,
  ROLE,
  START,
  cinemaAtmosphere,
  evaluate,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playAfter,
  playOn,
  rule,
  steps,
  txt,
  unitCircleDial,
  verifyApprox,
} from '../parts.mjs';

export default function geometry(s, c) {
  const path = steps(30);
  const startEval = evaluate(START);
  verifyApprox(evaluate(path[1]).probs[0] * 100, 68.2, 0.1, 'step 1 share 68.2%');
  verifyApprox(evaluate(path.at(-1)).probs[0] * 100, 96.4, 0.1, 'step 30 share 96.4%');

  const position = s.value(0);
  const showRule = s.value(0);
  const showDash = s.value(0);

  const curAngle = () => {
    const idx = Math.min(path.length - 1, Math.floor(position.value));
    const frac = position.value - idx;
    return path[idx] + ((path[idx + 1] ?? path[idx]) - path[idx]) * frac;
  };

  const title = heroTitle(['Turn the query', 'on the unit circle'], {
    x: -860,
    y: -450,
    size: 48,
    lineHeight: 56,
    accent: ROLE.anchor,
  });

  // Precompute all 31 loss points for mini descent curve on bottom-right
  const lossHistory = path.map((a) => evaluate(a).loss);
  const maxLoss = Math.max(...lossHistory) * 1.15;

  const stageLayer = guardedDynamic(s.value(1), () => {
    const pos = position.value;
    const ang = curAngle();
    const curEval = evaluate(ang);
    const stepNum = Math.floor(pos + 1e-7);
    const nodes = [];

    // Left: Glowing unit circle + angular wake arc from START -> ang
    const cx = -420;
    const cy = 65;
    const rad = 225;
    nodes.push(
      unitCircleDial({
        cx,
        cy,
        radius: rad,
        queryAngle: ang,
        dashAngle: showDash.value > 0.2 ? START : null,
        labelOffsets: [
          [26, 42, 'left'],
          [0, -54, 'center'],
          [-26, -42, 'right'],
        ],
      }),
    );

    // Glowing angular wake arc tracing the query's turn toward puppy runs
    if (Math.abs(START - ang) > 0.02) {
      const a0 = -START;
      const a1 = -ang;
      nodes.push(
        arc(rad, Math.min(a0, a1), Math.max(a0, a1), {
          fill: null,
          stroke: ROLE.anchor,
          width: 6,
        })
          .at(cx, cy)
          .glow(11, ROLE.anchor)
          .set('blend', 'screen'),
      );
    }

    nodes.push(
      txt('Query: "A dog is running"', cx, cy + rad + 72, 32, ROLE.anchor, 'sans', 'center').glow(
        5,
        ROLE.anchor,
      ),
    );

    // Right side: Start vs Now telemetry table (clean floating columns, zero boxes)
    const colLabel = 105;
    const colStart = 485;
    const colNow = 735;
    nodes.push(
      rule(55, -340, 55, 415, COSMOS.rule, 1.8).opacity(0.55),
      txt('START', colStart, -310, 26, COSMOS.dim, 'mono', 'center'),
      txt('NOW', colNow, -310, 26, ROLE.anchor, 'mono', 'center').glow(4, ROLE.anchor),
      rule(105, -280, 845, -280, COSMOS.rule, 1.4).opacity(0.55),
    );

    const rows = [
      ['Steps', '0', String(stepNum), ROLE.anchor],
      [
        'Angle',
        `${((START * 180) / Math.PI).toFixed(1)}°`,
        `${((ang * 180) / Math.PI).toFixed(1)}°`,
        ROLE.anchor,
      ],
      [
        'Puppy share',
        `${(100 * startEval.probs[0]).toFixed(1)}%`,
        `${(100 * curEval.probs[0]).toFixed(1)}%`,
        ROLE.positive,
      ],
      ['Loss (nats)', startEval.loss.toFixed(3), curEval.loss.toFixed(3), ROLE.focus],
    ];
    rows.forEach(([name, v0, v1, col], idx) => {
      const ry = -225 + idx * 66;
      nodes.push(
        txt(name, colLabel, ry, 30, COSMOS.muted, 'sans', 'left'),
        txt(v0, colStart, ry, 32, COSMOS.dim, 'mono', 'center'),
        txt(v1, colNow, ry, 34, col, 'mono', 'center').glow(5, col),
      );
    });

    // Update rule line
    if (showRule.value > 0.05) {
      nodes.push(
        txt('θ  ←  θ  −  0.03 × ∂L / ∂θ   (radians)', 475, 62, 28, ROLE.focus, 'mono', 'center')
          .glow(5, ROLE.focus)
          .opacity(showRule.value),
      );
    }

    // Mini glowing loss trajectory curve over steps 0..30 (bottom right)
    const gx0 = 155;
    const gy0 = 345;
    const gw = 660;
    const gh = 175;
    const mapX = (k) => gx0 + (k / 30) * gw;
    const mapY = (l) => gy0 - (l / maxLoss) * gh;

    nodes.push(
      txt('LOSS OVER 30 STEPS', gx0, gy0 - gh - 34, 26, COSMOS.muted, 'mono', 'left'),
      line([gx0, gy0], [gx0 + gw, gy0], { stroke: '#4c6294', width: 2 }),
      line([gx0, gy0], [gx0, gy0 - gh], { stroke: '#4c6294', width: 2 }),
      txt('0', gx0, gy0 + 30, 26, COSMOS.dim, 'mono', 'center'),
      txt('15', mapX(15), gy0 + 30, 26, COSMOS.dim, 'mono', 'center'),
      txt('30', mapX(30), gy0 + 30, 26, COSMOS.dim, 'mono', 'center'),
    );

    const trailPts = [];
    for (let k = 0; k <= stepNum; k++) {
      trailPts.push([mapX(k), mapY(lossHistory[k])]);
    }
    if (pos > stepNum) {
      trailPts.push([mapX(pos), mapY(curEval.loss)]);
    }
    if (trailPts.length >= 2) {
      nodes.push(glowingTrail(trailPts, { color: ROLE.focus, width: 4, glow: 8 }));
    }
    nodes.push(glowDot(mapX(pos), mapY(curEval.loss), { radius: 8, color: ROLE.focus, glow: 13 }));

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, stageLayer);

  playOn(s, c, 'geometry-slope', (d) => showRule.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'geometry-first',
    (d) => [showDash.to(1, { duration: Math.min(0.3, d) }), position.to(1, { duration: d })],
    0.95,
  );
  playOn(
    s,
    c,
    'geometry-continue',
    (d) => position.to(path.length - 1, { duration: d, ease: linear }),
    4.6,
  );
}
