// Scene 23: Which allocation changed the peak? 6-unit limit: 2+1.5+0.5 + [3.0 -> 7.0 OOM | 1.5 ckpt -> 5.5 FITS | 4.5 long-seq -> 8.5 OOM (strict hold!)].
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function choose(s, c) {
  // mode: 0=baseline(3.0->7.0), 1=ckpt(1.5->5.5), 2=long-seq question(4.5 -> HOLD!), 3=long-seq answer(8.5 OOM!)
  const mode = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1e', '#6ee7b716');
  const title = heroTitle(['Which Allocation', 'Changed the Peak?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.act,
    eyebrow: 'JOINT PEAK MEMORY · 6-UNIT GPU LIMIT',
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const actUnits = m === 0 ? 3.0 : m === 1 ? 1.5 : 4.5;
    const peak = 2.0 + 1.5 + 0.5 + actUnits; // 7.0, 5.5, 8.5
    const fits = peak <= 6.0;

    // Horizontal stacked bar scale: 1 unit = 140 px, starting at x0 = -740
    const x0 = -740;
    const px = 140;
    const limitX = x0 + 6.0 * px; // +100

    const segs = [
      { label: 'Shards: 2.0', u: 2.0, col: ROLE.weights },
      { label: 'Gather: 1.5', u: 1.5, col: ROLE.comm },
      { label: 'WS: 0.5', u: 0.5, col: ROLE.opt },
      { label: `Act: ${actUnits.toFixed(1)}`, u: actUnits, col: ROLE.act },
    ];

    const nodes = [
      line([limitX, -155], [limitX, 155], { stroke: COSMOS.gold, width: 3.2, dash: [8, 6] }).glow(
        8,
        COSMOS.gold,
      ),
      txt('6.0 UNIT CARD LIMIT', limitX, -184, 26, COSMOS.gold, 'mono'),
    ];

    let curX = x0;
    segs.forEach((sg, i) => {
      const w = sg.u * px - 6;
      const cx = curX + w * 0.5;
      curX += sg.u * px;
      const isAct = i === 3;
      const showBar = !isAct || m !== 2;
      if (showBar) {
        nodes.push(
          rect(w, 108, {
            fill: isAct ? '#301222' : '#10203a',
            stroke: sg.col,
            width: isAct ? 3.2 : 2.4,
            radius: 10,
          })
            .at(cx, 0)
            .glow(isAct ? 10 : 5, sg.col),
          txt(w >= 110 ? sg.label : '0.5', cx, 0, 26, sg.col, 'mono'),
        );
      } else {
        nodes.push(
          rect(w, 108, {
            fill: '#241812',
            stroke: COSMOS.gold,
            width: 2.8,
            radius: 10,
            dash: [10, 6],
          }).at(cx, 0),
          txt('Activations = 4.5 (?)', cx, 0, 26, COSMOS.gold, 'mono'),
        );
      }
    });

    // Bottom verdict (strictly withhold 8.5 OOM during m===2!)
    const verdict =
      m === 0
        ? 'Peak = 7.0 units > 6.0 limit (OOM!)'
        : m === 1
          ? 'Activation checkpointing halves acts (3.0 → 1.5) → Peak = 5.5 (FITS!)'
          : m === 2
            ? 'Longer sequence raises activations to 4.5: does the 6-unit card still have room?'
            : 'Peak = 8.5 units (OOM!) · Shards never changed → reduce microbatch!';
    const vCol = m === 1 ? ROLE.good : m === 2 ? COSMOS.gold : ROLE.bad;

    nodes.push(
      glassCell(0, 225, 1480, 118, vCol, { fill: '#0e192c', glow: 9 }),
      txt(verdict, 0, 225, 28, vCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.after('joint-allocations', () => s.play(mode.to(0, { duration: 0.35 })));
  c.on('checkpoint-savings', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'checkpoint-savings', 0.45) })),
  );
  c.onBeat(2, () => s.play(mode.to(2, { duration: 0.45 })));
  c.after('long-sequence', () =>
    s.play(mode.to(3, { duration: remainDuration(c, 'long-sequence', 0.45) })),
  );
}
