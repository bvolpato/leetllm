// Scene 3: phases - Prefill builds. Decode extends.
// Act 1: Parallel Prefill pass + Causal Mask + 3D KV Crystal fill -> Serial Decode extension.
// Act 2: Compute-bound Prefill vs HBM Bandwidth-bound Decode + TTFT / ITL latency timeline.
import { delay, gridPlane3d, group, line, par, point3d, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  driftValue,
  fadeInNodes,
  glowBar,
  glowDot,
  glowingTrail,
  guardedDynamic,
  hideNodes,
  txt,
} from '../parts.mjs';

export default function phases(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const phase = s.value(0);

  // Act 1 state values
  const prefillProg = s.value(0);
  const maskVis = s.value(0);
  const scoreVis = s.value(0);
  const decodeVis = s.value(0);
  const appendStep = s.value(0);
  const orderVis = s.value(0);
  const parallelVis = s.value(0);

  // Act 2 state values
  const computeLevel = s.value(0.2);
  const bwLevel = s.value(0.2);
  const reloadVis = s.value(0);
  const twoNumVis = s.value(0);
  const ttftVis = s.value(0);
  const itlVis = s.value(0);
  const bothVis = s.value(0);

  // ── Act 1: Prefill -> 3D KV Crystal -> Decode ───────────────────────────────
  const act1Header = cinemaHeader(
    'TWO PHASES OF GENERATION',
    'Prefill builds.',
    'Decode extends.',
    {
      x: -860,
      y: -415,
      accent: ROLE.prefill,
      size: 54,
    },
  );

  const act1Aura = aura(240, 20, 620, '#60a5fa26', '#6ee7b716');

  const crystalView = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 16.0,
    unit: 86,
    focus: [0, 0, 0.95],
  }).at(285, -42);

  crystalView.add(
    gridPlane3d({
      x: [-4.2, 4.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.1,
      color: '#25395e',
      width: 1.2,
      opacity: 0.55,
    }),
  );

  // Outer translucent cache container
  addBox3D(crystalView, -3.7, -1.45, 0.05, 7.4, 2.9, 1.85, '#142644', ROLE.prefill, {
    faceOpacity: 0.14,
    edgeWidth: 1.8,
    edgeGlow: 5,
  });

  // 5 Prompt K/V slices filled in one parallel prefill wave
  const prefillSlices = [];
  for (let i = 0; i < 5; i++) {
    const x = -3.45 + i * 0.88;
    prefillSlices.push(
      ...addBox3D(crystalView, x, -1.18, 0.18, 0.68, 1.05, 1.48, ROLE.prefill, ROLE.key, {
        faceOpacity: 0.78,
        edgeWidth: 2.0,
        edgeGlow: 7,
      }),
      ...addBox3D(crystalView, x, 0.12, 0.18, 0.68, 1.05, 1.48, ROLE.value, ROLE.key, {
        faceOpacity: 0.74,
        edgeWidth: 1.8,
        edgeGlow: 6,
      }),
    );
  }
  hideNodes(prefillSlices);

  // 3 Decode slices appended one at a time on the right
  const decodeSlices = [];
  for (let i = 0; i < 3; i++) {
    const x = 1.05 + i * 0.88;
    const sl = [
      ...addBox3D(crystalView, x, -1.18, 0.18, 0.68, 1.05, 1.48, ROLE.fresh, ROLE.focus, {
        faceOpacity: 0.84,
        edgeWidth: 2.2,
        edgeGlow: 9,
      }),
      ...addBox3D(crystalView, x, 0.12, 0.18, 0.68, 1.05, 1.48, ROLE.fresh, ROLE.focus, {
        faceOpacity: 0.8,
        edgeWidth: 2.2,
        edgeGlow: 9,
      }),
      point3d([x + 0.34, 0, 2.08], { color: ROLE.focus, radius: 7, glow: 12, blend: 'screen' }),
    ];
    crystalView.add(sl.at(-1));
    decodeSlices.push(hideNodes(sl));
  }

  // Left-side 5x5 Causal Mask & Phase Flow Visualizer
  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const pf = prefillProg.value;
    const mk = maskVis.value;
    const sc = scoreVis.value;
    const dc = decodeVis.value;
    const ap = appendStep.value;
    const ord = orderVis.value;
    const parA = parallelVis.value;
    const ph = phase.value;
    const nodes = [];

    // 5x5 causal attention mask grid on left (-835 .. -535, y = -120 .. 180)
    const gx0 = -830;
    const gy0 = -105;
    const cell = 56;
    nodes.push(
      txt('PROMPT PREFILL (PARALLEL)', gx0 + 140, gy0 - 44, 26, ROLE.prefill, 'mono').opacity(a),
    );
    for (let r = 0; r < 5; r++) {
      for (let col = 0; col < 5; col++) {
        const cx = gx0 + col * cell + cell * 0.5;
        const cy = gy0 + r * cell + cell * 0.5;
        const allowed = col <= r;
        const isLast = r === 4 && col === 4 && sc > 0.2;
        let fill = '#0f172a';
        let stroke = '#25355a';
        if (pf > 0.1) {
          if (mk > 0.1) {
            fill = allowed ? (isLast ? '#3b2e0e' : '#133252') : '#120d1a';
            stroke = allowed ? (isLast ? ROLE.focus : ROLE.prefill) : '#2a1c30';
          } else {
            fill = '#133252';
            stroke = ROLE.prefill;
          }
        }
        nodes.push(
          rect(cell - 8, cell - 8, { fill, stroke, width: isLast ? 2.8 : 1.6, radius: 6 })
            .at(cx, cy)
            .opacity(a * (allowed || mk < 0.2 ? 0.92 : 0.35)),
        );
      }
    }

    if (mk > 0.05) {
      nodes.push(
        txt('Causal mask: j <= i', gx0 + 140, gy0 + 306, 26, ROLE.focus, 'mono').opacity(a * mk),
      );
    }
    if (sc > 0.05) {
      nodes.push(
        txt('Last prompt pos -> 1st answer scores', gx0 + 140, gy0 + 356, 26, ROLE.focus, 'sans')
          .glow(5, ROLE.focus)
          .opacity(a * sc),
      );
    }

    // Bottom-right decode cadence strip cleanly under 3D crystal (y = 372..448)
    nodes.push(
      txt(
        'KV CACHE CRYSTAL: 5 PROMPT + DECODE SLICES',
        285,
        -412,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    );
    if (dc > 0.02) {
      const k = Math.max(1, Math.min(3, Math.round(ap)));
      nodes.push(
        txt(
          ord > 0.2 ? `DECODE: 1 token at a time (step +${k})` : 'DECODE TAKES OVER',
          285,
          376,
          28,
          ROLE.fresh,
          'mono',
        )
          .glow(6, ROLE.fresh)
          .opacity(a * dc),
      );
      if (parA > 0.05) {
        const pulse = 0.65 + 0.35 * Math.sin(ph * 6);
        nodes.push(
          txt('Parallel GPU work inside each step', 285, 438, 28, ROLE.key, 'sans')
            .glow(5, ROLE.key)
            .opacity(a * parA * pulse),
        );
      }
    }

    return group(...nodes);
  });

  // ── Act 2: Compute vs Bandwidth Stress + TTFT / ITL Timeline ───────────────
  const act2Header = cinemaHeader('HARDWARE BOTTLENECKS', 'Two phases,', 'two bottlenecks', {
    x: -860,
    y: -415,
    accent: ROLE.link,
    size: 54,
  });

  const act2Aura = group(aura(-420, -40, 420, '#60a5fa22'), aura(420, -40, 460, '#fb923c24'));

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const comp = computeLevel.value;
    const bw = bwLevel.value;
    const rel = reloadVis.value;
    const twoN = twoNumVis.value;
    const tt = ttftVis.value;
    const it = itlVis.value;
    const bo = bothVis.value;
    const ph = phase.value;
    const nodes = [];

    // Left: Prefill Compute Saturation Gauge
    nodes.push(
      txt('PREFILL  ·  COMPUTE-HEAVY', -855, -165, 28, ROLE.prefill, 'mono', 'left')
        .glow(5, ROLE.prefill)
        .opacity(a),
      glowBar(-855, -110, 720, 42, comp, { fill: ROLE.prefill, glow: 10, opacity: a }),
      txt(
        'Parallel matrix ops saturate GPU compute',
        -855,
        -52,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    // Right: Decode HBM Bandwidth Funnel + Streaming Weight/KV Particles
    nodes.push(
      txt('DECODE  ·  MEMORY-BANDWIDTH BOUND', 85, -165, 28, ROLE.link, 'mono', 'left')
        .glow(5, ROLE.link)
        .opacity(a),
      glowBar(85, -110, 740, 42, bw, { fill: ROLE.waste, glow: 10, opacity: a }),
      txt(
        'Every token reloads weights + growing KV cache',
        85,
        -52,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    );

    // Animated HBM data stream flowing right-side
    if (rel > 0.02) {
      const streamPts = [
        [100, 38],
        [450, 38],
        [810, 38],
      ];
      nodes.push(
        beamWithPhotons(streamPts, ROLE.link, ph * 0.65, {
          width: 4.5,
          glow: 12,
          photonCount: 5,
          alpha: a * rel,
        }),
        txt('HBM WEIGHTS + KV CACHE  -->  COMPUTE CORES', 455, 86, 26, ROLE.link, 'mono').opacity(
          a * rel,
        ),
      );
    }

    // Bottom Full-Width Latency Timeline: skeleton always visible in Act 2, lights up on two-numbers/ttft/itl/both
    const yLine = 260;
    const baseA = a * Math.max(0.45, twoN);
    nodes.push(
      dashedRule(-855, 152, 855, 152, '#283657', 0.7 * a),
      line([-855, yLine], [855, yLine], { stroke: '#3a4c76', width: 2.6 }).opacity(a),
    );
    // TTFT span: Queue + Transport + Prefill -> Token 1
    const ttA = a * (twoN > 0.05 ? Math.max(0.35, tt) : 0.42);
    nodes.push(
      glowingTrail(
        [
          [-855, yLine],
          [-145, yLine],
        ],
        { color: ROLE.prefill, width: 8, glow: 12, opacity: ttA },
      ),
      glowDot(-855, yLine, { radius: 8, color: COSMOS.ink, glow: 8, opacity: baseA }),
      glowDot(-145, yLine, { radius: 10, color: ROLE.focus, glow: 14, opacity: baseA }),
      txt('TTFT: Time to First Token', -500, yLine - 48, 28, ROLE.prefill, 'mono')
        .glow(twoN > 0.1 ? 6 : 0, ROLE.prefill)
        .opacity(ttA),
      txt('queue + transport + prefill', -500, yLine + 48, 26, COSMOS.muted, 'sans').opacity(ttA),
    );

    // ITL spans: Token 1 -> 2 -> 3 -> 4
    const itA = a * (twoN > 0.05 ? Math.max(0.35, it) : 0.42);
    const tokXs = [-145, 175, 495, 815];
    nodes.push(
      glowingTrail(
        [
          [tokXs[0], yLine],
          [tokXs[3], yLine],
        ],
        { color: ROLE.fresh, width: 6, glow: 10, opacity: itA },
      ),
    );
    tokXs.slice(1).forEach((tx, idx) => {
      nodes.push(
        glowDot(tx, yLine, { radius: 9, color: ROLE.fresh, glow: 12, opacity: itA }),
        txt(`t${idx + 2}`, tx, yLine + 48, 26, ROLE.fresh, 'mono').opacity(itA),
      );
    });
    nodes.push(
      txt('ITL: Inter-Token Latency', 335, yLine - 48, 28, ROLE.fresh, 'mono')
        .glow(twoN > 0.1 ? 6 : 0, ROLE.fresh)
        .opacity(itA),
    );

    if (bo > 0.05) {
      nodes.push(
        txt('Measure TTFT and ITL separately', 0, 396, 32, ROLE.focus, 'mono')
          .glow(8, ROLE.focus)
          .opacity(a * bo),
      );
    }

    return group(...nodes);
  });

  // Start on Act 1
  s.add(act1Aura, crystalView, act1Header, act1Dyn, act2Dyn);
  driftValue(s, c, phase, 7.5, { startOffset: 0.1, endMargin: 0.5 });

  // Orbit crystal smoothly through Act 1
  const stressT = c.cue('stress').start;
  c.at(0.1, () => {
    const dur = Math.max(1.5, stressT - c.start - 0.5);
    s.play(crystalView.orbit({ theta: -0.38, phi: 0.94 }, { duration: dur }));
  });

  // Act 1 cues
  c.on('prefill', () => {
    s.play(prefillProg.to(1, { duration: clampDur(c, c.cue('prefill').start, 0.45) }));
  });
  c.on('mask', () => {
    s.play(maskVis.to(1, { duration: clampDur(c, c.cue('mask').start, 0.4) }));
  });
  c.on('fills', () => {
    fadeInNodes(s, c, c.cue('fills').start, prefillSlices, 0.45);
  });
  c.on('first-scores', () => {
    s.play(scoreVis.to(1, { duration: clampDur(c, c.cue('first-scores').start, 0.35) }));
  });
  c.on('decode', () => {
    const t = c.cue('decode').start;
    s.play(decodeVis.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, decodeSlices[0], 0.35);
  });
  c.on('appends', () => {
    const t = c.cue('appends').start;
    s.play(appendStep.to(2, { duration: clampDur(c, t, 0.5) }));
    fadeInNodes(s, c, t, decodeSlices[1], 0.35);
  });
  c.on('in-order', () => {
    const t = c.cue('in-order').start;
    s.play(
      par(
        orderVis.to(1, { duration: clampDur(c, t, 0.35) }),
        appendStep.to(3, { duration: clampDur(c, t, 0.4) }),
      ),
    );
    fadeInNodes(s, c, t, decodeSlices[2], 0.35);
  });
  c.on('parallel', () => {
    s.play(parallelVis.to(1, { duration: clampDur(c, c.cue('parallel').start, 0.35) }));
  });

  // Act 2 swap at "stress different things"
  c.swap('stress', [act1Aura, crystalView, act1Header], [act2Aura, act2Header]);
  c.on('stress', () => {
    const t = c.cue('stress').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
      ),
    );
  });

  c.on('compute', () => {
    s.play(computeLevel.to(0.92, { duration: clampDur(c, c.cue('compute').start, 0.55) }));
  });
  c.on('bandwidth', () => {
    s.play(bwLevel.to(0.94, { duration: clampDur(c, c.cue('bandwidth').start, 0.55) }));
  });
  c.on('reload', () => {
    s.play(reloadVis.to(1, { duration: clampDur(c, c.cue('reload').start, 0.4) }));
  });
  c.on('two-numbers', () => {
    s.play(twoNumVis.to(1, { duration: clampDur(c, c.cue('two-numbers').start, 0.35) }));
  });
  c.on('ttft', () => {
    s.play(ttftVis.to(1, { duration: clampDur(c, c.cue('ttft').start, 0.4) }));
  });
  c.on('itl', () => {
    s.play(itlVis.to(1, { duration: clampDur(c, c.cue('itl').start, 0.4) }));
  });
  c.on('both', () => {
    s.play(bothVis.to(1, { duration: clampDur(c, c.cue('both').start, 0.35) }));
  });
}
