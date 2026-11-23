import { lessonFont } from '../../../lib/fonts.mjs';
import { owned } from '../fixtures.mjs';
import { cueStep } from '../invoice-page.mjs';
import { baseHandler, fixedHandler, patchReviewSnapshot, sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawScope(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('scope', state),
    { b: currentBeat } = modelState;
  {
    if (!currentBeat) {
      text(ctx, api, 'Complete changed-path set', 170, 295, 40, themeColors.blue);
      modelState.paths.forEach((path, i) => {
        const y = 370 + i * 145,
          allowed = owned.has(path);
        api.focus.target('changed-paths', () =>
          card(ctx, api, path, 170, y, 1120, themeColors.blue, 100, 35),
        );
        api.focus.target('scope-check', () =>
          card(
            ctx,
            api,
            allowed ? 'OWNED' : 'OUTSIDE SCOPE',
            1430,
            y,
            340,
            allowed ? themeColors.green : themeColors.pink,
            100,
            28,
          ),
        );
      });
    } else {
      const sourceWidth = 500,
        sourceLines = [baseHandler, fixedHandler].flatMap((handler) =>
          handler.toString().split('\n'),
        );
      ctx.save();
      ctx.font = lessonFont(23, 'mono');
      const longestLine = Math.max(...sourceLines.map((line) => ctx.measureText(line).width));
      ctx.restore();
      const sourceFontSize = Math.min(23, (23 * sourceWidth) / longestLine),
        current = patchReviewSnapshot(cueStep(state, 'scope-inputs', 1, 0.31, 0.5)),
        code = (value, x, y, size = 23, color = themeColors.ink) =>
          api.text(ctx, value, x, y, size, color, 'left', 'mono');
      text(
        ctx,
        api,
        'Sequential miniature · review the executable handler change',
        170,
        275,
        33,
        themeColors.yellow,
      );
      components.panel(
        {
          x: 140,
          y: 320,
          width: 450,
          height: 305,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          padding: 20,
        },
        () => {
          text(ctx, api, 'Complete owned path set', 165, 365, 26, themeColors.blue);
          modelState.paths.forEach((path, index) => code(path, 165, 435 + index * 65, 23));
          text(ctx, api, '2 paths · scope admitted', 165, 580, 25, themeColors.green);
        },
      );
      [
        [baseHandler, 'BEFORE', 640, themeColors.pink],
        [fixedHandler, 'AFTER', 1220, themeColors.green],
      ].forEach(([handler, label, x, color]) =>
        components.panel(
          {
            x,
            y: 320,
            width: 550,
            height: 305,
            fill: themeColors.panel,
            stroke: color,
            padding: 20,
          },
          () => {
            text(ctx, api, label + ' · webhook.ts miniature', x + 25, 365, 25, color);
            handler
              .toString()
              .split('\n')
              .forEach((line, index) =>
                api.focus.target('handler-source', () =>
                  code(
                    line,
                    x + 25,
                    420 + index * 43,
                    sourceFontSize,
                    handler === fixedHandler && index === 1 ? themeColors.green : themeColors.ink,
                  ),
                ),
              );
          },
        ),
      );
      text(
        ctx,
        api,
        `Same inputs replayed: ${current.count} / 3 · first → retry → next (new event)`,
        170,
        670,
        28,
        themeColors.yellow,
      );
      text(ctx, api, 'Returned invoice IDs', 170, 715, 25, themeColors.muted);
      [current.before, current.after].forEach((result, index) =>
        api.focus.target('verified-output', () =>
          text(
            ctx,
            api,
            result.deliveries.map((row) => row.invoice).join(' / ') || 'Awaiting delivery',
            1015 + index * 580,
            715,
            23,
            index ? themeColors.green : themeColors.pink,
            'center',
          ),
        ),
      );
      text(ctx, api, 'Stored invoices', 170, 760, 26, themeColors.muted);
      text(ctx, api, String(current.before.count), 1015, 760, 31, themeColors.pink, 'center');
      text(ctx, api, String(current.after.count), 1595, 760, 31, themeColors.green, 'center');
      text(ctx, api, 'Unchanged assertions', 170, 810, 27, themeColors.blue);
      text(ctx, api, 'BEFORE', 1015, 810, 24, themeColors.pink, 'center');
      text(ctx, api, 'AFTER', 1595, 810, 24, themeColors.green, 'center');
      current.beforeChecks.forEach((check, index) => {
        const y = 860 + index * 44,
          after = current.afterChecks[index],
          result = (passed) => (passed === null ? 'PENDING' : passed ? 'PASS' : 'FAIL'),
          color = (passed) =>
            passed === null ? themeColors.muted : passed ? themeColors.green : themeColors.pink;
        api.focus.target('assertion-contract', () => code(check.code, 170, y, 24));
        text(ctx, api, result(check.passed), 1015, y, 26, color(check.passed), 'center');
        text(ctx, api, result(after.passed), 1595, y, 26, color(after.passed), 'center');
      });
    }
  }
}
export default {
  id: 'scope',
  draw: drawScope,
  cues: ['scope-b1-1', 'scope-b1-2', 'scope-b2-1', 'scope-b2-2', 'scope-inputs'],
};
