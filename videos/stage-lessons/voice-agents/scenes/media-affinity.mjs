// Scene 26: media-affinity - Keep packet state with its owner while inference scales
// Orbiting 3D stateful media-worker cluster (media-a, media-b, media-c) showing call-Alex-4219
// affinity to media-c (DTLS/SRTP/jitter/cursor), worker death -> explicit reconnect & rebuild!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function mediaAffinity(s, c) {
  const phase = s.value(0);
  const hashOn = s.value(0);
  const dieOn = s.value(0);

  const header = cinemaHeader('STATEFUL MEDIA AFFINITY', 'Keep packet state', 'with its owner', {
    x: -860,
    y: -445,
    accent: ROLE.media,
    size: 46,
  });

  const bgAura = aura(160, 20, 660, '#60a5fa1a', '#5ce1e618');

  // Right-side orbiting 3D stateful media-edge vs elastic inference cluster
  const view3d = cinematic3d({
    pos: [330, 35],
    size: [920, 740],
    fov: 38,
    distance: 7.4,
    azimuth: -0.58,
    elevation: 0.42,
    grid: true,
    gridColor: '#1b294a',
  });

  // 3 stateful media workers at front (y = -1.3): media-a, media-b, media-c (gold active owner!)
  addBox3D(view3d, -2.1, -1.6, 0.0, 0.95, 0.95, 0.95, '#1e3a5f', ROLE.media);
  addBox3D(view3d, -0.5, -1.6, 0.0, 0.95, 0.95, 0.95, '#1e3a5f', ROLE.media);
  addBox3D(view3d, 1.1, -1.6, 0.0, 1.05, 1.05, 1.15, '#3b2e10', ROLE.focus);

  // 3 elastic inference pools at back (y = +1.1): STT, LLM, TTS
  addBox3D(view3d, -2.0, 1.0, 0.0, 0.95, 0.95, 1.25, '#0f3847', ROLE.audio);
  addBox3D(view3d, -0.45, 1.0, 0.0, 0.95, 0.95, 1.55, '#2b1d52', ROLE.policy);
  addBox3D(view3d, 1.1, 1.0, 0.0, 0.95, 0.95, 1.15, '#103b2c', ROLE.ok);

  // Glowing packet affinity arcs from media-c into inference pools!
  addArc3D(view3d, [1.62, -1.08, 1.15], [-1.52, 1.48, 1.25], ROLE.audio, {
    lift: 0.8,
    pulseVal: phase,
    phaseOffset: 0,
  });
  addArc3D(view3d, [1.62, -1.08, 1.15], [0.02, 1.48, 1.55], ROLE.policy, {
    lift: 1.0,
    pulseVal: phase,
    phaseOffset: 0.33,
  });
  addArc3D(view3d, [1.62, -1.08, 1.15], [1.58, 1.48, 1.15], ROLE.ok, {
    lift: 0.8,
    pulseVal: phase,
    phaseOffset: 0.66,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const hs = hashOn.value;
      const di = dieOn.value;
      const nodes = [];

      const lx = -860;
      nodes.push(
        txt('MEDIA-C OWNS LIVE TRANSPORT STATE', lx, -185, 26, ROLE.focus, 'mono', 'left'),
        txt('DTLS keys · SRTP · jitter · cursor', lx, -130, 26, COSMOS.ink, 'mono', 'left'),
        txt('Round-robin breaks state lookup!', lx, -78, 26, ROLE.warn, 'mono', 'left'),

        txt('FIXED 3-WORKER HASH DEMO', lx, 15, 26, ROLE.audio, 'mono', 'left').opacity(
          0.45 + hs * 0.55,
        ),
        txt('4 packets -> all land on media-c', lx, 68, 26, ROLE.ok, 'mono', 'left').opacity(
          0.45 + hs * 0.55,
        ),
        txt(
          'NOT consistent hashing or failover',
          lx,
          118,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(0.45 + hs * 0.55),

        txt('IF MEDIA-C DIES:', lx, 210, 26, ROLE.fail, 'mono', 'left').opacity(0.35 + di * 0.65),
        txt('Reconnect + rebuild DTLS & session', lx, 262, 26, COSMOS.ink, 'mono', 'left').opacity(
          0.35 + di * 0.65,
        ),
        txt('Transcript alone != crypto state!', lx, 312, 26, ROLE.fail, 'mono', 'left').opacity(
          0.35 + di * 0.65,
        ),

        // 3D scene legend
        txt(
          'GOLD: MEDIA-C OWNER  ·  BACK: ELASTIC STT / LLM / TTS',
          330,
          415,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'SCALE INFERENCE POOLS INDEPENDENTLY BEHIND EDGE',
          330,
          -405,
          26,
          ROLE.audio,
          'mono',
          'center',
        ),
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

  s.add(bgAura, header, view3d, overlay);
  orbitScene(s, c, view3d, { azimuthDelta: 0.34, elevationDelta: -0.05 });
  driftValue(s, c, phase, 4.4);

  c.on('va-media-affinity-1-0', () => {
    s.play(hashOn.to(1, { duration: clampDur(c, c.cue('va-media-affinity-1-0').start, 0.4) }));
  });
  c.on('va-media-affinity-2-0', () => {
    s.play(dieOn.to(1, { duration: clampDur(c, c.cue('va-media-affinity-2-0').start, 0.45) }));
  });
}
