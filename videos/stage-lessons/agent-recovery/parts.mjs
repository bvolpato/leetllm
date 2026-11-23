// What the scenes of `agent-recovery` share: the line of one operation, and the job of each color.
//
// The example that stays: an approved rollback to rev-17, with the key rb-842-1, goes from the
// agent to the controller. A request travels on the upper lane, and a reply comes back on the
// lower lane, into the view of the agent. The controller holds its records over a commit line
// until they are durable, and under it after that. See PLAN.md.
import {
  appear,
  arrow,
  beside,
  boxOf,
  circle,
  dot,
  dynamic,
  fadeIn,
  fadeOut,
  group,
  line,
  moveTo,
  par,
  place,
  recolor,
  rect,
  row,
  seq,
  to,
} from 'vizmatic/stage';
import { commitScenario } from '../../films/agent-recovery/model.mjs';
import { area, label, mono, namedBox, note } from '../kit-narrated.mjs';

const committed = commitScenario('after-commit');

/** The operation of the lesson. The key, the job and its state come from the model. */
export const OP = Object.freeze({
  key: committed.ledger,
  job: committed.job.id,
  state: committed.job.state,
  action: 'rollback',
  revision: 'rev-17',
});

/** Scene-end states. A start label identifies each deliberate rewind or alternative view. */
export const STATE = Object.freeze({
  'subject-intro': { controller: 'one durable job, queued', agent: 'job-1 queued when checked' },
  'action-boundary': { controller: 'no new write', agent: 'permission denied' },
  'operation-identity': {
    alternativeKey: 'k-7f3a',
    controller: 'job-1 and job-2 durable',
    agent: 'job-1 returned; changed payload conflicts',
    startLabel: 'rewind: approved, not sent',
  },
  'commit-boundary': {
    controller: 'one durable job, queued',
    agent: 'queued when checked; completion unobserved',
    startLabel: 'alternative faults: first dispatch',
  },
  'retry-clock': { controller: 'unchanged', agent: 'retry stopped at deadline' },
  'progress-budget': { controller: 'one durable job, queued', agent: 'operation key reconciled' },
  'circuit-breaker': { controller: 'unchanged', agent: 'old result returned; generation 4 open' },
  'resume-with-evidence': {
    controller: 'one durable job, queued',
    agent: 'queued when checked; observation time retained',
    startLabel: 'checkpoint view: no fresh read',
  },
  'replay-contract': {
    controller: 'primary has job-1',
    agent: 'unknown from lagging replica; new proposal gated',
  },
  'workflow-world': {
    controller: 'one durable job, queued',
    agent: 'receipt saved after replay',
    startLabel: 'rewind: before first dispatch',
  },
  'spend-budget': { controller: 'unchanged', agent: 'unknown usage keeps its reservation' },
  'breaker-contract': {
    controller: 'one queued job; remote cancellation unverified',
    agent: 'old result returned; generation 4 open',
  },
  'fallback-evidence': {
    controller: 'current state unobserved',
    agent: 'dated completed observation; current status unavailable',
  },
  compensation: {
    controller: 'pods keep their new placements',
    agent: 'uncordon only permits future scheduling',
  },
  'recovery-transfer': {
    controller: 'job-7 running at 14:08',
    agent: 'status read permitted, further write approval withdrawn',
  },
});

/** One color has one job through the lesson. */
export const COLOR = Object.freeze({
  /** The operation: its key and its payload, on the card, on a token and in the ledger. */
  op: 'pink',
  /** What the agent side sends or picks: a proposal, an attempt, a read, a sampled wait. */
  attempt: 'cyan',
  /** The controller and what it owns: its panel, the commit line, a wait that the service sets. */
  controller: 'blue',
  /** What is established: an approval, a committed record, job-1, a verified observation. */
  sure: 'green',
  /** What the voice names now, and the one result that matters. */
  mark: 'yellow',
  /** A failure: a lost reply, a timeout, a denial, a conflict, a fault. */
  fail: 'red',
  /** What is done or quiet. */
  quiet: 'dim',
});

/** The frame of the lesson: the line of the operation fills the area of a scene. */
export const BOARD = area;

