// Scene 9: ttl-reads - "Every read uses the same logical instant"
// Stage 0: Zero TTL immediate expiry + value/TTL contract validation.
// Stage 1: Single-instant scan (O(n + k log k) MathJax) iterating key copy + permanent overwrite clearing deadline.
// Stage 2: Monotonic clock scope (unspecified origin, lazy cleanup, single-threaded boundary).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowCross,
  glowPill,
  glowTex,
  guardedDynamic,
  lowerFooter,
  playBeat,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function ttlReads(s, c) {
  const title = sceneHeading(['Every read uses the', 'same logical instant'], {
    accent: ROLE.workerB,
  });

  const phase = s.value(0); // 0=zero TTL, 1=scan & overwrite, 2=monotonic clock scope
  const zeroExpired = s.value(0);
  const scanFrozen = s.value(0);
  const scanDeleted = s.value(0);
  const overwritten = s.value(0);
  const originShown = s.value(0);

  const eqScan = glowTex('O(n + k\\log k)', {
    x: 615,
    y: -415,
    size: 38,
    color: COSMOS.cyan,
    glow: 7,
  });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const ph = Math.round(phase.value);
      const nodes = [];

      if (ph === 0) {
        const zExp = zeroExpired.value > 0.5;
        nodes.push(
          txt('ZERO TTL & VALUE VALIDATION', 0, -275, 26, ROLE.focus, 'mono', 'center').opacity(
            alpha,
          ),
          // Entry row
          glowPill(
            zExp
              ? 'task:1  ->  EXPIRED AT t = 10.000 (ttl = 0)'
              : 'task:1  ->  "running"  |  deadline = 10.000 s (ttl = 0)',
            0,
            -160,
            zExp ? ROLE.fail : ROLE.focus,
            { size: 28, fixedW: 1020, alpha, glow: 10 },
          ),
          glowPill('task:2  ->  "ready"  |  deadline = None (permanent)', 0, -50, ROLE.ok, {
            size: 28,
            fixedW: 1020,
            alpha,
            glow: 7,
          }),

          // Contract guards below (three floating pills side-by-side)
          glowPill('ttl <= 0 or NaN -> reject', -555, 115, ROLE.fail, {
            size: 26,
            fixedW: 480,
            alpha,
          }),
          glowPill('values must be str', 0, 115, ROLE.workerB, {
            size: 26,
            fixedW: 400,
            alpha,
          }),
          glowPill('None = missing / no TTL', 555, 115, ROLE.record, {
            size: 26,
            fixedW: 480,
            alpha,
          }),

          txt(
            'get, scan, and CAS all share one rule: expires_at <= now means expired.',
            0,
            325,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (ph === 1) {
        const frozen = scanFrozen.value > 0.5;
        const del = scanDeleted.value > 0.5;
        const perm = overwritten.value > 0.5;

        nodes.push(
          txt(
            perm
              ? 'OVERWRITING WITH A PERMANENT VALUE CLEARS THE OLD DEADLINE'
              : 'SCAN SAMPLES CLOCK ONCE & ITERATES A KEY COPY',
            0,
            -275,
            26,
            perm ? ROLE.ok : ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),

          // Frozen clock instant pill
          glowPill(
            frozen ? 'frozen scan instant:  now = 15.000 s' : 'clock:  now = 10.000 s',
            0,
            -180,
            frozen ? ROLE.focus : ROLE.workerA,
            { size: 28, fixedW: 720, alpha, glow: frozen ? 12 : 6 },
          ),
        );

        // Two key rows
        if (perm) {
          nodes.push(
            glowPill('task:1  ->  "permanent"  |  deadline = None  (CLEARED)', 0, -45, ROLE.ok, {
              size: 28,
              fixedW: 1050,
              alpha,
              glow: 12,
            }),
          );
        } else if (del) {
          nodes.push(
            glowPill('task:1  ->  DELETED (exp 15.000 <= 15.000)', 0, -45, ROLE.fail, {
              size: 28,
              fixedW: 1050,
              alpha,
              glow: 10,
            }),
          );
        } else {
          nodes.push(
            glowPill('task:1  ->  "running"  |  deadline = 15.000 s', 0, -45, ROLE.warn, {
              size: 28,
              fixedW: 1050,
              alpha,
              glow: 8,
            }),
          );
        }

        nodes.push(
          glowPill('task:2  ->  "ready"  |  deadline = None  (SURVIVES)', 0, 65, ROLE.ok, {
            size: 28,
            fixedW: 1050,
            alpha,
            glow: 8,
          }),

          glowPill('iterate list(keys) -> safe deletion', -385, 200, ROLE.workerB, {
            size: 26,
            fixedW: 640,
            alpha,
          }),
          glowPill('sort k survivors: O(n + k log k)', 385, 200, ROLE.focus, {
            size: 26,
            fixedW: 640,
            alpha,
          }),

          txt(
            perm
              ? 'Permanent overwrite replaces both the value and its previous expiration deadline.'
              : 'Sampling the clock once keeps every key in the scan consistent at one instant.',
            0,
            330,
            27,
            perm ? ROLE.ok : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: Monotonic clock scope & memory bounds
        const showO = originShown.value > 0.5;
        nodes.push(
          txt(
            'MONOTONIC CLOCK & STORE BOUNDARIES',
            0,
            -275,
            26,
            ROLE.record,
            'mono',
            'center',
          ).opacity(alpha),
          // Left: Monotonic timeline vs Right: Reboot / Machine boundary
          line([-760, -75], [-60, -75], { stroke: ROLE.workerB, width: 4 }).opacity(alpha),
          txt(
            'elapsed time only (nondecreasing)',
            -410,
            -130,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),
          txt('origin = unspecified', -410, -25, 26, ROLE.focus, 'mono', 'center').opacity(alpha),

          glowPill('NOT portable across reboots or hosts', 430, -75, ROLE.fail, {
            size: 26,
            fixedW: 690,
            alpha: showO ? alpha : 0.7 * alpha,
            glow: showO ? 11 : 4,
          }),

          glowPill('Lazy cleanup leaves unread expired rows', -430, 130, ROLE.warn, {
            size: 26,
            fixedW: 720,
            alpha,
          }),
          glowPill('Single-threaded -> add lock + eviction later', 430, 130, ROLE.record, {
            size: 26,
            fixedW: 720,
            alpha,
          }),

          txt(
            'Use monotonic clocks for local TTLs; add explicit eviction and locks when scaling up.',
            0,
            325,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'CONSISTENT LOGICAL INSTANT  ·  MONOTONIC TTL',
          ph === 2
            ? 'MONOTONIC != PERSISTENT TIMESTAMP'
            : overwritten.value > 0.5
              ? 'PERMANENT OVERWRITE CLEARS DEADLINE'
              : 'expires_at <= now',
          { accent: ph === 2 ? ROLE.record : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.record), title, layer);

  playCue(s, c, 'ci-ttl-reads-0-build', () => s.play(phase.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ci-ttl-reads-zero', () => s.play(zeroExpired.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  c.show(1, eqScan);
  playBeat(s, c, 1, () => s.play(phase.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-ttl-reads-1-build', () => s.play(phase.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ttl-freeze', () => s.play(scanFrozen.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-ttl-reads-scan', () => s.play(scanDeleted.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'ci-ttl-reads-overwrite', () => s.play(overwritten.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });

  c.hide('ci-ttl-reads-2-build', eqScan);
  playCue(s, c, 'ci-ttl-reads-2-build', () => s.play(phase.to(2, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ttl-origin', () => s.play(originShown.to(1, { duration: 0.05 })), { dur: 0.1 });
}
