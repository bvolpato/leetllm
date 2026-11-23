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
  ramp,
  on,
  head,
  caption,
  printer,
} from './print-room.mjs';
import {
  events,
  signals,
  contributions,
  rankWeights,
  reads,
  frequencyScore,
  project,
  records,
  exclusion,
  allowed,
  queueAt,
  followSummaryLink,
  queueBudget,
  pref,
  approval,
  admit,
} from './memory.mjs';

export function ranking(g, c) {
  const colors = [C.violet, C.teal, C.apricot];
  if (c.beat.beatIndex >= 3) {
    head(g, 'Retrieval score   /   stress test', 'Can a million reads beat a relevant replay?');
    const change = on(c, 3, 'replace importance'),
      result = on(c, 4, 'Frequency alone');
    overline(g, 'Irrelevant record', 90, 303);
    paper(g, 90, 348, 747, 324);
    for (const [i, [label, value]] of [
      ['Similarity', '0'],
      ['Recency', '0'],
      [change ? 'Read count' : 'Importance', change ? reads.toLocaleString('en-US') : '0'],
    ].entries()) {
      const y = 425 + i * 92;
      txt(g, label, 125, y, 38, C.ink);
      mono(g, value, 787, y, 37, C.ink, { align: 'right' });
      if (i < 2) line(g, 125, y + 26, 792, y + 26, '#a8afa2');
    }
    const x = 950,
      y = 559,
      unit = 265;
    overline(
      g,
      change ? 'Replace importance with log frequency' : 'Chosen weights and bounded inputs',
      950,
      303,
    );
    mono(
      g,
      change ? '0.2 × ln(1 + 1,000,000)' : '0.5 S  +  0.3 R  +  0.2 I',
      950,
      398,
      38,
      C.white,
    );
    for (let k = 0; k <= 3; k++) {
      line(g, x + k * unit, y - 16, x + k * unit, y + 18, k === 1 ? C.rose : C.edge, 3);
      mono(g, k, x + k * unit, y + 62, 27, C.dim, { align: 'center' });
    }
    line(g, x, y, x + 3 * unit, y, C.dim, 3);
    line(g, x + unit, y - 104, x + unit, y + 18, C.rose, 2, [6, 7]);
    txt(g, 'Bounded maximum', x + unit, y - 119, 27, C.rose, { align: 'center' });
    if (result) {
      box(g, x, y - 28, unit * frequencyScore, 22, C.apricot, 3);
      dot(g, x + unit * frequencyScore, y - 17, 12, C.apricot);
      mono(g, frequencyScore.toFixed(3), x + unit * frequencyScore, y - 67, 45, C.apricot, {
        align: 'center',
      });
    }
    caption(
      g,
      result
        ? 'Repeated reads can push the score past one.'
        : 'If each signal stays in [0, 1], the weighted score stays in [0, 1].',
      result
        ? 'Normalize or cap the count before putting it into a bounded ranking rule.'
        : undefined,
    );
    return;
  }
  head(g, 'Eligible replays   /   ranking', 'Which replay leads as we add each signal?');
  const weights = rankWeights;
  const wording = ramp(c, 0, 'Give normalized similarity', 0.85);
  const age = ramp(c, 1, 'Add the age contributions', 1.35);
  const imp = ramp(c, 2, 'Add the last segments', 1.1);
  const p = [wording, age, imp];
  const x = 640,
    scale = 1100;
  ['Wording', 'Age', 'Importance'].forEach((name, i) => {
    const xx = 642 + i * 367;
    box(g, xx, 269, 24, 24, colors[i], 3);
    txt(g, name + ' × ' + weights[i].toFixed(1), xx + 40, 292, 32, C.white);
  });
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    const xx = x + v * scale;
    line(g, xx, 364, xx, 744, C.edge, 1.4, [4, 9]);
    mono(g, v.toFixed(2), xx, 346, 24, C.dim, { align: 'center' });
  });
  events.forEach((e, i) => {
    const y = 407 + i * 197,
      ss = signals(e);
    paper(g, 89, y - 9, 499, 141, i === 0 ? '#cceada' : C.paper);
    mono(
      g,
      '#' + e.id + '   /   ' + (e.days === 1 ? 'YESTERDAY' : '14 DAYS AGO'),
      115,
      y + 35,
      26,
      C.faint,
    );
    serif(g, i === 0 ? 'Same event' : 'Different retry', 115, y + 100, 48, C.ink);
    const values = contributions(e),
      parts = values.map((v, k) => v * p[k]);
    let partial = 0;
    const sum = parts.reduce((a, b) => a + b, 0);
    mono(
      g,
      'S ' + ss[0].toFixed(2) + '     R ' + ss[1].toFixed(3) + '     I ' + ss[2].toFixed(2),
      x + 4,
      y + 24,
      25,
      C.dim,
    );
    box(g, x, y + 51, scale, 48, C.deep, 3);
    parts.forEach((part, k) => {
      if (part > 0) box(g, x + scale * partial, y + 51, scale * part, 48, colors[k]);
      partial += part;
    });
    if (wording > 0) {
      const end = x + sum * scale;
      line(g, end, y + 47, end, y + 109, C.white, 3);
      const labelX = Math.max(602, end - 123);
      box(g, labelX, y + 108, 246, 53, C.panel, 6);
      mono(g, '#' + e.id + '  ' + sum.toFixed(3), labelX + 123, y + 145, 28, C.white, {
        align: 'center',
      });
    }
  });
  const scoreRule = 'Normalized S, R, I in [0, 1]   ·   Age signal R = 2^(−days / 7)';
  let active = 'Both replay records passed the access and source checks.';
  if (imp === 1) active = 'Final score   /   0.5 × wording + 0.3 × age + 0.2 × importance';
  else if (imp > 0)
    active =
      'Running subtotal   /   ' + Math.round(100 * imp) + '% of each importance contribution added';
  else if (age === 1) active = 'Age moves yesterday’s replay ahead.';
  else if (age > 0)
    active = 'Running subtotal   /   ' + Math.round(100 * age) + '% of each age contribution added';
  else if (wording === 1) active = 'Wording alone puts the older retry ahead.';
  else if (wording > 0)
    active =
      'Running subtotal   /   ' +
      Math.round(100 * wording) +
      '% of each wording contribution added';
  caption(g, active, scoreRule);
}

