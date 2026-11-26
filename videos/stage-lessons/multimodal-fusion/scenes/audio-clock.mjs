// Scene 16: audio-clock: 40s @ 100Hz = 4,000 steps -> stride-10 = 400 states (101 -> 11 padded), recording time vs event time.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function audioClock(s, c) {
  const showRaw = s.value(0);
  const show4000 = s.value(0);
  const showPool = s.value(0);
  const show400 = s.value(0);
  const showClockMap = s.value(0);

  const bgAura = aura(0, 0, 760, '#2e1d0d2c', '#182b4d28');
  const title = heroTitle(['Compress a Timeline Without', 'Inventing an Event Time'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.audio,
  });

  const eq = glowTex(String.raw`\lceil 101 / 10 \rceil = 11 \text{ states}`, {
    x: 455,
    y: -395,
    size: 34,
    color: ROLE.gold,
    glow: 7,
  });

  const wavePts = Array.from({ length: 48 }, (_, i) => {
    const t = i / 47;
    const x = -840 + t * 1680;
    const env = 0.3 + 0.7 * Math.sin(t * Math.PI);
    const alarmSpike = Math.exp(-((t - 0.62) ** 2) * 280) * 44;
    const y = -126 + Math.sin(t * 36) * 24 * env - alarmSpike;
    return [x, y];
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rw = showRaw.value;
    const n4k = show4000.value;
    const pl = showPool.value;
    const n400 = show400.value;
    const cm = showClockMap.value;

    const nodes = [
      // Top: Glowing 40-second audio waveform with short alarm spike
      txt(
        n4k > 0.3
          ? '40s RECORDING @ 100 Hz = 4,000 FRONTEND STEPS'
          : '40s BRIDGE RECORDING (TIMESTAMPED TRANSCRIPT + ALARM AUDIO)',
        -855,
        -245,
        26,
        n4k > 0.3 ? ROLE.audio : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      glowingTrail(wavePts, {
        color: ROLE.audio,
        gradientColors: [ROLE.audio, ROLE.gold, ROLE.warn],
        width: 4,
        glow: 10,
        opacity: alpha * (0.6 + 0.4 * rw),
      }),
      txt('short alarm', 210, -222, 26, ROLE.warn, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * Math.max(rw, pl)),
      ),

      // Middle: Stride-10 temporal pooling (4,000 -> 400; 101 -> 11)
      txt('4,000 raw steps', -855, -25, 28, ROLE.audio, 'mono', 'left').opacity(alpha),
      lumBar(-540, -25, 1180, 32, ROLE.audio, {
        opacity: alpha * (0.6 + 0.4 * Math.max(rw, n4k)),
        maxTrackW: 1180,
      }),

      arrow([-40, 12], [-40, 62], { stroke: ROLE.gold, width: 3.2, head: 12 }).opacity(
        alpha * (0.5 + 0.5 * pl),
      ),
      txt('group 10 steps (pad last)', 10, 38, 26, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.5 + 0.5 * pl),
      ),

      txt(
        n400 > 0.3 ? '400 pooled states' : '10x compressed',
        -855,
        98,
        28,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * Math.max(pl, n400))),
      lumBar(-540, 98, 130, 32, ROLE.ok, {
        opacity: alpha * (0.55 + 0.45 * Math.max(pl, n400)),
        maxTrackW: 1180,
      }),
      chipPill('101 steps -> 11 states (padded)', 240, 98, {
        w: 580,
        h: 62,
        color: n400 > 0.3 ? ROLE.gold : '#384c76',
        size: 26,
        glow: n400 > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * Math.max(pl, n400)),
      }),

      // Bottom: Recording-relative clock vs wall-clock deploy log vs utterance time
      txt(
        'EVIDENCE RECORD CLOCKS (NEVER CONFLATE)',
        -855,
        205,
        26,
        cm > 0.3 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * cm)),
      chipPill('Recording Start + Step Map', -580, 290, {
        w: 530,
        h: 68,
        color: cm > 0.3 ? ROLE.vision : '#384c76',
        size: 26,
        opacity: alpha * (0.55 + 0.45 * cm),
      }),
      chipPill('Deploy Log UTC Clock', 0, 290, {
        w: 500,
        h: 68,
        color: cm > 0.3 ? ROLE.text : '#384c76',
        size: 26,
        opacity: alpha * (0.55 + 0.45 * cm),
      }),
      chipPill('Spoken != Event Time', 580, 290, {
        w: 530,
        h: 68,
        color: cm > 0.3 ? ROLE.warn : '#384c76',
        fill: cm > 0.3 ? '#2c1422' : '#10182d',
        size: 26,
        glow: cm > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * cm),
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'mm-audio-clock-0', (d) => s.play(showRaw.to(1, { duration: d })));
  playCue(s, c, 'mm-audio-raw', (d) => s.play(show4000.to(1, { duration: d })));
  playCue(s, c, 'mm-audio-clock-1', (d) => s.play(showPool.to(1, { duration: d })));
  playCue(s, c, 'mm-audio-reduced', (d) => s.play(show400.to(1, { duration: d })));
  playCue(s, c, 'mm-audio-clock-2', (d) => s.play(showClockMap.to(1, { duration: d })));
}
