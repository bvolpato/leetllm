// Scene 6: pruned-prefix: "What can a beam still reach?"
// View 1 (Beats 0-1): Retained degraded (0.45) and in (0.30) bars divide 10 equal ways,
//   while pruned "on" (0.15) has certain continuation "track" (1.00) -> 0.150 revealed AFTER prune-result.
// View 2 (Beats 2-3): Per-parent 3-child rows showing why each 3rd child already has 2 better
//   siblings and cannot enter global top-2 (revealed AFTER prune-siblings).
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  STATUS_IDS,
  STATUS_ROW,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function prunedPrefix(s, c) {
  const title = heroTitle(['What can a beam', 'still reach?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.pruned,
  });

  const vPrune = s.value(1);
  const vShortcut = s.value(0);

  // View 1 state
  const splitFrac = s.value(0);
  const showTrack = s.value(0);
  const showResult = s.value(0);

  // View 2 state
  const showChildren = s.value(0);
  const showSiblings = s.value(0);

  // VIEW 1: 10-way split of retained prefixes vs pruned "on -> track"
  const pruneLayer = guardedDynamic(vPrune, (alpha) => {
    const nodes = [];
    const div = splitFrac.value;
    const hasTrack = showTrack.value > 0.4;
    const hasRes = showResult.value > 0.4;

    const barL = -470;
    const barScale = 1520;
    const ys = [-145, 25, 205];

    nodes.push(
      txt('Width-2 beam frontier (step 1)', -845, -260, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha,
      ),
    );

    for (let i = 0; i < 3; i++) {
      const y = ys[i];
      const p = STATUS_ROW[i];
      const isPruned = i === 2;
      const col = isPruned ? (hasRes ? ROLE.winner : ROLE.pruned) : ROLE.base;
      const w = p * barScale;

      nodes.push(
        txt(`${STATUS_IDS[i]}  ${fmt(p, 2)}`, barL - 30, y, 34, col, 'mono', 'right').opacity(
          alpha,
        ),
        lumBar(barL + w / 2, y, w, 58, {
          color: col,
          fillOpacity: isPruned && !hasRes ? 0.16 : 0.42,
          strokeWidth: isPruned && hasRes ? 3.2 : 2.4,
          glow: isPruned && hasRes ? 13 : 8,
          radius: 7,
          opacity: alpha,
        }),
      );

      // 10 equal subdivisions on the two retained bars
      if (!isPruned && div > 0.04) {
        const cuts = Math.round(9 * div);
        for (let k = 1; k <= cuts; k++) {
          const cx = barL + (w * k) / 10;
          nodes.push(
            line([cx, y - 28], [cx, y + 28], { stroke: COSMOS.bg, width: 4.5 }).opacity(alpha),
          );
        }
      }

      // Detail readout cleanly on the right
      let detail = 'retained on beam';
      if (!isPruned && div > 0.85) {
        detail = `${fmt(p, 2)} / 10 = ${fmt(p / 10, 3)} each`;
      } else if (isPruned) {
        if (hasRes) detail = `on track = 0.15 × 1.00 = 0.150`;
        else if (hasTrack) detail = `continuation: "track" (1.00) -> ?`;
        else detail = 'pruned at step 1';
      }
      nodes.push(
        txt(
          detail,
          290,
          y,
          30,
          isPruned && hasRes ? ROLE.winner : isPruned ? ROLE.pruned : ROLE.active,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    nodes.push(
      txt(
        hasRes
          ? 'Best surviving beam child: 0.045  |  Pruned "on track": 0.150 (unreachable)'
          : hasTrack
            ? 'Which two-word path would exhaustive search find?'
            : 'Width 2 retains degraded (0.45) and in (0.30).',
        0,
        375,
        32,
        hasRes ? ROLE.winner : ROLE.active,
        'serif',
        'center',
      )
        .glow(6, hasRes ? ROLE.winner : ROLE.active)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Per-parent top-B shortcut (2 parents × 3 children)
  const shortcutLayer = guardedDynamic(vShortcut, (alpha) => {
    const nodes = [];
    const rows = [
      [0.5, 0.3, 0.2],
      [0.7, 0.2, 0.1],
    ];
    const chVis = showChildren.value;
    const sibDone = showSiblings.value > 0.4;

    nodes.push(
      txt(
        'Two retained parents × three children each (width B = 2)',
        -845,
        -255,
        30,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    const rowYs = [-75, 165];
    const colXs = [-330, 85, 500];

    rows.forEach((conds, r) => {
      const y = rowYs[r];
      const pParent = STATUS_ROW[r];
      nodes.push(
        txt(
          `${STATUS_IDS[r]} (${fmt(pParent, 2)})`,
          -845,
          y,
          34,
          ROLE.base,
          'mono',
          'left',
        ).opacity(alpha),
      );

      conds.forEach((cv, j) => {
        const cx = colXs[j];
        const prod = pParent * cv;
        const isGlobalTop2 = sibDone && j === 0; // 0.225 and 0.210 are both j === 0
        const isThird = j === 2;
        const col = isGlobalTop2 ? ROLE.valid : sibDone && isThird ? ROLE.pruned : ROLE.active;
        const barW = Math.max(12, (prod / 0.25) * 290);
        const itemAlpha = sibDone && isThird ? 0.38 * alpha : Math.max(0.25, chVis) * alpha;

        nodes.push(
          txt(
            `child ${j + 1}: × ${fmt(cv, 2)}`,
            cx,
            y - 56,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(itemAlpha),
          lumBar(cx + 145, y, 290, 44, {
            color: '#2b395e',
            fillOpacity: 0.14,
            strokeWidth: 1.4,
            glow: 2,
            radius: 7,
            opacity: itemAlpha,
          }),
          lumBar(cx + barW / 2, y, barW, 38, {
            color: col,
            fillOpacity: isGlobalTop2 ? 0.56 : 0.36,
            strokeWidth: isGlobalTop2 ? 3 : 2,
            glow: isGlobalTop2 ? 12 : 6,
            radius: 6,
            opacity: itemAlpha,
          }),
          txt(fmt(prod, 3), cx, y + 54, 30, col, 'mono', 'left').opacity(itemAlpha),
        );
      });
    });

    nodes.push(
      txt(
        sibDone
          ? 'Each 3rd child already has 2 better siblings -> per-parent top-2 recovers global top-2 (0.225, 0.210)'
          : 'Could the 3rd child of either parent ever reach the global top two?',
        0,
        380,
        30,
        sibDone ? ROLE.valid : ROLE.winner,
        'serif',
        'center',
      )
        .glow(6, sibDone ? ROLE.valid : ROLE.winner)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.pruned, ROLE.valid), title, pruneLayer, shortcutLayer);

  playCue(s, c, 'prune-split', (d) => s.play(splitFrac.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'prune-track', (d) => s.play(showTrack.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'prune-result', (d) => s.play(showResult.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  c.onBeat(2, () => s.play(swapVis(vPrune, vShortcut, 0.55)));
  playCue(s, c, 'prune-children', (d) => s.play(showChildren.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'prune-siblings', (d) => s.play(showSiblings.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
}
