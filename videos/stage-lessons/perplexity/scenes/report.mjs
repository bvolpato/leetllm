// Scene 15: report: "A report carries the evidence behind its score"
// View 1 (Beat 0): Reproducible score circuit: 3.219 nats / 3 targets -> exp() -> 2.92
//   (revealed strictly AFTER report-recover) plus floating provenance metadata.
// View 2 (Beat 1): 5 luminous diagnostic signal rails (invalid counts, 0 targets, NaN,
//   real p=0 infinite loss, finite loss with exp overflow).
// View 3 (Beat 2): Source-clustered bootstrap sampling drawing whole source groups together.
// View 4 (Beat 3): Pairwise judge order-swap animation sliding Answer A & Answer B across
//   each other to check position bias against the source record (job 612 is queued).
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowRing,
  lumBar,
  playCue,
  ppl,
  swapVis,
  total,
} from '../parts.mjs';

export default function report(s, c) {
  const title = heroTitle(['A report carries the', 'evidence behind its score'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.observed,
  });

  const vLedger = s.value(1);
  const vRuntime = s.value(0);
  const vBootstrap = s.value(0);
  const vJudge = s.value(0);

  const ledgerFlow = s.value(0);
  const recoverPpl = s.value(0); // AFTER report-recover: reveals 2.92
  const diagWave = s.value(0); // illuminates 5 diagnostic rails
  const sampleDraws = s.value(0); // 0 -> 3 bootstrap draws
  const swapProgress = s.value(0); // 0 -> 1 swaps Answer A and Answer B positions!

  // VIEW 1: Reproducible score circuit
  const ledgerLayer = guardedDynamic(vLedger, (alpha) => {
    const nodes = [];
    const lf = ledgerFlow.value;
    const rp = recoverPpl.value;

    nodes.push(
      txt(
        '"The cat sat"  ->  on · the · mat',
        0,
        -245,
        32,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
      // Two input beacons: total loss & valid count
      lumBar(-390, -105, 520, 94, {
        color: ROLE.context,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt(
        `Total loss = ${fmt(total, 3)} nats`,
        -390,
        -105,
        34,
        ROLE.context,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(390, -105, 420, 94, {
        color: ROLE.good,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        radius: 12,
        opacity: alpha,
      }),
      txt('Valid targets = 3', 390, -105, 34, ROLE.good, 'mono', 'center').opacity(alpha),

      // Converging circuit beams into exp(sum / count)
      arrow([-240, -48], [-45, 42], { stroke: ROLE.context, width: 3.6, tip: 14 })
        .glow(8, ROLE.context)
        .opacity((0.4 + 0.6 * lf) * alpha),
      arrow([240, -48], [45, 42], { stroke: ROLE.good, width: 3.6, tip: 14 })
        .glow(8, ROLE.good)
        .opacity((0.4 + 0.6 * lf) * alpha),

      txt(
        rp > 0.5 ? `exp(${fmt(total, 3)} / 3)  ≈  ${fmt(ppl, 2)}` : 'exp(total / count)  =  ?',
        0,
        105,
        46,
        rp > 0.5 ? ROLE.observed : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(rp > 0.5 ? 12 : 4, rp > 0.5 ? ROLE.observed : COSMOS.muted)
        .opacity(alpha),

      // Floating provenance constellation (no card clutter)
      txt(
        'Checkpoint  ·  Corpus revision  ·  Tokenizer & normalization  ·  Context, stride & masks',
        0,
        265,
        28,
        ROLE.prob,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Link the overlap audit so any teammate can inspect what was checked.',
        0,
        355,
        30,
        ROLE.warn,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: 5 luminous diagnostic signal gauges (zero boxed prose cards)
  const runtimeLayer = guardedDynamic(vRuntime, (alpha) => {
    const nodes = [];
    const dw = diagWave.value;
    const rows = [
      { left: 'count = true, 1.5, or -1', right: 'invalid target count', col: ROLE.warn },
      { left: 'count = 0', right: 'mean is undefined', col: ROLE.warn },
      { left: 'score = NaN', right: 'broken calculation', col: ROLE.warn },
      { left: 'observed p = 0', right: 'loss = +inf (real miss)', col: ROLE.amber },
      { left: 'finite loss = 1000', right: 'keep loss if exp overflows', col: ROLE.observed },
    ];

    nodes.push(
      txt(
        'Runtime value diagnostics: validate before trusting',
        0,
        -255,
        30,
        ROLE.prob,
        'mono',
        'center',
      ).opacity(alpha),
    );

    rows.forEach((row, i) => {
      const ry = -165 + i * 124;
      const lit = dw >= i * 0.16;
      const op = (lit ? 1 : 0.35) * alpha;
      nodes.push(
        glowDot(-740, ry, { radius: 9, color: row.col, glow: lit ? 13 : 4, opacity: op }),
        txt(row.left, -695, ry, 32, row.col, 'mono', 'left').opacity(op),
        glowingTrail(
          [
            [-110, ry],
            [95, ry],
          ],
          { color: row.col, width: 3.4, glow: 8, opacity: op },
        ),
        arrow([75, ry], [115, ry], { stroke: row.col, width: 3.4, tip: 13 }).opacity(op),
        txt(row.right, 150, ry, 32, COSMOS.ink, 'serif', 'left').opacity(op),
      );
    });

    return nodes;
  });

  // VIEW 3: Source-clustered bootstrap resampling
  const bootstrapLayer = guardedDynamic(vBootstrap, (alpha) => {
    const nodes = [];
    const draws = sampleDraws.value;

    const clusters = [
      { name: 'Source A', docs: 'doc1 + doc2', x: -535, col: ROLE.context },
      { name: 'Source B', docs: 'doc3', x: 0, col: ROLE.prob },
      { name: 'Source C', docs: 'doc4 + doc5', x: 535, col: ROLE.masked },
    ];

    nodes.push(
      txt(
        'Report domains separately  ·  resample independent source groups together',
        0,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    clusters.forEach((cl) => {
      nodes.push(
        glowRing(cl.x, -75, 108, cl.col, { width: 3.2, glow: 10, opacity: alpha }),
        txt(cl.name, cl.x, -105, 32, cl.col, 'mono', 'center').glow(6, cl.col).opacity(alpha),
        txt(cl.docs, cl.x, -50, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Three animated cluster draws below
    const picks = [0, 2, 0];
    const drawXs = [-520, 0, 520];
    picks.forEach((pIdx, i) => {
      const shown = draws >= i + 0.5;
      const cl = clusters[pIdx];
      const col = shown ? cl.col : COSMOS.dim;
      nodes.push(
        lumBar(drawXs[i], 205, 410, 108, {
          color: col,
          fillOpacity: shown ? 0.24 : 0.08,
          strokeWidth: shown ? 2.8 : 1.6,
          glow: shown ? 10 : 2,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          shown ? `Draw ${i + 1}: ${cl.name}` : `Draw ${i + 1}: ?`,
          drawXs[i],
          180,
          30,
          col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          shown ? cl.docs : 'pending',
          drawXs[i],
          230,
          28,
          shown ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Drawing Source A pulls both doc1 and doc2 together every replicate.',
        0,
        365,
        30,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 4: LLM-judge order-swap bias check
  const judgeLayer = guardedDynamic(vJudge, (alpha) => {
    const nodes = [];
    const sp = swapProgress.value;
    const swapped = sp > 0.6;

    nodes.push(
      txt('Source record:  job 612 is QUEUED', 0, -235, 36, ROLE.observed, 'mono', 'center')
        .glow(8, ROLE.observed)
        .opacity(alpha),
    );

    // Smooth curved swap of Answer A (left -> right) and Answer B (right -> left)
    const leftX = -435;
    const rightX = 435;
    const midY = 15;
    const arcLift = Math.sin(sp * Math.PI) * 95;

    const ax = leftX + (rightX - leftX) * sp;
    const ay = midY - arcLift;
    const bx = rightX + (leftX - rightX) * sp;
    const by = midY + arcLift;

    nodes.push(
      lumBar(ax, ay, 610, 126, {
        color: ROLE.good,
        fillOpacity: 0.26,
        strokeWidth: 3,
        glow: 11,
        radius: 14,
        opacity: alpha,
      }),
      txt('Answer A', ax, ay - 26, 32, ROLE.good, 'mono', 'center').opacity(alpha),
      txt('"The job is waiting."', ax, ay + 24, 34, COSMOS.ink, 'serif', 'center').opacity(alpha),

      lumBar(bx, by, 610, 126, {
        color: ROLE.prob,
        fillOpacity: 0.2,
        strokeWidth: 2.4,
        glow: 7,
        radius: 14,
        opacity: alpha,
      }),
      txt('Answer B', bx, by - 26, 32, ROLE.prob, 'mono', 'center').opacity(alpha),
      txt('"The job finished."', bx, by + 24, 34, COSMOS.ink, 'serif', 'center').opacity(alpha),

      txt(
        swapped
          ? 'Answer A still agrees with the source record. Does your judge still pick A?'
          : 'Check claims against the source record, then test order & length swaps.',
        0,
        265,
        32,
        swapped ? ROLE.good : COSMOS.ink,
        'serif',
        'center',
      )
        .glow(swapped ? 8 : 0, ROLE.good)
        .opacity(alpha),
      txt(
        'Test verbosity swaps too, and calibrate judge picks against human ratings.',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.observed, ROLE.context),
    title,
    ledgerLayer,
    runtimeLayer,
    bootstrapLayer,
    judgeLayer,
  );

  // Beat 0: total loss + count -> recover 2.92 AFTER report-recover
  playCue(s, c, 'report-loss', (d) => s.play(ledgerFlow.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'report-recover', (d) => s.play(recoverPpl.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 1: swap to 5 diagnostic signal rails
  c.onBeat(1, () => s.play(swapVis(vLedger, vRuntime, 0.55)));
  playCue(s, c, 'runtime-values', (d) => s.play(diagWave.to(1, { duration: d })), { dur: 1.4 });

  // Beat 2: swap to source-clustered bootstrap
  c.onBeat(2, () => s.play(swapVis(vRuntime, vBootstrap, 0.55)));
  playCue(s, c, 'resample-documents', (d) => s.play(sampleDraws.to(3, { duration: d })), {
    dur: 1.4,
  });

  // Beat 3: swap to judge order-swap animation
  c.onBeat(3, () => s.play(swapVis(vBootstrap, vJudge, 0.55)));
  playCue(s, c, 'judge-order', (d) => s.play(swapProgress.to(1, { duration: d })), { dur: 0.9 });
}
