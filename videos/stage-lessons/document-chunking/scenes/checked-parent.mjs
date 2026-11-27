// Scene 11: Can the host return this parent? (Dedup 14w in 20w, stale v2, denied auth, 10w overflow)
import {
  COSMOS,
  aura,
  checkedParents,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function checkedParent(s, c) {
  const modeVal = s.value(0); // 0=ok(20w), 1=stale(v2), 2=denied, 3=small(10w), 4=restored

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Can the Host Return', 'This Parent?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'PARENT EXPANSION GUARDS · DEDUP · VERSION · ACCESS · BUDGET',
  });

  const cases = [
    {
      label: '1. DEDUP (v3, allowed, 20w)',
      res: checkedParents({ version: 3, allowed: true, budget: 20 }),
      col: COSMOS.emerald,
    },
    {
      label: '2. STALE CHILD (v2 != v3)',
      res: checkedParents({ version: 2, allowed: true, budget: 20 }),
      col: COSMOS.rose,
    },
    {
      label: '3. ACCESS REVOKED (allowed=false)',
      res: checkedParents({ version: 3, allowed: false, budget: 20 }),
      col: COSMOS.rose,
    },
    {
      label: '4. BUDGET TOO SMALL (14w > 10w)',
      res: checkedParents({ version: 3, allowed: true, budget: 10 }),
      col: COSMOS.amber,
    },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const m = Math.round(modeVal.value);

    const nodes = [
      txt(
        'FOUR HOST EXPANSION CHECKS ON 14-WORD PARENT',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    cases.forEach((item, i) => {
      const y = -112 + i * 114;
      const active = (m === 4 && i === 0) || m === i;
      const col = active ? item.col : COSMOS.muted;
      nodes.push(
        glassCell(0, y, 1680, 92, col, {
          fill: active ? (item.col === COSMOS.emerald ? '#0e2824' : '#28111a') : '#101629',
          glow: active ? 10 : 2,
        }),
        txt(item.label, -815, y - 14, 26, active ? item.col : COSMOS.ink, 'mono', 'left'),
        txt(
          `${item.res.copies} copy · ${item.res.words} words`,
          -815,
          y + 20,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        txt(item.res.status, 815, y + 2, 26, item.col, 'mono', 'right'),
      );
    });

    nodes.push(
      glowDot(-840, 355, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Check current permissions on BOTH child & parent, keep versions on links, and tokenize final prompt',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('checked-parent-0', () => s.play(modeVal.to(0, { duration: 0.35 })));
  c.on('parent-dedup', () => s.play(modeVal.to(0, { duration: 0.35 })));
  c.on('checked-parent-1', () => s.play(modeVal.to(1, { duration: 0.35 })));
  c.on('parent-stale', () => s.play(modeVal.to(1, { duration: 0.35 })));
  c.on('parent-denied', () => s.play(modeVal.to(2, { duration: 0.35 })));
  c.on('parent-small', () => s.play(modeVal.to(3, { duration: 0.35 })));
  c.on('checked-parent-2', () =>
    s.play(modeVal.to(4, { duration: remainDuration(c, 'checked-parent-2', 0.4) })),
  );
}
