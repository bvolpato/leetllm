// Scene 06: echo-loop - Why does the hotline hear itself?
// Dual acoustic signal lanes: Speaker plays two notes -> 0.3s delayed quieter acoustic bounce
// enters the microphone -> browser AEC + speakerphone vs headphone test attenuates feedback.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  quadArcPts,
  txt,
  voiceNode,
  waveformRibbon,
} from '../parts.mjs';

export default function echoLoop(s, c) {
  const phase = s.value(0);
  const bounceOn = s.value(0);
  const delayOn = s.value(0);
  const aecOn = s.value(0);

  const header = cinemaHeader('ACOUSTIC ECHO FEEDBACK', 'Why does the hotline', 'hear itself?', {
    x: -860,
    y: -445,
    accent: ROLE.echo,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#5ce1e616');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const bnc = bounceOn.value;
      const dly = delayOn.value;
      const aec = aecOn.value;
      const nodes = [];

      // Left: Speaker orb -> Top waveform (Original 2 notes)
      const spkPt = [-580, -90];
      const micPt = [-580, 175];

      const nSpk = voiceNode(spkPt[0], spkPt[1], 'SPEAKER', ROLE.audio, {
        radius: 78,
        sub: 'outbound reply',
      });
      const nMic = voiceNode(micPt[0], micPt[1], 'MIC', aec > 0.5 ? ROLE.ok : ROLE.echo, {
        radius: 78,
        sub: aec > 0.5 ? 'AEC cancels echo' : 'captures room bounce',
      });

      // Acoustic room bounce arc cleanly to the right of Speaker/Mic sub labels
      const bounceX = spkPt[0] + nSpk.r + 58;
      const bounceArc = quadArcPts([bounceX, spkPt[1]], [bounceX, micPt[1]], 0, 24);
      if (aec > 0.5) {
        nodes.push(
          line([bounceX, spkPt[1]], [bounceX, micPt[1]], {
            stroke: ROLE.ok,
            width: 3,
            dash: [10, 10],
          }).opacity(0.6),
        );
      } else {
        nodes.push(
          beamWithPhotons(bounceArc, ROLE.echo, p * 1.3, {
            width: 3.8,
            photonCount: 2,
            alpha: 0.4 + bnc * 0.6,
          }),
        );
      }

      // Top waveform oscilloscope (Speaker: 2 strong notes at t=0..0.3s)
      const x0 = -280;
      const x1 = 760;
      nodes.push(
        txt('SPEAKER OUTPUT (TWO NOTES)', x0, -165, 26, ROLE.audio, 'mono', 'left'),
        line([x0, -90], [x1, -90], { stroke: '#2c3d66', width: 2 }),
        waveformRibbon(x0 + 20, x0 + 360, -90, 44, p * 2.4, { color: ROLE.audio, freq: 4.5 }),
        line([x0 + 360, -90], [x1, -90], { stroke: ROLE.audio, width: 2.5 }).opacity(0.45),
      );

      // Bottom waveform oscilloscope (Microphone: quieter pair delayed by +0.3 s!)
      const echoAmp = aec > 0.5 ? 5 : 26;
      const echoCol = aec > 0.5 ? ROLE.ok : ROLE.echo;
      nodes.push(
        txt(
          aec > 0.5 ? 'MIC INPUT AFTER BROWSER AEC (CLEAN)' : 'MIC INPUT (+0.3 s DELAYED ECHO)',
          x0,
          100,
          26,
          echoCol,
          'mono',
          'left',
        ),
        line([x0, 175], [x1, 175], { stroke: '#2c3d66', width: 2 }),
        waveformRibbon(x0 + 320, x0 + 660, 175, echoAmp, p * 2.4 - 0.6, {
          color: echoCol,
          freq: 4.5,
          opacity: 0.4 + bnc * 0.6,
        }),
      );

      // +0.3 s delay bracket between waveforms
      if (dly > 0.2) {
        nodes.push(
          line([x0 + 20, -24], [x0 + 320, -24], { stroke: ROLE.focus, width: 3.5 })
            .glow(8, ROLE.focus)
            .opacity(dly),
          txt('+0.3 s ROOM ECHO DELAY', x0 + 170, 20, 26, ROLE.focus, 'mono', 'center').opacity(
            dly,
          ),
        );
      }

      nodes.push(nSpk.node, nMic.node);

      // Top-right rule readout
      nodes.push(
        txt('SELF-INTERRUPTION HAZARD', 480, -425, 26, ROLE.cut, 'mono', 'center'),
        txt(
          aec > 0.5 ? 'test speakerphone vs headphones' : 'VAD hears own reply -> false mute!',
          480,
          -378,
          26,
          aec > 0.5 ? ROLE.ok : COSMOS.ink,
          'mono',
          'center',
        ),
      );

      // Bottom guidance
      nodes.push(
        txt(
          aec > 0.5
            ? 'Request browser echoCancellation · measure residual leak at mic'
            : 'Speaker audio leaks back into microphone 300 ms later',
          0,
          365,
          28,
          aec > 0.5 ? ROLE.ok : ROLE.echo,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: echoCol,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('va-echo-loop-0-1', () => {
    s.play(bounceOn.to(1, { duration: clampDur(c, c.cue('va-echo-loop-0-1').start, 0.4) }));
  });
  c.on('va-echo-loop-1-1', () => {
    s.play(delayOn.to(1, { duration: clampDur(c, c.cue('va-echo-loop-1-1').start, 0.4) }));
  });
  c.on('va-echo-loop-2-0', () => {
    s.play(aecOn.to(1, { duration: clampDur(c, c.cue('va-echo-loop-2-0').start, 0.45) }));
  });
}
