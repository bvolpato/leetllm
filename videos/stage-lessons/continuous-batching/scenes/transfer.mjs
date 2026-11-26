// Scene 19: transfer: D needs 1 seat (OK), 1 token (OK), 3 pages (only 2 free!) -> under FIFO only B & C run.
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
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const checkStep = s.value(0); // 0=seats, 1=work, 2=KV pages
  const revealBlock = s.value(0); // strictly withheld until surviving-streams!
  const showE = s.value(0);

  const fifo = freshBatchingBoundary('fifo');

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Is There Room for D?', 'Seats, Work & KV Pages'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.d,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cs = Math.round(checkStep.value);
    const rev = revealBlock.value;
    const se = showE.value;

    const nodes = [
      txt(
        '5-PAGE GPU POOL (4 SLOTS/PAGE)  |  D HAS 11 POSITIONS + 1 INPUT = 3 PAGES NEEDED',
        -855,
        -220,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),

      // 3 resource budgets across top
      chipPill('Seats: 2/3 used (1 FREE)', -575, -120, {
        w: 500,
        h: 72,
        color: ROLE.ok,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Work: 2/8 inputs (6 FREE)', 0, -120, {
        w: 500,
        h: 72,
        color: cs >= 1 ? ROLE.ok : COSMOS.rule,
        size: 26,
        opacity: alpha,
      }),
      chipPill('KV Pages: 3/5 used (2 FREE < 3!)', 575, -120, {
        w: 520,
        h: 72,
        color: cs >= 2 ? ROLE.warn : COSMOS.rule,
        fill: cs >= 2 ? '#321420' : '#10182d',
        size: 26,
        glow: cs >= 2 ? 12 : 0,
        opacity: alpha,
      }),
    ];

    // 5 physical pages + 1 missing dashed outline for D's 3rd page
    const pageLabels = ['P0: C', 'P1: C', 'P2: B', 'P3: FREE', 'P4: FREE', 'P5: MISSING!'];
    const pageCols = [ROLE.c, ROLE.c, ROLE.b, ROLE.d, ROLE.d, ROLE.warn];
    pageLabels.forEach((lbl, i) => {
      const cx = -720 + i * 285;
      const isMissing = i === 5;
      nodes.push(
        rect(250, 110, {
          fill: isMissing ? '#2b121c' : i >= 3 ? '#261e10' : '#142038',
          stroke: pageCols[i],
          width: isMissing ? 3.2 : 2.4,
          radius: 12,
        })
          .at(cx, 55)
          .glow(isMissing && rev > 0.3 ? 12 : 0, ROLE.warn)
          .opacity(alpha * (isMissing ? 0.45 + 0.55 * Math.max(cs >= 2 ? 0.5 : 0, rev) : 1)),
        txt(lbl, cx, 55, 28, pageCols[i], 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        se > 0.3
          ? 'E waits right behind D (keep BOTH in offered count): ready to branch into 2 policies!'
          : rev > 0.4
            ? `FIFO decision: ONLY ${fifo.active.map((r) => r.id).join(' & ')} run; 3rd seat stays empty (1 page short!)`
            : 'D needs 3 pages (11 + 1 = 12 slots), but only 2 pages are free: where would the 3rd go?',
        0,
        245,
        28,
        se > 0.3 ? ROLE.ok : rev > 0.4 ? ROLE.warn : ROLE.d,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'sequence-seats', (d) => s.play(checkStep.to(0, { duration: d })));
  playCue(s, c, 'token-work', (d) => s.play(checkStep.to(1, { duration: d })));
  playCue(s, c, 'resident-memory', (d) => s.play(checkStep.to(2, { duration: d })));
  // Strict prediction withholding: reveal B & C only running after surviving-streams!
  playCue(s, c, 'surviving-streams', (d) => s.play(revealBlock.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'memory-pressure', (d) => s.play(revealBlock.to(1, { duration: d })));
  playCue(s, c, 'completed-requests', (d) => s.play(showE.to(1, { duration: d })));
  playCue(s, c, 'state-accounting', (d) => s.play(showE.to(1, { duration: d })));
}
