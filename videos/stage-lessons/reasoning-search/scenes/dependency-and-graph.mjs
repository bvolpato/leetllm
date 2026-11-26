// Scene 7: dependency-and-graph - Which answer does the next check need?
// Orbiting 3D Graph-of-Thoughts DAG rig paired with sequential Least-to-Most chain:
//   1. Sequential Least-to-Most: Diff -> Components (auth + logging) -> Required checks.
//   2. Graph-of-Thoughts join + revision: independent Security + Performance reviewers merge
//      into a 2-parent release record with a revision feedback loop (retain & score both).
//   3. Shared prefix cache vs divergent histories + critical-path latency wait.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  orbRadius,
  orbitScene,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function dependencyAndGraph(s, c) {
  const pulse = s.value(0);
  const gotOn = s.value(0);
  const cacheOn = s.value(0);

  const header = cinemaHeader('LEAST-TO-MOST & GoT', 'Which answer does the', 'next check need?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(320, 20, 620, '#5ce1e61c', '#a78bfa1c');

  // Orbiting 3D Graph-of-Thoughts DAG on the right half
  const dag3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.2,
    unit: 108,
    focus: [0, 0, 1.0],
  }).at(390, 20);

  dag3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Shared prompt prefix root block
  addBox3D(dag3d, -0.55, -2.0, 1.9, 1.1, 1.0, 0.55, ROLE.service, ROLE.service, {
    faceOpacity: 0.85,
    edgeGlow: 8,
  });
  // Parallel Security & Performance reviewer cubes
  addBox3D(dag3d, -2.4, -0.2, 1.0, 1.1, 1.0, 0.65, ROLE.path, ROLE.path, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(dag3d, 1.3, -0.2, 1.0, 1.1, 1.0, 0.65, ROLE.model, ROLE.model, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  // Combined 2-parent release record block
  addBox3D(dag3d, -0.65, 1.5, 0.15, 1.3, 1.0, 0.72, ROLE.ok, ROLE.ok, {
    faceOpacity: 0.85,
    edgeGlow: 9,
  });

  // Fan-out, two-parent join, and gold revision loop arcs
  addArc3D(dag3d, [0, -1.5, 1.9], [-1.85, 0.3, 1.65], ROLE.path, {
    lift: 0.4,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(dag3d, [0, -1.5, 1.9], [1.85, 0.3, 1.65], ROLE.model, {
    lift: 0.4,
    pulseVal: pulse,
    phaseOffset: 0.25,
  });
  addArc3D(dag3d, [-1.85, 0.3, 1.0], [0, 2.0, 0.87], ROLE.ok, {
    lift: 0.35,
    pulseVal: pulse,
    phaseOffset: 0.5,
  });
  addArc3D(dag3d, [1.85, 0.3, 1.0], [0, 2.0, 0.87], ROLE.ok, {
    lift: 0.35,
    pulseVal: pulse,
    phaseOffset: 0.7,
  });
  addArc3D(dag3d, [0, 2.0, 0.87], [0, -1.5, 2.45], ROLE.focus, {
    lift: 1.0,
    pulseVal: pulse,
    phaseOffset: 0.85,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const gt = gotOn.value;
      const kv = cacheOn.value;
      const nodes = [];

      // Left stage: Least-to-Most linear dependency chain
      const p1 = [-750, -105];
      const p2 = [-445, -105];
      const p3 = [-135, -105];
      const r1 = orbRadius('DIFF', 44);
      const r2 = orbRadius('COMP', 48);
      const r3 = orbRadius('CHECKS', 46);
      const [s1a, s1b] = trimSeg(p1, p2, r1 + 8, r2 + 8);
      const [s2a, s2b] = trimSeg(p2, p3, r2 + 8, r3 + 8);

      nodes.push(
        txt('LEAST-TO-MOST (DEPENDENT CHAIN)', -840, -240, 26, ROLE.service, 'mono', 'left'),
        orbNode(p1[0], p1[1], 'DIFF', ROLE.service, { radius: 44 }),
        beamWithPhotons([s1a, s1b], ROLE.path, p * 1.0, { width: 3.4 }),
        orbNode(p2[0], p2[1], 'COMP', ROLE.path, { radius: 48, sub: 'auth + log' }),
        beamWithPhotons([s2a, s2b], ROLE.ok, p * 1.0 + 0.35, { width: 3.4 }),
        orbNode(p3[0], p3[1], 'CHECKS', ROLE.ok, { radius: 46, sub: 'Schema + Sec' }),
        txt('3D GRAPH OF THOUGHTS (JOIN + REVISION)', 390, -425, 26, ROLE.ok, 'mono', 'center'),
        txt(
          'CYAN: SEC · VIOLET: PERF · GREEN: JOIN · GOLD: REVISE',
          360,
          425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Lower-left details revealed sequentially
      if (gt > 0.05) {
        const revA = [-680, 125];
        const revB = [-300, 125];
        nodes.push(
          line([-840, 35], [-40, 35], { stroke: '#25355a', width: 2 }).opacity(0.65 * gt),
          txt(
            'GRAPH OF THOUGHTS (RETAIN & SCORE BOTH)',
            -840,
            74,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(gt),
          orbNode(revA[0], revA[1] + 55, 'V1', ROLE.service, { radius: 38, opacity: gt }),
          beamWithPhotons(
            quadArcPts([revA[0] + 44, revA[1] + 55], [revB[0] - 44, revB[1] + 55], -35),
            ROLE.focus,
            p * 1.1,
            { alpha: gt, width: 3.2 },
          ),
          orbNode(revB[0], revB[1] + 55, 'V2', ROLE.focus, {
            radius: 38,
            sub: 'Revision can worsen V1!',
            opacity: gt,
          }),
        );
      }

      if (kv > 0.05) {
        nodes.push(
          txt('PREFIX CACHE & CRITICAL PATH', -840, 310, 26, ROLE.path, 'mono', 'left').opacity(kv),
          txt(
            'Shared prompt cached; dependent steps wait on critical path',
            -840,
            356,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(kv),
        );
      } else {
        nodes.push(
          txt(
            'Drop logging in step 1 -> miss log-schema check in step 2',
            -840,
            356,
            26,
            ROLE.caution,
            'mono',
            'left',
          ).opacity(1 - kv),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, dag3d, header, overlay);
  orbitScene(s, c, dag3d, { theta: -0.2, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('dependency-and-graph-b1', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('dependency-and-graph-b1').start, 0.25) }));
  });
  c.on('dependency-and-graph-b2', () => {
    s.play(gotOn.to(1, { duration: clampDur(c, c.cue('dependency-and-graph-b2').start, 0.4) }));
  });
  c.on('dependency-and-graph-b3', () => {
    s.play(cacheOn.to(1, { duration: clampDur(c, c.cue('dependency-and-graph-b3').start, 0.4) }));
  });
}
