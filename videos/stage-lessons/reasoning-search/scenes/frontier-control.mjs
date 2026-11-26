// Scene 12: frontier-control - Which state gets expanded next?
// Orbiting 3D Search Frontier Rig paired with live 2D Queue (FIFO / BFS) -> Stack (LIFO / DFS)
// -> Beam Width 1 selection animation! Strict prediction pause asks "Which one comes off the
// top?" on the Stack before frontier-lifo pops B while leaving A waiting below.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PRUNING_BRANCHES,
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
  orbitScene,
  quadArcPts,
  txt,
} from '../parts.mjs';

const BR_A = PRUNING_BRANCHES.branchA;
const BR_B = PRUNING_BRANCHES.branchB;

export default function frontierControl(s, c) {
  const pulse = s.value(0);
  const firstIn = s.value(0);
  const secondIn = s.value(0);
  const fifoOut = s.value(0);
  const stackMode = s.value(0);
  const stackBIn = s.value(0);
  const lifoOut = s.value(0);
  const beamMode = s.value(0);

  const header = cinemaHeader('FRONTIER CONTROL', 'Which state gets', 'expanded next?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(350, 20, 620, '#5ce1e61c', '#a78bfa1a');

  // Orbiting 3D Search Tree Frontier on the right side
  const tree3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.4,
    unit: 106,
    focus: [0, 0, 1.0],
  }).at(430, 20);

  tree3d.add(
    gridPlane3d({
      x: [-3.0, 3.0],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Root state cube -> child A (blue) & child B (cyan) -> expansion pedestal (gold)
  addBox3D(tree3d, -0.55, -0.55, 2.15, 1.1, 1.1, 0.52, ROLE.model, ROLE.model, {
    faceOpacity: 0.85,
    edgeGlow: 9,
  });
  addBox3D(tree3d, -2.35, -0.55, 0.75, 1.15, 1.15, 0.65, ROLE.service, ROLE.service, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(tree3d, 1.2, -0.55, 0.75, 1.15, 1.15, 0.65, ROLE.path, ROLE.path, {
    faceOpacity: 0.82,
    edgeGlow: 8,
  });
  addBox3D(tree3d, -0.65, 1.2, 0.1, 1.3, 1.0, 0.48, ROLE.focus, ROLE.focus, {
    faceOpacity: 0.82,
    edgeGlow: 9,
  });

  addArc3D(tree3d, [0, 0, 2.15], [-1.77, 0, 1.4], ROLE.service, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(tree3d, [0, 0, 2.15], [1.77, 0, 1.4], ROLE.path, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.35,
  });
  addArc3D(tree3d, [1.77, 0, 0.75], [0, 1.7, 0.58], ROLE.focus, {
    lift: 0.45,
    pulseVal: pulse,
    phaseOffset: 0.7,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const a1 = firstIn.value;
      const b1 = secondIn.value;
      const ff = fifoOut.value;
      const st = stackMode.value;
      const sb = stackBIn.value;
      const lf = lifoOut.value;
      const bm = beamMode.value;
      const nodes = [];

      const isBeam = bm > 0.45;
      const isStack = st > 0.45 && !isBeam;

      const modeTitle = isBeam
        ? 'BEAM (WIDTH = 1)'
        : isStack
          ? 'STACK (LIFO -> DFS)'
          : 'QUEUE (FIFO -> BFS)';
      const slotTitle = isBeam ? '1 BEAM SLOT' : 'EXPAND NEXT';

      nodes.push(
        txt(modeTitle, -840, -245, 26, isBeam ? ROLE.focus : ROLE.path, 'mono', 'left'),
        txt(slotTitle, -200, -245, 26, ROLE.focus, 'mono', 'center'),
        txt('3D FRONTIER EXPANSION TREE', 430, -425, 26, ROLE.model, 'mono', 'center'),
        txt(
          'BLUE: A [24,5,7] · CYAN: B [12,4,6] · GOLD: EXPAND',
          380,
          425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Left frontier container slot vs right expansion slot
      const xQueue = -640;
      const xExpand = -200;
      const yTop = -105;
      const yBot = 148;

      // Determine A and B coordinates smoothly
      let ax = xQueue;
      let ay = yTop;
      let aAlpha = a1;
      let bx = xQueue;
      let by = yBot;
      let bAlpha = b1;

      if (isBeam) {
        ax = xQueue;
        ay = yTop;
        bx = xQueue;
        by = yBot;
        aAlpha = 1;
        bAlpha = 1;
      } else if (isStack) {
        // Stack: A pushed first (bottom), B pushed on top (top)!
        ax = xQueue;
        ay = yBot;
        aAlpha = st;
        // B pops off the top ONLY on lifoOut (strict prediction withholding!)
        bx = xQueue + (xExpand - xQueue) * lf;
        by = yTop;
        bAlpha = sb;
      } else {
        // Queue: A arrives first (front/top), B arrives second (back/bottom); A expands on fifoOut
        ax = xQueue + (xExpand - xQueue) * ff;
        ay = yTop;
        bx = xQueue;
        by = yBot;
      }

      if (aAlpha > 0.05) {
        nodes.push(
          orbNode(ax, ay, 'A: 6*4', ROLE.service, {
            radius: 52,
            sub: `[${BR_A.remaining.join(', ')}]`,
            opacity: aAlpha,
          }),
        );
      }
      if (bAlpha > 0.05) {
        nodes.push(
          orbNode(bx, by, 'B: 5+7', ROLE.path, {
            radius: 52,
            sub: `[${BR_B.remaining.join(', ')}]`,
            opacity: bAlpha,
          }),
        );
      }

      // Expansion slot target ring when nothing has moved into it yet
      if ((!isStack && ff < 0.05) || (isStack && lf < 0.05) || isBeam) {
        nodes.push(
          orbNode(xExpand, yTop, isBeam ? 'RANK?' : 'SLOT', ROLE.focus, {
            radius: 50,
            sub: isBeam ? 'Discards loser' : 'Next expansion',
            opacity: 0.72,
          }),
        );
      }

      // Photon beam appears cleanly AFTER orb settles so it never crosses moving text!
      if (!isBeam && !isStack && ff > 0.92) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([xQueue + 20, yTop], [xExpand - 92, yTop], -35),
            ROLE.service,
            p,
            {
              width: 3.4,
              alpha: (ff - 0.92) / 0.08,
            },
          ),
        );
      }
      if (isStack && lf > 0.92) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([xQueue + 20, yTop], [xExpand - 92, yTop], -35),
            ROLE.path,
            p,
            {
              width: 3.4,
              alpha: (lf - 0.92) / 0.08,
            },
          ),
        );
      }

      // Bottom rule & prediction/status caption
      nodes.push(line([-840, 305], [-20, 305], { stroke: '#25355a', width: 2 }).opacity(0.65));

      let footText = 'Queue (FIFO): A arrived first -> A expands first (BFS)';
      let footCol = ROLE.service;
      if (isBeam) {
        footText = 'Beam keeps top k scored states; discarded siblings vanish';
        footCol = ROLE.focus;
      } else if (isStack && lf > 0.45) {
        footText = 'B pops off the top (LIFO -> DFS); A waits for backtracking';
        footCol = ROLE.path;
      } else if (isStack) {
        footText = 'Pushed A first, then B. Which one comes off the top?';
        footCol = ROLE.focus;
      }

      nodes.push(
        txt(footText, -840, 362, 28, footCol, isStack && lf < 0.45 ? 'serif' : 'mono', 'left'),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, tree3d, header, overlay);
  orbitScene(s, c, tree3d, { theta: -0.2, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('frontier-first', () => {
    s.play(firstIn.to(1, { duration: clampDur(c, c.cue('frontier-first').start, 0.35) }));
  });
  c.on('frontier-second', () => {
    s.play(secondIn.to(1, { duration: clampDur(c, c.cue('frontier-second').start, 0.35) }));
  });
  c.on('frontier-fifo', () => {
    s.play(fifoOut.to(1, { duration: clampDur(c, c.cue('frontier-fifo').start, 0.45) }));
  });
  c.on('frontier-push-a', () => {
    s.play(stackMode.to(1, { duration: clampDur(c, c.cue('frontier-push-a').start, 0.35) }));
  });
  c.on('frontier-push-b', () => {
    s.play(stackBIn.to(1, { duration: clampDur(c, c.cue('frontier-push-b').start, 0.35) }));
  });
  // Strict prediction withholding!
  c.after('frontier-lifo', () => {
    s.play(lifoOut.to(1, { duration: clampDur(c, c.cue('frontier-lifo').end, 0.4) }));
  });
  c.on('frontier-beam', () => {
    s.play(beamMode.to(1, { duration: clampDur(c, c.cue('frontier-beam').start, 0.4) }));
  });
}
