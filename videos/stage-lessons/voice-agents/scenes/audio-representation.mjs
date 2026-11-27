// Scene 20: audio-representation - Keep model positions distinct from waveform packets
// 4-tier speech stack: 2s waveform -> 50 AudioPaLM w2v-BERT semantic positions (25 Hz) ->
// SoundStream acoustic codec tokens -> decoded playback waveform (NOT current API billing!).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  trimSeg,
  txt,
  voiceNode,
  waveformRibbon,
} from '../parts.mjs';

export default function audioRepresentation(s, c) {
  const phase = s.value(0);
  const semOn = s.value(0);
  const codecOn = s.value(0);
  const billingOn = s.value(0);

  const header = cinemaHeader(
    'SPEECH REPRESENTATION LAYERS',
    'Keep model positions',
    'distinct from packets',
    {
      x: -860,
      y: -445,
      accent: ROLE.native,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sm = semOn.value;
      const cd = codecOn.value;
      const bl = billingOn.value;
      const nodes = [];

      // Top animated 2-second waveform ribbon
      nodes.push(
        txt('2-SECOND SPEECH WAVEFORM', -820, -195, 26, ROLE.audio, 'mono', 'left'),
        waveformRibbon(-820, 820, -125, 34, p * 2.0, { color: ROLE.audio, freq: 8 }),
      );

      // 4 distinct objects in the speech representation pipeline
      const yMid = 85;
      const pts = [
        [-615, yMid],
        [-205, yMid],
        [205, yMid],
        [615, yMid],
      ];

      const n1 = voiceNode(pts[0][0], pts[0][1], 'SAMPLES', ROLE.audio, {
        radius: 74,
        sub: 'waveform PCM',
      });
      const n2 = voiceNode(pts[1][0], pts[1][1], '50 POS', ROLE.focus, {
        radius: 74,
        sub: '25 Hz w2v-BERT',
        opacity: 0.4 + sm * 0.6,
      });
      const n3 = voiceNode(pts[2][0], pts[2][1], 'CODEC', ROLE.native, {
        radius: 74,
        sub: 'SoundStream tokens',
        opacity: 0.35 + cd * 0.65,
      });
      const n4 = voiceNode(pts[3][0], pts[3][1], 'PLAYOUT', ROLE.ok, {
        radius: 74,
        sub: 'decoded speaker',
        opacity: 0.35 + cd * 0.65,
      });

      const [e1a, e1b] = trimSeg(pts[0], pts[1], n1.r + 14, n2.r + 14);
      const [e2a, e2b] = trimSeg(pts[1], pts[2], n2.r + 14, n3.r + 14);
      const [e3a, e3b] = trimSeg(pts[2], pts[3], n3.r + 14, n4.r + 14);

      nodes.push(
        beamWithPhotons([e1a, e1b], ROLE.focus, 0, {
          width: 3.6,
          alpha: 0.4 + sm * 0.6,
        }),
        beamWithPhotons([e2a, e2b], ROLE.native, 0, {
          width: 3.6,
          alpha: 0.35 + cd * 0.65,
        }),
        beamWithPhotons([e3a, e3b], ROLE.ok, 0, {
          width: 3.6,
          alpha: 0.35 + cd * 0.65,
        }),
        n1.node,
        n2.node,
        n3.node,
        n4.node,
      );

      // Top-right historical scope note
      nodes.push(
        txt('AUDIOPALM 25 Hz EXAMPLE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('2 sec * 25 Hz = 50 semantic positions', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt(
          bl > 0.4
            ? 'NOT PCM chunks · NOT an API billing rule!'
            : 'Distinct from network RTP packets',
          480,
          -334,
          26,
          bl > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      nodes.push(
        line([-840, 265], [840, 265], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          bl > 0.4
            ? 'Evaluate tone, pacing & intelligibility on the actual playback device'
            : 'Waveform sample != semantic position != acoustic codec token != network packet',
          0,
          335,
          26,
          bl > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('va-audio-representation-0-2', () => {
    s.play(
      semOn.to(1, { duration: clampDur(c, c.cue('va-audio-representation-0-2').start, 0.35) }),
    );
  });
  c.on('va-audio-representation-1-0', () => {
    s.play(
      codecOn.to(1, { duration: clampDur(c, c.cue('va-audio-representation-1-0').start, 0.4) }),
    );
  });
  c.on('va-audio-representation-1-1', () => {
    s.play(
      billingOn.to(1, { duration: clampDur(c, c.cue('va-audio-representation-1-1').start, 0.35) }),
    );
  });
}
