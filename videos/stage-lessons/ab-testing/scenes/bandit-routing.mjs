// Scene 15 (bandit-routing): "Adapt new-incident allocation without switching an existing incident"
// Thompson Sampling Beta posteriors (pull 1: 0.98 vs 0.56 -> control; failure updates beta_C 1->2!) + orbiting 3D Beta posterior waves + 2,000-pull allocation (463 vs 1,537 = 76.8%)!
import { line } from 'vizmatic/stage';
import {
  AB_VISUAL_FIXTURES,
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  betaCurve,
  buildBanditSurface3d,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  orbitScene,
  tweenCue,
  txt,
} from '../parts.mjs';

const B = AB_VISUAL_FIXTURES.bandit;
const P1 = B.pullTrace[0]; // sampleControl 0.976, sampleTreatment 0.560, reward 0

export default function banditRouting(s, c) {
  const showSample = s.value(0);
  const showChoose = s.value(0);
  const showAlloc = s.value(0);
  const showFail = s.value(0);
  const showBias = s.value(0);

  const bgAura = aura(445, 20, 540, '#133a4a36', '#261b4f22');
  const { view: bandit3d } = buildBanditSurface3d({ x: 445, y: 15 });

  const title = heroTitle(['Thompson Sampling:', 'Adaptive Beta Routing'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: TRT_COLOR,
    eyebrow: 'MULTI-ARMED BANDITS · BETA POSTERIORS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-820, -235, 810, 310, { x: [0, 1], y: [0, 1.15] });
    const betaC = 1 + showFail.value; // 1 -> 2 after pull-1 failure!
    const ctrlPts = betaCurve(1, betaC, 42).map(([p, v]) => plot.pt([p, v]));
    const trtPts = betaCurve(1, 1, 42).map(([p, v]) => plot.pt([p, v * 0.88]));

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        showFail.value > 0.5
          ? 'PULL 1 FAILED → Control Beta(1, 2) shifts left; Rewrite keeps Beta(1, 1)'
          : 'BETA POSTERIORS:  Control Beta(1, 1)  vs  Rewrite Beta(1, 1)',
        -820,
        -268,
        26,
        CTRL_COLOR,
        'mono',
        'left',
      ),
      glowingTrail(trtPts, { color: TRT_COLOR, width: 3.8, glow: 8 }),
      glowingTrail(ctrlPts, { color: CTRL_COLOR, width: 4.5, glow: 10 }),
      ...[0, 0.25, 0.5, 0.75, 1.0].map((v) =>
        txt(v.toFixed(2), plot.xPx(v), plot.bottom + 34, 26, COSMOS.muted, 'mono'),
      ),
      txt('3D POSTERIOR SHARPENING OVER PULLS', 445, -395, 26, CTRL_COLOR, 'mono').glow(
        6,
        CTRL_COLOR,
      ),
      txt('Rewrite posterior sharpens around its 42% rate', 445, 430, 26, GOOD_COLOR, 'sans'),
    ];

    // Pull-1 competing draws (0.98 vs 0.56 -> chooses control!)
    if (showSample.value > 0.02) {
      const xc = plot.xPx(P1.sampleControl);
      const xt = plot.xPx(P1.sampleTreatment);
      nodes.push(
        line([xc, plot.top + 15], [xc, plot.bottom], {
          stroke: CTRL_COLOR,
          width: 3,
          dash: [7, 5],
        }).opacity(showSample.value),
        glowDot(xc, plot.yPx(0.95), {
          radius: 9,
          color: CTRL_COLOR,
          glow: 12,
          opacity: showSample.value,
        }),
        txt('Ctrl 0.98', xc - 10, plot.top - 4, 26, CTRL_COLOR, 'mono', 'right').opacity(
          showSample.value,
        ),

        line([xt, plot.top + 56], [xt, plot.bottom], {
          stroke: TRT_COLOR,
          width: 3,
          dash: [7, 5],
        }).opacity(showSample.value),
        glowDot(xt, plot.yPx(0.82), {
          radius: 9,
          color: TRT_COLOR,
          glow: 12,
          opacity: showSample.value,
        }),
        txt('Trt 0.56', xt, plot.top + 14, 26, TRT_COLOR, 'mono').opacity(showSample.value),
      );
    }

    if (showChoose.value > 0.02) {
      nodes.push(
        txt(
          'Draw 1: max(0.98, 0.56) → routes to CONTROL (pin follow-ups!)',
          -855,
          148,
          26,
          WARN_COLOR,
          'mono',
          'left',
        ).opacity(showChoose.value),
      );
    }

    // 2,000-pull traffic split bars (463 Control vs 1,537 Rewrite = 76.8%)
    const aOp = 0.35 + 0.65 * showAlloc.value;
    const cW = (B.controlPulls / 2000) * 620;
    const tW = (B.treatmentPulls / 2000) * 620;
    nodes.push(
      txt(
        '2,000 PULLS:  Control 463 (23.2%)  vs  Rewrite 1,537 (76.8%)',
        -855,
        212,
        26,
        GOOD_COLOR,
        'mono',
        'left',
      ).opacity(aOp),
      lumBar(-855 + cW / 2, 266, cW, 38, {
        color: CTRL_COLOR,
        fillOpacity: 0.72,
        glow: 7,
        opacity: aOp,
      }),
      lumBar(-855 + cW + 10 + tW / 2, 266, tW, 38, {
        color: GOOD_COLOR,
        fillOpacity: 0.72,
        glow: 8,
        opacity: aOp,
      }),
    );

    if (showBias.value > 0.02) {
      nodes.push(
        txt(
          'Adaptive routing biases naive means: log propensities & keep explicit guardrails!',
          -855,
          355,
          26,
          BAD_COLOR,
          'mono',
          'left',
        )
          .glow(6, BAD_COLOR)
          .opacity(showBias.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, bandit3d, title, live);
  orbitScene(s, c, bandit3d, { theta: 0.45, phi: 0.98 });

  tweenCue(s, c, 'update-rule', showSample, 0.35, { duration: 0.35 });
  tweenCue(s, c, 'sample', showSample, 1, { duration: 0.45 });
  tweenCue(s, c, 'choose', showChoose, 0.75, { duration: 0.4 });
  tweenCue(s, c, 'control', showChoose, 1, { duration: 0.35 });
  tweenCue(s, c, 'allocation', showAlloc, 0.8, { duration: 0.45 });
  tweenCue(s, c, 'mature', showAlloc, 1, { duration: 0.4 });
  tweenCue(s, c, 'failure', showFail, 1, { duration: 0.75 });
  tweenCue(s, c, 'bias', showBias, 1, { duration: 0.45 });
}
