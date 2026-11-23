import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const usage =
  'node videos/full-directors/review-splice.mjs MASTER OPENER --start FRAME --resume FRAME [--vizmatic-build DIRECTORY]';

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      start: { type: 'string' },
      resume: { type: 'string' },
      'vizmatic-build': { type: 'string' },
    },
  });
  const frames = [values.start, values.resume];
  if (positionals.length !== 2 || frames.some((v) => !/^\d+$/u.test(v ?? ''))) {
    throw new Error(usage);
  }
  const [master, opener] = positionals.map((file) => resolve(file));
  const total = Number(
    execFileSync(
      'ffprobe',
      [
        '-v', 'error',
        '-f', 'mov',
        '-protocol_whitelist', 'file',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=nb_frames',
        '-of', 'csv=p=0',
        master,
      ],
      { encoding: 'utf8' },
    ).trim(),
  );
  const [start, resume] = frames.map(Number);
  if (![start, resume, total].every(Number.isSafeInteger) || start >= resume || resume >= total) {
    throw new Error('Expected 0 <= start < resume < total.');
  }
  const entry = values['vizmatic-build']
    ? pathToFileURL(resolve(values['vizmatic-build'], 'dist/index.js')).href
    : 'vizmatic';
  const vizmatic = await import(entry);
  if (typeof vizmatic.planAvcSplice !== 'function') {
    throw new Error('Supply --vizmatic-build with a build that exports planAvcSplice.');
  }
  const segments = [
    ...(start ? [{ path: master, startFrame: 0, endFrame: start }] : []),
    { path: opener, startFrame: 0, endFrame: resume - start },
    { path: master, startFrame: resume, endFrame: total },
  ];
  const { frameCount, concatScript } = await vizmatic.planAvcSplice(segments);
  if (frameCount !== total) throw new Error('The splice changed the master frame count.');
  console.log(JSON.stringify({ frameCount, segments, concatScript }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
