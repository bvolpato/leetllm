// Shared visual language, invariants, 3D systems builders, and helpers for
// `ai-lab-coding-interview-python-systems`.
// Full-bleed 1920x1080 dark-cinema style (zero slide chrome, zero em dashes, text >= 26px).
import {
  arrow,
  circle,
  curve3d,
  dynamic,
  group,
  line,
  line3d,
  linear,
  points3d,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  markDecoration,
  metricReadout,
  nebula,
  orbitScene,
  rule,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
} from '../cinematic-kit.mjs';
import {
  BUCKET,
  CLAIM,
  CRAWL,
  LEDGER,
  SCHEDULE_BLOCKED,
  SCHEDULE_RETRY,
  concurrencyChoice,
  expiryState,
  mixedWorkSchedule,
  normalizeUrl,
  parserTrace,
  protectedClaimTrace,
  serializedWorkerTrace,
} from '../../films/ai-lab-coding-interview-python-systems/arithmetic.mjs';
import { URLS } from '../../films/ai-lab-coding-interview-python-systems/fixtures.mjs';
import { validateModel } from '../../films/ai-lab-coding-interview-python-systems/model.mjs';

export {
  BUCKET,
  CLAIM,
  COSMOS,
  CRAWL,
  LEDGER,
  SCHEDULE_BLOCKED,
  SCHEDULE_RETRY,
  URLS,
  aura,
  cinematic3d,
  concurrencyChoice,
  curve3d,
  dynamic,
  expiryState,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line3d,
  linear,
  metricReadout,
  mixedWorkSchedule,
  normalizeUrl,
  orbitScene,
  parserTrace,
  points3d,
  protectedClaimTrace,
  rule,
  serializedWorkerTrace,
  surface,
  txt,
  verifyApprox,
  verifyInvariant,
  wireframeSlab3d,
};

/** Semantic color roles held constant across all 22 Python systems scenes. */
export const ROLE = Object.freeze({
  workerA: COSMOS.blue, // Worker A, primary parent, thread A
  workerB: COSMOS.cyan, // Worker B, secondary parent, thread B, stream
  ok: COSMOS.emerald, // Admitted, committed, pass, unlocked, completed
  focus: COSMOS.gold, // Lock, active focus, prediction prompt, deadline
  record: COSMOS.violet, // Stored record, receipt, snapshot, serialized payload
  fail: COSMOS.rose, // Conflict, expired, rejected, cycle, blocked, stop
  warn: COSMOS.amber, // Retry wait, backoff, caution
  ink: COSMOS.ink,
  muted: COSMOS.muted,
  dim: COSMOS.dim,
});

/** Canonical Python claim snippet used across concurrency scenes. */
export const CLAIM_LINES = Object.freeze([
  'def claim(url):',
  '    with lock:',
  '        if url in seen:',
  '            return False',
  '        seen.add(url)',
  '    return True',
  'if claim(url): fetch(url)',
]);

export const UNSAFE_LINES = Object.freeze([
  'url = "/guide"',
  'if url not in seen:',
  '    fetch(url)',
  '    seen.add(url)',
]);

export const PARSER_LINES = Object.freeze([
  '12:00|ERROR|GET|slow',
  ' timeout',
  'broken header',
  ' retry',
]);

export const EXITSTACK_LINES = Object.freeze([
  'with ExitStack() as stack:',
  '    for account in sorted(set(ids)):',
  '        lock = registry[account]',
  '        stack.enter_context(lock)',
  '    yield',
]);

export const WORKER_COND_LINES = Object.freeze([
  'with condition:',
  '    while not ready:',
  '        condition.wait()',
  '    task = claim()',
  'result = run(task)',
  'with condition:',
  '    publish(result)',
]);

/** Pure frontier helpers shared across crawler ordering scenes and invariants. */
export function traceFrontier(parents, claimOrder) {
  const origin = 'https://repo.example';
  const seen = new Set(
    ['/start', ...parents.map((parent) => parent.path)].map((path) => origin + path),
  );
  const rows = parents.map(() => []);
  for (const index of claimOrder) {
    const parent = parents[index];
    rows[index] = parent.links.map((raw, item) => {
      const url = normalizeUrl(raw, origin + parent.path);
      const admitted = url?.origin === origin && !seen.has(url.href);
      if (admitted) seen.add(url.href);
      return { raw, path: url && url.pathname + url.search, admitted, parent: index, item };
    });
  }
  return { rows, queue: rows.flat().filter((link) => link.admitted) };
}

