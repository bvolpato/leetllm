// Scene 9: types: "Who may read whom"
// Three luminous full-bleed attention patterns side by side:
// 1) Bidirectional Self-Attention (4x4 full square, BERT / ViT)
// 2) Causal Self-Attention (4x4 lower triangle, GPT decoders)
// 3) Cross-Attention (2x3 rectangle, Decoder queries × Encoder keys/values)
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cinemaAtmosphere, lumBar, playCue } from '../parts.mjs';

export default function types(s, c) {
  const title = heroTitle(['Three patterns:', 'who may read whom'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.sing,
  });

  const hi1 = s.value(0.55); // Bidirectional
  const hi2 = s.value(0.55); // Causal
  const hi3 = s.value(0.55); // Cross
  const pad1 = s.value(0); // padding column highlight on bidirectional
  const pad3 = s.value(0); // source padding highlight on cross-attention
  const offlineNote = s.value(0);

  const stageVis = s.value(1);

  const gridLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];

    // Helper to render one luminous attention pattern grid
    const drawPattern = ({
      cx,
      cy,
      rows,
      cols,
      cell,
      gap,
      heading,
      sub1,
      sub2,
      accent,
      focus,
      isAllowed,
      isPad,
    }) => {
      const totalW = cols * cell + (cols - 1) * gap;
      const totalH = rows * cell + (rows - 1) * gap;
      const left = cx - totalW / 2 + cell / 2;
      const top = cy - totalH / 2 + cell / 2;
      const op = (0.32 + 0.68 * focus) * alpha;

      nodes.push(
        txt(heading, cx, cy - totalH / 2 - 92, 34, accent, 'serif', 'center')
          .glow(focus > 0.7 ? 7 : 0, accent)
          .opacity(op),
        txt(sub1, cx, cy - totalH / 2 - 44, 26, COSMOS.muted, 'mono', 'center').opacity(op),
      );

      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const x = left + k * (cell + gap);
          const y = top + r * (cell + gap);
          const pad = isPad(r, k);
          const ok = !pad && isAllowed(r, k);
          const col = pad ? ROLE.amber : ok ? accent : ROLE.mask;
          nodes.push(
            lumBar(x, y, cell, cell, {
              color: col,
              fillOpacity: pad ? 0.25 : ok ? 0.36 : 0.14,
              strokeWidth: ok ? 2.2 : 1.4,
              glow: focus > 0.7 && ok ? 8 : 3,
              radius: 8,
              opacity: op,
            }),
            txt(pad ? 'P' : ok ? '●' : '×', x, y, 26, col, 'mono', 'center').opacity(op),
          );
        }
      }

      nodes.push(
        txt(sub2, cx, cy + totalH / 2 + 54, 26, COSMOS.muted, 'sans', 'center').opacity(op),
      );
    };

    // 1. Bidirectional 4x4 (left)
    drawPattern({
      cx: -610,
      cy: 30,
      rows: 4,
      cols: 4,
      cell: 78,
      gap: 10,
      heading: 'Bidirectional',
      sub1: 'Q, K, V: same sequence',
      sub2: 'Encoders: BERT, ViT',
      accent: ROLE.value,
      focus: hi1.value,
      isAllowed: () => true,
      isPad: (_r, k) => pad1.value > 0.5 && k === 3,
    });

    // 2. Causal 4x4 (center)
    drawPattern({
      cx: 0,
      cy: 30,
      rows: 4,
      cols: 4,
      cell: 78,
      gap: 10,
      heading: 'Causal',
      sub1: 'Q, K, V: same · j ≤ i',
      sub2: 'Decoders: GPT-style',
      accent: ROLE.sing,
      focus: hi2.value,
      isAllowed: (r, k) => k <= r,
      isPad: () => false,
    });

    // 3. Cross-attention 2x3 (right)
    drawPattern({
      cx: 610,
      cy: 30,
      rows: 2,
      cols: 3,
      cell: 92,
      gap: 12,
      heading: 'Cross-Attention',
      sub1: 'Q: target (2) · K,V: source (3)',
      sub2: 'Decoder reads Encoder',
      accent: ROLE.head,
      focus: hi3.value,
      isAllowed: () => true,
      isPad: (_r, k) => pad3.value > 0.5 && k === 2,
    });

    // Subtle luminous flow ribbon connecting Q/K/V sources along the bottom
    const pts = arcPts([-610, 345], [610, 345], 24, 32);
    nodes.push(
      glowingTrail(pts, {
        gradientColors: [ROLE.value, ROLE.sing, ROLE.head],
        width: 3,
        glow: 7,
        core: false,
        opacity: 0.65 * alpha,
      }),
    );

    const footerText =
      offlineNote.value > 0.5
        ? 'Offline cross-attention: mask source padding only (whole source is already known)'
        : 'Same Attention(Q, K, V) formula  ·  only mask & sources change';
    nodes.push(
      txt(footerText, 0, 415, 28, ROLE.query, 'sans', 'center').glow(5, ROLE.query).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.value, ROLE.head), title, gridLayer);

  // Beat 1: Bidirectional self-attention
  playCue(
    s,
    c,
    'first',
    (d) =>
      s.play(
        hi1.to(1, { duration: d }),
        hi2.to(0.2, { duration: d }),
        hi3.to(0.2, { duration: d }),
      ),
    { dur: 0.55 },
  );
  playCue(s, c, 'before-after', (d) => s.play(hi1.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'encoders', (d) => s.play(hi1.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'pad-only', (d) => s.play(pad1.to(1, { duration: d })), { dur: 0.5 });

  // Beat 2: Causal self-attention
  playCue(
    s,
    c,
    'second',
    (d) =>
      s.play(
        pad1.to(0, { duration: d * 0.5 }),
        hi1.to(0.2, { duration: d }),
        hi2.to(1, { duration: d }),
        hi3.to(0.2, { duration: d }),
      ),
    { dur: 0.6 },
  );
  playCue(s, c, 'decoder-only', (d) => s.play(hi2.to(1, { duration: d })), { dur: 0.3 });

  // Beat 3: Cross-attention (2x3 rectangle)
  playCue(
    s,
    c,
    'third',
    (d) =>
      s.play(
        hi1.to(0.2, { duration: d }),
        hi2.to(0.2, { duration: d }),
        hi3.to(1, { duration: d }),
      ),
    { dur: 0.6 },
  );
  playCue(s, c, 'decoder-asks', (d) => s.play(hi3.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'two-three', (d) => s.play(hi3.to(1, { duration: d })), { dur: 0.3 });

  // Beat 4: Source padding mask & offline note
  playCue(s, c, 'source-pad', (d) => s.play(pad3.to(1, { duration: d })), { dur: 0.5 });
  playCue(
    s,
    c,
    'offline',
    (d) =>
      s.play(
        offlineNote.to(1, { duration: d }),
        hi1.to(0.75, { duration: d }),
        hi2.to(0.75, { duration: d }),
        hi3.to(1, { duration: d }),
      ),
    { dur: 0.6 },
  );
}
