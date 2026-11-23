import { appendWorksheetState, q } from '../construction.mjs';
import {
  drawChapterFooter,
  drawChapterRectangle,
  drawChapterReference,
  drawChapterText,
} from '../defaults.mjs';

const backlog = 50_000;
const format = (value) => value.toLocaleString('en-US');

function drawBacklog(ctx, api, state) {
  const { C } = api;
  const first = q(state, 'ledger-backlog', 3, 0.17, 0.42);
  const sum = q(state, 'ledger-drain', 3, 0.63, 0.84);
  drawChapterText(ctx, api, format(backlog) + ' waiting jobs', 960, 311, 43, C.ink);
  const lengths = [backlog, backlog - 1, backlog - 2, 2, 1];
  lengths.forEach((n, i) => {
    const active = i === 0 ? first : api.clamp(sum * 4 - i + 1);
    if (i && active === 0) return;
    const y = 420 + i * 96;
    drawChapterText(ctx, api, format(n) + ' left', 487, y, 32, C.muted, 'right');
    const width = 700 * ((n - 1) / (backlog - 1));
    if (active > 0 && width > 0) api.line(ctx, 568, y - 9, 568 + width * active, y - 9, C.cyan, 12);
    if (active === 1)
      drawChapterText(ctx, api, format(n - 1) + ' shifts', 1355, y, 32, C.ink, 'left');
  });
  if (sum === 1)
    drawChapterText(
      ctx,
      api,
      '49,999 + 49,998 + … + 1 = ' + format((backlog * (backlog - 1)) / 2) + ' shifts',
      960,
      959,
      41,
      C.yellow,
    );
}

export function drawAmortizedLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u =
      currentBeat === 0
        ? (3 * q(state, 'ds-amortized-ledger-0', 0, 0.1, 0.35) +
            q(state, 'ledger-fourth', 0, 0.38, 0.68) +
            2 * q(state, 'ledger-fifth-sixth', 0, 0.71, 0.92)) /
          6
        : q(state, 'ds-amortized-ledger-' + currentBeat, currentBeat),
    done = u >= 1;
  api.focus.target('ds-amortized-ledger-mechanism', () => {
    if (currentBeat === 3) {
      drawBacklog(ctx, api, state);
      return;
    }
    if (currentBeat === 2) {
      const removed = Math.min(7, Math.floor(u * 7 + 1e-9)),
        values = [0, 1, 2, 3, 0, 1, 2],
        movement = (removed * (13 - removed)) / 2;
      drawChapterText(
        ctx,
        api,
        'Same seven references · repeated list pop(0)',
        960,
        315,
        35,
        themeColors.yellow,
      );
      for (let i = removed; i < 7; i++)
        drawChapterReference(
          ctx,
          api,
          values[i],
          230 + (i - removed) * 210,
          535,
          themeColors.cyan,
          180,
        );
      drawChapterText(
        ctx,
        api,
        removed + ' front removals · ' + movement + ' old-reference movements',
        960,
        795,
        36,
        themeColors.pink,
      );
      if (done)
        drawChapterText(
          ctx,
          api,
          '6 + 5 + 4 + 3 + 2 + 1 + 0 = 21 movements',
          960,
          925,
          34,
          themeColors.yellow,
        );
      drawChapterFooter(
        ctx,
        api,
        'Each front removal shifts the surviving references; deque end removal avoids those shifts.',
      );
      return;
    }
    const values = [0, 1, 2, 3, 0, 1, 2],
      { completed, step, fraction, resize, capacity, copies, writes } = appendWorksheetState(
        currentBeat,
        u,
      ),
      targetY = resize ? 690 : 560;
    drawChapterText(
      ctx,
      api,
      'Doubling array  /  ' + capacity + ' slots',
      960,
      315,
      35,
      themeColors.yellow,
    );
    const x0 = 160,
      gap = 132,
      w = 112;
    if (resize) {
      drawChapterText(ctx, api, 'Existing allocation', 330, 395, 28, themeColors.muted);
      for (let i = 0; i < step; i++) {
        drawChapterRectangle(ctx, api, x0 + i * gap, 430, w, 72, themeColors.muted);
        drawChapterReference(ctx, api, values[i], x0 + i * gap, 430, themeColors.muted, w);
      }
      drawChapterText(ctx, api, 'Larger allocation', 1510, 645, 28, themeColors.cyan);
      for (let i = 0; i < capacity; i++)
        drawChapterRectangle(ctx, api, x0 + i * gap, targetY, w, 72, themeColors.muted);
      for (let i = 0; i < step; i++) {
        const local = api.clamp((fraction / 0.8) * step - i);
        if (local > 0) {
          const yy = 516 + (targetY - 516) * local;
          drawChapterReference(ctx, api, values[i], x0 + i * gap, yy, themeColors.green, w);
        }
      }
      const incoming = api.clamp((fraction - 0.8) / 0.2);
      if (incoming > 0)
        drawChapterReference(
          ctx,
          api,
          values[step],
          x0 + step * gap,
          390 + (targetY - 390) * incoming,
          themeColors.yellow,
          w,
        );
    } else {
      for (let i = 0; i < capacity; i++)
        drawChapterRectangle(ctx, api, x0 + i * gap, targetY, w, 72, themeColors.muted);
      for (let i = 0; i < step; i++)
        drawChapterReference(ctx, api, values[i], x0 + i * gap, targetY, themeColors.cyan, w);
      if (step < 7)
        drawChapterReference(
          ctx,
          api,
          values[step],
          1500 + (x0 + step * gap - 1500) * fraction,
          390 + (targetY - 390) * fraction,
          themeColors.yellow,
          w,
        );
    }
    drawChapterText(
      ctx,
      api,
      'Old references copied: ' + (completed === 7 ? 9 : copies),
      530,
      865,
      33,
      themeColors.green,
    );
    drawChapterText(ctx, api, 'New references stored: ' + writes, 1370, 865, 33, themeColors.cyan);
    if (currentBeat === 1 && done)
      drawChapterText(
        ctx,
        api,
        '9 copies + 7 new writes = 16 writes',
        960,
        950,
        39,
        themeColors.yellow,
      );
    drawChapterFooter(ctx, api, 'A list can hold several references to the same message.');
    return;
  });
}
export default {
  id: 'amortized-ledger',
  draw: drawAmortizedLedger,
  cues: [
    'ds-amortized-ledger-0',
    'ledger-fourth',
    'ledger-fifth-sixth',
    'ds-amortized-ledger-1',
    'ds-amortized-ledger-2',
    'ledger-backlog',
    'ledger-drain',
  ],
};
