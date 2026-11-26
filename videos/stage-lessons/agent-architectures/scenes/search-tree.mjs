// Scene 22: search-tree - Which branch should we try next?
// Signature orbiting 3D Language Agent Tree Search (LATS) branching rig: root node
// splits into sandboxed Diff, Retry, and Rollback state snapshots with glowing return
// backup arcs and host authorization boundary before external execution.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  guardedDynamic,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function searchTree(s, c) {
  const pulse = s.value(0);
  const evalStage = s.value(0);
  const snapStage = s.value(0);

  const header = cinemaHeader('LANGUAGE AGENT TREE SEARCH', 'Which branch should', 'we try next?', {
    accent: ROLE.policy,
    size: 50,
  });

  const stageAura = aura(260, 20, 620, '#a78bfa22', '#5ce1e61a');

  // Orbiting 3D LATS Tree: Root pedestal (z=2.3) branching down to 3 sandboxed snapshot cubes
  const tree3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.2,
    unit: 112,
    focus: [0, 0, 1.0],
  }).at(280, 20);

  tree3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Root node cube
  addBox3D(tree3d, -0.55, -0.55, 2.1, 1.1, 1.1, 0.62, ROLE.host, ROLE.host, {
    faceOpacity: 0.85,
    edgeGlow: 9,
  });

  // 3 child sandboxed branch cubes: Rollback (left), Diff (center-front), Retry (right)
  addBox3D(tree3d, -2.7, -1.6, 0.08, 1.2, 1.2, 0.88, ROLE.caution, ROLE.caution);
  addBox3D(tree3d, -0.6, 1.15, 0.08, 1.2, 1.2, 0.88, ROLE.ok, ROLE.ok);
  addBox3D(tree3d, 1.5, -1.6, 0.08, 1.2, 1.2, 0.88, ROLE.focus, ROLE.focus);

  // Glowing 3D tree arcs with traveling simulation & backup photons
  addArc3D(tree3d, [0, 0, 2.1], [-2.1, -1.0, 0.96], ROLE.caution, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(tree3d, [0, 0, 2.1], [0, 1.75, 0.96], ROLE.ok, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.33,
  });
  addArc3D(tree3d, [0, 0, 2.1], [2.1, -1.0, 0.96], ROLE.focus, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.66,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const ev = evalStage.value;
      const sn = snapStage.value;
      const nodes = [
        txt('ROOT STATE -> 3 SANDBOXED BRANCHES', 280, -425, 26, ROLE.policy, 'mono', 'center'),
        txt(
          'AMBER: ROLLBACK  ·  GREEN: DIFF  ·  GOLD: RETRY',
          280,
          435,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('LATS LOOP (4 PHASES)', -840, -170, 26, ROLE.policy, 'mono', 'left'),
        txt('1. Select promising branch (UCT)', -840, -112, 28, COSMOS.ink, 'sans', 'left'),
        txt('2. Expand alternatives in sandbox', -840, -60, 28, COSMOS.ink, 'sans', 'left'),
        txt('3. Evaluate via real observations', -840, -8, 28, ROLE.action, 'sans', 'left'),
        txt('4. Back up return + failure note', -840, 44, 28, ROLE.ok, 'sans', 'left'),
      ];

      if (ev > 0.05) {
        nodes.push(
          txt('SCORING: MODEL EVAL + SELF-CONSISTENCY', -840, 145, 26, ROLE.focus, 'mono', 'left')
            .glow(5, ROLE.focus)
            .opacity(ev),
          txt(
            'Next: compute UCT scores & backup update',
            -840,
            195,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(ev),
        );
      }
      if (sn > 0.05) {
        nodes.push(
          txt('STATE ISOLATION CONTRACT', -840, 290, 26, ROLE.host, 'mono', 'left').opacity(sn),
          txt(
            'Each write branch owns its file + tool snapshot',
            -840,
            338,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(sn),
          txt(
            'Host authorizes final action outside sandbox',
            -840,
            384,
            26,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(sn),
        );
      }
      return group(...nodes);
    },
  );

  s.add(stageAura, tree3d, header, overlay);
  orbitScene(s, c, tree3d, { theta: -0.18, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-search-tree-0', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('aa-search-tree-0').start, 0.25) }));
  });
  c.on('aa-search-tree-1', () => {
    s.play(evalStage.to(1, { duration: clampDur(c, c.cue('aa-search-tree-1').start, 0.4) }));
  });
  c.on('aa-search-tree-2', () => {
    s.play(snapStage.to(1, { duration: clampDur(c, c.cue('aa-search-tree-2').start, 0.4) }));
  });
}
