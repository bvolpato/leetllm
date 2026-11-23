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
  lerp,
  ramp,
  on,
  head,
  caption,
  printer,
  slip,
} from './print-room.mjs';
import {
  project,
  events,
  duplicate,
  branch,
  commands,
  promptFrom,
  windowAt,
  turns,
  batches,
  reviewer,
  claim,
} from './memory.mjs';

export function opening(g, c) {
  const shown = on(c, 1, 'Two replay slips');
  const picked = on(c, 2, 'On event');
  const copied = ramp(c, 2, 'copies the failed replay', 0.7);
  const checkout = on(c, 3, 'checks the active branch');
  const profile = on(c, 3, 'reads Ada’s verification command');
  const packet = promptFrom({
    event: copied >= 1 ? duplicate : undefined,
    checkout: checkout ? branch : undefined,
    profile: profile ? commands[1] : undefined,
  });
  head(
    g,
    'New chat   /   Ada in billing',
    'Four days after the invoice fix',
    'BILLING   /   WEBHOOK',
  );
  overline(g, 'Saved outside this call', 90, 280);
  if (!shown) {
    paper(g, 100, 377, 814, 315, C.shade);
    paper(g, 90, 360, 814, 315);
    overline(g, 'Billing project   /   previous session', 130, 424, true);
    serif(g, 'Invoice fix', 130, 528, 85, C.ink);
    line(g, 130, 568, 862, 568, C.faint, 2, [6, 5]);
    txt(g, 'Earlier conversation', 130, 625, 35, C.faint);
  } else {
    events.forEach((e, i) => slip(g, e, 90 + i * 426, 365, 398, 246, picked && e === duplicate));
    if (picked) stamp(g, 'Different invoice IDs', 110, 687, C.teal);
    if (on(c, 2, 'invoice C twice')) txt(g, 'C returned twice', 540, 686, 33, C.dim);
  }
  line(g, 980, 268, 980, 807, C.edge, 2, [5, 11]);
  overline(g, 'Model input   /   this call', 1045, 280);
  box(g, 1040, 331, 773, 476, C.panel, 22);
  mono(g, 'Instructions', 1080, 392, 27, C.dim);
  box(g, 1078, 419, 679, 93, '#36585e', 20);
  txt(g, packet.request, 1110, 480, 46, C.white);
  const fields = [
    [
      'Replay',
      packet.event
        ? '#' + packet.event.id + '   /   invoices ' + packet.event.invoices.join(', ')
        : '',
    ],
    ['Branch', packet.checkout],
    ['Verify', packet.verifier],
  ];
  fields.forEach(([label, value], i) => {
    const yy = 578 + i * 79;
    mono(g, label, 1082, yy, 25, C.dim);
    if (value) mono(g, value, 1232, yy, 33, C.teal, { width: 533 });
    else line(g, 1233, yy - 2, 1742, yy - 2, C.edge, 2, [8, 8]);
  });
  if (copied > 0 && copied < 1) {
    const x = lerp(108, 1231, Math.min(1, copied / 0.76)),
      y = lerp(756, 577, Math.max(0, (copied - 0.76) / 0.24));
    box(g, x - 5, y - 38, 177, 50, C.paper, 3);
    mono(g, '#' + duplicate.id, x + 8, y - 1, 32, C.ink);
  }
  if (c.beat.beatIndex === 1)
    caption(
      g,
      'Which replay shows the duplicate?',
      'Compare the invoice IDs after the first and second deliveries.',
    );
  else if (profile)
    caption(g, 'Replay log → event     ·     Repository → branch     ·     Project profile → test');
  else if (copied === 1) caption(g, 'The call has a copy. The replay log keeps the original.');
  else if (!shown) caption(g, 'Ada reopened the billing task. The new chat has no earlier turns.');
}