/** The size of a box of an actor, of the text on a token and in a record, and the height of a record. */
const ACTOR = { width: 300, height: 110 };
export const TOKEN_SIZE = 32;
const RECORD_SIZE = 38;
const RECORD_HEIGHT = 80;
/** The room between a token and the door that it stops at. */
const DOCK = 14;

/**
 * A token: a pill that travels on a lane. Its words are one text in the color of the token, or
 * parts with their own colors, such as `[[OP.key, COLOR.op], ['rev-18', COLOR.fail]]`. `tag` is a
 * short name before the words, such as the trace of an attempt, in the color of the agent side.
 */
export function token(words, color = COLOR.attempt, { tag, size = TOKEN_SIZE, dash } = {}) {
  const parts = typeof words === 'string' ? [[words, color]] : words;
  const texts = row(
    [
      tag && mono(tag, { size, color: COLOR.attempt }),
      ...parts.map(([part, tint]) => mono(part, { size, color: tint })),
    ],
    { gap: 'tight' },
  );
  const box = boxOf(texts);
  const plate = rect(box.width + size * 1.3, size * 1.9, {
    radius: size * 0.95,
    fill: 'bg',
    stroke: color,
    width: 3,
    ...(dash ? { dash } : {}),
  }).moveTo(box.point());
  // A token is over the lanes and the marks on them, so its plate hides what it passes.
  const node = group(plate, texts).zIndex(2);
  node.data.plate = plate;
  node.data.texts = texts.nodes;
  return node;
}

/**
 * Give a token or a record another color: its border and its words, and not its plate. A plate
 * stays opaque, so a lane does not show through a token that goes quiet.
 */
export function tint(node, color, options = {}) {
  return to(
    node,
    () => {
      node.data.plate.stroke(color);
      for (const words of node.data.texts) words.color(color);
    },
    { duration: 0.4, ...options },
  );
}

/**
 * A record of the controller: a plate of the width of its column, with parts in their colors,
 * such as `record([[OP.key, COLOR.op], ['→', 'dim'], [OP.job, COLOR.sure]], width)`.
 */
export function record(parts, width, { color = COLOR.sure, dash } = {}) {
  const texts = row(
    parts.map(([words, tint]) => mono(words, { size: RECORD_SIZE, color: tint })),
    { gap: 'tight' },
  );
  const plate = rect(width, RECORD_HEIGHT, {
    radius: 10,
    fill: 'bg',
    stroke: color,
    width: 2.5,
    ...(dash ? { dash } : {}),
  }).moveTo(boxOf(texts).point());
  const node = group(plate, texts);
  node.data.plate = plate;
  node.data.texts = texts.nodes;
  return node;
}

/** A red cross: the place where a message is lost. */
export function cross(size = 44) {
  const half = size / 2;
  const style = { stroke: COLOR.fail, width: 7 };
  return group(
    line([-half, -half], [half, half], style),
    line([-half, half], [half, -half], style),
  );
}

/** A numbered pin, for a place on the line that the voice names. */
export function pin(number) {
  return group(
    circle(24, { stroke: COLOR.mark, fill: 'bg', width: 3 }),
    mono(String(number), { size: 30, color: COLOR.mark }),
  );
}

/**
 * A token leaves a place and travels to another one. It shows at once, with no fade: a token
 * that fades in over a lane lets the lane show through its words.
 */
export function travel(node, target, options = {}) {
  return seq(appear(node), moveTo(node, target, { duration: 1, ...options }));
}

/** The place of a token that stops before a point, at the side that it comes from. */
export function docked(node, point, side = 'left') {
  const reach = node.width / 2 + DOCK;
  return [point[0] + (side === 'left' ? -reach : reach), point[1]];
}

/**
 * The line of the operation, in a region: the agent and its view at the left, the two lanes,
 * and the controller with its commit line at the right. It returns the nodes and the places
 * that a scene needs. `shares` are the widths of the agent side, the wire and the controller.
 */
