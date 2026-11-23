// Scene `superstep-join`: what the barrier of a step promises, and what it does not.
//
// The picture: the board. Beat 0 runs one superstep: plan, run, apply, and the cards cross the
// barrier together. Beat 1 puts the two channels in the band: two writes to one scalar are an error,
// and a list keeps order and duplicates. Beat 2 is a clock on the lanes: health has a preparation
// step. With one waiting edge the merge runs one time. With three edges it runs with two cards, and
// runs again. Beat 3 shows a lock on a mapping that a write to a nested list passes.
import {
  arrow,
  beside,
  boxOf,
  column,
  delay,
  dot,
  draw,
  fade,
  fitted,
  grid,
  indicate,
  lagged,
  linear,
  par,
  pictogram,
  place,
  rect,
  row,
  seq,
  steps,
} from 'vizmatic/stage';
import { waitingJoinTrace } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST } from '../../../films/agent-orchestration/fixtures.mjs';
import { chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  BAND,
  BRANCHES,
  BRANCH_COLOR,
  CORNER,
  MARK,
  QUIET,
  SMALL,
  VALID,
  WRONG,
  board,
  channels,
  clock,
} from '../parts.mjs';

const [EVAL, HEALTH, POLICY] = [0, 1, 2];
/** When each read ends in the trace of the model: health has a preparation step before it. */
const ARRIVAL = Object.fromEntries(
  waitingJoinTrace(0).arrivals.map((entry) => [entry.id, entry.at]),
);
/** When the merge runs: with three separate edges, and with one waiting edge. */
const MERGES = {
  separate: waitingJoinTrace(99).separateMerges,
  waiting: waitingJoinTrace(99).waitingMerges,
};
const LAST = Math.max(...Object.values(ARRIVAL));
const FIRST_STEP_END = Math.max(ARRIVAL.Eval, ARRIVAL.Policy, ARRIVAL['Health prep']);

