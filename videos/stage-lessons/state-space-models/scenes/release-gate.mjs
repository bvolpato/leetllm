// Scene 15: release-gate: Fresh collision test (Files C & D -> both return 2) -> 24 GiB GPU budget -> amended spec test (2 retries).
import {
  COSMOS,
  ROLE,
  amendedSpec,
  aura,
  bindCueBeat,
  cacheWorksheet,
  group,
  guardedDynamic,
  heroTitle,
  latestRetryLimit,
  lookupCases,
  lumBar,
  playCue,
  swapVis,
  txt,
  valuePill,
} from '../parts.mjs';

export default function releaseGate(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const view3Vis = s.value(0);

  const revealReturn = s.value(0); // strictly withheld until AFTER `return-state`!
  const revealMatch = s.value(0);
  const revealBudgetPick = s.value(0); // strictly withheld until AFTER `bench-hybrid`!
  const showAmendment = s.value(0);
  const revealLatest = s.value(0); // strictly withheld until AFTER `reference-answer`!

  const bgAura = aura(0, 0, 740, '#103c362a', '#242e6418');
  const title = heroTitle(['Benchmark Decision:', 'exact recall + VRAM + speed'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.state,
  });

  const fileC = lookupCases[0]; // retries=6, timeout=1 -> returned=2, exact=false
  const fileD = lookupCases[1]; // retries=2, timeout=3 -> returned=2, exact=true
  const cFull = cacheWorksheet(32); // 32 GiB
  const cHyb = cacheWorksheet(4); // 4 GiB
  const cSsm = cacheWorksheet(0); // 5 MiB
  const latestAns = latestRetryLimit(amendedSpec); // 2

  // View 1: Fresh files C & D (prediction withheld!)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const rr = revealReturn.value;
    const rm = revealMatch.value;
    const nodes = [
      txt(
        'FRESH COLLISION TEST (HALF-CARRY SCALAR READER)',
        -855,
        -215,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill(`File C: retries=${fileC.retries}, timeout=${fileC.timeout}`, -560, -100, {
        w: 540,
        h: 78,
        color: ROLE.carry,
        size: 30,
        opacity: alpha,
      }),
      valuePill(`File D: retries=${fileD.retries}, timeout=${fileD.timeout}`, -560, 25, {
        w: 540,
        h: 78,
        color: ROLE.write,
        size: 30,
        opacity: alpha,
      }),
      // Quiet right-side formula & output column slots from t=0 (zero empty space!)
      txt(
        'SCALAR READER: h_t = 0.5·h_{t-1} + 0.5·x_t',
        100,
        -215,
        26,
        COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        rr > 0.2 ? `Returns ${fileC.returned.toFixed(0)}` : 'Returns ?',
        100,
        -100,
        34,
        rr > 0.2 ? (rm > 0.5 ? ROLE.write : ROLE.state) : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        rr > 0.2 ? `Returns ${fileD.returned.toFixed(0)}` : 'Returns ?',
        100,
        25,
        34,
        rr > 0.2 ? ROLE.state : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    if (rr < 0.2) {
      nodes.push(
        txt(
          'Which file gets the correct retry limit from the returned state?',
          -855,
          200,
          34,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity((1 - rr * 5) * alpha),
      );
    }
    if (rm > 0.2) {
      nodes.push(
        txt('MISS (needs 6)', 380, -100, 32, ROLE.write, 'mono', 'left')
          .glow(8, ROLE.write)
          .opacity(rm * alpha),
        txt('EXACT MATCH (2)', 380, 25, 32, ROLE.state, 'mono', 'left')
          .glow(8, ROLE.state)
          .opacity(rm * alpha),
        txt(
          'Both collapse to state 2; upstream mechanism must preserve distinction',
          -855,
          210,
          30,
          ROLE.delta,
          'sans',
          'left',
        ).opacity(rm * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: 24 GiB GPU card budget (65,536 context)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const pick = revealBudgetPick.value;
    const maxGiB = 34;
    const maxW = 860;
    const barX = -400;
    const limitX = barX + (24 / maxGiB) * maxW;
    const nodes = [
      txt('24 GiB GPU BUDGET AT 65,536 TOKENS', -855, -220, 28, ROLE.delta, 'mono', 'left').opacity(
        alpha,
      ),
      // 24 GiB vertical wall (centered at y=10 -> spans -138..+158, well below "24 GiB" at -182!)
      lumBar(limitX - 2, 10, 4, 296, ROLE.delta, { opacity: 0.7 * alpha, glow: 8 }),
      txt('24 GiB', limitX, -182, 26, ROLE.delta, 'mono', 'center').opacity(alpha),

      txt('Full Attention', -855, -100, 30, ROLE.write, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, (cFull.kvGiB / maxGiB) * maxW, 38, ROLE.write, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        `${cFull.kvGiB} GiB (OOM)`,
        barX + maxW + 28,
        -100,
        28,
        ROLE.write,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Pure SSM', -855, 10, 30, ROLE.read, 'mono', 'left').opacity(alpha),
      lumBar(barX, 10, 12, 38, ROLE.read, { opacity: alpha, maxTrackW: maxW }),
      txt(`${cSsm.stateMiB} MiB`, barX + maxW + 28, 10, 28, ROLE.read, 'mono', 'left').opacity(
        alpha,
      ),

      txt('Hybrid (4 Attn)', -855, 120, 30, ROLE.state, 'mono', 'left').opacity(alpha),
      lumBar(barX, 120, (cHyb.kvGiB / maxGiB) * maxW, 38, ROLE.state, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(`${cHyb.kvGiB} GiB KV`, barX + maxW + 28, 120, 28, ROLE.state, 'mono', 'left').opacity(
        alpha,
      ),
    ];

    if (pick < 0.2) {
      nodes.push(
        txt(
          'Which candidate keeps explicit token access inside 24 GiB?',
          -855,
          275,
          34,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity((1 - pick * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Benchmark Hybrid (4 GiB KV + explicit access) alongside trained SSM',
          -855,
          275,
          32,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(8, ROLE.state)
          .opacity(pick * alpha),
      );
    }
    return group(...nodes);
  });

  // View 3: Amended spec evaluation (old 6 -> amended 2 -> timeout 6)
  const view3 = guardedDynamic(view3Vis, (alpha) => {
    const am = showAmendment.value;
    const ans = revealLatest.value;
    const nodes = [
      txt('AMENDED SPEC BENCHMARK', -855, -215, 28, ROLE.read, 'mono', 'left').opacity(alpha),
      valuePill('1. max_retries = 6', -645, -100, {
        w: 380,
        h: 74,
        color: COSMOS.muted,
        size: 28,
        opacity: alpha,
      }),
      valuePill(am > 0.05 ? '2. max_retries = 2' : '2. later amendment', -205, -100, {
        w: 380,
        h: 74,
        color: am > 0.05 ? (ans > 0.5 ? ROLE.state : ROLE.carry) : COSMOS.rule,
        size: 28,
        glow: am > 0.05 ? (ans > 0.5 ? 14 : 8) : 0,
        opacity: (0.28 + 0.72 * am) * alpha,
      }),
      valuePill(am > 0.05 ? '3. timeout_s = 6' : '3. other field', 235, -100, {
        w: 360,
        h: 74,
        color: am > 0.05 ? ROLE.write : COSMOS.rule,
        size: 28,
        opacity: (0.28 + 0.72 * am) * alpha,
      }),
      valuePill('Exact Recall  |  Peak VRAM  |  Latency', 0, 295, {
        w: 920,
        h: 66,
        color: ans > 0.5 ? ROLE.state : COSMOS.rule,
        size: 28,
        opacity: (0.35 + 0.65 * ans) * alpha,
      }),
    ];

    if (ans < 0.2) {
      nodes.push(
        txt(
          'How many retries should both readers report?',
          -855,
          85,
          36,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity((1 - ans * 5) * alpha),
      );
    } else {
      nodes.push(
        txt(
          `Answer: ${latestAns} retries  (old 6 was superseded; trailing 6 is timeout_s)`,
          -855,
          85,
          34,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(10, ROLE.state)
          .opacity(ans * alpha),
        txt(
          'Ship the reader that passes exact recall, peak VRAM, and real-load latency together',
          -855,
          225,
          30,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(ans * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2, view3);
  // Strictly withhold answers across all 3 predictions!
  playCue(s, c, 'return-state', (d) => s.play(revealReturn.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'score-fields', (d) => s.play(revealMatch.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(s, c, 'kv-budget', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'bench-hybrid', (d) => s.play(revealBudgetPick.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(s, c, 'move-setting', (d) => s.play(swapVis(view2Vis, view3Vis, d)), { dur: 0.6 });
  playCue(s, c, 'later-amendment', (d) => s.play(showAmendment.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'reference-answer', (d) => s.play(revealLatest.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), [
    'fresh-first',
    'fresh-second',
    'fresh-prediction',
    'ssm-budget',
    'hybrid-budget',
    'middle-lookup',
    'late-lookup',
    'similar-value',
    'latest-question',
    'current-field',
  ]);
}
