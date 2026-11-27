// Scene 15: bucket-contract - "Refill and denial share one conserved token count"
// Signature 3D Token Bucket + MathJax refill/wait equations:
// Beat 0: Conserved refill equation + retry-after division (missing / rate).
// Beat 1: Reject cost > capacity, nonfinite/backward clock, lock lookup+refill+debit together.
// Beat 2: Premature deletion bug (empty -> delete -> fresh 3 tokens!) vs rewind -> 3 idle seconds -> safe eviction!
import { line } from 'vizmatic/stage';
import {
  BUCKET,
  COSMOS,
  ROLE,
  buildTokenBucket3d,
  cinemaAtmosphere,
  glowBar,
  glowCross,
  glowPill,
  glowTex,
  guardedDynamic,
  lowerFooter,
  orbitScene,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function bucketContract(s, c) {
  const title = sceneHeading(['Refill and denial share one', 'conserved token count'], {
    accent: ROLE.workerB,
  });

  const amount = s.value(0);
  // Phase index 0..6:
  // 0=formula, 1=refill 0.5 + wait 0.5, 2=cost>cap invalid, 3=empty idle, 4=premature delete -> 3 fresh BUG!,
  // 5=rewind to 0, 6=3 idle seconds -> safe eviction!
  const phase = s.value(0);

  const view3d = buildTokenBucket3d(amount, { x: -435, y: 15 });
  const eqRefill = glowTex('T = \\min\\!(C,\\; T_0 + \\Delta t \\cdot r)', {
    x: 425,
    y: -250,
    size: 34,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqWait = glowTex('\\text{retry-after} = \\frac{c - T}{r}', {
    x: 425,
    y: -150,
    size: 34,
    color: COSMOS.gold,
    glow: 7,
  });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const ph = Math.round(phase.value);
      const tok = amount.value;
      const isLeak = ph === 4;
      const isSafe = ph === 6;

      const statusText =
        ph === 0
          ? tok > 0.05
            ? 'refilling at 1 tok/s...'
            : 'empty bucket at t = 0.0 s'
          : ph === 1
            ? 't = 0.5 s  ->  0.5 tok  ·  wait 0.5 s'
            : ph === 2
              ? 'cost > 3  ->  REJECT (never fits!)'
              : ph === 3
                ? 'empty bucket at t = 0.0 s'
                : ph === 4
                  ? 'DELETED EARLY -> RECREATES FULL'
                  : ph === 5
                    ? 'waiting 3 idle seconds...'
                    : '3 IDLE SECONDS -> SAFE TO EVICT';
      const statusCol =
        ph === 2 || isLeak ? ROLE.fail : isSafe ? ROLE.ok : ph === 1 ? ROLE.focus : ROLE.workerB;

      const nodes = [
        txt('3D CONSERVED RESERVOIR', -435, -285, 26, ROLE.workerB, 'mono', 'center').opacity(
          alpha,
        ),
        glowPill(`${tok.toFixed(2)} / ${BUCKET.capacity} tokens`, -435, 275, statusCol, {
          size: 30,
          fixedW: 450,
          alpha,
          glow: 11,
        }),

        line([10, -270], [10, 265], { stroke: '#29375a', width: 2 }).opacity(alpha),

        // Conserved meter bar on the right below equations
        glowBar(
          85,
          -35,
          740,
          38,
          tok / BUCKET.capacity,
          isLeak ? ROLE.fail : isSafe ? ROLE.ok : ROLE.workerB,
          {
            alpha,
          },
        ),
        glowPill(statusText, 455, 72, statusCol, {
          size: 26,
          fixedW: 790,
          alpha,
          glow: 11,
        }),
      ];

      if (isLeak) {
        nodes.push(glowCross(455, 165, 34, ROLE.fail, alpha));
      } else if (ph === 2) {
        nodes.push(
          glowPill('Lock lookup + refill + debit together', 455, 185, ROLE.record, {
            size: 26,
            fixedW: 700,
            alpha,
          }),
        );
      } else if (isSafe) {
        nodes.push(
          glowPill('Recreating key matches full state (3 tokens)', 455, 185, ROLE.ok, {
            size: 26,
            fixedW: 760,
            alpha,
            glow: 10,
          }),
        );
      } else {
        nodes.push(
          glowPill('Wait assumes no competing caller first', 455, 185, COSMOS.muted, {
            size: 26,
            fixedW: 790,
            alpha: 0.85 * alpha,
            glow: 0,
            textColor: COSMOS.ink,
          }),
        );
      }

      const capText = isSafe
        ? 'Evict an idle key only after capacity / rate seconds so a recreated bucket grants no free burst.'
        : isLeak || ph === 3
          ? 'Deleting an empty bucket resets the caller to 3 free tokens.'
          : ph === 2
            ? 'Reject cost > capacity, NaN, or backward time; separate rate limits from in-flight limits.'
            : 'Refill elapsed * rate capped at capacity; never spend on denial.';

      nodes.push(
        txt(
          capText,
          0,
          352,
          27,
          isLeak ? ROLE.fail : isSafe ? ROLE.ok : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),
        lowerFooter(
          'CONSERVED TOKEN CONTRACT + SAFE EVICTION',
          isSafe
            ? 'IDLE EVICT SAFE AT t >= capacity / rate (3 s)'
            : isLeak
              ? 'EARLY DELETE LEAKS 3 FREE TOKENS'
              : 'O(1) LOOKUP  ·  O(KEYS) MEMORY',
          { accent: statusCol, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.fail), title, view3d, eqRefill, eqWait, layer);
  orbitScene(s, c, view3d, { theta: -0.25, phi: 0.96 });

  playCue(s, c, 'ci-bucket-contract-0-build', () => s.play(phase.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'bucket-refill',
    (d) => s.play(amount.to(BUCKET.events[4].tokens, { duration: d })),
    { dur: 0.9 },
  );
  playCue(s, c, 'ci-bucket-contract-wait', () => s.play(phase.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'ci-bucket-contract-1-build', () => s.play(phase.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'bucket-cost', () => s.play(phase.to(2, { duration: 0.05 })), { dur: 0.1 });

  // Beat 2: Early delete bug -> Rewind -> Safe idle eviction
  playCue(
    s,
    c,
    'ci-bucket-contract-2-build',
    (d) => s.play(phase.to(3, { duration: 0.05 }), amount.to(0, { duration: d })),
    { dur: 0.35 },
  );
  playCue(s, c, 'bucket-delete', () => s.play(phase.to(4, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'bucket-recreate', (d) => s.play(amount.to(BUCKET.capacity, { duration: d })), {
    dur: 0.7,
  });
  playCue(
    s,
    c,
    'bucket-rewind',
    (d) => s.play(phase.to(5, { duration: 0.05 }), amount.to(0, { duration: d })),
    { dur: 0.3 },
  );
  playCue(
    s,
    c,
    'ci-bucket-contract-eviction',
    (d) => s.play(amount.to(BUCKET.capacity, { duration: d })),
    { dur: 1.6 },
  );
  playCue(s, c, 'ci-bucket-contract-eviction', () => s.play(phase.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
