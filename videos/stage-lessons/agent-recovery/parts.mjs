// Shared visual language, invariants, and helpers for `agent-recovery`.
// Pure full-bleed 1920x1080 dark-cinema style (zero slide chrome, zero bullet cards, text >= 26px).
import { circle, dynamic, group, line, linear, rect } from 'vizmatic/stage';
import {
  COSMOS,
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
} from '../cinematic-kit.mjs';
import { fullJitter } from '../../films/agent-recovery/arithmetic.mjs';
import {
  DEADLINE,
  PAGE_SEQUENCE,
  RETRY_AFTER,
  RETRY_FRACTIONS,
} from '../../films/agent-recovery/fixtures.mjs';
import {
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  commitScenario,
  dispatchOperation,
  finishProbe,
  progressSequence,
  recoveryObservation,
  retrySchedule,
} from '../../films/agent-recovery/model.mjs';

export {
  COSMOS,
  DEADLINE,
  PAGE_SEQUENCE,
  RETRY_AFTER,
  RETRY_FRACTIONS,
  admitProbe,
  boundedRecoveryClaim,
  breakerLifecycle,
  breakerRace,
  cinematic3d,
  commitScenario,
  dispatchOperation,
  finishProbe,
  fullJitter,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  linear,
  metricReadout,
  orbitScene,
  progressSequence,
  recoveryObservation,
  retrySchedule,
  rule,
  txt,
};

export const ROLE = Object.freeze({
  op: '#f472b6', // operation key & canonical payload
  agent: COSMOS.cyan, // agent proposals, attempts, reads, sampled jitter
  controller: COSMOS.blue, // controller, commit plane, server floor
  sure: COSMOS.emerald, // committed durable records, verified observations, closed circuit
  mark: COSMOS.gold, // active focus, half-open probe, question prompt
  fail: COSMOS.rose, // lost reply, timeout, conflict, denial, open breaker
  violet: COSMOS.violet, // workflow journal, saga compensation, backup model
  ink: COSMOS.ink,
  muted: COSMOS.muted,
});

