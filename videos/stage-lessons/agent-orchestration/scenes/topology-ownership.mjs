// Scene `topology-ownership`: who holds the conversation when work returns.
//
// The picture: the right side of the board stays. The left side becomes the lanes of one
// conversation: the user, Vega the manager, a health specialist, a release specialist. A yellow
// baton is the control of the conversation, and it leaves a trail on the lane that holds it. For a
// tool call the baton stays with Vega while a question goes down and a verdict comes back. For a
// handoff the baton itself moves. The application chooses the starting agent for the next run.
import {
  arrow,
  beside,
  boxOf,
  connector,
  draw,
  dot,
  dynamic,
  indicate,
  line,
  linear,
  pictogram,
  place,
  polyline,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { chip, heading, label, namedBox, note } from '../../kit-narrated.mjs';
import { BAND, BRANCH_COLOR, LEFT, MARK, QUIET, STATE, VALID, WRONG, board } from '../parts.mjs';

const HEALTH = 1;
const lerp = (a, b, t) => a + (b - a) * t;
/** When each thing happens on the lanes, in steps of the conversation. */
const T = {
  first: 0.3,
  ask: 1,
  answer: 2,
  second: 3.4,
  handFrom: 4.6,
  handTo: 5.2,
  third: 7.2,
  end: 7.9,
};
/** The steps that one more layer adds to each direction of a call. */
const HOP = 0.5;

export default function topologyOwnership(s, c) {
  const b = board(s, STATE.applied);
  const { fan, slots, approval, steps, targetFrame } = b.nodes;
  s.add(heading(c.title));
  b.enter(c);

  // Beat 0, first part. The board is a graph workflow: edges, slots and gates. It need not be a DAG.
  c.on('topology-ownership-construct-0', () =>
    s.play(
      ...fan.map((edge) => edge.pulse({ color: MARK })),
      indicate(slots, { color: MARK }),
      ...b.gate.map((gate) =>
        seq(gate.lamp.to(1, { duration: 0.4 }), gate.lamp.to(0, { duration: 0.6 })),
      ),
    ),
  );
  const down = boxOf(steps[0]);
  const loop = arrow([down.cx + 60, down.bottom], [down.cx + 60, down.top], {
    stroke: MARK,
    width: 4,
  });
  const generated = place(
    namedBox('generated worker', { width: 320, height: 96, color: QUIET, dash: [10, 8] }),
    BAND,
    'top left',
  );
  c.show('not-dag', [draw(loop, { duration: 0.6 }), generated]);

  // The lanes of the conversation. A lane is one party, and time runs to the right.
  const Y = {
    user: LEFT.top + 70,
    vega: LEFT.top + 230,
    layer: LEFT.top + 360,
    health: LEFT.top + 490,
    release: LEFT.top + 650,
  };
  const RAIL = { left: LEFT.left + 215, right: LEFT.right - 10, unit: 124 };
  const x = (time) => RAIL.left + 25 + time * RAIL.unit;
  const party = (words, y, color = 'ink', role = null) => [
    label(words, LEFT.left, role ? y - 16 : y, { size: 36, anchor: 'left', color }),
    ...(role ? [note(role, { anchor: 'left' }).at(LEFT.left, y + 22)] : []),
    line([RAIL.left, y], [RAIL.right, y], { stroke: 'faint', width: 2 }),
  ];
  const parties = [
    ...party('user', Y.user),
    ...party('Vega', Y.vega, 'ink', 'manager'),
    ...party('health', Y.health, BRANCH_COLOR[HEALTH], 'specialist'),
    ...party('release', Y.release, 'ink', 'specialist'),
  ];
  const layer = party('coordinator', Y.layer, QUIET);
  const replayTool = note('Replay', { anchor: 'left', color: MARK }).at(LEFT.left, LEFT.top + 16);
  const replayHandoff = note('Replay', { anchor: 'left', color: MARK }).at(
    LEFT.left,
    LEFT.top + 16,
  );
  const pill = (px, py, opacity = 1) =>
    rect(70, 36, { radius: 18, stroke: null, fill: MARK, opacity }).at(px, py);
  const legend = [
    pill(RAIL.right - 250, LEFT.top + 16),
    note('the conversation', { anchor: 'left' }).at(RAIL.right - 200, LEFT.top + 16),
  ];

  /** The time of the conversation, and how many layers stand between Vega and the specialist. */
  const now = s.value(0),
    depth = s.value(0),
    shown = s.value(0);
  /** A later message of the user: how much of it shows, and the lane where the third one lands. */
  const third = s.value(0),
    rerouted = s.value(0);
  const runBreak = 6.3;
  const hop = s.value(0),
    journey = s.value(0);
  const owner = (time) =>
    time <= T.handFrom
      ? Y.vega
      : time >= T.handTo
        ? Y.release
        : lerp(Y.vega, Y.release, (time - T.handFrom) / (T.handTo - T.handFrom));
  const flow = dynamic(() => {
    const opacity = shown.value;
    if (opacity < 0.02) return [];
    const time = now.value,
      extra = HOP * depth.value;
    const parts = [];
    const drop = (at, from, to, color, alpha = 1) => {
      const head = to > from ? to - 8 : to + 8;
      parts.push(
        arrow([x(at), from + (to > from ? 6 : -6)], [x(at), head], {
          stroke: color,
          width: 3,
          opacity: alpha * opacity,
        }),
      );
    };
    const bar = (from, to, y, color) => {
      const end = Math.min(time, to);
      if (end - from > 0.02)
        parts.push(
          rect((end - from) * RAIL.unit, 30, {
            radius: 6,
            stroke: null,
            fill: color,
            opacity: 0.9 * opacity,
          }).at(x((from + end) / 2), y),
        );
    };
    const word = (words, at, color, gap) =>
      parts.push(
        note(words, { anchor: 'right', color })
          .at(x(at) - gap, (Y.vega + Y.layer) / 2)
          .opacity(opacity),
      );
    // The trail of the baton: the lane that held the conversation, up to now.
    const trail = [[x(0), Y.vega]];
    trail.push([x(Math.min(time, T.handFrom)), Y.vega]);
    if (time > T.handFrom)
      trail.push([x(Math.min(time, T.handTo)), owner(Math.min(time, T.handTo))]);
    if (time > T.handTo) trail.push([x(Math.min(time, runBreak - 0.1)), Y.release]);
    parts.push(polyline(trail, { stroke: MARK, width: 10, opacity: 0.8 * opacity }));
    const nextOwner = lerp(Y.release, Y.vega, rerouted.value);
    if (time > runBreak + 0.1)
      parts.push(
        line([x(runBreak + 0.1), nextOwner], [x(time), nextOwner], {
          stroke: MARK,
          width: 10,
          opacity,
        }),
      );
    // An incoming message for a new run appears only after the application chooses its agent.
    if (time >= T.first) drop(T.first, Y.user, Y.vega, 'ink');
    if (third.value > 0.02 && time >= T.third)
      drop(T.third, Y.user, lerp(Y.release, Y.vega, rerouted.value), 'ink', third.value);
    // The tool call: a question goes down, the specialist works, a verdict comes back.
    if (time >= T.ask) {
      word('question', T.ask, QUIET, 28);
      if (extra < 0.02) drop(T.ask, Y.vega, Y.health, QUIET);
      else {
        drop(T.ask, Y.vega, Y.layer, QUIET);
        bar(T.ask, T.ask + extra, Y.layer, QUIET);
        if (time >= T.ask + extra) drop(T.ask + extra, Y.layer, Y.health, QUIET);
      }
    }
    bar(T.ask + extra, T.answer + extra, Y.health, BRANCH_COLOR[HEALTH]);
    if (time >= T.answer + extra) {
      if (extra < 0.02) drop(T.answer, Y.health, Y.vega, BRANCH_COLOR[HEALTH]);
      else {
        drop(T.answer + extra, Y.health, Y.layer, BRANCH_COLOR[HEALTH]);
        bar(T.answer + extra, T.answer + 2 * extra, Y.layer, QUIET);
        if (time >= T.answer + 2 * extra)
          drop(T.answer + 2 * extra, Y.layer, Y.vega, BRANCH_COLOR[HEALTH]);
      }
    }
    if (time >= T.answer + 2 * extra) word('verdict', T.answer + 2 * extra, BRANCH_COLOR[HEALTH], 14);
    if (journey.value > 0.02) {
      const stops = [
        [x(T.ask), Y.vega],
        [x(T.ask), Y.layer],
        [x(T.ask + HOP), Y.health],
        [x(T.answer + HOP), Y.layer],
        [x(T.answer + 2 * HOP), Y.vega],
      ];
      const segment = Math.min(3, Math.floor(hop.value));
      const p = hop.value - segment;
      const [a, z] = stops.slice(segment, segment + 2);
      // Follow the drawn rails, including the health work before the verdict returns.
      const dx = Math.abs(z[0] - a[0]),
        dy = Math.abs(z[1] - a[1]);
      const distance = (dx + dy) * p;
      const pos =
        distance < dx
          ? [lerp(a[0], z[0], distance / dx), a[1]]
          : [z[0], lerp(a[1], z[1], (distance - dx) / dy)];
      parts.push(
        dot(13, segment < 2 ? 'ink' : BRANCH_COLOR[HEALTH])
          .at(...pos)
          .opacity(journey.value),
      );
    }
    parts.push(pill(x(time), time > runBreak ? nextOwner : owner(time), opacity));
    return parts;
  }).zIndex(3);
  s.add(flow);

  // Beat 0, second part. A supervisor keeps the baton. A handoff moves it. A selector is a third thing.
  c.swap('supervisor', [...b.leftSide, loop, generated], [...parties, ...legend]);
  const call = c.cue('supervisor'),
    handoff = c.cue('handoff-moves');
  c.on('supervisor', () =>
    s.play(
      seq(
        shown.to(1, { duration: 0.4 }),
        now.to(T.second - 0.4, { duration: handoff.start - call.start - 0.8, ease: linear }),
      ),
    ),
  );
  c.on('handoff-moves', () => s.play(now.to(T.handTo + 0.5, { duration: 2.2, ease: linear })));
  // The free rooms of the picture: between two lanes, at the left or at the right of the handoff.
  const between = (Y.vega + Y.layer) / 2,
    under = (Y.health + Y.release) / 2,
    afterHandoff = x(T.handTo) + 20;
  const history = chip('history', { dash: [8, 6] }).at(afterHandoff, between);
  c.show('configured-history', history);
  const selector = [chip('selector', { dash: [8, 6], color: QUIET }).at(afterHandoff, Y.user + 56)];
  selector.push(beside(note('picks who speaks'), selector[0], 'under', 'tight', 'left'));
  c.show('group-chat', selector);

  // Beat 1. The same two patterns, by what the next message of the user does.
  const patterns = [
    note('tool call', { color: MARK }).at(x((T.ask + T.answer) / 2), LEFT.top + 16),
    note('handoff', { color: MARK }).at(x(T.handFrom), LEFT.top + 16),
  ];
  const requestCard = (question, color) =>
    beside(
      chip(question, { stroke: color }),
      [x(T.first), (Y.user + Y.vega) / 2],
      'right',
      'normal',
    );
  const healthRequest = requestCard('Health verdict?', BRANCH_COLOR[HEALTH]);
  const releaseRequest = requestCard('Release triage?', QUIET);
  c.swap('topology-ownership-construct-1', [...selector, history], healthRequest);
  c.show('name-tool', patterns[0], { lead: 0 });
  // Mark each replay before hiding the flow, then reset while the baton and trail are concealed.
  c.show(1, replayTool, { lead: 0.8, fade: 0.2 });
  c.onBeat(1, () => s.play(shown.to(0, { duration: 0.2 })), -0.4);
  c.onBeat(1, () => {
    now.set(0);
    s.play(shown.to(1, { duration: 0.3 }));
  });
  c.hide(1, replayTool, { lead: -1.2, fade: 0.2 });
  const caseStart = c.cue('topology-ownership-construct-1');
  const boundedCall = c.cue('bounded-tool-call');
  c.on('topology-ownership-construct-1', () =>
    s.play(now.to(T.ask, { duration: boundedCall.start - caseStart.start, ease: linear })),
  );
  c.on('bounded-tool-call', () =>
    s.play(now.to(T.second, { duration: boundedCall.end - boundedCall.start, ease: linear })),
  );

  c.swap('release-triage', healthRequest, releaseRequest, { lead: 0 });
  c.swap('handoff-active-control', releaseRequest, [patterns[1], history], { lead: 0 });
  c.on('handoff-active-control', () => s.play(now.to(T.handTo + 0.4, { duration: 1.2 })));
  const divider = line([x(runBreak), Y.user + 14], [x(runBreak), Y.release + 16], {
    stroke: QUIET,
    width: 3,
    dash: [12, 8],
  });
  const nextRun = note('Next run', { anchor: 'left', color: MARK }).at(
    x(T.third) + 16,
    Y.user + 38,
  );
  const appChoice = note('App selects release', { anchor: 'right', color: MARK }).at(
    RAIL.right,
    Y.release + 48,
  );
  c.swap('next-run', history, [divider, nextRun], { lead: 0 });
  c.show('start-specialist', appChoice, { lead: 0 });
  c.on('start-specialist', () =>
    s.play(third.to(1, { duration: 0.2 }), now.to(T.end, { duration: 1.2, ease: linear })),
  );
  const bounds = ['inputs', 'outputs', 'turns', 'spend'].map((words) => chip(words));
  place(row(bounds, { gap: 'tight' }), LEFT.inset('none', 'none'), 'bottom left');
  c.show('bound-all', bounds, { stagger: 0.5 });
  // One more layer: the call makes two hops each way, and the verdict comes back later.
  c.swap('hierarchy', [patterns[1], divider, nextRun, appChoice, ...bounds], layer);
  c.on('hierarchy', () => {
    now.set(T.first);
    third.set(0);
    depth.set(1);
  });
  const replayStart = c.cue('replay-hops').start;
  const atCoordinator = c.cue('ask-coordinator').end;
  c.on('replay-hops', () => {
    journey.set(1);
    s.play(
      now.to(T.ask, { duration: 0.45 }),
      hop.to(0.65, { duration: c.cue('ask-coordinator').start - replayStart, ease: linear }),
    );
  });
  c.on('ask-coordinator', () =>
    s.play(hop.to(1, { duration: atCoordinator - c.cue('ask-coordinator').start, ease: linear })),
  );
  for (const [cue, progress, time] of [
    ['ask-health', 2, T.ask + HOP],
    ['return-verdict', 3, T.answer + HOP],
    ['return-vega', 4, T.answer + 2 * HOP],
  ]) {
    const { start, end } = c.cue(cue);
    c.on(cue, () =>
      s.play(
        hop.to(progress, { duration: end - start, ease: linear }),
        now.to(time, { duration: end - start, ease: linear }),
      ),
    );
  }
  const latency = [
    pictogram('stopwatch', { size: 52, color: QUIET, accent: MARK }).at(
      x(T.ask) + 30,
      (Y.health + Y.release) / 2,
    ),
  ];
  latency.push(beside(note('latency', { color: MARK }), latency[0], 'right', 'tight'));
  c.show('measure-costs', latency);

  // Beat 2. What crosses with a handoff, and what does not.
  const untrusted = beside(note('untrusted', { color: WRONG }), history, 'under', 'tight', 'left');
  // Each check belongs to the yellow transfer route. The baton waits at its closed gate.
  const gateTimes = [0.45, 0.75].map((part) => T.handFrom + part * (T.handTo - T.handFrom));
  const gateOpen = gateTimes.map(() => s.value(0));
  const gates = ['filter history', 'validate arguments'].map((words, i) =>
    beside(chip(words), [x(gateTimes[i]) + 35, owner(gateTimes[i])], 'right', 'none'),
  );
  const gateLinks = gateTimes.map((time, i) =>
    line([x(time) + 20, owner(time)], boxOf(gates[i]).point('left'), {
      stroke: QUIET,
      width: 2,
    }),
  );
  const transferGates = dynamic(() =>
    gateTimes.flatMap((time, i) => {
      const open = gateOpen[i].value;
      const y = owner(time);
      const half = 24;
      return [
        line([x(time) - half, y - open * half], [x(time) + half, y - open * half], {
          stroke: open > 0.9 ? VALID : MARK,
          width: 5,
          opacity: 1 - open,
        }),
        ...(open > 0.9
          ? [pictogram('check', { size: 30, accent: VALID }).at(x(time) + 16, y)]
          : []),
      ];
    }),
  ).zIndex(4);
  const senderTools = chip('tools of Vega').at(x(T.answer) + 18, between);
  const stays = beside(
    pictogram('cross', { size: 44, accent: WRONG }),
    senderTools,
    'right',
    'tight',
  );
  const grantX = x(T.handTo) + 130;
  const policy = namedBox('policy', { width: 170, height: 76, color: VALID }).at(
    grantX,
    LEFT.bottom - 40,
  );
  const grant = arrow([grantX, LEFT.bottom - 82], [grantX, Y.release + 10], {
    stroke: VALID,
    width: 4,
  });
  const receiverTools = chip('tools', { color: VALID, stroke: VALID }).at(
    grantX + 24,
    (Y.release + LEFT.bottom - 82) / 2,
  );
  const early = chip('enabled?', { color: QUIET, dash: [8, 6] }).at(
    x(T.second) + 24,
    (Y.user + Y.vega) / 2,
  );
  const denial = beside(
    note('raise on denial', { color: WRONG }),
    gates[1],
    'under',
    'tight',
    'left',
  );
  const guard = pictogram('shield', { size: 52, color: QUIET, accent: VALID }).at(
    x(T.ask) + 36,
    (Y.layer + Y.health) / 2,
  );
  const noGuard = [
    pictogram('shield', { size: 52, color: QUIET, accent: QUIET }).at(
      x(T.handFrom) - 36,
      Y.health - 46,
    ),
  ];
  noGuard.push(
    beside(pictogram('cross', { size: 36, accent: WRONG }), noGuard[0], 'left', 'tight'),
  );
  c.swap('topology-ownership-construct-2', [...layer, ...latency], [history, patterns[1]]);
  c.show(2, replayHandoff, { lead: 0.8, fade: 0.2 });
  c.onBeat(2, () => s.play(shown.to(0, { duration: 0.2 })), -0.4);
  c.on('topology-ownership-construct-2', () => {
    journey.set(0);
    now.set(T.handFrom);
    depth.set(0);
    third.set(0);
    s.play(shown.to(1, { duration: 0.3 }));
  });
  c.hide(2, replayHandoff, { lead: -1.2, fade: 0.2 });
  c.show('topology-ownership-construct-2', untrusted, { lead: -0.6 });
  c.show('rebuild-tools', [senderTools, stays]);
  c.show('rebuild-tools', [policy, draw(grant, { duration: 0.6 }), receiverTools], { after: true });
  c.show('two-checks', [...gates, ...gateLinks, transferGates]);
  c.on('two-checks', () => s.play(now.to(gateTimes[0], { duration: 0.7, ease: linear })));
  c.after('two-checks', () =>
    s.play(
      seq(
        gateOpen[0].to(1, { duration: 0.3 }),
        now.to(gateTimes[1] - 0.025, { duration: 0.6, ease: linear }),
      ),
    ),
  );
  c.show('enablement', early);
  c.on('transfer-boundary', () => s.play(indicate(gates[1], { color: MARK, scale: 1 })));
  c.after('transfer-boundary', () =>
    s.play(
      seq(
        gateOpen[1].to(1, { duration: 0.3 }),
        now.to(T.handTo + 0.5, { duration: 0.8, ease: linear }),
      ),
    ),
  );
  c.show('transfer-boundary', denial, { after: true });
  c.show('guardrails', guard);
  c.show('guardrails', noGuard, { after: true });

  // Beat 3. A framework can change the routing. And a tool that is gone is a boundary that holds.
  const framework = chip('framework').at(x(T.second) + 24, (Y.user + Y.vega) / 2);
  const pinned = beside(
    pictogram('pin', { size: 48, color: QUIET, accent: MARK }),
    framework,
    'right',
    'tight',
  );
  const details = [
    history,
    untrusted,
    ...gates,
    ...gateLinks,
    transferGates,
    senderTools,
    stays,
    policy,
    grant,
    receiverTools,
    early,
    denial,
    guard,
    ...noGuard,
  ];
  c.swap('topology-ownership-construct-3', details, framework);
  c.show('migration', [divider, nextRun]);
  c.on('migration', () =>
    s.play(
      third.to(1, { duration: 0.3 }),
      now.to(T.end, { duration: 0.5 }),
      rerouted.to(1, { duration: 0.9 }),
    ),
  );
  c.show('pin-test', pinned);
  c.on('pin-test', () => s.play(rerouted.to(0, { duration: 0.9 })), 0.8);
  // Words say that the specialist only reads. Its write tool still reaches the target.
  const said = chip('told: read only', { dash: [8, 6], color: QUIET });
  const tools = [chip('read'), chip('write', { color: WRONG, stroke: WRONG })];
  beside(row([said, ...tools], { gap: 'tight' }), [x(T.first), under - 20], 'right', 'none');
  const reach = connector(tools[1], targetFrame, {
    route: 'ortho',
    from: 'bottom',
    to: 'left',
    toOffset: 0.5,
    color: WRONG,
    width: 4,
    dash: [12, 9],
    tip: true,
  });
  c.show('read-only-intent', [said, ...tools]);
  c.show('read-only-intent', draw(reach, { duration: 0.9 }), { lead: -1.6 });
  c.hide('enforces', [tools[1], reach], { lead: -1.2 });
  c.on(
    'enforces',
    () => s.play(indicate([approval.frame, approval.title], { color: MARK, scale: 1 })),
    2.4,
  );
  // The board comes back for the next scene.
  c.swap(
    'enforces',
    [...parties, ...legend, ...patterns, divider, nextRun, framework, pinned, said, tools[0]],
    b.leftSide,
    { after: true },
  );
  c.after('enforces', () => s.play(shown.to(0, { duration: 0.3 })), -0.1);

  b.leave(c, STATE.applied);
}
