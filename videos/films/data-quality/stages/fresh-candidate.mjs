import { freshRows } from '../fixtures.mjs';
import { fixtureNormalize, prepareCandidate, referenceSplit } from '../model.mjs';

const additions = [
  {
    ticket_id: 705,
    conversation_id: 'build-005',
    text: 'Where is the rollback guide?',
    label: 'standard',
  },
  {
    ticket_id: 706,
    conversation_id: 'build-006',
    text: 'Update the runbook link',
    label: 'standard',
  },
];
const first = prepareCandidate(freshRows);
const next = prepareCandidate([...freshRows, ...additions]);
const splits = ['train', 'validation', 'test'];
const validation = next.kept.filter((row) => row.split === 'validation');
const correct = validation.filter((row) => row.label === 'standard').length;
const positives = validation.filter((row) => row.label === 'escalate').length;

function drawIntake(ctx, api) {
  const { C, text, line, rect, focus } = api;
  const p = focus.progress;
  const normalized = p('fresh-key') > 0;
  const kept = p('fresh-keep') > 0;
  const idChecked = p('fresh-id') > 0;
  const xs = [145, 320, 662, 1250, 1520];
  [
    'Ticket',
    'Conversation',
    normalized ? 'Normalized message' : 'Message',
    'Label',
    'Builder',
  ].forEach((l, i) => text(ctx, l, xs[i], 292, 31, C.muted));
  freshRows.forEach((row, i) => {
    const y = 394 + i * 125;
    const reject = first.rejected.find((r) => r.ticket_id === row.ticket_id);
    const decision =
      reject?.reason === 'invalid_ticket_id' ? 'invalid ID' : reject ? 'duplicate' : 'keep';
    const checked = typeof row.ticket_id === 'boolean' ? idChecked : kept;
    if (normalized && i < 2) rect(ctx, 646, y - 59, 553, 81, C.panel, C.blue, 4);
    [
      String(row.ticket_id),
      row.conversation_id,
      normalized && typeof row.ticket_id === 'number'
        ? fixtureNormalize(row.text)
        : '“' + row.text + '”',
      row.label,
      checked ? decision : '?',
    ].forEach((value, j) => {
      const color =
        j === 4 ? (checked ? (reject ? C.pink : C.green) : C.muted) : j === 1 ? C.blue : C.ink;
      text(ctx, value, xs[j], y, j === 2 ? 37 : 33, color, 'left', j < 2 ? 'mono' : 'sans');
    });
  });
  line(ctx, 140, 829, 1775, 829, C.muted, 2);
  text(
    ctx,
    kept
      ? `${first.kept.length} kept + ${first.rejected.length} rejected = ${freshRows.length} inputs`
      : 'Which two tickets survive?',
    960,
    945,
    49,
    kept ? C.green : C.yellow,
    'center',
    'serif',
  );
}

