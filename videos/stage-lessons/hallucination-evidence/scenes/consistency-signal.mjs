// Scene 11: When should agreement change the route? (Disagreement > 0.25 rule vs 4 identical guesses!)
import {
  COSMOS,
  aura,
  disagreement,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function consistencySignal(s, c) {
  const phase = s.value(0);
  const showTally1 = s.value(0);
  const showThird = s.value(0);
  const showBoundary = s.value(0);
  const showFourEta = s.value(0);
  const showRepeat = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['When Should Agreement', 'Change the Route?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'CONSISTENCY POLICY · REVIEW IF DISAGREEMENT > 0.25 · EVIDENCE FIRST',
  });

  const d1 = disagreement(['investigating', 'investigating', 'mitigated', 'resolved']);
  const d2 = disagreement(['investigating', 'investigating', 'investigating', 'resolved']);
  const d3 = disagreement(['14:30 UTC', '14:30 UTC', '14:30 UTC', '14:30 UTC']);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const s1 = showTally1.value;
    const s3 = showThird.value;
    const sb = showBoundary.value;
    const s4 = showFourEta.value;
    const sr = showRepeat.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Row 1: Supported draft, 2/4 disagree -> 0.50 > 0.25 -> REVIEW
      glassCell(0, -124, 1680, 126, s1 > 0.4 ? COSMOS.amber : COSMOS.cyan, {
        fill: '#10182d',
        glow: s1 > 0.4 ? 8 : 3,
      }),
      txt('1. SUPPORTED DRAFT · [inv, inv, mit, res]', -810, -152, 26, COSMOS.cyan, 'mono', 'left'),
      meterBar(-810, -102, 420, 24, d1, COSMOS.amber),
      txt(`disagree = ${d1.toFixed(2)}  (> 0.25)`, -360, -100, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        s1 > 0.4 ? 'ROUTE: SEND TO REVIEW' : 'ROUTE: ?',
        810,
        -124,
        28,
        s1 > 0.4 ? COSMOS.amber : COSMOS.gold,
        'mono',
        'right',
      ),

      // Row 2: Supported draft, 1/4 disagree -> 0.25 == 0.25 (NOT > 0.25!) -> SERVE (withheld before sb!)
      glassCell(
        0,
        38,
        1680,
        126,
        sb > 0.4 ? COSMOS.emerald : s3 > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: sb > 0.4 ? '#0e2824' : '#12182b',
          glow: sb > 0.4 ? 9 * pulse : 2,
        },
      ),
      txt(
        '2. SUPPORTED DRAFT · [inv, inv, inv, res]',
        -810,
        10,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(-810, 60, 420, 24, d2, COSMOS.emerald),
      txt(`disagree = ${d2.toFixed(2)}  (== 0.25)`, -360, 62, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        sb > 0.4 ? 'ROUTE: SERVE (strict >)' : 'STILL REVIEW?  ?',
        810,
        38,
        28,
        sb > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'right',
      ),

      // Row 3: UNSUPPORTED ETA, 4/4 agree on 14:30 UTC -> 0.00 disagree, STILL SHORTENED! (withheld before sr!)
      glassCell(0, 200, 1680, 134, sr > 0.4 ? COSMOS.rose : s4 > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: sr > 0.4 ? '#29111a' : '#12182b',
        glow: sr > 0.4 ? 10 * pulse : 2,
      }),
      txt(
        '3. UNSUPPORTED ETA · [14:30, 14:30, 14:30, 14:30]',
        -810,
        170,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      meterBar(-810, 222, 420, 24, d3, COSMOS.cyan),
      txt(`disagree = ${d3.toFixed(2)}  (4/4 agree!)`, -360, 224, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        sr > 0.4 ? 'ROUTE: SHORTEN (NO RECORD!)' : 'CAN 4 VOTES POST IT?  ?',
        810,
        200,
        28,
        sr > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'right',
      ),

      glowDot(-840, 355, { radius: 6, color: sr > 0.4 ? COSMOS.rose : COSMOS.gold }),
      txt(
        sr > 0.4
          ? 'Four agreeing samples from one model are 4 repeated guesses, not a new runbook entry!'
          : 'Consensus checks stability AFTER evidence verification; unanimity never replaces a source',
        -812,
        357,
        28,
        sr > 0.4 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('first-votes', () => s.play(showTally1.to(0.3, { duration: 0.35 })));
  c.after('first-tally', () => s.play(showTally1.to(1, { duration: 0.45 })));
  c.on('third-vote', () => s.play(showThird.to(1, { duration: 0.4 })));
  c.after('boundary-tally', () => s.play(showBoundary.to(1, { duration: 0.45 })));
  c.on('four-estimates', () => s.play(showFourEta.to(1, { duration: 0.45 })));
  c.after('repeat-tally', () =>
    s.play(showRepeat.to(1, { duration: remainDuration(c, 'repeat-tally', 0.45) })),
  );
}
