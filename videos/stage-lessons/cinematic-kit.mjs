// Cinematic authoring kit for LeetLLM Vizmatic stage films (vizmatic@0.10.0+).
// Modeled on vizmatic-public-videos/factory/style.ts and videos/TEACHING_STANDARD.md:
//   - Zero slide chrome (no top title banners, divider bars, chapter counters, or bullet cards).
//   - Full 1920x1080 dark cinema canvas (#070910, bleed: true, bloom: 0.22-0.24).
//   - Semantic COSMOS palette, >= 26 px phone-readable typography, glowing trails, 3D camera
//     orbit helpers, MathJax equation morphs, assertEqual math guards, and seamless
//     integration with narratedLesson(), render.mjs --stage, stage-check.mjs, and check-coverage.mjs.
import {
  LOOKS,
  Node,
  assertEqual,
  circle,
  dot,
  dynamic,
  group,
  line,
  line3d,
  linearGradient,
  morphMatching,
  polyPath,
  scene3d,
  tex,
  text,
} from 'vizmatic/stage';
import { narratedLesson } from '../lib/narrated-lesson.mjs';

/** Minimum legible text size in pixels on a 1920x1080 frame watched on phones. */
export const MIN_TEXT_SIZE = 26;

/** Full-bleed cinema canvas dimensions and safe margins for floating typography. */
export const CINEMA_FRAME = Object.freeze({
  width: 1920,
  height: 1080,
  left: -960,
  right: 960,
  top: -540,
  bottom: 540,
  safeLeft: -860,
  safeRight: 860,
  safeTop: -440,
  safeBottom: 440,
});

/** Shared deep-space cinema palette. One color carries one semantic role across a lesson. */
export const COSMOS = Object.freeze({
  bg: '#070910',
  surface: '#111626',
  surfaceAlt: '#171d32',
  ink: '#f8f4ec',
  muted: '#b5c1d8',
  dim: '#6e7c9e',
  rule: '#26304a',
  gold: '#ffd166',
  cyan: '#5ce1e6',
  blue: '#60a5fa',
  violet: '#a78bfa',
  rose: '#ff6b8b',
  emerald: '#6ee7b7',
  amber: '#fb923c',
});

/**
 * Vizmatic look mapping semantic course color names (cyan, blue, yellow, green, pink, red)
 * onto the COSMOS cinema palette so both COSMOS hexes and look tokens stay harmonious.
 */
export const CINEMATIC_LOOK = Object.freeze({
  ...LOOKS.midnight,
  name: 'leetllm-cinema',
  background: COSMOS.bg,
  colors: Object.freeze({
    ...LOOKS.midnight.colors,
    bg: COSMOS.bg,
    surface: COSMOS.surface,
    ink: COSMOS.ink,
    dim: COSMOS.dim,
    faint: COSMOS.rule,
    grid: COSMOS.rule,
    cyan: COSMOS.cyan,
    blue: COSMOS.blue,
    yellow: COSMOS.gold,
    gold: COSMOS.gold,
    green: COSMOS.emerald,
    emerald: COSMOS.emerald,
    pink: COSMOS.violet,
    violet: COSMOS.violet,
    red: COSMOS.rose,
    rose: COSMOS.rose,
    amber: COSMOS.amber,
  }),
});

/** Default film options for full-bleed 1080p cinematic stage lessons. */
export const CINEMATIC_FILM_OPTIONS = Object.freeze({
  width: CINEMA_FRAME.width,
  height: CINEMA_FRAME.height,
  background: COSMOS.bg,
  look: CINEMATIC_LOOK,
  bleed: true,
  bloom: 0.24,
});

function assertReadableSize(size, label) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size < MIN_TEXT_SIZE) {
    throw new RangeError(
      `${label}: text size ${size}px is below phone-readable minimum (${MIN_TEXT_SIZE}px)`,
    );
  }
  return size;
}

/**
 * Floating cinema text with phone-readability guard (>= 26 px).
 * Accepts 'sans' | 'serif' | 'mono' and anchor 'left' | 'center' | 'right'.
 */
export function txt(
  value,
  x = 0,
  y = 0,
  size = 34,
  color = COSMOS.ink,
  font = 'sans',
  anchor = 'center',
) {
  assertReadableSize(size, `txt(${JSON.stringify(value)})`);
  const resolvedFont = font === 'serif' ? 'text-serif' : font;
  return text(String(value), { size, color, font: resolvedFont, anchor }).at(x, y);
}

