// Scene `checkpoint-retry`: what a resume keeps, and what it must check again.
//
// The picture: the board, and a checkpoint in the band. Eval and policy arrive, and copies of their
// cards are saved. The health read times out, and a second attempt runs alone. A node that is
// entered again runs its first part two times. An identifier selects the checkpoint, and a lock
// still holds it. After a long pause the ages on every card count up past the limit. The last beat
// is a table of four failures, and each row lights its place on the board.
import {
  arrow,
  beside,
  boxOf,
  column,
  delay,
  dot,
  draw,
  dynamic,
  fade,
  fitted,
  grid,
  indicate,
  line,
  linear,
  numberLine,
  par,
  pictogram,
  place,
  pulse,
  rect,
  row,
  seq,
  shake,
} from 'vizmatic/stage';
import { REQUEST } from '../../../films/agent-orchestration/fixtures.mjs';
import { chip, heading, label, note } from '../../kit-narrated.mjs';
import {
  AGE,
  BAND,
  BRANCHES,
  BRANCH_COLOR,
  CARD,
  CORNER,
  FRESH_SECONDS,
  MARK,
  QUIET,
  VALID,
  WRONG,
  board,
  receiptCard,
} from '../parts.mjs';

const [EVAL, HEALTH, POLICY] = [0, 1, 2];
/** The age of a receipt when the join runs at 1200 in place of 1000: the model refuses it. */
const LATE_AGE = AGE.late;
/** Three attempts in all: the budget of the retry. */
const BUDGET = 3;
/** The separate freshness limit stated in the corrected article clause. */
const ARTICLE_LIMIT_SECONDS = 300;

