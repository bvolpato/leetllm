// What the scenes of `agent-orchestration` share: the release board, and the job of each color.
//
// The board is the example that stays. A request for release r17 goes to triage. Three checks read
// in three lanes. Each check sends one receipt card along its lane, through a barrier, into its own
// slot of one packet. The packet then goes down the right side: approval, the one writer, and the
// live target. Every part follows values, so a scene changes one value and the picture answers.
import {
  arrow,
  connector,
  dot,
  dynamic,
  group,
  line,
  mixColor,
  parseColor,
  pictogram,
  polygon,
  polyline,
  par,
  rect,
  seq,
} from 'vizmatic/stage';
import { RECEIPTS, REQUEST } from '../../films/agent-orchestration/fixtures.mjs';
import { BRANCHES, FRESH_SECONDS, freshPacket, proposal } from './packet.mjs';
import { LESSON_LOOK } from '../../lib/narrated-lesson.mjs';
import { area, label, mono, namedBox, note } from '../kit-narrated.mjs';

export { BRANCHES, FRESH_SECONDS };
/** One color has one job through the lesson. Cyan, pink and blue are the three checks. */
export const BRANCH_COLOR = ['cyan', 'pink', 'blue'];
/** Green is a value that the join accepted, and the packet that it made. */
export const VALID = 'green';
/** Yellow is what the voice points at now. */
export const MARK = 'yellow';
/** Red is a wrong value, a refused card, a write that must not happen. */
export const WRONG = 'red';
/** Dim is a part that waits, and a part that is done. */
export const QUIET = 'dim';

/** The size of the small text of the board: the fields of a card, a slot name, a readout. */
export const SMALL = 30;
/** The number of the tenant of the request: 7. A card from another tenant has another number. */
export const TENANT = Number(REQUEST.tenant.replace(/\D/g, ''));
/** The tenant of the cross-tenant test of the model. */
export const OTHER_TENANT = 9;
/** The time at which the join of the model runs, and at which its late run runs. */
const JOIN_TIME = { fresh: 1000, late: 1200 };
/** The age of a receipt of the fixture at the join: 10 seconds. At the late join the model refuses it. */
export const AGE = {
  fresh: JOIN_TIME.fresh - RECEIPTS[0].time,
  late: JOIN_TIME.late - RECEIPTS[0].time,
};
/** The first characters of a digest, as the board shows it. */
const short = (digest) => `#${digest.slice(0, 4)}`;
/** The evidence digest of the packet at revision 3, and of the packet that is built again at revision 4. */
export const DIGEST = { 3: short(proposal().evidenceDigest), 4: short(freshPacket.evidenceDigest) };

const rgba = (name) => parseColor(LESSON_LOOK.colors[name]);
/** A color between two colors of the course, for a part that lights with a value from 0 to 1. */
export const mix = (from, to, t) => mixColor(rgba(from), rgba(to), Math.max(0, Math.min(1, t)));
const lerp = (a, b, t) => a + (b - a) * t;

/** Replace receipt identity only while its card and previous verdict are hidden. */
export function replaceReceipt(card, fields) {
  return seq(
    card.shown.to(0, { duration: 0.2 }),
    par(
      ...Object.entries(fields).map(([field, next]) => card[field].to(next, { duration: 0 })),
      card.read.to(0, { duration: 0 }),
      card.verdict.to(0, { duration: 0 }),
    ),
    card.shown.to(1, { duration: 0.2 }),
  );
}

// The frame of the lesson. The read phase runs across the top. The effect path runs down the right.
// The floor at the left holds the request, and a band that each scene fills with its own instrument.
export const [LEFT, RIGHT] = area.columns([21, 8], 60);
export const [READ, FLOOR] = LEFT.rows([11, 10], 60);
const [SOURCE, RUN] = READ.columns([22, 97], 70);
export const [TICKET, BAND] = FLOOR.columns([22, 97], 70);
/** The free corner over triage, for one word about the whole read phase. */
export const CORNER = SOURCE.rows([17, 27], 'none')[0];
const [PACKET, EFFECT] = RIGHT.rows([11, 10], 60);
const LANE = RUN.rows(3, 40);
const [APPROVAL, WRITER, TARGET] = EFFECT.rows(3, 50);

