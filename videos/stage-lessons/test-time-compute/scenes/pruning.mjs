// Scene 11: pruning: 4 branches x 8 steps = 32 steps (4 ORM calls) vs PRM early pruning [8, 2, 3, 1] = 14 steps (14 PRM calls) -> compare total compute!
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  prune,
  rect,
  txt,
} from '../parts.mjs';

export default function pruning(s, c) {
  const showPrune = s.value(0);
  const showCost = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Process Pruning Tradeoff:', 'Fewer Steps vs More Scorer Calls'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pr = showPrune.value;
    const cs = showCost.value;
    const pruned = pr > 0.35;

    const nodes = [
      txt(
        pruned
          ? 'PRM PRUNED BRANCHES: 8 + 2 + 3 + 1 = 14 GENERATED STEPS (18 SAVED!)'
          : 'UNPRUNED OUTCOME SCORING: 4 BRANCHES x 8 STEPS = 32 GENERATED STEPS',
        -855,
        -225,
        26,
        pruned ? ROLE.ok : ROLE.draft,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    prune.forEach((keep, r) => {
      const y = -135 + r * 86;
      nodes.push(txt(`Branch ${r + 1}`, -855, y, 26, COSMOS.muted, 'mono', 'left').opacity(alpha));
      for (let st = 0; st < 8; st++) {
        const cx = -610 + st * 138;
        const cut = pruned && st >= keep;
        const col = cut ? COSMOS.dim : r === 0 ? ROLE.ok : ROLE.draft;
        nodes.push(
          rect(116, 56, {
            fill: cut ? '#0d1220' : r === 0 ? '#0f2d24' : '#10223e',
            stroke: col,
            width: cut ? 1.5 : 2.4,
            radius: 8,
          })
            .at(cx, y)
            .opacity(alpha * (cut ? 0.32 : 1)),
          txt(
            cut ? 'cut' : `s${st + 1}`,
            cx,
            y,
            26,
            cut ? COSMOS.dim : COSMOS.ink,
            'mono',
            'center',
          ).opacity(alpha * (cut ? 0.4 : 1)),
        );
      }
      nodes.push(
        txt(
          pruned ? `${keep} steps` : '8 steps',
          520,
          y,
          26,
          pruned && keep < 8 ? ROLE.gold : ROLE.ok,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      chipPill(
        cs > 0.35
          ? 'Compare total wall compute: 14 steps + 14 PRM calls vs 32 steps + 4 ORM calls!'
          : pruned
            ? 'Early pruning drops 32 -> 14 steps, IF the process scorer preserves the right branch!'
            : 'Outcome scorers wait for all 32 steps; process scorers inspect each step as it arrives',
        0,
        265,
        {
          w: 1620,
          h: 76,
          color: cs > 0.35 ? ROLE.gold : pruned ? ROLE.ok : ROLE.draft,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'outcome-completion', (d) => s.play(showPrune.to(0, { duration: d })));
  playCue(s, c, 'intermediate-evidence', (d) => s.play(showPrune.to(0, { duration: d })));
  playCue(s, c, 'process-pruning', (d) => s.play(showPrune.to(0.7, { duration: d })));
  playCue(s, c, 'saved-steps', (d) => s.play(showPrune.to(1, { duration: d })));
  playCue(s, c, 'scorer-cost', (d) => s.play(showCost.to(0.6, { duration: d })));
  playCue(s, c, 'different-work-units', (d) => s.play(showCost.to(1, { duration: d })));
}
