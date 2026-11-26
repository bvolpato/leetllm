// Scene 23: quality: Paired 4-check scorecard (both score 3/4), candidate improves abstention but drops --confirm on protected rollback -> HOLD!
import {
  COSMOS,
  EVAL_BASE,
  EVAL_CAND,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  outputs,
  playCue,
  txt,
} from '../parts.mjs';

export default function quality(s, c) {
  const showAbstain = s.value(0);
  const revealRegression = s.value(0); // strictly withheld until AFTER read-flag!
  const showSave = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Paired Release Checks:', 'Tied 3/4, Protected Regression'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ab = showAbstain.value;
    const reg = revealRegression.value;
    const sv = showSave.value;

    const nodes = [
      txt('CHECK', -855, -215, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(`BASELINE (${EVAL_BASE.score}/4)`, -220, -215, 26, ROLE.vram, 'mono', 'center').opacity(
        alpha,
      ),
      txt(`CANDIDATE (${EVAL_CAND.score}/4)`, 300, -215, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    EVAL_BASE.rows.forEach((bRow, i) => {
      const cRow = EVAL_CAND.rows[i];
      const y = -135 + i * 76;
      const isCrit = bRow.critical;
      const highlightFail = isCrit && reg > 0.35;
      const highlightGain = i === 3 && ab > 0.3;
      nodes.push(
        txt(
          isCrit ? `${bRow.id} [PROTECTED]` : bRow.id,
          -855,
          y,
          26,
          highlightFail ? ROLE.work : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
        chipPill(bRow.pass ? 'PASS' : 'FAIL', -220, y, {
          w: 220,
          h: 58,
          color: bRow.pass ? ROLE.ok : ROLE.work,
          size: 26,
          opacity: alpha,
        }),
        chipPill(cRow.pass ? 'PASS' : reg > 0.35 ? 'MISSING --confirm' : 'FAIL', 300, y, {
          w: 390,
          h: 58,
          color: cRow.pass ? ROLE.ok : ROLE.work,
          fill: highlightFail ? '#361422' : highlightGain ? '#0f2d24' : '#10182d',
          size: 26,
          glow: highlightFail || highlightGain ? 12 : 0,
          opacity: alpha,
        }),
      );
    });

    nodes.push(
      chipPill(
        reg > 0.4
          ? `HOLD RELEASE!  Baseline: "${outputs.baseline[0]}"  vs  Cand: "${outputs.candidate[0]}"`
          : 'Both models pass 3 of 4 checks: can we promote the smaller candidate?',
        0,
        215,
        {
          w: 1620,
          h: 74,
          color: reg > 0.4 ? ROLE.work : ROLE.gold,
          fill: reg > 0.4 ? '#321420' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
      txt(
        sv > 0.3
          ? 'Save prompts, template & artifact IDs'
          : 'A tied aggregate score can mask a dangerous regression on a protected command!',
        0,
        320,
        26,
        sv > 0.3 ? ROLE.vram : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pair-outputs', (d) => s.play(showAbstain.to(0, { duration: d })));
  playCue(s, c, 'ask-quality', (d) => s.play(showAbstain.to(0, { duration: d })));
  playCue(s, c, 'better-abstention', (d) => s.play(showAbstain.to(1, { duration: d })));
  // Strict prediction withholding: reveal missing --confirm & HOLD only after read-flag!
  playCue(s, c, 'read-flag', (d) => s.play(revealRegression.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'preserve-pair', (d) => s.play(showSave.to(1, { duration: d })));
}
