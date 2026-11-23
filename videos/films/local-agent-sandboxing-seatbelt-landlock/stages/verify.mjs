import { cueComplete, cueProgress } from '../construction.mjs';
import { reportRuns } from '../fixtures.mjs';
import { drawReportBoard, reportWalk } from '../report-board.mjs';

function nextProbe(ctx, state, api) {
  const { C } = api;
  const label = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  const before = cueComplete(state, 'verify-before', 2, 0.46);
  const worker = cueProgress(state, 'verify-worker', 2, 0.53, 0.7);
  const denied = cueComplete(state, 'verify-denied', 3, 0.18);
  const after = cueComplete(state, 'verify-after', 3, 0.39);
  label('Observed on macOS 26.7.1', 123, 248, 39, C.muted);
  reportRuns.forEach((run, i) => {
    const x = i === 0 ? 123 : 1000;
    label(run.name + '   ' + reportWalk(run).resolved, x, 332, 42, C.ink, 'mono');
    const bytes = run.sourceBytes + run.archiveBytes;
    label(
      'Exit ' + run.exit + '   ·   ' + bytes + (bytes === 1 ? ' byte appended' : ' bytes appended'),
      x,
      395,
      35,
      run.exit === 0 ? C.green : C.pink,
    );
  });
  api.line(ctx, 123, 454, 1768, 454, C.muted, 2);
  label(state.beat === 2 ? 'Next check' : 'Expected results', 123, 538, 38, C.yellow);
  label('Read-only Git metadata', 123, 617, 48);
  const marker = 'clean';
  api.focus.target('marker-before', () => {
    label('Host saves marker', 123, 730, 36, C.muted);
    if (before) label('"' + marker + '"', 123, 824, 56, C.cyan, 'mono');
  });
  api.focus.target('marker-write', () => {
    label('Worker tries to write', 659, 730, 36, C.blue);
    if (worker > 0) api.arrow(ctx, 424, 798, 424 + 146 * worker, 798, C.blue, 4);
    if (denied) label('Write denied', 659, 824, 48, C.pink);
  });
  api.focus.target('marker-after', () => {
    label('Host reads after exit', 1270, 730, 36, C.yellow);
    label(after ? '"' + marker + '"' : '?', 1270, 824, 56, after ? C.cyan : C.muted, 'mono');
    if (after) api.arrow(ctx, 1037, 798, 1197, 798, C.yellow, 4);
  });
  label(
    after ? 'Pass when the write fails and the bytes match.' : 'What should the host read back?',
    123,
    982,
    40,
    C.yellow,
  );
}

export default {
  id: 'verify',
  cues: [
    'verify-platform',
    'verify-a',
    'verify-b',
    'verify-question',
    'verify-before',
    'verify-worker',
    'verify-denied',
    'verify-after',
  ],
  draw(ctx, scene, state, api) {
    if (state.beat >= 2) {
      nextProbe(ctx, state, api);
      return;
    }
    const receipts = [
      cueComplete(state, 'verify-a', 1, 0.38),
      cueComplete(state, 'verify-b', 1, 0.83),
    ];
    const footer = 'Observed on macOS 26.7.1  ·  file-write probe';
    drawReportBoard(ctx, api, { showLink: true, position: 4, receipts, footer });
  },
};
