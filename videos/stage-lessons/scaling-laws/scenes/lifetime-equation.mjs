// Scene 20: lifetime-equation: "How many tokens repay the training bill?"
// SIGNATURE OVER-TRAINING INFERENCE-LIFETIME TRADE-OFF SCENE:
// Top: Stacked 6ND (training) + 2NQ (serving) glowing beams sweeping Q: 0 -> 1T -> 1.65T -> 3T.
// Bottom: Crossing lifetime FLOP curves C_total(Q) = 6ND + 2NQ intersecting cleanly at
//   Q* = 1.65T tokens (8.19e23 FLOPs), after which the overtrained 30B model wins!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  LIFETIME_CROSSING_T,
  LIFETIME_CROSSING_TOTAL_E23,
  LIFETIME_MODELS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  serveFlops,
  trainFlops,
} from '../parts.mjs';

export default function lifetimeEquation(s, c) {
  const title = heroTitle(['How many tokens repay', 'the training bill?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.compute,
  });

  const billGlow = s.value(0); // life-bill
  const toOne = s.value(0); // life-one: Q 0 -> 1.0T
  const premVis = s.value(0); // life-premium
  const toCross = s.value(0); // life-crossing / life-match: Q 1.0 -> 1.65T
  const matchGlow = s.value(0); // life-match
  const toThree = s.value(0); // life-three: Q 1.65 -> 3.0T

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const qT =
      toOne.value * 1.0 +
      toCross.value * (LIFETIME_CROSSING_T - 1.0) +
      toThree.value * (3.0 - LIFETIME_CROSSING_T);
    const pv = premVis.value;
    const mg = matchGlow.value;
    const t3 = toThree.value;

    // TOP: Stacked 6ND + 2NQ beams (y: -215 .. -30)
    const barLeft = -460;
    const scale = 88; // 10.08 * 88 = 887px (fits cleanly to +427, readout at +510)

    nodes.push(
      txt(`Served demand Q = ${fmt(qT, 2)}T tokens`, 450, -355, 36, ROLE.compute, 'mono', 'center')
        .glow(8, ROLE.compute)
        .opacity(alpha),
    );

    LIFETIME_MODELS.forEach((m, i) => {
      const cy = -205 + i * 102;
      const tr = trainFlops(m.n, m.d) / 1e23;
      const sv = serveFlops(m.n, qT * 1e12) / 1e23;
      const tot = tr + sv;
      const wTr = tr * scale;
      const wSv = sv * scale;
      const isLead = (t3 > 0.5 && i === 1) || (t3 < 0.2 && toCross.value < 0.9 && i === 0);

      nodes.push(
        txt(m.label, barLeft - 24, cy, 30, m.color, 'mono', 'right')
          .glow(isLead ? 7 : 0, m.color)
          .opacity(alpha),
        lumBar(barLeft + wTr / 2, cy, wTr - 2, 58, {
          color: ROLE.params,
          fillOpacity: 0.44,
          strokeWidth: 2.4,
          glow: 7 + 3 * billGlow.value,
          opacity: alpha,
        }),
        txt(fmt(tr, 2), barLeft + wTr / 2, cy, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
      if (wSv > 4) {
        nodes.push(
          lumBar(barLeft + wTr + wSv / 2, cy, wSv - 2, 58, {
            color: ROLE.tokens,
            fillOpacity: 0.48,
            strokeWidth: 2.6,
            glow: 10,
            opacity: alpha,
          }),
        );
        if (wSv > 128) {
          nodes.push(
            txt(
              `+${fmt(sv, 2)}`,
              barLeft + wTr + wSv / 2,
              cy,
              26,
              COSMOS.ink,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }
      }
      nodes.push(
        txt(
          `${fmt(tot, 2)}×10²³`,
          barLeft + wTr + wSv + 22,
          cy,
          30,
          isLead ? ROLE.optimal : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(isLead ? 8 : 0, ROLE.optimal)
          .opacity(alpha),
      );
    });

    // Vertical crossing marker between stacked bars at 8.19
    if (mg > 0.2 && t3 < 0.3) {
      const xMatch = barLeft + LIFETIME_CROSSING_TOTAL_E23 * scale;
      nodes.push(
        line([xMatch, -242], [xMatch, -62], { stroke: ROLE.compute, width: 3.4 }).opacity(
          mg * (1 - t3 * 3) * alpha,
        ),
      );
    }

    // BOTTOM: Crossing lifetime trade-off curves C_total(Q) = 6ND + 2NQ
    const plane = plotPlane({
      left: -740,
      right: 260,
      top: 15,
      bottom: 335,
      xDomain: [0, 3.2],
      yDomain: [5.0, 10.6],
      xTicks: [0, 1, 1.65, 3].map((v) => ({ v, label: `${v}T` })),
      yTicks: [6, 8, 10].map((v) => ({ v, label: `${v}e23` })),
      xLabel: 'Served tokens Q',
      yLabel: 'Total FLOPs',
      opacity: alpha,
    });
    nodes.push(plane.node);

    const curve70 = sampleCurve(
      plane,
      (q) => (trainFlops(70e9, 1.4e12) + serveFlops(70e9, q * 1e12)) / 1e23,
      0,
      3.15,
      48,
    );
    const curve30 = sampleCurve(
      plane,
      (q) => (trainFlops(30e9, 4e12) + serveFlops(30e9, q * 1e12)) / 1e23,
      0,
      3.15,
      48,
    );

    nodes.push(
      glowingTrail(curve70, { color: ROLE.params, width: 4.2, glow: 10, opacity: alpha }),
      glowingTrail(curve30, { color: ROLE.tokens, width: 4.2, glow: 10, opacity: alpha }),
    );

    // Active demand cursor line & twin beads
    const curX = plane.toX(qT);
    const y70 = (trainFlops(70e9, 1.4e12) + serveFlops(70e9, qT * 1e12)) / 1e23;
    const y30 = (trainFlops(30e9, 4e12) + serveFlops(30e9, qT * 1e12)) / 1e23;
    nodes.push(
      line([curX, plane.bounds.top], [curX, plane.bounds.bottom], {
        stroke: ROLE.compute,
        width: 2.2,
      }).opacity(0.65 * alpha),
      glowDot(curX, plane.toY(y70), { radius: 9, color: ROLE.params, glow: 14, opacity: alpha }),
      glowDot(curX, plane.toY(y30), { radius: 9, color: ROLE.tokens, glow: 14, opacity: alpha }),
    );

    // Highlight break-even intersection
    const [cx, cy] = plane.toScreen(LIFETIME_CROSSING_T, LIFETIME_CROSSING_TOTAL_E23);
    nodes.push(
      glowDot(cx, cy, {
        radius: 8 + 4 * mg,
        color: ROLE.compute,
        glow: 12 + 8 * mg,
        opacity: (0.45 + 0.55 * mg) * alpha,
      }),
    );
    if (mg > 0.3) {
      nodes.push(
        txt('1.65T · 8.19e23', cx, plane.bounds.top - 28, 26, ROLE.compute, 'mono', 'center')
          .glow(6, ROLE.compute)
          .opacity(mg * alpha),
      );
    }

    // Bottom-right floating summary
    const rx = 330;
    nodes.push(
      txt('LIFETIME TRADE-OFF', rx, 45, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Premium: +1.32 × 10²³', rx, 108, 28, ROLE.params, 'mono', 'left').opacity(
        (0.35 + 0.65 * pv) * alpha,
      ),
      txt('Saving: 80B / token', rx, 158, 28, ROLE.tokens, 'mono', 'left').opacity(
        (0.35 + 0.65 * pv) * alpha,
      ),
      txt(
        t3 > 0.5
          ? 'At 3T tokens: 30B wins!'
          : mg > 0.5
            ? 'Tie at Q* = 1.65T'
            : 'Q > 3D: serving > training',
        rx,
        345,
        30,
        t3 > 0.5 ? ROLE.optimal : ROLE.compute,
        'mono',
        'left',
      )
        .glow(8, t3 > 0.5 ? ROLE.optimal : ROLE.compute)
        .opacity(alpha),
    );

    return nodes;
  });

  const eqBreak = glowTex('Q^* = \\frac{1.32\\times 10^{23}}{80\\text{B}} = 1.65\\text{T}', {
    x: 565,
    y: 255,
    size: 32,
    color: ROLE.compute,
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.compute), title, stageLayer);

  playCue(s, c, 'life-bill', (d) => s.play(billGlow.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'life-one', (d) => s.play(toOne.to(1, { duration: d })), { dur: 1.2 });
  c.show('life-premium', eqBreak);
  playCue(s, c, 'life-premium', (d) => s.play(premVis.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'life-crossing', (d) => s.play(toCross.to(1, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'life-match', (d) => s.play(matchGlow.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'life-three', (d) => s.play(toThree.to(1, { duration: d })), { dur: 1.4 });
}
