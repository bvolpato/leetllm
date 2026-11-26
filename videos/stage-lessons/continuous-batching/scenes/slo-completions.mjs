// Scene 15: slo-completions: Joint SLO (TTFT<=300ms & TPOT<=30ms): 2/4 completions -> 2/5 offered (40% attainment) & 5-token p99 gap check.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function sloCompletions(s, c) {
  const view1Vis = s.value(1); // 4 completions + 5th expired -> goodput 0.2/s, attainment 40%
  const view2Vis = s.value(0); // 5-token stream (4 gaps): mean passes, 3/4 gaps <= 100ms
  const checkStep = s.value(0); // 0=raw, 1=R2 late, 2=R3 gap high, 3=joint 2/4, 4=goodput 0.2/s, 5=5th expired (40%)
  const gapStep = s.value(0); // 0=4 gaps, 1=100ms limit, 2=p99 rank

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Joint SLO Goodput &', 'Offered-Load Attainment'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.ok,
  });

  const rows = [
    { id: 'Reply 1', ttft: '210 ms (OK)', tpot: '24 ms (OK)', pass: true, col: ROLE.ok },
    { id: 'Reply 2', ttft: '420 ms (LATE)', tpot: '22 ms (OK)', pass: false, col: ROLE.warn },
    { id: 'Reply 3', ttft: '250 ms (OK)', tpot: '42 ms (>30)', pass: false, col: ROLE.warn },
    { id: 'Reply 4', ttft: '280 ms (OK)', tpot: '28 ms (OK)', pass: true, col: ROLE.ok },
  ];

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const cs = Math.round(checkStep.value);
    const nodes = [
      txt(
        '10 s WINDOW  |  LIMITS: TTFT <= 300 ms  AND  MEAN GAP <= 30 ms',
        -855,
        -225,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rows.forEach((r, i) => {
      const y = -140 + i * 82;
      const revealRow = cs >= 3 || (cs >= 1 && i === 1) || (cs >= 2 && i === 2);
      const verdictCol = revealRow ? r.col : COSMOS.rule;
      nodes.push(
        txt(r.id, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
        chipPill(r.ttft, -430, y, {
          w: 340,
          h: 64,
          color: i === 1 && cs >= 1 ? ROLE.warn : ROLE.a,
          size: 26,
          opacity: alpha,
        }),
        chipPill(r.tpot, 0, y, {
          w: 340,
          h: 64,
          color: i === 2 && cs >= 2 ? ROLE.warn : ROLE.a,
          size: 26,
          opacity: alpha,
        }),
        chipPill(revealRow ? (r.pass ? 'KEEP BOTH' : 'MISS') : 'CHECK', 420, y, {
          w: 280,
          h: 64,
          color: verdictCol,
          fill: revealRow ? (r.pass ? '#0f2d24' : '#2e1420') : '#10182d',
          size: 26,
          glow: revealRow ? 8 : 0,
          opacity: alpha,
        }),
      );
    });

    // 5th expired request row + summary
    const expOp = cs >= 5 ? alpha : alpha * 0.28;
    nodes.push(
      txt('Arrival 5', -855, 195, 28, cs >= 5 ? ROLE.warn : COSMOS.dim, 'mono', 'left').opacity(
        expOp,
      ),
      chipPill('EXPIRED IN QUEUE (STAYS IN OFFERED COUNT!)', -80, 195, {
        w: 1020,
        h: 66,
        color: cs >= 5 ? ROLE.warn : COSMOS.rule,
        size: 26,
        opacity: expOp,
      }),
      txt(
        cs >= 5
          ? 'Goodput = 2 / 10 s = 0.2 req/s   |   Attainment = 2 / 5 offered = 40%'
          : cs >= 4
            ? 'Raw throughput = 0.4/s (4/10s), but joint-SLO goodput = 0.2/s (2/10s)'
            : 'Both TTFT and inter-token gap limits must pass on the SAME request',
        0,
        310,
        28,
        cs >= 4 ? ROLE.ok : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const gs = Math.round(gapStep.value);
    const gaps = [40, 50, 140, 50]; // 4 gaps, mean = 70ms <= 100ms, but 140ms > 100ms!
    const nodes = [
      txt(
        '5-TOKEN STREAM -> 4 INTER-TOKEN GAPS  (LIMIT: 100 ms PER GAP)',
        -855,
        -210,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];
    gaps.forEach((g, idx) => {
      const cx = -570 + idx * 380;
      const fail = g > 100 && gs >= 1;
      nodes.push(
        rect(310, 130, {
          fill: fail ? '#321420' : '#102924',
          stroke: fail ? ROLE.warn : ROLE.ok,
          width: 3,
          radius: 14,
        })
          .at(cx, -50)
          .glow(fail ? 12 : 6, fail ? ROLE.warn : ROLE.ok)
          .opacity(alpha),
        txt(`Gap ${idx + 1}`, cx, -82, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(`${g} ms`, cx, -28, 38, fail ? ROLE.warn : ROLE.ok, 'mono', 'center').opacity(alpha),
      );
    });
    nodes.push(
      txt(
        gs >= 2
          ? 'Mean TPOT = 70 ms (passes), but only 3/4 gaps <= 100 ms -> specify nearest-rank p99!'
          : 'Divide (t_last - t_first) by (N - 1) = 4 gaps to compute mean TPOT',
        0,
        165,
        30,
        gs >= 1 ? ROLE.warn : ROLE.a,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'slo-completions-b1', (d) => s.play(checkStep.to(0, { duration: d })));
  playCue(s, c, 'slo-misses', (d) => s.play(checkStep.to(1, { duration: d })));
  playCue(s, c, 'slo-third', (d) => s.play(checkStep.to(2, { duration: d })));
  playCue(s, c, 'slo-joint', (d) => s.play(checkStep.to(3, { duration: d })));
  playCue(s, c, 'slo-rates', (d) => s.play(checkStep.to(4, { duration: d })));
  playCue(s, c, 'slo-completions-b2', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'slo-gap-limit', (d) => s.play(gapStep.to(1, { duration: d })));
  playCue(s, c, 'slo-gap-rank', (d) => s.play(gapStep.to(2, { duration: d })));
  playCue(s, c, 'slo-completions-b3', (d) => s.play(swapVis(view2Vis, view1Vis, d)));
  playCue(s, c, 'slo-expired', (d) => s.play(checkStep.to(5, { duration: d })));
}
