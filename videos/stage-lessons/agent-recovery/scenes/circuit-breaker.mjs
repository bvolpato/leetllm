// Scene `circuit-breaker`: when a call does not go at all.
//
// The picture: one lane from the caller to the controller, with a switch in it. Closed, calls
// pass. Two failures come back and fill a counter of two places: the switch opens, and the next
// calls turn back. A cooldown ring runs, one probe goes through, and its good answer closes the
// switch. Then an old success with the stamp gen 3 comes back to a switch at gen 4.
import {
  appear,
  arc,
  assertEqual,
  beside,
  boxOf,
  circle,
  column,
  dynamic,
  indicate,
  moveTo,
  par,
  place,
  row,
  seq,
  vanish,
} from 'vizmatic/stage';
import { breakerLifecycle, breakerRace } from '../../../films/agent-recovery/model.mjs';
import { area, chip, display, heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, breaker, places, token, travel } from '../parts.mjs';

/** The size of the two boxes at the ends of the lane, and the radius of the cooldown ring. */
const ACTOR = { width: 300, height: 160 };
const RING = 46;

export default function circuitBreaker(s, c) {
  const life = breakerLifecycle();
  const race = breakerRace();
  assertEqual(
    [
      life.opened.state,
      life.opened.generation,
      life.halfOpen.state,
      life.recovered.state,
      life.recovered.generation,
    ],
    ['open', 2, 'half-open', 'closed', 3],
    'the life of the breaker',
  );
  assertEqual(
    [
      race.olderGeneration,
      race.currentGeneration,
      race.stateAfterOldSuccess,
      race.oldResultReturned,
    ],
    [3, 4, 'open', true],
    'the old success',
  );

  // The frame: the state over the lane, and the three counts under it.
  const [, band, lower] = area.rows([3, 2, 4], 'none');
  const caller = place(namedBox('caller', { ...ACTOR, color: COLOR.attempt }), band, 'left');
  const service = place(
    namedBox('controller', { ...ACTOR, color: COLOR.controller }),
    band,
    'right',
  );
  const lane = breaker(s, {
    from: [boxOf(caller).right + 14, band.cy],
    to: [boxOf(service).left - 14, band.cy],
    gap: 300,
    ball: 20,
  });

  // The state of the breaker, in one place over the switch.
  const state = (name, generation, color) =>
    beside(
      display(`${name} · gen ${generation}`, { color }),
      [lane.x, lane.top],
      'above',
      'normal',
    );
  const states = {
    closed: state('closed', 1, COLOR.sure),
    open: state(life.opened.state, life.opened.generation, COLOR.fail),
    half: state(life.halfOpen.state, life.halfOpen.generation, COLOR.mark),
    again: state(life.recovered.state, life.recovered.generation, COLOR.sure),
    raceClosed: state('closed', 3, COLOR.sure),
    failedHalf: state('half-open', 2, COLOR.mark),
    failedOpen: state('open', 3, COLOR.fail),
    cancelHalf: state('half-open', 2, COLOR.mark),
    cancelOpen: state('open', 3, COLOR.fail),
    raced: state(race.stateAfterOldSuccess, race.currentGeneration, COLOR.fail),
  };

  // Under the switch: the cooldown, the failures that count, and the one place of a probe.
  const cooling = s.value(0);
  const dial = circle(RING, { stroke: 'faint', fill: null, width: 6 });
  const failures = places(s, life.opened.threshold, { size: 88 });
  const probe = places(s, 1, { color: COLOR.mark, size: 88 });
  const names = ['cooldown', 'failures that count', 'probe'].map((name) =>
    label(name, { size: 34, color: 'dim' }),
  );
  const meter = (parts, name) =>
    column([row(parts, { gap: 'tight' }), name], { gap: 'tight', align: 'center' });
  beside(
    row(
      [meter([dial], names[0]), meter(failures.frames, names[1]), meter(probe.frames, names[2])],
      { gap: 'loose', align: 'top' },
    ),
    [lane.x, lane.y],
    'under',
    'loose',
  );
  const sweep = dynamic(() =>
    cooling.value < 0.01
      ? null
      : arc(RING, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * cooling.value, {
          stroke: COLOR.controller,
          width: 6,
        }).at(...dial.center),
  );
  // What the voice adds, at the foot.
  const foot = lower.rows(2, 'none')[1];
  const branches = [
    label('alternative: failed probe', { color: COLOR.fail, size: 34 }),
    label('alternative: cancelled probe', { color: COLOR.mark, size: 34 }),
  ];
  branches.forEach((branch) => place(branch, foot));
  const verdict = place(
    chip(`gen ${race.olderGeneration} is not gen ${race.currentGeneration}: the state stays`, {
      color: COLOR.mark,
      stroke: COLOR.mark,
    }),
    foot,
  );
  const result = beside(
    chip('result of the old request', { color: COLOR.sure, stroke: COLOR.sure }),
    caller,
    'under',
    'normal',
    'left',
  );

  // The old request of the last beat: a call with the stamp of its generation.
  const stamp = `gen ${race.olderGeneration}`;
  const old = token(stamp, COLOR.attempt);
  const waits = [lane.to[0] - old.width / 2, lane.y];
  const success = token(stamp, COLOR.sure).moveTo(waits);
  old.moveTo([lane.from[0] + old.width / 2, lane.y]);

  s.add(
    heading(c.title),
    caller,
    service,
    lane.nodes,
    states.closed,
    dial,
    failures.frames,
    failures.fills,
    names[0],
    names[1],
    sweep,
  );

  // Calls. Each one is a ball that starts at the caller.
  const pass = (cue, offset) => c.on(cue, () => s.play(lane.pass(lane.call())), offset);
  const refuse = (cue, offset) => c.on(cue, () => s.play(lane.refuse(lane.call())), offset);
  // A call that fails: it goes through, a red answer comes back, and the counter takes one.
  const fail = (cue, offset, count) =>
    c.on(
      cue,
      () =>
        s.play(
          seq(
            lane.pass(lane.call()),
            lane.answer(lane.call(COLOR.fail).at(...lane.to)),
            failures.filled.to(count, { duration: 0.3 }),
          ),
        ),
      offset,
    );

  // Closed: calls pass. Two failures reach the threshold, and the breaker opens.
  [-3.4, -2.5, -1.6].forEach((offset) => pass('closed-calls', offset));
  c.on('closed-calls', () => s.play(indicate(states.closed, { color: COLOR.mark, scale: 1.06 })));
  fail('closed-calls', -0.5, 1);
  fail('closed-calls', 0.8, 2);
  c.on('failure-threshold', () => s.play(indicate(names[1], { color: COLOR.mark, scale: 1 })));
  c.swap('open-breaker', states.closed, states.open);
  c.on('open-breaker', () => s.play(lane.open()));
  refuse('open-breaker', 0.6);
  refuse('open-breaker', 1.5);
  const until = c.cue('half-open-probe').start - c.cue('cooldown').start - 0.4;
  c.on('cooldown', () => s.play(cooling.to(1, { duration: until })));

  // Half-open: one probe goes through, and its good answer closes the breaker.
  c.swap('half-open-probe', states.open, states.half);
  c.show('half-open-probe', [probe.frames, probe.fills, names[2]]);
  c.on('half-open-probe', () => s.play(lane.halfOpen(), cooling.to(0, { duration: 0.4 })));
  c.on(
    'half-open-probe',
    () => s.play(par(lane.pass(lane.call(COLOR.mark)), probe.filled.to(1, { duration: 0.3 }))),
    0.7,
  );
  refuse('half-open-probe', 1.6);
  c.on('healthy-probe', () => s.play(lane.answer(lane.call(COLOR.sure).at(...lane.to))), 1.2);
  c.hide('healthy-probe', states.half, { after: true });
  c.after('healthy-probe', () =>
    s.play(
      lane.close(),
      failures.filled.to(0, { duration: 0.4 }),
      probe.filled.to(0, { duration: 0.4 }),
    ),
  );
  c.show('reopen', branches[0]);
  c.on('reopen', () => s.play(lane.halfOpen(), probe.filled.to(1, { duration: 0.2 })), 0.5);
  c.on(
    'reopen',
    () =>
      s.play(
        seq(
          lane.pass(lane.call(COLOR.mark), 0.4),
          lane.answer(lane.call(COLOR.fail).at(...lane.to), 0.4),
        ),
      ),
    0.5,
  );
  c.after('reopen', () => s.play(lane.open(), probe.filled.to(0, { duration: 0.3 })));
  c.swap('cancel-probe', branches[0], branches[1]);
  c.on('cancel-probe', () => s.play(lane.halfOpen(), probe.filled.to(1, { duration: 0.2 })), 0.5);
  c.on('cancel-release', () => s.play(probe.filled.to(0, { duration: 0.6 }), lane.open()));

  // An old request is still out. Two newer failures open the breaker at a new generation.
  c.hide(2, branches[1]);
  c.show(2, states.raceClosed);
  c.onBeat(2, () => s.play(lane.close()));
  c.onBeat(2, () => s.play(travel(old, waits, { duration: 1.1 })), 0.4);
  fail('older-success', -0.6, 1);
  fail('older-success', 0.5, 2);
  c.swap('older-success', states.raceClosed, states.raced, { lead: -2.9 });
  c.on('older-success', () => s.play(lane.open()), 2.8);
  // Its success comes back with the old stamp: the caller gets the result, and the state stays.
  c.on(
    'caller-result',
    () =>
      s.play(
        vanish(old),
        appear(success),
        moveTo(success, [lane.from[0] + success.width / 2, lane.y], { duration: 1.3 }),
      ),
    -1.3,
  );
  // The result rests on the lane, so the lane leaves a moment before the scene does.
  c.clear([lane.nodes[0]], 0.46, 0.2);
  c.show('caller-result', result);
  c.on('newer-generation', () =>
    s.play(indicate(states.raced, { color: COLOR.mark, scale: 1.06 })),
  );
  c.show('generation-check', verdict);
}
