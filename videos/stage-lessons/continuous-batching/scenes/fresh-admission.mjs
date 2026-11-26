// Scene 20: fresh-admission: Two policy branches from the same 5 pages: Fit-scan (E joins) vs Aged-pause (pause B -> D runs -> B replays 3 & emits 703).
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  freshBatchingBoundary,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function freshAdmission(s, c) {
  const view1Vis = s.value(1); // Branch 1 (Fit-scan E) & Branch 2 (Aged-pause B -> D finishes & returns 3 pages)
  const view2Vis = s.value(0); // B resumes: replay [p1, p2, 701] -> consume 702 -> emit 703 once!
  const branch = s.value(0); // 0=question, 1=fit E, 2=pause B, 3=restore D, 4=D finishes & returns 3 pages
  const replayStep = s.value(0); // 0=accepted 701/702, 1=replay 3, 2=feed 702, 3=emit 703, 4=cost summary

  const fit = freshBatchingBoundary('fit');
  const aged = freshBatchingBoundary('aged');

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Policy Tradeoffs:', 'Fit-Scan vs Preemption Replay'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const br = Math.round(branch.value);
    const pages =
      br === 0
        ? ['C', 'C', 'B', 'FREE', 'FREE']
        : br === 1
          ? ['C', 'C', 'B', 'E (3+1)', 'FREE']
          : br === 2
            ? ['C', 'C', 'FREE', 'FREE', 'FREE']
            : br === 3
              ? ['C', 'C', 'D', 'D', 'D']
              : ['C', 'C', 'FREE', 'FREE', 'FREE'];
    const pCols = pages.map((p) =>
      p === 'C'
        ? ROLE.c
        : p === 'B'
          ? ROLE.b
          : p.startsWith('E')
            ? ROLE.ok
            : p === 'D'
              ? ROLE.d
              : COSMOS.rule,
    );

    const nodes = [
      txt(
        br === 0
          ? '2 PAGES FREE (4 SLOTS/PG): D NEEDS 3 PAGES (11+1); E NEEDS 1 PAGE (3+1)'
          : br === 1
            ? `BRANCH A (FIT SCAN): ${fit.active.map((r) => r.id).join(', ')} RUN TOGETHER (D STILL WAITS!)`
            : br <= 3
              ? `BRANCH B (PAUSE B -> SERVE D): ${aged.active.map((r) => r.id).join(' & ')} RUN (2 INPUTS)`
              : 'D FINISHES -> ALL 3 EXCLUSIVE PAGES RETURN TO FREE POOL!',
        -855,
        -215,
        26,
        br === 1 ? ROLE.ok : br >= 2 ? ROLE.d : ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    pages.forEach((lbl, idx) => {
      const cx = -640 + idx * 320;
      const col = pCols[idx];
      nodes.push(
        rect(280, 130, { fill: '#132038', stroke: col, width: 3, radius: 14 })
          .at(cx, -55)
          .glow(col !== COSMOS.rule ? 8 : 0, col)
          .opacity(alpha),
        txt(`Page ${idx}`, cx, -92, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(lbl, cx, -35, 32, col === COSMOS.rule ? COSMOS.dim : col, 'mono', 'center').opacity(
          alpha,
        ),
      );
    });

    nodes.push(
      txt(
        br === 0
          ? 'With 2 pages free, which waiting request (D or E) could join B and C now?'
          : br === 1
            ? 'Fit-scan keeps GPU busy (3/8 inputs) by admitting E, while oldest request D still waits'
            : br === 2
              ? 'Pause B: wait for in-flight R/W/Xfer -> release B page -> 3 pages now free for D!'
              : br === 3
                ? 'Restore D (11 positions across 3 pages) -> run C & D -> D completes in 1 pass!'
                : 'D completes and returns pages 2, 3, 4; B can now resume and rebuild its cache',
        0,
        175,
        28,
        br === 0 ? ROLE.d : br === 1 ? ROLE.ok : ROLE.a,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const rs = Math.round(replayStep.value);
    const nodes = [
      txt(
        "B'S RESUME: REBUILD CACHE WITHOUT DUPLICATING 701 OR 702",
        -855,
        -215,
        26,
        ROLE.b,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Replay KV: [p1, p2, 701] (3 pos)', -470, -85, {
        w: 720,
        h: 82,
        color: rs >= 1 ? ROLE.d : COSMOS.rule,
        size: 28,
        glow: rs >= 1 ? 10 : 0,
        opacity: alpha,
      }),
      chipPill('Feed Input: 702', 120, -85, {
        w: 360,
        h: 82,
        color: rs >= 2 ? ROLE.a : COSMOS.rule,
        size: 28,
        glow: rs >= 2 ? 10 : 0,
        opacity: alpha * (rs >= 2 ? 1 : 0.45),
      }),
      chipPill('Emit ONCE: 703', 595, -85, {
        w: 480,
        h: 82,
        color: rs >= 3 ? ROLE.ok : COSMOS.rule,
        fill: rs >= 3 ? '#0f2d24' : '#10182d',
        size: 30,
        glow: rs >= 3 ? 14 : 0,
        opacity: alpha * (rs >= 3 ? 1 : 0.45),
      }),

      chipPill('Client Stream:  [ 701, 702' + (rs >= 3 ? ', 703 ]' : ' ]'), 0, 85, {
        w: 880,
        h: 80,
        color: rs >= 3 ? ROLE.ok : ROLE.b,
        size: 32,
        glow: rs >= 3 ? 12 : 4,
        opacity: alpha,
      }),

      txt(
        rs >= 4
          ? 'Giving D a turn cost B a wait and 3 positions of KV replay (exact accounting across every request!)'
          : 'Accepted tokens stay on the client ledger while KV is rebuilt silently',
        0,
        255,
        28,
        rs >= 4 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'fresh-admission-b1', (d) => s.play(branch.to(0, { duration: d })));
  playCue(s, c, 'fresh-next-input', (d) => s.play(branch.to(0, { duration: d })));
  // Strict prediction withholding: reveal E joining only after fresh-admission-b2!
  playCue(s, c, 'fresh-admission-b2', (d) => s.play(branch.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'fresh-e-restore', (d) => s.play(branch.to(1, { duration: d })));
  playCue(s, c, 'fresh-e-run', (d) => s.play(branch.to(1, { duration: d })));
  playCue(s, c, 'fresh-admission-b3', (d) => s.play(branch.to(2, { duration: d })));
  playCue(s, c, 'fresh-d-restore', (d) => s.play(branch.to(3, { duration: d })));
  playCue(s, c, 'fresh-d-run', (d) => s.play(branch.to(3, { duration: d })));
  playCue(s, c, 'fresh-d-complete', (d) => s.play(branch.to(4, { duration: d })));
  playCue(s, c, 'fresh-d-return', (d) => s.play(branch.to(4, { duration: d })));
  playCue(s, c, 'fresh-admission-b4', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'fresh-history-replay', (d) => s.play(replayStep.to(1, { duration: d })));
  playCue(s, c, 'fresh-b-input', (d) => s.play(replayStep.to(2, { duration: d })));
  playCue(s, c, 'fresh-only-new', (d) => s.play(replayStep.to(3, { duration: d })));
  playCue(s, c, 'fresh-replay-cost', (d) => s.play(replayStep.to(4, { duration: d })));
}
