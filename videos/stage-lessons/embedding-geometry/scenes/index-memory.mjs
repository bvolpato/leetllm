// Scene 19: index-memory: "Choose a search budget on a fixed graph"
// View 1: Exponential HNSW layer-retention beams (100% -> 3.125% -> 0.098%) + level-sampler formula.
// View 2: 2D Recall@10 vs p99 latency gate quadrant plotting ef=16, 48, 96 with withheld choice reveal.
// View 3: Proportional per-row byte-slab comparison (PQ 96 B vs base neighbor slots 256 B, 8-10×M rule).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
  withAlpha,
} from '../parts.mjs';

export default function indexMemory(s, c) {
  const M = 32;
  const slotBytes = 2 * M * 4; // 256 B
  const measured = [
    { ef: 16, recall: 0.89, ms: 42, ok: false },
    { ef: 48, recall: 0.97, ms: 56, ok: true },
    { ef: 96, recall: 0.99, ms: 78, ok: false },
  ];

  const vLayer = s.value(1);
  const vGate = s.value(0);
  const vMem = s.value(0);

  const l1Prog = s.value(0);
  const l2Prog = s.value(0);
  const showChoice = s.value(0);
  const slotProg = s.value(0);

  const title = heroTitle(['Choose a search budget', 'on a fixed graph'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.code,
    eyebrow: 'HNSW LEVELS · LATENCY GATE · GRAPH RAM',
  });

  const levelFormula = glowTex(
    '\\ell = \\left\\lfloor \\frac{-\\ln U}{\\ln M} \\right\\rfloor, \\quad \\frac{1}{\\ln 32} \\approx 0.289',
    { x: 470, y: -155, size: 36, color: ROLE.violet, glow: 7 },
  );

  // View 1: Exponential HNSW layer retention + parameters
  const layerView = guardedDynamic(vLayer, (alpha) => {
    const barL = -595;
    const maxW = 660;
    const p1 = l1Prog.value;
    const p2 = l2Prog.value;

    const nodes = [
      rule(125, -265, 125, 365, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('LAYER RETENTION  (M = 32, p = 1/M)', -855, -245, 26, ROLE.code, 'mono', 'left').opacity(
        alpha,
      ),
      // Layer 0 (100%)
      txt('Layer 0', -855, -145, 32, ROLE.query, 'mono', 'left').opacity(alpha),
      lumBar(barL + maxW / 2, -145, maxW, 50, {
        color: ROLE.query,
        fillAlpha: 0.34,
        glow: 8,
        opacity: alpha,
      }),
      txt('100.0%', barL + maxW - 18, -145, 28, COSMOS.ink, 'mono', 'right').opacity(alpha),

      // Layer 1 (3.125%)
      txt('Layer 1', -855, -35, 32, ROLE.A, 'mono', 'left').opacity(alpha),
      lumBar(barL + Math.max(14, maxW * 0.08 * p1) / 2, -35, Math.max(14, maxW * 0.08 * p1), 50, {
        color: ROLE.A,
        fillAlpha: 0.45,
        glow: 8,
        opacity: Math.max(0.15, p1) * alpha,
      }),
      ...(p1 > 0.02
        ? [
            txt('1 / 32  =  3.125%', barL + 84, -35, 30, ROLE.A, 'mono', 'left')
              .glow(6, ROLE.A)
              .opacity(p1 * alpha),
          ]
        : []),

      // Layer 2 (0.098%)
      txt('Layer 2', -855, 75, 32, ROLE.B, 'mono', 'left').opacity(alpha),
      lumBar(barL + 7, 75, 14, 50, {
        color: ROLE.B,
        fillAlpha: 0.55,
        glow: 9,
        opacity: Math.max(0.15, p2) * alpha,
      }),
      ...(p2 > 0.02
        ? [
            txt('1 / 1,024  =  0.098%', barL + 44, 75, 30, ROLE.B, 'mono', 'left')
              .glow(6, ROLE.B)
              .opacity(p2 * alpha),
          ]
        : []),

      // Right-bottom: 3 floating HNSW tuning knobs (no card chrome!)
      txt('HNSW TUNING PARAMETERS', 180, -30, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('M  →  link capacity (build time)', 180, 42, 30, ROLE.code, 'mono', 'left').opacity(
        alpha,
      ),
      txt('ef_construction  →  insertion work', 180, 108, 30, ROLE.violet, 'mono', 'left').opacity(
        alpha,
      ),
      txt('query ef  →  live search budget', 180, 174, 30, ROLE.gold, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        'Changing M or ef_construction requires a rebuild',
        180,
        262,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  // View 2: Recall@10 vs p99 Latency Gate Quadrant
  const gateView = guardedDynamic(vGate, (alpha) => {
    const ch = showChoice.value;

    // Plot area on left: x = p99 ms [30..90], y = Recall@10 [0.85..1.00]
    const pxL = -760;
    const pxR = 110;
    const pyB = 265;
    const pyT = -205;
    const mapMs = (ms) => pxL + ((ms - 30) / 60) * (pxR - pxL);
    const mapRec = (r) => pyB - ((r - 0.85) / 0.15) * (pyB - pyT);

    const gateX = mapMs(60);
    const gateY = mapRec(0.96);

    const nodes = [
      txt(
        'FEASIBLE SERVING ZONE  (Recall@10 ≥ 0.96, p99 ≤ 60 ms)',
        -855,
        -275,
        28,
        ROLE.code,
        'mono',
        'left',
      ).opacity(alpha),
      // Shaded feasible top-left quadrant
      rect(gateX - pxL, gateY - pyT, {
        fill: withAlpha(ROLE.A, 0.14),
        stroke: null,
      })
        .at((pxL + gateX) / 2, (pyT + gateY) / 2)
        .opacity(alpha),
      // Axes & gate threshold lines
      line([pxL, pyB], [pxR, pyB], { stroke: '#556c9e', width: 2.5 }).opacity(alpha),
      line([pxL, pyB], [pxL, pyT], { stroke: '#556c9e', width: 2.5 }).opacity(alpha),
      line([gateX, pyB], [gateX, pyT], { stroke: ROLE.gold, width: 3, dash: [10, 7] })
        .glow(6, ROLE.gold)
        .opacity(alpha),
      line([pxL, gateY], [pxR, gateY], { stroke: ROLE.gold, width: 3, dash: [10, 7] })
        .glow(6, ROLE.gold)
        .opacity(alpha),
      txt('p99 ≤ 60 ms', gateX + 14, pyB - 24, 26, ROLE.gold, 'mono', 'left').opacity(alpha),
      txt('Recall ≥ 0.96', pxR - 14, gateY - 26, 26, ROLE.gold, 'mono', 'right').opacity(alpha),
      txt('30 ms', pxL, pyB + 38, 26, COSMOS.dim, 'mono').opacity(alpha),
      txt('60 ms', gateX, pyB + 38, 26, ROLE.gold, 'mono').opacity(alpha),
      txt('90 ms', pxR, pyB + 38, 26, COSMOS.dim, 'mono').opacity(alpha),
      txt('0.85', pxL - 22, pyB, 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
      txt('1.00', pxL - 22, pyT, 26, COSMOS.dim, 'mono', 'right').opacity(alpha),
    ];

    // Plot the 3 ef points
    measured.forEach((row) => {
      const cx = mapMs(row.ms);
      const cy = mapRec(row.recall);
      const lit = ch > 0.5 && row.ok;
      const col = lit ? ROLE.A : ch > 0.5 && !row.ok ? ROLE.warn : ROLE.code;
      nodes.push(
        glowRing(cx, cy, lit ? 24 : 14, col, {
          width: lit ? 3.8 : 2.5,
          glow: lit ? 13 : 7,
          opacity: alpha,
        }),
        glowDot(cx, cy, { radius: 7, color: col, glow: 10, opacity: alpha }),
        txt(`ef=${row.ef}`, cx, cy - 50, 28, col, 'mono')
          .glow(lit ? 7 : 0, col)
          .opacity(alpha),
      );
    });

    // Right side: floating measurements + withheld prompt / chosen verdict
    const rx = 215;
    nodes.push(
      rule(175, -245, 175, 345, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('MEASURED RUNS', rx, -195, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    );
    measured.forEach((row, i) => {
      const ry = -110 + i * 95;
      const lit = ch > 0.5 && row.ok;
      const col = lit ? ROLE.A : ch > 0.5 ? ROLE.warn : COSMOS.ink;
      if (lit) {
        nodes.push(
          lumBar(rx + 305, ry, 620, 68, {
            color: ROLE.A,
            fillAlpha: 0.2,
            strokeWidth: 2.8,
            glow: 10,
            opacity: ch * alpha,
          }),
        );
      }
      nodes.push(
        txt(
          `ef = ${String(row.ef).padEnd(2)}  ·  R@10 ${row.recall.toFixed(2)}  ·  ${row.ms} ms`,
          rx + 18,
          ry,
          30,
          col,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    // Bottom prompt -> verdict (zero overlap!)
    if (ch < 0.5) {
      nodes.push(
        txt('Which ef setting meets both gates?', rx, 245, 36, ROLE.gold, 'serif', 'left')
          .glow(8, ROLE.gold)
          .opacity((1 - ch * 2) * alpha),
      );
    } else {
      nodes.push(
        txt('Use ef = 48 on this workload', rx, 232, 38, ROLE.A, 'serif', 'left')
          .glow(8, ROLE.A)
          .opacity(ch * alpha),
        txt(
          '16 misses recall  ·  96 exceeds 60 ms',
          rx,
          288,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(ch * alpha),
      );
    }

    return group(...nodes);
  });

  // View 3: Per-row graph link memory vs compressed PQ code
  const memView = guardedDynamic(vMem, (alpha) => {
    const sp = slotProg.value;
    const barL = -475;
    const maxW = 720;
    const wPq = (96 / 256) * maxW;
    const wSlots = maxW * sp;

    return group(
      txt('PER-ROW MEMORY FOOTPRINT  (M = 32)', -855, -235, 28, ROLE.code, 'mono', 'left').opacity(
        alpha,
      ),
      line([barL, -165], [barL, 125], { stroke: '#4c608e', width: 2.6 }).opacity(alpha),
      // Bar 1: PQ code (96 B)
      txt('PQ-96 code', barL - 28, -95, 34, ROLE.A, 'mono', 'right').opacity(alpha),
      lumBar(barL + wPq / 2, -95, wPq, 68, {
        color: ROLE.A,
        fillAlpha: 0.34,
        strokeWidth: 2.6,
        glow: 8,
        opacity: alpha,
      }),
      txt('96 B / row', barL + wPq + 28, -95, 34, ROLE.A, 'mono', 'left').opacity(alpha),

      // Bar 2: Base neighbor slots (2 * 32 * 4 = 256 B)
      txt('Base links (2M×4 B)', barL - 28, 45, 34, ROLE.warn, 'mono', 'right').opacity(alpha),
      ...(sp > 0.02
        ? [
            lumBar(barL + Math.max(16, wSlots) / 2, 45, Math.max(16, wSlots), 68, {
              color: ROLE.warn,
              fillAlpha: 0.34,
              strokeWidth: 2.8,
              glow: 10,
              opacity: sp * alpha,
            }),
            txt(
              `${slotBytes} B / row  (2.7× PQ code!)`,
              barL + Math.max(16, wSlots) + 28,
              45,
              32,
              ROLE.warn,
              'mono',
              'left',
            )
              .glow(7, ROLE.warn)
              .opacity(sp * alpha),
          ]
        : []),

      rule(-855, 190, 855, 190, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt(
        'hnswlib graph overhead rule of thumb:',
        -855,
        255,
        30,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        '≈ 8 to 10 × M bytes per row  (+ upper links & metadata)',
        -855,
        318,
        36,
        ROLE.gold,
        'mono',
        'left',
      )
        .glow(7, ROLE.gold)
        .opacity(alpha),
      txt(
        'Profile traversal and vector fetches before shrinking the code further',
        -855,
        382,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.gold), title, levelFormula, layerView, gateView, memView);

  playCue(s, c, 'layer1', (d) => s.play(l1Prog.to(1, { duration: d })), { after: true, dur: 0.9 });
  playCue(s, c, 'layer2', (d) => s.play(l2Prog.to(1, { duration: d })), { after: true, dur: 0.5 });

  c.hide('query', levelFormula);
  playCue(s, c, 'query', (d) => s.play(swapVis(vLayer, vGate, d)), { dur: 0.65 });
  playCue(s, c, 'choose', (d) => s.play(showChoice.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  playCue(s, c, 'memory', (d) => s.play(swapVis(vGate, vMem, d)), { dur: 0.65 });
  playCue(s, c, 'slots', (d) => s.play(slotProg.to(1, { duration: d })), {
    after: true,
    dur: 1.0,
  });
}
