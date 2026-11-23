import { cueBegun, cueProgress } from '../arithmetic.mjs';
import { FRESH_EVALUATION } from '../fixtures.mjs';
import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptText } from '../defaults.mjs';
import { reportPage } from '../release-picture.mjs';

export function drawFreshAuthority(ctx, scene, state, api) {
  const { C } = api;
  const f = promptCueSnapshot(scene.id, state).fresh;
  const begun = (id) => cueBegun(state.cues, id, false);
  const progress = (id) => cueProgress(state.cues, id, 0);
  const text = (s, x, y, size, color = C.ink) => drawPromptText(ctx, api, s, x, y, size, color);
  const closing = begun('fresh-return');
  const secondRun = begun('fresh-compare');
  const grantVisible = begun('fresh-grant');
  const q = f.request;
  const outcome = closing ? 'First request' : secondRun ? 'Second run' : 'First run';

  text(
    outcome +
      '   /   ' +
      q.user +
      '   ·   ' +
      q.candidate +
      '   ·   ' +
      q.suite +
      '   ·   ' +
      q.target,
    120,
    266,
    36,
    C.ink,
  );
  if (closing) {
    api.focus.target('fresh-answer', () => {
      reportPage(ctx, api, 120, 350, 780, 405, 'Reply to the authorized reader', () => {
        text('Source   /   Accessible evaluation record', 158, 690, 28, C.blue);
        const { candidate, gate, suite } = FRESH_EVALUATION;
        if (begun('fresh-summary'))
          text('“' + candidate + ' ' + gate + ' evaluation ' + suite + '.”', 158, 570, 42);
      });
    });
    api.focus.target('fresh-denial', () => {
      text('Release decision', 1060, 408, 34, C.cyan);
      text(
        q.operation + (f.firstRun.added[0] ? '   /   Permitted' : '   /   Denied'),
        1060,
        548,
        54,
      );
      text('Approval on file covered ' + f.firstRun.approval.operation + '.', 1060, 633, 35);
      text('Local writes for this request   ' + f.firstRun.entries.length, 1060, 712, 34, C.yellow);
      if (begun('fresh-review')) text('Review record   /   ' + q.operation, 1060, 915, 32, C.muted);
    });
    return;
  }

  api.focus.target('fresh-request', () => {
    text('Current host operation', 125, 394, 31, C.cyan);
    text(q.operation, 125, 533, 85);
    text('Proposed write to staging', 125, 598, 30);
    if (begun('fresh-note')) {
      api.line(ctx, 126, 693, 126, 806, C.blue, 6);
      text('Cached report note', 152, 725, 27, C.blue);
      text('“Approved”', 152, 790, 42);
    }
    if (begun('fresh-retry')) {
      const x = 392 + 124 * progress('fresh-retry');
      api.rect(ctx, x, 481, 140, 64, C.panel, C.yellow, 5);
      text(q.operation, x + 22, 524, 34, C.yellow);
      api.line(ctx, 665, 477, 665, 550, C.muted, 3);
    }
  });
  api.focus.target('fresh-store', () => {
    api.rect(ctx, 682, 342, 492, 316, C.panel, C.muted, 8);
    text('Trusted approval store', 716, 405, 32, C.cyan);
    if (grantVisible && f.storeApproval) {
      text(f.storeApproval.operation, 716, 535, 85, C.ink);
      text('Unused grant', 716, 607, 30, C.muted);
    } else {
      text(grantVisible ? 'Consumed' : 'Lookup pending', 716, 534, 47, C.muted);
    }
  });
  api.focus.target('fresh-ledger', () => {
    const entryX = 1440;
    const entryBaseline = 535;
    text('Local write ledger', 1330, 395, 34, C.cyan);
    api.line(ctx, 1330, 439, 1785, 439, C.muted, 2);
    if (f.entries.length) {
      text('01', 1330, entryBaseline, 33, C.muted);
      text(f.entries[0].operation, entryX, entryBaseline, 61);
    } else if (!begun('pi-fresh-one')) text('Empty', 1330, entryBaseline, 46, C.muted);
    api.line(ctx, 1330, 579, 1785, 579, C.muted, 2);
    if (f.effectsVisible) text('Entries   ' + f.entries.length, 1330, 644, 32, C.green);
    const p = progress('pi-fresh-one');
    if (f.matching && p > 0 && !f.effectsVisible) {
      const x = api.lerp(1200, entryX - 29, p);
      api.rect(ctx, x, entryBaseline - 45, 160, 62, C.panel, C.green, 4);
      text(q.operation, x + 29, entryBaseline, 34, C.green);
    }
  });
  api.focus.target('fresh-count', () => {
    api.line(ctx, 120, 873, 1800, 873, C.muted, 2);
    if (f.replay) {
      text(
        'Replay added ' + f.added.at(-1) + ' entries.   Total   ' + f.entries.length,
        125,
        966,
        45,
        C.green,
      );
    } else if (f.effectsVisible)
      text('Grant consumed   ·   ' + f.entries.length + ' write recorded', 125, 966, 45, C.green);
    else if (f.matching) text('Same ' + q.operation + ' in both records', 125, 966, 45, C.cyan);
    else if (secondRun) text('Same request   ·   Empty ledger', 125, 966, 45, C.ink);
    else if (f.zeroVisible)
      text(
        f.approval.operation +
          ' covers a different operation   ·   ' +
          f.firstRun.entries.length +
          ' writes',
        125,
        966,
        45,
        C.ink,
      );
    else if (begun('fresh-question'))
      text('How many writes can ' + q.operation + ' add?', 125, 966, 48, C.yellow);
  });
}
export default {
  id: 'fresh-authority',
  draw: drawFreshAuthority,
  cues: [
    'fresh-input',
    'fresh-note',
    'fresh-grant',
    'fresh-question',
    'pi-fresh-zero',
    'fresh-compare',
    'pi-fresh-matching',
    'pi-fresh-one',
    'fresh-retry',
    'pi-fresh-replay',
    'fresh-return',
    'fresh-summary',
    'fresh-review',
  ],
};
