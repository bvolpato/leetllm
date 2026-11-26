// Scene 21: transport-and-buffer - Can packet three still play?
// 4 RTP packets on fixed arrival ruler (10, 28, 95, 73 ms) while jitter buffer slides 30 -> 60 ms
// -> STRICT prediction withholding before revealing P3 (arr 95 ms <= due 100 ms) plays with 5 ms spare!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SCHED_30,
  SCHED_60,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  packets,
  txt,
} from '../parts.mjs';

export default function transportAndBuffer(s, c) {
  const phase = s.value(0);
  const shortOn = s.value(0);
  const bufSlide = s.value(0); // 0 = 30 ms buffer, 1 = 60 ms buffer
  const absorbReveal = s.value(0); // STRICT after transport-absorb-p3!
  const shiftAllOn = s.value(0);
  const webrtcOn = s.value(0);

  const header = cinemaHeader('JITTER BUFFER DEADLINES', 'Can packet three', 'still play?', {
    x: -860,
    y: -445,
    accent: ROLE.media,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const bs = bufSlide.value;
      const ab = absorbReveal.value;
      const sa = shiftAllOn.value;
      const wr = webrtcOn.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 130 ms across x = [-560 .. +760]
      const x0 = -560;
      const x1 = 760;
      const mapMs = (ms) => x0 + (ms / 130) * (x1 - x0);
      const bufMs = 30 + bs * 30; // 30 -> 60

      const rowYs = [-140, -50, 40, 130];

      nodes.push(
        txt(`JITTER BUFFER: ${Math.round(bufMs)} ms`, -840, -215, 28, ROLE.focus, 'mono', 'left'),
        txt(
          'FIXED ARRIVAL (DOT) VS SLIDING DEADLINE (BAR)',
          100,
          -215,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      packets.forEach((pkt, idx) => {
        const y = rowYs[idx];
        const xArr = mapMs(pkt.arrival);
        const dueMs = pkt.timestamp + bufMs;
        const xDue = mapMs(dueMs);
        const isP3 = pkt.id === 3;

        // Withhold P3's new green "PLAY" status during prediction pause (when bs > 0.35 and ab < 0.35)!
        const late = pkt.arrival > dueMs;
        let statusTxt = late ? 'CONCEAL' : 'PLAY';
        let col = late ? ROLE.fail : ROLE.ok;
        if (isP3 && bs > 0.35 && ab < 0.35) {
          statusTxt = '?';
          col = ROLE.focus;
        }

        nodes.push(
          txt(
            `P${pkt.id} (ts ${pkt.timestamp})`,
            -840,
            y,
            26,
            isP3 ? ROLE.focus : COSMOS.ink,
            'mono',
            'left',
          ),
          line([x0, y], [x1, y], { stroke: '#223154', width: 2.5 }),
          // Sliding deadline marker
          line([xDue, y - 22], [xDue, y + 22], { stroke: ROLE.focus, width: 4 }).glow(
            7,
            ROLE.focus,
          ),
          // Fixed arrival dot
          glowDot(xArr, y, { radius: 8.5, color: col, glow: 10 }),
          txt(`${pkt.arrival}ms`, xArr, y - 34, 26, col, 'mono', 'center'),
          txt(statusTxt, x1 + 42, y, 26, col, 'mono', 'left'),
        );
      });

      // Axis ticks (0, 20, 40, 60, 80, 100, 120 ms)
      const axisY = 205;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 3 }));
      for (const t of [0, 20, 40, 60, 80, 100, 120]) {
        const tx = mapMs(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#4d6496', width: 2 }),
          txt(
            `${t}`,
            tx,
            axisY + 42,
            26,
            t === 70 || t === 100 ? ROLE.focus : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Top-right packet 3 math
      nodes.push(
        txt('PACKET 3 DEADLINE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          `30 ms buf -> due ${SCHED_30[2].deadline} ms (arr 95 -> conceal)`,
          480,
          -378,
          26,
          ROLE.fail,
          'mono',
          'center',
        ),
        txt(
          ab > 0.4
            ? `60 ms buf -> due ${SCHED_60[2].deadline} ms (arr 95 -> PLAY!)`
            : '60 ms buf -> due ? ms (arr 95)',
          480,
          -334,
          26,
          ab > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> trade-off reveal
      const botY = 335;
      if (wr > 0.4) {
        nodes.push(
          txt(
            'WebRTC adapts via RTP feedback & congestion control; WebSocket needs app framing',
            0,
            botY,
            26,
            ROLE.media,
            'mono',
            'center',
          ),
        );
      } else if (ab > 0.4) {
        nodes.push(
          txt(
            sa > 0.4
              ? 'P3 PLAYS (+5 ms SPARE), BUT EVERY PACKET GAINED +30 ms DELAY!'
              : '5 ms TO SPARE: P3 ARRIVED AT 95 ms <= 100 ms DEADLINE -> PLAYS!',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (bs > 0.35) {
        nodes.push(
          txt(
            'Buffer moved 30 -> 60 ms: is P3’s arrival before or after its new deadline?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'At 30 ms buffer, P3 (ts 40 + 30 = 70 ms) arrives late at 95 ms -> concealed',
            0,
            botY,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.media,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('transport-short', () => {
    s.play(shortOn.to(1, { duration: clampDur(c, c.cue('transport-short').start, 0.35) }));
  });
  c.on('transport-expand-buffer', () => {
    s.play(bufSlide.to(1, { duration: clampDur(c, c.cue('transport-expand-buffer').start, 0.55) }));
  });
  c.after('transport-absorb-p3', () => {
    s.play(absorbReveal.to(1, { duration: clampDur(c, c.cue('transport-absorb-p3').end, 0.4) }));
  });
  c.on('transport-shift-all', () => {
    s.play(shiftAllOn.to(1, { duration: clampDur(c, c.cue('transport-shift-all').start, 0.35) }));
  });
  c.on('transport-receiver-buffering', () => {
    s.play(
      webrtcOn.to(1, { duration: clampDur(c, c.cue('transport-receiver-buffering').start, 0.35) }),
    );
  });
}
