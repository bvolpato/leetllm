// Scene 26: complete-release-gate: "Would you ship the shorter request?"
// Two prediction beats over 10 paired incident cases (C1..C10, C2 protected):
// B0 (PREDICT hold=2.2): 12,436 -> 3,346 units, 7/10 -> 8/10, C2 fails -> "Would you ship this version?"
// B1 (PREDICT hold=2.0): Reveal HOLD at C2 -> retest flips C2 fail->pass -> "Does the candidate pass now?"
// B2: Reveal YES (9/10 Pass this suite) + strict input-type contract.
import {
  CONTEXT_RELEASE_CASES,
  COSMOS,
  RELEASE_CASES_REPAIRED,
  RELEASE_FIRST,
  RELEASE_REPAIRED,
  ROLE,
  aura,
  ease,
  fmt,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function completeReleaseGate(s, c) {
  const showCurated = s.value(0);
  const showScore = s.value(0);
  const showHold = s.value(0); // WITHHELD until B1 gate-hold!
  const repairC2 = s.value(0);
  const showApprove = s.value(0); // WITHHELD until B2 gate-approve!

  const bgAura = aura(0, 20, 820, '#14335c2a', '#14352822');
  const title = heroTitle(['Would you ship the', 'shorter request?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.units,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cu = ease(showCurated.value);
    const sc = ease(showScore.value);
    const hd = ease(showHold.value);
    const rp = ease(repairC2.value);
    const ap = ease(showApprove.value);

    const cases = rp > 0.4 ? RELEASE_CASES_REPAIRED : CONTEXT_RELEASE_CASES;
    const summary = rp > 0.4 ? RELEASE_REPAIRED : RELEASE_FIRST;

    const nodes = [
      // Top-right token drop summary
      txt('ASSIGNED INPUT UNITS', 855, -430, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      txt(
        `${fmt(summary.rawUnits)}  ->  ${fmt(summary.curatedUnits)}`,
        855,
        -365,
        46,
        ROLE.evidence,
        'mono',
        'right',
      ).opacity(alpha),

      // Row headers
      txt('RAW', -855, -120, 32, COSMOS.ink, 'mono', 'left').opacity(alpha),
      txt('CURATED', -855, 8, 32, ROLE.evidence, 'mono', 'left').opacity(alpha),
    ];

    // 10 paired columns C1..C10
    const startX = -595;
    const stepX = 148;
    cases.forEach((row, i) => {
      const cx = startX + i * stepX;
      const isCrit = row.critical;
      nodes.push(
        txt(row.id, cx, -210, 30, isCrit ? ROLE.units : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
      );

      // Raw cell
      const rawCol = row.raw ? ROLE.evidence : COSMOS.dim;
      nodes.push(
        rect(118, 78, { fill: '#10182d', stroke: rawCol, width: 2.2, radius: 10 })
          .at(cx, -120)
          .opacity(alpha),
        txt(row.raw ? 'pass' : 'fail', cx, -120, 30, rawCol, 'mono', 'center').opacity(alpha),
      );

      // Curated cell
      const revealed = cu > 0.35;
      const changed = revealed && row.raw !== row.curated;
      const curCol = !revealed
        ? ROLE.dim
        : isCrit && !row.curated
          ? ROLE.poison
          : changed
            ? row.curated
              ? ROLE.note
              : ROLE.poison
            : row.curated
              ? ROLE.evidence
              : COSMOS.dim;
      const curBox = rect(118, 78, {
        fill: !revealed ? '#0c1120' : isCrit && !row.curated ? '#2c1220' : '#101c34',
        stroke: curCol,
        width: isCrit ? 3.2 : 2.2,
        radius: 10,
      })
        .at(cx, 8)
        .opacity(alpha);
      if (isCrit && revealed) curBox.glow(10, curCol);
      nodes.push(
        curBox,
        txt(
          !revealed ? '?' : row.curated ? 'pass' : 'fail',
          cx,
          8,
          30,
          curCol,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Protected marker underneath C2
      if (isCrit) {
        nodes.push(
          line([cx - 58, 66], [cx + 58, 66], { stroke: ROLE.units, width: 4 })
            .glow(8, ROLE.units)
            .opacity(alpha),
          txt('protected', cx, 104, 26, ROLE.units, 'mono', 'center').opacity(alpha),
        );
      }
    });

    // Bottom metrics strip: Successes | Poisoning | Release decision (STRICTLY WITHHELD on prediction beats!)
    const scoreText =
      rp > 0.4
        ? `${summary.raw}/10  ->  ${summary.curated}/10`
        : sc > 0.35
          ? `${RELEASE_FIRST.raw}/10  ->  ${RELEASE_FIRST.curated}/10`
          : 'Compare pairs';

    const verdictText =
      rp > 0.4
        ? ap > 0.35
          ? 'PASS THIS SUITE (9/10)'
          : 'Does it pass now? (?)'
        : hd > 0.35
          ? 'HOLD AT C2'
          : 'Ship this version? (?)';

    const verdictCol =
      rp > 0.4 ? (ap > 0.35 ? ROLE.note : ROLE.units) : hd > 0.35 ? ROLE.poison : ROLE.units;

    nodes.push(
      txt('SUCCESSES', -855, 200, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(scoreText, -855, 265, 44, COSMOS.ink, 'mono', 'left').opacity(alpha),

      txt('POISONING', -180, 200, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('0 events', -180, 265, 44, ROLE.note, 'mono', 'left').opacity(alpha),

      txt('RELEASE DECISION', 260, 200, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(verdictText, 260, 265, 44, verdictCol, 'mono', 'left')
        .glow(ap > 0.35 || hd > 0.35 ? 9 : 4, verdictCol)
        .opacity(alpha),

      txt(
        ap > 0.35
          ? 'Gate requires: fewer tokens, >= overall wins, every protected pass, 0 poisoning.'
          : rp > 0.4
            ? 'Retest flipped C2 from fail to pass while keeping all other rows fixed.'
            : 'Pre-registered promise: protected case C2 must pass before shipping.',
        0,
        395,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);

  playCue(s, c, 'gate-outcomes', (d) => s.play(showCurated.to(1, { duration: d })));
  playCue(s, c, 'gate-score', (d) => s.play(showScore.to(1, { duration: d })));
  // Prediction 1 reveal ONLY in B1 on gate-hold!
  playCue(s, c, 'gate-hold', (d) => s.play(showHold.to(1, { duration: d })));
  playCue(s, c, 'gate-repair', (d) => s.play(repairC2.to(1, { duration: d })));
  // Prediction 2 reveal ONLY in B2 on gate-approve!
  playCue(s, c, 'gate-approve', (d) => s.play(showApprove.to(1, { duration: d })), { after: true });
}
