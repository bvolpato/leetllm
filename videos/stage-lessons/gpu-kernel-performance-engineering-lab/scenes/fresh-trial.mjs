// Scene 19: Which run would you make next?
// Beats 0-2: Transfer test at N=67, block (2,0) starting at col 64 (3 valid cols × 32 rows) ->
//   strict prediction hold before revealing 96 values loaded and 256 barrier arrivals ->
//   A[1,64]=131 -> shared[1,0] -> B[64,1] (index 4,289).
// Beats 3-5: Compound-edit experiment design (Baseline 32 / 32×8 = 100 vs Combined 33 / 32×16 = 94) ->
//   strict prediction hold before revealing middle trial (stride 33, block 32×8) -> next lab preview.
import {
  COSMOS,
  EDGE_67,
  EDGE_67_PAIR131,
  ROLE,
  aura,
  delay,
  dot,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function freshTrial(s, c) {
  const showEdge = s.value(1);
  const showTrial = s.value(0);

  const premShow = s.value(0);
  const val96 = s.value(0);
  const bar256 = s.value(0);
  const val131 = s.value(0);
  const idx4289 = s.value(0);

  const geomShow = s.value(0);
  const compShow = s.value(0);
  const stride33 = s.value(0);
  const split32x8 = s.value(0);
  const decShow = s.value(0);
  const nextShow = s.value(0);
  const outroShow = s.value(0);

  const bgAura = aura(0, 10, 660, '#5ce1e61c', '#6ee7b718');
  const title = heroTitle(['Which Run Would', 'You Make Next?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'TRANSFER CHECK · SINGLE-VARIABLE DESIGN',
  });

  // Beats 0, 1, 2: N=67, block (2,0), cols 64..66 valid (3 × 32 = 96), 256 threads arrive
  const edgeView = guardedDynamic(showEdge, (a) => {
    const v96 = val96.value > 0.05;
    const b256 = bar256.value > 0.05;
    const v131 = val131.value > 0.3;
    const i4289 = idx4289.value > 0.3;

    const nodes = [
      txt(
        'N = 67 · BLOCK (2, 0) · TILE STARTS AT COLUMN 64',
        180,
        -355,
        26,
        ROLE.input,
        'mono',
      ).opacity(a),

      // Left: 32x32 tile visualization highlighting 3 valid columns (64, 65, 66)
      txt('INPUT TILE (32 ROWS × 3 VALID COLS)', -480, -210, 26, ROLE.input, 'mono').opacity(a),
      glassCell(-480, 10, 416, 360, premShow.value > 0.3 ? ROLE.input : COSMOS.rule, {
        fill: '#0c1324',
        glow: 4,
        opacity: a,
      }),
      // Valid 3-column strip on left side of tile (wide enough for 26px "64..66" with generous padding)
      rect(132, 332, { fill: ROLE.input, stroke: ROLE.output, width: 2, radius: 4 })
        .at(-610, 10)
        .opacity(0.65 * a),
      txt('64..66', -610, 10, 26, COSMOS.ink, 'mono').opacity(a),
      txt('cols 67..95', -405, -10, 28, COSMOS.dim, 'mono').opacity(a),
      txt('outside N = 67', -405, 34, 26, COSMOS.dim, 'sans').opacity(a),
    ];

    if (v131) {
      nodes.push(
        glowDot(-640, -125, { radius: 10, color: ROLE.gold, glow: 14, opacity: a }),
        txt('A[1, 64] = 131', -405, -120, 28, ROLE.gold, 'mono').glow(6, ROLE.gold).opacity(a),
      );
    }

    // Right: 32 x 8 thread block grid
    nodes.push(txt('BLOCK 32 × 8 THREADS', 375, -210, 26, ROLE.output, 'mono').opacity(a));
    for (let ty = 0; ty < 8; ty++) {
      for (let tx = 0; tx < 32; tx++) {
        const isLoader = tx < 3;
        const col = b256 ? ROLE.good : v96 && isLoader ? ROLE.input : COSMOS.rule;
        nodes.push(
          dot(6.2, col)
            .at(45 + tx * 21.5, -132 + ty * 40)
            .opacity(a),
        );
      }
    }

    nodes.push(
      txt(
        b256
          ? `${EDGE_67.barrierArrivals} / 256 threads arrive at __syncthreads()`
          : v96
            ? '24 loading threads × 4 passes = 96 loads'
            : 'How many threads reach the barrier?',
        375,
        215,
        28,
        b256 ? ROLE.good : v96 ? ROLE.input : ROLE.gold,
        'mono',
      ).opacity(a),
    );

    // Bottom prediction / answer readout (strict withholding!)
    let bottom = 'How many values get loaded? How many threads reach the barrier?';
    let bottomCol = ROLE.gold;
    if (i4289) {
      bottom = `A[1, 64] = ${EDGE_67_PAIR131.producer.value} → shared[1, 0] → B[64, 1] · output index 64 × 67 + 1 = ${EDGE_67_PAIR131.consumer.index}`;
      bottomCol = ROLE.good;
    } else if (v131) {
      bottom = `A[1, 64] = ${EDGE_67_PAIR131.producer.value} · Warp 1 writes shared[1, 0] → Warp 0 stores B[64, 1]`;
      bottomCol = ROLE.gold;
    } else if (v96 && b256) {
      bottom = `${EDGE_67.producers.length} values loaded (32 × 3) · all ${EDGE_67.barrierArrivals} threads hit the barrier`;
      bottomCol = ROLE.good;
    } else if (v96) {
      bottom = `${EDGE_67.producers.length} values loaded (32 rows × 3 valid columns)`;
      bottomCol = ROLE.good;
    }

    nodes.push(txt(bottom, 0, 325, 29, bottomCol, 'mono').glow(6, bottomCol).opacity(a));
    return group(...nodes);
  });

  // Beats 3, 4, 5: Single-variable experiment design (Baseline | Padding alone | Combined edit)
  const trialView = guardedDynamic(showTrial, (a) => {
    const gm = geomShow.value > 0.3;
    const cm = compShow.value > 0.3;
    const s33 = stride33.value > 0.05;
    const sp8 = split32x8.value > 0.05;
    const dc = decShow.value > 0.3;
    const nx = nextShow.value > 0.3;
    const out = outroShow.value > 0.3;

    const nodes = [
      txt(
        'HYPOTHETICAL TRIAL · RELATIVE TIME (BASELINE = 100)',
        0,
        -230,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),

      // Left: Baseline
      glassCell(-605, 15, 420, 350, ROLE.input, { fill: '#0f1c36', glow: 6, opacity: a }),
      txt('BASELINE', -605, -108, 34, ROLE.input, 'mono').opacity(a),
      txt('stride 32 words', -605, -34, 30, COSMOS.ink, 'mono').opacity(a),
      txt('block 32 × 8', -605, 26, 30, ROLE.output, 'mono').opacity(a),
      txt('time = 100', -605, 112, 42, COSMOS.ink, 'mono').opacity(a),

      // Middle: Controlled single-variable step (strictly withheld until stride33 + split32x8!)
      glassCell(0, 15, 420, 350, s33 ? ROLE.good : ROLE.gold, {
        fill: s33 ? '#0e2823' : '#241d10',
        dash: s33 ? undefined : [8, 6],
        glow: nx ? 12 : 7,
        opacity: a,
      }),
      txt(
        s33 ? 'PADDING ALONE' : 'MISSING MIDDLE',
        0,
        -108,
        32,
        s33 ? ROLE.good : ROLE.gold,
        'mono',
      ).opacity(a),
      txt(
        s33 ? 'stride 33 words' : 'stride = ?',
        0,
        -34,
        30,
        s33 ? ROLE.good : ROLE.gold,
        'mono',
      ).opacity(a),
      txt(
        sp8 ? 'block 32 × 8' : 'block = ?',
        0,
        26,
        30,
        sp8 ? ROLE.output : ROLE.gold,
        'mono',
      ).opacity(a),
      txt(
        nx ? 'RUN NEXT' : s33 ? 'Measure first' : '?',
        0,
        112,
        42,
        s33 ? ROLE.good : ROLE.gold,
        'mono',
      ).opacity(a),

      // Right: Combined edit
      glassCell(605, 15, 420, 350, gm ? ROLE.warn : COSMOS.rule, {
        fill: gm ? '#291c12' : '#0c1220',
        glow: gm ? 7 : 1,
        opacity: a,
      }),
      txt('COMBINED EDIT', 605, -108, 34, gm ? ROLE.warn : COSMOS.muted, 'mono').opacity(a),
      txt(gm ? 'stride 33 words' : '...', 605, -34, 30, COSMOS.ink, 'mono').opacity(a),
      txt(gm ? 'block 32 × 16' : '...', 605, 26, 30, ROLE.warn, 'mono').opacity(a),
      txt(cm ? 'time = 94' : '...', 605, 112, 42, cm ? ROLE.warn : COSMOS.dim, 'mono').opacity(a),
    ];

    if (sp8) {
      nodes.push(
        glowingArc([-380, -35], [-225, -35], -35, { color: ROLE.good, width: 4, opacity: a }),
        txt('+pad', -302, -96, 26, ROLE.good, 'mono').opacity(a),
      );
    }
    if (dc) {
      nodes.push(
        glowingArc([225, 25], [380, 25], -35, { color: ROLE.output, width: 4, opacity: a }),
        txt('2× rows', 302, -38, 26, ROLE.output, 'mono').opacity(a),
      );
    }

    let prompt = 'To test padding first, which stride and block belong in the middle?';
    let promptCol = ROLE.gold;
    if (out) {
      prompt = 'Next lab: 8-value warp reductions (1 sum) and prefix scans (running totals)';
      promptCol = ROLE.output;
    } else if (nx) {
      prompt = 'Run stride 33 + block 32 × 8 next · check bits, races, and repeated rounds';
      promptCol = ROLE.good;
    } else if (dc) {
      prompt = 'Hold stride 33 fixed · compare middle → right to isolate block rows';
      promptCol = ROLE.output;
    } else if (sp8) {
      prompt = 'Compare left → middle to isolate padding at 32 × 8';
      promptCol = ROLE.good;
    } else if (s33) {
      prompt = 'Stride 33 · which block shape stays fixed?';
      promptCol = ROLE.gold;
    }

    nodes.push(txt(prompt, 0, 325, 30, promptCol, 'sans').glow(5, promptCol).opacity(a));
    return group(...nodes);
  });

  s.add(bgAura, title, edgeView, trialView);

  c.on('gpu-fresh-trial-premises', () =>
    s.play(premShow.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-premises', 0.45) })),
  );
  c.after('gpu-fresh-trial-values', () =>
    s.play(val96.to(1, { duration: remainAfterDuration(c, 'gpu-fresh-trial-values', 0.45) })),
  );
  c.after('gpu-fresh-trial-barrier', () =>
    s.play(bar256.to(1, { duration: remainAfterDuration(c, 'gpu-fresh-trial-barrier', 0.45) })),
  );
  c.on('gpu-fresh-trial-value', () =>
    s.play(val131.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-value', 0.45) })),
  );
  c.on('gpu-fresh-trial-index', () =>
    s.play(idx4289.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-index', 0.45) })),
  );

  c.onBeat(3, () =>
    s.play(
      par(showEdge.to(0, { duration: 0.18 }), delay(showTrial.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.on('gpu-fresh-trial-geometry', () =>
    s.play(geomShow.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-geometry', 0.45) })),
  );
  c.on('gpu-fresh-trial-compound', () =>
    s.play(compShow.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-compound', 0.45) })),
  );
  c.after('gpu-fresh-trial-stride', () =>
    s.play(stride33.to(1, { duration: remainAfterDuration(c, 'gpu-fresh-trial-stride', 0.4) })),
  );
  c.after('gpu-fresh-trial-split', () =>
    s.play(split32x8.to(1, { duration: remainAfterDuration(c, 'gpu-fresh-trial-split', 0.4) })),
  );
  c.on('gpu-fresh-trial-decision', () =>
    s.play(decShow.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-decision', 0.4) })),
  );
  c.on('gpu-fresh-trial-next', () =>
    s.play(nextShow.to(1, { duration: remainDuration(c, 'gpu-fresh-trial-next', 0.4) })),
  );
  c.onBeat(5, () => s.play(outroShow.to(1, { duration: 0.4 })));
}
