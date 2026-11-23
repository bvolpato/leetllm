import { inspectFor, boundedSlice } from '../model.mjs';
import { pages } from '../fixtures.mjs';
import { drawPage } from '../manual.mjs';

export function drawExternalSource(ctx, scene, state, api) {
  const { C, focus } = api;
  const [page] = inspectFor('audit logging');
  const slice = boundedSlice(pages.indexOf(page));
  const find = focus.progress(
    'search-text',
    state.beat > 0 ? 1 : api.phase(state.beatP, 0.55, 0.83),
  );
  const copy = focus.progress(
    'copy-clause',
    state.beat === 1 ? api.phase(state.beatP, 0.05, 0.45) : 0,
  );
  focus.target('manual-index', () => {
    api.text(ctx, 'Read-only manual v12', 130, 260, 40, C.blue);
    if (find >= 1) drawPage(ctx, api, { page, x: 130, y: 327, width: 740, height: 330 });
    else
      pages.forEach((entry, i) => {
        const y = 333 + i * 61;
        const selected = find > 0 && i === Math.min(7, Math.floor(find * 8));
        api.text(ctx, String(i + 1).padStart(2, '0'), 150, y, 28, selected ? C.yellow : C.muted);
        api.text(ctx, entry.title, 255, y, 33, selected ? C.yellow : C.ink);
      });
  });
  focus.target('root-task', () => {
    api.text(ctx, 'Root request', 1070, 260, 40, C.cyan);
    api.text(ctx, 'Find the legacy-token exception.', 1070, 350, 38, C.ink);
    api.text(ctx, 'v12  /  8 pages  /  read page text', 1070, 414, 33, C.muted);
  });
  focus.target('search-call', () => {
    api.line(ctx, 1050, 470, 1780, 470, C.muted, 2);
    api.text(ctx, 'inspectFor("audit logging")', 1070, 550, 37, C.yellow, 'left', 'mono');
    if (find >= 1) api.text(ctx, '1 matching page  ·  p5', 1070, 616, 34, C.blue);
  });
  focus.target('child-input', () => {
    const y = 748;
    const returned =
      focus.progress('return-condition', state.beat === 1 ? api.phase(state.beatP, 0.68, 0.8) : 0) >
      0;
    api.rect(ctx, 1020, y - 60, 790, 205, C.panel, copy ? C.cyan : C.muted, 8);
    if (returned) {
      api.text(ctx, 'Child reply  /  root notes', 1052, y, 30, C.cyan);
      api.text(ctx, page.value + '  [' + page.id + ']', 1052, y + 60, 33, C.ink);
      api.text(ctx, 'Expiry  ?', 1052, y + 114, 32, C.yellow);
      return;
    }
    api.text(ctx, 'Child task  /  extract the logging condition', 1052, y, 30, C.cyan);
    if (copy >= 1) {
      api.text(ctx, slice.text, 1052, y + 60, 33, C.ink);
      api.text(
        ctx,
        slice.sourceId + '   ·   ' + slice.used + ' / ' + slice.limit + ' source characters',
        1052,
        y + 114,
        29,
        C.blue,
      );
    } else api.text(ctx, 'Source passage pending', 1052, y + 78, 34, C.muted);
  });
  if (copy > 0 && copy < 1) {
    const x = api.lerp(667, 910, copy),
      y = api.lerp(682, 796, copy);
    api.rect(ctx, x - 95, y - 35, 190, 66, C.panel, C.blue, 7);
    api.text(ctx, 'p5 · text', x, y + 8, 28, C.blue, 'center');
  }
}
export default {
  id: 'external-source',
  draw: drawExternalSource,
  cues: [
    'source-index',
    'root-scope',
    'search-text',
    'copy-clause',
    'slice-size',
    'return-condition',
  ],
};