export function board({
  region = BOARD,
  shares = [6, 12, 14],
  agentName = 'agent',
  ledger = true,
  rows = 3,
  view: withView = true,
} = {}) {
  const [agentColumn, wire, store] = region.columns(shares, 'none');
  const [agentUpper, agentLower] = agentColumn.rows(2, 'none');

  // The agent side: the agent at the upper lane, and what it knows at the lower lane.
  const agent = place(namedBox(agentName, { ...ACTOR, color: COLOR.attempt }), agentUpper, 'left');
  const view = place(
    rect(ACTOR.width, ACTOR.height, {
      radius: 14,
      stroke: 'dim',
      fill: null,
      width: 2.5,
      dash: [10, 8],
    }),
    agentLower,
    'left',
  );
  const viewName = beside(note('what the agent knows'), view, 'above', 'tight', 'left');

  // The controller: one panel. Its upper half is the transaction, and its lower half is durable.
  const panel = rect(store.width, store.height, {
    radius: 18,
    stroke: COLOR.controller,
    fill: 'surface',
    width: 3,
  }).moveTo(store.point());
  const [staged, durable] = store.inset('normal').rows(2, 'none');
  const name = place(label('controller', { color: COLOR.controller }), staged, 'top left');
  const commit = line([store.left, store.cy], [store.right, store.cy], {
    stroke: COLOR.controller,
    width: 3,
    dash: [12, 10],
  });
  // The name of the line is at its left end, outside the panel: no record passes there.
  const commitName = beside(
    note('commit line', { color: COLOR.controller }),
    [store.left, store.cy],
    'left',
    'tight',
  );
  // The names of the two columns are over the records, so a record that goes down passes no text.
  const columns = (zone) => zone.columns([4, 3], 'normal');
  const [ledgerHead, jobsHead] = columns(staged.beside(name, 'under', 'tight'));
  const heads = [
    place(note('operation ledger'), ledgerHead, 'top left'),
    place(note('queued jobs'), jobsHead, 'top left'),
  ];
  const durableRows = durable.inset('none', 'normal').rows(rows, 'tight').map(columns);
  const stagedRow = columns(staged);

  // The two lanes: a request goes to the right, and a reply comes back to the left.
  const out = [boxOf(agent).right, agentUpper.cy];
  const door = [store.left, agentUpper.cy];
  const exit = [store.left, agentLower.cy];
  const home = [boxOf(view).right, agentLower.cy];
  const lane = { stroke: 'faint', width: 3, pad: 12 };
  const request = arrow(out, door, lane);
  const reply = arrow(exit, home, lane);

  return {
    region,
    wire,
    store,
    agent,
    view,
    viewName,
    panel,
    name,
    commit,
    commitName,
    heads,
    request,
    reply,
    /** The ends of the lanes: where a request starts and stops, and where a reply starts and stops. */
    out,
    door,
    exit,
    home,
    /** The middle of the view, for what the agent knows now. */
    viewBox: boxOf(view),
    /**
     * A request goes into the controller: it passes the door, and then it is gone. It fades inside
     * the panel, where no lane is behind its words.
     */
    absorb: (node) =>
      seq(
        moveTo(node, [store.left + node.width / 2 + 24, agentUpper.cy], { duration: 0.35 }),
        fadeOut(node, { duration: 0.25 }),
      ),
    /** The place of a token that waits over the request lane, near the door: place 0, then place 1. */
    shelf: (node, index = 0) => [
      store.left - node.width / 2 - DOCK,
      agentUpper.cy - (index + 1) * (node.height + 12),
    ],
    /**
     * A reply is lost: it travels a share of its way back, a cross marks the place, and the reply
     * falls off the lane and goes quiet. So the lane is free for the next reply.
     */
    lose: (node, mark, share = 0.55) => {
      const x = exit[0] + (home[0] - exit[0]) * share;
      mark.moveTo([x - node.width / 2 - 36, exit[1]]);
      return seq(
        travel(node, [x, exit[1]], { duration: 0.9 }),
        fadeIn(mark, { duration: 0.2 }),
        par(
          tint(node, COLOR.quiet),
          to(node, () => node.moveTo([x, exit[1] + node.height + 20]).rotate(0.1), {
            duration: 0.5,
          }),
        ),
      );
    },
    /** The place of the cross of a lost reply, for a scene that draws a line through it. */
    crossAt: (node, share = 0.55) => [
      exit[0] + (home[0] - exit[0]) * share - node.width / 2 - 36,
      exit[1],
    ],
    /** A reply arrives: it travels the whole lane, into the view of the agent. */
    arrive: (node, options = {}) =>
      travel(node, boxOf(view).point(), { duration: 1.3, ...options }),
    /** The region of a record over the commit line, and under it, for a note. */
    stagedBox: (column) => stagedRow[column],
    durableBox: (column, index = 0) => durableRows[index][column],
    /** The width of a record: column 0 is the ledger, and column 1 is the jobs. */
    recordWidth: (column) => stagedRow[column].width,
    /** The place of a record over the commit line. */
    stagedAt: (column) => stagedRow[column].point(),
    /** The place of a record under the commit line, in a row of the durable zone. */
    durableAt: (column, index = 0) => durableRows[index][column].point(),
    /**
     * Take the lanes away just before the scene ends. A token that rests on a lane fades with the
     * scene, and the lane must not show through its words then.
     */
    close: (c) => c.clear(withView ? [request, reply] : [request], 0.46, 0.2),
    /** The first picture of a scene that shows the whole line. */
    base: [
      agent,
      ...(withView ? [view, viewName, reply] : []),
      panel,
      name,
      commit,
      commitName,
      ...(ledger ? heads : [heads[1]]),
      request,
    ],
    /** The lower half of the agent side, for a scene that shows another thing there than the view. */
    agentLower,
  };
}

