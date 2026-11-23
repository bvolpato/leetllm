import {
  C,
  base,
  box,
  cents,
  circle,
  cue,
  fmt,
  line,
  paper,
  small,
  smooth,
  spoken,
  stamp,
  strip,
  txt,
} from './art.mjs';
import {
  allowed,
  backupCircuits,
  early,
  healthyAfterSkips,
  jitters,
  late,
  passage,
  policy,
  relay,
  retry,
  retryWindow,
  sampleD,
  tight,
  validate,
  waitExample,
  wrongD,
} from './examples.mjs';

function rail(g, x, y, w, n = 15) {
  line(g, x, y, x + w, y, C.muted, 2);
  for (let i = 0; i <= n; i++)
    line(g, x + (w * i) / n, y - 8, x + (w * i) / n, y + (i % 5 === 0 ? 17 : 8), C.muted, 2);
}
const origin = 181,
  scale = 0.51;
const tx = (ms) => origin + ms * scale;

function span(g, start, end, y, label, style) {
  const x = tx(start),
    w = tx(end) - x;
  if (w <= 0) return;
  if (style === 'proposal') {
    g.save();
    g.setLineDash([14, 8]);
    box(g, x, y, w, 75, null, 5, C.rust, 4);
    g.restore();
  } else box(g, x, y, w, 75, style === 'primary' ? C.blue : C.ok, 4);
  g.font = '400 34px "Lesson Mono"';
  if (w > g.measureText(label).width + 34)
    txt(g, label, x + 16, y + 51, 34, style === 'proposal' ? C.rust : C.paper, 'mono');
}

function funding(g, k) {
  base(g);
  const charged = cue(k, 5, 'Lower the whole request cap');
  const capMove = smooth(cue(k, 5, 'D needs half a cent', 0.7));
  const showReserve = cue(k, 5, 'Does that fit');
  const showRemaining = cue(k, 6, 'Skip D');
  const reserveMove = cue(k, 6, 'Skip D', 1.4);
  const verdictSaid = cue(k, 6, 'An estimated price');
  const denied = reserveMove === 1 && verdictSaid && !tight.admitted;
  const cap = policy.requestCap + (tight.cap - policy.requestCap) * capMove;
  const charge = early.run.spans[0].charge;
  const reserve = policy.reservation;
  const sx = (v) => 233 + v * 0.143;
  const origin = sx(0);
  const chargeEnd = sx(charge);
  const reserveWidth = sx(reserve) - origin;
  const reserveEnd = chargeEnd + reserveWidth;
  const wall = sx(cap);
  const trackY = 523;
  const blockHeight = 87;
  strip(g, 101, 119, 1718, 793);
  small(g, 'R900   /   EARLY TIMEOUT AT ' + fmt(early.start) + ' ms', 170, 211);
  txt(g, 'Can the desk reserve D?', 168, 314, 74, C.ink, 'serif');
  const capLabel = capMove === 0 || capMove === 1 ? 'Request cap  ' + cents(cap, 2) : 'Request cap';
  txt(g, capLabel, wall, 425, 36, C.rust, 'mono', 'right');
  rail(g, origin, 643, sx(policy.requestCap) - origin, 10);
  if (charged) {
    box(g, origin, trackY, chargeEnd - origin, blockHeight, C.blue, 3);
    txt(g, 'C billed  ' + cents(charge, 2), origin + 22, trackY + 57, 40, C.paper, 'mono');
  }
  if (showRemaining) {
    line(g, chargeEnd, 498, wall, 498, C.muted, 3);
    line(g, chargeEnd, 488, chargeEnd, 508, C.muted, 3);
    txt(
      g,
      cents(tight.moneyLeft, 2) + ' left',
      (chargeEnd + wall) / 2,
      478,
      40,
      C.ink,
      'mono',
      'center',
    );
  }
  if (showReserve) {
    // Align the reserve with the billed amount before moving it onto the spend track.
    const align = smooth(Math.min(1, reserveMove * 2));
    const lift = smooth(Math.max(0, reserveMove * 2 - 1));
    const x = sx(charge * align);
    const y = trackY + 213 * (1 - lift);
    g.save();
    g.setLineDash([13, 8]);
    box(g, x, y, reserveWidth, blockHeight, C.light, 4, C.blue, 4);
    g.restore();
    if (denied) box(g, wall, y + 3, reserveEnd - wall - 3, blockHeight - 6, '#f5cdb3', 2);
    txt(g, 'D reserve  ' + cents(reserve, 2), x + 22, y + 57, 40, C.ink, 'mono');
  }
  line(g, wall, 443, wall, 685, C.rust, 5);
  if (denied) {
    line(g, wall, 684, reserveEnd, 684, C.rust, 3);
    line(g, reserveEnd, 674, reserveEnd, 694, C.rust, 3);
    txt(
      g,
      cents(reserve - tight.moneyLeft, 2) + ' over',
      (wall + reserveEnd) / 2,
      730,
      39,
      C.rust,
      'mono',
      'center',
    );
    stamp(g, 'SKIP D', origin, 809, C.rust, 38);
  } else if (showReserve && !showRemaining) {
    txt(g, 'Enough room after C?', 1022, 793, 43, C.ink, 'serif');
  }
}

