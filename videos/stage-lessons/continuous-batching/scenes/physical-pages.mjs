// Scene 10: physical-pages: D maps pages {0,1,6} across gap -> 4 histories slack (31/192) -> hybrid 64 KiB/pos = 0.25 GiB.
import {
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  pageCount,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function physicalPages(s, c) {
  const view1Vis = s.value(1); // 8-page pool: D takes 0, 1, 6
  const view2Vis = s.value(0); // 4 histories slack (31 unused) + hybrid 256-block / 0.25 GiB budget
  const placeLeft = s.value(0);
  const placeRight = s.value(0);
  const showSlack = s.value(0);
  const showHybrid = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Block Tables, Final-Page Slack', '& KV Byte Budgets'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.d,
  });

  // View 1: 8-page pool (pages 2..5 held by B & C; pages 0, 1, 6, 7 free -> D takes 0, 1, 6!)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const pL = placeLeft.value;
    const pR = placeRight.value;
    const nodes = [
      txt(
        '8-PAGE PHYSICAL POOL: D NEEDS 3 PAGES AROUND B & C',
        -855,
        -210,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -740 + i * 212;
      let owner = 'FREE';
      let col = COSMOS.rule;
      if (i === 2 || i === 3) {
        owner = 'B';
        col = ROLE.b;
      } else if (i === 4 || i === 5) {
        owner = 'C';
        col = ROLE.c;
      } else if ((i === 0 || i === 1) && pL > 0.35) {
        owner = `D[${i}]`;
        col = ROLE.d;
      } else if (i === 6 && pR > 0.35) {
        owner = 'D[2]';
        col = ROLE.d;
      }
      nodes.push(
        rect(188, 125, {
          fill: col === COSMOS.rule ? '#0f1628' : '#14233d',
          stroke: col,
          width: col === ROLE.d ? 3.4 : 2.4,
          radius: 12,
        })
          .at(cx, -80)
          .glow(col === ROLE.d ? 12 : 0, col)
          .opacity(alpha),
        txt(`Page ${i}`, cx, -115, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(owner, cx, -58, 32, col === COSMOS.rule ? COSMOS.dim : col, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      txt(
        pR > 0.35
          ? 'Block Table for D:  [ Page 0, Page 1, Page 6 ]   (B & C never move; Page 7 stays free!)'
          : '2 free on left (0, 1) + 2 free on right (6, 7): how does D fit 3 pages?',
        0,
        140,
        32,
        pR > 0.35 ? ROLE.ok : ROLE.d,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // View 2: 4 histories (17, 31, 48, 65 tokens @ 16/page -> 12 pages = 192 slots, 31 slack) + Hybrid 64 KiB/pos
  const histLens = [17, 31, 48, 65];
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const sl = showSlack.value;
    const hy = showHybrid.value;
    const barX = -460;
    const maxW = 620;
    const nodes = [
      txt(
        'INTERNAL FINAL-PAGE SLACK (BLOCK SIZE = 16 SLOTS)',
        -855,
        -225,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    histLens.forEach((len, idx) => {
      const pgs = pageCount(len, 16);
      const cap = pgs * 16;
      const slack = cap - len;
      const y = -150 + idx * 72;
      nodes.push(
        txt(`Len ${len} (${pgs} pgs)`, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
        lumBar(barX, y, (len / 80) * maxW, 30, ROLE.a, {
          opacity: alpha,
          maxTrackW: (cap / 80) * maxW,
        }),
        txt(
          `${slack} slack`,
          barX + (cap / 80) * maxW + 24,
          y,
          28,
          slack > 0 && sl > 0.3 ? ROLE.warn : ROLE.ok,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Total: 161 used / 192 allocated  ->  31 private slack slots (unusable by new arrivals)',
        -855,
        140,
        28,
        sl > 0.3 ? ROLE.warn : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'HYBRID: 16L x 4H x 256d x 2B x K&V = 64 KiB/pos -> 4096 pos = 0.25 GiB (256 pgs)',
        -855,
        245,
        26,
        hy > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(hy > 0.3 ? 8 : 0, ROLE.ok)
        .opacity(alpha * (0.35 + 0.65 * hy)),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'physical-pages-b1', (d) => s.play(placeLeft.to(0, { duration: d })));
  // Strict prediction withholding: place D on 0, 1, 6 only on Beat 2 cues!
  playCue(s, c, 'physical-pair', (d) => s.play(placeLeft.to(1, { duration: d })));
  playCue(s, c, 'physical-map', (d) => s.play(placeRight.to(1, { duration: d })));
  playCue(s, c, 'physical-pages-b2', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'physical-slack', (d) => s.play(showSlack.to(1, { duration: d })));
  playCue(s, c, 'physical-pages-b3', (d) => s.play(showHybrid.to(0.5, { duration: d })));
  playCue(s, c, 'physical-bytes', (d) => s.play(showHybrid.to(0.8, { duration: d })));
  playCue(s, c, 'physical-total', (d) => s.play(showHybrid.to(1, { duration: d })));
}
