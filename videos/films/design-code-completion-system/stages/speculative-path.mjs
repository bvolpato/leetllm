import { correctionDistribution } from '../arithmetic.mjs';
import { code, text } from '../defaults.mjs';

const draftTokens = ['graph', '.', 'allows', '(', 'user'];
const nextTokens = ['user', 'request', 'scope'];
const q = [4, 3, 3];
const p = [1, 5, 4];
const asProbability = (shares) => shares.map((n) => n / 10);
const correction = correctionDistribution(asProbability(p), asProbability(q));
const shortfalls = correction.residual.map((v) => Math.round(v * 10));
const missing = shortfalls.reduce((a, b) => a + b, 0);

function tokenStrip(ctx, api, label, tokens, y, colorAt) {
  text(ctx, api, label, 132, y - 43, 34, api.C.muted);
  tokens.forEach((token, i) => {
    const x = 133 + i * 277;
    api.rect(ctx, x, y, 249, 102, api.C.panel, colorAt(i), 2, 6);
    api.text(ctx, token, x + 124, y + 67, 41, colorAt(i), 'center', 'mono');
  });
}

function draftStep(ctx, api, state, after) {
  const { C } = api;
  let kept = after('spec-four') ? 4 : 0;
  let added = after('spec-replace') ? 'request' : null;
  if (after('spec-two')) {
    kept = 1;
    added = '[';
  }
  if (after('spec-one')) {
    kept = 0;
    added = 'policy';
  }
  if (after('spec-six')) {
    kept = draftTokens.length;
    added = ')';
  }
  const output = draftTokens.slice(0, kept).concat(added === null ? [] : [added]);
  const dealt =
    state.beat === 0
      ? Math.ceil(draftTokens.length * (state.cues?.['spec-draft']?.progress ?? 0))
      : draftTokens.length;
  tokenStrip(ctx, api, 'Draft', draftTokens.slice(0, dealt), 345, () => C.cyan);
  tokenStrip(ctx, api, 'Emitted', output, 657, (i) => (i < kept ? C.ink : C.yellow));
  if (after('spec-count')) {
    const noun = output.length === 1 ? ' token' : ' tokens';
    const detail =
      added === null
        ? ' from the draft'
        : kept === draftTokens.length
          ? ' including the bonus'
          : ' including the correction';
    text(ctx, api, output.length + noun + detail, 133, 915, 42, C.ink);
    if (added === 'request')
      text(ctx, api, 'KV pending for request', 1740, 915, 34, C.yellow, 'right');
  }
}

function samplingStep(ctx, api, after) {
  const { C } = api;
  const highlight = after('spec-missing'),
    reveal = after('spec-residual'),
    normalized = after('spec-normalize');
  text(ctx, api, 'Argument', 145, 294, 32, C.muted);
  text(ctx, api, 'Draft shares / 10', 480, 294, 32, C.muted);
  text(ctx, api, 'Target shares / 10', 1010, 294, 32, C.muted);
  if (highlight) text(ctx, api, 'Shortfall', 1582, 294, 32, C.yellow);
  nextTokens.forEach((token, i) => {
    const y = 374 + i * 155;
    code(ctx, api, token, 145, y + 48, 44);
    for (const [origin, n, color, target] of [
      [480, q[i], C.cyan, false],
      [1010, p[i], C.ink, true],
    ]) {
      for (let j = 0; j < 10; j++) {
        const surplus = target && highlight && j >= q[i] && j < n;
        api.rect(
          ctx,
          origin + 37 * j,
          y,
          31,
          54,
          j < n ? (surplus ? C.yellow : color) : C.panel,
          C.muted,
          1,
          3,
        );
      }
      text(ctx, api, n, origin + 404, y + 47, 42, color, 'center');
    }
    if (reveal) text(ctx, api, shortfalls[i], 1640, y + 49, 48, C.yellow, 'center');
  });
  let note = 'The draft proposes user';
  if (after('spec-rate'))
    note = 'Keep user with probability min(1, ' + p[0] + '/' + q[0] + ') = 1/4';
  if (after('spec-ask')) note = 'Which arguments can replace user, and in what proportions?';
  if (highlight) note = 'Count the target shares the draft did not cover';
  if (reveal) note = 'Missing shares   ' + shortfalls.join(' + ') + ' = ' + missing;
  if (normalized)
    note =
      'Correction draw     request  ' +
      shortfalls[1] +
      '/' +
      missing +
      '       scope  ' +
      shortfalls[2] +
      '/' +
      missing;
  text(ctx, api, note, 960, 941, 43, normalized ? C.yellow : C.ink, 'center');
}

export function drawSpeculativePath(ctx, scene, state, api) {
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const beat = state.beat ?? 0;
  const { C } = api;
  api.focus.target('spec-work', () => {
    if (beat <= 1) return draftStep(ctx, api, state, after);
    if (beat <= 3) return samplingStep(ctx, api, after);
    const output = [...draftTokens.slice(0, 4), 'request'];
    tokenStrip(ctx, api, 'Emitted in the original step', output, 335, (i) =>
      i === 4 ? C.yellow : C.ink,
    );
    text(ctx, api, 'Cost in ordinary target steps', 133, 592, 34, C.muted);
    const cost = after('spec-cost') ? 2 : 1;
    ['All five draft steps', 'Verify the draft'].slice(0, cost).forEach((s, i) => {
      const x = 132 + i * 560;
      api.rect(ctx, x, 640, 522, 95, C.panel, C.cyan, 2, 5);
      text(ctx, api, s + '   × 1', x + 261, 700, 36, C.ink, 'center');
    });
    if (after('spec-ratio'))
      text(
        ctx,
        api,
        output.length +
          ' outputs / ' +
          cost +
          ' cost units = ' +
          output.length / cost +
          ' outputs per unit',
        960,
        925,
        45,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'speculative-path',
  draw: drawSpeculativePath,
  cues: [
    'spec-draft',
    'spec-four',
    'spec-replace',
    'spec-count',
    'spec-two',
    'spec-one',
    'spec-six',
    'spec-chances',
    'spec-rate',
    'spec-ask',
    'spec-missing',
    'spec-residual',
    'spec-normalize',
    'spec-cost',
    'spec-ratio',
  ],
};
