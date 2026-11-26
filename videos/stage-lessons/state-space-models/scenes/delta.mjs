// Scene 05: delta: Orbiting 3D continuous-to-discrete decay surface + live step probe comparing ZOH vs Mamba write.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  buildDecayManifold3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function delta(s, c) {
  const stepVal = s.value(0.1); // 0.1 -> 2.0 -> 1.0 -> 0.1
  const showExact = s.value(0);
  const showMamba = s.value(0);

  const bgAura = aura(350, 25, 560, '#103c362a', '#242e6418');
  const view3d = buildDecayManifold3d(stepVal, { x: 350, y: 25 });

  const title = heroTitle(['Step Size Δ:', 'retention vs write'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.delta,
  });

  const eq = glowTex(
    String.raw`\bar{A} = e^{-\Delta}, \quad \bar{B}_{\text{ZOH}} = 1 - e^{-\Delta}`,
    {
      x: 350,
      y: -385,
      size: 36,
      color: ROLE.delta,
      glow: 6,
    },
  );

  const stageVis = s.value(1);
  const maxW = 540;
  const barX = -855;

  const layer = guardedDynamic(stageVis, (alpha) => {
    const dt = stepVal.value;
    const ret = Math.exp(-dt);
    const zoh = 1 - ret;
    const mamba = dt;
    const ex = showExact.value;
    const mb = showMamba.value;
    const nodes = [
      txt(`ACTIVE STEP SIZE   Δ = ${dt.toFixed(2)}`, -855, -210, 34, ROLE.delta, 'mono', 'left')
        .glow(8, ROLE.delta)
        .opacity(alpha),

      // Retention bar e^-Δ
      txt(
        `Carryover  e^{-Δ}  =  ${ret.toFixed(3)}`,
        -855,
        -110,
        30,
        ROLE.state,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, -60, maxW * ret, 34, ROLE.state, { opacity: alpha, maxTrackW: maxW }),
    ];

    if (ex > 0.05) {
      nodes.push(
        txt(
          `Exact ZOH write  1 − e^{-Δ}  =  ${zoh.toFixed(3)}`,
          -855,
          45,
          30,
          ROLE.carry,
          'mono',
          'left',
        ).opacity(ex * alpha),
        lumBar(barX, 95, maxW * Math.min(1, zoh / 2), 34, ROLE.carry, {
          opacity: ex * alpha,
          maxTrackW: maxW,
        }),
      );
    }

    if (mb > 0.05) {
      nodes.push(
        txt(
          `Mamba-1 rule  Δ·B  =  ${mamba.toFixed(3)}`,
          -855,
          195,
          30,
          ROLE.write,
          'mono',
          'left',
        ).opacity(mb * alpha),
        lumBar(barX, 245, maxW * Math.min(1, mamba / 2), 34, ROLE.write, {
          opacity: mb * alpha,
          maxTrackW: maxW,
        }),
        txt(
          'Agree for tiny Δ; diverge for finite steps',
          -855,
          355,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(mb * alpha),
      );
    }

    nodes.push(
      txt(
        '3D exponential decay manifold e^{-lag·Δ}',
        350,
        420,
        26,
        ROLE.read,
        'mono',
        'center',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, view3d, title, eq, layer);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.92 }, { startOffset: 0.15, endMargin: 0.5 });

  playCue(s, c, 'large-step', (d) => s.play(stepVal.to(2.0, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'probe-retention', (d) => s.play(stepVal.to(1.0, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'exact-write', (d) => s.play(showExact.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'mamba-write', (d) => s.play(showMamba.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'small-step-limit', (d) => s.play(stepVal.to(0.1, { duration: d })), { dur: 0.9 });
  bindCueBeat(s, c, s.value(0), [
    'discrete-decay',
    'ssm-delta-exact',
    'ssm-delta-mamba',
    'unit-step',
  ]);
}
