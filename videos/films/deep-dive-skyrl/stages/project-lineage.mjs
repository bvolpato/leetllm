import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawProjectLineage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('project-lineage', state),
    cueProgress = () => api.focus.progress(`sky-${'project-lineage'}-b${currentBeat}`, progress);
  api.focus.target('sky-project-lineage-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      currentBeat
        ? 'Source, dependencies and external assets keep separate terms'
        : 'Reusable boundaries grow from the agent interaction',
    );
    if (!currentBeat) {
      drawSkyChapterBox(ctx, api, 'Tool-using agent', 650, 370, 620, 90, themeColors.yellow, 36);
      const names = ['Trainer', 'Gym environment', 'Agent dispatch', 'Tinker backend'];
      names.forEach((v, i) => {
        const x = 170 + i * 440;
        drawSkyChapterArrow(ctx, api, 960, 490, x + 190, 640, themeColors.muted);
        drawSkyChapterBox(
          ctx,
          api,
          v,
          x,
          670,
          380,
          100,
          i < Math.ceil(cueProgress() * 4) ? themeColors.cyan : themeColors.muted,
          31,
        );
      });
      drawSkyChapterText(ctx, api, 'Harbor task adapter', 960, 915, 32, themeColors.blue, 'center');
    } else {
      drawSkyChapterBox(
        ctx,
        api,
        'Sky Computing Lab + Anyscale',
        440,
        370,
        1040,
        100,
        themeColors.blue,
        34,
      );
      const labels = [
        'Root source\nApache-2.0',
        'Checkpoint\nown terms',
        'Dataset\nown terms',
        'Dependency\nown terms',
      ];
      labels.forEach((v, i) =>
        drawSkyChapterBox(
          ctx,
          api,
          v,
          170 + i * 440,
          650,
          380,
          150,
          i ? themeColors.cyan : themeColors.green,
          31,
        ),
      );
      drawSkyChapterText(
        ctx,
        api,
        'Compute acknowledgment ≠ ownership of every component',
        960,
        910,
        33,
        themeColors.yellow,
        'center',
      );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'Project lineage and artifact identity answer different questions',
    );
  });
}
export default {
  id: 'project-lineage',
  draw: drawProjectLineage,
  cues: ['sky-project-lineage-b0', 'sky-project-lineage-b1'],
};