/** Subtle hair-line rule without box chrome. */
export function rule(x1, y1, x2, y2, color = COSMOS.rule, width = 2) {
  return line([x1, y1], [x2, y2], { stroke: color, width });
}

/**
 * Floating cinematic hero headline block (no top banner bar, no divider box, no card chrome).
 * Mirrors the left-anchored display typography in vizmatic-public-videos.
 */
export function heroTitle(
  lines,
  {
    x = CINEMA_FRAME.safeLeft,
    y = -395,
    size = 62,
    lineHeight = 72,
    accent = COSMOS.cyan,
    accentGlow = 0,
    eyebrow,
    subtitle,
    anchor = 'left',
  } = {},
) {
  const parts = [];
  let cursorY = y;
  if (eyebrow) {
    parts.push(txt(eyebrow, x, cursorY, MIN_TEXT_SIZE, accent, 'mono', anchor));
    cursorY += 56;
  }
  const items = Array.isArray(lines) ? lines : [lines];
  items.forEach((lineText, index) => {
    const isAccent = items.length > 1 && index === items.length - 1;
    const node = txt(lineText, x, cursorY, size, isAccent ? accent : COSMOS.ink, 'serif', anchor);
    if (isAccent && accentGlow > 0) node.glow(accentGlow, accent);
    parts.push(node);
    cursorY += lineHeight;
  });
  if (subtitle) {
    parts.push(txt(subtitle, x, cursorY + 8, 28, COSMOS.muted, 'sans', anchor));
  }
  return group(...parts);
}

/** Floating monospace metric readout without card chrome. */
export function metricReadout(
  caption,
  value,
  {
    x = CINEMA_FRAME.safeLeft,
    y = 190,
    valueSize = 74,
    color = COSMOS.gold,
    glow = 0,
    sub,
    anchor = 'left',
  } = {},
) {
  const parts = [
    txt(caption, x, y, MIN_TEXT_SIZE, COSMOS.muted, 'mono', anchor),
    txt(value, x, y + 72, valueSize, color, 'mono', anchor).glow(glow, color),
  ];
  if (sub) {
    parts.push(txt(sub, x, y + 150, 28, COSMOS.muted, 'mono', anchor));
  }
  return group(...parts);
}

/** Mark a backdrop or ambient shape as non-occluding decoration for Vizmatic's layout check. */
export function markDecoration(node) {
  if (node?.data) node.data.decoration = true;
  return node;
}

/**
 * Ambient backdrop helper (no-op decoration).
 * Large 8-bit SVG radialGradients create concentric banding rings on dark #070910 frames
 * and consume 45-84% of Resvg raster time; film-wide Float32+IGN dithered bloom (0.24)
 * provides smooth, stable, artifact-free glow around all illuminated elements instead.
 */
export function nebula() {
  return markDecoration(group());
}

/** Ambient aura helper (no-op decoration; see nebula). */
export function aura() {
  return markDecoration(group());
}

/** Deterministic deep-space starfield (zero flicker across seeks, marked as decoration). */
export function starfield(count = 130, seed = 1, accentHex = COSMOS.gold) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const sx = Math.sin((i + seed * 19) * 127.1 + 3.7) * 43758.5453;
    const sy = Math.sin((i + seed * 31) * 269.5 + 9.1) * 19642.349;
    const x = -940 + (sx - Math.floor(sx)) * 1880;
    const y = -520 + (sy - Math.floor(sy)) * 1040;
    const r = 0.7 + (i % 4) * 0.32;
    const op = 0.14 + (i % 5) * 0.055;
    out.push(
      markDecoration(
        dot(r, i % 11 === 0 ? accentHex : '#8ea4d2')
          .opacity(op)
          .at(x, y),
      ),
    );
  }
  return out;
}

/** Complete cosmic backdrop group pinned behind all scene geometry at zIndex -100. */
export function cosmicBackdrop({
  seed = 1,
  accent = COSMOS.cyan,
  nebulaX = 0,
  nebulaY = -40,
  nebulaRadius = 520,
  nebulaInner = '#18244d2a',
  nebulaMid = '#11163314',
  stars = 135,
} = {}) {
  return markDecoration(
    group(
      nebula(nebulaX, nebulaY, nebulaRadius, nebulaInner, nebulaMid),
      ...starfield(stars, seed, accent),
    ).zIndex(-100),
  );
}

