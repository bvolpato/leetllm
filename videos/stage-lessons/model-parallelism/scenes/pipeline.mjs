// Scene 14: Whole layers can form stages. 3 equal-duration stages x 4 microbatches across 6 ticks, fill/drain bubbles, and serial autoregressive dependency.
import {
  COSMOS,
  PIPE_4,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pipeline(s, c) {
  const pOrd = s.value(0);
  const pPrior = s.value(0);
  const pOver = s.value(0);
  const pBub = s.value(0);
  const pLim = s.value(0);
  const pSer = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1c', '#5ce1e618');
  const title = heroTitle(['Whole Layers Can', 'Form Pipeline Stages'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.expert,
    eyebrow: '3 STAGES × 4 MICROBATCHES · 6 EQUAL-DURATION TICKS',
  });

  const itemColors = [ROLE.gpu0, ROLE.gpu1, ROLE.expert, COSMOS.gold];
  const itemFills = ['#11284a', '#0e2d3b', '#22163c', '#2b220f'];

  const live = guardedDynamic(1, () => {
    const tickProg = Math.min(6, Math.max(1, Math.ceil(1 + pOrd.value * 2 + pOver.value * 3)));
    const bub = pBub.value > 0.5;
    const lim = pLim.value > 0.5;
    const ser = pSer.value > 0.5;
    const prior = pPrior.value > 0.5;

    const x0 = -520;
    const colW = 224;
    const rowH = 122;
    const y0 = -82;

    const nodes = [
      txt('FORWARD-ONLY STAGE SCHEDULE (EQUAL-DURATION TICKS)', 0, -218, 28, COSMOS.ink, 'mono'),
    ];

    for (let t = 0; t < 6; t++) {
      nodes.push(txt(`t${t + 1}`, x0 + t * colW, -162, 28, COSMOS.muted, 'mono'));
    }

    PIPE_4.layout.forEach((rowVals, stage) => {
      const cy = y0 + stage * rowH;
      nodes.push(
        txt(
          `Stage ${stage + 1}`,
          -740,
          cy,
          28,
          prior && stage < 2 ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );
      rowVals.forEach((item, t) => {
        const cx = x0 + t * colW;
        const active = item !== null && t < tickProg;
        const isBubble = item === null;
        const stroke = active
          ? ser && item === 1
            ? COSMOS.gold
            : itemColors[item - 1]
          : isBubble && bub
            ? ROLE.bad
            : '#253250';
        const fill = active ? itemFills[item - 1] : isBubble && bub ? '#2a1220' : '#0b1120';
        nodes.push(
          rect(196, 88, {
            fill,
            stroke,
            width: active || (isBubble && bub) ? 2.6 : 1.6,
            radius: 10,
            dash: isBubble ? [7, 5] : undefined,
          })
            .at(cx, cy)
            .glow(active ? 8 : isBubble && bub ? 6 : 0, stroke),
          txt(
            active ? `Item ${item}` : isBubble && bub ? 'bubble' : '',
            cx,
            cy,
            28,
            active ? itemColors[item - 1] : ROLE.bad,
            'mono',
          ),
        );
      });
    });

    const foot = ser
      ? 'One autoregressive token still waits on all 3 stages before sampling the next token'
      : lim
        ? 'Idealized schedule excludes stage-boundary transfers and stage imbalance'
        : bub
          ? 'Empty cells at fill and drain form the pipeline bubbles'
          : 'Independent microbatches overlap across successive stages';

    nodes.push(
      glassCell(0, 315, 1360, 78, ser ? COSMOS.gold : lim ? ROLE.warn : ROLE.expert, {
        fill: '#10182b',
        glow: 7,
      }),
      txt(foot, 0, 315, 26, ser ? COSMOS.gold : lim ? ROLE.warn : COSMOS.ink, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('ordered-stages', () =>
    s.play(pOrd.to(1, { duration: remainDuration(c, 'ordered-stages', 0.7) })),
  );
  c.on('prior-dependency', () =>
    s.play(pPrior.to(1, { duration: remainDuration(c, 'prior-dependency', 0.4) })),
  );
  c.on('overlapping-items', () =>
    s.play(pOver.to(1, { duration: remainDuration(c, 'overlapping-items', 0.8) })),
  );
  c.on('pipeline-bubbles', () =>
    s.play(pBub.to(1, { duration: remainDuration(c, 'pipeline-bubbles', 0.45) })),
  );
  c.on('schedule-limits', () =>
    s.play(pLim.to(1, { duration: remainDuration(c, 'schedule-limits', 0.4) })),
  );
  c.on('serial-dependency', () =>
    s.play(pSer.to(1, { duration: remainDuration(c, 'serial-dependency', 0.4) })),
  );
}
