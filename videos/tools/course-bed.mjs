#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { courseBedPolicy, mixCourseBed } from '../lib/course-bed.mjs';

const { values } = parseArgs({
  options: {
    lesson: { type: 'string' },
    source: { type: 'string' },
    voice: { type: 'string' },
    out: { type: 'string' },
    receipt: { type: 'string' },
    timing: { type: 'string' },
    describe: { type: 'boolean' },
  },
});
if (!values.lesson || (!values.describe && !(values.voice && values.out && values.receipt)))
  throw new Error(
    'Use --lesson ID --describe or --lesson ID --voice WAV --out WAV --receipt JSON [--timing JSON]',
  );
if (values.describe) console.log(JSON.stringify(courseBedPolicy(values.lesson, values.source)));
else await writeFile(values.receipt, JSON.stringify(await mixCourseBed(values), null, 2) + '\n');
