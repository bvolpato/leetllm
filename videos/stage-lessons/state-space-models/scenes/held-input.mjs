// Scene 06: held-input: Exact matrix exponential integral -> half-carry trace -> decouple C readout & D skip from h.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  run,
  swapVis,
  txt,
  xs,
} from '../parts.mjs';

export default function heldInput(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showUnitNumbers = s.value(0);
  const halfStep = s.value(1); // 1..4
  const cVal = s.value(1); // 1 -> 2
  const dVal = s.value(0); // 0 -> 0.5

  const bgAura = aura(0, 0, 740, '#16365e26', '#103c3618');
  const title = heroTitle(['Held-Input Discretization', '& State vs Readout'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.read,
  });

  const eq = glowTex(
    String.raw`\bar{A} = e^{\Delta A}, \quad \bar{B} = \int_0^\Delta e^{uA}\,du\,B = A^{-1}(e^{\Delta A} - I)B`,
    { x: 0, y: -155, size: 36, color: ROLE.delta, glow: 6 },
  );

  const halfStates = run(xs, 0.5, 0.5); // [1.5, 1.25, 2.625, 2.3125]
  const ret1 = Math.exp(-1);
  const exact1 = 1 - ret1;

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const u = showUnitNumbers.value;
    const barX = -320;
    const maxW = 740;
    const quietA = alpha * 0.28;
    const activeA = alpha * (0.28 + 0.72 * u);
    const nodes = [
      txt(
        'ZERO-ORDER HOLD (INTEGRAL FORM WORKS EVEN IF A IS SINGULAR)',
        -855,
        -245,
        26,
        ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'SCALAR TEST:  A = −1,  B = 1,  Δ = 1',
        -855,
        -20,
        28,
        ROLE.delta,
        'mono',
        'left',
      ).opacity(activeA),
      txt('Carry e^{-1}', -855, 65, 30, ROLE.state, 'mono', 'left').opacity(activeA),
      lumBar(barX, 65, Math.max(8, maxW * ret1 * u), 34, ROLE.state, {
        opacity: u > 0.05 ? activeA : quietA,
        maxTrackW: maxW,
      }),
      txt(
        u > 0.15 ? ret1.toFixed(3) : 'e^{-1}',
        barX + maxW + 32,
        65,
        32,
        ROLE.state,
        'mono',
        'left',
      ).opacity(activeA),

      txt('Exact ZOH', -855, 155, 30, ROLE.carry, 'mono', 'left').opacity(activeA),
      lumBar(barX, 155, Math.max(8, maxW * exact1 * u), 34, ROLE.carry, {
        opacity: u > 0.05 ? activeA : quietA,
        maxTrackW: maxW,
      }),
      txt(
        u > 0.15 ? exact1.toFixed(3) : '1 − e^{-1}',
        barX + maxW + 32,
        155,
        32,
        ROLE.carry,
        'mono',
        'left',
      ).opacity(activeA),

      txt('Mamba Δ·B', -855, 245, 30, ROLE.write, 'mono', 'left').opacity(activeA),
      lumBar(barX, 245, Math.max(8, maxW * 1.0 * u), 34, ROLE.write, {
        opacity: u > 0.05 ? activeA : quietA,
        maxTrackW: maxW,
      }),
      txt(
        u > 0.15 ? '1.000' : 'Δ·B',
        barX + maxW + 32,
        245,
        32,
        ROLE.write,
        'mono',
        'left',
      ).opacity(activeA),
    ];
    return group(...nodes);
  });

  // View 2: Half-carry trace [1.5, 1.25, 2.625, 2.3125] + changing C and D leaves h_4 untouched!
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const k = Math.round(halfStep.value);
    const cv = cVal.value;
    const dv = dVal.value;
    const finalH = halfStates[3]; // 2.3125
    const finalX = xs[3]; // 2
    const outY = cv * finalH + dv * finalX;
    const nodes = [
      txt(
        'HALF-CARRY TRACE:  h_t = 0.5 h_{t-1} + 0.5 x_t',
        -855,
        -225,
        28,
        ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < k; i++) {
      const y = -135 + i * 74;
      nodes.push(
        txt(`t=${i + 1} (x=${xs[i]})`, -855, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
        lumBar(-590, y, (halfStates[i] / 6.0) * 840, 28, ROLE.state, {
          opacity: alpha,
          maxTrackW: 840,
        }),
        txt(
          `h_${i + 1} = ${halfStates[i].toFixed(4)}`,
          285,
          y,
          28,
          ROLE.state,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // Live decoupled readout y_4 = C*h_4 + D*x_4 while h_4 stays locked at 2.3125!
    nodes.push(
      txt(
        `Stored state h_4 = ${finalH.toFixed(4)}  (UNCHANGED!)`,
        -855,
        215,
        32,
        ROLE.state,
        'mono',
        'left',
      )
        .glow(8, ROLE.state)
        .opacity(alpha),
      txt(
        `Output y_4 = (${cv.toFixed(1)})·h_4 + (${dv.toFixed(1)})·x_4  =  ${outY.toFixed(4)}`,
        -855,
        295,
        34,
        ROLE.delta,
        'mono',
        'left',
      )
        .glow(8, ROLE.delta)
        .opacity(alpha),
      lumBar(-855, 360, (outY / 6.0) * 1120, 32, ROLE.delta, { opacity: alpha, maxTrackW: 1120 }),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, eq, view1, view2);
  playCue(s, c, 'held-input-b2', (d) => s.play(showUnitNumbers.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(
    s,
    c,
    'held-input-b3',
    (d) => {
      s.play(swapVis(view1Vis, view2Vis, d));
    },
    { dur: 0.6 },
  );
  c.hide('held-input-b3', eq);
  playCue(s, c, 'ssm-half-second', (d) => s.play(halfStep.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'ssm-half-third', (d) => s.play(halfStep.to(3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'ssm-half-fourth', (d) => s.play(halfStep.to(4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'change-readout', (d) => s.play(cVal.to(2, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'add-skip', (d) => s.play(dVal.to(0.5, { duration: d })), { dur: 0.65 });
  bindCueBeat(s, c, s.value(0), [
    'held-input-b1',
    'ssm-held-integral',
    'ssm-held-inverse',
    'ssm-held-retention',
    'ssm-held-exact',
    'ssm-held-euler',
    'ssm-half-first',
  ]);
}
