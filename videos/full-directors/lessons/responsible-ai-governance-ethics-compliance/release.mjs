import {
  col as C,
  rect,
  line,
  circle,
  text,
  mono,
  title,
  field,
  paper,
  folder,
  header,
  stamp,
  mark,
  signature,
  binding,
  screen,
  graphPaper,
  at,
  lines,
} from './studio.mjs';
import {
  original,
  instructionLabel,
  proposal,
  scoreOnlyProposal,
  requiredReviews,
  oversight,
  largeApproval,
  packageState,
  evidenceNames,
  transfer,
  appealReplayFixture,
} from './evidence.mjs';

function signatures(g, k) {
  folder(g, 94, 65, 765, 407, 'MONDAY  /  C17');
  mono(g, 'MODEL PROMOTION REQUEST', 133, 108, 14);
  title(g, 'Roll out C17', 130, 165, 52);
  text(g, '10% of production traffic', 132, 203, 23);
  text(g, instructionLabel(original.proposal), 477, 203, 21);
  field(g, 'POLICY', 'G7', 650, 110, 150);
  line(g, 132, 228, 815, 228, C.ink, 1.5);
  const roles = requiredReviews(original.proposal);
  roles.forEach((role, i) => {
    const y = 300 + i * 88;
    title(g, role, 135, y, 26);
    line(g, 330, y + 5, 795, y + 5, C.dull);
    if (original.receipts[role])
      signature(g, 355, y - 5, 187, at(k, 0, 'The release reviewer', 1.4), 0, true);
    mono(g, 'Signature for 10%', 330, y + 25, 12);
  });
  if (k.beat.beatIndex === 1) stamp(g, 'HELD  /  missing security review', 454, 442);
}
function executor(g, k) {
  const revealed = at(k, 1, 'The trace stays flat');
  paper(g, 63, 51, 832, 434);
  binding(g, 73, 55, 419);
  mono(g, 'EXECUTOR RECORD     C17   /   G7', 102, 95);
  title(g, 'Traffic assigned to C17', 101, 147, 38);
  graphPaper(g, 147, 191, 650, 161, 29, '#c9c7ab');
  mono(g, '10%', 105, 199);
  mono(g, '0%', 114, 349);
  line(g, 147, 348, 797, 348, C.dull, 1);
  const trace = at(k, 1, 'Now open the executor', 1.05);
  line(g, 147, 346, 147 + 650 * trace, 346, C.teal, 4);
  mono(g, 'request received', 147, 377);
  mono(g, 'gate held', 797, 377, 14, C.dull, 'right');
  if (revealed)
    text(g, original.effects.length + ' traffic changes', 102, 432, 28, { color: C.teal });
  if (at(k, 1, 'The owner can challenge')) mono(g, 'Appeal reference    AP-17', 536, 431, 17);
}
function framework(g, k) {
  const b = k.beat.beatIndex;
  folder(g, 58, 62, 840, 431, 'C17  /  RELEASE OWNER');
  if (b === 4) {
    mono(g, 'ISO/IEC 42001:2023', 92, 105);
    title(g, 'One improvement cycle', 90, 151, 36);
    const xy = [
      [262, 227],
      [650, 227],
      [650, 368],
      [262, 368],
    ];
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ].forEach(([a, z]) => line(g, ...xy[a], ...xy[z], C.rule, 3));
    const labels = [
      ['Plan', 'Two signatures'],
      ['Do', 'Run gate G7'],
      ['Check', 'Replay denials'],
      ['Act', 'Repair a missed receipt'],
    ];
    xy.forEach(([x, y], i) => {
      rect(g, x - 111, y - 32, 222, 72, C.paper);
      title(g, labels[i][0], x - 88, y, 28, C.blue);
      text(g, labels[i][1], x - 88, y + 26, 17);
    });
    return;
  }
  mono(g, 'RELEASE FILE   /   GOVERN', 94, 106);
  title(g, 'Who can accept the remaining risk?', 91, 155, 37);
  text(g, 'The release owner signs for the scope of the decision.', 93, 193, 20);
  const items = [
    ['Map', 'People using C17', 'Workflow inventory'],
    ['Measure', 'Eligible and unauthorized requests', 'Case IDs and observed effects'],
    ['Manage', 'Hold the rollout or fix the gate', 'Action and appeal record'],
  ];
  items.forEach(([verb, what, evidence], i) => {
    const y = 252 + i * 75;
    colorBar(g, 91, y - 19);
    title(g, verb, 111, y + 6, 24, C.teal);
    text(g, what, 260, y + 5, 21);
    mono(g, evidence, 260, y + 29, 14);
    line(g, 92, y + 42, 851, y + 42);
  });
}
function colorBar(g, x, y) {
  rect(g, x, y, 4, 39, C.teal);
}
export function opening(g, k) {
  if (k.beat.beatIndex >= 2) return framework(g, k);
  if (at(k, 1, 'Now open the executor')) return executor(g, k);
  signatures(g, k);
}
function roleLine(g, x, y, role, receipt, share, w) {
  text(g, role, x, y + 2, 20);
  line(g, x + 121, y + 7, x + w, y + 7, C.dull);
  if (!receipt) {
    mono(g, 'awaiting receipt', x + 133, y + 1, 14);
    return;
  }
  if (receipt.decision === 'DENIED') {
    stamp(g, 'DENIED', x + 143, y - 2, C.rust);
    return;
  }
  signature(g, x + 135, y, 74, 1, role === 'Security' ? 1 : 0);
  mono(g, share + '%', x + w, y - 2, 15, C.blue, 'right');
}
function compareNotes(g, k) {
  header(g, 'G7  /  BOTH EVALUATION NOTES COME FROM AN UNTRUSTED SOURCE', 'Who signs at ' + proposal.target + '%?');
  const common = at(k, 4, 'Both need release and exception');
  const security = at(k, 4, 'Only the first');
  for (const [i, file] of [proposal, scoreOnlyProposal].entries()) {
    const x = 54 + i * 442;
    paper(g, x, 143, 407, 327);
    mono(g, file.candidate + '   /   ' + file.policy + '   /   ' + file.target + '%', x + 24, 182, 15);
    title(g, file.untrusted ? 'Scores and an instruction' : 'Scores only', x + 23, 237, 30);
    text(g, instructionLabel(file), x + 24, 275, 19, { color: C.blue });
    line(g, x + 24, 302, x + 381, 302);
    mono(g, 'REQUIRED REVIEWS', x + 24, 335, 14);
    if (common) {
      const roles = requiredReviews(file);
      text(g, roles.filter(role => role !== 'Security').join(' and '), x + 24, 377, 26);
      if (security && roles.includes('Security'))
        text(g, 'Security', x + 24, 420, 26, { color: C.rust });
    }
  }
}
export function approval(g, k) {
  const b = k.beat.beatIndex,
    s = largeApproval(k);
  if (b === 4 && at(k, 4, 'Now compare two')) return compareNotes(g, k);
  if (b === 5) {
    header(g, 'HUMAN OVERSIGHT', 'Who has authority to act?');
    const controls = [
      ['Before the effect', 'Human in the loop', 'Release approval required'],
      ['During bounded action', 'Human on the loop', 'Tested intervention available'],
      ['Over purpose and limits', 'Human in command', 'Set who may decide'],
    ];
    controls.forEach(([when, role, action], i) => {
      const y = 150 + 105 * i;
      paper(g, 65, y, 830, 78);
      text(g, when, 88, y + 35, 19);
      line(g, 327, y + 12, 327, y + 65);
      title(g, role, 349, y + 35, 25, C.teal);
      mono(g, action, 350, y + 61, 15);
    });
    return;
  }
  folder(g, 43, 65, 561, 414, 'C17  /  PRODUCTION');
  mono(g, 'POLICY G7     ARTIFACT M1     EVALUATION E7', 69, 100, 13);
  title(g, 'Requested traffic', 68, 150, 34);
  text(g, s.file.target + '%', 69, 224, 66, { face: 'Serif', color: C.blue });
  text(g, instructionLabel(s.file), 225, 211, 21);
  s.required.forEach((role, i) =>
    roleLine(g, 72, 280 + 64 * i, role, s.receipts[role], s.file.target, 488),
  );
  screen(g, 628, 97, 292, 353);
  mono(g, 'APPLICATION GATE', 651, 133, 14, C.mist);
  const adjudicated = b >= 1 && (b !== 2 || s.eligible);
  const label = s.denied
    ? 'Required denial'
    : s.eligible
      ? 'All roles signed'
      : b === 4
        ? 'Security missing'
        : 'Receipts missing';
  title(g, adjudicated ? label : 'Compare receipts', 650, 183, 26, C.light, 243);
  if (s.denied) lines(g, ['Hold request.', 'Independent appeal'], 652, 235, 31, 21, C.gold, 245);
  if (s.eligible)
    lines(g, ['Executor may recheck', 'this exact proposal.'], 652, 234, 31, 19, C.mist, 244);
  if (b >= 3) {
    line(g, 650, 313, 896, 313, '#57726c');
    mono(g, 'EXECUTOR RECORD', 651, 347, 14, C.mist);
    text(g, '0 traffic changes', 651, 393, 27, { color: C.light });
  }
}

