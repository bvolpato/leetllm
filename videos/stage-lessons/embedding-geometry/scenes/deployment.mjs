// Scene 21: deployment: "A budget for fifty million vectors"
// Visual dual-track serving architecture (Exact FP32 Reference vs INT8 Search + Fetch + Rescore)
// sharing a glowing versioned anchor rail, proportional storage slabs (153.6 + 38.4 = 192.0 GB),
// and an interactive 60 ms p99 end-to-end latency gauge.
import { arrow, dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';

export default function deployment(s, c) {
  const origGb = 153.6;
  const codeGb = 38.4;
  const bothGb = 192.0;

  const candLit = s.value(0);
  const showCode = s.value(0);
  const showBoth = s.value(0);
  const vPremise = s.value(1);
  const vAsk = s.value(0);
  const vTime = s.value(0);

  const title = heroTitle(['A budget for', 'fifty million vectors'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.code,
    eyebrow: 'DEPLOYMENT · 50M × 768D · p99 ≤ 60 ms',
  });

  const stageLayer = dynamic(() => {
    const cLit = candLit.value;
    const sc = showCode.value;
    const sb = showBoth.value;

    const nodes = [
      // Top shared versioned contract strip (floating glowing badges, zero boxy bullet card!)
      txt('SHARED ACROSS BOTH RUNS:', -855, -262, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        'Encoder v1  ·  768d Unit Norm  ·  Permissions  ·  Judged Queries',
        -430,
        -262,
        28,
        ROLE.code,
        'mono',
        'left',
      ).glow(5, ROLE.code),
      rule(-855, -218, 855, -218, COSMOS.rule, 1.8).opacity(0.6),
      rule(65, -195, 65, 225, COSMOS.rule, 1.8).opacity(0.6),
    ];

    // Left: Dual-track visual retrieval architecture
    nodes.push(
      // Track 1: Exact FP32 reference
      txt('1. EXACT REFERENCE', -855, -155, 26, ROLE.query, 'mono', 'left'),
      lumBar(-685, -75, 320, 68, {
        color: ROLE.query,
        fillAlpha: 0.22,
        strokeWidth: 2.4,
        glow: 7,
      }),
      txt('Scan eligible FP32', -685, -75, 28, ROLE.query, 'mono'),
      arrow([-515, -75], [-385, -75], { stroke: ROLE.query, width: 3, tip: 12 }),
      lumBar(-215, -75, 310, 68, {
        color: ROLE.A,
        fillAlpha: 0.2,
        strokeWidth: 2.2,
        glow: 6,
      }),
      txt('Exact unit dot', -215, -75, 28, ROLE.A, 'mono'),

      // Track 2: Candidate INT8 + Fetch + Rescore
      txt('2. CANDIDATE RUN', -855, 45, 26, cLit > 0.3 ? ROLE.gold : COSMOS.dim, 'mono', 'left'),
      lumBar(-710, 125, 270, 68, {
        color: cLit > 0.3 ? ROLE.code : '#3c507c',
        fillAlpha: cLit > 0.3 ? 0.24 : 0.1,
        strokeWidth: cLit > 0.3 ? 2.6 : 1.6,
        glow: cLit > 0.3 ? 9 : 2,
      }),
      txt('INT8 search', -710, 125, 28, cLit > 0.3 ? ROLE.code : COSMOS.dim, 'mono'),
      arrow([-565, 125], [-475, 125], {
        stroke: cLit > 0.3 ? ROLE.gold : '#3c507c',
        width: 3,
        tip: 11,
      }),
      lumBar(-340, 125, 245, 68, {
        color: cLit > 0.3 ? ROLE.gold : '#3c507c',
        fillAlpha: cLit > 0.3 ? 0.22 : 0.1,
        strokeWidth: cLit > 0.3 ? 2.6 : 1.6,
        glow: cLit > 0.3 ? 9 : 2,
      }),
      txt('Fetch FP32', -340, 125, 28, cLit > 0.3 ? ROLE.gold : COSMOS.dim, 'mono'),
      arrow([-208, 125], [-118, 125], {
        stroke: cLit > 0.3 ? ROLE.A : '#3c507c',
        width: 3,
        tip: 11,
      }),
      lumBar(-20, 125, 175, 68, {
        color: cLit > 0.3 ? ROLE.A : '#3c507c',
        fillAlpha: cLit > 0.3 ? 0.24 : 0.1,
        strokeWidth: cLit > 0.3 ? 2.6 : 1.6,
        glow: cLit > 0.3 ? 9 : 2,
      }),
      txt('Rescore', -20, 125, 28, cLit > 0.3 ? ROLE.A : COSMOS.dim, 'mono'),
    );

    // Right: Proportional storage ledger slabs (GB)
    const barL = 125;
    const maxW = 540;
    const wOrig = (origGb / bothGb) * maxW;
    const wCode = (codeGb / bothGb) * maxW;

    nodes.push(
      txt('STORAGE BILL (DECIMAL GB)', barL, -155, 26, COSMOS.muted, 'mono', 'left'),
      // Retained FP32
      txt('Retained FP32 (cold/disk ok)', barL, -98, 26, ROLE.query, 'mono', 'left'),
      lumBar(barL + wOrig / 2, -52, wOrig, 44, {
        color: ROLE.query,
        fillAlpha: 0.32,
        glow: 7,
      }),
      txt(`${origGb.toFixed(1)} GB`, barL + wOrig + 22, -52, 30, ROLE.query, 'mono', 'left'),
    );

    // Added INT8 codes
    if (sc > 0.02) {
      nodes.push(
        txt('Added INT8 codes (hot RAM)', barL, 12, 26, ROLE.code, 'mono', 'left').opacity(sc),
        lumBar(barL + (wCode * sc) / 2, 58, Math.max(12, wCode * sc), 44, {
          color: ROLE.code,
          fillAlpha: 0.38,
          glow: 8,
          opacity: sc,
        }),
        txt(
          `${codeGb.toFixed(1)} GB`,
          barL + wCode + 22,
          58,
          30,
          ROLE.code,
          'mono',
          'left',
        ).opacity(sc),
      );
    }

    // Combined total
    if (sb > 0.02) {
      nodes.push(
        txt('Both vector stores combined', barL, 122, 26, ROLE.gold, 'mono', 'left').opacity(sb),
        lumBar(barL + (maxW * sb) / 2, 168, Math.max(16, maxW * sb), 46, {
          color: ROLE.gold,
          fillAlpha: 0.3,
          strokeWidth: 2.6,
          glow: 9,
          opacity: sb,
        }),
        txt(`${bothGb.toFixed(1)} GB`, barL + maxW + 22, 168, 32, ROLE.gold, 'mono', 'left')
          .glow(7, ROLE.gold)
          .opacity(sb),
      );
    }

    nodes.push(rule(-855, 255, 855, 255, COSMOS.rule, 1.8).opacity(0.6));
    return group(...nodes);
  });

  // Bottom latency section: sequential 3-state swap (zero overlap!)
  const premLayer = guardedDynamic(vPremise, (a) =>
    group(
      txt('p99 BUDGET: 60 ms', -855, 322, 30, ROLE.code, 'mono', 'left').opacity(a),
      txt(
        candLit.value > 0.4
          ? 'Candidate shrinks hot RAM from 153.6 GB to 38.4 GB'
          : 'Version encoder, width, normalization & metric with the index',
        -855,
        382,
        30,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    ),
  );

  const askLayer = guardedDynamic(vAsk, (a) =>
    group(
      txt('Smaller first-stage index (38.4 GB)', -855, 315, 30, ROLE.code, 'mono', 'left').opacity(
        a,
      ),
      txt(
        'Does that establish a request finishes within 60 ms?',
        -855,
        380,
        40,
        ROLE.gold,
        'serif',
        'left',
      )
        .glow(9, ROLE.gold)
        .opacity(a),
    ),
  );

  const timeLayer = guardedDynamic(vTime, (a) => {
    const barL = -855;
    return group(
      txt('MEASURE END-TO-END p99 ON THE SERVING PATH', -855, 300, 28, ROLE.gold, 'mono', 'left')
        .glow(6, ROLE.gold)
        .opacity(a),
      lumBar(barL + 150, 368, 290, 46, { color: ROLE.code, fillAlpha: 0.3, glow: 7, opacity: a }),
      txt('INT8 search', barL + 150, 368, 26, COSMOS.ink, 'mono').opacity(a),
      lumBar(barL + 465, 368, 310, 46, { color: ROLE.gold, fillAlpha: 0.3, glow: 7, opacity: a }),
      txt('FP32 fetch', barL + 465, 368, 26, COSMOS.ink, 'mono').opacity(a),
      lumBar(barL + 775, 368, 280, 46, { color: ROLE.A, fillAlpha: 0.3, glow: 7, opacity: a }),
      txt('Rescore + I/O', barL + 775, 368, 26, COSMOS.ink, 'mono').opacity(a),
      glowDot(barL + 960, 368, { radius: 8, color: ROLE.warn, glow: 10, opacity: a }),
      txt('+ Recall@K & NDCG', barL + 990, 368, 30, ROLE.A, 'mono', 'left')
        .glow(6, ROLE.A)
        .opacity(a),
    );
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.gold), title, stageLayer, premLayer, askLayer, timeLayer);

  playCue(s, c, 'candidate', (d) => s.play(candLit.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'code', (d) => s.play(showCode.to(1, { duration: d })), { after: true, dur: 0.55 });
  playCue(s, c, 'retained', (d) => s.play(showBoth.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'ask', (d) => s.play(swapVis(vPremise, vAsk, d)), { dur: 0.55 });
  playCue(s, c, 'time', (d) => s.play(swapVis(vAsk, vTime, d)), { after: true, dur: 0.55 });
}
