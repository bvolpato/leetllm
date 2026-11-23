import { spoken } from '../arithmetic.mjs';
import {
  drawProfileChapterCard,
  drawProfileChapterFooter,
  drawProfileChapterTable,
  drawProfileChapterText,
} from '../defaults.mjs';
export function drawSanitizerScopes(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    P = (cue, beat = currentBeat) => spoken(state, cue, beat);
  api.focus.target('sanitizer-scopes-mechanism', () => {
    if (currentBeat === 0) {
      const { C, text, rect, line } = api;
      const exact = P('exact-allocation', 0) === 1;
      const wrote = P('logical-overrun', 0) > 0;
      const left = 257, cell = 333;
      text(ctx, 'Python index check   /   n = 257', 145, 253, 38, C.ink);
      text(ctx, 'write_indexes(257, ' + (exact ? 257 : 512) + ', inclusive=True)', 960, 381, 44, C.ink, 'center', 'mono');
      for (let j = 0; j < 4; j++) {
        const i = 255 + j, x = left + cell * j;
        const color = i < 257 ? C.blue : C.muted;
        text(ctx, 'i = ' + i, x + cell / 2, 506, 34, color, 'center');
        if (i < 257 || !exact) {
          rect(ctx, x, 550, cell - 5, 124, C.panel, color, 2);
          const value = i < 257 || (i === 257 && wrote) ? i + '.0' : 'NaN';
          text(ctx, value, x + cell / 2, 633, 48, i === 257 && wrote ? C.pink : color, 'center');
        }
      }
      const edge = left + 2 * cell - 3;
      line(ctx, edge, 529, edge, 713, C.yellow, 4);
      text(ctx, 'logical end', edge, 765, 34, C.yellow, 'center');
      const outcome = exact ? 'IndexError at i = 257' : wrote ? 'All 257 result values match. The first spare slot changed.' : 'Compare all requested values with the reference.';
      text(ctx, outcome, 960, 927, 42, exact ? C.pink : C.ink, 'center');
    } else if (currentBeat === 1) {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Different execution failures need different checkers',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      drawProfileChapterTable(
        ctx,
        api,
        themeColors,
        teaching,
        [
          ['Checker', 'Observed scope'],
          ['memcheck', 'invalid / misaligned accesses'],
          ['racecheck', 'shared-memory ordering hazards'],
          ['initcheck', 'uninitialized global-memory reads'],
          ['synccheck', 'synchronization usage'],
        ],
        190,
        365,
        1540,
        470,
        31,
      );
      if (P('checker-scopes', 1) > 0)
        drawProfileChapterText(
          ctx,
          api,
          themeColors,
          'Run memcheck first · no claim of all global-race coverage',
          960,
          935,
          30,
          themeColors.yellow,
          'center',
        );
    } else {
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Exact allocation plus 32-byte sanitizer padding',
        960,
        285,
        35,
        themeColors.ink,
        'center',
      );
      api.rect(ctx, 260, 435, 1150, 140, themeColors.blue, undefined, 0);
      api.rect(ctx, 1410, 435, 220, 140, themeColors.pink, undefined, 0);
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'Logical / allocated output',
        835,
        520,
        36,
        themeColors.bg,
        'center',
      );
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'padding',
        1520,
        520,
        30,
        themeColors.bg,
        'center',
      );
      api.arrow(ctx, 1410, 690, 1410, 605, themeColors.yellow, 5);
      drawProfileChapterText(
        ctx,
        api,
        themeColors,
        'An extra store reaches the protected boundary',
        960,
        785,
        33,
        themeColors.yellow,
        'center',
      );
      if (P('allocation-padding', 2) > 0)
        drawProfileChapterCard(
          ctx,
          api,
          themeColors,
          components,
          'Padding protects allocation boundaries; it does not define tensor shape',
          210,
          890,
          1500,
          themeColors.pink,
          80,
          28,
        );
    }
    drawProfileChapterFooter(
      ctx,
      api,
      themeColors,
      'Checker evidence covers the executed cases · keep instrumented runs outside clean timing',
    );
  });
}
export default {
  id: 'sanitizer-scopes',
  draw: drawSanitizerScopes,
  cues: ['logical-overrun', 'exact-allocation', 'checker-scopes', 'allocation-padding'],
};