export function clocks(g, c) {
  const i = c.beat.beatIndex;
  if (i === 0) {
    head(g, 'Working memory', 'What survives the end of a call?');
    slip(g, duplicate, 115, 349, 610, 310);
    overline(g, 'Retained replay', 114, 309);
    const closed = on(c, 0, 'Its prompt goes away');
    overline(g, closed ? 'Application working state' : 'Current model call', 905, 309);
    box(g, 905, 350, 868, 310, C.panel, 13);
    serif(g, closed ? 'Between decisions' : 'Assembled prompt', 947, 445, 60);
    if (!closed) txt(g, 'Instructions  +  Ada’s request  +  replay', 949, 563, 38);
    else {
      mono(g, 'Live result', 947, 545, 28, C.dim);
      txt(g, 'Two invoices', 1247, 546, 43, C.teal);
      if (on(c, 0, 'pin the owner')) {
        mono(g, 'Owner lookup', 947, 614, 28, C.dim);
        txt(g, project.tenant + ' team', 1247, 616, 38);
      }
    }
    caption(
      g,
      closed
        ? 'The application can select this replay for another call.'
        : 'One model call receives the selected evidence.',
    );
    return;
  }
  if (i === 1) {
    head(g, 'Serving cache', 'What can a matching prefix reuse?');
    const doubled = on(c, 1, 'Double the positions'),
      length = doubled ? 8 : 4;
    overline(g, 'Processed prefix positions', 134, 315);
    for (let j = 0; j < 8; j++) {
      const x = 345 + j * 132;
      mono(g, j + 1, x + 43, 394, 30, j < length ? C.white : C.edge, { align: 'center' });
      for (let k = 0; k < 2; k++) {
        box(
          g,
          x,
          430 + k * 117,
          90,
          86,
          j < length ? (k === 0 ? '#8ad8c2' : '#cdbde6') : C.deep,
          7,
          C.edge,
        );
        if (j < length)
          mono(g, (k === 0 ? 'K' : 'V') + (j + 1), x + 45, 486 + k * 117, 34, C.ink, {
            align: 'center',
          });
      }
    }
    serif(g, 'Keys', 107, 489, 46);
    serif(g, 'Values', 107, 606, 46);
    const grid = on(c, 1, 'attention grid');
    if (grid) {
      overline(g, 'Dense pairs', 1462, 365);
      for (let row = 0; row < length; row++)
        for (let col = 0; col < length; col++) {
          box(
            g,
            1465 + col * 28,
            397 + row * 28,
            24,
            24,
            col < 4 && row < 4 ? C.apricot : '#86a9b0',
            2,
          );
        }
      mono(g, '4² = 16   →   8² = 64', 1420, 673, 30, C.white);
    } else {
      mono(g, length + ' positions', 1462, 477, 35, C.teal);
      txt(g, 'Matching prefix', 1463, 536, 31, C.dim);
    }
    caption(
      g,
      'A cache hit reuses the attention state for these tokens.',
      'Retrieving a past event still requires a lookup in retained history.',
    );
    return;
  }
  head(g, 'Memory roles', 'Which record describes an event?');
  const named = [
    on(c, 3, 'episodic memory'),
    on(c, 3, 'semantic knowledge'),
    on(c, 3, 'procedural knowledge'),
  ];
  const roles = [
    ['Pull request 191', 'Two deliveries', 'created two invoices.', 'Episodic'],
    ['Checked retry rule', 'One event should', 'return one invoice.', 'Semantic'],
    ['Verification playbook', 'Replay the event.', 'Compare invoice IDs.', 'Procedural'],
  ];
  roles.forEach(([title, a, b, role], j) => {
    const x = 90 + j * 588;
    paper(g, x, 345, 545, 323);
    overline(g, 'Billing repository', x + 30, 394, true);
    serif(g, title, x + 30, 474, 47, C.ink, { width: 488 });
    line(g, x + 30, 501, x + 509, 501, C.faint, 2, [7, 6]);
    txt(g, a, x + 30, 569, 37, C.ink);
    txt(g, b, x + 30, 622, 37, C.ink);
    if (named[j]) stamp(g, role, x + 24, 747, [C.teal, C.apricot, C.violet][j]);
  });
  const placed = on(c, 3, 'Copy the pull request');
  if (placed) {
    box(g, 90, 791, 1719, 75, C.panel, 8);
    mono(g, 'Next prompt', 113, 838, 30, C.teal);
    txt(g, 'PR 191    /    ' + roles[0][1] + ' ' + roles[0][2], 438, 841, 36);
    stamp(g, roles[0][3], 1550, 839, C.teal);
  } else caption(g, 'Three records can share one database.');
}