export default function superstepJoin(s, c) {
  const b = board(s);
  const { checks, plates, packetFrame, slots, writer, targetFrame } = b.nodes;
  s.add(heading(c.title));
  b.enter(c);
  const flash = (color) => indicate(packetFrame, { color, scale: 1 });

  // Beat 0. One superstep: plan, run, apply. The updates of a step arrive together.
  const [upper, lower] = BAND.rows(2, 'normal');
  const phases = place(
    fitted(BAND, (width) => steps(['plan', 'run', 'apply', 'next step'], { width, size: 40 })),
    upper,
  );
  const before = place(mono('0 receipts in state', { size: 38 }), lower);
  const after = place(mono(`${b.card.length} receipts in state`, { size: 38, color: MARK }), lower);
  s.add(phases);
  c.on('superstep-join-construct-0', () => s.play(phases.go(0), indicate(checks, { color: MARK })));
  c.show('executes', before);
  c.on('executes', () =>
    s.play(
      phases.go(1),
      ...b.card.map((card) => card.shown.to(1, { duration: 0.2 })),
      ...b.card.map((card, i) =>
        seq(card.pos.to(1, { duration: 1.4 }), b.gate[i].lamp.to(1, { duration: 0.15 })),
      ),
    ),
  );
  c.on('applies', () =>
    s.play(
      phases.go(2),
      ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
      ...b.card.map((card) => card.pos.to(2, { duration: 0.9 })),
    ),
  );
  c.on('next-step', () => s.play(phases.go(3), flash(MARK)));
  c.swap('next-step', before, after, { lead: 0 });

  // Beat 1. The two kinds of channel. A scalar takes one write in a step. A list keeps what arrives.
  const state = channels(s, BAND, {
    entries: [POLICY, EVAL, HEALTH, HEALTH],
    error: 'InvalidUpdateError',
  });
  c.swap('superstep-join-construct-1', [phases, after], state.frame);
  s.add(...state.live);
  const [first, second] = state.scalar.writes;
  const arrive = (entry) =>
    par(entry.shown.to(1, { duration: 0.2 }), entry.drop.to(1, { duration: 0.5 }));
  const lift = (entry) =>
    seq(entry.shown.to(0, { duration: 0.25 }), entry.drop.to(0, { duration: 0.05 }));
  const operation = (words) =>
    mono(words, { size: SMALL, color: MARK, anchor: 'left' }).at(
      state.listSide.left,
      state.trayY + 84,
    );
  const appendEmpty = operation('saved + [] = saved');
  const overwrite = operation('Overwrite([])');
  const key = operation('key: (attempt, branch)');
  const resume = operation('resume: keep saved writes');
  c.on('superstep-join-construct-1', () => s.play(arrive(second)), 0.6);
  c.on('scalar-update-error', () => s.play(seq(lift(second), par(arrive(first), arrive(second)))));
  c.after('scalar-update-error', () => s.play(state.scalar.clash.to(1, { duration: 0.3 })));
  c.on('values-agree', () => s.play(state.scalar.hot.to(1, { duration: 0.3 })));
  c.after('reducer-lists', () =>
    s.play(
      state.scalar.hot.to(0, { duration: 0.3 }),
      state.scalar.clash.to(0, { duration: 0.3 }),
      ...state.scalar.writes.map(lift),
      lagged(state.list.slice(0, 3).map(arrive), { lag: 0.6 }),
    ),
  );
  // Reversing reducer inputs changes the list. Network completion need not set their order.
  c.after('not-commutative', () =>
    s.play(
      seq(
        par(...state.list.slice(0, 2).map(lift)),
        par(
          state.list[0].slot.to(1, { duration: 0.05 }),
          state.list[1].slot.to(0, { duration: 0.05 }),
        ),
        arrive(state.list[1]),
        arrive(state.list[0]),
      ),
    ),
  );
  c.after('keeps-duplicates', () =>
    s.play(seq(arrive(state.list[3]), state.list[3].wrong.to(1, { duration: 0.2 }))),
  );
  c.show('add-empty', appendEmpty, { after: true });
  c.swap('new-attempt', appendEmpty, overwrite);
  c.after('new-attempt', () =>
    s.play(seq(par(...state.list.map(lift)), state.list[3].wrong.to(0, { duration: 0.05 }))),
  );
  c.swap('attempt-aware', overwrite, key);
  c.on('attempt-aware', () => s.play(lagged(state.list.slice(0, 3).map(arrive), { lag: 0.4 })));
  c.swap('resume-saved', key, resume, { after: true });
  c.after('resume-saved', () =>
    s.play(
      lift(state.list[2]),
      ...state.list.slice(0, 2).map((entry) => entry.hot.to(1, { duration: 0.3 })),
    ),
  );
  c.after('retry-failed-work', () => s.play(arrive(state.list[2])));

  // Beat 2. The same lanes as a clock. Health has a preparation step, so it arrives last.
  const k = clock(
    s,
    [
      { lane: EVAL, length: ARRIVAL.Eval, color: BRANCH_COLOR[EVAL] },
      { lane: HEALTH, length: ARRIVAL['Health prep'], color: BRANCH_COLOR[HEALTH], label: 'prep' },
      {
        lane: HEALTH,
        start: FIRST_STEP_END,
        length: ARRIVAL.Health - FIRST_STEP_END,
        color: BRANCH_COLOR[HEALTH],
      },
      { lane: POLICY, length: ARRIVAL.Policy, color: BRANCH_COLOR[POLICY] },
    ],
    { seconds: 5 },
  );
  k.now.set(0);
  const pip = (color) => dot(15, color);
  const waitingPips = MERGES.waiting.map(() => pip(VALID));
  const separatePips = MERGES.separate.map((_, index) =>
    pip(index < MERGES.separate.length - 1 ? WRONG : 'ink'),
  );
  const tally = {
    title: note('the merge runs'),
    waiting: label('one waiting edge', { size: 36 }),
    separate: label('three edges', { size: 36 }),
  };
  const waitingResult = [tally.waiting, ...waitingPips];
  const separateResult = [tally.separate, ...separatePips];
  place(
    column(
      [
        tally.title,
        grid(
          [
            tally.waiting,
            row(waitingPips, { gap: 'normal' }),
            tally.separate,
            row(separatePips, { gap: 'normal' }),
          ],
          {
            columns: 2,
            gap: ['wide', 'normal'],
            align: 'left',
            even: true,
          },
        ),
      ],
      { gap: 'normal' },
    ),
    BAND,
    'left',
  );
  const [, selectionArea] = BAND.columns([1, 1], 'wide');
  const branchSet = (title) =>
    row(
      [
        note(title),
        mono('{', { size: SMALL, color: QUIET }),
        ...[EVAL, HEALTH].map((lane) => chip(BRANCHES[lane], { color: BRANCH_COLOR[lane] })),
        mono('}', { size: SMALL, color: QUIET }),
      ],
      { gap: 'tight' },
    );
  const setRows = [branchSet('selected'), branchSet('received')];
  const evidenceUnchecked = note('evidence unchecked');
  const setMatch = note('sets match', { color: MARK });
  const selectedSet = place(
    column([...setRows, evidenceUnchecked, setMatch], { gap: 'normal' }),
    selectionArea,
    'center',
  );
  const probe = place(
    column([note('Merge recorder'), note('No proposal')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  const releaseFailure = place(
    column([note('Release merge'), note('3 required')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  c.show('probe-only', probe);
  c.swap(
    2,
    [...state.frame, ...state.live, resume],
    [k.axis, ...k.numbers, tally.title, tally.waiting],
  );
  s.add(k.bars);
  const lamps = (lanes) =>
    lanes.map(([lane, at]) => delay(b.gate[lane].lamp.to(1, { duration: 0.15 }), at));
  const cardsIn = (lanes) => lanes.map((lane) => b.card[lane].shown.to(1, { duration: 0.3 }));
  const rewind = () =>
    par(
      k.now.to(0, { duration: 0.4 }),
      ...b.card.map((card) => card.shown.to(0, { duration: 0.3 })),
      ...b.gate.map((gate) => gate.lamp.to(0, { duration: 0.3 })),
    );
  c.onBeat(2, () =>
    s.play(
      rewind(),
      ...b.gate.map((gate) => gate.open.to(0, { duration: 0.3 })),
      ...k.spans.map((span) => span.shown.to(1, { duration: 0.3 })),
    ),
  );
  // One waiting edge: the two early receipts wait, and the merge runs one time, with all three.
  const lead = 0.9;
  c.on(
    'superstep-join-construct-2',
    () =>
      s.play(
        k.now.to(LAST, { duration: LAST, ease: linear }),
        ...lamps([
          [POLICY, ARRIVAL.Policy],
          [EVAL, ARRIVAL.Eval],
          [HEALTH, ARRIVAL.Health],
        ]),
      ),
    lead,
  );
  c.after('superstep-join-construct-2', () =>
    s.play(
      ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
      ...cardsIn([EVAL, HEALTH, POLICY]),
      flash(VALID),
    ),
  );
  c.show('superstep-join-construct-2', waitingPips, { after: true });
  // Three edges: no barrier. The merge runs when eval and policy are in, and again for health.
  c.hide('three-edges', waitingResult, { after: true, lead: 0.3, fade: 0.2 });
  c.show('three-edges', tally.separate);
  c.after('three-edges', () =>
    s.play(seq(rewind(), par(...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 }))))),
  );
  const extra = c.cue('extra-step'),
    partial = c.cue('partial-merge'),
    another = c.cue('another-merge');
  const [firstMerge, secondMerge] = MERGES.separate;
  c.on('extra-step', () =>
    s.play(
      k.spans[1].hot.to(1, { duration: 0.2 }),
      k.now.to(firstMerge, { duration: partial.start - extra.start, ease: linear }),
      ...lamps([
        [POLICY, ((partial.start - extra.start) * ARRIVAL.Policy) / firstMerge],
        [EVAL, partial.start - extra.start],
      ]),
    ),
  );
  c.show('partial-merge', separatePips[0], { after: true });
  c.after('partial-merge', () =>
    s.play(b.card[HEALTH].verdict.to(-1, { duration: 0.3 }), flash(WRONG)),
  );
  c.on('partial-merge', () =>
    s.play(
      k.spans[1].hot.to(0, { duration: 0.2 }),
      ...cardsIn([EVAL, POLICY]),
      k.now.to(secondMerge, { duration: another.start - partial.start, ease: linear }),
      ...lamps([[HEALTH, another.start - partial.start]]),
    ),
  );
  const pipFade = 0.3;
  c.show('another-merge', separatePips[1], { after: true, fade: pipFade });
  c.after('another-merge', () =>
    s.play(...cardsIn([HEALTH]), b.card[HEALTH].verdict.to(0, { duration: 0.3 }), flash(MARK)),
  );
  // A waiting edge that names a branch that does not run: the third lamp never lights.
  const never = place(
    label('never opens', { size: 36, color: WRONG }),
    boxOf(plates[POLICY]).inset('loose', 'tight'),
    'right',
  );
  const unselected = c.cue('unselected');
  // If the cues touch, let the second pip finish fading in before the tally leaves.
  const tallyDelay = Math.max(0, another.end + pipFade - unselected.start);
  c.hide('unselected', [tally.title, ...separateResult], { lead: -tallyDelay, fade: 0.2 });
  c.on(
    'unselected',
    () =>
      s.play(
        seq(
          par(
            rewind(),
            ...b.gate.map((gate) => gate.open.to(0, { duration: 0.3 })),
            k.spans[3].shown.to(0, { duration: 0.3 }),
            fade(checks[POLICY], 0.3, { duration: 0.3 }),
          ),
          par(
            k.now.to(LAST, { duration: unselected.end - unselected.start - 1, ease: linear }),
            ...lamps([
              [EVAL, ((unselected.end - unselected.start - 1) * ARRIVAL.Eval) / LAST],
              [HEALTH, unselected.end - unselected.start - 1],
            ]),
          ),
        ),
      ),
    0.4,
  );
  c.show('unselected', never, { after: true });
  // Deferred execution waits for pending work. Show the selected branches beside the receipts.
  c.hide('deferred', never);
  c.on('deferred', () =>
    s.play(
      seq(
        par(...[EVAL, HEALTH].map((lane) => b.gate[lane].open.to(1, { duration: 0.3 }))),
        par(...cardsIn([EVAL, HEALTH])),
      ),
    ),
  );
  c.show('deferred', [...setRows, evidenceUnchecked], { after: true });
  c.on('validate-set', () => s.play(indicate(setRows, { color: MARK, scale: 1 })), 0.4);
  c.show('validate-set', setMatch, { after: true });

  // Replay the real validator with all three required branches. Stop at the partial merge.
  const [requiredRoom, verdictRoom] = BAND.rows([2, 1], 'normal');
  const required = place(
    column(
      [
        note('required'),
        row(
          BRANCHES.map((branch, lane) => chip(branch, { color: BRANCH_COLOR[lane] })),
          { gap: 'normal' },
        ),
      ],
      { gap: 'normal' },
    ),
    requiredRoom,
    'left',
  );
  const missing = place(
    label('2 s: missing health', { size: 36, color: WRONG }),
    verdictRoom,
    'left',
  );
  const failed = place(label('Invocation failed', { size: 36, color: WRONG }), verdictRoom, 'left');
  // Earlier cases own their tally exits. Retire the active probe and selected set together.
  const releaseTransition = { fade: 0.2, retention: 0.5, resetOffset: 0.8 };
  c.swap('release-case', [probe, selectedSet], [releaseFailure, required], {
    lead: -releaseTransition.retention,
    fade: releaseTransition.fade,
  });
  c.hide(3, releaseFailure);
  const replay = c.cue('release-case');
  const reject = c.cue('release-validator');
  const replayDuration = reject.start - replay.start - releaseTransition.resetOffset - 0.4;
  c.on(
    'release-case',
    () =>
      s.play(
        seq(
          par(
            rewind(),
            fade(checks[POLICY], 1, { duration: 0.3 }),
            k.spans[3].shown.to(1, { duration: 0.3 }),
            ...b.card.map((card) => card.verdict.to(0, { duration: 0.3 })),
            ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
          ),
          par(
            k.now.to(firstMerge, { duration: replayDuration, ease: linear }),
            ...lamps([
              [POLICY, (replayDuration * ARRIVAL.Policy) / firstMerge],
              [EVAL, replayDuration],
            ]),
          ),
        ),
      ),
    releaseTransition.resetOffset,
  );
  c.on('release-validator', () => s.play(...cardsIn([EVAL, POLICY])));
  c.show('release-validator', missing, { after: true });
  c.after('release-validator', () =>
    s.play(b.card[HEALTH].verdict.to(-1, { duration: 0.3 }), flash(WRONG)),
  );
  c.swap('invocation-fails', missing, failed, { after: true });

  // Beat 3. Ownership, and a lock that is shallow: a write to a nested list passes it.
  const [objectSide, workerSide] = BAND.columns([3, 2], 'wide');
  const part = (words, color) => label(words, { size: SMALL, color });
  const listed = [
    part(BRANCHES[EVAL], BRANCH_COLOR[EVAL]),
    part(BRANCHES[HEALTH], BRANCH_COLOR[HEALTH]),
  ];
  const added = part(BRANCHES[POLICY], WRONG);
  const mapping = {
    name: mono('state', { size: 36 }),
    lock: pictogram('lock', { size: 52, color: QUIET, accent: MARK }),
    kind: note('read-only proxy'),
    tenantKey: mono('tenant', { size: SMALL, color: QUIET }),
    tenant: mono(REQUEST.tenant, { size: SMALL }),
    listKey: mono('receipts', { size: SMALL, color: QUIET }),
  };
  const listRow = row([...listed, added], { gap: 'normal' });
  const body = column(
    [
      row([mapping.name, mapping.lock, mapping.kind], { gap: 'normal' }),
      row([mapping.tenantKey, mapping.tenant], { gap: 'normal' }),
      row([mapping.listKey, listRow], { gap: 'wide' }),
    ],
    { gap: 'normal' },
  );
  place(body, objectSide.inset('normal'), 'top left');
  const outer = boxOf(body).grow('normal');
  const inner = boxOf(listRow).grow('tight');
  const outerFrame = rect(outer.width, outer.height, {
    radius: 14,
    stroke: 'ink',
    width: 2.5,
    fill: 'surface',
  }).at(outer.cx, outer.cy);
  const innerFrame = rect(inner.width, inner.height, {
    radius: 10,
    stroke: 'faint',
    width: 2,
    fill: null,
  }).at(inner.cx, inner.cy);
  // The first write stops at the lock. The second one goes on, into the nested list.
  const tenantY = boxOf(mapping.tenant).cy,
    listY = inner.cy;
  const worker = chip('worker').at(workerSide.left + 70, (tenantY + listY) / 2);
  const turn = boxOf(worker).left;
  const blocked = arrow([turn, tenantY], [outer.right, tenantY], {
    stroke: WRONG,
    width: 4,
    dash: [12, 9],
    pad: 6,
  });
  const stop = pictogram('cross', { size: 52, accent: WRONG }).at(
    (turn + outer.right) / 2,
    tenantY,
  );
  const passes = arrow([turn, listY], [inner.right, listY], { stroke: WRONG, width: 4, pad: 6 });
  const copyNames = [EVAL, HEALTH].map((lane) => part(BRANCHES[lane], BRANCH_COLOR[lane]));
  const copyAdded = part(BRANCHES[POLICY], WRONG);
  const copyTitle = note('the copy of the worker');
  const copyRow = row([...copyNames, copyAdded], { gap: 'normal' });
  place(
    column([copyTitle, copyRow], { gap: 'normal' }),
    workerSide.inset('none', 'normal'),
    'bottom left',
  );
  const copyBox = boxOf(copyRow).grow('tight');
  const copyFrame = rect(copyBox.width, copyBox.height, {
    radius: 10,
    stroke: 'faint',
    width: 2,
    fill: null,
    dash: [8, 8],
  }).at(copyBox.cx, copyBox.cy);
  const object = [outerFrame, innerFrame, ...Object.values(mapping), ...listed];

  // The board first: a worker owns one slot. Its write to another slot is cut.
  const from = boxOf(slots[EVAL]),
    to = boxOf(slots[HEALTH]);
  const trespass = arrow([from.cx, from.bottom], [from.cx, to.top], {
    stroke: WRONG,
    width: 4,
    dash: [10, 7],
    pad: 4,
  });
  const refused = beside(
    pictogram('cross', { size: 44, accent: WRONG }),
    boxOf(trespass),
    'right',
    'tight',
  );
  const typed = beside(note('type ok', { color: VALID }), refused, 'right', 'tight');
  c.swap(3, [k.bars, k.axis, ...k.numbers, required, failed], object);
  c.onBeat(3, () =>
    s.play(
      fade(checks[POLICY], 1, { duration: 0.3 }),
      ...b.card.map((card) => card.verdict.to(0, { duration: 0.3 })),
      ...[EVAL, HEALTH].map((lane) => b.card[lane].read.to(0, { duration: 0.3 })),
      delay(par(...cardsIn([HEALTH, POLICY])), 0.45),
    ),
  );
  c.show('superstep-join-construct-3', draw(trespass, { duration: 0.6 }));
  c.show('superstep-join-construct-3', refused, { after: true });
  c.show('types-not-auth', typed, { after: true });
  c.show('proxy-shallow', [worker, draw(blocked, { duration: 0.6 })]);
  c.show('proxy-shallow', stop, { after: true });
  c.on('proxy-shallow', () => s.play(indicate(mapping.lock, { color: MARK })));
  c.show('nested-mutated', draw(passes, { duration: 0.7 }));
  c.show('nested-mutated', added, { after: true });
  c.swap('deep-copy', [added, passes], [copyFrame, copyTitle, ...copyNames, copyAdded], {
    after: true,
  });
  c.on('neither-sandbox', () =>
    s.play(
      ...[mapping.lock, mapping.kind, copyTitle].map((node) => fade(node, 0.35, { duration: 0.4 })),
    ),
  );
  const guards = place(
    row(
      ['scope', 'credentials', 'isolation'].map((words) =>
        chip(words, { color: MARK, stroke: MARK }),
      ),
      { gap: 'tight' },
    ),
    BAND,
    'bottom right',
  );
  c.hide('boundary', [copyFrame, copyTitle, ...copyNames, copyAdded], { lead: 0.6 });
  c.show('boundary', guards, { stagger: true });
  c.on('boundary', () =>
    s.play(indicate([writer.frame, writer.title, targetFrame], { color: MARK, scale: 1 })),
  );

  b.leave(c);
}
