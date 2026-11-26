// Scene 20: A packed stream needs a boundary policy: Live 6x6 block-diagonal causal attention mask preventing cross-document leakage + boundary loss -100.
import {
  COSMOS,
  PACKED_WORDS,
  TOY_TOKEN_IDS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  markDecoration,
  packedMask,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function boundaries(s, c) {
  const phase = s.value(0);
  const idsShown = s.value(0);
  const packedLit = s.value(0);
  const maskVisible = s.value(0);
  const earlierNote = s.value(0);
  const isolatedReveal = s.value(0); // Strict prediction withholding for Birds!
  const queryIdx = s.value(3); // 3=Birds, 4=sing, 5=EOS, 2=sat
  const boundaryFocus = s.value(0);
  const targetIgnored = s.value(0);

  const bgAura = aura(240, 60, 560, '#13284d2a', '#6ee7b716');
  const title = heroTitle(['Block-Diagonal Boundary Policy'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: COSMOS.cyan,
    eyebrow: 'PACKED ATTENTION ISOLATION · 2 DOCS IN 1 BLOCK',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ids = idsShown.value;
    const pl = packedLit.value;
    const mv = maskVisible.value;
    const en = earlierNote.value;
    const iso = isolatedReveal.value > 0.5;
    const q = Math.round(queryIdx.value);
    const bf = boundaryFocus.value;
    const ti = targetIgnored.value;

    const nodes = [];

    // Top packed token ribbon spanning [-690..+690] at y = -222
    const ribbonLeft = -690;
    const tokPitch = 276;
    PACKED_WORDS.forEach((word, i) => {
      const cx = ribbonLeft + i * tokPitch;
      const isDocA = i < 3;
      const isQuery = i === q;
      const col = isQuery ? COSMOS.gold : isDocA ? COSMOS.blue : COSMOS.cyan;
      nodes.push(
        glassCell(cx, -222, 232, 78, col, {
          fill: isQuery ? '#241e12' : '#0f182c',
          glow: isQuery ? 12 : 5 + pl * 3,
          opacity: 0.96,
        }),
        txt(word, cx, -220, 32, isQuery ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
      if (ids > 0.1) {
        nodes.push(txt(`id ${TOY_TOKEN_IDS[i]}`, cx, -292, 26, COSMOS.dim, 'mono').opacity(ids));
      }
    });

    // Document span labels under ribbon + boundary wall strictly between ribbon boxes
    nodes.push(
      txt('DOC A (pos 0, 1, 2)', ribbonLeft + tokPitch, -148, 26, COSMOS.blue, 'mono'),
      txt('DOC B (pos 3, 4, 5)', ribbonLeft + 4 * tokPitch, -148, 26, COSMOS.cyan, 'mono'),
      glowingTrail(
        [
          [0, -264],
          [0, -178],
        ],
        { color: COSMOS.rose, width: 4.5, glow: 12 },
      ),
    );

    // Left panel: Focused query & allowed/denied readout
    nodes.push(
      txt('ACTIVE QUERY TOKEN', -855, -20, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${PACKED_WORDS[q]} (pos ${q})`, -855, 42, 48, COSMOS.gold, 'mono', 'left').glow(
        8,
        COSMOS.gold,
      ),
    );

    if (!iso) {
      // Strict prediction withholding!
      nodes.push(
        txt('Which earlier words in this block', -855, 148, 34, COSMOS.gold, 'serif', 'left'),
        txt('can "Birds" read?', -855, 198, 34, COSMOS.gold, 'serif', 'left').glow(6, COSMOS.gold),
      );
    } else {
      const allowed = PACKED_WORDS.map((w, i) => (packedMask(q, i) ? w : null)).filter(Boolean);
      const denied = PACKED_WORDS.map((w, i) => (i <= q && !packedMask(q, i) ? w : null)).filter(
        Boolean,
      );
      nodes.push(
        txt('VISIBLE KEYS', -855, 126, 26, COSMOS.emerald, 'mono', 'left'),
        txt(allowed.join('  ·  '), -855, 178, 36, COSMOS.emerald, 'mono', 'left').glow(
          6,
          COSMOS.emerald,
        ),
        txt('BLOCKED CROSS-DOC', -855, 250, 26, COSMOS.rose, 'mono', 'left'),
        txt(
          denied.length ? denied.join('  ·  ') : 'none (doc A boundary ahead)',
          -855,
          298,
          30,
          denied.length ? COSMOS.rose : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Draw luminous attention arcs from active query token to its allowed keys on the ribbon
      PACKED_WORDS.forEach((_, k) => {
        if (packedMask(q, k) && k !== q) {
          nodes.push(
            markDecoration(
              glowingArc([ribbonLeft + q * tokPitch, -182], [ribbonLeft + k * tokPitch, -182], 26, {
                color: COSMOS.emerald,
                width: 3.5,
                glow: 8,
              }),
            ),
          );
        }
      });
    }

    // Beat 2: Boundary target sat -> Birds masked with -100
    if (bf > 0.05) {
      nodes.push(
        glassCell(-440, 395, 810, 86, ti > 0.5 ? COSMOS.rose : COSMOS.amber, {
          fill: ti > 0.5 ? '#24101c' : '#1e1912',
          glow: 9,
          opacity: bf,
        }),
        txt(
          ti > 0.5
            ? 'sat -> Birds: loss target = -100 (IGNORE)'
            : 'Next physical token after sat is Birds',
          -440,
          397,
          30,
          ti > 0.5 ? COSMOS.rose : COSMOS.gold,
          'mono',
        ).opacity(bf),
      );
    }

    // Right: Live 6x6 block-diagonal causal attention mask (positioned cleanly below DOC B)
    const cell = 66;
    const gap = 8;
    const gridW = 6 * cell + 5 * gap;
    const gx0 = 435 - gridW * 0.5;
    const gy0 = 212 - gridW * 0.5;

    if (mv > 0.05) {
      nodes.push(
        txt('6x6 BLOCK-DIAGONAL CAUSAL MASK', 435, gy0 - 58, 26, COSMOS.cyan, 'mono').opacity(mv),
      );
      for (let i = 0; i < 6; i++) {
        const cx = gx0 + i * (cell + gap) + cell * 0.5;
        const cy = gy0 + i * (cell + gap) + cell * 0.5;
        nodes.push(
          txt(String(i), cx, gy0 - 22, 26, COSMOS.dim, 'mono').opacity(mv),
          txt(
            PACKED_WORDS[i],
            gx0 - 20,
            cy + 2,
            26,
            i === q ? COSMOS.gold : COSMOS.muted,
            'mono',
            'right',
          ).opacity(mv),
        );
      }

      for (let r = 0; r < 6; r++) {
        for (let k = 0; k < 6; k++) {
          const cx = gx0 + k * (cell + gap) + cell * 0.5;
          const cy = gy0 + r * (cell + gap) + cell * 0.5;
          const ok = packedMask(r, k);
          const crossBlocked = k <= r && !ok;
          const inRow = r === q;
          // Withhold row 3 isolation colors until iso is revealed!
          const revealCell = iso || r < 3;
          const fill = !revealCell
            ? '#111626'
            : ok
              ? inRow
                ? '#163834'
                : '#102438'
              : crossBlocked && inRow
                ? '#2f1220'
                : '#0b0e18';
          const stroke = !revealCell
            ? '#2a3656'
            : ok
              ? inRow
                ? COSMOS.gold
                : COSMOS.cyan
              : crossBlocked
                ? COSMOS.rose
                : '#222c46';

          nodes.push(
            rect(cell, cell, {
              fill,
              stroke,
              width: inRow ? 2.8 : 1.6,
              radius: 7,
            })
              .at(cx, cy)
              .opacity((ok || inRow ? 0.96 : 0.48) * mv),
          );
          if (revealCell && ok) {
            nodes.push(
              glowDot(cx, cy, {
                radius: inRow ? 8 : 6,
                color: inRow ? COSMOS.gold : COSMOS.cyan,
                glow: 8,
                opacity: mv,
              }),
            );
          } else if (revealCell && crossBlocked && (inRow || en > 0.5)) {
            nodes.push(txt('x', cx, cy + 2, 28, COSMOS.rose, 'mono').opacity(0.85 * mv));
          }
        }
      }
    } else {
      // Beat 0 placeholder silhouette on right so frame balance is rich & zero empty space!
      nodes.push(
        glassCell(435, 160, 620, 320, COSMOS.cyan, { fill: '#0e172a', glow: 6, opacity: 0.9 }),
        txt('INDEPENDENT-DOCUMENT POLICY', 435, 70, 28, COSMOS.cyan, 'mono'),
        txt('Doc A: The · cat · sat', 435, 145, 32, COSMOS.blue, 'mono'),
        txt('Doc B: Birds · sing · EOS', 435, 210, 32, COSMOS.cyan, 'mono'),
        txt('Two sequences packed into 1 block', 435, 278, 26, COSMOS.muted, 'sans'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('boundaries-b1-1', () =>
    s.play(idsShown.to(1, { duration: remainDuration(c, 'boundaries-b1-1', 0.5) })),
  );
  c.on('boundaries-b1-2', () =>
    s.play(packedLit.to(1, { duration: remainDuration(c, 'boundaries-b1-2', 0.5) })),
  );

  c.on('boundaries-b2-1', () =>
    s.play(maskVisible.to(1, { duration: remainDuration(c, 'boundaries-b2-1', 0.6) })),
  );
  c.on('boundaries-b2-2', () =>
    s.play(earlierNote.to(1, { duration: remainDuration(c, 'boundaries-b2-2', 0.5) })),
  );
  // Strict prediction withholding: reveal Birds isolation only after "Birds can read only itself"
  c.after('pt-boundaries-isolate', () =>
    s.play(
      isolatedReveal.to(1, { duration: remainAfterDuration(c, 'pt-boundaries-isolate', 0.4) }),
    ),
  );
  c.on('pt-boundaries-sing', () =>
    s.play(queryIdx.to(4, { duration: remainDuration(c, 'pt-boundaries-sing', 0.45) })),
  );
  c.on('pt-boundaries-eos', () =>
    s.play(queryIdx.to(5, { duration: remainDuration(c, 'pt-boundaries-eos', 0.45) })),
  );

  c.on('boundaries-b3-1', () => {
    const dur = remainDuration(c, 'boundaries-b3-1', 0.5);
    s.play(queryIdx.to(2, { duration: 0.02 }));
    s.play(boundaryFocus.to(1, { duration: dur }));
  });
  c.after('pt-boundaries-target', () =>
    s.play(targetIgnored.to(1, { duration: remainAfterDuration(c, 'pt-boundaries-target', 0.45) })),
  );
}
