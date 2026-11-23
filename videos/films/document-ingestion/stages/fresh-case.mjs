import { desk, said } from '../document-desk.mjs';
import { freshIngestion, sha, sourceGate } from '../model.mjs';

const failureMinute = 3 * 60 + 12;
const restoreId = 'B-41';
const clock = (minute) => [Math.floor(minute / 60), minute % 60].map(n => String(n).padStart(2, '0')).join(':');

function excerpt(ink, text, x, y, color) {
  const [event, action] = text.split(': ');
  const [recipient, window] = action.split(' within ');
  ink(event, x, y, 42, color, 'left', 'serif');
  ink(recipient + ' within', x, y + 73, 35, color);
  ink(window, x, y + 144, 41, color);
}

export function drawFreshCase(ctx, scene, state, api) {
  const { C, ink, rule, sheet, focus, visible, progress } = desk(ctx, api);
  const beat = state.beat ?? 0;
  const admitted = beat >= 2 || said(state, 'fresh-index');
  const corrected = admitted || said(state, 'fresh-correction');
  const restricted = beat >= 3 || said(state, 'fresh-access');
  const stage = corrected ? (restricted ? 2 : 1) : 0;
  const { record } = freshIngestion(stage);
  const transfer = beat >= 4 || visible('fresh-commander');
  const reader = transfer ? 'incident-commanders' : 'ops';
  const access = sourceGate(record, reader);
  const status = said(state, 'fresh-deny');
  const returned = said(state, 'fresh-return');
  const prefix = sha(record.text).slice(0, 12);

  focus('fresh-clock', () => {
    ink(clock(failureMinute), 116, 273, 64, C.yellow);
    ink('Backup restore failed', 360, 252, 43);
    ink('Restore ID   ' + restoreId, 363, 303, 30, C.muted);
  });
  if (beat < 2) {
    focus('fresh-source', () => {
      sheet(114, 357, 803, 366, 'Backup runbook   /   revision 1   /   page 4');
      excerpt(ink, record.reviewedText, 151, 512, C.ink);
    });
    focus('fresh-correction', () => {
      sheet(1004, 357, 803, 366, corrected ? 'Verified extract   /   page 4' : 'OCR candidate   /   page 4', C.cyan);
      excerpt(ink, record.text, 1041, 512, C.ink);
    });
    if (beat === 0) focus('fresh-predict', () => {
      ink('Reader   ops', 118, 815, 34, C.blue);
      ink('Can you release this candidate to search?', 118, 924, 44, C.yellow);
    });
    else {
      focus('fresh-review', () => {
        if (corrected) ink('Original transcription', 118, 815, 34, C.muted);
        else if (said(state, 'fresh-review')) ink('REVIEW · suspect critical value', 118, 815, 34, C.pink);
        else ink('Quality decision', 118, 815, 34, C.muted);
      });
      if (corrected) {
        ink('Retained OCR   ·   2S minutes', 118, 882, 31, C.muted);
        ink('source-verified correction', 1041, 813, 34, C.green);
      }
      if (visible('fresh-index')) focus('fresh-index', () => {
        ink(admitted && access.indexable ? 'New reviewed expectation + trust + writer checks → permitted index' : 'Checking the record for indexing…',
          960, 947, 30, C.green, 'center');
      });
    }
    return;
  }

  focus('fresh-access', () => {
    sheet(114, 357, 803, 395, 'Current index record   /   reviewer view');
    ink('Backup runbook   ·   r1   ·   page 4', 152, 517, 34);
    ink('Text SHA-256   ' + prefix, 152, 595, 32, C.muted);
    ink('Access   ' + record.access.join(', '), 152, 691, 39, C.yellow);
  });
  focus('fresh-commander', () => {
    sheet(1004, 357, 803, 395, 'Retrieved context   /   ' + reader, C.cyan);
    if (transfer && returned && access.readable) {
      focus('fresh-return', () => excerpt(ink, record.text, 1041, 526, C.ink));
    } else if (!transfer && restricted && status && !access.readable) {
      ink('0 passages returned', 1041, 570, 49, C.pink);
    } else if (!restricted && access.readable) {
      excerpt(ink, record.text, 1041, 526, C.ink);
    } else {
      focus('fresh-return', () => ink(transfer ? 'Checking commander access…' : 'New request   ·   access check', 1041, 567, 38, C.muted));
    }
  });

  if (beat < 4) {
    focus('fresh-deny', () => {
      let prompt = 'Can ops receive the rule on the next request?';
      if (status && !transfer) prompt = 'DENY · source scope no longer includes ops';
      else if (transfer) prompt = returned ? 'Notify by what time, with which ID?' : 'Same question   ·   different reader';
      ink(prompt, 960, 899, 41, C.yellow, 'center');
    });
    return;
  }
  const minutes = Number(record.text.match(/within (\d+) minutes/)[1]);
  const done = said(state, 'fresh-deadline');
  focus('fresh-count', () => {
    const left = 188, right = 1119, y = 867;
    const elapsed = progress('fresh-count', 0);
    rule(left, y, right, y, C.muted, 3);
    for (let m = 0; m <= minutes; m += 5) {
      const x = api.lerp(left, right, m / minutes);
      rule(x, y - 13, x, y + 13);
    }
    ink(clock(failureMinute), left, 937, 34, C.blue, 'center');
    ink('+' + minutes + ' min', (left + right) / 2, 833, 33, C.cyan, 'center');
    const cursor = api.lerp(left, right, elapsed);
    if (elapsed > 0) rule(left, y, cursor, y, C.cyan, 6);
    api.circle(ctx, cursor, y, 9, C.yellow);
    focus('fresh-deadline', () =>
      ink(done ? clock(failureMinute + minutes) : '?', right, 937, 44, C.yellow, 'center'));
  });
  if (visible('fresh-id')) focus('fresh-id', () =>
    ink(said(state, 'fresh-id') ? 'Include ' + restoreId : 'Restore ID  ?', 1310, 896, 42, C.ink));
  if (visible('fresh-chunk')) focus('fresh-chunk', () => {
    rule(1029, 481, 1029, 689, C.cyan, 5);
    ink('Keep this rule together in the chunk.', 1420, 798, 30, C.cyan, 'center');
  });
}
export default {
  id: 'fresh-case', draw: drawFreshCase,
  cues: ['fresh-source','fresh-predict','fresh-review','fresh-correction','fresh-index','fresh-access','fresh-deny','fresh-commander','fresh-return','fresh-clock','fresh-count','fresh-deadline','fresh-id','fresh-chunk'],
};