export function bufferedFrontier(parents, returnOrder) {
  const returned = new Map(returnOrder.map((i) => [parents[i].path, parents[i].links]));
  const slots = parents.map(({ path }) => ({ path, links: returned.get(path) }));
  return traceFrontier(
    slots,
    slots.map((_, i) => i),
  );
}

/** Build-time mathematical verification of every spoken invariant across all 22 scenes. */
export function verifyPythonSystemsInvariants() {
  validateModel();

  // Crawler FIFO & link counts
  const paths = CRAWL.order.map((u) => new URL(u).pathname);
  verifyInvariant(paths.join(' ') === '/start /guide /api /faq', 'FIFO crawl order');
  const rawLinkCount = CRAWL.order.reduce((acc, u) => acc + URLS.pages[u].length, 0);
  verifyInvariant(CRAWL.order.length === 4, '4 reachable pages');
  verifyInvariant(rawLinkCount === 6, '6 raw links inspected');
  verifyInvariant(rawLinkCount + 1 === 7, 'extra duplicate API link raises link count to 7');

  // Claim race & atomic claim
  verifyInvariant(CLAIM.owners === 1, 'atomic claim yields 1 owner');
  verifyInvariant(
    CLAIM.outcomes[0] === true && CLAIM.outcomes[1] === false,
    'claim outcomes true/false',
  );
  const sortedClaim = [...CLAIM.outcomes].sort((a, b) => Number(a) - Number(b));
  verifyInvariant(
    sortedClaim[0] === false && sortedClaim[1] === true,
    'sorted barrier claim answers [False, True]',
  );
  verifyInvariant(protectedClaimTrace(3).fetches === 1, 'protected claim fetches once');

  // URL policy normalization
  const u1 = normalizeUrl('https://REPO.example:443/api?q=1#auth', URLS.start);
  const u2 = normalizeUrl('https://repo.example/api?q=1#usage', URLS.start);
  const u3 = normalizeUrl('https://repo.example/api?q=2', URLS.start);
  verifyInvariant(u1?.href === 'https://repo.example/api?q=1', 'normalize u1');
  verifyInvariant(u1?.href === u2?.href, 'fragments & default port share claim identity');
  verifyInvariant(
    u3?.href === 'https://repo.example/api?q=2' && u3.href !== u1.href,
    'query q=2 distinct',
  );
  verifyInvariant(
    normalizeUrl('https://user:pass@repo.example/api') === null,
    'reject credentials',
  );
  verifyInvariant(normalizeUrl('https://repo.example:99999/api') === null, 'reject bad port');
  verifyInvariant(normalizeUrl('https://repo.example/a\\b') === null, 'reject backslash');

  // Claim-failure & fresh-worker-plan frontier ordering
  const cfParents = [
    { path: '/guide', links: ['/shared#intro', '/faq'] },
    { path: '/api', links: ['/shared#ref', '/types'] },
  ];
  const cfEarly = traceFrontier(cfParents, [1, 0]);
  const cfOrdered = bufferedFrontier(cfParents, [1, 0]);
  verifyInvariant(
    cfEarly.queue.map((x) => x.path).join(' ') === '/faq /shared /types',
    'early worker claim order',
  );
  verifyInvariant(
    cfOrdered.queue.map((x) => x.path).join(' ') === '/shared /faq /types',
    'buffered parent-order claim',
  );

  const planParents = [
    { path: '/setup', links: ['/help#top', '/help?v=2'] },
    { path: '/cli', links: ['/help#end', '/tips'] },
  ];
  const planCliFirst = bufferedFrontier(planParents, [1, 0]);
  const planSetupFirst = bufferedFrontier(planParents, [0, 1]);
  verifyInvariant(
    planCliFirst.queue.map((x) => x.path).join(' ') === '/help /help?v=2 /tips',
    'plan CLI-first frontier',
  );
  verifyInvariant(
    planSetupFirst.queue.map((x) => x.path).join(' ') === '/help /help?v=2 /tips',
    'plan setup-first frontier matches',
  );

  // Expiry & TTL boundary
  const expBefore = expiryState(14.999);
  const expAt = expiryState(15);
  const expZero = expiryState(10, { ttl: 0 });
  verifyInvariant(expBefore.value === 'running' && !expBefore.expired, '14.999s is live');
  verifyInvariant(expAt.value === null && expAt.expired && !expAt.stored, '15.000s expired');
  verifyInvariant(expZero.expired && expZero.value === null, 'zero TTL expires immediately');

  // Scheduler retry vs blocked
  verifyInvariant(
    SCHEDULE_RETRY.executed.join(' ') === 'docs test test deploy',
    '2-attempt scheduler executes deploy after retry',
  );
  verifyInvariant(
    SCHEDULE_RETRY.completed.join(' ') === 'docs test deploy',
    '2-attempt scheduler completes all 3',
  );
  verifyInvariant(
    SCHEDULE_BLOCKED.executed.join(' ') === 'docs test' &&
      SCHEDULE_BLOCKED.failed.join(' ') === 'test' &&
      SCHEDULE_BLOCKED.blocked.join(' ') === 'deploy',
    '1-attempt scheduler marks test failed and deploy blocked',
  );

  // Token bucket
  verifyInvariant(BUCKET.capacity === 3 && BUCKET.rate === 1, 'bucket cap=3 rate=1');
  verifyApprox(BUCKET.events[3].retryAfter, 1, 1e-9, '4th request waits 1s');
  verifyApprox(BUCKET.events[4].tokens, 0.5, 1e-9, '0.5s refills 0.5 tokens');
  verifyApprox(BUCKET.events[4].retryAfter, 0.5, 1e-9, '0.5s still waits 0.5s');
  verifyInvariant(
    BUCKET.events[5].allowed && BUCKET.events[5].tokens === 0,
    '1s admitted leaves 0',
  );

  // Ledger
  verifyInvariant(LEDGER[1].balance === 100 && LEDGER[1].returned === 100, 'deposit-1 balance 100');
  verifyInvariant(
    LEDGER[2].balance === 70 && LEDGER[2].events.length === 2,
    'withdraw-1 balance 70',
  );
  verifyInvariant(
    LEDGER[3].returned === 100 && LEDGER[3].balance === 70 && LEDGER[3].events.length === 2,
    'replay deposit-1 returns 100 while balance stays 70',
  );
  verifyInvariant(
    LEDGER[4].action === 'conflict' && LEDGER[4].balance === 70,
    'conflict leaves 70',
  );

  // Parser trace
  const pt = parserTrace(PARSER_LINES);
  verifyInvariant(pt[0].records[0].message === 'GET|slow', 'third pipe belongs to message');
  verifyInvariant(pt[1].records[0].message === 'GET|slow timeout', 'continuation appends timeout');
  verifyInvariant(pt[2].current === null, 'broken header clears current');
  verifyInvariant(
    pt[3].records[0].message === 'GET|slow timeout' && pt[3].action === 'ignore orphan',
    'orphan retry ignored',
  );

  // Concurrency schedules & serialization
  const sched31 = mixedWorkSchedule({ jobs: 2, wait: 3, cpu: 1 });
  verifyInvariant(sched31.serial === 8 && sched31.overlapped === 5, '3s wait + 1s CPU: 8s vs 5s');
  const sched41 = mixedWorkSchedule({ jobs: 2, wait: 4, cpu: 1 });
  verifyInvariant(sched41.serial === 10 && sched41.overlapped === 6, '4s wait + 1s CPU: 10s vs 6s');
  const ser = serializedWorkerTrace();
  verifyInvariant(ser.id === 't7' && ser.result === 49, 't7 returns 49');
  verifyInvariant(concurrencyChoice('network-wait').length === 2, 'network-wait choices');
  verifyInvariant(concurrencyChoice('python-compute').length === 2, 'python-compute choices');
}

