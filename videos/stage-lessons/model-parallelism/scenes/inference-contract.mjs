// Scene 03: What does one request wait for? Two ranks sync on collective -> serving TTFT / TPOT clock -> faster link vs straggler multiply + FP rounding order.
import {
  COSMOS,
  ROLE,
  aura,
  circle,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainBeatDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function inferenceContract(s, c) {
  const showRanks = s.value(1);
  const showClock = s.value(0);

  const pRank = s.value(0);
  const pWork = s.value(0);
  const pWait = s.value(0);
  const pSum = s.value(0);
  const pClock1 = s.value(0);
  const pClock2 = s.value(0);
  const pFaster = s.value(0);
  const pPaths = s.value(0);
  const pRound = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#ffd16614');
  const title = heroTitle(['What Does One', 'Request Wait For?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gpu1,
    eyebrow: 'RANK BARRIERS · INTERACTIVE SERVING CLOCK',
  });

  const ranksView = guardedDynamic(showRanks, (a) => {
    const progress = 0.34 * pWork.value + 0.28 * pWait.value + 0.38 * pSum.value;
    const collEnd = 1.0 - 0.14 * pFaster.value;
    const x0 = -560;
    const totalW = 1280;

    const nodes = [
      txt(
        pPaths.value > 0.5
          ? 'FASTER LINK SHORTENS COLLECTIVE · GPU 1 MULTIPLY STILL SETS WAIT'
          : 'TWO RANKS COMPUTING ONE BATCH IN PARALLEL',
        0,
        -205,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    const span = (y, start, end, label, fill, stroke, textCol = COSMOS.ink) => {
      const vis = Math.min(progress, end) - start;
      if (vis <= 0.005) return;
      const w = vis * totalW;
      nodes.push(
        rect(w, 86, { fill, stroke, width: 2.4, radius: 8 })
          .at(x0 + start * totalW + w * 0.5, y)
          .glow(7, stroke)
          .opacity(a),
      );
      if (vis >= (end - start) * 0.85 && w > 110) {
        nodes.push(
          txt(label, x0 + (start + end) * 0.5 * totalW, y, 28, textCol, 'mono').opacity(a),
        );
      }
    };

    [0.34, 0.62].forEach((localEnd, rank) => {
      const y = rank === 0 ? -75 : 95;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(txt(`GPU ${rank}`, x0 - 45, y, 30, col, 'mono', 'right').opacity(a));
      span(y, 0, localEnd, 'Multiply', '#122a4d', ROLE.gpu0);
      if (rank === 0) span(y, localEnd, 0.62, 'Wait', '#2e240e', COSMOS.gold, COSMOS.gold);
      if (pFaster.value > 0.05) {
        nodes.push(
          rect(0.38 * totalW, 86, {
            fill: '#0c1324',
            stroke: COSMOS.dim,
            width: 1.8,
            radius: 8,
            dash: [6, 5],
          })
            .at(x0 + 0.81 * totalW, y)
            .opacity(0.65 * a),
        );
      }
      span(y, 0.62, collEnd, 'Collective', '#0e3240', ROLE.gpu1);
    });

    const foot =
      pRound.value > 0.5
        ? 'FP addition order can flip the last bits and change the sampled token'
        : pFaster.value > 0.5
          ? 'Trace both compute kernels and shared links on the request critical path'
          : pSum.value > 0.8
            ? 'Both ranks receive the collective sum'
            : 'GPU 0 finishes first and waits for GPU 1';

    nodes.push(
      txt(foot, 0, 275, 28, pRound.value > 0.5 ? ROLE.warn : COSMOS.ink, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  const clockView = guardedDynamic(showClock, (a) => {
    const c1 = pClock1.value;
    const c2 = pClock2.value;
    const xs = [-660, 120, 680];
    const y = 30;
    const labels = ['Prompt arrives', 'First token', 'Next token'];

    const nodes = [
      txt(
        'SERVING CLOCK vs TRAINING (NO GRADIENTS OR OPTIMIZER STATE)',
        0,
        -205,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      line([xs[0], y], [xs[0] + (xs[1] - xs[0]) * c1, y], {
        stroke: ROLE.gpu0,
        width: 6,
      })
        .glow(8, ROLE.gpu0)
        .opacity(a),
      line([xs[1], y], [xs[1] + (xs[2] - xs[1]) * c2, y], {
        stroke: ROLE.gpu1,
        width: 6,
      })
        .glow(8, ROLE.gpu1)
        .opacity(c2 > 0.02 ? a : 0),
    ];

    xs.forEach((cx, idx) => {
      const vis = idx === 0 ? 1 : idx === 1 ? c1 : c2;
      if (vis < 0.05) return;
      const col = idx === 0 ? COSMOS.ink : idx === 1 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        circle(16, { fill: col, stroke: COSMOS.ink, width: 2 })
          .at(cx, y)
          .glow(10, col)
          .opacity(vis * a),
        txt(labels[idx], cx, y - 62, 30, col, 'mono').opacity(vis * a),
      );
    });

    if (c1 > 0.5) {
      nodes.push(
        glassCell((xs[0] + xs[1]) * 0.5, y + 108, 460, 74, ROLE.gpu0, {
          fill: '#10213d',
          opacity: c1 * a,
        }),
        txt(
          'Time to first token (TTFT)',
          (xs[0] + xs[1]) * 0.5,
          y + 108,
          28,
          ROLE.gpu0,
          'mono',
        ).opacity(c1 * a),
      );
    }
    if (c2 > 0.5) {
      nodes.push(
        glassCell((xs[1] + xs[2]) * 0.5, y + 108, 420, 74, ROLE.gpu1, {
          fill: '#0e2d3b',
          opacity: c2 * a,
        }),
        txt('Token gap (TPOT)', (xs[1] + xs[2]) * 0.5, y + 108, 28, ROLE.gpu1, 'mono').opacity(
          c2 * a,
        ),
      );
    }

    nodes.push(
      txt(
        'Token 2 depends on token 1 · Track concurrency and useful tokens/sec under load',
        0,
        290,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, ranksView, clockView);

  c.on('mp-inference-contract-0', () =>
    s.play(pRank.to(1, { duration: remainDuration(c, 'mp-inference-contract-0', 0.4) })),
  );
  c.on('mp-inference-contract-workers', () =>
    s.play(pWork.to(1, { duration: remainDuration(c, 'mp-inference-contract-workers', 0.55) })),
  );
  c.on('mp-inference-contract-wait', () =>
    s.play(pWait.to(1, { duration: remainDuration(c, 'mp-inference-contract-wait', 0.45) })),
  );
  c.on('mp-inference-contract-sum', () =>
    s.play(pSum.to(1, { duration: remainDuration(c, 'mp-inference-contract-sum', 0.55) })),
  );
  c.on('mp-inference-contract-1', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-inference-contract-1', 0.16));
    swapViews(s, showRanks, showClock, d, d);
  });
  c.on('mp-inference-contract-clocks', () =>
    s.play(pClock1.to(1, { duration: remainDuration(c, 'mp-inference-contract-clocks', 0.65) })),
  );
  c.on('mp-inference-contract-next', () =>
    s.play(pClock2.to(1, { duration: remainDuration(c, 'mp-inference-contract-next', 0.5) })),
  );
  c.on('mp-inference-contract-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-inference-contract-2', 0.16));
    swapViews(s, showClock, showRanks, d, d);
  });
  c.on('mp-inference-contract-faster', () =>
    s.play(pFaster.to(1, { duration: remainDuration(c, 'mp-inference-contract-faster', 0.5) })),
  );
  c.on('mp-inference-contract-paths', () =>
    s.play(pPaths.to(1, { duration: remainDuration(c, 'mp-inference-contract-paths', 0.4) })),
  );
  c.on('mp-inference-contract-rounding', () =>
    s.play(pRound.to(1, { duration: remainDuration(c, 'mp-inference-contract-rounding', 0.4) })),
  );
}
