// Scene 07: process-targets: ORM vs PRM; step "2+2=5" (human local=False) vs 4 rollouts [4, 5, 4, 4] -> hard=1.0, soft=0.75 (3/4 recovered) + aggregation caveats.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function processTargets(s, c) {
  const showRollouts = s.value(0);
  const showCaveat = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['Outcome vs Process Reward Labels:', 'Local Truth vs Monte Carlo Rollouts'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.score,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rl = showRollouts.value;
    const cv = showCaveat.value;

    const nodes = [
      txt(
        'INTERMEDIATE STEP UNDER TEST:  "2 + 2 = 5"  (LOCAL ERROR)',
        -855,
        -220,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha),

      rect(460, 175, { fill: '#321420', stroke: ROLE.err, width: 2.8, radius: 12 })
        .at(-615, -65)
        .opacity(alpha),
      txt('HUMAN LOCAL CHECK', -615, -112, 26, ROLE.err, 'mono', 'center').opacity(alpha),
      txt('Step "2 + 2 = 5"', -615, -60, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Label = FALSE (0.0)', -615, -8, 28, ROLE.err, 'mono', 'center').opacity(alpha),

      rect(520, 175, {
        fill: rl > 0.35 ? '#102838' : '#10182d',
        stroke: rl > 0.35 ? ROLE.search : ROLE.draft,
        width: 2.8,
        radius: 12,
      })
        .at(-55, -65)
        .opacity(alpha * (0.5 + 0.5 * rl)),
      txt('4 MONTE CARLO ROLLOUTS', -55, -112, 26, ROLE.search, 'mono', 'center').opacity(alpha),
      txt('Finish: [4, 5, 4, 4]', -55, -60, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('3 of 4 recover right answer!', -55, -8, 26, ROLE.gold, 'sans', 'center').opacity(alpha),

      rect(520, 175, {
        fill: rl > 0.35 ? '#0f2d24' : '#10182d',
        stroke: rl > 0.35 ? ROLE.ok : ROLE.score,
        width: 2.8,
        radius: 12,
      })
        .at(535, -65)
        .opacity(alpha * (0.5 + 0.5 * rl)),
      txt('COMPLETION TARGETS', 535, -112, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Hard (any-hit) = 1.00', 535, -60, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Soft (fraction) = 0.75', 535, -8, 28, ROLE.gold, 'mono', 'center').opacity(alpha),

      chipPill(
        'ORM scores completed answers; PRM scores intermediate steps conditioned on prefix & training labels',
        0,
        105,
        {
          w: 1620,
          h: 72,
          color: ROLE.score,
          size: 26,
          opacity: alpha,
        },
      ),
      chipPill(
        'Rollout targets depend on completer & budget; last-step vs min-step aggregation is a design choice!',
        0,
        215,
        {
          w: 1620,
          h: 74,
          color: cv > 0.35 ? ROLE.gold : ROLE.search,
          fill: cv > 0.35 ? '#261e10' : '#10182d',
          size: 26,
          glow: cv > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * cv),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-process-targets-0', (d) => s.play(showRollouts.to(0, { duration: d })));
  playCue(s, c, 'tt-process-targets-1', (d) => s.play(showRollouts.to(0.5, { duration: d })));
  playCue(s, c, 'tt-rollout-targets', (d) => s.play(showRollouts.to(1, { duration: d })));
  playCue(s, c, 'tt-process-targets-2', (d) => s.play(showCaveat.to(1, { duration: d })));
}
