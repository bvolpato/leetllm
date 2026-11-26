// Scene 27: draw: "A random interval chooses one survivor"
// Renormalized 3-token unit strip (ran 52.9%, slept 29.4%, played 17.6%) with live seeded
// PRNG draw needle (seed 19, DRAW_STREAM) sweeping 0 -> 1 -> 8 -> 100 draws, while lower
// empirical frequency bars converge toward golden reference lines (58/100, 24/100, 18/100).
import { line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  BASE,
  DRAW_STREAM,
  ROLE,
  WORDS,
  cinemaAtmosphere,
  fmt,
  lumBar,
  nucleus,
  playCue,
  probStrip,
} from '../parts.mjs';

export default function draw(s, c) {
  const title = heroTitle(['A random interval', 'chooses one survivor'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const ids = nucleus(BASE);
  const mass = ids.reduce((a, id) => a + BASE[id], 0);
  const probs = ids.map((id) => BASE[id] / mass);
  const names = ids.map((id) => WORDS[id]);
  const cols = [ROLE.base, ROLE.valid, ROLE.alt];

  const stripLit = s.value(0.4);
  const drawCount = s.value(0); // 0 -> 1 -> 8 -> 100
  const showRef = s.value(0);
  const showReplay = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const n = Math.round(Math.max(0, Math.min(100, drawCount.value)));
    const samples = DRAW_STREAM.slice(0, n);
    const counts = [0, 0, 0];
    for (const sm of samples) counts[sm.bin]++;
    const current = n > 0 ? samples[n - 1] : DRAW_STREAM[0];
    const refVis = showRef.value;
    const repVis = showReplay.value;

    // Top-right draw counter
    nodes.push(
      txt(
        n > 0 ? `Seed 19  ·  Draw #${n} / 100` : 'Seed 19  ·  Unit interval [0, 1]',
        845,
        -395,
        30,
        ROLE.winner,
        'mono',
        'right',
      )
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );

    // Upper full-bleed renormalized probability strip + live moving draw marker
    // Keep marker label stable during rapid sweeps to avoid brief-text flicker
    const settled = n === 8 || n === 100;
    nodes.push(
      probStrip({
        left: -760,
        y: -175,
        width: 1520,
        height: 66,
        values: probs,
        names,
        colors: cols,
        markerU: n > 0 ? current.uniform : null,
        markerLabel: n > 0 ? (settled ? `u = ${fmt(current.uniform, 3)}` : 'draw u') : '',
        markerColor: ROLE.winner,
        labelOffsetY: 82,
        pctOffsetY: 118,
        opacity: Math.max(0.4, stripLit.value) * alpha,
      }),
    );

    // Lower empirical frequency bar chart converging toward golden reference bars
    const baseY = 305;
    const maxH = 215;
    const colXs = [-470, 0, 470];
    const barW = 210;

    nodes.push(line([-690, baseY], [690, baseY], { stroke: '#4c6294', width: 2.6 }).opacity(alpha));

    ids.forEach((id, b) => {
      const cx = colXs[b];
      const freq = n > 0 ? counts[b] / n : 0;
      const h = Math.max(4, freq * maxH);
      const refY = baseY - probs[b] * maxH;

      if (n > 0) {
        nodes.push(
          lumBar(cx, baseY - h / 2, barW, h, {
            color: cols[b],
            fillOpacity: 0.48,
            strokeWidth: 2.6,
            glow: 10,
            radius: 8,
            opacity: alpha,
          }),
        );
      }

      // Golden theoretical probability reference line
      nodes.push(
        line([cx - barW * 0.65, refY], [cx + barW * 0.65, refY], {
          stroke: ROLE.winner,
          width: 3.6,
          dash: [8, 5],
        })
          .glow(10, ROLE.winner)
          .opacity((0.45 + 0.55 * refVis) * alpha),
        txt(
          n > 0
            ? `${counts[b]} / ${n} (${(freq * 100).toFixed(0)}%)`
            : `target ${(probs[b] * 100).toFixed(1)}%`,
          cx,
          baseY + 38,
          28,
          cols[b],
          'mono',
          'center',
        ).opacity(alpha),
        txt(WORDS[id], cx, baseY + 76, 26, COSMOS.muted, 'serif', 'center').opacity(alpha),
      );
    });

    // Bottom takeaway
    nodes.push(
      txt(
        repVis > 0.35
          ? 'Seed fixes the PRNG stream; full replay also needs identical logits, kernels & order.'
          : n >= 90
            ? 'Empirical frequencies converge toward the fixed sampling probabilities.'
            : 'Draw u ~ Uniform(0, 1) and emit the token whose slice contains u.',
        0,
        422,
        28,
        repVis > 0.35 ? ROLE.winner : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(repVis > 0.35 ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  const uEq = glowTex('u \\sim \\mathrm{Uniform}(0, 1)', {
    x: 40,
    y: -385,
    size: 34,
    color: ROLE.active,
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, uEq, mainLayer);

  playCue(s, c, 'draw-b1-1', (d) => s.play(stripLit.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'draw-b1-2', (d) => s.play(drawCount.to(8, { duration: d })), { dur: 1.4 });
  playCue(s, c, 'draw-b2-1', (d) => s.play(drawCount.to(100, { duration: d })), { dur: 2.0 });
  playCue(s, c, 'draw-b2-2', (d) => s.play(showRef.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'draw-b3-1', (d) => s.play(showReplay.to(1, { duration: d })), { dur: 0.7 });
}
