// Scene 18: Can four GPUs hold a million tokens of history? Training SP vs Serving CP -> 1M tok x 80L x 8 KV x 128 x 2B x 2 = 305.2 GiB -> 76.3 GiB/GPU > 74.5 GiB (80 decimal GB)!
import {
  COSMOS,
  DEVICE_80GB_IN_GIB,
  KV_1M_GIB,
  KV_1M_PER4_GIB,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function contextBudget(s, c) {
  const p0 = s.value(0);
  const pTrain = s.value(0);
  const p1 = s.value(0);
  const pDims = s.value(0);
  const pFull = s.value(0);
  const pFour = s.value(0);
  const p2 = s.value(0);
  const pDev = s.value(0);
  const pFail = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61c', '#ff6b8b1a');
  const title = heroTitle(['Can Four GPUs Hold', '1M Tokens of History?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'CONTEXT PARALLELISM · 305.2 GiB FULL-HISTORY BUDGET',
  });

  const terms = [
    '2 (K + V)',
    '80 full-attn layers',
    '1,000,000 tokens',
    '8 KV heads',
    '128 dim / head',
    '2 bytes (BF16)',
  ];

  const live = guardedDynamic(1, () => {
    const tr = pTrain.value > 0.4;
    const dmCount = Math.floor(pDims.value * terms.length + 0.01);
    const fl = pFull.value > 0.5;
    const fr = pFour.value > 0.5;
    const dv = pDev.value > 0.5 || p2.value > 0.5;
    const fail = pFail.value > 0.5;

    const nodes = [
      txt(
        p1.value > 0.3
          ? '1,000,000-TOKEN KV BYTE PRODUCT (FULL ATTENTION)'
          : 'MEGATRON TRAINING SP vs INFERENCE CONTEXT PARALLELISM',
        0,
        -210,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    // 6 dimension pills in 2 rows x 3 cols
    terms.forEach((lbl, i) => {
      const cx = -540 + (i % 3) * 540;
      const cy = -132 + Math.floor(i / 3) * 76;
      const on = i < dmCount;
      nodes.push(
        glassCell(cx, cy, 480, 58, on ? ROLE.gpu1 : '#263454', {
          fill: on ? '#0e2b38' : '#0b1120',
          glow: on ? 7 : 0,
        }),
        txt(on ? `×  ${lbl}` : lbl, cx, cy, 26, on ? ROLE.gpu1 : COSMOS.muted, 'mono'),
      );
    });

    // Total raw payload bar
    nodes.push(
      glassCell(0, 34, 980, 74, fl ? ROLE.gpu0 : COSMOS.dim, {
        fill: fl ? '#112546' : '#0c1322',
        glow: fl ? 9 : 2,
      }),
      txt(
        fl
          ? `Total KV Cache = ${KV_1M_GIB.toFixed(1)} GiB   (÷ 4 GPUs = ${KV_1M_PER4_GIB.toFixed(1)} GiB / GPU)`
          : 'Multiply all six dimensions to size raw KV cache...',
        0,
        34,
        28,
        fl ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
    );

    // 4 per-GPU bars compared against 74.5 GiB device limit
    const maxScale = 86;
    const barW = 340;
    for (let r = 0; r < 4; r++) {
      const bx0 = -810 + r * 426;
      const fillW = fr ? (KV_1M_PER4_GIB / maxScale) * barW : 0;
      const capX = bx0 + (DEVICE_80GB_IN_GIB / maxScale) * barW;
      nodes.push(
        txt(`RANK ${r}`, bx0 + barW * 0.5, 118, 26, COSMOS.muted, 'mono'),
        rect(barW, 56, { fill: '#0b1222', stroke: COSMOS.dim, width: 1.8, radius: 7 }).at(
          bx0 + barW * 0.5,
          172,
        ),
      );
      if (fr) {
        nodes.push(
          rect(fillW, 56, {
            fill: fail ? '#321222' : '#0e3240',
            stroke: fail ? ROLE.bad : ROLE.gpu1,
            width: 2.6,
            radius: 7,
          })
            .at(bx0 + fillW * 0.5, 172)
            .glow(7, fail ? ROLE.bad : ROLE.gpu1),
          txt(`${KV_1M_PER4_GIB.toFixed(1)} GiB`, bx0 + fillW * 0.5, 172, 26, COSMOS.ink, 'mono'),
        );
      }
      if (dv) {
        nodes.push(
          line([capX, 134], [capX, 144], { stroke: ROLE.bad, width: 3.5 }).glow(6, ROLE.bad),
          line([capX, 200], [capX, 212], { stroke: ROLE.bad, width: 3.5 }).glow(6, ROLE.bad),
          txt(
            `${DEVICE_80GB_IN_GIB.toFixed(1)} GiB cap`,
            bx0 + barW * 0.5,
            240,
            26,
            ROLE.bad,
            'mono',
          ),
        );
      }
    }

    const foot = fail
      ? '76.3 GiB > 74.5 GiB (80 decimal GB) on every rank BEFORE weights or workspace · hybrid layers separate'
      : dv
        ? '80 decimal GB = 74.5 GiB · every ideal 4-way share already exceeds one card'
        : 'Start with a checkpoint-supported sequence length, then budget KV memory explicitly';

    nodes.push(
      glassCell(0, 330, 1580, 76, fail ? ROLE.bad : ROLE.gpu1, {
        fill: fail ? '#2b101e' : '#0f1b30',
        glow: 8,
      }),
      txt(foot, 0, 330, 26, fail ? ROLE.bad : COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('mp-context-budget-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-context-budget-0', 0.35) })),
  );
  c.on('mp-context-budget-training', () =>
    s.play(pTrain.to(1, { duration: remainDuration(c, 'mp-context-budget-training', 0.4) })),
  );
  c.on('mp-context-budget-1', () =>
    s.play(p1.to(1, { duration: remainDuration(c, 'mp-context-budget-1', 0.35) })),
  );
  c.on('mp-context-budget-dimensions', () =>
    s.play(pDims.to(1, { duration: remainDuration(c, 'mp-context-budget-dimensions', 1.0) })),
  );
  c.after('mp-context-budget-full', () =>
    s.play(pFull.to(1, { duration: remainAfterDuration(c, 'mp-context-budget-full', 0.4) })),
  );
  c.after('mp-context-budget-four', () =>
    s.play(pFour.to(1, { duration: remainAfterDuration(c, 'mp-context-budget-four', 0.4) })),
  );
  c.on('mp-context-budget-2', () =>
    s.play(p2.to(1, { duration: remainDuration(c, 'mp-context-budget-2', 0.35) })),
  );
  c.after('mp-context-budget-device', () =>
    s.play(pDev.to(1, { duration: remainAfterDuration(c, 'mp-context-budget-device', 0.4) })),
  );
  c.on('mp-context-budget-fails', () =>
    s.play(pFail.to(1, { duration: remainDuration(c, 'mp-context-budget-fails', 0.4) })),
  );
}
