// Scene 04: Put the incident in the model's format: Chat template serialization -> 8 positions -> serving headers.
import {
  COSMOS,
  TOKENS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  streamX,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function template(s, c) {
  const phase = s.value(0);
  const serialProg = s.value(0);
  const markBoundary = s.value(0);
  const servingMode = s.value(0);
  const partialMode = s.value(0);

  const bgAura = aura(0, 30, 620, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Chat Template', 'Serialization'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'ROLES → ONE INDEXED SEQUENCE',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sp = serialProg.value;
    const mb = markBoundary.value;
    const srv = servingMode.value;
    const part = partialMode.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [];

    if (srv < 0.5) {
      const a = 1 - srv * 2;
      // Top structured role messages converging into the 8-token stream
      const roles = [
        {
          tag: '<|system|>',
          body: 'Follow review policy',
          x: -570,
          col: COSMOS.blue,
          targetX: streamX(0.5),
        },
        {
          tag: '<|user|>',
          body: 'Key is 18 days old',
          x: 0,
          col: COSMOS.cyan,
          targetX: streamX(2.5),
        },
        {
          tag: '<|assistant|>',
          body: 'Open ticket + END',
          x: 570,
          col: COSMOS.emerald,
          targetX: streamX(5.5),
        },
      ];
      roles.forEach((r) => {
        nodes.push(
          glassCell(r.x, -170, 510, 118, r.col, { fill: '#10182b', glow: 7, opacity: a }),
          txt(r.tag, r.x, -200, 26, r.col, 'mono').opacity(a),
          txt(r.body, r.x, -146, 30, COSMOS.ink, 'sans').opacity(a),
        );
        if (sp > 0.1) {
          nodes.push(
            glowingArc([r.x, -106], [r.targetX, 42], 14, {
              color: r.col,
              width: 3,
              opacity: Math.min(1, sp * 1.4) * a * 0.78,
            }),
          );
        }
      });

      // Bottom 8-position indexed token stream
      const count = Math.max(0, Math.min(8, Math.ceil(sp * 8)));
      nodes.push(
        txt(
          'CHECKPOINT-FORMATTED TOKEN STREAM (POSITIONS 0–7)',
          -830,
          248,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(Math.max(0.25, sp) * a),
      );
      for (let i = 0; i < count; i++) {
        const isMark = mb > 0.5 && i === 4;
        const isReply = i >= 5;
        const col = isMark
          ? COSMOS.gold
          : isReply
            ? COSMOS.emerald
            : i >= 2
              ? COSMOS.cyan
              : COSMOS.blue;
        nodes.push(
          tokenPill(TOKENS[i], streamX(i), 152, {
            color: col,
            textColor: isMark ? COSMOS.gold : COSMOS.ink,
            glow: isMark ? 12 * pulse : 6,
            opacity: a,
            index: i,
            indexColor: isMark ? COSMOS.gold : COSMOS.muted,
          }),
        );
      }

      // Golden boundary beam between position 4 (ASSIST) and position 5 (open)
      if (mb > 0.05) {
        const wallX = (streamX(4) + streamX(5)) * 0.5;
        nodes.push(
          line([wallX, 76], [wallX, 214], { stroke: COSMOS.gold, width: 4 })
            .glow(10, COSMOS.gold)
            .opacity(mb * a),
          glowDot(wallX, 152, { radius: 8, color: COSMOS.gold, opacity: mb * a }),
          glassCell(0, 355, 1580, 96, COSMOS.gold, { fill: '#191612', glow: 8, opacity: mb * a }),
          txt(
            'pos 4 (ASSIST) → pos 5 (first reply token) · Save template + tokenizer together',
            0,
            355,
            27,
            COSMOS.gold,
            'mono',
          ).opacity(mb * a),
        );
      } else {
        nodes.push(
          txt(
            'apply_chat_template() serializes roles into one checkpoint-specific sequence',
            0,
            355,
            28,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }
    } else {
      // Beat 2: Serving modes (new reply generation prompt vs continuing partial assistant reply)
      const a = Math.min(1, (srv - 0.5) * 2);
      const isPartial = part > 0.5;
      const count = isPartial ? 6 : 5;
      const activeIdx = isPartial ? 5 : 4;

      nodes.push(
        txt(
          isPartial
            ? 'SERVING MODE · continue_final_message=True (PARTIAL ASSISTANT REPLY)'
            : 'SERVING MODE · add_generation_prompt=True (NEW ASSISTANT TURN)',
          -855,
          -180,
          28,
          isPartial ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'left',
        )
          .glow(6, isPartial ? COSMOS.emerald : COSMOS.gold)
          .opacity(a),
      );

      for (let i = 0; i < count; i++) {
        const isHot = i === activeIdx;
        const col = isHot ? COSMOS.gold : i >= 5 ? COSMOS.emerald : COSMOS.cyan;
        nodes.push(
          tokenPill(TOKENS[i], streamX(i), 0, {
            color: col,
            textColor: isHot ? COSMOS.gold : COSMOS.ink,
            glow: isHot ? 12 * pulse : 6,
            opacity: a,
            index: i,
            indexColor: isHot ? COSMOS.gold : COSMOS.muted,
          }),
        );
      }

      // Next generated token placeholder glowing to the right
      const nextX = streamX(count);
      nodes.push(
        tokenPill(isPartial ? 'ticket…' : 'open…', nextX, 0, {
          color: COSMOS.emerald,
          fill: '#0c2322',
          textColor: COSMOS.emerald,
          dash: [8, 6],
          glow: 10 * pulse,
          opacity: a,
          index: count,
          indexColor: COSMOS.emerald,
        }),
        glowingArc([streamX(activeIdx), -106], [nextX, -106], -48, {
          color: COSMOS.gold,
          width: 3.6,
          opacity: a,
        }),
        glassCell(0, 255, 1620, 128, isPartial ? COSMOS.emerald : COSMOS.gold, {
          fill: '#10182a',
          glow: 8,
          opacity: a,
        }),
        txt(
          isPartial
            ? 'Keep existing words ("open") · Do NOT append a second ASSIST header'
            : 'Append open ASSIST header so the model starts generating at position 5',
          0,
          230,
          30,
          isPartial ? COSMOS.emerald : COSMOS.gold,
          'sans',
        ).opacity(a),
        txt(
          'Tokenize formatted strings with add_special_tokens=False to avoid duplicate <BOS>',
          0,
          286,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('serialize', () => s.play(serialProg.to(1, { duration: 1.0 })));
  c.on('template-boundary', () => s.play(markBoundary.to(1, { duration: 0.5 })));
  c.on('new-turn', () => s.play(servingMode.to(1, { duration: 0.45 })));
  c.on('continue-partial', () =>
    s.play(partialMode.to(1, { duration: remainDuration(c, 'continue-partial', 0.5) })),
  );
}
