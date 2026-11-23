import { amendedSpec, cacheWorksheet, latestRetryLimit, lookupCases } from '../model.mjs';
import { box, cueDone, cueMotion, text } from '../defaults.mjs';

function lookup(ctx, state, api) {
  const { C } = api;
  const compared = cueDone(state, 'score-fields', 1, 0.67);
  const last = cueMotion(state, 'return-state', 1, 0, 0.25);
  const second = cueMotion(state, 'fresh-second', 0, 0.3, 0.54);
  const header = (label, x) => api.text(ctx, label, x, 340, 35, C.muted, 'center', 'mono');
  api.focus.target('test-files', () => {
    header('max_retries', 435);
    header('timeout_s', 775);
    lookupCases.forEach((f, i) => {
      if (i && second === 0) return;
      const y = 485 + 220 * i,
        color = i ? C.pink : C.blue;
      text(ctx, api, 'File ' + (i ? 'D' : 'C'), 115, y, 46, color);
      text(ctx, api, String(f.retries), 435, y, 72, color, 'center');
      text(ctx, api, String(f.timeout), 775, y, 72, C.ink, 'center');
    });
  });
  api.focus.target('returned-values', () => {
    text(ctx, api, 'Toy reader returns h', 1335, 340, 38, C.muted, 'center');
    lookupCases.forEach((f, i) => {
      if (i && second === 0) return;
      const y = 485 + 220 * i;
      const expression = '(' + f.states[0] + ' + ' + f.timeout + ') ÷ 2';
      text(ctx, api, expression, 1195, y - 5, 45, C.ink, 'center');
      box(
        ctx,
        api,
        last === 1 ? String(f.returned) : '?',
        1445,
        y - 85,
        145,
        110,
        last === 1 ? C.green : C.yellow,
        54,
      );
      if (compared) {
        const verdict = f.exact ? 'Match' : 'Miss';
        text(ctx, api, verdict, 1720, y, 41, f.exact ? C.green : C.red, 'center');
      }
    });
  });
  api.focus.target('exact-score', () => {
    const count = lookupCases.filter((f) => f.exact).length;
    const line = compared
      ? count + ' of ' + lookupCases.length + ' retry limits returned exactly'
      : 'Which file gets the correct retry limit?';
    text(ctx, api, line, 960, 875, 48, compared ? C.ink : C.yellow, 'center');
    text(
      ctx,
      api,
      'Start each file at zero. Average in the retry limit, then the timeout.',
      960,
      975,
      33,
      C.muted,
      'center',
    );
  });
}

function candidates(ctx, state, api) {
  const { C } = api;
  const measured = cueMotion(state, 'kv-budget', 2, 0.12, 0.45);
  const pure = cueMotion(state, 'ssm-budget', 2, 0.45, 0.6);
  const hybrid = cueMotion(state, 'hybrid-budget', 2, 0.5, 0.78);
  const decision = cueDone(state, 'bench-hybrid', 3, 0.3);
  const full = cacheWorksheet(32),
    mixed = cacheWorksheet(4),
    recurrent = cacheWorksheet(0);
  const origin = 565,
    scale = 32,
    limit = origin + 24 * scale;
  api.focus.target('memory-budget', () => {
    text(ctx, api, 'One request   ·   65,536 positions', 145, 282, 42, C.ink);
    text(ctx, api, '24 GiB device', limit, 345, 36, C.yellow, 'center');
    api.line(ctx, limit, 375, limit, 744, C.yellow, 4);
    const rows = [
      ['Full attention', 415, full.kvGiB, measured, C.blue],
      ['Hybrid', 555, mixed.kvGiB, hybrid, C.pink],
    ];
    rows.forEach(([label, y, gib, amount, color]) => {
      text(ctx, api, label, 150, y + 57, 42, color);
      if (amount > 0) api.rect(ctx, origin, y, gib * scale * amount, 72, color);
      if (amount === 1)
        text(ctx, api, gib + ' GiB KV', origin + gib * scale + 25, y + 51, 36, color);
    });
    if (hybrid === 1) {
      text(ctx, api, '+ ' + mixed.stateMiB + ' MiB recurrent buffers', 720, 664, 32, C.muted);
    }
    if (pure > 0) {
      text(ctx, api, 'Pure SSM', 150, 741, 42, C.green);
      text(ctx, api, recurrent.stateMiB + ' MiB recurrent buffers', origin, 741, 36, C.green);
    }
  });
  api.focus.target('candidate-decision', () => {
    const line = decision
      ? 'Benchmark the hybrid alongside the trained SSM'
      : 'Which candidate keeps explicit token access within the KV budget?';
    text(ctx, api, line, 960, 863, 45, decision ? C.green : C.yellow, 'center');
    text(
      ctx,
      api,
      decision
        ? 'Score exact lookups by position. Measure peak memory and latency at serving concurrency.'
        : 'Worksheet counts live cache payload. Weights, snapshots and workspace also need device memory.',
      960,
      965,
      31,
      C.muted,
      'center',
    );
  });
}

function moveLookup(ctx, state, api) {
  const { C } = api;
  const middle = cueMotion(state, 'middle-lookup', 3, 0.4, 0.5);
  const late = cueMotion(state, 'late-lookup', 3, 0.51, 0.63);
  const amended = cueMotion(state, 'later-amendment', 3, 0.66, 0.77);
  const distractor = cueMotion(state, 'similar-value', 3, 0.78, 0.87);
  const answered = cueDone(state, 'reference-answer', 4, 0.09);
  const location = 360 + 560 * middle + 530 * late;
  api.focus.target('lookup-trial', () => {
    text(ctx, api, '65,536-position prompt', 145, 279, 41);
    text(ctx, api, 'Hybrid and trained SSM', 1755, 279, 38, C.green, 'right');
    api.line(ctx, 170, 425, 1730, 425, C.muted, 4);
    api.circle(ctx, location, 425, 15, C.blue);
    api.circle(ctx, 1730, 425, 15, C.yellow);
    api.text(ctx, 'max_retries', location, 385, 36, C.blue, 'center', 'mono');
    text(ctx, api, 'question', 1730, 497, 31, C.yellow, 'center');
    const descriptions = ['Original setting', 'Later amendment', 'Timeout'];
    amendedSpec.forEach((entry, i) => {
      if ((i === 1 && amended === 0) || (i === 2 && distractor === 0)) return;
      const x = 360 + i * 595;
      const color = answered && i === 1 ? C.green : C.ink;
      text(ctx, api, descriptions[i], x, 610, 34, C.muted, 'center');
      api.text(ctx, entry.field + ' = ' + entry.value, x, 698, 42, color, 'center', 'mono');
    });
  });
  api.focus.target('expected-limit', () => {
    text(
      ctx,
      api,
      answered ? 'Exact answer   ' + latestRetryLimit(amendedSpec) : 'How many retries?',
      960,
      841,
      55,
      answered ? C.green : C.yellow,
      'center',
    );
    text(
      ctx,
      api,
      answered
        ? 'Measure exact answers, peak GiB and latency at serving concurrency.'
        : 'Use the same prompt and decoding settings for both candidates.',
      960,
      960,
      35,
      C.muted,
      'center',
    );
  });
}

export function drawReleaseGate(ctx, scene, state, api) {
  if (state.beat < 2) lookup(ctx, state, api);
  else if (
    state.beat === 2 ||
    (state.beat === 3 && cueMotion(state, 'move-setting', 3, 0.3, 0.38) === 0)
  ) {
    candidates(ctx, state, api);
  } else moveLookup(ctx, state, api);
}

export default { id: 'release-gate', draw: drawReleaseGate };
