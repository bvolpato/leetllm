import {
  C,
  box,
  line,
  txt,
  mono,
  serif,
  paper,
  overline,
  stamp,
  dot,
  lerp,
  ramp,
  on,
  head,
  caption,
  printer,
} from './print-room.mjs';
import {
  project,
  commands,
  versions,
  indexRead,
  pending,
  receipt,
  uncommitted,
  recover,
} from './memory.mjs';

const settingWidth = 804;
const settingHeight = 281;
function setting(g, x, label, version, value, { active = true, y = 352 } = {}) {
  printer(g, x, y, settingWidth);
  paper(g, x, y, settingWidth, settingHeight, active ? C.paper : C.shade);
  overline(g, label, x + 34, y + 57, true);
  line(g, x + 33, y + 92, x + 767, y + 92, '#9aa898', 2, [8, 6]);
  mono(g, value, x + 34, y + 174, 42, C.ink, { width: 732 });
  mono(g, 't3   /   billing.verifier', x + 34, y + 244, 25, C.faint);
  box(g, x + 614, y + 19, 152, 60, C.ink, 6);
  mono(g, 'rev ' + version, x + 690, y + 59, 32, C.white, { align: 'center' });
}
function verifierLine(g, y, label, value, tag = '') {
  box(g, 97, y, 1725, 99, C.panel, 8);
  txt(g, label, 128, y + 61, 37, C.white);
  if (value) mono(g, value, 710, y + 62, 40, C.teal);
  else line(g, 711, y + 64, 1220, y + 64, C.edge, 2, [8, 7]);
  if (tag) mono(g, tag, 1783, y + 60, 27, C.dim, { align: 'right' });
}

const noRead = { probe: 0, checked: false, delivery: 0 };

function afterSpeech(c, beat, phrase) {
  if (c.beat.beatIndex !== beat) return c.beat.beatIndex > beat;
  return c.elapsed + 1e-9 >= c.wordCue(phrase).end;
}

function tryIndex(c, beat, start, answer, { answerBeat = beat, captionStart = answer } = {}) {
  const probe = ramp(c, beat, start, 0.65);
  if (c.beat.beatIndex === answerBeat) c.reveal(answer, 0, { captionStart });
  const checked = probe === 1 && afterSpeech(c, answerBeat, answer);
  let delivery = 0;
  if (checked) {
    const duration = 0.4;
    if (c.beat.beatIndex > answerBeat) delivery = 1;
    else {
      const end = c.wordCue(answer).end;
      delivery = c.elapsed + 1e-9 >= end + duration ? 1 : Math.max(0, (c.elapsed - end) / duration);
    }
  }
  return { probe, checked, delivery };
}

function readGate(g, state, read, { sourceX, indexX, cardBottom, resultTop }) {
  const middle = 960;
  const gate = { x: 672, y: 570, width: 576, height: 100 };
  const gateRight = gate.x + gate.width;
  const gateBottom = gate.y + gate.height;
  const inletY = gate.y + gate.height / 2;
  const accepted = read.checked && Boolean(state.value);
  const verdictColor = accepted ? C.teal : C.rose;
  const annotation = { align: 'center' };
  let reason = 'Compare the record ID and revision';
  if (read.checked) {
    if (state.source.tombstone) reason = 'Source deleted';
    else if (!state.source.grant) reason = 'Grant revoked';
    else if (!state.active) reason = 'Source expired';
    else if (!state.matches) reason = 'Same ID, different revisions';
    else reason = 'Current revision and access';
  }

  const sourceLine = read.probe === 1 ? C.white : C.edge;
  line(g, sourceX, cardBottom, sourceX, inletY, sourceLine, 3);
  line(g, sourceX, inletY, gate.x, inletY, sourceLine, 3);
  line(g, indexX, cardBottom, indexX, inletY, C.edge, 3);
  line(g, indexX, inletY, gateRight, inletY, C.edge, 3);
  line(g, middle, gateBottom, middle, resultTop, C.edge, 3, [5, 7]);

  if (read.probe > 0) {
    const vertical = inletY - cardBottom;
    const horizontal = indexX - gateRight;
    const travel = read.probe * (vertical + horizontal);
    const y = cardBottom + Math.min(travel, vertical);
    const x = indexX - Math.max(0, travel - vertical);
    const color = read.checked ? verdictColor : C.violet;
    line(g, indexX, cardBottom, indexX, y, color, 5);
    if (x < indexX) line(g, indexX, inletY, x, inletY, color, 5);
    if (read.probe < 1) dot(g, x, y, 8, color);
  }
  if (accepted && read.delivery > 0) {
    const y = lerp(gateBottom, resultTop, read.delivery);
    line(g, middle, gateBottom, middle, y, C.teal, 5);
    if (read.delivery < 1) dot(g, middle, y, 8, C.teal);
  }

  box(g, gate.x, gate.y, gate.width, gate.height, C.panel, 10, read.checked ? verdictColor : C.edge);
  mono(g, 'CHECK AGAINST SOURCE', middle, gate.y + 33, 24, C.dim, annotation);
  txt(g, reason, middle, gate.y + 77, 36, read.checked ? verdictColor : C.white, {
    ...annotation,
    width: gate.width - 48,
  });
}

