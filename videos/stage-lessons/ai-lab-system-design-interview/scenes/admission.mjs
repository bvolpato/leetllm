// Scene 02: admission - When does R-104 stop waiting?
// Serial queue A (10k) + B (10k) + R-104 (5k) at 125k tok/s: wait freezes at 160ms, completes at 200ms,
// then compares with 50k backlog (400ms -> 503) and exhausted caller quota (429 even with idle worker).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LIGHT_ADM,
  OPEN_ADM,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function admission(s, c) {
  const phase = s.value(0);
  const waitStop = s.value(0); // 160ms wait frozen
  const ownDone = s.value(0); // 200ms finished + blocks free
  const compare50 = s.value(0); // 50k backlog -> 400ms
  const verdict503 = s.value(0); // STRICT after admission-verdict!
  const quota429 = s.value(0); // STRICT after admission-quota-response!

  const header = cinemaHeader('QUEUE CLOCK & OWNERS', 'When does R-104', 'stop waiting?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ws = waitStop.value;
      const od = ownDone.value;
      const c50 = compare50.value;
      const v503 = verdict503.value;
      const q429 = quota429.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 440 ms across x = [-760 .. +760]
      const x0 = -760;
      const x1 = 760;
      const mapMs = (ms) => x0 + (ms / 440) * (x1 - x0);
      const yTop = -85;
      const yMid = 55;
      const x250 = mapMs(250);

      // Row 1: R-104 in lighter queue (A=80ms, B=80ms -> wait=160ms, R-104 service=40ms -> done=200ms)
      const x80 = mapMs(80);
      const x160 = mapMs(160);
      const x200 = mapMs(200);
      nodes.push(
        txt(
          'LIGHT QUEUE: A (10k) + B (10k) + R-104 (5k)',
          x0,
          yTop - 68,
          26,
          ROLE.req,
          'mono',
          'left',
        ),
        rect(x80 - x0 - 4, 46, { fill: ROLE.worker, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + x80) * 0.5, yTop)
          .opacity(0.85),
        txt('A: 80ms', (x0 + x80) * 0.5, yTop, 26, '#070910', 'mono', 'center'),
        rect(x160 - x80 - 4, 46, { fill: ROLE.worker, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x80 + x160) * 0.5, yTop)
          .opacity(0.85),
        txt('B: 80ms', (x80 + x160) * 0.5, yTop, 26, '#070910', 'mono', 'center'),
        rect(x200 - x160 - 4, 46, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x160 + x200) * 0.5, yTop)
          .glow(od > 0.4 ? 9 : 4, ROLE.ok)
          .opacity(0.45 + ws * 0.5),
        txt('R-104', (x160 + x200) * 0.5, yTop, 26, '#070910', 'mono', 'center'),
      );

      if (ws > 0.35) {
        nodes.push(
          txt(
            od > 0.4
              ? `WAIT = ${Math.round(LIGHT_ADM.estimatedWait * 1000)} ms  |  DONE = 200 ms  |  2 KV BLOCKS FREED`
              : `WAIT FREEZES AT 160 ms WHEN WORKER PICKS UP R-104`,
            x200 + 24,
            yTop,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
        );
      }

      // Row 2: Opening 50k backlog -> 400 ms (> 250 ms limit -> 503!)
      const x400 = mapMs(400);
      if (c50 > 0.15) {
        const w400 = x400 - x0;
        nodes.push(
          txt(
            'OPENING BACKLOG: 50,000 TOKENS AHEAD',
            x0,
            yMid - 58,
            26,
            ROLE.fail,
            'mono',
            'left',
          ).opacity(c50),
          rect(w400, 44, { fill: ROLE.fail, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(x0 + w400 * 0.5, yMid)
            .glow(8, ROLE.fail)
            .opacity(c50 * 0.88),
          txt(
            v503 > 0.4
              ? `WAIT ${Math.round(OPEN_ADM.estimatedWait * 1000)} ms > 250 ms -> HTTP 503 OVERLOAD`
              : 'WAIT = 400 ms',
            x0 + w400 * 0.5,
            yMid,
            26,
            '#070910',
            'mono',
            'center',
          ).opacity(c50),
        );
      }

      // Shared 250 ms budget limit marker cleanly on axis (never crosses row bars or labels)
      const axisY = 148;
      nodes.push(
        line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 4 }),
        line([x250, axisY - 46], [x250, axisY - 8], {
          stroke: ROLE.focus,
          width: 4,
        }).glow(8, ROLE.focus),
        txt('250 ms LIMIT', x250, axisY + 84, 26, ROLE.focus, 'mono', 'center'),
      );
      for (const t of [0, 80, 160, 200, 250, 400]) {
        const tx = mapMs(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#5c74a8', width: 2 }),
          txt(
            `${t}`,
            tx,
            axisY + 42,
            26,
            t === 160 ? ROLE.ok : t === 400 ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Top-right rule
      nodes.push(
        txt('TWO DISTINCT OWNERS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('429 -> caller quota exhausted', 480, -378, 26, ROLE.warn, 'mono', 'center'),
        txt('503 -> shared capacity overload', 480, -334, 26, ROLE.fail, 'mono', 'center'),
      );

      // Bottom prediction prompt / 429 vs 503 contrast
      const botY = 295;
      if (q429 > 0.35) {
        nodes.push(
          txt(
            'EXHAUSTED CALLER QUOTA -> HTTP 429 EVEN WITH AN IDLE WORKER (STOPS BEFORE QUEUE)',
            0,
            botY,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).glow(8, ROLE.warn),
          txt(
            'Same client action reached two different owners: 429 (quota) vs 503 (shared backlog)',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (ws < 0.35) {
        nodes.push(
          txt(
            'Which event should stop R-104’s queue wait clock?',
            0,
            botY,
            34,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Queue wait stops when service STARTS (160 ms), not when response finishes (200 ms)',
            0,
            botY,
            26,
            ROLE.ok,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('admission-wait-stops', () => {
    s.play(waitStop.to(1, { duration: clampDur(c, c.cue('admission-wait-stops').end, 0.35) }));
  });
  c.on('admission-free', () => {
    s.play(ownDone.to(1, { duration: clampDur(c, c.cue('admission-free').start, 0.35) }));
  });
  c.on('admission-compare', () => {
    s.play(compare50.to(1, { duration: clampDur(c, c.cue('admission-compare').start, 0.45) }));
  });
  c.after('admission-verdict', () => {
    s.play(verdict503.to(1, { duration: clampDur(c, c.cue('admission-verdict').end, 0.35) }));
  });
  c.after('admission-quota-response', () => {
    s.play(quota429.to(1, { duration: clampDur(c, c.cue('admission-quota-response').end, 0.35) }));
  });
}
