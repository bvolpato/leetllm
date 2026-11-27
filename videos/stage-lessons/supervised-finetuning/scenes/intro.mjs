// Scene 03: What belongs in the demonstration?: Reply decomposes into open, ticket, and withheld ? -> END.
import {
  COSMOS,
  TOKENS,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const spread = s.value(0);
  const showEnd = s.value(0);

  const bgAura = aura(0, 40, 620, '#6ee7b722', '#ffd16614');
  const title = heroTitle(['What Belongs in', 'the Demonstration?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'T102 · TARGET TOKENIZATION',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sp = spread.value;
    const endRev = showEnd.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [
      txt('APPROVED POLICY REPLY', 0, -230, 26, COSMOS.muted, 'mono'),
      glassCell(0, -140, 1520, 118, COSMOS.cyan, { fill: '#0e192b', glow: 8 }),
      txt('“Open a rotation ticket for security review.”', 0, -140, 46, COSMOS.ink, 'serif').glow(
        5,
        COSMOS.cyan,
      ),
    ];

    const slotX = [-480, 0, 480];
    const slotY = 125;
    const symbols = [TOKENS[5], TOKENS[6], endRev > 0.5 ? TOKENS[7] : '?'];

    // Glowing arcs from sentence to target capsules
    symbols.forEach((sym, i) => {
      const vis = Math.max(0, Math.min(1, sp * 3 - i * 0.7));
      if (vis < 0.02) return;
      const isStop = i === 2;
      const col = isStop ? COSMOS.gold : COSMOS.emerald;
      nodes.push(
        glowingArc([slotX[i] * 0.4, -76], [slotX[i], slotY - 70], -18, {
          color: col,
          width: 3.6,
          opacity: vis * 0.88,
        }),
        glassCell(slotX[i], slotY, 370, 134, col, {
          fill: isStop ? (endRev > 0.5 ? '#241e10' : '#181622') : '#0c2424',
          dash: isStop && endRev < 0.5 ? [10, 6] : undefined,
          glow: (isStop ? 11 : 8) * pulse,
          width: 2.8,
          opacity: vis,
        }),
        txt(sym, slotX[i], slotY, isStop && endRev < 0.5 ? 58 : 48, col, 'mono')
          .glow(7, col)
          .opacity(vis),
        txt(
          isStop
            ? endRev > 0.5
              ? '<|eot|> TURN BOUNDARY'
              : 'NEXT TARGET?'
            : `REPLY SYMBOL ${i + 1}`,
          slotX[i],
          slotY + 100,
          26,
          isStop ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(vis),
      );
    });

    // Bracket grouping reply text vs turn ending cleanly below capsules (zero arc collision)
    if (sp > 0.5) {
      const ba = Math.min(1, (sp - 0.5) * 2);
      nodes.push(
        line([-660, 268], [180, 268], { stroke: COSMOS.emerald, width: 3 }).opacity(ba),
        txt('REPLY CONTENT', -240, 306, 26, COSMOS.emerald, 'mono').opacity(ba),
      );
    }
    if (endRev > 0.5) {
      nodes.push(
        line([295, 268], [665, 268], { stroke: COSMOS.gold, width: 3 }).opacity(endRev),
        txt('STOP SIGNAL', 480, 306, 26, COSMOS.gold, 'mono').opacity(endRev),
        txt(
          'Explicit END target teaches the model when to stop generating',
          0,
          404,
          30,
          COSMOS.gold,
          'sans',
        ).opacity(endRev),
      );
    } else if (sp > 0.7) {
      nodes.push(
        txt(
          'What must the model predict right after "ticket"?',
          0,
          404,
          30,
          COSMOS.gold,
          'sans',
        ).opacity(Math.min(1, (sp - 0.7) * 3)),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('reply-pieces', () => s.play(spread.to(1, { duration: 0.9 })));
  c.after('demo-end', () =>
    s.play(showEnd.to(1, { duration: remainDuration(c, 'demo-end', 0.45) })),
  );
}