export function projection(g, c) {
  const i = c.beat.beatIndex;
  const update = on(c, 1, 'Commit revision two');
  const refreshing = on(c, 2, 'Now refresh the search copy');
  const refresh = afterSpeech(c, 2, 'refresh the search copy');
  const deleted = on(c, 3, 'delete the source');
  const saved = afterSpeech(c, 3, 'Save that packet');
  const late = afterSpeech(c, 3, 'It cannot recreate this record');
  const restored = afterSpeech(c, 4, 'matching revisions');
  const revoked = on(c, 4, 'revoke Ada’s grant');
  const grantRestored = afterSpeech(c, 4, 'Restore the grant for the expiry test');
  const nearExpiry = on(c, 4, 'One second before expiry');
  const expiry = afterSpeech(c, 4, 'At the deadline');
  const fixture = versions({
    update,
    refresh,
    deleted: deleted && !restored,
    restored,
    grant: !revoked || grantRestored,
  });
  const now = fixture.source.expires - (expiry ? 0 : 1);
  const state = nearExpiry
    ? { ...fixture, ...indexRead(fixture.source, fixture.copy, now, project) }
    : fixture;

  const nextPrompt = afterSpeech(c, 0, 'The next prompt starts empty');
  let read = noRead;
  if (i === 0 && !nextPrompt) {
    read = tryIndex(c, 0, 'A read through the index', 'returns the saved command');
  } else if (i === 1 || i === 2) {
    read = refresh
      ? tryIndex(c, 2, 'Read again', 'The prompt can include the billing command')
      : tryIndex(c, 1, 'If this prompt reads through the index', 'Neither command', { answerBeat: 2 });
  } else if (i >= 3 && !restored) {
    read = deleted
      ? tryIndex(c, 3, 'A fresh read returns nothing', 'returns nothing')
      : tryIndex(c, 2, 'Read again', 'The prompt can include the billing command');
  } else if (restored) {
    if (expiry) {
      read = tryIndex(c, 4, 'At the deadline', 'the read is empty again');
    } else if (nearExpiry) {
      read = tryIndex(c, 4, 'One second before expiry', 'the command comes back');
    } else if (revoked && !grantRestored) {
      read = tryIndex(c, 4, 'revoke Ada’s grant', 'revoke Ada’s grant. The read is empty', {
        captionStart: 'The read is empty. Restore the grant',
      });
    }
  }

  head(
    g,
    'Source lineage   /   SQLite read',
    restored ? 'What else can block a matching copy?' : 'Which command can the index supply?',
  );
  const sourceX = 96;
  const indexX = 1017;
  const cardTop = 260;
  const resultTop = 723;
  readGate(g, state, read, {
    sourceX: sourceX + settingWidth / 2,
    indexX: indexX + settingWidth / 2,
    cardBottom: cardTop + settingHeight,
    resultTop,
  });
  setting(
    g,
    sourceX,
    'Authoritative billing profile',
    state.source.version,
    state.source.value ?? 'Source deleted',
    { active: !state.source.tombstone, y: cardTop },
  );
  setting(g, indexX, 'Index   /   referenced revision', state.copy.version, state.copy.value, {
    y: cardTop,
  });

  const resultWidth = 1016;
  const resultHeight = 107;
  box(g, sourceX, resultTop, resultWidth, resultHeight, C.panel, 8);
  const resultLabel = i === 0 && !nextPrompt ? 'Index read result' : 'Fresh prompt verifier';
  overline(g, resultLabel, sourceX + 27, resultTop + 35);
  const value = read.delivery === 1 ? state.value : null;
  if (value) mono(g, value, sourceX + 27, resultTop + 84, 42, C.teal);
  else if (read.checked && !state.value)
    txt(g, 'No command returned', sourceX + 27, resultTop + 84, 39, C.rose);
  else line(g, sourceX + 28, resultTop + 79, sourceX + 622, resultTop + 79, C.edge, 2, [8, 7]);

  const sideX = sourceX + resultWidth + 28;
  if (restored) {
    box(g, sideX, resultTop, 681, resultHeight, C.deep, 8);
    overline(g, grantRestored ? 'Expiry test' : 'Grant test', sideX + 26, resultTop + 35);
    const input = nearExpiry
      ? now + ' s   /   expires at ' + state.source.expires + ' s'
      : state.source.grant ? 'Grant active' : 'Grant revoked';
    txt(g, input, sideX + 26, resultTop + 84, 36);
  } else if (saved) {
    const earlier = versions({ update: true, refresh: true }).value;
    box(g, sideX, resultTop, 681, resultHeight, C.deep, 8);
    overline(g, 'Earlier packet', sideX + 26, resultTop + 35);
    mono(g, earlier, sideX + 26, resultTop + 84, 36, C.dim);
  }

  if (restored) caption(g, 'The read checks live access and expiry even when revisions match.');
  else if (late) caption(g, 'The tombstone also blocks the queued index refresh.');
  else if (saved) caption(g, 'The earlier packet is already a separate copy.');
  else if (i === 0) caption(g, 'The record survives a connection close and reopen.');
  else if (refreshing && !refresh) caption(g, 'The worker is refreshing the search copy.');
  else if (read.probe > 0) caption(g, 'The lookup checks the index entry against the current source.');
  else if (refresh) caption(g, 'The worker has refreshed the search copy. Try the same read again.');
  else if (update) caption(g, 'Ada still has access. Predict the result of the index read.');
  else caption(g, 'Ada’s update goes to the authoritative profile first.');
}

