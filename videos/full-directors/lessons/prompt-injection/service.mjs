import { C, cue } from './printshop.mjs';
import {
  gateCases,
  links,
  linkDecision,
  recoveryRecord,
  reservation,
  releaseRecord,
  chunks,
  marker,
  scan,
  sinkAllowed,
} from './records.mjs';
import { traffic } from './reader.mjs';
import { CASES, REFUSAL_EVENTS } from '../../../films/prompt-injection/fixtures.mjs';
import { DETECTOR_EXAMPLES, RESULTS } from '../../../films/prompt-injection/observations.mjs';

const gates = ['Ownership', 'Current evaluation', 'Allowed target', 'Exact approval'];
export function gateFrame(k) {
  const e = (b, w, d) => cue(k, b, w, d);
  let index = null;
  if (e(2, 'With no approval')) index = 0;
  if (e(2, 'unknown approval')) index = 3;
  if (e(3, 'A different user')) index = 1;
  if (e(3, 'An old suite')) index = 2;
  if (e(3, 'another operation')) index = 6;
  if (e(3, 'Switching to staging')) index = 4;
  if (e(4, 'hundred-percent target')) index = 5;
  if (e(5, 'Restore the ten-percent target')) index = 7;
  const matched = e(5, 'This tuple matches'),
    written = e(5, 'records one release'),
    replay = e(5, 'A replay');
  const row = gateCases[index ?? 7];
  const verdict = replay
    ? 'approval'
    : index === null || (index === 7 && !matched)
      ? null
      : row.decision;
  return {
    request: row.request,
    unknownId: index === 3,
    grant: written ? null : row.approval,
    verdict,
    entries: Number(written),
    replay,
  };
}
function bindings(g, k) {
  const state = gateFrame(k);
  g.title('Where does this request stop?');
  g.label('Check in service order', 53, 114);
  const stop = ['ownership', 'evaluation', 'target', 'approval', 'allow'].indexOf(state.verdict);
  gates.forEach((v, i) => {
    const x = 68 + i * 225;
    const color = stop < 0 || i > stop ? C.line : i === stop ? C.orange : C.teal;
    if (i < 3) g.line(x, 153, x + 225, 153, C.line, 3);
    g.dot(x, 153, 11, color);
    g.text(v, x - 8, 191, 20, color === C.line ? C.muted : color, { max: 209 });
  });
  const fields = [
    ['Session', 'user'],
    ['Candidate', 'candidate'],
    ['Suite', 'suite'],
    ['Target', 'target'],
    ['Operation', 'operation'],
  ];
  const col = (x, name, data) => {
    g.ticket(x, 218, 390, 233);
    g.label(name, x + 34, 247, 340);
    if (data)
      g.ruleRows(
        x + 34,
        289,
        330,
        fields.map(([label, key]) => [
          label,
          data[key],
          state.grant && state.request[key] !== state.grant[key] ? C.orange : C.ink,
        ]),
        33,
      );
    else g.text('Empty grant slot', x + 34, 343, 29, C.orange, { face: 'Serif' });
  };
  col(48, 'Current request', state.request);
  col(
    467,
    state.unknownId ? 'Unknown approval ID   /   lookup' : 'Approval 9   /   trusted store',
    state.grant,
  );
  g.mono(
    'Ledger   ' + state.entries + ' ' + (state.entries === 1 ? 'entry' : 'entries'),
    54,
    495,
    22,
    C.teal,
  );
  if (state.verdict)
    g.stamp(
      475,
      468,
      state.replay
        ? 'Replay · no grant'
        : state.entries === 1
          ? 'Grant used · release recorded'
          : state.verdict === 'allow'
            ? 'Tuple matches'
            : 'Stopped at ' + gates[stop].toLowerCase(),
      state.verdict === 'allow',
      374,
    );
}
export function rewindFrame(k) {
  const e = (b, w, d) => cue(k, b, w, d);
  const stopped = e(2, 'stopped before dispatch'),
    sent = e(2, 'request reached'),
    committed = e(2, 'committed one release'),
    lost = e(2, 'reply was lost');
  const reserved = e(3, 'atomically reserve'),
    lookup = e(3, 'look up operation nine'),
    recovered = e(3, "recover B's receipt");
  const redelivery = e(5, 'Test that lost reply');
  return {
    stopped,
    sent,
    committed,
    lost,
    reserved,
    lookup,
    recovered,
    histories: ['A', 'B'].map((id) =>
      recoveryRecord(id, { dispatched: sent, committed, lookup, recovered, redelivery }),
    ),
  };
}
function rewind(g, k) {
  if (cue(k, 5, 'two workers')) {
    const claimed = cue(k, 5, 'only one can claim');
    const claim = reservation(claimed ? ['A', 'B'] : []);
    g.title('Two workers share one approval.');
    g.label('Separate contention test', 54, 122);
    for (const [i, worker] of ['A', 'B'].entries()) {
      const y = 167 + i * 130;
      g.sheet(52, y, 305, 97, 'Worker ' + worker, ['Claim OP9']);
      g.arrow(365, y + 48, 468, y + 48);
      if (claimed)
        g.stamp(
          485,
          y + 27,
          claim.owner === worker ? 'Reservation acquired' : 'Already reserved',
          claim.owner === worker,
          358,
        );
    }
    g.mono('Grant owner    ' + (claim.owner || 'unclaimed'), 56, 445, 27);
    if (cue(k, 6, 'A new operation'))
      g.mono('Changed operation or arguments require a fresh grant.', 56, 494, 19, C.teal);
    return;
  }
  const s = rewindFrame(k);
  g.title(
    s.lookup
      ? 'Read operation nine at the service.'
      : s.reserved
        ? 'Reserve OP9 before dispatch.'
        : s.stopped
          ? 'Rewind to the point of dispatch.'
          : 'Two inboxes after restart',
  );
  const visible = cue(k, 2, 'Rewind');
  g.label('Worker', 53, 116);
  if (visible) g.label('Release service · OP9', 382, 116);
  g.label('Worker inbox', 695, 116);
  s.histories.forEach((r, i) => {
    const y = 164 + i * 161,
      id = i ? 'B' : 'A',
      known = i ? s.committed : s.stopped;
    g.dot(72, y + 43, 23, C.navy);
    g.text(id, 72, y + 52, 26, C.white, { align: 'center', face: 'Serif' });
    if (s.reserved) g.mono('OP9 reserved', 109, y + 53, 18, C.teal);
    else if (i ? s.sent : s.stopped)
      g.mono(i ? 'Sent OP9' : 'Stopped', 109, y + 53, 19, i ? C.ink : C.orange);
    if (visible) {
      g.line(246, y + 44, 342, y + 44, C.line, 3);
      if (i && s.sent) g.arrow(246, y + 44, 341, y + 44);
      if (!i && s.stopped) {
        g.line(287, y + 30, 307, y + 58, C.orange, 4);
        g.line(307, y + 30, 287, y + 58, C.orange, 4);
      }
      g.ticket(354, y - 6, 241, 107, known && r.entries ? C.mint : C.sheet);
      g.label(s.lookup ? 'Lookup · OP9' : 'Remote history', 389, y + 21, 197);
      g.text(
        known
          ? r.entries + ' ' + (r.entries === 1 ? 'commit' : 'commits')
          : i && s.sent
            ? 'Received'
            : '?',
        388,
        y + 68,
        31,
        C.ink,
        { face: 'Serif' },
      );
      if (i && s.lost && !s.recovered) {
        g.line(599, y + 42, 644, y + 42, C.orange, 3, [4, 3]);
        g.mono('lost', 605, y + 21, 14, C.orange);
      }
      if (i && s.recovered) g.arrow(599, y + 42, 667, y + 42);
    }
    g.tray(
      677,
      y - 9,
      235,
      114,
      'Worker ' + id + '  /  ' + r.inbox.length + (r.inbox.length ? ' receipt' : ' receipts'),
      r.inbox[0] || '',
    );
  });
  if (s.lookup) {
    const retry = cue(k, 4, 'Retry only');
    const note = retry
      ? 'Any retry uses OP9 and the same arguments under current policy.'
      : 'A: check retry policy      B: recover the recorded result';
    g.mono(note, 58, 478, 19, C.teal, 846);
  }
}

