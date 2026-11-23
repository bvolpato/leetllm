import { human, judge } from '../fixtures.mjs';
import { drawRestoreBallots } from '../restore-ballots.mjs';

// Hypothetical second configuration on the same eight cases.
const revised = judge.with(5, 'stepwise').with(7, 'compact');
const scores = [judge, revised].map((votes) => votes.filter((vote, i) => vote === human[i]).length);

function headline(ctx, api, target, x, label, sample, percent, visible) {
  api.focus.target(target, () => {
    api.text(ctx, label, x, 384, 38, api.C.ink);
    api.line(ctx, x, 420, x + 690, 420, api.C.muted, 2);
    api.text(ctx, visible ? percent + '%' : '?', x, 602, 148, api.C.ink, 'left', 'serif');
    api.text(ctx, sample, x, 682, 34, api.C.muted);
  });
}

export function drawTransfer(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 4) {
    return drawRestoreBallots(ctx, api, {
      showVotes: focus.progress('restore-votes', 0) === 1,
      handoff: true,
    });
  }
  if (!focus.visible('paired-replay')) {
    headline(
      ctx,
      api,
      'old-report',
      160,
      'Original judge and rubric',
      'Agreement on case set X',
      83,
      focus.visible('first-report'),
    );
    headline(
      ctx,
      api,
      'new-report',
      1040,
      'Revised judge and rubric',
      'Agreement on case set Y',
      89,
      focus.visible('second-report'),
    );
    focus.target('report-question', () => {
      if (focus.visible('overlap-question'))
        api.text(
          ctx,
          'What would you hold fixed to compare the judges?',
          960,
          905,
          48,
          C.ink,
          'center',
          'serif',
        );
    });
    return;
  }
  const cols = [200, 627, 1085, 1550];
  focus.target('comparison', () => {
    api.text(
      ctx,
      'Same eight cases   /   Independent key   /   Illustrative replay',
      150,
      237,
      31,
      C.muted,
    );
    ['Case', 'Human key', 'Original', 'Revised'].forEach((s, i) =>
      api.text(ctx, s, cols[i], 343, 38, C.ink, 'center'),
    );
    for (const [i, key] of human.entries()) {
      const y = 418 + i * 61;
      const change = judge[i] !== revised[i];
      const rowTarget = change ? (revised[i] === key ? 'gain' : 'loss') : 'same-row';
      const known =
        !change || focus.progress(rowTarget === 'gain' ? 'first-change' : 'second-change', 0) === 1;
      focus.target(rowTarget, () => {
        const color = change && known ? (revised[i] === key ? C.green : C.pink) : C.ink;
        if (change && known) api.line(ctx, 150, y + 14, 1745, y + 14, color, 2);
        const values = [String(i + 1).padStart(2, '0'), key, judge[i], known ? revised[i] : '?'];
        values.forEach((value, col) =>
          api.text(
            ctx,
            value,
            cols[col],
            y,
            36,
            col === 0 ? C.muted : col === 3 ? color : C.ink,
            'center',
          ),
        );
      });
    }
  });
  if (focus.visible('paired-score'))
    focus.target('paired-total', () => {
      api.line(ctx, 150, 896, 1745, 896, C.muted, 2);
      api.text(ctx, 'Matches with the human key', 150, 968, 37, C.ink);
      if (focus.progress('paired-score', 0) === 1)
        scores.forEach((n, i) =>
          api.text(ctx, n + ' / ' + human.length, cols[i + 2], 973, 52, C.yellow, 'center'),
        );
    });
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'first-report',
    'second-report',
    'overlap-question',
    'paired-replay',
    'first-change',
    'second-change',
    'paired-score',
    'inspect-rows',
    'frozen-set',
    'restore-setup',
    'restore-votes',
    'restore-question',
  ],
};
