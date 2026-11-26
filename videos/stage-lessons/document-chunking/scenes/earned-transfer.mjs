// Scene 17: Version five changes the page (Earned transfer: 18w vs 12w overlap waste, 12w parent repair, 11w abstain)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeChunkStrata3D,
  meterBar,
  remainDuration,
  revisedContext,
  runPhase,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const phase = s.value(0);
  const showHits = s.value(0);
  const showAns18 = s.value(0);
  const showCut12 = s.value(0);
  const showDrop = s.value(0);
  const showParent12 = s.value(0);
  const showCut11 = s.value(0);
  const showAbstain = s.value(0);
  const showRetry12 = s.value(0);

  const ctx18 = revisedContext(18);
  const ctx12 = revisedContext(12);
  const par12 = revisedContext(12, { parent: true });
  const par11 = revisedContext(11, { parent: true });

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Version Five', 'Changes the Page'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'EARNED TRANSFER · OVERLAP CHARGE VS PARENT EXPANSION & ABSTENTION',
  });

  const strata3d = makeChunkStrata3D(540, -15, phase, 'transfer');

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sh = showHits.value;
    const a18 = showAns18.value;
    const c12 = showCut12.value;
    const dr = showDrop.value;
    const p12 = showParent12.value;
    const c11 = showCut11.value;
    const ab = showAbstain.value;
    const r12 = showRetry12.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: 3-stage interactive budget workbench (strict prediction withholding via c.after)
      glassCell(-405, -138, 920, 134, a18 > 0.4 ? COSMOS.emerald : COSMOS.cyan, {
        fill: a18 > 0.4 ? '#0e2824' : '#101d35',
        glow: sh > 0.3 ? 8 : 3,
      }),
      txt(
        `1. BUDGET 18w: two 9w hits (${ctx18.used}w used, ${ctx18.repeated}w repeated)`,
        -835,
        -172,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        a18 > 0.4
          ? 'COMPLETE: rollback failure -> 20 min, deploy ID, service'
          : 'When should the engineer page, and what goes in?  ?',
        -835,
        -128,
        26,
        a18 > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
      meterBar(-835, -90, 840, 18, ctx18.used / 18, a18 > 0.4 ? COSMOS.emerald : COSMOS.cyan),

      glassCell(
        -405,
        36,
        920,
        154,
        p12 > 0.4 ? COSMOS.emerald : dr > 0.4 ? COSMOS.rose : COSMOS.amber,
        {
          fill: p12 > 0.4 ? '#0e2824' : dr > 0.4 ? '#28111a' : '#181e34',
          glow: c12 > 0.3 ? 9 * pulse : 3,
        },
      ),
      txt(
        p12 > 0.4
          ? `2. PARENT AT 12w: 1 copy = ${par12.used}/12w -> COMPLETE`
          : `2. BUDGET 12w: hit 1 takes ${ctx12.used}w, 3w left -> ${dr > 0.4 ? 'HIT 2 DROPPED' : '?'}`,
        -835,
        -6,
        26,
        p12 > 0.4 ? COSMOS.emerald : dr > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        p12 > 0.4
          ? 'Current v5 & permitted -> condition back beside deadline!'
          : dr > 0.4
            ? '6 shared words charged twice -> condition lost!'
            : 'Check if both 9-word hits still fit in 12 words',
        -835,
        40,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      meterBar(
        -835,
        82,
        840,
        18,
        p12 > 0.4 ? par12.used / 12 : ctx12.used / 12,
        p12 > 0.4 ? COSMOS.emerald : COSMOS.rose,
      ),

      glassCell(
        -405,
        214,
        920,
        146,
        r12 > 0.4 ? COSMOS.emerald : ab > 0.4 ? COSMOS.rose : COSMOS.gold,
        {
          fill: r12 > 0.4 ? '#0e2824' : ab > 0.4 ? '#28111a' : '#231c10',
          glow: c11 > 0.3 ? 10 * pulse : 3,
        },
      ),
      txt(
        r12 > 0.4
          ? '3. 11w vs 12w GATE: 11w ABSTAIN | 12w ANSWER & CITE'
          : ab > 0.4
            ? `3. BUDGET 11w (parent=12w, packed=${par11.used}w): ABSTAIN!`
            : '3. FINAL TICKET (11w vs 12w): Serve or Abstain?',
        -835,
        178,
        26,
        r12 > 0.4 ? COSMOS.emerald : ab > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        r12 > 0.4
          ? 'Test both budgets: hold back at 11w, cite whole rule at 12w'
          : ab > 0.4
            ? 'One word short; never silently serve a partial parent'
            : 'Host must return parent whole (only approved passage)',
        -835,
        226,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right 3D caption
      txt('3D PARENT-CHILD EXPANSION', 540, -252, 26, COSMOS.emerald, 'mono'),
      txt('12w whole parent beats 2x9w overlap', 540, 262, 26, COSMOS.gold, 'mono'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Keep every claim answerable: expand to current permitted parents, or abstain when short',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, strata3d.view, live);
  runPhase(s, c, phase, 14);
  strata3d.orbit(s, c);

  c.on('last-nine', () => s.play(showHits.to(0.5, { duration: 0.35 })));
  c.on('first-nine', () => s.play(showHits.to(1, { duration: 0.35 })));
  c.after('fresh-context-answer', () => s.play(showAns18.to(1, { duration: 0.4 })));
  c.on('fresh-budget-cut', () => s.play(showCut12.to(1, { duration: 0.35 })));
  c.after('fresh-insufficient-result', () => s.play(showDrop.to(0.7, { duration: 0.35 })));
  c.on('shared-six', () => s.play(showDrop.to(1, { duration: 0.35 })));
  c.on('fresh-parent-repair', () => s.play(showParent12.to(0.35, { duration: 0.35 })));
  c.after('fresh-parent-result', () => s.play(showParent12.to(1, { duration: 0.4 })));
  c.on('last-slot', () => s.play(showCut11.to(1, { duration: 0.35 })));
  c.after('abstain', () => s.play(showAbstain.to(1, { duration: 0.4 })));
  c.on('retry-with-twelve', () => s.play(showRetry12.to(0.35, { duration: 0.35 })));
  c.after('whole-rule-fits', () =>
    s.play(showRetry12.to(1, { duration: remainDuration(c, 'whole-rule-fits', 0.45) })),
  );
}
