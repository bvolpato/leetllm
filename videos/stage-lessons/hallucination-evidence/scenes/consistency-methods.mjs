// Scene 12: What did the checker compare? (FActScore / Ragas extraction gaps, SelfCheckGPT NLI, NLI premise judge)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function consistencyMethods(s, c) {
  const phase = s.value(0);
  const showService = s.value(0);
  const showBoth = s.value(0);
  const showSelfCheck = s.value(0);
  const showNli = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Did the', 'Checker Compare?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'VERIFICATION METHODS · FACTSCORE / RAGAS · SELFCHECKGPT · NLI PREMISE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showService.value;
    const sb = showBoth.value;
    const sc = showSelfCheck.value;
    const sn = showNli.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left top: Extractor coverage gap (1/1 vs 1/2!)
      txt(
        '1. ATOMIC EXTRACTOR AUDIT (FACTSCORE / RAGAS)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      glassCell(-455, -90, 810, 152, sb > 0.4 ? COSMOS.amber : COSMOS.cyan, {
        fill: '#10203a',
        glow: sb > 0.4 ? 9 * pulse : 3,
      }),
      txt(
        'Only service extracted:   1 / 1 supported (100%?)',
        -830,
        -132,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        sb > 0.4
          ? 'Extract ETA too:          1 / 2 supported (50%!)'
          : 'What claim did the extractor miss?  ?',
        -830,
        -86,
        26,
        sb > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'FActScore: knowledge source | Ragas: retrieved context',
        -830,
        -44,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Left bottom: SelfCheckGPT NLI ratio c / (e + c)
      txt(
        '2. SELFCHECKGPT (SAMPLED PASSAGES, NO SOURCE)',
        -855,
        24,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      glassCell(-455, 160, 830, 198, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sc > 0.3 ? 9 * pulse : 2,
      }),
      txt('score = contra / (entail + contra)', -840, 102, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Neutral left out -> passage scores: 0.20 and 0.25',
        -830,
        148,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Mean SelfCheck score = 0.225  (depends on samples)',
        -830,
        192,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Catches self-contradiction, NOT shared blind spots',
        -830,
        232,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Premise-to-Claim NLI judge (Runbook as premise)
      txt('3. RUNBOOK AS NLI PREMISE', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),
      glassCell(495, -96, 750, 118, sn > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sn > 0.3 ? 8 * pulse : 2,
      }),
      txt(
        'Premise: "investigating" | Claim: "resolved"',
        145,
        -122,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt('Expected NLI label: CONTRADICTION', 145, -76, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(495, 48, 750, 118, sn > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: 2,
      }),
      txt('Matching status -> ENTAILMENT', 145, 24, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Missing ETA field -> NEUTRAL (open)', 145, 70, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(495, 198, 750, 134, COSMOS.cyan, { fill: '#10182d', glow: 2 }),
      txt('STRESS-TEST YOUR NLI JUDGE', 145, 166, 26, COSMOS.cyan, 'mono', 'left'),
      txt('· Flip date, service name, or negation', 145, 206, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· Watch window splits cutting qualifiers off!',
        145,
        240,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Inspect both which claims the extractor kept and how the judge scored them',
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

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('extract-service', () => s.play(showService.to(0.5, { duration: 0.35 })));
  c.on('score-service', () => s.play(showService.to(1, { duration: 0.35 })));
  c.after('extract-estimate', () => s.play(showBoth.to(0.5, { duration: 0.35 })));
  c.on('score-both', () => s.play(showBoth.to(0.75, { duration: 0.35 })));
  c.on('knowledge-source', () => s.play(showBoth.to(0.9, { duration: 0.3 })));
  c.on('retrieved-context', () => s.play(showBoth.to(1, { duration: 0.35 })));
  c.on('consistency-methods-b2', () => s.play(showSelfCheck.to(0.4, { duration: 0.35 })));
  c.on('selfcheck-normalize', () => s.play(showSelfCheck.to(0.75, { duration: 0.35 })));
  c.on('selfcheck-mean', () => s.play(showSelfCheck.to(1, { duration: 0.35 })));
  c.on('consistency-methods-b3', () => s.play(showNli.to(0.4, { duration: 0.35 })));
  c.on('match-status', () => s.play(showNli.to(0.75, { duration: 0.35 })));
  c.on('neutral-estimate', () =>
    s.play(showNli.to(1, { duration: remainDuration(c, 'neutral-estimate', 0.45) })),
  );
}
