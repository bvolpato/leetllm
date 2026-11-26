// Scene 24: cache-principal - A cache hit carries its access context
// Orbiting 3D Principal-Keyed Cache Partition Lattice (`cinematic3d`): shows a poisoned
// cached entry occupying `(intern, read, report-C17)` while `(owner, promote, report-C17)`
// probes a separate 3D privilege plane and gets a CACHE MISS, plus live access rechecks
// and prefix-caching vs tool-result authorization separation.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  addWireBox3D,
  aura,
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

export default function cachePrincipal(s, c) {
  const pulse = s.value(0);
  const missHi = s.value(0);
  const keysHi = s.value(0);
  const prefixHi = s.value(0);

  const header = cinemaHeader(
    'PRINCIPAL-SCOPED CACHE ISOLATION',
    'A cache hit carries',
    'its access context',
    { accent: ROLE.principal, size: 48 },
  );

  const stageAura = aura(300, 20, 640, '#a78bfa1e', '#5ce1e61a');

  const rig3d = cinematic3d({
    theta: -0.82,
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

  // Plane 1 (front, y = -1.7): (intern, read, report-C17) -> OCCUPIED poisoned entry (amber)
  addBox3D(rig3d, -2.5, -2.15, 0.05, 1.45, 1.1, 0.95, ROLE.source, ROLE.source);
  addBox3D(rig3d, 0.65, -2.15, 0.05, 1.85, 1.1, 1.05, ROLE.untrusted, ROLE.untrusted, {
    faceOpacity: 0.85,
    edgeGlow: 9,
  });
  addArc3D(rig3d, [-1.05, -1.6, 0.98], [0.65, -1.6, 1.08], ROLE.untrusted, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0,
  });

  // Plane 2 (back, y = +1.4): (owner, promote, report-C17) -> EMPTY wireframe slot (CACHE MISS)
  addBox3D(rig3d, -2.5, 1.05, 0.05, 1.45, 1.1, 0.95, ROLE.principal, ROLE.principal);
  addWireBox3D(rig3d, 0.65, 1.05, 0.05, 1.85, 1.1, 1.05, ROLE.host, { opacity: 0.82, glow: 8 });

  // Owner lookup arc arriving at empty slot -> MISS
  const ownerProbe = hideNodes(
    addArc3D(rig3d, [-1.05, 1.6, 0.98], [0.65, 1.6, 1.05], ROLE.host, {
      lift: 0.72,
      pulseVal: pulse,
      phaseOffset: 0.45,
    }),
  );

  // Access-recheck halo hovering above occupied intern cache slot
  const recheckHalo = hideNodes(
    addBox3D(rig3d, 0.85, -1.95, 1.35, 1.45, 0.7, 0.35, ROLE.host, ROLE.host, {
      faceOpacity: 0.85,
      edgeGlow: 9,
    }),
  );

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const mh = missHi.value;
      const kh = keysHi.value;
      const ph = prefixHi.value;
      const nodes = [];

      nodes.push(
        txt(
          'FRONT: intern/read HIT  ·  BACK: owner/promote MISS',
          365,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          'SAME SOURCE URI ≠ SHARED CACHE KEY ACROSS PRINCIPALS',
          300,
          435,
          26,
          ROLE.host,
          'mono',
          'center',
        ),
      );

      // Left diagnostic column
      nodes.push(
        energyRail(-855, -200, 15, ROLE.untrusted, { width: 6, glow: 8 + mh * 5 }),
        txt('1. ISOLATED CACHE KEYS', -825, -176, 26, ROLE.untrusted, 'mono', 'left'),
        txt('Stored: (intern, read, report-C17)', -825, -120, 26, COSMOS.ink, 'mono', 'left'),
        txt('Owner promote lookup -> CACHE MISS', -825, -66, 26, ROLE.host, 'mono', 'left').glow(
          mh > 0.3 ? 6 : 0,
          ROLE.host,
        ),
        txt('Intern read lookup -> HIT (untrusted)', -825, -12, 26, ROLE.untrusted, 'sans', 'left'),
      );

      const kAlpha = 0.45 + kh * 0.55;
      nodes.push(
        line([-855, 42], [-275, 42], { stroke: '#28385f', width: 2 }),
        energyRail(-855, 70, 232, ROLE.host, { width: 5, opacity: kAlpha }),
        txt('2. HOST-DERIVED KEY & RECHECK', -825, 92, 26, ROLE.host, 'mono', 'left').opacity(
          kAlpha,
        ),
        txt(
          'Include principal, privilege, args, rev',
          -825,
          144,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(kAlpha),
        txt(
          'Invalidate on authz change · Recheck on hit',
          -825,
          192,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(kAlpha),
        txt(
          'Cached evidence NEVER becomes approval',
          -825,
          234,
          26,
          ROLE.denied,
          'mono',
          'left',
        ).opacity(kAlpha),
      );

      const pAlpha = 0.45 + ph * 0.55;
      nodes.push(
        energyRail(-855, 272, 405, ROLE.principal, { width: 5, opacity: pAlpha }),
        txt(
          '3. MISS ≠ SAFE · PREFIX ≠ TOOL CACHE',
          -825,
          294,
          26,
          ROLE.principal,
          'mono',
          'left',
        ).opacity(pAlpha),
        txt(
          'Owner may still fetch same poisoned report',
          -825,
          344,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(pAlpha),
        txt(
          'Reused history preserves provenance & user',
          -825,
          390,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(pAlpha),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.26, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-cache-principal-0', () => {
    const t = c.cue('pi-cache-principal-0').start;
    s.play(missHi.to(1, { duration: clampDur(c, t, 0.45) }));
    fadeInNodes(s, c, t, ownerProbe, 0.45);
  });
  c.on('pi-cache-principal-1', () => {
    const t = c.cue('pi-cache-principal-1').start;
    s.play(keysHi.to(1, { duration: clampDur(c, t, 0.45) }));
    fadeInNodes(s, c, t, recheckHalo, 0.45);
  });
  c.on('pi-cache-principal-2', () => {
    s.play(prefixHi.to(1, { duration: clampDur(c, c.cue('pi-cache-principal-2').start, 0.45) }));
  });
}
