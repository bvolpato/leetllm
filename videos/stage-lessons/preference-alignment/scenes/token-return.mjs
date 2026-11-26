// Scene 07: A single terminal score reaches earlier decisions (KL-shaped token trajectory + backward GAE + forward KL)
import {
  COSMOS,
  GAE_FULL,
  GAE_HALF,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tokenReturn(s, c) {
  const phase = s.value(0);
  const sDrift = s.value(0);
  const sTerm = s.value(0);
  const sKlNeg = s.value(0);
  const sKlExp = s.value(0);
  const sGaeEq = s.value(0);
  const sGaeBack = s.value(0);
  const sExInit = s.value(0);
  const sFull = s.value(0);
  const sHalf = s.value(0);

  const bgAura = aura(0, 10, 620, '#14385c26', '#2e1a4a18');
  const title = heroTitle(['A Single Terminal Score', 'Reaches Earlier Decisions'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'TOKEN-LEVEL KL SHAPING & GENERALIZED ADVANTAGE ESTIMATION (GAE)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const dr = Math.max(0.75, sDrift.value);
    const tm = sTerm.value;
    const ke = sKlExp.value;
    const gb = sGaeBack.value;
    const ex = sExInit.value;
    const fu = sFull.value;
    const ha = sHalf.value;

    const xs = [-620, -210, 200];
    const tokY = -118;

    const nodes = [
      txt(
        '3-TOKEN GENERATED TRAJECTORY (IMMEDIATE REWARDS + BACKWARD GAE)',
        -855,
        -218,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    xs.forEach((cx, i) => {
      const isLast = i === 2;
      const col = isLast && tm > 0.2 ? COSMOS.emerald : COSMOS.cyan;
      const rewardLabel =
        ex > 0.2
          ? `R_${i} = ${isLast ? '1.0' : '0.0'}`
          : isLast && tm > 0.2
            ? '-beta d_2 + r(x,y)'
            : `-beta * d_${i} (KL)`;
      const advVal =
        ha > 0.3
          ? GAE_HALF.advantages[i].toFixed(2)
          : fu > 0.3
            ? GAE_FULL.advantages[i].toFixed(2)
            : '?';

      nodes.push(
        glassCell(cx, tokY, 344, 126, col, {
          fill: isLast && tm > 0.2 ? '#0e2824' : '#0f2138',
          glow: isLast && tm > 0.2 ? 10 * pulse : 5,
          opacity: dr,
        }),
        txt(`TOKEN t = ${i}${isLast ? ' (EOS)' : ''}`, cx, tokY - 34, 26, col, 'mono'),
        txt(rewardLabel, cx, tokY + 20, 26, COSMOS.ink, 'mono'),

        // Advantage pill beneath each token
        glassCell(
          cx,
          tokY + 122,
          344,
          76,
          ha > 0.3 ? COSMOS.gold : fu > 0.3 ? COSMOS.emerald : COSMOS.dim,
          {
            fill: '#141a2e',
            glow: fu > 0.3 || ha > 0.3 ? 8 : 3,
            opacity: Math.max(0.75, gb),
          },
        ),
        txt(
          ha > 0.3
            ? `A_${i} (lam=0.5) = ${advVal}`
            : fu > 0.3
              ? `A_${i} (lam=1.0) = ${advVal}`
              : `A_${i} = d_${i} + gl A_${i + 1}`,
          cx,
          tokY + 124,
          26,
          ha > 0.3 ? COSMOS.gold : fu > 0.3 ? COSMOS.emerald : COSMOS.muted,
          'mono',
        ),
      );

      if (i < 2) {
        nodes.push(
          line([cx + 178, tokY], [xs[i + 1] - 178, tokY], { stroke: COSMOS.rule, width: 2.6 }),
        );
      }
    });

    // Backward GAE propagation arcs (t=2 -> t=1 -> t=0)
    if (gb > 0.1) {
      nodes.push(
        glowingArc([200, tokY + 164], [-210, tokY + 164], 54, {
          color: COSMOS.gold,
          width: 3.4,
          opacity: gb,
          glow: 9,
        }),
        glowingArc([-210, tokY + 164], [-620, tokY + 164], 54, {
          color: COSMOS.gold,
          width: 3.4,
          opacity: gb,
          glow: 9,
        }),
        glowDot(200 - ((p * 110) % 410), tokY + 190, {
          radius: 6,
          color: COSMOS.gold,
          opacity: gb,
        }),
      );
    }

    // Right side: Terminal vs Truncated boundary + KL sign check
    const rx = 625;
    nodes.push(
      glassCell(rx, -118, 455, 198, sKlNeg.value > 0.2 ? COSMOS.violet : COSMOS.dim, {
        fill: '#1b1430',
        glow: ke > 0.3 ? 9 * pulse : 4,
      }),
      txt('FORWARD KL >= 0', rx, -182, 26, COSMOS.violet, 'mono'),
      txt('pi=[0.8, 0.2] vs [0.5, 0.5]', rx, -132, 26, COSMOS.ink, 'mono'),
      txt('log ratios: +0.470, -0.916', rx, -84, 26, COSMOS.cyan, 'mono'),
      txt(
        ke > 0.2 ? 'E_pi[log(pi/ref)] = +0.193' : 'Single sample can be < 0',
        rx,
        -38,
        26,
        COSMOS.gold,
        'mono',
      ),

      glassCell(rx, 108, 455, 152, COSMOS.amber, {
        fill: '#23190f',
        glow: 5,
      }),
      txt('BOUNDARY RULE', rx, 62, 26, COSMOS.amber, 'mono'),
      txt('True EOS: V(s_{T+1}) = 0', rx, 108, 26, COSMOS.emerald, 'mono'),
      txt('Truncated: bootstrap V', rx, 154, 26, COSMOS.rose, 'mono'),

      // Bottom summary
      txt(
        ha > 0.3
          ? 'Rewards [0, 0, 1], V=0, gamma=1 -> lam=1: [1, 1, 1]  |  lam=0.5: [0.25, 0.5, 1]'
          : 'Add sequence reward r(x, y) ONCE at the final token, then sweep GAE backward',
        -855,
        396,
        28,
        ha > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  const eqGae = glowTex(
    '\\delta_t = R_t + \\gamma V(s_{t+1}) - V(s_t), \\qquad \\hat{A}_t = \\delta_t + \\gamma\\lambda \\hat{A}_{t+1}',
    {
      x: -200,
      y: 282,
      size: 36,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqGae);
  runPhase(s, c, phase, 14);

  c.on('token-return-b0', () =>
    s.play(sDrift.to(1, { duration: remainDuration(c, 'token-return-b0', 0.5) })),
  );
  c.on('pa-terminal-once', () =>
    s.play(sTerm.to(1, { duration: remainDuration(c, 'pa-terminal-once', 0.5) })),
  );
  c.on('token-return-b1', () =>
    s.play(sKlNeg.to(1, { duration: remainDuration(c, 'token-return-b1', 0.5) })),
  );
  c.on('pa-kl-expectation', () =>
    s.play(sKlExp.to(1, { duration: remainDuration(c, 'pa-kl-expectation', 0.5) })),
  );
  c.on('token-return-b2', () =>
    s.play(sGaeEq.to(1, { duration: remainDuration(c, 'token-return-b2', 0.45) })),
  );
  c.on('pa-gae-backward', () =>
    s.play(sGaeBack.to(1, { duration: remainDuration(c, 'pa-gae-backward', 0.6) })),
  );
  c.on('token-return-b3', () =>
    s.play(sExInit.to(1, { duration: remainDuration(c, 'token-return-b3', 0.45) })),
  );
  c.on('pa-gae-full', () =>
    s.play(sFull.to(1, { duration: remainDuration(c, 'pa-gae-full', 0.45) })),
  );
  c.on('pa-gae-half', () =>
    s.play(sHalf.to(1, { duration: remainDuration(c, 'pa-gae-half', 0.45) })),
  );
}
