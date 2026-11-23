import { cases, replay, sampleModel } from '../model.mjs';
import {
  drawSupportFooter,
  drawSupportHeading,
  drawSupportRow,
  drawSupportText,
  supportCueVisible,
  text,
  withSupportFocus,
} from '../defaults.mjs';
export function drawEvaluation(ctx, scene, state, api) {
  if (drawEvaluationContinuation(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('evaluation', state),
    currentBeat = modelState.b;
  if (state.cues) {
    if (currentBeat === 0)
      Object.assign(
        modelState,
        replay('normal', Math.ceil(cases().length * api.focus.progress('twelve-cases', 0))),
      );
  }
  paintEvaluationResults(ctx, api, themeColors, teaching, modelState);
}
function drawEvaluationContinuation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (currentBeat < 3) return false;
  const { C: themeColors } = api;
  {
    drawSupportHeading(
      ctx,
      api,
      'Control fixtures and customer outcomes answer different questions',
    );
    const metrics = supportCueVisible(ctx, api, 'outcome-metrics'),
      rates = supportCueVisible(ctx, api, 'precision-recall'),
      load = supportCueVisible(ctx, api, 'arrival-load');
    withSupportFocus(ctx, api, 'outcome-metrics', () => {
      drawSupportRow(
        ctx,
        api,
        '12 serial fixtures: declared state transitions and exact effects',
        150,
        365,
        1620,
        themeColors.blue,
      );
      if (metrics) {
        drawSupportRow(
          ctx,
          api,
          'Customer outcomes: resolution / repeat contacts / reopened tickets',
          150,
          475,
          1620,
          themeColors.cyan,
        );
        drawSupportRow(
          ctx,
          api,
          'Containment can hide abandonment; surveys have nonresponse',
          150,
          585,
          1620,
          themeColors.muted,
        );
      }
    });
    withSupportFocus(ctx, api, 'precision-recall', () => {
      if (rates) {
        drawSupportText(
          ctx,
          api,
          'Precision = necessary escalations / all escalations',
          960,
          750,
          31,
          themeColors.yellow,
          'center',
        );
        drawSupportText(
          ctx,
          api,
          'Recall = escalated necessary-review cases / all necessary-review cases',
          960,
          830,
          28,
          themeColors.yellow,
          'center',
        );
      }
    });
    withSupportFocus(ctx, api, 'arrival-load', () => {
      if (load)
        drawSupportText(
          ctx,
          api,
          'Arrival load → queueing → first useful output → specialist delay → resolution',
          960,
          945,
          28,
          themeColors.cyan,
          'center',
        );
    });
    drawSupportFooter(
      ctx,
      api,
      'Retain observation windows, unfinished cases, cost and critical slices.',
    );
  }
  return true;
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'twelve-cases',
    'expected-effects',
    'unexpected-write',
    'missing-effect',
    'outcome-metrics',
    'precision-recall',
    'arrival-load',
  ],
};
export function paintEvaluationResults(ctx, api, themeColors, teaching, modelState) {
  text(
    ctx,
    api,
    modelState.mode === 'normal'
      ? 'Declared case and effect expectations'
      : modelState.mode === 'extra'
        ? 'Injected extra write'
        : 'Expected insertion removed',
    960,
    285,
    40,
    themeColors.yellow,
    'center',
  );
  api.focus.target('regression-cases', () =>
    teaching.grid({
      x: 170,
      y: 390,
      width: 1000,
      height: 420,
      rows: 4,
      columns: 3,
      labels: Array.from(
        {
          length: 4,
        },
        (_, r) =>
          Array.from(
            {
              length: 3,
            },
            (_, column) => {
              const row = modelState.rows[r * 3 + column];
              return row ? `${row.id}: ${row.outcome}` : `${cases()[r * 3 + column].id}: pending`;
            },
          ),
      ),
      fontSize: 27,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      textColor: themeColors.ink,
    }),
  );
  Object.entries(modelState.counts).forEach(([name, count], i) =>
    text(
      ctx,
      api,
      `${count} ${
        {
          HANDOFF: 'handoffs',
          ABSTAIN: 'abstentions',
          'POLICY REPLY': 'policy reply',
          CONFIRM: 'confirmation request',
          QUEUED: 'queued action',
        }[name]
      }`,
      1300,
      445 + i * 80,
      31,
      themeColors.cyan,
    ),
  );
  api.focus.target('effect-accounting', () =>
    text(
      ctx,
      api,
      `Labels ${modelState.labelsPass}/12 · expected writes ${modelState.expected.length} · actual ${modelState.actual.length}`,
      960,
      900,
      34,
      themeColors.yellow,
      'center',
    ),
  );
  api.focus.target('release-verdict', () =>
    text(
      ctx,
      api,
      modelState.complete === false
        ? 'Reviewing ' + modelState.rows.length + ' / 12 cases'
        : modelState.ready
          ? 'Local release checks pass · expected pending operation matches exactly'
          : `Release held · ${modelState.unexpected.length} unexpected / ${modelState.missing.length} missing effects`,
      960,
      1010,
      30,
      modelState.ready ? themeColors.green : themeColors.pink,
      'center',
    ),
  );
}
