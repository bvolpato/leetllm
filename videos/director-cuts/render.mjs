import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, realpath, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const directory = dirname(fileURLToPath(import.meta.url));
const videos = dirname(directory);
const cuts = JSON.parse(await readFile(join(directory, 'cuts.json'), 'utf8'));
const { values, positionals } = parseArgs({
  options: { out: { type: 'string' }, master: { type: 'string' } },
  allowPositionals: true,
});
const [id] = positionals;
if (positionals.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !values.out) {
  throw new Error('Usage: node render.mjs <lesson-id> --out <cut.mp4> [--master <study.mp4>]');
}
const cut = Object.hasOwn(cuts, id) ? cuts[id] : undefined;
if (!cut && values.master !== undefined)
  throw new Error(`Only ${Object.keys(cuts).join(', ')} accept --master.`);
if (cut && !values.master && !cut.introOnly) {
  throw new Error(
    `This cut retains footage from ${cut.master}. Supply that edition with --master.`,
  );
}
const output = resolve(values.out);
let master;
if (values.master) {
  master = await realpath(values.master);
  if (output === master || (await realpath(output).catch(() => undefined)) === master) {
    throw new Error('Choose a different output path from the source movie.');
  }
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(master)) hash.update(chunk);
  if (hash.digest('hex') !== cut.sha256) {
    throw new Error(`The input must match the SHA-256 of ${cut.master} in cuts.json.`);
  }
}
await mkdir(dirname(output), { recursive: true });
const scratch = await mkdtemp(join(dirname(output), '.director-cut-'));
try {
  if (cut && !master) {
    execFileSync(
      process.execPath,
      [join(videos, 'render.mjs'), '--intro-only', '--output', scratch],
      { cwd: videos, stdio: 'inherit' },
    );
    master = join(scratch, 'brand', 'leetllm-intro.mp4');
  }
  const staged = join(scratch, 'cut.mp4');
  if (cut) {
    execFileSync(process.execPath, [join(directory, id, 'build.mjs')], {
      cwd: scratch,
      stdio: 'inherit',
      env: {
        ...process.env,
        DIRECTOR_MASTER: master,
        DIRECTOR_OUTPUT: staged,
        DIRECTOR_WORK: scratch,
        COURSE_VIDEOS: videos,
      },
    });
  } else {
    const { renderLesson } = await import('./lesson-runtime/render.mjs');
    await renderLesson(id, scratch, staged);
  }
  await rename(staged, output);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
