// Scene 12: Which passages are eligible now? (Filter {A,C,E} + Delete A -> reference shifts [A,B] -> [A,C] -> [C,E])
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

export default function transfer(s, c) {
  const phase = s.value(0);
  const showBase = s.value(0);
  const showFilter = s.value(0);
  const showDelete = s.value(0);
  const showFill = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Passages Are', 'Eligible Now?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'ELIGIBILITY & DELETIONS · RECOMPUTE EXACT REFERENCE WHEN SCOPE SHIFTS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sb = showBase.value;
    const sf = showFilter.value;
    const sd = showDelete.value;
    const sfl = showFill.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Stage 1: Unfiltered baseline
      glassCell(-560, 12, 540, 380, sb > 0.3 && sf < 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: sb > 0.3 && sf < 0.3 ? 8 : 2,
      }),
      txt('1. ALL 6 ELIGIBLE', -800, -138, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Eligible: A B C D E F', -800, -86, 26, COSMOS.ink, 'mono', 'left'),
      txt('Exact ref: [ A, B ]', -800, -34, 28, COSMOS.emerald, 'mono', 'left'),
      txt('Approx hit: [ A, C ]', -800, 18, 28, COSMOS.amber, 'mono', 'left'),
      txt('Recall@2 = 1 / 2', -800, 74, 26, COSMOS.rose, 'mono', 'left'),
      txt('Both HNSW & IVF missed B', -800, 134, 26, COSMOS.muted, 'sans', 'left'),

      // Stage 2: Access filter {A, C, E}
      glassCell(0, 12, 540, 380, sf > 0.3 && sd < 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sf > 0.3 ? '#0e2624' : '#12182b',
        glow: sf > 0.3 && sd < 0.3 ? 9 * pulse : 2,
      }),
      txt('2. ACCESS FILTER {A,C,E}', -240, -138, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Filter exact search too!', -240, -86, 26, COSMOS.ink, 'sans', 'left'),
      txt('Exact ref: [ A, C ]', -240, -34, 28, COSMOS.emerald, 'mono', 'left'),
      txt('Approx hit: [ A, C ]', -240, 18, 28, COSMOS.emerald, 'mono', 'left'),
      txt('Recall@2 = 2 / 2 (100%)', -240, 74, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Same result; new truth', -240, 134, 26, COSMOS.muted, 'sans', 'left'),

      // Stage 3: Delete A -> {C, E}
      glassCell(
        560,
        12,
        540,
        380,
        sd > 0.3 ? (sfl > 0.3 ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted,
        {
          fill: sfl > 0.3 ? '#0e2824' : sd > 0.3 ? '#26111a' : '#12182b',
          glow: sd > 0.3 ? 9 * pulse : 2,
        },
      ),
      txt(
        '3. DELETE A -> {C, E}',
        320,
        -138,
        26,
        sfl > 0.3 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt('Cross A off saved pair', 320, -86, 26, COSMOS.ink, 'sans', 'left'),
      txt('Exact ref: [ C, E ]', 320, -34, 28, COSMOS.gold, 'mono', 'left'),
      txt(
        sfl > 0.3 ? 'Fresh run: [ C, E ]' : 'Stale list: [ C, _ ]',
        320,
        18,
        28,
        sfl > 0.3 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
      txt('Propagate deletes to ALL', 320, 84, 26, COSMOS.amber, 'sans', 'left'),
      txt('replicas & old serving paths', 320, 124, 26, COSMOS.amber, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.amber }),
      txt(
        'Wider search budgets cannot fix stale deleted copies; propagate deletes across every replica',
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

  c.on('transfer-b1-1', () => s.play(showBase.to(1, { duration: 0.4 })));
  c.on('transfer-b2-1', () => s.play(showFilter.to(0.5, { duration: 0.35 })));
  c.on('transfer-filter-reference', () => s.play(showFilter.to(1, { duration: 0.4 })));
  c.on('transfer-delete-reference', () => s.play(showDelete.to(1, { duration: 0.4 })));
  c.on('transfer-b3-1', () =>
    s.play(showFill.to(1, { duration: remainDuration(c, 'transfer-b3-1', 0.45) })),
  );
}
