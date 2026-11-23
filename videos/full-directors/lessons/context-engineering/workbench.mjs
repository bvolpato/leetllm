import { C, fmt, smooth } from './art.mjs';
import {
  trace,
  allocations,
  colorsForAllocation as inks,
  alloc,
  pruned,
  notes,
  handoffs,
  envelopes,
  standardPack,
  CONTEXT_REQUIRED,
  ownership,
  skillUnits,
  skillRequests,
  rollbackHandoff,
} from './examples.mjs';

const labels = [
  'Task + evidence',
  'Scratchpad + tools',
  'Reloaded findings',
  'Old trace export',
  'Unused schemas',
  'Lock guess',
];
export function allocation(a, ledger) {
  const gone = ledger
    ? a.b >= 2
      ? [3, 4, 5]
      : []
    : [
        a.at(2, 'Prune the bulky raw export') ? 3 : null,
        a.at(3, 'Exclude tools') ? 4 : null,
        a.at(3, 'remove the disproven claim') ? 5 : null,
      ].filter((i) => i !== null);
  const kept = alloc(gone),
    total = alloc(),
    removed = total - kept;
  a.label('RUN-842    /    ASSIGNED TOKEN UNITS', 105, 101);
  a.title(ledger ? 'Reconstruct the original input' : 'What can leave this call?', 102, 208, 71);
  allocations.forEach((r, i) => {
    const y = 305 + i * 94,
      off = gone.includes(i);
    a.text(labels[i], 107, y + 28, 36, a.ink);
    const w = (r.units / 8200) * 720;
    a.box(626, y - 11, w, 44, off ? C.edge : inks[i]);
    if (off) a.rule(627, y + 11, 626 + w, y + 11, C.dim, 2);
    a.mono(fmt(r.units), 1410, y + 27, 37, off ? C.dim : a.ink);
    a.label(
      off ? 'OUT' : ledger && a.b === 1 && i > 2 ? '' : 'IN',
      1680,
      y + 23,
      off ? C.brick : C.teal,
    );
  });
  if (ledger) {
    if (a.b === 1 && !a.at(1, 'Those retained groups total'))
      a.label('Which lengths stay in the input?', 109, 943);
    else if (a.b === 1)
      a.text(
        'Retained     2,400 + 760 + (90 + 96) = ' + fmt(alloc([3, 4, 5])),
        109,
        943,
        43,
        C.teal,
      );
    else if (a.b === 2 && !a.at(2, 'Together that is'))
      a.label('Add the three omitted lengths.', 109, 943);
    else if (a.b === 2)
      a.text(fmt(kept) + ' kept     ·     ' + fmt(removed) + ' omitted     ·     Original input  ?', 109, 943, 49);
    else if (!a.at(3, 'seventy-three point one'))
      a.text(
        fmt(kept) + ' kept   +   ' + fmt(removed) + ' omitted   =   ' + fmt(total),
        109,
        943,
        51,
      );
    else
      a.text(
        fmt(removed) +
          ' omitted   ÷   ' +
          fmt(total) +
          ' original   =   ' +
          ((100 * removed) / total).toFixed(1) +
          '%',
        109,
        943,
        53,
        C.teal,
      );
  } else {
    a.bar(
      109,
      887,
      1150,
      48,
      allocations.map((r, i) => (gone.includes(i) ? 0 : r.units)),
      total,
      inks,
    );
    a.mono(fmt(kept) + ' in call', 1281, 929, 39, C.teal);
    if (gone.includes(3))
      a.label('trace-17 and lock-check remain reachable from the notes.', 109, 996, C.dim, 27);
  }
}
export function cutoff(a) {
  const replace = a.at(2, 'only index zero is replaced'),
    unrecorded = a.at(2, 'its finding is unrecorded'),
    recent = a.at(2, 'because they are recent');
  a.label('TOOL HISTORY    /    CONTENT PRUNING', 105, 103);
  a.title('Which old result can shrink?', 105, 214, 71);
  const cutX = 117 + pruned.cutoff * 426 - 17;
  a.rule(cutX, 318, cutX, 835, C.gold, 6);
  a.label('Cutoff ' + pruned.cutoff, cutX, 280, C.gold);
  pruned.rows.forEach((r, i) => {
    const x = 117 + i * 426,
      short = r.replaced && replace,
      y = 405;
    a.mono('call-' + i, x, y - 33, 39);
    a.sheet(x, y, 391, short ? 192 : 304, short ? C.pale : C.white);
    a.label('index ' + r.index, x + 22, y + 68);
    a.text(short ? 'Finding + S0' : r.raw, x + 22, y + 139, 40, C.ink, { font: 'Serif' });
    if (!short)
      for (let j = 0; j < 3; j++)
        a.rule(x + 23, y + 181 + j * 34, x + 223 + (j % 2) * 82, y + 181 + j * 34, C.edge, 3);
    a.label('recorded = ' + r.recorded, x, y + 359, r.recorded ? C.teal : C.brick, 26);
    if (short) a.label('REPLACED', x, y + 421, C.teal, 29);
    else if (i < pruned.cutoff && unrecorded && !r.recorded)
      a.label('KEEP · UNRECORDED', x, y + 421, C.brick, 29);
    else if (i >= pruned.cutoff && recent)
      a.label('KEEP · RECENT', x, y + 421, C.gold, 29);
  });
  if (a.b >= 4)
    a.text('Preserve call IDs and result order in the serialized request.', 108, 870, 34);
  else
    a.text('Replace when index < cutoff and recorded is Boolean true.', 108, 870, 34);
}
export function summary(a) {
  const pending = a.b === 4,
    authority = a.b === 3 && a.at(3, 'Summarization can carry');
  a.label('RUN-842    /    ' + (pending ? 'EXECUTION STATE' : 'COMPRESSED NOTE'), 107, 102);
  if (pending) {
    a.title('A reply is missing', 105, 218, 72);
    a.sheet(99, 309, 1150, 510, C.white);
    a.label('Operation record', 144, 406);
    a.stepRow(147, 499, 1040, 'Approved payload', 'rollback · revision 7');
    a.stepRow(147, 592, 1040, 'Operation key', 'K17');
    a.stepRow(147, 682, 1040, 'Last confirmed', 'request sent');
    a.stepRow(147, 771, 1040, 'Outcome', 'unknown', C.brick);
    a.mono('K17', 1381, 485, 72, C.teal);
    a.text('Query service', 1326, 596, 40);
    a.text('Reconcile the same operation before retrying.', 109, 951, 52);
    return;
  }
  a.title(
    authority ? 'Who owns the instruction?' : 'What can we carry forward about R17?',
    103,
    211,
    66,
  );
  if (authority) {
    a.strip(105, 351, 1070, 'Source-derived history', '“Return XML”', 'runbook-v4', C.blush);
    a.rule(1227, 312, 1227, 815, C.gold, 6);
    a.label('APP POLICY', 1275, 410);
    a.mono('JSON', 1282, 539, 76, C.teal);
    a.text('Read-only tools', 1275, 646, 43);
    a.text('The summary retains the source of the quoted text.', 114, 924, 46);
    return;
  }
  const [observed, negative] = notes;
  a.sheet(108, 305, 1680, 599);
  a.label(observed.trace + '    /    t ' + observed.at, 152, 389);
  a.label('Source ID', 1400, 389);
  a.text('Observed', 152, 490, 39);
  a.mono('HTTP ' + observed.status + ' · ' + observed.path, 506, 490, 44);
  a.mono(observed.source, 1400, 490, 37);
  a.rule(152, 522, 1740, 522, C.edge);
  a.text('Ruled out', 152, 614, 39);
  a.mono('Migration lock at t ' + negative.at, 506, 614, 44, C.teal);
  a.mono(negative.source, 1400, 614, 37, C.teal);
  a.rule(152, 646, 1740, 646, C.edge);
  a.text('Hypothesis', 152, 730, 39);
  a.text('Scope change · unverified', 506, 730, 46, C.gold);
  a.rule(152, 762, 1740, 762, C.edge);
  a.text('Next check', 152, 845, 39);
  if (a.at(3, 'Compare the scope'))
    a.text('Scope required by callback  /  Scope granted by deploy', 506, 845, 42, C.ink, { width: 1218 });
}
export function worker(a) {
  const stage = a.b < 4 ? 0 : a.b === 4 ? 1 : 2,
    ans = handoffs[stage];
  const offered = a.at(3, 'worker reports'),
    verdict = [
      a.at(3, 'Copy the finding'),
      a.at(4, 'There’s no record'),
      a.at(5, 'Four oh three contradicts'),
    ][stage];
  a.label('RUN-842    /    ISOLATED SEARCH', 108, 99);
  a.title('What crosses into the lead’s window?', 105, 207, 66);
  a.housing(91, 321, 741, 536);
  a.label('WORKER    /    COMMIT HISTORY', 132, 399, C.mist);
  const count = Math.ceil(50 * smooth(a.move(1, 'inspects fifty commits', 2.4)));
  for (let i = 0; i < 50; i++) {
    const x = 158 + (i % 10) * 63,
      y = 497 + Math.floor(i / 10) * 61;
    a.dot(x, y, 13, i < count ? C.pale : C.steel);
    if (i % 10 !== 9) a.rule(x + 14, y, x + 46, y, C.steel, 3);
  }
  a.label(count + ' inspected', 137, 815, C.pale);
  a.label('Lead    /    200-byte handoff', 960, 371, C.dim, 31);
  if (offered) {
    a.strip(
      953,
      422,
      865,
      'Worker claim',
      ans.item.claim,
      ans.item.source,
      verdict && !ans.known ? C.blush : C.white,
    );
    const inspected = [a.at(3, 'Open that source'), verdict, a.at(5, 'Open trace seventeen again')][
      stage
    ];
    if (inspected) {
      a.mono(
        ans.known ? ans.record.path + '   HTTP ' + ans.record.status : 'Missing authorized record',
        968,
        697,
        43,
        ans.known ? C.ink : C.brick,
      );
    }
    if (verdict) {
      a.badge(
        ans.accepted ? 'Keep finding + source' : 'Withhold finding',
        970,
        762,
        448,
        ans.accepted ? C.teal : C.brick,
      );
    }
  } else {
    a.rule(970, 547, 1760, 547, C.edge, 3);
    a.label('claim   +   source', 976, 522, C.dim, 37);
  }
  a.text(
    a.b < 4
      ? 'The worker’s search history stays here.'
      : !ans.known && verdict
        ? 'No authorized record to inspect.'
        : a.at(5, 'Open trace seventeen again')
          ? 'Compare the claim with the opened record.'
          : 'Look up the source in the caller’s authorized archive.',
    109,
    971,
    44,
  );
}
export function envelope(a) {
  const extra = a.b < 3 && a.at(1, 'Add two more spaces');
  const repaired = a.at(6, 'Change just the worker’s status');
  const e = envelopes[repaired ? 2 : extra ? 1 : 0];
  a.label('WORKER HANDOFF    /    BYTE BOUNDARY', 104, 104);
  if (a.b < 3) {
    a.title('Will this envelope open?', 104, 214, 72);
    const first = 1596,
      x = 157,
      w = 225;
    for (let i = 0; i < 7; i++) {
      const n = first + i,
        xx = x + i * w;
      a.mono(fmt(n), xx + 17, 389, 32);
      a.box(xx, 433, w - 8, 155, n <= e.receipt.bytes ? (a.b === 2 && n > 1600 ? C.blush : C.pale) : C.edge);
      if (n <= e.receipt.bytes) a.mono('space', xx + 32, 527, 35, C.ink);
    }
    const limit = x + 5 * w - 4;
    a.rule(limit, 342, limit, 672, C.brick, 6);
    a.label('Limit 1,600', limit + 15, 650, C.brick, 27);
    a.mono(fmt(e.receipt.bytes) + ' bytes', 150, 784, 70);
    if (a.b === 2) a.badge('Stop before decode', 151, 870, 453, C.brick);
    return;
  }
  a.title(
    a.b >= 5 ? 'Does the trace support the claim?' : 'Open the 1,599-byte envelope',
    104,
    214,
    66,
  );
  a.sheet(104, 315, 821, 485, C.white);
  a.label('Worker    /    ' + fmt(e.receipt.bytes) + ' bytes', 145, 397);
  const item = e.receipt.item;
  a.label('claim', 145, 488);
  a.mono(item.claim, 145, 563, 62, C.ink);
  a.mono('source_ids    ' + JSON.stringify(item.source_ids), 145, 652, 31);
  a.text('next_check    ' + item.next_check, 145, 724, 30);
  a.label('AUTHORIZED ARCHIVE', 1057, 389, C.dim);
  if (a.at(5, 'Open the cited trace')) {
    a.strip(
      1043,
      442,
      763,
      item.source_ids[0],
      trace.path + '   HTTP ' + trace.status,
      null,
      C.ice,
    );
    if (a.at(6, 'Withhold that claim') && !repaired)
      a.badge('Withhold claim', 1047, 710, 370, C.brick);
    if (a.at(6, 'This time the values match'))
      a.badge('Checked     ' + trace.status + '  ·  trace-17', 1045, 710, 600, C.teal);
  } else a.text('trace-17', 1050, 537, 65, C.teal, { font: 'Mono' });
  if (a.b === 7) a.text('Measure both windows and the lead’s wait.', 108, 952, 47);
}
function packingTray(a, items, budget, eventsCount, failRequired = false) {
  const result = standardPack,
    active = result.events.slice(0, failRequired ? 2 : eventsCount).filter((e) => e.fits);
  const used = active.reduce((n, e) => n + e.units, 0),
    palette = [C.teal, C.blue, C.gold];
  const order = failRequired ? [0, 1, 3, 2] : [0, 1, 2, 3];
  order.forEach((i, position) => {
    const r = items[i],
      y = 307 + position * 96,
      ev = result.events[i],
      seen = failRequired ? i !== 2 : i < eventsCount;
    a.text(r.id, 105, y + 36, 38);
    a.mono(fmt(r.units), 470, y + 35, 35);
    a.label(
      failRequired && i === 3 ? 'required' : r.required ? 'required' : 'optional',
      653,
      y + 33,
      r.required || (failRequired && i === 3) ? C.teal : C.dim,
    );
    if (seen)
      a.text(
        ev.fits ? (failRequired ? 'staged' : 'in') : failRequired ? 'cannot fit' : 'skip',
        908,
        y + 33,
        34,
        ev.fits ? C.teal : C.brick,
      );
  });
  a.label('Input allocation', 1138, 385);
  a.mono(fmt(budget), 1137, 504, 89);
  a.label('assigned units', 1143, 557);
  a.bar(
    105,
    750,
    1670,
    87,
    active.map((r) => r.units),
    budget,
    palette,
  );
  a.mono(
    failRequired
      ? '600 + 8,200 > 3,000   ·   request held'
      : fmt(used) + ' used  ·  ' + fmt(budget - used) + ' free',
    106,
    924,
    49,
    failRequired ? C.brick : C.teal,
  );
}
export function pack(a) {
  const reserve = a.b === 3,
    fail = a.at(2, 'make the full dump required') && !reserve;
  a.label('CONTEXT PACKER    /    ' + (reserve ? 'RESERVATIONS' : 'CANDIDATES'), 106, 99);
  a.title(
    reserve
      ? 'Reserve space before packing'
      : fail
        ? 'The required dump cannot fit'
        : 'Protect required records first',
    104,
    205,
    68,
  );
  if (reserve) {
    const res = [420, 180, 1024],
      space = 4096 - res.reduce((x, y) => x + y);
    [
      ['Total capacity', 4096],
      ['Instructions', 420],
      ['Framing', 180],
      ['Output allowance', 1024],
      ['Available for records', space],
    ].forEach(([n, v], i) =>
      a.stepRow(111, 349 + i * 100, 1060, n, fmt(v), i === 4 ? C.teal : C.ink),
    );
    a.mono(fmt(standardPack.used), 1290, 492, 77, C.teal);
    a.label('selected units', 1294, 551);
    a.mono(fmt(space - standardPack.used), 1294, 713, 77);
    a.label('unused units', 1300, 775);
    return;
  }
  const count =
    a.b === 1
      ? 0
      : a.at(2, 'export does not fit')
        ? 4
        : a.at(2, 'optional runbook')
          ? 3
          : a.at(2, 'use six hundred')
            ? 2
            : 0;
  packingTray(a, CONTEXT_REQUIRED, 3000, count, fail);
}
export function owner(a) {
  const pair = a.at(1, 'Try the route map'),
    low = a.at(3, 'five hundred units'),
    answered = a.at(2, 'Page the Access team');
  const owner = ownership.directory[ownership.routes[trace.path]];
  a.label('RUN-842    /    FIND THE CALLBACK OWNER', 109, 97);
  a.title(low ? 'Will both links fit?' : 'Which team gets the page?', 105, 213, 70);
  if (low) {
    const w = 1440,
      x = 127,
      cap = 500,
      sum = ownership.costs.reduce((u, v) => u + v),
      edge = x + (w * cap) / sum;
    a.bar(x, 453, w, 150, ownership.costs, sum, [C.teal, C.blue]);
    a.rule(edge, 378, edge, 653, C.brick, 7);
    a.mono('500-unit limit', edge - 170, 347, 37, C.brick);
    a.mono('Map  300', x + 51, 547, 44, C.white);
    a.mono('Directory  300', x + w / 2 + 52, 547, 44, C.white);
    if (a.at(3, 'stop before sending'))
      a.text('Hold the request. Extract both entries or split the lookup.', 127, 816, 50, C.brick);
    return;
  }
  a.strip(
    103,
    320,
    808,
    'Error log   /   600 units',
    trace.path + '    ' + trace.status,
    null,
    C.blush,
  );
  a.text('Owner   ?', 111, 634, 55);
  if (a.at(1, 'The error log ranks first') && !a.at(2, 'The route map takes us')) {
    const budget = 600;
    const width = 808;
    a.text('Log ' + budget + ' units', 103, 276, 46);
    a.bar(103, 290, width, 16, [budget], budget, [C.steel]);
    if (a.at(1, 'Each costs three hundred units')) {
      const [mapCost, directoryCost] = ownership.costs;
      const split = 985 + (width * mapCost) / budget;
      a.text('Map ' + mapCost, 985, 276, 46, C.teal);
      a.text('Directory ' + directoryCost, split + 12, 276, 46, C.blue);
      a.bar(985, 290, width, 16, ownership.costs, budget, [C.teal, C.blue]);
    }
  }
  if (pair) {
    a.strip(
      985,
      320,
      817,
      'Route map   /   300 units',
      trace.path + '    →    ' + ownership.routes[trace.path],
      null,
      C.white,
    );
    a.strip(985, 554, 817, 'Directory   /   300 units', 'Identity    →    ' + owner, null, C.ice);
    a.rule(1400, 486, 1400, 554, C.teal, 5);
  }
  if (answered) a.badge('Page the ' + owner, 990, 803, 650);
}
export function thrashing(a) {
  const order = ['Fetch', 'Summarize', 'Drop original', 'Fetch again', 'Summarize'];
  const cues = [
    'Fetch the trace',
    'summarize it',
    'drop the original',
    'fetch the same trace',
    'summarize it again',
  ];
  const done = cues.filter((c) => a.at(1, c)).length;
  a.label('RUN-842    /    PREPARATION COUNTER', 104, 107);
  a.title(
    a.b < 3
      ? 'Where did the request ID go?'
      : a.b === 3
        ? 'What counts as progress?'
        : 'Keep the lookup key through the next turn',
    103,
    219,
    64,
  );
  if (a.b <= 2) {
    order.forEach((name, i) => {
      const x = 111 + i * 343;
      a.dot(x + 18, 414, 18, i < done ? C.teal : C.edge);
      if (i < 4) a.rule(x + 37, 414, x + 342, 414, C.edge, 4);
      a.text(name, x, 520, 35, i < done ? a.ink : a.dim);
      if (i < done)
        a.label(
          [0, 3].includes(i) ? 'trace-17' : 'ID omitted',
          x,
          603,
          [0, 3].includes(i) ? C.teal : C.brick,
        );
    });
    a.mono(done + ' context operations', 109, 777, 55);
    a.mono('0 completed steps', 1060, 777, 55);
    if (a.b === 2) a.badge('Ratio undefined   ·   stalled', 111, 866, 650, C.brick);
  } else if (a.b === 3) {
    [
      ['Repeat same lookup', 'Same span, still unresolved'],
      ['Empty search', 'Specific evidence gap'],
      ['Lock ruled out', 'One fewer possible cause'],
    ].forEach(([l, r], i) => a.stepRow(110, 399 + i * 160, 1640, l, r));
  } else {
    a.strip(107, 357, 870, 'Pinned source', 'trace-17   ·   R17', null, C.pale);
    a.text(
      a.at(4, 'Once that budget is exhausted')
        ? 'Preparation budget exhausted'
        : 'Bound the preparation work',
      1008,
      455,
      41,
      C.brick,
    );
    a.rule(112, 665, 1752, 665, C.edge, 4);
    a.text('Save the gap. Escalate with the pending operation key.', 113, 818, 48);
  }
}
export function skills(a) {
  a.label('INCIDENT SKILL    /    LOAD ON DEMAND', 106, 102);
  a.title(
    a.b === 3 ? 'Which pieces count as input?' : 'Open one procedure when the task calls for it',
    103,
    206,
    62,
  );
  const names = [
    '6 names + descriptions',
    'Active procedure body',
    'Selected reference',
    'Returned script output',
  ];
  const active = [
    true,
    a.at(2, 'load the chosen procedure'),
    a.at(2, 'Read a reference'),
    a.at(2, 'returned output'),
  ];
  names.forEach((name, i) => {
    const x = 112 + i * 432,
      y = 357 + (i % 2) * 25;
    for (let j = i === 0 ? 4 : 1; j >= 1; j--)
      a.box(x + j * 5, y - j * 8, 382, 278, i === 0 ? C.edge : C.steel);
    a.sheet(x, y, 382, 278, active[i] ? (i === 0 ? C.ice : C.pale) : C.white);
    a.label(['Discovery', 'SKILL.md', 'references/', 'script result'][i], x + 24, y + 69);
    a.text(name, x + 23, y + 150, 36, C.ink, { width: 337 });
    a.mono(
      a.b === 3 ? fmt(skillUnits[i]) : active[i] ? 'in prompt' : 'on demand',
      x + 23,
      y + 226,
      36,
      active[i] ? C.teal : C.dim,
    );
  });
  if (a.b === 1) a.text('A package can also contain scripts and assets.', 113, 841, 45);
  if (a.b === 2)
    a.text('The executor reads the script. Its output enters this prompt.', 113, 841, 45);
  if (a.b === 3) {
    a.bar(109, 755, 1380, 62, skillUnits, 3200, [C.blue, C.teal, C.gold, C.brick]);
    if (a.at(3, 'That comes to')) a.mono('3,200 units', 112, 936, 67, C.teal);
  }
}
export function skillRoute(a) {
  const showHandoff = a.b >= 2 && !a.at(3, 'Before installing');
  a.label('INCIDENT SKILL    /    RUNTIME PERMISSIONS', 106, 101);
  a.title(
    a.b === 1
      ? 'Which request opens the skill?'
      : showHandoff
        ? 'What can the skill do with this rollback request?'
        : 'What belongs in the stable base?',
    103,
    215,
    65,
  );
  if (a.b === 1) {
    skillRequests.forEach(({ task, procedure }, i) => {
      const y = 365 + i * 172;
      a.strip(108, y, 875, 'Incoming task', task, null);
      if (a.at(1, ['A vacation-policy summary', 'A request to roll back', 'Follow that last request'][i])) {
        a.route(1020, y + 86, 1210, y + 86, C.teal, 4);
        a.text(procedure || 'Leave unloaded', 1264, y + 101, 40);
      }
    });
  } else if (showHandoff) {
    const h = rollbackHandoff;
    const { item } = h.evidence.receipt;
    const record = h.evidence.record;
    a.sheet(108, 283, 842, 583);
    a.label('RUN-842   /   ROLLBACK REQUEST', 142, 361);
    a.stepRow(142, 457, 775, 'Selected procedure', h.procedure);
    if (a.at(2, 'The attached finding'))
      a.stepRow(142, 552, 775, 'Script output', 'Rollback proposal');
    if (a.at(2, 'and cites trace seventeen'))
      a.stepRow(142, 647, 775, 'Attached finding', item.claim);
    if (a.at(2, 'The validator opens'))
      a.stepRow(142, 742, 775, 'Cited source', item.source_ids[0]);
    if (a.at(2, 'The two status codes'))
      a.strip(1006, 284, 794, 'Validator opens', record.trace + '    HTTP ' + record.status, item.source_ids[0], C.ice);
    if (a.at(2, 'Now read')) {
      a.badge(h.accepted ? 'Finding accepted' : 'Finding withheld', 1040, 472, 442, h.accepted ? C.teal : C.brick);
      a.sheet(1006, 585, 794, 281);
      a.label('HOST PERMISSION CHECK', 1041, 657);
      a.stepRow(1041, 732, 720, 'Skill permissions', h.permissions.join(', '));
      if (a.at(3, 'The host denies'))
        a.stepRow(1041, 811, 720, 'Rollback requires', h.required);
    }
    if (a.at(3, 'The proposal stays on file'))
      a.badge(h.permitted ? 'Write allowed' : 'Write denied · proposal on file', 1007, 908, 791, h.permitted ? C.teal : C.brick);
  } else {
    a.strip(108, 372, 818, 'Stable base', 'Always-needed instructions', null, C.ice);
    a.strip(982, 372, 824, 'Loaded on demand', 'Incident procedure', null, C.pale);
    a.text('Measure activation errors, rendered tokens and end-to-end work.', 110, 785, 44);
  }
}
