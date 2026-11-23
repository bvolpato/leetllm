import { paddingEffects, pipeline } from '../arithmetic.mjs';
import { cueClock } from '../clock.mjs';
import { runtimeText } from '../defaults.mjs';

export function drawPadding(ctx, scene, state, api) {
  const { C } = api;
  const p = cueClock(scene, state);
  const txt = (...args) => runtimeText(ctx, api, ...args);
  const input = [1, 2, 3, 4, 5, 6, 0, 0];
  const work = pipeline(input);
  const reference = pipeline(input.slice(0, 6)).result;
  const masked = p('pad-mask') >= 1;
  const guarded = p('pad-guard') >= 1;
  const effects = paddingEffects(masked, true, guarded);
  const x = (i) => 500 + i * 167;
  api.focus.target('pad-columns', () => {
    for (let i = 0; i < input.length; i++) {
      const dummy = i >= 6;
      const color = dummy ? C.pink : C.blue;
      txt(dummy ? 'dummy' : 'R' + (i + 1), x(i), 276, 31, color, 'center');
      const cells = [input[i], work.affine[i], work.squares[i]];
      cells.forEach((v, row) => {
        const y = 307 + row * 101;
        const visible = dummy
          ? [p('pad-input') > 0, p('pad-affine') >= 1, p('pad-square') >= 1][row]
          : true;
        api.rect(
          ctx,
          x(i) - 69,
          y,
          138,
          74,
          C.panel,
          dummy && masked && row === 2 ? C.muted : color,
          9,
        );
        txt(
          visible ? v : '·',
          x(i),
          y + 52,
          40,
          dummy && masked && row === 2 ? C.muted : C.ink,
          'center',
        );
      });
      if (masked && dummy) txt('skip in sum', x(i), 627, 24, C.muted, 'center');
    }
    ['Input', '2x + 1', 'Square'].forEach((name, i) => txt(name, 151, 358 + i * 101, 35, C.ink));
  });
  api.focus.target('pad-total', () => {
    const all = p('pad-all') >= 1,
      valid = p('pad-valid') >= 1;
    const result = valid
      ? 'Valid sum   ' + effects.total
      : masked
        ? 'Masked sum   ?'
        : all
          ? 'All eight slots   ' + effects.total
          : 'Contribution from each dummy   ?';
    txt('Six-input reference    ' + reference, 155, 719, 38, C.blue);
    txt(result, 975, 719, 39, valid ? C.green : C.yellow);
  });
  if (state.beat >= 2)
    api.focus.target('pad-cache', () => {
      const before = 42;
      const stores = effects.writes.filter((row) => row.slot === 6);
      const stored = stores.length ? stores[0].value : before;
      const attempted = p('pad-store') > 0;
      const reset = p('pad-reset') >= 1;
      const expose = p('pad-read') >= 1;
      const cacheValue = guarded
        ? stored
        : reset
          ? before
          : expose
            ? stored
            : attempted
              ? '?'
              : before;
      txt('Live request’s cache cell', 145, 846, 34, C.muted);
      txt('Initial value   ' + before, 145, 950, 40, C.ink);
      const operation = guarded
        ? 'dummy store skipped'
        : reset
          ? 'fresh comparison'
          : attempted
            ? 'dummy stores 1'
            : 'before store';
      txt(operation, 950, 902, 38, guarded ? C.green : C.pink, 'center');
      if (attempted && (!reset || guarded)) {
        if (guarded) {
          api.arrow(ctx, 720, 939, 956, 939, C.muted, 4);
          api.line(ctx, 976, 922, 976, 956, C.green, 5);
        } else {
          api.arrow(ctx, 720, 939, 1174, 939, C.pink, 4);
        }
      }
      api.rect(ctx, 1243, 806, 447, 166, C.panel, guarded ? C.green : C.pink, 14);
      txt(cacheValue, 1467, 920, 75, guarded ? C.green : C.ink, 'center');
    });
}
export default {
  id: 'padding',
  draw: drawPadding,
  cues: [
    'pad-input',
    'pad-question',
    'pad-affine',
    'pad-square',
    'pad-all',
    'pad-mask',
    'pad-valid',
    'pad-owner',
    'pad-cache-before',
    'pad-store',
    'pad-cache-ask',
    'pad-read',
    'pad-reset',
    'pad-guard',
    'pad-kept',
  ],
};
