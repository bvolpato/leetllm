// Scene 11: Which factor can learn on the first pass?: Zero-init B=0 prediction + step-1 vs step-2 backward conduit.
import {
  COSMOS,
  LEARN_STEPS,
  arrow,
  aura,
  fmtNum,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function initialization(s, c) {
  const hlA = s.value(0);
  const hlB = s.value(0);
  const traceToB = s.value(0);
  const revealGradB = s.value(0); // withheld until after initialization-b2-1!
  const revealGradA = s.value(0); // withheld until after initialization-b2-2!
  const stepTwo = s.value(0); // B -> 0.1
  const traceThroughB = s.value(0);

  const s0 = LEARN_STEPS[0]; // a=1, b=0, gradB=-1, gradA=0
  const s1 = LEARN_STEPS[1]; // a=1, b=0.1, gradB=-0.9, gradA=-0.09

  const bgAura = aura(120, 0, 620, '#ffd1661e', '#ff6b8b16');
  const title = heroTitle(['Which Factor Learns', 'on Step One?'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'ZERO-INIT IDENTITY · B = 0',
  });

  const eqGradB = glowTex(
    String.raw`\frac{\partial \mathcal{L}}{\partial B} = (\hat{y} - y^*)(Ax)`,
    {
      x: -440,
      y: 280,
      size: 34,
      color: COSMOS.cyan,
    },
  );
  const eqGradA = glowTex(
    String.raw`\frac{\partial \mathcal{L}}{\partial A} = (\hat{y} - y^*) B x`,
    {
      x: 420,
      y: 280,
      size: 34,
      color: COSMOS.gold,
    },
  );

  const live = guardedDynamic(1, () => {
    const ha = hlA.value;
    const hb = hlB.value;
    const tb = traceToB.value;
    const rgb = revealGradB.value > 0.5;
    const rga = revealGradA.value > 0.5;
    const st2 = stepTwo.value > 0.5;
    const ttb = traceThroughB.value > 0.5;

    const curStep = st2 ? s1 : s0;
    const curErr = curStep.output - 1;
    const yFlow = -65;

    const nodes = [
      // Scalar setup pill across top-right
      glassCell(345, -365, 980, 114, COSMOS.cyan, { fill: '#111a30', glow: 7 }),
      txt(
        st2 ? 'STEP 2 AFTER SGD (lr = 0.1)' : 'STEP 1 INITIALIZATION (lr = 0.1)',
        345,
        -395,
        26,
        st2 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt(
        `x=1 · target=1 · base=0 · out=${fmtNum(curStep.output, 2)}`,
        345,
        -342,
        28,
        COSMOS.ink,
        'mono',
      ),

      // Forward chain: x -> A -> z -> B -> y_hat -> error
      glassCell(-715, yFlow, 210, 128, COSMOS.muted, { fill: '#12192e', glow: 4 }),
      txt('INPUT x', -715, yFlow - 30, 26, COSMOS.muted, 'mono'),
      txt('1', -715, yFlow + 22, 42, COSMOS.ink, 'mono'),

      arrow([-602, yFlow], [-470, yFlow], { stroke: COSMOS.gold, width: 4, tip: 12 }),

      glassCell(-330, yFlow, 255, 144, ha > 0.2 ? COSMOS.gold : COSMOS.blue, {
        fill: '#231d10',
        glow: ha > 0.2 || ttb ? 11 : 5,
      }),
      txt('FACTOR A', -330, yFlow - 38, 26, COSMOS.gold, 'mono'),
      txt(`A = ${fmtNum(curStep.a, 2)}`, -330, yFlow + 18, 40, COSMOS.ink, 'mono'),

      arrow([-195, yFlow], [-65, yFlow], { stroke: COSMOS.gold, width: 4, tip: 12 }),
      txt('Ax = 1', -130, yFlow - 36, 26, COSMOS.gold, 'mono'),

      glassCell(80, yFlow, 270, 144, st2 ? COSMOS.emerald : hb > 0.2 ? COSMOS.cyan : COSMOS.blue, {
        fill: st2 ? '#0e2629' : '#102235',
        glow: hb > 0.2 || st2 ? 11 : 5,
      }),
      txt('FACTOR B', 80, yFlow - 38, 26, st2 ? COSMOS.emerald : COSMOS.cyan, 'mono'),
      txt(`B = ${fmtNum(curStep.b, 2)}`, 80, yFlow + 18, 40, COSMOS.ink, 'mono'),

      arrow([222, yFlow], [360, yFlow], { stroke: COSMOS.cyan, width: 4, tip: 12 }),

      glassCell(590, yFlow, 430, 144, COSMOS.rose, { fill: '#241320', glow: tb > 0.2 ? 10 : 5 }),
      txt('ERROR  g = y_hat − y*', 590, yFlow - 38, 26, COSMOS.rose, 'mono'),
      txt(`g = ${fmtNum(curErr, 2)}`, 590, yFlow + 18, 40, COSMOS.rose, 'mono').glow(
        7,
        COSMOS.rose,
      ),
    ];

    // Backward gradient flow arcs underneath the chain
    if (tb > 0.05) {
      nodes.push(
        arrow([540, yFlow + 88], [130, yFlow + 88], {
          stroke: COSMOS.rose,
          width: 4.5,
          tip: 13,
        }).glow(9, COSMOS.rose),
        txt('error reaches B', 335, yFlow + 124, 26, COSMOS.rose, 'mono'),
      );
    }

    if (st2 && ttb) {
      nodes.push(
        arrow([20, yFlow + 88], [-270, yFlow + 88], {
          stroke: COSMOS.emerald,
          width: 4.5,
          tip: 13,
        }).glow(10, COSMOS.emerald),
        txt('passes B = 0.1 -> reaches A!', -125, yFlow + 124, 26, COSMOS.emerald, 'mono'),
      );
    } else if (rga && !st2) {
      nodes.push(
        arrow([20, yFlow + 88], [-120, yFlow + 88], {
          stroke: COSMOS.dim,
          width: 3,
          tip: 10,
        }),
        txt('blocked by B = 0', -130, yFlow + 124, 26, COSMOS.rose, 'mono'),
      );
    }

    // Bottom gradient readouts (strictly withhold -1 and 0 until revealGradB & revealGradA!)
    const bGradText = st2
      ? `∂L/∂B = ${fmtNum(s1.gradB, 2)} (moves)`
      : rgb
        ? `∂L/∂B = ${fmtNum(s0.gradB, 2)} (learns first!)`
        : '∂L/∂B = ?';
    const aGradText =
      st2 && ttb
        ? `∂L/∂A = ${fmtNum(s1.gradA, 2)} (now learns!)`
        : rga
          ? `∂L/∂A = ${fmtNum(s0.gradA, 2)} (stalled at step 1)`
          : '∂L/∂A = ?';

    nodes.push(
      glassCell(-440, 392, 740, 108, rgb ? COSMOS.cyan : COSMOS.dim, {
        fill: '#101d32',
        glow: rgb ? 9 : 2,
      }),
      txt(bGradText, -440, 392, 34, rgb ? COSMOS.cyan : COSMOS.muted, 'mono').glow(
        rgb ? 7 : 0,
        COSMOS.cyan,
      ),

      glassCell(420, 392, 740, 108, st2 && ttb ? COSMOS.emerald : rga ? COSMOS.rose : COSMOS.dim, {
        fill: st2 && ttb ? '#0f2629' : '#1b1424',
        glow: rga || ttb ? 9 : 2,
      }),
      txt(
        aGradText,
        420,
        392,
        34,
        st2 && ttb ? COSMOS.emerald : rga ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).glow(rga || ttb ? 7 : 0, st2 && ttb ? COSMOS.emerald : COSMOS.rose),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqGradB, eqGradA, live);

  c.on('initialization-b1-1', () => s.play(hlA.to(1, { duration: 0.4 })));
  c.on('initialization-b1-2', () => s.play(hlB.to(1, { duration: 0.4 })));
  c.on('init-error-to-b', () => s.play(traceToB.to(1, { duration: 0.4 })));
  c.after('initialization-b2-1', () => s.play(revealGradB.to(1, { duration: 0.3 })));
  c.after('initialization-b2-2', () => s.play(revealGradA.to(1, { duration: 0.3 })));
  c.on('initialization-b3-1', () => s.play(stepTwo.to(1, { duration: 0.45 })));
  c.on('init-through-b', () =>
    s.play(traceThroughB.to(1, { duration: remainDuration(c, 'init-through-b', 0.45) })),
  );
}
