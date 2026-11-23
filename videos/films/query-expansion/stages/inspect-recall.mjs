import { REQUIRED_RUNBOOKS } from '../fixtures.mjs';
import { reciprocalRankFusion, retrievalRun, runbookCoverage } from '../model.mjs';
import { spoken } from '../construction.mjs';

export function drawInspectRecall(ctx, scene, state, api) {
  const { C, focus } = api;
  const run = retrievalRun();
  const one = spoken(state, 1, 'recall-one') === 1;
  const all = spoken(state, 2, 'recall-both') === 1;
  const gapExplained = spoken(state, 2, 'recall-gap') === 1;
  const lists = run.allRankings.slice(0, all ? 4 : one ? 2 : 1);
  const ids = reciprocalRankFusion(lists)
    .slice(0, 3)
    .map((row) => row.id);
  const coverage = runbookCoverage(ids);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);

  label('Launch question', 130, 245, 29, C.muted);
  label('How much traffic can burst, and what happens when the queue fills?', 130, 323, 45);
  api.line(ctx, 130, 374, 1790, 374, C.muted, 2);
  focus.target('recall-search', () => {
    label(
      all
        ? 'All three variants + original'
        : one
          ? 'Original + “burst quota limit”'
          : 'Original · “peak demand handling”',
      130,
      463,
      36,
      C.blue,
    );
    label('Top 3 results', 130, 540, 28, C.muted);
    if (!ids.length) label('No word matches', 130, 624, 40);
    ids.forEach((id, i) => label(i + 1 + '    ' + id, 130, 624 + i * 78, 40, C.cyan));
  });
  focus.target('required-pages', () => {
    label('Evidence required before searching', 1015, 460, 34, C.ink);
    REQUIRED_RUNBOOKS.forEach((id, i) => {
      const y = 565 + i * 142;
      const found = coverage.found.includes(id);
      const tone = found ? C.green : C.muted;
      api.rect(ctx, 1016, y - 28, 26, 26, found ? C.green : C.panel, tone, 2);
      label(['Burst allowance', 'Full queue'][i], 1070, y, 36);
      label(
        id + (found ? '  ·  found at #' + (ids.indexOf(id) + 1) : '  ·  missing'),
        1070,
        y + 54,
        31,
        tone,
      );
    });
  });
  api.line(ctx, 130, 830, 1790, 830, C.muted, 2);
  focus.target('recall-metrics', () => {
    const values = [
      ['Any hit in top 3', String(coverage.hit)],
      ['Recall at 3', coverage.found.length + ' / ' + REQUIRED_RUNBOOKS.length],
      ['All required pages?', coverage.complete ? 'Yes' : one && !gapExplained ? '?' : 'No'],
    ];
    values.forEach(([name, value], i) => {
      const x = 344 + 610 * i;
      label(name, x, 892, 30, C.muted, 'center');
      label(value, x, 971, 52, C.ink, 'center');
    });
  });
}

export default {
  id: 'inspect-recall',
  draw: drawInspectRecall,
  cues: ['recall-gold', 'recall-raw', 'recall-one', 'recall-metric', 'recall-gap', 'recall-both'],
};
