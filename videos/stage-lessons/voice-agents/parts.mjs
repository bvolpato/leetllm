// Shared cinema building blocks, semantic color roles, 3D helpers, and verified math
// invariants for the Real-Time Voice Agent (Incident Hotline) stage lesson.
import {
  circle,
  curve3d,
  group,
  line,
  line3d,
  linear,
  parametricSurface,
  point3d,
  rect,
} from 'vizmatic/stage';
import {
  playoutSchedule,
  turnComplete,
  voiceLateAck,
  voiceReconcile,
  voiceWorksheet,
} from '../../films/voice-agents/arithmetic.mjs';
import {
  activeReply,
  chunks,
  commitToAudio,
  firstAudioLatency,
  interrupt,
  packets,
  partialTurns,
  pendingText,
  sequential,
  speechChunks,
  toolTrace,
  trace,
} from '../../films/voice-agents/fixtures.mjs';
import { validateModel } from '../../films/voice-agents/model.mjs';
import {
  CINEMA_FRAME,
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  metricReadout,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';

export {
  CINEMA_FRAME,
  COSMOS,
  activeReply,
  aura,
  chunks,
  cinematic3d,
  commitToAudio,
  firstAudioLatency,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  interrupt,
  metricReadout,
  orbitScene,
  packets,
  partialTurns,
  pendingText,
  playoutSchedule,
  rule,
  sequential,
  speechChunks,
  toolTrace,
  trace,
  turnComplete,
  txt,
  verifyApprox,
  verifyInvariant,
  voiceLateAck,
  voiceReconcile,
  voiceWorksheet,
  wireframeSlab3d,
};

/**
 * Semantic color roles held constant across all 29 voice-agents scenes:
 *   audio / client / stream -> cyan
 *   confirmed / playout / ok -> emerald
 *   tool / ledger / model    -> gold
 *   policy / control / native -> violet
 *   barge-in / late / drop   -> rose
 *   pending / caution / echo -> amber
 *   network / media worker   -> blue
 */
export const ROLE = Object.freeze({
  audio: COSMOS.cyan,
  client: COSMOS.cyan,
  ok: COSMOS.emerald,
  confirmed: COSMOS.emerald,
  tool: COSMOS.gold,
  focus: COSMOS.gold,
  policy: COSMOS.violet,
  native: COSMOS.violet,
  cut: COSMOS.rose,
  fail: COSMOS.rose,
  warn: COSMOS.amber,
  echo: COSMOS.amber,
  media: COSMOS.blue,
  net: COSMOS.blue,
});

export const WORKSHEET = voiceWorksheet();
export const SCHED_30 = playoutSchedule(30);
export const SCHED_60 = playoutSchedule(60);

/** Build-time mathematical invariant suite covering every spoken value in voice-agents. */
export function verifyVoiceAgentsInvariants() {
  validateModel();
  verifyInvariant(firstAudioLatency === 380, 'first audio latency 380 ms');
  verifyInvariant(commitToAudio === 320, 'commit to audio 320 ms');
  verifyInvariant(sequential === 510, 'sequential latency 510 ms');
  verifyInvariant(interrupt.acknowledgedThrough === 520, 'ack through 520 ms');
  verifyInvariant(interrupt.replyElapsedMs === 650, 'interrupt at 650 ms');
  verifyInvariant(interrupt.wallMs === 1605, 'interrupt wall clock 1605 ms');
  verifyInvariant(interrupt.retained === 'Incident is open', 'retained prefix matches');
  verifyInvariant(
    voiceReconcile(pendingText, chunks, 519).retained === 'Incident is',
    '519 ms boundary keeps Incident is',
  );
  verifyInvariant(
    voiceReconcile(pendingText, chunks, 520).retained === 'Incident is open',
    '520 ms boundary keeps Incident is open',
  );
  verifyInvariant(
    SCHED_30[2].deadline === 70 && SCHED_30[2].disposition === 'conceal',
    '30ms conceal p3',
  );
  verifyInvariant(
    SCHED_60[2].deadline === 100 && SCHED_60[2].disposition === 'play',
    '60ms play p3',
  );
  verifyApprox(WORKSHEET.costNumerator / 1e6, 0.00205, 1e-9, 'cache worksheet $0.00205');
  verifyInvariant(WORKSHEET.requested61Frames * 20 === 80, '61 ms -> 4 frames -> 80 ms');
  verifyInvariant(
    WORKSHEET.retained === 'Lookup is ready.',
    'fresh interruption retains first sentence',
  );
  verifyInvariant(
    partialTurns.map(turnComplete).join(',') === 'false,false,true',
    '4-digit incident turn gate',
  );
}

export function cinemaHeader(
  eyebrow,
  line1,
  line2,
  { x = -860, y = -445, accent = COSMOS.cyan, size = 46, anchor = 'left' } = {},
) {
  const parts = [
    txt(eyebrow, x, y, 26, accent, 'mono', anchor),
    txt(line1, x, y + 56, size, COSMOS.ink, 'serif', anchor),
  ];
  if (line2) {
    parts.push(txt(line2, x, y + 116, size, accent, 'serif', anchor).glow(6, accent));
  }
  return group(...parts);
}

export function clampDur(c, startTime, desired, margin = 0.4) {
  const available = c.end - startTime - margin;
  if (available <= 0.08) return 0.08;
  return Math.min(desired, available);
}

export const fadeOutHalf = (v) => Math.max(0, Math.min(1, 1 - v * 2.5));
export const fadeInHalf = (v) => Math.max(0, Math.min(1, (v - 0.6) * 2.5));

export function driftValue(s, c, val, target, { startOffset = 0.1, endMargin = 0.45 } = {}) {
  const span = Math.max(0.4, c.end - c.start - startOffset - endMargin);
  c.at(startOffset, () => {
    s.play(val.to(target, { duration: span, ease: linear }));
  });
  return span;
}

export function glowMeter(
  xLeft,
  y,
  totalW,
  h,
  frac,
  {
    fill = COSMOS.cyan,
    bg = '#0f1629',
    border = '#2c3d66',
    glow = 8,
    radius = 8,
    opacity = 1,
  } = {},
) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cx = xLeft + totalW * 0.5;
  const track = rect(totalW, h, { fill: bg, stroke: border, width: 2, radius })
    .at(cx, y)
    .opacity(opacity);
  if (clamped <= 0.004) return track;
  const innerW = Math.max(8, (totalW - 6) * clamped);
  const bar = rect(innerW, h - 6, { fill, stroke: null, radius: Math.max(4, radius - 2) })
    .at(xLeft + 3 + innerW * 0.5, y)
    .opacity(0.9 * opacity);
  if (glow > 0) bar.glow(glow, fill);
  return group(track, bar);
}

