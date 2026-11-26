// Scene 04: refill: Signature orbiting 3D GPU execution wave morphing static canyons -> continuous 18/18 filled wave (tick 8 vs 11).
import {
  CONT_TRACE,
  COSMOS,
  REQ_COLOR,
  ROLE,
  aura,
  buildBatchWave3d,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function refill(s, c) {
  const refillAmt = s.value(0); // 0=static gaps, 0.5=D joins, 1.0=D+E fill all 18/18
  const showFinish = s.value(0); // 0=hidden, 1=tick 8 vs tick 11

  const bgAura = aura(320, 20, 760, '#14386634', '#103c3226');
  const title = heroTitle(['Continuous Refill:', '18/18 Seats, Finish at Tick 8'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  // Signature orbiting 3D GPU execution wave on the right
  const wave3d = buildBatchWave3d(refillAmt, { x: 430, y: 25 });
  orbitScene(s, c, wave3d, { theta: -0.32, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rf = refillAmt.value;
    const fn = showFinish.value;
    const gx0 = -805;

    const nodes = [
      txt('REFILL SEAT-BY-SEAT (6-STEP WINDOW)', -855, -225, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha,
      ),
    ];

    for (let seat = 0; seat < 3; seat++) {
      const y = -135 + seat * 92;
      for (let t = 0; t < 6; t++) {
        const cx = gx0 + t * 124;
        const cell = CONT_TRACE[t].slots[seat];
        const isD = cell?.id === 'D';
        const isE = cell?.id === 'E';
        const active = (!isD && !isE) || (isD && rf >= 0.35) || (isE && rf >= 0.85);
        const col = active && cell ? REQ_COLOR[cell.id] : COSMOS.rule;
        nodes.push(
          rect(108, 68, {
            fill: active ? '#12243f' : '#121526',
            stroke: col,
            width: active ? 2.4 : 1.6,
            radius: 8,
          })
            .at(cx, y)
            .opacity(alpha * (active ? 1 : 0.35)),
          txt(
            active && cell ? `${cell.id}${cell.generated}` : '-',
            cx,
            y,
            28,
            active ? col : COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    }

    // Total 5-request finish comparison (ticks 8 vs 11)
    const barX = -855;
    const maxW = 580;
    nodes.push(
      txt(
        'ALL 5 REPLIES COMPLETE (21 TOTAL TOKENS)',
        barX,
        145,
        26,
        ROLE.d,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Continuous (Refill)', barX, 208, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX + 340, 208, (8 / 11) * (maxW - 180), 30, ROLE.ok, {
        opacity: alpha * (0.4 + 0.6 * fn),
        maxTrackW: maxW - 180,
      }),
      txt('Tick 8', barX + maxW + 185, 208, 30, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.4 + 0.6 * fn),
      ),

      txt('Static (2 Batches)', barX, 282, 28, ROLE.warn, 'mono', 'left').opacity(alpha),
      lumBar(barX + 340, 282, maxW - 180, 30, ROLE.warn, {
        opacity: alpha * (0.4 + 0.6 * fn),
        maxTrackW: maxW - 180,
      }),
      txt('Tick 11', barX + maxW + 185, 282, 30, ROLE.warn, 'mono', 'left').opacity(
        alpha * (0.4 + 0.6 * fn),
      ),
      txt(
        rf >= 0.85 ? '3D Wave: 18/18 Seats Filled' : '3D Wave: Refilling Idle Canyons',
        430,
        335,
        28,
        rf >= 0.85 ? ROLE.ok : ROLE.d,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, wave3d, layer);
  playCue(s, c, 'refill-seat', (d) => s.play(refillAmt.to(0.5, { duration: d })));
  playCue(s, c, 'refill-b-ends', (d) => s.play(refillAmt.to(0.7, { duration: d })));
  playCue(s, c, 'refill-e-starts', (d) => s.play(refillAmt.to(1.0, { duration: d })));
  playCue(s, c, 'continuing-identity', (d) => s.play(refillAmt.to(1.0, { duration: d })));
  playCue(s, c, 'full-seats', (d) => s.play(refillAmt.to(1.0, { duration: d })));
  playCue(s, c, 'useful-token-count', (d) => s.play(showFinish.to(0.4, { duration: d })));
  playCue(s, c, 'request-trace', (d) => s.play(showFinish.to(0.6, { duration: d })));
  playCue(s, c, 'finished-once', (d) => s.play(showFinish.to(0.75, { duration: d })));
  playCue(s, c, 'refill-end', (d) => s.play(showFinish.to(0.9, { duration: d })));
  playCue(s, c, 'static-end', (d) => s.play(showFinish.to(1.0, { duration: d })));
}