export function packageFile(g, k) {
  const s = packageState(k),
    b = k.beat.beatIndex;
  folder(g, 40, 70, 371, 405, 'C17  /  HOST COPY');
  mono(g, 'DEPLOYMENT MANIFEST', 67, 108, 14);
  title(g, 'Candidate C17', 66, 152, 33);
  const entries = [
    ['Model', s.current.model],
    ['Prompt', s.current.prompt],
    ['Policy', s.current.policy],
    ['Tools', s.current.tools.join(', ')],
    ['Evaluation', s.current.evaluation],
    ['Environment', s.current.environment],
  ];
  entries.forEach(([key, val], i) => {
    const y = 193 + 32 * i;
    if (key === 'Policy' && s.changed) rect(g, 60, y - 22, 331, 27, C.pale);
    mono(g, key, 69, y, 14);
    text(g, val, 209, y, 19, { color: key === 'Policy' && s.changed ? C.rust : C.ink });
  });
  line(g, 66, 373, 384, 373);
  mono(g, 'Manifest digest · prefix', 67, 402, 13);
  mono(g, s.expected.slice(0, 16), 67, 435, 21, s.changed ? C.rust : C.blue);
  paper(g, 435, 43, 481, 455);
  binding(g, 444, 49, 442);
  mono(g, 'REVIEWER COPY    C17  /  POLICY G7', 466, 83, 14);
  title(g, 'Accepted evidence', 464, 122, 30);
  evidenceNames.forEach((name, i) => {
    const y = 154 + i * 29,
      review = s.reviews[name];
    text(g, name, 467, y, 17, { color: review ? C.ink : C.rust });
    if (s.compare && !s.matching.includes(name)) mark(g, 764, y - 5, false, 6);
    mono(
      g,
      review ? review.manifest.slice(0, 8) : 'missing',
      885,
      y,
      15,
      review ? C.blue : C.rust,
      'right',
    );
  });
  line(g, 465, 373, 889, 373);
  mono(g, 'Open findings    unsafe ' + s.unsafe + '     access ' + s.access, 465, 397, 14);
  mono(g, 'Required legal signoff on file', 465, 419, 14);
  if (!s.changed && s.ready && at(k, 2, 'This package is eligible'))
    stamp(g, s.matching.length + ' MATCH  /  eligible for approval', 468, 466, C.teal);
  else if (s.compare) stamp(g, s.matching.length + ' MATCH  /  collect G8 reviews', 468, 466);
  else if (!s.changed && !s.ready && b > 0) mono(g, 'Review open', 467, 462, 18, C.rust);
  else if (s.changed) mono(g, 'Compare with current manifest', 467, 462, 17, C.blue);
}