/** Convert 6-digit hex + alpha (0..1) to 8-digit #rrggbbaa hex. */
export function hexAlpha(hex, alpha = 1) {
  const clean = String(hex || '#ffffff')
    .replace('#', '')
    .slice(0, 6);
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${a}`;
}

/** Soft layered cosmic atmosphere pinned behind scene geometry. */
export function cinemaAtmosphere(primary = ROLE.workerB, secondary = ROLE.workerA) {
  return markDecoration(
    group(
      nebula(-480, -150, 500, hexAlpha(primary, 0.14), hexAlpha(primary, 0.03)),
      nebula(490, 160, 460, hexAlpha(secondary, 0.12), hexAlpha(secondary, 0.03)),
    ).zIndex(-90),
  );
}

/** Floating cinema scene heading positioned cleanly in upper-left safe zone (no banner chrome). */
export function sceneHeading(
  lines,
  { accent = ROLE.workerB, eyebrow = null, subtitle = null, size = 48, lineHeight = 56 } = {},
) {
  return heroTitle(Array.isArray(lines) ? lines : [lines], {
    x: -855,
    y: eyebrow ? -460 : -445,
    size,
    lineHeight,
    accent,
    eyebrow,
    subtitle,
  });
}

/**
 * Scene-relative cue scheduler using `c.at(...)` (NEVER `s.at(...)`).
 * Automatically clamps animation duration inside the scene window so no animation overruns.
 */
export function playCue(s, c, id, fn, { after = false, dur = 0.45, pad = 0.04 } = {}) {
  const cue = c.cue(id);
  if (!cue) return;
  const startAbs = after ? cue.end : cue.start;
  const rel = Math.max(0.02, startAbs - c.start + pad);
  const maxDur = Math.max(0.06, c.end - c.start - rel - 0.14);
  const safeDur = Math.min(dur, maxDur);
  c.at(rel, () => fn(safeDur, cue));
}

/** Scene-relative beat-start scheduler using `c.at(...)`. */
export function playBeat(s, c, beatIdx, fn, { dur = 0.45, pad = 0.04 } = {}) {
  const beat = c.beats?.[beatIdx];
  if (!beat) return;
  const rel = Math.max(0.02, beat.start - c.start + pad);
  const maxDur = Math.max(0.06, c.end - c.start - rel - 0.14);
  const safeDur = Math.min(dur, maxDur);
  c.at(rel, () => fn(safeDur, beat));
}

/** Continuous ambient scene clock value 0 -> 1 bounded safely inside the scene window. */
export function ambientClock(s, c) {
  const span =
    Number.isFinite(c.end) && Number.isFinite(c.start) ? Math.max(3, c.end - c.start - 0.45) : 20;
  const t = s.value(0);
  c.at(0.05, () => s.play(t.to(1, { duration: span, ease: linear })));
  return t;
}

/** Luminous halo ring node. */
export function glowRing(
  x,
  y,
  r,
  color,
  { width = 3, glow = 8, fillAlpha = 0, dash = null, alpha = 1 } = {},
) {
  const style = {
    fill: fillAlpha > 0 ? hexAlpha(color, fillAlpha * alpha) : '#00000000',
    stroke: hexAlpha(color, alpha),
    width,
  };
  if (dash) style.dash = dash;
  const node = circle(r, style).at(x, y);
  return glow > 0 ? node.glow(glow, color) : node;
}

/** Luminous translucent capsule pill with opaque dark backing so background rails never bleed through text. */
export function glowPill(
  textStr,
  x,
  y,
  color,
  {
    size = 26,
    padX = 32,
    padY = 18,
    alpha = 1,
    glow = 6,
    minW = 120,
    fixedW = null,
    font = 'mono',
    textColor = null,
  } = {},
) {
  const str = String(textStr);
  const factor = font === 'mono' ? 0.72 : 0.62;
  const naturalW = Math.ceil(str.length * size * factor) + padX * 2;
  const w = fixedW ? Math.max(fixedW, naturalW) : Math.max(minW, naturalW);
  const h = size + padY * 2;
  return group(
    rect(w, h, {
      radius: h / 2,
      fill: COSMOS.bg,
      stroke: null,
    })
      .at(x, y)
      .opacity(alpha),
    rect(w, h, {
      radius: h / 2,
      fill: hexAlpha(color, 0.14 * alpha),
      stroke: hexAlpha(color, 0.85 * alpha),
      width: 2.4,
    })
      .at(x, y)
      .glow(glow, color),
    txt(str, x, y, size, textColor ?? color, font, 'center').opacity(alpha),
  );
}

/** Luminous actor orb with safe radius padding and subtitle positioned cleanly below. */
export function actorOrb(x, y, r, color, title, sub = '', { alpha = 1, active = false } = {}) {
  const safeR = Math.max(r, Math.ceil((String(title).length * 26 * 0.62) / 2) + 26);
  const nodes = [
    circle(safeR + 12, {
      fill: '#00000000',
      stroke: hexAlpha(color, (active ? 0.55 : 0.22) * alpha),
      width: 2,
    }).at(x, y),
    circle(safeR, {
      fill: hexAlpha(color, (active ? 0.24 : 0.12) * alpha),
      stroke: color,
      width: active ? 4 : 2.8,
    })
      .at(x, y)
      .glow(active ? 14 : 6, color),
    txt(title, x, y, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
  ];
  if (sub) {
    nodes.push(txt(sub, x, y + safeR + 40, 26, color, 'mono', 'center').opacity(0.92 * alpha));
  }
  return group(...nodes);
}

/** Glowing X mark for broken links, conflicts, or dropped packets. */
export function glowCross(x, y, size = 34, color = ROLE.fail, alpha = 1) {
  const h = size / 2;
  return group(
    line([x - h, y - h], [x + h, y + h], { stroke: color, width: 6 }).glow(10, color),
    line([x - h, y + h], [x + h, y - h], { stroke: color, width: 6 }).glow(10, color),
  ).opacity(alpha);
}

/** Glowing straight directional arrow. */
export function glowArrow(
  x1,
  y1,
  x2,
  y2,
  color,
  { width = 3.5, alpha = 1, dash = null, glow = 6 } = {},
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 14;
  const wing = 8;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const p1 = [bx - uy * wing, by + ux * wing];
  const p2 = [bx + uy * wing, by - ux * wing];
  const lineStyle = dash ? { stroke: color, width, dash } : { stroke: color, width };
  return group(
    line([x1, y1], [x2, y2], lineStyle).glow(glow, color),
    line(p1, [x2, y2], { stroke: color, width }).glow(glow, color),
    line(p2, [x2, y2], { stroke: color, width }).glow(glow, color),
  ).opacity(alpha);
}

/** Glowing curved Bezier arc arrow. */
export function glowArcArrow(
  p0,
  p1,
  liftY = -65,
  { color = ROLE.workerB, width = 3.4, glow = 8, alpha = 1 } = {},
) {
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2 + liftY;
  const pts = [];
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * p0[0] + 2 * u * t * mx + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * my + t * t * p1[1],
    ]);
  }
  const trail = glowingTrail(pts, { color, width, glow, opacity: alpha });
  const tip = arrow(pts[steps - 2], pts[steps], { stroke: color, width, tip: 13 }).opacity(alpha);
  return group(trail, tip);
}

/** Glowing horizontal progress / gauge bar. */
export function glowBar(x, y, w, h, frac, color, { alpha = 1, track = '#1c2742' } = {}) {
  const clamped = Math.max(0, Math.min(1, frac));
  const fw = w * clamped;
  const nodes = [
    rect(w, h, {
      radius: h / 2,
      fill: hexAlpha(track, 0.55 * alpha),
      stroke: hexAlpha(color, 0.38 * alpha),
      width: 1.6,
    }).at(x + w / 2, y),
  ];
  if (fw > 4) {
    nodes.push(
      rect(fw, h, {
        radius: h / 2,
        fill: hexAlpha(color, 0.82 * alpha),
        stroke: null,
      })
        .at(x + fw / 2, y)
        .glow(8, color),
    );
  }
  return group(...nodes);
}

/**
 * Floating Python code spotlight without rectangular slide-card chrome.
 * Renders a subtle vertical rail on the left and a glowing beam behind active line(s).
 */
export function codeSpotlight(
  lines,
  x,
  y,
  {
    lineH = 50,
    size = 26,
    activeLines = [],
    activeColor = ROLE.focus,
    beamW = 640,
    alpha = 1,
  } = {},
) {
  const activeSet = new Set(Array.isArray(activeLines) ? activeLines : [activeLines]);
  const topY = y - lineH * 0.45;
  const botY = y + (lines.length - 1) * lineH + lineH * 0.45;
  const nodes = [
    line([x - 24, topY], [x - 24, botY], { stroke: '#2c3a5e', width: 3 }).opacity(alpha),
  ];
  lines.forEach((src, i) => {
    const ly = y + i * lineH;
    const isActive = activeSet.has(i);
    if (isActive) {
      nodes.push(
        rect(beamW, lineH - 6, {
          radius: 10,
          fill: hexAlpha(activeColor, 0.14 * alpha),
          stroke: null,
        }).at(x + beamW / 2 - 12, ly),
        line([x - 24, ly - lineH * 0.36], [x - 24, ly + lineH * 0.36], {
          stroke: activeColor,
          width: 6,
        })
          .glow(10, activeColor)
          .opacity(alpha),
      );
    }
    const col = isActive ? activeColor : activeSet.size > 0 ? COSMOS.muted : COSMOS.ink;
    nodes.push(txt(src, x, ly, size, col, 'mono', 'left').opacity(alpha));
  });
  return group(...nodes);
}

/** Quiet persistent lower-canvas anchor bar (prevents empty-space warnings without chrome). */
export function lowerFooter(
  leftText,
  rightText,
  { y = 456, accent = ROLE.workerB, alpha = 0.88 } = {},
) {
  return group(
    rule(-855, y - 34, 855, y - 34, hexAlpha(accent, 0.5), 1.8).opacity(alpha),
    txt(leftText, -855, y + 2, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    txt(rightText, 855, y + 2, 26, accent, 'mono', 'right').opacity(alpha),
  );
}

/**
 * Orbiting 3D complexity manifold for `state-objects`:
 * compares linear O(V + E) graph traversal against O(A V log V) retry heap growth.
 */
export function buildComplexityManifold3d(modeVal, { x = -330, y = 20 } = {}) {
  const half = 2.6;
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.2,
    unit: 96,
    focus: [0, 0, 0.8],
  }).at(x, y);

  const surf = surface(
    (wx, wy) => {
      const u = (wx + half) / (2 * half);
      const v = (wy + half) / (2 * half);
      const linearH = 0.18 + 0.95 * (0.55 * u + 0.45 * v);
      const heapH = 0.18 + 1.55 * u * Math.log2(1 + 3.5 * v + 1.0) * (0.45 + 0.55 * v);
      const mix = Math.max(0, Math.min(1, modeVal.value));
      return linearH * (1 - mix) + heapH * mix;
    },
    {
      x: [-half, half],
      y: [-half, half],
      resolution: [30, 30],
      colors: ['#0a1228', '#153463', '#1c6d92', '#5ce1e6', '#6ee7b7', '#ffd166'],
      mesh: '#7ce8ff',
      meshOpacity: 0.24,
      meshWidth: 0.65,
      opacity: 0.88,
    },
  );

  const grid = [];
  for (let k = -2; k <= 2; k++) {
    const p = k * 1.2;
    grid.push(
      line3d([p, -half, 0.02], [p, half, 0.02], { color: '#3b4e7a', width: 1.2, opacity: 0.4 }),
      line3d([-half, p, 0.02], [half, p, 0.02], { color: '#3b4e7a', width: 1.2, opacity: 0.4 }),
    );
  }

  const ridge = curve3d(
    (t) => {
      const wx = -half + 2 * half * t;
      const wy = -half + 2 * half * t;
      const mix = Math.max(0, Math.min(1, modeVal.value));
      const linearH = 0.22 + 0.95 * t;
      const heapH = 0.22 + 1.55 * t * Math.log2(1 + 3.5 * t + 1.0) * (0.45 + 0.55 * t);
      return [wx, wy, linearH * (1 - mix) + heapH * mix + 0.06];
    },
    { domain: [0, 1], color: COSMOS.gold, width: 4, glow: 10, blend: 'screen', onTop: true },
  );

  view.add(...grid, surf, ridge);
  return view;
}

/**
 * Orbiting 3D atomic lock chamber for `claim` and `lock-order`:
 * wireframe lock slab enclosing shared set state with glowing A/B entry trajectories.
 */
export function buildLockChamber3d(lockActiveVal, { x = 350, y = 10 } = {}) {
  const view = cinematic3d({
    theta: -0.72,
    phi: 1.04,
    distance: 14.5,
    unit: 98,
    focus: [0, 0, 0.5],
  }).at(x, y);

  const grid = [];
  for (let k = -2; k <= 2; k++) {
    const p = k * 1.25;
    grid.push(
      line3d([p, -2.5, -0.8], [p, 2.5, -0.8], { color: '#2b3b60', width: 1.1, opacity: 0.38 }),
      line3d([-2.5, p, -0.8], [2.5, p, -0.8], { color: '#2b3b60', width: 1.1, opacity: 0.38 }),
    );
  }

  const vault = wireframeSlab3d([0, 0, 0.45], 1.15, 0.95, 0.72, {
    color: COSMOS.gold,
    width: 3.0,
    glow: 10,
  });

  const innerState = wireframeSlab3d([0, 0, 0.45], 0.52, 0.48, 0.36, {
    color: COSMOS.emerald,
    width: 2.4,
    glow: 8,
  });

  const pathA = curve3d(
    (t) => [
      -2.4 + 4.8 * t,
      -0.85 * Math.cos(t * Math.PI * 0.5),
      0.45 + 0.4 * Math.sin(t * Math.PI),
    ],
    { domain: [0, 1], color: COSMOS.blue, width: 3.8, glow: 9, blend: 'screen', onTop: true },
  );

  const pathB = curve3d(
    (t) => [
      -2.4 + 3.2 * t,
      0.95 + 0.7 * Math.sin(t * Math.PI),
      0.45 - 0.35 * Math.sin(t * Math.PI) * (0.4 + 0.6 * lockActiveVal.value),
    ],
    { domain: [0, 1], color: COSMOS.cyan, width: 3.4, glow: 8, blend: 'screen', onTop: true },
  );

  view.add(...grid, ...vault, ...innerState, pathA, pathB);
  return view;
}

/**
 * Orbiting 3D luminous token bucket chamber for `limiter` and `bucket-contract`:
 * outer wireframe capacity-3 vessel + dynamic inner glowing token slab rising/falling with `amountVal`.
 */
export function buildTokenBucket3d(amountVal, { x = -390, y = 15 } = {}) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.05,
    distance: 14.4,
    unit: 96,
    focus: [0, 0, 1.0],
  }).at(x, y);

  const grid = [];
  for (let k = -2; k <= 2; k++) {
    const p = k * 1.1;
    grid.push(
      line3d([p, -2.2, 0], [p, 2.2, 0], { color: '#2b3b60', width: 1.1, opacity: 0.4 }),
      line3d([-2.2, p, 0], [2.2, p, 0], { color: '#2b3b60', width: 1.1, opacity: 0.4 }),
    );
  }

  // Outer capacity-3 wireframe cylinder-slab (z = 0..2.7)
  const outer = wireframeSlab3d([0, 0, 1.35], 1.15, 1.15, 1.35, {
    color: COSMOS.cyan,
    width: 2.6,
    glow: 7,
  });

  // Capacity tick rings at 1, 2, 3 tokens
  const ticks = [0.9, 1.8].flatMap((z) => [
    line3d([-1.2, -1.2, z], [1.2, -1.2, z], { color: '#4c6599', width: 1.6, opacity: 0.65 }),
    line3d([1.2, -1.2, z], [1.2, 1.2, z], { color: '#4c6599', width: 1.6, opacity: 0.65 }),
    line3d([1.2, 1.2, z], [-1.2, 1.2, z], { color: '#4c6599', width: 1.6, opacity: 0.65 }),
    line3d([-1.2, 1.2, z], [-1.2, -1.2, z], { color: '#4c6599', width: 1.6, opacity: 0.65 }),
  ]);

  // Dynamic glowing token fill slab scaling vertically with amountVal (0..3)
  const levelZ = () => Math.max(0.05, (Math.max(0, Math.min(3, amountVal.value)) / 3) * 2.55);
  const inner = wireframeSlab3d(() => [0, 0, levelZ() * 0.5 + 0.04], 0.96, 0.96, 0.04, {
    color: COSMOS.gold,
    width: 3.4,
    glow: 11,
  });

  // Glowing top surface plane that rises/falls smoothly with token count
  const topSurface = surface(() => levelZ(), {
    x: [-0.96, 0.96],
    y: [-0.96, 0.96],
    resolution: [10, 10],
    colors: ['#164e63', '#5ce1e6', '#6ee7b7'],
    mesh: '#ffd166',
    meshOpacity: 0.35,
    meshWidth: 0.9,
    opacity: 0.82,
  });

  view.add(...grid, ...outer, ...ticks, ...inner, topSurface);
  return view;
}
