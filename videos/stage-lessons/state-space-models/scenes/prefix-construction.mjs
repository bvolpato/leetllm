// Scene 10: prefix-construction: 2-pair inclusive scan (2.0, 1.4) vs non-commutative swap (2.5) + up/down pass.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  orderedAffineFixture,
  orderedPrefixTree,
  playCue,
  swapVis,
  txt,
  valuePill,
} from '../parts.mjs';

export default function prefixConstruction(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showSecond = s.value(0);
  const showComposite = s.value(0);
  const showReverse = s.value(0);
  const downPass = s.value(0);

  const bgAura = aura(0, 0, 740, '#2a1d5428', '#16355e18');
  const title = heroTitle(['Prefix Construction:', 'order is never swappable'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.read,
  });

  const fwd = orderedAffineFixture(false); // updates [[0.5, 2], [0.2, 1]] -> states [2, 1.4], pair [0.1, 1.4]
  const rev = orderedAffineFixture(true); // updates [[0.2, 1], [0.5, 2]] -> states [1, 2.5], pair [0.1, 2.5]
  const tree = orderedPrefixTree();

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const s2 = showSecond.value;
    const comp = showComposite.value;
    const rv = showReverse.value;
    const nodes = [
      txt(
        'FORWARD ORDER:  f_1 = (0.5, 2)  then  f_2 = (0.2, 1)',
        -855,
        -215,
        28,
        ROLE.carry,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill('Prefix 1 = 2.0', -680, -115, { w: 280, h: 76, color: ROLE.state, opacity: alpha }),
      glowingTrail(
        [
          [-530, -115],
          [-350, -115],
        ],
        {
          color: s2 > 0.05 ? ROLE.read : COSMOS.rule,
          width: 4,
          opacity: (0.52 + 0.48 * s2) * alpha,
        },
      ),
      valuePill(s2 > 0.05 ? `Prefix 2 = ${fwd.states[1].toFixed(1)}` : 'Prefix 2 = ?', -190, -115, {
        w: 290,
        h: 76,
        color: s2 > 0.05 ? ROLE.state : COSMOS.rule,
        glow: s2 > 0.05 ? 10 : 0,
        opacity: (0.52 + 0.48 * s2) * alpha,
      }),
      txt(
        s2 > 0.05 ? '0.2 × 2.0 + 1.0 = 1.4' : 'a_2 · h_1 + b_2',
        240,
        -115,
        32,
        s2 > 0.05 ? ROLE.read : COSMOS.muted,
        'mono',
        'left',
      ).opacity((0.55 + 0.45 * s2) * alpha),
      txt(
        comp > 0.05
          ? `Composite pair = (${fwd.pair[0].toFixed(1)}, ${fwd.pair[1].toFixed(1)})  ·  Scan keeps BOTH [2.0, 1.4]`
          : 'Composite affine map: (a_2·a_1, a_2·b_1 + b_2)',
        -855,
        20,
        30,
        comp > 0.05 ? ROLE.delta : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(comp > 0.05 ? 6 : 0, ROLE.delta)
        .opacity((0.55 + 0.45 * comp) * alpha),
      txt(
        'REVERSED ORDER:  f_2 = (0.2, 1)  then  f_1 = (0.5, 2)',
        -855,
        150,
        28,
        rv > 0.05 ? ROLE.write : COSMOS.muted,
        'mono',
        'left',
      ).opacity((0.55 + 0.45 * rv) * alpha),
      valuePill(rv > 0.05 ? `Swapped = ${rev.states[1].toFixed(1)}` : 'Swapped = ?', -680, 245, {
        w: 290,
        h: 76,
        color: rv > 0.05 ? ROLE.write : COSMOS.rule,
        glow: rv > 0.05 ? 12 : 0,
        opacity: (0.55 + 0.45 * rv) * alpha,
      }),
      txt(
        rv > 0.05
          ? `0.5 × 1.0 + 2.0 = ${rev.states[1].toFixed(1)} ≠ ${fwd.states[1].toFixed(1)}   (associative, NOT commutative!)`
          : 'Order test: f_1 o f_2 vs f_2 o f_1 (non-commutative!)',
        -490,
        245,
        30,
        rv > 0.05 ? ROLE.write : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(rv > 0.05 ? 6 : 0, ROLE.write)
        .opacity((0.55 + 0.45 * rv) * alpha),
    ];
    return group(...nodes);
  });

  // View 2: Up-sweep combine + Down-sweep distribute incoming prefixes
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const dp = downPass.value;
    const xs4 = [-630, -210, 210, 630];
    const nodes = [
      txt(
        dp > 0.5
          ? 'DOWN-SWEEP: DISTRIBUTE INCOMING LEFT PREFIXES'
          : 'UP-SWEEP: COMBINE ADJACENT RANGES',
        -855,
        -220,
        28,
        dp > 0.5 ? ROLE.state : ROLE.delta,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill(
        `Left [0..1]: (${tree.left[0].toFixed(2)}, ${tree.left[1].toFixed(2)})`,
        -490,
        -90,
        {
          w: 490,
          h: 76,
          color: ROLE.delta,
          size: 28,
          opacity: alpha,
        },
      ),
      valuePill(
        `Right [2..3]: (${tree.right[0].toFixed(2)}, ${tree.right[1].toFixed(2)})`,
        490,
        -90,
        {
          w: 490,
          h: 76,
          color: ROLE.delta,
          size: 28,
          opacity: alpha,
        },
      ),
    ];

    const aD = (0.3 + 0.7 * dp) * alpha;
    nodes.push(
      glowingTrail(
        [
          [-230, -90],
          [230, -90],
        ],
        { color: ROLE.state, width: 5, glow: dp > 0.2 ? 12 : 0, opacity: aD },
      ),
      txt('pass left summary → right range', 0, -162, 26, ROLE.state, 'mono', 'center').opacity(aD),
    );
    tree.outputs.forEach((val, idx) => {
      nodes.push(
        valuePill(
          dp > 0.2 ? `h_${idx + 1} = ${val.toFixed(4)}` : `h_${idx + 1} = ...`,
          xs4[idx],
          130,
          {
            w: 270,
            h: 76,
            color: dp > 0.2 ? ROLE.state : COSMOS.rule,
            size: 28,
            glow: dp > 0.2 ? 10 : 0,
            opacity: aD,
          },
        ),
      );
    });
    nodes.push(
      txt(
        'Every position receives its exact complete prefix without spilling intermediate states to HBM',
        0,
        310,
        28,
        ROLE.read,
        'sans',
        'center',
      ).opacity(aD),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'ssm-prefix-second', (d) => s.play(showSecond.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'ssm-prefix-composite', (d) => s.play(showComposite.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'ssm-prefix-reverse', (d) => s.play(showReverse.to(1, { duration: d })), {
    dur: 0.5,
  });

  playCue(s, c, 'prefix-construction-b3', (d) => s.play(swapVis(view1Vis, view2Vis, d)), {
    dur: 0.6,
  });
  playCue(s, c, 'ssm-prefix-tree-down', (d) => s.play(downPass.to(1, { duration: d })), {
    dur: 0.55,
  });
  bindCueBeat(s, c, s.value(0), [
    'prefix-construction-b1',
    'ssm-prefix-first',
    'prefix-construction-b2',
    'ssm-prefix-tree-up',
  ]);
}
