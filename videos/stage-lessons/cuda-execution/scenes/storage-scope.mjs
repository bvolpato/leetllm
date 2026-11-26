// Scene 09: Which addresses share the work? Memory hierarchy scopes, word-7 math, unaligned 32-lane window, and stride-34 bank pairs.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TOKEN_VALUES,
  addressReceipt,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function storageScope(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1); // Beat 0: global -> shared tile -> registers
  const tileLoad = s.value(0);

  const showPart2 = s.value(0); // Beat 1: lane 7 -> segment 0 + 8-word shared tile -> bank 7
  const segSolved = s.value(0);
  const tile8Load = s.value(0);
  const bankSolved = s.value(0);

  const showPart3 = s.value(0); // Beat 2 & 3: 32-lane warp global window offset 0 -> 7 (4 -> 5 segments)
  const slideOffset = s.value(0);
  const offsetAnswer = s.value(0);

  const showPart4 = s.value(0); // Beat 4: stride 34 across 32 lanes -> 16 even banks, 2-way conflict
  const bankPairsProg = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['Memory Hierarchy,', 'Alignment, and Stride'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'GLOBAL · SHARED TILE · REGISTERS',
  });

  // Part 1: Global -> block-shared tile (4 words) -> thread-local registers
  const part1 = guardedDynamic(showPart1, (a) => {
    const ld = tileLoad.value;
    const nodes = [
      txt(
        'DEVICE GLOBAL MEMORY · REACHABLE BY ALL SMs',
        -855,
        -205,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
    ];
    TOKEN_VALUES.forEach((v, i) => {
      const cx = -735 + i * 210;
      const inTile = i < 4;
      nodes.push(
        glassCell(cx, -105, 174, 88, inTile ? COSMOS.cyan : COSMOS.blue, {
          fill: '#0f182e',
          glow: inTile ? 7 : 4,
          opacity: a,
        }),
        txt(`T${i} · ${v}`, cx, -102, 32, COSMOS.ink, 'mono').opacity(a),
      );
      if (inTile && ld > 0.05) {
        nodes.push(
          glowingArc([cx, -58], [-640 + i * 175, 130], 0, {
            color: COSMOS.cyan,
            width: 3,
            opacity: ld * a,
          }),
        );
      }
    });

    // Block-shared tile (left bottom)
    nodes.push(
      glassCell(-380, 215, 860, 200, COSMOS.cyan, { fill: '#0d202d', glow: 8, opacity: a }),
      txt('BLOCK-SHARED TILE (FAST ON-CHIP)', -380, 148, 26, COSMOS.cyan, 'mono').opacity(a),
    );
    TOKEN_VALUES.slice(0, 4).forEach((v, i) => {
      const cx = -640 + i * 175;
      const arrived = ld * 4 >= i + 0.5;
      nodes.push(
        glassCell(cx, 238, 144, 84, arrived ? COSMOS.emerald : COSMOS.rule, {
          fill: '#102430',
          glow: arrived ? 7 : 0,
          opacity: a,
        }),
        txt(
          arrived ? String(v) : '·',
          cx,
          240,
          36,
          arrived ? COSMOS.emerald : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    // Thread-local registers (right bottom)
    nodes.push(
      glassCell(495, 215, 690, 200, COSMOS.gold, { fill: '#1c1812', glow: 8, opacity: a }),
      txt('THREAD-LOCAL REGISTERS', 495, 148, 26, COSMOS.gold, 'mono').opacity(a),
      txt(
        ld > 0.6 ? 'running_sum = 3 + 1' : 'private per-thread state',
        495,
        235,
        34,
        ld > 0.6 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        'Hardware manages L1/L2 caches · kernel chooses which words enter shared memory',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Lane 7 word 7 -> byte 28 -> segment 0, then 8-word shared tile -> bank 7
  const part2 = guardedDynamic(showPart2, (a) => {
    const sg = segSolved.value;
    const t8 = tile8Load.value;
    const bk = bankSolved.value;
    const nodes = [
      txt('TRACE LANE 7 · WORD INDEX 7', -855, -205, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      // Left: global byte -> segment math
      glassCell(-440, 35, 790, 350, COSMOS.blue, { fill: '#0e172c', glow: 7, opacity: a }),
      txt('GLOBAL BYTE ADDRESS -> SEGMENT', -790, -90, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('word index = 7   (4 bytes / word)', -790, -15, 30, COSMOS.ink, 'mono', 'left').opacity(
        a,
      ),
      txt('byte address = 7 × 4 = 28', -790, 50, 32, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt(
        sg > 0.5 ? 'floor(28 / 32) = segment 0' : 'floor(28 / 32) = ?',
        -790,
        135,
        38,
        sg > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      )
        .glow(6, sg > 0.5 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),

      // Right: 8-word shared tile -> bank 7
      glassCell(440, 35, 790, 350, t8 > 0.5 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#0e1c2b',
        glow: t8 > 0.5 ? 7 : 0,
        opacity: a,
      }),
      txt(
        'NEW 8-WORD SHARED TILE (WORD 0 -> BANK 0)',
        90,
        -90,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    TOKEN_VALUES.forEach((v, i) => {
      const cx = 128 + i * 88;
      const isW7 = i === 7;
      const filled = t8 * 8 >= i + 0.4;
      const stroke = isW7 && bk > 0.5 ? COSMOS.gold : filled ? COSMOS.cyan : COSMOS.rule;
      nodes.push(
        txt(`w${i}`, cx, -24, 26, isW7 ? COSMOS.gold : COSMOS.muted, 'mono').opacity(a),
        glassCell(cx, 35, 76, 72, stroke, {
          fill: isW7 && bk > 0.5 ? '#241e12' : '#102030',
          glow: isW7 && bk > 0.5 ? 9 : 0,
          opacity: a,
        }),
        txt(filled ? String(v) : '·', cx, 38, 30, filled ? COSMOS.ink : COSMOS.dim, 'mono').opacity(
          a,
        ),
      );
    });

    nodes.push(
      txt(
        bk > 0.5 ? '7 mod 32 = bank 7' : 'word 7 -> bank ?',
        90,
        135,
        38,
        bk > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(6, COSMOS.gold)
        .opacity(a),
      txt(
        'Byte address counts bytes (÷ 32 for segment) · Word index counts 4-byte words (mod 32 for bank)',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 3: Full 32-lane warp window offset 0 -> offset 7 (4 segments -> 5 segments)
  const part3 = guardedDynamic(showPart3, (a) => {
    const off = Math.round(slideOffset.value * 7);
    const ans = offsetAnswer.value;
    const words = Array.from({ length: 32 }, (_, lane) => off + lane);
    const rec = addressReceipt(words);

    const nodes = [
      txt(
        off === 0
          ? 'FULL 32-LANE WARP · START AT BYTE 0 (PREDICT SHIFT TO BYTE 28)'
          : 'SHIFTED 7 WORDS RIGHT · START AT BYTE 28',
        -855,
        -205,
        26,
        off === 0 ? COSMOS.cyan : COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
    ];

    // 5 segments side-by-side, 8 word cells per segment
    for (let seg = 0; seg < 5; seg++) {
      const segLeft = -830 + seg * 338;
      const used = rec.segments.includes(seg);
      const segColor = used ? (seg === 4 ? COSMOS.gold : COSMOS.cyan) : COSMOS.dim;
      nodes.push(
        txt(`seg ${seg}`, segLeft + 150, -95, 28, segColor, 'mono').opacity(a),
        txt(
          `bytes ${seg * 32}..${seg * 32 + 31}`,
          segLeft + 150,
          95,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(a),
      );
      for (let w = 0; w < 8; w++) {
        const wordIdx = seg * 8 + w;
        const occ = wordIdx >= off && wordIdx < off + 32;
        const wx = segLeft + w * 38 + 18;
        nodes.push(
          rect(32, 92, {
            fill: occ ? (seg === 4 ? COSMOS.gold : COSMOS.cyan) : '#121829',
            stroke: occ ? '#ffffff' : '#263452',
            width: occ ? 1.4 : 1,
            radius: 4,
          })
            .at(wx, 0)
            .opacity((occ ? 0.92 : 0.6) * a),
        );
      }
    }

    // Readout row (withhold 5 segments / 160 B until offsetAnswer!)
    const segLabel =
      off === 0
        ? 'At byte 0: 4 segments · 128 B   |   At byte 28: ? segments'
        : ans > 0.5
          ? '5 segments × 32 B = 160 B fetched for 128 useful bytes'
          : `Sliding to byte ${rec.rows[0].address}..${rec.rows.at(-1).address}...`;
    const barCol = off === 0 ? COSMOS.gold : ans > 0.5 ? COSMOS.gold : COSMOS.cyan;

    nodes.push(
      glassCell(0, 275, 1660, 118, barCol, { fill: '#101627', glow: 8, opacity: a }),
      txt(
        `Span: byte ${rec.rows[0].address} to byte ${rec.rows.at(-1).address + 3}   ·   Useful: 128 B`,
        0,
        245,
        28,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(segLabel, 0, 298, 32, barCol, 'mono').glow(6, barCol).opacity(a),
    );
    return group(...nodes);
  });

  // Part 4: Stride 34 across 32 lanes -> 16 even banks each serve 2 distinct words (2-way conflict)
  const part4 = guardedDynamic(showPart4, (a) => {
    const count = Math.floor(bankPairsProg.value * 32 + 1e-6);
    const words = Array.from({ length: count }, (_, lane) => lane * 34);
    const rec = addressReceipt(words);
    const usedBanks = new Set(rec.rows.map((r) => r.bank));

    const nodes = [
      txt(
        'SHARED TILE · STRIDE 34 WORDS (LANE i -> WORD 34 × i)',
        -855,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let bank = 0; bank < 32; bank++) {
      const col = bank % 16;
      const row = Math.floor(bank / 16);
      const bx = -765 + col * 102;
      const by = -20 + row * 215;
      const entries = rec.rows.filter((r) => r.bank === bank);
      const isEven = bank % 2 === 0;
      nodes.push(
        rule(bx - 30, by, bx + 30, by, isEven ? COSMOS.cyan : COSMOS.rule, 3).opacity(a),
        txt(String(bank), bx, by + 38, 26, isEven ? COSMOS.ink : COSMOS.dim, 'mono').opacity(a),
      );
      entries.forEach((_, idx) => {
        nodes.push(
          glowDot(bx, by - 26 - idx * 36, {
            radius: 11,
            color: idx === 0 ? COSMOS.cyan : COSMOS.gold,
            glow: 9,
            opacity: a,
          }),
        );
      });
    }

    nodes.push(
      glassCell(0, 365, 1660, 96, COSMOS.gold, { fill: '#141728', glow: 8, opacity: a }),
      txt(
        `${usedBanks.size} / 32 even banks used   ·   odd banks empty   ·   ${rec.maxDistinctWords}-way conflict`,
        0,
        368,
        32,
        COSMOS.gold,
        'mono',
      )
        .glow(6, COSMOS.gold)
        .opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3, part4);
  runPhase(s, c, phase, 14);

  c.on('storage-working-set', () => s.play(tileLoad.to(1, { duration: 0.9 })));

  c.on('storage-segment', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.after('storage-segment', () =>
    s.play(segSolved.to(1, { duration: afterDuration(c, 'storage-segment', 0.35) })),
  );
  c.on('storage-eight-words', () => s.play(tile8Load.to(1, { duration: 0.7 })));
  c.after('storage-bank', () =>
    s.play(bankSolved.to(1, { duration: afterDuration(c, 'storage-bank', 0.35) })),
  );

  c.on('storage-stride', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('storage-offset', () => s.play(slideOffset.to(1, { duration: 0.85 })));
  c.after('storage-offset', () =>
    s.play(offsetAnswer.to(1, { duration: afterDuration(c, 'storage-offset', 0.4) })),
  );

  c.on('storage-bank-pairs', () => {
    s.play(
      par(
        showPart3.to(0, { duration: 0.2 }),
        delay(showPart4.to(1, { duration: 0.25 }), 0.22),
        delay(
          bankPairsProg.to(1, { duration: remainDuration(c, 'storage-bank-pairs', 1.4) }),
          0.25,
        ),
      ),
    );
  });
}
