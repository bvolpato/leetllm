import { bracket, cachePicture, clauseEnded } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';

export function drawFreshTail(ctx, scene, state, api) {
  const { C } = api;
  const model = flashinferExtensionFrame('fresh-tail', state);
  const appended = clauseEnded(state, 'fresh-append', 0, 0.4);
  const retired = clauseEnded(state, 'fresh-cancel', 2, 0.4);
  const handedOff = clauseEnded(state, 'fresh-owner', 2, 0.78);
  const written = clauseEnded(state, 'fresh-handoff', 2, 0.86);
  const planLength = model.refreshed ? model.newLength : model.oldPlan;
  const length = appended ? model.newLength : model.oldLength;
  api.focus.target('fi-fresh-tail-mechanism', () => {
    api.text(ctx, '8 slots per page', 130, 265, 38, C.ink);
    const bank = cachePicture(ctx, api, {
      pages: model.pages,
      pageSize: model.pageSize,
      length,
      y: 389,
      pageLabel: (page) => (page === 9 && handedOff ? 'Page 9  /  new request' : `Page ${page}`),
      style: (j) => {
        if (handedOff && j < 8) {
          const occupied = j === 0 && written;
          return { label: occupied ? 'u0' : '·', color: occupied ? C.green : C.muted };
        }
        if (appended && j === model.newLength - 1) return { color: C.yellow, ink: C.yellow };
        return {};
      },
    });
    if (!retired) {
      bracket(
        ctx,
        api,
        bank.slot(0) + 4,
        bank.slot(planLength - 1) + bank.slotWidth - 4,
        558,
        C.cyan,
      );
      api.text(ctx, `Prepared for ${planLength} keys`, 134, 621, 36, C.cyan);
      if (model.lengthReady)
        api.text(ctx, `Current history   8 + 8 = ${length}`, 1785, 621, 36, C.yellow, 'right');
    } else {
      api.text(
        ctx,
        'Next launch cancelled  /  request has released its pages',
        960,
        588,
        37,
        C.muted,
        'center',
      );
    }
    const left = 575,
      right = 1440,
      y = 775;
    api.text(ctx, 'Page 9 reader', 130, y + 13, 38, C.ink);
    api.line(ctx, left, y, right, y, C.muted, 4);
    for (let tick = 12; tick <= 14; tick++) {
      const x = left + ((tick - 12) / 2) * (right - left);
      api.line(ctx, x, y - 13, x, y + 13, C.muted, 4);
      api.text(ctx, `tick ${tick}`, x, y + 68, 30, C.muted, 'center');
    }
    api.text(ctx, 'Last read completes', right, y - 56, 33, C.ink, 'center');
    const cursor = left + ((model.currentTick - 12) * (right - left)) / 2;
    api.circle(ctx, cursor, y, 14, model.complete ? C.green : C.yellow);
    const question = 'How many keys must the plan cover? Can page 9 change hands at tick 12?';
    const message = written
      ? 'The new request writes u0 into page 9, slot 0.'
      : handedOff
        ? 'Page 9 now belongs to the new request.'
        : model.complete
          ? 'Last read complete'
          : retired
            ? 'The earlier GPU read still owns a lease.'
            : model.refreshed
              ? 'Updated plan  /  earlier read still pending'
              : model.leaseVerdictReady
                ? 'Keep page 9 for the earlier read.'
                : model.planVerdictReady
                  ? 'One key falls outside the old plan.'
                  : model.lengthReady
                    ? 'Can page 9 change hands at tick 12?'
                    : appended
                      ? question
                      : '';
    api.text(ctx, message, 960, 960, 39, C.yellow, 'center');
  });
}
export default {
  id: 'fresh-tail',
  draw: drawFreshTail,
  cues: [
    'fresh-append',
    'fresh-question',
    'fi-fresh-tail-length',
    'fi-fresh-tail-plan',
    'fi-fresh-tail-lease',
    'fi-fresh-tail-refresh',
    'fresh-cancel',
    'fi-fresh-tail-complete',
    'fresh-owner',
    'fresh-handoff',
  ],
};
