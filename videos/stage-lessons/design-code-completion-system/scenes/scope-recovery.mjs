// Scene 04: scope-recovery - Keep a preceding header separate from enclosing scope
// Tree-sitter incremental syntax-node range vs naive upward text scan after dedenting past a function!
import { group, line } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function scopeRecovery(s, c) {
  const dedentOn = s.value(0);

  const header = cinemaHeader(
    'INCREMENTAL SYNTAX SCOPE',
    'Preceding header !=',
    'enclosing scope',
    {
      x: -860,
      y: -445,
      accent: ROLE.ed,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const dd = dedentOn.value;
      const nodes = [];

      // Left: Python source buffer with blue Tree-sitter function range bracket
      const lx = -820;
      const fnTop = -175;
      const fnBot = 10;
      nodes.push(
        line([lx - 26, fnTop], [lx - 26, fnBot], { stroke: ROLE.gpu, width: 5 }).glow(8, ROLE.gpu),
        txt('def check_access(graph, req):', lx, -150, 28, ROLE.gpu, 'mono', 'left'),
        txt('    is_allowed = ', lx, -88, 28, dd < 0.5 ? ROLE.focus : COSMOS.ink, 'mono', 'left'),
        txt('    return is_allowed', lx, -26, 28, COSMOS.ink, 'mono', 'left'),
        txt(
          dd > 0.4 ? 'audit_flag = |   <-- DEDENTED OUTSIDE FUNCTION!' : 'audit_flag = True',
          lx,
          75,
          28,
          dd > 0.4 ? ROLE.focus : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Right: Naive Text Scan vs Tree-Sitter Syntax Node
      const rx = 140;
      nodes.push(
        line([80, -200], [80, 140], { stroke: '#2c3d66', width: 2.5 }),
        txt('NAIVE UPWARD TEXT SCAN', rx, -160, 26, ROLE.fail, 'mono', 'left'),
        txt('Finds "def check_access" above!', rx, -106, 26, ROLE.fail, 'mono', 'left'),
        txt('(also fooled by strings / multiline)', rx, -58, 26, COSMOS.muted, 'mono', 'left'),

        txt('TREE-SITTER ENCLOSING NODE', rx, 24, 26, ROLE.ok, 'mono', 'left'),
        txt(
          dd > 0.4 ? 'Function range ENDS above caret -> module!' : 'Parses incomplete line live!',
          rx,
          78,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).glow(dd > 0.4 ? 7 : 0, ROLE.ok),
      );

      nodes.push(
        txt('THREE DISTINCT OWNERS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Tree-sitter: scope  ·  LSP: types  ·  ACL: files',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([-840, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'Use Tree-sitter enclosing AST nodes for scope, LSP for types, and repo ACLs for file access',
          0,
          275,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-scope-dedent', () => {
    s.play(dedentOn.to(1, { duration: clampDur(c, c.cue('cc-scope-dedent').start, 0.4) }));
  });
}
