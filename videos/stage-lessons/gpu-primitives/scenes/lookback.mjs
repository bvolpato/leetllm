// Scene 14: How far back does tile three have to read? Decoupled look-back walk, release/acquire, logical byte traffic.
import {
  COSMOS,
  LOOKBACK_OFFSET,
  LOOKBACK_RECORDS,
  LOOKBACK_RUNNING,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function lookback(s, c) {
  const showWalk = s.value(1);
  const showLegendA = s.value(0);
  const showLegendP = s.value(0);
  const walkStep = s.value(0); // 0 -> own 2, 1 -> 5, 2 -> 9, 3 -> 16
  const showOffset = s.value(0);

  const showPub = s.value(0);
  const pubState = s.value(0); // 1=wait X, 2=payload written, 3=release P, 4=acquire

  const showTraffic = s.value(0);
  const showExtraWork = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e620', '#6ee7b716');

  // Beat 0-1: Decoupled look-back backward probe
  const walkView = guardedDynamic(showWalk, (a) => {
    const step = walkStep.value;
    const stepsDone = Math.round(step);
    const off = showOffset.value;
    const xs = [-570, -190, 190, 570];
    const tags = ['P', 'A', 'A', 'Own'];
    const cols = [COSMOS.emerald, COSMOS.cyan, COSMOS.cyan, COSMOS.gold];

    const probeX = xs[3] - step * 380;

    const nodes = [
      heroTitle(['Decoupled', 'Look-Back Scan'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'SINGLE-PASS PREFIX · WALK LEFT UNTIL P',
      }).opacity(a),

      // Legend tags on upper right
      txt(
        'A = tile aggregate',
        855,
        -400,
        26,
        showLegendA.value > 0.5 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'right',
      ).opacity(a),
      txt(
        'P = full inclusive prefix',
        855,
        -354,
        26,
        showLegendP.value > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'right',
      ).opacity(a),
    ];

    LOOKBACK_RECORDS.forEach((v, i) => {
      const cx = xs[i];
      const visited = i >= 3 - stepsDone;
      const col = cols[i];
      nodes.push(
        txt(`TILE ${i}`, cx, -172, 26, visited ? col : COSMOS.muted, 'mono').opacity(a),
        glassCell(cx, -80, 276, 122, col, {
          fill: i === 0 ? '#0d2624' : i === 3 ? '#241c10' : '#0f1d34',
          glow: visited ? 11 : 4,
          opacity: a,
        }),
        txt(`${tags[i]}   ${v}`, cx, -80, 44, col, 'mono')
          .glow(visited ? 6 : 0, col)
          .opacity(a),
      );
      if (visited) {
        nodes.push(
          line([cx - 120, 6], [cx + 120, 6], { stroke: COSMOS.gold, width: 5 })
            .glow(8, COSMOS.gold)
            .opacity(a),
        );
      }
    });

    // Backward probe rail & glowing photon
    nodes.push(
      line([xs[0], 92], [xs[3], 92], { stroke: '#27365a', width: 4 }).opacity(a),
      line([probeX, 92], [xs[3], 92], { stroke: COSMOS.gold, width: 6 })
        .glow(10, COSMOS.gold)
        .opacity(a),
      glowDot(probeX, 92, {
        radius: 12,
        color: COSMOS.gold,
        opacity: a,
      }),
    );

    // Running accumulation equation
    const terms = LOOKBACK_RECORDS.slice(3 - stepsDone).join(' + ');
    const sumText =
      stepsDone === 0
        ? `Tile 3 starts with its own aggregate:  ${LOOKBACK_RECORDS[3]}`
        : `${terms}  =  ${LOOKBACK_RUNNING[stepsDone]}`;
    nodes.push(
      glassCell(0, 232, 1180, 108, stepsDone === 3 ? COSMOS.emerald : COSMOS.gold, {
        fill: stepsDone === 3 ? '#0d2624' : '#181612',
        glow: 10,
        opacity: a,
      }),
      txt(sumText, 0, 232, 46, stepsDone === 3 ? COSMOS.emerald : COSMOS.ink, 'mono')
        .glow(6, stepsDone === 3 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
    );

    // Bottom exclusive vs inclusive split
    const footCol = off > 0.5 ? COSMOS.emerald : COSMOS.cyan;
    const footMsg =
      off > 0.5
        ? `Exclusive offset = 16 − 2 = ${LOOKBACK_OFFSET}   ·   Inclusive prefix through tile 3 = ${LOOKBACK_RUNNING[3]}`
        : stepsDone === 3
          ? 'P covers every tile through tile 0 · stop walking left'
          : 'Walk left collecting A aggregates until the first completed P prefix';
    nodes.push(
      glassCell(0, 392, 1540, 82, footCol, { fill: '#101829', glow: 8, opacity: a }),
      txt(footMsg, 0, 392, 28, footCol, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Release / Acquire publication protocol
  const pubView = guardedDynamic(showPub, (a) => {
    const st = pubState.value;
    const written = st >= 1.5;
    const released = st >= 2.5;
    const acquired = st >= 3.5;

    const nodes = [
      heroTitle(['Safe Publication:', 'Release & Acquire'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.emerald,
        eyebrow: 'STATUS X (UNAVAILABLE) → RELEASE P → ACQUIRE',
      }).opacity(a),

      // Payload
      txt('1. PAYLOAD IN MEMORY', -560, -142, 26, COSMOS.blue, 'mono').opacity(a),
      glassCell(-560, -20, 340, 150, written ? COSMOS.blue : COSMOS.dim, {
        fill: written ? '#101d38' : '#0f1422',
        glow: written ? 9 : 0,
        opacity: a,
      }),
      txt(written ? '7' : '·', -560, -20, 66, written ? COSMOS.blue : COSMOS.dim, 'mono').opacity(
        a,
      ),

      // Status flag
      txt('2. STATUS FLAG', 0, -142, 26, released ? COSMOS.emerald : COSMOS.gold, 'mono').opacity(
        a,
      ),
      glassCell(0, -20, 340, 150, released ? COSMOS.emerald : COSMOS.rose, {
        fill: released ? '#0d2624' : '#26121c',
        glow: 10,
        opacity: a,
      }),
      txt(
        released ? 'P (release)' : 'X (wait)',
        0,
        -20,
        42,
        released ? COSMOS.emerald : COSMOS.rose,
        'mono',
      )
        .glow(7, released ? COSMOS.emerald : COSMOS.rose)
        .opacity(a),

      // Reader tile
      txt(
        '3. READER TILE',
        560,
        -142,
        26,
        acquired ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(a),
      glassCell(560, -20, 340, 150, acquired ? COSMOS.emerald : COSMOS.dim, {
        fill: acquired ? '#0d2624' : '#101524',
        glow: acquired ? 11 : 0,
        opacity: a,
      }),
      txt(
        acquired ? 'reads 7' : 'waiting',
        560,
        -20,
        42,
        acquired ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    if (released) {
      nodes.push(
        glowingArc([-375, -20], [-185, -20], 0, {
          color: COSMOS.cyan,
          width: 4.5,
          opacity: a,
          core: false,
        }),
      );
    }
    if (acquired) {
      nodes.push(
        glowingArc([185, -20], [375, -20], 0, {
          color: COSMOS.emerald,
          width: 4.5,
          opacity: a,
          core: false,
        }),
      );
    }

    const msg = acquired
      ? 'Acquire observes P → payload 7 is guaranteed visible · scheduler must let earlier tiles run'
      : released
        ? 'Writer publishes status P with release ordering after storing payload'
        : written
          ? 'Payload stored in memory, status is still X'
          : 'X means payload is unavailable · reader spins until status updates';

    nodes.push(
      glassCell(0, 290, 1540, 92, acquired ? COSMOS.emerald : COSMOS.gold, {
        fill: '#101829',
        glow: 9,
        opacity: a,
      }),
      txt(msg, 0, 290, 28, acquired ? COSMOS.emerald : COSMOS.gold, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  // Beat 3: Logical memory traffic (4 B input + 8 B output = 12 B)
  const trafficView = guardedDynamic(showTraffic, (a) => {
    const ext = showExtraWork.value;
    const nodes = [
      heroTitle(['Single-Pass', 'Useful Byte Traffic'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'NO SECOND FULL-ARRAY OFFSET PASS',
      }).opacity(a),
    ];

    for (let i = 0; i < 12; i++) {
      const cx = -660 + i * 120;
      const isRead = i < 4;
      const col = isRead ? COSMOS.blue : COSMOS.cyan;
      nodes.push(
        rect(96, 130, { fill: isRead ? '#13284d' : '#0f2c3c', stroke: col, width: 2.5, radius: 8 })
          .at(cx, -50)
          .glow(7, col)
          .opacity(a),
        txt(`B${i}`, cx, -50, 26, col, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt('1 int32 input  ·  4 bytes read', -480, 62, 30, COSMOS.blue, 'mono').opacity(a),
      txt('1 int64 output  ·  8 bytes written', 240, 62, 30, COSMOS.cyan, 'mono').opacity(a),

      glassCell(0, 200, 1020, 104, COSMOS.emerald, { fill: '#0d2624', glow: 10, opacity: a }),
      txt('4 + 8 = 12 useful bytes per item', 0, 200, 44, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(a),

      glassCell(0, 365, 1540, 86, COSMOS.gold, {
        fill: '#181611',
        glow: 8,
        opacity: Math.max(0.35, ext) * a,
      }),
      txt(
        'Metadata, setup & look-back retries add work · check CUB scan determinism option for FP',
        0,
        365,
        27,
        COSMOS.gold,
        'sans',
      ).opacity(Math.max(0.35, ext) * a),
    );

    return group(...nodes);
  });

  s.add(bgAura, walkView, pubView, trafficView);

  c.on('lookback-records', () => s.play(showLegendA.to(1, { duration: 0.35 })));
  c.on('lookback-prefix', () => s.play(showLegendP.to(1, { duration: 0.35 })));
  c.on('lookback-five', () => s.play(walkStep.to(1, { duration: 0.45 })));
  c.on('lookback-nine', () => s.play(walkStep.to(2, { duration: 0.45 })));
  c.after('lookback-sixteen', () => s.play(walkStep.to(3, { duration: 0.45 })));
  c.after('lookback-offset', () => s.play(showOffset.to(1, { duration: 0.4 })));

  c.on('lookback-wait', () => {
    swapViews(s, showWalk, showPub, 0.16, 0.22);
    s.play(pubState.to(1, { duration: 0.3 }));
  });
  c.on('lookback-write', () => s.play(pubState.to(2, { duration: 0.35 })));
  c.on('lookback-publish', () => s.play(pubState.to(3, { duration: 0.35 })));
  c.on('lookback-acquire', () => s.play(pubState.to(4, { duration: 0.35 })));

  c.on('lookback-traffic', () => swapViews(s, showPub, showTraffic, 0.16, 0.22));
  c.on('lookback-work', () =>
    s.play(showExtraWork.to(1, { duration: remainDuration(c, 'lookback-work', 0.45) })),
  );
}
