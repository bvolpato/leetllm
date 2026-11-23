import { INCIDENTS } from '../fixtures.mjs';
import { lookupIncident, requestBudget, retrievalRun } from '../model.mjs';
import { spoken } from '../construction.mjs';

export function drawExactnessAndBudget(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat < 2) {
    const run = retrievalRun();
    const submitted = ['budget-raw', 'budget-quota', 'budget-queue', 'budget-capacity'].filter(
      (id) => spoken(state, 0, id) === 1,
    ).length;
    const budget = requestBudget(submitted);
    const hits = run.allRankings.slice(0, submitted).flat();
    const refused = spoken(state, 1, 'budget-stop') === 1 && !requestBudget(submitted + 1).admitted;
    label('“How should we handle peak demand?”', 135, 265, 49);
    label('Search wording', 135, 385, 31, C.muted);
    label('Returned source IDs   ·   limit 3 per call', 817, 385, 31, C.muted);
    run.queries.forEach((q, i) => {
      const complete = i < submitted;
      const y = 481 + 102 * i;
      focus.target('budget-query', () => {
        label(String(i + 1), 135, y, 39, complete ? C.blue : C.muted);
        label(q, 241, y, 37, complete ? C.ink : C.muted);
      });
      label(
        complete ? run.allRankings[i].join('  ·  ') || 'No matches' : '·',
        818,
        y,
        37,
        complete ? C.cyan : C.muted,
      );
      api.line(ctx, 135, y + 33, 1780, y + 33, C.panel, 3);
    });
    focus.target('request-budget', () => {
      label(budget.retrievalCalls + ' / 4 retrieval calls', 135, 897, 40, C.yellow);
      label(hits.length + ' returned / ' + budget.candidateCap + ' possible', 837, 897, 38);
      label(
        refused
          ? 'Fifth search stopped before dispatch.'
          : new Set(hits).size + ' distinct pages returned',
        837,
        966,
        32,
        refused ? C.pink : C.muted,
      );
    });
    return;
  }

  const wanted = 'INC-48291';
  const candidate = 'INC-48219';
  const proposed = spoken(state, 2, 'incident-proposal') > 0;
  const repaired = spoken(state, 3, 'incident-restore') === 1;
  const closed = spoken(state, 3, 'incident-cite') === 1;
  const wrong = spoken(state, 3, 'incident-other') === 1;
  const record = closed
    ? lookupIncident(wanted)
    : wrong && !repaired
      ? lookupIncident(candidate)
      : null;
  label('Earlier message', 135, 252, 29, C.muted);
  label('“We logged this as ' + wanted + '.”', 135, 329, 46);
  label('Follow-up', 1130, 252, 29, C.muted);
  label('“When did it close?”', 1130, 329, 47);
  focus.target('incident-key', () => {
    label(repaired ? 'Exact lookup' : 'Proposed lookup', 135, 465, 32, C.muted);
    label(
      proposed ? (repaired ? wanted : candidate) : '…',
      615,
      475,
      55,
      repaired ? C.cyan : C.yellow,
    );
  });
  api.line(ctx, 135, 530, 1780, 530, C.muted, 2);
  label('Example support incident register', 135, 612, 32, C.muted);
  label('Closed at', 1110, 612, 32, C.muted);
  INCIDENTS.forEach((row, i) => {
    const y = 711 + i * 113;
    const selected = record?.id === row.id;
    const tone = selected ? (closed ? C.green : C.yellow) : C.ink;
    focus.target('incident-record', () => {
      if (selected) api.rect(ctx, 134, y - 41, 7, 52, tone);
      label(row.id, 181, y, 48, tone);
      label(row.closed, 1110, y, 48, tone);
    });
    api.line(ctx, 135, y + 30, 1780, y + 30, C.panel, 3);
  });
  focus.target('incident-answer', () => {
    const message = closed
      ? record.closed + '   ·   source ' + record.id
      : repaired
        ? 'Read the closing time from the matching row.'
        : wrong
          ? record.closed + ' belongs to a different incident.'
          : 'Which closing time can you cite for this developer?';
    label(message, 960, 972, 42, closed ? C.green : C.yellow, 'center');
  });
}
export default {
  id: 'exactness-and-budget',
  draw: drawExactnessAndBudget,
  cues: [
    'budget-raw',
    'budget-quota',
    'budget-queue',
    'budget-capacity',
    'budget-stop',
    'incident-proposal',
    'incident-other',
    'incident-restore',
    'incident-cite',
  ],
};
