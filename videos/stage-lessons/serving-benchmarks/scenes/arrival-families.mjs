// Scene 6: arrival-families - How closely do arrivals bunch together?
// 3-mode glowing arrival pulse-train emitter:
//   Mode 0: Regular (CV=0), Gamma k=4 (CV=0.5), Poisson (CV=1), Gamma k=1/4 (CV=2) + CV=1/sqrt(k)
//   Mode 1: vLLM constant-rate rescaling stretching sampled Gamma [..1.69s] -> exactly 6/3 = 2.00s
//   Mode 2: Time-scaling the 6-request trace by 0.5x (2000 ms -> 1000 ms) with staggered IDs.
import { group, line, par } from 'vizmatic/stage';
import {
  COSMOS,
  GAMMA_FAMILIES,
  ROLE,
  SAMPLED_GAMMA_ARRIVALS,
  SERVING_COHORT,
  VLLM_RESCALED_END_S,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  timeAxisNodes,
  txt,
} from '../parts.mjs';

// Deterministic representative pulse times in [0, 1] for each arrival family
const FAMILY_PULSES = Object.freeze([
  [0.08, 0.25, 0.42, 0.58, 0.75, 0.92], // Regular CV=0
  [0.07, 0.22, 0.44, 0.56, 0.78, 0.93], // Gamma k=4 CV=0.5
  [0.05, 0.14, 0.38, 0.43, 0.76, 0.95], // Poisson CV=1
  [0.04, 0.07, 0.11, 0.16, 0.74, 0.94], // Gamma k=1/4 CV=2 (bursty cluster)
]);