export function deadlines(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 5) {
    funding(g, k);
    return;
  }
  base(g, true);
  small(g, 'GENERATION   /   R900', 122, 143);
  txt(g, 'One clock for both calls', 117, 245, 80, C.ink, 'serif');
  const limit = policy.deadline;
  const wall = tx(limit);
  const slow = b >= 2;
  small(g, fmt(limit) + ' ms deadline', wall - 245, 347, C.rust, 32);
  line(g, wall, 363, wall, 878, C.rust, 5);
  const cMotion = smooth(cue(k, 0, 'C times out', 1.4));
  const dMotion = smooth(cue(k, 0, 'D runs on the same clock', 1.8));
  const endSaid = spoken(k, 0);
  const cEnd = Math.round(early.start * cMotion),
    dTime = Math.round(early.duration * dMotion);
  small(g, 'EARLY TIMEOUT', origin, 407);
  rail(g, origin, 556, scale * 3000);
  span(g, 0, cEnd, 452, 'C   ' + fmt(cEnd) + ' ms', 'primary');
  span(g, early.start, early.start + dTime, 452, 'D   ' + fmt(dTime) + ' ms', 'local');
  if (endSaid)
    txt(g, fmt(early.run.elapsed) + ' ms', tx(early.run.elapsed), 611, 33, C.ok, 'mono', 'center');
  if (cue(k, 1, 'Keep this completed run')) {
    line(g, tx(early.finish) + 7, 429, wall - 7, 429, C.muted, 3);
    txt(
      g,
      fmt(early.run.remaining) + ' ms left',
      0.5 * (tx(early.finish) + wall),
      410,
      27,
      C.muted,
      'mono',
      'center',
    );
  }
  if (!slow) return;
  if (b === 4) {
    small(g, 'REPLAY   /   PROVIDER RETRY DELAY', origin, 701);
    rail(g, origin, 847, scale * 3000);
    span(g, 0, waitExample.start, 739, 'C   ' + fmt(waitExample.start) + ' ms', 'primary');
    if (cue(k, 4, 'Only fifteen hundred sixty')) {
      span(
        g,
        waitExample.start,
        waitExample.start + waitExample.delay,
        739,
        'Required wait   ' + fmt(waitExample.delay) + ' ms',
        'proposal',
      );
    }
    if (cue(k, 4, 'Escalate now'))
      small(
        g,
        fmt(waitExample.remaining) + ' ms left    /    stop at ' + fmt(waitExample.start) + ' ms',
        origin,
        950,
        C.ink,
        33,
      );
    return;
  }
  const slowMove = smooth(cue(k, 2, 'This time C takes', 1.65));
  const slowEnd = Math.round(late.start * slowMove);
  small(g, 'LATE TIMEOUT', origin, 701);
  rail(g, origin, 847, scale * 3000);
  span(g, 0, slowEnd, 739, 'C   ' + fmt(slowEnd) + ' ms', 'primary');
  if (cue(k, 2, 'Look at the space left') && !cue(k, 3, 'Lay its eleven hundred')) {
    txt(
      g,
      fmt(late.available) + ' ms left',
      0.5 * (tx(late.start) + wall),
      787,
      34,
      C.ink,
      'mono',
      'center',
    );
  }
  if (cue(k, 3, 'Lay its eleven hundred')) {
    span(g, late.start, late.finish, 739, 'D   ' + fmt(late.duration) + ' ms', 'proposal');
  }
  if (cue(k, 3, 'The outline is work')) {
    txt(g, fmt(late.finish) + ' ms proposed', tx(late.finish), 911, 31, C.rust, 'mono', 'right');
    small(
      g,
      'Stopped at ' + fmt(late.run.elapsed) + ' ms   /   ' + late.run.spans.length + ' call',
      origin,
      951,
      C.ink,
      33,
    );
    txt(
      g,
      fmt(late.finish - limit) + ' ms over',
      0.5 * (wall + tx(late.finish)),
      713,
      27,
      C.rust,
      'mono',
      'center',
    );
  }
}

