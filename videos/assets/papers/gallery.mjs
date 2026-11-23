import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fade, fadeIn, film, resolveImageAsset } from 'vizmatic/stage';
import { paperFigure } from '../../lib/paper-figure.mjs';

const rootUrl = new URL('../../../', import.meta.url);
const root = fileURLToPath(rootUrl);
const catalog = JSON.parse(await readFile(new URL('./catalog.json', import.meta.url), 'utf8'));

// These local reads, digest checks and decodes finish before compilation.
export const references = (
  await Promise.all(
    catalog.references.map(async (reference) => {
      const manifest = JSON.parse(await readFile(new URL(reference.manifest, rootUrl), 'utf8'));
      return Promise.all(
        manifest.assets.map(async (asset) => ({
          ...reference,
          asset,
          caption: reference.captions?.[asset.id] ?? reference.caption,
          image: await resolveImageAsset(asset.path, { ...asset, baseDir: root }),
        })),
      );
    }),
  )
).flat();

export const assets = references.map((reference) => reference.asset);

export default film(
  {
    title: 'Primary paper figures',
    description: 'Prepared paper crops with explanation, attribution and source-specific scope.',
    width: 1920,
    height: 1080,
    fps: 30,
    bloom: 0,
  },
  (stage) => {
    for (const reference of references) {
      const figure = paperFigure(reference.image, {
        source: reference.asset.source,
        caption: reference.caption,
        width: 1760,
        height: 960,
      });
      stage.play(fadeIn(figure), { duration: 0.25 });
      stage.wait(2.5);
      stage.play(fade(figure, 0), { duration: 0.25 });
    }
  },
);