export default function arrivalFamilies(s, c) {
  const famReveal = s.value(0.25);
  const mode01 = s.value(0); // 0 = CV families, 1 = vLLM rescaling
  const stretchProg = s.value(0); // 0 = 1.69s, 1 = 2.00s
  const mode12 = s.value(0); // 0 = rescaling, 1 = time-scaling trace
  const scaleFactor = s.value(1); // 1.0 -> 0.5

  const header = cinemaHeader('ARRIVAL WAVE EMITTER', 'How closely do', 'arrivals bunch?', {
    x: -860,
    y: -435,
    accent: ROLE.burst,
    size: 50,
  });

  const stageAura = aura(160, 20, 680, '#fb923c1c', '#5ce1e61a');

  const cvEq = glowTex(String.raw`\mathrm{CV} = \frac{1}{\sqrt{k}}`, {
    x: 590,
    y: -365,
    size: 40,
    color: ROLE.focus,
    glow: 7,
  });

  // Mode 0: Four arrival families with pulse trains + glowing CV meters
  const view0 = guardedDynamic(
    () => fadeOutHalf(mode01.value),
    (a) => {
      const fr = famReveal.value;
      const topY = -145;
      const rowStep = 132;
      const xLeft = -450;
      const xRight = 250;
      const barLeft = 340;
      const barW = 340;

      const nodes = [
        txt('FAMILY', -850, topY - 58, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(
          'EQUAL MEAN RATE PULSE TRAIN',
          (xLeft + xRight) * 0.5,
          topY - 58,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(a),
        txt('GAP CV', barLeft + barW * 0.5, topY - 58, 26, COSMOS.muted, 'mono').opacity(a),
      ];

      GAMMA_FAMILIES.forEach((f, idx) => {
        const yy = topY + idx * rowStep;
        const pulses = FAMILY_PULSES[idx];
        nodes.push(
          txt(f.name, -850, yy, 28, f.color, 'mono', 'left').glow(4, f.color).opacity(a),
          line([xLeft, yy], [xRight, yy], { stroke: '#233152', width: 2.2 }).opacity(a),
        );
        for (const u of pulses) {
          const px = xLeft + u * (xRight - xLeft);
          nodes.push(
            glowingTrail(
              [
                [px, yy - 24],
                [px, yy + 24],
              ],
              { color: f.color, width: 4.5, glow: 8, opacity: a },
            ),
            glowDot(px, yy - 26, { radius: 5.5, color: '#ffffff', glow: 10, opacity: a }),
          );
        }
        nodes.push(
          glowBar(barLeft, yy, barW, 28, (f.cv / 2) * fr, {
            fill: f.color,
            glow: 8,
            radius: 7,
            opacity: a,
          }),
          txt(`CV = ${f.cv}`, barLeft + barW + 24, yy, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        );
      });

      nodes.push(
        txt(
          'Real correlated bursts can differ from every parametric model',
          0,
          422,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: vLLM constant-rate rescaling of 6 sampled Gamma gaps (1.69 s -> 2.00 s)
  const view1 = guardedDynamic(
    () => fadeInHalf(mode01.value) * fadeOutHalf(mode12.value),
    (a) => {
      const sp = stretchProg.value;
      const ratio = VLLM_RESCALED_END_S / SAMPLED_GAMMA_ARRIVALS.at(-1);
      const factor = 1 + (ratio - 1) * sp;
      const rescaled = SAMPLED_GAMMA_ARRIVALS.map((t) => t * factor);

      const xLeft = -560;
      const xRight = 760;
      const maxS = 2.2;
      const xOf = (sec) => xLeft + (sec / maxS) * (xRight - xLeft);

      const yRaw = -115;
      const yRes = 215;
      const xTarget = xOf(VLLM_RESCALED_END_S);

      const nodes = [
        dashedRule(xTarget, yRaw - 46, xTarget, yRaw + 12, ROLE.focus, 0.85 * a, 2.8),
        dashedRule(xTarget, yRes - 46, xTarget, yRes + 12, ROLE.focus, 0.85 * a, 2.8),
        txt('6 / 3 = 2.00 s', xTarget, yRaw - 122, 28, ROLE.focus, 'mono')
          .glow(6, ROLE.focus)
          .opacity(a),
        txt('SAMPLED GAMMA', -860, yRaw - 14, 28, ROLE.workload, 'mono', 'left').opacity(a),
        txt('Last: 1.69 s', -860, yRaw + 28, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('vLLM RESCALED', -860, yRes - 14, 28, ROLE.open, 'mono', 'left')
          .glow(5, ROLE.open)
          .opacity(a),
        txt(
          `Last: ${rescaled.at(-1).toFixed(2)} s`,
          -860,
          yRes + 28,
          26,
          ROLE.open,
          'mono',
          'left',
        ).opacity(a),
      ];

      // Draw both pulse rows + glowing stretch rays between them
      [
        { arr: SAMPLED_GAMMA_ARRIVALS, y: yRaw, col: ROLE.workload },
        { arr: rescaled, y: yRes, col: ROLE.open },
      ].forEach(({ arr, y, col }) => {
        nodes.push(
          ...timeAxisNodes(xLeft, xRight, y, 0, maxS, [0, 0.5, 1, 1.5, 2], {
            format: (v) => `${v}s`,
            opacity: a,
          }),
        );
        arr.forEach((sec, j) => {
          const px = xOf(sec);
          nodes.push(
            glowingTrail(
              [
                [px, y - 44],
                [px, y],
              ],
              { color: col, width: 5.0, glow: 8, opacity: a },
            ),
            glowDot(px, y - 48, { radius: 6.5, color: col, glow: 10, opacity: a }),
            txt(`#${j + 1}`, px, y - 82, 26, col, 'mono').opacity(a),
          );
        });
      });

      // Connecting rays stopping well clear above #1..#6 labels on yRes!
      SAMPLED_GAMMA_ARRIVALS.forEach((sec, j) => {
        nodes.push(
          dashedRule(xOf(sec), yRaw + 62, xOf(rescaled[j]), yRes - 116, ROLE.focus, 0.52 * a, 1.8),
        );
      });

      nodes.push(
        txt(
          'Constant-rate vLLM locks final arrival to N / rate  ·  Self-timed replay keeps saved timestamps',
          0,
          418,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 2: Time-scaling the 6-request trace by 0.5x
  const view2 = guardedDynamic(
    () => fadeInHalf(mode12.value),
    (a) => {
      const sf = scaleFactor.value;
      const xLeft = -560;
      const xRight = 760;
      const maxMs = 2000;
      const xOf = (ms) => xLeft + (ms / maxMs) * (xRight - xLeft);
      const yOrig = -115;
      const yScaled = 195;

      const nodes = [
        txt('SAVED TRACE (1.0x)', -860, yOrig - 10, 26, ROLE.workload, 'mono', 'left').opacity(a),
        txt('2000 ms window', -860, yOrig + 32, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(`TIME FACTOR ${sf.toFixed(2)}x`, -860, yScaled - 10, 28, ROLE.open, 'mono', 'left')
          .glow(5, ROLE.open)
          .opacity(a),
        txt(
          `${Math.round(2000 * sf)} ms window`,
          -860,
          yScaled + 32,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(a),
      ];

      // Non-crossing label placement for both 1.0x and 0.5x compressed clusters (r01/r02 and r03/r04/r05)
      const layouts = [
        { stemH: 38, dy: -66, dx: 0, anchor: 'center' }, // r01
        { stemH: 82, dy: -112, dx: 0, anchor: 'center' }, // r02 (elevated above r01)
        { stemH: 38, dy: -66, dx: -16, anchor: 'right' }, // r03 (left of cluster)
        { stemH: 86, dy: -116, dx: 0, anchor: 'center' }, // r04 (high above r03 & r05 stems)
        { stemH: 38, dy: -66, dx: 16, anchor: 'left' }, // r05 (right of cluster)
        { stemH: 38, dy: -66, dx: 0, anchor: 'center' }, // r06
      ];

      [
        { factor: 1, y: yOrig, col: ROLE.workload },
        { factor: sf, y: yScaled, col: ROLE.open },
      ].forEach(({ factor, y, col }) => {
        nodes.push(
          ...timeAxisNodes(xLeft, xRight, y, 0, maxMs, [0, 500, 1000, 1500, 2000], {
            format: (v) => `${v}ms`,
            opacity: a,
          }),
        );
        SERVING_COHORT.forEach((r, j) => {
          const px = xOf(r.scheduled * factor);
          const lay = layouts[j];
          const stemTop = y - lay.stemH;
          nodes.push(
            glowingTrail(
              [
                [px, stemTop],
                [px, y],
              ],
              { color: col, width: 4.5, glow: 8, opacity: a },
            ),
            glowDot(px, stemTop, { radius: 6.0, color: col, glow: 9, opacity: a }),
            txt(r.id, px + lay.dx, y + lay.dy, 26, col, 'mono', lay.anchor).opacity(a),
          );
        });
      });

      nodes.push(
        txt(
          'Halving gaps doubles offered rate and halves duration  ·  MLPerf: Single Stream vs Poisson Server',
          0,
          418,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, cvEq, view0, view1, view2);

  c.on('arrival-families-beat-0', () => {
    const t = c.cue('arrival-families-beat-0').start;
    s.play(famReveal.to(1, { duration: clampDur(c, t, 0.9) }));
  });
  c.hide('arrival-families-beat-1', cvEq);
  c.on('arrival-families-beat-1', () => {
    const t = c.cue('arrival-families-beat-1').start;
    s.play(
      par(
        mode01.to(1, { duration: clampDur(c, t, 0.5) }),
        stretchProg.to(1, { duration: clampDur(c, t, 1.4) }),
      ),
    );
  });
  c.on('arrival-families-beat-2', () => {
    const t = c.cue('arrival-families-beat-2').start;
    s.play(mode12.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('family-time-scale', () => {
    const t = c.cue('family-time-scale').start;
    s.play(scaleFactor.to(0.5, { duration: clampDur(c, t, 1.0) }));
  });
}
