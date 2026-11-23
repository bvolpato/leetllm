import { inspectFor } from '../model.mjs';
import { drawCalendar, drawPage, legacyRuns } from '../manual.mjs';

export function drawInspectSource(ctx, scene, state, api) {
  const { C, focus } = api;
  const search = focus.progress(
    'find-expiry',
    state.beat >= 1 ? 1 : api.phase(state.beatP, 0.26, 0.56),
  );
  const opened = search >= 1;
  const [page] = inspectFor(opened ? 'expires' : 'audit logging');
  const mark = focus.progress(
    'mark-expiry',
    state.beat >= 1 ? 1 : api.phase(state.beatP, 0.6, 0.8),
  );
  const judged =
    focus.progress('place-runs', state.beat === 1 ? api.phase(state.beatP, 0, 0.4) : 0) >= 1;
  focus.target('open-page', () => {
    drawPage(ctx, api, { page, y: 223, width: 790, height: 294 });
    if (search > 0 && mark === 0) {
      api.text(ctx, 'inspectFor("expires")', 150, 613, 37, C.yellow, 'left', 'mono');
    }
  });
  focus.target('field-notes', () => {
    api.text(ctx, 'Legacy-token exception  /  v12', 1060, 277, 36, C.muted);
    api.text(ctx, 'Audit logging required  [p5]', 1060, 384, 42, C.blue);
    api.text(
      ctx,
      opened ? page.value + '  [p6]' : 'Expiry  ?',
      1060,
      476,
      43,
      opened ? C.blue : C.yellow,
    );
  });
  focus.target('run-calendar', () =>
    drawCalendar(ctx, api, legacyRuns, {
      expiry: opened && mark > 0 ? page.value : undefined,
      showResult: judged,
      y: 740,
    }),
  );
  focus.target('run-answer', () =>
    api.text(
      ctx,
      judged
        ? 'With logging on, the September run qualifies under v12.'
        : opened
          ? 'With logging on, which run qualifies under v12?'
          : 'Where is the expiry clause?',
      960,
      956,
      39,
      judged ? C.green : C.ink,
      'center',
    ),
  );
}
export default {
  id: 'inspect-source',
  draw: drawInspectSource,
  cues: ['keep-condition', 'find-expiry', 'mark-expiry', 'place-runs'],
};
