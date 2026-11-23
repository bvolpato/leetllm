import { cueProgress } from '../construction.mjs';
import { reportCommand, reportRuns } from '../fixtures.mjs';
import { drawReportBoard } from '../report-board.mjs';

function appendCloseup(ctx, state, api) {
  const { C } = api;
  api.text(ctx, reportCommand, 117, 234, 48, C.ink, 'left', 'mono');
  for (const [i, run] of reportRuns.entries()) {
    const left = 384 + 885 * i;
    const p =
      i === 0
        ? cueProgress(state, 'intro-append', 0, 0.01, 0.21)
        : cueProgress(state, 'intro-stop', 0, 0.25, 0.44);
    const arrived = p >= 1;
    const allowed = run.exit === 0;
    const bytes = arrived ? run.sourceBytes + run.archiveBytes : 0;
    api.focus.target(i === 0 ? 'first-append' : 'second-append', () => {
      api.text(ctx, 'Checkout ' + run.name, left, 328, 48, C.ink);
      api.path(ctx, [
        { x: left, y: 367 }, { x: left + 338, y: 367 },
        { x: left + 405, y: 434 }, { x: left + 405, y: 747 }, { x: left, y: 747 },
      ], { closed: true, fill: C.ink, width: 0 });
      api.path(ctx, [
        { x: left + 338, y: 367 }, { x: left + 338, y: 434 }, { x: left + 405, y: 434 },
      ], { closed: true, fill: C.muted, width: 0 });
      api.text(ctx, 'report.txt', left + 28, 468, 42, C.panel, 'left', 'mono');
      const stop = allowed ? left + 85 : left - 69;
      const byteX = api.lerp(left - 210, stop, p);
      const color = arrived ? (allowed ? C.green : C.pink) : C.yellow;
      api.rect(ctx, byteX - 49, 547, 98, 98, color, undefined, 16);
      api.text(ctx, 'x', byteX, 622, 85, C.bg, 'center', 'mono');
      if (arrived && !allowed) api.line(ctx, left - 9, 542, left - 9, 649, C.pink, 8);
      api.text(
        ctx,
        bytes + (bytes === 1 ? ' byte' : ' bytes'),
        left,
        854,
        72,
        arrived ? (allowed ? C.green : C.pink) : C.muted,
      );
    });
  }
  api.focus.target('write-grant', () =>
    api.text(ctx, 'Writes allowed under src/', 125, 953, 42, C.blue),
  );
  api.text(ctx, 'Observed on macOS 26.7.1', 1765, 953, 34, C.muted, 'right');
}

export default {
  id: 'intro',
  cues: ['intro-append', 'intro-stop', 'intro-grant', 'intro-link', 'intro-predict'],
  draw(ctx, scene, state, api) {
    if (state.beat === 0) {
      appendCloseup(ctx, state, api);
      return;
    }
    const link = cueProgress(state, 'intro-link', 1, 0.22, 0.58);
    const ask = cueProgress(state, 'intro-predict', 1, 0.58, 0.83);
    drawReportBoard(ctx, api, {
      showLink: link > 0,
      position: 0,
      activeComponent: ask > 0 ? 'parent' : 'cache',
      footer: ask > 0 ? 'Where does .. lead from each directory?' : 'Find cache in each checkout.',
    });
  },
};
