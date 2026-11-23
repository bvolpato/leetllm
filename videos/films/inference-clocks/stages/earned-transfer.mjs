import { capacityFixture, metrics } from '../arithmetic.mjs';
import { inferenceCapacityAnswerVisible } from '../model.mjs';
import { bracket, passage, scaleTime, spoken, tokenMark } from '../trace.mjs';

const times = [410, 454, 495, 542];
const result = metrics(0, times);
const pagePositions = 16;
const reservations = [56, 40, 24];
const pages = reservations.map((positions) => Math.ceil(positions / pagePositions));
const fullPage = pagePositions * capacityFixture().perToken;
const pool = 8 * 2 ** 20;
const total = pages.reduce((a, b) => a + b, 0);
const live = pages[0] + pages[1];

function latencyTest(ctx, api, state) {
  const { C } = api;
  const x = scaleTime(times[0], times.at(-1), 345, 1680);
  const show = spoken(state, 1, 'trace-verdict', 0.08);
  api.focus.target('final-trace', () => {
    api.text(
      ctx,
      'First token ≤ 450 ms from arrival     ·     Each later gap ≤ 50 ms',
      960,
      277,
      41,
      C.ink,
      'center',
    );
    api.text(
      ctx,
      'New server trace   ·   arrival at 0 ms   ·   detail from first output',
      960,
      380,
      32,
      C.muted,
      'center',
    );
    api.line(ctx, x(times[0]), 525, x(times.at(-1)), 525, C.muted, 3);
    times.forEach((t, i) => tokenMark(ctx, api, x(t), 525, 'T' + (i + 1), t, C.cyan));
    if (show) {
      result.gaps.forEach((gap, i) =>
        bracket(ctx, api, x(times[i]), x(times[i + 1]), 625, C.cyan, gap + ' ms'),
      );
      const summary = spoken(state, 1, 'worst-gap', 0.16)
        ? 'First wait ' +
          result.ttft +
          ' ms   ·   longest gap ' +
          Math.max(...result.gaps) +
          ' ms   →   both pass'
        : 'Both targets pass';
      api.text(ctx, summary, 960, 821, 46, C.green, 'center');
      if (spoken(state, 1, 'second-rate', 0.28))
        api.text(
          ctx,
          'Mean gap ' +
            result.tpot +
            ' ms   ·   decode ' +
            result.decodeTps.toFixed(1) +
            ' tokens/s',
          960,
          929,
          33,
          C.ink,
          'center',
        );
    } else {
      api.text(ctx, 'Does this reply pass both targets?', 960, 815, 50, C.ink, 'center');
    }
  });
}

