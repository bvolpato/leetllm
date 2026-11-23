import { openingFiles } from '../model.mjs';
import { cueDone, cueMotion, text } from '../defaults.mjs';

const file = openingFiles[0];

function settings(ctx, api, active) {
  const { C } = api;
  text(ctx, api, 'File A · Upload settings', 155, 290, 43);
  const field = (id, key, value, y, color) => {
    api.focus.target(id, () => {
      if (active === id) api.rect(ctx, 150, y - 66, 710, 94, C.panel, color, 2, 10);
      api.text(ctx, key, 185, y, 46, C.ink, 'left', 'mono');
      api.text(ctx, '= ' + value, 820, y, 60, color, 'right', 'mono');
    });
  };
  field('retry-setting', 'max_retries', file.retries, 432, C.blue);
  field('timeout-setting', 'timeout_s', file.timeout, 558, C.pink);
}

function drawMidpoint(ctx, state, api) {
  const { C } = api;
  const first = cueMotion(state, 'write-retries', 0, 0.06, 0.26);
  const timeout = cueMotion(state, 'timeout-line', 0, 0.49, 0.62) > 0;
  const second = cueMotion(state, 'write-timeout', 1, 0, 0.17);
  const progress = timeout ? second : first;
  const from = timeout ? file.states[0] : 0;
  const input = timeout ? file.timeout : file.retries;
  const to = timeout ? file.states[1] : file.states[0];
  const current = from + (to - from) * progress;
  const inputColor = timeout ? C.pink : C.blue;
  settings(ctx, api, timeout ? 'timeout-setting' : 'retry-setting');

  api.focus.target('state-slot', () => {
    text(ctx, api, 'One memory slot', 1390, 290, 43, C.green, 'center');
    const updating = progress > 0 && progress < 1;
    const slot = updating ? from + ' → ?' : String(progress === 1 ? to : from);
    text(ctx, api, slot, 1390, 469, 138, C.green, 'center');
    text(ctx, api, '(' + from + ' + ' + input + ') ÷ 2', 1390, 556, 50, C.ink, 'center');

    const x = (value) => 245 + (1430 * value) / file.retries;
    const y = 797;
    api.line(ctx, x(0), y, x(file.retries), y, C.muted, 4);
    api.line(ctx, x(from), y, x(input), y, inputColor, 8);
    for (let i = 0; i <= 4 * file.retries; i++) {
      const tick = x(i / 4);
      api.line(ctx, tick, y + 12, tick, y + (i % 4 ? 24 : 40), C.muted, 3);
      if (i % 4 === 0) text(ctx, api, String(i / 4), tick, y + 101, 41, C.ink, 'center');
    }
    text(ctx, api, timeout ? 'Timeout' : 'Retry limit', x(input), y - 84, 38, inputColor, 'center');
    api.line(ctx, x(input), y - 61, x(input), y - 15, inputColor, 4);
    api.circle(ctx, x(input), y, 15, inputColor);
    if (progress > 0) api.line(ctx, x(from), y, x(current), y, C.green, 11);
    api.circle(ctx, x(current), y, 23, C.green);
    text(
      ctx, api,
      timeout && state.beat === 0 ? 'Halfway from 1.5 toward 1 is …' : 'Move halfway toward each input',
      960, 1001, 40, timeout && state.beat === 0 ? C.yellow : C.ink, 'center',
    );
  });
}

function drawLookup(ctx, state, api) {
  const { C } = api;
  const distance = cueMotion(state, 'later-question', 2, 0.1, 0.24);
  const pointer = cueMotion(state, 'look-back', 2, 0.48, 0.62);
  settings(ctx, api, pointer === 1 ? 'retry-setting' : null);
  text(ctx, api, 'Question at the end of the spec', 1360, 295, 37, C.muted, 'center');
  text(ctx, api, 'How many retries?', 1360, 446, 62, C.ink, 'center');
  api.focus.target('token-positions', () => {
    const x0 = 245, x1 = 330, xQ = 1675, y = 795;
    api.line(ctx, x0, y, x1 + (xQ - x1) * distance, y, C.muted, 5);
    for (let k = 1; k <= Math.floor(30 * distance); k++) {
      const x = x1 + ((xQ - x1) * k) / 31;
      api.line(ctx, x, y - 12, x, y + 12, C.muted, 3);
    }
    api.circle(ctx, x0, y, 15, C.blue);
    api.circle(ctx, x1, y, 15, C.pink);
    if (distance === 1) api.circle(ctx, xQ, y, 15, C.yellow);
    const labels = cueDone(state, 'kv-entries', 2, 0.45)
      ? '30,000 intervening tokens add 30,000 key-value pairs in this head'
      : 'Each tick marks 1,000 intervening tokens';
    if (distance > 0) text(ctx, api, labels, 960, 930, 38, C.muted, 'center');
    if (pointer > 0) {
      api.arrow(ctx, xQ, y - 65, xQ - (xQ - x0) * pointer, y - 65, C.blue, 7);
      if (pointer === 1) api.line(ctx, x0, y - 58, x0, y - 20, C.blue, 4);
    }
  });
}

export function drawIntro(ctx, scene, state, api) {
  if (state.beat < 2) drawMidpoint(ctx, state, api);
  else drawLookup(ctx, state, api);
}

export default { id: 'intro', draw: drawIntro };
