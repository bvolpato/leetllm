import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkFilm, compileFilm, fadeIn, film, resolveImageAsset } from 'vizmatic/stage';
import { paperFigure } from '../lib/paper-figure.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(
  await readFile(
    new URL('../assets/papers/attention-is-all-you-need-v7/manifest.json', import.meta.url),
  ),
);
const entry = manifest.assets.find((asset) => asset.id === 'attention-paper-figure-2');
const asset = await resolveImageAsset(entry.path, { ...entry, baseDir: root });
const options = {
  source: entry.source,
  caption: 'Each head reads values with its own learned projections.',
  highlights: [{ id: 'scaled-dot-product', region: { x: 115, y: 95, width: 350, height: 590 } }],
};

async function compile(optionsOverride = {}, look = 'midnight') {
  let card;
  const compiled = await compileFilm(
    film({ width: 1920, height: 1080, bloom: 0, look }, (stage) => {
      card = paperFigure(asset, { ...options, ...optionsOverride });
      stage.add(card);
      stage.at(0.5, () =>
        stage.play(fadeIn(card.highlights['scaled-dot-product']), { duration: 0.2 }),
      );
      stage.wait(1);
    }),
  );
  return { compiled, card };
}

test('paper framing contains the actual image and separate vector caption/citation', async () => {
  const { compiled, card } = await compile();
  const bounds = card.bounds();
  assert(bounds.x >= -960 && bounds.x + bounds.width <= 960);
  assert(bounds.y >= -540 && bounds.y + bounds.height <= 540);
  const image = card.figure.bounds(),
    mat = card.paper.bounds();
  const caption = card.caption.bounds(),
    citation = card.citation.bounds();
  assert(image.x > mat.x && image.y > mat.y);
  assert(image.x + image.width < mat.x + mat.width);
  assert(caption.y > mat.y + mat.height);
  assert(citation.y > caption.y + caption.height);
  const frame = compiled.frame(0.25),
    images = frame.ops.filter((op) => op.kind === 'image');
  assert.equal(images.length, 1);
  assert.equal(images[0].image.asset.sha256, entry.sha256);
  assert.equal(images[0].image.src, asset.src);
  assert.equal(card.citation.source.includes('Vaswani et al. (2017)'), true);
  assert.equal(card.citation.source.includes('Figure 2'), true);
  assert(card.citation.chars.length > 30, 'citation is vector glyph geometry');
});

test('source colors and a white paper mat survive both theme looks', async () => {
  for (const look of ['midnight', 'paper']) {
    const { compiled, card } = await compile({}, look);
    const image = compiled.frame(0.25).ops.find((op) => op.kind === 'image');
    assert.equal(image.image.src, asset.src);
    assert.equal(image.alpha, 1);
    assert.deepEqual(card.paper.get('fill'), [255, 255, 255, 1]);
    const checked = await checkFilm(compiled, { times: [0.25, 0.8] });
    assert.equal(checked.ok, true, JSON.stringify(checked.diagnostics));
  }
});

test('open-license credit remains vector text inside the complete paper framing', async () => {
  for (const [id, label] of [
    ['CC-BY-4.0', 'CC BY 4.0'],
    ['CC-BY-SA-4.0', 'CC BY-SA 4.0'],
  ]) {
    const { compiled, card } = await compile({
      source: { ...entry.source, license: { id } },
    });
    assert(card.citation.source.includes(label));
    const citation = card.citation.bounds();
    assert(citation.y + citation.height <= card.bounds().y + card.bounds().height);
    assert.equal((await checkFilm(compiled, { times: [0.25, 0.8] })).ok, true);
  }
});

test('intrinsic-pixel highlights map to the displayed image and wait for author timing', async () => {
  const { compiled, card } = await compile();
  const image = card.layout.image,
    region = options.highlights[0].region;
  const expectedScale = image.width / asset.width;
  const highlight = card.highlights['scaled-dot-product'];
  assert(Math.abs(highlight.width - region.width * expectedScale) < 1e-9);
  assert(Math.abs(highlight.height - region.height * expectedScale) < 1e-9);
  const before = compiled.frame(0.25),
    after = compiled.frame(0.8);
  assert(!before.ops.some((op) => op.node === highlight));
  assert(after.ops.some((op) => op.node === highlight));
});

test('out-of-image and duplicate highlight identities stop compilation', async () => {
  await assert.rejects(
    compile({
      highlights: [{ id: 'outside', region: { x: asset.width - 1, y: 0, width: 2, height: 1 } }],
    }),
    /beyond the prepared image/,
  );
  const highlight = options.highlights[0];
  await assert.rejects(compile({ highlights: [highlight, highlight] }), /unique lowercase slugs/);
});

test('impossible citation framing and missing source identity fail explicitly', async () => {
  await assert.rejects(compile({ width: 200, height: 60 }), /do not fit/);
  await assert.rejects(
    compile({ source: { ...entry.source, locator: '' } }),
    /locator must be a nonempty/,
  );
});

test('unprepared, missing and mismatched image bytes cannot enter a paper film', async () => {
  await assert.rejects(
    resolveImageAsset('videos/assets/papers/missing.png', { baseDir: root }),
    /Could not read image asset/,
  );
  await assert.rejects(
    resolveImageAsset(entry.path, { baseDir: root, sha256: '0'.repeat(64) }),
    /SHA-256 mismatch/,
  );
  await assert.rejects(
    compileFilm(
      film((stage) => {
        stage.add(paperFigure({ ...asset }, options));
      }),
    ),
    /resolveImageAsset/,
  );
});

test('random frame seeking reuses prepared bytes and yields deterministic output', async () => {
  const { compiled } = await compile();
  const savedFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('network must not run while drawing');
  };
  try {
    const first = compiled.svg(0.8);
    compiled.svg(0.1);
    assert.equal(compiled.svg(0.8), first);
    assert(first.includes('data:image/png;base64,'));
  } finally {
    globalThis.fetch = savedFetch;
  }
});
