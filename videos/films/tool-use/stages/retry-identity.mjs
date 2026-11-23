import { filmClock } from '../clock.mjs';
import { operationService, RETRY_TRACE } from '../fixtures.mjs';

const originalKey = 'op-17';
const book = 'B7';

export function holdRetry(retryKey) {
  const library = operationService();
  library.apply(originalKey, { book_id: book });
  const before = library.snapshot();
  const receipt = library.apply(retryKey, { book_id: book });
  return { before, after: library.snapshot(), receipt };
}

const same = holdRetry(originalKey);
const fresh = holdRetry('op-18');
const original = same.before.ledger[0];
const submissionRef = 'L-42';
const submissions = new Map([[submissionRef, { reader: 'Lena', ...original }]]);

export function drawRetryIdentity(ctx, scene, state, api) {
  const { C, focus } = api;
  const { started, after, progress } = filmClock(scene, state);
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, String(value), x, y, size, color, 'left', font);

  function ledger(x, y, w, rows) {
    api.rect(ctx, x, y, w, 231, C.panel, C.muted, 5);
    const cols = [x + 28, x + w * .41, x + w * .67];
    ['Operation', 'Book', 'Saved hold'].forEach((s, i) => label(s, cols[i], y + 45, 29, C.muted));
    api.line(ctx, x + 24, y + 63, x + w - 24, y + 63, C.muted, 2);
    rows.forEach((row, i) => {
      const yy = y + 126 + i * 72;
      [row.operation, row.book, row.hold].forEach((v, j) => label(v, cols[j], yy, 36, C.cyan, 'mono'));
    });
  }

  if (state.beat === 1 || state.beat === 2) {
    const branches = [
      { side: 'left', x: 115, title: 'Same key', key: originalKey, trial: same,
        named: 'hold-same-key', checked: 'hold-match', outcome: 'hold-replay' },
      { side: 'right', x: 1005, title: 'Fresh key', key: 'op-18', trial: fresh,
        named: 'hold-new-key', checked: 'hold-miss', outcome: 'hold-duplicate' },
    ];
    for (const b of branches) {
      const done = after(b.outcome);
      const snapshot = done ? b.trial.after : b.trial.before;
      const checked = after(b.checked);
      const exists = b.trial.before.ledger.some(row => row.operation === b.key && row.book === book);
      focus.target('hold-' + b.side, () => {
        label('Retry from the timeout', b.x, 285, 35, C.muted);
        const named = started(b.named);
        label(named ? b.title + '   /   ' + b.key : 'Retry key   ?', b.x, 375, 50,
          named ? C.blue : C.ink);
        label('Requested book   ' + book, b.x, 440, 36);
        if (checked) label(exists ? 'Matching saved entry' : done ? 'Filed under ' + b.key : 'No entry for ' + b.key, b.x, 520, 35,
          exists ? C.cyan : C.yellow);
        ledger(b.x, 561, 790, snapshot.ledger);
        const count = done ? String(snapshot.effects) : '?';
        label('Holds after retry', b.x, 888, 39);
        label(count, b.x + 406, 898, 65, done ? C.cyan : C.yellow);
        if (done) {
          label(snapshot.attempts + ' requests   /   receipt ' + b.trial.receipt.hold,
            b.x, 975, 34, C.cyan);
        }
      });
    }
    return;
  }

  if (state.beat === 3) {
    const changed = started('hold-conflict-input');
    const rejected = after('hold-conflict-result') && RETRY_TRACE.conflictRejected;
    focus.target('hold-client-request', () => {
      label('Retry request', 130, 315, 44, C.blue);
      label(originalKey, 130, 458, 70, C.blue, 'mono');
      label('Book   ' + (changed ? 'B8' : book), 130, 564, 52, changed ? C.yellow : C.ink);
    });
    focus.target('hold-target', () => {
      label('Original library entry', 985, 315, 44);
      ledger(980, 372, 825, [original]);
      if (started('hold-save-together')) {
        const right = 1010 + 720 * progress('hold-save-together');
        api.line(ctx, 1010, 539, right, 539, C.cyan, 4);
      }
      if (rejected) {
        label('B8 differs from the saved B7', 985, 710, 42, C.yellow);
        label('Request rejected   /   ' + RETRY_TRACE.conflict.effects + ' hold on file', 985, 796, 38);
      }
    });
    return;
  }

  if (state.beat === 4) {
    const checked = after('hold-status-found');
    const record = checked && submissions.get(submissionRef);
    focus.target('hold-caller', () => {
      label('Lena’s submission', 130, 320, 46, C.ink, 'serif');
      label(submissionRef, 130, 484, 71, C.blue, 'mono');
      label(record ? 'Verified   /   ' + record.hold : 'Receipt missing', 130, 620, 46,
        record ? C.cyan : C.yellow);
    });
    focus.target('hold-status', () => {
      label('Library status record', 945, 320, 46, C.ink, 'serif');
      api.rect(ctx, 940, 380, 840, 330, C.panel, C.muted, 7);
      label(started('hold-status-read') ? 'Status lookup   /   ' + submissionRef : 'Awaiting lookup',
        990, 465, 41, C.blue);
      if (record) {
        label(record.reader + '   /   ' + record.book, 990, 556, 40);
        label(record.hold, 990, 650, 56, C.cyan);
      }
    });
    label('This library can look up a submission. A repeat write can create another hold.', 135, 914, 35);
    return;
  }

  const saved = after('hold-file');
  const lost = after('hold-lost');
  focus.target('hold-caller', () => {
    label('Lena’s app', 130, 315, 48, C.ink, 'serif');
    label('Hold requested for B7', 130, 423, 40);
    label('Receipt     ?', 130, 550, 55, C.yellow);
    if (after('hold-timeout')) label('Timed out', 130, 640, 38, C.yellow);
  });
  if (after('hold-timeout')) label('Can Lena tell whether the hold was saved?', 135, 1003, 36);
  focus.target('hold-target', () => {
    label('Library hold ledger', 985, 315, 48, C.ink, 'serif');
    ledger(980, 372, 825, saved ? [original] : []);
  });
  focus.target('hold-return', () => {
    if (saved) {
      api.line(ctx, 170, 880, 850, 880, C.muted, 2);
      api.line(ctx, 985, 880, 1620, 880, C.muted, 2);
      if (!lost) {
        const x = 1390 - 575 * progress('hold-lost');
        api.rect(ctx, x, 741, 292, 100, C.panel, C.cyan, 7);
        label(original.hold, x + 42, 808, 43, C.cyan, 'mono');
      } else {
        label('Reply lost', 820, 820, 39, C.yellow);
        api.line(ctx, 884, 856, 914, 901, C.yellow, 4);
        api.line(ctx, 915, 856, 945, 901, C.yellow, 4);
      }
    }
  });
}

export default {
  id: 'retry-identity',
  draw: drawRetryIdentity,
  cues: ['hold-file', 'hold-lost', 'hold-timeout', 'hold-same-key', 'hold-new-key',
    'hold-fork-question', 'hold-match', 'hold-replay', 'hold-miss', 'hold-duplicate',
    'hold-conflict-input', 'hold-conflict-result', 'hold-save-together', 'hold-status-read', 'hold-status-found'],
};
