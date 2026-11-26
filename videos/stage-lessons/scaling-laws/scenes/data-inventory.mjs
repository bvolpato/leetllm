// Scene 21: data-inventory: "Can four runs share the same text?"
// 3-act swapVis:
//   Act 1 (Beat 0): Shared 15T source corpus feeding 4 runs (60T presentations from 15T unique)
//                   vs 4 disjoint corpora (60T unique) at disjoint-data.
//   Act 2 (Beat 1): Villalobos et al. (June 2024) 2026-2032 demand-supply intersection timeline
//                   (median 2028, ~400T effective stock, 15.6T = 3.9%).
//   Act 3 (Beat 2): Four corpus-yield stages + Sardana 47-model overtraining horizon limits.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, lumBar, playCue, scenePulse, swapVis } from '../parts.mjs';

export default function dataInventory(s, c) {
  const title = heroTitle(['Can four runs share', 'the same text?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);

  const runProg = s.value(0); // sl-data-inventory-0: 0 -> 4 runs
  const disjointMode = s.value(0); // disjoint-data
  const timeProg = s.value(0); // sl-data-inventory-1
  const filterProg = s.value(0); // sl-data-inventory-2
  const pulse = s.value(0);

  // Act 1: 15T shared corpus vs 4 disjoint corpora
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const completed = Math.max(1, Math.min(4, Math.round(runProg.value * 4)));
    const disj = disjointMode.value > 0.5;
    const stripLeft = -560;
    const blockW = 80;
    const gap = 8;

    nodes.push(
      txt(
        disj
          ? 'Four disjoint 15T corpora  ->  60T distinct source positions'
          : 'One shared 15T corpus  ->  reused across four training runs',
        0,
        -255,
        30,
        disj ? ROLE.compute : ROLE.tokens,
        'sans',
        'center',
      )
        .glow(6, disj ? ROLE.compute : ROLE.tokens)
        .opacity(alpha),
      txt('Source stock', stripLeft - 32, -162, 28, ROLE.params, 'mono', 'right').opacity(alpha),
    );

    // 15 glowing 1T source blocks (clean, zero cramped text inside narrow tiles)
    for (let j = 0; j < 15; j++) {
      const bx = stripLeft + j * (blockW + gap) + blockW / 2;
      nodes.push(
        lumBar(bx, -162, blockW, 56, {
          color: ROLE.params,
          fillOpacity: 0.44,
          strokeWidth: 2,
          glow: 7,
          radius: 5,
          opacity: alpha,
        }),
      );
    }
    nodes.push(
      txt(
        '15T unique',
        stripLeft + 15 * (blockW + gap) + 18,
        -162,
        26,
        ROLE.params,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // 4 training run rows
    for (let i = 0; i < 4; i++) {
      const ry = -45 + i * 94;
      const lit = i < completed;
      const col = disj ? [ROLE.params, ROLE.tokens, ROLE.optimal, ROLE.compute][i] : ROLE.tokens;
      const tag = disj
        ? `Corpus ${i + 1}: S${i * 15 + 1}..S${(i + 1) * 15} (15T)`
        : `Same S1..S15 (15T presentations)`;

      nodes.push(
        txt(`Run ${i + 1}`, stripLeft - 32, ry, 28, COSMOS.ink, 'mono', 'right').opacity(alpha),
        lumBar(stripLeft + (15 * (blockW + gap) - gap) / 2, ry, 15 * (blockW + gap) - gap, 54, {
          color: lit ? col : COSMOS.dim,
          fillOpacity: lit ? 0.34 : 0.08,
          strokeWidth: lit ? 2.4 : 1.4,
          glow: lit ? 9 : 0,
          radius: 6,
          opacity: (lit ? 1 : 0.45) * alpha,
        }),
        txt(
          tag,
          stripLeft + (15 * (blockW + gap) - gap) / 2,
          ry,
          28,
          lit ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        disj
          ? '60T presentations  ·  60T unique positions'
          : '60T presentations  ·  still only 15T unique positions',
        0,
        355,
        34,
        disj ? ROLE.compute : ROLE.optimal,
        'mono',
        'center',
      )
        .glow(8, disj ? ROLE.compute : ROLE.optimal)
        .opacity(alpha),
    );

    return nodes;
  });

  // Act 2: Villalobos et al. (June 2024) 2026-2032 timeline
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const tp = timeProg.value;
    const leftX = -720;
    const rightX = 720;
    const span = rightX - leftX;
    const axisY = 65;

    nodes.push(
      txt(
        'Villalobos et al. (June 2024)  ·  demand vs effective public human text',
        0,
        -245,
        30,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
      line([leftX, axisY], [rightX, axisY], { stroke: '#5a70a4', width: 3.5 }).opacity(alpha),
    );

    for (let yr = 2024; yr <= 2032; yr += 2) {
      const tx = leftX + ((yr - 2024) / 8) * span;
      nodes.push(
        line([tx, axisY - 14], [tx, axisY + 14], { stroke: COSMOS.muted, width: 2.4 }).opacity(
          alpha,
        ),
        txt(String(yr), tx, axisY + 46, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    }

    // Forecast window 2026..2032
    const wStart = leftX + (2 / 8) * span;
    const wFull = (6 / 8) * span;
    const wCur = Math.max(12, wFull * tp);
    nodes.push(
      lumBar(wStart + wCur / 2, axisY - 105, wCur, 86, {
        color: ROLE.tokens,
        fillOpacity: 0.3,
        strokeWidth: 2.8,
        glow: 11,
        opacity: alpha,
      }),
      txt(
        'Intersection window: 2026 to 2032',
        wStart + wFull / 2,
        axisY - 182,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(Math.min(1, tp * 1.4) * alpha),
    );

    if (tp > 0.6) {
      const mX = leftX + (4 / 8) * span;
      const ma = Math.min(1, (tp - 0.6) / 0.4) * alpha;
      nodes.push(
        glowDot(mX, axisY, { radius: 13, color: ROLE.compute, glow: 18, opacity: ma }),
        txt('Median ~2028', mX, axisY + 115, 36, ROLE.compute, 'mono', 'center')
          .glow(8, ROLE.compute)
          .opacity(ma),
        txt(
          '~400T quality & repetition-adjusted stock   ·   15.6T / 400T = 3.9%',
          0,
          285,
          30,
          ROLE.tokens,
          'mono',
          'center',
        ).opacity(ma),
        txt(
          'Corpus remains reusable across future runs',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(ma),
      );
    }

    return nodes;
  });

  // Act 3: Usable corpus pipeline + Sardana overtraining horizon
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const fp = Math.max(0.15, filterProg.value);
    const stages = [
      { label: 'Rights & access', keep: 1.0, col: ROLE.params },
      { label: 'Quality filter', keep: 0.72, col: ROLE.tokens },
      { label: 'Deduplication', keep: 0.52, col: ROLE.compute },
      { label: 'Repeats / synth', keep: 0.82, col: ROLE.optimal },
    ];

    nodes.push(
      txt(
        'Count what actually survives for your own training run',
        0,
        -255,
        32,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );

    const baseY = 125;
    const maxH = 270;
    stages.forEach((st, i) => {
      const cx = -585 + i * 390;
      const h = maxH * st.keep * fp;
      nodes.push(
        lumBar(cx, baseY - maxH / 2, 230, maxH, {
          color: COSMOS.dim,
          fillOpacity: 0.08,
          strokeWidth: 1.5,
          glow: 0,
          opacity: 0.55 * alpha,
        }),
        lumBar(cx, baseY - h / 2, 230, h, {
          color: st.col,
          fillOpacity: 0.4,
          strokeWidth: 2.8,
          glow: 11,
          opacity: alpha,
        }),
        txt(st.label, cx, baseY + 48, 28, st.col, 'sans', 'center')
          .glow(5, st.col)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Sardana (47 models): fits below 100:1 overstated gains at extreme overtraining',
        0,
        280,
        28,
        ROLE.amber,
        'sans',
        'center',
      )
        .glow(6, ROLE.amber)
        .opacity(alpha),
      txt(
        '10,000:1 tested only at smallest scale; larger models ran up to 1,000:1',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, act1Layer, act2Layer, act3Layer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-data-inventory-0', (d) => s.play(runProg.to(1, { duration: d })), { dur: 1.5 });
  playCue(s, c, 'disjoint-data', (d) => s.play(disjointMode.to(1, { duration: d })), { dur: 0.55 });
  playCue(
    s,
    c,
    'sl-data-inventory-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d)), timeProg.to(1, { duration: d })),
    { dur: 1.5 },
  );
  playCue(
    s,
    c,
    'sl-data-inventory-2',
    (d) => s.play(swapVis(act2Vis, act3Vis, Math.min(0.65, d)), filterProg.to(1, { duration: d })),
    { dur: 1.4 },
  );
}
