// Scene 20: flat-tree - Reconstruct relationships after flattening
// Luminous graph topology transitioning from a valid 3-node flat tree (root -> n1, n2)
// into a disconnected cycle (root alone; a <-> b mutually point to each other).
// Root traversal visits only 1 of 3 nodes -> Reject: disconnected nodes or cycles!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  treeRelationships,
  txt,
} from '../parts.mjs';

const VALID_NODES = [
  { id: 'root', parent: null },
  { id: 'n1', parent: 'root' },
  { id: 'n2', parent: 'root' },
];
const CYCLIC_NODES = [
  { id: 'root', parent: null },
  { id: 'a', parent: 'b' },
  { id: 'b', parent: 'a' },
];
const VALID_RES = treeRelationships(VALID_NODES);
const CYCLIC_RES = treeRelationships(CYCLIC_NODES);

export default function flatTree(s, c) {
  const b0Hi = s.value(0);
  const validHi = s.value(0);
  const b1Hi = s.value(0);
  const cycleMode = s.value(0); // 0 = valid tree, 1 = disconnected cycle
  const rejectHi = s.value(0);
  const b2Hi = s.value(0);

  const header = cinemaHeader(
    'FLATTENED TREE VALIDATION',
    'Reconstruct relationships',
    'after flattening',
    { accent: ROLE.fsm, size: 48 },
  );

  const stageAura = aura(220, 40, 640, '#5ce1e61f', '#ff6b8b16');

  // Mode 0: Valid connected tree (root -> n1, n2)
  const validView = guardedDynamic(
    () => fadeOutHalf(cycleMode.value),
    (a) => {
      const vh = validHi.value;
      const b0 = b0Hi.value;
      const nodes = [];

      // Left flat array listing
      nodes.push(
        opticalRail(-840, -175, 165, ROLE.legal, { opacity: a }),
        txt('FLAT ARRAY (DFA-FRIENDLY)', -805, -160, 26, ROLE.legal, 'mono', 'left').opacity(a),
        txt('{ id: "root", parent: null }', -805, -90, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('{ id: "n1",   parent: "root" }', -805, -24, 28, ROLE.fsm, 'mono', 'left').opacity(a),
        txt('{ id: "n2",   parent: "root" }', -805, 42, 28, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(
          `VISITED FROM ROOT: ${VALID_RES.visited.length} / ${VALID_NODES.length}  (${VALID_RES.visited.join(', ')})`,
          -805,
          132,
          26,
          ROLE.legal,
          'mono',
          'left',
        )
          .glow(vh > 0.3 ? 7 : 0, ROLE.legal)
          .opacity(a),
      );

      // Right reconstructed graph topology
      const rPos = [390, -135];
      const n1Pos = [150, 125];
      const n2Pos = [630, 125];
      nodes.push(
        beamWithPhotons(
          quadArcPts([rPos[0] - 42, rPos[1] + 54], [n1Pos[0] + 24, n1Pos[1] - 62], -12),
          ROLE.legal,
          0,
          {
            alpha: a * (0.5 + 0.5 * Math.max(b0, vh)),
            width: 3.6,
          },
        ),
        beamWithPhotons(
          quadArcPts([rPos[0] + 42, rPos[1] + 54], [n2Pos[0] - 24, n2Pos[1] - 62], -12),
          ROLE.legal,
          0,
          {
            alpha: a * (0.5 + 0.5 * Math.max(b0, vh)),
            width: 3.6,
          },
        ),
        fsmNode(rPos[0], rPos[1], 62, 'root', {
          color: ROLE.legal,
          accepting: true,
          size: 28,
          opacity: a,
        }),
        fsmNode(n1Pos[0], n1Pos[1], 56, 'n1', { color: ROLE.fsm, size: 28, opacity: a }),
        fsmNode(n2Pos[0], n2Pos[1], 56, 'n2', { color: ROLE.fsm, size: 28, opacity: a }),
        txt(
          'CONNECTED TREE · ALL NODES REACHABLE',
          390,
          245,
          26,
          ROLE.legal,
          'mono',
          'center',
        ).opacity(a),
        txt(
          'Host checks node cap, unique IDs, single root, known parents, and full reachability',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Disconnected cycle (root alone; a <-> b)
  const cycleView = guardedDynamic(
    () => fadeInHalf(cycleMode.value),
    (a) => {
      const rj = rejectHi.value;
      const b2 = b2Hi.value;
      const b1 = b1Hi.value;
      const nodes = [];

      // Left flat array listing showing a <-> b
      nodes.push(
        opticalRail(-840, -175, 165, ROLE.prune, { opacity: a }),
        txt('FLAT ARRAY WITH CYCLE', -805, -160, 26, ROLE.prune, 'mono', 'left').opacity(a),
        txt('{ id: "root", parent: null }', -805, -90, 28, ROLE.legal, 'mono', 'left').opacity(a),
        txt('{ id: "a",    parent: "b" }', -805, -24, 28, ROLE.prune, 'mono', 'left').opacity(a),
        txt('{ id: "b",    parent: "a" }', -805, 42, 28, ROLE.prune, 'mono', 'left').opacity(a),
        txt(
          `VISITED FROM ROOT: ${CYCLIC_RES.visited.length} / ${CYCLIC_NODES.length}  (only "${CYCLIC_RES.visited[0]}")`,
          -805,
          132,
          26,
          ROLE.prefix,
          'mono',
          'left',
        )
          .glow(b1 > 0.3 ? 6 : 0, ROLE.prefix)
          .opacity(a),
      );

      // Right disconnected topology: isolated root + glowing crimson a <-> b loop!
      const rPos = [80, 15];
      const aPos = [415, -95];
      const bPos = [685, 115];

      const abTop = quadArcPts([aPos[0] + 54, aPos[1] + 15], [bPos[0] - 25, bPos[1] - 58], -55);
      const abBot = quadArcPts([bPos[0] - 54, bPos[1] - 10], [aPos[0] + 20, aPos[1] + 58], 55);
      nodes.push(
        fsmNode(rPos[0], rPos[1], 58, 'root', {
          color: ROLE.legal,
          accepting: true,
          size: 28,
          opacity: a,
        }),
        txt('visited: 1', rPos[0], rPos[1] + 95, 26, ROLE.legal, 'mono', 'center').opacity(a),
        // Barrier separating root from disconnected cycle
        line([235, -160], [235, 200], { stroke: ROLE.prune, width: 3, dash: [8, 8] }).opacity(
          a * 0.75,
        ),
        beamWithPhotons(abTop, ROLE.prune, 0, { alpha: a, width: 3.6 }),
        beamWithPhotons(abBot, ROLE.prune, 0, { alpha: a, width: 3.6 }),
        fsmNode(aPos[0], aPos[1], 56, 'a', { color: ROLE.prune, size: 32, opacity: a }),
        fsmNode(bPos[0], bPos[1], 56, 'b', { color: ROLE.prune, size: 32, opacity: a }),
        txt('UNREACHABLE CYCLE', 550, 225, 26, ROLE.prune, 'mono', 'center').opacity(a),
      );

      if (rj > 0.35) {
        nodes.push(
          txt('REJECT: DISCONNECTED NODES OR CYCLES', -840, 275, 34, ROLE.prune, 'mono', 'left')
            .glow(10, ROLE.prune)
            .opacity(a * rj),
        );
      }

      nodes.push(
        txt(
          b2 > 0.4
            ? 'Flattening simplifies generation for DFAs, shifting graph reconstruction onto the host'
            : 'Every parent ID exists in the list, yet root traversal exposes the disconnected cycle',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, validView, cycleView);

  c.on('sg-flat-tree-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-flat-tree-0').start, 0.35) }));
  });
  c.on('sg-tree-valid', () => {
    s.play(validHi.to(1, { duration: clampDur(c, c.cue('sg-tree-valid').start, 0.4) }));
  });
  c.on('sg-flat-tree-1', () => {
    s.play(b1Hi.to(1, { duration: clampDur(c, c.cue('sg-flat-tree-1').start, 0.35) }));
  });
  c.on('sg-tree-change', () => {
    s.play(cycleMode.to(1, { duration: clampDur(c, c.cue('sg-tree-change').start, 0.45) }));
  });
  c.on('sg-tree-reject', () => {
    s.play(rejectHi.to(1, { duration: clampDur(c, c.cue('sg-tree-reject').start, 0.4) }));
  });
  c.on('sg-flat-tree-2', () => {
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-flat-tree-2').start, 0.4) }));
  });
}