// The sizes of the parts. Each one is typed here one time.
const NODE = { width: 160, height: 100 };
const PLATE_HEIGHT = 100;
/** A lane is an arrow from its check to the barrier. This is the length of its point. */
const PLATE_TIP = 26;
export const CARD = { width: 330, height: 72, pad: 16 };
const TOKEN = { width: 280, height: 64, pad: 12 };
const GAUGE = { width: 240, height: 22 };

/** The x of the barrier: the middle of the room between the lanes and the packet. */
const BARRIER_X = (LEFT.right + RIGHT.left) / 2;
const plateLeft = RUN.left + NODE.width + 12;
/** The middle of a card at the start of its lane, at the barrier, and in its slot. */
const CARD_X = [
  plateLeft + 10 + CARD.width / 2,
  RUN.right - PLATE_TIP - 10 - CARD.width / 2,
  PACKET.left + 19 + CARD.width / 2,
];
/** The middle of the token: in the dock of approval, and in the dock of the writer. */
const DOCK_X = EFFECT.right - 16 - TOKEN.width / 2;
const TOKEN_Y = [APPROVAL.cy, WRITER.cy];

/** The place of a card on its way: 0 is the start of the lane, 1 is the barrier, 2 is the slot. */
export const cardX = (pos) =>
  pos <= 1 ? lerp(CARD_X[0], CARD_X[1], pos) : lerp(CARD_X[1], CARD_X[2], pos - 1);
/** The middle height of a lane, and of its slot. */
export const laneY = (i) => LANE[i].cy;
/** The room of a lane after its check: where a card travels, and where a bar of a clock grows. */
export const laneRoom = (i) => ({
  left: plateLeft,
  right: RUN.right,
  cy: LANE[i].cy,
  height: PLATE_HEIGHT,
});

/** A small text of the board at a place: mono for a value, the text font for a name. */
const value = (words, x, y, options = {}) => mono(words, { size: SMALL, ...options }).at(x, y);
const name = (words, x, y, options = {}) => label(words, x, y, { size: SMALL, ...options });

/**
 * One receipt card, drawn at a place: the tenant, the revision and the age that its check read. `tints` is
 * the color of each of the three fields. A scene draws a copy of a card with it, such as a saved one.
 */
export function receiptCard(
  x,
  y,
  { color, tenant, rev, age, tints = ['ink', 'ink', 'ink'], opacity = 1, revisionSize = SMALL },
) {
  const left = x - CARD.width / 2 + CARD.pad,
    right = x + CARD.width / 2 - CARD.pad;
  return [
    rect(CARD.width, CARD.height, {
      radius: 12,
      stroke: color,
      width: 3,
      fill: 'surface',
      opacity,
    }).at(x, y),
    value(`tenant${Math.round(tenant)}`, left, y, { anchor: 'left', color: tints[0] }).opacity(
      opacity,
    ),
    value(`v${Math.round(rev)}`, left + 166, y, { color: tints[1], size: revisionSize }).opacity(opacity),
    value(`${Math.round(age)} s`, right, y, { anchor: 'right', color: tints[2] }).opacity(opacity),
  ];
}

/**
 * The board normally opens on the v3 request. After the writer applies v4, the next scene inherits
 * the live revision and traffic reading. The protocol example explicitly starts a new run at v3.
 */
export const STATE = {
  rest: { open: 0, lamp: 0, hot: 0, revision: REQUEST.version, traffic: 0 },
  applied: {
    open: 0,
    lamp: 0,
    hot: 0,
    revision: freshPacket.version,
    traffic: freshPacket.traffic,
  },
};

/**
 * Build the board. It returns the values that a scene moves and the nodes that a scene shows.
 * `standing` is the part that goes from scene to scene with no fade: the next scene takes it.
 * `moving` is the part that a scene sets at its start, and that leaves with the scene.
 */