/**
 * Glowing continuous polyline trail with optional color gradient and bright core highlight.
 * Uses Vizmatic's polyPath + additive screen glow proven across vizmatic-public-videos.
 */
export function glowingTrail(
  pts,
  {
    color = COSMOS.cyan,
    gradientColors,
    width = 4.2,
    opacity = 0.94,
    glow = 10,
    blend = 'screen',
    core = true,
    coreWidth = 1.3,
    coreOpacity = 0.44,
  } = {},
) {
  if (!Array.isArray(pts) || pts.length < 2) {
    throw new RangeError('glowingTrail requires at least 2 [x, y] points');
  }
  const path = polyPath(pts);
  const paint =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? linearGradient(pts[0], pts.at(-1), gradientColors)
      : color;
  const glowColor = Array.isArray(gradientColors) ? gradientColors.at(-1) : color;
  const outer = new Node(path).stroke(paint, width, opacity);
  if (glow > 0) outer.glow(glow, glowColor);
  if (blend) outer.set('blend', blend);
  if (!core) return outer;
  const inner = new Node(path).stroke('#ffffff', coreWidth, coreOpacity);
  if (blend) inner.set('blend', blend);
  return group(outer, inner);
}

/** Glowing photon / particle marker. */
export function glowDot(
  x,
  y,
  { radius = 6, color = COSMOS.gold, glow = 12, opacity = 1, blend = 'screen' } = {},
) {
  const node = dot(radius, color).at(x, y).opacity(opacity);
  if (glow > 0) node.glow(glow, color);
  if (blend) node.set('blend', blend);
  return node;
}

/** Pre-lit 3D stage camera configured for crisp cinematic surfaces, curves, and particles. */
export function cinematic3d(options = {}) {
  return scene3d({
    theta: -0.82,
    phi: 1.04,
    distance: 15.4,
    unit: 114,
    perspective: true,
    ambient: 0.38,
    shine: 0.34,
    brightness: 1.1,
    fog: 0.09,
    focus: [0, 0, 0.5],
    ...options,
  });
}

/**
 * Schedule a continuous 3D camera orbit bounded safely inside the scene window
 * so it never trips the "film runs past its narration" gate.
 */
export function orbitScene(
  stage,
  clock,
  view3d,
  target,
  { startOffset = 0.1, endMargin = 0.5, ease } = {},
) {
  const sceneSpan = clock.end - clock.start;
  const duration = Math.max(0.5, sceneSpan - startOffset - endMargin);
  const orbitOptions = ease ? { duration, ease } : { duration };
  clock.at(startOffset, () => {
    stage.play(view3d.orbit(target, orbitOptions));
  });
  return duration;
}

/**
 * Reactive 12-edge glowing 3D wireframe slab (ideal for SRAM tiles, KV blocks, or tensor slices).
 * `centerFn` returns `[cx, cy, cz]` or can be a static `[x, y, z]` tuple.
 */
export function wireframeSlab3d(
  centerFn,
  hx,
  hy,
  hz,
  { color = COSMOS.gold, width = 2.8, glow = 8, blend = 'screen', onTop = true } = {},
) {
  const resolveCenter = typeof centerFn === 'function' ? centerFn : () => centerFn;
  const pt = (sx, sy, sz) => () => {
    const [cx, cy, cz] = resolveCenter();
    return [cx + sx * hx, cy + sy * hy, cz + sz * hz];
  };
  const topStyle = { color, width, glow, blend, onTop };
  const bottomStyle = { ...topStyle, width: Math.max(1.4, width * 0.65), opacity: 0.72 };
  const pillarStyle = { ...topStyle, width: Math.max(1.4, width * 0.65), opacity: 0.8 };
  return [
    line3d(pt(-1, -1, 1), pt(1, -1, 1), topStyle),
    line3d(pt(1, -1, 1), pt(1, 1, 1), topStyle),
    line3d(pt(1, 1, 1), pt(-1, 1, 1), topStyle),
    line3d(pt(-1, 1, 1), pt(-1, -1, 1), topStyle),
    line3d(pt(-1, -1, -1), pt(1, -1, -1), bottomStyle),
    line3d(pt(1, -1, -1), pt(1, 1, -1), bottomStyle),
    line3d(pt(1, 1, -1), pt(-1, 1, -1), bottomStyle),
    line3d(pt(-1, 1, -1), pt(-1, -1, -1), bottomStyle),
    line3d(pt(-1, -1, -1), pt(-1, -1, 1), pillarStyle),
    line3d(pt(1, -1, -1), pt(1, -1, 1), pillarStyle),
    line3d(pt(1, 1, -1), pt(1, 1, 1), pillarStyle),
    line3d(pt(-1, 1, -1), pt(-1, 1, 1), pillarStyle),
  ];
}