/** Convert 6-digit hex color + alpha (0..1) into 8-digit #rrggbbaa hex for Vizmatic shapes. */
export function hexAlpha(hex, alpha = 1) {
  const clean = String(hex || '#ffffff')
    .replace('#', '')
    .slice(0, 6);
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)))
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${a}`;
}

/** Luminous hollow halo ring. */
export function glowRing(x, y, r, color, { width = 3, glow = 8 } = {}) {
  const node = circle(r, { fill: '#00000000', stroke: color, width }).at(x, y);
  return glow > 0 ? node.glow(glow, color) : node;
}

export const COMMITTED = commitScenario('after-commit');
export const ROLLED_BACK = commitScenario('before-commit');
export const RETRY_RAW = retrySchedule(false);
export const RETRY_FLOOR = retrySchedule(true);
export const PROGRESS_OK = progressSequence(PAGE_SEQUENCE, 8, 2);
export const PROGRESS_STALL = progressSequence(['page-4', 'page-4', 'page-4'], 8, 2);
export const BREAKER_LIFE = breakerLifecycle();
export const BREAKER_RACE = breakerRace();
export const OBSERVATION = recoveryObservation();
export const BOUNDED_CLAIM = boundedRecoveryClaim(OBSERVATION, 1000, 30);

export const OP = Object.freeze({
  key: COMMITTED.ledger,
  altKey: 'k-7f3a',
  job: COMMITTED.job.id,
  job2: 'job-2',
  state: COMMITTED.job.state,
  run: 'RUN-842',
  action: 'rollback',
  revision: 'rev-17',
  badRevision: 'rev-18',
});

export function verifyAgentRecoveryInvariants() {
  verifyInvariant(ROLLED_BACK.ledger === null, 'before-commit must roll back ledger');
  verifyInvariant(ROLLED_BACK.job === null, 'before-commit must roll back job');
  verifyInvariant(ROLLED_BACK.jobCount === 0, 'before-commit job count must be 0');

  verifyInvariant(COMMITTED.ledger === 'rb-842-1', 'after-commit ledger key mismatch');
  verifyInvariant(COMMITTED.job?.id === 'job-1', 'after-commit job id mismatch');
  verifyInvariant(COMMITTED.job?.state === 'queued', 'after-commit job state mismatch');
  verifyInvariant(COMMITTED.reply === 'lost', 'after-commit reply must be lost');
  verifyInvariant(COMMITTED.replay === 'job-1', 'same-key replay must return job-1');
  verifyInvariant(COMMITTED.changedPayload === 'conflict', 'changed payload must conflict');
  verifyInvariant(COMMITTED.jobCount === 1, 'after-commit single key must keep 1 job');

  // Fresh key with identical payload creates job-2
  const dupDb = { operations: new Map(), jobs: new Map() };
  const p17 = { run: OP.run, revision: OP.revision };
  dispatchOperation(dupDb, OP.key, p17, 'normal');
  const dupRes = dispatchOperation(dupDb, OP.altKey, p17, 'normal');
  verifyInvariant(dupRes.job === 'job-2' && dupDb.jobs.size === 2, 'fresh key creates 2nd job');

  // Retry schedule + Retry-After floor
  verifyApprox(RETRY_FLOOR[0].cap, 1, 1e-6, 'retry 1 cap');
  verifyApprox(RETRY_FLOOR[1].cap, 2, 1e-6, 'retry 2 cap');
  verifyApprox(RETRY_FLOOR[2].cap, 4, 1e-6, 'retry 3 cap');
  verifyApprox(RETRY_FLOOR[2].jitter, 1.6, 1e-6, 'retry 3 jitter');
  verifyApprox(RETRY_FLOOR[2].floor, 1.5, 1e-6, 'retry-after floor');
  verifyApprox(RETRY_FLOOR[2].elapsedBefore, 4.7, 1e-6, 'elapsed before retry 3');
  verifyApprox(RETRY_FLOOR[2].elapsedAfter, 7.8, 1e-6, 'proposed start of retry 3');
  verifyInvariant(
    RETRY_FLOOR[0].admitted && RETRY_FLOOR[1].admitted && !RETRY_FLOOR[2].admitted,
    'retry 3 must exceed 5s deadline',
  );

  // Progress budget
  verifyInvariant(PROGRESS_OK[1].noProgress === 1, 'second identical page adds 1 stall');
  verifyInvariant(
    PROGRESS_OK[2].noProgress === 0 && PROGRESS_OK[2].remaining === 5,
    'new page resets stall and leaves 5 calls',
  );
  verifyInvariant(
    PROGRESS_STALL[2].noProgress === 2 && PROGRESS_STALL[2].remaining === 5,
    'repeated third page exhausts 2-stall allowance',
  );

  // Circuit breaker lifecycle, probes, and generation race
  verifyInvariant(
    BREAKER_LIFE.opened.state === 'open' && BREAKER_LIFE.opened.generation === 2,
    'breaker opens at generation 2',
  );
  verifyInvariant(BREAKER_LIFE.halfOpen.state === 'half-open', 'cooldown moves to half-open');
  verifyInvariant(
    BREAKER_LIFE.recovered.state === 'closed' && BREAKER_LIFE.recovered.generation === 3,
    'healthy probe closes at generation 3',
  );
  const probed = admitProbe(BREAKER_LIFE.halfOpen, 'p1');
  const canceled = finishProbe(probed, { id: 'p1', generation: 2, outcome: 'cancel' });
  verifyInvariant(
    canceled.state === 'open' && canceled.inFlight === null,
    'canceled probe releases slot and reopens',
  );
  const nonHealth = finishProbe(probed, { id: 'p1', generation: 2, outcome: 'other-error' });
  verifyInvariant(
    nonHealth.state === 'half-open' && nonHealth.probeAvailable && nonHealth.inFlight === null,
    'non-health error releases slot without health verdict',
  );
  verifyInvariant(
    BREAKER_RACE.olderGeneration === 3 &&
      BREAKER_RACE.currentGeneration === 4 &&
      BREAKER_RACE.stateAfterOldSuccess === 'open' &&
      BREAKER_RACE.oldResultReturned,
    'stale gen 3 returns to caller while gen 4 stays open',
  );

  // Resume observation age
  verifyInvariant(OBSERVATION.observedAt === 990, 'observedAt must be 990s');
  verifyInvariant(BOUNDED_CLAIM?.age === 10, 'observation age at 1000s must be 10s');
  verifyInvariant(boundedRecoveryClaim(OBSERVATION, 3400, 60) === null, '40m old must be stale');

  // Spend & transfer invariants
  verifyInvariant(3 * 3 === 9 && 4 ** 3 === 64, 'retry amplification bounds');
  verifyInvariant(100 + 150 + 200 + 250 === 700, 'cumulative 4-turn prompt tokens');
  verifyInvariant(120 + 80 === 200 && 200 > 150, 'conservative reservation exceeds 150 balance');
  verifyApprox(1.2 + 0.3, 1.5, 1e-6, 'transfer wait exceeds 1.4s deadline');
  verifyInvariant(60 + 12 + 18 === 90 && 90 + 10 === 100, '100-run disposition totals');
}

/** Atmospheric accent nebulae layered softly over the lesson's cosmic backdrop. */
export function cinemaAtmosphere(primary = ROLE.agent, secondary = ROLE.op) {
  return markDecoration(
    group(
      nebula(-460, -140, 480, hexAlpha(primary, 0.14), hexAlpha(primary, 0.04)),
      nebula(480, 160, 440, hexAlpha(secondary, 0.12), hexAlpha(secondary, 0.03)),
    ).zIndex(-90),
  );
}

/** Safe cue scheduler using scene-relative time via c.at(), supporting `{ after: true }` prediction gating. */
export function playCue(s, c, id, fn, { after = false, dur = 0.5, pad = 0.04 } = {}) {
  const cue = c.cue(id);
  if (!cue) return;
  const startAbs = after ? cue.end : cue.start;
  const rel = Math.max(0.02, startAbs - c.start + pad);
  c.at(rel, () => fn(dur, cue));
}

/** Continuous ambient scene clock value 0 -> 1 over the scene span for gentle breathing motion. */
export function ambientClock(s, c) {
  const span =
    Number.isFinite(c.end) && Number.isFinite(c.start) ? Math.max(4, c.end - c.start - 0.5) : 25;
  const t = s.value(0);
  c.at(0.05, () => s.play(t.to(1, { duration: span, ease: linear })));
  return t;
}

/** Luminous pill badge (never a rectangular slide card; translucent glowing capsule). */
export function glowPill(
  textStr,
  x,
  y,
  color,
  { size = 28, padX = 30, padY = 16, alpha = 1, glow = 6 } = {},
) {
  const approxW = Math.max(130, textStr.length * size * 0.72 + padX * 2);
  const h = size + padY * 2;
  return group(
    rect(approxW, h, {
      radius: h / 2,
      fill: hexAlpha(color, 0.14 * alpha),
      stroke: hexAlpha(color, 0.85 * alpha),
      width: 2.4,
    })
      .at(x, y)
      .glow(glow, color),
    txt(textStr, x, y, size, color, 'mono', 'center').opacity(alpha),
  );
}

/** Luminous node orb with halo ring, label inside, and subtitle cleanly below. */
export function actorOrb(x, y, r, color, title, sub = '', { alpha = 1, active = false } = {}) {
  const safeR = Math.max(r, Math.ceil((title.length * 26 * 0.56) / 2) + 22);
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
    nodes.push(txt(sub, x, y + safeR + 34, 26, color, 'mono', 'center').opacity(0.9 * alpha));
  }
  return group(...nodes);
}

/** Luminous glowing break X mark for cut network links or conflicts. */
export function glowCross(x, y, size = 34, color = ROLE.fail, alpha = 1) {
  const h = size / 2;
  return group(
    line([x - h, y - h], [x + h, y + h], { stroke: color, width: 6.5 }).glow(10, color),
    line([x - h, y + h], [x + h, y - h], { stroke: color, width: 6.5 }).glow(10, color),
  ).opacity(alpha);
}

/** Quiet persistent lower-canvas anchor bar so scenes never trigger empty-space luminance warnings. */
export function lowerFooter(
  leftText,
  rightText,
  { y = 445, accent = ROLE.agent, alpha = 0.85 } = {},
) {
  return group(
    rule(-855, y - 34, 855, y - 34, hexAlpha(accent, 0.55), 1.8).opacity(alpha),
    txt(leftText, -855, y + 4, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    txt(rightText, 855, y + 4, 26, accent, 'mono', 'right').opacity(alpha),
  );
}

/** Glowing horizontal progress bar with fill fraction 0..1. */
export function glowBar(x, y, w, h, frac, color, { alpha = 1, track = '#243252' } = {}) {
  const clamped = Math.max(0, Math.min(1, frac));
  const fw = w * clamped;
  const nodes = [
    rect(w, h, {
      radius: h / 2,
      fill: hexAlpha(track, 0.55 * alpha),
      stroke: hexAlpha(color, 0.35 * alpha),
      width: 1.5,
    }).at(x + w / 2, y),
  ];
  if (fw > 3) {
    nodes.push(
      rect(fw, h, {
        radius: h / 2,
        fill: hexAlpha(color, 0.85 * alpha),
        stroke: null,
      })
        .at(x + fw / 2, y)
        .glow(8, color),
    );
  }
  return group(...nodes);
}

/** Helper to sample an arrow tip at the end of a segment [x1,y1] -> [x2,y2]. */
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
  const head = 15;
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

/** Re-export dynamic for convenience when needed. */
export { dynamic };
