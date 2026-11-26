// Scene 19: lifetime: "Before the first request"
// Aligned glowing training bills at Q = 0 served tokens (70B/1.4T at 5.88e23 vs 30B/4.0T at 7.20e23)
// paired with per-token inference cost meters (140B vs 60B FLOPs/tok -> 80B/tok saving).
import { COSMOS, glowDot, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  LIFETIME_MODELS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  scenePulse,
  trainFlops,
} from '../parts.mjs';

export default function lifetime(s, c) {
  const title = heroTitle(['Before the', 'first request'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.tokens,
  });

  const largeGrow = s.value(0); // life-training
  const compactVis = s.value(0); // life-compact
  const ratesVis = s.value(0); // life-rates
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const lg = Math.max(0.15, largeGrow.value);
    const cv = compactVis.value;
    const rv = ratesVis.value;
    const p = pulse.value;

    const barLeft = -470;
    const scale = 102; // 7.20 * 102 = 734px

    nodes.push(
      txt(
        'Both models pass the same task evaluation   ·   0 served tokens so far',
        0,
        -255,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    LIFETIME_MODELS.forEach((m, i) => {
      const cy = -75 + i * 215;
      const a = (i === 0 ? 1 : cv) * alpha;
      if (a < 0.02) return;
      const tVal = trainFlops(m.n, m.d) / 1e23; // 5.88, 7.20
      const w = tVal * scale * (i === 0 ? lg : Math.max(0.15, cv));
      const perTokB = (2 * m.n) / 1e9; // 140, 60

      nodes.push(
        txt(m.label, barLeft - 32, cy - 14, 34, m.color, 'mono', 'right')
          .glow(6, m.color)
          .opacity(a),
        txt(
          i === 0 ? 'Chinchilla-like' : 'Overtrained compact',
          barLeft - 32,
          cy + 28,
          26,
          COSMOS.muted,
          'sans',
          'right',
        ).opacity(a),
        lumBar(barLeft + w / 2, cy, w, 86, {
          color: m.color,
          fillOpacity: 0.42,
          strokeWidth: 2.8,
          glow: 11,
          opacity: a,
        }),
        txt(`${fmt(tVal, 2)} × 10²³`, barLeft + w + 28, cy, 34, COSMOS.ink, 'mono', 'left').opacity(
          a,
        ),
      );

      if (rv > 0.05) {
        nodes.push(
          txt(
            `Inference: ${perTokB}B FLOPs / tok`,
            barLeft,
            cy + 78,
            28,
            i === 1 ? ROLE.optimal : ROLE.compute,
            'mono',
            'left',
          )
            .glow(6, i === 1 ? ROLE.optimal : ROLE.compute)
            .opacity(rv * a),
        );
      }
    });

    if (rv > 0.3) {
      nodes.push(
        txt(
          'Compact 30B pays +1.32 × 10²³ upfront, saves 80B FLOPs on every served token',
          0,
          355,
          30,
          ROLE.optimal,
          'mono',
          'center',
        )
          .glow(7, ROLE.optimal)
          .opacity(rv * alpha),
      );
    } else {
      nodes.push(
        txt(
          'At Q = 0 requests, every FLOP spent so far is training compute (6ND)',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    nodes.push(
      glowDot(-420 + ((p * 1.9) % 1) * 840, 410, {
        radius: 5,
        color: ROLE.tokens,
        glow: 10,
        opacity: 0.75 * alpha,
      }),
    );

    return nodes;
  });

  const eq = glowTex('C_{\\text{train}} = 6ND \\qquad C_{\\text{infer/tok}} = 2N', {
    x: 420,
    y: -365,
    size: 34,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, stageLayer, eq);
  scenePulse(s, c, pulse);

  playCue(s, c, 'life-training', (d) => s.play(largeGrow.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'life-compact', (d) => s.play(compactVis.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'life-rates', (d) => s.play(ratesVis.to(1, { duration: d })), { dur: 0.9 });
}
