// Scene 17: critical-path - Which read holds up the decision?
// Living animated Gantt timeline: 3 workers run Health (150ms), CI (200ms), Diff (350ms)
// in parallel after 120ms Plan (prediction pause!) -> Diff dictates 520ms parallel finish ->
// Bars smoothly slide end-to-end onto 1 worker (870ms serial) -> Dropping Health shrinks
// serial to 720ms while parallel stays locked at 520ms!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  CRITICAL_PATH,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function criticalPath(s, c) {
  const pulse = s.value(0);
  const readsOn = s.value(0);
  const diffHi = s.value(0);
  const joinOn = s.value(0);
  const parTotalOn = s.value(0);
  const serialSlide = s.value(0); // 0 = parallel (3 workers), 1 = serial (1 worker)
  const serTotalOn = s.value(0);
  const dropHealth = s.value(0); // 0 -> 1 fades out health bar & shifts CI/Diff left in serial
  const twoParOn = s.value(0);

  const header = cinemaHeader('PARALLEL CRITICAL PATH', 'Which read holds up', 'the decision?', {
    accent: ROLE.focus,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const ro = readsOn.value;
      const dh = diffHi.value;
      const jn = joinOn.value;
      const pt = parTotalOn.value;
      const ss = serialSlide.value;
      const st = serTotalOn.value;
      const dr = dropHealth.value;
      const tp = twoParOn.value;
      const nodes = [];

      // Time axis: 0..920 ms mapped to x in [-760..+760]
      const x0 = -760;
      const x1 = 760;
      const scale = (x1 - x0) / 920;
      const mx = (ms) => x0 + ms * scale;
      const laneYs = [-140, -30, 80, 190];

      // Axis ticks
      const axisY = 265;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 2.4 }));
      for (const t of [0, 120, 350, 520, 720, 870]) {
        const tx = mx(t);
        nodes.push(
          line([tx, -195], [tx, axisY], { stroke: '#1d2846', width: 1.5, dash: [4, 6] }),
          txt(`${t}ms`, tx, axisY + 34, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      // Interpolate start times between parallel (ss=0) and serial (ss=1)
      const healthDur = CRITICAL_PATH.health * (1 - dr);
      const planStart = 0;
      const healthStart = CRITICAL_PATH.plan;
      const ciStart = CRITICAL_PATH.plan + ss * healthDur;
      const diffStart = CRITICAL_PATH.plan + ss * (healthDur + CRITICAL_PATH.ci);
      const joinStart =
        CRITICAL_PATH.plan +
        (1 - ss) * CRITICAL_PATH.diff +
        ss * (healthDur + CRITICAL_PATH.ci + CRITICAL_PATH.diff);

      const bar = (startMs, durMs, y, col, label, alpha = 1, glow = 7) => {
        if (durMs < 2 || alpha < 0.05) return;
        const w = durMs * scale;
        const cx = mx(startMs) + w * 0.5;
        const b = rect(w, 56, { fill: col, stroke: '#ffffff', width: 1.5, radius: 8 })
          .at(cx, y)
          .opacity(0.88 * alpha);
        if (glow > 0) b.glow(glow, col);
        nodes.push(b, txt(label, cx, y, 26, '#070910', 'mono', 'center').opacity(alpha));
      };

      // Plan (120ms)
      bar(planStart, CRITICAL_PATH.plan, laneYs[0], ROLE.plan, 'PLAN 120', 1, 7);

      // Health (150ms), CI (200ms), Diff (350ms)
      if (ro > 0.05) {
        if (1 - dr > 0.08) {
          bar(
            healthStart,
            CRITICAL_PATH.health,
            laneYs[1],
            ROLE.ok,
            'HEALTH 150',
            ro * (1 - dr),
            6,
          );
        }
        bar(ciStart, CRITICAL_PATH.ci, laneYs[2], ROLE.action, 'CI 200', ro, 6);
        bar(
          diffStart,
          CRITICAL_PATH.diff,
          laneYs[3],
          dh > 0.35 ? ROLE.focus : ROLE.policy,
          'DIFF 350ms',
          ro,
          dh > 0.35 ? 11 : 6,
        );
      }

      // Join (50ms)
      if (jn > 0.05) {
        bar(joinStart, CRITICAL_PATH.join, laneYs[0], ROLE.ok, '50', jn, 9);
      }

      // Status banner at bottom (y = 355)
      let status = 'Which of the 3 parallel reads keeps the decision waiting?';
      let sCol = ROLE.focus;
      if (tp > 0.35) {
        status = 'DROP HEALTH: SERIAL = 720ms (-150ms)  ·  3 WORKERS = STILL 520ms (DIFF CRITICAL)';
        sCol = ROLE.ok;
      } else if (dr > 0.35) {
        status = 'DROPPING HEALTH (150ms) SAVES TIME ONLY ON 1 WORKER -> 720ms';
        sCol = ROLE.action;
      } else if (st > 0.35) {
        status = `1 WORKER (SERIAL): 120 + 150 + 200 + 350 + 50 = ${CRITICAL_PATH.serial}ms`;
        sCol = ROLE.caution;
      } else if (pt > 0.35) {
        status = `3 WORKERS (PARALLEL): 120 + max(150, 200, 350) + 50 = ${CRITICAL_PATH.parallel}ms`;
        sCol = ROLE.ok;
      } else if (dh > 0.35) {
        status = 'DIFF (350ms) IS THE CRITICAL PATH -> DECISION WAITS FOR DIFF';
        sCol = ROLE.focus;
      }
      nodes.push(txt(status, 0, 358, 26, sCol, 'mono', 'center').glow(6, sCol));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('schedule-plan', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('schedule-plan').start, 0.25) }));
  });
  c.on('schedule-read', () => {
    s.play(readsOn.to(1, { duration: clampDur(c, c.cue('schedule-read').start, 0.4) }));
  });
  // Strict prediction withholding!
  c.after('schedule-diff', () => {
    s.play(diffHi.to(1, { duration: clampDur(c, c.cue('schedule-diff').end, 0.35) }));
  });
  c.on('schedule-join', () => {
    s.play(joinOn.to(1, { duration: clampDur(c, c.cue('schedule-join').start, 0.35) }));
  });
  c.after('schedule-parallel', () => {
    s.play(parTotalOn.to(1, { duration: clampDur(c, c.cue('schedule-parallel').end, 0.35) }));
  });
  c.on('schedule-serial-move', () => {
    s.play(serialSlide.to(1, { duration: clampDur(c, c.cue('schedule-serial-move').start, 0.85) }));
  });
  c.after('schedule-serial', () => {
    s.play(serTotalOn.to(1, { duration: clampDur(c, c.cue('schedule-serial').end, 0.35) }));
  });
  c.on('schedule-drop', () => {
    s.play(dropHealth.to(1, { duration: clampDur(c, c.cue('schedule-drop').start, 0.55) }));
  });
  c.on('schedule-two-read', () => {
    s.play(dropHealth.to(1, { duration: 0.12 }));
  });
  c.on('schedule-two-parallel', () => {
    const t = c.cue('schedule-two-parallel').start;
    s.play(serialSlide.to(0, { duration: clampDur(c, t, 0.75) }));
    s.play(twoParOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
