// Scene 12: frontier-evidence: "What did the larger experiment establish?"
// 3-act swapVis:
//   Act 1 (Beat 0): Gopher (280B x 300B -> 5.04e23) vs Chinchilla (70B x 1.4T -> 5.88e23)
//                   proportional glowing compute rectangles.
//   Act 2 (Beat 1): 57-task MMLU glowing constellation (53 Chinchilla wins, 4 Gopher wins).
//   Act 3 (Beat 2): Llama lineage log-scale D/N ratio beams (143 -> 1,875 -> 38.5).
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue, scenePulse, swapVis } from '../parts.mjs';

const LLAMA_ROWS = [
  { name: 'LLaMA 1 7B', ratio: 143, prefix: '', col: ROLE.params },
  { name: 'LLaMA 1 65B', ratio: 21.5, prefix: '', col: ROLE.params },
  { name: 'Llama 2 7B', ratio: 286, prefix: '', col: ROLE.tokens },
  { name: 'Llama 2 70B', ratio: 28.6, prefix: '', col: ROLE.tokens },
  { name: 'Llama 3 8B (Apr 2024)', ratio: 1875, prefix: '>= ', col: ROLE.compute },
  { name: 'Llama 3 405B (Jul 2024)', ratio: 38.5, prefix: '', col: ROLE.optimal },
];

export default function frontierEvidence(s, c) {
  const title = heroTitle(['What did the larger', 'experiment establish?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);

  const proxyReveal = s.value(0); // sl-frontier-evidence-0
  const mmluGlow = s.value(0); // sl-frontier-evidence-1
  const llamaGrow = s.value(0); // sl-frontier-evidence-2
  const pulse = s.value(0);

  // Act 1: Gopher vs Chinchilla dense compute area blocks
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const pr = proxyReveal.value;

    const specs = [
      {
        name: 'Gopher',
        nB: 280,
        dB: 300,
        proxy: 5.04,
        cx: -430,
        col: ROLE.params,
        w: 440,
        h: 92,
      },
      {
        name: 'Chinchilla',
        nB: 70,
        dB: 1400,
        proxy: 5.88,
        cx: 410,
        col: ROLE.tokens,
        w: 120,
        h: 305,
      },
    ];

    nodes.push(
      txt(
        'Reported budget: 5.76 × 10²³ FLOPs  (Appendix F revised: 6.3 × 10²³)',
        0,
        -265,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    const baseY = 175;
    specs.forEach((sp) => {
      nodes.push(
        txt(sp.name, sp.cx, -198, 42, sp.col, 'serif', 'center').glow(8, sp.col).opacity(alpha),
        lumBar(sp.cx, baseY - sp.h / 2, sp.w, sp.h, {
          color: sp.col,
          fillOpacity: 0.38,
          strokeWidth: 3,
          glow: 11,
          opacity: alpha,
        }),
        txt(
          `${sp.nB}B params  ×  ${sp.dB === 1400 ? '1.4T' : '300B'} tokens`,
          sp.cx,
          baseY + 48,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `6ND = ${fmt(sp.proxy, 2)} × 10²³ FLOPs`,
          sp.cx,
          baseY + 104,
          34,
          ROLE.compute,
          'mono',
          'center',
        )
          .glow(7, ROLE.compute)
          .opacity((0.25 + 0.75 * pr) * alpha),
      );
    });

    nodes.push(
      txt(
        'Keep the exact counting convention attached to every FLOP number',
        0,
        375,
        28,
        ROLE.optimal,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 2: 57 MMLU task beacons (53 cyan vs 4 rose)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const mg = mmluGlow.value;
    const cols = 19;
    const stepX = 76;
    const stepY = 104;
    const startX = -((cols - 1) * stepX) / 2;
    const startY = -125;

    nodes.push(
      txt(
        'MMLU 57-task breakdown  ·  Chinchilla improved average MMLU, BIG-bench & LAMBADA',
        0,
        -240,
        28,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );

    for (let i = 0; i < 57; i++) {
      const isGopherWin = i >= 53;
      const gx = startX + (i % cols) * stepX;
      const gy = startY + Math.floor(i / cols) * stepY;
      const col = isGopherWin ? ROLE.cap : ROLE.tokens;
      nodes.push(
        lumBar(gx, gy, 52, 66, {
          color: col,
          fillOpacity: isGopherWin ? 0.56 : 0.34,
          strokeWidth: isGopherWin ? 3 : 2,
          glow: isGopherWin ? 13 * (0.4 + 0.6 * mg) : 6,
          radius: 6,
          opacity: alpha,
        }),
      );
      if (isGopherWin) {
        nodes.push(txt('×', gx, gy, 32, COSMOS.ink, 'mono', 'center').opacity(alpha));
      }
    }

    nodes.push(
      txt('4 marked MMLU tasks where Gopher scored higher', 0, 225, 34, ROLE.cap, 'sans', 'center')
        .glow(8, ROLE.cap)
        .opacity(alpha),
      txt(
        'Tokenizer, optimizer & data mix also differed  ·  tested optimum range: 40B to 70B',
        0,
        305,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      txt(
        '70B chosen at upper end partly for data & compute efficiency',
        0,
        365,
        28,
        ROLE.optimal,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 3: Llama lineage log-scale D/N ratio beams
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const lg = Math.max(0.08, llamaGrow.value);
    const barLeft = -270;
    const maxW = 860;

    nodes.push(
      txt(
        'Training token presentations per nominal parameter (log₁₀ scale)',
        0,
        -255,
        30,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    LLAMA_ROWS.forEach((row, i) => {
      const cy = -165 + i * 92;
      const frac = Math.log10(row.ratio) / 3.4;
      const w = Math.max(16, maxW * frac * lg);
      nodes.push(
        txt(row.name, barLeft - 28, cy, 28, COSMOS.ink, 'sans', 'right').opacity(alpha),
        lumBar(barLeft + w / 2, cy, w, 48, {
          color: row.col,
          fillOpacity: 0.42,
          strokeWidth: 2.6,
          glow: 10,
          opacity: alpha,
        }),
        txt(`${row.prefix}${row.ratio}:1`, barLeft + w + 24, cy, 30, row.col, 'mono', 'left')
          .glow(6, row.col)
          .opacity((0.3 + 0.7 * lg) * alpha),
      );
    });

    nodes.push(
      txt(
        'Different releases & token counts  ·  lifetime optima need quality + demand forecasts',
        0,
        395,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.tokens, ROLE.cap), title, act1Layer, act2Layer, act3Layer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-frontier-evidence-0', (d) => s.play(proxyReveal.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(
    s,
    c,
    'sl-frontier-evidence-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), mmluGlow.to(1, { duration: d })),
    { dur: 1.0 },
  );
  playCue(
    s,
    c,
    'sl-frontier-evidence-2',
    (d) => s.play(swapVis(act2Vis, act3Vis, Math.min(0.65, d)), llamaGrow.to(1, { duration: d })),
    { dur: 1.4 },
  );
}
