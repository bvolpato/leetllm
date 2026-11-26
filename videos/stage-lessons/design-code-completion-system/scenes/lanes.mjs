// Scene 02: lanes - Who can finish this line?
// Comparing 3 completion lanes: Local LSP member lookup ("graph."), Remote FIM expression infill
// (when upload permitted), and Slower Coding Agent (multi-file edits + tests).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function lanes(s, c) {
  const phase = s.value(0);
  const assignOn = s.value(0);
  const sendOn = s.value(0);
  const stayOn = s.value(0);

  const header = cinemaHeader('COMPLETION ROUTING LANES', 'Who can finish', 'this line?', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const as = assignOn.value;
      const sn = sendOn.value;
      const st = stayOn.value;
      const nodes = [];

      const lx = -840;
      const rx = 80;
      nodes.push(
        txt('LANE 1: LOCAL LSP MEMBER LOOKUP', lx, -185, 26, ROLE.ok, 'mono', 'left'),
        txt('Buffer: "is_allowed = graph.|"', lx, -125, 26, COSMOS.ink, 'mono', 'left'),
        txt('LSP knows type(graph) -> offers allows()', lx, -72, 26, ROLE.ok, 'mono', 'left'),
        txt('Runs on laptop · zero upload · instant', lx, -20, 26, COSMOS.muted, 'mono', 'left'),
        txt('No type info? Local index still finds names', lx, 36, 26, ROLE.ed, 'mono', 'left'),

        line([25, -210], [25, 110], { stroke: '#2c3d66', width: 2.5 }),
        txt('LANE 2: REMOTE FIM EXPRESSION INFILL', rx, -185, 26, ROLE.gpu, 'mono', 'left').opacity(
          0.45 + as * 0.55,
        ),
        txt('Buffer: "is_allowed = |"', rx, -125, 26, COSMOS.ink, 'mono', 'left').opacity(
          0.45 + as * 0.55,
        ),
        txt(
          'Needs expression fitting return below!',
          rx,
          -72,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(0.45 + as * 0.55),
        txt(
          st > 0.4
            ? 'No upload perm -> KEEP BUFFER LOCAL!'
            : sn > 0.4
              ? 'Upload permitted -> send prefix + suffix'
              : 'Gateway enforces repo upload policy',
          rx,
          -12,
          26,
          st > 0.4 ? ROLE.warn : ROLE.gpu,
          'mono',
          'left',
        ).opacity(0.45 + as * 0.55),

        line([-840, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('LANE 3: SLOWER CODING AGENT PATH', 0, 225, 26, ROLE.model, 'mono', 'center'),
        txt(
          'Multi-file refactors & test runs belong off the inline keystroke path',
          0,
          280,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ),
        txt('GATEWAY AUTHORITY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Checks caller access + upload policy', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('lanes-assignment', () => {
    s.play(assignOn.to(1, { duration: clampDur(c, c.cue('lanes-assignment').start, 0.35) }));
  });
  c.on('lanes-send', () => {
    s.play(sendOn.to(1, { duration: clampDur(c, c.cue('lanes-send').start, 0.35) }));
  });
  c.on('lanes-stay', () => {
    s.play(stayOn.to(1, { duration: clampDur(c, c.cue('lanes-stay').start, 0.35) }));
  });
}
