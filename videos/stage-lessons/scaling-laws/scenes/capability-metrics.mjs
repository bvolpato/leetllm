// Scene 23: capability-metrics: "How many answers were completely right?"
// 3-act swapVis:
//   Act 1 (Beat 0): Cross-entropy loss <-> Perplexity = exp(loss) vs separate deployed task tests.
//   Act 2 (Beat 1): 5 independent token probability bars (p: 0.30 -> 0.90) driving smooth p^5 exact match.
//   Act 3 (Beat 2): Same 10 five-token answers scored two ways (partial token credit vs exact match),
//                   showing exact match staying at 0/3 then jumping at Row 4 purely from the metric!
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue, swapVis } from '../parts.mjs';

const ANSWERS = [
  '10110',
  '11110',
  '01101',
  '11111',
  '11000',
  '10101',
  '11111',
  '00111',
  '11010',
  '01110',
];

export default function capabilityMetrics(s, c) {
  const title = heroTitle(['How many answers were', 'completely right?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.compute,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);

  const testGlow = s.value(0); // sl-capability-metrics-0
  const probT = s.value(0); // sl-capability-metrics-1: p sweeps 0.30 -> 0.90
  const scoredRows = s.value(0); // Beat 2: 0 -> 3 -> 4 -> 10

  // Act 1: Loss / perplexity vs deployed task evaluation
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const tg = testGlow.value;

    nodes.push(
      txt('Held-out loss (nats/tok)', -420, -145, 36, ROLE.params, 'mono', 'center')
        .glow(7, ROLE.params)
        .opacity(alpha),
      txt('Perplexity = exp(loss)', 420, -145, 36, ROLE.tokens, 'mono', 'center')
        .glow(7, ROLE.tokens)
        .opacity(alpha),
      glowingTrail(
        [
          [-140, -145],
          [140, -145],
        ],
        { color: ROLE.compute, width: 4.5, glow: 10, opacity: alpha },
      ),
      txt('Same next-token view', 0, -205, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
      txt('Separate deployed evaluations', 0, 5, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
    );

    const evals = [
      { label: 'Code tests', col: ROLE.cap },
      { label: 'Factual QA', col: ROLE.params },
      { label: 'Instructions', col: ROLE.tokens },
      { label: 'Preferences', col: ROLE.compute },
      { label: 'Task checks', col: ROLE.optimal },
    ];
    evals.forEach((ev, i) => {
      const cx = -640 + i * 320;
      const isCode = i === 0;
      nodes.push(
        lumBar(cx, 120, 260, 82, {
          color: ev.col,
          fillOpacity: isCode ? 0.3 + 0.2 * tg : 0.24,
          strokeWidth: isCode ? 3 : 2.2,
          glow: isCode ? 12 : 7,
          radius: 8,
          opacity: alpha,
        }),
        txt(ev.label, cx, 120, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Budget separately for SFT, preference training & unit-test evaluations',
        0,
        325,
        30,
        ROLE.optimal,
        'sans',
        'center',
      )
        .glow(6, ROLE.optimal)
        .opacity(alpha),
    );

    return nodes;
  });

  // Act 2: Independent 5-token exact match p^5
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const pVal = 0.3 + 0.6 * probT.value;
    const p5 = pVal ** 5;

    const baseY = 55;
    const maxH = 225;

    nodes.push(
      txt(
        '5 independent tokens  ·  per-token accuracy p',
        0,
        -245,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    for (let i = 0; i < 5; i++) {
      const cx = -600 + i * 300;
      const h = Math.max(14, maxH * pVal);
      nodes.push(
        lumBar(cx, baseY - maxH / 2, 185, maxH, {
          color: COSMOS.dim,
          fillOpacity: 0.08,
          strokeWidth: 1.5,
          glow: 0,
          opacity: 0.55 * alpha,
        }),
        lumBar(cx, baseY - h / 2, 185, h, {
          color: ROLE.tokens,
          fillOpacity: 0.42,
          strokeWidth: 2.8,
          glow: 10,
          opacity: alpha,
        }),
        txt(`Token ${i + 1}`, cx, baseY + 42, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
        txt(fmt(pVal, 2), cx, baseY - maxH - 36, 32, ROLE.tokens, 'mono', 'center')
          .glow(6, ROLE.tokens)
          .opacity(alpha),
      );
    }

    // Whole-answer p^5 beam beneath
    const barW = 1140;
    const fillW = Math.max(12, barW * p5);
    nodes.push(
      lumBar(0, 215, barW, 56, {
        color: COSMOS.dim,
        fillOpacity: 0.08,
        strokeWidth: 1.6,
        glow: 0,
        opacity: 0.55 * alpha,
      }),
      lumBar(-barW / 2 + fillW / 2, 215, fillW, 56, {
        color: ROLE.compute,
        fillOpacity: 0.5,
        strokeWidth: 2.8,
        glow: 12,
        opacity: alpha,
      }),
      txt(
        `Whole-answer probability  p⁵ = ${fmt(p5, 4)}   (smooth curve!)`,
        0,
        305,
        34,
        ROLE.compute,
        'mono',
        'center',
      )
        .glow(8, ROLE.compute)
        .opacity(alpha),
      txt(
        'On small samples, exact match can stay 0 before jumping suddenly',
        0,
        368,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // Act 3: 10 fixed five-token answers scored on two separate scales
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const count = Math.max(0, Math.min(10, Math.round(scoredRows.value)));
    const selected = ANSWERS.slice(0, count);
    const correctTok = selected.reduce(
      (sum, row) => sum + [...row].filter((ch) => ch === '1').length,
      0,
    );
    const wholeOk = selected.filter((row) => row === '11111').length;

    const gridLeft = -700;
    const gridTop = -205;
    const stepX = 82;
    const stepY = 52;

    nodes.push(
      txt(
        'Cyan = right token  ·  Rose = error',
        -510,
        -260,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    for (let r = 0; r < 10; r++) {
      const ry = gridTop + r * stepY;
      const lit = r < count;
      const isPerfect = ANSWERS[r] === '11111';
      nodes.push(
        txt(
          `E${r + 1}`,
          gridLeft - 38,
          ry,
          26,
          lit && isPerfect ? ROLE.compute : COSMOS.muted,
          'mono',
          'right',
        )
          .glow(lit && isPerfect ? 6 : 0, ROLE.compute)
          .opacity(alpha),
      );
      for (let k = 0; k < 5; k++) {
        const cx = gridLeft + k * stepX + 30;
        const ok = ANSWERS[r][k] === '1';
        const col = lit ? (ok ? ROLE.tokens : ROLE.cap) : COSMOS.dim;
        nodes.push(
          lumBar(cx, ry, 62, 34, {
            color: col,
            fillOpacity: lit ? 0.52 : 0.08,
            strokeWidth: lit ? 2 : 1.2,
            glow: lit && isPerfect ? 8 : 3,
            radius: 4,
            opacity: (lit ? 1 : 0.45) * alpha,
          }),
        );
      }
    }

    // Right side: Two separate score meters
    const barLeft = 60;
    const barW = 720;
    const tokFrac = count > 0 ? correctTok / (count * 5) : 0;
    const exactFrac = count > 0 ? wholeOk / count : 0;

    nodes.push(
      txt('Partial token credit', barLeft, -165, 34, ROLE.tokens, 'sans', 'left')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
      lumBar(barLeft + barW / 2, -95, barW, 64, {
        color: COSMOS.dim,
        fillOpacity: 0.08,
        strokeWidth: 1.6,
        glow: 0,
        opacity: 0.55 * alpha,
      }),
      lumBar(barLeft + Math.max(8, barW * tokFrac) / 2, -95, Math.max(8, barW * tokFrac), 64, {
        color: ROLE.tokens,
        fillOpacity: 0.46,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      txt(
        count > 0
          ? `${correctTok} / ${count * 5} tokens (${Math.round(tokFrac * 100)}%)`
          : 'Awaiting scores',
        barLeft,
        -25,
        30,
        ROLE.tokens,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Whole-answer exact match', barLeft, 85, 34, ROLE.compute, 'sans', 'left')
        .glow(6, ROLE.compute)
        .opacity(alpha),
      lumBar(barLeft + barW / 2, 155, barW, 64, {
        color: COSMOS.dim,
        fillOpacity: 0.08,
        strokeWidth: 1.6,
        glow: 0,
        opacity: 0.55 * alpha,
      }),
      lumBar(barLeft + Math.max(8, barW * exactFrac) / 2, 155, Math.max(8, barW * exactFrac), 64, {
        color: ROLE.compute,
        fillOpacity: 0.5,
        strokeWidth: 2.8,
        glow: 12,
        opacity: count > 0 && wholeOk > 0 ? alpha : 0.25 * alpha,
      }),
      txt(
        count > 0
          ? `${wholeOk} / ${count} complete answers (${Math.round(exactFrac * 100)}%)`
          : 'Awaiting scores',
        barLeft,
        225,
        30,
        ROLE.compute,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'Same outputs  ·  metric choice can mimic a sharp "emergent" jump (Schaeffer et al.)',
        0,
        385,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  const eq = glowTex('P(\\text{exact}) = p^5', {
    x: 560,
    y: -365,
    size: 40,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.tokens, ROLE.compute), title, act1Layer, act2Layer, act3Layer);

  playCue(s, c, 'sl-capability-metrics-0', (d) => s.play(testGlow.to(1, { duration: d })), {
    dur: 0.8,
  });
  c.show('sl-capability-metrics-1', eq);
  playCue(
    s,
    c,
    'sl-capability-metrics-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.6, d)), probT.to(1, { duration: d })),
    { dur: 1.8 },
  );
  c.hide('sl-capability-metrics-2', eq);
  playCue(
    s,
    c,
    'sl-capability-metrics-2',
    (d) => s.play(swapVis(act2Vis, act3Vis, Math.min(0.6, d))),
    { dur: 0.65 },
  );
  playCue(s, c, 'metric-first-three', (d) => s.play(scoredRows.to(3, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'metric-fourth', (d) => s.play(scoredRows.to(4, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'metric-rest', (d) => s.play(scoredRows.to(10, { duration: d })), { dur: 1.2 });
}
