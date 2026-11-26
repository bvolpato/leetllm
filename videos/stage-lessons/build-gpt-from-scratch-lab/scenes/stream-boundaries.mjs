// Scene 07: Did these tokens meet in the source? (Contiguous split & sampler last-start bounds)
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  SAMPLER_20,
  SAMPLER_49,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function streamBoundaries(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showFalseJoin = s.value(0);
  const showContiguous = s.value(0);

  const showPart2 = s.value(0);
  const slideToLast = s.value(0);

  const showPart3 = s.value(0);
  const showLastTarget = s.value(0);
  const dropLastToken = s.value(0);

  const bgAura = aura(0, 20, 620, '#19326824', '#381e5614');

  const part1 = guardedDynamic(showPart1, (a) => {
    const fj = showFalseJoin.value;
    const cg = showContiguous.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      heroTitle(['Did These Tokens', 'Meet in the Source?'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: 'STREAM BOUNDARIES · PRESERVING NEIGHBORS',
      }).opacity(a),
      txt(
        'ORIGINAL SOURCE POSITIONS (0 .. 11)',
        -830,
        -188,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    const tileW = 114;
    const gap = 14;
    const x0 = -770;
    const topY = -105;
    for (let i = 0; i < 12; i++) {
      const cx = x0 + i * (tileW + gap);
      const isChunkA = i <= 3;
      const isChunkB = i >= 8;
      const isTrueNext = i === 4;
      const stroke =
        isChunkA || isChunkB ? COSMOS.cyan : isTrueNext && fj > 0.3 ? COSMOS.emerald : COSMOS.dim;
      nodes.push(
        glassCell(cx, topY, tileW, 74, stroke, {
          fill: isChunkA || isChunkB ? '#112540' : '#0f1320',
          glow: isTrueNext && fj > 0.3 ? 8 * pulse : 3,
          opacity: a,
        }),
        txt(String(i), cx, topY + 2, 32, stroke, 'mono').opacity(a),
      );
    }

    if (cg < 0.4) {
      const stY = 128;
      const stitched = [0, 1, 2, 3, 8, 9, 10, 11];
      const sx0 = -520;
      const stAlpha = Math.max(0.45, fj) * Math.max(0, 1 - cg * 2.5) * a;
      nodes.push(
        txt(
          fj > 0.3 ? 'STITCHED NON-ADJACENT CHUNKS' : 'TWO SEPARATE CHUNKS: [0..3] AND [8..11]',
          -830,
          stY - 76,
          26,
          fj > 0.3 ? COSMOS.rose : COSMOS.cyan,
          'mono',
          'left',
        ).opacity(stAlpha),
      );
      stitched.forEach((id, idx) => {
        const cx = sx0 + idx * (tileW + gap);
        const isFault = fj > 0.3 && (idx === 3 || idx === 4);
        nodes.push(
          glassCell(cx, stY, tileW, 78, isFault ? COSMOS.rose : COSMOS.cyan, {
            fill: isFault ? '#291119' : '#10223a',
            glow: isFault ? 10 * pulse : 4,
            opacity: stAlpha,
          }),
          txt(String(id), cx, stY + 2, 34, isFault ? COSMOS.rose : COSMOS.ink, 'mono').opacity(
            stAlpha,
          ),
        );
      });
      if (fj > 0.25) {
        const x3 = sx0 + 3 * (tileW + gap);
        const x8 = sx0 + 4 * (tileW + gap);
        nodes.push(
          glowingArc([x3, stY - 46], [x8, stY - 46], -52, {
            color: COSMOS.rose,
            width: 4,
            opacity: fj * Math.max(0, 1 - cg * 2.5) * a,
          }),
          txt(
            'FALSE PAIR: 3 -> 8 (true neighbor was 4!)',
            (x3 + x8) * 0.5,
            stY + 95,
            30,
            COSMOS.rose,
            'mono',
          )
            .glow(6, COSMOS.rose)
            .opacity(fj * Math.max(0, 1 - cg * 2.5) * a),
        );
      }
    }

    if (cg > 0.6) {
      const spY = 148;
      const cgAlpha = Math.min(1, (cg - 0.6) / 0.4) * a;
      nodes.push(
        txt(
          'CONTIGUOUS PREFIX / SUFFIX SPLIT',
          -830,
          spY - 82,
          26,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(cgAlpha),
        rect(1120, 74, { fill: '#10293d', stroke: COSMOS.cyan, width: 2.4, radius: 10 })
          .at(-270, spY)
          .glow(6, COSMOS.cyan)
          .opacity(cgAlpha),
        txt(
          'TRAIN PREFIX (0 .. N_train - 1) · authentic neighbors',
          -270,
          spY + 2,
          28,
          COSMOS.cyan,
          'mono',
        ).opacity(cgAlpha),
        rect(420, 74, { fill: '#2c220f', stroke: COSMOS.gold, width: 2.4, radius: 10 })
          .at(560, spY)
          .glow(6, COSMOS.gold)
          .opacity(cgAlpha),
        txt('VAL SUFFIX', 560, spY + 2, 28, COSMOS.gold, 'mono').opacity(cgAlpha),
        txt(
          'Omit the transition across the cut · block cross-document attention for multi-doc packing',
          0,
          292,
          28,
          COSMOS.emerald,
          'sans',
        ).opacity(cgAlpha),
      );
    }

    return group(...nodes);
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const sl = slideToLast.value;
    const startPos = Math.round(sl * SAMPLER_20.lastStart);
    const totalN = 20;
    const cellW = 72;
    const gap = 8;
    const x0 = -760;
    const rowY = 40;

    const nodes = [
      heroTitle(['Last Legal Start', 'in a 20-Token Stream'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'WINDOW SAMPLER · CONTEXT T = 4 NEEDS 5 TOKENS',
      }).opacity(a),
      txt(
        'EXCLUSIVE UPPER BOUND = SOURCE LENGTH - CONTEXT = 20 - 4 = 16',
        -830,
        -172,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let i = 0; i < totalN; i++) {
      const cx = x0 + i * (cellW + gap);
      const inInput = i >= startPos && i < startPos + 4;
      const isLastTarget = i === startPos + 4;
      const stroke = inInput ? COSMOS.cyan : isLastTarget ? COSMOS.gold : COSMOS.dim;
      nodes.push(
        glassCell(cx, rowY, cellW, 78, stroke, {
          fill: inInput ? '#122c46' : isLastTarget ? '#2c220f' : '#0f1322',
          glow: inInput || isLastTarget ? 7 : 0,
          opacity: a,
        }),
        txt(String(i), cx, rowY + 2, 28, stroke, 'mono').opacity(a),
      );
    }

    const xInLeft = x0 + startPos * (cellW + gap) - cellW * 0.5;
    const xInRight = x0 + (startPos + 3) * (cellW + gap) + cellW * 0.5;
    const xTgt = x0 + (startPos + 4) * (cellW + gap);

    nodes.push(
      txt(
        `Inputs x = [${startPos}..${startPos + 3}]`,
        (xInLeft + xInRight) * 0.5,
        rowY - 82,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      txt(`Last label y_3 = ${startPos + 4}`, xTgt, rowY + 96, 28, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(a),
    );

    if (sl > 0.7) {
      nodes.push(
        txt(
          'start = 15 works (targets 16..19) · start = 16 runs out of labels!',
          0,
          268,
          32,
          COSMOS.emerald,
          'mono',
        )
          .glow(6, COSMOS.emerald)
          .opacity(((sl - 0.7) / 0.3) * a),
      );
    }

    return group(...nodes);
  });

  const part3 = guardedDynamic(showPart3, (a) => {
    const lt = showLastTarget.value;
    const dr = dropLastToken.value;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 4.0);

    const nodes = [
      heroTitle(['Edge Case:', '49 vs 48 Tokens'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: dr > 0.5 ? COSMOS.rose : COSMOS.emerald,
        eyebrow: 'LAB CONTEXT T = 48 · FINAL SUCCESSOR CHECK',
      }).opacity(a),
      txt(
        dr > 0.5
          ? 'STREAM LENGTH = 48  (REJECTED: NO TARGET FOR INDEX 47)'
          : 'STREAM LENGTH = 49  (EXACTLY 1 LEGAL START: start = 0)',
        -830,
        -165,
        28,
        dr > 0.5 ? COSMOS.rose : COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),

      // Input ribbon 0 .. 47
      rect(1200, 96, { fill: '#112944', stroke: COSMOS.cyan, width: 2.6, radius: 12 })
        .at(-230, 10)
        .glow(7, COSMOS.cyan)
        .opacity(a),
      txt(
        `INPUTS  x = [ 0, 1, 2, ... , ${SAMPLER_49.input.at(-1)} ]  (48 tokens)`,
        -230,
        12,
        32,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];

    if (lt > 0.05) {
      const missing = dr > 0.5;
      nodes.push(
        glassCell(560, 10, 260, 96, missing ? COSMOS.rose : COSMOS.gold, {
          fill: missing ? '#291018' : '#2b220f',
          dash: missing ? [9, 6] : undefined,
          glow: 9 * pulse,
          opacity: lt * a,
        }),
        txt(
          missing ? 'MISSING!' : `TOKEN ${SAMPLER_49.target.at(-1)}`,
          560,
          12,
          34,
          missing ? COSMOS.rose : COSMOS.gold,
          'mono',
        ).opacity(lt * a),
        glowingArc([372, -40], [428, -40], -38, {
          color: missing ? COSMOS.rose : COSMOS.gold,
          width: 3.6,
          opacity: lt * a,
        }),
        glowDot(560, 130, {
          radius: 6,
          color: missing ? COSMOS.rose : COSMOS.emerald,
          opacity: lt * a,
        }),
        txt(
          missing ? '48 <= 48 -> REJECT STREAM!' : '47 -> 48 (final label)',
          0,
          220,
          32,
          missing ? COSMOS.rose : COSMOS.emerald,
          'mono',
        )
          .glow(6, missing ? COSMOS.rose : COSMOS.emerald)
          .opacity(lt * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1, part2, part3);
  runPhase(s, c, phase, 14);

  c.on('stream-boundaries-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('false-join', () => s.play(showFalseJoin.to(1, { duration: 0.55 })));
  c.on('contiguous-split', () => s.play(showContiguous.to(1, { duration: 0.55 })));

  c.on('stream-boundaries-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('sampler-window', () =>
    s.play(slideToLast.to(1, { duration: remainDuration(c, 'sampler-window', 1.1) })),
  );

  c.on('stream-boundaries-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('last-successor', () =>
    s.play(showLastTarget.to(1, { duration: remainDuration(c, 'last-successor', 0.45) })),
  );
  c.on('short-stream', () =>
    s.play(dropLastToken.to(1, { duration: remainDuration(c, 'short-stream', 0.5) })),
  );
}
