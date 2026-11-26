// Scene 07: cache-bytes - Build one token of cache before multiplying the histories
// Luminous MathJax derivation: 2 * 32 layers * 8 KV heads * 128 dim * 2 bytes = 131,072 B (128 KiB),
// scaled by unequal history sums, decimal GB vs GiB, and Llama-3 8B checkpoint constraint.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  MEM_BUDGET,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function cacheBytes(s, c) {
  const phase = s.value(0);
  const multOn = s.value(0);
  const compOn = s.value(0);

  const header = cinemaHeader('FIRST-PRINCIPLES KV MATH', 'Build one token', 'of KV cache first', {
    x: -860,
    y: -445,
    accent: ROLE.req,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const eq = glowTex(
    '\\text{KV}_{\\text{tok}} = 2 \\times 32 \\times 8 \\times 128 \\times 2\\text{ B} = 131{,}072\\text{ B} = 128\\text{ KiB}',
    { size: 34, color: ROLE.focus, glow: 8 },
  ).at(100, -145);

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ml = multOn.value;
      const cp = compOn.value;
      const nodes = [];

      // Factor breakdown row
      const factors = [
        { x: -640, top: '2', sub: 'K + V', col: ROLE.req },
        { x: -340, top: '32', sub: 'layers', col: ROLE.policy },
        { x: -40, top: '8', sub: 'KV heads', col: ROLE.ok },
        { x: 260, top: '128', sub: 'head dim', col: ROLE.worker },
        { x: 580, top: '2 B', sub: 'BF16', col: ROLE.focus },
      ];
      factors.forEach((f) => {
        nodes.push(
          txt(f.top, f.x, -25, 36, f.col, 'mono', 'center').glow(6, f.col),
          txt(f.sub, f.x, 24, 26, COSMOS.muted, 'mono', 'center'),
        );
      });

      // Scaling & unit conversion rules
      const y2 = 140;
      const mlAlpha = 0.4 + ml * 0.6;
      nodes.push(
        line([-840, 82], [840, 82], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'SCALE BY SUM OF RETAINED TOKENS (PROMPT + OUTPUT)',
          -840,
          y2,
          26,
          ROLE.req,
          'mono',
          'left',
        ).opacity(mlAlpha),
        txt(
          'Decimal GB = bytes / 10^9   ·   Binary GiB = bytes / 2^30',
          -840,
          y2 + 52,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(mlAlpha),
        txt(
          `16 × 2,048 tok:  32 heads = ${MEM_BUDGET.mhaGb.toFixed(1)} GB  vs  8 heads = ${MEM_BUDGET.gqaGb.toFixed(1)} GB`,
          -840,
          y2 + 114,
          28,
          cp > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ).glow(cp > 0.4 ? 7 : 0, ROLE.ok),
        txt(
          'Llama-3 8B uses 32 Q heads sharing 8 KV heads (32 KV heads = different checkpoint!)',
          -840,
          y2 + 170,
          26,
          cp > 0.4 ? ROLE.warn : COSMOS.dim,
          'sans',
          'left',
        ),
      );

      // Top-right unit reminder
      nodes.push(
        txt('SEPARATE WEIGHT TERM', 480, -425, 26, ROLE.worker, 'mono', 'center'),
        txt('params × bytes/param = 16 GB', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.focus,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, eq, view);
  driftValue(s, c, phase, 4.2);

  c.on('sd-cache-bytes-1-operation', () => {
    s.play(
      multOn.to(1, { duration: clampDur(c, c.cue('sd-cache-bytes-1-operation').start, 0.35) }),
    );
  });
  c.on('sd-cache-bytes-2-operation', () => {
    s.play(compOn.to(1, { duration: clampDur(c, c.cue('sd-cache-bytes-2-operation').start, 0.4) }));
  });
}
