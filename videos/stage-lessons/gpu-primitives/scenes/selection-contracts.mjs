// Scene 15: Which lane gets to write? Stream compaction scatter, segmented empty ranges, and argmax tie-break.
import {
  ARTICLE_INPUT,
  COMPACTED_POS,
  COSMOS,
  KEEP_ADDR,
  KEEP_FLAGS,
  SEGMENT_SUMS,
  aura,
  evalArc2d,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  rect,
  remainDuration,
  runPhase,
  signed,
  swapViews,
  txt,
} from '../parts.mjs';

const TIE_ROW = Object.freeze([6, -1, 6]);

export default function selectionContracts(s, c) {
  const phase = s.value(0);

  // Beat 0: Stream compaction
  const showCompact = s.value(1);
  const showFlags = s.value(0);
  const showAddrs = s.value(0);
  const highlightCollision = s.value(0);
  const revealSlot1 = s.value(0);
  const packAll = s.value(0);

  // Beat 1: Segmented reduction
  const showSegments = s.value(0);
  const showSegSums = s.value(0);

  // Beat 2: Argmax & tie-breaking
  const showArgmax = s.value(0);
  const revealMax = s.value(0);
  const showTie = s.value(0);
  const revealTieWinner = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e620', '#ffd16618');

  // Beat 0: Stream compaction
  const compactView = guardedDynamic(showCompact, (a) => {
    const p = phase.value;
    const fl = showFlags.value;
    const ad = showAddrs.value;
    const col1 = highlightCollision.value;
    const wr1 = revealSlot1.value;
    const pk = packAll.value;
    const u = (p * 0.9) % 1;

    const sx = (i) => -490 + i * 176;
    const ox = (i) => -314 + i * 176;
    const yPlay = -195;
    const yFlag = -75;
    const yAddr = 45;
    const yOut = 275;

    const nodes = [
      heroTitle(['Stream Compaction:', 'Exclusive Scan Scatter'], {
        x: -855,
        y: -420,
        size: 50,
        lineHeight: 60,
        accent: COSMOS.gold,
        eyebrow: 'KEEP POSITIVE PLAYS IN ORDER · SEPARATE BUFFER',
      }).opacity(a),

      txt('PLAY', -845, yPlay, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('KEEP FLAG', -845, yFlag, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('ADDRESS', -845, yAddr, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      txt('OUTPUT', -845, yOut, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
    ];

    ARTICLE_INPUT.forEach((v, i) => {
      const cx = sx(i);
      const isColl = col1 > 0.5 && (i === 1 || i === 2);
      const col = isColl ? (i === 2 ? COSMOS.gold : COSMOS.rose) : COSMOS.blue;
      nodes.push(
        glassCell(cx, yPlay, 138, 72, col, { fill: '#101d38', glow: isColl ? 9 : 3, opacity: a }),
        txt(signed(v), cx, yPlay, 34, col, 'mono').opacity(a),

        glassCell(cx, yFlag, 138, 72, fl > 0.5 ? col : COSMOS.dim, {
          fill: '#0f192d',
          glow: 3,
          opacity: a,
        }),
        txt(
          fl > 0.5 ? String(KEEP_FLAGS[i]) : '·',
          cx,
          yFlag,
          34,
          fl > 0.5 ? col : COSMOS.dim,
          'mono',
        ).opacity(a),

        glassCell(cx, yAddr, 138, 72, ad > 0.5 ? col : COSMOS.dim, {
          fill: isColl ? '#241a10' : '#0f192d',
          glow: isColl && ad > 0.5 ? 10 : 3,
          opacity: a,
        }),
        txt(
          ad > 0.5 ? String(KEEP_ADDR[i]) : '·',
          cx,
          yAddr,
          34,
          ad > 0.5 ? col : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    // Collision skip vs write arc
    if (wr1 > 0.02) {
      nodes.push(
        txt('skip (flag 0)', sx(1), 132, 26, COSMOS.rose, 'mono').opacity(wr1 * a),
        glowingArc([sx(2), yAddr + 42], [ox(1), yOut - 42], 0, {
          color: COSMOS.gold,
          width: 4.2,
          opacity: wr1 * a,
          core: false,
        }),
      );
      const [dx, dy] = evalArc2d([sx(2), yAddr + 42], [ox(1), yOut - 42], 0, u);
      nodes.push(glowDot(dx, dy, { radius: 7, color: COSMOS.gold, opacity: wr1 * a }));
    }

    // 6 Output slots
    COMPACTED_POS.forEach((v, i) => {
      const cx = ox(i);
      const vis = (wr1 > 0.5 && i === 1) || pk > (i + 0.5) / COMPACTED_POS.length;
      const col = i === 1 && wr1 > 0.5 && pk < 0.5 ? COSMOS.gold : COSMOS.emerald;
      nodes.push(
        glassCell(cx, yOut, 138, 76, vis ? col : COSMOS.dim, {
          fill: vis ? '#0d2624' : '#0f1422',
          glow: vis ? 9 : 0,
          opacity: a,
        }),
        txt(vis ? String(v) : '·', cx, yOut, 36, vis ? col : COSMOS.dim, 'mono').opacity(a),
        txt(`slot ${i}`, cx, yOut + 64, 26, COSMOS.muted, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        pk > 0.5
          ? 'All 6 positive plays packed in order [3, 4, 1, 5, 2, 6] into a separate buffer'
          : wr1 > 0.5
            ? 'Both −1 and +4 get address 1 · only +4 writes; −1 skips because flag = 0'
            : 'Exclusive scan of 0/1 keep flags gives each retained play its unique destination',
        0,
        396,
        28,
        pk > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 1: Segmented reduction [0, 4), [4, 4), [4, 8)
  const segmentView = guardedDynamic(showSegments, (a) => {
    const sums = showSegSums.value;
    const x0 = -630;
    const step = 180;

    const nodes = [
      heroTitle(['Segmented Reduction:', 'Empty Group Preserved'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: COSMOS.cyan,
        eyebrow: 'HALF-OPEN BOUNDARIES [0, 4, 4, 8]',
      }).opacity(a),

      // Bracket boxes over Segment 0 [0..3] and Segment 2 [4..7]
      rect(706, 124, { fill: null, stroke: COSMOS.blue, width: 3.5, radius: 12 })
        .at(-360, -105)
        .glow(8, COSMOS.blue)
        .opacity(a),
      rect(706, 124, { fill: null, stroke: COSMOS.cyan, width: 3.5, radius: 12 })
        .at(360, -105)
        .glow(8, COSMOS.cyan)
        .opacity(a),
      txt('EMPTY [4, 4)', 0, -206, 26, COSMOS.gold, 'mono').glow(6, COSMOS.gold).opacity(a),
    ];

    ARTICLE_INPUT.forEach((v, i) => {
      const cx = x0 + i * step;
      const col = i < 4 ? COSMOS.blue : COSMOS.cyan;
      nodes.push(
        glassCell(cx, -105, 138, 82, col, { fill: '#101d38', glow: 5, opacity: a }),
        txt(signed(v), cx, -105, 36, col, 'mono').opacity(a),
      );
    });

    const segSpecs = [
      { cx: -460, label: 'RANGE [0, 4)', val: `Sum = ${SEGMENT_SUMS[0]}`, col: COSMOS.blue },
      { cx: 0, label: 'RANGE [4, 4)', val: `Empty → ${SEGMENT_SUMS[1]}`, col: COSMOS.gold },
      { cx: 460, label: 'RANGE [4, 8)', val: `Sum = ${SEGMENT_SUMS[2]}`, col: COSMOS.cyan },
    ];
    segSpecs.forEach((seg, idx) => {
      const vis = idx === 1 ? 1 : sums;
      nodes.push(
        glassCell(seg.cx, 145, 390, 148, seg.col, {
          fill: idx === 1 ? '#241c10' : '#0f1c32',
          glow: 9,
          opacity: a,
        }),
        txt(seg.label, seg.cx, 108, 26, COSMOS.muted, 'mono').opacity(a),
        txt(vis > 0.5 ? seg.val : '·', seg.cx, 168, 42, seg.col, 'mono')
          .glow(6, seg.col)
          .opacity(a),
      );
    });

    nodes.push(
      glassCell(0, 360, 1500, 82, COSMOS.gold, { fill: '#181611', glow: 8, opacity: a }),
      txt(
        'Three group sums [7, 0, 4]  ·  Repeated boundary keeps its empty slot (identity 0)',
        0,
        360,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Argmax (value, index) & lowest-index tie-break
  const argmaxView = guardedDynamic(showArgmax, (a) => {
    const mx = revealMax.value;
    const tie = showTie.value > 0.5;
    const win = revealTieWinner.value > 0.5;
    const vals = tie ? TIE_ROW : ARTICLE_INPUT;

    const nodes = [
      heroTitle(
        tie
          ? ['Argmax Tie Rule:', 'Lowest Index Wins']
          : ['Argmax Reduction:', 'Value + Index Pair'],
        {
          x: -855,
          y: -420,
          size: 52,
          lineHeight: 62,
          accent: COSMOS.emerald,
          eyebrow: tie
            ? 'TIE FIXTURE [6, −1, 6] · DETERMINISTIC BREAK'
            : 'CARRY (VALUE, SOURCE INDEX) TOGETHER',
        },
      ).opacity(a),
    ];

    vals.forEach((v, i) => {
      const cx = tie ? -340 + i * 340 : -630 + i * 180;
      const isWinner = (!tie && mx > 0.5 && i === 7) || (tie && win && i === 0);
      const isTied = tie && !win && (i === 0 || i === 2);
      const col = isWinner ? COSMOS.emerald : isTied ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        txt(`idx ${i}`, cx, -172, 26, col, 'mono').opacity(a),
        glassCell(cx, -90, tie ? 240 : 142, 92, col, {
          fill: isWinner ? '#0d2824' : isTied ? '#241c10' : '#101d38',
          glow: isWinner || isTied ? 11 : 4,
          opacity: a,
        }),
        txt(number(v), cx, -90, 44, col, 'mono')
          .glow(isWinner ? 7 : 0, col)
          .opacity(a),
      );
    });

    const resCol = (tie ? win : mx > 0.5) ? COSMOS.emerald : COSMOS.gold;
    const resText = tie
      ? win
        ? 'Winner:  (value = 6,  index = 0)  ·  lowest index wins'
        : 'Two sixes at idx 0 and idx 2  ·  which index wins?'
      : mx > 0.5
        ? 'Winner:  (value = 6,  index = 7)'
        : 'Carry (value, source index) pairs through reduction';

    nodes.push(
      glassCell(0, 150, 1380, 132, resCol, {
        fill: (tie ? win : mx > 0.5) ? '#0d2624' : '#181611',
        glow: 11,
        opacity: a,
      }),
      txt(resText, 0, 150, 32, resCol, 'mono').glow(6, resCol).opacity(a),

      glassCell(0, 360, 1520, 82, COSMOS.cyan, { fill: '#0e1a2e', glow: 8, opacity: a }),
      txt(
        'State tie-breaking, empty-row, and NaN/Inf policies explicitly for any arg reduction',
        0,
        360,
        28,
        COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, compactView, segmentView, argmaxView);
  runPhase(s, c, phase, 14);

  c.on('selection-flags', () => s.play(showFlags.to(1, { duration: 0.4 })));
  c.on('selection-addresses', () => s.play(showAddrs.to(1, { duration: 0.4 })));
  c.on('selection-contracts-step-1', () => s.play(highlightCollision.to(1, { duration: 0.35 })));
  c.after('selection-result', () => s.play(revealSlot1.to(1, { duration: 0.45 })));
  c.on('selection-pack', () => s.play(packAll.to(1, { duration: 0.65 })));

  c.on('selection-empty', () => swapViews(s, showCompact, showSegments, 0.16, 0.22));
  c.on('selection-contracts-step-2', () => s.play(showSegSums.to(1, { duration: 0.45 })));

  c.on('selection-contracts-step-3', () => swapViews(s, showSegments, showArgmax, 0.16, 0.22));
  c.after('selection-max', () => s.play(revealMax.to(1, { duration: 0.4 })));
  c.on('selection-tie', () => s.play(showTie.to(1, { duration: 0.4 })));
  c.after('selection-winner', () =>
    s.play(revealTieWinner.to(1, { duration: remainDuration(c, 'selection-winner', 0.4) })),
  );
}
