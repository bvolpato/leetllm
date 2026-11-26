// Scene 09: memory: Paged KV blocks growing with history, in-flight transfer hold on A's pages -> release -> D takes them.
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

export default function memory(s, c) {
  const phase = s.value(0); // 0=growing, 1=paged blocks, 2=transfer hold, 3=released, 4=D reassigned, 5=shared refcount

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Paged KV Memory &', 'Safe Page Retirement'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.a,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ph = Math.round(phase.value);
    const aStatus = ph === 2 ? 'A: WRITE' : ph === 3 ? 'FREE' : ph >= 4 ? 'D (NEW)' : 'A';
    const aCol = ph === 2 ? ROLE.warn : ph === 3 ? ROLE.ok : ph >= 4 ? ROLE.d : ROLE.a;

    const slots = [
      { idx: 0, label: aStatus, col: aCol },
      { idx: 1, label: 'B', col: ROLE.b },
      { idx: 2, label: 'C', col: ROLE.c },
      { idx: 3, label: aStatus, col: aCol },
      { idx: 4, label: 'B', col: ROLE.b },
      { idx: 5, label: 'C', col: ROLE.c },
      { idx: 6, label: 'B', col: ROLE.b },
      { idx: 7, label: 'C', col: ROLE.c },
      { idx: 8, label: ph >= 1 ? 'C' : 'FREE', col: ph >= 1 ? ROLE.c : COSMOS.rule },
    ];

    const nodes = [
      txt(
        'PHYSICAL KV PAGE POOL (NON-CONTIGUOUS BLOCK TABLE MAPPING)',
        -855,
        -220,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    slots.forEach((sl, i) => {
      const cx = -760 + i * 190;
      nodes.push(
        rect(170, 115, {
          fill: sl.label === 'FREE' ? '#0f2922' : '#12203a',
          stroke: sl.col,
          width: 2.8,
          radius: 12,
        })
          .at(cx, -100)
          .glow(sl.col === ROLE.warn || sl.col === ROLE.d ? 10 : 4, sl.col)
          .opacity(alpha),
        txt(`P${i}`, cx, -135, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(sl.label, cx, -82, 26, sl.col, 'mono', 'center').opacity(alpha),
      );
    });

    // Retirement safety checklist
    nodes.push(
      txt('PRIVATE PAGE RETIREMENT CONTRACT', -855, 45, 26, ROLE.d, 'mono', 'left').opacity(alpha),
      chipPill('1. Stream Finished', -560, 130, {
        w: 440,
        h: 72,
        color: ph >= 2 ? ROLE.ok : COSMOS.rule,
        size: 28,
        opacity: alpha,
      }),
      chipPill(
        ph === 2 ? '2. Transfers In Flight (WAIT!)' : '2. Reads/Writes/Transfers Done',
        25,
        130,
        {
          w: 620,
          h: 72,
          color: ph === 2 ? ROLE.warn : ph >= 3 ? ROLE.ok : COSMOS.rule,
          size: 28,
          glow: ph >= 2 ? 10 : 0,
          opacity: alpha,
        },
      ),
      chipPill('3. Reassign to D', 580, 130, {
        w: 410,
        h: 72,
        color: ph >= 4 ? ROLE.d : COSMOS.rule,
        size: 28,
        glow: ph >= 4 ? 10 : 0,
        opacity: alpha,
      }),
      txt(
        ph >= 5
          ? 'Shared prefix pages need reference counts; preemption keeps already-sent tokens and replays KV'
          : 'Non-contiguous pages eliminate external fragmentation when the attention kernel reads the block table',
        0,
        290,
        28,
        ph >= 5 ? ROLE.d : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'growing-state', (d) => s.play(phase.to(0, { duration: d })));
  playCue(s, c, 'state-budget', (d) => s.play(phase.to(1, { duration: d })));
  playCue(s, c, 'physical-pages', (d) => s.play(phase.to(1, { duration: d })));
  playCue(s, c, 'independent-pages', (d) => s.play(phase.to(2, { duration: d })));
  playCue(s, c, 'retire-pages', (d) => s.play(phase.to(3, { duration: d })));
  playCue(s, c, 'memory-reassign', (d) => s.play(phase.to(4, { duration: d })));
  playCue(s, c, 'shared-references', (d) => s.play(phase.to(5, { duration: d })));
}
