import { stableSoftmax } from 'vizmatic';
import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { POLICY_CASES, RELEASE_CANDIDATES, RELEASE_LIMITS } from '../fixtures.mjs';
import { releaseChecks } from '../model.mjs';
import { drawPolicyPredictions } from '../policy-predictions.mjs';

function nextWord(ctx, state, api) {
  const { C } = api;
  const q = [0.2, 0.5, 0.3];
  const before = stableSoftmax([0, 0, 0]);
  const targetSeen = spokenProgress(state, api, 'fresh-target', 0, 0.25, 0.33);
  const garden = spokenProgress(state, api, 'fresh-garden', 0, 0.49, 0.54) === 1;
  const moved = spokenProgress(state, api, 'fresh-logits', 0, 0.61, 0.78) === 1;
  const normalized = spokenProgress(state, api, 'fresh-probability', 0, 0.84, 0.98) === 1;
  const logits = q.map((v, i) => 0.6 * (v - before[i]));
  const p = normalized ? stableSoftmax(logits) : before;
  const baseline = 761;
  const scale = 500;
  api.focus.target('fresh-words', () => {
    text(ctx, api, 'Student prefix ends in “beside”', 145, 279, 44);
    text(ctx, api, 'Next-token probability', 145, 373, 32, C.muted);
    api.rect(ctx, 822, 347, 32, 27, C.cyan);
    text(ctx, api, 'Student', 875, 373, 32, C.cyan);
    api.line(ctx, 1178, 359, 1240, 359, C.blue, 6);
    text(ctx, api, 'Teacher', 1260, 373, 32, C.blue);
    ['gate', 'garden', 'tree'].forEach((word, i) => {
      const x = 400 + 550 * i;
      text(ctx, api, word, x, 455, 44, garden && i === 1 ? C.yellow : C.ink, 'center');
      const y = baseline - scale * p[i];
      api.rect(ctx, x - 100, y, 200, scale * p[i], C.cyan);
      text(ctx, api, normalized ? p[i].toFixed(3) : '1/3', x, baseline - 24, 35, C.bg, 'center');
      if (targetSeen > 0) {
        const tick = baseline - scale * q[i];
        api.components.fade(targetSeen, () => {
          api.line(ctx, x - 127, tick, x + 127, tick, C.blue, 6);
          text(ctx, api, q[i].toFixed(2), x + 148, tick + 10, 32, C.blue);
        });
      }
      api.line(ctx, x - 126, baseline, x + 126, baseline, C.muted, 2);
      const z = moved ? (logits[i] > 0 ? '+' : '') + logits[i].toFixed(2) : '0';
      text(ctx, api, 'Logit   ' + z, x, 842, 37, moved ? C.yellow : C.ink, 'center');
    });
    const prompt = moved
      ? 'Garden     0.6 × (0.5 − 1/3) = +0.10'
      : garden
        ? 'Garden has the largest positive gap.'
        : 'Which word’s score rises most?';
    text(ctx, api, prompt, 960, 963, 42, C.yellow, 'center');
  });
}

function reports(ctx, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const showErrors = spokenProgress(state, api, 'fresh-errors', 3, 0.55, 0.71);
  const verdict = spokenProgress(state, api, 'fresh-release', 4, 0.005, 0.09) === 1;
  api.focus.target('release-slice', () => {
    const common = RELEASE_CANDIDATES[0];
    text(ctx, api, 'Both candidates   •   assigned measurements', 145, 263, 34, C.muted);
    const measures = [
      [
        'Checked accuracy',
        Math.round(100 * common.accuracy) + '%',
        '≥ ' + 100 * RELEASE_LIMITS.accuracy + '%',
      ],
      ['Latency', common.latency + ' ms', '≤ ' + RELEASE_LIMITS.latency + ' ms'],
      [
        'Monthly serving cost',
        common.monthlyCost.toLocaleString('en-US'),
        '≤ ' + RELEASE_LIMITS.monthlyCost.toLocaleString('en-US') + ' units',
      ],
    ];
    measures.forEach(([name, value, gate], i) => {
      const x = 145 + i * 580;
      text(ctx, api, name, x, 337, 32, C.muted);
      text(ctx, api, value + '     ' + gate, x, 406, 41, C.ink);
    });
    text(
      ctx,
      api,
      'Policy slice     At most ' + RELEASE_LIMITS.policy * 100 + ' error per 100 cases',
      145,
      522,
      42,
      C.yellow,
    );
    RELEASE_CANDIDATES.forEach((candidate, i) => {
      const x = 145 + i * 866;
      const pass = Object.values(releaseChecks(candidate)).every(Boolean);
      text(ctx, api, candidate.name, x, 604, 44);
      for (let j = 0; j < candidate.policyCases; j++) {
        const error = j < candidate.errors && showErrors === 1;
        api.circle(
          ctx,
          x + 12 + (j % 20) * 28,
          656 + Math.floor(j / 20) * 23,
          error ? 10 : 6,
          error ? C.pink : C.muted,
        );
      }
      if (showErrors === 1) {
        text(
          ctx,
          api,
          candidate.errors +
            (candidate.errors === 1 ? ' error' : ' errors') +
            ' / ' +
            candidate.policyCases,
          x,
          832,
          36,
        );
      } else text(ctx, api, 'Outcomes covered', x, 832, 32, C.muted);
      if (verdict)
        text(
          ctx,
          api,
          pass ? 'Clears all four' : 'Hold for policy errors',
          x,
          903,
          40,
          pass ? C.green : C.pink,
        );
    });
    text(
      ctx,
      api,
      beat <= 3
        ? beat === 3
          ? 'Which candidate clears all four requirements?'
          : 'One dot per held-out policy case'
        : 'Investigate on separate development cases before the next release check.',
      960,
      991,
      33,
      C.muted,
      'center',
    );
  });
}

export function drawFreshDistillation(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat < 2) return nextWord(ctx, state, api);
  if (beat < 5) return reports(ctx, state, api);
  const { C } = api;
  drawPolicyPredictions(ctx, api);
  text(ctx, api, 'Policy for this key', 145, 840, 42, C.muted);
  text(ctx, api, POLICY_CASES[1].rule, 592, 840, 52, C.pink);
  text(ctx, api, 'Held-out policy errors', 145, 937, 36, C.muted);
  text(ctx, api, 'Limit   ' + RELEASE_LIMITS.policy * 100 + ' per 100', 145, 993, 36);
  RELEASE_CANDIDATES.forEach((candidate, i) => {
    const passed = Object.values(releaseChecks(candidate)).every(Boolean);
    const count = candidate.errors + '/' + candidate.policyCases;
    const decision = passed ? 'clears all four' : 'hold';
    text(
      ctx,
      api,
      candidate.name + '   ' + count + '   ' + decision,
      592 + 544 * i,
      970,
      37,
      passed ? C.green : C.pink,
    );
  });
}
export default {
  id: 'fresh-distillation',
  draw: drawFreshDistillation,
  cues: [
    'fresh-target',
    'fresh-garden',
    'fresh-logits',
    'fresh-probability',
    'fresh-errors',
    'fresh-release',
  ],
};