export function windowScene(g, c) {
  const fourth = on(c, 1, 'Slide the window'),
    fifth = on(c, 1, 'Add the fifth');
  const count = fifth ? 5 : fourth ? 4 : 3;
  const jump = fifth
    ? ramp(c, 1, 'Add the fifth', 0.55)
    : fourth
      ? ramp(c, 1, 'Slide the window', 0.55)
      : 1;
  const snap = windowAt(jump < 1 ? count - 1 : count),
    long = on(c, 2, 'Replace the last question');
  head(g, 'Conversation window', 'Keep the last three turns verbatim');
  overline(g, 'Historical summary', 95, 316);
  printer(g, 100, 388, 626);
  paper(g, 100, 387, 626, 298);
  overline(g, 'Sourced data', 135, 441, true);
  if (snap.summary.length) {
    txt(g, snap.summary[0].text, 132, 535, 40, C.ink, { font: 'Mono', width: 565 });
    mono(g, 'Source  /  ' + snap.summary[0].id, 132, 612, 32, C.green);
  } else txt(g, 'No overflow yet', 135, 553, 48, C.faint, { font: 'Serif' });
  mono(g, 'Retained originals   ' + (snap.retainedIds.join(' · ') || '—'), 102, 759, 28, C.dim);
  overline(g, 'Active window   /   newest at bottom', 862, 316);
  g.save();
  g.beginPath();
  g.rect(845, 349, 1000, 425);
  g.clip();
  // Keep each complete message on its own line as the three-turn aperture advances.
  const firstOffset = count - 3 - (1 - jump);
  turns.slice(0, count).forEach(({ id, speaker, text }, j) => {
    const y = 370 + (j - firstOffset) * 129;
    paper(g, 860, y, 950, 108);
    mono(g, id + '   /   ' + speaker, 890, y + 35, 26, C.green, { weight: 700 });
    const body = long && id === 'T5' ? 'Pasted test log   /   suite output …' : text;
    txt(g, body, 890, y + 82, 36, C.ink, { width: 886 });
  });
  g.restore();
  caption(
    g,
    long
      ? 'The same turn count can consume many more tokens.'
      : jump < 1
        ? 'T' + count + ' enters the window.'
        : fifth
          ? 'Three raw turns. One sourced event number in the summary.'
          : fourth
            ? 'The assistant’s reply and Ada’s replay result stay word for word.'
            : 'Which of these messages will still be in the window when T4 arrives?',
    long
      ? 'Token budget = instructions + tools + history + retrieval + room for the answer.'
      : undefined,
  );
}

export function lineage(g, c) {
  const extracting = c.beat.beatIndex === 2;
  head(
    g,
    'Release review   /   source lineage',
    extracting
      ? 'Does the proposed field preserve the condition?'
      : 'Which rollout did the reviewer approve?',
  );
  if (extracting) {
    const sides = [
      ['Source message', claim.source],
      ['Extracted request', claim.extracted],
    ];
    sides.forEach(([label, value], i) => {
      const x = 100 + 875 * i;
      paper(g, x, 374, 806, 270);
      overline(g, label, x + 40, 441, true);
      serif(g, '“' + value + '”', x + 40, 563, 72, C.ink, { width: 715 });
    });
    const rejected = on(c, 2, 'Reject the field');
    if (rejected) stamp(g, 'Rejected   /   missing CI condition', 999, 736, C.rose);
    caption(
      g,
      rejected
        ? 'Keep the message. Discard this extraction.'
        : 'Compare the timing of the two requests.',
    );
    return;
  }
  const grouped = on(c, 0, 'two summaries'),
    final = on(c, 0, 'folds those into one');
  const open = on(c, 1, 'Follow the source link'),
    quoted = on(c, 1, 'canary only');
  overline(g, 'Original turns', 90, 298);
  overline(g, 'Group summaries', 660, 298);
  overline(g, 'Final summary', 1260, 298);
  batches.forEach((a, j) => {
    const y = 339 + j * 213;
    a.forEach((_, k) => {
      const id = j * 4 + k + 1,
        x = 91 + k * 112;
      paper(g, x, y + 23, 91, 104, id === 3 && open ? '#afe9d5' : C.shade);
      mono(g, 'R' + id, x + 44, y + 88, 33, C.ink, { align: 'center' });
    });
    if (!grouped) return;
    line(g, 540, y + 76, 646, y + 76, open && j === 0 ? C.teal : C.edge, 3);
    paper(g, 660, y, 430, 145);
    mono(g, 'R' + (j * 4 + 1) + ' – R' + (j * 4 + 4), 685, y + 58, 30, C.green);
    txt(g, a.length + ' messages', 685, y + 112, 35, C.ink);
  });
  if (final) {
    line(g, 1090, 416, 1193, 416, open ? C.teal : C.edge, 3);
    line(g, 1090, 628, 1193, 628, C.edge, 3);
    line(g, 1193, 416, 1193, 628, C.edge, 3);
    line(g, 1193, 522, 1260, 522, open ? C.teal : C.edge, 3);
    paper(g, 1260, 424, 555, 202);
    overline(g, 'Condensed from both groups', 1289, 481, true);
    serif(g, '“Rollout approved”', 1289, 565, 51, C.ink, { width: 492 });
  }
  if (quoted) {
    const src = batches[reviewer.group][reviewer.index];
    box(g, 86, 763, 1728, 65, C.panel, 7);
    mono(g, 'R3', 115, 807, 31, C.teal);
    txt(g, '“' + src + '”', 212, 809, 43, C.white);
  }
  caption(
    g,
    quoted
      ? 'Verify the exact change and current approval before releasing.'
      : final
        ? 'Can this summary support a release to everyone?'
        : 'Eight original messages from the release review.',
  );
}
