// Scene 22: timing-contract: Strict receipt validation (done===true, int>=0, cached<=prompt, ns->s) + client clock timeline (submit -> 1st chunk -> 1st visible -> done).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function timingContract(s, c) {
  const showClient = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Timing Receipt Contract &', 'Client Arrival Timeline'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cl = showClient.value;
    const yRail = 120;
    const marks = [
      { x: -720, lbl: 'Submit', col: ROLE.weights },
      { x: -240, lbl: '1st Chunk', col: ROLE.gold },
      { x: 240, lbl: '1st Visible Tok', col: ROLE.ok },
      { x: 720, lbl: 'Done (ns receipt)', col: ROLE.vram },
    ];

    const nodes = [
      txt('1. STRICT RECEIPT VALIDATOR RULES', -855, -220, 26, ROLE.vram, 'mono', 'left').opacity(
        alpha,
      ),
      chipPill('done === true (bool != int)', -575, -135, {
        w: 500,
        h: 72,
        color: ROLE.vram,
        size: 26,
        opacity: alpha,
      }),
      chipPill('cached <= prompt (both req)', 0, -135, {
        w: 510,
        h: 72,
        color: ROLE.gold,
        size: 26,
        opacity: alpha,
      }),
      chipPill('dur > 0 & finite int div', 575, -135, {
        w: 500,
        h: 72,
        color: ROLE.ok,
        size: 26,
        opacity: alpha,
      }),

      txt(
        '2. CLIENT STREAMING TIMELINE (1 s = 1,000,000,000 ns)',
        -855,
        10,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * cl)),
      line([-720, yRail], [720, yRail], { stroke: '#2c426e', width: 5 }).opacity(
        alpha * (0.45 + 0.55 * cl),
      ),
    ];

    marks.forEach((m) => {
      nodes.push(
        glowDot(m.x, yRail, {
          radius: 11,
          color: m.col,
          glow: 12,
          opacity: alpha * (0.45 + 0.55 * cl),
        }),
        txt(m.lbl, m.x, yRail + 52, 26, m.col, 'mono', 'center').opacity(
          alpha * (0.45 + 0.55 * cl),
        ),
      );
    });

    nodes.push(
      txt(
        'Thinking tokens, buffering, cold loads & queues change client wait: define TTFT event before comparing runs',
        0,
        295,
        26,
        cl > 0.3 ? ROLE.vram : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-timing-contract-1-0', (d) => s.play(showClient.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-timing-contract-0-0',
    'pl-timing-contract-0-1',
    'pl-timing-contract-0-2',
    'pl-timing-contract-0-3',
    'pl-timing-contract-0-4',
    'pl-timing-contract-0-5',
    'pl-timing-contract-1-1',
    'pl-timing-contract-1-2',
    'pl-timing-contract-1-3',
    'pl-timing-contract-1-4',
  ]);
}
