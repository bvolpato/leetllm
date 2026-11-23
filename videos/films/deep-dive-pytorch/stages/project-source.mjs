import { sampleModel } from '../construction.mjs';
import { drawCard, drawRows } from '../defaults.mjs';
export function drawProjectSource(ctx, scene, state, api) {
  return api.focus.target('pt-project-source-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('project-source', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawRows(
          ctx,
          api,
          [
            ['2016 Torch-community work', 'Meta funding and broad collaborators'],
            [
              'Foundation / governance',
              'Linux Foundation hosts it. Maintainers make technical decisions.',
            ],
            ['Package source', 'BSD 3-Clause and bundled component notices'],
            ['External assets', 'Separate model, dataset and service rights'],
          ],
          350,
          150,
        );
      } else if (currentBeat === 1) {
        drawRows(
          ctx,
          api,
          [
            ['August 2 source snapshot', 'Read the implementation at this commit'],
            ['PyTorch 2.13 CPU wheel', 'Ran the article’s CPU examples'],
            ['2.14 API reference', 'Checked September 23, 2026'],
            ['Moving guides', 'Checked November 7, 2026'],
          ],
          350,
          150,
        );
      } else {
        const names = [
          'Tensor / TensorImpl',
          'Dispatcher / schema',
          'Autograd / SavedVariable',
          'Attention / compiler',
          'Mesh / FSDP / parallelism',
          'DCP / launcher',
        ];
        names.forEach((v, i) =>
          drawCard(
            ctx,
            api,
            v,
            170 + (i % 2) * 850,
            370 + Math.floor(i / 2) * 195,
            730,
            i <= Math.floor(progress * 6) ? themeColors.cyan : themeColors.muted,
            115,
          ),
        );
      }
    }
  });
}
export default {
  id: 'project-source',
  draw: drawProjectSource,
  cues: ['pt-project-source-0', 'pt-project-source-1', 'pt-project-source-2'],
};
