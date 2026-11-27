// Scene 03: route-policy - Apply semantic availability and actual upload permission
// Truth table from route(): strict Boolean True required for REMOTE FIM ("False", null, 1 stay LOCAL!),
// plus 200ms inline vs 500ms multiline p95 latency targets.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  route,
  txt,
} from '../parts.mjs';

export default function routePolicy(s, c) {
  const permOn = s.value(0);
  const gwOn = s.value(0);

  const header = cinemaHeader(
    'STRICT ROUTE & UPLOAD POLICY',
    'Apply type availability',
    '& boolean upload gate',
    {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const pm = permOn.value;
      const gw = gwOn.value;
      const nodes = [];

      const lx = -840;
      const rows = [
        {
          trig: 'dot "."  (type known)',
          perm: 'True',
          out: route('.', true, true),
          col: ROLE.ok,
          y: -150,
        },
        {
          trig: 'assign "=" (no type)',
          perm: 'True (bool)',
          out: route('=', false, true),
          col: ROLE.gpu,
          y: -75,
        },
        {
          trig: 'assign "=" (no type)',
          perm: '"False" (str!)',
          out: route('=', false, 'False'),
          col: ROLE.warn,
          y: 0,
        },
        {
          trig: 'assign "=" (no type)',
          perm: '1 (int!) / None',
          out: route('=', false, 1),
          col: ROLE.warn,
          y: 75,
        },
      ];

      nodes.push(
        txt('TRIGGER & SEMANTIC', lx, -215, 26, COSMOS.muted, 'mono', 'left'),
        txt('UPLOAD PERMISSION', -220, -215, 26, COSMOS.muted, 'mono', 'left'),
        txt('ROUTE DECISION', 340, -215, 26, ROLE.focus, 'mono', 'left'),
      );
      rows.forEach((r, i) => {
        const alpha = i >= 2 ? 0.45 + pm * 0.55 : 1;
        nodes.push(
          txt(r.trig, lx, r.y, 26, COSMOS.ink, 'mono', 'left').opacity(alpha),
          txt(r.perm, -220, r.y, 26, i >= 2 ? ROLE.fail : ROLE.ok, 'mono', 'left').opacity(alpha),
          txt(r.out, 340, r.y, 26, r.col, 'mono', 'left').opacity(alpha),
        );
      });

      nodes.push(
        txt('p95 LATENCY TARGETS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Inline: 200 ms  ·  Multiline: 500 ms', 480, -378, 26, ROLE.ed, 'mono', 'center'),
        line([-840, 155], [840, 155], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'ONLY STRICT BOOLEAN True OPENS REMOTE FIM · STRINGS & INTS STAY LOCAL',
          0,
          225,
          26,
          pm > 0.4 ? ROLE.ok : ROLE.focus,
          'mono',
          'center',
        ),
        txt(
          gw > 0.4
            ? 'Gateway independently verifies caller identity, repo read access & upload policy!'
            : 'Next-edit suggestions predict where to edit; coding agents plan multi-file changes',
          0,
          285,
          26,
          gw > 0.4 ? ROLE.ed : COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-route-permission', () => {
    s.play(permOn.to(1, { duration: clampDur(c, c.cue('cc-route-permission').start, 0.35) }));
  });
  c.on('cc-route-policy-2', () => {
    s.play(gwOn.to(1, { duration: clampDur(c, c.cue('cc-route-policy-2').start, 0.35) }));
  });
}
