// Scene 01: Which token comes after the comma?
import {
  COSMOS,
  aura,
  buildCausalStream3d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const commaArrived = s.value(0);
  const breakRevealed = s.value(0);
  const appended = s.value(0);

  const bgAura = aura(350, 20, 520, '#1e387a2a', '#4b2a7d14');
  const prism3d = buildCausalStream3d(phase, { x: 380, y: 30, layers: 3 });

  const title = heroTitle(['Which Token Comes', 'After the Comma?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'TINY GPT · AUTOREGRESSIVE PREDICTION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ca = commaArrived.value;
    const br = breakRevealed.value;
    const ap = appended.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [
      // Printed Shakespeare passage (the visual clue)
      txt('PRINTED PASSAGE', -855, -182, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-605, -80, 500, 128, COSMOS.cyan, { fill: '#0c1528', glow: 6 }),
      txt('Line 1:   Good sir,', -825, -104, 34, COSMOS.ink, 'serif', 'left'),
      txt('Line 2:   Speak plain.', -825, -52, 34, COSMOS.ink, 'serif', 'left'),
      // Highlight the comma on line 1
      glowDot(-525, -104, { radius: 5 + 2 * pulse, color: COSMOS.gold, opacity: 0.9 }),

      // Model input prefix stream
      txt('MODEL INPUT STREAM', -855, 42, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    const inputPieces = ['Good', '·sir', ','];
    const tileW = 148;
    const gap = 16;
    const x0 = -780;
    const rowY = 132;

    inputPieces.forEach((piece, i) => {
      const tx = x0 + i * (tileW + gap);
      const isComma = i === 2;
      const slideOffset = isComma ? (1 - ca) * -90 : 0;
      const stroke = isComma ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        glassCell(tx, rowY + slideOffset, tileW, 88, stroke, {
          fill: isComma ? '#221c0e' : '#0f1c33',
          glow: isComma ? 9 * pulse : 5,
        }),
        txt(piece, tx, rowY + slideOffset + 2, 34, isComma ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    });

    // Target / next-token slot
    const targetX = x0 + 3 * (tileW + gap);
    const nextX = x0 + 4 * (tileW + gap);

    if (ap < 0.5) {
      nodes.push(
        glassCell(targetX, rowY, tileW, 88, br > 0.5 ? COSMOS.emerald : COSMOS.gold, {
          fill: br > 0.5 ? '#0e2824' : '#1b1710',
          dash: br > 0.5 ? undefined : [8, 6],
          glow: 9 * pulse,
        }),
        txt(
          br > 0.5 ? '↵' : '?',
          targetX,
          rowY + 2,
          44,
          br > 0.5 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).glow(8, br > 0.5 ? COSMOS.emerald : COSMOS.gold),
        txt(
          br > 0.5 ? 'TARGET: NEWLINE' : 'NEXT TOKEN?',
          targetX,
          rowY + 72,
          26,
          br > 0.5 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ),
      );
    } else {
      // Sampled line break joins input; next prediction shifts right to "Spe"
      nodes.push(
        glassCell(targetX, rowY, tileW, 88, COSMOS.emerald, {
          fill: '#0e2824',
          glow: 8,
        }),
        txt('↵', targetX, rowY + 2, 42, COSMOS.emerald, 'mono'),
        txt('APPENDED', targetX, rowY + 72, 26, COSMOS.emerald, 'mono'),
        glassCell(nextX, rowY, tileW, 88, COSMOS.gold, {
          fill: '#1e190f',
          dash: [8, 6],
          glow: 10 * pulse,
        }),
        txt('Spe', nextX, rowY + 2, 34, COSMOS.gold, 'mono').glow(7, COSMOS.gold),
        txt('NEXT TARGET', nextX, rowY + 72, 26, COSMOS.gold, 'mono'),
        glowingArc([targetX, rowY - 50], [nextX, rowY - 50], -36, {
          color: COSMOS.gold,
          width: 3.4,
        }),
      );
    }

    if (br > 0.05) {
      nodes.push(
        txt(
          ap > 0.5
            ? 'Sampled ↵ joins the prefix -> next prediction targets "Spe"'
            : 'Line break (↵) sits between "," and "Speak"',
          -855,
          286,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        )
          .glow(5, COSMOS.emerald)
          .opacity(br),
      );
    }

    nodes.push(
      txt('CAUSAL DECODER STREAM', 380, -395, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt('Each step reads prefix x<=t to predict x_(t+1)', 380, 425, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, prism3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, prism3d, { theta: -0.18, phi: 0.94 });

  c.on('read-prefix', () => s.play(commaArrived.to(1, { duration: 0.55 })));
  c.after('show-break', () =>
    s.play(breakRevealed.to(1, { duration: remainDuration(c, 'show-break', 0.45) })),
  );
  c.on('append-piece', () =>
    s.play(appended.to(1, { duration: remainDuration(c, 'append-piece', 0.55) })),
  );
}
