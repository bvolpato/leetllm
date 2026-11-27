// Scene 34: fresh-itinerary - The next bus leaves later
// Finale counterfactual on the fixed ruler: 15:20 bus + 25m ride + 90m visit (prediction
// pause on Beat 0!) -> reveals 15:45 arrival -> 17:15 finish (misses 17:00 deadline by 15m!) ->
// user allows 70m visit -> ONLY the visit's right edge slides back 20m to 16:55 (5m spare)!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LATER_BUS_ROUTE,
  ROLE,
  VISIT_HOURS,
  VISIT_LATE_70,
  VISIT_LATE_90,
  aura,
  cinemaHeader,
  clampDur,
  clock,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function freshItinerary(s, c) {
  const pulse = s.value(0);
  const inputsOn = s.value(0);
  const arrReveal = s.value(0);
  const finReveal = s.value(0);
  const failReveal = s.value(0);
  const offerOn = s.value(0); // user offers 70m visit (keeps 90m bar intact at 17:15!)
  const trimSlide = s.value(0); // 0 = 90m (17:15 fail), 1 = 70m (16:55 pass)
  const passReveal = s.value(0);
  const marginOn = s.value(0);

  const header = cinemaHeader('COUNTERFACTUAL & REPAIR', 'The next bus', 'leaves at 15:20', {
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const inp = inputsOn.value;
      const ar = arrReveal.value;
      const fn = finReveal.value;
      const fl = failReveal.value;
      const of = offerOn.value;
      const tr = trimSlide.value;
      const ps = passReveal.value;
      const mg = marginOn.value;
      const nodes = [];

      // Fixed Afternoon Ruler: 14:30 (870) -> 18:30 (1110) across x in [-760..+760]
      const x0 = -760;
      const x1 = 760;
      const mapT = (m) => x0 + ((m - 870) / 240) * (x1 - x0);
      const rY = 75;

      const xDep = mapT(LATER_BUS_ROUTE.depart); // 15:20 (920)
      const xArr = mapT(VISIT_LATE_90.arrival); // 15:45 (945)
      const curFinMin = VISIT_LATE_90.finish - tr * (VISIT_LATE_90.finish - VISIT_LATE_70.finish);
      const shownFinMin = tr > 0.5 ? VISIT_LATE_70.finish : VISIT_LATE_90.finish;
      const xCurFin = mapT(curFinMin);
      const xDead = mapT(VISIT_LATE_90.deadline); // 17:00 (1020)
      const xClose = mapT(VISIT_HOURS.closes); // 18:00 (1080)

      nodes.push(
        txt(
          tr > 0.45
            ? 'SAME 15:20 BUS · 25m RIDE · REVISED 70 MIN VISIT'
            : 'LATER BUS: DEPARTS 15:20 · 25m RIDE · 90 MIN VISIT REQUESTED',
          -840,
          -175,
          28,
          ps > 0.4 ? ROLE.ok : tr > 0.45 ? ROLE.focus : ROLE.action,
          'mono',
          'left',
        ),
        line([x0, rY], [x1, rY], { stroke: '#344770', width: 5 }),
      );

      for (const m of [900, 960, 1020, 1080]) {
        const tx = mapT(m);
        nodes.push(
          line([tx, rY - 12], [tx, rY + 12], { stroke: '#455a8a', width: 2 }),
          txt(clock(m), tx, rY + 52, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      // 17:00 Deadline & 18:00 Closing markers (always visible! Stop above tick labels at rY+52)
      nodes.push(
        line([xDead, rY - 105], [xDead, rY + 26], {
          stroke: ROLE.focus,
          width: 4,
          dash: [8, 6],
        }).glow(9, ROLE.focus),
        txt('17:00 DEADLINE', xDead, rY - 130, 26, ROLE.focus, 'mono', 'center'),
        line([xClose, rY - 105], [xClose, rY + 26], { stroke: ROLE.policy, width: 4 }).glow(
          8,
          ROLE.policy,
        ),
        txt('18:00 CLOSES', xClose, rY - 130, 26, ROLE.policy, 'mono', 'center'),
        // Departure pin at 15:20
        line([xDep, rY - 45], [xDep, rY + 26], { stroke: ROLE.action, width: 4 }).glow(
          8,
          ROLE.action,
        ),
        txt('15:20 BUS', xDep, rY - 72, 26, ROLE.action, 'mono', 'center'),
      );

      // Strictly withhold arrival & finish bars during Beat 0 prediction pause!
      if (ar > 0.05) {
        const wRide = (xArr - xDep) * ar;
        nodes.push(
          rect(Math.max(8, wRide), 56, {
            fill: ROLE.action,
            stroke: '#ffffff',
            width: 1.5,
            radius: 8,
          })
            .at(xDep + wRide * 0.5, rY)
            .glow(8, ROLE.action)
            .opacity(0.9),
          txt(
            `ARR ${clock(VISIT_LATE_90.arrival)}`,
            xArr,
            rY + 95,
            26,
            ROLE.action,
            'mono',
            'center',
          ).opacity(ar),
        );
      }

      if (fn > 0.05) {
        const wVis = (xCurFin - xArr) * fn;
        const barCol =
          ps > 0.4 ? ROLE.ok : tr > 0.45 ? ROLE.focus : fl > 0.35 ? ROLE.fail : ROLE.caution;
        nodes.push(
          rect(Math.max(8, wVis), 56, { fill: barCol, stroke: '#ffffff', width: 1.5, radius: 8 })
            .at(xArr + wVis * 0.5, rY)
            .glow(10, barCol)
            .opacity(0.9),
          txt(`FINISH ${clock(shownFinMin)}`, xCurFin, rY + 135, 28, barCol, 'mono', 'center')
            .glow(8, barCol)
            .opacity(fn),
        );
      }

      // Bottom prediction prompt / failure / repaired finale!
      if (fn < 0.05) {
        nodes.push(
          txt(
            inp > 0.3
              ? 'What time would you finish, and can we recommend this bus?'
              : 'Bus at 15:20 · 25m ride · 90m visit...',
            0,
            325,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (ps > 0.35) {
        nodes.push(
          txt(
            mg > 0.35
              ? 'PASS! LEAVE 16:55  ·  TAKE 15:20 BUS  ·  5 MIN TO SPARE'
              : 'TRIMMED 20 MIN -> 16:55 PASSES BOTH TIME LIMITS',
            0,
            325,
            30,
            ROLE.ok,
            'mono',
            'center',
          ).glow(9, ROLE.ok),
        );
      } else if (tr > 0.45) {
        nodes.push(
          txt(
            'REVISED 70 MIN VISIT  ·  NEW FINISH: 16:55 (CHECKING LIMITS...)',
            0,
            325,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).glow(8, ROLE.focus),
        );
      } else if (of > 0.35) {
        nodes.push(
          txt(
            'USER ALLOWS 70 MIN VISIT  ·  SHORTENING 90 MIN BAR FROM 17:15',
            0,
            325,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).glow(7, ROLE.focus),
        );
      } else if (fl > 0.35) {
        nodes.push(
          txt(
            '17:15 MISSES 17:00 DEADLINE BY 15 MIN  ·  DO NOT RECOMMEND (KEEP HOURS + TIMETABLE)',
            0,
            325,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).glow(8, ROLE.fail),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('fresh-bus', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('fresh-bus').start, 0.25) }));
  });
  c.on('fresh-inputs', () => {
    s.play(inputsOn.to(1, { duration: clampDur(c, c.cue('fresh-inputs').start, 0.3) }));
  });
  c.on('fresh-question', () => {
    s.play(inputsOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.on('fresh-arrival', () => {
    s.play(arrReveal.to(1, { duration: clampDur(c, c.cue('fresh-arrival').start, 0.35) }));
  });
  c.after('fresh-finish', () => {
    s.play(finReveal.to(1, { duration: clampDur(c, c.cue('fresh-finish').end, 0.35) }));
  });
  c.after('fresh-failed', () => {
    s.play(failReveal.to(1, { duration: clampDur(c, c.cue('fresh-failed').end, 0.35) }));
  });
  c.on('fresh-short', () => {
    s.play(offerOn.to(1, { duration: clampDur(c, c.cue('fresh-short').start, 0.3) }));
  });
  c.on('fresh-trim', () => {
    s.play(trimSlide.to(1, { duration: clampDur(c, c.cue('fresh-trim').start, 0.5) }));
  });
  c.after('fresh-repaired', () => {
    s.play(trimSlide.to(1, { duration: 0.12 }));
  });
  c.after('fresh-repair-pass', () => {
    s.play(passReveal.to(1, { duration: clampDur(c, c.cue('fresh-repair-pass').end, 0.35) }));
  });
  c.on('fresh-margin', () => {
    s.play(marginOn.to(1, { duration: clampDur(c, c.cue('fresh-margin').start, 0.35) }));
  });
}
