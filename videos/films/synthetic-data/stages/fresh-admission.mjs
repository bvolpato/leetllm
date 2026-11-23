import { RELEASE_SUITES } from '../fixtures.mjs';
import { syntheticRelease } from '../model.mjs';

const rates = Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.count / s.total]));
const gates = Object.fromEntries(RELEASE_SUITES.map((s) => [s.id, s.limit / s.total]));
const verdict = syntheticRelease(rates, gates);
const rare = RELEASE_SUITES.find((s) => s.id === 'rare');
const gap = rare.limit - rare.count;

function drawBudget(ctx, api, p) {
  const { C, focus } = api;
  const x = 490,
    unit = 97;
  api.text(ctx, 'Same starting checkpoint', 160, 285, 42, C.ink);
  focus.target('baseline-budget', () => {
    api.text(ctx, 'Baseline', 160, 421, 39, C.blue);
    api.rect(ctx, x, 350, 12 * unit, 104, C.panel, C.blue, 7);
    if (p('fresh-tokens') > 0) {
      api.rect(ctx, x, 350, 12 * unit, 104, C.blue, undefined, 7);
      api.text(ctx, '12 million real tokens', x + 6 * unit, 419, 42, C.bg, 'center');
    }
  });
  focus.target('candidate-budget', () => {
    api.text(ctx, 'Candidate', 160, 627, 39, C.cyan);
    const mix = p('fresh-mixture');
    const syntheticWidth = 4 * unit * mix;
    api.rect(ctx, x, 555, 12 * unit, 104, C.panel, C.cyan, 7);
    if (mix > 0) {
      api.rect(ctx, x, 555, 12 * unit - syntheticWidth, 104, C.blue, undefined, 0);
      api.rect(ctx, x + 12 * unit - syntheticWidth, 555, syntheticWidth, 104, C.cyan, undefined, 0);
      if (mix === 1) {
        api.text(ctx, '8 million real', x + 4 * unit, 624, 40, C.bg, 'center');
        api.text(ctx, '4 million synthetic', x + 10 * unit, 624, 35, C.bg, 'center');
      }
    }
  });
  focus.target('prep-cost', () => {
    api.text(ctx, 'Generation and screening', 160, 793, 34, C.muted);
    if (p('fresh-generation-premise') > 0)
      api.text(ctx, '+18 compute units', x + 12 * unit, 793, 43, C.yellow, 'right');
    if (p('fresh-cost-predict') > 0) {
      const resolved = p('fresh-extra-cost') === 1;
      api.text(
        ctx,
        resolved
          ? 'Report preparation cost separately'
          : 'What work does the equal token count leave out?',
        960,
        952,
        45,
        C.yellow,
        'center',
      );
    }
  });
}

function drawSuites(ctx, api, p) {
  const { C, focus } = api;
  const hasVerdict = p('fresh-decision') === 1;
  api.text(ctx, 'Fictional held-out searches and safety probes', 150, 272, 38, C.blue);
  const cols = [150, 690, 1095, 1540];
  ['Slice', 'Observed', 'Release rule', 'Rate'].forEach((label, i) =>
    api.text(ctx, label, cols[i], 378, 33, C.muted),
  );
  api.line(ctx, 150, 412, 1770, 412, C.muted, 2);
  for (const [i, s] of RELEASE_SUITES.entries()) {
    const rule = p(s.id + '-rule') > 0;
    const answer = p(s.id === 'unsafe' ? 'fresh-results' : s.id + '-count') === 1;
    if (!rule) continue;
    focus.target(s.id + '-slice', () => {
      const y = 515 + 137 * i;
      const counts = s.count + ' / ' + s.total;
      const requirement = (s.id === 'unsafe' ? 'At most ' : 'At least ') + s.limit;
      const color = hasVerdict ? (verdict.passes[i] ? C.green : C.pink) : C.ink;
      api.text(ctx, s.label, cols[0], y, 41, C.ink);
      api.text(ctx, answer ? counts : '? / ' + s.total, cols[1], y, 51, color);
      api.text(ctx, requirement, cols[2], y, 43, C.ink);
      if (answer) api.text(ctx, String(rates[s.id]), cols[3], y, 43, color);
    });
  }
  focus.target('release-receipt', () => {
    const prompt =
      p('fresh-gate-predict') > 0
        ? 'Which gate, if any, should hold this checkpoint?'
        : 'Apply each rule to its own slice';
    api.text(
      ctx,
      hasVerdict
        ? verdict.release
          ? 'Release'
          : 'Hold the checkpoint   ·   rare searches'
        : prompt,
      960,
      959,
      44,
      hasVerdict ? C.pink : C.yellow,
      'center',
    );
  });
}