export function recovery(g, c) {
  const sent = on(c, 0, 'destination receives'),
    crash = on(c, 0, 'process crashes');
  const second = on(c, 2, 'Try the same crash'),
    third = on(c, 3, 'outcome is unknown');
  const found = !second && on(c, 1, 'matching receipt');
  const recorded = found && on(c, 1, 'Record the receipt');
  const absent = second && !third && on(c, 2, 'never committed');
  const expired = absent && on(c, 2, 'approval has expired');
  const result = found ? receipt : absent ? uncommitted : null;
  head(
    g,
    'Recovery   /   billing webhook',
    'Did the merge happen before the crash?',
    'PR ' + pending.pr + '   /   ' + pending.rev,
  );
  overline(g, 'Retrieval memory', 90, 297);
  box(g, 90, 323, 1726, 90, C.panel, 9);
  serif(g, '“Merge approved”', 124, 385, 48);
  txt(g, 'Earlier conversation', 1776, 383, 29, C.dim, { align: 'right' });
  overline(g, 'Saved workflow checkpoint', 90, 476);
  overline(g, 'Merge destination', 1035, 476);
  paper(g, 90, 517, 749, 276);
  mono(g, 'Key   ' + pending.key, 128, 583, 37, C.ink);
  txt(g, pending.repo + '   /   ' + pending.rev, 128, 652, 33, C.ink, { font: 'Mono' });
  stamp(g, recorded ? 'Receipt recorded' : 'Pending', 130, 736, recorded ? C.green : C.amber);
  const keyColor = sent ? C.apricot : C.edge;
  line(g, 852, 608, 1007, 608, keyColor, 4, crash ? [11, 8] : []);
  if (sent) mono(g, pending.key, 929, 582, 30, keyColor, { align: 'center' });
  if (found) {
    paper(g, 1035, 517, 780, 276, '#cae9d9');
    overline(g, 'Destination receipt   /   committed', 1070, 576, true);
    mono(g, result.key + '   /   ' + result.repo, 1070, 642, 40, C.ink);
    mono(g, 'PR ' + result.pr + '   /   ' + result.rev, 1070, 702, 32, C.faint);
  } else {
    box(g, 1035, 517, 780, 276, C.deep, 7, C.edge);
    serif(
      g,
      third
        ? 'Outcome unknown'
        : absent
          ? 'Confirmed uncommitted'
          : crash
            ? 'Reply missing'
            : sent
              ? 'Request received'
              : 'Awaiting request',
      1072,
      630,
      51,
      C.white,
      { width: 709 },
    );
    if (expired) txt(g, 'Current approval expired', 1074, 712, 36, C.rose);
    else if (third) txt(g, 'Request may still be in flight', 1074, 712, 32, C.dim);
    else if (!second && crash) txt(g, 'Look up the same pending key', 1074, 712, 32, C.dim);
  }
  if (third)
    caption(
      g,
      recover(pending, null, 'unknown') + '   /   keep ' + pending.key + ' pending.',
      'Retry requires current authorization and a destination that can safely accept the same key.',
    );
  else if (expired)
    caption(
      g,
      recover(pending, uncommitted, 'expired') + '   /   keep ' + pending.key + ' pending.',
    );
  else if (absent) caption(g, 'Before retrying, check approval for this exact change.');
  else if (recorded) caption(g, recover(pending, receipt, 'unknown') + '   /   0 new merge calls.');
  else if (found) caption(g, 'The destination has a receipt. The checkpoint still says pending.');
  else if (second) caption(g, 'Second run   /   same checkpoint, key and historical note.');
  else if (crash)
    caption(g, 'The checkpoint has no saved reply. Could the change already have landed?');
  else caption(g, 'A checkpoint saves the execution boundary and pending key.');
}