const words = ['Your', 'access', 'request'];
export function streamState(k) {
  const b = k.beat.beatIndex;
  if (b !== 1) return { words: [], failure: null, eligible: false };
  const phrases = ['Your access request', 'access request', 'request'];
  const seen = words.filter((_, i) => cue(k, 1, phrases[i]));
  const failure = cue(k, 1, 'Those three words') ? 'drop' : null;
  return { words: seen, failure, eligible: retry(failure, seen.length > 0) };
}
function terminal(g, status) {
  box(g, 135, 134, 1650, 750, '#082d28', 34);
  box(g, 125, 115, 1650, 750, '#d2d3b9', 32, C.ink, 5);
  box(g, 164, 154, 1572, 647, '#103c34', 18, '#608275', 6);
  for (const x of [149, 1748])
    for (const y of [141, 839]) {
      circle(g, x, y, 6, C.muted);
      line(g, x - 3, y + 3, x + 3, y - 3, C.pale, 2);
    }
  small(g, 'ACCESS DESK   /   USER WINDOW', 220, 238, C.mint, 30);
  line(g, 218, 270, 1668, 270, '#658e7d', 2);
  for (let j = 0; j < 9; j++) box(g, 1424 + j * 25, 826, 15, 8, C.muted, 3);
  circle(g, 194, 828, 8, status ? C.rust : C.ok);
}
export function publication(g, k) {
  base(g);
  const b = k.beat.beatIndex;
  if (b < 2) {
    const stream = streamState(k);
    terminal(g, stream.failure);
    if (b === 0) {
      const failures = [
        ['A timeout', 'timeout', 'Timeout before output'],
        ['A temporary throttle', 'throttle', 'Temporary throttle'],
        ['An authentication failure', 'auth', 'Authentication denied'],
        ['an exhausted quota', 'quota', 'Account quota exhausted'],
        ['or a policy refusal', 'refusal', 'Policy refusal'],
      ];
      const failure = failures.filter(([key]) => cue(k, 0, key)).at(-1);
      txt(g, 'Waiting for a reply', 218, 454, 74, C.light, 'serif');
      small(g, '0 words delivered', 222, 533, C.mint, 34);
      if (failure) {
        const eligible = retry(failure[1], false);
        txt(g, failure[2], 223, 683, 46, C.white);
        small(
          g,
          eligible ? 'Check fallback eligibility' : 'Stop this route',
          223,
          746,
          eligible ? C.gold : C.coral,
          33,
        );
      }
    } else {
      const visible = stream.words.join(' ');
      txt(g, visible, 219, 485, 91, C.paper, 'serif');
      g.font = '400 91px "Lesson Serif"';
      if (!stream.failure) box(g, 224 + g.measureText(visible).width, 410, 6, 86, C.mint, 2);
      small(
        g,
        stream.words.length + (stream.words.length === 1 ? ' word' : ' words') + ' delivered',
        222,
        562,
        C.mint,
        31,
      );
      if (stream.failure) {
        line(g, 216, 614, 1672, 614, '#658e7d', 2);
        txt(g, 'Connection interrupted', 223, 690, 45, C.coral);
        if (cue(k, 1, 'offer an explicit retry')) {
          txt(g, 'Request a new reply', 222, 760, 33, C.gold);
          txt(g, 'Ask the desk for help', 710, 760, 33, C.gold);
        }
      }
    }
    return;
  }
  const fresh = b === 3,
    reply = fresh ? sampleD : wrongD;
  strip(g, 111, 147, 982, 722);
  small(g, 'D   /   BUFFERED REPLY', 177, 235);
  txt(g, 'Access review', 173, 339, 77, C.ink, 'serif');
  small(g, reply.schema, 177, 406);
  line(g, 178, 443, 1020, 443, C.rule);
  txt(g, reply.answer, 179, 526, 48, C.ink, 'serif');
  txt(g, 'Evidence ID', 181, 634, 37);
  box(g, 493, 570, 255, 94, '#f6e4bd', 5);
  txt(g, reply.citations[0], 620, 637, 56, C.ink, 'mono', 'center');
  txt(g, 'Review', 181, 749, 37);
  txt(g, reply.review, 498, 749, 39, C.ink, 'mono');
  paper(g, 1174, 279, 648, 426, C.light);
  small(g, 'AUTHORIZED FOR R900', 1217, 355);
  txt(g, fresh ? 'Passage ' + passage.id : 'Passage index', 1217, 450, 58, C.ink, 'serif');
  line(g, 1219, 492, 1766, 492, C.rule);
  if (fresh) {
    passage.text.forEach((s, i) => txt(g, s, 1219, 573 + i * 60, 40, C.ink, 'serif'));
    if (cue(k, 3, 'The authorized human still decides'))
      stamp(g, 'QUEUED   /   AWAITING HUMAN DECISION', 173, 952, C.mint, 34);
    else if (cue(k, 3, 'A matching ID by itself'))
      stamp(g, 'PASSAGE SUPPORTS REVIEW', 173, 952, C.mint, 34);
  } else {
    txt(g, allowed.join(', '), 1219, 600, 74, C.ink, 'mono');
    if (cue(k, 2, 'The desk still has to explain') && !validate(reply).accepted)
      stamp(g, 'WITHHELD   /   UNKNOWN ID', 173, 952, C.coral, 37);
  }
}

