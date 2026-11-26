// Act 6 (Scenes 31 to 36): Parallel placement and hot-expert replication, resident EP vs
// offloading/prefetch dependency, serial decode vs batched prefill, serving gate decisions,
// diagnostic triage, and the fresh-route capstone transfer.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EXP_COLORS,
  MOE_FRESH_ROUTES,
  ROLE,
  cinemaAtmosphere,
  clamp,
  fmt,
  lerp,
  lumBar,
  moeReplica,
  moeServing,
  playCue,
  queueExample,
  vecStr,
} from '../parts.mjs';
import { drawQueueGrid } from './act4-capacity.mjs';

// ---------------------------------------------------------------------------
// Scene 31: parallel-layout: "Separate expert identity from matrix placement"
// ---------------------------------------------------------------------------
export function parallelLayout(s, c) {
  const title = heroTitle(['Separate expert identity', 'from matrix placement'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.alt,
  });

  const rep = moeReplica(); // originalOutput === copyOutput === [1, 2, 3, 4]

  const pB0 = s.value(0.5);
  const pTp = s.value(0);
  const pEp = s.value(0);
  const pB1 = s.value(0);
  const pCopy = s.value(0);
  const pPres = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const tp = pTp.value;
    const ep = pEp.value;
    const cp = pCopy.value;
    const pr = pPres.value;
    const b2 = pB2.value;
    const nodes = [];

    // Left: TP shards vs EP owners (combinable)
    const lx = -435;
    nodes.push(
      txt(
        'Matrix placement:  TP  ·  EP  ·  TP + EP',
        lx,
        -230,
        28,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(lx, -105, 740, 148, {
        color: tp > 0.25 ? ROLE.alt : '#4e608e',
        fillOpacity: tp > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: tp > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('TP: shard one matrix across 4 ranks', lx, -148, 26, ROLE.alt, 'mono', 'center').opacity(
        alpha,
      ),
    );
    for (let i = 0; i < 4; i++) {
      const sx = lx - 225 + i * 150;
      nodes.push(
        lumBar(sx, -78, 128, 64, {
          color: ROLE.alt,
          fillOpacity: 0.34,
          strokeWidth: 2,
          glow: 6,
          opacity: alpha,
        }),
        txt(`R${i}: 1/4`, sx, -78, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    }

    nodes.push(
      lumBar(lx, 110, 740, 175, {
        color: ep > 0.25 ? ROLE.token : '#4e608e',
        fillOpacity: ep > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: ep > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        'EP: assign expert IDs to owner groups',
        lx,
        56,
        26,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(lx - 175, 134, 325, 82, {
        color: ROLE.token,
        fillOpacity: 0.26,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('G0: E0,E1 (TP2)', lx - 175, 134, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      lumBar(lx + 175, 134, 325, 82, {
        color: ROLE.expert,
        fillOpacity: 0.26,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('G1: E2,E3 (TP2)', lx + 175, 134, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );

    // Right: Serving load balancer hot-expert replication (E0 -> E0 copy)
    const rx = 435;
    nodes.push(
      txt(
        'Redundant expert replica (serving EPLB)',
        rx,
        -230,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(rx - 180, -105, 320, 148, {
        color: ROLE.active,
        fillOpacity: 0.26,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('Rank A: E0 (orig)', rx - 180, -135, 26, ROLE.active, 'mono', 'center').opacity(alpha),
      txt(
        `out = ${vecStr(rep.originalOutput, 0)}`,
        rx - 180,
        -80,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      arrow([rx - 12, -105], [rx + 12, -105], { stroke: ROLE.active, width: 3.4, tip: 11 }).opacity(
        alpha,
      ),

      lumBar(rx + 180, -105, 320, 148, {
        color: cp > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: cp > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.6,
        glow: cp > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'Rank B: E0 (copy)',
        rx + 180,
        -135,
        26,
        cp > 0.25 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        pr > 0.25 ? `out = ${vecStr(rep.copyOutput, 0)}` : 'identical weights',
        rx + 180,
        -80,
        26,
        pr > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(rx, 110, 740, 175, {
        color: b2 > 0.25 ? ROLE.overflow : '#4e608e',
        fillOpacity: b2 > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.5,
        glow: b2 > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        pr > 0.25 ? 'Same ID & output, split rank load' : 'Extra resident weight block',
        rx,
        74,
        26,
        pr > 0.25 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        b2 > 0.25
          ? 'Cost: extra VRAM competes directly with KV cache'
          : 'vLLM tracks redundant-expert memory overhead',
        rx,
        136,
        26,
        b2 > 0.25 ? ROLE.overflow : COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),

      txt(
        b2 > 0.25
          ? 'Evaluate rank load, communication, peak memory, and latency together'
          : 'Sparse routing does not force one complete expert per GPU',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.alt, ROLE.active), title, layer);

  playCue(s, c, 'mo-parallel-layout-op-0', (d) => s.play(pB0.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-layout-tensor', (d) => s.play(pTp.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-layout-expert', (d) => s.play(pEp.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-parallel-layout-op-1', (d) => s.play(pB1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-layout-copy', (d) => s.play(pCopy.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-layout-preserve', (d) => s.play(pPres.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-parallel-layout-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 32: prefetch-dependency: "Distinguish moving weights from moving tokens"
// ---------------------------------------------------------------------------
export function prefetchDependency(s, c) {
  const title = heroTitle(['Distinguish moving weights', 'from moving tokens'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const pB0 = s.value(0.5);
  const pTok = s.value(0);
  const pWt = s.value(0);
  const pB1 = s.value(0);
  const pInp = s.value(0);
  const pMiss = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const tk = pTok.value;
    const wt = pWt.value;
    const inp = pInp.value;
    const ms = pMiss.value;
    const b2 = pB2.value;
    const nodes = [];

    // Top row: Resident EP (small token) vs Offloading (huge weight pages)
    nodes.push(
      lumBar(-435, -135, 680, 168, {
        color: tk > 0.25 ? ROLE.token : '#4e608e',
        fillOpacity: tk > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.5,
        glow: tk > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Resident Expert Parallelism', -435, -182, 28, ROLE.token, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        'Move hidden token vector (e.g. 8 KiB)',
        -435,
        -130,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Weights stay pinned on GPU owners',
        -435,
        -82,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      lumBar(435, -135, 740, 168, {
        color: wt > 0.25 ? ROLE.overflow : '#4e608e',
        fillOpacity: wt > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.5,
        glow: wt > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('CPU / SSD Offloading', 435, -182, 28, ROLE.overflow, 'mono', 'center').opacity(alpha),
      txt(
        'Stream weight pages (10s of MB/expert)',
        435,
        -130,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Traffic orders of magnitude larger than 1 token',
        435,
        -82,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    // Middle causal lock: Layer L hidden state -> Layer L+1 exact router
    const chain = [
      { x: -575, head: 'Layer L compute', sub: 'produces h_{L+1}', col: ROLE.expert },
      {
        x: -135,
        head: 'Layer L+1 router',
        sub: 'locked behind h_{L+1}',
        col: inp > 0.25 ? ROLE.router : '#4e608e',
      },
      {
        x: 425,
        head: 'Speculative prefetch',
        sub: ms > 0.25 ? 'miss -> wasted bytes + stall' : 'predict likely experts early',
        col: ms > 0.25 ? ROLE.overflow : ROLE.active,
      },
    ];
    chain.forEach((ch, i) => {
      nodes.push(
        lumBar(ch.x, 125, i === 2 ? 640 : 380, 162, {
          color: ch.col,
          fillOpacity: 0.22,
          strokeWidth: 2.5,
          glow: 8,
          opacity: alpha,
        }),
        txt(ch.head, ch.x, 96, 28, ch.col, 'mono', 'center').opacity(alpha),
        txt(ch.sub, ch.x, 150, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });
    nodes.push(
      arrow([-372, 125], [-334, 125], { stroke: ROLE.router, width: 3.4, tip: 12 }).opacity(alpha),
      arrow([68, 125], [96, 125], {
        stroke: ms > 0.25 ? ROLE.overflow : ROLE.active,
        width: 3.4,
        tip: 12,
      }).opacity(alpha),
      txt(
        b2 > 0.25
          ? 'Profile prefill (grouped GEMMs) and single-token decode (routing/comm overhead) separately'
          : 'Measure prefetch hit rate, wasted transfer bytes, cache residency, and stall time',
        0,
        345,
        28,
        b2 > 0.25 ? ROLE.token : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.overflow), title, layer);

  playCue(s, c, 'mo-prefetch-dependency-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-prefetch-token', (d) => s.play(pTok.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-prefetch-weight', (d) => s.play(pWt.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-prefetch-dependency-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-prefetch-input', (d) => s.play(pInp.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-prefetch-miss', (d) => s.play(pMiss.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-prefetch-dependency-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Scene 33: evaluate-path: "How many rows reach one expert call?"
// ---------------------------------------------------------------------------
export function evaluatePath(s, c) {
  const title = heroTitle(['How many rows reach', 'one expert call?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const pSerial = s.value(0.25);
  const pPrefill = s.value(0);
  const pEqual = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const sr = pSerial.value;
    const pf = pPrefill.value;
    const eq = pEqual.value;
    const nodes = [];

    // Left/top: 4 serial decode steps (1 row per expert per step)
    nodes.push(
      txt(
        'Decode: 4 serial steps (1 row/call)',
        -440,
        -225,
        28,
        ROLE.overflow,
        'mono',
        'center',
      ).opacity(alpha),
    );
    for (let st = 0; st < 4; st++) {
      const y = -135 + st * 112;
      const lit = sr > st * 0.22;
      const op = (lit ? 1 : 0.45) * alpha;
      nodes.push(
        txt(`step ${st}`, -765, y, 26, COSMOS.muted, 'mono', 'right').opacity(op),
        lumBar(-575, y, 250, 74, {
          color: EXP_COLORS[0],
          fillOpacity: lit ? 0.3 : 0.14,
          strokeWidth: 2.2,
          glow: lit ? 7 : 2,
          opacity: op,
        }),
        txt(`E1: [t${st}]`, -575, y, 26, COSMOS.ink, 'mono', 'center').opacity(op),
        lumBar(-280, y, 250, 74, {
          color: EXP_COLORS[2],
          fillOpacity: lit ? 0.3 : 0.14,
          strokeWidth: 2.2,
          glow: lit ? 7 : 2,
          opacity: op,
        }),
        txt(`E3: [t${st}]`, -280, y, 26, COSMOS.ink, 'mono', 'center').opacity(op),
      );
      if (st < 3) {
        nodes.push(
          arrow([-428, y + 40], [-428, y + 70], {
            stroke: ROLE.overflow,
            width: 2.8,
            tip: 10,
          }).opacity(op),
        );
      }
    }

    // Right: 1 prefill call stacking all 4 rows at E1 and E3
    const rx = 435;
    nodes.push(
      txt(
        'Prompt prefill / batched:  1 call (4 stacked rows)',
        rx,
        -225,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(rx - 180, 35, 310, 360, {
        color: pf > 0.25 ? EXP_COLORS[0] : '#4e608e',
        fillOpacity: pf > 0.25 ? 0.24 : 0.12,
        strokeWidth: 2.6,
        glow: pf > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('E1 (4-row GEMM)', rx - 180, -112, 26, EXP_COLORS[0], 'mono', 'center').opacity(alpha),

      lumBar(rx + 180, 35, 310, 360, {
        color: pf > 0.25 ? EXP_COLORS[2] : '#4e608e',
        fillOpacity: pf > 0.25 ? 0.24 : 0.12,
        strokeWidth: 2.6,
        glow: pf > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('E3 (4-row GEMM)', rx + 180, -112, 26, EXP_COLORS[2], 'mono', 'center').opacity(alpha),
    );

    for (let k = 0; k < 4; k++) {
      const ry = -45 + k * 66;
      const op = (pf > 0.2 ? 1 : 0.45) * alpha;
      nodes.push(
        lumBar(rx - 180, ry, 230, 50, {
          color: ROLE.active,
          fillOpacity: pf > 0.2 ? 0.34 : 0.14,
          strokeWidth: 2,
          glow: pf > 0.2 ? 6 : 0,
          opacity: op,
        }),
        txt(`row t${k}`, rx - 180, ry, 26, COSMOS.ink, 'mono', 'center').opacity(op),
        lumBar(rx + 180, ry, 230, 50, {
          color: ROLE.active,
          fillOpacity: pf > 0.2 ? 0.34 : 0.14,
          strokeWidth: 2,
          glow: pf > 0.2 ? 6 : 0,
          opacity: op,
        }),
        txt(`row t${k}`, rx + 180, ry, 26, COSMOS.ink, 'mono', 'center').opacity(op),
      );
    }

    // Equal-work footer
    nodes.push(
      txt(
        eq > 0.25
          ? 'Both execute 8 expert rows total  ·  hardware efficiency differs sharply -> benchmark vs dense'
          : '4 serial 1-row dispatches expose routing & link overhead; 1 batched 4-row GEMM amortizes it',
        0,
        365,
        28,
        eq > 0.25 ? ROLE.router : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(eq > 0.25 ? 7 : 0, ROLE.router)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.active), title, layer);

  playCue(s, c, 'serial-steps', (d) => s.play(pSerial.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'prefill-group', (d) => s.play(pPrefill.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'equal-work', (d) => s.play(pEqual.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 34: serving-gate: "Which model can serve this workload?"
// STRICT PREDICTION WITHHOLDING: Beat 0 asks at 60 ms -> Beat 1 reveals MoE; Beat 2 moves cap to 50 ms -> Beat 3 reveals Neither!
// ---------------------------------------------------------------------------
export function servingGate(s, c) {
  const title = heroTitle(['Which model can', 'serve this workload?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const s60 = moeServing(60); // Dense false, MoE true
  const s50 = moeServing(50); // Dense false, MoE false

  const pRead = s.value(0.5);
  const pDec1 = s.value(0); // WITHHELD until Beat 1 first-decision!
  const pCapMove = s.value(0); // Beat 2: slides cap 60 -> 50 ms (resets decision to '?')
  const pDec2 = s.value(0); // WITHHELD until Beat 3 second-decision!
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const d1 = pDec1.value;
    const cm = pCapMove.value;
    const d2 = pDec2.value;
    const capMs = lerp(60, 50, clamp(cm));
    const inSecondQuestion = cm > 0.25 && d2 < 0.25;
    const showDec1 = d1 > 0.25 && cm < 0.25;
    const showDec2 = d2 > 0.25;
    const curRows = cm > 0.5 ? s50 : s60;
    const nodes = [];

    // Requirements header
    nodes.push(
      txt(
        `Requirements:   quality >= 0.82   ·   throughput >= 1,000 tok/s   ·   p95 <= ${Math.round(capMs)} ms`,
        0,
        -240,
        28,
        cm > 0.25 ? ROLE.router : ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Table headers
    const colXs = [-660, -330, 30, 380, 690];
    const headers = ['Model', 'Quality', 'Throughput', 'p95 Latency', 'Verdict'];
    headers.forEach((h, i) => {
      nodes.push(txt(h, colXs[i], -155, 28, COSMOS.muted, 'mono', 'center').opacity(alpha));
    });

    // Two synthetic model rows
    curRows.forEach((row, r) => {
      const ry = -55 + r * 125;
      const showVerdict = showDec1 || showDec2;
      const verdictStr = !showVerdict ? '?' : row.accepted ? 'PASS' : 'FAIL';
      const vCol = !showVerdict ? ROLE.router : row.accepted ? ROLE.active : ROLE.overflow;
      const rowCol = r === 0 ? ROLE.expert : ROLE.token;
      nodes.push(
        lumBar(0, ry, 1620, 96, {
          color: showVerdict && row.accepted ? ROLE.active : rowCol,
          fillOpacity: showVerdict && row.accepted ? 0.24 : 0.14,
          strokeWidth: showVerdict && row.accepted ? 2.8 : 2,
          glow: showVerdict && row.accepted ? 10 : 4,
          opacity: alpha,
        }),
        txt(row.id, colXs[0], ry, 32, rowCol, 'mono', 'center').opacity(alpha),
        txt(fmt(row.quality, 2), colXs[1], ry, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(
          `${row.throughput} tok/s`,
          colXs[2],
          ry,
          30,
          showVerdict && !row.checks[2] ? ROLE.overflow : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `${row.latency} ms`,
          colXs[3],
          ry,
          30,
          showVerdict && !row.checks[1] ? ROLE.overflow : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(verdictStr, colXs[4], ry, 32, vCol, 'mono', 'center')
          .glow(showVerdict ? 8 : 0, vCol)
          .opacity(alpha),
      );
    });

    // Shared latency ruler (40 ms .. 65 ms) with fixed dots and moving cap line
    const rulerL = -640;
    const rulerR = 640;
    const rulerY = 252;
    const toX = (ms) => rulerL + ((ms - 40) / 25) * (rulerR - rulerL);

    nodes.push(
      line([rulerL, rulerY], [rulerR, rulerY], { stroke: '#6074a6', width: 3 }).opacity(alpha),
    );
    [40, 45, 50, 55, 60, 65].forEach((ms) => {
      const tx = toX(ms);
      nodes.push(
        line([tx, rulerY - 12], [tx, rulerY + 12], { stroke: '#6074a6', width: 2 }).opacity(alpha),
        txt(`${ms} ms`, tx, rulerY + 38, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    // Fixed model dots on ruler
    const denseX = toX(48);
    const moeX = toX(55);
    const capX = toX(capMs);
    nodes.push(
      glowDot(denseX, rulerY, { radius: 11, color: ROLE.expert, glow: 11, opacity: alpha }),
      txt('Dense 48ms', denseX, rulerY - 48, 26, ROLE.expert, 'mono', 'center').opacity(alpha),
      glowDot(moeX, rulerY, { radius: 11, color: ROLE.token, glow: 11, opacity: alpha }),
      txt('MoE 55ms', moeX, rulerY - 48, 26, ROLE.token, 'mono', 'center').opacity(alpha),

      // Moving budget cutoff gate (cleanly clear of Dense/MoE labels while sliding 60 -> 50 ms)
      glowingTrail(
        [
          [capX, rulerY - 16],
          [capX, rulerY + 16],
        ],
        { color: ROLE.overflow, width: 5, glow: 10, opacity: alpha },
      ),
      glowDot(capX, rulerY, { radius: 7, color: ROLE.overflow, glow: 11, opacity: alpha }),
      txt(
        `cap ${Math.round(capMs)}ms`,
        capX,
        rulerY - 96,
        26,
        ROLE.overflow,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Bottom prompt / verdict (mutually exclusive)
    if (showDec2) {
      nodes.push(
        txt(
          'Neither model qualifies:  MoE is 5 ms over 50 ms cap  ·  Dense misses 1,000 tok/s',
          0,
          380,
          28,
          ROLE.overflow,
          'mono',
          'center',
        )
          .glow(7, ROLE.overflow)
          .opacity(alpha),
      );
    } else if (inSecondQuestion) {
      nodes.push(
        txt(
          'Budget tightened to 50 ms (results fixed). Which model clears all three now?',
          0,
          380,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else if (showDec1) {
      nodes.push(
        txt(
          'MoE clears all three (+34% throughput, +7 ms p95)  ·  Dense misses throughput',
          0,
          380,
          28,
          ROLE.active,
          'mono',
          'center',
        )
          .glow(7, ROLE.active)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'Read across each row at 60 ms cap: which model clears all three requirements?',
          0,
          380,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    }

    void pRead.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.token), title, layer);

  playCue(s, c, 'read-results', (d) => s.play(pRead.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'first-decision', (d) => s.play(pDec1.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'move-budget', (d) => s.play(pCapMove.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'second-decision', (d) => s.play(pDec2.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 35: diagnose-routing: "Find the failing mechanism before changing the router"
// ---------------------------------------------------------------------------
export function diagnoseRouting(s, c) {
  const title = heroTitle(['Find the failing mechanism', 'before changing the router'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const pB0 = s.value(0.5);
  const pPool = s.value(0);
  const pB1 = s.value(0);
  const pQual = s.value(0);
  const pB2 = s.value(0);
  const pTrace = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const pl = pPool.value;
    const ql = pQual.value;
    const tr = pTrace.value;
    const b1 = pB1.value;
    const b2 = pB2.value;
    const nodes = [];

    // Shared fixed routing spine across the top
    const stages = [
      { x: -640, lbl: 'Residency', col: pl > 0.2 ? ROLE.overflow : '#556894' },
      { x: -320, lbl: 'Router', col: ql > 0.2 ? ROLE.router : '#556894' },
      { x: 0, lbl: 'Pack', col: tr > 0.2 ? ROLE.token : '#556894' },
      { x: 320, lbl: 'All-to-All', col: tr > 0.2 ? ROLE.token : '#556894' },
      { x: 640, lbl: 'GEMM + Combine', col: tr > 0.2 ? ROLE.active : '#556894' },
    ];
    stages.forEach((st, i) => {
      nodes.push(
        lumBar(st.x, -185, 250, 78, {
          color: st.col,
          fillOpacity: 0.22,
          strokeWidth: 2.4,
          glow: 7,
          opacity: alpha,
        }),
        txt(st.lbl, st.x, -185, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
      if (i < 4) {
        nodes.push(
          arrow([st.x + 134, -185], [stages[i + 1].x - 134, -185], {
            stroke: '#6074a6',
            width: 3,
            tip: 11,
          }).opacity(alpha),
        );
      }
    });

    // Three diagnostic evidence columns below
    const cases = [
      {
        x: -555,
        on: pl > 0.2 || b1 < 0.2,
        col: ROLE.overflow,
        symptom: '1. 7B-active OOMs (14 GB)',
        cause: '38 GB raw stored pool',
        check: 'Fix placement, not alpha',
      },
      {
        x: 0,
        on: ql > 0.2 || b1 > 0.2,
        col: ROLE.router,
        symptom: '2. Uniform counts, bad QA',
        cause: 'Over-penalized routing',
        check: 'Check calls + ablations',
      },
      {
        x: 555,
        on: tr > 0.2 || b2 > 0.2,
        col: ROLE.token,
        symptom: '3. High tok/s, slow p95',
        cause: 'Dispatch / hot-rank stalls',
        check: 'Trace pack, comm, GEMM',
      },
    ];

    cases.forEach((cs) => {
      nodes.push(
        lumBar(cs.x, 95, 530, 310, {
          color: cs.on ? cs.col : '#4a5c88',
          fillOpacity: cs.on ? 0.24 : 0.12,
          strokeWidth: cs.on ? 2.8 : 1.8,
          glow: cs.on ? 10 : 2,
          opacity: alpha,
        }),
        txt(cs.symptom, cs.x, 0, 28, cs.col, 'mono', 'center').opacity(alpha),
        txt(cs.cause, cs.x, 90, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
        txt(cs.check, cs.x, 180, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        b2 > 0.25
          ? 'Change one candidate bottleneck at a time and remeasure quality, memory, throughput, and p95 together'
          : 'Match the symptom to residency, learned routing, or serving coordination before tuning knobs',
        0,
        365,
        28,
        b2 > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.overflow), title, layer);

  playCue(s, c, 'mo-diagnose-routing-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-diagnose-pool', (d) => s.play(pPool.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-diagnose-routing-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-diagnose-quality', (d) => s.play(pQual.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-diagnose-routing-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-diagnose-trace', (d) => s.play(pTrace.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 36: fresh-route: "Will both of token three's returns arrive?"
// STRICT PREDICTION WITHHOLDING: Beat 0 asks at c=1.0 -> Beat 1 reveals 3 slots & [0, 2.25];
// Beat 2 raises c to 1.5 -> Beat 3 reveals 5 slots, all 12 fit, and [0.5, 2.25]!
// ---------------------------------------------------------------------------
export function freshRoute(s, c) {
  const title = heroTitle(['Will both of token three', 'returns arrive?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const m10 = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], 1.0); // 3 slots, 2 overflow, [0, 2.25]
  const m15 = queueExample(MOE_FRESH_ROUTES, 3, [0.25, 0.75], 1.5); // 5 slots, 0 overflow, [0.5, 2.25]

  const pArr = s.value(0.5);
  const pAsk1 = s.value(0);
  const pLim1 = s.value(0); // WITHHELD until Beat 1 locate-limit!
  const pSurv1 = s.value(0);
  const pVec1 = s.value(0);
  const pRaise = s.value(0); // Beat 2: raises factor to 1.5, resets answer to '?'!
  const pLim2 = s.value(0); // WITHHELD until Beat 3 extend-limit!
  const pFitAll = s.value(0);
  const pPair = s.value(0);
  const pVec2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const a1 = pAsk1.value;
    const l1 = pLim1.value;
    const s1 = pSurv1.value;
    const v1 = pVec1.value;
    const rs = pRaise.value;
    const l2 = pLim2.value;
    const fa = pFitAll.value;
    const pr = pPair.value;
    const v2 = pVec2.value;

    const showFirstCutoff = l1 > 0.25;
    const curSlots = showFirstCutoff ? (l2 > 0.25 ? Math.round(lerp(3, 5, clamp(l2))) : 3) : null;
    const inSecondQuestion = rs > 0.25 && l2 < 0.25;
    const markOver = showFirstCutoff && fa < 0.25 && l2 < 0.5;
    const nodes = [];

    nodes.push(
      ...drawQueueGrid({
        groups: m10.groups,
        leftX: -720,
        topY: -165,
        pitchX: 122,
        laneY: 118,
        trackedToken: 3,
        cutoffSlots: curSlots,
        markOverflow: markOver,
        labelOverflow: markOver,
        overflowCounts: m10.overflow,
        showLoads: true,
        alpha,
      }),
    );

    // Right panel: Token 3 routed branch (strictly withheld on both prediction beats!)
    const rx = 535;
    const raisedPhase = rs > 0.25;
    const e1Status =
      v2 > 0.25 || pr > 0.25 || fa > 0.25
        ? 'RETURNS'
        : raisedPhase && l2 > 0.25
          ? 'FITS'
          : inSecondQuestion
            ? 'c = 1.5 -> ?'
            : s1 > 0.25
              ? 'DROPPED'
              : 'slot 4';
    const e1Col =
      v2 > 0.25 || pr > 0.25 || fa > 0.25 || (raisedPhase && l2 > 0.25)
        ? ROLE.active
        : inSecondQuestion
          ? ROLE.router
          : s1 > 0.25
            ? ROLE.overflow
            : ROLE.router;

    const outStr =
      v2 > 0.25
        ? vecStr(m15.output, 2) // [0.50, 2.25]
        : raisedPhase
          ? '?'
          : v1 > 0.25
            ? vecStr(m10.output, 2) // [0.00, 2.25]
            : '?';
    const outCol =
      v2 > 0.25 ? ROLE.active : raisedPhase ? ROLE.router : v1 > 0.25 ? ROLE.token : ROLE.router;

    nodes.push(
      txt(
        rs > 0.25
          ? `Token 3  ·  capacity factor c = 1.5  (${l2 > 0.25 ? '5 slots' : '? slots'})`
          : `Token 3  ·  capacity factor c = 1.0  (${l1 > 0.25 ? '3 slots' : '? slots'})`,
        rx,
        -225,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),

      // E1 term
      lumBar(rx, -110, 560, 125, {
        color: e1Col,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('E1 (slot 4)', rx - 155, -135, 28, EXP_COLORS[0], 'mono', 'center').opacity(alpha),
      txt(e1Status, rx + 155, -135, 28, e1Col, 'mono', 'center').opacity(alpha),
      txt('0.25 x [2, 0]', rx, -82, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // E3 term
      lumBar(rx, 50, 560, 125, {
        color: s1 > 0.25 ? ROLE.active : ROLE.router,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('E3 (slot 2)', rx - 155, 25, 28, EXP_COLORS[2], 'mono', 'center').opacity(alpha),
      txt(
        s1 > 0.25 ? 'RETURNS' : 'slot 2',
        rx + 155,
        25,
        28,
        s1 > 0.25 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt('0.75 x [0, 3]', rx, 78, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Output box
      lumBar(rx, 218, 560, 134, {
        color: outCol,
        fillOpacity: 0.26,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      txt('Token 3 routed output', rx, 184, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(outStr, rx, 242, 44, outCol, 'mono', 'center').glow(9, outCol).opacity(alpha),
    );

    // Footer prompt / reveal (mutually exclusive, 100% consistent with live cutoff state)
    if (v2 > 0.25) {
      nodes.push(
        txt(
          'ceil(4.5) = 5 slots -> all 12 fit -> E1 + E3 return [0.50, 2.25]  ·  next lesson: Mamba',
          0,
          395,
          28,
          ROLE.active,
          'mono',
          'center',
        )
          .glow(7, ROLE.active)
          .opacity(alpha),
      );
    } else if (raisedPhase && l2 > 0.25) {
      nodes.push(
        txt(
          'ceil(4.5) = 5 slots -> all 12 assignments fit, both E1 and E3 return',
          0,
          395,
          28,
          ROLE.active,
          'mono',
          'center',
        )
          .glow(7, ROLE.active)
          .opacity(alpha),
      );
    } else if (inSecondQuestion) {
      nodes.push(
        txt(
          'Raise capacity factor to c = 1.5 (keep both vectors). What routed vector reaches token 3?',
          0,
          395,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else if (v1 > 0.25) {
      nodes.push(
        txt(
          '12 / 4 = 3 slots -> t3 is 4th in E1 (dropped), 2nd in E3 -> [0.00, 2.25]',
          0,
          395,
          28,
          ROLE.token,
          'mono',
          'center',
        )
          .glow(7, ROLE.token)
          .opacity(alpha),
      );
    } else if (l1 > 0.25) {
      nodes.push(
        txt(
          '12 / 4 = 3 slots per expert  ·  which of token 3 routes fits?',
          0,
          395,
          28,
          ROLE.router,
          'mono',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else if (a1 > 0.25) {
      nodes.push(
        txt(
          'At c = 1.0, how many slots does each expert get, and which of token 3 routes fits?',
          0,
          395,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          '6 tokens x top-2 = 12 assignments across 4 experts  ·  trace token 3 (yellow)',
          0,
          395,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    void pArr.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.active), title, layer);

  playCue(s, c, 'fresh-arrivals', (d) => s.play(pArr.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'fresh-question', (d) => s.play(pAsk1.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'locate-limit', (d) => s.play(pLim1.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'fresh-survivor', (d) => s.play(pSurv1.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'fresh-first-vector', (d) => s.play(pVec1.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'raise-factor', (d) => s.play(pRaise.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'extend-limit', (d) => s.play(pLim2.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'mo-fresh-fit', (d) => s.play(pFitAll.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'fresh-pair', (d) => s.play(pPair.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'fresh-second-vector', (d) => s.play(pVec2.to(1, { duration: d })), { dur: 0.65 });
}
