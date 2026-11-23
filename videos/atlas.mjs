#!/usr/bin/env node
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const unique = (values) => [...new Set(values)];
const aliases = (value) =>
  Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
const pitfalls = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export async function inventoryAtlasSources(root) {
  const base = join(root, 'web/src/content'),
    paths = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_generated')
        await walk(file);
      else if (
        entry.isFile() &&
        (entry.name === 'content.md' ||
          (directory === join(base, 'glossary') && entry.name.endsWith('.md')))
      )
        paths.push(file);
    }
  }
  await walk(base);
  return Promise.all(
    paths.sort().map(async (file) => {
      const bytes = await readFile(file),
        text = bytes.toString('utf8');
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
      const metadata = frontmatter ? parse(frontmatter) : {};
      const path = relative(root, file).replaceAll('\\', '/'),
        type = path.startsWith('web/src/content/glossary/') ? 'glossary' : 'article';
      return {
        path,
        sha256: digest(bytes),
        type,
        title: metadata?.title ?? path.split('/').at(type === 'glossary' ? -1 : -2),
        hidden: Boolean(metadata?.hidden || metadata?.private || metadata?.draft),
      };
    }),
  );
}

export function assembleAtlas(reviews, inventory, manifest) {
  const actual = new Map(inventory.map((source) => [source.path, source]));
  if (actual.size !== inventory.length) throw new Error('Duplicate inventory path');
  const symbols = new Map(manifest.icons.map((icon) => [icon.id, icon]));
  const concepts = new Map(
    manifest.icons.map((icon) => [
      icon.id,
      {
        id: icon.id,
        title: icon.title,
        meaning: icon.meaning,
        category: icon.category,
        preferredFormat: 'icon',
        aliases: [],
        brief: '',
        pitfalls: [],
        sourcePaths: [],
      },
    ]),
  );
  const records = new Map(),
    researched = new Set(),
    references = new Map();
  for (const review of reviews) {
    for (const item of review.concepts) {
      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) ||
        !['icon', 'diagram', 'simulation'].includes(item.representation)
      )
        throw new Error(`Invalid visual concept: ${item.id}`);
      const before = concepts.get(item.id);
      concepts.set(item.id, {
        id: item.id,
        title: before?.title ?? item.title,
        meaning: before?.meaning ?? item.meaning,
        category: before?.category ?? item.family,
        preferredFormat: researched.has(item.id) ? before.preferredFormat : item.representation,
        aliases: unique([...(before?.aliases ?? []), ...aliases(item.aliases)]),
        brief: before?.brief || item.brief,
        pitfalls: unique([...(before?.pitfalls ?? []), ...pitfalls(item.pitfalls)]),
        sourcePaths: unique([...(before?.sourcePaths ?? []), ...(item.sourcePaths ?? [])]).sort(),
      });
      researched.add(item.id);
      for (const reference of [...(item.references ?? []), ...(item.sourceRefs ?? [])]) {
        const key = `${item.id}/${reference.path}`,
          before = references.get(key) ?? { headings: [], glossaryIds: [] };
        references.set(key, {
          headings: unique([
            ...before.headings,
            ...(reference.headings ?? []),
            ...(reference.heading ? [reference.heading] : []),
          ]),
          glossaryIds: unique([
            ...before.glossaryIds,
            ...(reference.glossaryIds ?? []),
            ...(reference.glossaryId ? [reference.glossaryId] : []),
          ]),
        });
      }
    }
    for (const record of review.sources) {
      const live = actual.get(record.path);
      if (!live) throw new Error(`Unknown reviewed source: ${record.path}`);
      if (records.has(record.path)) throw new Error(`Duplicate reviewed source: ${record.path}`);
      if (record.sha256 !== live.sha256) throw new Error(`Reviewed source changed: ${record.path}`);
      if (record.type !== live.type || !Array.isArray(record.basis) || !record.basis.length)
        throw new Error(`Missing review basis: ${record.path}`);
      records.set(record.path, {
        ...live,
        basis: record.basis,
        conceptIds: unique(record.conceptIds ?? []).sort(),
        status: record.status === 'text-only' ? 'custom-visual-needed' : record.status,
        reason: record.reason ?? '',
        markers:
          record.visualMarkers ?? record.markers ?? record.evidence ?? record.structure ?? null,
      });
    }
  }
  const missing = inventory.filter((source) => !records.has(source.path));
  if (missing.length)
    throw new Error(`Unreviewed sources: ${missing.map((source) => source.path).join(', ')}`);
  for (const record of records.values())
    for (const id of record.conceptIds) {
      if (!concepts.has(id)) throw new Error(`Unknown concept ${id} in ${record.path}`);
      const concept = concepts.get(id);
      concept.sourcePaths = unique([...concept.sourcePaths, record.path]).sort();
    }
  for (const concept of concepts.values())
    for (const path of concept.sourcePaths) {
      const source = records.get(path);
      if (!source) throw new Error(`Unknown concept evidence: ${concept.id}/${path}`);
      if (!source.conceptIds.includes(concept.id)) {
        source.conceptIds = unique([...source.conceptIds, concept.id]).sort();
        if (source.status === 'custom-visual-needed') {
          source.status = 'candidate';
          source.reason = 'This source grounds the related visual briefs.';
        }
      }
    }
  const entries = [...concepts.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((concept) => {
      for (const path of concept.sourcePaths)
        if (!actual.has(path)) throw new Error(`Unknown concept evidence: ${concept.id}/${path}`);
      const icon = symbols.get(concept.id);
      return {
        ...concept,
        symbol: icon ? { file: icon.file, viewBox: '0 0 64 64' } : null,
        visualStatus: icon ? (concept.brief ? 'symbol-and-brief' : 'symbol') : 'design-brief',
        sourceRefs: concept.sourcePaths.map((path) => {
          const source = actual.get(path);
          return {
            path,
            title: source.title,
            type: source.type,
            hidden: source.hidden,
            ...(references.get(`${concept.id}/${path}`) ?? {}),
          };
        }),
      };
    });
  const sources = [...records.values()].sort((a, b) => a.path.localeCompare(b.path));
  const articles = inventory.filter((source) => source.type === 'article').length;
  return {
    version: 1,
    title: 'LeetLLM Concept Atlas',
    description:
      'Reusable SVG symbols with source-backed briefs for explanatory diagrams and simulations.',
    summary: {
      articles,
      glossary: inventory.length - articles,
      reviewedSources: sources.length,
      concepts: entries.length,
      symbols: entries.filter((entry) => entry.symbol).length,
      diagramBriefs: entries.filter((entry) => entry.preferredFormat === 'diagram').length,
      simulationBriefs: entries.filter((entry) => entry.preferredFormat === 'simulation').length,
    },
    sourceFingerprint: digest(
      JSON.stringify(inventory.map(({ path, sha256 }) => [path, sha256]).sort()),
    ),
    reviewScope:
      'Article metadata, headings and visual explanations; glossary definition leads, structural cues and selected full sections. Per-source basis records the actual scope. This catalog identifies visual opportunities; it is separate from a factual or editorial audit.',
    palette: manifest.palette,
    paletteVariants: manifest.paletteVariants,
    concepts: entries,
    sources,
  };
}

async function main() {
  const root = resolve(here, '..'),
    directory = join(here, 'assets/concepts');
  const reviewDir = join(directory, 'curation');
  const files = (await readdir(reviewDir)).filter((file) => file.endsWith('.json')).sort();
  const reviews = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(join(reviewDir, file), 'utf8'))),
  );
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const catalog = assembleAtlas(reviews, await inventoryAtlasSources(root), manifest);
  const output = join(directory, 'catalog.json'),
    serialized = JSON.stringify(catalog, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if ((await readFile(output, 'utf8')) !== serialized)
      throw new Error('Concept catalog is stale; run node videos/atlas.mjs');
  } else {
    await mkdir(directory, { recursive: true });
    await writeFile(output, serialized);
  }
  console.log(
    `${catalog.summary.concepts} concepts, ${catalog.summary.symbols} SVG symbols; ${catalog.summary.articles} articles + ${catalog.summary.glossary} glossary sources verified`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
