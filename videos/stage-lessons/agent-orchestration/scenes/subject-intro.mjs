// Scene `subject-intro`: the whole route of one release request, in one pass.
//
// Three checks return receipts at different times. The join reads them and sends one packet
// for review. Live traffic stays at zero. The last beat compares three kinds of work.
import {
  dot,
  dynamic,
  fade,
  fadeIn,
  group,
  indicate,
  lagged,
  line,
  linear,
  pictogram,
  par,
  place,
  polygon,
  polyline,
  pulse,
  rect,
  row,
  seq,
} from 'vizmatic/stage';
import { readSchedule } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST, values } from '../../../films/agent-orchestration/fixtures.mjs';
import { area, chipRow, display, heading, label, mono, note } from '../../kit-narrated.mjs';
import { RATE_LIMITS } from '../packet.mjs';
import { BAND, BRANCH_COLOR, MARK, QUIET, VALID, board, laneRoom } from '../parts.mjs';

/** The seconds of each read, from the model: eval, health, policy. */
const SECONDS = readSchedule(0).branches.map((branch) => branch.duration);

function rolloutRequest(s) {
  const [dialRoom, receipts] = area.inset(52, 64).columns([5, 7], 96);
  const radius = dialRoom.width * 0.43;
  const point = (fraction, r = radius) => {
    const angle = Math.PI * (0.75 + 1.5 * fraction);
    return [dialRoom.cx + r * Math.cos(angle), dialRoom.cy + r * Math.sin(angle)];
  };
  const arc = (fraction, color) =>
    polyline(Array.from({ length: 65 }, (_, i) => point(fraction * i / 64)), {
      stroke: color, width: 23,
    });
  const share = REQUEST.traffic / 100;
  const sweep = s.value(0);
  const dial = group(
    arc(1, 'gridStrong'), arc(share, MARK),
    ...Array.from({ length: 17 }, (_, i) =>
      line(point(i / 16, radius + 22), point(i / 16, radius + (i % 4 ? 32 : 50)), {
        stroke: i / 16 <= share ? MARK : QUIET, width: i % 4 ? 3 : 5,
      }),
    ),
    dot(19, MARK).at(...point(share)),
    dynamic(() => sweep.value > 0 && sweep.value < 1
      ? dot(12, 'ink').at(...point(share * sweep.value))
      : []),
    label(`${REQUEST.traffic}%`, { size: 142, color: MARK }).at(dialRoom.cx, dialRoom.cy - 18),
    label('requested traffic', { size: 43 }).at(dialRoom.cx, dialRoom.cy + 96),
  );
  const { eval: evaluation, health, policy } = values;
  const readings = [
    ['Evaluation', `${evaluation.failures} regressions / ${evaluation.cases} cases`, evaluation.failures / evaluation.cases <= RATE_LIMITS.eval],
    ['Canary', `${health.errors} errors / ${health.requests.toLocaleString('en-US')} requests`, health.errors / health.requests <= RATE_LIMITS.health],
    ['Rollout policy', `${policy.maxTraffic}% traffic ceiling`, REQUEST.traffic <= policy.maxTraffic],
  ];
  const slips = receipts.rows(3, 42).map((room, i) => {
    const [name, result, passed] = readings[i];
    const edge = Array.from({ length: 21 }, (_, j) => [
      room.right - (j % 2) * 12, room.top + room.height * j / 20,
    ]);
    const tear = room.right - 130;
    const paper = polygon([[room.left, room.top], ...edge, [room.left, room.bottom]], {
      fill: BRANCH_COLOR[i], stroke: null,
    });
    const ink = { color: 'bg', anchor: 'left' };
    const number = mono(result, { ...ink, size: 39 }).at(room.left + 36, room.cy + 35);
    const slip = group(
      paper,
      label(name, { ...ink, size: 54 }).at(room.left + 36, room.cy - 46),
      number,
      line([tear, room.top + 16], [tear, room.bottom - 16], { stroke: 'bg', width: 2, dash: [7, 9] }),
    );
    const stamp = pictogram(passed ? 'check' : 'cross', { size: 74, color: 'bg', accent: 'bg' })
      .at((tear + room.right) / 2 - 4, room.cy);
    return { slip, stamp };
  });
  return { dial, sweep, slips };
}

