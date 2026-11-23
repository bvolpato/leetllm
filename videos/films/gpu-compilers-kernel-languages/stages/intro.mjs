import { nativeOnlyRuns, vectorLane } from '../arithmetic.mjs';
import { after, arrow, text } from '../defaults.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const lane = vectorLane(1);
  const travel = focus.progress('approach');
  const nativeOnly = after(api, 'native-only');

  focus.target('reference', () => {
    text(ctx, api, 'Expected out[1]', 165, 284, 38, C.muted);
    text(ctx, api, `${lane.x} + (${lane.y}) = ${lane.sum}`, 540, 290, 68, C.ink);
  });

  focus.target('chip', () => {
    const left = 815;
    const right = 1265;
    const top = 418;
    const bottom = 836;
    for (let x = left + 45; x < right; x += 45) {
      api.line(ctx, x, top - 16, x, top, C.cyan, 5);
      api.line(ctx, x, bottom, x, bottom + 16, C.cyan, 5);
    }
    api.rect(ctx, left, top, right - left, bottom - top, '#153141', C.cyan, 24);
    api.rect(ctx, left + 36, top + 36, right - left - 72, bottom - top - 72, C.panel, C.cyan, 12);
    text(ctx, api, 'GPU', 1040, 560, 59, C.cyan, 'center');
    text(ctx, api, '12.0', 1040, 690, 100, C.ink, 'center');
    text(ctx, api, 'Compute capability', 1040, 756, 29, C.muted, 'center');
  });

  text(ctx, api, 'Native image', 160, 414, 35, C.ink);
  text(ctx, api, 'Driver loader', 755, 414, 31, C.ink, 'right');
  text(ctx, api, 'Output slot 1', 1625, 414, 35, C.ink, 'center');
  nativeOnlyRuns.forEach(({ build, image, selection }, i) => {
    const y = 533 + i * 209;
    const loaded = selection === 'LOAD NATIVE';
    const done = after(api, loaded ? 'write-a' : 'stop-b');
    const color = done ? (loaded ? C.green : C.pink) : C.cyan;
    focus.target('track-' + build.toLowerCase(), () => {
      const x = 350 + travel * 144;
      text(ctx, api, 'Build ' + build, 158, y + 15, 42, C.ink);
      if (x > 360) api.line(ctx, 350, y, x - 9, y, C.muted, 3);
      api.line(ctx, x + 248, y, 752, y, C.muted, 3);
      api.rect(ctx, x, y - 55, 244, 110, C.panel, color, 10);
      api.text(ctx, image, x + 122, y + 15, 43, color, 'center', 'mono');
      api.rect(ctx, 753, y - 38, 14, 76, C.panel, color, 3);
      if (done && loaded) {
        arrow(ctx, api, 773, y, 809, y, C.green);
        arrow(ctx, api, 1280, y, 1450, y, C.green);
        text(ctx, api, 'store', 1365, y - 22, 29, C.green, 'center');
      } else if (done) {
        api.line(ctx, 753, y - 38, 753, y + 38, C.pink, 6);
        text(ctx, api, 'no launch', 755, y + 98, 32, C.pink, 'right');
      }
      api.rect(ctx, 1475, y - 57, 300, 114, C.panel, done && loaded ? C.green : C.muted, 10);
      const wrote = done && loaded;
      text(
        ctx,
        api,
        wrote ? lane.sum : 'unwritten',
        1625,
        y + 16,
        wrote ? 55 : 32,
        wrote ? C.green : C.muted,
        'center',
      );
    });
  });

  focus.target('fallback', () => {
    api.text(ctx, 'Both packages carry compute_90 PTX', 160, 973, 31, C.ink, 'left', 'mono');
    if (nativeOnly) text(ctx, api, 'PTX compilation off', 1265, 973, 38, C.yellow, 'right');
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'expected',
    'device',
    'targets',
    'native-only',
    'approach',
    'write-a',
    'stop-b',
    'inspect-a',
  ],
};
