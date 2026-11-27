// Scene 22: deadline-transport - Recover bytes only while they can help playback
// Side-by-side race: WebRTC UDP + NetEQ conceals lost frame 2 & plays frames 3-4 on time vs
// TCP WebSocket Head-of-Line blocking stalling frames 3-4 behind missing frame 2!
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function deadlineTransport(s, c) {
  const neteqOn = s.value(0);
  const tcpOn = s.value(0);
  const edgeOn = s.value(0);

  const header = cinemaHeader(
    'DEADLINE-AWARE TRANSPORT',
    'Recover bytes only',
    'before the deadline',
    {
      x: -860,
      y: -445,
      accent: ROLE.media,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const nq = neteqOn.value;
      const tc = tcpOn.value;
      const ed = edgeOn.value;
      const nodes = [];

      const xs = [-420, -140, 140, 420];
      const bw = 220;

      // Top lane: WebRTC UDP + NetEQ (conceals lost F2, plays F3 & F4 on deadline!)
      const yUdp = -110;
      nodes.push(
        txt('WEBRTC UDP', -840, yUdp, 26, ROLE.ok, 'mono', 'left'),
        txt(
          nq > 0.4 ? 'NetEQ adapts delay & conceals lost F2' : 'RTP / RTCP deadline recovery',
          0,
          yUdp - 70,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
      );
      const udpSlots = [
        { label: 'F1 PLAY', col: ROLE.ok },
        { label: 'F2 CONCEAL', col: ROLE.warn },
        { label: 'F3 PLAY', col: ROLE.ok },
        { label: 'F4 PLAY', col: ROLE.ok },
      ];
      udpSlots.forEach((sl, i) => {
        nodes.push(
          rect(bw, 56, { fill: '#0b1428', stroke: sl.col, width: 3, radius: 8 })
            .at(xs[i], yUdp)
            .glow(7, sl.col),
          txt(sl.label, xs[i], yUdp, 26, sl.col, 'mono', 'center'),
        );
      });

      // Bottom lane: TCP WebSocket (Head-of-Line blocking!)
      const yTcp = 115;
      const tcAlpha = 0.4 + tc * 0.6;
      nodes.push(
        txt('TCP / WS', -840, yTcp, 26, ROLE.fail, 'mono', 'left').opacity(tcAlpha),
        txt(
          'ORDERED BYTES STALL BEHIND LOST F2 (HEAD-OF-LINE BLOCKING)',
          0,
          yTcp - 70,
          26,
          ROLE.fail,
          'mono',
          'center',
        ).opacity(tcAlpha),
      );
      const tcpSlots = [
        { label: 'F1 PLAY', col: ROLE.ok },
        { label: 'F2 LOST...', col: ROLE.fail },
        { label: 'F3 STALLED', col: ROLE.fail },
        { label: 'F4 STALLED', col: ROLE.fail },
      ];
      tcpSlots.forEach((sl, i) => {
        nodes.push(
          rect(bw, 56, { fill: '#0b1428', stroke: sl.col, width: 3, radius: 8 })
            .at(xs[i], yTcp)
            .glow(i >= 1 ? 8 : 4, sl.col)
            .opacity(tcAlpha),
          txt(sl.label, xs[i], yTcp, 26, sl.col, 'mono', 'center').opacity(tcAlpha),
        );
      });

      // Top-right negotiated-path caveat
      nodes.push(
        txt('INSPECT NEGOTIATED PATH', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('WebRTC may fall back to TURN/TCP', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('WebSocket over HTTP/3 also exists', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      // Bottom edge architecture guidance
      nodes.push(
        line([-840, 245], [840, 245], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          ed > 0.4
            ? 'Browser/Mobile: WebRTC edge -> PCM to model  |  Phone: SIP  |  Server: WS + backpressure'
            : 'Measure real packet loss, concealment, buffer depth & first playout per path',
          0,
          318,
          26,
          ed > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-deadline-transport-0-2', () => {
    s.play(
      neteqOn.to(1, { duration: clampDur(c, c.cue('va-deadline-transport-0-2').start, 0.35) }),
    );
  });
  c.on('va-deadline-transport-1-0', () => {
    s.play(tcpOn.to(1, { duration: clampDur(c, c.cue('va-deadline-transport-1-0').start, 0.4) }));
  });
  c.on('va-deadline-transport-2-0', () => {
    s.play(edgeOn.to(1, { duration: clampDur(c, c.cue('va-deadline-transport-2-0').start, 0.4) }));
  });
}
