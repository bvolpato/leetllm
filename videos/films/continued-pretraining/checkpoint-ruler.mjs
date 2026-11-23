import { chooseCheckpoint } from './model.mjs';

export function drawCheckpointRuler(
  ctx,
  api,
  { rows, base, budget, domain, visibleCount, gated, ranked, message },
) {
  const { C } = api;
  const left = 550,
    right = 1105,
    limit = base + budget;
  const point = (value) => left + ((right - left) * (value - domain[0])) / (domain[1] - domain[0]);
  const winner = chooseCheckpoint(rows, base, budget);
  api.focus.target('retention-rule', () => {
    api.text(ctx, 'General perplexity ceiling', 175, 277, 35, C.muted);
    api.text(
      ctx,
      base.toFixed(1) + '  +  ' + budget.toFixed(1) + '  =  ' + limit.toFixed(1),
      740,
      283,
      48,
      C.yellow,
    );
  });
  api.text(ctx, 'Checkpoint', 175, 392, 31, C.muted);
  api.text(ctx, 'General PPL', 451, 392, 31, C.muted, 'center');
  api.text(ctx, 'Task accuracy', 1340, 392, 31, C.muted, 'center');
  api.text(ctx, 'Domain PPL', 1655, 392, 31, C.muted, 'center');
  const top = 495,
    spacing = rows.length === 3 ? 145 : 118;
  api.focus.target('retention-rule', () => {
    const bottom = top + (rows.length - 1) * spacing;
    api.line(ctx, point(limit), top - 49, point(limit), bottom + 46, C.yellow, 3);
    api.text(ctx, '≤ ' + limit.toFixed(1), point(limit), bottom + 88, 30, C.yellow, 'center');
  });
  rows.forEach((row, i) => {
    if (i >= visibleCount) return;
    const y = top + i * spacing;
    const eligible = row.general <= limit;
    const chosen = ranked && row.label === winner.label;
    const color = chosen ? C.green : gated && !eligible ? C.pink : C.ink;
    api.focus.target('candidate-readings', () => {
      api.text(ctx, row.label.replace(/^CPT /, ''), 175, y + 15, 43, color);
      api.text(ctx, row.general.toFixed(1), 451, y + 13, 35, color, 'center');
      api.line(ctx, left, y, right, y, C.muted, 2);
      const px = point(row.general);
      api.circle(ctx, px, y, 11, color);
      if (gated && !eligible) {
        api.line(ctx, px - 17, y - 17, px + 17, y + 17, C.pink, 4);
        api.line(ctx, px - 17, y + 17, px + 17, y - 17, C.pink, 4);
      }
    });
    api.focus.target('rank-scores', () => {
      api.text(ctx, row.task + '%', 1340, y + 15, 44, color, 'center');
      api.text(ctx, row.domain.toFixed(1), 1655, y + 15, 42, color, 'center');
      if (chosen) api.line(ctx, 1290, y + 32, 1390, y + 32, C.green, 4);
    });
  });
  if (message)
    api.focus.target('selection-result', () => {
      api.text(ctx, message, 960, 1001, 40, ranked ? C.green : C.ink, 'center');
    });
}
