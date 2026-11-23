// Scene `transfer`: the whole board one more time, and one last batch.
//
// The picture: the board. The three reads overlap on the lanes and the cards seal the packet, while
// three coupled steps in the band cannot overlap. The parts of the contract light in turn. Then a
// new batch arrives as v3, v4, v3 with all lamps lit: who repairs it? The join refuses the health
// card. The health worker refreshes it, and the join checks it again. The saved packet waits for
// review while a separate writer test shows the original result and its replay.
import {
  arrow,
  assertEqual,
  boxOf,
  column,
  delay,
  dynamic,
  dot,
  grid,
  indicate,
  lagged,
  linear,
  par,
  pictogram,
  place,
  pulse,
  rect,
  row,
  seq,
  spin,
  to,
} from 'vizmatic/stage';
import { readSchedule } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST, values } from '../../../films/agent-orchestration/fixtures.mjs';
import {
  canonicalDigest,
  RECEIPTS,
  V4_RECEIPTS,
  freshPacket,
  proposal,
  reconciled,
  reconciledEffects,
  recorded,
  recordedEffects,
} from '../packet.mjs';
import { chip, display, heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import {
  BAND,
  BRANCH_COLOR,
  CORNER,
  MARK,
  QUIET,
  SMALL,
  VALID,
  WRONG,
  board,
  clock,
  cardX,
  laneY,
} from '../parts.mjs';

const [EVAL, HEALTH, POLICY] = [0, 1, 2];
/** The seconds of each read, from the model: eval, health, policy. */
const SECONDS = readSchedule(0).branches.map((branch) => branch.duration);
const LONGEST = Math.max(...SECONDS);
/** The illustrated repair assumes this target revision. The film model does not fetch it. */
// These are supplied snapshots. A refresh reads the selected revision's receipt from its snapshot.
const v3 = RECEIPTS;
const v4 = V4_RECEIPTS;
const mixed = [v3[EVAL], v4[HEALTH], v3[POLICY]];
const BATCH = mixed.map((receipt) => receipt.version);
const refreshed = [v4[EVAL], mixed[HEALTH], v4[POLICY]];
const rebuilt = proposal(refreshed, { ...REQUEST, version: freshPacket.version });
assertEqual(rebuilt, freshPacket, 'the rebuilt v4 proposal matches the verified fixture');

export default function transfer(s, c) {
  const b = board(s);
  const { ticketFrame, checks, plates, fan, slotNames, packetFrame, writer, steps, targetFrame } =
    b.nodes;
  const k = clock(
    s,
    SECONDS.map((length, lane) => ({ lane, length, color: BRANCH_COLOR[lane] })),
  );
  k.now.set(0);
  b.card.forEach((card) => card.pos.set(2));
  s.add(heading(c.title), k.bars);
  b.enter(c);

  // The board will hold the unsigned v4 packet. The separate replay test uses a supplied approval.
  const [packetRoom, detailRoom] = BAND.rows([1, 3], 'normal');
  const trusted = place(
    column([note('assumed target'), mono(`v${REQUEST.version}`, { color: MARK })], {
      gap: 'tight',
    }),
    CORNER,
    'top left',
  );
  const short = (hash) => `#${hash.slice(0, 4)}`;
  const comparisons = RECEIPTS.flatMap(({ branch, digest: supplied }, i) => {
    const resolved = canonicalDigest(values[branch]);
    assertEqual(supplied, resolved, `fresh ${branch} receipt agrees with its source`);
    return [
      label(branch, { size: 36, color: BRANCH_COLOR[i] }),
      mono(short(supplied), { size: 36 }),
      mono(short(resolved), { size: 36, color: VALID }),
    ];
  });
  const sourceHeaders = [note('branch'), note('receipt hash'), note('fixture value hash')];
  const sourceInputs = [...sourceHeaders, ...comparisons.filter((_, i) => i % 3 !== 2)];
  const resolvedHashes = comparisons.filter((_, i) => i % 3 === 2);
  const sources = place(
    grid([...sourceHeaders, ...comparisons], {
      columns: 3,
      gap: ['normal', 'wide'],
      align: 'left',
      even: true,
    }),
    BAND,
    'left',
  );
  const trustedV4 = place(
    column([note('assumed target'), mono(`v${rebuilt.version}`, { color: MARK })], {
      gap: 'tight',
    }),
    CORNER,
    'top left',
  );
  const v4Title = place(label('Same incoming batch', { size: 42 }), packetRoom, 'left');
  const v4Question = place(display('Which two need a fresh read?'), detailRoom, 'left');
  const newReview = place(
    label('Vega’s packet  ·  awaiting review', { size: 38, color: MARK }),
    packetRoom,
    'left',
  );
  const [headerRoom, middleRoom, bottomRoom] = detailRoom.inset('normal').rows([3, 4, 3], 'tight');
  // The alternative has its own tray. Its receipts never enter the repaired batch on the board.
  const alternativeFrame = rect(detailRoom.width, detailRoom.height, {
    radius: 14,
    stroke: QUIET,
    width: 2,
    fill: null,
  }).at(detailRoom.cx, detailRoom.cy);
  const alternativeTitle = place(
    row([label('Alternative batch'), note(`${REQUEST.request} / v${REQUEST.version}`)]),
    headerRoom,
    'left',
  );
  const alternativeCards = [EVAL, HEALTH, HEALTH, POLICY].map((lane) =>
    chip(RECEIPTS[lane].branch, { color: BRANCH_COLOR[lane], stroke: BRANCH_COLOR[lane] }),
  );
  place(row(alternativeCards, { gap: 'normal' }), middleRoom, 'left');
  const refused = place(label('Batch refused', { color: WRONG }), bottomRoom, 'left');
  const testFrame = rect(detailRoom.width, detailRoom.height, {
    radius: 14,
    stroke: QUIET,
    width: 2,
    fill: 'surface',
  })
    .at(detailRoom.cx, detailRoom.cy)
    .zIndex(-1);
  const [fixtureLabel, fixtureStatus] = headerRoom.columns([1, 1.7], 'normal');
  const testTitle = place(label('Writer fixture', { size: 38 }), fixtureLabel, 'left');
  const suppliedApproval = place(
    mono(`approved  v${freshPacket.version}  ·  ${freshPacket.traffic}%`, {
      color: VALID,
      size: 34,
    }),
    fixtureStatus,
    'right',
  );
  const lostReply = place(note('reply lost', { color: MARK }), fixtureStatus, 'left');
  const testRow = (room, action, result, effects) => {
    const [call, key, change, count] = room.columns([1, 1, 1.3, 1], 'normal');
    return [
      place(label(action, { size: 34 }), call, 'left'),
      place(mono(result.operation, { size: 34 }), key, 'left'),
      place(mono(result.change, { size: 34, color: VALID }), change, 'left'),
      place(note(`effects ${effects}`), count, 'left'),
    ];
  };
  const firstCall = testRow(middleRoom, 'First call', recorded, recordedEffects);
  const replay = testRow(bottomRoom, 'Replay', reconciled, reconciledEffects);

  // Beat 0. The reads overlap, because their inputs are stable. Coupled steps cannot.
  const overlap = c.cue('transfer-construct-0');
  c.on('transfer-construct-0', () =>
    s.play(
      ...k.spans.map((span) => span.shown.to(1, { duration: 0.3 })),
      k.now.to(LONGEST, { duration: overlap.end - overlap.start, ease: linear }),
      ...SECONDS.map((length, i) =>
        delay(
          b.gate[i].lamp.to(1, { duration: 0.15 }),
          ((overlap.end - overlap.start) * length) / LONGEST,
        ),
      ),
    ),
  );
  c.on('stable-inputs', () =>
    s.play(
      indicate(ticketFrame, { color: MARK, scale: 1 }),
      ...fan.map((edge) => edge.pulse({ color: MARK })),
    ),
  );
  c.on('validation-result', () =>
    s.play(
      seq(
        par(
          ...k.spans.map((span) => span.shown.to(0, { duration: 0.3 })),
          ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
        ),
        par(...b.card.map((card) => card.shown.to(1, { duration: 0.3 }))),
        par(...b.card.map((card) => card.read.to(3, { duration: 0.8 }))),
      ),
    ),
  );
  c.after('validation-result', () => {
    b.card.forEach((card) => {
      card.read.set(3);
      card.verdict.set(1);
    });
    b.packet.seal.set(1);
  });
  // Three steps that need each other: each one waits for the one before it.
  const STEP = { left: BAND.left + 110, width: 190, height: 44, pitch: 100, top: BAND.top + 110 };
  const push = s.value(0),
    chain = s.value(0);
  const stepX = (j) => STEP.left + j * STEP.width * (1 - 0.45 * push.value);
  const stepY = (j) => STEP.top + j * STEP.pitch;
  const coupled = dynamic(() => {
    const opacity = chain.value;
    if (opacity < 0.02) return [];
    const parts = [];
    for (let j = 0; j < 3; j++) {
      parts.push(
        rect(STEP.width, STEP.height, {
          radius: 8,
          stroke: null,
          fill: 'ink',
          opacity: 0.8 * opacity,
        }).at(stepX(j) + STEP.width / 2, stepY(j)),
      );
      if (j < 2)
        parts.push(
          arrow(
            [stepX(j) + STEP.width - 3, stepY(j) + STEP.height / 2 + 4],
            [stepX(j) + STEP.width - 3, stepY(j + 1) - STEP.height / 2 - 4],
            {
              stroke: push.value > 0.05 ? WRONG : MARK,
              width: 4,
              opacity,
            },
          ),
        );
    }
    return parts;
  });
  const workers = [0, 1, 2].map((j) =>
    pictogram('agent', { size: 56, color: QUIET, accent: 'ink' }).at(BAND.left + 40, stepY(j)),
  );
  const coupledTitle = label('coupled steps', BAND.left, BAND.top + 30, {
    size: 36,
    anchor: 'left',
  });
  const links = [0, 1].map((j) =>
    note('needs the step before', { color: MARK, anchor: 'left' }).at(
      STEP.left + (j + 1) * STEP.width + 16,
      (stepY(j) + stepY(j + 1)) / 2,
    ),
  );
  s.add(coupled);
  c.show('coupled-steps', [coupledTitle, ...workers], { stagger: 0.2 });
  c.on('coupled-steps', () => s.play(chain.to(1, { duration: 0.5 })));
  c.show('coupled-steps', links, { after: true });
  // They try to overlap, and the links pull them back.
  c.after('no-overlap', () =>
    s.play(seq(push.to(1, { duration: 0.7 }), push.to(0, { duration: 0.5 }))),
  );

  // Beat 1. The questions for a new workflow, each one at its place on the board.
  const [branchSide, effectSide] = BAND.columns(2, 'wide');
  const asks = {
    title: label('each branch', { size: 36, color: QUIET }),
    read: label('read   r17 / v3', { size: 36 }),
    update: label('return   eval receipt', { size: 36 }),
    agree: label('match the ticket', { size: 36 }),
  };
  const effect = {
    title: label('writer checks', { size: 36, color: QUIET }),
    policy: label('current policy', { size: 36 }),
    approval: label('exact approval', { size: 36 }),
    safe: label('same operation key', { size: 36 }),
    verified: label('live traffic  0%', { size: 36 }),
  };
  place(column(Object.values(asks), { gap: 'normal' }), branchSide, 'top left');
  place(column(Object.values(effect), { gap: 'normal' }), effectSide, 'top left');
  c.swap('transfer-construct-1', [coupledTitle, ...workers, ...links], asks.title);
  c.on('transfer-construct-1', () => s.play(chain.to(0, { duration: 0.3 })));
  c.show('ask-read', asks.read);
  c.on('ask-read', () =>
    s.play(
      indicate(ticketFrame, { color: MARK, scale: 1 }),
      ...fan.map((edge) => edge.pulse({ color: MARK })),
    ),
  );
  c.show('ask-update', asks.update);
  c.on('ask-update', () =>
    s.play(
      lagged(
        slotNames.map((name, i) => indicate(name, { color: BRANCH_COLOR[i], scale: 1.15 })),
        { lag: 0.3 },
      ),
    ),
  );
  c.show('branch-contract', asks.agree);
  c.on('branch-contract', () =>
    s.play(...[b.hot.tenant, b.hot.rev, b.hot.age].map((heat) => heat.to(1, { duration: 0.3 }))),
  );
  c.show('effect-boundary', effect.title);
  c.on('effect-boundary', () =>
    s.play(
      ...[b.hot.tenant, b.hot.rev, b.hot.age].map((heat) => heat.to(0, { duration: 0.3 })),
      indicate([writer.frame, writer.title], { color: MARK, scale: 1 }),
      seq(pulse(steps[0], { color: VALID }), b.token.shown.to(1, { duration: 0.3 })),
    ),
  );
  c.show('current-policy', effect.policy);
  c.on('current-policy', () => s.play(b.target.hot.to(1, { duration: 0.3 })));
  c.show('exact-approval', effect.approval);
  c.after('exact-approval', () =>
    s.play(
      b.target.hot.to(0, { duration: 0.3 }),
      indicate(b.nodes.approval.title, { color: MARK }),
    ),
  );
  c.show('effect-result', effect.safe, { after: true });
  c.on('repeat-safe', () => s.play(indicate(writer.frame, { color: MARK, scale: 1 })));
  c.show('verify-state', effect.verified, { after: true });
  c.after('verify-state', () =>
    s.play(
      b.hot.traffic.to(1, { duration: 0.3 }),
      indicate(targetFrame, { color: MARK, scale: 1 }),
    ),
  );

  // Beat 2. Three obligations of a diagram: an arrow, a receipt, a resume.
  const duties = [
    ['dag', 'Start the join', 'last read finished'],
    ['certificate', 'Check the target', 'receipt revision'],
    ['loop', 'Refresh a read', 'return to source'],
  ].map(([art, thing, duty]) => ({
    art: pictogram(art, { size: 64, color: QUIET, accent: MARK }),
    thing: label(thing, { size: 36 }),
    duty: label(duty, { size: 36, color: MARK }),
  }));
  place(
    column(
      duties.map((entry) => row([entry.art, entry.thing, entry.duty], { gap: 'normal' })),
      { gap: 'normal' },
    ),
    BAND,
    'left',
  );
  const dutyRow = (entry) => [entry.art, entry.thing, entry.duty];
  c.hide('transfer-construct-2', [...Object.values(asks), ...Object.values(effect)]);
  c.on('transfer-construct-2', () => s.play(b.hot.traffic.to(0, { duration: 0.3 })));
  c.show('arrow-readiness', dutyRow(duties[0]));
  c.on('arrow-readiness', () =>
    s.play(
      ...fan.map((edge) => edge.pulse({ color: MARK })),
      indicate(plates, { color: MARK }),
      lagged(
        b.gate.map((gate) =>
          seq(gate.lamp.to(0.1, { duration: 0.2 }), gate.lamp.to(1, { duration: 0.2 })),
        ),
        { lag: 0.4 },
      ),
    ),
  );
  c.show('receipt-identity', dutyRow(duties[1]));
  c.on('receipt-identity', () =>
    s.play(
      seq(
        par(b.hot.tenant.to(1, { duration: 0.3 }), b.hot.rev.to(1, { duration: 0.3 })),
        delay(par(b.hot.tenant.to(0, { duration: 0.4 }), b.hot.rev.to(0, { duration: 0.4 })), 1.2),
      ),
    ),
  );
  c.show('recovery-meaning', dutyRow(duties[2]));
  const retry = place(
    pictogram('loop', { size: 64, color: QUIET, accent: MARK }),
    boxOf(plates[HEALTH]).inset('normal', 'tight'),
    'left',
  );
  c.show('recovery-meaning', retry);
  c.on('recovery-meaning', () => s.play(spin(retry, 3, { duration: 2 })));

  // Beat 3. One last batch: v3, v4, v3. All three say success. Who repairs it?
  const ask = display('Who repairs it?');
  const owners = ['health worker', 'join', 'writer'].map((words) => chip(words));
  const focusOwner = (active) =>
    owners.map((owner) => tint(owner, owner === active ? MARK : QUIET, { duration: 0.2 }));
  const [healthWorker] = owners;
  place(column([ask, row(owners, { gap: 'normal' })], { gap: 'normal' }), BAND, 'left');
  const rejection = place(label('Join rejects the batch', { color: WRONG }), boxOf(ask));
  const repair = place(label('Health worker refreshes', { color: MARK }), boxOf(ask));
  const returning = s.value(0);
  const returnProgress = s.value(0);
  const returnStart = cardX(1);
  const returnEnd = boxOf(checks[HEALTH]).right + 14;
  const repairMessage = dynamic(() => {
    if (returning.value < 0.02) return [];
    return dot(12, BRANCH_COLOR[HEALTH]).at(
      returnStart + (returnEnd - returnStart) * returnProgress.value,
      laneY(HEALTH),
    );
  });
  s.add(repairMessage);
  c.hide(3, [...duties.flatMap(dutyRow), retry]);
  c.onBeat(3, () =>
    s.play(
      seq(
        par(
          b.packet.seal.to(0, { duration: 0.3 }),
          b.token.shown.to(0, { duration: 0.3 }),
          ...b.card.flatMap((card) => [
            card.shown.to(0, { duration: 0.3 }),
            card.verdict.to(0, { duration: 0.3 }),
          ]),
          ...b.gate.flatMap((gate) => [
            gate.lamp.to(0, { duration: 0.3 }),
            gate.open.to(0, { duration: 0.3 }),
          ]),
        ),
        par(
          ...b.card.flatMap((card, i) => [
            card.read.to(0, { duration: 0.05 }),
            card.pos.to(0, { duration: 0.05 }),
            card.rev.to(BATCH[i], { duration: 0 }),
          ]),
          b.token.stamp.to(0, { duration: 0.05 }),
          b.token.pos.to(0, { duration: 0.05 }),
        ),
      ),
    ),
  );
  const arrive = (lane) =>
    seq(
      b.card[lane].shown.to(1, { duration: 0.2 }),
      b.card[lane].pos.to(1, { duration: 0.9 }),
      b.gate[lane].lamp.to(1, { duration: 0.15 }),
    );
  c.on(
    'transfer-construct-3',
    () =>
      s.play(
        b.revisionSize.to(48, { duration: 0.3 }),
        b.hot.rev.to(1, { duration: 0.3 }),
        arrive(EVAL),
      ),
    0.8,
  );
  c.on('batch-health', () => s.play(arrive(HEALTH)));
  c.on('batch-policy', () => s.play(arrive(POLICY)));
  c.on('all-success', () => s.play(...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 }))));
  c.show('predict-owner', [ask, ...owners], { stagger: 0.3 });
  // The join rejects the mixed revisions. The health worker owns the new read.
  c.swap('fresh-revision-rejection', ask, rejection, { after: true });
  c.after('fresh-revision-rejection', () =>
    s.play(
      ...focusOwner(null),
      seq(
        par(...b.card.map((card) => card.pos.to(2, { duration: 0.7 }))),
        par(...b.card.map((card) => card.read.to(3, { duration: 0.7 }))),
        par(
          ...b.card.map((card, i) => card.verdict.to(i === HEALTH ? -1 : 1, { duration: 0.3 })),
          b.hot.rev.to(0, { duration: 0.3 }),
        ),
        b.card[HEALTH].pos.to(1, { duration: 0.6 }),
      ),
    ),
  );
  c.show('trusted-target', trusted);
  c.on('trusted-target', () =>
    s.play(indicate(targetFrame, { color: MARK, scale: 1 }), b.hot.rev.to(1, { duration: 0.3 })),
  );
  c.swap('revision-three-repair', rejection, repair, { after: true });
  const refresh = c.cue('refresh-branch');
  const refreshDuration = refresh.end - refresh.start;
  c.on('refresh-branch', () =>
    s.play(
      seq(
        b.card[HEALTH].shown.to(0, { duration: 0.1 }),
        returning.to(1, { duration: 0 }),
        returnProgress.to(1, { duration: refreshDuration - 0.1, ease: linear }),
      ),
    ),
  );
  c.after('refresh-branch', () => {
    returning.set(0);
    b.card[HEALTH].rev.set(REQUEST.version);
    b.card[HEALTH].read.set(0);
    b.card[HEALTH].verdict.set(0);
    b.card[HEALTH].pos.set(2);
    b.card[HEALTH].shown.set(1);
    s.play(...focusOwner(healthWorker));
  });
  const revalidate = c.cue('revalidate');
  const repairHold = 1.8;
  const compareStart = Math.max(revalidate.start, refresh.end + repairHold);
  c.swap('revalidate', [repair, ...owners], sourceInputs, {
    lead: revalidate.start - compareStart,
  });
  c.show('revalidate', resolvedHashes, { after: true });
  c.on('revalidate', () =>
    s.play(
      ...b.card.flatMap((card) => [
        card.read.to(0, { duration: 0.25 }),
        card.verdict.to(0, { duration: 0.25 }),
      ]),
    ),
  );
  c.on('check-scope-and-age', () =>
    s.play(
      ...b.card.map((card) => card.read.to(3, { duration: 0.9 })),
      b.hot.rev.to(0, { duration: 0.3 }),
    ),
  );
  c.after('check-scope-and-age', () =>
    s.play(...b.card.map((card) => card.verdict.to(1, { duration: 0.3 }))),
  );
  c.swap('alternate-target', [sources, trusted], [trustedV4, v4Title], { lead: 0 });
  c.show('inspect-v4', v4Question, { lead: 0 });
  c.on('alternate-target', () => {
    b.request.rev.set(rebuilt.version);
    b.target.live.set(rebuilt.version);
    b.card.forEach((card, i) => {
      card.verdict.set(0);
      card.read.set(0);
      card.rev.set(mixed[i].version);
      card.pos.set(1);
      b.gate[i].open.set(0);
      b.gate[i].lamp.set(1);
    });
  });
  c.hide('refresh-v4-inputs', [v4Question, v4Title], { lead: 0 });
  const refreshWindow = c.cue('validate-v4-inputs').start - c.cue('refresh-v4-inputs').start;
  c.on('refresh-v4-inputs', () =>
    s.play(
      ...[EVAL, POLICY].map((i) => {
        const card = b.card[i];
        return seq(
          par(
            b.gate[i].lamp.to(0, { duration: 0.1 }),
            card.pos.to(0, { duration: refreshWindow * 0.33 }),
          ),
          card.shown.to(0, { duration: refreshWindow * 0.09 }),
          card.rev.to(refreshed[i].version, { duration: 0 }),
          card.shown.to(1, { duration: refreshWindow * 0.09 }),
          card.pos.to(1, { duration: refreshWindow * 0.32 }),
          b.gate[i].lamp.to(1, { duration: refreshWindow * 0.08 }),
        );
      }),
    ),
  );
  const validation = c.cue('validate-v4-inputs');
  const scanTime = validation.end - validation.start;
  c.on('validate-v4-inputs', () =>
    s.play(
      seq(
        par(...b.gate.map((gate) => gate.open.to(1, { duration: scanTime * 0.14 }))),
        par(...b.card.map((card) => card.pos.to(2, { duration: scanTime * 0.42 }))),
        par(...b.card.map((card) => card.read.to(3, { duration: scanTime * 0.37 }))),
      ),
    ),
  );
  c.after('validate-v4-inputs', () => b.card.forEach((card) => card.verdict.set(1)));
  c.after('rebuild-review', () => {
    b.packet.rev.set(rebuilt.version);
    b.token.rev.set(rebuilt.version);
    b.token.digest.set(rebuilt.version);
    s.play(seq(b.packet.seal.to(1, { duration: 0.4 }), b.token.shown.to(1, { duration: 0.3 })));
  });
  c.show('rebuild-review', newReview, { after: true });
  c.after('rebuild-review', () => s.play(b.revisionSize.to(SMALL, { duration: 0.45 })));
  c.swap('fresh-duplicate-input', trustedV4, [
    alternativeFrame,
    alternativeTitle,
    ...alternativeCards,
  ]);
  c.after('fresh-duplicate-rejection', () =>
    s.play(
      tint(alternativeCards[1], WRONG),
      tint(alternativeCards[2], WRONG),
      to(alternativeFrame, (frame) => frame.stroke(WRONG, 4), { duration: 0.4 }),
    ),
  );
  c.show('fresh-duplicate-rejection', refused, { after: true });
  c.hide('writer-unchanged', [alternativeFrame, alternativeTitle, ...alternativeCards, refused]);
  // The live writer waits for review.
  c.on('writer-unchanged', () =>
    s.play(
      indicate([writer.frame, writer.title, targetFrame], { color: MARK, scale: 1 }),
      b.hot.traffic.to(1, { duration: 0.3 }),
    ),
  );
  c.on('await-review', () => s.play(indicate(newReview, { color: MARK, scale: 1 })));
  c.show('fixture-writer', [testFrame, testTitle], { lead: 0 });
  c.show('fixture-approval', suppliedApproval, { lead: 0 });
  c.show('first-call', firstCall.slice(0, 2), { lead: 0 });
  c.show('first-call', firstCall.slice(2), { after: true });
  c.show('lost-reply', lostReply, { after: true });
  c.show('replay-call', replay.slice(0, 2), { lead: 0 });
  c.show('replay-result', replay.slice(2), { after: true });
  c.on('live-zero', () => s.play(indicate(targetFrame, { color: MARK, scale: 1 })));
  c.on('capstone-practice', () => s.play(indicate(packetFrame, { color: MARK, scale: 1 })));
}
