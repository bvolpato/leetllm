import { codeText, focusTarget, line, text } from '../defaults.mjs';
import { FIXTURE, OBSERVED_IMAGE_ID } from '../fixtures.mjs';
import { reportLines, score } from '../model.mjs';

export function drawFailureMap(ctx, scene, state, api) {
  const { C } = api;
  const after = (name) => state.cues?.['dk-failure-map-' + name]?.phase === 'after';
  const word = (label, x, y, size, color = C.ink, font = 'sans') =>
    codeText(ctx, api, label, x, y, size, color, 'left', font);

  focusTarget(ctx, api, 'failure-map-construction', () => {
    if (state.beat === 0) {
      word('What you observed', 145, 300, 34, C.muted);
      word('What to inspect', 970, 300, 34, C.muted);
      const cases = [
        ['Python cannot import a module', 'Requirements used by the install', 'import'],
        ['Permission denied on the bind', 'Host directory owner and modes', 'permissions'],
        ['A script edit repeats installation', 'Can the builder reuse cached layers?', 'cache'],
      ];
      cases.forEach(([symptom, check, cue], i) => {
        const y = 447 + i * 167;
        word(symptom, 145, y, 40);
        line(ctx, api, 145, y + 48, 1770, y + 48, C.muted);
        if (after(cue)) word(check, 970, y, 40, C.cyan);
      });
      if (after('order'))
        word('If the scorer is copied first, move that step after install.', 970, 913, 32, C.cyan);
      return;
    }
    if (state.beat === 1 || state.beat === 2) {
      const revised = after('print');
      const exited = after('exit') && !revised;
      word('Fresh build from the committed fixture', 145, 297, 40);
      if (!after('compared')) {
        word('Request 102', 145, 520, 37, C.muted);
        word('Committed prediction', 586, 520, 37);
        word(FIXTURE[1].prediction, 1110, 520, 39, C.blue);
        return;
      }
      word(exited ? 'Shell has exited' : 'In the check script', 145, 405, 33, C.muted);
      word(revised ? 'Revised success output' : 'Original success output', 1080, 405, 33, C.muted);
      for (const [i, path] of ['baked', 'mounted'].entries()) {
        const y = 536 + 132 * i;
        const color = i ? C.cyan : C.blue;
        if (!exited) word('$' + path + '_report', 145, y, 41, color, 'mono');
        if (after('beat1') && (!i || revised)) {
          if (!exited) api.arrow(ctx, 542, y - 12, 1018, y - 12, color, 4);
          word(revised ? path + ' + ID + full report' : 'Baked report and image ID', 1080, y, 38);
        }
      }
      line(ctx, api, 145, 741, 1770, 741, C.muted);
      if (revised) {
        word(
          `printf '%s\\n' 'baked /app/eval' "$image_id" "$baked_report"`,
          145,
          861,
          32,
          C.blue,
          'mono',
        );
        word(
          `printf '%s\\n' 'bind ./eval -> /app/eval' "$image_id" "$mounted_report"`,
          145,
          957,
          32,
          C.cyan,
          'mono',
        );
      } else {
        word(
          `printf '%s\\n' "$baked_report" "Verified local image: $image_id"`,
          145, 861, 32, C.ink, 'mono',
        );
      }
      return;
    }
    word('$ bash scripts/check_container.sh > reports.txt', 145, 278, 37, C.ink, 'mono');
    word('Success summary in reports.txt', 145, 372, 30, C.muted);
    const report = reportLines(score(FIXTURE));
    for (const [i, path] of ['baked /app/eval', 'bind ./eval -> /app/eval'].entries()) {
      const y = 443 + i * 292;
      line(ctx, api, 145, y - 55, 1770, y - 55, C.muted);
      word(path, 145, y, 36, i ? C.cyan : C.blue, 'mono');
      word(OBSERVED_IMAGE_ID, 145, y + 47, 29, C.muted, 'mono');
      report.forEach((value, n) => word(value, 145, y + 96 + n * 46, 31, C.ink, 'mono'));
    }
    text(ctx, api, 'Same local image, two separately recorded reads', 960, 1008, 32);
  });
}

export default {
  id: 'failure-map',
  draw: drawFailureMap,
  cues: [
    'dk-failure-map-beat0',
    'dk-failure-map-import',
    'dk-failure-map-permissions',
    'dk-failure-map-cache',
    'dk-failure-map-order',
    'dk-failure-map-compared',
    'dk-failure-map-beat1',
    'dk-failure-map-exit',
    'dk-failure-map-print',
  ],
};
