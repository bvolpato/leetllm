// Scene 16: native-reasoning-training - What changed between these two models?
// Orbiting 3D Test-Time Compute vs Model-Parameter Scaling Surface (Snell et al.) paired with
// three sequential left-stage explanations:
//   1. Prompting (fixed theta) vs RL post-training (updated theta', o1 / DeepSeek-R1-Zero / R1).
//   2. RLVR / GRPO loop: sampled solution -> programmatic verifier -> reward update.
//   3. Matched compute budget on MATH: smaller model revising / verifier-searching vs ~14x larger!
import { curve3d, gridPlane3d, group, line, parametricSurface, point3d } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowTex,
  guardedDynamic,
  orbNode,
  orbRadius,
  orbitScene,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function nativeReasoningTraining(s, c) {
  const pulse = s.value(0);
  const stage2 = s.value(0);
  const stage3 = s.value(0);
  const matched14x = s.value(0);

  const header = cinemaHeader(
    'NATIVE REASONING & RLVR',
    'What changed between',
    'these two models?',
    { accent: ROLE.model, size: 46 },
  );

  const stageAura = aura(350, 20, 640, '#a78bfa22', '#5ce1e61c');

  // Orbiting 3D Compute Scaling Surface: x = log(Params), y = log(Test-Time Search), z = Accuracy
  const surf3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 1.0],
  }).at(410, 20);

  surf3d.add(
    gridPlane3d({
      x: [-2.6, 2.6],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  // Smooth accuracy scaling surface over (parameter scale u, test-time compute v)
  const accZ = (u, v) => 0.35 + 1.85 * (1 / (1 + Math.exp(-0.95 * (0.62 * u + 0.72 * v + 0.25))));
  surf3d.add(
    parametricSurface((u, v) => [u, v, accZ(u, v)], [-2.2, 2.2], [-2.0, 2.0], {
      resolution: [20, 18],
      color: ROLE.model,
      opacity: 0.68,
      mesh: false,
      shaded: true,
    }),
  );

  // Glowing iso-compute frontier curve trading parameter size for test-time search
  surf3d.add(
    curve3d(
      (t) => [-1.8 + 3.6 * t, 1.7 - 3.4 * t, accZ(-1.8 + 3.6 * t, 1.7 - 3.4 * t) + 0.08],
      0,
      1,
      {
        color: ROLE.focus,
        width: 4.4,
        glow: 10,
        blend: 'screen',
        samples: 40,
      },
    ),
    // Smaller model + high test-time verifier search
    point3d([-1.4, 1.35, accZ(-1.4, 1.35) + 0.14], {
      color: ROLE.path,
      radius: 8,
      glow: 12,
      blend: 'screen',
    }),
    // ~14x larger model + low test-time compute
    point3d([1.5, -1.4, accZ(1.5, -1.4) + 0.14], {
      color: ROLE.service,
      radius: 8,
      glow: 12,
      blend: 'screen',
    }),
    // Live moving compute-allocation marker along iso-compute ridge
    point3d(
      () => {
        const u = -1.8 + 3.6 * ((pulse.value * 0.25) % 1);
        const v = 1.7 - 3.4 * ((pulse.value * 0.25) % 1);
        return [u, v, accZ(u, v) + 0.12];
      },
      { color: '#ffffff', radius: 6, glow: 10, blend: 'screen' },
    ),
  );

  const paramEq = glowTex(String.raw`\theta \;\xrightarrow{\;\text{GRPO + Verifier}\;}\; \theta'`, {
    x: -440,
    y: 255,
    size: 36,
    color: ROLE.ok,
    glow: 8,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const s2 = stage2.value;
      const s3 = stage3.value;
      const m14 = matched14x.value;

      const a1 = fadeOutHalf(s2);
      const a2 = fadeInHalf(s2) * fadeOutHalf(s3);
      const a3 = fadeInHalf(s3);
      const nodes = [];

      nodes.push(
        txt('3D TEST-TIME VS PARAMETER SCALING', 410, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'GOLD: ISO-COMPUTE · CYAN: SMALL+SEARCH · BLUE: 14x',
          360,
          425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Left Stage 1: Prompt context vs RL parameter update
      if (a1 > 0.02) {
        const p1 = [-680, -75];
        const p2 = [-260, -75];
        nodes.push(
          txt('CONTEXT VS PARAMETERS', -840, -210, 26, ROLE.service, 'mono', 'left').opacity(a1),
          orbNode(p1[0], p1[1], 'PROMPT', ROLE.service, {
            radius: 56,
            sub: 'Fixed weights θ',
            opacity: a1,
          }),
          orbNode(p2[0], p2[1], 'RL TRAIN', ROLE.ok, {
            radius: 56,
            sub: "New weights θ'",
            opacity: a1,
          }),
          txt('o1: RL for reasoning', -840, 120, 28, COSMOS.ink, 'sans', 'left').opacity(a1),
          txt(
            'R1-Zero: pure RL without prior SFT',
            -840,
            168,
            28,
            ROLE.path,
            'sans',
            'left',
          ).opacity(a1),
          txt(
            'R1: combines supervised + RL stages',
            -840,
            216,
            28,
            ROLE.ok,
            'sans',
            'left',
          ).opacity(a1),
        );
      }

      // Left Stage 2: RLVR / GRPO programmatic verifier reward loop
      if (a2 > 0.02) {
        const n1 = [-730, -75];
        const n2 = [-440, -75];
        const n3 = [-145, -75];
        const [e1a, e1b] = trimSeg(
          n1,
          n2,
          orbRadius('SAMPLES', 50) + 8,
          orbRadius('VERIFIER', 52) + 8,
        );
        const [e2a, e2b] = trimSeg(
          n2,
          n3,
          orbRadius('VERIFIER', 52) + 8,
          orbRadius('GRPO', 46) + 8,
        );

        nodes.push(
          txt(
            'PROGRAMMATIC VERIFIER REWARD (GRPO)',
            -840,
            -210,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(a2),
          orbNode(n1[0], n1[1], 'SAMPLES', ROLE.model, {
            radius: 50,
            sub: 'Solutions',
            opacity: a2,
          }),
          beamWithPhotons([e1a, e1b], ROLE.path, p * 1.1, { alpha: a2, width: 3.4 }),
          orbNode(n2[0], n2[1], 'VERIFIER', ROLE.path, {
            radius: 52,
            sub: 'Math/Tests',
            opacity: a2,
          }),
          beamWithPhotons([e2a, e2b], ROLE.ok, p * 1.1 + 0.4, { alpha: a2, width: 3.4 }),
          orbNode(n3[0], n3[1], 'GRPO', ROLE.ok, { radius: 46, sub: 'Update θ', opacity: a2 }),
          txt(
            'Useful intermediate steps emerge when they earn verifier reward',
            -840,
            135,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a2),
        );
      }

      // Left Stage 3: Snell et al. matched compute budget (smaller + search vs ~14x larger)
      if (a3 > 0.02) {
        nodes.push(
          txt('SNELL ET AL. · MATH BENCHMARK', -840, -215, 26, ROLE.focus, 'mono', 'left').opacity(
            a3,
          ),
          orbNode(-660, -65, 'SMALL', ROLE.path, {
            radius: 58,
            sub: 'Revise / search',
            opacity: a3,
          }),
          orbNode(-260, -65, m14 > 0.45 ? '14x' : 'LARGE', ROLE.service, {
            radius: 58,
            sub: 'Single pass',
            opacity: a3,
          }),
          line([-840, 115], [-60, 115], { stroke: '#25355a', width: 2 }).opacity(0.65 * a3),
          txt(
            m14 > 0.45
              ? 'Matched compute: small + search sometimes beat ~14x larger'
              : 'Spend test-time compute on revision or verifier-guided search',
            -840,
            180,
            26,
            m14 > 0.45 ? ROLE.focus : COSMOS.ink,
            'mono',
            'left',
          ).opacity(a3),
          txt(
            'Outcome depends on problem difficulty & train/inference balance',
            -840,
            240,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a3),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, surf3d, header, overlay);
  orbitScene(s, c, surf3d, { theta: -0.18, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('native-reasoning-training-b1', () => {
    s.play(
      pulse.to(0.4, { duration: clampDur(c, c.cue('native-reasoning-training-b1').start, 0.25) }),
    );
  });
  c.show('native-reasoning-training-b2', paramEq);
  c.on('native-reasoning-training-b2', () => {
    s.play(
      stage2.to(1, { duration: clampDur(c, c.cue('native-reasoning-training-b2').start, 0.55) }),
    );
  });
  c.hide('native-reasoning-training-b3', paramEq);
  c.on('native-reasoning-training-b3', () => {
    s.play(
      stage3.to(1, { duration: clampDur(c, c.cue('native-reasoning-training-b3').start, 0.55) }),
    );
  });
  c.on('native-matched-budget', () => {
    s.play(matched14x.to(1, { duration: clampDur(c, c.cue('native-matched-budget').start, 0.35) }));
  });
}