export function quadArcPts(a, b, liftY = -80, steps = 28) {
  const mx = (a[0] + b[0]) * 0.5;
  const my = (a[1] + b[1]) * 0.5 + liftY;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * mx + t * t * b[0],
      u * u * a[1] + 2 * u * t * my + t * t * b[1],
    ]);
  }
  return pts;
}

export function beamWithPhotons(
  pts,
  color,
  phaseVal,
  { width = 3.6, glow = 9, photonCount = 2, alpha = 1 } = {},
) {
  const nodes = [glowingTrail(pts, { color, width, glow, opacity: 0.9 * alpha })];
  if (photonCount > 0) {
    const last = pts.length - 1;
    for (let i = 0; i < photonCount; i++) {
      const u = ((((phaseVal ?? 0) + i / photonCount) % 1) + 1) % 1;
      const idx = u * last;
      const k = Math.min(last - 1, Math.floor(idx));
      const f = idx - k;
      const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
      const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      nodes.push(glowDot(px, py, { radius: 5.0, color: '#ffffff', glow: 10, opacity: alpha }));
    }
  }
  return group(...nodes);
}

export function trimSeg(a, b, padA = 56, padB = 56) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [
    [a[0] + (dx / len) * padA, a[1] + (dy / len) * padA],
    [b[0] - (dx / len) * padB, b[1] - (dy / len) * padB],
  ];
}