function appealBook(g, heading, rows, rightTitle, rightRows, result) {
  paper(g, 48, 60, 860, 426);
  rect(g, 467, 60, 2, 426, C.rule);
  rect(g, 470, 60, 6, 426, '#e5d7b7');
  mono(g, 'ORIGINAL DECISION   /   MONDAY', 78, 102, 13);
  title(g, heading, 76, 149, 30);
  rows.forEach(([a, v], i) => field(g, a, v, 79, 198 + 72 * i, 353));
  mono(g, 'INDEPENDENT REVIEW   /   AP-17', 497, 102, 13);
  title(g, rightTitle, 494, 150, 30, C.ink, 377);
  rightRows.forEach((v, i) => text(g, v, 498, 206 + 39 * i, 19, { max: 367 }));
  if (result) stamp(g, result, 501, 429, C.rust, 355);
}
export function appeal(g, k) {
  const b = k.beat.beatIndex,
    correct = b === 3 && at(k, 3, 'record a factual correction');
  const rows = [
    ['Proposal', 'C17  /  10%  /  M1'],
    ['Policy and evidence', 'G7  /  E7'],
    ['Gate record', 'Held · security receipt missing'],
    ['Executor record', '0 traffic changes'],
  ];
  let heading = 'Which policy applies?',
    items = ['Monday  ·  G7', 'Tuesday  ·  revised policy'],
    result;
  if (b === 1) {
    heading = 'Open the appeal file';
    items = ['Proposal and configuration', 'Policy versions and receipts', 'Signed evidence and effect record'];
  } else if (b === 2) {
    if (at(k, 2, 'policy then in force')) {
      heading = 'Replay Monday under G7';
      items = ['Use the policy then in force.', 'Release signed for 10%.'];
      if (at(k, 2, 'security review really was absent')) items.push('No security receipt at decision time.');
    }
    if (at(k, 2, 'uphold that hold'))
      result = appealReplayFixture().replayDecision.startsWith('UPHOLD')
        ? 'Uphold · explain missing receipt'
        : '';
  } else if (b === 3) {
    heading = 'A different original file';
    items = ['Release signed for 10%.', 'Security had also signed for 10%.'];
    if (at(k, 3, 'gate failed to read it')) items.push('Gate missed that valid receipt.');
    if (correct)
      result = appealReplayFixture({ receiptActuallyPresent: true }).replayDecision.startsWith(
        'CORRECT',
      )
        ? 'Append correction · assign gate defect'
        : '';
  } else if (b === 4) {
    heading = 'Tuesday’s policy';
    items = ['New policy, new basis.', 'Keep Monday’s decision under G7.'];
  } else if (b === 5) {
    heading = 'A receipt arrives today';
    items = [
      'Verify issuer and authority.',
      'Check age and revocation.',
      'Bind it to the current proposal.',
      'Recheck at the executor.',
    ];
  } else if (b === 6) {
    heading = 'Trace the effect';
    items = ['Approved for executor'];
    if (at(k, 6, 'a lost response')) items.push('Action sent · response lost', 'Outcome unknown');
    if (at(k, 6, 'reconciliation before retry')) items.push('Reconcile before retrying.');
  } else if (b === 7 || b === 8) {
    heading = 'A reviewer can intervene';
    items = [
      'Time to examine the evidence',
      'Expertise to interpret the output',
      'Authority to disagree or halt',
      'A tested path to correction',
    ];
  } else if (b >= 9) {
    heading = 'Article 86 scope';
    items = [
      'Annex III decision, except point 2',
      'Legal or similarly significant effect',
      'Adverse to health, safety or rights',
      'AI role and main decision elements',
      'Check exceptions and other EU rights.',
    ];
  }
  appealBook(g, 'C17 at ten percent', rows, heading, items, result);
}

