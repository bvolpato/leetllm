// Scene 08: Separate reverse communication from differentiation through the experts.
// D is linear expansion; D^T sums returns; upstream [2, 1] -> input grad [3.8, 1.9], gate grads [2, 8].
import {
  BACKWARD_GATE_GRAD,
  BACKWARD_INPUT_GRAD,
  COSMOS,
  ROLE,
  aura,
  buildDualGpuNvlinkRig3d,
  fmtVec,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function backwardOperators(s, c) {
  const phase = s.value(0);
  const routeMode = s.value(0);
  const travel = s.value(0.8);
  const expand = s.value(0.8);
  const gradMode = s.value(0);
  const revealInput = s.value(0);
  const revealGates = s.value(0);

  const bgAura = aura(470, 12, 500, '#a78bfa22', '#5ce1e61a');
  const { view: rig3d } = buildDualGpuNvlinkRig3d(routeMode, travel, expand, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Transpose Comm,', 'Differentiate Experts'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.meta,
    eyebrow: 'BACKWARD PASS DUALITY · LINEAR D & D^T',
    subtitle: 'Fixed-route dispatch is linear; gates & experts differentiate separately',
  });

  const eq = glowTex(String.raw`g_{\mathrm{eff}} = 0.7 \times 1 + 0.3 \times 4 = 1.9`, {
    x: -440,
    y: -95,
    size: 38,
    color: ROLE.token,
    glow: 6,
  });

  const live = guardedDynamic(1, () => {
    const isGrad = Math.round(gradMode.value) >= 1;
    const gotIn = Math.round(revealInput.value) >= 1;
    const gotGate = Math.round(revealGates.value) >= 1;

    const nodes = [
      txt('3D FORWARD D <-> BACKWARD D^T', 470, -415, 26, ROLE.meta, 'mono').glow(5, ROLE.meta),
      txt(
        isGrad
          ? 'Upstream [2, 1] -> input grad & gate grad paths'
          : 'Forward dispatch D <-> Backward combine D^T',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isGrad) {
      nodes.push(
        glassCell(-660, 75, 370, 170, ROLE.rank0, { fill: '#0d1a33', glow: 6 }),
        txt('FORWARD: D', -660, 22, 28, ROLE.rank0, 'mono'),
        txt('4 source rows', -660, 72, 26, COSMOS.ink, 'sans'),
        txt('-> 8 expert slots', -660, 118, 26, ROLE.nvlink, 'mono'),

        line([-470, 75], [-405, 75], { stroke: ROLE.token, width: 4 }),

        glassCell(-215, 75, 370, 170, ROLE.meta, { fill: '#1a1130', glow: 6 }),
        txt('BACKWARD: D^T', -215, 22, 28, ROLE.meta, 'mono'),
        txt('8 returned grads', -215, 72, 26, COSMOS.ink, 'sans'),
        txt('-> sum into a,b,c,d', -215, 118, 26, ROLE.good, 'mono'),

        txt(
          'Transposing D alone never computes expert or gate derivatives',
          -860,
          265,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          'Discrete top-k expert selection is a separate boundary',
          -860,
          325,
          26,
          ROLE.brand,
          'sans',
          'left',
        ),
      );
    } else {
      nodes.push(
        glassCell(-440, 25, 820, 88, ROLE.rank0, { fill: '#0d1a33', glow: 6 }),
        txt('Raw E0 [1, 0] · Raw E3 [4, 0] · Upstream [2, 1]', -440, 25, 26, COSMOS.ink, 'mono'),

        glassCell(-440, 155, 820, 92, gotIn ? ROLE.good : COSMOS.dim, {
          fill: gotIn ? '#0d241c' : '#111626',
          glow: gotIn ? 7 : 0,
        }),
        txt(
          `Input gradient:  1.9 x [2, 1] = ${gotIn ? fmtVec(BACKWARD_INPUT_GRAD, 1) : '[?, ?]'}`,
          -440,
          155,
          28,
          gotIn ? ROLE.good : COSMOS.muted,
          'mono',
        ),

        glassCell(-440, 285, 820, 92, gotGate ? ROLE.nvlink : COSMOS.dim, {
          fill: gotGate ? '#0c202e' : '#111626',
          glow: gotGate ? 7 : 0,
        }),
        txt(
          `Gate grads (raw dot up):  ${gotGate ? `[${BACKWARD_GATE_GRAD.join(', ')}]` : '[?, ?]'}`,
          -440,
          285,
          28,
          gotGate ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, eq, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-backward-operators-b0', () =>
    s.play(routeMode.to(2, { duration: remainDuration(c, 'de-backward-operators-b0', 0.8) })),
  );
  c.on('de-backward-operators-b1', () =>
    s.play(gradMode.to(1, { duration: remainDuration(c, 'de-backward-operators-b1', 0.5) })),
  );
  c.after('de-backward-input', () =>
    s.play(revealInput.to(1, { duration: remainAfterDuration(c, 'de-backward-input', 0.3) })),
  );
  c.after('de-backward-gates', () =>
    s.play(revealGates.to(1, { duration: remainAfterDuration(c, 'de-backward-gates', 0.3) })),
  );
}
