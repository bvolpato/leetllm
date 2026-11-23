import { SHORT } from '../fixtures.mjs';
import { ranked } from '../construction.mjs';
import { preferredPairs } from '../model.mjs';
import { cueProgress, drawRecommendationColor } from '../defaults.mjs';

const rows = ranked;
const selected = ['api-guide', 'blog-post'].map((id) => rows.find((page) => page.id === id));
const preferences = preferredPairs(rows);
const comparisons = rows.flatMap((a, i) =>
  rows.slice(i + 1).map((b) => ({
    row: i,
    col: rows.indexOf(b) - 1,
    preferred: preferences.some((p) => p.preferred === a.id && p.other === b.id),
    grades: [a.relevance, b.relevance],
  })),
);

export function paintPointwiseTarget(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const progress = (id, b, a, z) => cueProgress(state, api, id, b, a, z);
  const label = (v, x, y, size, color, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const rowY = (i) => 417 + i * 102;
  const rowWidth = 480;
  const grouped = progress('training-list', 3, 0.44, 0.68);
  const pick = progress('training-pick', 3, 0.02, 0.22);
  const carry = progress('training-carry', 4, 0.02, 0.27);
  if (carry > 0) {
    const move = api.ease(carry);
    api.focus.target('training-pair', () => {
      for (const [i, page] of selected.entries()) {
        const startY = rowY(rows.indexOf(page));
        const x = api.lerp(150, i === 0 ? 380 : 1150, move);
        const y = api.lerp(startY, 535, move);
        label(
          SHORT[page.id],
          x,
          y,
          api.lerp(37, 70, move),
          drawRecommendationColor(ctx, api, C, page),
        );
        const gradeX = x + api.lerp(455, 0, api.phase(carry, 0.26, 1));
        const gradeY = y + 120 * api.phase(carry, 0, 0.32);
        label(String(page.relevance), gradeX, gradeY, api.lerp(39, 78, move), C.ink);
      }
      if (carry === 1) {
        label('Judged grades for the same search', 960, 320, 39, C.muted, 'center');
        label('>', 965, 655, 84, C.yellow, 'center');
        label('Training target: score the guide higher', 960, 858, 48, C.yellow, 'center');
      }
    });
    return;
  }
  label('Grades for this search', 135, 265, 38, C.ink);
  api.focus.target('training-rows', () => {
    label('Page', 150, 350, 28, C.muted);
    label('Grade', 150 + rowWidth, 350, 28, C.muted, 'right');
    rows.forEach((d, i) => {
      api.focus.target(i === 0 ? 'training-guide' : 'training-row-' + i, () => {
        label(SHORT[d.id], 150, rowY(i), 37, drawRecommendationColor(ctx, api, C, d));
        label(String(d.relevance), 150 + rowWidth, rowY(i), 39, C.ink, 'right');
      });
    });
    if (grouped > 0) {
      const bottom = api.lerp(rowY(0) - 40, rowY(rows.length - 1) + 18, grouped);
      api.line(ctx, 112, rowY(0) - 42, 112, bottom, C.green, 5);
      api.line(ctx, 112, bottom, 130, bottom, C.green, 5);
    }
  });
  if (beat === 0) {
    label('Serving features', 855, 265, 38, C.ink);
    label('Query fit', 1020, 350, 28, C.muted, 'center');
    label('Reliability', 1320, 350, 28, C.muted, 'center');
    rows.forEach((d, i) => {
      label(d.queryFit.toFixed(2), 1020, rowY(i), 37, C.cyan, 'center');
      label(d.reliability.toFixed(2), 1320, rowY(i), 37, C.cyan, 'center');
    });
    if (progress('training-row', 0, 0.23, 0.42) > 0)
      label('One page, one target grade', 150, 946, 40, C.yellow);
    return;
  }

  const ties = progress('training-ties', 2, 0.05, 0.33);
  const top = progress('training-guide-wins', 2, 0.35, 0.52);
  const other = progress('training-other-wins', 2, 0.54, 0.8);
  let tieIndex = 0,
    topIndex = 0,
    otherIndex = 0,
    counted = 0;
  api.focus.target('training-board', () => {
    label('Compare with', 753, 265, 38, C.ink);
    rows
      .slice(1)
      .forEach((d, i) =>
        label(
          SHORT[d.id],
          862 + i * 257,
          350,
          28,
          drawRecommendationColor(ctx, api, C, d),
          'center',
        ),
      );
    for (const cell of comparisons) {
      const { row, col, preferred, grades } = cell;
      const x = 748 + col * 257,
        y = rowY(row) - 54;
      const revealed = preferred
        ? row === 0
          ? top * 4 > topIndex++
          : other * 4 > otherIndex++
        : ties * 2 > tieIndex++;
      if (preferred && revealed) counted++;
      const tiedQuestion = row === 1 && col === 1;
      const picked = row === 0 && rows[col + 1].id === 'blog-post';
      api.focus.target(
        tiedQuestion
          ? 'training-tie'
          : picked
            ? 'training-picked'
            : 'comparison-' + row + '-' + col,
        () => {
          const color = !revealed ? C.muted : preferred ? C.cyan : C.muted;
          const question =
            tiedQuestion && beat === 1 && progress('training-question', 1, 0.45, 0.7) > 0;
          api.rect(
            ctx,
            x,
            y,
            228,
            78,
            C.panel,
            question || (picked && pick > 0) ? C.yellow : color,
            9,
          );
          const word = revealed ? grades.join(preferred ? '  >  ' : '  =  ') : '·';
          label(word, x + 114, y + 51, 34, picked && pick > 0 ? C.yellow : color, 'center');
          if (revealed && !preferred) {
            api.line(ctx, x + 12, y + 63, x + 46, y + 15, C.muted, 3);
            api.line(ctx, x + 182, y + 63, x + 216, y + 15, C.muted, 3);
          }
        },
      );
    }
  });
  if (grouped > 0) {
    label('One list of five judged pages', 148, 948, 39, C.green);
    label('Selected pair    API guide  >  general blog', 748, 948, 38, C.yellow);
  } else if (ties || top || other) {
    api.focus.target('training-count', () => {
      label('Strict preferences', 750, 921, 33, C.muted);
      const total = progress('training-count', 2, 0.9, 0.99) === 1 ? counted : '?';
      label(total + '  /  ' + comparisons.length + ' comparisons', 750, 984, 47, C.cyan);
    });
  } else {
    label('Runbook or SDK example: which one should rank higher?', 148, 950, 42, C.yellow);
  }
}
export default {
  id: 'pointwise-target',
  draw: paintPointwiseTarget,
  cues: [
    'training-row',
    'training-question',
    'training-ties',
    'training-guide-wins',
    'training-other-wins',
    'training-count',
    'training-pick',
    'training-list',
    'training-carry',
  ],
};
