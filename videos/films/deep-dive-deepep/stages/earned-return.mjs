import { freshDeepEPState } from '../construction.mjs';
import { weightedExpertRow } from '../model.mjs';
import { finalToken } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const { input, cached: oldExperts, current: newExperts, gates } = finalToken;
const stale = weightedExpertRow(input, oldExperts, gates);
const vec = (row) => '[' + row.map((v) => v.toFixed(2)).join(', ') + ']';
const experts = (choices) => choices.map((k) => 'E' + k).join(' / ');

export function drawEarnedReturn(ctx, scene, state, api) {
  const { C } = api;
  const m = freshDeepEPState(state);
  const p = (id) => state.cues?.[id]?.progress ?? 0;
  const target = (id, paint) => api.focus.target(id, paint);
  const label = (v, x, y, size, color = C.ink) => text(ctx, api, v, x, y, size, color, 'center');

  if (m.b < 2) {
    const choices = m.b === 0 && p('de-fresh-change') === 0 ? oldExperts : newExperts;
    label('Token z   [' + input.join(', ').replace('-', '−') + ']', 960, 262, 55, C.yellow);
    label('Expert k multiplies both coordinates by k + 1', 960, 331, 33);
    target('de-fresh-route-result', () => {
      label('Router now    ' + experts(choices), 565, 435, 40, C.yellow);
      label('Saved handle    ' + experts(m.choices), 1360, 435, 40, C.cyan);
    });
    target('de-fresh-vector-result', () => {
      label('Current expert', 285, 550, 29, C.muted);
      label('Raw output', 715, 550, 29, C.muted);
      label('Gate', 1080, 550, 29, C.muted);
      label('Contribution to z', 1500, 550, 29, C.muted);
      choices.forEach((expert, i) => {
        const y = 654 + 118 * i;
        const raw = m.rebuild && p(i ? 'de-fresh-raw-two' : 'de-fresh-raw-one') > 0;
        const applied = i ? m.secondVisible : m.firstVisible;
        label('E' + expert + '   ×' + (expert + 1), 285, y, 45);
        label(raw ? vec(m.raw[i]) : '[?, ?]', 715, y, 42, raw ? C.ink : C.muted);
        label(gates[i].toFixed(2), 1080, y, 43, C.yellow);
        label(
          applied ? vec(m.contributions[i]) : '[?, ?]',
          1500,
          y,
          45,
          applied ? C.cyan : C.muted,
        );
        api.line(ctx, 140, y + 34, 1780, y + 34, C.muted, 2);
      });
      label(
        'Source z return: ' + (m.outputVisible ? vec(m.returnReceipt.output) : '[?, ?]'),
        960,
        915,
        49,
        m.outputVisible ? C.green : C.ink,
      );
    });
    if (m.b === 0 && p('de-earned-return-b0') > 0)
      label('Which handle would you use, and what row should come back?', 960, 1007, 35, C.yellow);
    return;
  }

  if (m.b === 2) {
    label('Rebuilt route     ' + experts(newExperts) + '     →     source z', 960, 270, 43, C.cyan);
    target('de-fresh-stale-result', () => {
      label(
        'Same gates on the old route    ' +
          experts(oldExperts) +
          '    →    ' +
          (m.staleVisible ? vec(stale.output) : '[?, ?]'),
        960,
        378,
        39,
        C.pink,
      );
    });
    target('de-fresh-vector-result', () => {
      label('Arrival at combine', 450, 512, 33, C.muted);
      label('Source z so far', 1460, 512, 33, C.muted);
      m.returnReceipt.trace.forEach((r, i) => {
        const y = 634 + 178 * i;
        const progress = p(i ? 'de-fresh-inverse' : 'de-fresh-arrive');
        label('E' + r.key.split(':')[0] + ' · slot 0   ' + vec(r.value), 450, y, 41);
        api.line(ctx, 820, y - 13, 1190, y - 13, C.muted, 3);
        if (progress > 0) api.circle(ctx, 820 + progress * 370, y - 13, 13, C.cyan);
        label(
          progress === 1 ? vec(r.accumulator) : '[?, ?]',
          1460,
          y,
          48,
          progress === 1 ? C.cyan : C.muted,
        );
      });
    });
    label('Each returned value keeps its expert and slot', 960, 985, 32, C.ink);
    return;
  }

  const dependency = m.b === 3 ? 1 - p('de-fresh-remove-wait') : p('de-fresh-wait');
  const readyX = 1190;
  const earliestRead = 825 + (readyX - 825) * dependency;
  label(
    'z    ' + experts(newExperts) + '     ·     Expected return   ' + vec(m.returnReceipt.output),
    960,
    268,
    43,
    C.cyan,
  );
  target('de-fresh-wait-result', () => {
    label('Historical V2 asynchronous dispatch', 960, 376, 32, C.muted);
    const block = (x, y, w, words, color) => {
      api.rect(ctx, x, y, w, 92, C.panel, color, 9);
      label(words, x + w / 2, y + 59, 34, color);
    };
    text(ctx, api, 'Communication', 105, 558, 33);
    block(457, 500, readyX - 457, 'Write received rows', C.blue);
    label('Dispatch ready', readyX, 466, 30, C.blue);
    text(ctx, api, 'Expert stream', 105, 778, 33);
    block(457, 718, 350, 'Independent work', C.ink);
    if (dependency === 1) api.arrow(ctx, readyX, 601, readyX, 705, C.cyan, 4);
    block(earliestRead, 718, 460, 'First activation read', dependency === 1 ? C.cyan : C.yellow);
    api.arrow(ctx, 457, 865, 1710, 865, C.muted, 2);
    label('Device time', 1080, 918, 26, C.muted);
    const prompt =
      m.b === 3 && m.waitPresent
        ? 'The expert stream has a dispatch dependency'
        : m.dependencyVerdict
          ? 'The first read now waits for dispatch readiness'
          : 'Which event must the expert stream wait for before its first read?';
    label(prompt, 960, 1015, 35, C.ink);
  });
}
export default {
  id: 'earned-return',
  draw: drawEarnedReturn,
  cues: [
    'de-earned-return-b0',
    'de-fresh-change',
    'de-fresh-route',
    'de-fresh-raw-one',
    'de-fresh-first',
    'de-fresh-raw-two',
    'de-fresh-second',
    'de-fresh-result',
    'de-stale-result',
    'de-fresh-arrive',
    'de-fresh-inverse',
    'de-fresh-remove-wait',
    'de-fresh-wait',
  ],
};