export default function checkpointRetry(s, c) {
  const b = board(s);
  const receiptAge = s.value(AGE.fresh);
  b.card.forEach((card) => {
    card.age = receiptAge;
  });
  const { checks, plates, steps, approval, writer, targetFrame, ticketFrame } = b.nodes;
  s.add(heading(c.title));
  b.enter(c);
  const integration = place(
    column([note('Integration'), note('Checkpointer')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  const hostClock = place(
    column([note('Integration'), note('Host clock')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  c.show('cp-stores', integration);
  c.swap('host-now', integration, hostClock);
  c.hide(3, hostClock);

  // The checkpoint, at the left of the band: one place for the saved card of each check.
  const [saveSide, workSide] = BAND.columns([2, 3], 'wide');
  const [budgetRoom, workRoom] = workSide.rows([1, 3], 'normal');
  const frame = rect(saveSide.width, saveSide.height, {
    radius: 14,
    stroke: QUIET,
    width: 2.5,
    fill: null,
  }).at(saveSide.cx, saveSide.cy);
  const title = place(
    row(
      [
        pictogram('snapshot', { size: 48, color: QUIET, accent: 'ink' }),
        label('checkpoint', { size: 36 }),
      ],
      { gap: 'normal' },
    ),
    saveSide.inset('normal', 'tight'),
    'top left',
  );
  const placeY = (i) => saveSide.top + 126 + i * 92;
  const places = BRANCHES.map((_, i) =>
    rect(CARD.width + 10, CARD.height + 10, {
      radius: 14,
      stroke: 'faint',
      width: 2,
      fill: null,
      dash: [8, 8],
    }).at(saveSide.cx, placeY(i)),
  );
  const saved = BRANCHES.map(() => s.value(0));
  const copies = dynamic(() =>
    BRANCHES.flatMap((_, i) => {
      if (saved[i].value < 0.02) return [];
      const age = b.card[i].age.value;
      return receiptCard(saveSide.cx, placeY(i), {
        color: BRANCH_COLOR[i],
        tenant: b.card[i].tenant.value,
        rev: b.card[i].rev.value,
        age,
        tints: ['ink', 'ink', b.card[i].verdict.value < 0 ? WRONG : 'ink'],
        opacity: saved[i].value,
      });
    }),
  );
  const checkpoint = [frame, title, ...places];
  s.add(...checkpoint, copies);

  // Beat 0. Two reads finish and are saved. The health read times out, and only it runs again.
  const budget = {
    name: note('retry budget'),
    pips: Array.from({ length: BUDGET }, () => dot(13, MARK)),
  };
  place(row([budget.name, ...budget.pips], { gap: 'normal' }), budgetRoom, 'left');
  const timeout = place(
    label('timeout', { size: 36, color: WRONG }),
    boxOf(plates[HEALTH]).inset('loose', 'tight'),
    'right',
  );
  c.on('cp-stores', () =>
    s.play(
      ...b.card.map((card) => card.shown.to(1, { duration: 0.2 })),
      ...[EVAL, POLICY].map((lane) =>
        seq(
          b.card[lane].pos.to(1, { duration: lane === EVAL ? 2 : 1.2 }),
          b.gate[lane].lamp.to(1, { duration: 0.15 }),
        ),
      ),
      b.card[HEALTH].pos.to(0.3, { duration: 3.4, ease: linear }),
    ),
  );
  c.show('health-timeout', timeout, { after: true });
  c.after('health-timeout', () => s.play(b.card[HEALTH].shown.to(0, { duration: 0.4 })));
  c.on('saved-results', () =>
    s.play(
      indicate([frame, ...title.nodes], { color: MARK, scale: 1 }),
      ...[EVAL, POLICY].map((lane, i) =>
        delay(saved[lane].to(1, { duration: 0.3 }), 0.2 + i * 0.4),
      ),
    ),
  );
  c.show('retry-health-read', [budget.name, ...budget.pips]);
  c.hide('retry-health-read', timeout);
  c.on('retry-health-read', () =>
    s.play(
      delay(fade(budget.pips[0], 0.25, { duration: 0.3 }), 0.5),
      seq(
        b.card[HEALTH].pos.to(0, { duration: 0.05 }),
        b.card[HEALTH].shown.to(1, { duration: 0.3 }),
        b.card[HEALTH].pos.to(1, { duration: 1.6 }),
        b.gate[HEALTH].lamp.to(1, { duration: 0.15 }),
        saved[HEALTH].to(1, { duration: 0.4 }),
      ),
    ),
  );
  c.on('not-restart', () =>
    s.play(
      seq(
        indicate([checks[EVAL], checks[POLICY]], { color: MARK }),
        par(
          ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
          ...b.card.map((card) => card.pos.to(2, { duration: 0.8 })),
        ),
      ),
    ),
  );

  // Beat 1. The saved state is one contract. A node that runs again is another: its first part runs two times.
  const NODE = { width: 400, height: 96, cut: 0.55 };
  const nodeBox = workRoom.inset('none', 'normal');
  const nodeLeft = nodeBox.right - NODE.width,
    nodeY = nodeBox.cy;
  const cutX = nodeLeft + NODE.width * NODE.cut;
  const nodeFrame = rect(NODE.width, NODE.height, {
    radius: 12,
    stroke: 'ink',
    width: 2.5,
    fill: 'surface',
  }).at(nodeLeft + NODE.width / 2, nodeY);
  const cut = line([cutX, nodeY - NODE.height / 2 - 14], [cutX, nodeY + NODE.height / 2 + 14], {
    stroke: MARK,
    width: 3,
    dash: [8, 6],
  });
  const cutName = beside(note('interrupt', { color: MARK }), cut, 'above', 'tight');
  const passNames = [note('first run'), note('resume')];
  const passY = [nodeY - 22, nodeY + 22];
  passNames.forEach((name, pass) => beside(name, [nodeLeft, passY[pass]], 'left', 'normal'));
  const nodeTitle = beside(note('one node'), nodeFrame, 'under', 'tight', 'left');
  const pass = [s.value(0), s.value(0)];
  const passes = dynamic(() =>
    pass.flatMap((done, index) => {
      const width = (NODE.width - 16) * done.value;
      if (width < 1) return [];
      return [
        rect(width, 26, {
          radius: 6,
          stroke: null,
          fill: index === 0 ? QUIET : MARK,
          opacity: 0.9,
        }).at(nodeLeft + 8 + width / 2, passY[index]),
      ];
    }),
  );
  const node = [nodeFrame, cut, cutName, nodeTitle, ...passNames];
  s.add(passes.zIndex(3));
  c.after('persistent-checkpoint', () =>
    s.play(
      indicate([frame, ...title.nodes], { color: MARK, scale: 1 }),
      delay(indicate(targetFrame, { color: MARK, scale: 1 }), 1.2),
      // The packet goes on quietly, so that the writer has a token for the last part of the beat.
      seq(
        par(...b.card.map((card) => card.read.to(3, { duration: 0.6 }))),
        par(
          ...b.card.map((card) => card.verdict.to(1, { duration: 0.3 })),
          b.packet.seal.to(1, { duration: 0.3 }),
        ),
        b.token.shown.to(1, { duration: 0.3 }),
      ),
    ),
  );
  c.show('re-enter', node);
  c.on('re-enter', () =>
    s.play(
      seq(
        pass[0].to(NODE.cut, { duration: 1, ease: linear }),
        delay(pass[1].to(1, { duration: 1.8, ease: linear }), 0.5),
      ),
    ),
  );
  c.on('retryable-explicit', () =>
    s.play(indicate([budget.name, ...budget.pips], { color: MARK })),
  );
  // Both attempts use the key for this request and revision. The target applies the change once.
  const operationKey = `${REQUEST.request}/v${REQUEST.version}`;
  const sameKey = place(
    row([note('same key'), chip(operationKey, { color: MARK, stroke: MARK })]),
    budgetRoom,
    'left',
  );
  c.swap('repeat-safe-retry', [budget.name, ...budget.pips], sameKey);
  c.after('repeat-safe-retry', () =>
    s.play(
      seq(
        par(b.token.stamp.to(1, { duration: 0.3 }), b.token.pos.to(1, { duration: 0.6 })),
        par(
          pulse(steps[2], { color: MARK }),
          b.target.traffic.to(REQUEST.traffic, { duration: 0.6 }),
        ),
        delay(pulse(steps[2], { color: MARK }), 0.3),
      ),
    ),
  );

  // Beat 2. An identifier selects the checkpoint. It does not open it. And the saved cards grow old.
  const lock = place(
    pictogram('lock', { size: 52, color: QUIET, accent: MARK }),
    saveSide.inset('normal', 'tight'),
    'top right',
  );
  const selector = row(
    [pictogram('key', { size: 56, color: QUIET, accent: MARK }), chip('thread id')],
    { gap: 'normal' },
  );
  const permit = row(
    [pictogram('shield', { size: 56, color: QUIET, accent: VALID }), chip('permission')],
    { gap: 'normal' },
  );
  place(column([selector, permit], { gap: 'wide' }), workRoom, 'right');
  const selectorBox = boxOf(selector);
  const selects = arrow([selectorBox.left, selectorBox.cy], [saveSide.right, selectorBox.cy], {
    stroke: MARK,
    width: 4,
    pad: 10,
  });
  c.swap('checkpoint-access', [...node, passes, sameKey], lock);
  c.show('thread-selects', [selector, draw(selects, { duration: 0.6 })]);
  c.on('thread-selects', () => s.play(indicate(frame, { color: MARK, scale: 1 })));
  c.on('no-permission', () => s.play(indicate(lock, { color: WRONG }), shake(lock)));
  c.show('no-permission', permit, { after: true });
  // The host clock supplies an age. The later comparison supplies its verdict.
  const pause = row(
    [
      pictogram('clock', { size: 56, color: QUIET, accent: MARK }),
      label('supplied host time', { size: 36 }),
    ],
    { gap: 'normal' },
  );
  place(pause, budgetRoom, 'right');
  const ageAxis = fitted(workRoom.inset('wide', 'normal'), (length) =>
    numberLine({
      length,
      range: [0, ARTICLE_LIMIT_SECONDS + FRESH_SECONDS],
      ticks: [0],
      labels: false,
      tips: false,
      size: 34,
      labelSize: 34,
      format: (seconds) => seconds + ' s',
      points: [],
      thresholds: [
        { at: FRESH_SECONDS, label: 'Film', color: MARK },
        { at: ARTICLE_LIMIT_SECONDS, label: 'Article', color: QUIET },
      ],
    }),
  );
  const articleLimit = ageAxis.threshold('Article').opacity(0);
  const filmLimit = ageAxis.threshold('Film').opacity(0);
  const ageReadout = note('receipt age: ' + LATE_AGE + ' s');
  place(column([ageAxis, ageReadout], { gap: 'normal' }), workRoom, 'center');
  const ageCounter = dynamic(() =>
    place(
      note('receipt age: ' + Math.round(b.card[EVAL].age.value) + ' s', {
        color: b.card[EVAL].verdict.value < 0 ? WRONG : MARK,
      }),
      boxOf(ageReadout),
      'left',
    ),
  );
  const agePoint = dynamic(() =>
    dot(12, MARK).at(...ageAxis.toWorld(...ageAxis.p(Math.round(receiptAge.value)))),
  );
  c.swap('recheck-age', [selector, selects, permit], [pause, ageAxis, agePoint, ageCounter]);
  c.on('recheck-age', () => {
    b.packet.seal.set(0);
    b.token.stamp.set(0);
    b.token.refused.set(0);
    for (const card of b.card) {
      card.read.set(2);
      card.verdict.set(0);
    }
  });
  const count = c.cue('measured-age');
  const travel = { duration: count.end - count.start, ease: linear };
  c.on('measured-age', () => s.play(receiptAge.to(LATE_AGE - 1, travel)));
  c.after('measured-age', () => receiptAge.set(LATE_AGE));
  c.after('film-expiry', () => {
    for (const card of b.card) {
      card.read.set(3);
      card.verdict.set(-1);
    }
    b.packet.seal.set(0);
    b.token.refused.set(1);
    s.play(fade(filmLimit, 1, { duration: 0.2 }));
  });
  c.after('article-limit', () => s.play(fade(articleLimit, 1, { duration: 0.2 })));

  // Beat 3. Four failures, four recoveries. Each row lights its place on the board.
  const recoveries = [
    { art: 'loop', failure: 'read timeout', recovery: 'backoff, jitter, deadline' },
    { art: 'search', failure: 'wrong release identity', recovery: 'resolve the alias, or review' },
    { art: 'cross', failure: 'reviewer rejects', recovery: 'cancel' },
    { art: 'key', failure: 'writer timeout', recovery: 'reconcile, same key' },
  ].map((entry) => ({
    art: pictogram(entry.art, { size: 56, color: QUIET, accent: MARK }),
    failure: label(entry.failure, { size: 36 }),
    recovery: label(entry.recovery, { size: 36, color: MARK }),
  }));
  place(
    grid(
      recoveries.flatMap((entry) => [entry.art, entry.failure, entry.recovery]),
      { columns: 3, gap: ['normal', 'normal'], align: 'left', even: true },
    ),
    BAND,
    'left',
  );
  const rows = recoveries.map((entry) => [entry.art, entry.failure]);
  const light = (lit) =>
    rows.flatMap((nodes, i) =>
      nodes.map((part) => fade(part, lit === i || lit === null ? 1 : 0.35, { duration: 0.3 })),
    );
  // Keep both limits readable for 1.2 seconds after the article marker finishes its fade.
  const recoveryDelay = Math.max(0, c.cue('article-limit').end + 0.2 + 1.2 - c.beats[3].start);
  c.swap(3, [...checkpoint, copies, lock, pause, ageAxis, agePoint, ageCounter], rows, {
    lead: -recoveryDelay,
  });
  c.onBeat(
    3,
    () =>
      s.play(
        seq(
          par(
            ...b.card.flatMap((card) => [
              card.shown.to(0, { duration: 0.2 }),
              card.verdict.to(0, { duration: 0.2 }),
            ]),
            b.token.shown.to(0, { duration: 0.2 }),
          ),
          par(
            receiptAge.to(AGE.fresh, { duration: 0 }),
            ...b.card.map((card) => card.read.to(0, { duration: 0 })),
            b.token.refused.to(0, { duration: 0 }),
          ),
        ),
      ),
    recoveryDelay + 0.5,
  );
  c.on(
    'checkpoint-retry-construct-3',
    () => s.play(...light(0), indicate(checks[HEALTH], { color: MARK })),
    recoveryDelay + 0.5,
  );
  c.on('wrong-identity', () =>
    s.play(
      ...light(1),
      indicate(ticketFrame, { color: MARK, scale: 1 }),
      b.hot.tenant.to(1, { duration: 0.3 }),
      b.hot.rev.to(1, { duration: 0.3 }),
    ),
  );
  c.on('reviewer-rejects', () =>
    s.play(
      ...light(2),
      b.hot.tenant.to(0, { duration: 0.3 }),
      b.hot.rev.to(0, { duration: 0.3 }),
      indicate([approval.frame, approval.title], { color: MARK, scale: 1 }),
    ),
  );
  c.on('writer-timeout', () =>
    s.play(
      ...light(3),
      indicate([writer.frame, writer.title, targetFrame], { color: MARK, scale: 1 }),
    ),
  );
  ['read-recovery', 'identity-recovery', 'reviewer-rejects', 'writer-recovery'].forEach((cue, i) =>
    c.show(cue, recoveries[i].recovery, { after: true }),
  );
  c.on('different-semantics', () =>
    s.play(
      ...light(null),
      indicate(
        recoveries.map((entry) => entry.art),
        { color: MARK },
      ),
    ),
  );

  b.leave(c);
}