function disclosure(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    writing = e(1, 'other names a change'),
    checked = e(2, 'host limits');
  g.title('Where would each effect land?');
  g.ticket(50, 127, 301, 120, C.peach);
  g.label('Proposed field', 84, 160);
  g.text('Private notes', 84, 208, 32, C.orange, { face: 'Serif' });
  g.line(354, 184, 581, 184, C.line, 4);
  g.tray(609, 124, 305, 125, 'Recipient · external', checked ? '0 bytes released' : '');
  if (writing) {
    g.ticket(50, 304, 301, 120);
    g.label('Proposed release', 84, 338);
    g.mono('C17   /   25%', 84, 389, 28);
    g.line(354, 367, 581, 367, C.line, 4);
    g.tray(609, 302, 305, 125, 'Production · r3', '0% observed');
  }
  if (checked) {
    const allowed = sinkAllowed('private-notes', true);
    g.stamp(367, 165, allowed ? 'Allowed' : 'Field denied', allowed, 194);
    g.stamp(367, 348, 'No approval', false, 194);
  }
}
function outbound(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  const query = e(2, 'Attach a harmless'),
    frag = e(2, 'A fragment'),
    fixed = e(2, 'construct the fixed'),
    redirect = e(3, 'A redirect');
  const idx = redirect ? 3 : fixed ? 0 : frag ? 2 : query ? 1 : 0,
    url = new URL(links[idx]),
    ok = linkDecision(idx);
  g.title(
    redirect
      ? 'Check the destination again on redirect.'
      : 'Which address does the report policy allow?',
  );
  g.ticket(52, 119, 853, 257);
  g.label(redirect ? 'Redirect destination' : 'Address presented for validation', 94, 155);
  g.mono(url.href, 93, 209, 28, ok ? C.teal : C.orange, 773);
  const labels = ['Scheme', 'Host', 'Port', 'Resource', 'Extra component'];
  const vals = [
    url.protocol.slice(0, -1),
    url.hostname,
    url.port || '443',
    url.pathname,
    url.search || url.hash || 'none',
  ];
  const spans = [100, 259, 77, 144, 180];
  let x = 94;
  labels.forEach((v, i) => {
    g.label(v, x, 277, spans[i] - 7);
    g.mono(
      vals[i],
      x,
      321,
      17,
      !ok && (redirect ? i === 1 : i === 4) ? C.orange : C.ink,
      spans[i] - 12,
    );
    x += spans[i];
  });
  g.stamp(56, 410, ok ? 'Address matches' : 'Address rejected', ok, 295);
  if (redirect) {
    g.label('Connection policy', 394, 422);
    g.text('Check resolved IP, method and fields.', 394, 457, 23, C.ink, { max: 505 });
  } else g.mono('Fixed report  /  R42', 414, 439, 23);
}
function canary(g, k) {
  const e = (b, w, d) => cue(k, b, w, d);
  const normal = e(2, 'ordinary accuracy'),
    present = e(2, 'supplied response'),
    split = e(3, 'split between'),
    join = e(3, 'Slide the pieces together', 0.65),
    answer = e(4, 'It matches');
  g.title(split ? 'Does the marker cross the seam?' : 'A marker in the private notes');
  g.label('Protected marker  /  short illustration', 57, 127);
  g.mono(marker, 56, 198, 48, C.teal);
  if (!normal) {
    for (let n = 0; n < 16; n++) {
      const x = 61 + n * 52;
      g.rect(x, 287, 42, 57, C.mint);
      g.mono('8', x + 13, 325, 21, C.teal);
    }
    if (e(1, 'hundred twenty-eight')) g.mono('16 random bytes × 8 bits = 128 bits', 62, 417, 25);
    return;
  }
  g.line(53, 230, 908, 230);
  g.label('Buffered response', 61, 275);
  if (!split) {
    const parts = present ? [marker] : ['C17 passed.'];
    g.sheet(54, 305, 437, 119, 'Complete response', parts);
    g.stamp(544, 346, scan(parts) ? 'Exact match' : 'No exact match', !scan(parts), 300);
    return;
  }
  const x = 61;
  g.ctx.font = '400 36px "Lesson Mono"';
  const width1 = 15 + g.ctx.measureText(chunks[0]).width;
  const next = x + width1 + 95 * (1 - join);
  g.rect(x, 313, width1 + 1, 73, C.navy);
  g.rect(next, 313, 220, 73, C.navy);
  g.mono(chunks[0], x + 15, 362, 36, C.white);
  g.mono(chunks[1], next, 362, 36, C.white);
  g.tray(635, 295, 268, 123, 'Recipient', '0 bytes');
  if (answer && scan(chunks)) g.stamp(60, 421, 'Hold for review', false, 265);
  else if (!join) g.mono('Exact marker in either chunk?  No.', 61, 437, 19);
  else g.mono('Scan assembled reply…', 61, 437, 19);
}
const manualSession = { scopes: ['manual.read'] };
export const detectorCases = DETECTOR_EXAMPLES.map((document) => {
  if (document.id === 'manual') {
    return { ...document, read: true, allowed: manualSession.scopes.includes('manual.read') };
  }
  return { ...document, read: false, allowed: Boolean(releaseRecord(null, true).permits) };
});
function detector(g, k) {
  const e = (b, w) => cue(k, b, w);
  g.title('The flag and the permission check');
  const count = e(1, 'A security manual') ? 3 : e(1, 'Another report') ? 2 : 1,
    decided = e(3, 'Both write requests');
  g.label('Document', 55, 145);
  g.label('Detector', 314, 145);
  g.label('Host records', 459, 145);
  g.label('Application decision', 680, 145);
  detectorCases.slice(0, count).forEach((r, i) => {
    const y = 180 + i * 94;
    g.line(54, y + 68, 906, y + 68);
    g.text(
      ['Release recommendation', 'Second recommendation', 'Manual quoting the phrase'][i],
      55,
      y + 38,
      22,
      C.ink,
      { face: 'Serif', max: 245 },
    );
    g.mono(r.flagged ? 'Flagged' : 'No alert', 314, y + 37, 20, r.flagged ? C.orange : C.muted);
    if (e(1, r.read ? 'reader has permission' : 'Neither release has a matching grant'))
      g.mono(r.read ? manualSession.scopes.join(', ') : 'No write grant', 459, y + 37, 19, C.ink, 205);
    if (decided && (!r.read || e(3, 'analyze the manual')))
      g.stamp(678, y + 8, r.allowed ? 'Allow analysis' : 'Deny write', r.allowed, 228);
  });
  if (e(2, 'Blocking every flagged') && !decided)
    g.mono('Blocking on the flag would reject the manual.', 55, 491, 18, C.orange);
}
function classifier(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    other = e(2, 'Llama Guard four');
  g.title(other ? 'What did the safety classifier label?' : 'How much of this report fits?');
  if (!other) {
    g.label('Prompt Guard 2 · 2025 model card', 52, 119);
    g.text('22M  /  86M parameters', 53, 176, 29, C.ink, { face: 'Serif' });
    g.label('Token positions   /   16 tokens per mark', 55, 237);
    for (let i = 0; i < 48; i++) {
      const x = 57 + 17.5 * i;
      g.rect(x, 261, 14, 42, i < 32 ? C.teal : C.line);
    }
    g.line(57, 329, 614, 329, C.teal, 3);
    g.mono('512-token window', 57, 363, 22, C.teal);
    if (e(1, 'Segmenting a long input')) g.text('Later segment', 633, 363, 20, C.muted);
    g.mono('Explicit prompt attack?   benign / malicious', 57, 444, 21);
    return;
  }
  g.sheet(51, 135, 352, 187, 'Llama Guard 4', ['Text or image', 'Safety hazard category']);
  g.tray(514, 141, 383, 166, 'Application store', 'Ownership + approval');
  g.line(410, 225, 503, 225, C.line, 3, [5, 5]);
  g.text('A classifier can route a review.', 55, 414, 25, C.ink, { face: 'Serif' });
  if (e(2, 'host still looks up')) g.stamp(516, 384, 'Check current permission', null, 375);
}
function evaluation(g, k) {
  const e = (b, w, d) => cue(k, b, w, d),
    trace = e(3, 'refusal-only');
  if (!trace) {
    g.title('Write the expected outcome first.');
    g.label('Supplied case', 53, 139);
    g.label('Expected policy', 370, 139);
    g.label('Fixture result', 656, 139);
    CASES.forEach((row, i) => {
      const result = RESULTS[i],
        yy = 187 + i * 66;
      g.line(54, yy + 16, 902, yy + 16);
      g.text(row.id, 54, yy, 21, C.ink, { face: 'Serif' });
      g.mono(row.intended, 368, yy, 16);
      if (e(2, 'Measure protected'))
        g.mono(
          result.rejected
            ? 'Summary blocked'
            : result.stage === 'production'
              ? 'Write recorded'
              : row.output === 'Summary'
                ? 'Summary returned'
                : 'Effect blocked',
          654,
          yy,
          16,
          result.rejected ? C.orange : C.teal,
        );
    });
    return;
  }
  const count = e(3, 'then the refusal')
    ? 3
    : e(3, 'then a receipt')
      ? 2
      : e(3, 'First comes')
        ? 1
        : 0;
  g.title(count === 3 ? 'The refusal came last.' : 'Read the trace in time order.');
  g.line(91, 249, 856, 249, C.line, 5);
  REFUSAL_EVENTS.slice(0, count).forEach((row, i) => {
    const x = 90 + i * 365;
    g.dot(x, 249, 13, i === 1 ? C.orange : C.teal);
    g.text(['Attempted tool call', 'Write receipt', 'Refusal'][i], x - 27, 306, 27, C.ink, { face: 'Serif' });
    g.mono(
      [
        row.credential,
        row.authorized === false ? 'Unauthorized' : 'Authorized',
        'Reply to reader',
      ][i],
      x - 27,
      345,
      16,
    );
  });
  if (count > 1) {
    const receipt = REFUSAL_EVENTS[1];
    g.tray(232, 387, 497, 102, REFUSAL_EVENTS[0].destination,
      receipt.candidate + '   /   ' + receipt.traffic + '%   /   r' + receipt.revision);
  }
}
export const serviceScenes = [
  (g, k) => traffic(g, k, false),
  bindings,
  rewind,
  disclosure,
  outbound,
  canary,
  detector,
  classifier,
  evaluation,
];
