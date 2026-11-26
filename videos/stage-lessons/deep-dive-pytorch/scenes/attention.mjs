// Scene 07: Which values reach this query? SDPA dot->scale->softmax->value sum, boolean mask, and 1-query cached prefix position!
import { group } from 'vizmatic/stage';
import {
  ATTN_OUT_BOTH,
  ATTN_SCORES,
  ATTN_WEIGHTS_BOTH,
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function attention(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=dot, 2=scale, 3=softmax, 4=mix, 5=h-val, 6=v-val
  const masked = s.value(0); // 1=block k1 -> [1, 0], out=(10,0)
  const askCached = s.value(0);
  const revCached = s.value(0); // 1=allow both keys at pos 1!

  const bgAura = aura(320, 40, 540, '#5ce1e61e', '#60a5fa1c');
  const title = heroTitle(['Which Values Reach', 'This Query?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.copy,
    eyebrow: 'SDPA MASKING · CACHED PREFIX ALIGNMENT',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const mk = masked.value;
    const ac = askCached.value;
    const rc = revCached.value;
    const p = phase.value;

    const isMasked = mk > 0.5 && rc < 0.5;
    const w0 = isMasked ? 1.0 : ATTN_WEIGHTS_BOTH[0];
    const w1 = isMasked ? 0.0 : ATTN_WEIGHTS_BOTH[1];
    const outX = isMasked ? 10.0 : ATTN_OUT_BOTH[0];
    const outY = isMasked ? 0.0 : ATTN_OUT_BOTH[1];

    const nodes = [
      // Left: Key Strip + Scores + Softmax weights
      txt(
        rc > 0.5
          ? 'QUERY AT POS 1: BOTH CACHED KEYS VISIBLE'
          : ac > 0.5
            ? '1 QUERY AT POS 1 vs 2 CACHED KEYS (PREDICT)'
            : isMasked
              ? 'BOOLEAN MASK = [True, False]'
              : 'Q = [1, 0]   vs   K0 = [1, 0],  K1 = [0, 1]',
        -410,
        -225,
        26,
        rc > 0.5 ? ROLE.good : ac > 0.5 ? COSMOS.gold : isMasked ? ROLE.bad : ROLE.copy,
        'mono',
      ),

      // Key 0 card
      glassCell(-635, -72, 390, 232, ROLE.orig, { fill: '#0f1d36', glow: 8 }),
      txt('KEY 0  (pos 0)', -635, -142, 28, ROLE.orig, 'mono'),
      txt(
        st >= 2 ? `score: ${ATTN_SCORES[0].toFixed(2)}` : st >= 1 ? 'dot: 1.0' : 'K0 = [1, 0]',
        -635,
        -88,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt('V0 = (10, 0)', -635, -38, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 3 ? `weight: ${(w0 * 100).toFixed(1)}%` : 'weight: ...',
        -635,
        10,
        26,
        ROLE.orig,
        'mono',
      ),

      // Key 1 card
      glassCell(-185, -72, 390, 232, isMasked ? ROLE.bad : ROLE.grad, {
        fill: isMasked ? '#2b1220' : '#1b1433',
        glow: isMasked ? 10 : 6,
      }),
      txt('KEY 1  (pos 1)', -185, -142, 28, isMasked ? ROLE.bad : ROLE.grad, 'mono'),
      txt(
        isMasked
          ? 'MASKED (False)'
          : st >= 2
            ? 'score: 0.00'
            : st >= 1
              ? 'dot: 0.0'
              : 'K1 = [0, 1]',
        -185,
        -88,
        26,
        isMasked ? ROLE.bad : COSMOS.ink,
        'mono',
      ),
      txt('V1 = (0, 20)', -185, -38, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 3 ? `weight: ${(w1 * 100).toFixed(1)}%` : 'weight: ...',
        -185,
        10,
        26,
        isMasked ? ROLE.bad : ROLE.grad,
        'mono',
      ),

      // Softmax share bar
      rect(760, 44, { fill: '#10182b', stroke: COSMOS.muted, width: 1.8, radius: 8 }).at(-410, 115),
    ];

    if (st >= 3) {
      const bar0 = Math.max(8, 752 * w0);
      const bar1 = Math.max(0, 752 * w1);
      nodes.push(
        rect(bar0, 38, { fill: ROLE.orig, radius: 6 })
          .at(-786 + bar0 * 0.5, 115)
          .opacity(0.85),
      );
      if (bar1 > 4) {
        nodes.push(
          rect(bar1, 38, { fill: ROLE.grad, radius: 6 })
            .at(-786 + bar0 + bar1 * 0.5, 115)
            .opacity(0.85),
        );
      }
    }

    // Right: 2D Value Output Vector Plane (x in [0, 12], y in [0, 12])
    const ox = 230;
    const oy = 210;
    const sc = 42;
    nodes.push(
      txt('2D VALUE MIXTURE OUTPUT', 490, -225, 28, COSMOS.gold, 'mono'),
      line([ox, oy], [ox + 12 * sc, oy], { stroke: COSMOS.muted, width: 2.6 }),
      line([ox, oy], [ox, oy - 10 * sc], { stroke: COSMOS.muted, width: 2.6 }),
      txt('x (V0)', ox + 11.4 * sc, oy + 36, 26, ROLE.orig, 'mono'),
      txt('y (V1)', ox - 54, oy - 9.4 * sc, 26, ROLE.grad, 'mono'),
    );

    if (st >= 4) {
      const tipX = ox + outX * sc;
      const tipY = oy - outY * sc;
      // Horizontal component from V0
      nodes.push(line([ox, oy], [tipX, oy], { stroke: ROLE.orig, width: 4.5 }).glow(7, ROLE.orig));
      // Vertical component from V1
      if (outY > 0.2) {
        nodes.push(
          line([tipX, oy], [tipX, tipY], { stroke: ROLE.grad, width: 4.5 }).glow(7, ROLE.grad),
        );
      }
      // Resultant vector
      nodes.push(
        line([ox, oy], [tipX, tipY], { stroke: COSMOS.gold, width: 5.0 }).glow(10, COSMOS.gold),
        glowDot(tipX, tipY, { radius: 11, color: COSMOS.gold }),
        txt(`(${outX.toFixed(1)}, ${outY.toFixed(1)})`, tipX, tipY - 38, 28, COSMOS.gold, 'mono'),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 295, { radius: 6, color: rc > 0.5 ? ROLE.good : ROLE.copy }),
      txt(
        rc > 0.5
          ? 'Upper-left is_causal=True hides K1; cached decode at pos 1 needs both keys allowed'
          : ac > 0.5
            ? 'Predict: if this 1 query sits at cached position 1, which keys should it read?'
            : 'Compare output against this math mixture with dropout=0 before profiling kernels',
        0,
        365,
        28,
        rc > 0.5 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('dot-pair', () => s.play(step.to(1, { duration: remainDuration(c, 'dot-pair', 0.35) })));
  c.on('scale-pair', () => s.play(step.to(2, { duration: remainDuration(c, 'scale-pair', 0.35) })));
  c.on('mix-shares', () => s.play(step.to(3, { duration: remainDuration(c, 'mix-shares', 0.35) })));
  c.on('mix-vectors', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'mix-vectors', 0.35) })),
  );
  c.on('horizontal-value', () =>
    s.play(step.to(5, { duration: remainDuration(c, 'horizontal-value', 0.3) })),
  );
  c.on('vertical-value', () =>
    s.play(step.to(6, { duration: remainDuration(c, 'vertical-value', 0.3) })),
  );
  c.on('block-second', () =>
    s.play(masked.to(1, { duration: remainDuration(c, 'block-second', 0.4) })),
  );
  c.on('remix-one', () => s.play(masked.to(1, { duration: 0.2 })));
  c.on('axis-output', () => s.play(masked.to(1, { duration: 0.2 })));
  c.on('cached-question', () =>
    s.play(askCached.to(1, { duration: remainDuration(c, 'cached-question', 0.35) })),
  );
  c.after('attention-cached-position', () =>
    s.play(revCached.to(1, { duration: remainDuration(c, 'attention-cached-position', 0.45) })),
  );
  c.after('cached-mix', () => s.play(revCached.to(1, { duration: 0.2 })));
}
