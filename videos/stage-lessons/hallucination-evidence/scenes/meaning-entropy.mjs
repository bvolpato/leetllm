// Scene 10: How many different answers did the model give? (Semantic entropy & bidirectional entailment clustering)
import {
  COSMOS,
  MEANING_STATS,
  aura,
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

export default function meaningEntropy(s, c) {
  const phase = s.value(0);
  const showStatus = s.value(0);
  const showDisagree = s.value(0);
  const showTimeGroup = s.value(0);
  const showSpelling = s.value(0);
  const showMerge = s.value(0);
  const showConfab = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['How Many Different', 'Answers Were Given?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SEMANTIC ENTROPY · CLUSTER BY MEANING VIA BIDIRECTIONAL ENTAILMENT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showStatus.value;
    const sd = showDisagree.value;
    const st = showTimeGroup.value;
    const sp = showSpelling.value;
    const sm = showMerge.value;
    const sc = showConfab.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const merged = sm > 0.4 || (st > 0.4 && sp < 0.4);

    const nodes = [
      // Left: Status samples [investigating, investigating, mitigated, resolved]
      txt('4 STATUS SAMPLES (3 MEANING CLUSTERS)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -108, 760, 118, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: ss > 0.3 ? 8 : 3,
      }),
      txt('inv (2/4 = 0.50)   mit (1/4)   res (1/4)', -825, -134, 27, COSMOS.ink, 'mono', 'left'),
      txt('Each cluster contributes ~0.347 nats', -825, -88, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, 58, 760, 146, sd > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: sd > 0.3 ? 9 * pulse : 3,
      }),
      txt(
        `Semantic Entropy = ${MEANING_STATS.entropy.toFixed(2)} nats`,
        -825,
        22,
        30,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        `Disagreement = 2/4 = ${MEANING_STATS.disagreement.toFixed(2)} (outside top cluster)`,
        -825,
        68,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      meterBar(-825, 106, 680, 22, MEANING_STATS.disagreement, COSMOS.amber),

      glassCell(-465, 224, 760, 118, sc > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#10182d',
        glow: sc > 0.3 ? 7 : 2,
      }),
      txt(
        'CONFABULATION DETECTOR (FARQUHAR ET AL.)',
        -825,
        198,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Flags unstable answers that drift across samples',
        -825,
        240,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: 14:30 UTC vs 2:30 PM UTC (Strictly withheld before time-group!)
      txt(
        '4 TIME SAMPLES: 2x "14:30 UTC" & 2x "2:30 PM UTC"',
        110,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, -96, 750, 134, sp > 0.3 && sm < 0.4 ? COSMOS.rose : COSMOS.muted, {
        fill: sp > 0.3 && sm < 0.4 ? '#28111a' : '#12182b',
        glow: sp > 0.3 && sm < 0.4 ? 8 : 2,
      }),
      txt('BY SPELLING:  2 pairs (2/4 vs 2/4)', 150, -128, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        '14:30 UTC  <==>  2:30 PM UTC (bidirectional)',
        150,
        -82,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('Both entail each other in context!', 150, -46, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(495, 102, 750, 188, merged ? COSMOS.emerald : COSMOS.gold, {
        fill: merged ? '#0e2824' : '#181e34',
        glow: merged ? 10 * pulse : 4,
      }),
      txt(
        merged ? 'BY MEANING:  1 CLUSTER (4 / 4)' : 'HOW MANY DIFFERENT TIMES?  ?',
        150,
        44,
        28,
        merged ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        merged ? 'Observed Semantic Entropy = 0.00 nats' : 'Count distinct meanings, not spellings',
        150,
        96,
        26,
        merged ? COSMOS.ink : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        merged
          ? 'All 4 samples express the exact same clock time'
          : 'Check two-way entailment before splitting',
        150,
        142,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: merged ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sc > 0.3
          ? 'Prob-weighted clusters; a 5th run can still vary'
          : 'Group phrasings by bidirectional entailment before entropy',
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

  c.on('meaning-entropy-b1', () => s.play(showStatus.to(0.4, { duration: 0.35 })));
  c.on('meaning-masses', () => s.play(showStatus.to(0.7, { duration: 0.35 })));
  c.on('meaning-terms', () => s.play(showStatus.to(1, { duration: 0.35 })));
  c.on('meaning-sum', () => s.play(showDisagree.to(0.5, { duration: 0.35 })));
  c.on('meaning-disagreement-result', () => s.play(showDisagree.to(1, { duration: 0.4 })));
  c.after('time-group', () => s.play(showTimeGroup.to(0.6, { duration: 0.4 })));
  c.after('meaning-entropy-b2', () => s.play(showTimeGroup.to(1, { duration: 0.4 })));
  c.on('spelling-groups', () => s.play(showSpelling.to(0.5, { duration: 0.35 })));
  c.on('forward-time', () => s.play(showSpelling.to(0.8, { duration: 0.35 })));
  c.on('reverse-time', () => s.play(showSpelling.to(1, { duration: 0.35 })));
  c.on('merge-pairs', () => s.play(showMerge.to(1, { duration: 0.45 })));
  c.on('meaning-entropy-b3', () =>
    s.play(showConfab.to(1, { duration: remainDuration(c, 'meaning-entropy-b3', 0.45) })),
  );
}
