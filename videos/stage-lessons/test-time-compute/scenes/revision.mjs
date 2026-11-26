// Scene 08: revision: D1=32 (0.61 fail), D2=44 (0.76 PASS), D3=48 (0.78 fail), D4=48 (0.781, gain 0.001 < 0.01) -> predict 5th draft? -> AFTER stop-revision reveal STOP (7 calls, send D2)!
import {
  COSMOS,
  REV_LEDGER_4,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function revision(s, c) {
  const showFourth = s.value(0);
  const revealStop = s.value(0); // strictly withheld until AFTER stop-revision!
  const showLedger = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['Sequential Self-Revision:', 'Plateau Stopping & Best-Checked Fallback'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.gold,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const f4 = showFourth.value;
    const st = revealStop.value;
    const lg = showLedger.value;

    const nodes = [
      txt(
        'STOP RULE: CONTINUE ONLY WHILE SCORE GAIN >= 0.01  |  TRACK BEST VERIFIED DRAFT!',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    REV_LEDGER_4.rows.forEach((row, idx) => {
      const cx = -630 + idx * 420;
      const isFourth = idx === 3;
      const op = isFourth ? alpha * (0.48 + 0.52 * f4) : alpha;
      const col = row.passed ? ROLE.ok : idx >= 2 ? ROLE.err : ROLE.draft;
      nodes.push(
        rect(360, 175, {
          fill: row.passed ? '#0f2d24' : idx >= 2 ? '#321420' : '#101c36',
          stroke: col,
          width: row.passed ? 3.2 : 2.4,
          radius: 12,
        })
          .at(cx, -75)
          .opacity(op),
        txt(`${row.id}: Ans ${row.answer}`, cx, -124, 28, COSMOS.ink, 'mono', 'center').opacity(op),
        txt(`score = ${row.score.toFixed(3)}`, cx, -74, 28, ROLE.gold, 'mono', 'center').opacity(
          op,
        ),
        txt(
          row.passed ? 'PASS (KEEP BEST!)' : 'fails check',
          cx,
          -24,
          26,
          row.passed ? ROLE.ok : ROLE.err,
          'mono',
          'center',
        ).opacity(op),
      );
    });

    nodes.push(
      chipPill(
        st > 0.35
          ? 'STOP! D4 gain = +0.001 < 0.01 -> D5 unstarted; SEND D2 (44, verified!)'
          : f4 > 0.35
            ? 'D4 scored 0.781 vs D3 0.780 (+0.001): would you pay for a 5th draft?'
            : 'D2 passed (44), then D3 drifted to 48 (higher score 0.78, fails check!)',
        0,
        115,
        {
          w: 1600,
          h: 80,
          color: st > 0.35 ? ROLE.ok : ROLE.gold,
          fill: st > 0.35 ? '#0f2d24' : '#261e10',
          size: 27,
          glow: 10,
          opacity: alpha,
        },
      ),
      chipPill(
        lg > 0.35
          ? `Ledger: 4 drafts = 1 + 2x3 = ${REV_LEDGER_4.calls} generation calls (+ separate verifier checks)`
          : 'Revisions can break a working draft: always keep the best checked copy in memory',
        0,
        235,
        {
          w: 1600,
          h: 74,
          color: lg > 0.35 ? ROLE.search : COSMOS.muted,
          size: 26,
          opacity: alpha * (0.5 + 0.5 * lg),
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'draft-check', (d) => s.play(showFourth.to(0, { duration: d })));
  playCue(s, c, 'repair-candidate', (d) => s.play(showFourth.to(0, { duration: d })));
  playCue(s, c, 'checked-candidate', (d) => s.play(showFourth.to(0, { duration: d })));
  playCue(s, c, 'damaged-revision', (d) => s.play(showFourth.to(0.2, { duration: d })));
  playCue(s, c, 'stop-threshold', (d) => s.play(showFourth.to(0.4, { duration: d })));
  playCue(s, c, 'fourth-paid', (d) => s.play(showFourth.to(0.7, { duration: d })));
  playCue(s, c, 'plateau-score', (d) => s.play(showFourth.to(1, { duration: d })));
  playCue(s, c, 'compare-gain', (d) => s.play(revealStop.to(0, { duration: d })));
  playCue(s, c, 'fifth-draft', (d) => s.play(revealStop.to(0, { duration: d })));
  // Strict prediction withholding: reveal STOP + D2 only after stop-revision!
  playCue(s, c, 'stop-revision', (d) => s.play(revealStop.to(1, { duration: d })), { after: true });
  playCue(s, c, 'generation-ledger', (d) => s.play(showLedger.to(1, { duration: d })));
  playCue(s, c, 'usable-stop', (d) => s.play(showLedger.to(1, { duration: d })));
}
