// Scene 14: shrink - How much room can packing recover?
// Act 1: 3 requests = 1,600 units vs 960 budget -> trim 3x24=72 -> 1,528 still too big -> reorder doesn't help.
// Act 2: Live 3D KV Tensor Shrinking (MHA 2,560 -> GQA 320 -> MQA 40 KiB, uptraining note, INT8 -> 160 KiB).
// Act 3: Approximate token eviction + 131K long context = 40 GiB.
// Act 4: Multi-GPU Tensor Parallelism (8 heads -> 4 each, aligned block IDs) + PagedAttention vs FlashAttention.
import { delay, gridPlane3d, group, line, par, rect } from 'vizmatic/stage';
import {
  BIG_QUERY_HEADS,
  COSMOS,
  HEADS,
  ROLE,
  SHRINK_NUMS,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  fadeInNodes,
  fadeOutNodes,
  fmt,
  glowBar,
  guardedDynamic,
  hideNodes,
  memCell,
  txt,
} from '../parts.mjs';

export default function shrink(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);
  const act4Vis = s.value(0);

  // Act 1 (7 cues)
  const b1 = s.value(0); // 1=full, 2=too-small, 3=paging-try, 4=no-slot, 5=smaller, 6=batching, 7=fewer
  // Act 2 (20 cues: 10 heads + 10 train/precision)
  const b2 = s.value(0); // 1..10
  const b2Train = s.value(0); // 1..10
  // Act 3 (7 cues)
  const b3 = s.value(0); // 1..7
  // Act 4 (10 cues: 6 TP + 4 Paged vs Flash)
  const b4Tp = s.value(0); // 1..6
  const b4Cmp = s.value(0); // 1..4

  // ── Act 1: 1,600 vs 960 Budget Overflow ────────────────────────────────────
  const act1Header = cinemaHeader('LIMITS OF PACKING', 'How much room can', 'packing recover?', {
    x: -860,
    y: -415,
    accent: ROLE.waste,
    size: 54,
  });
  const act1Aura = aura(0, 60, 620, '#ff6b8b24', '#fb923c14');

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const v = b1.value;
    const trimmed = v >= 4.5;
    const reordered = v >= 5.5;
    const nodes = [];

    const barLeft = -780;
    const scalePx = 0.92; // 1600 * 0.92 = 1472 px
    const budgetX = barLeft + SHRINK_NUMS.budgetUnits * scalePx;

    // Three stacked request bars side by side in one total bar (each 509 live + 24 tail = 533)
    const order = reordered
      ? [
          { lbl: 'Req C', col: ROLE.reqC, fill: '#0e2d25' },
          { lbl: 'Req A', col: ROLE.reqA, fill: '#102b38' },
          { lbl: 'Req B', col: ROLE.reqB, fill: '#1e1635' },
        ]
      : [
          { lbl: 'Req A', col: ROLE.reqA, fill: '#102b38' },
          { lbl: 'Req B', col: ROLE.reqB, fill: '#1e1635' },
          { lbl: 'Req C', col: ROLE.reqC, fill: '#0e2d25' },
        ];

    const liveW = (SHRINK_NUMS.liveUnits / 3) * scalePx;
    const tailW = SHRINK_NUMS.tailPerReq * scalePx;
    let curX = barLeft;
    const barY = -20;

    order.forEach((rq) => {
      nodes.push(
        rect(liveW - 4, 88, { fill: rq.fill, stroke: rq.col, width: 2.2, radius: 8 })
          .at(curX + liveW * 0.5, barY)
          .opacity(a),
        txt(`${rq.lbl} live`, curX + liveW * 0.5, barY, 26, rq.col, 'mono').opacity(a),
      );
      curX += liveW;
      if (!trimmed) {
        nodes.push(
          rect(tailW - 2, 88, {
            fill: v >= 3.5 ? '#361322' : '#1b1d30',
            stroke: v >= 2.5 ? ROLE.link : '#3a4a70',
            width: 2.0,
            radius: 4,
            dash: [4, 4],
          })
            .at(curX + tailW * 0.5, barY)
            .opacity(a),
        );
        curX += tailW;
      }
    });

    // Budget vertical line at 960 units!
    if (v >= 1.5) {
      nodes.push(
        line([budgetX, -135], [budgetX, 110], { stroke: ROLE.waste, width: 3.4, dash: [7, 6] })
          .glow(10, ROLE.waste)
          .opacity(a),
        txt(`BUDGET: ${SHRINK_NUMS.budgetUnits} units`, budgetX, -162, 28, ROLE.waste, 'mono')
          .glow(6, ROLE.waste)
          .opacity(a),
      );
    }

    // Live totals & findings cleanly below bar
    const totalNow = trimmed ? SHRINK_NUMS.liveUnits : SHRINK_NUMS.totalUnits;
    nodes.push(
      txt(
        `Total occupied: ${fmt(totalNow)} units  (exceeds ${SHRINK_NUMS.budgetUnits})`,
        0,
        158,
        32,
        ROLE.waste,
        'mono',
      )
        .glow(7, ROLE.waste)
        .opacity(a),
    );
    if (v >= 3.5 && v < 4.5) {
      nodes.push(
        txt(
          'Scan tails: only 24 empty units × 3 = 72 units',
          0,
          224,
          28,
          ROLE.link,
          'mono',
        ).opacity(a),
      );
    } else if (v >= 4.5 && v < 5.5) {
      nodes.push(
        txt(
          `Trimmed 72 empty -> ${fmt(SHRINK_NUMS.liveUnits)} live units still overflow!`,
          0,
          224,
          28,
          ROLE.link,
          'mono',
        ).opacity(a),
      );
    } else if (v >= 5.5 && v < 6.5) {
      nodes.push(
        txt(
          'Reordering requests leaves 1,528 live units unchanged',
          0,
          224,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    } else if (v >= 6.5) {
      nodes.push(
        txt('MUST STORE FEWER BYTES PER TOKEN', 0, 256, 36, ROLE.focus, 'mono')
          .glow(9, ROLE.focus)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // ── Act 2: Live 3D KV Tensor Shrinking - MHA -> GQA -> MQA -> INT8 ────────
  const act2Header = cinemaHeader(
    'SHRINK BYTES PER TOKEN',
    'Fewer KV heads',
    'and lower precision',
    {
      x: -860,
      y: -415,
      accent: ROLE.fresh,
      size: 54,
    },
  );
  const act2Aura = aura(320, 30, 620, '#6ee7b724', '#5ce1e61a');

  const tensorView = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.8,
    unit: 108,
    focus: [0, 0, 0.9],
  }).at(345, 25);

  tensorView.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.1,
      color: '#23385c',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  // 3D slabs representing MHA (full 64 heads), GQA (8 heads), MQA (1 head), INT8 (half thickness)
  const slabMHA = addBox3D(tensorView, -2.8, -1.65, 0.06, 5.6, 3.3, 1.85, ROLE.waste, ROLE.waste, {
    faceOpacity: 0.72,
    edgeWidth: 2.2,
    edgeGlow: 8,
  });
  const slabGQA = hideNodes(
    addBox3D(tensorView, -2.8, -1.65, 0.06, 1.9, 3.3, 1.85, ROLE.key, ROLE.key, {
      faceOpacity: 0.8,
      edgeWidth: 2.3,
      edgeGlow: 9,
    }),
  );
  const slabMQA = hideNodes(
    addBox3D(tensorView, -2.8, -1.65, 0.06, 0.52, 3.3, 1.85, ROLE.fresh, ROLE.fresh, {
      faceOpacity: 0.88,
      edgeWidth: 2.6,
      edgeGlow: 11,
    }),
  );
  const slabINT8 = hideNodes(
    addBox3D(tensorView, -2.8, -1.65, 0.06, 1.9, 3.3, 0.92, ROLE.focus, ROLE.focus, {
      faceOpacity: 0.86,
      edgeWidth: 2.6,
      edgeGlow: 11,
    }),
  );

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const v = b2.value;
    const tr = b2Train.value;
    const nodes = [
      txt('LIVE 3D KV TENSOR VOLUME (70B)', 345, -405, 26, COSMOS.muted, 'mono').opacity(a),
    ];

    // Left comparison bars for MHA / GQA / MQA / INT8
    const rows = [
      {
        show: v >= 4.5,
        lbl: `MHA (${BIG_QUERY_HEADS} KV heads):  ${fmt(SHRINK_NUMS.mhaKib)} KiB / tok`,
        frac: 1.0,
        col: ROLE.waste,
      },
      {
        show: v >= 6.5,
        lbl: `GQA (${HEADS} KV heads):   ${SHRINK_NUMS.gqaKib} KiB / tok  (8× smaller)`,
        frac: 0.16,
        col: ROLE.key,
      },
      {
        show: v >= 8.5,
        lbl: `MQA (1 KV head):    ${SHRINK_NUMS.mqaKib} KiB / tok  (64× smaller)`,
        frac: 0.05,
        col: ROLE.fresh,
      },
      {
        show: tr >= 8.5,
        lbl: `INT8 GQA (1 byte):  ${SHRINK_NUMS.int8GqaKib} KiB / tok  (2× smaller)`,
        frac: 0.09,
        col: ROLE.focus,
      },
    ];

    rows.forEach((r, idx) => {
      if (r.show) {
        const yy = -155 + idx * 108;
        nodes.push(
          txt(r.lbl, -855, yy, 26, r.col, 'mono', 'left').glow(5, r.col).opacity(a),
          glowBar(-855, yy + 44, 720, 28, r.frac, { fill: r.col, glow: 8, opacity: a }),
        );
      }
    });

    if (tr >= 0.5 && tr < 8.5) {
      const msg =
        tr >= 7.5
          ? 'Check task quality'
          : tr >= 5.5
            ? 'GQA converts well · MQA needs uptraining'
            : tr >= 3.5
              ? 'Train or convert + uptrain weights'
              : 'Not a serving toggle: weights change';
      nodes.push(txt(msg, 345, 396, 26, ROLE.link, 'sans').glow(5, ROLE.link).opacity(a));
    } else if (tr >= 8.5) {
      nodes.push(
        txt('INT8 halves raw bytes', 345, 396, 26, ROLE.focus, 'mono')
          .glow(6, ROLE.focus)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // ── Act 3: Approximate Token Eviction & 128K Long Context = 40 GiB ─────────
  const act3Header = cinemaHeader('LONG CONTEXT URGENCY', 'Evicting tokens', 'and 128K context', {
    x: -860,
    y: -415,
    accent: ROLE.link,
    size: 54,
  });
  const act3Aura = aura(0, 60, 620, '#fb923c22', '#ff6b8b16');

  const act3Dyn = guardedDynamic(act3Vis, (a) => {
    const v = b3.value;
    const nodes = [];

    // Token strip showing eviction of middle tokens & later query miss
    nodes.push(
      txt('APPROXIMATE TOKEN EVICTION', -855, -155, 26, ROLE.link, 'mono', 'left').opacity(a),
    );
    const toks = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
    toks.forEach((tk, idx) => {
      const cx = -740 + idx * 185;
      const dropped = v >= 1.5 && (idx === 3 || idx === 4 || idx === 5);
      const col = dropped ? ROLE.waste : ROLE.key;
      nodes.push(
        rect(152, 68, {
          fill: dropped ? '#2a1220' : '#102b38',
          stroke: col,
          width: 2.2,
          radius: 10,
          ...(dropped ? { dash: [6, 6] } : {}),
        })
          .at(cx, -66)
          .opacity(a * (dropped ? 0.45 : 1)),
        txt(dropped ? 'dropped' : tk, cx, -66, 26, col, 'mono').opacity(a * (dropped ? 0.6 : 1)),
      );
    });

    if (v >= 2.5) {
      nodes.push(
        txt('Approximate: a later token may need what was dropped', 0, 36, 28, ROLE.link, 'sans')
          .glow(6, ROLE.link)
          .opacity(a),
      );
    }

    // 131,072 tokens -> 40 GiB skeleton visible from start of Act 3, ignites vividly on `long`..`reach`
    const lA = a * (v >= 4.5 ? 1 : 0.44);
    nodes.push(
      dashedRule(-855, 118, 855, 118, '#283657', 0.65 * a),
      txt('LLAMA 3.1 70B  ·  LONG CONTEXT', -855, 186, 26, ROLE.waste, 'mono', 'left').opacity(lA),
      glowBar(-855, 250, 1710, 48, v >= 6.5 ? 1.0 : v >= 4.5 ? 0.45 : 0.12, {
        fill: ROLE.waste,
        glow: v >= 4.5 ? 11 : 0,
        opacity: lA,
      }),
      txt(
        v >= 6.5
          ? `${fmt(SHRINK_NUMS.longContextTokens)} tokens  ->  ${SHRINK_NUMS.longContextGib} GiB for ONE conversation`
          : `${fmt(SHRINK_NUMS.longContextTokens)} token context scale`,
        0,
        342,
        34,
        v >= 6.5 ? ROLE.focus : COSMOS.muted,
        'mono',
      )
        .glow(v >= 6.5 ? 8 : 0, ROLE.focus)
        .opacity(lA),
    );

    return group(...nodes);
  });

  // ── Act 4: Multi-GPU Tensor Parallelism + PagedAttention vs FlashAttention ─
  const act4Header = cinemaHeader(
    'SCALING & KERNEL ROLES',
    'Multi-GPU sharding',
    'and FlashAttention',
    {
      x: -860,
      y: -415,
      accent: ROLE.key,
      size: 54,
    },
  );
  const act4Aura = group(aura(-420, 40, 440, '#5ce1e61e'), aura(420, 40, 440, '#a78bfa20'));

  const act4Dyn = guardedDynamic(act4Vis, (a) => {
    const tp = b4Tp.value;
    const cm = b4Cmp.value;
    const nodes = [];

    // Left: 2 GPUs splitting 8 KV heads -> 4 each with aligned physical block IDs
    nodes.push(
      txt('TENSOR PARALLELISM (2 GPUs)', -455, -182, 26, ROLE.key, 'mono').opacity(a),
      memCell(tp >= 1.5 ? 'GPU 0: KV Heads 0..3' : 'GPU 0', -455, -72, {
        w: 580,
        h: 82,
        fill: '#102b38',
        stroke: ROLE.reqA,
        textColor: ROLE.reqA,
        glow: 8,
        opacity: a,
      }),
      memCell(tp >= 1.5 ? 'GPU 1: KV Heads 4..7' : 'GPU 1', -455, 58, {
        w: 580,
        h: 82,
        fill: '#1e1635',
        stroke: ROLE.reqB,
        textColor: ROLE.reqB,
        glow: 8,
        opacity: a,
      }),
    );
    if (tp >= 2.5) {
      nodes.push(
        txt(
          tp >= 3.5
            ? 'Aligned logical & physical IDs: [#2, #7, #11]'
            : 'Logical blocks stay aligned across GPUs',
          -455,
          164,
          26,
          ROLE.focus,
          'mono',
        ).opacity(a),
      );
    }
    if (tp >= 5.5) {
      nodes.push(
        txt(
          'Check whether your runtime shards or replicates KV',
          -455,
          232,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    }

    // Right: Keep Two Names Apart skeleton always present in Act 4, lights up vividly on `names`..`both`
    const cA = a * (cm >= 0.5 ? Math.min(1, cm) : 0.44);
    nodes.push(
      dashedRule(0, -200, 0, 340, '#283657', 0.65 * a),
      txt('KEEP TWO NAMES APART', 455, -182, 26, ROLE.fresh, 'mono').opacity(cA),
      memCell('PagedAttention: WHERE cache lives', 455, -72, {
        w: 690,
        h: 82,
        fill: cm >= 1.5 ? '#0e2d25' : '#0f1628',
        stroke: cm >= 1.5 ? ROLE.fresh : '#2d3f64',
        textColor: cm >= 1.5 ? ROLE.fresh : COSMOS.dim,
        glow: cm >= 1.5 ? 9 : 0,
        opacity: cm >= 1.5 ? a : cA,
      }),
      memCell('FlashAttention: IO-aware kernel', 455, 58, {
        w: 690,
        h: 82,
        fill: cm >= 2.5 ? '#132846' : '#0f1628',
        stroke: cm >= 2.5 ? ROLE.prefill : '#2d3f64',
        textColor: cm >= 2.5 ? ROLE.prefill : COSMOS.dim,
        glow: cm >= 2.5 ? 9 : 0,
        opacity: cm >= 2.5 ? a : cA,
      }),
    );
    if (cm >= 3.5) {
      nodes.push(
        txt('Different problems -> serving stacks use BOTH', 455, 186, 28, ROLE.focus, 'mono')
          .glow(7, ROLE.focus)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(act1Aura, act1Header, act1Dyn, act2Dyn, act3Dyn, act4Dyn);

  // Beat 0 (7 cues)
  const b0Cues = [
    ['full', 1],
    ['too-small', 2],
    ['paging-try', 3],
    ['no-slot', 4],
    ['smaller', 5],
    ['batching', 6],
    ['fewer', 7],
  ];
  for (const [id, v] of b0Cues) {
    c.on(id, () => {
      s.play(b1.to(v, { duration: clampDur(c, c.cue(id).start, 0.25) }));
    });
  }

  // Act 2 swap at `formula`
  c.swap('formula', [act1Aura, act1Header], [act2Aura, tensorView, act2Header]);
  c.on('formula', () => {
    const t = c.cue('formula').start;
    const posT = c.cue('positions').start;
    const orbDur = Math.max(1.5, posT - t - 0.5);
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        b2.to(1, { duration: 0.25 }),
        tensorView.orbit({ theta: -0.32, phi: 0.92 }, { duration: orbDur }),
      ),
    );
  });

  const b1Cues = [
    ['number', 2],
    ['sixty-four', 3],
    ['eight-kv', 4],
    ['own', 5],
    ['mha', 6],
    ['gqa', 7],
    ['three-twenty', 8],
    ['mqa', 9],
    ['forty', 10],
  ];
  for (const [id, v] of b1Cues) {
    c.on(id, () => {
      const t = c.cue(id).start;
      s.play(b2.to(v, { duration: clampDur(c, t, 0.25) }));
      if (id === 'gqa') {
        fadeOutNodes(s, c, t, slabMHA, 0.25);
        fadeInNodes(s, c, t, slabGQA, 0.35);
      } else if (id === 'mqa') {
        fadeOutNodes(s, c, t, slabGQA, 0.25);
        fadeInNodes(s, c, t, slabMQA, 0.35);
      }
    });
  }

  const b2Cues = [
    ['switch', 1],
    ['weights', 2],
    ['train', 3],
    ['convert', 4],
    ['uptrain', 5],
    ['tests', 6],
    ['multi-needs', 7],
    ['quality', 8],
    ['precision', 9],
    ['half', 10],
  ];
  for (const [id, v] of b2Cues) {
    c.on(id, () => {
      const t = c.cue(id).start;
      s.play(b2Train.to(v, { duration: clampDur(c, t, 0.25) }));
      if (id === 'half') {
        fadeOutNodes(s, c, t, slabMQA, 0.25);
        fadeInNodes(s, c, t, slabINT8, 0.35);
      }
    });
  }

  // Act 3 swap at `positions`
  c.swap('positions', [act2Aura, tensorView, act2Header], [act3Aura, act3Header]);
  c.on('positions', () => {
    const t = c.cue('positions').start;
    s.play(
      par(
        act2Vis.to(0, { duration: 0.16 }),
        delay(act3Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        b3.to(1, { duration: 0.25 }),
      ),
    );
  });
  const b3Cues = [
    ['evicting', 2],
    ['approx', 3],
    ['later', 4],
    ['long', 5],
    ['at-131', 6],
    ['reach', 7],
  ];
  for (const [id, v] of b3Cues) {
    c.on(id, () => {
      s.play(b3.to(v, { duration: clampDur(c, c.cue(id).start, 0.25) }));
    });
  }

  // Act 4 swap at `split`
  c.swap('split', [act3Aura, act3Header], [act4Aura, act4Header]);
  c.on('split', () => {
    const t = c.cue('split').start;
    s.play(
      par(
        act3Vis.to(0, { duration: 0.16 }),
        delay(act4Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        b4Tp.to(1, { duration: 0.25 }),
      ),
    );
  });
  const b4TpCues = [
    ['four-each', 2],
    ['aligned', 3],
    ['same-numbers', 4],
    ['own-share', 5],
    ['replicate', 6],
  ];
  for (const [id, v] of b4TpCues) {
    c.on(id, () => {
      s.play(b4Tp.to(v, { duration: clampDur(c, c.cue(id).start, 0.25) }));
    });
  }
  const b4CmpCues = [
    ['names', 1],
    ['paged', 2],
    ['flash', 3],
    ['both', 4],
  ];
  for (const [id, v] of b4CmpCues) {
    c.on(id, () => {
      s.play(b4Cmp.to(v, { duration: clampDur(c, c.cue(id).start, 0.25) }));
    });
  }
}
