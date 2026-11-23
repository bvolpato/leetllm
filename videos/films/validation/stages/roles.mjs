import { card, text } from '../defaults.mjs';
export function drawRoles(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const nodes = [
      {
        focusTarget: 'roles-node-train',
        id: 'train',
        label: 'Jan–Jun: fit',
        x: 190,
        y: 360,
        width: 410,
        height: 120,
        color: themeColors.blue,
      },
      {
        focusTarget: 'roles-node-valid',
        id: 'valid',
        label: 'July: select',
        x: 760,
        y: 360,
        width: 410,
        height: 120,
        color: themeColors.pink,
      },
      {
        focusTarget: 'roles-node-test',
        id: 'test',
        label: 'August: report',
        x: 1330,
        y: 360,
        width: 410,
        height: 120,
        color: themeColors.green,
      },
    ];
    api.teaching.flowGraph({
      nodes,
      edges: [
        {
          from: 'train',
          to: 'valid',
          progress: phaseForBeat(0),
        },
        {
          from: 'valid',
          to: 'test',
          progress: phaseForBeat(1),
          color: themeColors.green,
        },
      ],
      fill: themeColors.panel,
      textColor: themeColors.ink,
    });
    const cueValue = (id) => {
      const c = state.cues?.[id];
      return c?.phase === 'after' ? 1 : c?.phase === 'before' ? 0 : (c?.progress ?? 0);
    };
    const chosen = currentBeat < 1 ? 0 : currentBeat > 1 ? 1 : cueValue('roles-beat-2-focus-1'),
      reported = currentBeat < 1 ? 0 : currentBeat > 1 ? 1 : cueValue('roles-beat-2-focus-2'),
      x = 245 + 570 * chosen + 570 * reported;
    card(ctx, api, 'Candidate A', x, 640, 300, themeColors.blue);
    text(
      ctx,
      api,
      currentBeat === 0
        ? 'Fit transforms + weights'
        : reported > 0.9
          ? 'Frozen A · August report'
          : chosen > 0.9
            ? 'A · selected in July'
            : 'Same candidate moves between roles',
      960,
      845,
      32,
      themeColors.ink,
      'center',
    );
    if (currentBeat === 2) {
      const q = phaseForBeat(2, 0.12, 0.75);
      api.arrow(ctx, 1535, 760, 1200, 880, themeColors.pink, 4);
      if (q > 0.35) {
        card(ctx, api, 'Revised B', 1050, 900, 300, themeColors.yellow);
        text(ctx, api, 'August feedback changes B', 1500, 1030, 27, themeColors.pink, 'center');
      }
      if (q > 0.8) {
        card(ctx, api, 'Fresh window', 200, 900, 430, themeColors.green);
        api.arrow(ctx, 1020, 950, 660, 950, themeColors.green, 4);
      }
    }
  }
}
export default {
  id: 'roles',
  draw: drawRoles,
  cues: [
    'roles-beat-1-focus-1',
    'roles-beat-2-focus-1',
    'roles-beat-2-focus-2',
    'roles-beat-3-focus-1',
  ],
};