export function scope(g, c) {
  const current = c.beat.beatIndex;
  const progress = (beat, phrase) => {
    if (current !== beat) return Number(current > beat);
    const { start, end } = c.wordCue(phrase);
    return c.reveal(phrase, end - start, { captionStart: phrase });
  };
  const billing = progress(1, 'Both billing replays pass');
  const outside = progress(1, 'The payments incident stays private') === 1;
  const exceptions = progress(1, 'The host also excludes the expired review') === 1;
  const switching = progress(2, 'Switch tenants on a pooled connection') === 1;
  const cleared = progress(2, 'Clear the previous transaction’s scope') === 1;
  const bound = progress(2, 'Now bind the payments session') === 1;
  const payments = progress(2, 'This Ada sees her own incident');
  const session = bound ? { ...project, tenant: 'Payments' } : cleared ? null : project;
  const admitted = allowed(session);
  const moved = bound ? payments : cleared ? 0 : billing;
  const gate = 1130;

  head(
    g,
    'Read policy   /   before ranking',
    switching ? 'Which rows can this connection return?' : 'Which rows may enter billing Ada’s search?',
    session ? session.tenant.toUpperCase() + '   /   WEBHOOK' : 'NO AUTHENTICATED SCOPE',
  );
  overline(g, 'Fixed inventory   /   host view', 93, 276);
  overline(g, 'Policy gate', gate, 276, false);
  overline(g, 'Authenticated session', 1303, 276);
  serif(g, session ? session.tenant + ' / ' + session.user : 'Scope cleared', 1302, 331, 47, session ? C.white : C.rose);

  const gateX = gate + 65;
  line(g, gateX, 356, gateX, 773, session ? C.edge : C.rose, 3, [9, 7]);
  for (const [j, r] of records.entries()) {
    const y = 356 + j * 69;
    const mid = y + 29;
    const pass = admitted.includes(r);
    const denied = !pass && (cleared || (j === 2 ? outside : exceptions));
    const reason = denied ? (session ? exclusion(r, session) : 'No scope bound') : '';

    box(g, 89, y, 925, 57, pass && moved === 1 ? '#284c49' : C.panel, 5);
    mono(g, r.tenant, 109, y + 37, 27, C.dim);
    txt(g, r.name, 275, y + 38, 31, C.white);
    mono(g, r.mark, 602, y + 37, 26, C.dim);
    if (reason) txt(g, reason, 766, y + 37, 27, C.rose, { width: 225 });
    else if (pass && moved === 1) txt(g, 'Eligible', 766, y + 37, 27, C.teal);

    line(g, 1014, mid, 1286, mid, C.edge, 2, [6, 9]);
    if (denied) {
      line(g, 1014, mid, gateX - 12, mid, C.rose, 2);
      dot(g, gateX, mid, 11, C.deep);
      line(g, gateX - 5, mid - 5, gateX + 5, mid + 5, C.rose, 3);
      line(g, gateX - 5, mid + 5, gateX + 5, mid - 5, C.rose, 3);
    }
    if (pass && moved) {
      const front = 1014 + 271 * moved;
      line(g, 1014, mid, front, mid, C.teal, 4);
      dot(g, front, mid, 7, C.teal);
      if (moved === 1) {
        paper(g, 1302, y - 1, 494, 59);
        mono(g, r.name, 1326, y + 38, 31, C.ink, { width: 443 });
      }
    }
  }

  const returned = moved === 1 ? admitted.length : 0;
  if (returned || cleared && !bound) {
    const rowCount = returned === 1 ? '1 private row admitted' : returned + ' private rows admitted';
    mono(g, rowCount, 1302, 804, 30, returned ? C.teal : C.apricot);
  }
  line(g, 85, 815, 1835, 815, C.edge);
  const note = current === 3
    ? 'Retrieved text is historical evidence. Check current policy before acting.'
    : bound
      ? payments === 1 ? 'Same username. The new scope admits a different record.' : 'New scope bound. Check the unchanged inventory.'
      : cleared
        ? 'Between transactions the connection has no private scope.'
        : billing === 1
          ? 'Only eligible records reach the ranker. The closest wording is outside this scope.'
          : 'Compare the signed-in scope with the owner of the 0.99 match.';
  txt(g, note, 86, 864, 34, C.white, { width: 1740 });
}

