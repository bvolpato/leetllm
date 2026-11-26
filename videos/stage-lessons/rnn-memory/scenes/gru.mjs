// Scene 15: gru: "How much of the previous state survives?"
// Luminous convex-blend theater: dual-color tug-of-war rail between candidate (-0.20)
// and previous state (+0.80) coupled to live keep/write share bars and MathJax equation.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function gru(s, c) {
  const title = heroTitle(['How much of the previous', 'state survives?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.state,
  });

  const oldVal = 0.8;
  const candVal = -0.2;
  const keep = s.value(0.95);
  const showWeights = s.value(0);
  const showCursor = s.value(0);
  const showQ = s.value(0);
  const showReset = s.value(0);

  const leftX = -620;
  const rightX = 620;
  const railY = -10;
  const xAtZ = (z) => leftX + z * (rightX - leftX);
  const mixVal = (z) => z * oldVal + (1 - z) * candVal;

  const staticElements = [
    glowTex('h_t = z_t \\cdot h_{t-1} + (1 - z_t) \\cdot \\tilde{h}_t', {
      x: 420,
      y: -395,
      size: 38,
      color: ROLE.gold,
      glow: 7,
    }),
    // Endpoint orbs and labels cleanly above the rail
    glowRing(leftX, railY, 24, ROLE.grad, { width: 3.2, glow: 10 }),
    txt('Candidate  −0.20', leftX, railY - 68, 30, ROLE.grad, 'mono', 'center'),
    glowRing(rightX, railY, 24, ROLE.state, { width: 3.2, glow: 10 }),
    txt('Previous h  +0.80', rightX, railY - 68, 30, ROLE.state, 'mono', 'center'),
    // Main rail & reference ticks (0, zero-crossing at z=0.2, midpoint at z=0.5, 1)
    line([leftX + 26, railY], [rightX - 26, railY], { stroke: '#3e4e73', width: 7 }),
    ...[0.2, 0.5].map((z) => {
      const tx = xAtZ(z);
      return line([tx, railY - 18], [tx, railY + 18], { stroke: '#6e83b7', width: 3 });
    }),
    txt('0.0', xAtZ(0.2), railY + 46, 28, COSMOS.muted, 'mono', 'center'),
    txt('z = 0.50', xAtZ(0.5), railY + 46, 26, COSMOS.dim, 'mono', 'center'),
    // Conserved update-gate track ready from t=0 (prevents empty space before gru-weights)
    lumBar(0, 175, 920, 46, {
      color: '#4e6396',
      fillOpacity: 0.14,
      strokeWidth: 2,
      glow: 0,
      dash: [8, 6],
    }),
    txt(
      'Update gate zₜ splits 100% between keeping hₜ₋₁ and writing h̃ₜ',
      0,
      298,
      26,
      COSMOS.muted,
      'sans',
      'center',
    ),
  ];

  const liveLayer = guardedDynamic(
    () => 1,
    () => {
      const z = keep.value;
      const w = 1 - z;
      const m = mixVal(z);
      const cx = xAtZ(z);
      const nodes = [];

      // Dual-color tension beams pulling from candidate (left) and previous state (right)
      if (showCursor.value > 0.02) {
        const cA = showCursor.value;
        nodes.push(
          glowingTrail(
            [
              [leftX + 26, railY],
              [cx, railY],
            ],
            { color: ROLE.grad, width: 7.5, glow: 10, opacity: (0.25 + 0.75 * w) * cA },
          ),
          glowingTrail(
            [
              [cx, railY],
              [rightX - 26, railY],
            ],
            { color: ROLE.state, width: 7.5, glow: 10, opacity: (0.25 + 0.75 * z) * cA },
          ),
          glowRing(cx, railY, 24, ROLE.gold, { width: 3.6, glow: 12, opacity: cA }),
          glowDot(cx, railY, { radius: 10, color: COSMOS.ink, glow: 14, opacity: cA }),
          txt((m >= 0 ? '+' : '') + fmt(m, 3), cx, railY - 120, 46, ROLE.gold, 'mono', 'center')
            .glow(10, ROLE.gold)
            .opacity(cA),
        );
      }

      // Conserved keep + write weight ribbon below the rail
      if (showWeights.value > 0.02) {
        const wA = showWeights.value;
        const barY = 175;
        const barW = 920;
        const barLeft = -barW / 2;
        const keepW = Math.max(8, z * barW);
        const writeW = Math.max(8, w * barW);

        nodes.push(
          txt(
            `h = ${z.toFixed(2)} × (+0.80)  +  ${w.toFixed(2)} × (−0.20)`,
            0,
            106,
            34,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(wA),
          lumBar(barLeft + keepW / 2, barY, keepW - 4, 46, {
            color: ROLE.state,
            fillOpacity: 0.42,
            glow: 9,
            opacity: wA,
          }),
          lumBar(barLeft + keepW + writeW / 2, barY, writeW - 4, 46, {
            color: ROLE.grad,
            fillOpacity: 0.42,
            glow: 9,
            opacity: wA,
          }),
          txt(
            `keep z = ${Math.round(z * 100)}%`,
            -350,
            barY + 58,
            28,
            ROLE.state,
            'mono',
            'center',
          ).opacity(wA),
          txt(
            `write (1 − z) = ${Math.round(w * 100)}%`,
            350,
            barY + 58,
            28,
            ROLE.grad,
            'mono',
            'center',
          ).opacity(wA),
        );
      }

      // Bottom prompt vs reset gate preview (mutually exclusive)
      if (showQ.value > 0.02 && showReset.value < 0.02) {
        nodes.push(
          txt(
            'What happens when you keep half (z = 0.50)? Where does the marker land?',
            0,
            365,
            34,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showQ.value),
        );
      }
      if (showReset.value > 0.02) {
        nodes.push(
          txt(
            'Reset gate rₜ acts earlier: controls how much of hₜ₋₁ enters candidate h̃ₜ',
            0,
            365,
            30,
            ROLE.gate,
            'sans',
            'center',
          ).opacity(showReset.value),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.state, ROLE.grad), title, ...staticElements, liveLayer);

  playCue(s, c, 'gru-weights', (d) => s.play(showWeights.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'gru-start', (d) => s.play(showCursor.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'gru-question', (d) => s.play(showQ.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'gru-midpoint', (d) => s.play(keep.to(0.5, { duration: d })), { dur: 1.15 });
  playCue(s, c, 'gru-replace', (d) => s.play(keep.to(0.05, { duration: d })), { dur: 1.15 });
  playCue(
    s,
    c,
    'gru-reset',
    (d) => s.play(showQ.to(0, { duration: d * 0.4 }), showReset.to(1, { duration: d * 0.6 })),
    { dur: 0.55 },
  );
}