export function returnVisit(g, c) {
  const source = {
      ...project,
      id: 't3',
      version: 3,
      value: commands[2],
      grant: true,
      expires: 200,
      tombstone: false,
    },
    copy = { ...project, id: 't3', version: 2, value: commands[1] };
  const pinned = on(c, 1, 'Pin the invoices test');
  const fromIndex = indexRead(source, copy, 103, project).value;
  const fromProfile = indexRead(source, source, 103, project).value;
  const selected = pinned ? fromProfile : fromIndex;
  if (c.beat.beatIndex === 2) {
    const profileArrived = on(c, 2, 'profile arrives first'),
      late = on(c, 2, 'search misses its deadline'),
      sent = on(c, 2, 'Send the invoices test');
    head(
      g,
      'Return visit   /   response deadline',
      'Which evidence arrived in time?',
      'ADA   /   BILLING',
    );
    overline(g, 'Same request', 481, 310);
    overline(g, 'Deadline for this call', 1170, 310);
    line(g, 1230, 347, 1230, 607, C.apricot, 3, [10, 8]);
    const y1 = 427,
      y2 = 553,
      xx = 480;
    serif(g, 'Profile read', 93, y1 + 17, 48);
    serif(g, 'Replay search', 93, y2 + 17, 48);
    for (const yy of [y1, y2]) {
      line(g, xx, yy, 1740, yy, C.edge, 2);
      dot(g, xx, yy, 9, C.white);
    }
    if (profileArrived) {
      line(g, xx, y1, 920, y1, C.teal, 7);
      dot(g, 920, y1, 14, C.teal);
      mono(g, 'v3 arrived', 936, y1 - 24, 29, C.teal);
    }
    if (late) {
      line(g, xx, y2, 1230, y2, C.violet, 7);
      line(g, 1230, y2, 1530, y2, C.violet, 4, [7, 8]);
      mono(g, 'Still pending', 1340, y2 - 29, 29, C.violet);
    }
    verifierLine(
      g,
      687,
      sent ? 'Sent in this call' : 'This call   /   verify',
      profileArrived ? selected : null,
      profileArrived ? 'Profile v3' : 'Awaiting profile',
    );
    caption(
      g,
      sent
        ? 'Replay deferred   /   ' + pending.key + ' still pending in the workflow checkpoint.'
        : 'Profile and replay have separate read paths.',
      sent ? 'Check the outcome and current approval before any retry.' : undefined,
    );
    return;
  }
  head(g, 'Return visit   /   practice', 'What belongs on the verifier line?', 'ADA   /   BILLING');
  setting(g, 96, 'Current project profile', source.version, fromProfile);
  setting(g, 1017, 'Search projection', copy.version, copy.value);
  mono(g, '≠', 959, 520, 61, C.apricot, { align: 'center' });
  verifierLine(g, 687, 'Ada’s next prompt   /   verify', selected, pinned ? 'Scoped profile' : '');
  if (pinned) caption(g, 'The source can supply this turn while the search copy refreshes.');
  else caption(g, 'The search copy is one revision behind. The merge is still pending.');
}
