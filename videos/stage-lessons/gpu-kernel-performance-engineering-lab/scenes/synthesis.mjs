// Scene 18: What did the extra column buy?
// Beat 0: Plot all 5 RTX 5070 Ti batch averages for naive, tiled, padded (4096x4096, 100 launches/batch) + medians.
// Beat 1-2: Zoom into paired (padded - tiled) microsecond deltas across rounds 1..5 ->
// strict prediction hold before revealing "3 faster, 2 slower · unresolved" at c.after('padding-verdict').
import {
  COSMOS,
  PADDED_DELTA_US,
  ROLE,
  TIMING_EVIDENCE,
  aura,
  delay,
  dot,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  par,
  recordedTiming,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const phase = s.value(0);
  const showOverview = s.value(1);
  const showPairs = s.value(0);

  const plotProg = s.value(0);
  const tileGap = s.value(0);
  const mediansShow = s.value(0);

  const pairProg = s.value(0);
  const verdictShow = s.value(0);
  const profileOpen = s.value(0);

  const bgAura = aura(0, 10, 660, '#5ce1e61c', '#ffd16618');
  const title = heroTitle(['What Did the Extra', 'Column Buy?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gold,
    eyebrow: 'RTX 5070 Ti · 4096 × 4096 · 5 ROUNDS',
  });

  const variants = [
    { id: 'naive', col: ROLE.input, y: -120 },
    { id: 'tiled', col: ROLE.output, y: 15 },
    { id: 'padded', col: ROLE.gold, y: 150 },
  ];

  // Beat 0: 5-round dot-strip distribution plot (0.17 .. 0.35 ms -> x in [-520, 480])
  const overviewView = guardedDynamic(showOverview, (a) => {
    const p = phase.value;
    const pp = plotProg.value;
    const tg = tileGap.value;
    const md = mediansShow.value;
    const mapX = (ms) => -520 + ((ms - 0.17) / 0.18) * 1000;
    const count = Math.min(5, Math.floor(pp * 5.99));
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const nodes = [
      txt(
        'AVERAGE MILLISECONDS PER LAUNCH (100 LAUNCHES / BATCH)',
        0,
        -235,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    for (const tick of [0.18, 0.22, 0.26, 0.3, 0.34]) {
      const tx = mapX(tick);
      nodes.push(
        line([tx, -175], [tx, 208], { stroke: COSMOS.rule, width: 2 }).opacity(a),
        txt(tick.toFixed(2), tx, 242, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    if (md > 0.3) {
      nodes.push(txt('MEDIAN', 685, -195, 26, COSMOS.muted, 'mono').opacity(md * a));
    }

    variants.forEach((v) => {
      nodes.push(
        txt(v.id, -710, v.y, 36, v.col, 'mono').opacity(a),
        line([-520, v.y], [480, v.y], { stroke: COSMOS.rule, width: 2.2 }).opacity(a),
      );
      const samples = recordedTiming[v.id].slice(0, count);
      samples.forEach((val, j) => {
        nodes.push(
          glowDot(mapX(val), v.y + (j - 2) * 14, {
            radius: 9,
            color: v.col,
            glow: 9,
            opacity: a,
          }),
        );
      });
      if (md > 0.3) {
        nodes.push(
          txt(`${TIMING_EVIDENCE.data[v.id].median.toFixed(3)} ms`, 685, v.y, 32, v.col, 'mono')
            .glow(6, v.col)
            .opacity(md * a),
        );
      }
    });

    // Clear separation bracket between slowest tiled (0.2023 ms) and fastest naive (0.3233 ms)
    if (tg > 0.3) {
      const x1 = mapX(TIMING_EVIDENCE.data.tiled.maximum);
      const x2 = mapX(TIMING_EVIDENCE.data.naive.minimum);
      nodes.push(
        glowingTrail(
          [
            [x1, -55],
            [x2, -55],
          ],
          { color: ROLE.good, width: 4.0, glow: 10 * pulse, opacity: tg * a },
        ),
        txt('clear win: tiled < naive', (x1 + x2) * 0.5, -88, 26, ROLE.good, 'mono').opacity(
          tg * a,
        ),
      );
    }

    nodes.push(
      txt(
        md > 0.3
          ? 'Tiled and padded medians sit within 0.001 ms · inspect paired rounds next'
          : tg > 0.3
            ? 'Even the slowest tiled batch beat the fastest naive batch'
            : 'Each dot = 1 unprofiled process average (alternating launch order)',
        0,
        345,
        28,
        tg > 0.3 ? ROLE.good : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beats 1 & 2: Paired within-round delta (padded - tiled in µs)
  const pairsView = guardedDynamic(showPairs, (a) => {
    const p = phase.value;
    const pr = pairProg.value;
    const vd = verdictShow.value;
    const po = profileOpen.value;
    const shown = Math.min(5, Math.floor(pr * 5.99));
    const mapUs = (us) => 340 + us * 58; // -6..+6 µs -> [-8, 688]
    const fasterCount = PADDED_DELTA_US.filter((d) => d < 0).length;
    const slowerCount = PADDED_DELTA_US.length - fasterCount;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const nodes = [
      txt('ROUND', -760, -212, 26, COSMOS.muted, 'mono').opacity(a),
      txt('TILED (ms)', -545, -212, 26, ROLE.output, 'mono').opacity(a),
      txt('PADDED (ms)', -275, -212, 26, ROLE.gold, 'mono').opacity(a),
      txt('PADDED MINUS TILED (µs)', 340, -212, 28, COSMOS.ink, 'mono').opacity(a),
    ];

    for (const tick of [-6, -3, 0, 3, 6]) {
      const tx = mapUs(tick);
      nodes.push(
        line([tx, -134], [tx, tick === 0 ? 195 : -122], {
          stroke: tick === 0 ? COSMOS.ink : COSMOS.muted,
          width: tick === 0 ? 3 : 2,
        }).opacity(a),
        txt(String(tick), tx, -166, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    for (let i = 0; i < 5; i++) {
      const y = -98 + i * 68;
      const d = PADDED_DELTA_US[i];
      nodes.push(
        txt(`R${i + 1}`, -760, y, 30, COSMOS.ink, 'mono').opacity(a),
        txt(recordedTiming.tiled[i].toFixed(5), -545, y, 28, ROLE.output, 'mono').opacity(a),
        txt(recordedTiming.padded[i].toFixed(5), -275, y, 28, ROLE.gold, 'mono').opacity(a),
      );
      if (i < shown) {
        const endX = mapUs(d);
        const col = d < 0 ? ROLE.good : ROLE.bad;
        nodes.push(
          glowingTrail(
            [
              [mapUs(0), y],
              [endX, y],
            ],
            { color: col, width: 5, glow: 8, opacity: a },
          ),
          dot(8, col).at(endX, y).opacity(a),
          txt(
            `${d > 0 ? '+' : ''}${d.toFixed(2)}`,
            endX + (d < 0 ? -18 : 18),
            y,
            26,
            col,
            'mono',
            d < 0 ? 'right' : 'left',
          ).opacity(a),
        );
      }
    }

    nodes.push(
      txt('← Padded faster', 110, 232, 26, ROLE.good, 'mono').opacity(a),
      txt('Padded slower →', 570, 232, 26, ROLE.bad, 'mono').opacity(a),
    );

    // Strict prediction withholding until c.after('padding-verdict')!
    const verdictTxt =
      vd > 0.05
        ? `Unresolved: padded faster in ${fasterCount} rounds, slower in ${slowerCount}`
        : 'Do these 5 rounds establish a speedup from padding?';
    const verdictCol = vd > 0.05 ? ROLE.warn : ROLE.gold;

    nodes.push(
      txt(verdictTxt, 0, 312, 34, verdictCol, 'mono')
        .glow(7 * pulse, verdictCol)
        .opacity(a),
      txt(
        po > 0.3
          ? 'Next step: permitted Nsight profile of this exact kernel & launch + raw logs'
          : pr > 0.85
            ? 'Round 1 (-1.40 µs) and Round 4 (+5.77 µs) move in opposite directions'
            : 'Left of zero: padded saved time · right of zero: tiled was faster',
        0,
        382,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, overviewView, pairsView);
  runPhase(s, c, phase, 16);

  c.on('plot-times', () =>
    s.play(plotProg.to(1, { duration: remainDuration(c, 'plot-times', 0.95) })),
  );
  c.on('tile-gap', () => s.play(tileGap.to(1, { duration: remainDuration(c, 'tile-gap', 0.45) })));
  c.on('medians', () =>
    s.play(mediansShow.to(1, { duration: remainDuration(c, 'medians', 0.45) })),
  );

  c.on('pair-rounds', () =>
    s.play(
      par(showOverview.to(0, { duration: 0.18 }), delay(showPairs.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.on('pair-marks', () =>
    s.play(pairProg.to(1, { duration: remainDuration(c, 'pair-marks', 1.1) })),
  );
  c.after('padding-verdict', () =>
    s.play(verdictShow.to(1, { duration: remainAfterDuration(c, 'padding-verdict', 0.45) })),
  );
  c.on('profile-open', () =>
    s.play(profileOpen.to(1, { duration: remainDuration(c, 'profile-open', 0.45) })),
  );
}