function transferRecord(g, s, k) {
  folder(g, 96, 60, 768, 416, 'OWNER COPY  /  AP-29');
  mono(g, 'INDEPENDENT APPEAL DECISION', 128, 109, 15);
  title(g, 'Hold upheld for C29', 126, 164, 44);
  line(g, 128, 186, 831, 186, C.ink);
  field(g, 'SIGNED REQUEST', s.original.target + '%   ·   Release and Security', 131, 219, 327);
  field(
    g,
    'REQUEST ON APPEAL',
    s.current.target + '%   ·   Policy ' + s.current.policy,
    490,
    219,
    326,
  );
  mono(g, 'REASON', 130, 305, 13);
  text(g, 'The two receipts cover the earlier target.', 129, 338, 24);
  text(g, instructionLabel(s.current) + ' · ' + s.current.target + '% requested', 129, 378, 23);
  text(g, 'Fresh reviews     ' + s.required.join('   /   '), 129, 411, 22, { color: C.rust });
  line(g, 128, 426, 830, 426);
  if (at(k, 4, 'zero traffic changes'))
    mono(g, 'Executor record     ' + s.effects.length + ' traffic changes', 129, 455, 16);
}
function afterClause(k, beat, phrase, captionStart) {
  if (k.beat.beatIndex !== beat) return k.beat.beatIndex > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart }) === 1;
}

export function closing(g, k) {
  const s = transfer(k),
    b = k.beat.beatIndex;
  if (b >= 5 || at(k, 4, 'upholds the hold')) return transferRecord(g, s, k);
  folder(g, 39, 69, 457, 403, 'SIGNED ORIGINAL  /  C29');
  mono(g, 'C29   /   M29   /   G7   /   E9', 64, 110, 15);
  title(g, 'Traffic scope', 64, 160, 33);
  title(g, s.original.target + '%', 63, 241, 77, C.blue);
  roleLine(g, 66, 298, 'Release', s.receipts.Release, s.original.target, 392);
  roleLine(g, 66, 364, 'Security', s.receipts.Security, s.original.target, 392);
  mono(g, 'Proposal ' + s.originalDigest.slice(0, 12), 65, 437, 16);
  paper(g, 521, 95, 395, 376, C.sheet);
  mono(g, 'OWNER’S REQUEST   /   C29', 545, 137, 14);
  title(g, s.current.target + '%', 541, 232, 81, s.current.target === 10 ? C.blue : C.rust);
  mono(g, 'Proposal ' + s.currentDigest.slice(0, 12), 546, 266, 16);
  line(g, 544, 292, 888, 292);
  text(g, instructionLabel(s.current), 544, 325, 22);
  const held = afterClause(k, 2, 'Neither signature covers fifteen', 'Neither signature');
  const exception = afterClause(k, 2, 'the exception rule now applies', 'exception rule');
  const roles = afterClause(k, 3, 'Release, security and exception must each sign for fifteen', false);
  const manifest = afterClause(k, 3, 'match that configuration', false);
  if (held)
    text(g, 'Held · ' + s.matching.length + ' matching receipts', 545, 368, 23, { color: C.rust });
  if (roles)
    text(g, 'Needs ' + s.required.join(', ').toLowerCase(), 545, 398, 19, { max: 345 });
  else if (exception)
    text(g, 'Exception review required', 545, 398, 19);
  if (manifest)
    mono(g, s.deployment.matching.length + ' / 8 manifest reviews match', 545, 441, 16, C.teal);
}
