import { sampleModel, visionFrame } from '../model.mjs';
import { originalCard } from '../defaults.mjs';
export function drawGroups(ctx, scene, state, api) {
  const modelState = visionFrame('groups', state);
  let wrapped = api;
  const originalState = {
    ...state,
    visionScene: 'groups',
  };
  const { C: themeColors, teaching: teaching } = wrapped,
    originalModelState = sampleModel(originalState);
  {
    const sources = ['R-401 a', 'R-401 b', 'R-402 a', 'R-404 a'].map((v, i) =>
      wrapped.focus.target(i < 2 ? 'same-case-views' : 'photo-views', () =>
        originalCard(
          ctx,
          wrapped,
          v,
          145 + i * 430,
          370,
          340,
          i < 2 ? themeColors.blue : themeColors.cyan,
        ),
      ),
    );
    const groups = [
      wrapped.focus.target('train-case', () =>
        originalCard(ctx, wrapped, 'R-401 · train', 270, 700, 530, themeColors.blue),
      ),
      wrapped.focus.target('validation-case', () =>
        originalCard(ctx, wrapped, 'R-402 · validation', 940, 700, 430, themeColors.cyan),
      ),
      wrapped.focus.target('test-case', () =>
        originalCard(ctx, wrapped, 'R-404 · test', 1480, 700, 300, themeColors.green),
      ),
    ];
    [
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 2],
    ].forEach(([i, j]) => {
      const a = sources[i];
      teaching.transfer({
        source: {
          shape: a,
          opacity: 1,
        },
        target: {
          shape: groups[j],
          opacity: 1,
        },
        color: j ? themeColors.cyan : themeColors.blue,
        progress: originalModelState.q,
        particle: {
          radius: 7,
          fill: themeColors.yellow,
        },
      });
    });
  }
}
export default {
  id: 'groups',
  draw: drawGroups,
  cues: ['groups-b1-1', 'groups-b1-2', 'groups-b2-1', 'groups-b2-2', 'dv-group-repair'],
};
