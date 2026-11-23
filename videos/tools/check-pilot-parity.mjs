#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { setImmediate } from 'node:timers/promises';

const repository = fileURLToPath(new URL('../..', import.meta.url));
const delivery = path.join(repository, 'build/video-delivery-20261106');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const read = async (filename) => JSON.parse(await fs.readFile(filename, 'utf8'));
const importFile = (filename) => import(pathToFileURL(filename));
const traverse = traverseModule.default ?? traverseModule;

export function nativePixelsEqual(leftContext, rightContext, width = 1920, height = 1080) {
  const left = leftContext.getImageData(0, 0, width, height).data;
  const right = rightContext.getImageData(0, 0, width, height).data;
  return Buffer.from(left.buffer, left.byteOffset, left.byteLength).equals(
    Buffer.from(right.buffer, right.byteOffset, right.byteLength),
  );
}

function linuxHighWaterRssBytes() {
  if (process.platform !== 'linux') return undefined;
  const match = readFileSync('/proc/self/status', 'utf8').match(/^VmHWM:\s+(\d+) kB$/m);
  return match ? Number(match[1]) * 1024 : undefined;
}

async function sourceClosure(id) {
  const files = [`videos/animations/${id}.mjs`];
  async function visit(directory) {
    for (const entry of await fs.readdir(path.join(repository, directory), {
      withFileTypes: true,
    })) {
      const relative = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) await visit(relative);
      else if (entry.isFile() && entry.name.endsWith('.mjs')) files.push(relative);
    }
  }
  await visit(`videos/films/${id}`);
  return Promise.all(
    files.sort().map(async (filename) => ({
      path: filename,
      sha256: hash(await fs.readFile(path.join(repository, filename))),
    })),
  );
}

