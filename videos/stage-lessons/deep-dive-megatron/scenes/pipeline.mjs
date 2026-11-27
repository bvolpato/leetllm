// Scene 10: How much work reaches each pipeline? 64 examples, mb=2: DP=4 -> 8 pairs, 2/18 idle (1/9); DP=8 (hold!) -> 4 pairs, 5 ticks, 2/10 idle (1/5)!
import {
  COSMOS,
  ROLE,
  WAVE_DP4,
  WAVE_DP8,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function pipeline(s, c) {
  // step: 0=1mb S0, 1=1mb handoff S1, 2=DP=4 8 pairs, 3=wave overlap, 4=2/18 (1/9), 5=DP=8 predict (hold!), 6=4 pairs, 7=5 ticks, 8=2/10 (1/5)!
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#6ee7b718');
  const title = heroTitle(['How Much Work Reaches', 'Each Pipeline?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.pp,
    eyebrow: '64 EXAMPLES · MB=2 · DP=4 VS DP=8 BUBBLE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const cellW = 114;
    const cellH = 62;
    const x0 = -720;

    const nodes = [
      txt(
        'DP = 4 REPLICAS  ->  8 PAIRS / REPLICA  (9 TICKS · 18 SLOTS)',
        0,
        -218,
        26,
        ROLE.tp,
        'mono',
      ),
    ];

    // Top schedule: DP=4 (8 pairs -> 9 ticks)
    const countTop = st >= 2 ? 8 : 1;
    const ticksTop = st >= 2 ? WAVE_DP4.ticks : 2;
    for (let sIdx = 0; sIdx < 2; sIdx++) {
      const cy = -142 + sIdx * 76;
      nodes.push(txt(`S${sIdx}`, x0 - 44, cy, 26, COSMOS.muted, 'mono'));
      for (let t = 0; t < ticksTop; t++) {
        const cx = x0 + t * cellW + cellW * 0.5;
        const mb = sIdx === 0 ? t : t - 1;
        const filled = mb >= 0 && mb < countTop && (sIdx === 0 || st >= 1);
        nodes.push(
          rect(cellW - 8, cellH, {
            fill: filled ? (sIdx === 0 ? '#12284a' : '#231642') : '#0a101d',
            stroke: filled ? (sIdx === 0 ? ROLE.tp : ROLE.pp) : COSMOS.dim,
            width: filled ? 2.4 : 1.5,
            radius: 8,
            dash: filled ? undefined : [6, 6],
          }).at(cx, cy),
          txt(filled ? `P${mb + 1}` : 'idle', cx, cy, 26, filled ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      }
    }
    if (st >= 4) {
      nodes.push(txt('2 / 18 idle = 1/9', 355, -104, 28, ROLE.good, 'mono', 'left'));
    }

    // Bottom schedule: DP=8 (withheld until st >= 6!)
    if (st >= 5) {
      nodes.push(
        txt(
          st >= 6
            ? 'DP = 8 REPLICAS  ->  4 PAIRS / REPLICA  (5 TICKS · 10 SLOTS)'
            : 'DP = 8 REPLICAS  ->  HOW MANY PAIRS & WHAT IDLE FRACTION?',
          0,
          44,
          26,
          st >= 6 ? COSMOS.gold : ROLE.bad,
          'mono',
        ),
      );
      const ticksBot = st >= 6 ? WAVE_DP8.ticks : 5;
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const cy = 114 + sIdx * 76;
        nodes.push(txt(`S${sIdx}`, x0 - 44, cy, 26, COSMOS.muted, 'mono'));
        for (let t = 0; t < ticksBot; t++) {
          const cx = x0 + t * cellW + cellW * 0.5;
          const mb = sIdx === 0 ? t : t - 1;
          const filled = st >= 6 && mb >= 0 && mb < 4;
          nodes.push(
            rect(cellW - 8, cellH, {
              fill: filled ? (sIdx === 0 ? '#12284a' : '#231642') : '#0a101d',
              stroke: filled ? (sIdx === 0 ? ROLE.tp : ROLE.pp) : COSMOS.dim,
              width: filled ? 2.4 : 1.5,
              radius: 8,
              dash: filled ? undefined : [6, 6],
            }).at(cx, cy),
            txt(
              st >= 6 ? (filled ? `P${mb + 1}` : 'idle') : '?',
              cx,
              cy,
              26,
              filled ? COSMOS.ink : COSMOS.dim,
              'mono',
            ),
          );
        }
      }
      nodes.push(
        txt(
          st >= 8 ? '2 / 10 idle = 1/5!' : '?',
          300,
          152,
          30,
          st >= 8 ? ROLE.bad : COSMOS.gold,
          'mono',
          'left',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 8
          ? 'Doubling DP halves microbatches per replica (8 -> 4), raising idle share from 1/9 to 1/5'
          : st >= 6
            ? 'DP = 8: 4 pairs across 5 ticks'
            : st >= 5
              ? 'Predict: double DP from 4 to 8 on 64 examples -> pairs/replica and idle fraction?'
              : 'Only pure DP replicas split the batch; TP and CP share the same examples',
        0,
        355,
        28,
        st >= 6 ? COSMOS.gold : ROLE.good,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['pipe-first-stage', 0, true],
    ['pipe-handoff', 1, true],
    ['pipe-eight-pairs', 2, true],
    ['pipe-eight-wave', 3, true],
    ['pipe-eight-idle', 4, true],
    ['pipe-change-dp', 5, true],
    ['pipe-four-pairs', 6, true],
    ['pipe-short-wave', 7, true],
    ['pipe-four-idle', 8, true],
  ]);
}
