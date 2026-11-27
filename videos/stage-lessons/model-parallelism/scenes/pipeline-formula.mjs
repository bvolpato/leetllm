// Scene 15: Count the busy stage slots. m=4, p=3 -> 12/18 busy, strict hold on 6/18=1/3 idle and 2/4=1/2 overhead -> m=1 (3/9=33.3%) and m=12 (36/42=85.7%)!
import {
  COSMOS,
  PIPE_1,
  PIPE_12,
  PIPE_4,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pipelineFormula(s, c) {
  const pFollow = s.value(0);
  const pCount = s.value(0);
  const pIdle = s.value(0);
  const pDrain = s.value(0);
  const pGen = s.value(0);
  const pOne = s.value(0);
  const pOneRate = s.value(0);
  const pTwelve = s.value(0);
  const pTwelveRate = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd16618', '#5ce1e61a');
  const title = heroTitle(['Count the Busy', 'Stage Slots'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'IDLE FRACTION (p−1)/(m+p−1) · ELAPSED OVERHEAD (p−1)/m',
  });

  const eqIdle = glowTex('F_{\\text{idle}} = \\frac{p-1}{m+p-1}', {
    x: -440,
    y: 350,
    size: 36,
    color: COSMOS.gold,
  });
  const eqOver = glowTex('\\text{Overhead} = \\frac{p-1}{m}', {
    x: 440,
    y: 350,
    size: 36,
    color: ROLE.gpu1,
  });

  const itemColors = [ROLE.gpu0, ROLE.gpu1, ROLE.expert, COSMOS.gold];
  const itemFills = ['#11284a', '#0e2d3b', '#22163c', '#2b220f'];

  const live = guardedDynamic(1, () => {
    const mode12 = pTwelve.value > 0.5;
    const mode1 = !mode12 && pOne.value > 0.5;
    const sched = mode12 ? PIPE_12 : mode1 ? PIPE_1 : PIPE_4;
    const items = sched.items;
    const ticks = sched.ticks;

    const fl = pFollow.value;
    const cnt = pCount.value > 0.5;
    const idl = pIdle.value > 0.5;
    const drn = pDrain.value > 0.5;
    const r1 = pOneRate.value > 0.5;
    const r12 = pTwelveRate.value > 0.5;

    const filledStage = mode1 || mode12 ? 3 : Math.ceil(fl * 2);
    const totalW = 1320;
    const cellW = Math.min(206, totalW / ticks);
    const startX = -580 + cellW * 0.5;
    const y0 = -105;
    const rowH = 98;

    const nodes = [
      txt(
        `${items} MICROBATCH${items === 1 ? '' : 'ES'}  ·  3 EQUAL STAGES  ·  ${ticks} TICKS`,
        0,
        -205,
        28,
        COSMOS.ink,
        'mono',
      ),
    ];

    for (let t = 0; t < ticks; t++) {
      nodes.push(
        txt(String(t + 1), startX + t * cellW, -162, ticks > 10 ? 26 : 28, COSMOS.muted, 'mono'),
      );
    }

    sched.layout.forEach((rowVals, stage) => {
      const cy = y0 + stage * rowH;
      nodes.push(txt(`S${stage + 1}`, -740, cy, 28, COSMOS.ink, 'mono'));
      rowVals.forEach((batch, t) => {
        const cx = startX + t * cellW;
        const vis = batch !== null && (batch !== items || stage <= filledStage || idl);
        const col = vis ? itemColors[(batch - 1) % 4] : '#263454';
        const fill = vis ? itemFills[(batch - 1) % 4] : '#0b1120';
        nodes.push(
          rect(cellW - 10, 74, {
            fill,
            stroke: col,
            width: vis ? 2.4 : 1.5,
            radius: 7,
          })
            .at(cx, cy)
            .glow(vis ? 6 : 0, col),
        );
        if (vis) {
          nodes.push(txt(String(batch), cx, cy, ticks > 10 ? 26 : 32, col, 'mono'));
        }
      });
    });

    // Main readout (strictly holding predictions; keep m=1 and m=12 side by side so m=1 stays readable!)
    if (mode1 || mode12) {
      nodes.push(
        glassCell(-400, 215, 730, 86, r1 ? ROLE.warn : COSMOS.gold, { fill: '#10182b', glow: 8 }),
        txt(
          r1
            ? `m = 1: 3/9 = ${(PIPE_1.utilization * 100).toFixed(1)}% busy`
            : 'm = 1: busy fraction = ?',
          -400,
          215,
          28,
          r1 ? ROLE.warn : COSMOS.gold,
          'mono',
        ),
        glassCell(400, 215, 730, 86, r12 ? ROLE.good : mode12 ? COSMOS.gold : COSMOS.dim, {
          fill: '#10182b',
          glow: r12 ? 9 : 3,
        }),
        txt(
          r12
            ? `m = 12: 36/42 = ${(PIPE_12.utilization * 100).toFixed(1)}% busy`
            : mode12
              ? 'm = 12: busy fraction = ?'
              : 'm = 12: pending...',
          400,
          215,
          28,
          r12 ? ROLE.good : mode12 ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    } else {
      let mainStr = 'Follow microbatch 4 across stages 2 and 3';
      let mainCol = COSMOS.ink;
      if (idl) {
        mainStr = drn
          ? 'Idle = 6/18 (1/3 of hardware)   ·   Elapsed overhead = 2/4 (1/2 of ideal)'
          : '6 idle boxes out of 18 = 1/3 idle (12/18 = 66.7% busy)';
        mainCol = ROLE.good;
      } else if (cnt) {
        mainStr = '12 busy boxes out of 18 available · Predict: what fraction sat idle?';
        mainCol = COSMOS.gold;
      }
      nodes.push(
        glassCell(0, 215, 1520, 86, mainCol, { fill: '#10182b', glow: 8 }),
        txt(mainStr, 0, 215, 28, mainCol, 'mono'),
      );
    }

    nodes.push();

    if (pGen.value > 0.5 && !mode1 && !mode12) {
      nodes.push(
        txt('m batches, p stages -> m + p - 1 total ticks', 0, 286, 26, COSMOS.muted, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('follow-last', () =>
    s.play(pFollow.to(1, { duration: remainDuration(c, 'follow-last', 0.85) })),
  );
  c.on('count-work', () =>
    s.play(pCount.to(1, { duration: remainDuration(c, 'count-work', 0.4) })),
  );
  c.after('idle-ratio', () =>
    s.play(pIdle.to(1, { duration: remainAfterDuration(c, 'idle-ratio', 0.4) })),
  );
  c.after('drain-ratio', () =>
    s.play(pDrain.to(1, { duration: remainAfterDuration(c, 'drain-ratio', 0.4) })),
  );
  c.on('general-rule', () =>
    s.play(pGen.to(1, { duration: remainDuration(c, 'general-rule', 0.45) })),
  );
  c.show('general-rule', [eqIdle, eqOver]);
  c.on('one-batch', () => s.play(pOne.to(1, { duration: remainDuration(c, 'one-batch', 0.4) })));
  c.after('one-rate', () =>
    s.play(pOneRate.to(1, { duration: remainAfterDuration(c, 'one-rate', 0.4) })),
  );
  c.on('twelve-batches', () =>
    s.play(pTwelve.to(1, { duration: remainDuration(c, 'twelve-batches', 0.45) })),
  );
  c.after('twelve-rate', () =>
    s.play(pTwelveRate.to(1, { duration: remainAfterDuration(c, 'twelve-rate', 0.4) })),
  );
}
