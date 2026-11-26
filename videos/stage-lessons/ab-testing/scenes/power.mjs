// Scene 08 (power): "Plan traffic around an effect worth finding"
// Projected 95% CI narrowing across n=200, 500, 2000 + orbiting 3D power surface P(n, delta) with 80% target contour + n=9,246 shortcut for 2 pp MDE!
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  buildPowerSurface3d,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lift,
  orbitScene,
  projectedInterval,
  requiredN,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const IV200 = projectedInterval(200);
const IV500 = projectedInterval(500);
const IV2000 = projectedInterval(2000);
const N_REQ = Math.round(requiredN(0.38, 0.02)); // 9246

export default function powerScene(s, c) {
  const phase = s.value(0);
  const show200 = s.value(0);
  const show500 = s.value(0);
  const show2000 = s.value(0);
  const showTarget = s.value(0);
  const showSample = s.value(0);
  const showObs = s.value(0);
  const showSmaller = s.value(0);

  const bgAura = aura(445, 20, 540, '#133a4a3a', '#261b4f22');
  const { view: power3d } = buildPowerSurface3d({ x: 445, y: 15 });

  const title = heroTitle(['Plan Traffic Around', 'an Effect Worth Finding'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: CTRL_COLOR,
    eyebrow: 'SAMPLE SIZE & STATISTICAL POWER',
  });

  const eqN = glowTex(
    `n \\approx \\frac{2p(1-p)(z_{\\alpha/2}+z_\\beta)^2}{\\delta^2} = ${N_REQ.toLocaleString()}\\text{/arm}`,
    { x: -455, y: 270, size: 32, color: WARN_COLOR, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const axL = -820;
    const axR = -40;
    const xP = (pp) => axL + ((pp + 6) / 20) * (axR - axL);
    const rows = [
      {
        iv: IV200,
        y: -155,
        label: 'n = 200 / arm',
        op: 0.45 + 0.55 * show200.value,
        col: BAD_COLOR,
      },
      {
        iv: IV500,
        y: -55,
        label: 'n = 500 / arm',
        op: 0.35 + 0.65 * show500.value,
        col: WARN_COLOR,
      },
      {
        iv: IV2000,
        y: 45,
        label: 'n = 2,000 / arm',
        op: 0.35 + 0.65 * show2000.value,
        col: GOOD_COLOR,
      },
    ];

    const nodes = [
      txt('PROJECTED 95% CI WIDTHS AT +4.0 pp LIFT', -855, -245, 26, CTRL_COLOR, 'mono', 'left'),
      line([xP(0), -205], [xP(0), 110], { stroke: BAD_COLOR, width: 3, dash: [8, 6] }),
      rule(axL, 110, axR, 110, COSMOS.muted, 2.5),
      ...[-5, 0, 4, 10, 14].map((v) =>
        txt(`${v > 0 ? '+' : ''}${v}`, xP(v), 146, 26, v === 0 ? BAD_COLOR : COSMOS.muted, 'mono'),
      ),
      txt('3D POWER SURFACE P(n, delta)', 445, -395, 26, CTRL_COLOR, 'mono').glow(6, CTRL_COLOR),
      txt(
        'Power rises with sample size n and effect size (n ~ 1/delta^2)',
        445,
        430,
        26,
        WARN_COLOR,
        'sans',
      ),
    ];

    rows.forEach((r) => {
      const loX = Math.max(axL, xP(r.iv.low * 100));
      const hiX = Math.min(axR, xP(r.iv.high * 100));
      nodes.push(
        txt(r.label, -855, r.y - 34, 26, r.col, 'mono', 'left').opacity(r.op),
        line([loX, r.y], [hiX, r.y], { stroke: r.col, width: 7 }).glow(7, r.col).opacity(r.op),
        glowDot(xP(lift * 100), r.y, { radius: 8, color: r.col, glow: 10, opacity: r.op }),
        txt(
          `[${(r.iv.low * 100).toFixed(1)}, +${(r.iv.high * 100).toFixed(1)}] pp`,
          hiX + 14,
          r.y,
          26,
          r.col,
          'mono',
          'left',
        ).opacity(r.op),
      );
    });

    if (showTarget.value > 0.02) {
      nodes.push(
        txt(
          'MDE = +2.0 pp · alpha = 0.05 (2-sided) · Power = 80%',
          -855,
          195,
          26,
          WARN_COLOR,
          'mono',
          'left',
        ).opacity(showTarget.value),
      );
    }

    const obsOp = showObs.value * Math.max(0, 1 - showSmaller.value * 2.6);
    if (obsOp > 0.02) {
      nodes.push(
        txt(
          '2,000/arm clears zero for the +4.0 pp observed lift',
          -855,
          365,
          28,
          GOOD_COLOR,
          'sans',
          'left',
        ).opacity(obsOp),
      );
    }
    const smOp = Math.max(0, (showSmaller.value - 0.45) / 0.55);
    if (smOp > 0.02) {
      nodes.push(
        txt(
          'Reliably catching +2.0 pp takes ~9,246 incidents per arm!',
          -855,
          365,
          28,
          TRT_COLOR,
          'mono',
          'left',
        )
          .glow(6, TRT_COLOR)
          .opacity(smOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, power3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, power3d, { theta: 0.46, phi: 0.98 });

  tweenCue(s, c, 'n200', show200, 1, { duration: 0.45 });
  tweenCue(s, c, 'n500', show500, 1, { duration: 0.45 });
  tweenCue(s, c, 'n2000', show2000, 1, { duration: 0.45 });
  tweenCue(s, c, 'target', showTarget, 1, { duration: 0.45 });
  c.show('sample', eqN);
  tweenCue(s, c, 'sample', showSample, 1, { duration: 0.5 });
  tweenCue(s, c, 'observed', showObs, 1, { duration: 0.45 });
  tweenCue(s, c, 'smaller', showSmaller, 1, { duration: 0.45 });
}
