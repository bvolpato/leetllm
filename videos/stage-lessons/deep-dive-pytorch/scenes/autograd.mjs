// Scene 06: Backward needs the value that forward actually used (L=x^2 at x=3 -> version 0 -> detached alias bumps version 1 -> clone isolates).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function autograd(s, c) {
  const mode = s.value(0); // 0=valid x=3 v0, 1=alias mutation x=4 v1 rejected, 2=clone x=3/clone=4 grad=6
  const focus = s.value(0);

  const bgAura = aura(-200, 30, 560, '#a78bfa20', '#fb718518');
  const title = heroTitle(['Backward Needs', 'the Saved Version'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'SAVED TENSOR VERSION COUNTER',
  });

  const formula = glowTex('\\left.\\frac{d(x^2)}{dx}\\right|_{x=3} = 2x = 6', {
    x: 420,
    y: -380,
    size: 40,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);

    // Left: live y = x^2 curve with tangent at x = 3
    const ox = -690;
    const oy = 185;
    const sx = 128; // x in [0, 4.5]
    const sy = 20; // y in [0, 16]
    const px = (xv) => ox + xv * sx;
    const py = (yv) => oy - yv * sy;

    const curvePts = [];
    for (let i = 0; i <= 40; i++) {
      const xv = (i / 40) * 4.2;
      curvePts.push([px(xv), py(xv * xv)]);
    }

    const nodes = [
      // Axes
      line([ox - 20, oy], [px(4.4), oy], { stroke: COSMOS.muted, width: 2.4 }),
      line([ox, oy + 20], [ox, py(18)], { stroke: COSMOS.muted, width: 2.4 }),
      txt('x', px(4.55), oy, 26, COSMOS.muted, 'mono', 'left'),
      txt('x²', ox, py(19.2), 26, COSMOS.muted, 'mono'),
      glowingTrail(curvePts, { color: ROLE.orig, width: 3.4, core: false }),

      // Tangent at x=3, slope 6 (from x=1.7 to x=4.1)
      line([px(1.7), py(9 - 6 * 1.3)], [px(4.1), py(9 + 6 * 1.1)], {
        stroke: m === 1 ? ROLE.bad : ROLE.good,
        width: 3.2,
        dash: m === 1 ? [8, 6] : undefined,
      }).glow(6, m === 1 ? ROLE.bad : ROLE.good),
      glowDot(px(3), py(9), { radius: 10, color: COSMOS.gold }),
      txt('(3, 9)  slope = 6', px(3) - 18, py(9) - 34, 26, COSMOS.gold, 'mono', 'right'),
    ];

    if (m >= 1) {
      nodes.push(
        glowDot(px(4), py(16), { radius: 10, color: m === 1 ? ROLE.bad : ROLE.copy }),
        txt(
          m === 1 ? 'mutated x=4!' : 'clone = 4',
          px(4) - 18,
          py(16) - 24,
          26,
          m === 1 ? ROLE.bad : ROLE.copy,
          'mono',
          'right',
        ),
      );
    }

    // Right: Version & Storage state cards
    const curVal = m === 1 ? 4 : 3;
    const curVer = m === 1 ? 1 : 0;
    nodes.push(
      glassCell(365, -135, 760, 148, ROLE.orig, { fill: '#0f1b33', glow: m === 0 ? 10 : 4 }),
      txt('SAVED FOR BACKWARD', 365, -176, 26, COSMOS.muted, 'mono'),
      txt('x = 3.0   |   saved_version = 0', 365, -118, 30, COSMOS.gold, 'mono'),

      glassCell(365, 42, 760, 148, m === 1 ? ROLE.bad : m === 2 ? ROLE.good : ROLE.copy, {
        fill: m === 1 ? '#2d1222' : m === 2 ? '#0d2924' : '#0f1e30',
        glow: 10,
      }),
      txt(
        m === 1
          ? 'DETACHED ALIAS: x.detach().add_(1)'
          : m === 2
            ? 'CLONE: x.detach().clone().add_(1)'
            : 'CURRENT STORAGE',
        365,
        0,
        26,
        m === 1 ? ROLE.bad : m === 2 ? ROLE.good : ROLE.copy,
        'mono',
      ),
      txt(
        m === 1
          ? `storage = ${curVal}   |   current_version = ${curVer}  !=  0`
          : m === 2
            ? 'orig x = 3 (v0)  |  clone = 4 (isolated)'
            : `storage = ${curVal}   |   current_version = ${curVer}  ==  0`,
        365,
        58,
        28,
        m === 1 ? ROLE.bad : COSMOS.ink,
        'mono',
      ),

      glassCell(365, 212, 760, 128, m === 1 ? ROLE.bad : ROLE.good, {
        fill: m === 1 ? '#2d1222' : '#0d2924',
        glow: 8,
      }),
      txt(
        m === 1
          ? 'BACKWARD REJECTED (version mismatch)'
          : m === 2
            ? 'grad = 6.0 preserved  ·  gradcheck PASS'
            : 'BACKWARD VALID  ->  dL/dx = 6.0',
        365,
        212,
        26,
        m === 1 ? ROLE.bad : ROLE.good,
        'mono',
      ),
    );

    nodes.push(
      txt(
        'detach() stops grad history, NOT storage sharing; use detach().clone() before writing',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);

  c.on('autograd-beat-1-focus-1', () => s.play(focus.to(1, { duration: 0.3 })));
  c.on('autograd-beat-1-focus-2', () => s.play(focus.to(2, { duration: 0.3 })));
  c.on('pt-autograd-0', () => s.play(mode.to(0, { duration: 0.25 })));
  c.on('autograd-beat-2-focus-1', () => s.play(focus.to(3, { duration: 0.3 })));
  c.on('autograd-beat-2-focus-2', () => s.play(focus.to(4, { duration: 0.3 })));
  c.on('pt-autograd-1', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'pt-autograd-1', 0.4) })),
  );
  c.on('autograd-beat-3-focus-1', () => s.play(focus.to(5, { duration: 0.3 })));
  c.on('autograd-beat-3-focus-2', () => s.play(focus.to(6, { duration: 0.3 })));
  c.on('pt-autograd-2', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'pt-autograd-2', 0.4) })),
  );
}
