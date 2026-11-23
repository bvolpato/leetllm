import { focusTarget, text } from './defaults.mjs';
import { missingLabelBounds } from './model.mjs';
import { afterCue, cue } from './construction.mjs';

export function drawAuditTray(
  ctx,
  api,
  state,
  { selected, resolved, positive, columns, answering, cues, tray, tally },
) {
  const { C } = api;
  const b = missingLabelBounds(selected, resolved, positive);
  const [close, resolvedShare, widen, none, low, all, high] = cues;
  const progress = (id, a, z) => (answering ? cue(state, id, a, z) : 0);
  const complete = (id, a, z) => answering && afterCue(state, id, a, z);
  const enclosed = progress(close, 0.01, 0.1);
  const scope = progress(widen, 0.25, 0.34);
  const hasResolved = complete(resolvedShare, 0.17, 0.23);
  const lowerSetup = progress(none, 0.36, 0.44);
  const upperSetup = progress(all, 0.6, 0.68);
  const hasLow = complete(low, 0.49, 0.55);
  const hasHigh = complete(high, 0.72, 0.8);
  const space = columns === 15 ? 47 : 49;
  const rows = selected / columns;
  const left = 565 - ((columns - 1) * space) / 2;
  const top = 567 - ((rows - 1) * space) / 2;
  const resolvedRows = resolved / columns;
  const percent = (rate) => Math.round(100 * rate) + '%';

  focusTarget(ctx, api, tray, () => {
    for (let i = 0; i < selected; i++) {
      const x = left + (i % columns) * space;
      const y = top + Math.floor(i / columns) * space;
      if (i < resolved) {
        api.circle(ctx, x, y, 16, i < positive ? C.pink : C.blue);
      } else {
        api.rect(ctx, x - 18, y - 14, 36, 28, C.panel, C.yellow, 2, 3);
        api.line(ctx, x - 14, y - 8, x, y + 2, C.yellow, 2);
        api.line(ctx, x, y + 2, x + 14, y - 8, C.yellow, 2);
      }
    }
    if (enclosed > 0) {
      const x = left - 48;
      const y1 = top - 25;
      const resolvedHeight = (resolvedRows - 1) * space + 50;
      const y2 = y1 + resolvedHeight * enclosed + (rows - resolvedRows) * space * scope;
      api.line(ctx, x, y1, x + 16, y1, C.cyan, 4);
      api.line(ctx, x, y1, x, y2, C.cyan, 4);
      api.line(ctx, x, y2, x + 16, y2, C.cyan, 4);
    }
    text(ctx, api, positive + ' specialist', 310, 903, 29, C.pink, 'center');
    text(ctx, api, resolved - positive + ' routine', 565, 903, 29, C.blue, 'center');
    text(ctx, api, b.unknown + ' sealed', 812, 903, 29, C.yellow, 'center');
  });
  focusTarget(ctx, api, tally, () => {
    if (scope < 1) {
      text(
        ctx,
        api,
        scope > 0
          ? 'Including the sealed cases'
          : enclosed > 0
            ? 'Among the resolved cases'
            : 'Which cases count?',
        1380,
        415,
        39,
        C.ink,
        'center',
      );
      if (enclosed >= 1 && scope === 0) {
        text(
          ctx,
          api,
          positive + ' / ' + resolved + (hasResolved ? ' = ' + percent(b.resolvedRate) : ' = ?'),
          1380,
          580,
          63,
          C.cyan,
          'center',
        );
      }
      return;
    }
    text(ctx, api, 'Among all ' + selected + ' selected cases', 1380, 355, 37, C.ink, 'center');
    if (lowerSetup > 0) {
      text(ctx, api, 'If none of the sealed cases is positive', 1380, 472, 31, C.muted, 'center');
      text(
        ctx,
        api,
        positive + ' / ' + selected + (hasLow ? ' = ' + percent(b.low) : ' = ?'),
        1380,
        549,
        49,
        C.cyan,
        'center',
      );
    }
    if (upperSetup > 0) {
      text(
        ctx,
        api,
        'If all ' + b.unknown + ' sealed cases are positive',
        1380,
        655,
        31,
        C.muted,
        'center',
      );
      text(
        ctx,
        api,
        hasHigh
          ? positive + b.unknown + ' / ' + selected + ' = ' + percent(b.high)
          : '(' + positive + ' + ' + b.unknown + ') / ' + selected + ' = ?',
        1380,
        730,
        49,
        C.cyan,
        'center',
      );
    }
    if (hasLow) {
      const rateX = (rate) => 1040 + 690 * rate;
      const y = 870;
      api.line(ctx, rateX(0), y, rateX(1), y, C.muted, 2);
      text(ctx, api, '0%', rateX(0), y + 46, 25, C.muted, 'center');
      text(ctx, api, '100%', rateX(1), y + 46, 25, C.muted, 'center');
      api.circle(ctx, rateX(b.low), y, 10, C.cyan);
      if (hasHigh) {
        api.line(ctx, rateX(b.low), y, rateX(b.high), y, C.cyan, 8);
        api.circle(ctx, rateX(b.high), y, 10, C.cyan);
      }
    }
  });
}
