import { pipeline } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawPointers(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const rebound = p('ptr-rebind');
  const zeros = [0, 0, 0, 0];
  const old = [1, 2, 3, 4];
  const ones = [1, 1, 1, 1];
  const copied = Math.floor(4 * p('pointer-copy-fresh'));
  const refilled = Math.floor(4 * p('ptr-ones'));
  const contents = old.map((v, i) => (i < refilled ? ones[i] : i < copied ? zeros[i] : v));
  const stale = p('ptr-stale') >= 1;
  const correct = p('ptr-replay') >= 1;
  const consumed = p('pointer-cpu-complete') >= 1;
  const overwritten = p('ptr-overwrite') >= 1;
  const sum = pipeline(overwritten ? ones : correct ? zeros : old).result;

  api.focus.target('pointer-bindings', () => {
    txt('Python name x', 150, 373, 42, C.blue);
    txt('Graph input address', 150, 583, 39, C.yellow);
    api.arrow(ctx, 560, 352, 875, 535 - 183 * rebound, C.blue, 5);
    api.arrow(ctx, 560, 569, 875, 569, C.yellow, 5);
  });
  api.focus.target('pointer-storage', () => {
    const bank = (label, y, values, color) => {
      txt(label, 920, y - 31, 32, color);
      values.forEach((v, i) => {
        const x = 920 + i * 205;
        api.rect(ctx, x, y, 181, 90, C.panel, color, 10);
        txt(v, x + 90, y + 63, 48, C.ink, 'center');
      });
    };
    bank('A   ·   retained allocation', 520, contents, C.cyan);
    if (rebound > 0) bank('B   ·   new allocation', 310, zeros, C.blue);
    if (copied > 0 && !refilled && !correct) {
      for (let i = 0; i < copied; i++)
        api.arrow(ctx, 1010 + 205 * i, 409, 1010 + 205 * i, 439, C.cyan, 4);
    }
  });
  api.focus.target('pointer-result', () => {
    txt('Output O', 150, 751, 36, C.muted);
    api.rect(ctx, 150, 785, 615, 131, C.panel, correct ? C.green : stale ? C.pink : C.muted, 12);
    txt(stale ? String(sum) : '?', 330, 876, 75, correct ? C.green : C.ink, 'center');
    txt(
      overwritten
        ? 'from four ones'
        : correct
          ? 'from four zeros'
          : stale
            ? 'from old A'
            : 'next replay',
      445,
      858,
      31,
      C.ink,
    );
    if (p('ptr-expected') >= 1 && state.beat === 1)
      txt('Reference for B   =   ' + pipeline(zeros).result, 150, 991, 32, C.blue);
  });
  api.focus.target('pointer-reader', () => {
    txt('CPU reader', 1010, 751, 36, C.muted);
    api.rect(ctx, 1010, 785, 705, 131, C.panel, consumed ? C.green : C.muted, 12);
    txt(
      consumed
        ? 'CPU-1 read receipt: 4'
        : correct
          ? 'Ready to read O'
          : stale
            ? 'Needs the sum for B'
            : 'Await first replay',
      1362,
      866,
      38,
      consumed ? C.green : C.muted,
      'center',
    );
    if (consumed) api.arrow(ctx, 789, 850, 985, 850, C.green, 4);
    if (correct)
      txt(
        overwritten
          ? 'Reader keeps its original four'
          : consumed
            ? 'Replay 2 eligible'
            : 'Replay 2 waits for read',
        1362,
        991,
        32,
        consumed ? C.green : C.yellow,
        'center',
      );
  });
}
export default {
  id: 'pointers',
  draw: drawPointers,
  cues: [
    'ptr-original',
    'ptr-rebind',
    'ptr-ask',
    'ptr-stale',
    'ptr-expected',
    'pointer-copy-fresh',
    'ptr-replay',
    'pointer-cpu-complete',
    'ptr-ones',
    'ptr-overwrite',
  ],
};
