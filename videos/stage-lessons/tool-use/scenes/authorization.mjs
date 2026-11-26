// Scene 9: authorization - Resolve permission in trusted runtime state
// Orbiting 3D Trusted Session / Policy Shield / Resource Vault rig contrasting public
// availability read (emerald pass) vs private borrowing history read (rose shield deflect).
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  authorize,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  energyRail,
  fadeInNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function authorization(s, c) {
  const pulse = s.value(0);
  const sessionOn = s.value(0);
  const checkActionOn = s.value(0);
  const readsCheckOn = s.value(0);
  const privateBlockOn = s.value(0);
  const publicPassOn = s.value(0);

  const lenaLookup = authorize({ reader: 'lena' }, 'lookup', 'B7');

  const header = cinemaHeader(
    'TRUSTED AUTHORIZATION BOUNDARY',
    'Resolve permission in',
    'trusted runtime state',
    { accent: ROLE.session, size: 48 },
  );

  const stageAura = aura(300, 30, 620, '#a78bfa22', '#5ce1e61a');

  // 3D Orbiting Authorization Rig
  const rig3d = cinematic3d({
    theta: -0.76,
    phi: 1.0,
    distance: 14.8,
    unit: 114,
    focus: [0, 0, 0.68],
  }).at(310, 25);

  rig3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Left: Trusted Session Prism (violet), Center: Policy Shield (cyan), Right: Public (green) & Private (rose) vaults
  addBox3D(rig3d, -3.0, -0.75, 0.04, 1.35, 1.5, 1.2, ROLE.session, ROLE.session);
  addBox3D(rig3d, -0.45, -1.75, 0.04, 0.72, 3.5, 1.55, ROLE.runtime, ROLE.runtime, {
    faceOpacity: 0.62,
  });
  addBox3D(rig3d, 1.65, -1.65, 0.04, 1.4, 1.25, 1.05, ROLE.ok, ROLE.ok);
  addBox3D(rig3d, 1.65, 0.45, 0.04, 1.4, 1.25, 1.05, ROLE.denied, ROLE.denied);

  // Check-action beam from Session -> Policy Shield
  const checkArc = hideNodes([
    ...addArc3D(rig3d, [-1.65, 0, 1.22], [-0.1, 0, 1.62], ROLE.session, {
      lift: 0.55,
      pulseVal: pulse,
      phaseOffset: 0.1,
    }),
  ]);

  // Private borrowing history deflected off Policy Shield (rose bounce!)
  const denyArc = hideNodes([
    ...addArc3D(rig3d, [-0.08, 1.05, 1.55], [1.65, 1.08, 1.12], ROLE.denied, {
      lift: 0.6,
      pulseVal: pulse,
      phaseOffset: 0.45,
      width: 3.6,
    }),
  ]);

  // Public availability read passes cleanly through Policy Shield (emerald!)
  const passArc = hideNodes([
    ...addArc3D(rig3d, [-0.08, -1.02, 1.55], [2.35, -1.02, 1.12], ROLE.ok, {
      lift: 0.75,
      pulseVal: pulse,
      phaseOffset: 0.75,
      width: 3.8,
    }),
  ]);

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const sn = sessionOn.value;
      const ca = checkActionOn.value;
      const rc = readsCheckOn.value;
      const pb = privateBlockOn.value;
      const pp = publicPassOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'SESSION (VIOLET)  ->  POLICY SHIELD (CYAN)  ->  RESOURCES',
          310,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'GREEN VAULT: PUBLIC AVAILABILITY   ·   ROSE VAULT: PRIVATE HISTORY',
          310,
          435,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Left column: Trusted Policy Tuple
      nodes.push(
        energyRail(-855, -210, 55, ROLE.session),
        txt('TRUSTED SESSION STATE', -825, -195, 26, ROLE.session, 'mono', 'left').glow(
          sn > 0.3 ? 6 : 0,
          ROLE.session,
        ),
        txt('principal : auth_session.user ("lena")', -825, -138, 26, COSMOS.ink, 'mono', 'left'),
        txt('action    : lookup  |  history', -825, -84, 26, ROLE.runtime, 'mono', 'left'),
        txt('resource  : resolved catalog entry', -825, -30, 26, ROLE.key, 'mono', 'left'),
        txt(
          ca > 0.35
            ? 'Model text cannot substitute for authenticated principal'
            : 'Model proposes arguments; host resolves identity',
          -825,
          26,
          26,
          ca > 0.35 ? ROLE.focus : COSMOS.muted,
          'sans',
          'left',
        ),
      );

      nodes.push(line([-855, 92], [-250, 92], { stroke: '#25355a', width: 2 }));

      // Read-path check outcomes
      const rOp = 0.35 + rc * 0.65;
      nodes.push(
        txt('READ-PATH POLICY CHECKS', -855, 134, 26, ROLE.runtime, 'mono', 'left').opacity(rOp),
        energyRail(-855, 175, 255, pb > 0.35 ? ROLE.denied : '#2b3b64', { opacity: rOp }),
        txt('Other reader borrowing history', -825, 192, 26, COSMOS.ink, 'sans', 'left').opacity(
          rOp,
        ),
        txt(
          pb > 0.35
            ? 'DENIED · Private data stays outside read'
            : 'Requires caller ownership check',
          -825,
          238,
          26,
          pb > 0.35 ? ROLE.denied : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(pb > 0.35 ? 6 : 0, ROLE.denied)
          .opacity(rOp),
      );

      const pOp = 0.35 + pp * 0.65;
      nodes.push(
        energyRail(-855, 290, 375, pp > 0.35 ? ROLE.ok : '#2b3b64', { opacity: pOp }),
        txt('Public availability lookup (B7)', -825, 308, 26, COSMOS.ink, 'sans', 'left').opacity(
          pOp,
        ),
        txt(
          pp > 0.35 && lenaLookup ? 'ALLOWED · Enforced in host runtime' : 'Pending policy check',
          -825,
          354,
          26,
          pp > 0.35 ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(pp > 0.35 ? 7 : 0, ROLE.ok)
          .opacity(pOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('authorization-beat-1-focus-1', () => {
    s.play(
      sessionOn.to(1, { duration: clampDur(c, c.cue('authorization-beat-1-focus-1').start, 0.35) }),
    );
  });
  c.on('authorization-check-action', () => {
    const t = c.cue('authorization-check-action').start;
    s.play(checkActionOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, checkArc, 0.35);
  });
  c.on('authorization-beat-2-focus-1', () => {
    s.play(
      readsCheckOn.to(1, {
        duration: clampDur(c, c.cue('authorization-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('authorization-private-history', () => {
    const t = c.cue('authorization-private-history').start;
    s.play(privateBlockOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, denyArc, 0.35);
  });
  c.on('authorization-beat-3-focus-1', () => {
    const t = c.cue('authorization-beat-3-focus-1').start;
    s.play(publicPassOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, passArc, 0.35);
  });
}
