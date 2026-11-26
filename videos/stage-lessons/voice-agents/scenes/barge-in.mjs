// Scene 13: barge-in - Where should this reply stop?
// 4-chunk factual reply (240 / 520 / 860 / 1120 ms), client playback receipts at 240 & 520 ms,
// Alex interrupts at 650 ms -> STRICT prediction withholding before revealing "Incident is open"!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  chunks,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  interrupt,
  txt,
} from '../parts.mjs';

export default function bargeIn(s, c) {
  const phase = s.value(0);
  const ack1 = s.value(0); // 240 ms
  const ack2 = s.value(0); // 520 ms
  const cutOn = s.value(0); // 650 ms
  const keepReveal = s.value(0); // STRICT after barge-keep!
  const freezeOn = s.value(0);

  const header = cinemaHeader('BARGE-IN RECONCILIATION', 'Where should this', 'reply stop?', {
    x: -860,
    y: -445,
    accent: ROLE.cut,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#f43f5e18', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const a1 = ack1.value;
      const a2 = ack2.value;
      const cut = cutOn.value;
      const kp = keepReveal.value;
      const frz = freezeOn.value;
      const nodes = [];

      // Reply clock: 0 .. 1120 ms across x = [-780 .. +780]
      const x0 = -780;
      const x1 = 780;
      const totalMs = chunks[chunks.length - 1].endMs; // 1120
      const mapT = (t) => x0 + (t / totalMs) * (x1 - x0);
      const stripY = -80;

      nodes.push(
        txt(
          'PHONE RECEIVED AUDIO STRIP (reply-1 · 0 .. 1,120 ms)',
          x0,
          stripY - 76,
          26,
          ROLE.audio,
          'mono',
          'left',
        ),
      );

      let prevMs = 0;
      const labels = ['Incident is', 'open', 'because the database', 'failover is still running.'];
      chunks.forEach((ch, idx) => {
        const xa = mapT(prevMs);
        const xb = mapT(ch.endMs);
        const w = xb - xa - 8;
        const confirmed = idx === 0 ? a1 > 0.5 : idx === 1 ? a2 > 0.5 : false;
        const kept = kp > 0.5 && ch.endMs <= interrupt.acknowledgedThrough;
        const dropped = kp > 0.5 && ch.endMs > interrupt.acknowledgedThrough;
        const col = kept ? ROLE.ok : dropped ? COSMOS.dim : confirmed ? ROLE.ok : ROLE.audio;

        nodes.push(
          rect(w, 56, { fill: '#0b1428', stroke: col, width: kept ? 3.5 : 2.5, radius: 8 })
            .at(xa + 4 + w * 0.5, stripY)
            .glow(kept ? 9 : 0, col)
            .opacity(dropped ? 0.45 : 0.95),
          txt(
            idx === 3 ? 'failover running.' : labels[idx],
            xa + 4 + w * 0.5,
            stripY,
            26,
            col,
            'mono',
            'center',
          ).opacity(dropped ? 0.5 : 1),
          txt(`${ch.endMs} ms`, xb, stripY + 52, 26, COSMOS.dim, 'mono', 'center'),
        );
        prevMs = ch.endMs;
      });

      // Player receipt track below strip
      const rcpY = 75;
      const curMs = a2 > 0.5 ? 520 : a1 > 0.5 ? 240 : 0;
      const xAck = mapT(curMs);
      nodes.push(
        txt('PLAYER RECEIPT CURSOR', x0, rcpY - 46, 26, ROLE.ok, 'mono', 'left'),
        line([x0, rcpY], [x1, rcpY], { stroke: '#2c3d66', width: 4 }),
      );
      if (curMs > 0) {
        nodes.push(
          line([x0, rcpY], [xAck, rcpY], { stroke: ROLE.ok, width: 8 }).glow(9, ROLE.ok),
          txt(
            frz > 0.4 ? `FROZEN RECEIPT: ${curMs} ms` : `LAST RECEIPT: ${curMs} ms`,
            xAck,
            rcpY + 46,
            26,
            ROLE.ok,
            'mono',
            'center',
          ),
        );
      }

      // Interruption marker at 650 ms (segmented around chunk text strip so stroke never crosses text!)
      if (cut > 0.1) {
        const xCut = mapT(interrupt.replyElapsedMs);
        nodes.push(
          line([xCut, stripY + 36], [xCut, rcpY + 18], {
            stroke: ROLE.cut,
            width: 4,
            dash: [10, 8],
          })
            .glow(10, ROLE.cut)
            .opacity(cut),
          txt('CUT IN 650 ms', xCut + 16, rcpY - 46, 26, ROLE.cut, 'mono', 'left').opacity(cut),
        );
      }

      // Top-right invariant guard
      nodes.push(
        txt('RECEIPT ACCEPTANCE RULE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('same session + reply ID', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('monotonic cursor <= received audio', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Bottom prediction prompt -> STRICT withholding before barge-keep!
      const botY = 285;
      if (frz > 0.4) {
        nodes.push(
          txt(
            'LOCAL MUTE + CLEAR QUEUE + CANCEL SERVER + FREEZE 520 ms RECEIPT',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (kp > 0.4) {
        nodes.push(
          txt(
            `HISTORY KEEPS: "${interrupt.retained}"  (860 ms chunk UNCONFIRMED)`,
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'Explanation stays out of conversation history for the next turn',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (cut > 0.35) {
        nodes.push(
          txt(
            'Receipt = 520 ms, cut-in = 650 ms. Which words enter the next turn?',
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
            'Clock starts at 0 when factual reply begins playing on Alex’s phone',
            0,
            botY,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.cut,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('barge-first-ack', () => {
    s.play(ack1.to(1, { duration: clampDur(c, c.cue('barge-first-ack').start, 0.35) }));
  });
  c.on('barge-second-ack', () => {
    s.play(ack2.to(1, { duration: clampDur(c, c.cue('barge-second-ack').start, 0.35) }));
  });
  c.on('barge-stop', () => {
    s.play(cutOn.to(1, { duration: clampDur(c, c.cue('barge-stop').start, 0.35) }));
  });
  c.after('barge-keep', () => {
    s.play(keepReveal.to(1, { duration: clampDur(c, c.cue('barge-keep').end, 0.4) }));
  });
  c.on('barge-freeze', () => {
    s.play(freezeOn.to(1, { duration: clampDur(c, c.cue('barge-freeze').start, 0.4) }));
  });
}
