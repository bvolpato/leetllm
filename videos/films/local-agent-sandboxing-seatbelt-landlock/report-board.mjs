import { reportCommand, reportRequest, reportRuns } from './fixtures.mjs';
import { canWrite, resolveFixture } from './model.mjs';

export function reportWalk(run) {
  const link = '/workspace/src/cache';
  const result = resolveFixture(
    '/workspace/' + reportRequest,
    run.link ? { [link]: run.link } : {},
  );
  const directory = run.link ? resolveFixture('/workspace/src/' + run.link, {}).actual : link;
  const parent = result.steps.filter((step) => step.kind === 'parent').at(-1).path;
  return {
    stops: ['/workspace/src', link, directory, parent, result.actual],
    resolved: result.actual.slice('/workspace/'.length),
    allowed: canWrite(result.actual),
  };
}

const walks = reportRuns.map(reportWalk);

// Both trees use the same positions so that the link changes the route in just one tree.
const positions = {
  '/workspace/src': [35, 437],
  '/workspace/src/cache': [88, 558],
  '/workspace/src/report.txt': [88, 689],
  '/workspace/archive': [426, 437],
  '/workspace/archive/daily': [479, 558],
  '/workspace/archive/report.txt': [479, 689],
};

function tree(
  ctx,
  api,
  x,
  run,
  walk,
  { showLink, position, verdict, receipt, grant = 1, emptyFiles = false },
) {
  const { C } = api;
  const name = run.name;
  const word = (s, dx, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x + dx, y, size, color, 'left', font);
  api.focus.target('report-trees', () => {
    word('Checkout ' + name, 0, 313, 45);
    if (grant > 0) {
      api.rect(ctx, x, 358, 372, 402, C.panel, undefined, 12);
      const outline = [
        [0, 0],
        [372, 0],
        [372, 402],
        [0, 402],
        [0, 0],
      ];
      const trace = Math.min(4, grant * 4);
      for (let i = 0; i < Math.ceil(trace); i++) {
        const [ax, ay] = outline[i],
          [bx, by] = outline[i + 1];
        const fraction = Math.min(1, trace - i);
        api.line(
          ctx,
          x + ax,
          358 + ay,
          x + ax + (bx - ax) * fraction,
          358 + ay + (by - ay) * fraction,
          C.blue,
          3,
        );
      }
      word('writes allowed', 25, 399, 29, C.blue);
    }
    for (const [dx, label] of [
      [35, 'src/'],
      [426, 'archive/'],
    ]) {
      word(label, dx + 25, 453, 41, C.ink, 'mono');
      api.line(ctx, x + dx + 14, 474, x + dx + 14, 689, C.muted, 3);
      for (const cy of [558, 689]) {
        api.line(ctx, x + dx + 14, cy, x + dx + 42, cy, C.muted, 3);
      }
    }
    word('report.txt', 109, 701, 35, C.ink, 'mono');
    word('daily', 500, 571, 38, C.ink, 'mono');
    word('report.txt', 500, 701, 35, C.ink, 'mono');
  });
  api.focus.target('cache-entry', () => {
    word('cache', 109, 571, 38, C.ink, 'mono');
    if (showLink && run.link) {
      api.arrow(ctx, x + 250, 558, x + 451, 558, C.cyan, 4);
      word('link', 303, 536, 30, C.cyan);
    } else if (showLink) {
      word('directory', 109, 615, 29, C.muted);
    }
  });

  api.focus.target('path-cursor', () => {
    const step = Math.min(3, Math.floor(position));
    const p = position - step;
    const [ax, ay] = positions[walk.stops[step]];
    const [bx, by] = positions[walk.stops[step + 1]];
    // Carry the cursor above the link label on its horizontal crossing.
    const bend = ax !== bx && ay === by ? 126 * Math.sin(p * Math.PI) : 0;
    api.circle(ctx, x + ax + (bx - ax) * p, ay + (by - ay) * p - bend, 12, C.yellow, C.bg, 3);
  });

  api.focus.target('report-result', () => {
    if (verdict) {
      word(walk.resolved, 10, 836, 42, C.ink, 'mono');
      word(
        walk.allowed ? 'Policy allows the append' : 'Policy denies the append',
        10,
        900,
        35,
        walk.allowed ? C.green : C.pink,
      );
    }
    if (emptyFiles) {
      for (const dx of [109, 500]) word('0 bytes', dx, 744, 27, C.muted);
    }
    if (receipt !== undefined) {
      const color = receipt ? (run.exit === 0 ? C.green : C.pink) : C.muted;
      word(receipt ? 'Shell exit ' + run.exit : 'Shell result pending', 10, 825, 39, color);
      word(
        receipt
          ? run.stderr
            ? run.stderr.split(': ').at(-1)
            : 'Appended x'
          : 'Both files start empty',
        10,
        881,
        35,
        color,
      );
      const counts = receipt ? [run.sourceBytes, run.archiveBytes] : [0, 0];
      for (const [i, dx] of [109, 500].entries())
        word(
          counts[i] + (counts[i] === 1 ? ' byte' : ' bytes'),
          dx,
          744,
          27,
          counts[i] ? C.green : C.muted,
        );
    }
  });
}

export function drawReportBoard(ctx, api, options) {
  api.focus.target('report-command', () =>
    api.text(ctx, reportCommand, 117, 234, 48, api.C.ink, 'left', 'mono'),
  );
  if (options.activeComponent) {
    const ranges = { cache: [16, 5], parent: [22, 2], report: [25, 10] };
    const [offset, length] = ranges[options.activeComponent];
    const unit = 48 * 0.6;
    api.line(ctx, 117 + offset * unit, 251, 117 + (offset + length) * unit, 251, api.C.yellow, 4);
  }
  for (const [i, run] of reportRuns.entries()) {
    tree(ctx, api, i === 0 ? 120 : 1005, run, walks[i], {
      ...options,
      receipt: options.receipts?.[i],
    });
  }
  api.focus.target('report-question', () =>
    api.text(ctx, options.footer, 120, 991, 38, api.C.yellow),
  );
}
