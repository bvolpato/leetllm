// Scene 17: sign-angle: "Change the magnitudes and keep the signs"
// Left: Dual glowing magnitude waveforms where pink swaps tall/short pairs while keeping identical signs.
// Right: Orbiting 3D unit sphere with nearly orthogonal green/pink vectors & random cutting hyperplanes
// illustrating E[Hamming/b] = theta/pi vs fixed-axis sign collision.
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  buildUnitSphere3d,
  cinemaAtmosphere,
  cosine,
  glowTex,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function signAngle(s, c) {
  const vecA = [1, 0.01, -1, -0.01];
  const vecB = [0.01, 1, -0.01, -1];
  const cosVal = cosine(vecA, vecB); // ~0.020
  const angleOverPi = Math.acos(cosVal) / Math.PI; // ~0.494

  const phase = s.value(0);
  const shiftMix = s.value(0);
  const showSame = s.value(0);
  const showCos = s.value(0);
  const showAngle = s.value(0);
  const showRandom = s.value(0);
  const showTies = s.value(0);

  // Orbiting 3D unit sphere showing nearly orthogonal vectors sliced by isotropic hyperplanes
  const { view: sphere3d } = buildUnitSphere3d({
    x: 525,
    y: -145,
    radius: 1.7,
    unit: 98,
    distance: 13.6,
    theta: -0.78,
    phi: 1.06,
    vectors: [
      { dir: [1, 0.02, 0.12], color: ROLE.A, width: 4.5 },
      { dir: [0.02, 1, 0.12], color: ROLE.B, width: 4.5 },
    ],
    geodesics: [{ a: [1, 0.02, 0.12], b: [0.02, 1, 0.12], color: ROLE.gold, width: 3.6 }],
    hyperplanes: [
      { normal: [0.65, -0.58, 0.48], color: ROLE.violet, opacity: 0.22 },
      { normal: [-0.45, 0.72, 0.52], color: ROLE.code, opacity: 0.2 },
    ],
  });

  const title = heroTitle(['Change the magnitudes,', 'keep the signs'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.B,
    eyebrow: 'FIXED-AXIS SIGNS  vs  RANDOM HYPERPLANES',
  });

  const planeFormula = glowTex(
    '\\mathbb{E}\\!\\left[\\frac{D_H}{b}\\right] = \\frac{\\theta}{\\pi}',
    {
      x: 525,
      y: 120,
      size: 38,
      color: ROLE.violet,
      glow: 7,
    },
  );

  const stageLayer = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sm = shiftMix.value;
    const curB = vecA.map((v, i) => v + sm * (vecB[i] - v));

    const nodes = [
      rule(145, -390, 145, 415, COSMOS.rule, 1.8).opacity(0.6),
      txt('ISOTROPIC RANDOM HYPERPLANES', 525, -365, 26, ROLE.violet, 'mono'),
    ];

    // Left-top: Green magnitude profile
    const drawWave = (vals, baseX, baseY, color, labelText) => {
      const barW = 74;
      const gap = 22;
      const maxH = 148;
      nodes.push(
        txt(labelText, baseX, baseY - maxH - 46, 30, color, 'serif', 'left').glow(5, color),
        line([baseX - 10, baseY], [baseX + 4 * (barW + gap) - 10, baseY], {
          stroke: '#4b5f8c',
          width: 2.4,
        }),
      );
      vals.forEach((v, i) => {
        const mag = Math.abs(v);
        const h = Math.max(8, mag * maxH);
        const cx = baseX + i * (barW + gap) + barW / 2;
        const signStr = v > 0 ? '+' : '-';
        nodes.push(
          lumBar(cx, baseY - h / 2, barW, h, {
            color,
            fillAlpha: 0.36,
            strokeWidth: 2.2,
            glow: mag > 0.5 ? 9 * pulse : 3,
          }),
          txt(`d${i}${signStr}`, cx, baseY + 34, 26, COSMOS.muted, 'mono'),
        );
      });
    };

    drawWave(vecA, -845, -35, ROLE.A, 'Green row (fixed)');
    drawWave(curB, -350, -35, ROLE.B, 'Pink row (swapped magnitudes)');

    // Left-bottom: Shared fixed-axis sign codes (revealed on `same`)
    const sameOp = showSame.value;
    nodes.push(txt('FIXED-AXIS SIGN CODE', -845, 118, 26, COSMOS.muted, 'mono', 'left'));
    const signs = [1, 1, 0, 0];
    signs.forEach((b, i) => {
      const cx = -785 + i * 114;
      nodes.push(
        lumBar(cx, 198, 94, 74, {
          color: sameOp > 0.5 ? ROLE.gold : '#3c507c',
          fillAlpha: sameOp > 0.5 ? 0.24 : 0.1,
          strokeWidth: sameOp > 0.5 ? 2.8 : 1.8,
          glow: sameOp > 0.5 ? 9 * pulse : 3,
        }),
        txt(
          sameOp > 0.5 ? String(b) : '?',
          cx,
          198,
          38,
          sameOp > 0.5 ? ROLE.gold : COSMOS.dim,
          'mono',
        ),
      );
    });

    if (sameOp > 0.02) {
      nodes.push(
        txt('Hamming = 0  (identical!)', -325, 198, 32, ROLE.gold, 'mono', 'left')
          .glow(7, ROLE.gold)
          .opacity(sameOp),
      );
    }

    // Bottom-left quantitative telemetry
    if (showCos.value > 0.02) {
      nodes.push(
        txt(
          `True cosine ≈ ${cosVal.toFixed(2)}  (nearly 90°!)`,
          -845,
          305,
          34,
          ROLE.danger,
          'mono',
          'left',
        )
          .glow(7, ROLE.danger)
          .opacity(showCos.value),
      );
    }
    if (showAngle.value > 0.02) {
      nodes.push(
        txt(`θ / π ≈ ${angleOverPi.toFixed(3)}`, -845, 366, 32, ROLE.violet, 'mono', 'left')
          .glow(6, ROLE.violet)
          .opacity(showAngle.value),
      );
    }
    if (showRandom.value > 0.02) {
      nodes.push(
        txt('Fixed coordinate axes ≠ random hyperplanes', 200, 225, 28, ROLE.violet, 'sans', 'left')
          .glow(5, ROLE.violet)
          .opacity(showRandom.value),
      );
    }
    if (showTies.value > 0.02) {
      nodes.push(
        lumBar(518, 335, 690, 74, {
          color: ROLE.warn,
          fillAlpha: 0.16,
          strokeWidth: 2.4,
          glow: 8,
          opacity: showTies.value,
        }),
        txt('384 bits → 385 distances (ties guaranteed)', 518, 335, 26, ROLE.warn, 'mono').opacity(
          showTies.value,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.B, ROLE.violet), title, sphere3d, stageLayer);

  runPhase(s, c, phase, 8);
  orbitScene(s, c, sphere3d, { theta: 0.52, phi: 0.96 });

  playCue(s, c, 'shift', (d) => s.play(shiftMix.to(1, { duration: d })), { dur: 2.4 });
  playCue(s, c, 'same', (d) => s.play(showSame.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'cos', (d) => s.play(showCos.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'angle', (d) => s.play(showAngle.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'random', (d) => s.play(showRandom.to(1, { duration: d })), { dur: 0.5 });
  c.show('random', planeFormula);
  playCue(s, c, 'ties', (d) => s.play(showTies.to(1, { duration: d })), { after: true, dur: 0.45 });
}
