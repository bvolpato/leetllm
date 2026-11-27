// Scene 33: transfer - How long can you stay?
// Living afternoon schedule ruler computed from visitSchedule(): 14:10 bus + 25m ride ->
// 14:35 arrival + 90m visit -> 16:05 finish, leaving 55 min emerald margin before the
// 17:00 user deadline and 18:00 museum closing!
import { group, line, rect } from 'vizmatic/stage';
import {
  BUS_ROUTE,
  COSMOS,
  ROLE,
  VISIT_HOURS,
  VISIT_MAIN,
  aura,
  cinemaHeader,
  clampDur,
  clock,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const routeOn = s.value(0);
  const rideOn = s.value(0);
  const arrOn = s.value(0);
  const visitOn = s.value(0);
  const finishOn = s.value(0);
  const limitsOn = s.value(0);
  const marginOn = s.value(0);

  const header = cinemaHeader('SCHEDULE SYNTHESIS', 'How long can you stay', 'at History Museum?', {
    accent: ROLE.ok,
    size: 48,
  });

  const stageAura = aura(160, 40, 620, '#6ee7b71e', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const rt = routeOn.value;
      const rd = rideOn.value;
      const ar = arrOn.value;
      const vs = visitOn.value;
      const fn = finishOn.value;
      const lm = limitsOn.value;
      const mg = marginOn.value;
      const nodes = [];

      // Surviving evidence badges (floating, zero cards)
      nodes.push(
        txt(
          `RECEIPT 1: ${VISIT_HOURS.id} · History · open ${clock(VISIT_HOURS.opens)}-${clock(VISIT_HOURS.closes)}`,
          -840,
          -185,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
        txt(
          `RECEIPT 2: ${BUS_ROUTE.id} · Bus departs ${clock(BUS_ROUTE.depart)} · ${BUS_ROUTE.minutes}m ride`,
          -840,
          -135,
          26,
          ROLE.action,
          'mono',
          'left',
        ).opacity(0.35 + rt * 0.65),
      );

      // Fixed Afternoon Ruler: 13:30 (810) -> 18:30 (1110) across x in [-760..+760]
      const x0 = -760;
      const x1 = 760;
      const mapT = (m) => x0 + ((m - 810) / 300) * (x1 - x0);
      const rY = 70;

      const xDep = mapT(BUS_ROUTE.depart); // 14:10 (850)
      const xArr = mapT(VISIT_MAIN.arrival); // 14:35 (875)
      const xFin = mapT(VISIT_MAIN.finish); // 16:05 (965)
      const xDead = mapT(VISIT_MAIN.deadline); // 17:00 (1020)
      const xClose = mapT(VISIT_HOURS.closes); // 18:00 (1080)

      nodes.push(line([x0, rY], [x1, rY], { stroke: '#344770', width: 5 }));
      for (const m of [840, 900, 960, 1020, 1080]) {
        const tx = mapT(m);
        nodes.push(
          line([tx, rY - 12], [tx, rY + 12], { stroke: '#455a8a', width: 2 }),
          txt(clock(m), tx, rY + 52, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      // 25m Bus Ride bar
      if (rd > 0.05) {
        const w = (xArr - xDep) * rd;
        nodes.push(
          rect(Math.max(8, w), 58, { fill: ROLE.action, stroke: '#ffffff', width: 1.5, radius: 8 })
            .at(xDep + w * 0.5, rY)
            .glow(8, ROLE.action)
            .opacity(0.9),
          txt(
            '25m',
            xDep + (xArr - xDep) * 0.5,
            rY - 56,
            26,
            ROLE.action,
            'mono',
            'center',
          ).opacity(rd),
        );
      }
      if (ar > 0.05) {
        nodes.push(
          txt(
            `ARR ${clock(VISIT_MAIN.arrival)}`,
            xArr,
            rY + 95,
            26,
            ROLE.action,
            'mono',
            'center',
          ).opacity(ar),
        );
      }

      // 90m Visit bar
      if (vs > 0.05) {
        const w = (xFin - xArr) * vs;
        nodes.push(
          rect(Math.max(8, w), 58, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 8 })
            .at(xArr + w * 0.5, rY)
            .glow(9, ROLE.ok)
            .opacity(0.9),
          txt(
            '90 min VISIT',
            xArr + (xFin - xArr) * 0.5,
            rY - 56,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(vs),
        );
      }
      if (fn > 0.05) {
        nodes.push(
          txt(`LEAVE ${clock(VISIT_MAIN.finish)}`, xFin, rY + 95, 28, ROLE.ok, 'mono', 'center')
            .glow(7, ROLE.ok)
            .opacity(fn),
        );
      }

      // 17:00 Deadline & 18:00 Closing markers (stop cleanly above tick labels!)
      nodes.push(
        line([xDead, rY - 95], [xDead, rY + 26], { stroke: ROLE.focus, width: 4, dash: [8, 6] })
          .glow(8, ROLE.focus)
          .opacity(0.45 + lm * 0.55),
        txt('17:00 DEADLINE', xDead, rY - 122, 26, ROLE.focus, 'mono', 'center').opacity(
          0.45 + lm * 0.55,
        ),
        line([xClose, rY - 95], [xClose, rY + 26], { stroke: ROLE.policy, width: 4 })
          .glow(8, ROLE.policy)
          .opacity(0.45 + lm * 0.55),
        txt('18:00 CLOSES', xClose, rY - 122, 26, ROLE.policy, 'mono', 'center').opacity(
          0.45 + lm * 0.55,
        ),
      );

      // 55m emerald margin bracket
      if (mg > 0.05) {
        nodes.push(
          line([xFin, rY], [xDead, rY], { stroke: ROLE.ok, width: 8 })
            .glow(10, ROLE.ok)
            .opacity(mg),
          txt(
            `RECOMMEND 14:10 BUS  ·  FINISH 16:05  ·  ${VISIT_MAIN.deadline - VISIT_MAIN.finish} MIN MARGIN BEFORE DEADLINE`,
            0,
            325,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(8, ROLE.ok)
            .opacity(mg),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('transfer-b1-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('transfer-b1-1').start, 0.25) }));
  });
  c.on('transfer-b1-2', () => {
    s.play(routeOn.to(1, { duration: clampDur(c, c.cue('transfer-b1-2').start, 0.35) }));
  });
  c.on('transfer-b2-1', () => {
    s.play(rideOn.to(1, { duration: clampDur(c, c.cue('transfer-b2-1').start, 0.4) }));
  });
  c.on('transfer-arrival', () => {
    s.play(arrOn.to(1, { duration: clampDur(c, c.cue('transfer-arrival').start, 0.35) }));
  });
  c.on('transfer-b2-2', () => {
    s.play(visitOn.to(1, { duration: clampDur(c, c.cue('transfer-b2-2').start, 0.45) }));
  });
  c.after('transfer-finish', () => {
    s.play(finishOn.to(1, { duration: clampDur(c, c.cue('transfer-finish').end, 0.35) }));
  });
  c.on('transfer-limits', () => {
    s.play(limitsOn.to(1, { duration: clampDur(c, c.cue('transfer-limits').start, 0.35) }));
  });
  c.on('transfer-b3-1', () => {
    s.play(marginOn.to(1, { duration: clampDur(c, c.cue('transfer-b3-1').start, 0.35) }));
  });
}
