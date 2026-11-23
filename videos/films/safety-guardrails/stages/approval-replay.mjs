import { approvalFixture, articleActionHash, guardCue } from '../model.mjs';

const attempts = [
  { hasApproval: false },
  {},
  {},
  { artifact: 'b' },
  { operation: 'deploy-op-43' },
  { now: 900 },
];
const outcomes = approvalFixture(attempts).outcomes;
const verdictCues = [
  'replay-missing',
  'replay-first',
  'replay-same',
  'replay-changed',
  'replay-used',
  'replay-expired',
];
const verdictBeats = [0, 1, 2, 4, 5, 6];

export function paintApprovalReplay(ctx, scene, state, api) {
  const { C, text, line, rect } = api;
  const beat = state.beat ?? 0;
  const showingChange = guardCue(state, 'replay-change', 3, 0.24, 0.48) > 0;
  const i = [0, 1, 2, showingChange ? 3 : 2, 3, 4, 5][beat] ?? 5;
  const attempt = attempts[i],
    prev = outcomes[i - 1];
  const done = guardCue(state, verdictCues[i], verdictBeats[i]) === 1;
  const count = done ? outcomes[i].count : (prev?.count ?? 0);
  const artifact = attempt.artifact ?? 'a';
  const op = attempt.operation ?? 'deploy-op-42';
  const hash = (a) => articleActionHash(a).slice(0, 8) + '…';

  text(ctx, 'Payment-service   /   prod', 120, 255, 36, C.ink);
  text(ctx, 'Authenticated engineer-7', 1795, 255, 30, C.muted, 'right');
  line(ctx, 120, 300, 1800, 300, C.muted, 2);
  text(ctx, 'This attempt', 370, 395, 34, C.blue);
  text(ctx, 'Trusted record', 790, 395, 34, C.cyan);
  api.focus.target('replay-fields', () => {
    const fields = [
      ['Approval', i === 0 ? 'None' : 'approval-42', i === 0 ? 'No lookup' : 'approval-42'],
      ['Artifact', artifact + ' × 64', i === 0 ? '·' : 'a × 64'],
      ['Action hash', hash(artifact), i === 0 ? '·' : hash('a')],
      ['Operation', op, i === 0 ? '·' : ((done ? outcomes[i] : prev)?.consumedBy ?? 'Unused')],
      ['Time (UTC)', attempt.now === 900 ? '00:15' : '00:00', i === 0 ? '·' : 'Expires 00:15'],
    ];
    fields.forEach(([name, proposed, stored], n) => {
      const y = 490 + n * 78;
      text(ctx, name, 120, y, 27, C.muted);
      text(ctx, proposed, 370, y, 34, C.ink);
      text(ctx, stored, 790, y, 34, C.ink);
    });
    if (i === 3 || i === 4 || i === 5) {
      const row = i === 3 ? 1 : i === 4 ? 3 : 4;
      const y = 508 + row * 78;
      line(ctx, 370, y, 645, y, C.yellow, 4);
      line(ctx, 790, y, 1060, y, C.yellow, 4);
    }
  });

  api.focus.target('deploy-list', () => {
    rect(ctx, 1190, 348, 598, 474, C.panel, C.muted, 12);
    text(ctx, 'Local deployment list', 1230, 416, 34, C.ink);
    text(ctx, String(count), 1240, 574, 115, count ? C.green : C.muted);
    text(ctx, count === 1 ? 'entry' : 'entries', 1350, 564, 37, C.ink);
    line(ctx, 1230, 630, 1743, 630, C.muted, 2);
    if (count) {
      text(ctx, '01    payment-service', 1230, 706, 36, C.green);
      text(ctx, 'deploy-op-42', 1315, 765, 29, C.muted);
    } else text(ctx, 'Empty', 1230, 705, 36, C.muted);
  });
  api.focus.target('replay-verdict', () => {
    let value = 'Checking this attempt…';
    if (done) value = outcomes[i].result;
    if (beat === 3 && showingChange)
      value = 'Same operation, different artifact. What will the host return?';
    if (beat === 7)
      value = 'This list belongs to one process. A remote executor needs a durable record.';
    text(
      ctx,
      value,
      960,
      937,
      37,
      done && i !== 1 && i !== 2 ? C.yellow : C.ink,
      'center',
      value.includes('_') ? 'mono' : 'sans',
    );
  });
}
export { paintApprovalReplay as drawApprovalReplay };
export default {
  id: 'approval-replay',
  draw: paintApprovalReplay,
  cues: [...verdictCues, 'replay-change', 'replay-predict', 'replay-limit'],
};