export default function subjectIntro(s, c) {
  const b = board(s);
  const { fan, ask, slots, slotNames, steps, writer } = b.nodes;

  const question = place(display(`${REQUEST.traffic}% of traffic to ${REQUEST.release}?`), BAND);
  const { dial, sweep, slips } = rolloutRequest(s);
  const opening = [heading(c.title), dial, slips[0].slip, slips[1].slip];
  s.add(...opening, ...b.moving);
  // Cut straight to the request. The dial and the two readings are present on frame zero.
  s.play(fadeIn(opening, { duration: 0 }));
  const requested = c.cue('requested-share');
  c.on('requested-share', () => s.play(sweep.to(1, { duration: requested.end - requested.start, ease: linear })));
  c.show('eval-question', slips[0].stamp, { after: true });
  c.show('health-question', slips[1].stamp, { after: true });
  c.show('policy-answer', [slips[2].slip, slips[2].stamp], { lead: 0 });
  c.swap('trace-workers', [dial, ...slips.flatMap(({ slip, stamp }) => [slip, stamp])],
    [question, ...b.leftSide, ...b.liveGauge], { lead: 0 });
  c.show(
    'receipts-reunite',
    b.rightSide.filter((node) => !b.liveGauge.includes(node)),
    { lead: 0 },
  );

  const travelWindow = c.cue('receipts-reunite').start - c.cue('read-branches').start;
  const secondsToScreen = (travelWindow * 0.82) / Math.max(...SECONDS);
  c.on('read-branches', () =>
    s.play(
      ...b.card.map((card) => card.shown.to(1, { duration: 0.2 })),
      ...b.card.map((card, i) =>
        seq(
          card.pos.to(1, { duration: SECONDS[i] * secondsToScreen, ease: linear }),
          b.gate[i].lamp.to(1, { duration: travelWindow * 0.05 }),
        ),
      ),
    ),
  );
  c.on('receipts-reunite', () =>
    s.play(
      seq(
        par(...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 }))),
        par(...b.card.map((card) => card.pos.to(2, { duration: 0.8 }))),
      ),
    ),
  );
  // Read two fields of the receipts while they sit together in the packet.
  c.on('danger-mixed', () => s.play(b.hot.rev.to(1, { duration: 0.3 })));
  c.on('danger-stale', () =>
    s.play(b.hot.rev.to(0, { duration: 0.3 }), b.hot.age.to(1, { duration: 0.3 })),
  );

  // Beat 1. The same picture, named part by part: edges, owned slots, the join, one proposal.
  c.on('explicit', () =>
    s.play(
      ask.pulse({ color: MARK }),
      ...fan.map((edge) => edge.pulse({ color: MARK })),
      indicate(slots, { color: MARK }),
    ),
  );
  c.on('owned-results', () =>
    s.play(
      b.hot.age.to(0, { duration: 0.3 }),
      lagged(
        slotNames.map((name, i) => indicate(name, { color: BRANCH_COLOR[i], scale: 1.15 })),
        { lag: 0.6 },
      ),
    ),
  );
  c.on('join-waits', () => s.play(indicate(b.nodes.packetFrame, { color: MARK, scale: 1 })));
  c.on('validated-join', () => s.play(...b.card.map((card) => card.read.to(3, { duration: 0.9 }))));
  c.after('one-proposal', () =>
    s.play(
      seq(
        par(...b.card.map((card) => card.verdict.to(1, { duration: 0.3 }))),
        b.packet.seal.to(1, { duration: 0.5 }),
        pulse(steps[0], { color: VALID }),
        b.token.shown.to(1, { duration: 0.3 }),
      ),
    ),
  );
  // The proposal waits for approval. The live gauge stays at zero.
  c.on('separate-boundary', () => s.play(indicate([writer.frame, writer.title], { color: MARK })));
  c.after('after-review', () => s.play(indicate(b.nodes.approval.title, { color: MARK })));

  // Beat 2. The two examples of the lesson: time on the lanes, and one identity on every card.
  c.on('traffic-proposal', () =>
    s.play(b.hot.traffic.to(1, { duration: 0.3 }), indicate(question.find('25%'), { color: MARK })),
  );
  const preview = { grown: s.value(0), shown: s.value(0) };
  const bars = dynamic(() => {
    if (preview.shown.value < 0.02) return [];
    return SECONDS.map((seconds, i) => {
      const room = laneRoom(i);
      const width =
        ((room.right - room.left - 40) * seconds * preview.grown.value) / Math.max(...SECONDS);
      return rect(Math.max(width, 1), room.height - 44, {
        radius: 8,
        stroke: null,
        fill: BRANCH_COLOR[i],
        opacity: 0.86 * preview.shown.value,
      }).at(room.left + 20 + width / 2, room.cy);
    });
  });
  s.add(bars);
  c.on('timing-example', () =>
    s.play(
      b.hot.traffic.to(0, { duration: 0.3 }),
      preview.shown.to(1, { duration: 0.2 }),
      preview.grown.to(1, { duration: 1.6 }),
    ),
  );
  c.on('same-action', () =>
    s.play(
      preview.shown.to(0, { duration: 0.4 }),
      b.hot.tenant.to(1, { duration: 0.4 }),
      b.hot.rev.to(1, { duration: 0.4 }),
    ),
  );

  // Beat 3. Keep the three dependencies together while their work moves.
  const [comparison, costRoom] = BAND.rows([4, 1], 'normal');
  const kinds = [
    { work: 'independent research', fits: 'specialists' },
    { work: 'deterministic ETL', fits: 'parallel code' },
    { work: 'coupled edits', fits: 'one scoped agent' },
  ].map((kind, i) => {
    const room = comparison.rows(3, 'tight')[i];
    const [nameRoom, mechanism, fitRoom] = room.columns([3, 2.5, 2.5], 'normal');
    return {
      work: place(label(kind.work, { size: 35 }), nameRoom, 'left'),
      fits: place(label(kind.fits, { size: 36, color: MARK }), fitRoom, 'left'),
      room: mechanism.inset('tight'),
      progress: s.value(0),
    };
  });
  const together = s.value(0);
  const deadline = s.value(0);
  const mechanisms = kinds.map((kind, i) =>
    dynamic(() => {
      const r = kind.room;
      const p = kind.progress.value;
      const left = r.left + 8;
      const right = r.right - 8;
      const pitch = Math.min(24, r.height / 3);
      const levels = [-1, 0, 1].map((j) => r.cy + j * pitch);
      if (i === 0) {
        // Independent questions fan out, then bring their results together.
        return levels.flatMap((y, branch) => {
          const mid = r.cx;
          const x = p < 0.5 ? left + (mid - left) * p * 2 : mid + (right - mid) * (p - 0.5) * 2;
          const movingY = p < 0.5 ? r.cy + (y - r.cy) * p * 2 : y + (r.cy - y) * (p - 0.5) * 2;
          return [
            line([left, r.cy], [mid, y], { stroke: QUIET, width: 2 }),
            line([mid, y], [right, r.cy], { stroke: QUIET, width: 2 }),
            dot(9, BRANCH_COLOR[branch]).at(mid, y),
            dot(6, BRANCH_COLOR[branch]).at(x, movingY),
          ];
        });
      }
      if (i === 1) {
        const total = SECONDS.reduce((sum, seconds) => sum + seconds, 0);
        const unit = (right - left) / total;
        const bars = levels.flatMap((y, j) => {
          const serialStart = SECONDS.slice(0, j).reduce((sum, seconds) => sum + seconds, 0);
          const start = serialStart * (1 - together.value);
          const width = SECONDS[j] * unit * p;
          return [
            line([left, y], [right, y], { stroke: QUIET, width: 2 }),
            ...(width < 1
              ? []
              : [
                  rect(width, 12, { radius: 3, stroke: null, fill: BRANCH_COLOR[j] }).at(
                    left + start * unit + width / 2,
                    y,
                  ),
                ]),
          ];
        });
        if (deadline.value > 0.01)
          bars.push(
            line([left + 4 * unit, levels[0] - 10], [left + 4 * unit, levels[2] + 10], {
              stroke: MARK,
              width: 4,
              opacity: deadline.value,
            }),
          );
        return bars;
      }
      // Coupled edits share one trace. Each edit extends the preceding state.
      const segment = (right - left) / 3;
      const lengths = [0, 1, 2].map((j) => Math.max(0, Math.min(1, p * 3 - j)));
      return [
        line([left, r.cy], [right, r.cy], { stroke: QUIET, width: 2 }),
        ...lengths.flatMap((length, j) =>
          length > 0.005
            ? [
                line([left + j * segment, r.cy], [left + (j + length) * segment, r.cy], {
                  stroke: MARK,
                  width: 7,
                }),
              ]
            : [],
        ),
        pictogram('agent', { size: 34, color: QUIET, accent: MARK }).at(
          left + (right - left) * p,
          r.cy - 26,
        ),
      ];
    }),
  );
  const table = kinds.flatMap((kind, i) => [kind.work, mechanisms[i]]);
  const costs = chipRow(['token cost', 'coordination', 'review']);
  const cost = row([note('each extra context adds'), costs]);
  place(cost, costRoom, 'left');
  const parts = kinds.map((kind) => [kind.work]);
  const light = (lit) =>
    parts.flatMap((nodes, i) => nodes.map((node) => fade(node, i === lit ? 1 : 0.35)));
  c.on('subject-intro-construct-3', () =>
    s.play(b.hot.tenant.to(0, { duration: 0.4 }), b.hot.rev.to(0, { duration: 0.4 })),
  );
  c.swap('subject-intro-construct-3', question, table);
  c.on('case-research', () =>
    s.play(...light(0), kinds[0].progress.to(1, { duration: 2.4, ease: linear })),
  );
  c.on('case-etl', () =>
    s.play(...light(1), kinds[1].progress.to(1, { duration: 2.4, ease: linear })),
  );
  const limit = place(
    note('4 s deadline', { color: MARK }),
    BAND.rows([4, 1], 'normal')[1],
    'left',
  );
  c.show('etl-deadline', limit, { lead: 0 });
  c.on('etl-deadline', () => s.play(deadline.to(1, { duration: 0.2 })));
  c.on('etl-result', () => s.play(together.to(1, { duration: 1.1 })));
  c.hide('case-coupled', limit);
  c.on('case-coupled', () =>
    s.play(...light(2), kinds[2].progress.to(1, { duration: 2.4, ease: linear })),
  );
  ['research-result', 'etl-result', 'coupled-result'].forEach((cue, i) =>
    c.show(cue, kinds[i].fits, { after: true }),
  );
  c.on('extra-cost', () => s.play(...light(0)));
  c.show('extra-cost', cost, { stagger: true });
  c.on('measure', () => s.play(...parts.flat().map((node) => fade(node, 1))));

  b.leave(c);
}
