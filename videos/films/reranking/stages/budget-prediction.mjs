import { pairLengthWork } from '../arithmetic.mjs';
import { budgetCandidates } from '../fixtures.mjs';
import { budgetPredictionState } from '../model.mjs';
import { card, equation, originalCaption, text } from '../defaults.mjs';
export function drawBudgetPrediction(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  const route = (a, b, color = themeColors.cyan, progress = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      gap: 40,
      width: 3,
    });
    components.particle({
      points: [r.from, r.to],
      progress,
      fill: color,
      radius: 8,
    });
  };
  {
    const lengthCue = state.cues?.['pair-length'],
      showLength =
        beat > 1 || (beat === 1 && (lengthCue ? lengthCue.phase !== 'before' : progress2 > 0.4));
    if (showLength) {
      api.focus.target('return-question', () =>
        text(
          ctx,
          api,
          'Can I return a book after closing?',
          960,
          265,
          38,
          themeColors.yellow,
          'center',
        ),
      );
      budgetCandidates.forEach((row, i) =>
        api.focus.target('candidate-pairs', () =>
          card(
            ctx,
            api,
            row.label + ' · ' + row.score.toFixed(2),
            180 + i * 560,
            315,
            450,
            i === 2 ? themeColors.green : themeColors.blue,
            80,
            29,
          ),
        ),
      );
      api.focus.target('scoring-budget', () =>
        card(ctx, api, 'Same 3 admitted pairs', 180, 435, 600, themeColors.yellow, 80, 30),
      );
      api.focus.target('selected-pair', () =>
        card(ctx, api, 'Selected: Return box', 1000, 435, 600, themeColors.green, 80, 30),
      );
      const progress = api.focus.progress('quadratic-component', beat > 1 ? 1 : 0),
        examples = [pairLengthWork(8, 56), pairLengthWork(8, 248)];
      text(
        ctx,
        api,
        'Supplied token counts · dense attention component',
        960,
        575,
        29,
        themeColors.muted,
        'center',
      );
      examples.forEach((row, i) => {
        const x = i ? 1110 : 240,
          side = i ? 256 : 64,
          cells = i ? 32 : 8,
          color = i ? themeColors.pink : themeColors.cyan,
          done = Math.floor(cells * cells * progress) * 64;
        api.focus.target('pair-token-lengths', () =>
          text(
            ctx,
            api,
            'Query ' +
              row.queryTokens +
              ' + passage ' +
              row.passageTokens +
              ' = ' +
              row.sequence +
              ' tokens',
            i ? 1370 : 535,
            645,
            28,
            color,
            'center',
          ),
        );
        api.focus.target('pair-attention-work', () =>
          teaching.grid({
            x,
            y: 700,
            width: side,
            height: side,
            rows: cells,
            columns: cells,
            fill: themeColors.panel,
            stroke: color,
            highlights: Array.from(
              {
                length: Math.floor(cells * cells * progress),
              },
              (_, index) => ({
                row: Math.floor(index / cells),
                column: index % cells,
                fill: color,
                opacity: 0.8,
              }),
            ),
          }),
        );
        api.focus.target('pair-work-calculation', () => {
          equation(
            ctx,
            api,
            progress === 1
              ? row.sequence + '^2=' + done.toLocaleString()
              : row.sequence + '\\times' + row.sequence,
            i ? 1580 : 590,
            790,
            36,
            color,
          );
          text(
            ctx,
            api,
            row.candidates + ' pairs · ' + (done * row.candidates).toLocaleString(),
            i ? 1600 : 590,
            860,
            27,
            color,
            'center',
          );
        });
      });
      text(
        ctx,
        api,
        'One grid tile = 8 × 8 token pairs',
        1370,
        1020,
        23,
        themeColors.muted,
        'center',
      );
      api.focus.target('pair-work-calculation', () =>
        text(
          ctx,
          api,
          progress === 1
            ? 'Same pair count · 16× attention entries'
            : 'Constructing the sequence-length square',
          600,
          975,
          31,
          themeColors.yellow,
          'center',
        ),
      );
      return;
    }
    let current = budgetPredictionState(beat, progress2);
    if (state.cues?.['third-candidate']) {
      const depth = ['first-candidate', 'second-candidate', 'third-candidate'].filter(
          (cue) => api.focus.progress(cue, 0) === 1,
        ).length,
        admitted = budgetCandidates.slice(0, depth),
        result = [...admitted].sort((a, b) => b.score - a.score)[0] ?? null;
      current = {
        depth,
        admitted,
        result,
        targetAdmitted: depth === 3,
      };
    }
    const paused = beat === 0;
    api.focus.target('return-question', () =>
      text(
        ctx,
        api,
        'Can I return a book after closing?',
        960,
        265,
        42,
        themeColors.yellow,
        'center',
      ),
    );
    const input = budgetCandidates.map((row, i) =>
      api.focus.target('candidate-pairs', () =>
        card(
          ctx,
          api,
          current.admitted.includes(row) ? `${row.label} · ${row.score.toFixed(2)}` : row.label,
          180,
          330 + i * 175,
          450,
          current.admitted.includes(row)
            ? i === 2
              ? themeColors.green
              : themeColors.blue
            : themeColors.muted,
        ),
      ),
    );
    const scorer = api.focus.target('scoring-budget', () =>
      card(
        ctx,
        api,
        paused
          ? 'Scoring held'
          : current.depth + ' admitted pair' + (current.depth === 1 ? '' : 's'),
        850,
        500,
        390,
        themeColors.yellow,
        110,
      ),
    );
    if (!paused)
      input
        .slice(0, current.depth)
        .forEach((a, i) => route(a, scorer, i === 2 ? themeColors.green : themeColors.blue, q));
    const target = api.focus.target('selected-pair', () =>
      card(
        ctx,
        api,
        current.result ? `Top pair: ${current.result.label}` : 'Result pending',
        1360,
        500,
        450,
        current.targetAdmitted ? themeColors.green : themeColors.muted,
        110,
      ),
    );
    if (current.result)
      route(scorer, target, current.targetAdmitted ? themeColors.green : themeColors.blue, q);
    text(
      ctx,
      api,
      paused
        ? 'Smallest depth that admits the return-box guide?'
        : `Current prefix: ${current.depth} / 3 candidates`,
      960,
      875,
      34,
      themeColors.ink,
      'center',
    );
    originalCaption(ctx, api, paused ? '' : 'Supplied pair states and fixed scoring head');
  }
}
export default {
  id: 'budget-prediction',
  draw: drawBudgetPrediction,
  cues: [
    'new-question',
    'predict-depth',
    'first-candidate',
    'second-candidate',
    'third-candidate',
    'pair-length',
    'quadratic-component',
    'equal-candidate-counts',
    'serving-tradeoff',
  ],
};
