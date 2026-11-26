// Scene 01: Who gets row four? Ragged query packing vs padded rectangle + 3D paged KV rig.
import {
  COSMOS,
  KV_LENS,
  PADDED_ROWS,
  ROLE,
  TOTAL_ROWS,
  aura,
  buildPagedKvRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfter,
  remainDuration,
  requests,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const entryVal = s.value(0);
  const slotVal = s.value(0);
  const showR1 = s.value(0);
  const askRow4 = s.value(0);
  const revOwner = s.value(0);
  const packR2 = s.value(0);
  const showHistory = s.value(0);

  const bgAura = aura(420, 20, 540, '#5ce1e622', '#a78bfa18');
  const { view: kv3d } = buildPagedKvRig3d(entryVal, slotVal, phase, { x: 430, y: 20, unit: 102 });

  const title = heroTitle(['Who Gets', 'Row Four?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: ROLE.r2,
    eyebrow: 'FLASHINFER · RAGGED BATCH PACKING',
    subtitle: 'Pack variable queries without padding',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const r1 = showR1.value;
    const ask = askRow4.value;
    const own = revOwner.value;
    const pk = packR2.value;
    const hist = showHistory.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [
      txt('3D PAGED KV CACHE BANK (R2: PAGES 3, 14, 6)', 430, -405, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        hist > 0.5
          ? 'R2 query 0 attends across 9 non-contiguous keys'
          : 'Physical pages live scattered across GPU HBM',
        430,
        420,
        26,
        hist > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
      txt('PACKED QUERY BUFFER (0..7)', -465, -162, 26, COSMOS.muted, 'mono'),
    ];

    // 8 packed query slots in 2 clean rows of 4 on the left side
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = -765 + col * 200;
      const cy = -76 + row * 120;

      let label = `row ${i}`;
      let owner = 'open';
      let stroke = COSMOS.dim;
      let fill = '#0c1222';
      let glow = 0;

      if (i < 3) {
        owner = 'R0';
        stroke = ROLE.r0;
        fill = '#102240';
        glow = 6;
      } else if (i === 3) {
        if (r1 > 0.05) {
          owner = 'R1';
          stroke = ROLE.r1;
          fill = '#21143d';
          glow = 9 * r1;
        }
      } else if (i === 4) {
        if (own > 0.05) {
          owner = 'R2 q0';
          stroke = hist > 0.5 ? COSMOS.gold : ROLE.r2;
          fill = hist > 0.5 ? '#2b2210' : '#0f2c3a';
          glow = 11 * pulse;
        } else if (ask > 0.05) {
          owner = '?';
          stroke = COSMOS.gold;
          fill = '#241e10';
          glow = 10 * pulse;
        }
      } else if (pk > 0.05) {
        owner = `R2 q${i - 4}`;
        stroke = ROLE.r2;
        fill = '#0f2c3a';
        glow = 7 * pk;
      }

      nodes.push(
        glassCell(cx, cy, 178, 94, stroke, {
          fill,
          glow,
          dash: owner === 'open' || owner === '?' ? [8, 6] : undefined,
        }),
        txt(label, cx, cy - 22, 26, COSMOS.muted, 'mono'),
        txt(owner, cx, cy + 18, 30, stroke === COSMOS.dim ? COSMOS.dim : COSMOS.ink, 'mono'),
      );
    }

    // Bottom comparison strip: withheld until packing revealed
    if (ask > 0.5 && own < 0.05) {
      nodes.push(
        txt('R0 fills 0..2, R1 fills 3: who owns row 4?', -465, 165, 32, COSMOS.gold, 'serif').glow(
          6,
          COSMOS.gold,
        ),
      );
    }

    if (pk > 0.05) {
      nodes.push(
        glassCell(-465, 200, 770, 96, ROLE.good, { fill: '#0d2622', glow: 8, opacity: pk }),
        txt(
          `${TOTAL_ROWS} packed rows vs ${PADDED_ROWS} padded (3 × 4)`,
          -465,
          178,
          28,
          ROLE.good,
          'mono',
        ).opacity(pk),
        txt(
          `R0 (${requests[0].q}q, prefill) · R1 (${requests[1].q}q, decode) · R2 (${requests[2].q}q, prefill)`,
          -465,
          222,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(pk),
      );
    }

    if (hist > 0.05) {
      nodes.push(
        glassCell(-465, 345, 770, 94, COSMOS.gold, { fill: '#261e10', glow: 9, opacity: hist }),
        txt(`R2 holds ${KV_LENS[2]} keys (5 prefix + 4 new)`, -465, 325, 28, COSMOS.gold, 'mono')
          .glow(5, COSMOS.gold)
          .opacity(hist),
        txt(
          'Need 2 maps: query rows + physical KV pages',
          -465,
          368,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(hist),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, kv3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, kv3d, { theta: -0.22, phi: 0.92 });

  c.on('intro-first-four', () =>
    s.play(showR1.to(1, { duration: remainDuration(c, 'intro-first-four', 0.45) })),
  );
  c.on('intro-ask', () => s.play(askRow4.to(1, { duration: remainDuration(c, 'intro-ask', 0.4) })));
  c.after('intro-owner', () =>
    s.play(revOwner.to(1, { duration: remainAfter(c, 'intro-owner', 0.4) })),
  );
  c.on('intro-pack', () =>
    s.play(packR2.to(1, { duration: remainDuration(c, 'intro-pack', 0.5) })),
  );
  c.on('intro-history', () => {
    s.play(showHistory.to(1, { duration: remainDuration(c, 'intro-history', 0.45) }));
    s.play(entryVal.to(1, { duration: remainDuration(c, 'intro-history', 0.6) }));
    s.play(slotVal.to(1, { duration: remainDuration(c, 'intro-history', 0.6) }));
  });
}
