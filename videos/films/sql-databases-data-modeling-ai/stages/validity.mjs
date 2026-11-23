import { asOf } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawSqlCaption,
  drawSqlEquation,
  drawSqlText,
  withSqlFade,
  withSqlFocus,
} from '../defaults.mjs';
export function drawValidity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('validity', state);
  {
    const start = Date.parse('2026-01-01T00:00:00Z'),
      end = Date.parse('2026-10-01T00:00:00Z'),
      july = Date.parse('2026-07-01T00:00:00Z'),
      X = (date) => 280 + (1460 * (date - start)) / (end - start);
    api.line(ctx, 280, 740, 1740, 740, themeColors.muted, 3);
    for (const [date, label] of [
      [start, 'January 1'],
      [july, 'July 1'],
      [Date.parse(asOf), 'August 12'],
      [end, 'October 1'],
    ]) {
      const x = X(date);
      api.line(ctx, x, 730, x, 750, themeColors.muted, 2);
      drawSqlText(ctx, api, label, x, 795, 27, themeColors.muted, 'center');
    }
    drawSqlText(ctx, api, '30-day policy', 150, 395, 29, themeColors.muted);
    drawSqlText(ctx, api, '14-day policy', 150, 565, 29, themeColors.green);
    api.line(ctx, X(start), 440, X(july) - 10, 440, themeColors.muted, 10);
    api.circle(ctx, X(july), 440, 10, 'transparent', themeColors.muted, 3);
    api.line(ctx, X(july), 600, X(end) - 35, 600, themeColors.green, 10);
    api.arrow(ctx, X(end) - 35, 600, 1810, 600, themeColors.green, 6);
    api.line(ctx, X(july), 585, X(july), 615, themeColors.green, 5);
    drawSqlText(ctx, api, 'end: NULL · continues', 1770, 565, 24, themeColors.green, 'right');
    const date = currentBeat === 0 ? july : m.at,
      x = X(date),
      alpha = currentBeat === 0 ? m.place : 1;
    withSqlFocus(ctx, api, 'request-time', () =>
      withSqlFade(ctx, api, alpha, () => {
        api.line(ctx, x, 330, x, 705, themeColors.yellow, 3);
        drawSqlText(
          ctx,
          api,
          currentBeat === 0 ? 'request at the boundary' : 'request time',
          x,
          300,
          29,
          themeColors.yellow,
          'center',
        );
      }),
    );
    withSqlFocus(ctx, api, 'active-version', () => {
      if (currentBeat === 1 && m.resolve > 0) {
        api.rect(
          ctx,
          X(july) - 8,
          575,
          X(end) - X(july) + 16,
          50,
          'transparent',
          themeColors.green,
          2,
        );
        drawSqlText(ctx, api, 'owns this request', x + 35, 685, 28, themeColors.green, 'left');
      }
    });
    withSqlFocus(ctx, api, 'validity-predicate', () => {
      if (currentBeat === 1 && m.open > 0)
        drawSqlEquation(
          ctx,
          api,
          String.raw`\text{start}\le t\quad\land\quad(\text{end IS NULL}\;\lor\;t<\text{end})`,
          960,
          900,
          37,
          themeColors.cyan,
        );
    });
    drawSqlCaption(
      ctx,
      api,
      'Equal elapsed time per pixel · half-open intervals include their start and exclude their end',
    );
  }
}
export default {
  id: 'validity',
  draw: drawValidity,
  cues: ['move-request-time', 'resolve-version', 'open-ended-version'],
};