function drawSplitDesk(ctx, api) {
  const { C, text, rect, line, focus, lerp } = api;
  const p = focus.progress;
  const expanded = p('fresh-add') > 0;
  const arrival = p('fresh-land');
  const firstRoute = p('fresh-route');
  const held = p('fresh-hold') > 0;
  const atArrival = p('fresh-arrival') > 0;
  const predicted = p('fresh-score') > 0;
  const arrive = expanded ? additions : first.kept;
  const shelfX = (i) => 144 + 557 * i;
  if (predicted) {
    text(ctx, 'Validation ticket ' + validation[0].ticket_id, 145, 253, 34, C.blue);
    text(ctx, '“' + additions[0].text + '”', 145, 376, 53, C.ink, 'left', 'serif');
    if (atArrival) {
      text(ctx, 'At arrival  ·  message available', 145, 452, 34, C.cyan);
      text(ctx, 'Later  ·  incident resolution', 1060, 376, 40, C.muted);
      text(ctx, 'Unavailable when the router predicts', 1060, 452, 34, C.muted);
    } else {
      text(ctx, 'Router rule   →   predict standard for every message', 145, 452, 34, C.muted);
    }
  } else {
    text(
      ctx,
      expanded
        ? 'Next candidate   ·   two new reviewed conversations'
        : 'First candidate   ·   two retained conversations',
      145,
      253,
      34,
      C.ink,
    );
    text(
      ctx,
      'SHA-256 of conversation ID   →   first 8 hex digits   →   integer mod 100',
      145,
      314,
      29,
      C.muted,
    );
  }
  const range = ['0–69', '70–84', '85–99'];
  splits.forEach((split, i) => {
    const x = shelfX(i);
    text(ctx, split, x + 16, 798, 42, C.ink);
    text(ctx, range[i], x + 506, 798, 31, C.muted, 'right');
    line(ctx, x, 742, x + 525, 742, C.blue, 4);
  });
  const paintTicket = (row, x, y) => {
    rect(ctx, x, y, 509, 87, C.panel, C.blue, 5);
    text(
      ctx,
      `${row.ticket_id}   ·   ${row.label}`,
      x + 19,
      y + 38,
      33,
      row.label === 'escalate' ? C.yellow : C.cyan,
    );
    text(
      ctx,
      `${row.conversation_id}   ·   bucket ${referenceSplit(row.conversation_id).bucket}`,
      x + 19,
      y + 73,
      26,
      C.ink,
      'left',
      'mono',
    );
  };
  if (expanded) first.kept.forEach((row, i) => paintTicket(row, shelfX(0) + 8, 545 + 99 * i));
  arrive.forEach((row, i) => {
    const idx = splits.indexOf(referenceSplit(row.conversation_id).split);
    // Route the lower ticket first so one ticket never travels through the other.
    if (!expanded && i === 0) {
      const topProgress = api.clamp(firstRoute * 2 - 1);
      paintTicket(row, shelfX(0) + 8, lerp(345, 545, topProgress));
    } else if (!expanded) {
      // Give the second ticket its own row before sliding it across.
      const drop = api.clamp(firstRoute * 3);
      const slide = api.clamp(firstRoute * 3 - 1);
      paintTicket(row, lerp(shelfX(1) + 8, shelfX(0) + 8, slide), lerp(345, 644, drop));
    } else {
      paintTicket(row, shelfX(idx) + 8, lerp(345, 545, arrival));
    }
  });
  if (!expanded && firstRoute === 1) {
    for (const col of [1, 2]) text(ctx, '0 tickets', shelfX(col) + 265, 655, 38, C.muted, 'center');
    text(ctx, 'Validation and test have no examples to score.', 960, 910, 43, C.yellow, 'center');
  } else if (expanded && predicted) {
    text(ctx, '705   ·   predicted standard   ✓', shelfX(1) + 21, 699, 32, C.green);
    text(ctx, `Validation accuracy   ${correct} / ${validation.length}`, 150, 885, 42, C.green);
    text(
      ctx,
      held ? `Escalations in validation   ${positives}` : 'Escalations in validation   ?',
      986,
      885,
      42,
      C.yellow,
    );
    text(
      ctx,
      held
        ? 'Hold the comparison. Collect reviewed escalation groups.'
        : 'Can this score tell you how often the router catches an escalation?',
      960,
      973,
      41,
      C.ink,
      'center',
      'serif',
    );
  } else if (expanded) {
    text(
      ctx,
      'Same split rule   ·   original conversations stay in train',
      960,
      910,
      36,
      C.muted,
      'center',
    );
  } else {
    text(ctx, 'Which splits receive the two tickets?', 960, 910, 43, C.yellow, 'center');
  }
}

export function drawFreshCandidate(ctx, scene, state, api) {
  api.focus.target('release-desk', () => {
    if (api.focus.progress('fresh-buckets') > 0) drawSplitDesk(ctx, api);
    else drawIntake(ctx, api);
  });
}
export default {
  id: 'fresh-candidate',
  draw: drawFreshCandidate,
  cues: [
    'fresh-id',
    'fresh-key',
    'fresh-keep',
    'fresh-buckets',
    'fresh-route',
    'fresh-add',
    'fresh-land',
    'fresh-score',
    'fresh-hold',
    'fresh-arrival',
  ],
};
