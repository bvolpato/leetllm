// Scene 03 (unit-and-interference): "Name the effect and the paths that mix exposure"
// Policy contrast (shared pinned receipt) -> SUTVA (no hidden versions, technician learning, shared compute) -> Cluster design effect DEFF = 1 + (20-1)*0.1 = 2.9!
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  clusterDesignEffect,
  glowArrow,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  tweenCue,
  txt,
} from '../parts.mjs';

const DEFF = clusterDesignEffect(20, 0.1); // 2.9

export default function unitAndInterference(s, c) {
  const showPolicy = s.value(0);
  const showVersions = s.value(0);
  const showLearning = s.value(0);
  const showCompute = s.value(0);
  const showDeff = s.value(0);
  const showTeams = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#3a183b20');
  const title = heroTitle(['Policy Contrast, SUTVA', '& Spillover Interference'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: TRT_COLOR,
    eyebrow: 'CAUSAL ESTIMAND & CLUSTER DESIGN EFFECT',
  });

  const eqDeff = glowTex(`\\text{DEFF} = 1 + (20 - 1)(0.1) = ${DEFF.toFixed(1)}`, {
    x: 420,
    y: 120,
    size: 38,
    color: WARN_COLOR,
    glow: 8,
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      // Top band: Controlled single-change policy contrast
      txt('ISOLATED POLICY CONTRAST', -855, -245, 26, COSMOS.cyan, 'mono', 'left'),
      lumBar(-570, -150, 560, 108, { color: CTRL_COLOR, fillOpacity: 0.16, glow: 6 }),
      txt('CONTROL: Raw canary query', -825, -172, 26, CTRL_COLOR, 'mono', 'left'),
      txt('“canary rollback?”', -825, -126, 26, COSMOS.muted, 'serif', 'left'),

      lumBar(0, -150, 500, 108, {
        color: GOOD_COLOR,
        fillOpacity: 0.14,
        glow: 6,
        opacity: 0.55 + 0.45 * showPolicy.value,
      }),
      txt('PINNED SHARED STACK', 0, -172, 26, GOOD_COLOR, 'mono'),
      txt('Index · Prompt · Model · Greedy', 0, -126, 26, COSMOS.ink, 'sans'),

      lumBar(570, -150, 560, 108, { color: TRT_COLOR, fillOpacity: 0.16, glow: 6 }),
      txt('TREATMENT: Rewritten query', 315, -172, 26, TRT_COLOR, 'mono', 'left'),
      txt('“canary rollback error-rate...”', 315, -126, 26, COSMOS.muted, 'serif', 'left'),

      // Lower-left: Two SUTVA spillover channels
      txt('SUTVA INTERFERENCE PATHS', -855, -18, 26, BAD_COLOR, 'mono', 'left').opacity(
        0.45 + 0.55 * showVersions.value,
      ),
      glowDot(-790, 62, { radius: 9, color: TRT_COLOR, glow: 9 }),
      txt('Trt Inc', -790, 102, 26, TRT_COLOR, 'mono'),
      glowDot(-300, 62, { radius: 9, color: CTRL_COLOR, glow: 9 }),
      txt('Ctrl Inc', -300, 102, 26, CTRL_COLOR, 'mono'),
      glowArrow([-745, 62], [-345, 62], BAD_COLOR, {
        width: 3.5,
        opacity: 0.35 + 0.65 * showLearning.value,
      }),
      txt('Technician learns rollback rule', -545, 28, 26, BAD_COLOR, 'sans').opacity(
        0.35 + 0.65 * showLearning.value,
      ),

      glowDot(-790, 198, { radius: 9, color: TRT_COLOR, glow: 9 }),
      txt('Rewrite', -790, 238, 26, TRT_COLOR, 'mono'),
      glowDot(-300, 198, { radius: 9, color: CTRL_COLOR, glow: 9 }),
      txt('Control', -300, 238, 26, CTRL_COLOR, 'mono'),
      glowArrow([-745, 198], [-345, 198], WARN_COLOR, {
        width: 3.5,
        opacity: 0.35 + 0.65 * showCompute.value,
      }),
      txt('Shared GPU / worker queue lag', -545, 164, 26, WARN_COLOR, 'sans').opacity(
        0.35 + 0.65 * showCompute.value,
      ),

      // Lower-right: Cluster randomization variance inflation
      txt('CLUSTER DESIGN EFFECT (m = 20, ρ = 0.1)', 420, -18, 26, WARN_COLOR, 'mono').opacity(
        0.45 + 0.55 * showDeff.value,
      ),
      txt('Variance inflates 2.9× vs independent units', 420, 215, 28, WARN_COLOR, 'mono').opacity(
        0.35 + 0.65 * showDeff.value,
      ),
    ];

    if (showTeams.value > 0.02) {
      nodes.push(
        txt(
          'Analyze team-randomized trials with team-aware inference (more messages ≠ more independent teams)',
          -855,
          355,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showTeams.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'policy', showPolicy, 1, { duration: 0.45 });
  tweenCue(s, c, 'versions', showVersions, 1, { duration: 0.45 });
  tweenCue(s, c, 'learning', showLearning, 1, { duration: 0.45 });
  tweenCue(s, c, 'compute', showCompute, 1, { duration: 0.45 });
  c.show('design-effect', eqDeff);
  tweenCue(s, c, 'design-effect', showDeff, 1, { duration: 0.5 });
  tweenCue(s, c, 'teams', showTeams, 1, { duration: 0.45 });
}
