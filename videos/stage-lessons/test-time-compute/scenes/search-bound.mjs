// Scene 10: search-bound: Completed 0.8 vs Active 0.7 with next step 0.9 -> predict min-step rule? -> AFTER tt-path-bound reveal min=0.7<=0.8 (STOP!) vs latest-step 0.9>0.8 + proposal ceiling 1x2x3=6.
import {
  COSMOS,
  ROLE,
  SEARCH_BOUND_FRAME,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function searchBound(s, c) {
  const revealMin = s.value(0); // strictly withheld until AFTER tt-path-bound!
  const showLatest = s.value(0);
  const showCeiling = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['Upper Bounds & Stopping Rules:', 'Min-Step vs Latest-Step Aggregation'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.search,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rm = revealMin.value;
    const lt = showLatest.value;
    const cl = showCeiling.value;

    const barX = -460;
    const maxW = 760;

    const nodes = [
      txt(
        'COMPLETED ANSWER = 0.80  |  ACTIVE PATH = 0.70  |  NEXT STEP OFFERS 0.90',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Completed Answer', -855, -105, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, -105, SEARCH_BOUND_FRAME.completed * maxW, 40, ROLE.ok, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt('0.80 (target)', barX + maxW + 24, -105, 26, ROLE.ok, 'mono', 'left').opacity(alpha),

      txt('Min-Step Rule', -855, 5, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, 5, rm > 0.35 ? 0.7 * maxW : 24, 40, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * rm),
        maxTrackW: maxW,
      }),
      txt(
        rm > 0.35 ? 'min(0.7,0.9) = 0.70 -> STOP!' : 'min(0.7, 0.9) = ?',
        barX + maxW + 24,
        5,
        26,
        rm > 0.35 ? ROLE.err : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Latest-Step Rule', -855, 115, 28, ROLE.score, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * lt),
      ),
      lumBar(barX, 115, lt > 0.35 ? 0.9 * maxW : 24, 40, ROLE.score, {
        opacity: alpha * (0.48 + 0.52 * lt),
        maxTrackW: maxW,
      }),
      txt(
        lt > 0.35 ? 'latest = 0.90 > 0.80 (KEEP!)' : 'replay with latest rule',
        barX + maxW + 24,
        115,
        26,
        ROLE.score,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * lt)),

      chipPill(
        cl > 0.35
          ? `Proposal ceiling = beam(1) x proposals(2) x rounds(3) = ${SEARCH_BOUND_FRAME.proposals} max proposals & scores`
          : lt > 0.35
            ? 'Monotone min-step permits exact early pruning; latest-step can rise above 0.80 so it must run!'
            : rm > 0.35
              ? 'Min-step cannot rise above 0.70 even on a 1.0 next step -> safe to prune early!'
              : 'Under min-step aggregation, can a 0.90 next step lift a 0.70 path above 0.80?',
        0,
        260,
        {
          w: 1620,
          h: 76,
          color: cl > 0.35 ? ROLE.search : rm > 0.35 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'bound-inputs', (d) => s.play(revealMin.to(0, { duration: d })));
  playCue(s, c, 'offer-step', (d) => s.play(revealMin.to(0, { duration: d })));
  // Strict prediction withholding: reveal min=0.70 STOP only after tt-path-bound!
  playCue(s, c, 'tt-path-bound', (d) => s.play(revealMin.to(1, { duration: d })), { after: true });
  playCue(s, c, 'replay-latest', (d) => s.play(showLatest.to(0.6, { duration: d })));
  playCue(s, c, 'latest-rise', (d) => s.play(showLatest.to(1, { duration: d })));
  playCue(s, c, 'search-rounds', (d) => s.play(showCeiling.to(0.5, { duration: d })));
  playCue(s, c, 'tt-proposal-ceiling', (d) => s.play(showCeiling.to(1, { duration: d })));
}
