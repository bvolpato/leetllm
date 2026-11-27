// Scene 12: Count batch iterations without multiplying by batch size. 80 layers x 2 = 160 calls/iter -> 128 iters = 20,480 -> prefill token 1 leaves 127 = 20,320 -> batch 1..8 grows payload 8->64 KiB, count stays 160!
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function collectiveCount(s, c) {
  const showStack = s.value(1);
  const showBatch = s.value(0);

  const pIntro = s.value(0);
  const pStep = s.value(0);
  const pIters = s.value(0);
  const pB1 = s.value(0);
  const pPrefill = s.value(0);
  const pDecOnly = s.value(0);
  const pBatch = s.value(0);
  const pProf = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16616');
  const title = heroTitle(['Count Batch Iterations,', 'Not Batch Size'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: '80 DENSE LAYERS · 2 ALL-REDUCES / LAYER',
  });

  const stackView = guardedDynamic(showStack, (a) => {
    const litFrac = Math.max(pIntro.value * 0.15, pStep.value);
    const stepDone = pStep.value > 0.85;
    const itDone = pIters.value > 0.5;
    const b1 = pB1.value > 0.5;
    const pre = pPrefill.value > 0.5;
    const dec = pDecOnly.value > 0.5;

    const nodes = [
      txt('80 DENSE LAYERS × 2 IN-LAYER ALL-REDUCES', 0, -210, 28, COSMOS.ink, 'mono').opacity(a),
    ];

    // 4 rows of 20 layers (each layer has 2 collective bars = 160 bars)
    for (let l = 0; l < 80; l++) {
      const lx = -760 + (l % 20) * 78;
      const ly = -135 + Math.floor(l / 20) * 76;
      for (let k = 0; k < 2; k++) {
        const idx = 2 * l + k;
        const active = idx < litFrac * 160;
        nodes.push(
          rect(24, 52, {
            fill: active ? '#1a427a' : '#0b1222',
            stroke: active ? ROLE.gpu0 : '#24314f',
            width: 1.6,
            radius: 4,
          })
            .at(lx + k * 30, ly)
            .opacity(a),
        );
      }
    }

    nodes.push(
      glassCell(-440, 205, 680, 92, stepDone ? ROLE.gpu0 : COSMOS.dim, {
        fill: '#10213d',
        glow: stepDone ? 9 : 3,
        opacity: a,
      }),
      txt(
        stepDone ? '160 calls / batch decode step' : 'Counting in-layer collectives...',
        -440,
        205,
        30,
        stepDone ? ROLE.gpu0 : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    if (!b1) {
      nodes.push(
        glassCell(440, 205, 680, 92, itDone ? COSMOS.gold : COSMOS.dim, {
          fill: '#231c0e',
          glow: itDone ? 9 : 3,
          opacity: a,
        }),
        txt(
          itDone ? '160 × 128 iters = 20,480 calls' : '128 iterations = ?',
          440,
          205,
          30,
          itDone ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    } else {
      nodes.push(
        glassCell(440, 205, 680, 92, dec ? ROLE.good : ROLE.gpu1, {
          fill: '#0e2929',
          glow: dec ? 10 : 5,
          opacity: a,
        }),
        txt(
          dec
            ? 'Prefill emits tok 1 -> 127 × 160 = 20,320'
            : pre
              ? 'Prefill -> tok 1 · 127 decode steps'
              : 'Subtract prefill first token...',
          440,
          205,
          26,
          dec ? ROLE.good : ROLE.gpu1,
          'mono',
        ).opacity(a),
      );
    }

    nodes.push(
      txt(
        'One batched collective advances every active request in that iteration',
        0,
        335,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  const batchView = guardedDynamic(showBatch, (a) => {
    const batch = Math.min(8, 1 + Math.floor(pBatch.value * 7.01));
    const kib = (batch * 4096 * 2) / 1024;
    const pr = pProf.value > 0.5;

    const nodes = [
      txt(
        'GROWING BATCH SIZE GROWS PAYLOAD, NOT CALL COUNT',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // Left: pinned 160 counter
      glassCell(-520, 45, 560, 330, COSMOS.gold, { fill: '#221b0e', glow: 10, opacity: a }),
      txt('IN-LAYER ALL-REDUCES', -520, -68, 28, COSMOS.muted, 'mono').opacity(a),
      txt('160', -520, 48, 118, COSMOS.gold, 'mono').glow(10, COSMOS.gold).opacity(a),
      txt('UNCHANGED FOR BATCH 1..8', -520, 155, 26, ROLE.good, 'mono').opacity(a),

      // Right: growing activation strips
      txt(`ACTIVATION PAYLOAD · ${batch} × 4096 × 2 B`, 310, -145, 28, ROLE.gpu1, 'mono').opacity(
        a,
      ),
    ];

    for (let i = 0; i < batch; i++) {
      const y = -88 + i * 40;
      nodes.push(
        rect(780, 30, { fill: '#0f3644', stroke: ROLE.gpu1, width: 2.0, radius: 6 })
          .at(310, y)
          .glow(5, ROLE.gpu1)
          .opacity(a),
      );
    }

    nodes.push(
      txt(`${kib} KiB per collective call`, 310, 260, 34, ROLE.gpu1, 'mono')
        .glow(6, ROLE.gpu1)
        .opacity(a),
      txt(
        pr
          ? 'Profile actual request-path duration: overlap, fusion, launches, and algorithm all matter'
          : 'Each strip adds one 8 KiB hidden vector to the same 160 batched calls',
        0,
        355,
        28,
        pr ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, stackView, batchView);

  c.on('mp-collective-count-0', () =>
    s.play(pIntro.to(1, { duration: remainDuration(c, 'mp-collective-count-0', 0.4) })),
  );
  c.on('mp-collective-count-one-step', () =>
    s.play(pStep.to(1, { duration: remainDuration(c, 'mp-collective-count-one-step', 0.75) })),
  );
  c.after('mp-collective-count-iterations', () =>
    s.play(
      pIters.to(1, { duration: remainAfterDuration(c, 'mp-collective-count-iterations', 0.4) }),
    ),
  );
  c.on('mp-collective-count-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-collective-count-1', 0.35) })),
  );
  c.on('mp-collective-count-prefill', () =>
    s.play(pPrefill.to(1, { duration: remainDuration(c, 'mp-collective-count-prefill', 0.4) })),
  );
  c.after('mp-collective-count-decode-only', () =>
    s.play(
      pDecOnly.to(1, { duration: remainAfterDuration(c, 'mp-collective-count-decode-only', 0.4) }),
    ),
  );
  c.on('mp-collective-count-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-collective-count-2', 0.16));
    swapViews(s, showStack, showBatch, d, d);
  });
  c.on('mp-collective-count-larger-batch', () =>
    s.play(pBatch.to(1, { duration: remainDuration(c, 'mp-collective-count-larger-batch', 1.0) })),
  );
  c.on('mp-collective-count-profile', () =>
    s.play(pProf.to(1, { duration: remainDuration(c, 'mp-collective-count-profile', 0.4) })),
  );
}
