// Scene 23: Restore consumed work rather than the furthest read: Distributed LSH shuffle + 6-record exact restart vs prefetch skip vs seed replay.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  RESTART_ORDER,
  RESTART_STATE,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function restartConsistency(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const shuffleOn = s.value(0);

  const showPart2 = s.value(0);
  const suffixOn = s.value(0);
  const manifestOn = s.value(0);
  const prefetchOn = s.value(0);
  const skipOn = s.value(0);
  const repeatOn = s.value(0);
  const restoreOn = s.value(0);

  const bgAura = aura(0, 0, 640, '#16284f2a', '#fb923c14');

  // Part 1: Parallel workers -> shuffle same band bucket to common comparison owner
  const part1Live = guardedDynamic(showPart1, (a) => {
    const sh = shuffleOn.value;
    const ph = phase.value;
    const workers = [
      { label: 'Worker 1 · A (band 1)', x: -575, color: COSMOS.blue, targetX: -340 },
      { label: 'Worker 2 · B (band 1)', x: 0, color: COSMOS.cyan, targetX: -340 },
      { label: 'Worker 3 · C (band 6)', x: 575, color: COSMOS.violet, targetX: 460 },
    ];

    const nodes = [
      heroTitle(['Distributed Shuffle', '& Exact Restart'], {
        x: -855,
        y: -435,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'PARALLEL WORKERS · COMMON COMPARISON OWNERS',
      }).opacity(a),
    ];

    workers.forEach((w, i) => {
      nodes.push(
        glassCell(w.x, -125, 490, 118, w.color, { fill: '#0f182c', glow: 7, opacity: a }),
        txt(w.label, w.x, -123, 30, w.color, 'mono').opacity(a),
        ...photonStream([w.x, -62], [w.targetX, 112], 25, ph + i * 0.6, {
          color: w.color,
          count: 3,
          opacity: (0.35 + 0.65 * sh) * a,
        }),
      );
    });

    if (sh > 0.02) {
      nodes.push(
        glassCell(-340, 175, 760, 126, COSMOS.emerald, {
          fill: '#0e2424',
          glow: 9,
          opacity: sh * a,
        }),
        txt('OWNER: BAND 1 BUCKET', -340, 148, 28, COSMOS.emerald, 'mono').opacity(sh * a),
        txt('Compare candidate pair (A, B)', -340, 198, 30, COSMOS.ink, 'sans').opacity(sh * a),

        glassCell(460, 175, 560, 126, COSMOS.violet, {
          fill: '#17132c',
          glow: 8,
          opacity: sh * a,
        }),
        txt('OWNER: BAND 6 BUCKET', 460, 148, 28, COSMOS.violet, 'mono').opacity(sh * a),
        txt('Singleton C (no pair)', 460, 198, 30, COSMOS.ink, 'sans').opacity(sh * a),

        txt(
          'Measure stage throughput, storage footprint, and cross-worker shuffle bytes',
          0,
          380,
          30,
          COSMOS.muted,
          'sans',
        ).opacity(sh * a),
      );
    }

    return group(...nodes);
  });

  // Part 2: 6-record deterministic order [0, 5, 1, 2, 3, 4] with consumed=2 vs prefetch=4 vs seed=0
  const part2Live = guardedDynamic(showPart2, (a) => {
    const sf = suffixOn.value;
    const mf = manifestOn.value;
    const pf = prefetchOn.value;
    const sk = skipOn.value;
    const rp = repeatOn.value;
    const rs = restoreOn.value;

    const leftX = -625;
    const pitch = 250;
    const rowY = -125;
    const consumedX = leftX + 2 * pitch - pitch * 0.5;
    const prefetchX = leftX + 4 * pitch - pitch * 0.5;

    const nodes = [
      txt(
        'EXECUTED DETERMINISTIC ORDER · 6 RECORDS',
        -855,
        -430,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Restore Consumed Cursor, Not Prefetch',
        -855,
        -355,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),
    ];

    RESTART_ORDER.forEach((rec, i) => {
      const cx = leftX + i * pitch;
      const isConsumed = i < 2;
      const isSkippedZone = i >= 2 && i < 4;
      const col =
        rp > 0.5 && isConsumed
          ? COSMOS.rose
          : sk > 0.5 && isSkippedZone
            ? COSMOS.amber
            : isConsumed
              ? COSMOS.dim
              : COSMOS.emerald;

      nodes.push(
        txt(`pos ${i}`, cx, rowY - 82, 26, COSMOS.dim, 'mono').opacity(a),
        glassCell(cx, rowY, 206, 108, col, {
          fill:
            rp > 0.5 && isConsumed
              ? '#24101c'
              : sk > 0.5 && isSkippedZone
                ? '#261a0e'
                : isConsumed
                  ? '#0c101c'
                  : '#0e2422',
          glow: isConsumed && rp < 0.5 ? 0 : 8,
          opacity: (isConsumed && rp < 0.5 ? 0.52 : 0.96) * a,
        }),
        txt(`rec ${rec}`, cx, rowY + 2, 38, col, 'mono').opacity(a),
      );
    });

    // Consumed cursor 2 (green)
    nodes.push(
      glowingTrail(
        [
          [consumedX, rowY - 108],
          [consumedX, rowY + 115],
        ],
        { color: COSMOS.emerald, width: 5, glow: 12, opacity: a },
      ),
      glowDot(consumedX, rowY + 115, { radius: 8, color: COSMOS.emerald, glow: 12, opacity: a }),
      txt('CONSUMED = 2', consumedX, rowY + 158, 28, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(a),
    );

    // Prefetch cursor 4 (amber)
    if (pf > 0.02) {
      nodes.push(
        glowingTrail(
          [
            [prefetchX, rowY - 108],
            [prefetchX, rowY + 115],
          ],
          { color: COSMOS.amber, width: 5, glow: 12, opacity: pf * a },
        ),
        glowDot(prefetchX, rowY + 115, {
          radius: 8,
          color: COSMOS.amber,
          glow: 12,
          opacity: pf * a,
        }),
        txt('PREFETCHED = 4', prefetchX, rowY + 158, 28, COSMOS.amber, 'mono')
          .glow(6, COSMOS.amber)
          .opacity(pf * a),
      );
    }

    // Beat 1: Restored suffix [1, 2, 3, 4] + shard byte digest check
    if (pf < 0.1) {
      const sfOp = (0.48 + 0.52 * sf) * a;
      const mfOp = (0.48 + 0.52 * mf) * a;
      nodes.push(
        glassCell(250, 145, 960, 96, sf > 0.3 ? COSMOS.emerald : '#344c54', {
          fill: '#0d2522',
          glow: sf > 0.3 ? 9 : 3,
          opacity: sfOp,
        }),
        txt(
          `Restored suffix [${RESTART_STATE.suffix.join(', ')}] joins [${RESTART_STATE.prefix.join(', ')}] with 0 gaps`,
          250,
          147,
          30,
          sf > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ).opacity(sfOp),
        txt(
          'Verify every referenced shard file against its SHA-256 digest (not just the manifest JSON)',
          0,
          355,
          30,
          mf > 0.3 ? COSMOS.cyan : COSMOS.muted,
          'sans',
        ).opacity(mfOp),
      );
    }

    // Beat 2: Compare Prefetch skip vs Seed replay vs Atomic restore
    if (pf >= 0.1) {
      const skOp = (0.48 + 0.52 * sk) * a;
      const rpOp = (0.48 + 0.52 * rp) * a;
      const rsOp = (0.48 + 0.52 * rs) * a;
      nodes.push(
        glassCell(-420, 175, 760, 108, sk > 0.3 ? COSMOS.amber : '#4c3f30', {
          fill: '#22170e',
          glow: sk > 0.3 ? 8 : 3,
          opacity: skOp,
        }),
        txt(
          `Prefetch cursor 4 SKIPS [${RESTART_STATE.skippedByReader.join(', ')}]`,
          -420,
          177,
          32,
          sk > 0.3 ? COSMOS.amber : COSMOS.muted,
          'mono',
        ).opacity(skOp),

        glassCell(420, 175, 760, 108, rp > 0.3 ? COSMOS.rose : '#4d3240', {
          fill: '#24101c',
          glow: rp > 0.3 ? 8 : 3,
          opacity: rpOp,
        }),
        txt(
          `Original seed REPEATS [${RESTART_STATE.repeatedBySeed.join(', ')}]`,
          420,
          177,
          32,
          rp > 0.3 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ).opacity(rpOp),

        txt(
          'Restore model + optimizer + LR schedule + consumed data cursor + RNG together',
          0,
          375,
          32,
          rs > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'sans',
        )
          .glow(rs > 0.3 ? 6 : 0, COSMOS.emerald)
          .opacity(rsOp),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live);
  runPhase(s, c, phase, 14);

  c.on('pt-restart-consistency-shuffle', () =>
    s.play(shuffleOn.to(1, { duration: remainDuration(c, 'pt-restart-consistency-shuffle', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-restart-consistency-suffix', () =>
    s.play(suffixOn.to(1, { duration: remainDuration(c, 'pt-restart-consistency-suffix', 0.6) })),
  );
  c.on('pt-restart-consistency-manifest', () =>
    s.play(
      manifestOn.to(1, { duration: remainDuration(c, 'pt-restart-consistency-manifest', 0.6) }),
    ),
  );

  c.on('pt-restart-consistency-prefetch', () =>
    s.play(
      prefetchOn.to(1, { duration: remainDuration(c, 'pt-restart-consistency-prefetch', 0.6) }),
    ),
  );
  c.after('pt-restart-consistency-skip', () =>
    s.play(skipOn.to(1, { duration: remainAfterDuration(c, 'pt-restart-consistency-skip', 0.45) })),
  );
  c.after('pt-restart-consistency-repeat', () =>
    s.play(
      repeatOn.to(1, { duration: remainAfterDuration(c, 'pt-restart-consistency-repeat', 0.45) }),
    ),
  );
  c.on('pt-restart-consistency-restore', () =>
    s.play(restoreOn.to(1, { duration: remainDuration(c, 'pt-restart-consistency-restore', 0.6) })),
  );
}
