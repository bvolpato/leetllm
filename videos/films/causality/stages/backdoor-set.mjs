import { box, code, dag, detailText, focusProgress, footer, label, node } from '../defaults.mjs';
export function drawBackdoorSet(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1,
    cueProgress = (i) => q('backdoor-set-' + i);
  api.focus.target('cau-backdoor-set-mechanism', () => {
    if (currentBeat === 1) {
      label(ctx, api, 'One chosen target distribution', 960, 300, themeColors.yellow, 35);
      box(ctx, api, 'Low-risk target share', ['π low'], 520, 360, 370, 145, themeColors.green);
      box(ctx, api, 'High-risk target share', ['π high'], 1030, 360, 370, 145, themeColors.red);
      const terms = cueProgress(1);
      if (terms > 0) {
        detailText(ctx, api, 'Assistant', 220, 625, 33, themeColors.cyan);
        code(ctx, api, 'π low × 0.90 + π high × 0.50', 640, 625, 34, themeColors.cyan);
        detailText(ctx, api, 'Control', 220, 785, 33, themeColors.pink);
        code(ctx, api, 'π low × 0.80 + π high × 0.40', 640, 785, 34, themeColors.pink);
      }
      if (done('adjust-common-target'))
        label(ctx, api, 'Same target weights in both arms', 960, 915, themeColors.green, 33);
      footer(
        ctx,
        api,
        'The supplied stratum rates enter the same population average under the adjustment assumptions.',
      );
      return;
    }
    const hidden = currentBeat === 2 && q('hidden-tier') > 0;
    const nodes = [
        node(ctx, api, 'a', 'workflow A', 180, 650, themeColors.cyan),
        node(ctx, api, 'y', 'resolution Y', 1390, 650, themeColors.pink),
        node(ctx, api, 'r', 'measured risk R', 785, 350, themeColors.yellow),
      ],
      edges = [
        {
          from: 'r',
          to: 'a',
          progress: 1,
          color: themeColors.yellow,
        },
        {
          from: 'r',
          to: 'y',
          progress: 1,
          color: themeColors.yellow,
        },
        {
          from: 'a',
          to: 'y',
          progress: 1,
          color: themeColors.cyan,
        },
      ];
    if (hidden) {
      nodes.push(node(ctx, api, 'u', 'hidden customer tier U', 785, 260, themeColors.pink));
      nodes[2].x = 785;
      nodes[2].y = 470;
      edges.push(
        {
          from: 'u',
          to: 'a',
          progress: q('hidden-tier'),
          color: themeColors.pink,
        },
        {
          from: 'u',
          to: 'y',
          progress: q('hidden-tier'),
          color: themeColors.pink,
        },
      );
    }
    dag(ctx, api, nodes, edges);
    const r = nodes.find((n) => n.id === 'r');
    api.rect(ctx, r.x - 18, r.y - 18, r.width + 36, r.height + 36, null, themeColors.green, 15);
    label(ctx, api, 'Adjust R · block its incoming backdoor path', 960, 830, themeColors.green, 33);
    if (currentBeat === 1 && done('adjust-common-target'))
      label(
        ctx,
        api,
        'Use the same chosen target weights in both arms',
        960,
        915,
        themeColors.yellow,
        32,
      );
    if (hidden)
      label(ctx, api, 'R does not close the unmeasured U path', 960, 915, themeColors.pink, 32);
    footer(
      ctx,
      api,
      'A sufficient adjustment set excludes treatment descendants and blocks every backdoor path.',
    );
  });
}
export default {
  id: 'backdoor-set',
  draw: drawBackdoorSet,
  cues: [
    'cau-backdoor-set-0',
    'cau-backdoor-set-1',
    'cau-adjust-common-target',
    'cau-backdoor-set-2',
    'cau-hidden-tier',
  ],
};
