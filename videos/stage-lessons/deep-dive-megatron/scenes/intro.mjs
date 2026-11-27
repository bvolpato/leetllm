// Scene 01: Four workers saved the row. Two are reloading it. Col 6 (weight 1.5) moves from Old Rank 3 slot 0 -> New Rank 1 slot 2 (6-4=2); probe x6=2 -> 3.0!
import {
  CHECKPOINT_ROW,
  COSMOS,
  ROLE,
  TRACKED_COL,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function intro(s, c) {
  // step: 0=saved 4x2, 1=find col 6, 2=new 2x4 layout, 3=ask owner (hold!), 4=Rank 1!, 5=slot 2 (6-4), 6=probe x6=2, 7=both give 3!
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#60a5fa1c');
  const title = heroTitle(['Four Saved the Row.', 'Two Reload It.'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ep,
    eyebrow: 'CHECKPOINT RESHARDING · GLOBAL COLUMN ADDRESS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const cellW = 162;
    const gap = 16;
    const startX = -705;

    const nodes = [
      txt('SAVED LAYOUT: 4 WORKERS × 2 COLUMNS EACH', 0, -238, 26, COSMOS.muted, 'mono'),
    ];

    // Saved 4x2 brackets
    for (let r = 0; r < 4; r++) {
      const cx = startX + (r * 2 + 0.5) * (cellW + gap) + cellW * 0.5;
      nodes.push(txt(`Old R${r}`, cx, -196, 26, r === 3 ? COSMOS.gold : ROLE.tp, 'mono'));
    }

    CHECKPOINT_ROW.forEach((v, col) => {
      const cx = startX + col * (cellW + gap) + cellW * 0.5;
      const isSix = col === TRACKED_COL;
      nodes.push(
        glassCell(cx, -120, cellW, 92, isSix ? COSMOS.gold : ROLE.tp, {
          fill: isSix ? '#261e0e' : '#0f1d36',
          glow: isSix ? 11 : 3,
        }),
        txt(`c${col}`, cx, -150, 26, COSMOS.muted, 'mono'),
        txt(String(v), cx, -104, 34, isSix ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    });

    // Reloaded 2x4 layout below
    nodes.push(
      txt(
        st >= 2 ? 'NEW LAYOUT: 2 WORKERS × 4 COLUMNS EACH' : 'NEW LAYOUT (2 WORKERS)',
        0,
        10,
        26,
        st >= 2 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt(
        'New Rank 0  (cols 0..3)',
        startX + 1.5 * (cellW + gap) + cellW * 0.5,
        52,
        26,
        ROLE.cp,
        'mono',
      ),
      txt(
        'New Rank 1  (cols 4..7)',
        startX + 5.5 * (cellW + gap) + cellW * 0.5,
        52,
        26,
        st >= 4 ? ROLE.good : COSMOS.gold,
        'mono',
      ),
    );

    CHECKPOINT_ROW.forEach((v, col) => {
      const cx = startX + col * (cellW + gap) + cellW * 0.5;
      const isSix = col === TRACKED_COL;
      const landed = !isSix || st >= 4;
      const colStyle = isSix ? (st >= 4 ? ROLE.good : COSMOS.gold) : ROLE.cp;
      nodes.push(
        glassCell(cx, 128, cellW, 92, landed ? colStyle : COSMOS.dim, {
          fill: isSix && st >= 4 ? '#0d2924' : landed ? '#0e202c' : '#0a0f1c',
          glow: isSix ? 11 : 3,
        }),
        txt(`s${col % 4}`, cx, 98, 26, COSMOS.muted, 'mono'),
        txt(
          landed ? String(v) : '?',
          cx,
          144,
          34,
          isSix ? (st >= 4 ? ROLE.good : COSMOS.gold) : COSMOS.ink,
          'mono',
        ),
      );
    });

    const foot =
      st >= 7
        ? 'Probe x[6] = 2 (others 0): 1.5 × 2 = 3.0 on BOTH layouts!'
        : st >= 6
          ? 'Single-column probe: feed x[6] = 2, all other inputs 0'
          : st >= 5
            ? 'New Rank 1 starts at col 4 -> local slot = 6 - 4 = 2 (weight = 1.5)'
            : st >= 4
              ? 'Column 6 lands on New Rank 1!'
              : st >= 3
                ? 'Predict: counting from 0, which new rank & local slot receive column 6?'
                : 'Weight 1.5 leaves Old Rank 3, slot 0 (global column 6)';

    nodes.push(txt(foot, 0, 340, 28, st >= 4 ? ROLE.good : COSMOS.gold, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['intro-saved-pairs', 0, true],
    ['intro-find-six', 1, true],
    ['intro-new-layout', 2, true],
    ['intro-choose-owner', 3, true],
    ['intro-move', 4, true],
    ['intro-local-index', 5, true],
    ['intro-probe', 6, true],
    ['intro-score', 7, true],
  ]);
}