export function board(s, initial = STATE.rest) {
  // The values of the board. A scene moves them, and the drawings below follow.
  const card = BRANCHES.map(() => ({
    /** 0 is the start of the lane, 1 is the barrier, 2 is the slot. */
    pos: s.value(0),
    shown: s.value(0),
    tenant: s.value(TENANT),
    rev: s.value(REQUEST.version),
    age: s.value(AGE.fresh),
    /** How many fields the join has read: 0 to 3. A field that it read is green or red. */
    read: s.value(0),
    /** 1 when the slot took the card, -1 when it refused it. */
    verdict: s.value(0),
  }));
  const revisionSize = s.value(SMALL);
  const gate = BRANCHES.map(() => ({ open: s.value(0), lamp: s.value(0) }));
  /** What the voice points at: a field of the request and of every card. */
  const hot = {
    tenant: s.value(0),
    release: s.value(0),
    rev: s.value(0),
    age: s.value(0),
    traffic: s.value(0),
    digest: s.value(0),
  };
  const request = { rev: s.value(initial.revision), traffic: s.value(REQUEST.traffic) };
  const packet = { seal: s.value(0), rev: s.value(REQUEST.version) };
  const token = {
    /** 0 is the dock of approval, 1 is the dock of the writer. */
    pos: s.value(0),
    shown: s.value(0),
    rev: s.value(REQUEST.version),
    digest: s.value(REQUEST.version),
    stamp: s.value(0),
    /** 1 when the writer refuses the token. */
    refused: s.value(0),
  };
  const target = {
    live: s.value(initial.revision),
    traffic: s.value(initial.traffic),
    hot: s.value(0),
  };

  // The request, at the foot of the left side.
  const ticketLines = () => [
    REQUEST.request,
    REQUEST.tenant,
    REQUEST.release,
    `v${Math.round(request.rev.value)}`,
    `${request.traffic.value}%`,
  ];
  const linePitch = 42;
  const ticketBox = {
    cx: TICKET.cx,
    top: TICKET.top,
    height: 58 + ticketLines().length * linePitch + 12,
  };
  const ticketFrame = rect(TICKET.width, ticketBox.height, {
    radius: 12,
    stroke: 'ink',
    width: 2.5,
    fill: 'surface',
  }).at(ticketBox.cx, ticketBox.top + ticketBox.height / 2);
  const ticketTitle = name('request', TICKET.left + 20, ticketBox.top + 34, {
    anchor: 'left',
    color: QUIET,
  });
  const ticketY = (row) => ticketBox.top + 58 + linePitch * (row + 0.5);
  const ticketFields = dynamic(() => {
    const heat = [0, hot.tenant.value, hot.release.value, hot.rev.value, hot.traffic.value];
    return ticketLines().map((words, row) =>
      value(words, TICKET.left + 20, ticketY(row), {
        anchor: 'left',
        color: mix('ink', MARK, heat[row]),
      }),
    );
  });

  // Triage, the three checks, and the lane of each check.
  const triage = namedBox('triage', { width: TICKET.width, height: NODE.height }).at(
    SOURCE.cx,
    LANE[1].cy,
  );
  const checks = BRANCHES.map((branch, i) =>
    namedBox(branch, { ...NODE, color: BRANCH_COLOR[i], group: BRANCHES }).at(
      RUN.left + NODE.width / 2,
      LANE[i].cy,
    ),
  );
  const plates = BRANCHES.map((_, i) => {
    const top = LANE[i].cy - PLATE_HEIGHT / 2,
      bottom = LANE[i].cy + PLATE_HEIGHT / 2;
    return polygon(
      [
        [plateLeft, top],
        [RUN.right - PLATE_TIP, top],
        [RUN.right, LANE[i].cy],
        [RUN.right - PLATE_TIP, bottom],
        [plateLeft, bottom],
      ],
      { stroke: 'gridStrong', width: 2, fill: 'surface', opacity: 0.6 },
    );
  });
  const ask = connector(ticketFrame, triage, {
    color: QUIET,
    width: 3,
    tip: true,
    route: 'straight',
    gap: 8,
  });
  const fan = checks.map((check) =>
    connector(triage, check, {
      color: QUIET,
      width: 3,
      tip: true,
      route: 'ortho',
      from: 'right',
      to: 'left',
      gap: 6,
    }),
  );

  // The barrier: one gate for each lane, and a lamp that lights when the receipt of the lane is ready.
  const barrier = dynamic(() =>
    BRANCHES.flatMap((_, i) => {
      const foot = LANE[i].cy + PLATE_HEIGHT / 2;
      const shut = 1 - gate[i].open.value;
      const lit = gate[i].readiness?.() ?? gate[i].lamp.value;
      const parts = [dot(9, mix('faint', BRANCH_COLOR[i], lit)).at(BARRIER_X, foot + 16)];
      if (shut > 0.02)
        parts.push(
          line([BARRIER_X, foot], [BARRIER_X, foot - PLATE_HEIGHT * shut], {
            stroke: QUIET,
            width: 6,
          }),
        );
      return parts;
    }),
  );

  // The packet: one slot for each check, at the height of its lane.
  const packetFrame = rect(PACKET.width, PACKET.height, {
    radius: 14,
    stroke: QUIET,
    width: 2.5,
    fill: null,
  }).at(PACKET.cx, PACKET.cy);
  const packetTitle = name('packet', PACKET.left + 4, PACKET.top - 31, {
    anchor: 'left',
    color: QUIET,
  });
  const slots = BRANCHES.map((_, i) =>
    rect(CARD.width + 10, CARD.height + 10, {
      radius: 14,
      stroke: 'faint',
      width: 2,
      fill: null,
      dash: [8, 8],
    }).at(CARD_X[2], LANE[i].cy),
  );
  const slotNames = BRANCHES.map((branch, i) =>
    name(branch, PACKET.right - 16, LANE[i].cy, { anchor: 'right', color: BRANCH_COLOR[i] }),
  );
  const verdicts = dynamic(() =>
    BRANCHES.flatMap((_, i) => {
      const verdict = card[i].verdict.value;
      if (Math.abs(verdict) < 0.02) return [];
      return [
        rect(CARD.width + 10, CARD.height + 10, {
          radius: 14,
          stroke: verdict > 0 ? VALID : WRONG,
          width: 4,
          fill: null,
          opacity: Math.abs(verdict),
        }).at(CARD_X[2], LANE[i].cy),
      ];
    }),
  );
  const seal = dynamic(() => {
    const sealed = packet.seal.value;
    if (sealed < 0.02) return [];
    return [
      rect(PACKET.width, PACKET.height, {
        radius: 14,
        stroke: VALID,
        width: 5,
        fill: null,
        opacity: sealed,
      }).at(PACKET.cx, PACKET.cy),
      value(`sealed ${DIGEST[Math.round(packet.rev.value)]}`, PACKET.right - 4, PACKET.top - 31, {
        anchor: 'right',
        color: mix(VALID, MARK, hot.digest.value),
      }).opacity(sealed),
    ];
  });

  // The cards. A field is ink, yellow when the voice points at it, and green or red when the join read it.
  const expected = (i) => [
    Math.round(card[i].tenant.value) === TENANT,
    Math.round(card[i].rev.value) === Math.round(request.rev.value),
    Math.round(card[i].age.value) >= 0 && Math.round(card[i].age.value) <= FRESH_SECONDS,
  ];
  const cards = BRANCHES.map((_, i) =>
    dynamic(() => {
      const state = card[i];
      const opacity = state.shown.value;
      if (opacity < 0.02) return [];
      const ok = expected(i);
      const heat = [hot.tenant.value, hot.rev.value, hot.age.value];
      const tints = ok.map((good, field) =>
        Math.abs(state.verdict.value) > 0.02 && state.read.value > field + 0.5
          ? good
            ? mix(VALID, MARK, heat[field])
            : WRONG
          : mix('ink', MARK, heat[field]),
      );
      return receiptCard(cardX(state.pos.value), LANE[i].cy, {
        color: BRANCH_COLOR[i],
        tenant: state.tenant.value,
        rev: state.rev.value,
        age: state.age.value,
        tints,
        opacity,
        revisionSize: revisionSize.value,
      });
    }).zIndex(4),
  );

  // The effect path: approval, the writer, and the live target. Each has a dock for the token.
  const station = (words, region) => {
    const frame = rect(region.width, region.height, {
      radius: 12,
      stroke: 'ink',
      width: 2.5,
      fill: 'surface',
    }).at(region.cx, region.cy);
    const title = label(words, region.left + 20, region.cy, { size: 36, anchor: 'left' });
    const dock = rect(TOKEN.width + 10, TOKEN.height + 10, {
      radius: 12,
      stroke: 'faint',
      width: 2,
      fill: null,
      dash: [8, 8],
    }).at(DOCK_X, region.cy);
    return { frame, title, dock };
  };
  const approval = station('approval', APPROVAL);
  const writer = station('writer', WRITER);
  const stepX = EFFECT.left + 90;
  const steps = [
    [PACKET.bottom, APPROVAL.top],
    [APPROVAL.bottom, WRITER.top],
    [WRITER.bottom, TARGET.top],
  ].map(([from, to]) => arrow([stepX, from + 6], [stepX, to - 6], { stroke: QUIET, width: 3 }));

  const gaugeLeft = TARGET.right - 20 - GAUGE.width,
    gaugeY = TARGET.cy + 20;
  const targetFrame = rect(TARGET.width, TARGET.height, {
    radius: 12,
    stroke: 'ink',
    width: 2.5,
    fill: 'surface',
  }).at(TARGET.cx, TARGET.cy);
  const targetTitle = name('live', TARGET.left + 20, TARGET.cy, { anchor: 'left', color: QUIET });
  const gaugeTrack = rect(GAUGE.width, GAUGE.height, {
    radius: 6,
    stroke: 'faint',
    width: 2,
    fill: null,
  }).at(gaugeLeft + GAUGE.width / 2, gaugeY);
  const gaugeName = name('traffic', TARGET.right - 20, TARGET.cy - 22, {
    anchor: 'right',
    color: QUIET,
  });
  const targetLive = dynamic(() => {
    const traffic = Math.round(target.traffic.value);
    const filled = (GAUGE.width * traffic) / 100;
    const asked = mix('ink', MARK, Math.max(hot.traffic.value, target.hot.value));
    const parts = [
      mono(`v${Math.round(target.live.value)}`, {
        size: 36,
        anchor: 'left',
        color: mix('ink', MARK, target.hot.value),
      }).at(TARGET.left + 92, TARGET.cy),
      value(`${traffic}%`, gaugeLeft, TARGET.cy - 22, {
        anchor: 'left',
        color: asked,
      }),
    ];
    if (request.traffic.value >= 0 && request.traffic.value <= 100) {
      const askedX = gaugeLeft + (GAUGE.width * request.traffic.value) / 100;
      parts.push(
        line([askedX, gaugeY - GAUGE.height / 2 - 4], [askedX, gaugeY + GAUGE.height / 2 + 4], {
          stroke: asked,
          width: 3,
        }),
      );
    }
    if (filled > 0.5)
      parts.unshift(
        rect(filled, GAUGE.height - 6, { radius: 3, stroke: null, fill: VALID }).at(
          gaugeLeft + filled / 2,
          gaugeY,
        ),
      );
    return parts;
  });

  // The token: the proposal that the packet made. Approval stamps it, and the writer checks it.
  const tokenNode = dynamic(() => {
    const opacity = token.shown.value;
    if (opacity < 0.02) return [];
    const y = lerp(TOKEN_Y[0], TOKEN_Y[1], token.pos.value);
    const left = DOCK_X - TOKEN.width / 2 + TOKEN.pad;
    const stamped = token.stamp.value,
      refused = token.refused.value;
    const edge = refused > 0.5 ? WRONG : mix('ink', VALID, stamped);
    const revTint =
      refused > 0.5 ? WRONG : mix('ink', MARK, Math.max(hot.rev.value, target.hot.value));
    const parts = [
      rect(TOKEN.width, TOKEN.height, {
        radius: 12,
        stroke: edge,
        width: 3,
        fill: 'surface',
        opacity,
      }).at(DOCK_X, y),
      value(`v${Math.round(token.rev.value)}`, left, y, { anchor: 'left', color: revTint }).opacity(
        opacity,
      ),
      value(`${REQUEST.traffic}%`, left + 52, y, {
        anchor: 'left',
        color: mix('ink', MARK, hot.traffic.value),
      }).opacity(opacity),
      value(DIGEST[Math.round(token.digest.value)], left + 122, y, {
        anchor: 'left',
        color: hot.digest.value > 0.5 ? MARK : mix('ink', VALID, stamped),
      }).opacity(opacity),
    ];
    if (stamped > 0.02)
      parts.push(
        pictogram('check', { size: 34, accent: VALID })
          .at(DOCK_X + TOKEN.width / 2 - TOKEN.pad - 15, y)
          .opacity(stamped * opacity),
      );
    return parts;
  }).zIndex(5);

  const standing = [
    ticketFrame,
    ticketTitle,
    ticketFields,
    ask,
    triage,
    ...fan,
    ...plates,
    ...checks,
    barrier,
    packetFrame,
    packetTitle,
    ...slots,
    ...slotNames,
    ...Object.values(approval),
    ...Object.values(writer),
    ...steps,
    targetFrame,
    targetTitle,
    gaugeTrack,
    gaugeName,
    targetLive,
  ];
  /** The standing part at the left of the barrier, and the standing part at the right of it. */
  const leftSide = [
    ticketFrame,
    ticketTitle,
    ticketFields,
    ask,
    triage,
    ...fan,
    ...plates,
    ...checks,
    barrier,
  ];
  const rightSide = standing.filter((node) => !leftSide.includes(node));
  verdicts.zIndex(3);
  seal.zIndex(3);
  const moving = [verdicts, seal, ...cards, tokenNode];

  return {
    card,
    gate,
    hot,
    request,
    packet,
    token,
    target,
    standing,
    ticket: [ticketFrame, ticketTitle, ticketFields],
    revisionSize,
    liveGauge: [targetFrame, targetTitle, gaugeTrack, gaugeName, targetLive],
    leftSide,
    rightSide,
    moving,
    nodes: {
      ticketFrame,
      triage,
      checks,
      plates,
      ask,
      fan,
      packetFrame,
      slots,
      slotNames,
      approval,
      writer,
      steps,
      targetFrame,
    },
    /** The right end of a line of the request: 1 is the tenant, 3 the revision, 4 the traffic. */
    ticketPoint: (line) => [TICKET.right, ticketY(line)],
    /**
     * Put the board on the stage. The first scene adds all of it. Every other scene takes the standing
     * part from the scene before it, with no fade, and adds the moving part.
     */
    enter(c, first = false) {
      if (first) s.add(...standing);
      else c.take(standing);
      s.add(...moving);
    },
    /**
     * Settle the standing nodes into the next scene's initial state before the handover.
     */
    leave(c, next = STATE.rest) {
      s.at(c.end - 0.5, () => s.play(...this.rest(0.4, next)));
      // The next example can start from a different release. Reset at the cut so the live
      // traffic counter never shows an extra write while the previous result is still on screen.
      s.at(c.end, () => {
        request.rev.set(next.revision);
        target.live.set(next.revision);
        target.traffic.set(next.traffic);
      });
      c.keep(standing);
    },
    /** Every value of the kept part goes back to its rest, so that the next scene can take the board. */
    rest: (duration = 0.4, to = STATE.rest) => [
      ...gate.flatMap((entry) => [
        entry.open.to(to.open, { duration }),
        entry.lamp.to(to.lamp, { duration }),
      ]),
      ...Object.values(hot).map((entry) => entry.to(to.hot, { duration })),
      target.hot.to(to.hot, { duration }),
    ],
  };
}

