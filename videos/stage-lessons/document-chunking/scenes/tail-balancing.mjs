// Scene 6: Repair a short tail under the same hard cap (7+7+1 -> 5+5+5, impossible min=6, 1/(1-0.2)=1.25x)
import {
  BALANCED_5,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tailBalancing(s, c) {
  const showGreedy = s.value(0);
  const showMerge = s.value(0);
  const showBalance = s.value(0);
  const showImpossible = s.value(0);
  const showAsym = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1a5216');
  const title = heroTitle(['Repair a Short Tail', 'Under the Hard Cap'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: '15-WORD SECTION · HARD CAP = 7 · REBALANCING vs FEASIBILITY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sg = showGreedy.value;
    const sm = showMerge.value;
    const sb = showBalance.value;
    const si = showImpossible.value;
    const sa = showAsym.value;

    const nodes = [
      // Left: 3 layouts for 15 words under cap = 7
      txt(
        'SPLITTING 15 WORDS (HARD CAP = 7, MIN = 4)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-455, -110, 810, 114, sg > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: sg > 0.3 ? 7 : 2,
      }),
      txt('GREEDY:   [ 7 ]  [ 7 ]  [ 1 ]', -825, -134, 28, COSMOS.amber, 'mono', 'left'),
      txt('1-word orphan tail breaks min = 4', -825, -88, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(-455, 36, 810, 114, sm > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#28111a',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt('NAIVE MERGE: [ 7 ]  [ 8 ]  (OVER CAP!)', -825, 12, 28, COSMOS.rose, 'mono', 'left'),
      txt('8 words violates hard cap = 7', -825, 58, 26, COSMOS.rose, 'sans', 'left'),

      glassCell(-455, 186, 810, 134, sb > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sb > 0.3 ? '#0e2824' : '#12182b',
        glow: sb > 0.3 ? 9 : 2,
      }),
      txt(
        `REBALANCED: [ ${BALANCED_5.map((ch) => ch.length).join(' ]  [ ')} ]  (ALL FIT!)`,
        -825,
        152,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        `Spans: [${BALANCED_5[0].start},${BALANCED_5[0].end}) [${BALANCED_5[1].start},${BALANCED_5[1].end}) [${BALANCED_5[2].start},${BALANCED_5[2].end})`,
        -825,
        194,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Balanced size != complete evidence (still needs ID!)',
        -825,
        232,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Right: Feasibility limit (min=6 impossible!) + 20% overlap asymptotic 1/0.8 = 1.25x
      txt('FEASIBILITY & ASYMPTOTIC OVERLAP', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -72, 760, 188, si > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: si > 0.3 ? '#29111a' : '#12182b',
        glow: si > 0.3 ? 9 : 2,
      }),
      txt('RAISE MIN TO 6 (STILL 15 WORDS, CAP 7)', 145, -132, 26, COSMOS.rose, 'mono', 'left'),
      txt('2 children x 7 max = 14 < 15  (need >= 3)', 145, -84, 26, COSMOS.ink, 'mono', 'left'),
      txt('3 children x 6 min = 18 > 15  (IMPOSSIBLE!)', 145, -42, 26, COSMOS.rose, 'mono', 'left'),
      txt('Keep hard cap; flag short child for review', 145, 2, 26, COSMOS.amber, 'sans', 'left'),

      glassCell(495, 160, 760, 198, sa > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sa > 0.3 ? 9 : 2,
      }),
      txt('STOP AT DOCUMENT END + 20% OVERLAP', 145, 96, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Stop once a window hits the end (no dup tail)',
        145,
        140,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('Long doc, 20% overlap -> step 0.8w -> 1.25x', 145, 184, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Short 17w page: count directly (17 / 21 / 33)',
        145,
        224,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Rebalancing fixes orphan sizes without exceeding the cap, but never replaces semantic completeness',
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

  c.on('tail-balancing-0', () => s.play(showGreedy.to(1, { duration: 0.4 })));
  c.on('tail-merge', () => s.play(showMerge.to(1, { duration: 0.4 })));
  c.on('tail-balance', () => s.play(showBalance.to(0.6, { duration: 0.4 })));
  c.on('balance-not-evidence', () => s.play(showBalance.to(1, { duration: 0.4 })));
  c.on('tail-balancing-1', () => s.play(showImpossible.to(0.5, { duration: 0.35 })));
  c.on('tail-impossible', () => s.play(showImpossible.to(1, { duration: 0.4 })));
  c.on('tail-balancing-2', () => s.play(showAsym.to(0.5, { duration: 0.35 })));
  c.on('overlap-asymptotic', () =>
    s.play(showAsym.to(1, { duration: remainDuration(c, 'overlap-asymptotic', 0.45) })),
  );
}