function allocation(ctx, api, state) {
  const { C } = api;
  const left = 175;
  const capacityWidth = 1350;
  const unit = (capacityWidth * fullPage) / pool;
  const edge = left + capacityWidth;
  const asking = passage(state, 1, 'new-pages', 0.62, 0.72) > 0;
  const shrink = passage(state, 2, 'shrink-pages', 0.21, 0.55);
  const answer = inferenceCapacityAnswerVisible(state);
  api.focus.target('reservation', () => {
    api.text(
      ctx,
      'Same reservations   ·   16 positions per page   ·   raw KV only',
      155,
      265,
      34,
      C.muted,
    );
    api.text(ctx, '8 MiB pool', edge, 363, 38, C.yellow, 'center');
    api.line(ctx, edge, 391, edge, 537, C.yellow, 4);
    function row(y, factor, showCandidate) {
      api.line(ctx, left, y, edge, y, C.muted, 2);
      api.line(ctx, left, y + 77, edge, y + 77, C.muted, 2);
      const width = unit * factor;
      for (let i = 0; i < (showCandidate ? total : live); i++) {
        const candidate = i >= live;
        const color = candidate ? C.yellow : i < pages[0] ? C.blue : C.cyan;
        // An outline is a requested page. It becomes allocated only in the successful replay.
        api.rect(
          ctx,
          left + i * width + 3,
          y + 4,
          width - 6,
          69,
          candidate && !(answer && factor === 0.5) ? C.bg : color,
          color,
          3,
        );
      }
    }
    api.text(ctx, '2 bytes/value   ·   1 MiB/page', left, 410, 32, C.ink);
    row(445, 1, asking);
    bracket(ctx, api, left, left + pages[0] * unit, 554, C.blue, '56 positions  →  4 pages', 29);
    bracket(
      ctx,
      api,
      left + pages[0] * unit,
      left + live * unit,
      554,
      C.cyan,
      '40 positions  →  3 pages',
      29,
    );
    if (asking)
      bracket(
        ctx,
        api,
        left + live * unit,
        left + total * unit,
        554,
        C.yellow,
        '24 positions  →  2 pages',
        27,
      );
    if (state.beat >= 2) {
      const factor = 1 - 0.5 * shrink;
      api.line(ctx, edge, 687, edge, 801, C.yellow, 4);
      api.text(
        ctx,
        shrink === 1 ? '1 byte/value   ·   0.5 MiB/page' : 'Replay the same nine pages',
        left,
        678,
        32,
        C.ink,
      );
      row(707, factor, true);
    }
    const caption = answer
      ? total + ' pages × 0.5 MiB  =  ' + total * 0.5 + ' MiB   →   admit'
      : asking
        ? 'All three at once: faster decode or smaller KV values?'
        : 'The next request is waiting for admission.';
    api.text(ctx, caption, 960, 882, 43, answer ? C.green : C.ink, 'center');
    if (answer)
      api.text(
        ctx,
        'Smaller state, smaller reservations or more memory can change admission.',
        960,
        966,
        32,
        C.muted,
        'center',
      );
  });
}

function loadWindow(ctx, api, state) {
  const { C } = api;
  const groups = [
    { count: 12, label: 'correct and on time', color: C.green },
    { count: 5, label: 'rejected', color: C.pink },
    { count: 3, label: 'failed', color: C.yellow },
  ];
  const offered = groups.reduce((count, g) => count + g.count, 0);
  const seconds = 20;
  const scored = Math.floor(offered * passage(state, 4, 'score-window', 0.12, 0.39));
  api.focus.target('outcomes', () => {
    api.text(ctx, '20 seconds   ·   one mark per offered request', 960, 302, 45, C.ink, 'center');
    const start = 168;
    const pitch = 80;
    let cursor = 0;
    for (const group of groups) {
      const left = start + cursor * pitch;
      for (let i = 0; i < group.count; i++) {
        const color = cursor + i < scored ? group.color : C.muted;
        api.circle(ctx, left + pitch * (i + 0.5), 477, 21, color);
      }
      cursor += group.count;
      if (cursor <= scored)
        bracket(
          ctx,
          api,
          left,
          start + cursor * pitch - 6,
          554,
          group.color,
          group.count + ' ' + group.label,
          31,
        );
    }
    if (spoken(state, 4, 'per-second', 0.6))
      api.text(
        ctx,
        'Goodput   ' +
          groups[0].count +
          ' / ' +
          seconds +
          ' s  =  ' +
          groups[0].count / seconds +
          ' qualifying requests/s',
        960,
        789,
        46,
        C.green,
        'center',
      );
    if (spoken(state, 4, 'fraction-offered', 0.72))
      api.text(
        ctx,
        'Correct and on time   ' +
          groups[0].count +
          ' / ' +
          offered +
          ' offered  =  ' +
          (100 * groups[0].count) / offered +
          '%',
        960,
        907,
        40,
        C.ink,
        'center',
      );
  });
}

export function drawEarnedTransfer(ctx, scene, state, api) {
  if (state.beat === 0 || (state.beat === 1 && passage(state, 1, 'open-pool', 0.42, 0.54) === 0)) {
    latencyTest(ctx, api, state);
  } else if (state.beat === 4) {
    loadWindow(ctx, api, state);
  } else {
    allocation(ctx, api, state);
  }
}

export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'test-stream',
    'trace-verdict',
    'worst-gap',
    'second-rate',
    'open-pool',
    'new-pages',
    'shrink-pages',
    'ic-capacity-answer',
    'verify-pages',
    'score-window',
    'per-second',
    'fraction-offered',
  ],
};
