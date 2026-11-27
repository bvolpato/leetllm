// Scene 3: A link arrives without a type (Strict prediction withholding: HOLD ambiguous link -> supply type Book + reviewed alias -> join book:river)
import {
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

export default function resolveIdentity(s, c) {
  const showHold = s.value(0);
  const showTyped = s.value(0);
  const showJoin = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['A Link Arrives', 'Without a Type'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'ENTITY RESOLUTION · HOLD AMBIGUOUS LINKS · REVIEWED ALIAS TABLE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sh = showHold.value;
    const st = showTyped.value;
    const sj = showJoin.value;

    const nodes = [
      // Left: Incoming link with blank type -> Hold decision (strict c.after withholding!)
      txt('1. UNTYPED IMPORTED ENDPOINT', -855, -205, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(-465, -94, 780, 158, sh > 0.4 && st < 0.3 ? COSMOS.rose : COSMOS.amber, {
        fill: '#231c10',
        glow: 6,
      }),
      txt(
        'Incoming name: "River Walk"  |  type: <blank>',
        -825,
        -136,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Matches TWO records: book:river AND place:river',
        -825,
        -90,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sh > 0.4
          ? 'ACTION: HOLD LINK (either choice is a guess!)'
          : 'Where can you store this link now? ?',
        -825,
        -48,
        26,
        sh > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-465, 114, 780, 186, st > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: st > 0.3 ? 8 : 2,
      }),
      txt('2. REVIEWED CORRECTION + ALIAS TABLE', -825, 56, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Cataloguer checks original -> full edition + type: Book',
        -825,
        104,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Reviewed alias maps edition -> book:river',
        -825,
        148,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Service catalogues also check tenant + env + ID',
        -825,
        186,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Two distinct canonical records (Book joined, Park kept separate!)
      txt('3. CANONICAL ENTITY REGISTRY', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(495, -94, 750, 146, sj > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sj > 0.3 ? '#0e2824' : '#12182b',
        glow: sj > 0.3 ? 10 : 2,
      }),
      txt('book:river  (type: Book)', 145, -132, 28, COSMOS.emerald, 'mono', 'left'),
      txt(
        sj > 0.3
          ? 'JOINED: incoming link attached safely'
          : 'Waiting for type + alias confirmation',
        145,
        -84,
        26,
        sj > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 114, 750, 186, COSMOS.violet, { fill: '#181430', glow: 4 }),
      txt('place:river  (type: Park)', 145, 56, 28, COSMOS.violet, 'mono', 'left'),
      txt('KEEPS ITS OWN SEPARATE ID (no false merge!)', 145, 104, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'If descriptions disagree, keep both dates & sources',
        145,
        152,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: sj > 0.3 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        'Never guess across ambiguous names; hold untyped links until type, scope, and alias resolve them',
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

  c.on('resolve-identity-ambiguous', () => s.play(showHold.to(0.15, { duration: 0.3 })));
  c.after('resolve-identity-hold', () => s.play(showHold.to(1, { duration: 0.4 })));
  c.on('resolve-identity-typed', () => s.play(showTyped.to(1, { duration: 0.4 })));
  c.on('resolve-identity-join', () =>
    s.play(showJoin.to(1, { duration: remainDuration(c, 'resolve-identity-join', 0.45) })),
  );
}
