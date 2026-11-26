// Scene 16: goodput-capacity - More useful work can accompany a worse promise
// Signature orbiting 3D Goodput-vs-SLO Latency Frontier (cinematic3d + orbitScene) paired with
// glowing side-by-side comparison of 1.5 RPS (95%, 1.43 useful/s) vs 2.0 RPS (80%, 1.60 useful/s).
import { curve3d, gridPlane3d, group, line3d, parametricSurface, point3d } from 'vizmatic/stage';
import {
  COSMOS,
  GOODPUT_CASES,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  glowBar,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  rates,
  txt,
} from '../parts.mjs';

export default function goodputCapacity(s, c) {
  const phase = s.value(0);
  const run1Lit = s.value(0.25);
  const run2Lit = s.value(0);
  const drainLit = s.value(0);

  const header = cinemaHeader('GOODPUT VS CAPACITY', 'More useful work,', 'worse promise', {
    x: -860,
    y: -435,
    accent: ROLE.qualified,
    size: 50,
  });

  const stageAura = aura(300, 15, 640, '#6ee7b722', '#ff6b8b1a');

  // Orbiting 3D Goodput-vs-Attainment Operating Frontier on right half!
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 15.6,
    unit: 112,
    focus: [0, 0, 1.1],
  }).at(310, 35);

  // Floor grid: X = offered RPS (-2.4..2.4), Y = attainment (-1.8..1.8), Z = goodput (0..3.0)
  view3d.add(
    gridPlane3d({
      x: [-2.8, 2.8],
      y: [-2.0, 2.0],
      z: 0,
      step: 1.0,
      color: '#25385e',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  // Translucent gold 95% SLO floor curtain across the 3D arena (y = 0.85)
  const sloY = 0.85;
  view3d.add(
    parametricSurface((u, v) => [-2.6 + u * 5.2, sloY, v * 2.8], [0, 1], [0, 1], {
      resolution: [1, 1],
      color: ROLE.slo,
      opacity: 0.22,
      mesh: false,
      shaded: false,
    }),
    line3d([-2.6, sloY, 2.8], [2.6, sloY, 2.8], {
      color: ROLE.slo,
      width: 3.0,
      glow: 9,
      blend: 'screen',
    }),
  );

  // 3D towers for the 5 sweep operating points: X = rps, Y = attainment, height Z = goodput
  const mapX = (rps) => -2.2 + ((rps - 0.5) / 2.0) * 4.4;
  const mapY = (att) => -1.6 + ((att - 0.5) / 0.5) * 2.8;
  const mapZ = (gp) => Math.max(0.3, gp * 1.65);

  const pts3d = rates.map((pt) => {
    const gp = pt.rps * pt.attainment;
    return [mapX(pt.rps), mapY(pt.attainment), mapZ(gp)];
  });

  // Glowing 3D frontier curve threading all 5 operating peaks
  view3d.add(
    curve3d(
      (t) => {
        const seg = t * (pts3d.length - 1);
        const i = Math.min(pts3d.length - 2, Math.floor(seg));
        const f = seg - i;
        return [
          pts3d[i][0] + (pts3d[i + 1][0] - pts3d[i][0]) * f,
          pts3d[i][1] + (pts3d[i + 1][1] - pts3d[i][1]) * f,
          pts3d[i][2] + (pts3d[i + 1][2] - pts3d[i][2]) * f,
        ];
      },
      0,
      1,
      { color: ROLE.open, width: 3.6, glow: 10, blend: 'screen', samples: 40 },
    ),
  );

  // Build 3D columns: passing (0.5, 1.0, 1.5) visible immediately; 2.0 & 2.5 fade in at goodput-second-run!
  const failTowers = [];
  rates.forEach((pt, i) => {
    const gp = pt.rps * pt.attainment;
    const cx = mapX(pt.rps);
    const cy = mapY(pt.attainment);
    const hz = mapZ(gp);
    const pass = pt.attainment >= 0.95 && pt.backlog === 'flat';
    const col = pass ? (pt.rps === 1.5 ? ROLE.qualified : ROLE.open) : ROLE.fail;
    const tower = addBox3D(view3d, cx - 0.28, cy - 0.28, 0.03, 0.56, 0.56, hz, col, col, {
      faceOpacity: 0.84,
      edgeWidth: 2.2,
      edgeGlow: 8,
    });
    const peak = point3d([cx, cy, hz + 0.08], {
      color: '#ffffff',
      radius: 6.2,
      glow: 11,
      blend: 'screen',
    });
    view3d.add(peak);
    if (!pass) failTowers.push(...tower, peak);
  });
  hideNodes(failTowers);

  const goodputEq = glowTex(String.raw`G = \frac{\text{qualified}}{\Delta t}`, {
    x: -630,
    y: -210,
    size: 38,
    color: ROLE.open,
    glow: 7,
  });

  const leftPanel = guardedDynamic(
    () => 1,
    () => {
      const r1 = run1Lit.value;
      const r2 = run2Lit.value;
      const dr = drainLit.value;

      const c1 = GOODPUT_CASES[0]; // 1.5 RPS, 190/200 = 95%, 1.43 useful/s
      const c2 = GOODPUT_CASES[1]; // 2.0 RPS, 160/200 = 80%, 1.60 useful/s

      const nodes = [
        // 3D stage caption
        txt('3D GOODPUT-VS-SLO FRONTIER', 310, -412, 26, ROLE.slo, 'mono').glow(5, ROLE.slo),
        txt('Gold wall = 95% SLO  ·  Height = useful req/s', 310, 444, 26, COSMOS.muted, 'mono'),

        // Case 1: 1.5 offered/s (emerald PASS)
        txt('1.5 OFFERED /s  (133.3 s)', -860, -108, 28, ROLE.qualified, 'mono', 'left')
          .glow(5, ROLE.qualified)
          .opacity(0.65 + 0.35 * r1),
        glowBar(-860, -54, 590, 32, (c1.qualified / c1.n) * (0.4 + 0.6 * r1), {
          fill: ROLE.qualified,
          glow: 9,
          radius: 8,
        }),
        txt(`190 / 200 = 95%  ·  1.43 useful /s`, -860, 4, 28, COSMOS.ink, 'mono', 'left').opacity(
          0.6 + 0.4 * r1,
        ),
      ];

      // Case 2: 2.0 offered/s (rose FAIL with HIGHER useful/s!)
      if (r2 > 0.05) {
        nodes.push(
          txt('2.0 OFFERED /s  (100.0 s)', -860, 102, 28, ROLE.fail, 'mono', 'left')
            .glow(5, ROLE.fail)
            .opacity(r2),
          glowBar(-860, 156, 590, 32, (c2.qualified / c2.n) * r2, {
            fill: ROLE.fail,
            glow: 9,
            radius: 8,
            opacity: r2,
          }),
          txt(`160 / 200 = 80%  ·  1.60 useful /s`, -860, 214, 28, ROLE.fail, 'mono', 'left')
            .glow(6, ROLE.fail)
            .opacity(r2),
          txt('40 misses & growing backlog!', -860, 268, 26, ROLE.burst, 'sans', 'left').opacity(
            r2,
          ),
        );
      }

      if (dr > 0.1) {
        nodes.push(
          txt(
            'Drain adds time  ·  Name goodput vs DistServe per-GPU capacity',
            -860,
            364,
            26,
            ROLE.focus,
            'sans',
            'left',
          ).opacity(dr),
        );
      } else {
        nodes.push(
          txt(
            'Capacity = max tested rate meeting SLO, schedule & flat queue',
            -860,
            364,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, view3d, header, goodputEq, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('goodput-capacity-beat-0', () => {
    const t = c.cue('goodput-capacity-beat-0').start;
    s.play(run1Lit.to(0.65, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('goodput-capacity-beat-1', () => {
    const t = c.cue('goodput-capacity-beat-1').start;
    s.play(run1Lit.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('goodput-second-run', () => {
    const t = c.cue('goodput-second-run').start;
    s.play(run2Lit.to(1, { duration: clampDur(c, t, 0.5) }));
    fadeInNodes(s, c, t, failTowers, 0.5);
  });
  c.on('goodput-capacity-beat-2', () => {
    const t = c.cue('goodput-capacity-beat-2').start;
    s.play(drainLit.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
