// Scene 1: intro - The bill for overnight testing
// Orbiting 3D dual cost-tower waterfall comparing Last Night (warm prefix) vs Tonight (expired prefix).
// Prediction withheld during beat 0; `reprice-night-input` erupts tonight's input slab from $1.62 to $4.50.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  addWireBox3D,
  aura,
  batch,
  cinemaHeader,
  cinematic3d,
  clampDur,
  coldEvaluationMicro,
  driftValue,
  evaluationMicro,
  fadeInNodes,
  fadeOutNodes,
  glowBar,
  guardedDynamic,
  hideNodes,
  nightlyCalls,
  orbitScene,
  txt,
  usd,
} from '../parts.mjs';

export default function intro(s, c) {
  const pulseT = s.value(0);
  const revealed = s.value(0); // 0 during beat 0 question, 1 on `reprice-night-input`

  const outputCharge = nightlyCalls * 80 * batch.output; // $1.20
  const warmInput = evaluationMicro - outputCharge; // $1.62
  const coldInput = coldEvaluationMicro - outputCharge; // $4.50

  const header = cinemaHeader('OVERNIGHT EVALUATION', 'Same prompts,', 'same answer length', {
    x: -860,
    y: -415,
    accent: ROLE.cached,
    size: 52,
  });

  const sceneAura = aura(250, 20, 620, '#ffd16628', '#5ce1e618');

  // 3D Cost-Tower Landscape: Last Night (left prism stack) vs Tonight (right prism stack)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 14.8,
    unit: 118,
    focus: [0, 0, 1.35],
  }).at(285, 25);

  view3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Height scale: $1.00 = 0.62 units
  const hOut = (outputCharge / 1e6) * 0.62; // 0.744
  const hWarmIn = (warmInput / 1e6) * 0.62; // 1.004
  const hColdIn = (coldInput / 1e6) * 0.62; // 2.79

  // Last night tower (x = -2.1..-0.5): Output bottom (rose) + Warm input top (cyan/gold)
  addBox3D(view3d, -2.1, -0.75, 0.04, 1.55, 1.5, hOut, ROLE.output, ROLE.output, {
    faceOpacity: 0.84,
    edgeGlow: 7,
  });
  addBox3D(view3d, -2.1, -0.75, 0.08 + hOut, 1.55, 1.5, hWarmIn, ROLE.input, ROLE.cached, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });

  // Tonight tower (x = 0.55..2.1): Output bottom (identical rose) + pending wireframe initially
  addBox3D(view3d, 0.55, -0.75, 0.04, 1.55, 1.5, hOut, ROLE.output, ROLE.output, {
    faceOpacity: 0.84,
    edgeGlow: 7,
  });
  const pendingInputWire = addWireBox3D(
    view3d,
    0.55,
    -0.75,
    0.08 + hOut,
    1.55,
    1.5,
    hColdIn,
    ROLE.cached,
    { width: 2.2, opacity: 0.78, glow: 8 },
  );

  // Revealed cold input prism + photon arc showing the jump!
  const coldInputSolid = hideNodes([
    ...addBox3D(view3d, 0.55, -0.75, 0.08 + hOut, 1.55, 1.5, hColdIn, ROLE.cached, ROLE.cached, {
      faceOpacity: 0.86,
      edgeWidth: 2.5,
      edgeGlow: 10,
    }),
    ...addPointerArc3D(
      view3d,
      [-1.32, 0, 0.08 + hOut + hWarmIn],
      [1.32, 0, 0.08 + hOut + hColdIn],
      ROLE.cached,
      { lift: 0.85, pulseVal: pulseT, phaseOffset: 0.1 },
    ),
  ]);

  // Left-side structured receipt comparison (floating typography + glowing bars, zero cards)
  const leftReadouts = guardedDynamic(
    () => 1,
    () => {
      const rev = revealed.value;
      const showAns = rev > 0.5;
      const tonightInFrac = showAns ? 1 : 0;
      const nodes = [
        txt('LAST NIGHT  ·  PREFIX REUSED', -860, -180, 26, ROLE.input, 'mono', 'left'),
        txt('Read prompts', -860, -124, 28, COSMOS.muted, 'sans', 'left'),
        txt(usd(warmInput), -310, -124, 30, ROLE.input, 'mono', 'right'),
        glowBar(-860, -82, 550, 18, warmInput / coldInput, { fill: ROLE.input, glow: 7 }),

        txt('Write answers', -860, -30, 28, COSMOS.muted, 'sans', 'left'),
        txt(usd(outputCharge), -310, -30, 30, ROLE.output, 'mono', 'right'),
        glowBar(-860, 12, 550, 18, outputCharge / coldInput, { fill: ROLE.output, glow: 7 }),

        txt('TOTAL  (2,000 checks)', -860, 68, 26, COSMOS.muted, 'mono', 'left'),
        txt(usd(evaluationMicro), -310, 68, 36, COSMOS.ink, 'mono', 'right'),

        // Tonight section
        txt('TONIGHT  ·  PREFIX EXPIRED', -860, 152, 26, ROLE.cached, 'mono', 'left').glow(
          5,
          ROLE.cached,
        ),
        txt('Read prompts', -860, 208, 28, showAns ? ROLE.cached : COSMOS.muted, 'sans', 'left'),
        txt(
          showAns ? usd(coldInput) : '?',
          -310,
          208,
          showAns ? 32 : 34,
          ROLE.cached,
          'mono',
          'right',
        ).glow(showAns ? 8 : 5, ROLE.cached),
        glowBar(-860, 250, 550, 18, tonightInFrac, {
          fill: ROLE.cached,
          border: showAns ? ROLE.cached : '#3a4668',
          glow: 9,
        }),

        txt('Write answers', -860, 302, 28, COSMOS.muted, 'sans', 'left'),
        txt(
          showAns ? usd(outputCharge) : '?',
          -310,
          302,
          30,
          showAns ? ROLE.output : COSMOS.muted,
          'mono',
          'right',
        ),
        glowBar(-860, 344, 550, 18, showAns ? outputCharge / coldInput : 0, {
          fill: ROLE.output,
          glow: 7,
        }),

        txt('TOTAL', -860, 404, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          showAns ? usd(coldEvaluationMicro) : '?',
          -310,
          404,
          38,
          showAns ? ROLE.cached : COSMOS.ink,
          'mono',
          'right',
        ).glow(showAns ? 9 : 0, ROLE.cached),
      ];

      // Right-side 3D tower callout
      nodes.push(
        txt('LAST NIGHT: $2.82', 85, 420, 28, ROLE.input, 'mono'),
        txt(
          showAns ? 'TONIGHT: $5.70 (+$2.88)' : 'WHICH LINE CHANGES?',
          515,
          420,
          28,
          ROLE.cached,
          'mono',
        ).glow(showAns ? 8 : 5, ROLE.cached),
      );

      if (showAns) {
        nodes.push(
          txt('INPUT LINE REPRICED  ·  OUTPUT FIXED', 295, -405, 28, ROLE.cached, 'mono')
            .glow(7, ROLE.cached)
            .opacity(rev),
        );
      } else {
        nodes.push(
          txt('Same prompts · Saved instructions expired', 295, -405, 28, COSMOS.muted, 'sans'),
        );
      }
      return group(...nodes);
    },
  );

  s.add(sceneAura, view3d, header, leftReadouts);
  orbitScene(s, c, view3d, { theta: -0.32, phi: 0.92 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  // Strict prediction reveal ONLY on beat 1 cue `reprice-night-input`
  c.on('reprice-night-input', () => {
    const t = c.cue('reprice-night-input').start;
    s.play(revealed.to(1, { duration: clampDur(c, t, 0.4) }));
    fadeOutNodes(s, c, t, pendingInputWire, 0.25);
    fadeInNodes(s, c, t, coldInputSolid, 0.45);
  });
}
