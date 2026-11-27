// Scene 01: Which reply should the adapter change?: Key rotation triage + 90-day policy prediction + 20+20 held-out gate.
import {
  COSMOS,
  aura,
  circle,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  rotationPolicy,
  runPhase,
  txt,
} from '../parts.mjs';

export default function policyTask(s, c) {
  const phase = s.value(0);
  const hlYoung = s.value(0);
  const hlOld = s.value(0);
  const showRule = s.value(0);
  const revealRoute = s.value(0);
  const revealKeep = s.value(0);
  const showTrainPair = s.value(0);
  const showSets = s.value(0);

  const { routine, overdue, minimumDays } = rotationPolicy;
  const bgAura = aura(160, 0, 640, '#ffd16620', '#5ce1e618');
  const title = heroTitle(['Which Reply', 'Needs to Change?'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'LORA · POLICY ROUTING TASK',
  });

  // Age axis spanning right/bottom region for constant visual balance
  const axisX0 = -760;
  const axisX1 = 760;
  const axisY = 18;
  const dayToX = (days) => axisX0 + (days / 110) * (axisX1 - axisX0);

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const hy = hlYoung.value;
    const ho = hlOld.value;
    const sr = showRule.value;
    const rr = revealRoute.value;
    const rk = revealKeep.value;
    const tp = showTrainPair.value;
    const st = showSets.value;

    const pulse = 0.72 + 0.28 * Math.sin(p * 3.4);
    const xYoung = dayToX(routine.days);
    const xOld = dayToX(overdue.days);
    const xThresh = dayToX(minimumDays);

    const nodes = [
      // Policy threshold banner (floating typography, zero top bar)
      txt('RETRIEVED ROTATION RULE', 855, -405, 26, COSMOS.muted, 'mono', 'right'),
      txt(
        `${minimumDays} days or older  ->  Rotation owner`,
        855,
        -348,
        36,
        sr > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'right',
      ).glow(sr > 0.2 ? 9 * pulse : 4, sr > 0.2 ? COSMOS.gold : COSMOS.cyan),

      // Key-age continuum axis
      line([axisX0, axisY], [axisX1, axisY], { stroke: '#3a4c78', width: 3 }),
      txt('0d', axisX0, axisY + 42, 26, COSMOS.muted, 'mono'),
      txt('50d', dayToX(50), axisY + 42, 26, COSMOS.muted, 'mono'),
      txt('90d RULE', xThresh, axisY - 58, 26, sr > 0.2 ? COSMOS.gold : COSMOS.muted, 'mono'),
      line([xThresh, axisY - 30], [xThresh, axisY + 30], {
        stroke: sr > 0.2 ? COSMOS.gold : '#5d6e96',
        width: sr > 0.2 ? 4 : 2.5,
      }).glow(sr > 0.2 ? 10 : 0, COSMOS.gold),
      txt('110d', axisX1, axisY + 42, 26, COSMOS.muted, 'mono'),

      // Young key ticket R07 (left)
      glassCell(-470, -150, 680, 178, hy > 0.2 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#131d36',
        glow: hy > 0.2 ? 10 : 5,
      }),
      txt(`TICKET ${routine.id}`, -780, -206, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`${routine.days} days old`, -780, -142, 46, COSMOS.ink, 'mono', 'left'),
      txt('Base reply: Routine review', -780, -86, 28, COSMOS.muted, 'sans', 'left'),
      circle(11, COSMOS.cyan).at(xYoung, axisY).glow(10, COSMOS.cyan),
      glowingArc([-470, -60], [xYoung, axisY - 12], 18, {
        color: COSMOS.cyan,
        width: 3,
        opacity: 0.72,
      }),

      // Overdue key ticket P04 (right)
      glassCell(410, -150, 680, 178, ho > 0.2 ? COSMOS.gold : COSMOS.blue, {
        fill: '#181930',
        glow: ho > 0.2 ? 11 : 5,
      }),
      txt(`TICKET ${overdue.id}`, 100, -206, 26, COSMOS.gold, 'mono', 'left'),
      txt(`${overdue.days} days old`, 100, -142, 46, COSMOS.ink, 'mono', 'left'),
      txt('Base reply: Routine review', 100, -86, 28, COSMOS.muted, 'sans', 'left'),
      circle(11, COSMOS.gold).at(xOld, axisY).glow(10, COSMOS.gold),
      glowingArc([620, -60], [xOld, axisY - 12], 8, {
        color: COSMOS.gold,
        width: 3,
        opacity: 0.72,
      }),
    ];

    // Target routing trays (strictly withhold answers until ticket-route & ticket-keep!)
    const leftRouteLabel = rk > 0.5 ? 'Keep: Routine review' : 'Target reply: ?';
    const leftRouteCol = rk > 0.5 ? COSMOS.emerald : COSMOS.dim;
    const rightRouteLabel = rr > 0.5 ? 'Change -> Rotation owner' : 'Target reply: ?';
    const rightRouteCol = rr > 0.5 ? COSMOS.gold : COSMOS.dim;

    nodes.push(
      glassCell(-470, 148, 680, 96, leftRouteCol, {
        fill: rk > 0.5 ? '#0e2428' : '#12182b',
        glow: rk > 0.5 ? 9 : 2,
      }),
      txt(leftRouteLabel, -470, 148, 32, leftRouteCol, 'mono').glow(rk > 0.5 ? 6 : 0, leftRouteCol),

      glassCell(410, 148, 680, 96, rightRouteCol, {
        fill: rr > 0.5 ? '#262011' : '#12182b',
        glow: rr > 0.5 ? 10 : 2,
      }),
      txt(rightRouteLabel, 410, 148, 32, rightRouteCol, 'mono').glow(
        rr > 0.5 ? 7 : 0,
        rightRouteCol,
      ),
    );

    // Bottom zone: LoRA trainable pair A, B -> held-out 20 + 20 evaluation gate
    if (st > 0.1) {
      nodes.push(
        glassCell(-440, 342, 760, 134, COSMOS.emerald, {
          fill: '#0f2329',
          glow: 9,
          opacity: st,
        }),
        txt('HELD-OUT RELEASE GATE', -440, 304, 26, COSMOS.muted, 'mono').opacity(st),
        txt('20 policy + 20 routine · >=19 each', -440, 360, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(st),
        glassCell(440, 342, 760, 134, COSMOS.cyan, {
          fill: '#101b32',
          glow: 8,
          opacity: st,
        }),
        txt('SAVED REPRODUCIBILITY CONTRACT', 440, 304, 26, COSMOS.muted, 'mono').opacity(st),
        txt('expected replies · format · base revision', 440, 360, 28, COSMOS.cyan, 'mono').opacity(
          st,
        ),
      );
    } else if (tp > 0.05) {
      nodes.push(
        glassCell(0, 342, 1320, 134, COSMOS.gold, {
          fill: '#181c30',
          glow: 9,
          opacity: tp,
        }),
        txt('FROZEN BASE W_0', -440, 342, 30, COSMOS.blue, 'mono').opacity(tp),
        txt('+', -230, 342, 42, COSMOS.muted, 'mono').opacity(tp),
        rect(110, 68, { fill: '#2c2210', stroke: COSMOS.gold, width: 2.5, radius: 8 })
          .at(-110, 342)
          .glow(8, COSMOS.gold)
          .opacity(tp),
        txt('A', -110, 342, 36, COSMOS.gold, 'mono').opacity(tp),
        rect(110, 68, { fill: '#102836', stroke: COSMOS.cyan, width: 2.5, radius: 8 })
          .at(35, 342)
          .glow(8, COSMOS.cyan)
          .opacity(tp),
        txt('B', 35, 342, 36, COSMOS.cyan, 'mono').opacity(tp),
        txt('5,000 labeled tickets', 385, 342, 30, COSMOS.ink, 'sans').opacity(tp),
      );
    } else {
      nodes.push(
        txt(
          'Compare both ticket ages against the 90-day rule before choosing',
          0,
          342,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('ticket-young', () => s.play(hlYoung.to(1, { duration: 0.4 })));
  c.on('ticket-old', () => s.play(hlOld.to(1, { duration: 0.4 })));
  c.on('rotation-rule', () => s.play(showRule.to(1, { duration: 0.45 })));
  c.after('ticket-route', () => s.play(revealRoute.to(1, { duration: 0.35 })));
  c.after('ticket-keep', () => s.play(revealKeep.to(1, { duration: 0.35 })));
  c.on('ticket-train', () => s.play(showTrainPair.to(1, { duration: 0.45 })));
  c.on('ticket-sets', () =>
    s.play(showSets.to(1, { duration: remainDuration(c, 'ticket-sets', 0.5) })),
  );
}
