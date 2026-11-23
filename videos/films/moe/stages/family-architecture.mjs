import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { footer, mechanismText, rectangle, tag } from '../defaults.mjs';
export function drawFamilyArchitecture(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'family-architecture-op-' + i, 'progress');
  api.focus.target('mo-family-architecture-mechanism', () => {
    const v =
      currentBeat === 0
        ? {
            name: 'Mixtral',
            pool: 8,
            k: 2,
            shared: 0,
            dense: 0,
            total: 47,
            active: 13,
          }
        : currentBeat === 1
          ? {
              name: 'DeepSeek-V2',
              pool: 160,
              k: 6,
              shared: 2,
              dense: 1,
              total: 236,
              active: 21,
            }
          : {
              name: 'DeepSeek-V3',
              pool: 256,
              k: 8,
              shared: 1,
              dense: 3,
              total: 671,
              active: 37,
            };
    const ready = resultComplete(['family-mixtral', 'family-v2', 'family-v3'][currentBeat]);
    mechanismText(
      ctx,
      api,
      v.name + ' · article snapshot checked 2026-10-10',
      960,
      285,
      35,
      themeColors.yellow,
    );
    const across = v.pool === 8 ? 4 : v.pool === 256 ? 32 : 16,
      step = v.pool === 8 ? 115 : v.pool === 256 ? 23 : 45,
      size = v.pool === 8 ? 80 : v.pool === 256 ? 16 : 30,
      x0 = v.pool === 8 ? 700 : v.pool === 256 ? 430 : 430,
      y0 = 390;
    for (let e = 0; e < Math.ceil(v.pool * cueProgress(currentBeat)); e++) {
      const x = x0 + (e % across) * step,
        y = y0 + Math.floor(e / across) * step;
      rectangle(
        ctx,
        api,
        x,
        y,
        size,
        size,
        ready && e < v.k ? themeColors.blue : themeColors.panel,
        themeColors.muted,
      );
    }
    mechanismText(ctx, api, v.pool + ' routed expert identities', 1430, 360, 31, themeColors.blue);
    if (ready) {
      mechanismText(
        ctx,
        api,
        v.k + ' selected + ' + v.shared + ' shared',
        1450,
        650,
        32,
        themeColors.cyan,
      );
      mechanismText(
        ctx,
        api,
        v.total + 'B stored / ' + v.active + 'B active',
        1450,
        750,
        30,
        themeColors.yellow,
      );
    }
    for (let i = 0; i < 10; i++) {
      const x = 220,
        y = 385 + i * 48;
      rectangle(
        ctx,
        api,
        x,
        y,
        180,
        30,
        i < v.dense ? themeColors.cyan : themeColors.panel,
        i < v.dense ? themeColors.cyan : themeColors.blue,
      );
    }
    mechanismText(ctx, api, 'First ' + v.dense + ' dense FFNs', 310, 880, 29, themeColors.cyan);
    if (ready && v.shared) {
      tag(ctx, api, 'same token', 350, 930, 250, themeColors.cyan);
      for (let j = 0; j < v.shared; j++) {
        const x = 770 + j * 590;
        api.path(
          ctx,
          [
            {
              x: 490,
              y: 930,
            },
            {
              x: 570,
              y: 930,
            },
            {
              x: 570,
              y: 985,
            },
            {
              x,
              y: 985,
            },
            {
              x,
              y: 965,
            },
          ],
          {
            color: themeColors.cyan,
            width: 2,
          },
        );
        tag(ctx, api, 'Always-on shared expert ' + j, x, 930, 450, themeColors.cyan);
      }
    }
    footer(
      ctx,
      api,
      'Expert tiles encode counts; areas do not compare parameter sizes across architectures.',
    );
  });
}
export default {
  id: 'family-architecture',
  draw: drawFamilyArchitecture,
  cues: [
    'mo-family-architecture-op-0',
    'mo-family-mixtral',
    'mo-family-architecture-op-1',
    'mo-family-v2',
    'mo-family-architecture-op-2',
    'mo-family-v3',
  ],
};