function contact(g, x, y, state, who) {
  box(g, x, y, 620, 297, C.paper, 16, C.ink, 3);
  for (const dx of [24, 596]) for (const dy of [23, 275]) circle(g, x + dx, y + dy, 5, C.muted);
  const open = state !== 'closed';
  line(g, x + 62, y + 153, x + 191, y + 153, C.ink, 9);
  line(g, x + 432, y + 153, x + 560, y + 153, C.ink, 9);
  circle(g, x + 191, y + 153, 18, C.gold, C.ink, 4);
  circle(g, x + 432, y + 153, 18, C.gold, C.ink, 4);
  line(g, x + 191, y + 153, x + 430, y + (open ? 68 : 153), open ? C.rust : C.ok, 14);
  if (who) {
    box(g, x + 268, y + 173, 113, 49, C.blue, 7);
    txt(g, who, x + 324, y + 209, 32, C.paper, 'mono', 'center');
  }
  txt(
    g,
    state === 'half open' ? 'Half open' : state === 'open' ? 'Open' : 'Closed',
    x + 311,
    y + 256,
    37,
    C.ink,
    'sans',
    'center',
    600,
  );
}
export function breaker(g, k) {
  base(g, true);
  const b = k.beat.beatIndex;
  if (b === 4) {
    small(g, 'RETRY BACKOFF   /   FIRST WINDOW', 132, 152);
    txt(g, 'Three clients draw a delay', 126, 264, 78, C.ink, 'serif');
    const lo = 438,
      w = 1110,
      end = retryWindow(0);
    small(g, '0 ms', lo, 380);
    txt(g, end + ' ms ceiling', lo + w, 380, 31, C.muted, 'mono', 'right');
    line(g, lo + w, 399, lo + w, 844, C.rust, 4);
    jitters.forEach((ms, i) => {
      const y = 483 + i * 142;
      txt(g, 'Client ' + (i + 1), 141, y + 12, 37);
      rail(g, lo, y, w, 10);
      if (cue(k, 4, 'draws its own delay')) {
        const x = lo + (w * ms) / end;
        circle(g, x, y, 14, C.blue);
        txt(g, ms + ' ms', x, y - 28, 37, C.ink, 'mono', 'center');
      }
    });
    if (cue(k, 4, 'up to a configured cap'))
      small(
        g,
        'Next retry window: 0–' + retryWindow(1) + ' ms     Cap: ' + fmt(retryWindow(4)) + ' ms',
        135,
        928,
        C.muted,
        32,
      );
    return;
  }
  if (b === 1) {
    small(g, 'NEW REQUEST   /   SAME R900 REQUIREMENTS', 131, 151);
    txt(g, 'Which circuit permits a call?', 125, 266, 76, C.ink, 'serif');
    backupCircuits.forEach(({ lane, state, allowed: permitted }, i) => {
      const x = 116 + i * 579,
        y = 439;
      paper(g, x, y, 527, 325, permitted ? '#d8e9d2' : C.paper);
      small(g, lane.name, x + 40, y + 58, C.muted, 30);
      txt(g, lane.id, x + 39, y + 184, 95, C.ink, 'serif');
      txt(
        g,
        state === 'closed' ? 'Closed' : 'Open',
        x + 42,
        y + 262,
        46,
        permitted ? C.ok : C.rust,
      );
    });
    if (spoken(k, 1)) stamp(g, 'CALL ' + healthyAfterSkips.id, 1266, 866, C.ok, 39);
    return;
  }
  const one = cue(k, 0, 'Count one timeout'),
    two = cue(k, 0, 'Now its circuit breaker');
  const probe = cue(k, 2, 'takes the single probe permit'),
    p2 = cue(k, 2, 'P two arrives');
  const skip = cue(k, 3, 'One probe is already'),
    success = cue(k, 3, 'the circuit closes');
  const stage = success ? 5 : skip ? 4 : probe ? 3 : two ? 2 : one ? 1 : 0;
  const r = relay(stage);
  small(g, 'LANE C   /   CIRCUIT BREAKER', 127, 143);
  txt(
    g,
    stage < 3 ? 'When can another call reach C?' : 'One permit for the recovery probe',
    123,
    252,
    74,
    C.ink,
    'serif',
  );
  contact(g, 119, 392, r.state, r.holder);
  const x = 843,
    span = 848,
    px = (t) => x + (t * span) / 13;
  small(g, 'ELAPSED SECONDS', x, 395);
  rail(g, x, 563, span, 13);
  if (stage >= 2) box(g, px(1), 475, px(11) - px(1), 58, '#dda883', 4);
  if (stage >= 2) txt(g, '10 s cooldown', px(6), 517, 34, C.ink, 'mono', 'center');
  [0, 1, 11].forEach((t) => txt(g, t + ' s', px(t), 623, 30, C.ink, 'mono', 'center'));
  if (stage >= 1) circle(g, px(0), 563, 12, C.rust);
  if (stage >= 2) circle(g, px(1), 563, 12, C.rust);
  if (probe) circle(g, px(11), 563, 14, C.blue);
  if (!probe)
    txt(
      g,
      stage >= 2
        ? 'Ordinary calls skip C'
        : stage === 1
          ? '1 timeout recorded'
          : 'Normal calls permitted',
      145,
      802,
      48,
      C.ink,
      'serif',
    );
  else {
    const s = success
      ? 'P1 succeeded   /   normal calls resume'
      : skip
        ? 'P2 skips C'
        : p2
          ? 'P2 arrives. Can it call C?'
          : 'P1 holds the probe permit';
    txt(g, s, 142, 797, 48, C.ink, 'serif');
    if (cue(k, 3, 'Across workers')) {
      const expired = relay(6);
      box(g, 134, 852, 1629, 109, '#f4dfc4', 8, C.rust, 2);
      small(g, 'Alternate outcome', 166, 917, C.rust, 30);
      txt(g, 'P1 expires at 13.5 s', 574, 921, 37);
      txt(g, expired.state + ' until ' + expired.until + ' s', 1194, 921, 36, C.rust, 'mono');
    }
  }
}
