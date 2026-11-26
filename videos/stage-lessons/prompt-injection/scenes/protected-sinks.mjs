// Scene 15: protected-sinks - Protect disclosure and state changes
// Orbiting 3D Dual-Sink Capability Architecture (`cinematic3d`): influenced model prism
// splits toward two separate protected endpoints (Disclosure Sink: private red-team notes
// to outside.example vs Deployment Sink: promote C17 to prod 25%), each guarded by its
// own action-specific authorization prism backed by `disclosureAllowed` & `promotionAllowed`.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PROPOSAL,
  ROLE,
  TRUSTED,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  disclosureAllowed,
  driftValue,
  energyRail,
  fadeInNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  promotionAllowed,
  txt,
} from '../parts.mjs';

export default function protectedSinks(s, c) {
  const pulse = s.value(0);
  const endpointsHi = s.value(0);
  const fieldsHi = s.value(0);
  const destHi = s.value(0);
  const opHi = s.value(0);

  const discOk = disclosureAllowed({
    field: 'private-red-team-notes',
    destination: 'outside.example',
    caller: TRUSTED.caller,
  });
  const deployOk = promotionAllowed(PROPOSAL, TRUSTED);

  const header = cinemaHeader(
    'INDEPENDENT PROTECTED SINKS',
    'Protect disclosure and',
    'state changes separately',
    { accent: ROLE.attack, size: 48 },
  );

  const stageAura = aura(300, 20, 640, '#ff6b8b1c', '#a78bfa1c');

  const rig3d = cinematic3d({
    theta: -0.84,
    phi: 1.0,
    distance: 15.0,
    unit: 114,
    focus: [0, 0, 0.65],
  }).at(300, 30);

  rig3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Left-center prism: Influenced Model Output
  addBox3D(rig3d, -2.9, -0.6, 0.05, 1.35, 1.2, 1.05, ROLE.untrusted, ROLE.untrusted);

  // North Branch (y = -1.9): Disclosure Gate -> External Sink
  addBox3D(rig3d, -0.45, -2.25, 0.05, 1.1, 1.0, 1.25, ROLE.approval, ROLE.approval);
  addBox3D(rig3d, 1.85, -2.25, 0.05, 1.25, 1.0, 0.95, ROLE.attack, ROLE.attack);
  addArc3D(rig3d, [-1.55, -0.35, 0.98], [-0.45, -1.75, 1.15], ROLE.approval, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0,
  });

  // South Branch (y = +1.3): Deployment Gate -> Production Sink
  addBox3D(rig3d, -0.45, 1.25, 0.05, 1.1, 1.0, 1.25, ROLE.host, ROLE.host);
  addBox3D(rig3d, 1.85, 1.25, 0.05, 1.25, 1.0, 0.95, ROLE.focus, ROLE.focus);
  addArc3D(rig3d, [-1.55, 0.35, 0.98], [-0.45, 1.75, 1.15], ROLE.host, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0.45,
  });

  // Glowing stop-beacons illuminating on each gate when checked
  const discBeacon = hideNodes(
    addBox3D(rig3d, -0.3, -2.1, 1.4, 0.8, 0.7, 0.42, ROLE.denied, ROLE.denied, {
      faceOpacity: 0.88,
      edgeGlow: 10,
    }),
  );
  const deployBeacon = hideNodes(
    addBox3D(rig3d, -0.3, 1.4, 1.4, 0.8, 0.7, 0.42, ROLE.denied, ROLE.denied, {
      faceOpacity: 0.88,
      edgeGlow: 10,
    }),
  );

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const ep = endpointsHi.value;
      const fi = fieldsHi.value;
      const ds = destHi.value;
      const op = opHi.value;
      const nodes = [];

      nodes.push(
        txt(
          'NORTH: DISCLOSURE GATE (VIOLET)   ·   SOUTH: DEPLOYMENT GATE (CYAN)',
          300,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'EACH PROTECTED ENDPOINT RUNS ITS OWN ACTION-SPECIFIC AUTHORIZATION',
          300,
          435,
          26,
          ep > 0.3 ? ROLE.host : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Left diagnostic column: 2 independent sinks
      nodes.push(
        energyRail(-855, -195, 50, ROLE.approval, { width: 6, glow: 8 + ds * 6 }),
        txt('SINK 1 · DISCLOSURE ENDPOINT', -825, -170, 26, ROLE.approval, 'mono', 'left'),
        txt('Request: private-red-team-notes', -825, -112, 28, COSMOS.ink, 'sans', 'left'),
        txt('Destination: outside.example', -825, -62, 26, ROLE.attack, 'mono', 'left').glow(
          ds > 0.3 ? 6 : 0,
          ROLE.attack,
        ),
        txt(
          `Gate: ${discOk ? 'ALLOW' : 'DENIED'}  (field + destination policy)`,
          -825,
          -6,
          26,
          ROLE.denied,
          'mono',
          'left',
        ),
        txt(
          fi > 0.3
            ? 'Limit readable private fields upfront'
            : 'Track destination like deploy target',
          -825,
          42,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      nodes.push(
        line([-855, 92], [-275, 92], { stroke: '#28385f', width: 2 }),
        energyRail(-855, 130, 380, ROLE.host, { width: 6, glow: 8 + op * 6 }),
        txt('SINK 2 · DEPLOYMENT ENDPOINT', -825, 156, 26, ROLE.host, 'mono', 'left'),
        txt(
          `Request: promote ${PROPOSAL.candidate} (${PROPOSAL.traffic}%)`,
          -825,
          214,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          `Target: ${PROPOSAL.stage} · rev ${PROPOSAL.revision}`,
          -825,
          266,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).glow(op > 0.3 ? 6 : 0, ROLE.focus),
        txt(
          `Gate: ${deployOk ? 'ALLOW' : 'DENIED'}  (operation + approval check)`,
          -825,
          324,
          26,
          ROLE.denied,
          'mono',
          'left',
        ),
        txt(
          'Independent credential & permission check',
          -825,
          372,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.28, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('protected-sinks-beat-1-focus-1', () => {
    s.play(
      endpointsHi.to(1, {
        duration: clampDur(c, c.cue('protected-sinks-beat-1-focus-1').start, 0.35),
      }),
    );
  });
  c.on('protected-sinks-beat-2-focus-1', () => {
    s.play(
      fieldsHi.to(1, {
        duration: clampDur(c, c.cue('protected-sinks-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('protected-destination-check', () => {
    const t = c.cue('protected-destination-check').start;
    s.play(destHi.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, discBeacon, 0.35);
  });
  c.on('protected-operation-check', () => {
    const t = c.cue('protected-operation-check').start;
    s.play(opHi.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, deployBeacon, 0.35);
  });
}
