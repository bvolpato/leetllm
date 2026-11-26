// Scene 14: limiter - "Injected time makes quota boundaries testable"
// Signature 3D Token Bucket Reservoir (`buildTokenBucket3d`, `wireframeSlab3d`, `surface`, `orbitScene`)
// spending 3 burst tokens at t=0, denying the 4th (wait 1.0 s), refilling 0.5 tokens at t=0.5s (wait 0.5 s),
// and admitting at t=1.0s (leaving 0 tokens), with strict A8 readout sync!
import { line } from 'vizmatic/stage';
import {
  BUCKET,
  COSMOS,
  ROLE,
  ambientClock,
  buildTokenBucket3d,
  cinemaAtmosphere,
  glowBar,
  glowDot,
  glowPill,
  glowTex,
  guardedDynamic,
  lowerFooter,
  orbitScene,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function limiter(s, c) {
  const title = sceneHeading(['Injected time makes quota', 'boundaries testable'], {
    accent: ROLE.workerB,
  });

  const amb = ambientClock(s, c);
  const elapsed = s.value(0); // 0 -> 0.5 -> 1.0
  const spent = s.value(0); // 0 -> 3 -> 4
  const decisionCode = s.value(0); // 0=idle/ready, 1=burst spent, 2=denied wait 1s, 3=refilling, 4=wait 0.5s, 5=admitted!
  const capHighlight = s.value(0);

  // Derived conserved token amount matching TokenBucket(3, 1)
  const amount = {
    get value() {
      return Math.max(
        0,
        Math.min(BUCKET.capacity, BUCKET.capacity - spent.value + elapsed.value * BUCKET.rate),
      );
    },
  };

  const view3d = buildTokenBucket3d(amount, { x: -430, y: 10 });
  const eqRate = glowTex('C = 3,\\quad r = 1\\text{ tok/s}', {
    x: 470,
    y: -410,
    size: 36,
    color: COSMOS.cyan,
    glow: 7,
  });

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const tok = amount.value;
      const tNow = elapsed.value;
      const dec = Math.round(decisionCode.value);

      const decStr =
        dec === 0
          ? 'ready (3 burst tokens)'
          : dec === 1
            ? tok > 0.05
              ? 'spending 3 burst tokens...'
              : '3 burst requests ADMITTED'
            : dec === 2
              ? '4th DENIED  ·  wait 1.0 s'
              : dec === 3
                ? 'advancing injected clock...'
                : dec === 4
                  ? 'DENIED  ·  wait 0.5 s'
                  : 'ADMITTED  ·  0.00 left';
      const decCol =
        dec === 2 || dec === 4
          ? ROLE.fail
          : dec === 1 || dec === 5
            ? ROLE.ok
            : dec === 3
              ? ROLE.focus
              : ROLE.workerB;

      const nodes = [
        // Left label above & below 3D token bucket
        txt(
          '3D TOKEN BUCKET (CAPACITY 3)',
          -430,
          -285,
          26,
          capHighlight.value > 0.5 ? ROLE.focus : ROLE.workerB,
          'mono',
          'center',
        ).opacity(alpha),
        glowPill(`${tok.toFixed(2)} / ${BUCKET.capacity} tokens`, -430, 275, ROLE.focus, {
          size: 30,
          fixedW: 450,
          alpha,
          glow: 11,
        }),

        // Right: Precision Telemetry + Horizontal Fill Gauge + Decision Readout
        line([20, -270], [20, 265], { stroke: '#29375a', width: 2 }).opacity(alpha),
        txt('INJECTED CLOCK', 100, -210, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        glowPill(`t = ${tNow.toFixed(2)} s`, 620, -210, ROLE.workerB, {
          size: 30,
          fixedW: 340,
          alpha,
          glow: 9,
        }),

        txt('REQUEST COST', 100, -105, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        glowPill('1.00 token', 620, -105, ROLE.workerA, {
          size: 28,
          fixedW: 340,
          alpha,
        }),

        // Live gauge matching 3D level exactly (Rule A8!)
        txt('CONSERVED TOKENS', 100, 0, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        glowBar(100, 56, 720, 36, tok / BUCKET.capacity, ROLE.workerB, { alpha }),
        txt('0', 100, 108, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        txt('1', 340, 108, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('2', 580, 108, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('3', 820, 108, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),

        txt('DECISION', 100, 188, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        glowPill(decStr, 545, 188, decCol, {
          size: 27,
          fixedW: 545,
          alpha,
          glow: 11,
        }),

        txt(
          dec >= 5
            ? 'At t = 1.0 s the bucket hits 1 token and admits; use a separate limit for in-flight concurrency.'
            : dec === 2 || dec === 4
              ? 'Denials never spend tokens: the partial refill stays conserved in the bucket.'
              : 'Burst spends 3 tokens at t = 0; injected time tests every fractional boundary instantly.',
          0,
          352,
          27,
          dec >= 5 ? ROLE.ok : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),

        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: ROLE.workerB,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'TOKEN BUCKET: CAPACITY 3  ·  REFILL 1 TOK/S',
          dec >= 5
            ? 't = 1.00 s: ADMITTED (0 LEFT)'
            : dec === 4
              ? 't = 0.50 s: 0.5 TOK -> WAIT 0.5 s'
              : `TOKENS = ${tok.toFixed(2)}  ·  t = ${tNow.toFixed(2)} s`,
          { accent: decCol, alpha },
        ),
      ];

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.focus), title, view3d, eqRate, layer);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.96 });

  playCue(s, c, 'limiter-beat-1-focus-1', (d) => s.play(capHighlight.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'limiter-spend-burst',
    (d) => s.play(spent.to(3, { duration: d }), decisionCode.to(1, { duration: 0.05 })),
    { dur: 1.4 },
  );
  playCue(s, c, 'limiter-denied-fourth', () => s.play(decisionCode.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Clear stale decision before advancing clock to 0.5s (Rule A8!)
  playCue(
    s,
    c,
    'limiter-half-refill',
    (d) => s.play(decisionCode.to(3, { duration: 0.05 }), elapsed.to(0.5, { duration: d })),
    { dur: 0.8 },
  );
  playCue(s, c, 'limiter-half-token', () => s.play(decisionCode.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Clear stale decision before advancing clock to 1.0s (Rule A8!)
  playCue(
    s,
    c,
    'limiter-one-clock',
    (d) => s.play(decisionCode.to(3, { duration: 0.05 }), elapsed.to(1.0, { duration: d })),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'limiter-one-second',
    (d) => s.play(spent.to(4, { duration: d }), decisionCode.to(5, { duration: 0.05 })),
    { after: true, dur: 0.4 },
  );
}
