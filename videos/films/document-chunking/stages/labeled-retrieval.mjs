import { cueProgress } from '../arithmetic.mjs';
import { pagingContext } from '../packing.mjs';
import { drawPacking } from '../packing-picture.mjs';

const rule = pagingContext(10);
const records = [
  ['Paging', rule.words.join(' ')],
  ['Archive', 'Routine deploy notes: archive within 14 days.'],
  ['Handoff', 'Commander handoff requires the active incident channel.'],
];
const cases = [
  ['rollback failure deploy id', 'Paging', '15 minutes'],
  ['routine deploy archive', 'Archive', '14 days'],
  ['commander incident channel', 'Handoff', 'active incident'],
];
const terms = (value) => new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
const score = (query, passage) => [...terms(query)].filter((term) => terms(passage).has(term)).length;
const samples = cases.map(([query, expected, evidence]) => {
  const [name, body] = records.toSorted((a, b) => score(query, b[1]) - score(query, a[1]))[0];
  return { query, name, evidence, passed: name === expected && body.includes(evidence) };
});

export function drawLabeledRetrieval(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const at = (id, a, b) => cueProgress(state, id, api.phase(state.beatP ?? 0, a, b));
  api.focus.target('retrieval-evidence', () => {
    if (beat === 0) {
      const query = 'rollback failure deploy minutes';
      const candidates = [records[0][1], rule.ranked[1].text, rule.ranked[0].text, records[1][1]];
      text(ctx, 'Search words', 130, 273, 30, C.muted);
      text(ctx, 'rollback    failure    deploy    minutes', 130, 350, 52, C.yellow);
      text(ctx, 'Matching words', 1785, 440, 28, C.muted, 'right');
      const checked = at('count-matches', 0.25, 0.73);
      candidates.forEach((body, i) => {
        const y = 528 + i * 115;
        text(ctx, body, 130, y, 40, C.ink);
        line(ctx, 130, y + 30, 1790, y + 30, C.muted, 1);
        if (checked >= (i + 1) / candidates.length)
          text(ctx, score(query, body) + ' / 4', 1785, y, 40, C.yellow, 'right');
      });
      return;
    }
    if (beat === 1) {
      const shown = at('retrieval-suite', 0.25, 0.7);
      ['Test query', 'Winning record', 'Required text'].forEach((v, i) =>
        text(ctx, v, [130, 890, 1320][i], 330, 34, C.muted));
      samples.forEach((row, i) => {
        const y = 467 + i * 150;
        text(ctx, row.query, 130, y, 38, C.ink);
        if (shown >= (i + 1) / samples.length) {
          text(ctx, row.name, 890, y, 38, C.blue);
          text(ctx, row.evidence, 1320, y, 38, C.green);
        }
        line(ctx, 130, y + 38, 1780, y + 38, C.muted, 1);
      });
      if (shown === 1)
        text(ctx, samples.filter(r => r.passed).length + ' of 3 cases pass both checks', 960, 949, 40, C.green, 'center');
      return;
    }
    if (beat < 5) {
      const reduced = beat > 3 || (beat === 3 && at('nine-spaces', 0.06, 0.23) === 1);
      const run = pagingContext(reduced ? 9 : 10);
      const [first, second] = run.ranked;
      const firstIn = beat === 2 ? at('pack-deadline', 0.19, 0.43) : 1;
      const secondIn = run.selected.includes(second)
        ? beat === 2 ? at('pack-condition', 0.48, 0.72) : 1
        : 0;
      const rejected = beat === 4 && at('packing-verdict', 0.06, 0.45) === 1;
      const considering = reduced && !rejected;
      drawPacking(ctx, api, {
        run, page: 'Incident runbook  /  version 3  /  page 7', maximum: 10, sourceHits: run.ranked,
        rows: [
          { name: considering ? 'Next hit' : rejected ? 'Skipped' : 'Rank 2',
            span: considering || secondIn > 0 ? second : null, progress: considering ? 1 : secondIn, pending: considering },
          { name: considering ? 'Packed' : 'Rank 1', span: firstIn > 0 ? first : null, progress: firstIn },
        ],
        charged: run.selected.filter(hit => (hit === first ? firstIn : secondIn) === 1),
        message: rejected ? 'Right page. The returned text has no paging condition.'
          : reduced ? 'Can the second five-word hit fit?' : 'Keep each hit whole. Read the selected hits in source order.',
        resultColor: rejected ? C.pink : undefined,
      });
      return;
    }
    const budget = 120;
    const expand = at('equal-budget', 0.34, 0.67);
    text(ctx, 'Illustrative lengths in generator tokens', 140, 284, 35, C.muted);
    text(ctx, 'Evidence allowance after reserving instructions, question and output', 140, 359, 42, C.ink);
    for (const [i, length] of [60, 30].entries()) {
      const count = budget / length;
      const visible = i ? 2 + Math.floor(expand * (count - 2)) : 2;
      const y = 470 + i * 197;
      text(ctx, visible + ' hits', 150, y + 68, 41, C.ink);
      for (let j = 0; j < count; j++) {
        const w = 1180 / count;
        rect(ctx, 390 + j * w, y, w - 6, 102, C.panel, j < visible ? C.blue : C.muted, 4);
        if (j < visible) text(ctx, length + ' tokens', 390 + (j + 0.5) * w, y + 65, 34, C.blue, 'center');
      }
      text(ctx, String(visible * length) + ' / ' + budget, 1790, y + 65, 37, C.yellow, 'right');
    }
  });
}

export default {
  id: 'labeled-retrieval', draw: drawLabeledRetrieval,
  cues: ['count-matches', 'retrieval-suite', 'pack-deadline', 'pack-condition', 'nine-spaces', 'packing-verdict', 'equal-budget'],
};
