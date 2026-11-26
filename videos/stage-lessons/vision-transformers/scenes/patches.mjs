// Scene 03: patches: Unfolding a 4x4 grid into four 2x2 raster rows + 32x32 RGB -> 16 patches x 192 inputs.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  patches as PATCHES,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function patches(s, c) {
  const unfolded = s.value(1); // 1 = top-left [0,1,4,5], 4 = all four rows
  const showRgb = s.value(0);

  const bgAura = aura(0, 0, 740, '#123a5e28', '#2a1b5418');
  const title = heroTitle(['Patch Tokenization:', '4 pixels into 1 row'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.patch,
  });

  const patchColors = [ROLE.patch, ROLE.pos, ROLE.attn, ROLE.ok];
  const stageVis = s.value(1);

  const layer = guardedDynamic(stageVis, (alpha) => {
    const k = Math.round(unfolded.value);
    const rgb = showRgb.value;
    const nodes = [];

    // Left: 4x4 pixel grid (values 0..15 grouped into four 2x2 patches)
    const gx0 = -740;
    const gy0 = -175;
    const cell = 84;
    nodes.push(
      txt('4 × 4 IMAGE GRID', gx0 + 126, gy0 - 72, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const val = r * 4 + col;
        const pIdx = Math.floor(r / 2) * 2 + Math.floor(col / 2);
        const colStroke = patchColors[pIdx];
        const lit = pIdx < k;
        nodes.push(
          rect(72, 72, { fill: '#111b33', stroke: colStroke, width: lit ? 2.8 : 1.6, radius: 8 })
            .at(gx0 + col * cell, gy0 + r * cell)
            .glow(lit ? 7 : 0, colStroke)
            .opacity((lit ? 0.96 : 0.4) * alpha),
          txt(
            String(val),
            gx0 + col * cell,
            gy0 + r * cell,
            28,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    }

    // Right: Unfolded patch rows (raster order)
    const rx = 50;
    nodes.push(
      txt(
        'UNFOLDED PATCH SEQUENCE (4 × 4)',
        rx + 260,
        -245,
        26,
        ROLE.patch,
        'mono',
        'center',
      ).opacity(alpha),
    );
    PATCHES.forEach((row, idx) => {
      const y = -165 + idx * 86;
      const active = idx < k;
      const col = patchColors[idx];
      nodes.push(
        chipPill(`Patch ${idx}:  [${row.join(', ')}]`, rx + 260, y, {
          w: 520,
          h: 68,
          color: active ? col : COSMOS.rule,
          size: 28,
          glow: active ? 9 : 0,
          opacity: (active ? 1 : 0.28) * alpha,
        }),
      );
    });

    // Bottom RGB shape equation (quiet preview -> bright on `patch-rgb`)
    nodes.push(
      txt(
        rgb > 0.3
          ? '32×32 RGB, patch 8×8 → (32/8)×(32/8) = 16 patches × (8×8×3 = 192) → linear proj keeps 16 rows'
          : 'Unfolding rearranges pixels without losing a single value (exact inverse exists)',
        -855,
        325,
        26,
        rgb > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(rgb > 0.3 ? 6 : 0, ROLE.ok)
        .opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'patch-unfold-rest', (d) => s.play(unfolded.to(4, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'patch-rgb', (d) => s.play(showRgb.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), ['patch-unfold']);
}
