import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  codeNode,
  glowDot,
  guardedDynamic,
  trimSeg,
  txt,
} from '../parts.mjs';

export function buildPrivateDeployment(s, c) {
  s.add(aura(-420, -40, 560, ROLE.ok, COSMOS.bg));
  s.add(aura(460, 100, 540, ROLE.model, COSMOS.bg));

  s.add(
    cinemaHeader('DEPLOYMENT BOUNDARIES', 'Keep identity and retention', 'inside a private route', {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    }),
  );

  const localT = s.value(0);
  const policyT = s.value(0);
  c.on('cc-offline-local', () =>
    s.play(localT.to(1, { duration: clampDur(c, c.cue('cc-offline-local').start, 0.55) })),
  );
  c.on('cc-private-deployment-1', () =>
    s.play(policyT.to(1, { duration: clampDur(c, c.cue('cc-private-deployment-1').start, 0.55) })),
  );

  // Top row: 3 deployment modes
  const modes = [
    { x: -600, label: 'PRIVATE ENDPOINT', sub: 'encrypted org route', col: ROLE.gpu },
    { x: 0, label: 'SELF-HOSTED VPC', sub: 'team-managed GPUs', col: ROLE.model },
    { x: 600, label: 'OFFLINE LOCAL', sub: 'zero egress boundary', col: ROLE.ok },
  ];
  modes.forEach((m) => {
    s.add(glowDot(m.x - 160, -225, { radius: 8, color: m.col, glow: 8 }));
    s.add(txt(m.label, m.x - 134, -225, 28, m.col, 'mono', 'left'));
    s.add(txt(m.sub, m.x - 134, -184, 26, COSMOS.muted, 'mono', 'left'));
  });

  // Offline perimeter enclosure (open luminous perimeter, not a bullet card)
  s.add(
    rect(1680, 310, { fill: '#08101f', stroke: ROLE.ok, width: 3, radius: 14, dash: [10, 7] })
      .at(0, 30)
      .opacity(0.72),
  );
  s.add(txt('OFFLINE LOCAL BOUNDARY', -810, -96, 26, ROLE.ok, 'mono', 'left'));

  const pts = [
    [-580, 32],
    [-190, 32],
    [200, 32],
    [590, 32],
  ];
  const labels = [
    ['EDIT', 'local buffer'],
    ['INDEX', 'local context'],
    ['MODEL', 'licensed weights'],
    ['SERVE', 'local server'],
  ];

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const loc = localT.value;
        const pol = policyT.value;
        const nodes = [];

        for (let i = 0; i < pts.length - 1; i++) {
          const seg = trimSeg(pts[i], pts[i + 1], 106, 106);
          nodes.push(beamWithPhotons(seg, ROLE.ok, 0, { alpha: 0.45 + 0.55 * loc }));
        }
        pts.forEach((pt, idx) => {
          const { node } = codeNode(pt[0], pt[1], labels[idx][0], ROLE.ok, {
            radius: 48,
            sub: labels[idx][1],
            opacity: 0.5 + 0.5 * loc,
            glow: loc > 0.5 ? 10 : 4,
          });
          nodes.push(node);
        });

        // Bottom governance controls still owned by the team inside the boundary
        const gY = 266;
        nodes.push(
          txt(
            'CONTROLS STILL REQUIRED INSIDE THE BOUNDARY',
            -840,
            gY,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
        const controls = [
          { x: -840, t: 'REPO ACCESS + AUTH SCOPE', c: ROLE.ed },
          { x: -240, t: 'NETWORK + LOG RETENTION', c: ROLE.focus },
          { x: 340, t: 'SUPPLY CHAIN + LICENSING', c: ROLE.model },
        ];
        controls.forEach((ctrl) => {
          nodes.push(glowDot(ctrl.x + 10, gY + 56, { radius: 7, color: ctrl.c, glow: 7 }));
          nodes.push(txt(ctrl.t, ctrl.x + 34, gY + 56, 26, COSMOS.ink, 'mono', 'left'));
        });

        const pAlpha = 0.25 + 0.75 * pol;
        nodes.push(line([-860, 382], [840, 382], { stroke: '#233152', width: 2 }).opacity(pAlpha));
        nodes.push(
          txt(
            'SHARED BATCHES NEED TESTED ISOLATION (ELSE PARTITION)  |  REDACTED PROMPT = PROPRIETARY CONTEXT',
            0,
            438,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(pAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
