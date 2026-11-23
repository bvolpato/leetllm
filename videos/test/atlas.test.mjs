import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleAtlas } from '../atlas.mjs';

const inventory = [
  {
    path: 'web/src/content/glossary/retrieval.md',
    sha256: 'current',
    title: 'Retrieval',
    type: 'glossary',
    hidden: false,
  },
];
const manifest = {
  icons: [
    {
      id: 'retrieval',
      title: 'Retrieval',
      meaning: 'Retrieve useful sources',
      category: 'Retrieval',
      file: 'retrieval.svg',
    },
  ],
  palette: {},
  paletteVariants: {},
};
const review = () => ({
  concepts: [
    {
      id: 'retrieval',
      title: 'Retrieval',
      meaning: 'Retrieve useful sources',
      family: 'Retrieval',
      representation: 'diagram',
      aliases: ['search'],
      brief: 'Follow a query into an index.',
      sourcePaths: [inventory[0].path],
      pitfalls: [],
    },
  ],
  sources: [
    {
      ...inventory[0],
      basis: ['Definition and Mermaid explanation'],
      conceptIds: ['retrieval'],
      status: 'candidate',
      reason: 'The query has a visible source path.',
    },
  ],
});

test('catalog preserves review scope, symbol identity and evidence links', () => {
  const atlas = assembleAtlas([review()], inventory, manifest);
  assert.deepEqual(atlas.summary, {
    articles: 0,
    glossary: 1,
    reviewedSources: 1,
    concepts: 1,
    symbols: 1,
    diagramBriefs: 1,
    simulationBriefs: 0,
  });
  assert.equal(atlas.concepts[0].preferredFormat, 'diagram');
  assert.equal(atlas.concepts[0].visualStatus, 'symbol-and-brief');
  assert.equal(atlas.concepts[0].symbol.file, 'retrieval.svg');
  assert.equal(atlas.concepts[0].sourceRefs[0].path, inventory[0].path);
  assert.deepEqual(atlas.sources[0].basis, ['Definition and Mermaid explanation']);
});

test('standalone symbols and briefs retain distinct availability', () => {
  const r = review();
  r.concepts[0].id = 'search-flow';
  r.sources[0].conceptIds = ['search-flow'];
  r.concepts[0].sourceRefs = [
    { path: inventory[0].path, headings: ['How it works'], glossaryIds: ['retrieval'] },
  ];
  const atlas = assembleAtlas([r], inventory, manifest);
  assert.equal(atlas.concepts.find((c) => c.id === 'retrieval').visualStatus, 'symbol');
  const flow = atlas.concepts.find((c) => c.id === 'search-flow');
  assert.equal(flow.visualStatus, 'design-brief');
  assert.equal(flow.symbol, null);
  assert.deepEqual(flow.sourceRefs[0].headings, ['How it works']);
});

test('source index includes evidence links nominated by a concept brief', () => {
  const r = review();
  r.sources[0].conceptIds = [];
  r.sources[0].status = 'text-only';
  const atlas = assembleAtlas([r], inventory, manifest);
  assert.deepEqual(atlas.sources[0].conceptIds, ['retrieval']);
  assert.equal(atlas.sources[0].status, 'candidate');
});

test('catalog rejects missing, duplicate, stale or ungrounded source claims', () => {
  assert.throws(() => assembleAtlas([], inventory, manifest), /Unreviewed sources/);
  assert.throws(
    () => assembleAtlas([review(), review()], inventory, manifest),
    /Duplicate reviewed source/,
  );
  for (const mutate of [
    (r) => {
      r.sources[0].sha256 = 'previous';
    },
    (r) => {
      r.sources[0].basis = [];
    },
    (r) => {
      r.sources[0].conceptIds = ['missing'];
    },
    (r) => {
      r.concepts[0].sourcePaths = ['web/src/content/missing/content.md'];
    },
  ]) {
    const r = review();
    mutate(r);
    assert.throws(() => assembleAtlas([r], inventory, manifest));
  }
});

test('pitfall prose remains whole when repeated briefs mix strings and lists', () => {
  const first = review();
  first.concepts[0].pitfalls = 'A completed task does not prove its output is correct.';
  const second = {
    concepts: [
      {
        ...first.concepts[0],
        pitfalls: [first.concepts[0].pitfalls, 'Retain the source version.'],
      },
    ],
    sources: [],
  };
  const atlas = assembleAtlas([first, second], inventory, manifest);
  assert.deepEqual(atlas.concepts[0].pitfalls, [
    'A completed task does not prove its output is correct.',
    'Retain the source version.',
  ]);
});
