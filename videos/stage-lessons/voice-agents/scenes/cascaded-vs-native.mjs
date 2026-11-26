// Scene 16: cascaded-vs-native - Choose the path your product can inspect
// Parallel glowing pipelines: Cascaded (STT -> LLM -> TTS with inspectable text seams)
// vs Native-Audio (direct audio-to-audio prosody) sharing the same outer Policy, Transport & State shell.
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
  trimSeg,
  txt,
  voiceNode,
} from '../parts.mjs';

export default function cascadedVsNative(s, c) {
  const phase = s.value(0);
  const inspectOn = s.value(0);
  const nativeOn = s.value(0);
  const sharedOn = s.value(0);
  const compareOn = s.value(0);

  const header = cinemaHeader(
    'ARCHITECTURE CHOICE',
    'Choose the path your',
    'product can inspect',
    {
      x: -860,
      y: -445,
      accent: ROLE.native,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e618', '#a78bfa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ins = inspectOn.value;
      const nat = nativeOn.value;
      const sh = sharedOn.value;
      const cmp = compareOn.value;
      const nodes = [];

      // Top Track: Cascaded (STT -> LLM -> TTS)
      const yCas = -150;
      const sttPt = [-420, yCas];
      const llmPt = [0, yCas];
      const ttsPt = [420, yCas];

      const nStt = voiceNode(sttPt[0], sttPt[1], 'STT', ROLE.audio, {
        radius: 66,
        sub: 'text seam',
      });
      const nLlm = voiceNode(llmPt[0], llmPt[1], 'LLM', ROLE.tool, {
        radius: 66,
        sub: ins > 0.4 ? 'tool & audit seam' : 'language model',
      });
      const nTts = voiceNode(ttsPt[0], ttsPt[1], 'TTS', ROLE.ok, {
        radius: 66,
        sub: 'speech synth',
      });

      const [c1a, c1b] = trimSeg(sttPt, llmPt, nStt.r + 16, nLlm.r + 16);
      const [c2a, c2b] = trimSeg(llmPt, ttsPt, nLlm.r + 16, nTts.r + 16);

      nodes.push(
        txt('CASCADED', -830, yCas, 26, ROLE.audio, 'mono', 'left'),
        beamWithPhotons([c1a, c1b], ROLE.audio, p, { width: 3.8, photonCount: 2 }),
        beamWithPhotons([c2a, c2b], ROLE.tool, p + 0.4, { width: 3.8, photonCount: 2 }),
        nStt.node,
        nLlm.node,
        nTts.node,
      );

      // Bottom Track: Native-Audio Model (direct prosody, fewer model handoffs)
      const yNat = 148;
      const natAlpha = 0.35 + nat * 0.65;
      const nNat = voiceNode(0, yNat, 'NATIVE', ROLE.native, {
        radius: 82,
        sub: 'direct audio-in -> audio-out (preserves prosody)',
        opacity: natAlpha,
        size: 28,
      });
      nodes.push(
        txt('NATIVE', -830, yNat, 26, ROLE.native, 'mono', 'left').opacity(natAlpha),
        beamWithPhotons(
          [
            [-540, yNat],
            [-nNat.r - 18, yNat],
          ],
          ROLE.native,
          p * 1.1,
          { width: 4, photonCount: 2, alpha: natAlpha },
        ),
        beamWithPhotons(
          [
            [nNat.r + 18, yNat],
            [540, yNat],
          ],
          ROLE.native,
          p * 1.1 + 0.5,
          { width: 4, photonCount: 2, alpha: natAlpha },
        ),
        nNat.node,
      );

      // Outer shared boundary rails (Capture/Transport left, Policy/State/Playback right)
      const shAlpha = 0.4 + sh * 0.6;
      nodes.push(
        line([-620, -205], [-620, 215], { stroke: ROLE.ok, width: 3.5, dash: [10, 8] }).opacity(
          shAlpha,
        ),
        txt('CAPTURE + TRANSPORT', -620, -238, 26, ROLE.ok, 'mono', 'center').opacity(shAlpha),
        line([620, -205], [620, 215], { stroke: ROLE.ok, width: 3.5, dash: [10, 8] }).opacity(
          shAlpha,
        ),
        txt('POLICY + BARGE-IN + STATE', 620, -238, 26, ROLE.ok, 'mono', 'center').opacity(shAlpha),
      );

      // Top-right comparison rubric
      nodes.push(
        txt('EVALUATE ON TARGET SLICES', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('first audio · accuracy · barge-in', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('tool safety · dispute evidence', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      nodes.push(
        txt(
          cmp > 0.4
            ? 'Both paths still need capture, transport, interruption, tool policy & state!'
            : 'Cascaded exposes text seams; native audio reduces handoffs & keeps prosody',
          0,
          355,
          26,
          cmp > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.native,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('cascaded-inspection', () => {
    s.play(inspectOn.to(1, { duration: clampDur(c, c.cue('cascaded-inspection').start, 0.35) }));
  });
  c.on('native-audio-path', () => {
    s.play(nativeOn.to(1, { duration: clampDur(c, c.cue('native-audio-path').start, 0.4) }));
  });
  c.on('voice-shared-policy', () => {
    s.play(sharedOn.to(1, { duration: clampDur(c, c.cue('voice-shared-policy').start, 0.4) }));
  });
  c.on('voice-inspection-evidence', () => {
    s.play(
      compareOn.to(1, { duration: clampDur(c, c.cue('voice-inspection-evidence').start, 0.35) }),
    );
  });
}
