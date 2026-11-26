// Scene 11: truncation: "Where should training credit stop?"
// View 1: Parallel full vs detached timelines across error -> reproduction -> rollback,
//         showing forward parity and laser-barrier truncated BPTT credit stop.
// View 2: 2D gradient norm clipping plane sliding a 72.604-length vector cleanly back
//         along its exact ray onto the r = 5.0 emerald safety circle.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  EVENTS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowTex,
  glowVector,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  scalar,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function truncation(s, c) {
  const vTrunc = s.value(1);
  const vClip = s.value(0);

  // View 1 state
  const showCut = s.value(0);
  const showForwardEnd = s.value(0);
  const modeBack = s.value(0); // 0 = forward states, 1 = backward input gradients
  const showLowerLast = s.value(0);
  const showCutZeros = s.value(0);
  const showWeightDiff = s.value(0);

  // View 2 state
  const [gx, gy] = MODEL.rawGradient;
  const rawNorm = Math.hypot(gx, gy);
  const clipRatio = s.value(1);

  const xs = [-260, 175, 610];
  const yTop = -45;
  const yBot = 175;

  const truncView = guardedDynamic(vTrunc, (alpha) => {
    const isBack = modeBack.value > 0.5;
    const nodes = [
      heroTitle(['Where should training', 'credit stop?'], {
        x: -850,
        y: -435,
        size: 46,
        lineHeight: 54,
        accent: ROLE.warn,
      }).opacity(alpha),
      txt(
        isBack
          ? 'Backward: ∂h₃ / ∂xₜ (gradient reaching each input)'
          : 'Forward: hidden state hₜ after each event',
        395,
        -385,
        28,
        isBack ? ROLE.grad : ROLE.state,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Full history', -775, yTop, 32, COSMOS.ink, 'serif', 'left').opacity(alpha),
      txt('Detach after t₂', -775, yBot, 32, ROLE.amber, 'serif', 'left').opacity(alpha),
    ];

    // Event column pills
    EVENTS.forEach((ev, i) => {
      nodes.push(
        tokenPill(ev, xs[i], -215, ROLE.input, { w: 245, h: 52, size: 28, opacity: alpha }),
      );
    });

    // Forward connectors or backward arrows
    for (let i = 0; i < 2; i++) {
      const xA = xs[i] + 92;
      const xB = xs[i + 1] - 92;
      if (!isBack) {
        nodes.push(
          arrow([xA, yTop], [xB, yTop], { stroke: ROLE.state, width: 3.4, tip: 12 }).opacity(alpha),
          arrow([xA, yBot], [xB, yBot], { stroke: ROLE.state, width: 3.4, tip: 12 }).opacity(alpha),
        );
      } else {
        nodes.push(
          arrow([xB, yTop], [xA, yTop], { stroke: ROLE.grad, width: 3.6, tip: 12 }).opacity(alpha),
        );
        if (i === 0) {
          nodes.push(
            line([xA, yBot], [xB, yBot], {
              stroke: COSMOS.dim,
              width: 2.2,
              dash: [8, 8],
            }).opacity(0.6 * alpha),
          );
        }
      }
    }

    // Glowing laser detach barrier between t2 and t3 on lower lane
    if (showCut.value > 0.02) {
      const cutX = (xs[1] + xs[2]) / 2;
      nodes.push(
        line([cutX, yBot - 76], [cutX, yBot + 76], {
          stroke: ROLE.warn,
          width: 6,
          dash: [12, 8],
        })
          .glow(10, ROLE.warn)
          .opacity(showCut.value * alpha),
        txt('detach()', cutX, yBot - 102, 26, ROLE.warn, 'mono', 'center').opacity(
          showCut.value * alpha,
        ),
      );
    }

    // Node values
    if (!isBack) {
      for (let i = 0; i < 3; i++) {
        nodes.push(
          lumBar(xs[i], yTop, 174, 78, {
            color: ROLE.state,
            fillOpacity: 0.24,
            glow: 7,
            opacity: alpha,
          }),
          txt(fmt(scalar[i + 1], 3), xs[i], yTop, 38, ROLE.state, 'mono', 'center').opacity(alpha),
        );
        if (i < 2 || showForwardEnd.value > 0.5) {
          nodes.push(
            lumBar(xs[i], yBot, 174, 78, {
              color: i === 2 ? ROLE.gold : ROLE.state,
              fillOpacity: 0.24,
              glow: i === 2 ? 10 : 7,
              opacity: alpha,
            }),
            txt(
              fmt(scalar[i + 1], 3),
              xs[i],
              yBot,
              38,
              i === 2 ? ROLE.gold : ROLE.state,
              'mono',
              'center',
            ).opacity(alpha),
          );
        } else {
          nodes.push(
            lumBar(xs[i], yBot, 174, 78, {
              color: ROLE.gold,
              fillOpacity: 0.12,
              glow: 8,
              dash: [8, 6],
              opacity: alpha,
            }),
            txt('?', xs[i], yBot, 44, ROLE.gold, 'mono', 'center').opacity(alpha),
          );
        }
      }

      if (showCut.value > 0.02 && showForwardEnd.value < 0.5) {
        nodes.push(
          txt(
            'Will the lower run finish anywhere different?',
            0,
            355,
            36,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(showCut.value * alpha),
        );
      } else if (showForwardEnd.value > 0.5) {
        nodes.push(
          txt(
            `Forward values match: both carry ${fmt(scalar[2], 3)} into rollback`,
            0,
            355,
            32,
            ROLE.cell,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    } else {
      // Backward input gradient values
      for (let i = 0; i < 3; i++) {
        nodes.push(
          lumBar(xs[i], yTop, 174, 78, {
            color: ROLE.grad,
            fillOpacity: 0.28,
            glow: 8,
            opacity: alpha,
          }),
          txt(fmt(MODEL.inputGradient[i], 3), xs[i], yTop, 38, ROLE.grad, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
      if (showLowerLast.value > 0.02) {
        nodes.push(
          lumBar(xs[2], yBot, 174, 78, {
            color: ROLE.grad,
            fillOpacity: 0.28,
            glow: 8,
            opacity: showLowerLast.value * alpha,
          }),
          txt(fmt(MODEL.inputGradient[2], 3), xs[2], yBot, 38, ROLE.grad, 'mono', 'center').opacity(
            showLowerLast.value * alpha,
          ),
        );
      }
      if (showCutZeros.value > 0.02) {
        for (let i = 0; i < 2; i++) {
          nodes.push(
            lumBar(xs[i], yBot, 174, 78, {
              color: COSMOS.dim,
              fillOpacity: 0.14,
              glow: 0,
              opacity: showCutZeros.value * alpha,
            }),
            txt('0.000', xs[i], yBot, 38, COSMOS.muted, 'mono', 'center').opacity(
              showCutZeros.value * alpha,
            ),
          );
        }
      }
      if (showWeightDiff.value > 0.02) {
        nodes.push(
          txt(
            `Shared weight gradient:  ${fmt(MODEL.weightGradient, 3)}  ->  ${fmt(MODEL.weightTerms[2], 3)}  (rollback step only)`,
            0,
            355,
            32,
            ROLE.gold,
            'mono',
            'center',
          ).opacity(showWeightDiff.value * alpha),
        );
      }
    }

    return nodes;
  });

  // VIEW 2: Gradient Norm Clipping (||g|| = 72.604 -> 5.000, direction preserved)
  const clipView = guardedDynamic(vClip, (alpha) => {
    const r = clipRatio.value;
    const ox = -180;
    const oy = -15;
    const scale = 8.4; // 72.6 * 8.4 ~ 610 px
    const rawTip = [ox + gx * scale, oy - gy * scale];
    const curTip = [ox + gx * scale * r, oy - gy * scale * r];
    const isClipped = r < 0.25;

    return [
      heroTitle(['Gradient norm clipping:', 'same direction, safe step'], {
        x: -850,
        y: -435,
        size: 44,
        lineHeight: 52,
        accent: ROLE.cell,
      }).opacity(alpha),
      glowTex('g \\leftarrow \\min\\!\\left(1,\\,\\frac{c}{\\|g\\|_2}\\right) g', {
        x: 500,
        y: -385,
        size: 42,
        color: ROLE.gold,
        glow: 7,
      }).opacity(alpha),
      // Axes centered at origin
      line([ox - 240, oy], [ox + 680, oy], { stroke: '#40517a', width: 2.2 }).opacity(alpha),
      line([ox, oy - 240], [ox, oy + 420], { stroke: '#40517a', width: 2.2 }).opacity(alpha),
      // Emerald safety boundary circle (radius c = 5)
      glowRing(ox, oy, 5 * scale, ROLE.cell, {
        width: 3.4,
        glow: 10,
        fillOpacity: 0.14,
        opacity: alpha,
      }),
      txt('c = 5.0', ox - 64, oy - 5 * scale - 24, 28, ROLE.cell, 'mono', 'right').opacity(alpha),
      // Original unclipped ray ghost
      line([ox, oy], rawTip, { stroke: ROLE.warn, width: 3.2, dash: [10, 8] }).opacity(
        0.55 * alpha,
      ),
      glowDot(rawTip[0], rawTip[1], {
        radius: 6,
        color: ROLE.warn,
        glow: 8,
        opacity: 0.65 * alpha,
      }),
      txt(
        'raw ||g|| = 72.604',
        rawTip[0] - 20,
        rawTip[1] + 42,
        28,
        ROLE.warn,
        'mono',
        'center',
      ).opacity(alpha),
      // Active glowing gradient vector sliding straight back along the ray
      glowVector([ox, oy], curTip, {
        color: isClipped ? ROLE.cell : ROLE.gold,
        width: 7,
        tipSize: isClipped ? 16 : 24,
        glow: 12,
        opacity: alpha,
      }),
      // Live numeric vector + norm readout on left
      txt('Live gradient vector:', -820, 145, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
      txt(
        `g = [${fmt(gx * r, 3)}, ${fmt(gy * r, 3)}]`,
        -820,
        205,
        36,
        isClipped ? ROLE.cell : ROLE.gold,
        'mono',
        'left',
      )
        .glow(8, isClipped ? ROLE.cell : ROLE.gold)
        .opacity(alpha),
      txt(
        `||g||₂ = ${fmt(rawNorm * r, 3)}`,
        -820,
        275,
        42,
        isClipped ? ROLE.cell : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Direction preserved identically', -820, 345, 28, COSMOS.muted, 'sans', 'left').opacity(
        alpha,
      ),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.warn, ROLE.cell), truncView, clipView);

  playCue(s, c, 'detach-cut', (d) => s.play(showCut.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'detach-forward', (d) => s.play(showForwardEnd.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'truncation-1', (d) => s.play(modeBack.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'detach-earlier', (d) => s.play(showLowerLast.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'cut-early-gradients', (d) => s.play(showCutZeros.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'detach-weight', (d) => s.play(showWeightDiff.to(1, { duration: d })), {
    dur: 0.45,
  });

  playCue(s, c, 'truncation-2', (d) => s.play(swapVis(vTrunc, vClip, d)), { dur: 0.65 });
  playCue(s, c, 'clip-rescale', (d) => s.play(clipRatio.to(5 / rawNorm, { duration: d })), {
    dur: 1.35,
  });
}
