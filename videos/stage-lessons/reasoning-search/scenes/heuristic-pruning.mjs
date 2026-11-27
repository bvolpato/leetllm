// Scene 13: heuristic-pruning - Which proposal does the beam keep?
// Signature luminous beam-search pruning & recovery theater (great showcase candidate!):
//   Root [6, 4, 5, 7] branches to A (score 0.95) and B (score 0.40) on a glowing score ladder.
//   Strict prediction pause before prune-one -> beam width 1 keeps A & discards B -> live 85-state
//   dead-end drain proves A has no solution -> rewind fork -> widen beam to 2 -> B survives ->
//   6 - 4 = 2 -> 2 * 12 = 24 verified across all 4 inputs!
import { group, line, rect } from 'vizmatic/stage';
import {
  COMPLETE_B_TREE,
  COSMOS,
  DEAD_END_TRACE,
  PRUNING_BRANCHES,
  ROLE,
  aura,
  beamWithPhotons,
  checkExpression,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  orbNode,
  orbRadius,
  quadArcPts,
  txt,
} from '../parts.mjs';

const BR_A = PRUNING_BRANCHES.branchA;
const BR_B = PRUNING_BRANCHES.branchB;
const VERIFIED_B = checkExpression(COMPLETE_B_TREE);

export default function heuristicPruning(s, c) {
  const pulse = s.value(0);
  const rankOn = s.value(0);
  const takeOne = s.value(0);
  const drainT = s.value(0);
  const emptyOn = s.value(0);
  const replayOn = s.value(0);
  const prevShow = s.value(0);
  const resetOn = s.value(0);
  const wideOn = s.value(0);
  const retainOn = s.value(0);
  const subOn = s.value(0);
  const prodOn = s.value(0);

  const header = cinemaHeader('HEURISTIC BEAM PRUNING', 'Which proposal does', 'the beam keep?', {
    accent: ROLE.focus,
    size: 48,
  });

  const stageAura = aura(100, 30, 680, '#ffd1661c', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rk = rankOn.value;
      const t1 = takeOne.value;
      const dr = drainT.value;
      const em = emptyOn.value;
      const rp = replayOn.value;
      const pv = prevShow.value;
      const rs = resetOn.value;
      const wd = wideOn.value;
      const rt = retainOn.value;
      const sb = subOn.value;
      const pr = prodOn.value;
      const nodes = [];

      const rootPos = [-650, -5];
      const forkX = -195;
      const beamX = 95;
      const yA = -125;
      const yB = 75;
      const yPruned = 250;

      // Compute Branch A & Branch B live coordinates across phases
      let ax = forkX;
      let bx = forkX;
      let by = yB;
      let bPrunedAlpha = 1;
      let beamWidth = 1;

      if (rp < 0.5) {
        // Phase 1: rank -> width-1 cut -> A advances into beam, B drops to pruned zone
        ax = forkX + (beamX - forkX) * t1;
        bx = forkX + (beamX - forkX) * t1;
        by = yB + (yPruned - yB) * t1;
        bPrunedAlpha = 1 - 0.5 * t1;
        beamWidth = 1;
      } else {
        // Phase 2: rewind at fork -> show width-1 discard -> reset -> widen beam to 2 -> B enters beam!
        const toPrev = pv * (1 - rs);
        const toWide = wd;
        ax = forkX + (beamX - forkX) * Math.max(toPrev, toWide);
        bx = forkX + (beamX - forkX) * Math.max(toPrev, toWide);
        by = yB + (yPruned - yB) * toPrev;
        bPrunedAlpha = 1 - 0.5 * toPrev;
        beamWidth = wd > 0.45 ? 2 : 1;
      }

      // Luminous Beam Gate Bracket around the retained beam slot(s)
      const gateH = beamWidth === 2 ? 380 : 185;
      const gateCY = beamWidth === 2 ? -25 : yA;
      nodes.push(
        txt(`BEAM WIDTH = ${beamWidth}`, beamX, -262, 28, ROLE.focus, 'mono', 'center').glow(
          7,
          ROLE.focus,
        ),
        rect(290, gateH, {
          fill: '#0d152a',
          stroke: beamWidth === 2 ? ROLE.ok : ROLE.focus,
          width: 3,
          radius: 14,
        })
          .at(beamX, gateCY)
          .opacity(0.65),
      );

      // Root node + glowing beams to A and B
      const rRoot = orbRadius('6,4,5,7', 50);
      const rA = orbRadius('A: 24', 52);
      const rB = orbRadius('B: 12', 52);
      nodes.push(
        beamWithPhotons(
          quadArcPts([rootPos[0] + rRoot + 10, rootPos[1] - 18], [ax - rA - 12, yA], -18),
          em > 0.5 && rp < 0.5 ? ROLE.fail : ROLE.service,
          p * 1.1,
          { width: 3.4 },
        ),
        beamWithPhotons(
          quadArcPts([rootPos[0] + rRoot + 10, rootPos[1] + 18], [bx - rB - 12, by], 18),
          rt > 0.35 ? ROLE.ok : ROLE.path,
          p * 1.1 + 0.45,
          { width: 3.4, alpha: bPrunedAlpha },
        ),
        orbNode(rootPos[0], rootPos[1], '6,4,5,7', ROLE.model, {
          radius: 50,
          sub: 'Starting fork',
        }),
      );

      // Branch A orb
      const colA = em > 0.5 && rp < 0.5 ? ROLE.fail : ROLE.service;
      nodes.push(orbNode(ax, yA, 'A: 24', colA, { radius: 52 }));

      // Branch B orb
      const colB = rt > 0.35 ? ROLE.ok : ROLE.path;
      nodes.push(orbNode(bx, by, 'B: 12', colB, { radius: 52, opacity: bPrunedAlpha }));

      if ((t1 > 0.5 && rp < 0.5) || (pv > 0.5 && rs < 0.5 && rp > 0.5)) {
        nodes.push(txt('DISCARDED (W=1)', beamX + 180, yPruned, 26, ROLE.caution, 'mono', 'left'));
      }

      // Right-hand telemetry panel (non-overlapping phases: Score Ladder -> A Drain -> B Proof)
      const panelX = 330;
      if (rp < 0.5 && dr > 0.05) {
        const idx =
          em > 0.5
            ? DEAD_END_TRACE.length - 1
            : Math.min(DEAD_END_TRACE.length - 1, Math.floor(dr * (DEAD_END_TRACE.length - 1)));
        const pt = DEAD_END_TRACE[idx];
        nodes.push(
          txt('SEARCHING BELOW A', panelX, -180, 26, ROLE.service, 'mono', 'left'),
          txt(`${pt.checked} / 85 EXAMINED`, panelX, -118, 34, COSMOS.ink, 'mono', 'left'),
          glowMeter(panelX, -62, 460, 28, pt.checked / 85, {
            fill: em > 0.5 ? ROLE.fail : ROLE.service,
          }),
          txt(
            `${pt.queued} WAITING`,
            panelX,
            0,
            32,
            em > 0.5 ? ROLE.fail : ROLE.path,
            'mono',
            'left',
          ),
        );
        if (em > 0.45) {
          nodes.push(
            txt('QUEUE EMPTY -> NO SOLUTION', panelX, 74, 28, ROLE.fail, 'mono', 'left').glow(
              8,
              ROLE.fail,
            ),
            txt('B was pruned unseen!', panelX, 122, 26, ROLE.caution, 'mono', 'left'),
          );
        }
      } else if (rp > 0.5 && rt > 0.35) {
        nodes.push(
          txt('SEARCHING BELOW B', panelX, -180, 26, ROLE.ok, 'mono', 'left'),
          txt('12 = 5 + 7 (carried)', panelX, -115, 28, COSMOS.ink, 'mono', 'left'),
        );
        if (sb > 0.35) {
          nodes.push(txt('6 - 4 = 2', panelX, -45, 36, ROLE.path, 'mono', 'left').opacity(sb));
        }
        if (pr > 0.35 && VERIFIED_B.valid) {
          nodes.push(
            txt(`2 * 12 = ${VERIFIED_B.result}`, panelX, 32, 42, ROLE.ok, 'mono', 'left')
              .glow(10, ROLE.ok)
              .opacity(pr),
            txt('ALL 4 INPUTS USED ONCE', panelX, 98, 26, ROLE.ok, 'mono', 'left').opacity(pr),
          );
        }
      } else {
        // Initial score ladder before drain or before widening
        nodes.push(
          txt('HEURISTIC SCORE LADDER', panelX, -180, 26, ROLE.focus, 'mono', 'left'),
          txt('A [24, 5, 7] · 6*4 = 24', panelX, -115, 26, ROLE.service, 'mono', 'left'),
          glowMeter(panelX, -72, 430, 28, rk * BR_A.heuristic, { fill: ROLE.service }),
          txt(rk > 0.35 ? '0.95' : '...', panelX + 448, -72, 26, ROLE.service, 'mono', 'left'),
          txt('B [12, 4, 6] · 5+7 = 12', panelX, 15, 26, ROLE.path, 'mono', 'left'),
          glowMeter(panelX, 58, 430, 28, rk * BR_B.heuristic, { fill: ROLE.path }),
          txt(rk > 0.35 ? '0.40' : '...', panelX + 448, 58, 26, ROLE.path, 'mono', 'left'),
        );
      }

      // Bottom prediction prompt / conclusion (Rule A8 compliant!)
      let footText = 'Made-up heuristic likes seeing 24 already on the tray';
      let footCol = COSMOS.muted;
      if (pr > 0.45) {
        footText = 'Beam width 2 kept B alive and solved (6 - 4) * (5 + 7) = 24';
        footCol = ROLE.ok;
      } else if (wd > 0.45) {
        footText = 'Widening beam to 2 retains both A and B at extra search cost';
        footCol = ROLE.focus;
      } else if (em > 0.45 && rp < 0.5) {
        footText = 'A is a dead end (85 states checked); nothing learned about pruned B';
        footCol = ROLE.fail;
      } else if (t1 > 0.45 && rp < 0.5) {
        footText = 'A takes the single beam slot; B is discarded from this run';
        footCol = ROLE.caution;
      } else if (rk > 0.45 && rp < 0.5) {
        footText = 'Width = 1. Which tray gets the next search?';
        footCol = ROLE.focus;
      }

      nodes.push(
        txt(footText, 0, 412, 28, footCol, rk > 0.45 && t1 < 0.45 ? 'serif' : 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('prune-rank', () => {
    s.play(rankOn.to(1, { duration: clampDur(c, c.cue('prune-rank').start, 0.5) }));
  });
  // Strict prediction withholding!
  c.after('prune-one', () => {
    s.play(takeOne.to(1, { duration: clampDur(c, c.cue('prune-one').end, 0.45) }));
  });
  c.on('prune-drain', () => {
    s.play(drainT.to(1, { duration: clampDur(c, c.cue('prune-drain').start, 1.4) }));
  });
  c.on('prune-empty', () => {
    s.play(emptyOn.to(1, { duration: clampDur(c, c.cue('prune-empty').start, 0.35) }));
  });
  c.on('prune-replay', () => {
    s.play(replayOn.to(1, { duration: clampDur(c, c.cue('prune-replay').start, 0.35) }));
  });
  c.on('prune-previous', () => {
    s.play(prevShow.to(1, { duration: clampDur(c, c.cue('prune-previous').start, 0.4) }));
  });
  c.on('prune-reset', () => {
    s.play(resetOn.to(1, { duration: clampDur(c, c.cue('prune-reset').start, 0.35) }));
  });
  c.on('prune-wide', () => {
    s.play(wideOn.to(1, { duration: clampDur(c, c.cue('prune-wide').start, 0.45) }));
  });
  c.on('prune-retain', () => {
    s.play(retainOn.to(1, { duration: clampDur(c, c.cue('prune-retain').start, 0.35) }));
  });
  c.on('prune-subtract', () => {
    s.play(subOn.to(1, { duration: clampDur(c, c.cue('prune-subtract').start, 0.35) }));
  });
  c.on('prune-product', () => {
    s.play(prodOn.to(1, { duration: clampDur(c, c.cue('prune-product').start, 0.35) }));
  });
}
