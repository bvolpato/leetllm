// Scene 08: Keep intermediate channels local until partial outputs combine (x=[1,2] -> pre=[1,2,1,0.5] -> local GeLU -> 2 partial outputs -> sum == serial!).
import {
  COSMOS,
  ROLE,
  SMALL_MLP,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function tensor(s, c) {
  // step: 0=up shards, 1=pre [1,2]|[1,0.5], 2=local GeLU, 3=down rows, 4=partials, 5=sum, 6=matches serial
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b718');
  const title = heroTitle(['Column-Then-Row MLP', 'Keeps GeLU Local'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.tp,
    eyebrow: 'TENSOR PARALLELISM · ZERO MID-LAYER EXCHANGE',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const pre0 = SMALL_MLP.pre.slice(0, 2).map((v) => v.toFixed(1));
    const pre1 = SMALL_MLP.pre.slice(2, 4).map((v) => v.toFixed(1));
    const act0 = SMALL_MLP.activated.slice(0, 2).map((v) => v.toFixed(2));
    const act1 = SMALL_MLP.activated.slice(2, 4).map((v) => v.toFixed(2));
    const p0 = SMALL_MLP.partials[0].map((v) => v.toFixed(2));
    const p1 = SMALL_MLP.partials[1].map((v) => v.toFixed(2));
    const out = SMALL_MLP.output.map((v) => v.toFixed(2));

    const nodes = [
      txt('INPUT x = [1, 2] REPLICATED TO BOTH TP RANKS', 0, -225, 26, COSMOS.gold, 'mono'),

      // Rank 0 lane
      glassCell(-420, -100, 760, 148, ROLE.tp, { fill: '#0f1d36', glow: 8 }),
      txt('TP RANK 0  (channels 0..1)', -420, -142, 26, ROLE.tp, 'mono'),
      txt(
        st >= 2
          ? `pre [${pre0.join(', ')}] -> GeLU [${act0.join(', ')}]`
          : `pre = [${pre0.join(', ')}]`,
        -420,
        -82,
        26,
        COSMOS.ink,
        'mono',
      ),

      // Rank 1 lane
      glassCell(-420, 92, 760, 148, ROLE.cp, { fill: '#0e222e', glow: 8 }),
      txt('TP RANK 1  (channels 2..3)', -420, 50, 26, ROLE.cp, 'mono'),
      txt(
        st >= 2
          ? `pre [${pre1.join(', ')}] -> GeLU [${act1.join(', ')}]`
          : `pre = [${pre1.join(', ')}]`,
        -420,
        110,
        26,
        COSMOS.ink,
        'mono',
      ),

      // Right: Partials -> All-Reduce sum -> Exact serial match
      line([-32, -100], [64, -30], { stroke: ROLE.tp, width: 3.0 }),
      line([-32, 92], [64, 30], { stroke: ROLE.cp, width: 3.0 }),

      glassCell(445, -100, 720, 148, st >= 4 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 4 ? '#241c0f' : '#0a0f1c',
        glow: st >= 4 ? 9 : 2,
      }),
      txt('DOWN-PROJECTION PARTIALS', 445, -142, 26, COSMOS.gold, 'mono'),
      txt(
        st >= 4 ? `P0=[${p0.join(', ')}]  +  P1=[${p1.join(', ')}]` : 'Row-parallel down shards',
        445,
        -82,
        26,
        st >= 4 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),

      glassCell(445, 92, 720, 148, st >= 5 ? ROLE.good : COSMOS.dim, {
        fill: st >= 5 ? '#0d2924' : '#0a0f1c',
        glow: st >= 5 ? 11 : 2,
      }),
      txt('ALL-REDUCE OUTPUT == SERIAL', 445, 50, 26, st >= 5 ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        st >= 5 ? `[ ${out.join(', ')} ]  (EXACT MATCH!)` : 'Sum partials once after down-proj',
        445,
        110,
        28,
        st >= 5 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
    ];

    nodes.push(
      txt(
        'Elementwise GeLU needs zero cross-rank sync; add final output bias ONLY after summing partials',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['tensor-beat-1-focus-1', 0],
    ['tensor-project-coordinates', 1],
    ['tensor-local-gelu', 2],
    ['tensor-matching-down-rows', 3],
    ['tensor-build-partials', 4],
    ['tensor-sum-output', 5],
    ['tensor-serial-match', 6],
  ]);
}
