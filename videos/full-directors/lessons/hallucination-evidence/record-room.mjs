import { P, lerp, stepText } from './press.mjs';
import {
  v1,
  service,
  event,
  eventTime,
  eta,
  shortTime,
  draftClaims,
  conflicts,
  fieldNames,
  checkedIncidentClaim,
  renderIncident,
  stale,
  missing,
  finished,
  checkedService,
  draftAddition,
  points,
  selective,
  score,
} from './edition-data.mjs';

function roll(d, x, y, w, h) {
  d.rect(x - 13, y + 4, w + 26, h + 12, P.ink, 13);
  d.paper(x, y, w, h);
  for (let k = 33; k < h - 15; k += 43) {
    d.dot(x + 17, y + k, 5, P.dim);
    d.dot(x + w - 17, y + k, 5, P.dim);
  }
  d.line(x + 36, y, x + 36, y + h, P.rule, 1, true);
  d.line(x + w - 36, y, x + w - 36, y + h, P.rule, 1, true);
}
function timeTag(d, x, y, value, caption, opacity = 1) {
  d.alpha(opacity, () => {
    d.rect(x + 4, y + 7, 355, 112, '#122c3d3b', 4);
    d.rect(x, y, 355, 112, '#ffe0cb', 4);
    d.path(
      [
        [x + 26, y + 112],
        [x + 58, y + 112],
        [x + 42, y + 135],
      ],
      '#ffe0cb',
    );
    d.label(caption, x + 19, y + 29, P.red, 17);
    d.txt(value, x + 18, y + 88, 49, P.red, 'Mono');
  });
}
export function opening(d) {
  d.stage('', 'dark');
  const enter = d.cue(1, 'Move the cursor', 1.1);
  const show = d.cue(2, 'records the completed failover');
  const seat = d.cue(3, 'Eight fourteen', 0.8);
  const lift = d.cue(4, 'Lift the proposed recovery time', 1.1);
  d.label('INCIDENT DESK   /   embedding-api', 76, 76, P.mint, 22);
  roll(d, 82, 302, 1276, 398);
  d.label('INC-48291     /     MAY 27, 10:00 UTC     /     v1', 151, 356);
  d.line(151, 384, 1280, 384, P.rule);
  d.field('FAILOVER COMPLETED   ·   MAY 26', shortTime(v1.last_event_at), 165, 457, 474, {
    size: 65,
    color: P.ink,
    face: 'Mono',
  });
  d.field('RECOVERY ESTIMATE', v1.recovery_eta, 805, 457, 447);
  d.alpha(show, () => d.txt('Recorded status   ' + v1.status, 165, 643, 32, P.dim, 'Serif'));
  const a = lerp(169, 165, enter),
    c = lerp(830, 806, enter);
  timeTag(
    d,
    a,
    lerp(170, 116, seat),
    shortTime(eventTime.value),
    'DRAFT   /   EVENT TIME',
    1 - seat,
  );
  timeTag(d, c, lerp(163, 75, lift), eta.value, 'DRAFT   /   ESTIMATE', 1 - lift);
  const x = lerp(141, 155, seat),
    y = lerp(395, 498, enter);
  d.line(139, 391, 139, 543, P.rule, 2);
  d.path(
    [
      [x - 26, y - 12],
      [x, y],
      [x - 26, y + 12],
    ],
    seat ? P.teal : P.ochre,
  );
  d.alpha(seat, () => {
    d.line(165, 545, 485, 545, P.teal, 6);
    d.label('VERIFIED EVENT TIME', 165, 593, P.teal);
  });
  d.alpha(d.cue(4, 'Drop the recovery promise'), () =>
    d.label('NO ENTRY IN v1', 805, 596, P.ochre),
  );
}
function pairLabels(d, left, right) {
  d.label(left, 95, 191);
  d.label(right, 825, 191);
  d.line(95, 209, 1345, 209, P.rule);
}
export function atomic(d) {
  d.stage('INC-48291   /   COPY EDIT');
  d.headline('Take the update apart.');
  pairLabels(d, 'DRAFT DETAIL', 'RUNBOOK FIELD   /   v1');
  const split = d.cue(1, 'four things', 0.9),
    matched = d.cue(2, 'Line up the service', 0.9);
  const invert = d.on(2, 'Replace completed with failed') && !d.on(2, 'Put completed back');
  const focus = d.on(3, 'follow the fourth line');
  draftClaims.forEach((claim, i) => {
    const y = 245 + i * 111;
    d.paper(88 + split * i * 3, y, 575, 94, i === 3 && focus ? '#ffdabe' : P.white);
    d.label(fieldNames[claim.field], 113, y + 26, P.dim, 16);
    const value = i === 1 && invert ? 'database failover failed' : claim.value;
    d.txt(value, 112, y + 68, 35, i === 3 || (invert && i === 1) ? P.red : P.ink, 'Serif', {
      w: 530,
    });
    d.txt(v1[claim.field] ?? '', 830, y + 62, 35, P.teal, 'Serif', { w: 485 });
    d.line(826, y + 80, 1332, y + 80, P.rule, 2, !v1[claim.field]);
    if (i < 3 && matched) {
      const col = i === 1 && invert ? P.red : P.teal;
      d.line(684, y + 48, lerp(684, 796, matched), y + 48, col, 3);
      if (matched === 1) d.txt(i === 1 && invert ? '×' : '=', 736, y + 35, 30, col, 'Mono');
    }
    if (i === 3 && focus) d.label('FIELD ABSENT', 830, y + 59, P.ochre);
  });
}
export function verdicts(d) {
  d.stage('CLAIM VERIFIER   /   INCIDENT COPY');
  const conflict = d.on(2, 'a different draft');
  const action = d.b === 3;
  d.headline(
    action ? 'Two different calls to the incident owner.' : 'What can the record establish?',
  );
  if (d.b === 1) {
    pairLabels(d, 'CLAIM ON THE PROOF', 'FIELD IN THE ADMITTED RECORD');
    [service, event, eventTime].forEach((c, i) => {
      const y = 301 + i * 128;
      d.txt(c.value, 94, y, 39, P.ink, 'Serif', { w: 470 });
      d.line(591, y - 10, 777, y - 10, P.teal, 3);
      d.txt(v1[c.field], 825, y, 39, P.teal, 'Serif');
    });
    d.alpha(d.cue(1, 'admitted record'), () => d.result('Supported', 826, 665, true));
    return;
  }
  const rows = conflict ? [eta, conflicts[3]] : [eta];
  rows.forEach((c, i) => {
    const y = 202 + 238 * i;
    d.punchStrip(80, y, 1280, 214, P.white);
    const draft = i === 1 && !action ? 'ALTERNATE DRAFT' : 'DRAFT';
    d.label(draft + '   /   ' + fieldNames[c.field], 150, y + 38);
    d.txt(c.value, 150, y + 105, 53, P.red, 'Serif');
    d.label('ADMITTED v1', 620, y + 38);
    d.txt(v1[c.field] ?? 'No entry', 620, y + 103, 47, P.ink, 'Serif');
    const absent = checkedIncidentClaim(c) === 'not_supported';
    const verdict = absent ? 'Unsupported' : 'Contradicted';
    const visible =
      action || (absent ? d.on(2, 'estimate is unsupported') : d.on(2, 'Those statuses conflict'));
    if (visible) {
      const comparison = absent ? 'Field missing in v1' : 'Values differ for the same field';
      d.txt(comparison, 620, y + 149, 24, absent ? P.ochre : P.red, 'Sans');
      d.result(verdict, 1020, y + 91, false, { w: 290 });
      d.label(absent ? 'EXTRINSIC' : 'INTRINSIC', 1022, y + 147, P.red);
    }
    if (action)
      d.txt(
        absent
          ? 'Ask the owner for a current estimate.'
          : 'Resolve the conflict before publishing.',
        150,
        y + 177,
        32,
        P.teal,
        'Serif',
      );
  });
}
export function timeScope(d) {
  d.stage('FRESHNESS   /   HYPOTHETICAL INCIDENT', 'dark');
  const lucky = d.on(1, 'Now consider a separate possibility') && d.b === 1;
  d.txt(
    lucky ? 'Suppose the forecast comes true.' : 'What time does this sentence describe?',
    74,
    161,
    57,
    P.white,
    'Serif',
  );
  const later = d.on(1, 'recovers at eleven'),
    noon = d.on(1, 'At noon');
  const x1 = 310,
    x2 = 782,
    x3 = 1230;
  const ticks = lucky ? ['At issue', 'Later', '14:30 UTC'] : ['10:00', '11:00', '12:00'];
  [x1, x2, x3].forEach((x, i) => {
    d.label(ticks[i], x - 32, 240, P.gold);
    d.line(x, 258, x, 620, '#45616c', 1, true);
  });
  d.label('SNAPSHOT', 65, 343, P.mint);
  d.line(x1, 332, x3, 332, P.mint, 3);
  d.dot(x1, 332, 10, P.mint);
  d.txt(lucky ? 'No recorded estimate' : v1.status, x1, 398, 42, P.white, 'Serif');
  d.label('WORLD', 68, 504, P.gold);
  d.line(x1, 493, later ? (lucky ? x3 : x2) : x1, 493, P.gold, 4);
  if (later && (!lucky || d.on(1, 'recovery really does happen'))) {
    const x = lucky ? x3 : x2;
    d.dot(x, 493, 12, P.gold);
    d.txt(lucky ? 'Recovered by 14:30' : 'Service recovers', x, 561, 38, P.white, 'Serif', {
      align: 'center',
    });
  }
  if (!lucky && noon) {
    d.cursor(x3, 328, P.gold);
    d.txt('Update due', x3 - 22, 303, 28, P.white, 'Sans', { align: 'right' });
  }
  d.txt(
    lucky
      ? 'At issue, the runbook still had a blank estimate.'
      : d.b === 2
        ? 'Admit a fresh, authorized record for a current update.'
        : 'May 27   ·   UTC',
    74,
    701,
    32,
    P.mint,
    'Serif',
  );
}
export function scorecards(d, showBoth, metrics = false) {
  const ys = showBoth ? [244, 470] : [250];
  ys.forEach((y, i) => {
    const set = i ? selective : points,
      s = score(set);
    d.punchStrip(80, y, 1280, 190);
    d.label(i ? 'SELECTIVE POLICY' : 'ALWAYS ANSWER', 139, y + 36);
    set.forEach((ans, j) => {
      const x = 150 + 79 * j;
      const col = ans === 'right' ? P.teal : ans === 'wrong' ? P.red : P.ochre;
      d.rect(x, y + 56, 65, 56, ans === 'pass' ? P.sheet : col, 5);
      d.txt(
        ans === 'pass' ? '·' : ans === 'right' ? '✓' : '×',
        x + 33,
        y + 97,
        37,
        ans === 'pass' ? col : P.white,
        'Sans',
        { align: 'center' },
      );
      d.label(String(j + 1).padStart(2, '0'), x + 20, y + 143, P.dim, 16);
    });
    d.txt(s.points + ' / 10', 1005, y + 103, 58, P.ink, 'Serif');
    d.label(
      metrics ? s.errors + ' wrong / ' + s.answered + ' sent' : 'BENCHMARK POINTS',
      1004,
      y + 148,
      P.dim,
      18,
    );
  });
}
export function incentives(d) {
  d.stage('EVALUATION   /   TEN PRACTICE QUESTIONS');
  if (d.b === 1) {
    d.headline('Finish the familiar sentence.');
    d.printHead(133, 274, 1180);
    d.paper(160, 300, 1126, 264);
    d.label('INCIDENT DRAFT', 206, 356);
    d.txt('Full recovery is expected by', 205, 439, 53, P.ink, 'Serif', { w: 674 });
    d.alpha(d.cue(1, 'plausible way'), () => d.txt(eta.value, 906, 439, 53, P.red, 'Serif'));
    d.txt('Source field', 205, 513, 25, P.dim);
    d.line(390, 516, 1190, 516, P.rule, 2, true);
    return;
  }
  d.headline('A correct guess earns a point.');
  if (d.b === 2) {
    d.label('ONE POINT   correct', 112, 285);
    d.label('ZERO   wrong or pass', 112, 362);
    d.printHead(110, 478, 1150);
    return;
  }
  const both = d.on(3, 'Withholding three answers');
  scorecards(d, both);
  if (d.b === 4)
    d.txt(
      'One useful answer and two errors sit in the last three positions.',
      94,
      721,
      31,
      P.teal,
      'Serif',
    );
}
export function binding(d) {
  d.stage('SOURCE INDEX   /   REQUEST-SCOPED LOOKUP', 'dark');
  d.txt('Follow the citation.', 75, 158, 65, P.white, 'Serif');
  const items = [
    ['SOURCE', eta.sourceId],
    ['SNAPSHOT', 'May 27, 10:00 UTC'],
    ['REQUESTED FIELD', eta.field],
  ];
  items.forEach(([key, val], i) => {
    const x = 68 + i * 449;
    d.paper(x, 242 + i * 20, 411, 220, i === 2 ? P.sheet : P.paper);
    d.label(key, x + 26, 291 + i * 20);
    d.txt(val, x + 26, 371 + i * 20, 39, P.ink, 'Serif', { w: 362 });
    if (i === 2 && d.b >= 2) {
      d.line(x + 27, 439 + i * 20, x + 380, 439 + i * 20, P.ochre, 2, true);
      d.label('No entry', x + 27, 423 + i * 20, P.ochre);
    }
    if (i < 2) {
      d.line(x + 411, 389 + i * 20, x + 447, 389 + i * 20, P.gold, 4);
    }
  });
  const trace = d.cue(1, 'First resolve', 1.3);
  d.line(93, 528, 93 + 1218 * trace, 528, P.mint, 4);
  if (d.b >= 2) {
    d.label('DRAFT   ' + eta.value, 77, 622, P.rose);
    d.txt(
      d.b === 2
        ? 'v1 has no recovery estimate.'
        : 'Admission also checks freshness and authorization.',
      77,
      696,
      47,
      P.white,
      'Serif',
    );
  }
}
export function strict(d) {
  d.stage('CHECKING DESK   /   TYPED CLAIM');
  if (d.b <= 3) {
    d.headline('Read the claim in lookup order.');
    const status = d.b === 3 && !d.on(3, 'try finished');
    const c = d.b === 1 ? stale : d.b === 2 ? missing : status ? conflicts[3] : finished;
    const old = d.b === 1,
      unknown = d.b === 2;
    const stops = old ? 1 : unknown ? 0 : 2;
    const col = [c.sourceId, old ? 'previous version' : 'v1', c.value];
    const expected = ['incident-INC-48291', 'v1', v1[c.field]];
    const verdictAt = old
      ? d.on(1, 'An old version')
      : unknown
        ? d.on(2, 'An unknown source')
        : status
          ? d.on(3, 'cannot both')
          : d.on(3, 'Exact equality');
    ['Source identity', 'Snapshot', 'Field value'].forEach((name, i) => {
      const x = 77 + 435 * i;
      d.label(name.toUpperCase(), x, 247);
      d.paper(x, 282, 405, 176, i <= stops ? P.white : P.sheet);
      d.txt(
        i <= stops ? col[i] : 'Unchecked',
        x + 21,
        351,
        33,
        i <= stops ? P.red : P.dim,
        'Mono',
        { w: 364 },
      );
      if (i <= stops) d.txt(expected[i], x + 21, 414, 32, P.teal, 'Serif', { w: 364 });
    });
    if (verdictAt)
      d.result(checkedIncidentClaim(c).replaceAll('_', ' '), 78, 558, false, { w: 403 });
    if (d.b === 3 && d.on(3, 'duplicate claim IDs'))
      d.txt(
        'Duplicate field or ID: reject input.     Empty list: withhold.',
        83,
        668,
        33,
        P.ink,
        'Serif',
      );
    return;
  }
  d.headline('Which words passed the check?');
  const print = d.cue(5, 'Print the service', 0.9);
  const printing = print > 0;
  d.punchStrip(82, 193, 1266, 205);
  d.label(printing ? 'VALIDATED FIELD   /   service' : 'TYPED SERVICE VALUE', 148, 243);
  d.txt(checkedService.value, 148, 331, 55, printing ? P.teal : P.ink, 'Mono');
  d.label(printing ? 'EXTRA DRAFT WORDS' : 'DRAFT EXCERPT', 814, 243, printing ? P.red : P.dim);
  d.txt(draftAddition, 814, 331, 54, printing ? P.red : P.ink, 'Serif');
  d.printHead(84, 448, 1256);
  d.paper(117, 473, 1190, 158 + 55 * print, P.white);
  d.label('STATUS PAGE   /   PUBLIC COPY', 152, 521);
  d.ctx.save();
  d.ctx.beginPath();
  d.ctx.rect(151, 552, 1138 * print, 104);
  d.ctx.clip();
  d.txt(renderIncident([checkedService]).text, 152, 617, 59, P.ink, 'Serif');
  d.ctx.restore();
}
export function routing(d) {
  d.stage('STATUS PAGE   /   OUTGOING COPY', 'dark');
  const conflict = d.on(3, 'Replace the fourth claim'),
    claims = conflict ? conflicts : draftClaims;
  const response = renderIncident(claims);
  const show = conflict ? d.cue(4, 'Withhold the whole update') : d.cue(2, 'Copy the service');
  d.label('DRAFT  /  COMPARE WITH RUNBOOK v1', 76, 176, P.mint);
  claims.forEach((c, i) => {
    const y = 225 + i * 119;
    d.label(fieldNames[c.field], 78, y, P.mint);
    d.txt(c.value, 78, y + 45, 37, i === 3 ? P.rose : P.white, 'Serif', { w: 585 });
    d.label('v1   ' + (v1[c.field] ?? 'field absent'), 79, y + 81, P.mint, 18);
  });
  d.printHead(704, 162, 650);
  d.paper(723, 187, 611, 496, P.white);
  d.label('PUBLIC UPDATE   /   INC-48291', 758, 243);
  d.line(758, 267, 1294, 267, P.rule);
  d.alpha(show, () => {
    if (conflict) {
      stepText(d, response.text, 758, 344, 533, { size: 39, face: 'Serif' });
    } else {
      let y = 330;
      for (const c of claims.slice(0, 3)) {
        y = stepText(d, renderIncident([c]).text, 757, y, 540, { size: 31, face: 'Serif' }) + 51;
      }
      stepText(
        d,
        'The admitted record provides no support for that recovery estimate.',
        757,
        y,
        532,
        { size: 26, color: P.dim },
      );
    }
    d.result(conflict ? 'Withhold' : 'Shorten', 750, 650, !conflict, { w: 225 });
  });
  if (!show) d.label('Awaiting verification', 757, 324, P.dim);
}
