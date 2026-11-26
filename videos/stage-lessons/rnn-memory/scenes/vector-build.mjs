// Scene 5: vector-build: "Which numbers enter the next state?"
// Luminous signal-flow architecture: W_x column selection + W_h recurrent feedback
// flow through glowing conduits into two coordinate nodes and a live 2D state trajectory.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  EVENTS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowArc,
  glowDot,
  glowMatrix,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  states,
  txt,
  vecStr,
  wh,
  wx,
} from '../parts.mjs';

export default function vectorBuild(s, c) {
  const title = heroTitle(['Which numbers enter', 'the next state?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.input,
  });

  // Precompute per-step input, recurrent, and output contributions from fixtures
  const stepData = EVENTS.map((ev, t) => {
    const prev = states[t];
    const fromIn = wx.map((row) => row[t]);
    const fromMem = wh.map((row) => row.reduce((acc, w, j) => acc + w * prev[j], 0));
    const oneHot = EVENTS.map((_, j) => (j === t ? 1 : 0));
    return { ev, prev, fromIn, fromMem, next: states[t + 1], oneHot };
  });

  // Discrete stage state:
  // activeCol: -1 (none selected) | 0 | 1 | 2
  // stepStage: 0 = banner only, 1 = input shown, 2 = memory shown, 3 = tanh result shown
  const activeStep = s.value(0); // 0, 1, 2
  const showColFrame = s.value(0);
  const stage = s.value(0); // 0..3
  const showWorked = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    () => {
      const t = Math.max(0, Math.min(2, Math.round(activeStep.value)));
      const st = Math.round(stage.value);
      const d = stepData[t];
      const nodes = [];

      // Top-right active step readout (centered cleanly inside safe right margin)
      nodes.push(
        txt(
          `${d.ev}  x=[${d.oneHot.join(',')}]  old h=${vecStr(d.prev, 3)}`,
          370,
          -390,
          28,
          ROLE.gold,
          'mono',
          'center',
        ),
      );

      // Upper-left: W_x matrix (2x3) with glowing active column
      nodes.push(txt('Input weights Wₓ', -575, -245, 28, ROLE.input, 'mono', 'center'));
      nodes.push(
        glowMatrix({
          cx: -575,
          cy: -100,
          rows: 2,
          cols: 3,
          cellW: 118,
          cellH: 62,
          gap: 12,
          values: wx.map((row) => row.map((v) => v.toFixed(1))),
          colLabels: ['err', 'repro', 'roll'],
          highlight: (_, k) => showColFrame.value > 0.5 && k === t,
          dim: (_, k) => showColFrame.value > 0.5 && k !== t,
          colors: wx.map((row) => row.map(() => ROLE.input)),
        }),
      );

      // Upper-center: W_h matrix (2x2)
      nodes.push(txt('Recurrent weights Wₕ', -105, -245, 28, ROLE.state, 'mono', 'center'));
      nodes.push(
        glowMatrix({
          cx: -105,
          cy: -100,
          rows: 2,
          cols: 2,
          cellW: 118,
          cellH: 62,
          gap: 12,
          values: wh.map((row) => row.map((v) => v.toFixed(1))),
          colLabels: ['h₁', 'h₂'],
          highlight: () => st >= 2,
          colors: wh.map((row) => row.map(() => ROLE.state)),
        }),
      );

      // Worked dot product callout cleanly placed in open upper-right space (zero arc crossings)
      if (showWorked.value > 0.02) {
        nodes.push(
          glowTex('0.5(0.664) + 0.1(0.100) \\approx 0.342', {
            x: 370,
            y: -318,
            size: 32,
            color: ROLE.state,
            glow: 7,
          }).opacity(showWorked.value),
        );
      }

      // Lower luminous signal-flow rails for coord 1 and coord 2
      const rowYs = [175, 315];
      const xIn = -565;
      const xMem = -255;
      const xOut = 65;

      nodes.push(
        txt('Wₓ xₜ (input)', xIn, 96, 28, ROLE.input, 'mono', 'center'),
        txt('Wₕ hₜ₋₁ (memory)', xMem, 96, 28, ROLE.state, 'mono', 'center'),
        txt('tanh(sum)', xOut, 96, 28, ROLE.gold, 'mono', 'center'),
      );

      for (let r = 0; r < 2; r++) {
        const y = rowYs[r];
        nodes.push(
          txt(`coord ${r + 1}`, -790, y, 28, COSMOS.muted, 'mono', 'left'),
          txt('+', (xIn + xMem) / 2, y, 36, COSMOS.muted, 'mono', 'center'),
          txt('→', (xMem + xOut) / 2, y, 36, COSMOS.muted, 'mono', 'center'),
        );

        // Input node
        if (st >= 1) {
          nodes.push(
            lumBar(xIn, y, 160, 62, { color: ROLE.input, fillOpacity: 0.25, glow: 8 }),
            txt(fmt(d.fromIn[r], 3), xIn, y, 34, ROLE.input, 'mono', 'center'),
          );
        } else {
          nodes.push(
            lumBar(xIn, y, 160, 62, {
              color: COSMOS.dim,
              fillOpacity: 0.08,
              glow: 0,
              dash: [6, 6],
            }),
          );
        }

        // Recurrent memory node
        if (st >= 2) {
          nodes.push(
            lumBar(xMem, y, 160, 62, { color: ROLE.state, fillOpacity: 0.25, glow: 8 }),
            txt(fmt(d.fromMem[r], 3), xMem, y, 34, ROLE.state, 'mono', 'center'),
          );
        } else {
          nodes.push(
            lumBar(xMem, y, 160, 62, {
              color: COSMOS.dim,
              fillOpacity: 0.08,
              glow: 0,
              dash: [6, 6],
            }),
          );
        }

        // Resulting tanh(sum) node
        if (st >= 3) {
          nodes.push(
            lumBar(xOut, y, 170, 64, { color: ROLE.gold, fillOpacity: 0.3, glow: 10 }),
            txt(fmt(d.next[r], 3), xOut, y, 36, ROLE.gold, 'mono', 'center'),
          );
        } else {
          nodes.push(
            lumBar(xOut, y, 170, 64, {
              color: COSMOS.dim,
              fillOpacity: 0.08,
              glow: 0,
              dash: [6, 6],
            }),
          );
        }
      }

      // Conduit arcs from matrices down into lower signal row
      if (st >= 1) {
        const colOffset = (t - 1) * 130;
        nodes.push(
          glowArc([-575 + colOffset, -15], [xIn, 64], 24, {
            color: ROLE.input,
            width: 3,
            glow: 7,
            opacity: 0.78,
          }),
        );
      }
      if (st >= 2) {
        nodes.push(
          glowArc([-105, -15], [xMem, 64], 24, {
            color: ROLE.state,
            width: 3,
            glow: 7,
            opacity: 0.78,
          }),
        );
      }

      // Right side: Live 2D state space trajectory h_0 -> h_1 -> h_2 -> h_3
      const ox = 365;
      const oy = 310;
      const sc = 430;
      const toP = (v) => [ox + v[0] * sc, oy - v[1] * sc];
      nodes.push(
        txt('2D State Space (h₁, h₂)', ox + 215, -245, 30, COSMOS.ink, 'serif', 'center'),
        line([ox - 20, oy], [ox + 440, oy], { stroke: '#556894', width: 2.5 }),
        line([ox, oy + 20], [ox, oy - 440], { stroke: '#556894', width: 2.5 }),
        txt('h₁', ox + 455, oy, 26, COSMOS.muted, 'mono', 'left'),
        txt('h₂', ox, oy - 462, 26, COSMOS.muted, 'mono', 'center'),
        glowDot(ox, oy, { radius: 6, color: COSMOS.muted, glow: 4 }),
      );

      const maxShown = st >= 3 ? t + 1 : t;
      const pts = [];
      for (let k = 0; k <= maxShown; k++) pts.push(toP(states[k]));
      if (pts.length >= 2) {
        nodes.push(glowingTrail(pts, { color: ROLE.gold, width: 4.5, glow: 10 }));
      }
      const lblOffsets = [
        [0, 0],
        [44, 0],
        [48, 8],
        [-48, -36],
      ];
      for (let k = 1; k <= maxShown; k++) {
        const p = toP(states[k]);
        const isLatest = k === maxShown;
        const [oxLbl, oyLbl] = lblOffsets[k];
        nodes.push(
          glowDot(p[0], p[1], {
            radius: isLatest ? 9 : 6.5,
            color: isLatest ? ROLE.gold : ROLE.state,
            glow: isLatest ? 12 : 7,
          }),
          txt(
            `h${k}`,
            p[0] + oxLbl,
            p[1] + oyLbl,
            28,
            isLatest ? ROLE.gold : ROLE.state,
            'mono',
            'center',
          ),
        );
        if (isLatest) {
          nodes.push(glowRing(p[0], p[1], 18, ROLE.gold, { width: 2.6, glow: 8 }));
        }
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.input, ROLE.state), title, layer);

  playCue(s, c, 'vector-columns', () => showColFrame.set(1), { dur: 0.25 });
  playCue(s, c, 'vector-build-1', () => stage.set(1), { dur: 0.25 });
  playCue(s, c, 'vector-first-memory', () => stage.set(2), { dur: 0.25 });
  playCue(s, c, 'vector-first-reveal', () => stage.set(3), { dur: 0.25 });

  playCue(
    s,
    c,
    'vector-second-start',
    () => {
      activeStep.set(1);
      stage.set(1);
    },
    { dur: 0.25 },
  );
  playCue(s, c, 'worked-product', (d) => s.play(showWorked.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'vector-second-memory', () => stage.set(2), { dur: 0.25 });
  playCue(s, c, 'vector-second-reveal', () => stage.set(3), { dur: 0.25 });

  playCue(
    s,
    c,
    'vector-build-2',
    (d) => {
      activeStep.set(2);
      stage.set(1);
      s.play(showWorked.to(0, { duration: Math.min(0.3, d) }));
    },
    { dur: 0.35 },
  );
  playCue(s, c, 'vector-third-memory', () => stage.set(2), { dur: 0.25 });
  playCue(s, c, 'vector-third-reveal', () => stage.set(3), { dur: 0.25 });
}
