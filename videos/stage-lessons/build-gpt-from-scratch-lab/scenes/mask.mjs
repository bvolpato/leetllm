// Scene 08: Can the next input change the comma's score? (Causal mask invariance probe)
import {
  COSMOS,
  MINI_CAUSAL,
  MINI_CAUSAL_COPY,
  MINI_OPEN,
  MINI_OPEN_COPY,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function mask(s, c) {
  const phase = s.value(0);
  const bracketTight = s.value(0);
  const futureSwapped = s.value(0);
  const revealCausal = s.value(0);
  const bracketOpen = s.value(0);
  const revealOpen = s.value(0);

  const bgAura = aura(0, 20, 620, '#18336624', '#381e5614');
  const title = heroTitle(['Can the Next Input Change', "the Comma's Score?"], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CAUSAL MASK PROBE · FUTURE INVARIANCE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const bt = bracketTight.value;
    const sw = futureSwapped.value;
    const rc = revealCausal.value;
    const bo = bracketOpen.value;
    const ro = revealOpen.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const tileW = 216;
    const gap = 28;
    const stride = tileW + gap;
    const x0 = -560;
    const origY = -125;
    const copyY = 125;

    const origCoords = MINI_CAUSAL.inputs.map((v) => v[0]); // [0, 1, 2, 5]
    const copyCoords = MINI_CAUSAL_COPY.inputs.map((v) => v[0]); // [0, 1, 2, 3]
    const origTokens = MINI_CAUSAL.tokens; // ['Good', '·sir', ',', '↵']
    const copyTokens = MINI_CAUSAL_COPY.tokens; // ['Good', '·sir', ',', '·sir']

    const isOpen = bo > 0.5;
    const activeRightIdx = isOpen ? 3 : 2;
    const bLeft = x0 - tileW * 0.5 - 12;
    const bRight = x0 + (2 + bo) * stride + tileW * 0.5 + 12;
    const bracketColor = isOpen ? COSMOS.rose : COSMOS.emerald;

    const nodes = [
      txt('ORIGINAL INPUT STREAM', -855, origY - 82, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        sw > 0.3 ? 'TEST COPY (POS 3 CHANGED: ↵ -> ·sir)' : 'TEST COPY (IDENTICAL SO FAR)',
        -855,
        copyY - 82,
        26,
        sw > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    // Render Original row and Copy row
    for (let i = 0; i < 4; i++) {
      const cx = x0 + i * stride;
      const isFuture = i === 3;
      const inBracket = i <= activeRightIdx;

      // Original
      const origStroke = isFuture
        ? isOpen
          ? COSMOS.rose
          : COSMOS.dim
        : i === 2
          ? COSMOS.gold
          : COSMOS.cyan;
      nodes.push(
        glassCell(cx, origY, tileW, 92, origStroke, {
          fill: isFuture && !isOpen ? '#0d101b' : '#101f38',
          glow: inBracket ? 6 : 0,
          opacity: isFuture && !isOpen && bt > 0.5 ? 0.5 : 0.95,
        }),
        txt(origTokens[i], cx, origY - 14, 32, origStroke, 'mono'),
        txt(`x_0 = ${origCoords[i]}`, cx, origY + 24, 26, COSMOS.muted, 'mono'),
      );

      // Test copy
      const tokLabel = isFuture && sw > 0.5 ? copyTokens[i] : origTokens[i];
      const coordVal = isFuture && sw > 0.5 ? copyCoords[i] : origCoords[i];
      const copyStroke = isFuture && sw > 0.5 ? (isOpen ? COSMOS.rose : COSMOS.amber) : origStroke;
      nodes.push(
        glassCell(cx, copyY, tileW, 92, copyStroke, {
          fill: isFuture && sw > 0.5 ? '#261812' : isFuture && !isOpen ? '#0d101b' : '#101f38',
          glow: (isFuture && sw > 0.5) || inBracket ? 7 : 0,
          opacity: isFuture && !isOpen && bt > 0.5 && sw < 0.5 ? 0.5 : 0.95,
        }),
        txt(tokLabel, cx, copyY - 14, 32, copyStroke, 'mono'),
        txt(
          `x_0 = ${coordVal}`,
          cx,
          copyY + 24,
          26,
          isFuture && sw > 0.5 ? COSMOS.amber : COSMOS.muted,
          'mono',
        ),
      );
    }

    // Glowing causal / leaked visibility brackets on both rows
    if (bt > 0.05) {
      [origY, copyY].forEach((ry) => {
        nodes.push(
          line([bLeft, ry + 56], [bLeft, ry + 70], { stroke: bracketColor, width: 3.6 }).opacity(
            bt,
          ),
          line([bLeft, ry + 70], [bRight, ry + 70], { stroke: bracketColor, width: 3.6 })
            .glow(8, bracketColor)
            .opacity(bt),
          line([bRight, ry + 70], [bRight, ry + 56], { stroke: bracketColor, width: 3.6 }).opacity(
            bt,
          ),
        );
      });
      nodes.push(
        txt(
          isOpen ? 'LEAKED WINDOW: keys 0..3 (future admitted!)' : 'CAUSAL MASK: keys 0..2 only',
          (bLeft + bRight) * 0.5,
          origY + 96,
          26,
          bracketColor,
          'mono',
        )
          .glow(6, bracketColor)
          .opacity(bt),
      );
    }

    // Right readout column (strictly withheld until causal-reading / open-reading cues)
    const rx = 595;
    let origScoreText = '?';
    let copyScoreText = '?';
    let statusText = 'Predict score for ↵';
    let statusCol = COSMOS.gold;

    if (isOpen) {
      if (ro > 0.5) {
        origScoreText = MINI_OPEN.rows[2].logits[1].toFixed(1); // 2.0
        copyScoreText = MINI_OPEN_COPY.rows[2].logits[1].toFixed(1); // 1.5
        statusText = 'LEAK DETECTED: 2.0 != 1.5';
        statusCol = COSMOS.rose;
      } else {
        origScoreText = '?';
        copyScoreText = '?';
        statusText = 'Will scores still match?';
        statusCol = COSMOS.rose;
      }
    } else if (rc > 0.5) {
      origScoreText = MINI_CAUSAL.rows[2].logits[1].toFixed(1); // 1.0
      copyScoreText = MINI_CAUSAL_COPY.rows[2].logits[1].toFixed(1); // 1.0
      statusText = 'INVARIANT: 1.0 = 1.0';
      statusCol = COSMOS.emerald;
    }

    nodes.push(
      txt('SCORE FOR ↵ AT ","', rx, -206, 26, COSMOS.muted, 'mono'),
      glassCell(rx, origY, 340, 96, statusCol, { fill: '#10182b', glow: 8 * pulse }),
      txt(`orig = ${origScoreText}`, rx, origY + 2, 40, statusCol, 'mono').glow(7, statusCol),

      glassCell(rx, copyY, 340, 96, statusCol, { fill: '#10182b', glow: 8 * pulse }),
      txt(`copy = ${copyScoreText}`, rx, copyY + 2, 40, statusCol, 'mono').glow(7, statusCol),

      glowDot(rx, 0, { radius: 6, color: statusCol }),
      txt(statusText, rx, 265, 28, statusCol, 'mono').glow(6, statusCol),
      txt(
        isOpen && ro > 0.5
          ? 'Changing pos 3 shifted pos 2 -> restore causal mask!'
          : 'Mean of readable x_0 coordinates = line-break logit',
        0,
        368,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('mask-keys', () => s.play(bracketTight.to(1, { duration: 0.5 })));
  c.on('swap-future', () => s.play(futureSwapped.to(1, { duration: 0.55 })));
  c.after('causal-reading', () =>
    s.play(revealCausal.to(1, { duration: remainDuration(c, 'causal-reading', 0.4) })),
  );
  c.on('open-key', () =>
    s.play(bracketOpen.to(1, { duration: remainDuration(c, 'open-key', 0.55) })),
  );
  c.after('open-reading', () =>
    s.play(revealOpen.to(1, { duration: remainDuration(c, 'open-reading', 0.4) })),
  );
  c.on('restore-mask', () => {
    s.play(bracketOpen.to(0, { duration: remainDuration(c, 'restore-mask', 0.5) }));
  });
}