/** The height of a bar of the clock, inside a lane. */
const BAR_HEIGHT = 58;

/**
 * A clock on the lanes: bars to one time scale, and an axis under the lanes. `spans` is a list of
 * `{ lane, length, start, color, label }`, in seconds. A bar is drawn from its start up to the time
 * `now`, so one value runs every bar at one speed. The scenes 3, 5 and 11 use it.
 */
export function clock(s, spans, { seconds = 7, unit = 's', quantum = 0 } = {}) {
  const x0 = plateLeft + 14,
    x1 = RUN.right - PLATE_TIP - 14;
  const scale = (x1 - x0) / seconds;
  const x = (time) => x0 + time * scale;
  /** The time of the clock. At 99 every bar is whole. */
  const now = s.value(99);
  /** Seconds that every start is late, for an overhead that the clock does not name. */
  const late = s.value(0);
  const state = spans.map((span) => ({
    ...span,
    start: s.value(span.start ?? 0),
    shown: s.value(0),
    hot: s.value(0),
  }));
  const quantize = (time) => (quantum ? Math.round(time / quantum) * quantum : time);
  const current = () => quantize(now.value);
  const from = (span) => quantize(span.start.value) + late.value;
  const elapsed = (span) => Math.max(0, Math.min(span.length, current() - from(span)));
  const complete = (index) => elapsed(state[index]) >= state[index].length;
  const bars = dynamic(() =>
    state.flatMap((span) => {
      const opacity = span.shown.value;
      if (opacity < 0.02) return [];
      const done = elapsed(span);
      const y = LANE[span.lane].cy;
      const parts = [];
      if (done * scale > 1)
        parts.push(
          rect(done * scale, BAR_HEIGHT, {
            radius: 8,
            fill: span.color,
            stroke: span.hot.value > 0.5 ? MARK : null,
            width: 5,
            opacity: 0.92 * opacity,
          }).at(x(from(span)) + (done * scale) / 2, y),
        );
      if (span.label && done > span.length - 1e-3)
        parts.push(
          value(span.label, x(from(span) + span.length) - 14, y, {
            anchor: 'right',
            color: 'bg',
          }).opacity(opacity),
        );
      return parts;
    }),
  ).zIndex(2);
  const axisY = READ.bottom + 14;
  const whole = Array.from({ length: seconds + 1 }, (_, tick) => tick);
  const axis = group(
    line([x(0), axisY], [x(seconds), axisY], { stroke: 'faint', width: 3 }),
    ...whole.map((tick) =>
      line([x(tick), axisY], [x(tick), axisY + 10], { stroke: 'faint', width: 3 }),
    ),
  );
  const numbers = whole.map((tick) =>
    value(tick === seconds ? `${tick} ${unit}` : `${tick}`, x(tick), axisY + 34, { color: QUIET }),
  );
  const marker = dynamic(() => {
    const at = x(Math.max(0, Math.min(seconds, current())));
    return polygon(
      [
        [at - 9, axisY - 16],
        [at + 9, axisY - 16],
        [at, axisY - 2],
      ],
      { fill: MARK, stroke: null },
    );
  });
  return {
    x,
    scale,
    now,
    late,
    spans: state,
    current,
    complete,
    bars,
    axis,
    numbers,
    marker,
    /** When the last bar that shows ends, in seconds. */
    end: () =>
      Math.max(
        0,
        ...state.filter((span) => span.shown.value > 0.5).map((span) => from(span) + span.length),
      ),
    /** The top and the bottom of the lanes, for a mark that spans all of them. */
    top: LANE[0].cy - PLATE_HEIGHT / 2,
    bottom: LANE[LANE.length - 1].cy + PLATE_HEIGHT / 2,
    barHeight: BAR_HEIGHT,
    laneY,
  };
}

