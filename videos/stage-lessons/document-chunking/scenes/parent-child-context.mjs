// Scene 10: Follow a hit back to its section (Parent-child retrieval: small index key -> verified parent)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  parentExpansion,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function parentChildContext(s, c) {
  const showChild = s.value(0);
  const showResolve = s.value(0);
  const showDedup = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Follow a Hit Back', 'to Its Section'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'PARENT-CHILD RETRIEVAL · SMALL SEARCH KEY -> PERMITTED PARENT CONTEXT',
  });

  const exp = parentExpansion();

  const live = guardedDynamic(s.value(1), () => {
    const sc = showChild.value;
    const sr = showResolve.value;
    const sd = showDedup.value;

    const nodes = [
      // Stage 1: Small precise child hit
      glassCell(-595, -52, 480, 224, sc > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231e10',
        glow: sc > 0.3 ? 9 : 3,
      }),
      txt('1. SMALL CHILD HIT', -595, -124, 26, COSMOS.gold, 'mono'),
      txt(`"${exp.child.text}"`, -595, -68, 30, COSMOS.ink, 'mono'),
      txt(`parent: ${exp.child.parentId}`, -595, -16, 26, COSMOS.cyan, 'mono'),
      txt(`version: ${exp.child.version}`, -595, 24, 26, COSMOS.muted, 'mono'),

      glowingArc([-345, -52], [-235, -52], -18, { color: COSMOS.cyan, width: 3.8 }),

      // Stage 2: Version + Permission check gate
      glassCell(-20, -52, 410, 224, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sr > 0.3 ? 9 : 3,
      }),
      txt('2. RESOLVE & CHECK', -20, -124, 26, COSMOS.cyan, 'mono'),
      txt('· Match parent ID', -20, -68, 26, COSMOS.ink, 'sans'),
      txt('· Match version v3', -20, -24, 26, COSMOS.ink, 'sans'),
      txt('· Check caller access', -20, 20, 26, COSMOS.emerald, 'sans'),

      glowingArc([195, -52], [295, -52], -18, { color: COSMOS.emerald, width: 3.8 }),

      // Stage 3: Returned Parent Section
      glassCell(580, -52, 550, 224, sr > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sr > 0.3 ? 10 : 3,
      }),
      txt('3. ADMITTED PARENT (PAGE 7)', 580, -124, 26, COSMOS.emerald, 'mono'),
      txt(
        sr > 0.3 ? 'Rollback failure: page on-call' : 'What must come back with the hit?',
        580,
        -68,
        26,
        sr > 0.3 ? COSMOS.ink : COSMOS.gold,
        'sans',
      ),
      txt(
        sr > 0.3 ? 'within 15 minutes with deploy ID.' : 'Resolve parent section...',
        580,
        -24,
        26,
        sr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),
      txt(`admitted: ${String(exp.admitted)}`, 580, 24, 26, COSMOS.cyan, 'mono'),

      // Bottom: Deduplication & Generator tokenizer rule
      glassCell(0, 194, 1660, 134, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: sd > 0.3 ? 8 : 2,
      }),
      txt('DEDUPLICATE & MEASURE GENERATOR PROMPT', -800, 160, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Two child hits -> 1 parent copy | Measure full packed prompt with generator tokenizer (text backs answer!)',
        -800,
        212,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Separate what is indexed (narrow child) from what is sent to the model (permitted parent)',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('parent-child-context-beat-1-focus-1', () => s.play(showChild.to(1, { duration: 0.45 })));
  c.on('parent-child-context-beat-2-focus-2', () => s.play(showResolve.to(1, { duration: 0.4 })));
  c.after('parent-child-context-beat-2-focus-1', () =>
    s.play(showResolve.to(1, { duration: 0.2 })),
  );
  c.on('parent-child-context-beat-3-focus-1', () =>
    s.play(
      showDedup.to(1, { duration: remainDuration(c, 'parent-child-context-beat-3-focus-1', 0.45) }),
    ),
  );
}
