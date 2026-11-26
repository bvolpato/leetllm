// Scene 03: The two pieces of Speak & multi-byte UTF-8 boundaries.
import { delay, par } from 'vizmatic/stage';
import {
  BYTE_EMOJI,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  prompt,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function byteBoundaries(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showPieces = s.value(0);
  const focusNewline = s.value(0);

  const showPart2 = s.value(0);
  const showSeparate = s.value(0);
  const showJoined = s.value(0);

  const bgAura = aura(0, 0, 640, '#1d2f6626', '#3d226614');

  const part1 = guardedDynamic(showPart1, (a) => {
    const p = phase.value;
    const sp = showPieces.value;
    const fn = focusNewline.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const tileW = 228;
    const gap = 28;
    const stride = tileW + gap;
    const x0 = -640;
    const idY = -70;
    const pieceY = 140;

    const nodes = [
      heroTitle(['The Two Pieces', 'of "Speak"'], {
        x: -855,
        y: -415,
        size: 58,
        lineHeight: 68,
        accent: COSMOS.cyan,
        eyebrow: 'GPT-2 BYTE-LEVEL BPE · SUBWORD BOUNDARIES',
      }).opacity(a),
      txt('GPT-2 TOKEN IDs', -855, idY - 76, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('LITERAL SUBWORD PIECES', -855, pieceY + 78, 26, COSMOS.gold, 'mono', 'left').opacity(
        Math.max(0.25, sp) * a,
      ),
    ];

    prompt.forEach((tok, i) => {
      const cx = x0 + i * stride;
      const isSpeak = i >= 4;
      const isCommaNewline = fn > 0.3 && (i === 2 || i === 3);
      const idStroke = isCommaNewline ? COSMOS.gold : isSpeak ? COSMOS.violet : COSMOS.cyan;
      nodes.push(
        glassCell(cx, idY, tileW, 88, idStroke, {
          fill: isCommaNewline ? '#251d0e' : '#0f1c34',
          glow: isCommaNewline ? 9 * pulse : 5,
          opacity: a,
        }),
        txt(String(tok.original), cx, idY + 2, 36, idStroke, 'mono').opacity(a),
      );

      if (sp > 0.05) {
        const pieceStroke = isSpeak ? COSMOS.violet : isCommaNewline ? COSMOS.gold : COSMOS.emerald;
        nodes.push(
          glowingArc([cx, idY + 46], [cx, pieceY - 46], 0, {
            color: pieceStroke,
            width: 3,
            opacity: sp * a,
          }),
          glassCell(cx, pieceY, tileW, 88, pieceStroke, {
            fill: isSpeak ? '#1d1532' : '#0f2027',
            glow: isSpeak || isCommaNewline ? 8 : 4,
            opacity: sp * a,
          }),
          txt(tok.piece, cx, pieceY + 2, 36, COSMOS.ink, 'mono').opacity(sp * a),
        );
      }
    });

    if (sp > 0.4) {
      const speakLeft = x0 + 4 * stride - tileW * 0.5;
      const speakRight = x0 + 5 * stride + tileW * 0.5;
      nodes.push(
        glowingArc([speakLeft, pieceY + 64], [speakRight, pieceY + 64], 26, {
          color: COSMOS.violet,
          width: 3.4,
          opacity: sp * a,
        }),
        txt(
          '"Spe" + "ak" = "Speak"',
          (speakLeft + speakRight) * 0.5,
          pieceY + 122,
          28,
          COSMOS.violet,
          'mono',
        ).opacity(sp * a),
      );
    }

    if (fn > 0.1) {
      nodes.push(
        txt(
          'At "," (ID 11), next target is ↵ (ID 198) · "·" denotes a leading space',
          -855,
          355,
          28,
          COSMOS.gold,
          'sans',
          'left',
        )
          .glow(5, COSMOS.gold)
          .opacity(fn * a),
      );
    }

    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const p = phase.value;
    const sep = showSeparate.value;
    const jn = showJoined.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      heroTitle(['Multi-Byte UTF-8', 'Across Token Splits'], {
        x: -855,
        y: -415,
        size: 58,
        lineHeight: 68,
        accent: COSMOS.emerald,
        eyebrow: 'STREAMING DECODER · BYTE BUFFERING',
      }).opacity(a),

      // 4 raw UTF-8 bytes of U+1F642
      txt('4-BYTE UTF-8 CHARACTER (U+1F642)', -855, -172, 26, COSMOS.cyan, 'mono', 'left').opacity(
        a,
      ),
      glassCell(-660, -78, 340, 96, COSMOS.cyan, { fill: '#101d35', glow: 6, opacity: a }),
      txt('TOKEN A: F0 9F', -660, -76, 30, COSMOS.cyan, 'mono').opacity(a),
      glassCell(-260, -78, 340, 96, COSMOS.violet, { fill: '#191432', glow: 6, opacity: a }),
      txt('TOKEN B: 99 82', -260, -76, 30, COSMOS.violet, 'mono').opacity(a),

      // Pre-framed destination panes (visible luminance >= 40 from Beat 2 start)
      glassCell(-460, 178, 720, 118, sep > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sep > 0.3 ? '#261018' : '#12182b',
        glow: sep > 0.3 ? 8 * pulse : 3,
        opacity: Math.max(0.7, sep) * a,
      }),
      glassCell(460, 10, 620, 152, jn > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: jn > 0.3 ? '#0d2623' : '#12182b',
        glow: jn > 0.3 ? 10 * pulse : 3,
        opacity: Math.max(0.7, jn) * a,
      }),
      txt(
        'DECODE SEPARATELY (BROKEN)',
        -460,
        274,
        26,
        sep > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.75, sep) * a),
      txt(
        'BUFFER BYTES, THEN DECODE TOGETHER',
        460,
        -112,
        26,
        jn > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.75, jn) * a),
    ];

    if (sep <= 0.05) {
      nodes.push(
        txt('per-token UTF-8 decode ...', -460, 180, 28, COSMOS.muted, 'mono').opacity(0.7 * a),
      );
    }
    if (jn <= 0.05) {
      nodes.push(
        txt('buffered 4-byte UTF-8 join ...', 460, 12, 28, COSMOS.muted, 'mono').opacity(0.7 * a),
      );
    }

    if (sep > 0.05) {
      nodes.push(
        glowingArc([-660, -26], [-660, 114], 0, {
          color: COSMOS.rose,
          width: 3.2,
          opacity: sep * a,
        }),
        glowingArc([-260, -26], [-260, 114], 0, {
          color: COSMOS.rose,
          width: 3.2,
          opacity: sep * a,
        }),
        txt(
          `${BYTE_EMOJI.replacementCount} x U+FFFD replacement chars`,
          -460,
          180,
          30,
          COSMOS.rose,
          'mono',
        ).opacity(sep * a),
      );
    }

    if (jn > 0.05) {
      nodes.push(
        glowingArc([-84, -78], [142, 10], -56, {
          color: COSMOS.emerald,
          width: 3.6,
          opacity: jn * a,
        }),
        txt('F0  9F  99  82', 460, -22, 34, COSMOS.gold, 'mono').opacity(jn * a),
        txt(`->  smiling face  (${BYTE_EMOJI.unicode})`, 460, 36, 34, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(jn * a),
        glowDot(460, 140, { radius: 6, color: COSMOS.emerald, opacity: jn * a }),
        txt(
          'Explicit policy for invalid bytes: replace or reject',
          460,
          202,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(jn * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1, part2);
  runPhase(s, c, phase, 14);

  c.on('byte-boundaries-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('six-byte-pieces', () => s.play(showPieces.to(1, { duration: 0.55 })));
  c.on('newline-target', () => s.play(focusNewline.to(1, { duration: 0.5 })));

  c.on('byte-boundaries-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('separate-bytes', () =>
    s.play(showSeparate.to(1, { duration: remainDuration(c, 'separate-bytes', 0.5) })),
  );
  c.on('joined-bytes', () =>
    s.play(showJoined.to(1, { duration: remainDuration(c, 'joined-bytes', 0.6) })),
  );
}
