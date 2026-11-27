// Scene 10: How does 65 reach the output?
// Beat 0: N=33 edge block (1,0) at col 32 -> 4 passes (0,8,16,24) -> 32 words loaded, 256/256 threads hit barrier.
// Beat 1: Zoom on 65: A[1,32] -> Warp 1 writes shared[1,0] -> Barrier -> Warp 0 reads -> B[32,1] (idx 1057).
// Beat 2: Full column pairing A[row, 32] -> B[32, row] (32/32 destinations checked).
import {
  COSMOS,
  EDGE_33,
  EDGE_33_PAIR65,
  EDGE_33_PAIRS,
  ROLE,
  aura,
  delay,
  dot,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function edgeOwnership(s, c) {
  const showColumn = s.value(1);
  const showHandoff = s.value(0);
  const showPairing = s.value(0);

  const blockShow = s.value(0);
  const offsetsProg = s.value(0);
  const writesProg = s.value(0);
  const barrierProg = s.value(0);

  const val65 = s.value(0);
  const warp1 = s.value(0);
  const prodWrite = s.value(0);
  const consRead = s.value(0);
  const outStore = s.value(0);

  const pairShow = s.value(0);
  const uniqueProg = s.value(0);
  const outsideShow = s.value(0);

  const bgAura = aura(0, 10, 650, '#60a5fa1a', '#5ce1e618');
  const title = heroTitle(['How Does 65 Reach', 'the Output?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gold,
    eyebrow: 'EDGE TILE · N = 33 · BLOCK (1, 0)',
  });

  // Beat 0: Column 32 load passes + 32x8 = 256 thread barrier grid
  const columnView = guardedDynamic(showColumn, (a) => {
    const off = offsetsProg.value;
    const wr = writesProg.value;
    const br = barrierProg.value;
    const activePass = Math.min(3, Math.floor(off * 4));
    const loadedWords = Math.min(32, Math.floor(wr * 32.99));
    const arrivedThreads = Math.min(256, Math.floor(br * 256.99));

    const nodes = [
      txt('INPUT COLUMN 32 (4 PASSES)', -470, -210, 28, ROLE.input, 'mono').opacity(a),
      txt('BLOCK 32 × 8 = 256 THREADS', 390, -210, 28, ROLE.output, 'mono').opacity(a),
    ];

    // Left: 4 pass bands (offsets 0, 8, 16, 24)
    [0, 8, 16, 24].forEach((offset, idx) => {
      const cy = -110 + idx * 102;
      const isNow = off > 0.05 && idx === activePass;
      const donePass = loadedWords >= (idx + 1) * 8;
      const col = donePass ? ROLE.input : isNow ? ROLE.gold : COSMOS.rule;
      nodes.push(
        glassCell(-470, cy, 640, 78, col, {
          fill: donePass ? '#112445' : isNow ? '#292112' : '#0c1324',
          glow: isNow || donePass ? 7 : 1,
          opacity: a,
        }),
        txt(`off ${offset} (r${offset}..${offset + 7})`, -765, cy, 28, col, 'mono', 'left').opacity(
          a,
        ),
        txt(
          donePass ? '8 words' : 'col 32',
          -175,
          cy,
          26,
          donePass ? ROLE.good : COSMOS.muted,
          'mono',
          'right',
        ).opacity(a),
      );
    });

    // Right: 32 x 8 thread barrier arrival matrix
    for (let ty = 0; ty < 8; ty++) {
      for (let tx = 0; tx < 32; tx++) {
        const idx = ty * 32 + tx;
        const arrived = idx < arrivedThreads;
        const isLoader = tx === 0;
        const col = arrived
          ? ROLE.good
          : isLoader && blockShow.value > 0.3
            ? ROLE.input
            : COSMOS.rule;
        nodes.push(
          dot(6.2, col)
            .at(45 + tx * 22.5, -135 + ty * 48)
            .opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        `${loadedWords} / 32 words loaded into shared col 0`,
        -470,
        295,
        28,
        ROLE.input,
        'mono',
      ).opacity(a),
      txt(
        `${arrivedThreads} / ${EDGE_33.barrierArrivals} threads reach __syncthreads()`,
        390,
        295,
        28,
        arrivedThreads === 256 ? ROLE.good : ROLE.output,
        'mono',
      )
        .glow(6, arrivedThreads === 256 ? ROLE.good : ROLE.output)
        .opacity(a),
      txt(
        'Threads with col ≥ 33 skip the load, then join the unconditional barrier',
        0,
        375,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 1: Zoomed handoff of value 65: A[1,32] -> Warp 1 -> shared[1,0] -> Warp 0 -> B[32,1]
  const handoffView = guardedDynamic(showHandoff, (a) => {
    const v65 = val65.value;
    const w1 = warp1.value;
    const pw = prodWrite.value;
    const cr = consRead.value;
    const os = outStore.value;

    const nodes = [
      txt('INTER-WARP HANDOFF FOR ROW 1, COLUMN 32', 0, -215, 28, ROLE.gold, 'mono').opacity(a),

      // Cell 1: Input A[1,32]
      txt('GLOBAL INPUT', -620, -125, 26, ROLE.input, 'mono').opacity(a),
      glassCell(-620, 15, 340, 210, v65 > 0.3 ? ROLE.input : COSMOS.rule, {
        fill: '#0f1e3a',
        glow: v65 > 0.3 ? 10 : 3,
        opacity: a,
      }),
      txt(
        v65 > 0.3 ? String(EDGE_33_PAIR65.producer.value) : '?',
        -620,
        15,
        84,
        ROLE.input,
        'mono',
      ).opacity(a),
      txt('A[1, 32]', -620, 165, 30, ROLE.input, 'mono').opacity(a),

      // Cell 2: Shared tile[1,0]
      txt('SHARED MEMORY', 0, -125, 26, ROLE.shared, 'mono').opacity(a),
      glassCell(0, 15, 340, 210, pw > 0.3 ? ROLE.shared : COSMOS.rule, {
        fill: '#281f10',
        glow: pw > 0.3 ? 10 : 3,
        opacity: a,
      }),
      txt(
        pw > 0.3 ? String(EDGE_33_PAIR65.producer.value) : '...',
        0,
        15,
        84,
        ROLE.shared,
        'mono',
      ).opacity(a),
      txt('shared[1, 0]', 0, 165, 30, ROLE.shared, 'mono').opacity(a),

      // Cell 3: Output B[32,1]
      txt('GLOBAL OUTPUT', 620, -125, 26, ROLE.output, 'mono').opacity(a),
      glassCell(620, 15, 340, 210, os > 0.3 ? ROLE.output : COSMOS.rule, {
        fill: '#0d2638',
        glow: os > 0.3 ? 10 : 3,
        opacity: a,
      }),
      txt(
        os > 0.3 ? String(EDGE_33_PAIR65.producer.value) : '...',
        620,
        15,
        84,
        ROLE.output,
        'mono',
      ).opacity(a),
      txt('B[32, 1]', 620, 165, 30, ROLE.output, 'mono').opacity(a),

      // Arc 1: Warp 1 writes
      glowingArc([-445, 15], [-175, 15], -55, {
        color: w1 > 0.3 || pw > 0.3 ? ROLE.gold : COSMOS.rule,
        width: 4,
        opacity: (0.35 + 0.65 * Math.max(w1, pw)) * a,
      }),
      txt('Warp 1 writes', -310, -76, 26, ROLE.gold, 'mono').opacity(a),
      txt('thread (0, 1)', -310, 82, 26, COSMOS.muted, 'mono').opacity(a),

      // Arc 2: Warp 0 reads
      glowingArc([175, 15], [445, 15], -55, {
        color: cr > 0.3 || os > 0.3 ? ROLE.good : COSMOS.rule,
        width: 4,
        opacity: (0.35 + 0.65 * Math.max(cr, os)) * a,
      }),
      txt('Warp 0 reads', 310, -76, 26, ROLE.good, 'mono').opacity(a),
      txt('thread (1, 0)', 310, 82, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    const msg =
      os > 0.3
        ? `Output linear index: 32 × 33 + 1 = ${EDGE_33_PAIR65.consumer.index}`
        : cr > 0.3
          ? 'Barrier → Warp 0 reads 65'
          : `Input linear index: 1 × 33 + 32 = ${EDGE_33_PAIR65.producer.value}`;
    nodes.push(txt(msg, 0, 310, 34, ROLE.gold, 'mono').glow(6, ROLE.gold).opacity(a));

    return group(...nodes);
  });

  // Beat 2: Full 32-element column -> row bijection check
  const pairingView = guardedDynamic(showPairing, (a) => {
    const up = uniqueProg.value;
    const checked = Math.min(32, Math.floor(up * 32.99));

    const nodes = [
      txt(
        'SWAPPED BOUNDS ADMIT THE EXACT MATCHING PRODUCER-CONSUMER PAIRS',
        0,
        -220,
        26,
        ROLE.output,
        'mono',
      ).opacity(a),
      txt('INPUT COLUMN 32 (rows 0..31)', -490, -145, 26, ROLE.input, 'mono').opacity(a),
      txt('OUTPUT ROW 32 (cols 0..31)', 390, -145, 26, ROLE.output, 'mono').opacity(a),
    ];

    // 32 vertical bars on left (input col 32) and 32 horizontal slots on right (output row 32)
    for (let i = 0; i < 32; i++) {
      const done = i < checked;
      nodes.push(
        rect(180, 9, {
          fill: done ? ROLE.output : ROLE.input,
          stroke: null,
          radius: 2,
        })
          .at(-490, -100 + i * 11.5)
          .opacity(a),
        rect(20, 120, {
          fill: done ? ROLE.output : '#182138',
          stroke: done ? ROLE.good : COSMOS.rule,
          width: 1.2,
          radius: 3,
        })
          .at(30 + i * 24, 55)
          .opacity(a),
      );
    }

    nodes.push(
      glowingArc([-380, 60], [10, 60], -55, {
        color: ROLE.gold,
        width: 3.6,
        opacity: (0.4 + 0.6 * pairShow.value) * a,
      }),
      txt('A[r, 32] → B[32, r]', -185, -32, 26, ROLE.gold, 'mono').opacity(a),
      txt(
        `${checked} / ${EDGE_33_PAIRS.length} unique destinations verified`,
        390,
        192,
        30,
        ROLE.good,
        'mono',
      )
        .glow(6, ROLE.good)
        .opacity(a),
      txt(
        'Bounds check guards loads & stores · barrier stays outside so all 256 threads arrive',
        0,
        355,
        28,
        outsideShow.value > 0.3 ? ROLE.good : COSMOS.ink,
        'sans',
      )
        .glow(outsideShow.value > 0.3 ? 6 : 0, ROLE.good)
        .opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, columnView, handoffView, pairingView);

  c.on('gpu-edge-ownership-block', () =>
    s.play(blockShow.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-block', 0.45) })),
  );
  c.on('gpu-edge-ownership-offsets', () =>
    s.play(offsetsProg.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-offsets', 0.85) })),
  );
  c.on('gpu-edge-ownership-writes', () =>
    s.play(writesProg.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-writes', 0.85) })),
  );
  c.on('gpu-edge-ownership-barrier', () =>
    s.play(barrierProg.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-barrier', 0.8) })),
  );

  c.onBeat(1, () =>
    s.play(
      par(showColumn.to(0, { duration: 0.18 }), delay(showHandoff.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.on('gpu-edge-ownership-value', () =>
    s.play(val65.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-value', 0.4) })),
  );
  c.on('gpu-edge-ownership-warp', () =>
    s.play(warp1.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-warp', 0.4) })),
  );
  c.on('gpu-edge-ownership-producer', () =>
    s.play(prodWrite.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-producer', 0.45) })),
  );
  c.on('gpu-edge-ownership-consumer', () =>
    s.play(consRead.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-consumer', 0.45) })),
  );
  c.on('gpu-edge-ownership-output', () =>
    s.play(outStore.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-output', 0.45) })),
  );

  c.onBeat(2, () =>
    s.play(
      par(
        showHandoff.to(0, { duration: 0.18 }),
        delay(showPairing.to(1, { duration: 0.24 }), 0.22),
      ),
    ),
  );
  c.on('gpu-edge-ownership-pair', () =>
    s.play(pairShow.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-pair', 0.45) })),
  );
  c.on('gpu-edge-ownership-unique', () =>
    s.play(uniqueProg.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-unique', 0.9) })),
  );
  c.on('gpu-edge-ownership-outside', () =>
    s.play(outsideShow.to(1, { duration: remainDuration(c, 'gpu-edge-ownership-outside', 0.45) })),
  );
}
