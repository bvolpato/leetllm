import {
  col as C,
  rect,
  line,
  circle,
  text,
  mono,
  title,
  paper,
  folder,
  header,
  stamp,
  checkBox,
  at,
  lines,
  field,
} from './studio.mjs';
import { triage, classificationFixture, modelReviewState, workflows } from './evidence.mjs';

function intakeCard(g, name, flags, route, answer, x, y) {
  paper(g, x, y, 841, 89);
  for (let i = 0; i < 4; i++) circle(g, x + 9, y + 12 + 20 * i, 3, C.desk);
  title(g, name, x + 23, y + 52, 23, C.ink, 206);
  flags.forEach((v, i) => checkBox(g, x + 241 + i * 83, y + 44, v));
  line(g, x + 543, y + 12, x + 543, y + 76);
  if (answer)
    text(g, route, x + 559, y + 51, 20, {
      color: route === 'Facts review' ? C.rust : C.teal,
      max: 264,
    });
}
export function intake(g, k) {
  header(g, 'WORKFLOW INTAKE', 'One model, three uses', 57, 47);
  const x = 59;
  ['Credit', 'Workers', 'Talks', 'Effects'].forEach((v, i) =>
    mono(g, v, x + 241 + i * 83, 139, 13, C.mist, 'center'),
  );
  mono(g, 'Review route', x + 560, 139, 14, C.mist);
  const incomplete = at(k, 2, 'erase the summarizer'),
    routed = at(k, 2, 'To facts review');
  const ordered = [workflows[1], workflows[2], workflows[0]];
  ordered.forEach((w, i) => {
    const flags = i === 2 && incomplete ? [false, null, false, false] : w.flags;
    const cue = [
      'The credit application goes',
      'promotion assistant needs',
      'public summarization takes',
    ][i];
    intakeCard(
      g,
      w.name,
      flags,
      triage(flags),
      i === 2 && incomplete ? routed : at(k, 1, cue),
      x,
      155 + i * 112,
    );
  });
}
function borderMap(g, k) {
  const use = at(k, 0, 'where system output');
  paper(g, 46, 57, 867, 426);
  mono(g, 'CREDIT APPLICATION  /  TERRITORIAL SCOPE', 76, 103, 14);
  title(g, 'Where is the output used?', 74, 151, 37);
  for (let y = 178; y < 423; y += 20) line(g, 466, y, 466, y + 11, C.dull, 2);
  mono(g, 'OUTSIDE THE UNION', 83, 207);
  mono(g, 'IN THE UNION', 520, 207);
  building(g, 115, 240, 'System provider');
  building(g, 610, 240, 'Lender');
  line(g, 302, 286, 603, 286, C.rule, 3);
  if (use) {
    line(g, 302, 286, 597, 286, C.blue, 3);
    text(g, '›', 585, 294, 30, { color: C.blue });
    rect(g, 360, 264, 162, 37, C.paper);
    mono(g, 'Credit assessment', 441, 288, 14, C.blue, 'center');
  }
  if (k.beat.beatIndex >= 1)
    mono(g, 'Intended use · applicant assessment   /   checked 06 Nov 2026', 76, 448, 16);
}
function building(g, x, y, name) {
  g.beginPath();
  g.moveTo(x - 5, y + 26);
  g.lineTo(x + 80, y);
  g.lineTo(x + 165, y + 26);
  g.closePath();
  g.fillStyle = C.teal;
  g.fill();
  for (let i = 0; i < 4; i++) rect(g, x + 13 + i * 40, y + 32, 13, 56, C.teal);
  rect(g, x, y + 94, 160, 7, C.teal);
  text(g, name, x + 80, y + 131, 19, { align: 'center' });
}
export function actors(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2) return borderMap(g, k);
  if (b >= 6) {
    header(g, 'SCHEDULER   /   WORKFLOW INTAKE', 'Which fact takes priority?');
    const unknown = at(k, 6, 'Change a checked answer');
    const flags = [false, unknown ? null : true, true, false];
    ['Credit', 'Manages workers', 'Talks to people', 'Executable effect'].forEach((v, i) => {
      paper(g, 68, 159 + i * 72, 497, 57);
      text(g, v, 89, 197 + i * 72, 22);
      checkBox(g, 528, 188 + i * 72, flags[i]);
    });
    mono(g, 'ENGINEERING ROUTE', 600, 222, 15, C.mist);
    if (at(k, 6, 'Worker management takes priority'))
      title(g, triage(flags), 598, 266, 26, C.gold, 299);
    return;
  }
  header(g, 'CREDIT ASSESSMENT  /  ACTOR RECORD', 'Whose decision is it?');
  const names = [
    ['Model provider', 'Markets the GPAI model', 'Model documentation'],
    ['System provider', 'Markets the credit system', 'Intended use and safety controls'],
    ['Deployer', 'Uses it under its authority', 'Lender’s decision on the loan'],
  ];
  names.forEach(([role, action, record], i) => {
    const x = 60 + i * 283,
      y = 166 + i * 21;
    paper(g, x, y, 270, 213, i === 1 ? C.paper : C.sheet);
    mono(g, '0' + (i + 1) + '  /  ' + ['MODEL', 'SYSTEM', 'USE'][i], x + 19, y + 38, 14);
    title(g, role, x + 18, y + 86, 27);
    line(g, x + 19, y + 104, x + 248, y + 104);
    text(g, action, x + 19, y + 141, 18, { max: 235 });
    text(g, record, x + 19, y + 177, 17, { color: C.blue, max: 235 });
  });
  if (b === 3)
    mono(g, 'Own name or trademark  ·  putting into service applies to the system.', 65, 456, 17, C.light);
  if (b === 5)
    mono(
      g,
      'Check prohibited use, high risk and transparency. Duties can overlap.',
      65,
      456,
      17,
      C.light,
    );
}
const caseFiles = [
  {
    section: 'Article 5(1)(a) and (b)',
    name: 'Manipulation and vulnerability',
    item: 'Which techniques and harms meet the legal conditions?',
    tests: [
      'Specified technique or vulnerability',
      'Material distortion of behavior',
      'Significant harm or reasonable likelihood of it',
    ],
    note: 'Record the behavior, the person affected and the evidence of harm.',
  },
  {
    section: 'Article 5',
    name: 'Criminal-risk assessment',
    item: 'Is the prediction based solely on profiling or personality traits?',
    tests: [
      'Does the system support an existing human assessment of involvement?',
      'Did the assessor already have objective, verifiable facts?',
      'Do those facts link directly to the criminal activity?',
    ],
    note: 'Also screen untargeted facial scraping and biometric categorization.',
  },
  {
    section: 'Article 5',
    name: 'Emotion inference',
    item: 'Workplace or education setting',
    tests: ['Whose biometric data does the system process?', 'Does it infer a person’s emotions from those data?', 'Is it for a medical or safety reason?'],
    note: 'Check the limited exception for this use.',
  },
  {
    section: 'Article 5',
    name: 'Real-time identification',
    item: 'Law enforcement in a publicly accessible space',
    tests: [
      'Listed search objective',
      'Strict necessity and proportionality of this use',
      'Limits on people, area and time',
      'Applicable authorization and safeguards',
    ],
    note: 'Which conditions does this case establish?',
  },
  {
    section: 'Article 5(1)(ba), (bb) and 5(1a)',
    name: 'Amended prohibitions',
    item: 'Nonconsensual intimate material and child sexual abuse material',
    tests: [
      'Is generation or manipulation the intended purpose?',
      'Is it foreseeable and reproducible without significant modification?',
      'What safeguards prevent it and correct observed misuse?',
      'For use, check the deployer’s purpose and legal conditions.',
    ],
    note: 'Application date   02 Dec 2026',
  },
];
function housingFile(g, k) {
  folder(g, 58, 64, 839, 422, 'PROHIBITED USE SCREEN');
  mono(g, 'ARTICLE 5(1)(c)   /   SOCIAL SCORING', 88, 108, 14);
  title(g, 'Follow the member’s score', 87, 161, 40);
  line(g, 89, 183, 860, 183, C.ink);
  line(g, 466, 200, 466, 352);
  mono(g, 'SCORING RECORD', 89, 222, 15, C.blue);
  mono(g, 'DECISION RECORD', 495, 222, 15, C.blue);
  if (at(k, 0, 'A sports club')) {
    title(g, 'Sports club', 89, 265, 30);
    text(g, 'AI rating of one member’s conduct', 89, 309, 20);
    text(g, 'Games across one season', 89, 340, 18);
  }
  if (at(k, 0, 'A housing office')) {
    title(g, 'Housing office', 495, 265, 30);
    text(g, 'Received the club score', 495, 309, 20);
    if (at(k, 1, 'denied the member housing'))
      text(g, 'Housing denied on that score', 495, 340, 21, { color: C.rust });
    else line(g, 496, 345, 841, 345, C.rule);
  }
  if (at(k, 1, 'adverse treatment in an unrelated setting'))
    text(g, 'The adverse decision took place outside the scoring context.', 89, 388, 20);
  if (at(k, 1, "Article five also covers"))
    text(g, 'Article 5 also covers unjustified or disproportionate adverse treatment.', 89, 417, 18);
  if (at(k, 1, 'Stop this prohibited use')) stamp(g, 'Stop this use before release', 89, 460);
}
export function prohibitions(g, k) {
  const b = k.beat.beatIndex;
  if (b < 2 && at(k, 0, 'Now follow a social score')) return housingFile(g, k);
  const ind = b === 0 ? 0 : b === 2 ? 1 : b === 3 ? 2 : b < 6 ? 3 : 4,
    f = caseFiles[ind];
  folder(g, 58, 64, 839, 422, 'PROHIBITED USE SCREEN');
  mono(g, f.section.toUpperCase() + '    /    EU INTAKE', 88, 108, 14);
  const search = ind === 3 && at(k, 4, 'Take a targeted');
  const objective = search && at(k, 5, 'That establishes the listed objective');
  const held = search && at(k, 5, 'Hold this request');
  title(g, search ? 'Missing-person search' : f.name, 87, 162, 42);
  text(g, f.item, 89, 205, 21, { max: 768 });
  line(g, 88, 226, 853, 226, C.ink);
  const tests = f.tests;
  tests.forEach((v, i) => {
    const y = 265 + i * (tests.length === 4 ? 45 : 55);
    if (objective && i === 0) checkBox(g, 103, y - 4, true);
    else circle(g, 103, y - 5, 8, null, C.dull);
    text(g, v, 130, y + 2, 21, { max: 726 });
  });
  mono(
    g,
    held ? 'HOLD  /  justification, scope and authorization still pending' : f.note,
    89,
    452,
    15,
    held ? C.rust : C.blue,
    'left',
    764,
  );
}
function contact(g, x, y, closed, caption) {
  circle(g, x, y, 7, C.gold);
  circle(g, x + 92, y, 7, C.gold);
  line(g, x, y, x + 90, y - (closed ? 0 : 38), closed ? C.mist : C.gold, 5);
  mono(g, caption, x + 46, y + 45, 15, C.light, 'center');
  mono(g, closed ? 'yes' : 'no', x + 46, y + 72, 15, closed ? C.mist : C.gold, 'center');
}
export function highRisk(g, k) {
  const b = k.beat.beatIndex;
  if (b <= 1) {
    const safety = at(k, 1, 'cut-off'),
      unrelated = at(k, 1, 'solely about an unrelated risk');
    const assessed = at(k, 1, 'With a required');
    const ok = classificationFixture({
      annexI: true,
      safety: !!safety,
      thirdPartyHealthSafety: !!assessed && !unrelated,
    }).productRoute;
    header(g, 'ARTICLE 6(1)   /   ANNEX I PRODUCT', 'Two conditions in series');
    mono(g, safety ? 'Overheating cut-off' : 'Convenience display', 68, 183, 23, C.light);
    line(g, 78, 258, 223, 258, C.dull, 4);
    contact(g, 224, 258, safety, 'Safety function');
    line(g, 316, 258, 477, 258, C.dull, 4);
    if (assessed) contact(g, 477, 258, !unrelated, 'Required H&S assessment');
    else {
      circle(g, 477, 258, 7, C.gold);
      circle(g, 569, 258, 7, C.gold);
      mono(g, 'Assessment?', 522, 302, 15, C.light, 'center');
    }
    line(g, 570, 258, 755, 258, C.dull, 4);
    circle(g, 790, 258, 33, ok ? C.gold : C.edge, C.gold);
    mono(g, ok ? 'BOTH MET' : 'OPEN', 790, 332, 16, C.light, 'center');
    text(
      g,
      unrelated
        ? 'Only an unrelated assessment is required.'
        : ok
          ? 'The failure can endanger a person.'
          : safety
            ? 'Check which assessment the product requires.'
            : 'This module only makes the display easier to use.',
      67,
      431,
      25,
      { color: C.light, max: 845 },
    );
  } else if (b === 2) {
    header(g, 'ANNEX III   /   TWO BANK FILES', 'What decision does the system affect?');
    [
      ['Loan application', 'Assess a person’s creditworthiness', 'Listed use'],
      ['Transaction review', 'Detect financial fraud', 'Excluded from this entry'],
    ].forEach(([kind, use, note], i) => {
      const x = 65 + i * 426;
      folder(g, x, 191, 386, 246, i ? 'TRANSACTION' : 'APPLICANT');
      title(g, kind, x + 22, 244, 29);
      text(g, use, x + 22, 300, 19, { max: 343 });
      if (at(k, 2, 'expressly excludes')) stamp(g, note, x + 24, 385, i ? C.blue : C.teal);
    });
  } else if (b <= 5) {
    const profiling = at(k, 5, 'profiling of natural persons');
    header(g, 'ARTICLE 6(3)   /   ANNEX III', 'Test the exception');
    paper(g, 59, 150, 843, 313);
    field(
      g,
      'SIGNIFICANT HARM OR MATERIAL INFLUENCE?',
      'Establish the risk in context.',
      88,
      194,
      750,
    );
    const tests = [
      'Narrow procedural task',
      'Improve a completed human activity',
      'Detect patterns with proper review',
      'Preparatory task',
    ];
    if (b >= 4)
      tests.forEach((s, i) => {
        const x = 91 + (i % 2) * 387,
          y = 288 + Math.floor(i / 2) * 43;
        circle(g, x, y - 6, 6, null, C.dull);
        text(g, s, x + 17, y, 18, { max: 355 });
      });
    else text(g, 'At least one of four statutory conditions must also fit.', 88, 288, 22);
    if (profiling) stamp(g, 'Profiles a natural person  /  remains high risk', 89, 406);
    else mono(g, 'Document and register before relying on the exception.', 88, 409, 16);
  } else {
    folder(g, 62, 65, 835, 414, 'HIGH-RISK SYSTEM');
    mono(g, 'ARTICLES 9–15', 93, 110);
    title(g, 'Follow the product’s sector route', 91, 162, 37);
    const groups = [
      ['System evidence', 'Risk management · data governance · documentation'],
      ['Operation', 'Logging · transparency · human oversight'],
      ['Performance', 'Accuracy · robustness · cybersecurity'],
    ];
    groups.forEach(([n, v], i) => {
      const y = 225 + 58 * i;
      title(g, n, 92, y, 21);
      text(g, v, 296, y, 19, { max: 559 });
      line(g, 93, y + 15, 854, y + 15);
    });
    mono(g, 'Annex I Section B     →     check sector legislation', 93, 436, 17, C.blue);
  }
}
export function modelDuties(g, k) {
  const b = k.beat.beatIndex;
  if (b === 2 || b === 3) {
    header(g, 'ARTICLES 51–52', 'How can a model enter systemic-risk review?');
    const { thresholdShare, decisionOpen, designationFound } = modelReviewState(k);
    const scaleX = (share) => 96 + share * 450;
    const y = 225;
    text(g, 'Cumulative training compute (10²⁵ FLOPs)', 96, 162, 22, { color: C.light });
    line(g, scaleX(0), y, 849, y, C.mist, 3);
    for (const tick of [0, 0.5, 1, 1.5]) {
      const x = scaleX(tick);
      line(g, x, y - 6, x, y + 6, C.mist, 2);
      mono(g, String(tick), x, y + 29, 16, C.light, 'center');
    }
    if (at(k, 2, 'More than ten')) {
      line(g, scaleX(1) + 7, y, 849, y, C.gold, 6);
      circle(g, scaleX(1), y, 6, C.desk, C.gold);
      text(g, 'High-impact capabilities presumed', scaleX(1) + 10, y - 19, 18, { color: C.gold });
    }
    if (at(k, 2, 'With its notification'))
      text(g, 'Article 52(2) allows an exceptional rebuttal with model-specific evidence.', 96, 294, 19, { color: C.light });
    if (thresholdShare !== null) {
      circle(g, scaleX(thresholdShare), y, 8, C.mist, C.edge);
      mono(g, 'This model · ' + thresholdShare, scaleX(thresholdShare), y - 19, 18, C.light, 'right');
    }
    if (decisionOpen) {
      paper(g, 86, 320, 795, 158);
      title(g, 'Commission decision', 109, 358, 27);
      if (at(k, 3, 'equivalent to those of the most advanced models'))
        text(g, 'Equivalent capabilities or impact compared with the most advanced models', 110, 391, 19);
      if (at(k, 3, 'Annex thirteen'))
        text(g, 'Annex XIII criteria include capability evaluations and reach in the Union.', 110, 420, 18);
      if (designationFound) stamp(g, 'Designated as a model with systemic risk', 110, 459, C.blue);
    }
    return;
  }
  folder(g, 65, 77, 824, 389, 'LENDER  /  CREDIT SYSTEM');
  title(g, 'Applicant creditworthiness', 94, 130, 32);
  mono(g, 'Application provider    ·    intended use and affected people', 95, 163, 15);
  paper(g, 119, 193, 723, 241, C.sheet);
  const open = at(k, 1, 'qualifying open-source'),
    systemic = at(k, 1, 'If the model has systemic risk');
  title(g, b === 4 ? 'Additional systemic-risk duties' : 'Underlying model provider', 143, 232, 28);
  if (b === 4) {
    lines(
      g,
      [
        'Evaluate and test the model.',
        'Assess and mitigate systemic risks in the Union.',
        'Report serious incidents and protect the model.',
      ],
      145,
      279,
      37,
      18,
    );
    mono(g, 'Training energy → Annex XI documentation under Article 53', 145, 404, 14, C.blue);
  } else if (b === 5) {
    lines(
      g,
      [
        'Provider supplies model documentation.',
        'Integrator assesses the application’s use,',
        'permissions and affected people.',
      ],
      145,
      282,
      40,
      21,
    );
  } else
    [
      'Technical documentation',
      'Information for integrators',
      'Copyright policy',
      'Public training-content summary',
    ].forEach((s, i) => {
      const y = 272 + i * 39,
        exempt = open && !systemic && i < 2;
      text(g, s, 146, y, 19);
      mono(
        g,
        exempt ? 'limited exception' : 'duty applies',
        814,
        y,
        16,
        exempt ? C.blue : C.teal,
        'right',
      );
    });
}
const duties = [
  ['Listed-use systems · Article 6(2), Annex III', '02 Dec 2027'],
  ['Product route · Article 6(1), Annex I', '02 Aug 2028'],
  ['Direct AI interaction · 50(1)', '02 Aug 2026'],
  ['Output marking · 50(2)', '02 Aug 2026'],
  ['Deployer disclosures · 50(4)', '02 Aug 2026'],
  ['GPAI provider duties', '02 Aug 2025'],
  ['Earlier GPAI models · transition', '02 Aug 2027'],
];
export function dates(g, k) {
  const b = k.beat.beatIndex;
  paper(g, 50, 42, 858, 456);
  bindingHoles(g);
  mono(g, 'WORKFLOW MEMO   /   BASIS CHECKED 06 NOV 2026', 89, 85);
  title(
    g,
    b === 4 || b === 6 ? 'Assistant on market · 01 July 2026' : 'Application dates by obligation',
    86,
    136,
    36,
  );
  const old = at(k, 4, 'Slide the marking deadline');
  mono(g, 'Regulation (EU) 2024/1689, Arts 111 & 113, as amended by (EU) 2026/1744', 89, 468, 15, C.dull, 'left', 780);
  if (b === 0) {
    field(g, 'AMENDING REGULATION', 'Regulation (EU) 2026/1744', 89, 212, 758);
    if (at(k, 0, 'entered into force')) field(g, 'AMENDMENT ENTERED INTO FORCE', '27 July 2026', 89, 300, 758);
    mono(g, 'Required signoff   /   review the use before launch', 89, 435, 16, C.blue);
    return;
  }
  const selected = b < 2 ? [0, 1] : b < 5 ? [2, 3, 4] : b === 5 ? [5, 6] : [2, 3, 4];
  const heading =
    b < 2
      ? 'Chapter III, Sections 1–3  ·  except Article 6(5)'
      : b === 5
        ? 'Market date decides the transition'
        : 'Identify the interaction, output and deployer';
  mono(g, heading, 89, 180, 17, C.blue);
  selected.forEach((j, i) => {
    const y = 232 + i * 68,
      date = j === 3 && old ? '02 Dec 2026' : duties[j][1];
    rect(g, 87, y - 22, 782, 51, j === 3 && old ? C.pale : C.sheet);
    text(g, duties[j][0], 101, y + 12, 21, { max: 483 });
    mono(g, date, 850, y + 12, 22, j === 3 && old ? C.rust : C.ink, 'right');
  });
  mono(
    g,
    b === 1
      ? 'Article 113(c) sets the dates for these provisions.'
      : b === 5
      ? 'Check separate transition rules for existing high-risk systems.'
      : old
        ? 'Article 111(4) changes only the marking deadline here.'
        : 'Check the duties and exceptions for this workflow.',
    89,
    430,
    15,
    C.dull,
    'left',
    780,
  );
}
function bindingHoles(g) {
  for (let y = 78; y < 476; y += 49) circle(g, 64, y, 3, C.desk);
}
