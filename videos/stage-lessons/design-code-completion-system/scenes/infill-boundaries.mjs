// Scene 08: infill-boundaries - Insert only the generated middle into the same hole
// Special-token injection safety (literal marker strings encoded as ordinary text!),
// preserving return suffix, and testing both allowed & denied permission cases.
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function infillBoundaries(s, c) {
  const escOn = s.value(0);
  const insOn = s.value(0);

  const header = cinemaHeader(
    'SAFE INFILL BOUNDARIES',
    'Insert only the middle',
    'into the same hole',
    {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f59e0b16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const es = escOn.value;
      const ins = insOn.value;
      const nodes = [];

      const lx = -840;
      const rx = 80;

      // Left: Returned middle spliced cleanly above preserved suffix
      nodes.push(
        txt('1. PRESERVE SUFFIX & TEST BEHAVIOR', lx, -185, 26, ROLE.ok, 'mono', 'left'),
        txt(
          'is_allowed = graph.allows(request)',
          lx,
          -120,
          28,
          ins > 0.4 ? ROLE.ok : ROLE.ed,
          'mono',
          'left',
        ).glow(ins > 0.4 ? 7 : 0, ROLE.ok),
        txt('return is_allowed   # UNTOUCHED', lx, -64, 28, COSMOS.muted, 'mono', 'left'),
        txt('Verify stop condition, range & doc version', lx, 12, 26, COSMOS.ink, 'mono', 'left'),
        txt('Test BOTH allowed & denied permission cases!', lx, 66, 26, ROLE.focus, 'mono', 'left'),

        // Right: Literal sentinel strings inside source code encoded as ordinary text!
        line([25, -210], [25, 130], { stroke: '#2c3d66', width: 2.5 }),
        txt('2. SENTINEL TOKEN ISOLATION', rx, -185, 26, ROLE.warn, 'mono', 'left').opacity(
          0.45 + es * 0.55,
        ),
        txt(
          'Adapter wraps code with special token IDs',
          rx,
          -120,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(0.45 + es * 0.55),
        txt(
          'Literal "<|fim_middle|>" in source string:',
          rx,
          -60,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(0.45 + es * 0.55),
        txt('-> ENCODE AS ORDINARY TEXT TOKENS!', rx, -4, 26, ROLE.ok, 'mono', 'left')
          .glow(es > 0.4 ? 7 : 0, ROLE.ok)
          .opacity(0.45 + es * 0.55),
        txt(
          'Never let source code spoof prompt framing',
          rx,
          62,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(0.45 + es * 0.55),

        line([-840, 195], [840, 195], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Editor proposes source text; application runtime & tests enforce real access control',
          0,
          270,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('MIDDLE ONLY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Suffix stays pinned in buffer', 480, -378, 26, ROLE.ok, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-infill-boundaries-1', () => {
    s.play(escOn.to(1, { duration: clampDur(c, c.cue('cc-infill-boundaries-1').start, 0.35) }));
  });
  c.on('cc-insert-middle', () => {
    s.play(insOn.to(1, { duration: clampDur(c, c.cue('cc-insert-middle').start, 0.35) }));
  });
}
