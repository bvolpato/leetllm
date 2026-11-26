// Scene 3: shared: "One reader with two memory coordinates"
// Two shared weight matrices drive a live 2D phase-space comet trail (actor, verb)
// synchronized with glowing dual signed coordinate gauges.
import { arrow, line } from 'vizmatic/stage';
import {
  CAT_TRACE,
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowMatrix,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function shared(s, c) {
  const title = heroTitle(['One reader,', 'two memory coordinates'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.state,
  });

  // Compute exact 2-coordinate trace from CAT_TRACE + verb feature at "chased"
  const verbInputs = CAT_TRACE.words.map((w) => (w === 'chased' ? 0.8 : 0));
  const verbStates = [0];
  for (const x of verbInputs) {
    verbStates.push(Math.tanh(x + 0.9 * verbStates.at(-1)));
  }
  const actorStates = CAT_TRACE.states; // length 6: [0, 0, -0.664, -0.535, -0.448, -0.382]

  const wordXs = [-620, -310, 0, 310, 620];
  const wordY = -245;

  const cursorPos = s.value(0); // 0..4
  const showWx = s.value(0);
  const showWh = s.value(0);
  const stepIdx = s.value(0); // 0..5 (0 = start, 1 = The, 2 = cat, 3 = chased, 4 = the, 5 = dog)

  const wordRow = CAT_TRACE.words.map((w, i) => {
    const col = w === 'cat' ? ROLE.cat : w === 'chased' ? ROLE.state : ROLE.input;
    return tokenPill(w, wordXs[i], wordY, col, { w: 162, h: 54, size: 30 });
  });

  const cursorLayer = guardedDynamic(
    () => 1,
    () => {
      const idx = Math.max(0, Math.min(4, cursorPos.value));
      const i0 = Math.floor(idx);
      const i1 = Math.min(4, i0 + 1);
      const f = idx - i0;
      const cx = wordXs[i0] + (wordXs[i1] - wordXs[i0]) * f;
      return [
        glowingTrail(
          [
            [cx - 64, wordY + 42],
            [cx + 64, wordY + 42],
          ],
          { color: ROLE.gold, width: 5, glow: 12 },
        ),
        glowDot(cx, wordY + 42, { radius: 6, color: ROLE.gold, glow: 12 }),
      ];
    },
  );

  // Left: Shared weight matrices + equation
  const matrixLayer = guardedDynamic(
    () => Math.max(showWx.value, showWh.value),
    () => {
      const nodes = [];
      if (showWx.value > 0.02) {
        nodes.push(
          txt('Input matrix Wₓ', -610, -110, 28, ROLE.input, 'mono', 'center').opacity(
            showWx.value,
          ),
          glowMatrix({
            cx: -610,
            cy: 15,
            rows: 2,
            cols: 2,
            cellW: 94,
            cellH: 58,
            values: [
              ['1.0', '0.0'],
              ['0.0', '1.0'],
            ],
            colors: [
              [ROLE.input, COSMOS.dim],
              [COSMOS.dim, ROLE.input],
            ],
            highlight: (r, k) => r === k,
            opacity: showWx.value,
          }),
        );
      }
      if (showWh.value > 0.02) {
        nodes.push(
          txt('Recurrent matrix Wₕ', -245, -110, 28, ROLE.state, 'mono', 'center').opacity(
            showWh.value,
          ),
          glowMatrix({
            cx: -245,
            cy: 15,
            rows: 2,
            cols: 2,
            cellW: 94,
            cellH: 58,
            values: [
              ['0.9', '0.0'],
              ['0.0', '0.9'],
            ],
            colors: [
              [ROLE.state, COSMOS.dim],
              [COSMOS.dim, ROLE.state],
            ],
            highlight: (r, k) => r === k,
            opacity: showWh.value,
          }),
          glowTex('h_t = \\tanh(W_x x_t + W_h h_{t-1})', {
            x: -425,
            y: 165,
            size: 38,
            color: ROLE.gold,
            glow: 6,
          }).opacity(showWh.value),
        );
      }
      return nodes;
    },
  );

  // Helper to interpolate state smoothly at stepIdx in [0, 5]
  function stateAt(t) {
    const clamped = Math.max(0, Math.min(5, t));
    const i0 = Math.floor(clamped);
    const i1 = Math.min(5, i0 + 1);
    const f = clamped - i0;
    return [
      actorStates[i0] + (actorStates[i1] - actorStates[i0]) * f,
      verbStates[i0] + (verbStates[i1] - verbStates[i0]) * f,
    ];
  }

  // Right: 2D State-Space Phase Plane (actor on x-axis, verb on y-axis)
  const ox = 540;
  const oy = 115;
  const scale = 250;
  const toPlane = (a, v) => [ox + a * scale, oy - v * scale];

  const phasePlaneStatic = [
    txt('2D Hidden State Trajectory', ox - 30, -172, 30, COSMOS.ink, 'serif', 'center'),
    line([ox - 245, oy], [ox + 150, oy], { stroke: '#556894', width: 2.4 }),
    line([ox, oy + 90], [ox, oy - 195], { stroke: '#556894', width: 2.4 }),
    arrow([ox - 245, oy], [ox + 165, oy], { stroke: '#556894', width: 2.4, tip: 11 }),
    arrow([ox, oy + 90], [ox, oy - 208], { stroke: '#556894', width: 2.4, tip: 11 }),
    txt('actor h₁', ox + 178, oy, 26, ROLE.cat, 'mono', 'left'),
    txt('verb h₂', ox + 22, oy - 210, 26, ROLE.state, 'mono', 'left'),
  ];

  // Lower-left: Dual signed gauges synchronized with the 2D phase plane
  const liveLayer = guardedDynamic(
    () => 1,
    () => {
      const cur = stepIdx.value;
      const [aVal, vVal] = stateAt(cur);
      const nodes = [];

      // 2D phase-space comet trail
      const pts = [toPlane(0, 0)];
      const whole = Math.floor(cur);
      for (let k = 1; k <= whole; k++) {
        pts.push(toPlane(actorStates[k], verbStates[k]));
      }
      if (cur > whole) pts.push(toPlane(aVal, vVal));
      if (pts.length >= 2) {
        nodes.push(glowingTrail(pts, { color: ROLE.gold, width: 4.5, glow: 10 }));
      }
      for (let k = 2; k <= whole; k++) {
        const p = toPlane(actorStates[k], verbStates[k]);
        nodes.push(glowDot(p[0], p[1], { radius: 6, color: ROLE.state, glow: 8 }));
      }
      const head = toPlane(aVal, vVal);
      nodes.push(
        glowRing(head[0], head[1], 16, ROLE.gold, { width: 3, glow: 10 }),
        glowDot(head[0], head[1], { radius: 7, color: COSMOS.ink, glow: 12 }),
      );

      // Dual signed gauges along bottom
      const gauges = [
        { name: 'Actor h₁', val: aVal, col: ROLE.cat, y: 295 },
        { name: 'Verb h₂', val: vVal, col: ROLE.state, y: 380 },
      ];
      gauges.forEach(({ name, val, col, y }) => {
        const gLeft = -560;
        const gRight = 40;
        const gMid = (gLeft + gRight) / 2;
        const halfW = (gRight - gLeft) / 2;
        const tipX = gMid + val * halfW;
        nodes.push(
          txt(name, gLeft - 36, y, 28, col, 'mono', 'right'),
          line([gLeft, y], [gRight, y], { stroke: '#3c4d73', width: 4 }),
          line([gMid, y - 14], [gMid, y + 14], { stroke: '#6e83b7', width: 3 }),
          glowingTrail(
            [
              [gMid, y],
              [tipX, y],
            ],
            { color: col, width: 9, glow: 10 },
          ),
          glowDot(tipX, y, { radius: 8, color: col, glow: 12 }),
          txt(fmt(val, 3), gRight + 38, y, 34, col, 'mono', 'left'),
        );
      });

      return nodes;
    },
  );

  s.add(
    cinemaAtmosphere(ROLE.state, ROLE.cat),
    title,
    ...wordRow,
    cursorLayer,
    matrixLayer,
    ...phasePlaneStatic,
    liveLayer,
  );

  playCue(s, c, 'input-matrix', (d) => s.play(showWx.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'recurrent-matrix', (d) => s.play(showWh.to(1, { duration: d })), { dur: 0.55 });
  playCue(
    s,
    c,
    'shared-actor',
    (d) => s.play(cursorPos.to(1, { duration: d }), stepIdx.to(2, { duration: d })),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'shared-verb',
    (d) => s.play(cursorPos.to(2, { duration: d }), stepIdx.to(3, { duration: d })),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'shared-suffix',
    (d) => s.play(cursorPos.to(4, { duration: d }), stepIdx.to(5, { duration: d })),
    { dur: 1.35 },
  );
}
