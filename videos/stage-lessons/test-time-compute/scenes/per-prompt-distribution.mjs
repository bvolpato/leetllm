// Scene 05: per-prompt-distribution: Before [0.8, 0.2] (pass@1 0.50, pass@4 0.794) vs After [0.99, 0.05] (pass@1 rises 0.52, pass@4 DROPS to 0.593!).
import {
  COSMOS,
  DIST_AFTER,
  DIST_BEFORE,
  ROLE,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function perPromptDistribution(s, c) {
  const showAfter = s.value(0);
  const showDrop = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['Average Pass@1 Can Hide a Pass@N Drop:', 'Per-Prompt Probability Shifts'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.err,
    },
  );

  const eq = glowTex(
    String.raw`\operatorname{cov}(p, N) = 1 - (1 - p)^N, \quad \overline{\operatorname{pass}@N} = \frac{1}{M}\sum_{i=1}^{M}\!\left(1 - (1-p_i)^N\right)`,
    { scale: 1.42, color: COSMOS.ink, glow: 8, glowColor: ROLE.search },
  ).at(0, -195);

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const af = showAfter.value;
    const dr = showDrop.value;

    const barX = -380;
    const maxW = 680;

    const nodes = [
      txt('Before [0.80, 0.20]: pass@1', -855, -75, 26, ROLE.draft, 'mono', 'left').opacity(alpha),
      lumBar(barX, -75, 0.5 * maxW, 36, ROLE.draft, { opacity: alpha, maxTrackW: maxW }),
      txt('50.0% mean', barX + maxW + 24, -75, 26, ROLE.draft, 'mono', 'left').opacity(alpha),

      txt('Before [0.80, 0.20]: pass@4', -855, 5, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, 5, DIST_BEFORE.mean * maxW, 36, ROLE.ok, { opacity: alpha, maxTrackW: maxW }),
      txt(
        `${(DIST_BEFORE.mean * 100).toFixed(1)}% mean`,
        barX + maxW + 24,
        5,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),

      txt('After [0.99, 0.05]: pass@1', -855, 95, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * af),
      ),
      lumBar(barX, 95, 0.52 * maxW, 36, ROLE.gold, {
        opacity: alpha * (0.48 + 0.52 * af),
        maxTrackW: maxW,
      }),
      txt('52.0% (+2.0 pp!)', barX + maxW + 24, 95, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * af),
      ),

      txt('After [0.99, 0.05]: pass@4', -855, 175, 26, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * dr),
      ),
      lumBar(barX, 175, DIST_AFTER.mean * maxW, 36, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * dr),
        maxTrackW: maxW,
      }),
      txt(
        `${(DIST_AFTER.mean * 100).toFixed(1)}% (-20.2 pp!)`,
        barX + maxW + 24,
        175,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * dr)),

      chipPill(
        'Sharpening collapses hard-prompt p (0.20 -> 0.05): pass@1 rises, yet pass@4 drops 20 pp!',
        0,
        290,
        {
          w: 1620,
          h: 74,
          color: dr > 0.35 ? ROLE.err : ROLE.search,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'tt-per-prompt-distribution-0', (d) => s.play(showAfter.to(0, { duration: d })));
  playCue(s, c, 'tt-per-prompt-distribution-1', (d) => s.play(showAfter.to(0.6, { duration: d })));
  playCue(s, c, 'tt-probability-shift', (d) => s.play(showAfter.to(1, { duration: d })));
  playCue(s, c, 'tt-prompt-coverage', (d) => s.play(showDrop.to(1, { duration: d })));
  playCue(s, c, 'tt-per-prompt-distribution-2', (d) => s.play(showDrop.to(1, { duration: d })));
}