/** Auto-sized circular voice-system node guaranteeing >= 12px interior padding around text. */
export function voiceNode(
  x,
  y,
  label,
  color,
  { radius = 50, sub = null, opacity = 1, glow = 8, size = 26 } = {},
) {
  const r = Math.max(radius, Math.ceil(String(label).length * 9.5 + 22));
  const parts = [
    circle(r, { fill: '#0b1224', stroke: color, width: 3.4 })
      .at(x, y)
      .glow(glow, color)
      .opacity(opacity),
    txt(label, x, y, size, color, 'mono', 'center').opacity(opacity),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + r + 36, 26, COSMOS.muted, 'mono', 'center').opacity(opacity));
  }
  return { node: group(...parts), r };
}

/** Glowing animated audio waveform ribbon between x0 and x1 centered at y0. */
export function waveformRibbon(
  x0,
  x1,
  y0,
  amp,
  phaseVal,
  { color = COSMOS.cyan, freq = 5, samples = 44, width = 3.4, glow = 9, opacity = 1, env = 1 } = {},
) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = x0 + (x1 - x0) * u;
    const window = Math.sin(Math.PI * u);
    const wave =
      0.65 * Math.sin((u * freq - phaseVal) * Math.PI * 2) +
      0.35 * Math.sin((u * freq * 2.3 + phaseVal * 1.4) * Math.PI * 2);
    pts.push([x, y0 + wave * amp * window * env]);
  }
  return glowingTrail(pts, { color, width, glow, opacity });
}

export function addBox3D(
  view,
  x0,
  y0,
  z0,
  dx,
  dy,
  dz,
  fillColor,
  edgeColor = fillColor,
  { faceOpacity = 0.78, edgeWidth = 2.0, edgeGlow = 6, edgeOpacity = 0.92, blend = 'screen' } = {},
) {
  const x1 = x0 + dx;
  const y1 = y0 + dy;
  const z1 = z0 + dz;
  const faceOpts = {
    resolution: [1, 1],
    color: fillColor,
    opacity: faceOpacity,
    mesh: false,
    shaded: true,
  };
  const edgeOpts = {
    color: edgeColor,
    width: edgeWidth,
    opacity: edgeOpacity,
    glow: edgeGlow,
    ...(blend ? { blend } : {}),
  };
  const objs = [
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z1], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0 + v * dy, z0], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y0, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0 + u * dx, y1, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x0, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    parametricSurface((u, v) => [x1, y0 + u * dy, z0 + v * dz], [0, 1], [0, 1], faceOpts),
    line3d([x0, y0, z0], [x1, y0, z0], edgeOpts),
    line3d([x1, y0, z0], [x1, y1, z0], edgeOpts),
    line3d([x1, y1, z0], [x0, y1, z0], edgeOpts),
    line3d([x0, y1, z0], [x0, y0, z0], edgeOpts),
    line3d([x0, y0, z1], [x1, y0, z1], edgeOpts),
    line3d([x1, y0, z1], [x1, y1, z1], edgeOpts),
    line3d([x1, y1, z1], [x0, y1, z1], edgeOpts),
    line3d([x0, y1, z1], [x0, y0, z1], edgeOpts),
    line3d([x0, y0, z0], [x0, y0, z1], edgeOpts),
    line3d([x1, y0, z0], [x1, y0, z1], edgeOpts),
    line3d([x1, y1, z0], [x1, y1, z1], edgeOpts),
    line3d([x0, y1, z0], [x0, y1, z1], edgeOpts),
  ];
  view.add(...objs);
  return objs;
}

export function addArc3D(
  view,
  a,
  b,
  color,
  { lift = 0.7, width = 3.0, glow = 8, pulseVal = null, phaseOffset = 0, opacity = 0.92 } = {},
) {
  const mid = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, Math.max(a[2], b[2]) + lift];
  const evalPt = (t) => {
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * mid[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * mid[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * mid[2] + t * t * b[2],
    ];
  };
  const objs = [
    curve3d(evalPt, 0, 1, { color, width, glow, blend: 'screen', samples: 32, opacity }),
    point3d(a, { color: '#ffffff', radius: 4.8, glow: 8, blend: 'screen' }),
    point3d(b, { color, radius: 5.4, glow: 8, blend: 'screen' }),
  ];
  if (pulseVal) {
    objs.push(
      point3d(() => evalPt((pulseVal.value + phaseOffset) % 1), {
        color: '#ffffff',
        radius: 6.2,
        glow: 10,
        blend: 'screen',
      }),
    );
  }
  view.add(...objs);
  return objs;
}
