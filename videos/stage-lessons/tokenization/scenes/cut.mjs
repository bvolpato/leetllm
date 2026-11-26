// Scene 02: cut: Words (3) vs Characters (17 -> 289 cells) vs Subwords (4 -> 16 cells) with 3D quadratic surface.
import { par } from 'vizmatic/stage';
import {
  COSMOS,
  MASKED,
  PIECES,
  PIECE_COLORS,
  ROLE,
  SENTENCE,
  aura,
  bindCueBeat,
  buildAttentionGrid3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function cut(s, c) {
  const mode = s.value(0); // 0 = words (3), 1 = typo UNK, 2 = chars (17), 3 = subwords (4)
  const gridN = s.value(3); // 3 -> 17 -> 4
  const causalMask = s.value(0); // 0 -> 1 causal triangle
  const showComp289 = s.value(0);
  const showComp16 = s.value(0);
  const cueEnergy = s.value(0);

  const bgAura = aura(320, 40, 560, '#4c1d5e26', '#163d6418');
  const grid3d = buildAttentionGrid3d(gridN, causalMask, { x: 350, y: 20 });

  const title = heroTitle(['You have to', 'cut somewhere'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.piece,
  });

  const eq = glowTex(String.raw`\text{Pairs} = L^2`, {
    x: 350,
    y: -385,
    size: 42,
    color: ROLE.merge,
    glow: 6,
  });

  const stageVis = s.value(1);
  const leftLayer = guardedDynamic(stageVis, (alpha) => {
    const m = mode.value;
    const n = gridN.value;
    const cm = causalMask.value;
    const c289 = showComp289.value;
    const c16 = showComp16.value;
    const nodes = [];

    if (m < 1.5) {
      // Whole words mode (0) + typo UNK (1)
      const isTypo = m > 0.5;
      nodes.push(
        txt('WHOLE WORDS', -855, -210, 26, ROLE.token, 'mono', 'left').opacity(alpha),
        tokenPill('rain', -755, -120, { w: 170, h: 74, color: ROLE.token, opacity: alpha }),
        tokenPill('falls', -560, -120, { w: 180, h: 74, color: ROLE.token, opacity: alpha }),
        tokenPill(isTypo ? '[UNK]' : 'softly', -355, -120, {
          w: 190,
          h: 74,
          color: isTypo ? ROLE.warn : ROLE.token,
          fill: isTypo ? '#2a1220' : '#10182d',
          opacity: alpha,
        }),
        txt(
          isTypo ? 'Typo "sofly" → [UNK] (identity lost)' : '3 positions · 3² = 9 pairs',
          -855,
          -20,
          30,
          isTypo ? ROLE.warn : ROLE.merge,
          'mono',
          'left',
        )
          .glow(6, isTypo ? ROLE.warn : ROLE.merge)
          .opacity(alpha),
      );
    } else if (m < 2.5) {
      // Single characters mode (17)
      nodes.push(
        txt('SINGLE CHARACTERS (17 POSITIONS)', -855, -210, 26, ROLE.piece, 'mono', 'left').opacity(
          alpha,
        ),
      );
      const chars = [...SENTENCE];
      chars.forEach((ch, idx) => {
        const col = idx % 9;
        const row = Math.floor(idx / 9);
        const cx = -820 + col * 86;
        const cy = -130 + row * 82;
        nodes.push(
          tokenPill(ch === ' ' ? '·' : ch, cx, cy, {
            w: 72,
            h: 64,
            color: ch === ' ' ? ROLE.merge : ROLE.piece,
            size: 30,
            glow: 5,
            opacity: alpha,
          }),
        );
      });
      if (c289 > 0.05) {
        nodes.push(
          txt('17 × 17 = 289 attention pairs', -855, 80, 34, ROLE.warn, 'mono', 'left')
            .glow(8, ROLE.warn)
            .opacity(c289 * alpha),
        );
      }
      if (cm > 0.05) {
        nodes.push(
          txt(
            `Causal mask: ${MASKED} pairs (still O(L²))`,
            -855,
            140,
            30,
            ROLE.merge,
            'mono',
            'left',
          ).opacity(cm * alpha),
        );
      }
    } else {
      // Subwords mode (4 pieces, 16 pairs)
      nodes.push(
        txt('SUBWORDS (BALANCED)', -855, -210, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      );
      PIECES.forEach(([piece], idx) => {
        nodes.push(
          tokenPill(piece, -755 + idx * 195, -120, {
            w: 175,
            h: 74,
            color: PIECE_COLORS[idx],
            size: 32,
            opacity: alpha,
          }),
        );
      });
      if (c16 > 0.05) {
        nodes.push(
          txt('4 positions → 4² = 16 pairs', -855, -15, 36, ROLE.ok, 'mono', 'left')
            .glow(8, ROLE.ok)
            .opacity(c16 * alpha),
        );
      }
    }

    // Bottom common-scale comparison bars (always truthful to current mode)
    const barY1 = 270;
    const barY2 = 345;
    const maxW = 540;
    nodes.push(
      txt('Chars (17² = 289)', -855, barY1 - 28, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(-855, barY1 + 10, maxW * (n >= 10 || c16 > 0.1 ? 1 : 0.05), 26, ROLE.warn, {
        opacity: (n >= 10 || c16 > 0.1 ? 0.92 : 0.25) * alpha,
        maxTrackW: maxW,
      }),
      txt('Subwords (4² = 16)', -855, barY2 - 28, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      lumBar(-855, barY2 + 10, maxW * (16 / 289), 26, ROLE.ok, {
        opacity: (c16 > 0.1 ? 0.95 : 0.25) * alpha,
        maxTrackW: maxW,
      }),
    );

    // Caption under 3D surface (stable per mode so text never flickers mid-tween)
    const displayN = m < 1.5 ? 3 : m < 2.5 ? 17 : 4;
    const caption =
      cm > 0.5 && displayN > 10
        ? `Causal half-grid: ${MASKED} active pairs`
        : `${displayN} × ${displayN} = ${displayN * displayN} dense pairs`;
    nodes.push(
      txt(caption, 350, 425, 30, displayN > 10 ? ROLE.warn : ROLE.ok, 'mono', 'center')
        .glow(6, displayN > 10 ? ROLE.warn : ROLE.ok)
        .opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, grid3d, title, eq, leftLayer);
  orbitScene(s, c, grid3d, { theta: -0.18, phi: 0.92 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'typo', (d) => s.play(mode.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'characters',
    (d) => s.play(par(mode.to(2, { duration: d }), gridN.to(17, { duration: d }))),
    { dur: 0.9 },
  );
  playCue(s, c, 'comparisons', (d) => s.play(showComp289.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'hide-later', (d) => s.play(causalMask.to(1, { duration: d })), { dur: 0.7 });
  playCue(
    s,
    c,
    'middle',
    (d) =>
      s.play(
        par(
          mode.to(3, { duration: d }),
          gridN.to(4, { duration: d }),
          causalMask.to(0, { duration: d }),
        ),
      ),
    { dur: 0.9 },
  );
  playCue(s, c, 'sixteen', (d) => s.play(showComp16.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, cueEnergy, [
    'whole-words',
    'three-pieces',
    'loses',
    'seventeen',
    'every-position',
  ]);
}