/** The width of the line of a wall, and the height of its door. */
const WALL = { width: 8, door: 100 };

/**
 * A wall across a lane, with one door where the lane meets it. `open` is a value: the door is
 * shut at 0 and open at 1, and its leaf is green while it is open. `at` is the point of the lane.
 */
export function wall(s, { at, top, bottom }) {
  const open = s.value(0);
  const [x, y] = at;
  const half = WALL.door / 2;
  const style = { stroke: 'dim', width: WALL.width };
  const posts = group(
    line([x, top], [x, y - half], style),
    line([x, y + half], [x, bottom], style),
  );
  const leaf = dynamic(() => {
    const reach = WALL.door * (1 - open.value);
    if (reach < 1) return null;
    return line([x, y - half], [x, y - half + reach], {
      stroke: open.value > 0.5 ? COLOR.sure : 'ink',
      width: WALL.width,
    });
  });
  return {
    posts,
    leaf,
    open,
    at,
    /** The place of a token that waits before the door, and of one that is through it. */
    before: (node) => docked(node, at, 'left'),
    after: (node) => docked(node, at, 'right'),
    nodes: [posts, leaf],
  };
}

/**
 * A seconds axis at the foot of a region, with rows over it for bars. `names` is the share of
 * the width for the names of the rows, and `step` is the time between two marks. It returns
 * `x(seconds)`, the rows, and the nodes.
 */
export function secondsAxis(region, { max, rows, names = [1, 8], step = 1 }) {
  const [side, plot] = region.columns(names, 'normal');
  const [body, scale] = plot.rows([9, 1], 'tight');
  const x = (seconds) => plot.left + (seconds / max) * plot.width;
  const base = line([plot.left, body.bottom], [plot.right, body.bottom], {
    stroke: 'dim',
    width: 3,
  });
  const marks = [];
  const numbers = [];
  const count = Math.round(max / step);
  for (let index = 0; index <= count; index++) {
    const second = index * step;
    const words = Number.isInteger(step) ? String(second) : second.toFixed(1);
    marks.push(
      line([x(second), body.bottom], [x(second), body.bottom + 12], { stroke: 'dim', width: 3 }),
    );
    numbers.push(
      mono(index === count ? `${words} s` : words, { size: 30, color: 'dim' }).moveTo([
        x(second),
        scale.cy,
      ]),
    );
  }
  const bands = body.rows(rows, 'none');
  return {
    x,
    /** The width of a stretch of time. */
    span: (seconds) => (seconds / max) * plot.width,
    plot,
    body,
    side: side.rows([9, 1], 'tight')[0].rows(rows, 'none'),
    rows: bands,
    nodes: [base, ...marks, ...numbers],
  };
}

/**
 * A counter of a few places, such as the two failures that open a breaker. The places are
 * outlines that the layout places. `filled` is a value: the count of the places that are full.
 */
export function places(s, count, { size = 60, color = COLOR.fail } = {}) {
  const filled = s.value(0);
  const frames = Array.from({ length: count }, () =>
    rect(size, size, { radius: 10, stroke: 'dim', fill: null, width: 2.5 }),
  );
  const fills = dynamic(() =>
    frames.flatMap((frame, index) => {
      const share = Math.max(0, Math.min(1, filled.value - index));
      if (share < 0.02) return [];
      const side = (size - 16) * share;
      return [rect(side, side, { radius: 5, fill: color, stroke: null }).at(...frame.center)];
    }),
  );
  return { frames, fills, filled };
}

