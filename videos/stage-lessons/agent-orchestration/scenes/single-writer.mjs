// Scene `single-writer`: an approval binds one exact packet, and one writer applies it.
//
// The picture: the board with a sealed packet. The token docks at approval, and the record in the
// band shows what the stamp binds. The live revision of the target turns to v4: the writer refuses
// the token, and the gauge does not move. Explicitly assumed v4 evidence enters as supplied fixture
// receipts. The picture does not fetch source records. A fresh stamp names the new digest, and the
// target simulates an effect. Then the reply is lost: the same key goes again, and the
// ledger of the target returns the first result, with one effect.
import {
  arrow,
  assertEqual,
  beside,
  boxOf,
  column,
  connector,
  delay,
  dot,
  draw,
  dynamic,
  indicate,
  lagged,
  line,
  linear,
  par,
  pictogram,
  place,
  pulse,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { REQUEST } from '../../../films/agent-orchestration/fixtures.mjs';
import {
  freshPacket,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
} from '../packet.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { BAND, CORNER, DIGEST, MARK, QUIET, SMALL, STATE, VALID, WRONG, board } from '../parts.mjs';

// What the model of the lesson says about the write: one effect, and the same result for a replay.
assertEqual(recordedEffects, 1, 'the effects after the first write');
assertEqual(reconciledEffects, 1, 'the effects after the replay');
assertEqual(reconciled, recorded, 'the result of the replay');
const OLD = REQUEST.version,
  NEW = freshPacket.version;

export default function singleWriter(s, c) {
  const b = board(s);
  const { steps, writer, targetFrame } = b.nodes;
  // The scene starts after the join: the three cards are in their slots, and the join took them.
  b.card.forEach((card) => {
    card.pos.set(2);
    card.shown.set(1);
    card.read.set(3);
    card.verdict.set(1);
  });

  // The band: what the approval binds (left), what the writer keeps (middle), the ledger of the target (right).
  const [recordSide, writerSide, ledgerSide] = BAND.columns([31, 24, 33], 'wide');

  // The fixture requires the approval flag and matches the packet fields.
  const LINES = ['approved', 'tenant', 'request', 'release', 'revision', 'traffic', 'digest'];
  const lineY = (i) => recordSide.top + 78 + i * 44;
  const record = { rev: s.value(OLD), broken: s.value(0), shown: s.value(0) };
  const recordExtra = 24;
  const recordFrame = rect(recordSide.width + recordExtra, recordSide.height, {
    radius: 14,
    stroke: QUIET,
    width: 2.5,
    fill: null,
  }).at(recordSide.cx + recordExtra / 2, recordSide.cy);
  const recordTitle = label('Fixture approval', recordSide.left + 20, recordSide.top + 30, {
    size: 36,
    anchor: 'left',
  });
  const lineNames = LINES.map((words, i) =>
    note(words, { anchor: 'left' }).at(recordSide.left + 20, lineY(i)),
  );
  const valueX = recordSide.right + recordExtra - 16;
  const bound = dynamic(() => {
    const opacity = record.shown.value;
    if (opacity < 0.02) return [];
    const rev = Math.round(record.rev.value);
    const text = (words, i, color = VALID) =>
      mono(words, { size: SMALL, anchor: 'right', color }).at(valueX, lineY(i)).opacity(opacity);
    return [
      text('true', 0),
      text(REQUEST.tenant, 1),
      text(REQUEST.request, 2),
      text(REQUEST.release, 3),
      text(`v${rev}`, 4),
      text(`${REQUEST.traffic}%`, 5),
      text(DIGEST[rev], 6, record.broken.value > 0.5 ? WRONG : VALID),
    ];
  });

  // The ledger of the target: one line for each operation that it applied.
  const ledger = {
    title: label('Fixture ledger', { size: 36 }),
    key: mono(recorded.operation, { size: SMALL }),
    result: mono(recorded.change, { size: SMALL, color: VALID }),
    effects: note('effects'),
    count: mono(`${recordedEffects}`, { size: SMALL }),
    memory: note('held in memory only'),
    reuse: [
      mono(recorded.operation, { size: SMALL }),
      note('new packet', { size: SMALL }),
      pictogram('cross', { size: 40, accent: WRONG }),
    ],
    replay: [
      mono(reconciled.operation, { size: SMALL }),
      note('exact replay', { size: SMALL }),
      pictogram('check', { size: 40, accent: VALID }),
    ],
  };
  place(
    column(
      [
        ledger.title,
        row([ledger.key, ledger.result], { gap: 'wide' }),
        row([ledger.effects, ledger.count], { gap: 'normal' }),
        ledger.memory,
        row(ledger.reuse, { gap: 'tight' }),
        row(ledger.replay, { gap: 'tight' }),
      ],
      { gap: 'tight' },
    ),
    ledgerSide,
    'top left',
  );

  const kept = { words: note('the writer keeps'), key: mono(recorded.operation, { color: MARK }) };
  const reply = row(
    [label('reply', { size: SMALL }), mono(reconciled.change, { size: SMALL, color: VALID })],
    { gap: 'tight' },
  );
  place(column([kept.words, kept.key, reply], { gap: 'tight' }), writerSide, 'top left');
  const supplied = beside(
    note('Supplied live revision'),
    [BAND.right, boxOf(targetFrame).cy],
    'left',
    'none',
  );
  const assumedEvidence = place(
    column([note('Assumed v4'), note('Fixture inputs')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  // Production checks use symbolic policy markers. They do not add guarantees to the fixture.
  const checkLeft = recordSide.left;
  const checkRight = writerSide.right;
  const policyY = BAND.top + 176;
  const clockY = BAND.top + 280;
  const clockLeft = checkLeft + 22;
  const deadlineX = checkRight - 48;
  const policyChecked = s.value(0),
    expiryChecked = s.value(0),
    atomicReady = s.value(0);
  const clockProgress = s.value(0.12);
  const production = {
    title: label('Production checks', { size: 36, anchor: 'left' }).at(checkLeft, BAND.top + 20),
    reviewer: note('Authenticate reviewer', { anchor: 'left' }).at(checkLeft, BAND.top + 65),
    policyNames: row([note('bound policy'), note('current policy')], { gap: 'wide' }),
    permissions: note('Permissions + live dependencies', { anchor: 'left' }).at(
      checkLeft,
      BAND.top + 344,
    ),
    atomic: note('Atomic preconditions + durable effect', { anchor: 'left' }).at(
      checkLeft,
      BAND.top + 382,
    ),
  };
  beside(production.policyNames, [checkLeft, BAND.top + 107.5], 'right', 'none');
  const boundX = boxOf(production.policyNames.nodes[0]).cx;
  const currentX = boxOf(production.policyNames.nodes[1]).cx;
  const boundPolicy = chip('P', { color: 'blue', stroke: 'blue' }).at(boundX, policyY);
  const livePolicy = dynamic(() => {
    const checked = policyChecked.value;
    return chip('P', {
      color: checked > 0.95 ? VALID : QUIET,
      stroke: checked > 0.95 ? VALID : QUIET,
    }).at(currentX, policyY + 34 * (1 - checked));
  });
  const currentPolicySlot = chip('P').at(currentX, policyY);
  const comparison = line(
    [boxOf(boundPolicy).right + 10, policyY],
    [boxOf(currentPolicySlot).left - 10, policyY],
    { stroke: QUIET, width: 3 },
  );
  const expiryRail = [
    line([clockLeft, clockY], [deadlineX, clockY], { stroke: QUIET, width: 4 }),
    line([deadlineX, clockY - 22], [deadlineX, clockY + 22], { stroke: MARK, width: 4 }),
    note('expiry', { anchor: 'right', color: MARK }).at(deadlineX, clockY + 48),
  ];
  const expiryClock = dynamic(() => {
    const x = clockLeft + (deadlineX - clockLeft) * clockProgress.value;
    return [
      dot(12, expiryChecked.value > 0.95 ? VALID : MARK).at(x, clockY),
      note('now', { color: QUIET }).at(x, clockY + 28),
    ];
  });
  const effectGate = boxOf(steps[2]);
  const writerGate = dynamic(() => {
    const open = Math.min(policyChecked.value, expiryChecked.value, atomicReady.value);
    return [
      line([effectGate.cx - 28, effectGate.cy], [effectGate.cx + 28, effectGate.cy - 28 * open], {
        stroke: open > 0.95 ? VALID : MARK,
        width: 6,
      }),
    ];
  }).zIndex(6);
  const gateName = note('next effect', { color: QUIET, anchor: 'left' }).at(
    effectGate.cx + 90,
    effectGate.cy,
  );

  // The three requests meet the same saved key. The later two travel in the gap beside the ledger.
  const entryPort = boxOf(ledger.key).grow('normal', 0).point('left');
  const requests = [
    ['reconcile-operation', boxOf(kept.key).grow('tight', 0).point('right'), true],
    ['key-reuse', boxOf(ledger.reuse[0]).grow('normal', 0).point('left'), false],
    ['exact-replay', boxOf(ledger.replay[0]).grow('normal', 0).point('left'), true],
  ].map(([cue, from, matches]) => ({
    cue,
    matches,
    link: connector(from, entryPort, { route: 'straight', tip: false, color: 'faint', width: 3 }),
  }));
  const requestDot = dot(9, MARK);
  const replyDot = dot(9, VALID);

  const down = boxOf(steps[2]);
  const replyX = down.cx + 60;
  const lost = arrow([replyX, down.bottom], [replyX, down.top], {
    stroke: WRONG,
    width: 4,
    dash: [8, 6],
  });
  const gone = beside(
    pictogram('cross', { size: 40, accent: WRONG }),
    boxOf(lost),
    'right',
    'tight',
  );
  const answered = arrow([replyX, down.bottom], [replyX, down.top], { stroke: VALID, width: 4 });

  s.add(heading(c.title));
  b.enter(c);
  s.add(bound);
  s.at(c.start - 0.25, () =>
    s.play(
      ...b.gate.flatMap((gate) => [
        gate.lamp.to(1, { duration: 0.25 }),
        gate.open.to(1, { duration: 0.25 }),
      ]),
    ),
  );

  // Beat 0. The packet makes one token. The stamp of the approval binds every field of it.
  c.after('evidence-digest', () =>
    s.play(
      seq(
        b.packet.seal.to(1, { duration: 0.4 }),
        pulse(steps[0], { color: VALID }),
        b.token.shown.to(1, { duration: 0.3 }),
      ),
    ),
  );
  c.on('merge-creates', () => s.play(indicate(b.nodes.packetFrame, { color: MARK, scale: 1 })));
  const named = c.cue('concrete-proposal');
  const third = (named.end - named.start) / 3;
  c.on('concrete-proposal', () =>
    s.play(
      lagged(
        [b.hot.release, b.hot.rev, b.hot.traffic].map((heat) => heat.to(1, { duration: 0.3 })),
        { lag: third / 0.3 },
      ),
    ),
  );
  c.on('evidence-digest', () =>
    s.play(
      ...[b.hot.release, b.hot.rev, b.hot.traffic].map((heat) => heat.to(0, { duration: 0.3 })),
      b.hot.digest.to(1, { duration: 0.3 }),
    ),
  );
  c.show('exact-approval', [recordFrame, recordTitle, ...lineNames]);
  c.after('exact-approval', () =>
    s.play(
      b.hot.digest.to(0, { duration: 0.3 }),
      record.shown.to(1, { duration: 0.4 }),
      b.token.stamp.to(1, { duration: 0.4 }),
    ),
  );
  // Another digest is another packet: the stamp does not hold it. Then the first packet comes back.
  c.on('different-decision', () => {
    b.token.stamp.set(0);
    s.play(
      seq(
        b.token.shown.to(0, { duration: 0.2 }),
        b.token.digest.to(NEW, { duration: 0 }),
        b.token.shown.to(1, { duration: 0.2 }),
      ),
    );
  });
  c.after('different-decision', () => s.play(record.broken.to(1, { duration: 0.2 })));

  // Beat 1. The writer compares the token with the live target. The target moved on: the writer stops.
  c.show('writer-rechecks', supplied);
  c.on('writer-rechecks', () =>
    s.play(
      seq(
        b.token.shown.to(0, { duration: 0.2 }),
        par(
          b.token.digest.to(OLD, { duration: 0 }),
          b.token.stamp.to(1, { duration: 0 }),
          record.broken.to(0, { duration: 0 }),
        ),
        b.token.shown.to(1, { duration: 0.2 }),
        b.token.pos.to(1, { duration: 0.7 }),
        b.target.hot.to(1, { duration: 0.3 }),
        indicate([writer.frame, writer.title], { color: MARK, scale: 1 }),
      ),
    ),
  );
  c.on('live-revision-change', () => b.target.live.set(NEW), 0.6);
  c.after('old-packet', () => s.play(b.token.refused.to(1, { duration: 0.3 })));
  c.on('rebuild', () =>
    s.play(
      seq(
        par(
          b.token.shown.to(0, { duration: 0.4 }),
          b.target.hot.to(0, { duration: 0.3 }),
          b.packet.seal.to(0, { duration: 0.4 }),
          record.shown.to(0, { duration: 0.4 }),
          ...b.card.flatMap((card) => [
            card.shown.to(0, { duration: 0.4 }),
            card.verdict.to(0, { duration: 0.3 }),
          ]),
          ...b.gate.flatMap((gate) => [
            gate.lamp.to(0, { duration: 0.3 }),
            gate.open.to(0, { duration: 0.3 }),
          ]),
        ),
        par(
          b.request.rev.to(NEW, { duration: 0 }),
          b.packet.rev.to(NEW, { duration: 0 }),
          record.rev.to(NEW, { duration: 0 }),
          ...b.card.flatMap((card) => [
            card.rev.to(NEW, { duration: 0 }),
            card.read.to(0, { duration: 0.05 }),
            card.pos.to(0, { duration: 0.05 }),
          ]),
          b.token.refused.to(0, { duration: 0.05 }),
          b.token.stamp.to(0, { duration: 0.05 }),
          b.token.pos.to(0, { duration: 0.05 }),
          b.token.rev.to(NEW, { duration: 0 }),
          b.token.digest.to(NEW, { duration: 0 }),
        ),
      ),
    ),
  );

  // Beat 2. Supply the assumed inputs directly to the packet, without depicting a source fetch.
  c.hide('fresh-approval', supplied);
  c.show('assumed-v4', assumedEvidence);
  c.on('supplied-v4', () =>
    s.play(
      seq(
        par(...b.card.map((card) => card.pos.to(2, { duration: 0 }))),
        par(...b.card.map((card) => card.shown.to(1, { duration: 0.3 }))),
        par(...b.card.map((card) => card.read.to(3, { duration: 0.5 }))),
      ),
    ),
  );
  c.after('supplied-v4', () => {
    b.card.forEach((card) => card.verdict.set(1));
    b.packet.seal.set(1);
    b.token.shown.set(1);
  });
  c.after('fresh-approval', () => {
    record.shown.set(1);
    b.token.stamp.set(1);
  });
  c.after('fresh-approval', () =>
    s.play(seq(b.token.pos.to(1, { duration: 0.6 }), pulse(steps[1], { color: MARK }))),
  );
  c.show('first-effect', [ledger.title, ledger.key, ledger.memory]);
  c.show('first-effect', [ledger.result, ledger.effects, ledger.count], { after: true });
  c.after('first-effect', () => {
    b.target.traffic.set(REQUEST.traffic);
    s.play(pulse(steps[2], { color: VALID }));
  });
  c.show('write-reply-lost', [draw(lost, { duration: 0.5 }), gone]);
  c.show('preserve-identity', [kept.words, kept.key]);
  c.on('reconcile-operation', () => s.play(pulse(steps[2], { color: MARK })));
  c.show('reconcile-operation', reply, { after: true });
  c.swap('reconcile-operation', [lost, gone], answered, { after: true });
  c.after('reconcile-operation', () =>
    s.play(indicate([ledger.effects, ledger.count], { color: MARK })),
  );

  // Beat 3. Replace the fixture approval with production requirements, then revisit its ledger.
  c.hide('single-writer-construct-3', assumedEvidence);
  c.swap(
    'single-writer-construct-3',
    [recordFrame, recordTitle, ...lineNames, bound, kept.words, kept.key, reply],
    [production.title, production.reviewer, writerGate, gateName],
  );
  c.show('policy-and-expiry', [production.policyNames, boundPolicy, livePolicy, comparison]);
  c.show('bind-expiry', [...expiryRail, expiryClock]);
  c.after('recheck-policy', () => s.play(policyChecked.to(1, { duration: 0.6 })));
  const expiry = c.cue('recheck-expiry');
  c.on('recheck-expiry', () =>
    s.play(
      clockProgress.to(0.72, {
        duration: expiry.end - expiry.start,
        ease: linear,
      }),
    ),
  );
  c.after('recheck-expiry', () => s.play(expiryChecked.to(1, { duration: 0.3 })));
  c.show('recheck-deps', production.permissions);
  c.show('atomic', production.atomic);
  c.after('atomic', () => s.play(atomicReady.to(1, { duration: 0.5 })));
  c.on('volatile', () => s.play(indicate(ledger.memory, { color: MARK, scale: 1 })));
  c.show('key-reuse', ledger.reuse.slice(0, 2));
  c.show('key-reuse', ledger.reuse[2], { after: true });
  c.show('exact-replay', ledger.replay.slice(0, 2));
  c.show('exact-replay', ledger.replay[2], { after: true });

  for (const { cue, matches, link } of requests) {
    const { start, end } = c.cue(cue);
    c.on(cue, () => {
      const trip = [
        link.send(requestDot, { duration: 0.8 }),
        indicate(matches ? [ledger.key, ledger.result] : ledger.key, { color: MARK, scale: 1 }),
      ];
      if (matches) trip.push(link.send(replyDot, { reverse: true, duration: 0.8 }));
      s.play(seq(...trip), { duration: end - start });
    });
    c.hide(cue, link, { after: true });
  }

  b.leave(c, STATE.applied);
}
