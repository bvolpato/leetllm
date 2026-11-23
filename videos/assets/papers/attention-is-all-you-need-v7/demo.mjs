import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fade, fadeIn, film, resolveImageAsset } from 'vizmatic/stage';
import { paperFigure } from '../../../lib/paper-figure.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));

// File reads, hashes and decoding finish before the Stage body or any frame runs.
const prepared = new Map(
  await Promise.all(
    manifest.assets.map(async (entry) => [
      entry.id,
      { entry, image: await resolveImageAsset(entry.path, { ...entry, baseDir: root }) },
    ]),
  ),
);

export const assets = manifest.assets;

export default film(
  {
    title: 'Paper figure authoring: Attention',
    description:
      'Actual tight paper crops with vector attribution, explanation and cue-ready highlights.',
    width: 1920,
    height: 1080,
    fps: 30,
    bloom: 0,
  },
  (stage) => {
    const title = prepared.get('attention-paper-title');
    const heading = paperFigure(title.image, {
      source: title.entry.source,
      caption: 'The source title is a small attributed crop, without the abstract.',
      width: 1500,
      height: 500,
    });
    stage.play(fadeIn(heading), { duration: 0.3 });
    stage.wait(1.2);
    stage.play(fade(heading, 0), { duration: 0.3 });

    const figure = prepared.get('attention-paper-figure-2');
    const architecture = paperFigure(figure.image, {
      source: figure.entry.source,
      caption: 'Each head forms its own weighted read. Concatenate the outputs, then project.',
      width: 1500,
      height: 900,
      highlights: [
        {
          id: 'scaled-dot-product',
          region: { x: 115, y: 95, width: 350, height: 590 },
        },
      ],
    });
    stage.play(fadeIn(architecture), { duration: 0.35 });
    stage.wait(1.1);
    stage.play(fadeIn(architecture.highlights['scaled-dot-product']), { duration: 0.25 });
    stage.wait(1.5);
    stage.play(fade(architecture, 0), { duration: 0.3 });

    const equation = prepared.get('attention-paper-equation-1');
    const formula = paperFigure(equation.image, {
      source: equation.entry.source,
      caption: 'Scale the scores, normalize their mass, then mix the values.',
      width: 1450,
      height: 600,
    });
    stage.play(fadeIn(formula), { duration: 0.35 });
    stage.wait(2);
  },
);
