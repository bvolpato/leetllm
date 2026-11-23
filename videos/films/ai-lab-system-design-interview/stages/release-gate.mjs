import { namedSystemCue, spokenResult } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { releaseGate } from '../model.mjs';

const docs = { name: 'Relevant documents retrieved', count: 94, total: 100 };
const citations = { name: 'Citations supporting their claim', count: 93, total: 100 };
const packet = releaseGate({
  recall: docs.count / docs.total,
  faithfulness: citations.count / citations.total,
  leaks: 0,
});
const x = (count) => 760 + (count - 90) * 94;

function measure(ctx, api, sample, minimum, y, progress, showGap) {
  const { C } = api;
  const required = minimum * sample.total;
  text(ctx, api, sample.name, 160, y - 58, 35, C.ink);
  text(
    ctx,
    api,
    progress === 1 ? sample.count + ' / ' + sample.total : '? / ' + sample.total,
    160,
    y + 27,
    61,
    C.ink,
  );
  api.line(ctx, x(90), y, x(100), y, C.muted, 3);
  for (let tick = 90; tick <= 100; tick++)
    api.line(ctx, x(tick), y - 9, x(tick), y + 12, C.muted, 2);
  text(ctx, api, '90', x(90), y + 59, 28, C.muted, 'center');
  text(ctx, api, '100', x(100), y + 59, 28, C.muted, 'center');
  api.line(ctx, x(required), y - 50, x(required), y + 18, C.yellow, 5);
  text(ctx, api, 'Required  ' + required, x(required), y - 69, 34, C.yellow, 'center');
  if (progress > 0) {
    const position = x(90 + (sample.count - 90) * progress);
    api.circle(ctx, position, y, 13, C.cyan);
  }
  if (showGap) {
    const start = x(Math.min(required, sample.count)),
      end = x(Math.max(required, sample.count));
    const color = sample.count < required ? C.pink : C.green;
    api.line(ctx, start, y + 32, end, y + 32, color, 4);
    api.line(ctx, start, y + 24, start, y + 40, color, 4);
    api.line(ctx, end, y + 24, end, y + 40, color, 4);
    text(
      ctx,
      api,
      Math.abs(sample.count - required) + (sample.count < required ? ' short' : ' above'),
      (start + end) / 2,
      y + 93,
      32,
      color,
      'center',
    );
  }
}

export function drawReleaseGate(ctx, scene, state, api) {
  const { C, focus } = api;
  const held = spokenResult(state, 'release-hold', 1, 0.55);
  focus.target('release-recall', () =>
    measure(
      ctx,
      api,
      docs,
      packet.minima.recall,
      388,
      namedSystemCue(state, 'release-docs', 0, 0.18),
      spokenResult(state, 'release-recall-gap', 1, 0.16),
    ),
  );
  focus.target('release-faith', () =>
    measure(
      ctx,
      api,
      citations,
      packet.minima.faithfulness,
      646,
      namedSystemCue(state, 'release-cites', 0, 0.46),
      spokenResult(state, 'release-gap', 1, 0.28),
    ),
  );
  focus.target('release-receipt', () => {
    api.line(ctx, 160, 816, 1760, 816, C.muted, 2);
    text(ctx, api, 'Candidate C2   /   Offline evaluation', 160, 878, 32, C.muted);
    text(ctx, api, 'Observed permission leaks   ' + packet.leaks, 1760, 878, 32, C.ink, 'right');
    const verdict = packet.launchAllowed ? 'Canary eligible' : 'Hold  ·  Citation faithfulness';
    text(
      ctx,
      api,
      held ? verdict : 'Which check stops launch, and by how many?',
      160,
      965,
      49,
      held ? C.pink : C.ink,
    );
  });
}
export default {
  id: 'release-gate',
  draw: drawReleaseGate,
  cues: [
    'release-docs',
    'release-cites',
    'release-question',
    'release-recall-gap',
    'release-gap',
    'release-hold',
    'release-policy',
    'release-owner',
  ],
};