/**
 * A circuit breaker on a lane: a switch between two contacts. Closed, its arm joins the contacts
 * and a call passes. Open, the arm is up and a call turns back. `from` and `to` are the two ends
 * of the lane, on one height. `gap` is the length of the arm.
 */
export function breaker(s, { from, to, gap = 130, ball = 14 }) {
  const y = from[1];
  const x = (from[0] + to[0]) / 2;
  const left = [x - gap / 2, y];
  const right = [x + gap / 2, y];
  /** How far the arm is up: 0 is closed, 1 is open, and a part is half-open. */
  const lift = s.value(0);
  /** The color of the arm: 0 is closed, 1 is open, 2 is half-open. */
  const mode = s.value(0);
  const TOP = 0.75;
  const wire = { stroke: 'dim', width: 4 };
  const arm = dynamic(() => {
    const angle = lift.value * TOP;
    return line(left, [left[0] + gap * Math.cos(angle), y - gap * Math.sin(angle)], {
      stroke: [COLOR.sure, COLOR.fail, COLOR.mark][Math.round(mode.value)],
      width: 8,
    });
  });
  const contacts = [left, right].map((point) =>
    circle(10, { fill: 'bg', stroke: 'ink', width: 3 }).at(...point),
  );
  const state = (up, color) =>
    par(lift.to(up, { duration: 0.5 }), mode.to(color, { duration: 0.05 }));
  const stop = [left[0] - ball - 14, y];
  return {
    x,
    y,
    lift,
    mode,
    /** The height that the arm reaches when it is up, for a name over the switch. */
    top: y - gap * Math.sin(TOP),
    nodes: [line(from, left, wire), arrow(right, to, { ...wire, pad: 0 }), arm, ...contacts],
    close: () => state(0, 0),
    open: () => state(1, 1),
    halfOpen: () => state(0.5, 2),
    /** A call: a ball in the color of the agent side, at the start of the lane. */
    call: (color = COLOR.attempt) =>
      dot(ball, color)
        .at(...from)
        .zIndex(1),
    /** A call goes through to the far end, and is gone there. */
    pass: (node, duration = 1.1) =>
      seq(travel(node, to, { duration }), fadeOut(node, { duration: 0.15 })),
    /** A call turns back at the open switch, in red. */
    refuse: (node) =>
      seq(
        travel(node, stop, { duration: 0.55 }),
        recolor(node, COLOR.fail, { duration: 0.1 }),
        moveTo(node, from, { duration: 0.55 }),
        fadeOut(node, { duration: 0.15 }),
      ),
    /** An answer comes back from the far end to the start of the lane. */
    answer: (node, duration = 1.1) =>
      seq(appear(node), moveTo(node, from, { duration }), fadeOut(node, { duration: 0.15 })),
    from,
    to,
  };
}

/**
 * A line of time for an observation, from a moment in the past to now. `fresh` is the share of
 * the line, at its right end, that is new enough for a claim about now. The band is to scale,
 * and it is 16 px wide or more so that the viewer can see it.
 */
export function ageLine(region, { past, fresh }) {
  const y = region.cy;
  const start = [region.left, y];
  const now = [region.right, y];
  const tick = (point) => line([point[0], y - 20], [point[0], y + 20], { stroke: 'dim', width: 4 });
  const width = Math.max(16, (now[0] - start[0]) * fresh);
  const band = rect(width, 40, { radius: 4, fill: COLOR.sure, stroke: null, opacity: 0.6 }).moveTo([
    now[0] - width / 2,
    y,
  ]);
  const nowName = beside(note('now'), [now[0], y + 20], 'under', 'tight', 'right');
  return {
    nodes: [
      line(start, now, { stroke: 'dim', width: 4 }),
      tick(start),
      tick(now),
      beside(note(past), [start[0], y + 20], 'under', 'tight', 'left'),
      nowName,
    ],
    band,
    /** The name of the band, under the line, at the left of "now". */
    bandName: beside(note('new enough:', { color: COLOR.sure }), nowName, 'left', 'tight'),
    start,
    now,
  };
}