function drawRareCases(ctx, api, p) {
  const { C, focus } = api;
  const x = 150,
    width = 1560,
    step = width / rare.total;
  const hypothetical = p('two-more') === 1 && p('observed-only') < 1;
  const reconsider = p('would-pass') === 1 && hypothetical;
  focus.target('rare-detail', () => {
    api.text(ctx, 'Retry, then paginate', x, 306, 48, C.ink);
    api.text(ctx, '50 held-out searches, grouped by outcome', x, 382, 34, C.muted);
    const thresholdX = x + rare.limit * step;
    api.text(ctx, 'Floor   ' + rare.limit + ' correct', thresholdX, 491, 40, C.yellow, 'center');
    api.line(ctx, thresholdX, 511, thresholdX, 547, C.yellow, 4);
    for (let i = 0; i < rare.total; i++) {
      const added = hypothetical && i >= rare.count && i < rare.limit;
      const color = i < rare.count ? C.blue : added ? C.yellow : C.panel;
      api.rect(
        ctx,
        x + i * step,
        558,
        step - 5,
        108,
        color,
        i < rare.count || added ? undefined : C.muted,
        3,
      );
    }
    const observedX = x + rare.count * step;
    api.line(ctx, observedX, 674, observedX, 704, C.blue, 4);
    api.text(ctx, rare.count + ' correct in the observed run', observedX, 770, 39, C.blue, 'right');
    if (hypothetical)
      api.text(ctx, '+' + gap + ' if corrected', thresholdX + 12, 770, 32, C.yellow);
  });
  focus.target('release-receipt', () => {
    let label = 'How many more correct answers would reach the floor?';
    if (hypothetical)
      label = reconsider
        ? rare.limit + ' / ' + rare.total + ' would meet the floor'
        : gap + ' more correct answers';
    if (p('observed-only') === 1) label = 'Hold   ·   observed ' + rare.count + ' / ' + rare.total;
    if (p('next-action') === 1) label += '   ·   inspect retry examples in the training batches';
    api.text(
      ctx,
      label,
      960,
      948,
      40,
      hypothetical ? C.yellow : p('observed-only') === 1 ? C.pink : C.ink,
      'center',
    );
  });
}

export function drawFreshAdmission(ctx, scene, state, api) {
  const p = (id) => api.focus.progress(id, 0);
  if (p('rare-detail') > 0) drawRareCases(ctx, api, p);
  else if (p('common-rule') > 0) drawSuites(ctx, api, p);
  else drawBudget(ctx, api, p);
}
export default {
  id: 'fresh-admission',
  draw: drawFreshAdmission,
  cues: [
    'fresh-tokens',
    'fresh-mixture',
    'fresh-generation-premise',
    'fresh-cost-predict',
    'fresh-extra-cost',
    'common-rule',
    'common-count',
    'rare-rule',
    'rare-count',
    'unsafe-rule',
    'fresh-results',
    'fresh-gate-predict',
    'fresh-decision',
    'rare-detail',
    'gap-question',
    'two-more',
    'would-pass',
    'observed-only',
    'next-action',
  ],
};
