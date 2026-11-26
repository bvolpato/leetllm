// Scene 19: When can the allocator reuse page 14? Dual independent clocks: 5-unit cost model vs tick-10 GPU reader event.
import {
  COSMOS,
  ROLE,
  SPLIT_4LANE_FINISH,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const phase = s.value(0);
  const costFocus = s.value(0);
  const readerTick = s.value(0); // moves 0 -> 9 (pending) -> 11 (past event at 10)
  const separateNote = s.value(0);

  const bgAura = aura(0, 20, 660, '#5ce1e61a', '#ffd1661c');

  const title = heroTitle(['When Can Allocator', 'Reuse Page 14?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'TWO SEPARATE CLOCKS · WORK COST VS GPU EVENT',
    subtitle: 'Host cancel released owner claim, but a GPU read still runs',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const cf = costFocus.value;
    const tk = readerTick.value;
    const sep = separateNote.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const completed = tk >= 10;

    const nodes = [
      // Left panel: Analytical work-cost model (5 cost units)
      glassCell(-465, 35, 760, 340, ROLE.r0, { fill: '#0e192e', glow: 6 + 4 * cf }),
      txt('CLOCK A · MODELED WORK COST', -465, -92, 26, ROLE.r0, 'mono'),
      txt('4 parallel chunks (4u) + merge (1u)', -465, -36, 26, COSMOS.muted, 'sans'),
      // Visual bars for 4 chunks + merge
      rect(340, 48, { fill: '#143869', stroke: ROLE.r0, width: 2.2, radius: 8 }).at(-565, 36),
      txt('4 chunks = 4u', -565, 36, 26, COSMOS.ink, 'mono'),
      rect(140, 48, { fill: '#0e362c', stroke: ROLE.good, width: 2.2, radius: 8 }).at(-310, 36),
      txt('1u', -310, 36, 26, ROLE.good, 'mono'),
      txt(
        `Critical path = ${SPLIT_4LANE_FINISH} cost units`,
        -465,
        118,
        32,
        COSMOS.gold,
        'mono',
      ).glow(5, COSMOS.gold),
      txt('Measures modeled compute work only', -465, 168, 26, COSMOS.muted, 'sans'),

      // Right panel: Separate GPU device reader trace (event at tick 10)
      glassCell(445, 35, 810, 340, completed ? ROLE.good : ROLE.warn, {
        fill: completed ? '#0d2522' : '#241810',
        glow: 9 * pulse,
      }),
      txt(
        'CLOCK B · GPU READER TRACE (PAGE 14)',
        445,
        -92,
        26,
        completed ? ROLE.good : ROLE.warn,
        'mono',
      ),
      txt(
        'Cancelled request released host claim; GPU stream reading...',
        445,
        -36,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Device timeline ticks 0..12 inside right panel (x from 115 to 775)
    const mapTk = (v) => 115 + (v / 12) * 660;
    const evX = mapTk(10);
    const curX = mapTk(Math.min(12, Math.max(0, tk)));

    nodes.push(
      line([115, 48], [775, 48], { stroke: COSMOS.rule, width: 4 }),
      // Event completion marker at tick 10
      line([evX, 16], [evX, 82], { stroke: ROLE.good, width: 4.0 }).glow(8, ROLE.good),
      txt('event @ 10', evX, -14, 26, ROLE.good, 'mono'),
      // Moving cursor bar
      line([curX, 20], [curX, 78], {
        stroke: completed ? ROLE.good : COSMOS.gold,
        width: 5.0,
      }).glow(10, completed ? ROLE.good : COSMOS.gold),
      txt(`tick ${tk.toFixed(0)}`, curX, 112, 26, completed ? ROLE.good : COSMOS.gold, 'mono'),
      txt(
        completed
          ? 'ALL CLAIMS ENDED -> SAFE TO REUSE PAGE 14'
          : 'READ STILL PENDING -> KEEP PAGE 14',
        445,
        166,
        26,
        completed ? ROLE.good : ROLE.bad,
        'mono',
      ).glow(5, completed ? ROLE.good : ROLE.bad),
    );

    // Bottom separation rule
    nodes.push(
      glassCell(0, 325, 1660, 114, sep > 0.5 ? COSMOS.cyan : COSMOS.dim, {
        fill: '#0e172a',
        glow: sep > 0.5 ? 9 : 4,
      }),
      txt(
        sep > 0.5
          ? '5 cost units (left) != tick 10 device event (right): allocator must observe the GPU event first'
          : 'Host cancellation alone never ends an in-flight GPU stream read on Page 14',
        0,
        325,
        28,
        sep > 0.5 ? COSMOS.cyan : COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('synthesis-beat-1-focus-1', () =>
    s.play(costFocus.to(1, { duration: remainDuration(c, 'synthesis-beat-1-focus-1', 0.45) })),
  );
  c.on('synthesis-beat-2-focus-1', () =>
    s.play(readerTick.to(4, { duration: remainDuration(c, 'synthesis-beat-2-focus-1', 0.4) })),
  );
  c.on('synthesis-reader-active', () =>
    s.play(readerTick.to(9, { duration: remainDuration(c, 'synthesis-reader-active', 0.5) })),
  );
  c.after('synthesis-reader-event', () =>
    s.play(readerTick.to(11, { duration: remainAfter(c, 'synthesis-reader-event', 0.5) })),
  );
  c.on('synthesis-beat-3-focus-1', () =>
    s.play(separateNote.to(1, { duration: remainDuration(c, 'synthesis-beat-3-focus-1', 0.45) })),
  );
}
