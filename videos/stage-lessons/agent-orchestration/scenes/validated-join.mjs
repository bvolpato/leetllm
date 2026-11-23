// Scene `validated-join`: all three results are in. May the request go on?
//
// The picture: the board, with three cards at the barrier and all lamps lit. The tenant of the
// health card turns to tenant9. The gates open, because time is satisfied. The join reads the cards,
// the tenant of health goes red, and its slot refuses the card: no packet. A fresh health card
// passes, and three gauges in the band then show the numbers of the fixture as the voice says them.
import {
  assertEqual,
  beside,
  boxOf,
  column,
  commas,
  dot,
  dynamic,
  fade,
  indicate,
  lagged,
  line,
  moveTo,
  par,
  pictogram,
  place,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { REQUEST, values } from '../../../films/agent-orchestration/fixtures.mjs';
import { canonicalDigest, proposal, RATE_LIMITS as LIMIT, RECEIPTS } from '../packet.mjs';
import { chip, display, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  BAND,
  BRANCHES,
  BRANCH_COLOR,
  MARK,
  OTHER_TENANT,
  QUIET,
  SMALL,
  TENANT,
  VALID,
  WRONG,
  board,
  replaceReceipt,
} from '../parts.mjs';

const [EVAL, HEALTH, POLICY] = [0, 1, 2];
const RATE = {
  eval: values.eval.failures / values.eval.cases,
  health: values.health.errors / values.health.requests,
};
// The numbers that the voice says.
assertEqual(RATE.eval, 0.02, 'the regression rate');
assertEqual(RATE.health, 0.0004, 'the error rate');
assertEqual(Math.round((RATE.health / LIMIT.health) * 10) / 10, 0.4, 'the share of the allowance');
assertEqual(values.policy.maxTraffic, 25, 'the cap of the policy');
const percent = (share) => `${Number((share * 100).toFixed(2))}%`;

// Reuse the join on two snapshots of the same source. Only the failure count changes.
const evalSnapshots = [values.eval, { ...values.eval, failures: 1 }].map((result) => {
  const source = canonicalDigest(result);
  const rows = RECEIPTS.map((row) =>
    row.branch === 'eval' ? { ...row, value: result, digest: source } : row,
  );
  const packet = proposal(rows, REQUEST, { ...values, eval: result });
  return { ...result, rate: result.failures / result.cases, source, packet: packet.evidenceDigest };
});
const reversedEval = Object.fromEntries(Object.entries(values.eval).reverse());
const permuted = RECEIPTS.map((row) =>
  row.branch === 'eval' ? { ...row, value: reversedEval } : row,
).reverse();
assertEqual(
  proposal(permuted).evidenceDigest,
  proposal().evidenceDigest,
  'both orderings keep the same packet',
);
assertEqual(evalSnapshots[0].packet, proposal().evidenceDigest, 'original proposal digest');
assertEqual(
  evalSnapshots.every(({ rate }) => rate <= LIMIT.eval),
  true,
  'both eval sources pass',
);
assertEqual(
  evalSnapshots[0].packet !== evalSnapshots[1].packet,
  true,
  'source change alters the packet',
);
const short = (hash) => `#${hash.slice(0, 4)}`;

export default function validatedJoin(s, c) {
  const b = board(s);
  const { slotNames } = b.nodes;
  s.add(heading(c.title));
  b.enter(c);
  // The scene starts at the barrier: every card is there, and every lamp is lit.
  b.card.forEach((card) => {
    card.pos.set(1);
    card.shown.set(1);
  });
  s.at(c.start - 0.25, () => s.play(...b.gate.map((gate) => gate.lamp.to(1, { duration: 0.25 }))));

  // Beat 0. What is true so far, and the question. The answer waits for the next beat.
  const check = () => pictogram('check', { size: 48, accent: VALID });
  const facts = [
    { mark: check(), words: label('every branch finished') },
    { mark: check(), words: label('expected fields') },
    {
      mark: pictogram('question', { size: 48, color: MARK, accent: MARK }),
      words: label('state contract'),
    },
  ];
  const question = display('Proceed to approval?');
  const answer = display('No packet', { color: WRONG });
  const list = column(
    facts.map((fact) => row([fact.mark, fact.words], { gap: 'normal' })),
    { gap: 'tight' },
  );
  place(column([question, list], { gap: 'normal' }), BAND, 'left');
  place(answer, boxOf(question), 'left');
  const failed = place(pictogram('cross', { size: 48, accent: WRONG }), boxOf(facts[2].mark));
  c.on('intended-tenant', () => s.play(b.hot.tenant.to(1, { duration: 0.3 })));
  c.on('other-tenant', () => s.play(replaceReceipt(b.card[HEALTH], { tenant: OTHER_TENANT })));
  c.show('all-finished', [facts[0].mark, facts[0].words]);
  c.on('all-finished', () =>
    s.play(
      b.hot.tenant.to(0, { duration: 0.3 }),
      lagged(
        b.gate.map((gate) =>
          seq(gate.lamp.to(0.1, { duration: 0.2 }), gate.lamp.to(1, { duration: 0.2 })),
        ),
        { lag: 0.4 },
      ),
    ),
  );
  c.show('expected-fields', [facts[1].mark, facts[1].words]);
  c.on('expected-fields', () =>
    s.play(
      seq(
        par(...[b.hot.tenant, b.hot.rev, b.hot.age].map((heat) => heat.to(1, { duration: 0.3 }))),
        par(...[b.hot.tenant, b.hot.rev, b.hot.age].map((heat) => heat.to(0, { duration: 0.9 }))),
      ),
    ),
  );
  c.show('predict-join', [question, facts[2].mark, facts[2].words]);

  // Beat 1. Time is satisfied: the gates open. The meaning is not: the join refuses the health card.
  c.on('barrier-ok', () =>
    s.play(
      indicate(facts[0].mark, { color: VALID }),
      ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
      ...b.card.map((card) => card.pos.to(2, { duration: 0.9 })),
    ),
  );
  c.after('contract-fails', () =>
    s.play(
      ...b.card.map((card, i) =>
        seq(
          card.read.to(3, { duration: 0.8 }),
          card.verdict.to(i === HEALTH ? -1 : 1, { duration: 0.3 }),
        ),
      ),
    ),
  );
  c.swap('contract-fails', [question, facts[2].mark], [answer, failed], { after: true });
  c.on('reject-scope', () => s.play(b.card[HEALTH].pos.to(1, { duration: 0.8 })));

  // The other reasons to refuse a card, and the order of the packet: by name, not by arrival.
  const reasons = [
    'cross-tenant',
    'duplicate branch',
    'missing evidence',
    'stale version',
    'source mismatch',
  ].map((words) => chip(words, { color: WRONG, stroke: WRONG }));
  const tag = (lane) =>
    chip(BRANCHES[lane], { color: BRANCH_COLOR[lane], stroke: BRANCH_COLOR[lane], minWidth: 130 });
  const arrived = [POLICY, EVAL, HEALTH].map(tag);
  const order = {
    arrived: note('incoming receipts'),
    sorted: note('order of the packet: by name'),
  };
  const refusals = column(
    [row(reasons.slice(0, 3), { gap: 'tight' }), row(reasons.slice(3), { gap: 'tight' })],
    { gap: 'tight' },
  );
  const sortRow = row(arrived, { gap: 'normal' });
  const refuseNote = note('the join refuses');
  place(
    column([refuseNote, refusals, order.arrived, sortRow], { gap: 'normal' }),
    BAND,
    'top left',
  );
  beside(order.sorted, sortRow, 'above', 'normal', 'left');
  c.swap(
    'reason-duplicate',
    [
      answer,
      failed,
      ...facts.slice(0, 2).flatMap((fact) => [fact.mark, fact.words]),
      facts[2].words,
    ],
    [refuseNote, reasons[0], reasons[1]],
    { after: true },
  );
  ['reason-missing', 'reason-stale', 'reason-source'].forEach((cue, i) =>
    c.show(cue, reasons[i + 2], { after: true }),
  );
  // Policy came first. In the packet it is last: the cards sort by the name of their branch.
  const places = arrived.map((node) => boxOf(node).point('center'));
  c.hide('matching-receipts', [refuseNote, ...reasons], { after: true });
  c.show('valid-identities', [order.arrived, ...arrived]);
  c.after('valid-identities', () =>
    s.play(
      seq(
        fade(arrived[0], 0, { duration: 0.25 }),
        par(
          moveTo(arrived[1], places[0], { duration: 0.5 }),
          moveTo(arrived[2], places[1], { duration: 0.5 }),
        ),
        moveTo(arrived[0], places[2], { duration: 0.05 }),
        fade(arrived[0], 1, { duration: 0.25 }),
      ),
    ),
  );
  c.swap('arrived-first', order.arrived, order.sorted);
  c.on('arrived-first', () =>
    s.play(
      lagged(
        slotNames.map((name, i) => indicate(name, { color: BRANCH_COLOR[i], scale: 1.15 })),
        { lag: 0.4 },
      ),
    ),
  );

  // Two encodings of the same observation. Order the fields on both rows before showing their hash.
  const [jsonHeading, copyA, copyB, hashRoom] = BAND.rows([1, 2, 2, 1], 'tight');
  const keyTitle = place(label('Evaluation receipt', { size: 38 }), jsonHeading, 'left');
  const keyRows = [copyA, copyB].map((room, i) => {
    const [nameRoom, first, second] = room.columns([1, 2, 2], 'wide');
    const name = place(note(i ? 'Copy B' : 'Copy A'), nameRoom, 'left');
    const failures = place(
      chip('failures  ' + values.eval.failures, { stroke: BRANCH_COLOR[EVAL] }),
      first,
    );
    const cases = place(chip('cases  ' + values.eval.cases), second);
    return { name, failures, cases, first, second };
  });
  const rowParts = keyRows.flatMap(({ name, failures, cases }) => [name, failures, cases]);
  const exchange = ({ failures, cases, first, second }) =>
    par(
      seq(
        moveTo(failures, [first.cx, first.cy - 24], { duration: 0.18 }),
        moveTo(failures, [second.cx, second.cy - 24], { duration: 0.48 }),
        moveTo(failures, [second.cx, second.cy], { duration: 0.18 }),
      ),
      seq(
        moveTo(cases, [second.cx, second.cy + 24], { duration: 0.18 }),
        moveTo(cases, [first.cx, first.cy + 24], { duration: 0.48 }),
        moveTo(cases, [first.cx, first.cy], { duration: 0.18 }),
      ),
    );
  const sameHash = place(
    mono(
      'Packet A  ' +
        short(proposal().evidenceDigest) +
        '   =   Packet B  ' +
        short(proposal(permuted).evidenceDigest),
      { color: VALID, size: 38 },
    ),
    hashRoom,
    'left',
  );
  c.swap('json-fields', [order.sorted, ...arrived], [keyTitle, ...rowParts]);
  c.on('swap-fields', () => s.play(exchange(keyRows[1])));
  c.on('canonical-fields', () => s.play(exchange(keyRows[0])));
  c.show('same-digest', sameHash, { after: true });

  c.on('matching-receipts', () =>
    s.play(
      seq(
        b.card[HEALTH].shown.to(0, { duration: 0.25 }),
        par(
          b.card[HEALTH].tenant.to(TENANT, { duration: 0 }),
          b.card[HEALTH].read.to(0, { duration: 0.05 }),
          b.card[HEALTH].verdict.to(0, { duration: 0.05 }),
        ),
        b.card[HEALTH].shown.to(1, { duration: 0.25 }),
        b.card[HEALTH].pos.to(2, { duration: 0.7 }),
        b.card[HEALTH].read.to(3, { duration: 0.6 }),
      ),
    ),
  );
  c.after('matching-receipts', () => b.card[HEALTH].verdict.set(1));
  // Three gauges, one for each check. The mark on each track is the limit.
  const GAUGE = { left: BAND.left + 340, width: 360, height: 28, limitAt: 0.75 };
  const rowY = (i) => BAND.top + 62 + i * 100;
  const limitX = GAUGE.left + GAUGE.width * GAUGE.limitAt;
  const afterX = GAUGE.left + GAUGE.width + 20;
  /** How far each value is on its way to its limit. */
  const share = [RATE.eval / LIMIT.eval, RATE.health / LIMIT.health];
  const fill = BRANCHES.map(() => s.value(0));
  const askedShown = s.value(0);
  const names = BRANCHES.map((branch, i) =>
    label(branch, BAND.left, rowY(i), { size: 36, color: BRANCH_COLOR[i], anchor: 'left' }),
  );
  const tracks = BRANCHES.map((_, i) =>
    rect(GAUGE.width, GAUGE.height, { radius: 6, stroke: 'faint', width: 2, fill: null }).at(
      GAUGE.left + GAUGE.width / 2,
      rowY(i),
    ),
  );
  const marks = BRANCHES.map((_, i) =>
    line([limitX, rowY(i) - GAUGE.height / 2 - 6], [limitX, rowY(i) + GAUGE.height / 2 + 6], {
      stroke: 'ink',
      width: 3,
    }),
  );
  const text = (words, x, y, options = {}) => mono(words, { size: SMALL, ...options }).at(x, y);
  const counts = [
    text(`${values.eval.failures} / ${values.eval.cases}`, GAUGE.left - 20, rowY(EVAL), {
      anchor: 'right',
    }),
    text(
      `${values.health.errors} / ${commas(values.health.requests)}`,
      GAUGE.left - 20,
      rowY(HEALTH),
      { anchor: 'right' },
    ),
  ];
  const limits = [
    text(percent(LIMIT.eval), limitX, rowY(EVAL) - 45, { color: QUIET }),
    text(percent(LIMIT.health), limitX, rowY(HEALTH) - 45, { color: QUIET }),
    text(`${values.policy.maxTraffic}%`, limitX, rowY(POLICY) - 45, { color: QUIET }),
  ];
  const rates = [
    mono(percent(RATE.eval), { size: 36, anchor: 'left', color: MARK }).at(afterX, rowY(EVAL)),
    mono(percent(RATE.health), { size: 36, anchor: 'left', color: MARK }).at(afterX, rowY(HEALTH)),
  ];
  const healthX = GAUGE.left + GAUGE.width * GAUGE.limitAt * share[HEALTH];
  rates[HEALTH].at(healthX, rowY(HEALTH) + 39);
  const burn = mono(`${Number(share[HEALTH].toFixed(1))}×`, {
    size: 40,
    anchor: 'left',
    color: MARK,
  }).at(afterX, rowY(HEALTH));
  const passes = BRANCHES.map((_, i) =>
    pictogram('check', { size: 44, accent: VALID }).at(afterX + 22, rowY(i) + 44),
  );
  const gauges = dynamic(() => {
    const parts = [];
    const traffic = b.request.traffic.value;
    BRANCHES.forEach((_, i) => {
      const part = i === POLICY ? traffic / values.policy.maxTraffic : share[i];
      const width = Math.max(0, part) * GAUGE.limitAt * GAUGE.width * fill[i].value;
      if (width > 1)
        parts.push(
          rect(width, GAUGE.height - 8, {
            radius: 4,
            stroke: null,
            fill: BRANCH_COLOR[i],
            opacity: 0.92,
          }).at(GAUGE.left + width / 2, rowY(i)),
        );
    });
    if (askedShown.value > 0.02 && traffic < 0)
      parts.push(
        rect(16, GAUGE.height - 8, { radius: 4, stroke: null, fill: WRONG }).at(
          GAUGE.left - 12,
          rowY(POLICY),
        ),
      );
    if (askedShown.value > 0.02)
      parts.push(
        mono(`${traffic}%`, {
          size: 36,
          anchor: 'left',
          color: traffic < 0 ? WRONG : MARK,
        })
          .at(afterX, rowY(POLICY))
          .opacity(askedShown.value),
      );
    return parts;
  });
  s.add(gauges);
  c.swap('numerical-rules', [keyTitle, ...rowParts, sameHash], [...names, ...tracks]);
  c.on('rates-inside', () => s.play(indicate([names[EVAL], names[HEALTH]], { color: MARK })));
  c.on('policy-allows', () => s.play(indicate(names[POLICY], { color: MARK })));
  const madeUp = place(note('fictional thresholds'), BAND, 'bottom left');
  c.show('fictional', madeUp);

  // Beat 3. The numbers, as the voice says them: a count, its rate, and the limit at the mark.
  c.show('validated-join-construct-3', counts[EVAL]);
  c.show('join-eval-rate', rates[EVAL], { lead: 0 });
  c.after('join-eval-rate', () => fill[EVAL].set(1));
  c.show('eval-limit', [marks[EVAL], limits[EVAL], passes[EVAL]]);
  c.show('health-count', counts[HEALTH]);
  c.show('join-health-rate', rates[HEALTH], { lead: 0 });
  c.on('join-health-rate', () => s.play(fill[HEALTH].to(1, { duration: 0.6 })));
  c.show('health-allowance', [marks[HEALTH], limits[HEALTH]], { lead: 0 });
  c.show('burn-share', [burn, passes[HEALTH]], { lead: 0 });
  c.show('policy-cap', [marks[POLICY], limits[POLICY], passes[POLICY]], { after: true });
  c.after('policy-cap', () => {
    fill[POLICY].set(1);
    askedShown.set(1);
  });
  const awaiting = place(note('Awaiting review', { color: MARK }), BAND, 'bottom left');
  c.swap('ready-review', madeUp, awaiting);
  c.on('ready-review', () =>
    s.play(seq(b.packet.seal.to(1, { duration: 0.4 }), b.token.shown.to(1, { duration: 0.3 }))),
  );
  // A request of minus one is under the cap. Only a rule for the whole range refuses it.
  const upper = text(`traffic <= ${values.policy.maxTraffic}`, 0, 0, {
    anchor: 'left',
    color: VALID,
  });
  const range = text('int: 0 <= traffic <= 100', 0, 0, { anchor: 'left', color: VALID });
  const outside = text('int: 0 <= traffic <= 100', 0, 0, { anchor: 'left', color: WRONG });
  const rangeMark = pictogram('cross', { size: 40, accent: WRONG });
  place(row([upper, range, rangeMark], { gap: 'wide' }), BAND, 'bottom left');
  place(outside, boxOf(range), 'left');
  c.swap('in-range', awaiting, [upper, range]);
  c.on('in-range', () =>
    s.play(b.packet.seal.to(0, { duration: 0.2 }), b.token.shown.to(0, { duration: 0.2 })),
  );
  c.hide('negative-reset', [upper, range, passes[POLICY]], { lead: 0.2, fade: 0.2 });
  c.on('negative-reset', () => {
    b.request.traffic.set(-1);
    askedShown.set(1);
    fill[POLICY].set(0);
  });
  c.after('minus-one', () => {
    askedShown.set(1);
    fill[POLICY].set(1);
  });
  c.show('minus-one', [upper, outside, rangeMark], { after: true });
  // Keep the release and request fixed. Follow the changed eval count through both hashes.
  const [captionRow, headerRow, previousRow, refreshedRow] = BAND.rows([2, 1, 2, 2], 'tight');
  const caption = place(
    label(`Same release ${REQUEST.release} / v${REQUEST.version} / ${REQUEST.traffic}%`, {
      size: 36,
    }),
    captionRow,
    'left',
  );
  const columns = (region) => region.columns([3, 2, 2, 2], 'normal');
  const headers = [
    'eval source',
    `rate ≤ ${percent(LIMIT.eval)}`,
    'source hash',
    'packet hash',
  ].map((words, i) => place(note(words), columns(headerRow)[i], 'left'));
  const rows = evalSnapshots.map((sample, i) => {
    const cells = columns(i === 0 ? previousRow : refreshedRow);
    return [
      place(
        mono(`${sample.failures} / ${sample.cases}`, { size: 40, color: BRANCH_COLOR[EVAL] }),
        cells[0],
        'left',
      ),
      place(mono(percent(sample.rate), { size: 40, color: VALID }), cells[1], 'left'),
      place(mono(short(sample.source), { size: 36 }), cells[2], 'left'),
      place(mono(short(sample.packet), { size: 36, color: MARK }), cells[3], 'left'),
    ];
  });
  const hashPath = [0, 2, 3].map((i) => boxOf(rows[1][i]).cx);
  const hashY = boxOf(rows[1][0]).bottom + 15;
  const scan = s.value(0);
  const trace = dynamic(() => {
    const fraction = scan.value;
    const part = fraction >= 1 ? 1 : 0;
    const x = hashPath[part] + (hashPath[part + 1] - hashPath[part]) * (fraction - part);
    const path =
      x > hashPath[0] + 1
        ? [line([hashPath[0], hashY], [x, hashY], { stroke: BRANCH_COLOR[EVAL], width: 4 })]
        : [];
    return [...path, dot(9, MARK).at(x, hashY)];
  });
  const sourceRefresh = c.cue('source-refresh');
  const negativeCaseHold = 1.6;
  const sourceStart = Math.max(sourceRefresh.start, c.cue('minus-one').end + negativeCaseHold);
  const sourceFade = 0.2;
  c.hide(
    'source-refresh',
    [
      ...names,
      ...tracks,
      ...marks,
      ...counts,
      ...limits,
      ...rates,
      passes[EVAL],
      passes[HEALTH],
      burn,
      gauges,
      upper,
      outside,
      rangeMark,
    ],
    { lead: sourceRefresh.start - sourceStart, fade: sourceFade },
  );
  // Restore the fixture request when the negative verdict has cleared.
  const comparisonStart = sourceStart + sourceFade;
  s.at(comparisonStart, () => b.request.traffic.set(REQUEST.traffic));
  c.show('source-refresh', [caption, ...headers, ...rows[0], rows[1][0], trace], {
    lead: sourceRefresh.start - comparisonStart,
  });
  c.on('source-refresh', () => s.play(indicate(slotNames[EVAL], { color: MARK, scale: 1 })));
  c.show('thresholds-still-pass', rows[1][1], { after: true });
  c.show('thresholds-still-pass', rows[1][2], { after: true, lead: -0.25 });
  const threshold = c.cue('thresholds-still-pass');
  c.on('thresholds-still-pass', () =>
    s.play(scan.to(1, { duration: threshold.end - threshold.start })),
  );
  c.show('digests', rows[1][3], { after: true, fade: 0.16 });
  const digestCue = c.cue('digests');
  c.on('digests', () =>
    s.play(
      scan.to(2, { duration: digestCue.end - digestCue.start }),
      indicate(b.nodes.packetFrame, { color: MARK, scale: 1 }),
    ),
  );

  b.leave(c);
}
