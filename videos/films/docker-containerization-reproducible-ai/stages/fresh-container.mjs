import {
  FRESH_EXPECTED_COUNTS,
  FRESH_FIXTURE,
  FRESH_MOUNTED,
  FRESH_REPAIRED,
} from '../fixtures.mjs';
import { score } from '../model.mjs';
import { codeText, focusTarget, line, rectangle, text } from '../defaults.mjs';

const different = FRESH_FIXTURE.findIndex(
  (row, i) => row.prediction !== FRESH_MOUNTED[i].prediction,
);
const request = FRESH_FIXTURE[different];
const shared = FRESH_FIXTURE.filter((row, i) => i !== different);
const sharedScore = score(shared);

export function drawFreshContainer(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.['dk-fresh-container-' + name];
  const after = (name) => cue(name)?.phase === 'after';
  const started = (name) => Boolean(cue(name) && cue(name).phase !== 'before');
  const finished = after('repair');
  const edited = after('change') || finished;
  const hostFile = edited ? FRESH_REPAIRED : FRESH_MOUNTED;
  const imageReport = score(FRESH_FIXTURE);
  const oldReport = score(FRESH_MOUNTED);
  const hostReport = finished ? score(hostFile) : oldReport;
  const columns = [986, 1536];

  codeText(ctx, api, 'One image · I2', 144, 263, 40, C.blue);
  focusTarget(ctx, api, 'fresh-reference', () => {
    const visible = after('target') || state.beat > 0;
    codeText(
      ctx,
      api,
      visible
        ? 'Reference: ' +
            FRESH_EXPECTED_COUNTS.matches +
            ' matches in ' +
            FRESH_EXPECTED_COUNTS.total +
            ' rows'
        : 'Reference',
      960,
      263,
      38,
      visible ? C.ink : C.muted,
    );
  });

  focusTarget(ctx, api, 'fresh-shared', () => {
    codeText(ctx, api, 'Same in both files', 145, 385, 37);
    const showMatches = after('shared-count') || state.beat > 0;
    shared.forEach((row, i) => {
      const x = 520 + i * 155;
      const match = score([row]).matches === 1;
      const color = showMatches ? (match ? C.blue : C.muted) : C.muted;
      rectangle(ctx, api, x, 324, 130, 88, C.panel, color);
      text(ctx, api, row.id, x + 65, 381, 36, color, 'center', 'mono');
      if (showMatches) text(ctx, api, match ? 'match' : 'miss', x + 65, 463, 28, color);
    });
    if (showMatches)
      text(ctx, api, sharedScore.matches + ' of ' + sharedScore.total + ' match', 1615, 383, 36);
  });

  focusTarget(ctx, api, 'fresh-row', () => {
    rectangle(ctx, api, 141, 515, 1630, 186, C.panel, C.cyan);
    codeText(ctx, api, 'Request ' + request.id, 172, 583, 44);
    codeText(ctx, api, 'Expected: ' + request.expected, 172, 658, 37);
    ['In image I2', 'In host bind'].forEach((label, i) =>
      text(ctx, api, label, columns[i], 579, 36, i ? C.cyan : C.blue),
    );
    if (started('locate') || state.beat > 0) {
      text(ctx, api, request.prediction, columns[0], 661, 50, C.blue);
      text(ctx, api, hostFile[different].prediction, columns[1], 661, 50, C.cyan);
    }
  });

  if (state.beat === 0) {
    if (started('predict'))
      text(ctx, api, 'Which copy supplies the fifth match?', 960, 857, 47, C.yellow);
    return;
  }

  const threshold = 2 * imageReport.total;
  if (state.beat === 1) {
    codeText(ctx, api, 'Two-thirds threshold', 144, 807, 36, C.yellow);
    codeText(ctx, api, '3 × matches ≥ 2 × rows', 144, 878, 36);
  } else if (finished) {
    codeText(ctx, api, 'Host rerun complete', 144, 848, 37, C.cyan);
  } else if (edited) {
    codeText(
      ctx,
      api,
      started('rerun') ? 'Reading the host file' : 'Host file edited',
      144,
      848,
      37,
      C.cyan,
    );
  } else if (after('committed')) {
    codeText(ctx, api, 'In Git: ' + request.prediction, 144, 848, 37, C.yellow);
  }

  [imageReport, hostReport].forEach((report, i) => {
    const x = columns[i],
      color = i ? C.cyan : C.blue;
    const progress = state.beat === 2 ? 1 : (cue(i ? 'mountmath' : 'bakedmath')?.progress ?? 0);
    const verdict = state.beat === 2 || after(i ? 'mounted' : 'baked');
    focusTarget(ctx, api, i ? 'fresh-host-score' : 'fresh-image-score', () => {
      const start = x - 210,
        width = 420,
        unit = width / (3 * report.total);
      const mark = start + threshold * unit;
      line(ctx, api, start, 829, start + width, 829, C.muted);
      for (let j = 0; j < report.matches * progress; j++) {
        const fraction = Math.min(1, report.matches * progress - j);
        api.rect(ctx, start + j * 3 * unit, 809, fraction * (3 * unit - 4), 14, color);
      }
      line(ctx, api, mark, 800, mark, 839, C.yellow, 3);
      if (state.beat === 1 && progress === 1) {
        const points = 3 * report.matches;
        text(
          ctx,
          api,
          report.matches + ' × 3 = ' + points + (report.threshold ? ' ≥ ' : ' < ') + threshold,
          x,
          772,
          34,
        );
      }
      if (!verdict) return;
      const lastRun = i && edited && !finished ? 'Last run: ' : '';
      text(
        ctx,
        api,
        lastRun + report.matches + ' matching / ' + report.total + ' rows',
        x,
        906,
        39,
        color,
      );
      if (state.beat === 1) {
        const exact =
          report.total === FRESH_EXPECTED_COUNTS.total &&
          report.matches === FRESH_EXPECTED_COUNTS.matches;
        const receipt =
          report.fraction.toFixed(3) +
          ' · threshold ' +
          (report.threshold ? 'PASS' : 'FAIL') +
          ' · reference ' +
          (exact ? 'PASS' : 'FAIL');
        text(ctx, api, receipt, x, 971, 27, report.threshold && exact ? C.green : C.pink);
      }
    });
  });
  if (finished)
    text(
      ctx,
      api,
      'Same image · one host-row repair    ' +
        oldReport.matches +
        '/' +
        oldReport.total +
        ' → ' +
        hostReport.matches +
        '/' +
        hostReport.total,
      960,
      1001,
      37,
      C.green,
    );
}

export default {
  id: 'fresh-container',
  draw: drawFreshContainer,
  cues: [
    'dk-fresh-container-beat0',
    'dk-fresh-container-target',
    'dk-fresh-container-shared-count',
    'dk-fresh-container-locate',
    'dk-fresh-container-predict',
    'dk-fresh-container-beat1',
    'dk-fresh-container-bakedmath',
    'dk-fresh-container-baked',
    'dk-fresh-container-mountmath',
    'dk-fresh-container-mounted',
    'dk-fresh-container-beat2',
    'dk-fresh-container-committed',
    'dk-fresh-container-change',
    'dk-fresh-container-rerun',
    'dk-fresh-container-repair',
  ],
};
