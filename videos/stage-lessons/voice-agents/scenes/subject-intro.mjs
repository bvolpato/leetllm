// Scene 01: subject-intro - How much of the reply played?
// Full-duplex incident hotline wave: Alex cuts in ("Wait, page the owner") while the phone
// has received the full reply -> prediction pause before revealing playback receipt!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  chunks,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  interrupt,
  txt,
  voiceNode,
  waveformRibbon,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const cutOn = s.value(0);
  const delivOn = s.value(0);
  const askOn = s.value(0);
  const receiptOn = s.value(0);

  const header = cinemaHeader('REAL-TIME VOICE AGENT', 'How much of the', 'reply played?', {
    x: -860,
    y: -445,
    accent: ROLE.audio,
    size: 48,
  });

  const bgAura = aura(60, 20, 680, '#5ce1e61c', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const cut = cutOn.value;
      const dlv = delivOn.value;
      const ask = askOn.value;
      const rcp = receiptOn.value;
      const nodes = [];

      // Left: Alex's Phone Speaker & Microphone orb
      const phoneX = -560;
      const phoneY = 30;
      const phoneCol = cut > 0.5 ? ROLE.cut : ROLE.audio;
      const phoneNode = voiceNode(phoneX, phoneY, cut > 0.5 ? 'MUTED' : 'PHONE', phoneCol, {
        radius: 82,
        sub: cut > 0.5 ? 'Alex: "Wait, page the owner."' : 'Playing incident update',
        size: 28,
      });
      nodes.push(phoneNode.node);

      // Animated audio waveform between Phone and Reply Strip
      const waveAmp = cut > 0.5 ? 6 : 36;
      nodes.push(
        waveformRibbon(-440, -145, phoneY, waveAmp, p * 2.2, {
          color: phoneCol,
          freq: 4.5,
          opacity: cut > 0.5 ? 0.45 : 0.92,
        }),
      );

      // Right: 4-chunk reply audio strip (all 4 received by phone!)
      const rx0 = -100;
      const rx1 = 830;
      const stripY = -20;
      const totalMs = chunks[chunks.length - 1].endMs; // 1120 ms
      const mapMs = (ms) => rx0 + (ms / totalMs) * (rx1 - rx0);

      nodes.push(
        txt(
          dlv > 0.5 ? 'FULL REPLY DELIVERED TO PHONE (0 .. 1,120 ms)' : 'HOTLINE REPLY STREAM',
          (rx0 + rx1) * 0.5,
          stripY - 96,
          26,
          ROLE.audio,
          'mono',
          'center',
        ),
        line([rx0, stripY], [rx1, stripY], { stroke: '#2c3d66', width: 6 }),
      );

      let prevMs = 0;
      const shortLabels = ['Incident is', 'open', 'because DB', 'still running.'];
      chunks.forEach((ch, idx) => {
        const xA = mapMs(prevMs);
        const xB = mapMs(ch.endMs);
        const isPlayedKnown = rcp > 0.5 && ch.endMs <= interrupt.acknowledgedThrough;
        const col = rcp > 0.5 ? (isPlayedKnown ? ROLE.ok : COSMOS.dim) : ROLE.audio;
        nodes.push(
          line([xA + 4, stripY], [xB - 4, stripY], { stroke: col, width: 10 }).glow(
            isPlayedKnown ? 10 : 5,
            col,
          ),
          line([xB, stripY - 22], [xB, stripY + 22], { stroke: '#94a3b8', width: 2 }),
          txt(
            shortLabels[idx],
            (xA + xB) * 0.5,
            stripY + (idx % 2 === 0 ? -42 : 48),
            26,
            col,
            'mono',
            'center',
          ),
        );
        prevMs = ch.endMs;
      });

      // Cut-in vertical beam at 650 ms when Alex interrupts (starts below top chunk label)
      if (cut > 0.1) {
        const xCut = mapMs(interrupt.replyElapsedMs);
        nodes.push(
          line([xCut, stripY - 18], [xCut, stripY + 125], {
            stroke: ROLE.cut,
            width: 4,
            dash: [10, 8],
          })
            .glow(10, ROLE.cut)
            .opacity(cut),
          txt('ALEX CUTS IN', xCut, stripY + 158, 26, ROLE.cut, 'mono', 'center').opacity(cut),
        );
      }

      // Top-right status readout
      nodes.push(
        txt('AUDIO RECEIVED != AUDIO HEARD', 460, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          rcp > 0.5 ? 'ASK PLAYER FOR PLAYBACK RECEIPT' : 'WHOLE REPLY SITS IN PHONE BUFFER',
          460,
          -378,
          26,
          rcp > 0.5 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> receipt reveal (strict withholding!)
      const botY = 315;
      if (rcp > 0.35) {
        const arc = [
          [phoneX + phoneNode.r + 18, phoneY + 35],
          [0, botY - 46],
        ];
        nodes.push(
          beamWithPhotons(arc, ROLE.ok, 0, { width: 3.6 }),
          txt(
            'PLAYER RECEIPT CONFIRMS WHICH COMPLETE PIECES PLAYED',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'Rewind to speech end and trace every millisecond to the speaker',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            ask > 0.35
              ? 'Can the hotline count "still running" as spoken?'
              : 'Hotline explaining why the incident is still open...',
            0,
            botY,
            34,
            ask > 0.35 ? ROLE.focus : COSMOS.muted,
            'serif',
            'center',
          ).glow(ask > 0.35 ? 6 : 0, ROLE.focus),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('intro-speaking', () => {
    s.play(phase.to(0.3, { duration: clampDur(c, c.cue('intro-speaking').start, 0.25) }));
  });
  c.on('intro-interrupt', () => {
    s.play(cutOn.to(1, { duration: clampDur(c, c.cue('intro-interrupt').start, 0.4) }));
  });
  c.on('intro-delivery', () => {
    s.play(delivOn.to(1, { duration: clampDur(c, c.cue('intro-delivery').start, 0.35) }));
  });
  c.on('intro-ask', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('intro-ask').start, 0.35) }));
  });
  c.after('intro-missing', () => {
    s.play(receiptOn.to(1, { duration: clampDur(c, c.cue('intro-missing').end, 0.45) }));
  });
}
