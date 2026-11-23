import { openingFiles } from '../model.mjs';
import { run } from '../arithmetic.mjs';
import { box, cueDone, cueMotion, equation, text } from '../defaults.mjs';

export function drawCollision(ctx, scene, state, api) {
  const { C } = api;
  const compare = cueMotion(state, 'ssm-collision-equality', 1, 0, 0.2);
  const merged = cueDone(state, 'ssm-collision-equality', 1, 0.2);
  const four = cueMotion(state, 'common-four', 1, 0.62, 0.75);
  const two = cueMotion(state, 'common-two', 1, 0.78, 0.93);
  const steps = run([4, 2], 0.5, 0.5, openingFiles[0].returned);
  const secondFile = cueMotion(state, 'second-file', 0, 0.08, 0.39) > 0;
  const x1 = 450,
    x2 = 905,
    x3 = 1300,
    x4 = 1650,
    mid = 615;

  api.focus.target('file-inputs', () => {
    openingFiles.forEach((f, i) => {
      if (i && !secondFile) return;
      const y = 300 + i * 100,
        color = i ? C.pink : C.blue;
      text(ctx, api, 'File ' + (i ? 'B' : 'A'), 155, y, 42, color);
      api.text(ctx, 'max_retries = ' + f.retries, 440, y, 41, C.ink, 'left', 'mono');
      api.text(ctx, 'timeout_s = ' + f.timeout, 1045, y, 41, C.ink, 'left', 'mono');
    });
  });

  api.focus.target('state-paths', () => {
    text(ctx, api, 'after retry limit', x1, 500, 30, C.muted, 'center');
    text(ctx, api, 'after timeout', x2, 500, 30, C.muted, 'center');
    openingFiles.forEach((f, i) => {
      if (i && !secondFile) return;
      const y = i ? 723 : 570,
        color = i ? C.pink : C.blue;
      text(ctx, api, String(f.states[0]), x1 - 38, y + 14, 46, color, 'right');
      api.circle(ctx, x1, y, 13, color);
      if (compare > 0) {
        api.line(ctx, x1, y, x1 + (x2 - 85 - x1) * compare, y + (mid - y) * compare, color, 6);
      }
    });
    if (compare === 0) {
      text(ctx, api, '(1.5 + 1) ÷ 2 = ?', x2, 584, 38, C.blue, 'center');
      if (secondFile) text(ctx, api, '(0.5 + 2) ÷ 2 = ?', x2, 737, 38, C.pink, 'center');
    }
    if (merged)
      box(ctx, api, String(openingFiles[0].returned), x2 - 85, mid - 50, 170, 100, C.green, 48);
    if (four > 0) {
      api.line(ctx, x2 + 100, mid, x2 + 100 + (x3 - x2 - 100) * four, mid, C.green, 6);
      text(ctx, api, 'input 4', x3, 540, 30, C.muted, 'center');
      api.circle(ctx, x3, mid, 11, C.green);
      if (four === 1) text(ctx, api, String(steps[0]), x3, 705, 45, C.green, 'center');
    }
    if (two > 0) {
      api.line(ctx, x3, mid, x3 + (x4 - x3) * two, mid, C.green, 6);
      text(ctx, api, 'input 2', x4, 540, 30, C.muted, 'center');
      api.circle(ctx, x4, mid, 11, C.green);
      if (two === 1) text(ctx, api, String(steps[1]), x4, 705, 45, C.green, 'center');
    }
  });
  api.focus.target('lookup-consequence', () => {
    if (state.beat === 2) {
      text(ctx, api, 'Same question', 250, 887, 35, C.muted);
      text(ctx, api, 'Required answer', 800, 887, 35, C.muted);
      text(ctx, api, 'File A   3', 1235, 887, 45, C.blue);
      text(ctx, api, 'File B   1', 1530, 887, 45, C.pink);
      text(ctx, api, 'How many retries?', 250, 955, 44, C.ink);
    } else if (merged) {
      equation(ctx, api, 'h_A=h_B=1.25', 960, 893, 54, C.green, 'center');
      text(ctx, api, 'at the end of the two settings', 960, 965, 30, C.muted, 'center');
    } else {
      text(ctx, api, 'New state = (old state + input) ÷ 2', 960, 860, 45, C.ink, 'center');
      text(
        ctx,
        api,
        'What state does each file leave after its timeout?',
        960,
        962,
        39,
        C.yellow,
        'center',
      );
    }
  });
}

export default { id: 'collision', draw: drawCollision };
