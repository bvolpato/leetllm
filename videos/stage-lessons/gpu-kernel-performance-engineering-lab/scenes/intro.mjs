// Scene 01: Who wrote the six?
// Watch 6 land in B[2,1], replay on stale output skipping 6, hold prediction, reveal 0 mismatches.
import {
  COSMOS,
  ROLE,
  TRANSPOSE_4,
  aura,
  copyPass,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  const copySix = s.value(0);
  const skipStore = s.value(0);
  const staleMatch = s.value(0);
  const staleRetest = s.value(0);
  const isSecond = s.value(0);

  const bgAura = aura(0, 10, 640, '#60a5fa1c', '#5ce1e616');
  const title = heroTitle(['Who Wrote', 'the Six?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: ROLE.gold,
    eyebrow: 'CUDA TRANSPOSE · EXACT COPY CHECK',
  });

  const row1 = TRANSPOSE_4.filter((e) => e.source[0] === 1); // [4, 5, 6, 7]

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const cs = copySix.value;
    const ss = skipStore.value;
    const sm = staleMatch.value;
    const sr = staleRetest.value;
    const second = isSecond.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const stores = second ? Math.min(15, Math.floor(ss * 15.99)) : cs > 0.85 ? 16 : 15;
    const snap = copyPass(second ? 'previous' : 'empty', second ? 'skipped' : 'repaired', stores);

    const nodes = [
      txt(
        second
          ? 'SECOND LAUNCH · REUSED PREVIOUS OUTPUT BUFFER'
          : 'FIRST LAUNCH · FINAL TRANSPOSE WRITE',
        180,
        -355,
        26,
        second ? ROLE.warn : ROLE.output,
        'mono',
      ),

      // Left: Input A row 1 close-up (columns 0..3 -> values 4, 5, 6, 7)
      txt('INPUT A · ROW 1', -505, -165, 28, ROLE.input, 'mono'),
    ];

    row1.forEach((entry, col) => {
      const cx = -730 + col * 150;
      const isSix = entry.value === 6;
      nodes.push(
        txt(`col ${col}`, cx, -108, 26, isSix ? ROLE.gold : COSMOS.muted, 'mono'),
        glassCell(cx, -25, 130, 110, isSix ? ROLE.gold : ROLE.input, {
          fill: isSix ? '#2c2210' : '#101d36',
          glow: isSix ? 10 * pulse : 4,
        }),
        txt(String(entry.value), cx, -25, 44, isSix ? ROLE.gold : COSMOS.ink, 'mono'),
      );
    });

    nodes.push(
      txt('A[1, 2] = 6', -505, 80, 32, ROLE.gold, 'mono').glow(6, ROLE.gold),
      txt(
        `${stores} / 16 destinations written${second ? ' in this launch' : ''}`,
        -505,
        152,
        28,
        COSMOS.ink,
        'sans',
      ),
    );

    // Right: Output B 4x4 grid
    const gridOriginX = 200;
    const gridOriginY = -200;
    const cellW = 136;
    const cellH = 104;
    nodes.push(txt('OUTPUT B (4 × 4)', gridOriginX + cellW * 1.5, -278, 28, ROLE.output, 'mono'));

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const idx = r * 4 + col;
        const cx = gridOriginX + col * (cellW + 10);
        const cy = gridOriginY + r * (cellH + 10);
        const isTarget = r === 2 && col === 1;
        const fresh = snap.written.has(idx);
        const val = snap.values[idx];
        const border = isTarget ? ROLE.gold : fresh ? ROLE.output : COSMOS.rule;
        const fill = isTarget
          ? fresh
            ? '#133a48'
            : second
              ? '#2e2412'
              : '#141928'
          : fresh
            ? '#102e3e'
            : '#0d1322';
        nodes.push(
          glassCell(cx, cy, cellW, cellH, border, {
            fill,
            glow: isTarget ? 10 * pulse : fresh ? 5 : 0,
            dash: isTarget && !fresh && !second ? [7, 5] : undefined,
          }),
          txt(
            val === '' ? '·' : val,
            cx,
            cy,
            38,
            isTarget ? ROLE.gold : fresh ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    nodes.push(txt('B[2, 1]', gridOriginX + cellW * 1.5, 224, 30, ROLE.gold, 'mono'));

    // Transfer arc during Beat 0 (cleanly in the open gutter between Input A and Output B)
    if (!second) {
      const startPt = [-205, -25];
      const endPt = [120, 28];
      nodes.push(
        glowingArc(startPt, endPt, 35, {
          color: ROLE.gold,
          width: 3.6,
          opacity: 0.35 + 0.6 * cs,
        }),
      );
      if (cs > 0.04 && cs < 0.96) {
        const u = cs;
        const mx = (startPt[0] + endPt[0]) * 0.5;
        const my = (startPt[1] + endPt[1]) * 0.5 + 35;
        const px = (1 - u) * (1 - u) * startPt[0] + 2 * (1 - u) * u * mx + u * u * endPt[0];
        const py = (1 - u) * (1 - u) * startPt[1] + 2 * (1 - u) * u * my + u * u * endPt[1];
        nodes.push(glowDot(px, py, { radius: 9, color: ROLE.gold, glow: 14 }));
      }
    }

    // Bottom status / prediction withholding
    if (!second) {
      nodes.push(
        txt('Cyan squares hold a fresh write from this launch', 0, 382, 30, COSMOS.muted, 'sans'),
      );
    } else if (sm < 0.02) {
      nodes.push(
        txt(
          ss > 0.9
            ? 'How many bit mismatches will the checker find?'
            : 'Rewriting 15 squares while skipping B[2, 1]',
          0,
          382,
          34,
          ROLE.gold,
          'serif',
        ).glow(6, ROLE.gold),
      );
    } else if (sr < 0.02) {
      nodes.push(
        txt(
          `${snap.mismatches} bit mismatches · B[2, 1] still holds the old 6`,
          0,
          382,
          34,
          ROLE.warn,
          'mono',
        )
          .glow(7, ROLE.warn)
          .opacity(sm),
      );
    } else {
      nodes.push(
        txt('What starting value would expose the missed store?', 0, 382, 34, ROLE.output, 'serif')
          .glow(7, ROLE.output)
          .opacity(sr),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('copy-six', () => s.play(copySix.to(1, { duration: remainDuration(c, 'copy-six', 1.1) })));
  c.onBeat(1, () => s.play(isSecond.to(1, { duration: 0.2 })));
  c.on('skip-store', () =>
    s.play(skipStore.to(1, { duration: remainDuration(c, 'skip-store', 1.3) })),
  );
  c.after('stale-match', () =>
    s.play(staleMatch.to(1, { duration: remainAfterDuration(c, 'stale-match', 0.45) })),
  );
  c.on('stale-retest', () =>
    s.play(staleRetest.to(1, { duration: remainDuration(c, 'stale-retest', 0.45) })),
  );
}