/**
 * The two kinds of channel of a shared state, in a region: a list with an add reducer, and one
 * scalar value. An entry of the list drops into its place, and a write drops into the scalar.
 * `entries` is a list of branch indexes, in the order of arrival. The scenes 4 and 5 use it.
 */
export function channels(s, region, { entries, writers = [0, 2], error = 'conflict' }) {
  const ENTRY = { width: 122, height: 56, gap: 10 };
  const [listSide, scalarSide] = region.columns([3, 2], 'wide');
  const trayY = region.cy + 30,
    dropFrom = trayY - 96,
    titleY = region.cy - 124;
  const trayWidth = ENTRY.width * 4 + ENTRY.gap * 5;
  const slotX = (slot) =>
    listSide.left + ENTRY.gap + ENTRY.width / 2 + slot * (ENTRY.width + ENTRY.gap);
  const CELL_WIDTH = 190;
  const cellX = scalarSide.left + CELL_WIDTH / 2;

  const listName = mono('receipts', { size: 36, anchor: 'left' }).at(listSide.left, titleY);
  const listKind = name('a list, with add', listSide.left + 200, titleY, {
    anchor: 'left',
    color: QUIET,
  });
  // A channel is a tray with an open top: an update drops into it.
  const trayOf = (left, width) => {
    const top = trayY - ENTRY.height / 2 - 10,
      bottom = trayY + ENTRY.height / 2 + 10;
    return polyline(
      [
        [left, top],
        [left, bottom],
        [left + width, bottom],
        [left + width, top],
      ],
      { stroke: 'faint', width: 3 },
    );
  };
  const tray = trayOf(listSide.left, trayWidth);
  const scalarName = mono('traffic', { size: 36, anchor: 'left' }).at(scalarSide.left, titleY);
  const scalarKind = name('one value', scalarSide.left + 176, titleY, {
    anchor: 'left',
    color: QUIET,
  });
  const cell = trayOf(scalarSide.left, CELL_WIDTH);

  const list = entries.map((branch, slot) => ({
    branch,
    shown: s.value(0),
    /** 0 is over the tray, 1 is in it. */
    drop: s.value(0),
    slot: s.value(slot),
    /** 1 marks an entry that the list must not have: a duplicate. */
    wrong: s.value(0),
    /** 1 marks an entry that the voice points at. */
    hot: s.value(0),
  }));
  const scalar = {
    writes: writers.map((branch) => ({ branch, shown: s.value(0), drop: s.value(0) })),
    /** 1 when two writes met in one step. */
    clash: s.value(0),
    /** 1 when the voice points at the values of the writes. */
    hot: s.value(0),
  };

  const listNode = dynamic(() =>
    list.flatMap((entry) => {
      const opacity = entry.shown.value;
      if (opacity < 0.02) return [];
      const x = slotX(entry.slot.value),
        y = lerp(dropFrom, trayY, entry.drop.value);
      const edge =
        entry.wrong.value > 0.5 ? WRONG : entry.hot.value > 0.5 ? MARK : BRANCH_COLOR[entry.branch];
      return [
        rect(ENTRY.width, ENTRY.height, {
          radius: 10,
          stroke: edge,
          width: entry.wrong.value > 0.5 ? 5 : 3,
          fill: 'surface',
          opacity,
        }).at(x, y),
        name(BRANCHES[entry.branch], x, y, { color: BRANCH_COLOR[entry.branch] }).opacity(opacity),
      ];
    }),
  );
  const scalarNode = dynamic(() => {
    const clash = scalar.clash.value;
    const parts = [];
    if (clash > 0.02)
      parts.push(
        rect(CELL_WIDTH + 8, ENTRY.height + 28, {
          radius: 6,
          stroke: WRONG,
          width: 5,
          fill: null,
          opacity: clash,
        }).at(cellX, trayY),
      );
    scalar.writes.forEach((write, index) => {
      const opacity = write.shown.value;
      if (opacity < 0.02) return;
      const side = (index - (scalar.writes.length - 1) / 2) * 150;
      const x = cellX + side * (1 - write.drop.value) + side * 0.62 * write.drop.value,
        y = lerp(dropFrom, trayY, write.drop.value);
      parts.push(
        value(`${REQUEST.traffic}%`, x, y, {
          color: mix(BRANCH_COLOR[write.branch], MARK, scalar.hot.value),
        }).opacity(opacity),
      );
    });
    if (clash > 0.02)
      parts.push(
        value(error, scalarSide.left, trayY + 84, { anchor: 'left', color: WRONG }).opacity(clash),
      );
    return parts;
  });
  return {
    list,
    scalar,
    /** The parts that stand from the start, and the parts that follow the values. */
    frame: [listName, listKind, tray, scalarName, scalarKind, cell],
    live: [listNode, scalarNode],
    slotX,
    trayY,
    listSide,
    scalarSide,
  };
}
