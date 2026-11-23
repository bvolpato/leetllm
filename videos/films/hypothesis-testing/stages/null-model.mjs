import { studies, taskRows } from '../fixtures.mjs';
import { completedHypothesisResult, cueProgress } from '../model.mjs';
import { card, mark, text } from '../defaults.mjs';

const disagreements = taskRows.filter((row) => row.difference);
const observedWins = disagreements.filter((row) => row.b > row.a).length;
const firstAssignment = studies.null[0].signs;
const total = 2 ** disagreements.length;
// Start the enumeration with the same assignment the viewer just built.
const firstMask = firstAssignment.reduce((mask, sign, i) => mask + sign * 2 ** i, 0);
const winCounts = Array.from({ length: total }, (_, i) => {
  let pattern = i ^ firstMask;
  let wins = 0;
  while (pattern) {
    wins += pattern & 1;
    pattern >>>= 1;
  }
  return wins;
});

function oneDisagreement(ctx, state, api) {
  const C = api.C;
  const open = cueProgress(state, 'null-single', 0);
  text(ctx, api, 'Six observed tasks', 230, 322, 38, C.ink);
  for (const [i, row] of taskRows.slice(0, 6).entries()) {
    const y = 391 + i * 85;
    text(ctx, api, row.task, 230, y + 23, 32, row.difference ? C.yellow : C.muted);
    text(
      ctx,
      api,
      row.difference ? 'B won' : 'tie',
      527,
      y + 23,
      33,
      row.difference ? C.yellow : C.muted,
    );
  }
  mark(api, 'single-branches', () => {
    text(ctx, api, 'If either assistant is equally likely to win', 1220, 322, 35, C.ink, 'center');
    const y = 497;
    const endX = 1030 + 237 * open;
    for (const [sign, label, color] of [
      [-1, 'A wins', C.pink],
      [1, 'B wins', C.green],
    ]) {
      const endY = y + sign * 107 * open;
      api.line(ctx, 760, y, endX, endY, color, 4);
      if (open === 1) card(ctx, api, label, 1300, endY - 38, 300, 76, color, 36);
    }
  });
  mark(api, 'single-tail', () => {
    if (completedHypothesisResult(state, 'null-half', 0))
      text(ctx, api, '1 of 2 fair outcomes favors B', 1210, 795, 43, C.green, 'center');
    else text(ctx, api, 'One disagreement', 1210, 795, 40, C.muted, 'center');
  });
}

function assignSigns(ctx, state, api) {
  const C = api.C;
  const count = Math.floor(disagreements.length * cueProgress(state, 'null-signs', 1));
  const wins = firstAssignment.slice(0, count).reduce((sum, sign) => sum + sign, 0);
  mark(api, 'null-signs', () => {
    text(ctx, api, 'Forty tasks   ·   Keep the 13 disagreements', 223, 310, 38, C.ink);
    for (const [i, row] of disagreements.entries()) {
      const x = 229 + (i % 7) * 214;
      const y = 445 + Math.floor(i / 7) * 178;
      text(ctx, api, row.id, x + 82, y - 24, 28, C.muted, 'center');
      const b = firstAssignment[i];
      card(
        ctx,
        api,
        i >= count ? '?' : b ? 'B wins' : 'A wins',
        x,
        y,
        164,
        77,
        i >= count ? C.muted : b ? C.green : C.pink,
        33,
      );
    }
  });
  mark(api, 'null-count', () =>
    text(
      ctx,
      api,
      `${wins} B wins   ·   ${count} of 13 fair directions drawn`,
      960,
      862,
      41,
      C.ink,
      'center',
    ),
  );
  text(ctx, api, '27 ties stay out of this count', 960, 979, 32, C.muted, 'center');
}

function enumerate(ctx, state, api) {
  const C = api.C;
  const n = 1 + Math.floor((total - 1) * cueProgress(state, 'null-enumerate', 2));
  const predict = completedHypothesisResult(state, 'null-bar-share', 2);
  const counts = Array(disagreements.length + 1).fill(0);
  for (let i = 0; i < n; i++) counts[winCounts[i]]++;
  mark(api, 'null-histogram', () => {
    text(
      ctx,
      api,
      `${n.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} possible assignments`,
      960,
      327,
      41,
      C.ink,
      'center',
    );
    api.teaching.bars({
      x: 210,
      y: 390,
      width: 1480,
      height: 335,
      values: counts.map((v) => v / total),
      labels: counts.map((_, i) => String(i)),
      colors: counts.map((_, i) => {
        if (predict) return i === observedWins ? C.yellow : C.blue;
        return i === winCounts[0] ? C.cyan : C.blue;
      }),
      max: 0.24,
      fontSize: 29,
      showValues: false,
    });
    text(ctx, api, 'B wins among 13 disagreements', 960, 829, 34, C.ink, 'center');
    text(
      ctx,
      api,
      predict
        ? `We observed ${observedWins} B wins. Which counts favor B at least as much?`
        : `${counts[winCounts[0]].toLocaleString('en-US')} assignments with ${winCounts[0]} B wins`,
      960,
      957,
      36,
      predict ? C.yellow : C.cyan,
      'center',
    );
  });
}

export function drawNullModel(ctx, scene, state, api) {
  [oneDisagreement, assignSigns, enumerate][state.beat ?? 0](ctx, state, api);
}
export default {
  id: 'null-model',
  draw: drawNullModel,
  cues: ['null-single', 'null-half', 'null-signs', 'null-count', 'null-enumerate', 'null-bar-share'],
};
