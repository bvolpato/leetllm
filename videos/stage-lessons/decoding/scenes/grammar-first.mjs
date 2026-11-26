// Scene 25: grammar-first: "What emptied the candidate pool?"
// Signature luminous DFA Grammar Mask Gate intersecting with top-p = 0.80 on [0.60, 0.30, 0.10].
// Beat 0: Cutoff first keeps IDs 0 & 1, drops sole legal ID 2 -> empty pool!
// Beat 1: Grammar first masks IDs 0 & 1 to -Inf -> ID 2 renormalizes to 1.000 -> survives top-p!
// Beat 2: Empty grammar (all -Inf) -> both T = 0 and T = 1 reject cleanly.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  decodeNormalize,
  decodeSupport,
  fmt,
  glowRing,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function grammarFirst(s, c) {
  const title = heroTitle(['Grammar masks before', 'probability truncation'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const row = [0.6, 0.3, 0.1];
  const nucRes = decodeSupport(row, 'p', 0.8);
  const legalRow = decodeNormalize([0, 0, 0.1]);

  const showLegal = s.value(0);
  const cutFirst = s.value(0);
  const hitEmpty = s.value(0);
  const restartGram = s.value(0);
  const gramOnly = s.value(0);
  const emptyGram = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const hasLegal = showLegal.value > 0.35;
    const isCut = cutFirst.value > 0.4;
    const isEmpty = hitEmpty.value > 0.4;
    const isGramFirst = restartGram.value > 0.4;
    const isSolved = gramOnly.value > 0.4;
    const isAllMask = emptyGram.value > 0.4;

    // Mode indicator top-right
    const modeTxt = isAllMask
      ? 'Empty grammar (all -∞)'
      : isGramFirst
        ? 'Order: Grammar -> Top-p 0.80'
        : 'Order: Top-p 0.80 -> Grammar';
    const modeCol = isAllMask ? ROLE.pruned : isGramFirst ? ROLE.valid : ROLE.heat;
    nodes.push(
      txt(modeTxt, 845, -395, 32, modeCol, 'mono', 'right').glow(7, modeCol).opacity(alpha),
    );

    // Determine right-hand surviving distribution
    let rightVals = row;
    if (isAllMask) rightVals = [0, 0, 0];
    else if (isGramFirst) rightVals = isSolved ? legalRow : [0, 0, 0.1];
    else if (isEmpty) rightVals = [0, 0, 0];
    else if (isCut) rightVals = nucRes.values;

    // Column headers
    nodes.push(
      txt('Original probabilities', -520, -245, 28, ROLE.base, 'mono', 'center').opacity(alpha),
      txt('DFA mask gate', 0, -245, 28, modeCol, 'mono', 'center').opacity(alpha),
      txt('Surviving pool', 535, -245, 28, ROLE.active, 'mono', 'center').opacity(alpha),
    );

    // Center glowing DFA automaton node ring
    const dfaCol = isAllMask ? ROLE.pruned : ROLE.valid;
    nodes.push(
      glowRing(0, 10, 62, dfaCol, { width: 3.4, glow: 13, fillOpacity: 0.16, opacity: alpha }),
      txt('DFA', 0, -8, 30, dfaCol, 'mono', 'center').opacity(alpha),
      txt(
        isAllMask ? '∅' : '{ID 2}',
        0,
        28,
        26,
        isAllMask ? ROLE.pruned : ROLE.winner,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // 3 token lanes
    const ys = [-125, 10, 145];
    const barL = -710;
    const barW = 360;
    const rBarL = 290;
    const rBarW = 360;

    row.forEach((p, i) => {
      const y = ys[i];
      const legal = i === 2 && !isAllMask;
      const origW = p * barW;
      const surv = rightVals[i];
      const survW = surv * rBarW;
      const lCol = legal && hasLegal ? ROLE.winner : ROLE.base;
      const rCol = isSolved && legal ? ROLE.valid : surv > 0 ? ROLE.active : ROLE.pruned;

      // Left original bar
      nodes.push(
        txt(`ID ${i}`, barL - 30, y, 32, lCol, 'mono', 'right').opacity(alpha),
        lumBar(barL + origW / 2, y, Math.max(10, origW), 48, {
          color: lCol,
          fillOpacity: legal && hasLegal ? 0.48 : 0.32,
          strokeWidth: legal && hasLegal ? 2.8 : 2,
          glow: legal && hasLegal ? 11 : 6,
          radius: 7,
          opacity: alpha,
        }),
        txt(fmt(p, 2), barL + origW + 22, y, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      );

      // Gate laser beam stops cleanly outside the center DFA ring (zero text crossing!)
      const passBeam = legal;
      const beamCol = passBeam ? ROLE.valid : ROLE.pruned;
      const beamStyle = {
        stroke: beamCol,
        width: passBeam ? 3.5 : 2.2,
        dash: passBeam ? undefined : [7, 6],
      };
      const beamOp = (hasLegal || isAllMask ? 0.9 : 0.3) * alpha;
      if (i === 1) {
        nodes.push(
          line([-175, y], [-70, y], beamStyle)
            .glow(passBeam ? 8 : 3, beamCol)
            .opacity(beamOp),
          line([70, y], [175, y], beamStyle)
            .glow(passBeam ? 8 : 3, beamCol)
            .opacity(beamOp),
        );
      } else {
        nodes.push(
          line([-175, y], [175, y], beamStyle)
            .glow(passBeam ? 8 : 3, beamCol)
            .opacity(beamOp),
        );
      }
      if (!passBeam && (hasLegal || isAllMask)) {
        nodes.push(txt('-∞', 120, y - 34, 26, ROLE.pruned, 'mono', 'center').opacity(alpha));
      } else if (passBeam && hasLegal) {
        nodes.push(glowDot(120, y, { radius: 6, color: ROLE.valid, glow: 10, opacity: alpha }));
      }

      // Right surviving bar
      if (surv > 0) {
        nodes.push(
          lumBar(rBarL + survW / 2, y, Math.max(12, survW), 48, {
            color: rCol,
            fillOpacity: isSolved && legal ? 0.56 : 0.36,
            strokeWidth: isSolved && legal ? 3 : 2.2,
            glow: isSolved && legal ? 12 : 7,
            radius: 7,
            opacity: alpha,
          }),
          txt(fmt(surv, 3), rBarL + rBarW + 24, y, 30, rCol, 'mono', 'left')
            .glow(isSolved && legal ? 7 : 0, rCol)
            .opacity(alpha),
        );
      } else {
        nodes.push(
          txt('excluded', rBarL + 110, y, 28, ROLE.pruned, 'mono', 'center').opacity(alpha),
        );
      }
    });

    // Bottom status banner
    let msg = 'Grammar allows only ID 2 (original probability 0.10).';
    let msgCol = COSMOS.muted;
    if (isAllMask) {
      msg = 'No legal token exists: T = 0 -> REJECT   |   T = 1 -> REJECT';
      msgCol = ROLE.pruned;
    } else if (isSolved) {
      msg = 'Grammar first -> ID 2 renormalizes to 1.000 -> survives top-p = 0.80!';
      msgCol = ROLE.valid;
    } else if (isGramFirst) {
      msg = 'Apply grammar mask first, then recompute top-p over legal tokens.';
      msgCol = ROLE.active;
    } else if (isEmpty) {
      msg = 'EMPTY POOL -> REJECT!  Where did we lose the sole legal token?';
      msgCol = ROLE.pruned;
    } else if (isCut) {
      msg = 'Top-p = 0.80 kept IDs 0 & 1 (0.90) and dropped ID 2!';
      msgCol = ROLE.heat;
    }

    nodes.push(
      txt(msg, 0, 355, 32, msgCol, 'serif', 'center')
        .glow(isEmpty || isSolved || isAllMask ? 7 : 0, msgCol)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.pruned), title, mainLayer);

  playCue(s, c, 'dec-grammar-first-1', (d) => s.play(showLegal.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'dec-grammar-truncation', (d) => s.play(cutFirst.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-grammar-empty', (d) => s.play(hitEmpty.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  playCue(s, c, 'dec-grammar-first-2', (d) => s.play(restartGram.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'dec-grammar-only', (d) => s.play(gramOnly.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  playCue(s, c, 'dec-grammar-first-3', (d) => s.play(emptyGram.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
