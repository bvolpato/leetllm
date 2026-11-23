import { ease } from '../arithmetic.mjs';
import { card, foot, panel, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintBackend(ctx, scene, state, api, C, c, t, s) {
  if (s.step === 0) {
    const layers = [
      ['PyTorch tensor operation', 'mps', C.cyan],
      ['MPS backend', 'optimized GPU operations', C.green],
      ['Metal', 'Apple GPU framework', C.blue],
    ];
    layers.forEach(([a, b, color], i) =>
      target(ctx, api, 'backend-stack', () => {
        panel(ctx, api, C, c, 390, 285 + i * 205, 1140, 150, color);
        text(ctx, api, C, a, 440, 345 + i * 205, 40, color);
        text(ctx, api, C, b, 1480, 385 + i * 205, 29, C.ink, 'right');
      }),
    );
    const y = 315 + 410 * ease(s.p);
    api.rect(ctx, 325, y, 28, 28, C.yellow, C.yellow, 0, 7);
    foot(ctx, api, C, 'Illustrative dispatch through the selected backend');
  } else {
    target(ctx, api, 'build-check', () =>
      card(ctx, api, C, c, 'is_built() = True', 230, 330, 680, 130, C.green, 42, 'mono'),
    );
    target(ctx, api, 'availability-check', () =>
      card(
        ctx,
        api,
        C,
        c,
        'is_available() = ' + (s.available ? 'True' : 'False'),
        1010,
        330,
        680,
        130,
        s.available ? C.green : C.pink,
        38,
        'mono',
      ),
    );
    api.line(ctx, 570, 460, 570, 610, C.green, 5);
    api.line(ctx, 1350, 460, 1350, 610, s.available ? C.green : C.pink, 5);
    target(ctx, api, 'backend-route', () =>
      card(
        ctx,
        api,
        C,
        c,
        s.available ? 'Select mps · continue this ticket' : 'Select cpu · inspect this Mac',
        400,
        650,
        1120,
        155,
        s.available ? C.cyan : C.blue,
        43,
      ),
    );
    foot(ctx, api, C, 'Runtime availability is checked on the target machine');
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintBackend(ctx, scene, state, api, C, c, t, s);
}
export function drawBackendStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'backend',
  draw: drawBackendStage,
  cues: ['dispatch-stack', 'built-capability', 'runtime-closed', 'runtime-open'],
};