export async function preservedModule(filename, originalEntry) {
  let source = await fs.readFile(filename, 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  const imports = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
  const replacements = [];
  for (const node of imports) {
    const resolved = node.source.value.startsWith('.')
      ? new URL(node.source.value, pathToFileURL(originalEntry)).href
      : import.meta.resolve(node.source.value);
    replacements.push({ start: node.source.start, end: node.source.end, value: resolved });
  }
  traverse(ast, {
    MetaProperty(p) {
      if (p.node.meta.name !== 'import' || p.node.property.name !== 'meta') return;
      const member = p.parentPath;
      if (
        !member.isMemberExpression() ||
        member.node.object !== p.node ||
        !(member.node.computed
          ? member.node.property.type === 'StringLiteral' && member.node.property.value === 'url'
          : member.node.property.name === 'url')
      )
        throw new Error('Archived-module parity currently supports import.meta.url only');
      replacements.push({
        start: member.node.start,
        end: member.node.end,
        value: pathToFileURL(path.resolve(originalEntry)).href,
      });
    },
  });
  for (const replacement of replacements.sort((a, b) => b.start - a.start))
    source =
      source.slice(0, replacement.start) +
      JSON.stringify(replacement.value) +
      source.slice(replacement.end);
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}

export async function checkPilotParity(
  id,
  {
    frameStep = 30,
    reportPath,
    baselineDirectory,
    timelinePath: suppliedTimeline,
    freezePath,
    gcEvery = 32,
  } = {},
) {
  if (typeof globalThis.gc !== 'function')
    throw new Error(
      'Native parity requires node --expose-gc; native raster temporaries must have a bounded collection lifetime',
    );
  assert(
    Number.isInteger(gcEvery) && gcEvery > 0 && gcEvery <= 32,
    'GC interval must be between1and32 states',
  );
  assert(/^[a-z][a-z0-9-]*$/.test(id));
  assert(Number.isInteger(frameStep) && frameStep > 0);
  const evidence = baselineDirectory
    ? path.dirname(path.resolve(baselineDirectory))
    : path.join(delivery, 'source-migration/pilots', id);
  const baseline = baselineDirectory
    ? path.resolve(baselineDirectory)
    : path.join(evidence, 'baseline');
  const authority = await read(path.join(baseline, 'authority.json'));
  assert.equal(authority.id, id);
  assert.equal(
    hash(await fs.readFile(path.join(baseline, 'animation.mjs'))),
    authority.source.sha256,
  );
  const closure = await sourceClosure(id);
  const before = await preservedModule(
    path.join(baseline, 'animation.mjs'),
    path.join(repository, `videos/animations/${id}.mjs`),
  );
  const after = await importFile(path.join(repository, `videos/animations/${id}.mjs`));
  const freeze = await read(freezePath ?? path.join(delivery, `frozen-v9/${id}.json`));
  const runtime = (filename) => importFile(path.join(freeze.snapshot, filename));
  const { readLesson, frameState } = await runtime('videos/lib/lesson.mjs');
  const { resolveSceneCues } = await runtime('videos/lib/narration-cues.mjs');
  const { drawFrame } = await runtime('videos/lib/scene.mjs');
  const { registerLessonFonts } = await runtime('videos/lib/fonts.mjs');
  const require = createRequire(path.join(freeze.snapshot, 'videos/render.mjs'));
  const { createCanvas } = require('@napi-rs/canvas');
  registerLessonFonts();
  const lesson = await readLesson(`videos/lessons/${id}.lesson.yaml`, repository);
  assert.equal(
    hash(await fs.readFile(path.join(repository, `videos/lessons/${id}.lesson.yaml`))),
    authority.markup.sha256,
  );
  const timelinePath =
    suppliedTimeline ??
    (id === 'conformal'
      ? path.join(delivery, 'root-conformal-repair/provider-3/timeline.json')
      : id === 'state-space-models'
        ? path.join(
            delivery,
            'root-state-space-repair/audio/previews/state-space-models/timeline.json',
          )
        : path.join(freeze.output, id, 'timeline.json'));
  const timeline = await read(timelinePath);
  const legacyNames = Object.keys(before).sort();
  assert.deepEqual(
    Object.keys(after)
      .filter((name) => name !== 'default')
      .sort(),
    legacyNames,
  );
  if (before.validateModel) assert.equal(before.validateModel(), after.validateModel());
  assert.equal(after.default.id, id);
  after.default.validate(lesson);
  const left = createCanvas(1920, 1080),
    right = createCanvas(1920, 1080);
  const leftCtx = left.getContext('2d'),
    rightCtx = right.getContext('2d');
  const failures = [],
    scenes = [];
  let states = 0,
    exactPixels = 0,
    exactAudits = 0;
  const memory = {
    gcEvery,
    gcBoundaries: 0,
    peakRssBytes: 0,
    peakHeapUsedBytes: 0,
    peakExternalBytes: 0,
    peakArrayBuffersBytes: 0,
    initialProcessPeakRssBytes: process.resourceUsage().maxRSS * 1024,
    initialLinuxHighWaterRssBytes: linuxHighWaterRssBytes(),
    samples: [],
  };
  function observeMemory() {
    const usage = process.memoryUsage();
    memory.peakRssBytes = Math.max(memory.peakRssBytes, usage.rss);
    memory.peakHeapUsedBytes = Math.max(memory.peakHeapUsedBytes, usage.heapUsed);
    memory.peakExternalBytes = Math.max(memory.peakExternalBytes, usage.external);
    memory.peakArrayBuffersBytes = Math.max(memory.peakArrayBuffersBytes, usage.arrayBuffers);
    return usage;
  }
  async function collectNativeTemporaries(scene) {
    const before = observeMemory();
    globalThis.gc();
    await setImmediate();
    globalThis.gc();
    await setImmediate();
    memory.gcBoundaries++;
    memory.samples.push({ scene, states, before, after: observeMemory() });
  }
  observeMemory();
  for (const [index, scene] of lesson.scenes.entries()) {
    const timing = structuredClone(timeline.scenes[index]);
    assert.equal(timing.id, scene.id);
    assert.deepEqual(
      timing.beats.map((beat) => [beat.say, beat.hold]),
      scene.beats.map((beat) => [beat.say, beat.hold]),
    );
    timing.visualCues = resolveSceneCues(scene, timing, timing.sounds);
    timing.cueTiming = 'provider-words';
    const frames = new Set();
    for (let frame = 0; frame < timing.frames; frame += frameStep) frames.add(frame);
    frames.add(timing.frames - 1);
    for (const cue of timing.visualCues) {
      for (const time of [
        cue.start - 1 / 30,
        cue.start,
        cue.start + 1 / 30,
        (cue.start + cue.end) / 2,
        cue.end - 1 / 30,
        cue.end,
        cue.end + 1 / 30,
      ])
        frames.add(Math.max(0, Math.min(timing.frames - 1, Math.round(time * 30))));
    }
    for (const beat of timing.beats)
      for (const fraction of [0, 0.04, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98, 1])
        frames.add(
          Math.max(
            0,
            Math.min(
              timing.frames - 1,
              Math.round((beat.start + (beat.until - beat.start) * fraction) * 30),
            ),
          ),
        );
    const rows = [];
    for (const frame of [...frames].sort((a, b) => a - b)) {
      if (states > 0 && states % gcEvery === 0) await collectNativeTemporaries(scene.id);
      const time = frame / 30,
        state = frameState(timing, time, index, lesson.scenes.length);
      const a = drawFrame(leftCtx, lesson, scene, state, before.draw);
      const b = drawFrame(rightCtx, lesson, scene, state, after.draw);
      const auditEqual = JSON.stringify(a) === JSON.stringify(b);
      const pixelEqual = nativePixelsEqual(leftCtx, rightCtx);
      observeMemory();
      states++;
      exactAudits += Number(auditEqual);
      exactPixels += Number(pixelEqual);
      if (!auditEqual || !pixelEqual) {
        const directory = path.join(evidence, 'parity-failures');
        await fs.mkdir(directory, { recursive: true });
        for (const [role, canvas] of [
          ['before', left],
          ['after', right],
        ])
          await fs.writeFile(
            path.join(directory, `${scene.id}-${frame}-${role}.png`),
            canvas.toBuffer('image/png'),
          );
        failures.push({ scene: scene.id, frame, time, pixelEqual, auditEqual });
        if (failures.length > 10) break;
      }
      rows.push({ frame, pixelEqual, auditEqual });
    }
    scenes.push({
      id: scene.id,
      states: rows.length,
      failures: rows.filter((row) => !row.pixelEqual || !row.auditEqual),
    });
    await collectNativeTemporaries(scene.id);
    process.stdout.write(
      JSON.stringify({ id, scene: scene.id, states: rows.length, failures: failures.length }) +
        '\n',
    );
    if (failures.length > 10) break;
  }
  assert.deepEqual(await sourceClosure(id), closure, 'A module changed during the parity run');
  const report = {
    id,
    scope:
      'Mechanical source-stage migration only. Same retained provider words, unchanged narration/holds, frozen v9 painter/fonts, native1920x1080 RGBA equality and audit equality. This does not approve a new encoded movie.',
    baseline: authority.source,
    sourceClosure: closure,
    markup: authority.markup,
    timeline: {
      path: path.relative(repository, timelinePath),
      sha256: hash(await fs.readFile(timelinePath)),
    },
    currentEntrySha256: hash(
      await fs.readFile(path.join(repository, `videos/animations/${id}.mjs`)),
    ),
    frameStep,
    states,
    exactPixels,
    exactAudits,
    scenes,
    failures,
    resources: {
      ...memory,
      processPeakRssBytes: process.resourceUsage().maxRSS * 1024,
      linuxHighWaterRssBytes: linuxHighWaterRssBytes(),
      scope:
        'Same complete sample set. ImageData views die inside a synchronous comparison helper; explicit GC plus event-loop finalizer yields every32states or fewer and at scene boundaries. Frozen painter/runtime unchanged.',
    },
  };
  if (reportPath)
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [id, reportPath, ...args] = process.argv.slice(2);
  const options = { reportPath };
  if (args.length && !args[0].startsWith('--')) options.frameStep = Number(args.shift());
  const flags = {
    '--baseline': 'baselineDirectory',
    '--timeline': 'timelinePath',
    '--freeze': 'freezePath',
    '--step': 'frameStep',
  };
  while (args.length) {
    const flag = args.shift(),
      value = args.shift();
    if (!flags[flag] || value === undefined)
      throw new Error(
        'Use ID report.json [step] [--baseline DIR] [--timeline FILE] [--freeze FILE]',
      );
    options[flags[flag]] = flag === '--step' ? Number(value) : value;
  }
  checkPilotParity(id, options)
    .then((report) => {
      if (report.failures.length) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error.stack);
      process.exitCode = 1;
    });
}