export function paging(g, c) {
  const i = c.beat.beatIndex;
  if (i === 2) {
    head(g, 'Context budget   /   example token counts', 'How much room is left for the answer?');
    const previous = on(c, 2, 'queue used to take'),
      current = on(c, 2, 'After folding'),
      counted = on(c, 2, 'Four hundred tokens');
    const x = 425,
      width = 1320;
    ['Instructions, tools, core', 'Message queue', 'Answer space'].forEach((s, j) => {
      const xx = [425, 1072, 1500][j];
      box(g, xx, 287, 25, 25, [C.violet, C.teal, C.apricot][j]);
      txt(g, s, xx + 38, 311, 32);
    });
    [false, true].forEach((folded, j) => {
      const y = 445 + j * 202,
        model = queueBudget(folded),
        show = j === 0 ? previous : current;
      serif(g, folded ? 'After folding' : 'Before folding', 88, y + 61, 43);
      box(g, x, y, width, 87, C.deep, 3, C.edge);
      if (!show) return;
      let offset = 0;
      [model.fixed, model.queue, model.free].forEach((n, k) => {
        const w = (n * width) / model.window;
        if (!folded || k !== 2 || counted) {
          box(g, x + offset, y, w - 2, 87, [C.violet, C.teal, C.apricot][k]);
          mono(g, String(n), x + offset + w / 2, y + 59, 36, C.ink, { align: 'center' });
        }
        offset += w;
      });
    });
    caption(
      g,
      'Example model window   /   1,000 tokens',
      counted
        ? 'The queue shrank by 300 tokens. The same 300 are now available for the response.'
        : 'Budget the instructions, tools, core block, queue and response together.',
    );
    return;
  }
  if (i < 2) {
    const copied = on(c, 0, 'copies the replay'),
      folded = on(c, 1, 'folds the first three');
    head(
      g,
      'MemGPT   /   page movement',
      folded ? 'Where can we find T2 after the fold?' : 'What does an archive copy free?',
    );
    const q = queueAt(copied, folded);
    overline(g, 'Message queue   /   active context', 90, 305);
    const historyShown = on(c, 1, 'Recall storage keeps');
    const linked = on(c, 1, 'turn two') ? followSummaryLink(q, 'T2') : undefined;
    const width = 200;
    q.queue.forEach((id, j) => {
      const x = 90 + j * 219;
      paper(g, x, 368, width, 219, id === 'T3' || id === 'Σ' ? '#cdecd9' : C.paper);
      mono(g, id, x + 25, 452, 46, C.ink);
      txt(
        g,
        id === 'Σ' ? q.summaryLinks[0] + ' to ' + q.summaryLinks.at(-1) : id === 'T3' ? 'Replay' : 'Raw turn',
        x + 25,
        526,
        30,
        C.faint,
      );
    });
    if (historyShown) {
      overline(g, 'Recall storage', 772, 305);
      box(g, 770, 368, 504, 219, C.panel, 10, C.edge);
      txt(g, 'Retained message history', 792, 411, 32, C.white);
      q.recall.forEach((turn, j) => {
        const x = 792 + j * 94, selected = turn.id === linked?.id;
        box(g, x, 433, 80, 46, selected ? C.teal : C.deep, 5);
        mono(g, turn.id, x + 40, 466, 27, selected ? C.ink : C.dim, { align: 'center' });
      });
      if (linked) {
        mono(g, linked.id + '   /   ' + linked.speaker, 792, 522, 27, C.teal);
        txt(g, linked.text, 792, 565, 35, C.white, { width: 456 });
        line(g, 190, 588, 190, 627, C.teal, 3);
        line(g, 190, 627, 926, 627, C.teal, 3);
        line(g, 926, 627, 926, 592, C.teal, 3);
        line(g, 916, 603, 926, 592, C.teal, 3);
        line(g, 936, 603, 926, 592, C.teal, 3);
      }
    }
    overline(g, 'Archival storage', 1355, 305);
    printer(g, 1361, 367, 405);
    if (q.archive.length) {
      paper(g, 1361, 367, 405, 219);
      mono(g, q.archive[0].id + '   /   copy', 1390, 447, 38, C.ink);
      txt(g, 'Replay returned', 1390, 516, 32, C.faint);
      txt(g, 'two invoices', 1390, 554, 32, C.faint);
    }
    const queueEdge = historyShown ? 749 : 1240;
    line(g, queueEdge, 307, queueEdge, historyShown ? 589 : 717, C.edge, 2, [6, 8]);
    if (on(c, 1, 'All five')) {
      mono(g, q.queue.length + ' entries in the queue', 92, 702, 42, C.teal);
      mono(g, q.archive.length + ' archived here', 1362, 702, 33, C.dim);
    }
    caption(
      g,
      folded
        ? 'One linked summary and two verbatim turns remain.'
        : 'A lookup can bring a bounded page back into a later prompt.',
    );
    return;
  }
  const admitted = on(c, 3, 'The verifier passes'),
    offered = on(c, 3, 'proposes storing merge approval'),
    denied = on(c, 4, 'host refuses');
  head(g, 'Core memory   /   host write policy', 'Which fields can this message change?');
  overline(g, 'Developer statement   /   Ada in billing', 92, 303);
  paper(g, 90, 349, 982, 424);
  const write = offered ? approval : pref;
  overline(g, 'Proposed field', 123, 412, true);
  mono(g, write.field, 123, 484, 46, C.ink);
  line(g, 123, 519, 1035, 519, C.faint, 2, [6, 6]);
  mono(g, write.value, 123, 578, 37, C.ink);
  txt(g, 'Retention   /   ' + write.retention + ' days', 123, 652, 33, C.faint);
  if (denied && !admit(write, project)) stamp(g, 'Field blocked', 128, 726, C.amber);
  else if (admitted && !offered) stamp(g, 'Write admitted', 128, 726, C.green);
  overline(g, 'Scoped project profile', 1190, 303);
  const stored = admitted && admit(pref, project) ? [pref] : [];
  serif(g, String(stored.length), 1188, 520, 180, C.teal);
  txt(g, stored.length === 1 ? 'saved preference' : 'saved preferences', 1196, 589, 42, C.white);
  if (stored.length) mono(g, stored[0].value, 1197, 676, 31, C.dim);
  caption(
    g,
    denied
      ? 'Merge approval stays with the current policy service.'
      : offered
        ? 'Will the proposed authorization field change the stored count?'
        : 'Host checks scope, source, allowed field, size and retention.',
  );
}
