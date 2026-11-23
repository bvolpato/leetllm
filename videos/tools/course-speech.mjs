#!/usr/bin/env node
import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { prepareTakes } from '../lib/course-speech.mjs';

const { values } = parseArgs({
  options: {
    'texts-json': { type: 'string' },
    'output-root': { type: 'string' },
    'takes-manifest': { type: 'string' },
  },
});
if (!values['texts-json'] || !values['output-root'] || !values['takes-manifest'])
  throw new Error(
    'Usage: node videos/tools/course-speech.mjs --texts-json INPUT --output-root DIR --takes-manifest OUTPUT',
  );
const texts = JSON.parse(await readFile(values['texts-json'], 'utf8'));
const { takes } = await prepareTakes(texts, values['output-root']);
const manifest = resolve(values['takes-manifest']),
  temporary = manifest + '.' + randomUUID() + '.tmp';
await writeFile(
  temporary,
  JSON.stringify(
    takes.map((take, index) => ({ text: texts[index], ...take })),
    null,
    2,
  ) + '\n',
);
await rename(temporary, manifest);
