// Scene 9: exploration - "Which actions did the router try?"
// Top: Two glowing probability draw rails (u in [0,1] vs epsilon = 0.2; v in [0,1] uniform over 3 actions).
// Bottom: Three luminous open collector wells (Approve, Evidence, Review) receiving 8 animated
//         episode chips E01..E08 (1, 6, 1) with live P-7 rejection highlight and P(ask) formula.
import { line, linear } from 'vizmatic/stage';
import {
  ACTIONS,
  ACTION_COLORS,
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  explorationEpisodes,
  explorationEpsilon,
  explorationLedger,
  explorationQ,
  glowArcArrow,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  safeDur,
  txt,
} from '../parts.mjs';

export default function exploration(s, c) {
  const title = heroTitle(['Which actions did', 'the router try?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const e02 = explorationEpisodes[1];
  const hiEps = s.value(0);
  const showU = s.value(0);
  const showV = s.value(0);
  const propArc = s.value(0);
  const hiGate = s.value(0);
  const epProgress = s.value(0); // continuous 0 -> 8 during episodes replay
  const hiUnsafe = s.value(0);
  const hiConv = s.value(0);
  const showOdds = s.value(0);
  const showProb = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];

      // TOP LEFT: Exploration draw rail u in [0, 1] with epsilon = 0.2 cutoff
      const ux0 = -805;
      const ux1 = -135;
      const uy = -190;
      const uxOf = (val) => ux0 + (ux1 - ux0) * val;
      const epsX = uxOf(explorationEpsilon);

      nodes.push(
        txt(
          '1. Explore draw u ∈ [0, 1]',
          (ux0 + ux1) / 2,
          -285,
          28,
          ROLE.state,
          'mono',
          'center',
        ).opacity(alpha),
        glowingTrail(
          [
            [ux0, uy],
            [epsX, uy],
          ],
          {
            color: ROLE.gold,
            width: 7,
            glow: 10,
            opacity: (0.65 + 0.35 * hiEps.value) * alpha,
            core: false,
          },
        ),
        line([epsX, uy], [ux1, uy], { stroke: '#3a4a70', width: 4.5 }).opacity(alpha),
        line([epsX, uy - 34], [epsX, uy + 24], { stroke: ROLE.gold, width: 3.4, dash: [7, 5] })
          .glow(8, ROLE.gold)
          .opacity(alpha),
        txt('0', ux0, uy + 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(`ε = ${explorationEpsilon}`, epsX, uy - 54, 28, ROLE.gold, 'mono', 'center')
          .glow(hiEps.value > 0.5 ? 8 : 3, ROLE.gold)
          .opacity(alpha),
        txt('1', ux1, uy + 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );

      if (showU.value > 0.05) {
        const px = uxOf(e02.u);
        nodes.push(
          glowDot(px, uy, {
            radius: 11,
            color: ROLE.state,
            glow: 14,
            opacity: showU.value * alpha,
          }),
          txt(`E02: ${e02.u}`, px + 26, uy + 44, 26, ROLE.state, 'mono', 'center').opacity(
            showU.value * alpha,
          ),
        );
      }

      // TOP RIGHT: Uniform action draw rail v in [0, 1] split into 3 equal glowing segments
      const vx0 = 135;
      const vx1 = 805;
      const vy = -190;
      const vw = vx1 - vx0;
      const vxOf = (val) => vx0 + vw * val;

      nodes.push(
        txt(
          '2. Uniform action draw v ∈ [0, 1]',
          (vx0 + vx1) / 2,
          -285,
          28,
          ROLE.violet,
          'mono',
          'center',
        ).opacity(alpha),
      );
      ACTIONS.forEach((act, i) => {
        const sx0 = vx0 + (i * vw) / 3;
        const sxm = sx0 + vw / 6;
        nodes.push(
          lumBar(sxm, vy, vw / 3 - 8, 42, {
            color: ACTION_COLORS[i],
            fillOpacity: 0.34,
            strokeWidth: 2.2,
            glow: 6,
            opacity: alpha,
          }),
          txt(act, sxm, vy + 46, 26, ACTION_COLORS[i], 'sans', 'center').opacity(alpha),
        );
      });

      if (showV.value > 0.05) {
        const px = vxOf(e02.v);
        nodes.push(
          glowDot(px, vy, { radius: 11, color: ROLE.gold, glow: 14, opacity: showV.value * alpha }),
          txt(`E02: ${e02.v}`, px - 22, vy - 46, 26, ROLE.gold, 'mono', 'center')
            .glow(6, ROLE.gold)
            .opacity(showV.value * alpha),
        );
      }

      // Glowing proposal trajectory arc routed cleanly down the right outer edge into Review well
      if (propArc.value > 0.05 && epProgress.value < 0.05) {
        nodes.push(
          glowArcArrow([vxOf(e02.v), vy + 24], [790, 82], 0, {
            color: ROLE.review,
            width: 4.0,
            glow: 11,
            opacity: propArc.value * alpha,
            photonT: propArc.value < 0.99 ? propArc.value : null,
          }),
        );
      }

      // BOTTOM: 3 open glowing collector wells (U-trays, NOT closed rectangular boxes!)
      const wellXs = [-585, 0, 585];
      const wellTop = 85;
      const wellBot = 295;
      const wellHalfW = 225;
      const completed = Math.min(8, Math.floor(epProgress.value));
      const ledger = explorationLedger(completed);

      ACTIONS.forEach((act, i) => {
        const wx = wellXs[i];
        const col = ACTION_COLORS[i];
        const isConv = hiConv.value > 0.5;
        // Open U-channel cradle
        nodes.push(
          txt(act, wx, 2, 34, col, 'serif', 'center').opacity(alpha),
          txt(`Q = ${explorationQ[i]}`, wx, 48, 28, col, 'mono', 'center').opacity(alpha),
          glowingTrail(
            [
              [wx - wellHalfW, wellTop],
              [wx - wellHalfW, wellBot],
              [wx + wellHalfW, wellBot],
              [wx + wellHalfW, wellTop],
            ],
            { color: col, width: 3.4, glow: 8, opacity: 0.8 * alpha, core: false },
          ),
          txt(
            `Count: ${ledger.counts[i]}`,
            wx,
            wellBot + 40,
            30,
            isConv ? ROLE.gold : col,
            'mono',
            'center',
          )
            .glow(isConv ? 8 : 3, isConv ? ROLE.gold : col)
            .opacity(alpha),
        );
      });

      // Render arrived episode tokens inside their collector wells
      for (let k = 0; k < completed; k++) {
        const ep = explorationEpisodes[k];
        const rank = explorationLedger(k).counts[ep.action];
        const wx = wellXs[ep.action];
        const colIdx = rank % 3;
        const rowIdx = Math.floor(rank / 3);
        const tx = wx - 135 + colIdx * 135;
        const ty = wellTop + 56 + rowIdx * 78;
        const isUnsafeChip = k === 4 && hiUnsafe.value > 0.5;
        const cCol = isUnsafeChip ? ROLE.gold : ACTION_COLORS[ep.action];
        nodes.push(
          glowDot(tx - 42, ty, {
            radius: isUnsafeChip ? 9 : 6,
            color: cCol,
            glow: isUnsafeChip ? 14 : 8,
            opacity: alpha,
          }),
          txt(ep.id, tx + 8, ty, 28, cCol, 'mono', 'center')
            .glow(isUnsafeChip ? 9 : 3, cCol)
            .opacity(alpha),
        );
        if (isUnsafeChip) {
          nodes.push(
            txt('P-7 blocks live', wx, wellBot - 42, 26, ROLE.approve, 'sans', 'center')
              .glow(6, ROLE.approve)
              .opacity(hiUnsafe.value * alpha),
          );
        }
      }

      // Active in-flight episode photon
      if (epProgress.value > 0.02 && epProgress.value < 8) {
        const idx = Math.floor(epProgress.value);
        const frac = epProgress.value - idx;
        const ep = explorationEpisodes[idx];
        if (ep) {
          const destX = wellXs[ep.action];
          const py = -120 + frac * (wellTop + 170);
          nodes.push(
            glowDot(destX, py, { radius: 10, color: ROLE.state, glow: 14, opacity: alpha }),
          );
        }
      }

      // Footer: P-7 gate note -> P(ask) exact probability equation
      if (showOdds.value > 0.5) {
        const probStr =
          showProb.value > 0.5 ? 'P(ask) = 0.8 + 0.2 / 3 ≈ 0.867 (87%)' : 'P(ask) = 0.8 + 0.2 / 3';
        nodes.push(
          txt(probStr, 0, 415, 36, ROLE.evidence, 'mono', 'center')
            .glow(8, ROLE.evidence)
            .opacity(showOdds.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            hiGate.value > 0.5
              ? 'Every proposal passes through the P-7 authorization gate.'
              : 'Counts track proposed actions across eight simulator episodes.',
            0,
            415,
            30,
            hiGate.value > 0.5 ? ROLE.gold : COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.state, ROLE.review), title, layer);

  playCue(s, c, 'epsilon', (d) => s.play(hiEps.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'explore', (d) => s.play(showU.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'uniform', (d) => s.play(showV.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'proposal', (d) => s.play(propArc.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'gate', (d) => s.play(hiGate.to(1, { duration: d })), { dur: 0.4 });

  // Stream all 8 episodes smoothly inside the episodes -> unsafe window
  c.on('episodes', () => {
    const startT = c.cue('episodes').start;
    const endT = c.cue('unsafe').start;
    const dur = safeDur(c, startT, Math.max(2.2, endT - startT - 0.1));
    s.play(epProgress.to(8, { duration: dur, ease: linear }));
  });

  playCue(s, c, 'unsafe', (d) => s.play(hiUnsafe.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'convergence', (d) => s.play(hiConv.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'greedy-odds', (d) => s.play(showOdds.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'probability', (d) => s.play(showProb.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
}
