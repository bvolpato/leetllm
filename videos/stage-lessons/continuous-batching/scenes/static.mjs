// Scene 03: static: 3x6 fixed batch = 18 reserved seat-steps, 12 useful (66.7%), 6 idle gaps; first gap at (Seat 1, Step 3).
import {
  COSMOS,
  FIXED_TRACE,
  REQ_COLOR,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function staticBatch(s, c) {
  const showGaps = s.value(0);
  const showCount = s.value(0);
  const focusGap = s.value(0);

  const bgAura = aura(0, 0, 740, '#14325c28', '#2b152622');
  const title = heroTitle(['Static Batching:', '12 Useful Out of 18 Seats'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const gp = showGaps.value;
    const cnt = showCount.value;
    const fg = focusGap.value;

    const nodes = [
      txt(
        'STATIC BATCH (A=2, B=4, C=6): ALL 3 SEATS HELD UNTIL LONGEST FINISHES',
        -855,
        -225,
        26,
        ROLE.a,
        'mono',
        'left',
      ).opacity(alpha),
      txt('TICK:', -855, -160, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    for (let t = 0; t < 6; t++) {
      nodes.push(
        txt(`${t + 1}`, -580 + t * 185, -160, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    }

    for (let seat = 0; seat < 3; seat++) {
      const y = -80 + seat * 102;
      nodes.push(txt(`Seat ${seat + 1}`, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha));
      for (let t = 0; t < 6; t++) {
        const cx = -580 + t * 185;
        const cell = FIXED_TRACE[t].slots[seat];
        const isFirstGap = seat === 0 && t === 2;
        if (cell) {
          const col = REQ_COLOR[cell.id];
          nodes.push(
            rect(155, 76, { fill: '#12223c', stroke: col, width: 2.4, radius: 10 })
              .at(cx, y)
              .opacity(alpha),
            txt(`${cell.id}${cell.generated}`, cx, y, 30, col, 'mono', 'center').opacity(alpha),
          );
        } else {
          const highlight = isFirstGap && fg > 0.3;
          nodes.push(
            rect(155, 76, {
              fill: highlight ? '#342610' : '#1b121c',
              stroke: highlight ? ROLE.d : gp > 0.3 ? ROLE.warn : COSMOS.rule,
              width: highlight ? 3.8 : 2,
              radius: 10,
            })
              .at(cx, y)
              .glow(highlight ? 14 : 0, ROLE.d)
              .opacity(alpha * (0.45 + 0.55 * gp)),
            txt(
              highlight ? 'D?' : 'IDLE',
              cx,
              y,
              28,
              highlight ? ROLE.d : ROLE.warn,
              'mono',
              'center',
            ).opacity(alpha * (0.45 + 0.55 * gp)),
          );
        }
      }
    }

    // Bottom occupancy bar (12 / 18 = 66.7%)
    const barX = -460;
    const maxW = 860;
    nodes.push(
      txt('Seat-Steps Used', -855, 255, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * cnt),
      ),
      lumBar(barX, 255, (12 / 18) * maxW, 34, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * cnt),
        maxTrackW: maxW,
      }),
      txt('12 / 18  (2/3)', barX + maxW + 28, 255, 30, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * cnt),
      ),
      txt(
        fg > 0.3
          ? 'Step 3, Seat 1 is already empty while D is ready to decode!'
          : '6 reserved seat-steps sit empty waiting for C to finish at tick 6',
        0,
        345,
        28,
        fg > 0.3 ? ROLE.d : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'static-seats', (d) => s.play(showGaps.to(0.4, { duration: d })));
  playCue(s, c, 'empty-seat', (d) => s.play(showGaps.to(1, { duration: d })));
  playCue(s, c, 'seat-accounting', (d) => s.play(showCount.to(0.6, { duration: d })));
  playCue(s, c, 'useful-occupancy', (d) => s.play(showCount.to(1, { duration: d })));
  playCue(s, c, 'first-empty', (d) => s.play(focusGap.to(0.6, { duration: d })));
  playCue(s, c, 'next-opportunity', (d) => s.play(focusGap.to(1, { duration: d })));
}
