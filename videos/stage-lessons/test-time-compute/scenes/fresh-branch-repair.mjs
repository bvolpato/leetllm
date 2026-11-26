// Scene 27: fresh-branch-repair: 6 branches (3000 shared + 6x500 tails) in 256 MiB: predict draft? -> AFTER tt-fresh-candidate reveal C3=6000! Size 281.25 MiB (>256) -> release 1 (257.81 >256) -> release 2 (234.38 <=256 FITS!) -> return 6000, 5000 live, 3000 spent + 6 scorer calls!
import {
  COSMOS,
  FRESH_4,
  FRESH_5,
  FRESH_6,
  ROLE,
  aura,
  chipPill,
  finalRequest,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  swapVis,
  txt,
} from '../parts.mjs';

export default function freshBranchRepair(s, c) {
  const view1Vis = s.value(1); // 6 drafts vs true count 6000
  const view2Vis = s.value(0); // 256 MiB KV budget -> release tail 6 & tail 5 -> 4 tails fit!
  const revealPick = s.value(0); // strictly withheld until AFTER tt-fresh-candidate!
  const releaseStage = s.value(0); // 0=6 tails (281.25), 1=5 tails (257.81), 2=4 tails (234.38)
  const showFinalBill = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(
    ['Final Branch Verification & Repair:', 'Verify Drafts, Fit 256 MiB & Track Bill'],
    {
      x: -855,
      y: -430,
      size: 44,
      lineHeight: 52,
      accent: ROLE.ok,
    },
  );

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const pk = revealPick.value;

    const nodes = [
      txt(
        '6 FINISHED BRANCHES:  3,000 SHARED PROMPT + 6 x 500 PRIVATE TAILS  |  LIMIT: 256 MiB',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    finalRequest.answers.forEach((ans, idx) => {
      const cx = -700 + idx * 280;
      const sc = finalRequest.scores[idx];
      const isC3 = idx === 2;
      const isTopScorer = idx === 0;
      const col =
        isC3 && pk > 0.35 ? ROLE.ok : isTopScorer ? (pk > 0.35 ? ROLE.err : ROLE.gold) : ROLE.draft;
      nodes.push(
        rect(244, 175, {
          fill:
            isC3 && pk > 0.35
              ? '#0f2d24'
              : isTopScorer
                ? pk > 0.35
                  ? '#321420'
                  : '#261e10'
                : '#101c36',
          stroke: col,
          width: (isC3 && pk > 0.35) || isTopScorer ? 3.0 : 2.2,
          radius: 12,
        })
          .at(cx, -70)
          .opacity(alpha),
        txt(`C${idx + 1}`, cx, -120, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(`${ans}`, cx, -70, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(
          `s=${sc.toFixed(2)}`,
          cx,
          -20,
          26,
          isTopScorer && pk > 0.35 ? ROLE.err : ROLE.gold,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      chipPill(
        pk > 0.35
          ? 'KEEP C3 (6,000)! C1 scored highest (0.96) with 3,500, but 3,000 + 6x500 = 6,000!'
          : 'C1 scored highest (0.96): count 1 shared prompt + 6 tails -> which draft is right?',
        0,
        150,
        {
          w: 1620,
          h: 80,
          color: pk > 0.35 ? ROLE.ok : ROLE.gold,
          fill: pk > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    );
    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const st = releaseStage.value;
    const bl = showFinalBill.value;

    const barX = -480;
    const maxW = 720;
    const px = maxW / 310;
    const cap256X = barX + 256 * px;

    const mib6 = FRESH_6.bytes / 2 ** 20;
    const mib5 = FRESH_5.bytes / 2 ** 20;
    const mib4 = FRESH_4.bytes / 2 ** 20;

    const nodes = [
      txt(
        '24L x 4 KV HEADS x 128 x 2B = 48 KiB/POS  |  POOL LIMIT = 256.0 MiB',
        -855,
        -225,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      lumBar(cap256X - 2, -154, 4, 24, ROLE.gold, { opacity: alpha, glow: 8 }),
      lumBar(cap256X - 2, 138, 4, 28, ROLE.gold, { opacity: alpha, glow: 8 }),
      txt('256 MiB CAP', cap256X, -196, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      txt('6 tails (6,000)', -855, -105, 26, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, -105, mib6 * px, 38, ROLE.err, { opacity: alpha, maxTrackW: maxW }),
      txt(
        `${mib6.toFixed(2)} MiB (OVER!)`,
        barX + maxW + 24,
        -105,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha),

      txt('5 tails (5,500)', -855, -15, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (st >= 0.85 ? 1 : 0.48),
      ),
      lumBar(barX, -15, st >= 0.85 ? mib5 * px : 24, 38, ROLE.gold, {
        opacity: alpha * (st >= 0.85 ? 1 : 0.48),
        maxTrackW: maxW,
      }),
      txt(
        st >= 0.85 ? `${mib5.toFixed(2)} MiB (+1.8 OVER!)` : '? MiB (predict)',
        barX + maxW + 24,
        -15,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (st >= 0.85 ? 1 : 0.65)),

      txt(
        '4 tails (5,000)',
        -855,
        75,
        26,
        st >= 1.7 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (st >= 1.7 ? 1 : 0.48)),
      lumBar(barX, 75, st >= 1.7 ? mib4 * px : 24, 38, st >= 1.7 ? ROLE.ok : ROLE.draft, {
        opacity: alpha * (st >= 1.7 ? 1 : 0.48),
        maxTrackW: maxW,
      }),
      txt(
        st >= 1.7 ? `${mib4.toFixed(2)} MiB (FITS!)` : '? MiB',
        barX + maxW + 24,
        75,
        26,
        st >= 1.7 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (st >= 1.7 ? 1 : 0.55)),

      chipPill(
        bl > 0.35
          ? 'RETURN 6,000 | LIVE: 5,000 pos (234.4 MiB) | BILL: 3,000 gen tok + 6 scorer calls!'
          : st >= 1.7
            ? 'Release tails 6 & 5 -> 4 tails + shared prompt = 234.38 MiB <= 256 MiB (FITS!)'
            : st >= 0.85
              ? '5 tails = 257.81 MiB (+1.8 over 256 MiB): releasing 1 tail is not enough!'
              : '281.25 MiB > 256 MiB: does releasing tail 6 alone fit under 256 MiB?',
        0,
        225,
        {
          w: 1620,
          h: 78,
          color: bl > 0.35 || st >= 1.7 ? ROLE.ok : ROLE.gold,
          fill: bl > 0.35 || st >= 1.7 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'fresh-limit', (d) => s.play(revealPick.to(0, { duration: d })));
  playCue(s, c, 'fresh-prefix', (d) => s.play(revealPick.to(0, { duration: d })));
  playCue(s, c, 'fresh-tails', (d) => s.play(revealPick.to(0, { duration: d })));
  playCue(s, c, 'fresh-answers', (d) => s.play(revealPick.to(0, { duration: d })));
  playCue(s, c, 'fresh-high-score', (d) => s.play(revealPick.to(0, { duration: d })));
  playCue(s, c, 'fresh-pick', (d) => s.play(revealPick.to(0, { duration: d })));
  // Strict prediction withholding: reveal C3=6000 only after tt-fresh-candidate!
  playCue(s, c, 'tt-fresh-candidate', (d) => s.play(revealPick.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'fresh-factors', (d) => s.play(swapVis(view1Vis, view2Vis, d)));
  playCue(s, c, 'tt-fresh-geometry', (d) => s.play(releaseStage.to(0, { duration: d })));
  playCue(s, c, 'tt-fresh-overflow', (d) => s.play(releaseStage.to(0, { duration: d })));
  playCue(s, c, 'one-enough', (d) => s.play(releaseStage.to(0, { duration: d })));
  // Strict prediction withholding #2: reveal 5-tail & 4-tail outcomes only after their release cues!
  playCue(s, c, 'tt-fresh-release-one', (d) => s.play(releaseStage.to(1.0, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'first-over', (d) => s.play(releaseStage.to(1.0, { duration: d })));
  playCue(s, c, 'tt-fresh-release', (d) => s.play(releaseStage.to(2.0, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'tt-fresh-fits', (d) => s.play(releaseStage.to(2.0, { duration: d })));
  playCue(s, c, 'returned-answer', (d) => s.play(showFinalBill.to(0.5, { duration: d })));
  playCue(s, c, 'tt-fresh-spent', (d) => s.play(showFinalBill.to(1, { duration: d })));
}
