// Scene `wire-protocols`: a capability call and an agent task, on the same board.
//
// The picture: the board. A wire crosses the fan between triage and the checks. The health lane
// becomes a capability call (MCP), and the eval lane a task of an independent agent (A2A). Both
// lanes run for the same long time. Their results arrive as cards, and the join still reads them:
// a task that says "completed" brings a stale card. A line that says "shift traffic" goes to the
// target and is cut. The stale receipt keeps the packet open and the writer idle.
import {
  arrow,
  beside,
  boxOf,
  column,
  connector,
  delay,
  dot,
  draw,
  dynamic,
  indicate,
  line,
  linear,
  par,
  pictogram,
  place,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { REQUEST } from '../../../films/agent-orchestration/fixtures.mjs';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import {
  AGE,
  BAND,
  BRANCH_COLOR,
  CORNER,
  FRESH_SECONDS,
  MARK,
  QUIET,
  STATE,
  WRONG,
  board,
  clock,
} from '../parts.mjs';

const [EVAL, HEALTH, POLICY] = [0, 1, 2];
/** The age of a receipt when the join runs at 1200 in place of 1000: the model refuses it. */
const LATE_AGE = AGE.late;
/** The work of each lane on the clock: when it starts, and how long it takes. Two are equally long. */
const WORK = { start: 0.9, long: 2.4, short: 0.5 };

export default function wireProtocols(s, c) {
  const b = board(s, STATE.applied);
  const { triage, checks, plates, fan, packetFrame, approval, writer, targetFrame } = b.nodes;
  const k = clock(
    s,
    [
      { lane: EVAL, start: WORK.start, length: WORK.long, color: BRANCH_COLOR[EVAL] },
      { lane: HEALTH, start: WORK.start, length: WORK.long, color: BRANCH_COLOR[HEALTH] },
      { lane: POLICY, start: WORK.start, length: WORK.short, color: BRANCH_COLOR[POLICY] },
    ],
    { seconds: 5 },
  );
  k.now.set(0);
  b.card[EVAL].age.set(LATE_AGE);
  // A card starts after the name of the protocol of its lane, and not on it.
  b.card.forEach((card) => card.pos.set(0.72));
  s.add(heading(c.title), k.bars);
  b.enter(c);

  // Beat 0. The framework at the left of the wire. Two protocols at the right of it.
  const owns = place(
    column([note('framework owns'), label('scheduling'), label('state')], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  const fanBox = boxOf(fan);
  const wireX = fanBox.cx;
  const wire = line(
    [wireX, boxOf(plates[EVAL]).top - 6],
    [wireX, boxOf(plates[POLICY]).bottom + 6],
    { stroke: MARK, width: 3, dash: [10, 8] },
  );
  const wireName = beside(note('wire', { color: MARK }), wire, 'under', 'tight');
  const tag = (words, lane) =>
    place(
      label(words, { size: 36, color: MARK }),
      boxOf(plates[lane]).inset('normal', 'tight'),
      'left',
    );
  const tags = [tag('A2A', EVAL), tag('MCP', HEALTH)];
  const [exchangeRoom, runRoom] = BAND.rows([5, 1], 'tight');
  const [hostRoom, crossingRoom, remoteRoom] = exchangeRoom.columns([2, 1, 4], 'normal');
  const [capabilityRoom, investigatorRoom] = remoteRoom.rows(2, 'wide');
  const host = place(namedBox('model host', { width: hostRoom.width, height: 110 }), hostRoom);
  const capability = place(
    namedBox('capability server', {
      width: remoteRoom.width,
      height: 76,
      color: BRANCH_COLOR[HEALTH],
    }),
    capabilityRoom,
    'top',
  );
  const investigator = place(
    namedBox('vendor investigator', {
      width: remoteRoom.width,
      height: 76,
      color: BRANCH_COLOR[EVAL],
    }),
    investigatorRoom,
    'top',
  );
  const capabilityWords = beside(note('tools · resources · prompts'), capability, 'under', 'tight');
  const apiName = beside(
    note('lookup API', { color: BRANCH_COLOR[HEALTH] }),
    capability,
    'under',
    'tight',
  );
  const investigatorWords = beside(
    note('discovery · messages · tasks'),
    investigator,
    'under',
    'tight',
  );
  const localWire = line(
    [crossingRoom.cx, exchangeRoom.top + 8],
    [crossingRoom.cx, exchangeRoom.bottom - 8],
    { stroke: MARK, width: 3, dash: [10, 8] },
  );
  const callPath = connector(host, capability, {
    route: 'ortho',
    from: 'right',
    to: 'left',
    color: QUIET,
    width: 3,
    tip: true,
    gap: 10,
  });
  const messagePath = connector(host, investigator, {
    route: 'ortho',
    from: 'right',
    to: 'left',
    color: QUIET,
    width: 3,
    tip: true,
    gap: 10,
  });
  const exchange = [host, capability, investigator, callPath, messagePath, localWire];
  const exchangeDetails = [apiName, investigatorWords];
  const call = { progress: s.value(0), shown: s.value(0) };
  const request = { progress: s.value(0), shown: s.value(0) };
  const messages = dynamic(() => [
    ...(call.shown.value > 0.02
      ? [dot(10, BRANCH_COLOR[HEALTH]).at(...callPath.pointNow(call.progress.value))]
      : []),
    ...(request.shown.value > 0.02
      ? [dot(10, BRANCH_COLOR[EVAL]).at(...messagePath.pointNow(request.progress.value))]
      : []),
  ]);
  s.add(messages);
  const restart = place(note(`New run at v${REQUEST.version}`), runRoom, 'left');
  c.show('wire-protocols-construct-0', restart);
  c.on('wire-protocols-construct-0', () => {
    b.request.rev.set(REQUEST.version);
    b.target.live.set(REQUEST.version);
    b.target.traffic.set(0);
  });
  c.show('wire-protocols-construct-0', owns);
  c.show('wire-protocols-construct-0', exchange);
  c.on('wire-protocols-construct-0', () =>
    s.play(
      indicate(triage, { color: MARK }),
      delay(indicate(packetFrame, { color: MARK, scale: 1 }), 0.9),
    ),
  );
  c.show('wire-boundary', [draw(wire, { duration: 0.7 }), wireName]);
  c.on('cross-processes', () =>
    s.play(...fan.map((edge) => edge.pulse({ color: MARK })), indicate(checks, { color: MARK })),
  );
  c.swap('mcp', restart, [tags[1], capabilityWords]);
  c.on('mcp', () => s.play(indicate(capability, { color: MARK, scale: 1 })));
  c.show('a2a', [tags[0], investigatorWords]);
  c.on('a2a', () => s.play(indicate(investigator, { color: MARK, scale: 1 })));

  // Beat 1. Both lanes run for the same time: the length of the work does not choose the protocol.
  const beside2 = (words, lane, at) =>
    label(words, { size: 30, anchor: 'left' }).at(k.x(at) + 16, k.laneY(lane));
  const lookup = beside2('lookup API', HEALTH, WORK.start + WORK.long);
  const id = `task/${REQUEST.release}`;
  const taskId = beside2(id, EVAL, WORK.start + WORK.long);
  const message = beside2('direct message', POLICY, WORK.start + WORK.short);
  // The vendor keeps one task record while its status changes. A direct reply has its own lane.
  const body = BAND.inset('normal');
  const [titleRow, stateRow, railRow, outputRow] = body.rows([2, 1, 1, 2], 'tight');
  const taskFrame = rect(BAND.width, BAND.height, {
    radius: 14,
    stroke: BRANCH_COLOR[EVAL],
    width: 3,
    fill: 'surface',
  })
    .at(BAND.cx, BAND.cy)
    .zIndex(-1);
  const taskHeader = place(
    row(
      [
        label('Vendor investigation', { size: 40 }),
        mono(id, {
          size: 36,
          color: BRANCH_COLOR[EVAL],
        }),
      ],
      { gap: 'wide' },
    ),
    titleRow,
    'left',
  );
  const states = ['submitted', 'working', 'completed'];
  const cells = stateRow.columns(states.length, 'normal');
  const stageLabels = states.map((state, i) => place(note(state), cells[i]));
  const railY = railRow.cy;
  const stops = cells.map((cell) => cell.cx);
  const rail = line([stops[0], railY], [stops.at(-1), railY], { stroke: QUIET, width: 4 });
  const ticks = stops.map((x) => dot(8, QUIET).at(x, railY));
  const progress = s.value(0);
  const marker = dynamic(() => {
    const x = stops[0] + (stops.at(-1) - stops[0]) * progress.value;
    const travelled =
      x > stops[0] + 1
        ? [
            line([stops[0], railY], [x, railY], {
              stroke: BRANCH_COLOR[EVAL],
              width: 7,
            }),
          ]
        : [];
    return [...travelled, dot(16, MARK).at(x, railY)];
  });
  const record = [taskFrame, taskHeader, ...stageLabels, rail, ...ticks, marker];
  const stream = place(note('Progress updates require support'), outputRow, 'left');
  const artifact = place(
    row([
      pictogram('certificate', { size: 50, accent: BRANCH_COLOR[EVAL] }),
      label('Attached eval receipt', { size: 36 }),
    ]),
    outputRow,
    'left',
  );
  const [ageLabel, scale] = outputRow.inset(12, 0).columns([2, 5], 'normal');
  const scaleName = place(note('Receipt age'), ageLabel, 'left');
  const railHeight = scale.cy + 24;
  const age = mono(`${LATE_AGE} s`, { size: 35, anchor: 'right', color: BRANCH_COLOR[EVAL] })
    .at(scale.right, scale.cy - 20);
  const limitX = scale.left + scale.width * FRESH_SECONDS / LATE_AGE;
  const maxAge = note(`${FRESH_SECONDS} s limit`, { color: MARK }).at(limitX, scale.cy - 20);
  const ageTrack = line([scale.left, railHeight], [scale.right, railHeight], {
    stroke: BRANCH_COLOR[EVAL], width: 8,
  });
  const observation = dot(12, BRANCH_COLOR[EVAL]).at(scale.right, railHeight);
  const ageLimit = line([limitX, railHeight - 14], [limitX, railHeight + 14], {
    stroke: MARK, width: 5,
  });
  const both = c.cue('wire-protocols-construct-1');
  c.on('wire-protocols-construct-1', () =>
    s.play(
      ...k.spans.slice(0, 2).map((span) => span.shown.to(1, { duration: 0.3 })),
      k.now.to(WORK.start + WORK.long, { duration: both.end - both.start - 0.6, ease: linear }),
    ),
  );
  c.show('lookup-tool', lookup);
  c.swap('lookup-tool', capabilityWords, apiName);
  c.on('lookup-tool', () =>
    s.play(
      seq(
        call.shown.to(1, { duration: 0.02 }),
        call.progress.to(1, { duration: 0.6 }),
        indicate(capability, { color: MARK, scale: 1, duration: 0.4 }),
        call.progress.to(0, { duration: 0.6 }),
        call.shown.to(0, { duration: 0.02 }),
      ),
    ),
  );
  // The message crosses the wire before the vendor creates its persistent task.
  c.on('vendor-task', () =>
    s.play(
      seq(
        request.shown.to(1, { duration: 0.02 }),
        request.progress.to(1, { duration: 0.8 }),
        request.shown.to(0, { duration: 0.02 }),
      ),
    ),
  );
  c.swap('vendor-task', [...exchange, ...exchangeDetails], [taskId, ...record], { after: true });
  c.on('task-progress', () => s.play(progress.to(0.5, { duration: 0.9 })));
  c.show('direct-message', message);
  c.on('direct-message', () => s.play(k.spans[2].shown.to(1, { duration: 0.3 })));
  c.show('streaming', stream);

  // Beat 2. The results arrive as cards. The join reads them, whatever the task said about itself.
  const completed = place(
    chip(id, { color: BRANCH_COLOR[EVAL], stroke: BRANCH_COLOR[EVAL] }),
    boxOf(plates[EVAL]).inset(120, 'tight'),
    'left',
  );
  c.hide(2, [lookup, taskId, message]);
  c.onBeat(2, () => s.play(...k.spans.map((span) => span.shown.to(0, { duration: 0.3 }))));
  c.show('wire-protocols-construct-2', completed, { lead: -0.5 });
  c.swap('wire-protocols-construct-2', stream, artifact);
  c.on('wire-protocols-construct-2', () => s.play(progress.to(1, { duration: 0.8 })));
  c.on(
    'wire-protocols-construct-2',
    () =>
      s.play(
        seq(
          par(...b.card.map((card) => card.shown.to(1, { duration: 0.3 }))),
          par(
            ...b.card.map((card, i) =>
              seq(card.pos.to(1, { duration: 1 }), b.gate[i].lamp.to(1, { duration: 0.15 })),
            ),
          ),
          par(
            ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
            ...b.card.map((card) => card.pos.to(2, { duration: 0.8 })),
          ),
        ),
      ),
    0.5,
  );
  c.swap('receipt-age', artifact, [scaleName, age, ageTrack, observation], { lead: 0 });
  c.show('completed-not-proof', [maxAge, ageLimit], { lead: 0 });
  c.on('completed-not-proof', () =>
    s.play(
      indicate(stageLabels[2], { color: MARK, scale: 1 }),
      ...b.card.map((card) => card.read.to(3, { duration: 0.9 })),
    ),
  );
  c.after('completed-not-proof', () => {
    b.card.forEach((card, i) => card.verdict.set(i === EVAL ? -1 : 1));
    s.play(
      seq(
        b.card[EVAL].pos.to(1, { duration: 0.7 }),
        b.card[EVAL].pos.to(1.16, { duration: 0.2 }),
        b.card[EVAL].pos.to(1.08, { duration: 0.2 }),
      ),
    );
  });
  // A line of text that asks for the effect: it reaches no writer.
  const said = place(
    row([note('a transcript says'), chip('"shift traffic"', { font: 'mono', dash: [8, 6] })], {
      gap: 'normal',
    }),
    BAND,
    'bottom left',
  );
  const saidBox = boxOf(said);
  const target = boxOf(targetFrame);
  const toTarget = arrow([saidBox.right, saidBox.cy], [target.left, saidBox.cy], {
    stroke: WRONG,
    width: 4,
    dash: [12, 9],
    pad: 8,
  });
  const cut = pictogram('cross', { size: 60, accent: WRONG }).at(
    (saidBox.right + target.left) / 2 + 120,
    saidBox.cy,
  );
  c.swap('no-authority', [...record, scaleName, age, ageTrack, observation, maxAge, ageLimit], said, { lead: 2.4 });
  c.show('no-authority', draw(toTarget, { duration: 0.9 }), { lead: 1.4 });
  const cutFade = 0.3;
  c.show('no-authority', cut, { after: true, fade: cutFade });
  // Credentials and policy govern writes. This task still supplied stale evidence.
  const governs = row(
    [
      pictogram('key', { size: 52, color: QUIET, accent: MARK }),
      chip('credentials', { color: MARK, stroke: MARK }),
      chip('policy', { color: MARK, stroke: MARK }),
    ],
    { gap: 'tight' },
  );
  const writerBox = boxOf(writer.frame);
  beside(governs, [BAND.right, writerBox.cy], 'left', 'none');
  const chosen = chip('Rollout requires human review', { dash: [8, 6] });
  beside(chosen, [BAND.right, boxOf(approval.frame).cy], 'left', 'none');
  // Keep the usual lead when the cross has time to finish fading in.
  const cueGap = c.cue('credentials-policy').start - c.cue('no-authority').end;
  c.hide('credentials-policy', [toTarget, cut], { lead: Math.min(0.1, cueGap - cutFade) });
  c.show('credentials-policy', governs);
  c.on('credentials-policy', () =>
    s.play(indicate([writer.frame, writer.title], { color: MARK, scale: 1 })),
  );
  c.show('human-review', chosen);
  c.on('human-review', () =>
    s.play(indicate([approval.frame, approval.title], { color: MARK, scale: 1 })),
  );

  b.leave(c);
}