/** Glowing MathJax equation node enforcing phone-readable size (>= 26 px). */
export function glowTex(latex, { x = 0, y = 0, size = 44, color = COSMOS.gold, glow = 0 } = {}) {
  assertReadableSize(size, `glowTex(${JSON.stringify(latex)})`);
  const node = tex(latex, { size, color }).at(x, y);
  if (glow > 0) node.glow(glow, color);
  return node;
}

/** Smooth symbol-matching equation morph animation. */
export function morphEquation(fromNode, toNode, options = { duration: 1.1 }) {
  return morphMatching(fromNode, toNode, options);
}

/**
 * Dynamic node guarded by a visibility `Value`. Returns `[]` when visibility drops below
 * `threshold` so hidden dynamic nodes never trigger false `vizmatic check` findings.
 */
export function guardedDynamic(visibilityValue, renderFn, threshold = 0.02) {
  return dynamic(() => {
    const alpha = typeof visibilityValue === 'function' ? visibilityValue() : visibilityValue.value;
    if (alpha < threshold) return [];
    return renderFn(alpha);
  });
}

/** Browser-safe build-time math invariant assertion backed by `assertEqual` from vizmatic/stage. */
export function verifyInvariant(condition, message) {
  assertEqual(Boolean(condition), true, message);
}

/** Browser-safe floating-point equality assertion backed by `assertEqual` from vizmatic/stage. */
export function verifyApprox(actual, expected, tolerance = 1e-9, label = 'numeric invariant') {
  const diff = Math.abs(actual - expected);
  assertEqual(
    Number.isFinite(diff) && diff <= tolerance,
    true,
    `${label}: expected ${expected} (±${tolerance}), got ${actual} (diff ${diff})`,
  );
}

function withPinnedBackdrop(clock, backdropNode) {
  return new Proxy(clock, {
    get(target, prop, receiver) {
      if (prop === 'backdrop') return backdropNode;
      if (prop === 'swapAll') {
        return (cue, into = [], options = {}) => {
          const keep = Array.isArray(options.keep)
            ? [...options.keep, backdropNode]
            : options.keep
              ? [options.keep, backdropNode]
              : [backdropNode];
          return target.swapAll(cue, into, { ...options, keep });
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/**
 * Define a cinematic LeetLLM narrated lesson that plugs directly into `render.mjs --stage`,
 * `tools/stage-check.mjs`, `tools/stage-stills.mjs`, and `check-coverage.mjs`.
 *
 * Automatically configures the #070910 dark cinema look, bleed, bloom (0.24), optional
 * build-time mathematical invariants, and deterministic per-scene cosmic backdrops that
 * stay pinned across `c.swapAll(...)` transitions.
 */
export function cinematicLesson({
  id,
  scenes,
  accent = COSMOS.cyan,
  backdrop = true,
  invariants,
  options = {},
}) {
  if (typeof invariants === 'function') invariants();
  const wrappedScenes = {};
  let sceneIndex = 0;
  for (const [sceneId, build] of Object.entries(scenes)) {
    const index = sceneIndex++;
    wrappedScenes[sceneId] = (s, c, film) => {
      if (backdrop === false) {
        return build(s, c, film);
      }
      const cfg = typeof backdrop === 'object' ? backdrop : {};
      const bg = cosmicBackdrop({
        seed: (cfg.seed ?? 11) + index * 7,
        accent: cfg.accent ?? accent,
        ...cfg,
      });
      s.add(bg);
      return build(s, withPinnedBackdrop(c, bg), film);
    };
  }
  return narratedLesson({
    id,
    scenes: wrappedScenes,
    options: {
      ...CINEMATIC_FILM_OPTIONS,
      ...options,
    },
  });
}

export { assertEqual };
