// Scene `breaker-contract`: what counts for a breaker, and for whom.
//
// The picture: three tenants, each with its own switch on its own lane to one controller. On
// the middle lane, a schema error turns back before the switch and counts nothing. Two quota
// failures open that one switch, and the other two lanes keep passing. Then a cancelled probe
// frees its place and opens the switch again, an error that is not about health leaves it
// half-open. A newer failure opens generation 4 before the old result returns unchanged.
// The controller record stays. Remote cancellation remains unverified.
import {
  appear,
  assertEqual,
  beside,
  boxOf,
  column,
  fadeOut,
  indicate,
  line,
  moveTo,
  par,
  place,
  recolor,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import {
  admitProbe,
  breakerTransition,
  finishProbe,
} from '../../../films/agent-recovery/model.mjs';
import { area, chip, heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, OP, breaker, places, record, token } from '../parts.mjs';

export default function breakerContract(s, c) {
  // The life of the middle breaker, from the model.
  let state = { state: 'closed', generation: 1, failures: 0, threshold: 2, probeAvailable: false };
  for (let failure = 0; failure < 2; failure++)
    state = breakerTransition(state, { type: 'failure', generation: 1 });
  const opened = state;
  const halfOpen = breakerTransition(opened, { type: 'cooldown' });
  const cancelled = finishProbe(admitProbe(halfOpen, 'probe-1'), {
    id: 'probe-1',
    generation: halfOpen.generation,
    outcome: 'cancel',
  });
  const again = breakerTransition(cancelled, { type: 'cooldown' });
  const other = finishProbe(admitProbe(again, 'probe-2'), {
    id: 'probe-2',
    generation: again.generation,
    outcome: 'other-error',
  });
  const newer = finishProbe(admitProbe(other, 'probe-3'), {
    id: 'probe-3',
    generation: other.generation,
    outcome: 'failure',
  });
  assertEqual([newer.state, newer.generation], ['open', 4], 'the newer circuit stays open');
  assertEqual(
    [
      opened.state,
      opened.generation,
      cancelled.state,
      cancelled.generation,
      other.state,
      other.generation,
      other.inFlight,
    ],
    ['open', 2, 'open', 3, 'half-open', 3, null],
    'the states of the middle breaker',
  );

  // The frame: three lanes to one controller, and one line at the foot.
  const [lanesRegion, foot] = area.rows([15, 3], 'none');
  const bands = lanesRegion.rows([3, 9, 3], 'none');
  const service = place(
    rect(340, lanesRegion.height, {
      radius: 18,
      stroke: COLOR.controller,
      fill: 'surface',
      width: 3,
    }),
    lanesRegion,
    'right',
  );
  const inside = boxOf(service).inset('normal');
  const serviceName = place(label('controller', { color: COLOR.controller }), inside, 'top left');
  const job = place(
    record(
      [
        [OP.job, COLOR.sure],
        [OP.state, 'ink'],
      ],
      inside.width,
    ),
    inside,
    'bottom',
  );
  const tenants = ['tenant A', 'tenant B', 'tenant C'].map((name, index) =>
    place(
      namedBox(name, { width: 240, height: index === 1 ? 110 : 84, color: COLOR.attempt }),
      bands[index],
      'left',
    ),
  );
  const lanes = tenants.map((tenant, index) =>
    breaker(s, {
      from: [boxOf(tenant).right + 14, bands[index].cy],
      to: [boxOf(service).left - 14, bands[index].cy],
      gap: index === 1 ? 220 : 110,
      ball: index === 1 ? 16 : 12,
    }),
  );
  const main = lanes[1];

  // The middle lane: its state, its two counts, and the admission check before its switch.
  const stateName = (name, generation, color) =>
    beside(
      label(`${name} · gen ${generation}`, { size: 48, color }),
      [main.x, main.top],
      'above',
      'tight',
    );
  const states = {
    closed: stateName('closed', 1, COLOR.sure),
    open: stateName(opened.state, opened.generation, COLOR.fail),
    half: stateName(halfOpen.state, halfOpen.generation, COLOR.mark),
    reopened: stateName(cancelled.state, cancelled.generation, COLOR.fail),
    halfAgain: stateName(other.state, other.generation, COLOR.mark),
    newer: stateName(newer.state, newer.generation, COLOR.fail),
  };
  const failures = places(s, opened.threshold, { size: 64 });
  const probe = places(s, 1, { size: 64, color: COLOR.mark });
  const meterNames = [note('failures that count'), note('probe')];
  const meter = (frames, name) =>
    column([row(frames, { gap: 'tight' }), name], { gap: 'tight', align: 'center' });
  beside(
    row([meter(failures.frames, meterNames[0]), meter(probe.frames, meterNames[1])], {
      gap: 'wide',
      align: 'top',
    }),
    [main.x, main.y],
    'under',
    'loose',
  );
  const checkAt = [main.from[0] + (main.to[0] - main.from[0]) * 0.2, main.y];
  const check = line([checkAt[0], main.y - 40], [checkAt[0], main.y + 40], {
    stroke: 'dim',
    width: 6,
  });
  const checkName = beside(
    note('schema error, denial: no count', { color: COLOR.fail }),
    [checkAt[0], main.y - 40],
    'above',
    'tight',
  );
  // The probe that is cancelled stops at three quarters of the lane.
  const stopAt = [main.from[0] + (main.to[0] - main.from[0]) * 0.78, main.y];

  // One line at the foot: what the voice says about the breaker as a whole.
  const lines = [
    'one breaker for each dependency, tenant and kind of failure',
    'this breaker lives in one event loop',
    'fleet behavior: choose shared or distributed control',
    'no verdict about health: it stays half-open',
    'Check job status at the controller',
  ].map((words, index) =>
    place(
      chip(words, {
        color: index === 4 ? COLOR.fail : COLOR.mark,
        stroke: index === 4 ? COLOR.fail : COLOR.mark,
      }),
      foot,
    ),
  );
  const old = token(`gen ${opened.generation}`, COLOR.sure);
  old.moveTo([main.to[0] - old.width / 2, main.y]);

  s.add(
    heading(c.title),
    service,
    serviceName,
    job,
    tenants,
    lanes.flatMap((lane) => lane.nodes),
    states.closed,
    failures.frames,
    failures.fills,
    meterNames[0],
  );
  c.clear([main.nodes[0]], 0.46, 0.2);

  // Times are seconds from the start of the scene.
  const origin = c.cue('documented').start - 0.4;
  const at = (seconds, build) => s.at(origin + seconds, build);
  const answer = (lane, color) => lane.answer(lane.call(color).at(...lane.to));
  // The two outer lanes pass calls throughout the scene. Each pass must finish before it ends.
  for (let time = 0.6; origin + time < c.end; time += 2.6) {
    for (const [lane, offset] of [[lanes[0], 0], [lanes[2], 1.3]]) {
      const pass = lane.pass(lane.call());
      if (origin + time + offset + pass.duration <= c.end)
        at(time + offset, () => s.play(pass));
    }
  }

  // A failure of the dependency counts. A schema error or a denial turns back before the switch.
  at(0.8, () =>
    s.play(
      seq(
        main.pass(main.call()),
        answer(main, COLOR.fail),
        failures.filled.to(1, { duration: 0.3 }),
      ),
    ),
  );
  c.on('documented', () => s.play(indicate(meterNames[0], { color: COLOR.mark, scale: 1 })), 1.4);
  c.show('other-boundary', [check, checkName]);
  c.on(
    'other-boundary',
    () => {
      const turned = main.call();
      s.play(
        seq(
          appear(turned),
          moveTo(turned, [checkAt[0] - 30, main.y], { duration: 0.5 }),
          recolor(turned, COLOR.fail, { duration: 0.1 }),
          moveTo(turned, main.from, { duration: 0.5 }),
          fadeOut(turned, { duration: 0.15 }),
        ),
      );
    },
    0.6,
  );
  c.show('health-scope', lines[0]);
  c.on('health-scope', () =>
    s.play(...tenants.map((tenant) => indicate(tenant, { color: COLOR.mark, scale: 1.05 }))),
  );
  // The quota of one tenant: its second failure opens its own switch, and only that one.
  at(11.6, () =>
    s.play(
      seq(
        main.pass(main.call()),
        answer(main, COLOR.fail),
        failures.filled.to(2, { duration: 0.3 }),
      ),
    ),
  );
  c.swap('quota', states.closed, states.open, { lead: -0.6 });
  c.on('quota', () => s.play(main.open()), 0.5);
  [15.4, 17.2, 20.4, 24.6].forEach((time) => at(time, () => s.play(main.refuse(main.call()))));
  c.swap('local-loop', lines[0], lines[1]);
  c.swap('fleet', lines[1], lines[2]);

  // A probe that is cancelled frees its place, and the breaker opens again at a new generation.
  const first = main.call(COLOR.mark);
  c.swap('canceled-probe', states.open, states.half);
  c.show('canceled-probe', [probe.frames, probe.fills, meterNames[1]]);
  c.hide('canceled-probe', lines[2]);
  c.on('canceled-probe', () =>
    s.play(
      main.halfOpen(),
      seq(
        par(appear(first), probe.filled.to(1, { duration: 0.3 })),
        moveTo(first, stopAt, { duration: 1.2 }),
        par(recolor(first, 'dim', { duration: 0.2 }), probe.filled.to(0, { duration: 0.4 })),
      ),
    ),
  );
  c.swap('probe-cancel', states.half, states.reopened);
  c.on('probe-cancel', () => s.play(main.open(), moveTo(first, main.from, { duration: 1.2 })));
  c.hide('non-health', first);
  // An error that is not about health frees the place too, and gives no verdict.
  c.swap('non-health', states.reopened, states.halfAgain);
  c.on('non-health', () =>
    s.play(
      main.halfOpen(),
      seq(
        par(main.pass(main.call(COLOR.mark)), probe.filled.to(1, { duration: 0.3 })),
        answer(main, 'ink'),
        probe.filled.to(0, { duration: 0.4 }),
      ),
    ),
  );
  c.show('probe-nonhealth', lines[3]);
  c.on('probe-nonhealth', () =>
    s.play(indicate(states.halfAgain, { color: COLOR.mark, scale: 1.06 })),
  );
  // A new qualifying failure opens the circuit before the old result returns.
  c.swap('old-result', states.halfAgain, states.newer);
  c.hide('old-result', lines[3]);
  c.on('old-result', () => s.play(main.open()));
  // An old result goes to its caller, and the state stays. The record of the controller stays too.
  c.on(
    'old-result',
    () =>
      s.play(
        seq(appear(old), moveTo(old, [main.from[0] + old.width / 2, main.y], { duration: 1.6 })),
      ),
    0.8,
  );
  c.on('old-result', () => s.play(indicate(states.newer, { color: COLOR.mark, scale: 1.06 })), 3.4);
  c.show('not-proof', lines[4]);
  c.on('not-proof', () => s.play(indicate(job, { color: COLOR.mark })), 1.2);
}
