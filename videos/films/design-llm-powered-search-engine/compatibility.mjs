import { clamp } from './arithmetic.mjs';
export function rejectUnknownScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api;
  state.beat ?? 0;
  clamp(state.beatP ?? 0);
  'se-' + scene.id + '-';
  api.focus.target('se-' + scene.id + '-mechanism', () => {
    throw Error('Unknown new search chapter ' + scene.id);
  });
}
