import {
  C,
  box,
  clockCue,
  dot,
  egret,
  initials,
  kingfisher,
  label,
  line,
  marsh,
  page,
  portrait,
  ruledPage,
  sky,
  stamp,
  text,
} from './art.mjs';
import {
  appealRecords,
  bits,
  birdReceipt,
  correction,
  currentReceipt,
  currentResult,
  differences,
  distance,
  egretReceipt,
  exactMatch,
  fieldNotes,
  fusion,
  isErrorCandidate,
  lateReceipt,
  newBird,
  oldBird,
  oldResult,
  profile,
  quotation,
  readHandout,
  relatedAt,
  replayBird,
  replayResult,
  scopeRuns,
  skyClub,
} from './decisions.mjs';

export function birds(c, k) {
  const b = k.beat.beatIndex;
  const edit = clockCue(k, 0, "kingfisher's approval arrives");
  const fresh = clockCue(k, 2, 'the egret gets its own review'),
    allow = clockCue(k, 2, 'Its approval names');
  const committed = clockCue(k, 2, 'In one transaction'),
    delivered = clockCue(k, 2, 'On delivery');
  const receipt = fresh ? egretReceipt : birdReceipt;
  const current = committed ? newBird.item : edit ? oldBird.item : profile;
  page(c, 'Reedbank Birders  /  profile moderation', 'Which bird did the reviewer approve?');
  label(c, 'Current upload', 197, 313);
  label(c, 'Review copy', 1190, 313);
  portrait(c, current.revision === 7 ? kingfisher : egret, 333, 483, 132);
  portrait(c, fresh ? egret : kingfisher, 1321, 483, 132);
  text(c, 'Revision ' + current.revision, 524, 464, 47, C.ink, 'serif');
  text(
    c,
    current.state === 'PUBLISHED' ? 'Recorded' : 'Pending',
    524,
    533,
    38,
    committed ? C.pine : C.brass,
  );
  text(c, 'Revision ' + receipt.revision, 1484, 464, 47, C.ink, 'serif');
  const approved = fresh ? allow : edit;
  if (approved) stamp(c, receipt.action, 1484, 500, C.pine, C.white, 32);
  if (b >= 1 && !fresh) text(c, '8 ≠ 7', 955, 499, 54, C.red, 'mono', 400, 'center');
  if (fresh && allow) text(c, '8 = 8', 955, 499, 54, C.pine, 'mono', 400, 'center');
  if (committed)
    text(
      c,
      'Decision ' +
        egretReceipt.id +
        '   /   publication event for revision ' +
        newBird.item.outbox[0].revision,
      106,
      681,
      34,
      C.pine,
    );
  else if (b >= 1 && !fresh)
    text(c, 'Stale approval   /   no publication event', 106, 681, 34, C.red);
  c.save();
  c.beginPath();
  c.rect(0, 726, 1920, 354);
  c.clip();
  c.drawImage(marsh, 0, 423, 1920, 1080);
  c.restore();
  if (delivered)
    portrait(c, newBird.item.outbox[0].revision === 8 ? egret : kingfisher, 215, 862, 102);
  else initials(c, 215, 862, 102);
  text(c, 'Public profile', 365, 829, 31, C.white);
  text(c, 'Reedbank Birders', 360, 922, 73, C.white, 'serif');
  if (b === 3 && clockCue(k, 3, 'is a duplicate')) {
    box(c, 1240, 773, 568, 172, '#263d48', 14);
    text(
      c,
      'Retry ' + egretReceipt.id + '   /   ' + replayBird.status.toLowerCase(),
      1281,
      844,
      32,
      C.white,
    );
    text(c, replayBird.item.outbox.length + ' event recorded', 1281, 906, 40, C.gold, 'serif');
  }
}
function regionalScope(c, k) {
  const replay = k.beat.id === 'c08-cache-scope-replay';
  const approved = clockCue(k, 2, 'The approved record');
  const unknown = clockCue(k, 3, 'an unresolved scope');
  const hold = clockCue(k, 3, 'Hold the upload');
  page(c, 'Regional policy  /  community post', 'Which policy applies to this upload?');
  ruledPage(c, 105, 270, 1700, 220);
  label(c, quotation.tenant + '  /  quoted in class  /  revision 1', 160, 341);
  text(c, '“' + quotation.text + '”', 158, 438, 55, C.ink, 'serif');
  line(c, 995, 310, 995, 451);
  label(c, 'Compute location   US server', 1051, 346);
  text(c, 'India account market  /  offered in the EU', 1051, 424, 34, C.ink);
  scopeRuns.forEach(({ id, state }, i) => {
    if (i === 1 && !replay) return;
    const x = 105 + i * 886;
    const received = i === 0 ? approved : unknown;
    box(c, x, 552, 817, 380, C.card, 14);
    label(c, i === 0 ? 'First run  /  authenticated reply' : 'Same upload  /  alternate reply', x + 47, 624);
    text(c, received ? id : 'Awaiting scope', x + 47, 700, 39, C.ink, 'mono');
    line(c, x + 47, 733, x + 763, 733);
    if (!received) return;
    if (state) {
      text(c, state.scope, x + 47, 800, 44, C.pine, 'serif');
      text(c, 'Policy   ' + state.policy + '     Appeals   ' + state.appeals, x + 47, 877, 34, C.ink);
    } else if (hold) {
      stamp(c, 'Hold for scope review', x + 47, 769, C.brass);
      text(c, 'Policy and appeal route await resolution', x + 47, 884, 32, C.muted);
    }
  });
}
export function cache(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    const quoted = clockCue(k, 0, 'A teacher quotes'),
      miss = clockCue(k, 1, 'The exact key misses');
    page(c, 'Decision cache', 'Can these words reuse a saved verdict?');
    ruledPage(c, 106, 316, 1696, 481);
    label(c, 'Exact bytes', 174, 407);
    text(c, '“' + quotation.text + '”', 170, 511, 76, C.ink, 'serif');
    line(c, 173, 569, 1720, 569);
    text(c, 'Saved use', 175, 642, 32, C.muted);
    text(c, 'Account claim', 175, 723, 48, C.ink);
    text(c, 'Current use', 903, 642, 32, C.muted);
    text(c, quoted ? quotation.context : 'Account claim', 903, 723, 48, quoted ? C.brass : C.ink);
    if (miss && !exactMatch) stamp(c, 'Cache miss  /  evaluate this use', 108, 854, C.brass);
    return;
  }
  if (b === 2 || b === 3) return regionalScope(c, k);
  const counted = clockCue(k, 5, 'Three bits differ'),
    lo = clockCue(k, 5, 'Two is too narrow'),
    hi = clockCue(k, 5, 'At three');
  page(c, 'Two field notes  /  same tenant and scope  /  low eight bits', 'How many bits changed with this edit?');
  const dx = 129,
    x = 724;
  fieldNotes.forEach((note, j) => {
    const y = 340 + 144 * j;
    label(c, j ? 'Edited note' : 'Saved note', 110, y + 28);
    text(c, note.text, 110, y + 93, 42, C.ink, 'serif');
    [...bits[j]].forEach((value, i) => {
      const changed = counted && differences[i];
      box(c, x + i * dx, y, 103, 110, changed ? C.gold : C.card, 10);
      text(c, value, x + i * dx + 52, y + 79, 54, C.ink, 'mono', 500, 'center');
    });
  });
  if (counted) text(c, 'Hamming distance    ' + distance, 111, 721, 48, C.ink, 'serif');
  text(c, 'Cutoff 2', 109, 843, 39, C.muted);
  if (lo) stamp(c, relatedAt(2) ? 'Related' : 'Miss', 347, 788, C.brass);
  text(c, 'Cutoff 3', 840, 843, 39, C.muted);
  if (hi) stamp(c, relatedAt(3) ? 'Send related case to review' : 'Miss', 1073, 788, C.pine);
}
function handout(c, x, y, w, h, visible) {
  box(c, x, y, w, h, visible ? C.card : '#445759', 12);
  if (visible) {
    box(c, x + 18, y + 16, 9, h - 32, C.pine);
    text(c, 'Field class', x + 46, y + 96, 49, C.pine, 'serif');
    text(c, 'Guide to egrets', x + 46, y + 170, 44, C.ink, 'serif');
    portrait(c, egret, x + w - 111, y + h / 2, 78);
  } else {
    line(c, x + w / 2 - 43, y + 67, x + w / 2 + 43, y + 67, C.mint, 6);
    text(c, 'Handout hidden', x + w / 2, y + 165, 46, C.card, 'serif', 400, 'center');
  }
}
function appealResultAfter(k, index, phrase, captionStart = false) {
  if (k.beat.beatIndex !== index) return k.beat.beatIndex > index;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

function readPath(c, from, to, y, color, progress = 1) {
  line(c, from, y, from + (to - from) * progress, y, color, 5);
  if (progress === 1) {
    line(c, to - 14, y - 11, to, y, color, 5);
    line(c, to - 14, y + 11, to, y, color, 5);
  }
}

export function appeals(c, k) {
  const b = k.beat.beatIndex;
  if (b === 2) {
    page(c, 'Appeal records', 'Which block belongs in the v7 error set?');
    const guideReviewed = clockCue(k, 2, 'corrected a wrongful block');
    const noticeReviewed = clockCue(k, 2, 'records a rule change');
    const selectCandidate = clockCue(k, 2, 'The handout is the candidate');
    appealRecords.forEach((record, i) => {
      const { prior, fix, subject } = record;
      const originalError = fix.cause === 'Original error';
      const x = 101 + 889 * i;
      ruledPage(c, x, 305, 816, 555);
      text(c, subject, x + 66, 385, 48, C.ink, 'serif');
      text(c, `${prior.id}    ${prior.policy}    ${prior.action}`, x + 66, 482, 45, C.ink, 'mono');
      line(c, x + 66, 513, x + 746, 513);
      text(c, `${fix.id}    ${fix.policy}    ${fix.action}`, x + 66, 583, 45, C.pine, 'mono');
      if (originalError ? guideReviewed : noticeReviewed) {
        const reason = originalError ? 'Wrongful block corrected' : 'Rule change';
        stamp(c, fix.policy + '  /  ' + reason, x + 66, 643, originalError ? C.pine : C.sea, C.white, 33);
      }
      if (selectCandidate && isErrorCandidate(record, 'v7'))
        text(c, 'Candidate for the v7 error set', x + 66, 792, 38, C.pine, 'serif');
    });
    return;
  }
  const blocked = appealResultAfter(k, 0, 'Decision D eight blocked the handout');
  const appended = appealResultAfter(
    k, 0, 'Correction C eight restores the same revision under the same policy',
  );
  const firstReload = clockCue(k, 0, 'The teacher reloads');
  const cacheHit = appealResultAfter(k, 1, 'The cache still serves D eight', 'D eight');
  const evicted = appealResultAfter(k, 1, 'Invalidate the saved block');
  let retry = 0;
  if (b === 1) {
    const reload = 'reload the same revision';
    const { start } = k.wordCue(reload);
    const { end } = k.wordCue('The handout reappears');
    retry = k.reveal(reload, end - start, { captionStart: false });
  }
  const restored = retry === 1;
  const prior = readHandout(true);
  const served = readHandout(!restored);
  const historyX = 108;
  const historyWidth = 446;
  const cacheX = 706;
  const cacheWidth = 371;
  const viewX = 1218;
  const topY = 382;
  const correctionY = 587;
  const recordHeight = 118;
  const cacheRouteY = topY + recordHeight / 2;
  const historyRouteY = correctionY + recordHeight / 2;
  const viewEdge = viewX - 16;

  page(
    c,
    'Classroom appeal  /  handout revision ' + prior.rev,
    'Which decision does the teacher’s reload read?',
  );
  label(c, 'Decision history', historyX, 324);
  label(c, 'Decision cache', cacheX, 324);
  label(c, 'Teacher’s view', viewX, 324);

  if (blocked) {
    box(c, historyX, topY, historyWidth, recordHeight, C.card, 11);
    text(c, prior.id, historyX + 36, topY + 77, 48, C.red, 'mono');
    text(c, prior.action + ' / ' + prior.policy, historyX + 161, topY + 77, 43, C.ink, 'serif');
  }
  if (appended) {
    line(c, historyX + 62, topY + recordHeight, historyX + 62, correctionY, C.line, 4);
    box(c, historyX, correctionY, historyWidth, recordHeight, '#dcebdc', 11);
    text(c, correction.id, historyX + 36, correctionY + 77, 48, C.pine, 'mono');
    text(
      c, correction.action + ' / ' + correction.policy, historyX + 161, correctionY + 77, 43,
      C.ink, 'serif',
    );
    text(c, 'Corrects ' + correction.parent, historyX, 774, 38, C.muted);
  }

  if (blocked) {
    box(c, cacheX, topY, cacheWidth, recordHeight, cacheHit && !evicted ? C.rose : C.card, 11);
    const cacheLabel = evicted ? 'Cleared' : cacheHit ? prior.id + ' / ' + prior.action : '?';
    text(
      c, cacheLabel, cacheX + cacheWidth / 2, topY + 77, 44,
      evicted || !cacheHit ? C.muted : C.red, 'serif', 400, 'center',
    );
  }
  handout(c, viewX, topY, 584, 323, !blocked || served.action === 'Allow');

  if (firstReload && !cacheHit) label(c, 'Reloaded', viewX, 774);
  if (cacheHit && !evicted)
    readPath(c, cacheX + cacheWidth + 16, viewEdge, cacheRouteY, C.red);
  if (retry > 0) {
    readPath(c, historyX + historyWidth + 16, viewEdge, historyRouteY, C.pine, retry);
    text(c, 'Cache miss', cacheX + cacheWidth / 2, 614, 34, C.muted, 'sans', 500, 'center');
  }
  if (restored)
    text(c, 'Reload reads ' + served.id + ' / ' + served.action, viewX, 774, 39, C.pine);
}
export function finalPractice(c, k) {
  const b = k.beat.beatIndex;
  const moved = clockCue(k, 1, 'Slide the two contributions', 0.95),
    resolved = clockCue(k, 1, 'They add to');
  const old = clockCue(k, 2, 'unseen old decision is stale'),
    fresh = clockCue(k, 2, 'approves revision three'),
    committed = clockCue(k, 2, 'Commit D twenty-four'),
    ack = clockCue(k, 3, 'One'),
    delivered = clockCue(k, 3, 'visitor can now see');
  page(
    c,
    'Fresh case  /  Night Sky Club',
    b < 2 ? 'Which route does this upload take?' : 'How many events survive the retry?',
  );
  const x = 107;
  label(c, 'Profile upload  /  revision ' + skyClub.revision, x, 326);
  sky(c, x, 368, 582, 282);
  text(c, 'Night Sky Club', x, 732, 63, C.ink, 'serif');
  text(
    c,
    delivered
      ? 'Public profile'
      : committed
        ? 'Publication recorded'
        : fresh
          ? 'Approval awaiting commit'
          : resolved
            ? 'Pending ownership review'
            : 'Awaiting decision',
    x,
    808,
    34,
    delivered ? C.pine : C.brass,
  );
  if (b < 2) {
    label(c, 'Assessed inputs  /  no signature match', 803, 326);
    const caption = 0.45 * skyClub.caption,
      img = 0.55 * skyClub.image,
      rx = 804,
      ry = 617,
      w = 966;
    text(c, 'Caption    ' + skyClub.caption.toFixed(2) + ' × 0.45', 803, 419, 42, C.sea, 'mono');
    text(c, 'Image      ' + skyClub.image.toFixed(2) + ' × 0.55', 803, 501, 42, C.pine, 'mono');
    line(c, rx, ry + 26, rx + w, ry + 26, C.line, 3);
    box(c, rx, ry, w * caption, 41, C.sea);
    box(c, rx + w * caption * moved, ry + 76 * (1 - moved), w * img, 41, C.pine);
    const limit = rx + w * 0.65;
    line(c, limit, ry - 27, limit, ry + 57, C.brass, 5);
    text(c, 'Review ≥ 0.65', limit, ry - 45, 32, C.brass, 'sans', 600, 'center');
    if (resolved) {
      text(
        c,
        caption.toFixed(3) + ' + ' + img.toFixed(3) + ' = ' + fusion.score.toFixed(3),
        803,
        807,
        47,
        C.ink,
        'mono',
      );
      stamp(c, fusion.action === 'REVIEW' ? 'Hold for review' : fusion.action, 803, 865, C.brass);
    }
    return;
  }
  label(c, 'Decision log  /  ' + skyClub.scope + '  /  ' + skyClub.policy, 818, 326);
  const events = [
    {
      id: lateReceipt.id,
      rev: lateReceipt.revision,
      seen: clockCue(k, 2, 'An approval arrives'),
      out: old ? oldResult.status : 'Received',
    },
    {
      id: currentReceipt.id,
      rev: currentReceipt.revision,
      seen: fresh,
      out: committed ? currentResult.status : 'Approved',
    },
    {
      id: currentReceipt.id,
      rev: currentReceipt.revision,
      seen: clockCue(k, 2, 'worker retries'),
      out: ack ? replayResult.status : 'Retry',
    },
  ];
  events.forEach((r, i) => {
    if (!r.seen) return;
    const y = 431 + i * 130;
    line(c, 817, y + 44, 1800, y + 44);
    text(c, r.id, 817, y, 46, C.ink, 'mono');
    text(c, 'rev ' + r.rev, 1048, y, 40, C.muted, 'mono');
    text(c, r.out, 1390, y, 40, i === 0 ? C.brass : C.pine, 'sans', 600);
  });
  if (ack) stamp(c, replayResult.item.outbox.length + ' publication event', 816, 817, C.pine);
  if (delivered) {
    box(c, 107, 367, 582, 283, C.card, 12);
    sky(c, 135, 388, 526, 220);
    text(c, 'Visitor view', 143, 638, 27, C.pine, 'sans', 600);
  }
}
