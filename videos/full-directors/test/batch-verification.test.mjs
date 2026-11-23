import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const source = fileURLToPath(new URL('../../', import.meta.url));

test('an incomplete version check retries only verification and never publishes changed inputs or bytes', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'batch-postflight-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const videos = join(root, 'videos'),
    directors = join(videos, 'full-directors'),
    bin = join(root, 'bin');
  const lessonDir = join(directors, 'lessons/example'),
    catalog = join(videos, 'collections');
  for (const dir of [lessonDir, bin, catalog]) await mkdir(dir, { recursive: true });
  await cp(join(source, 'lib'), join(videos, 'lib'), { recursive: true });
  await cp(join(source, 'full-directors/batch.mjs'), join(directors, 'batch.mjs'));
  await symlink(join(source, 'node_modules'), join(videos, 'node_modules'), 'dir');
  await writeFile(
    join(catalog, 'complete-curriculum.json'),
    JSON.stringify({
      version: 1,
      id: 'test',
      title: 'Test',
      lessons: [{ id: 'example', title: 'Example', group: 'Test', source: 'example/content.md' }],
    }),
  );
  const film = join(lessonDir, 'film.mjs');
  await writeFile(film, 'export default {};');
  const adapters = join(videos, 'adapters');
  const adapter = join(adapters, 'voice.py');
  await mkdir(adapters);
  await writeFile(adapter, 'voice = 1\n');
  await writeFile(join(directors, 'check.mjs'), '');
  await writeFile(
    join(directors, 'render.mjs'),
    `
    import {appendFileSync,writeFileSync} from 'node:fs';
    writeFileSync(process.argv[process.argv.indexOf('--out')+1], 'checked movie');
    appendFileSync(process.env.RENDERS, 'render\\n');
    writeFileSync(process.env.MODE, 'unavailable');
  `,
  );
  for (const name of ['uv', 'ffmpeg', 'ffprobe']) {
    await writeFile(
      join(bin, name),
      `#!/bin/sh
if [ "${name}" = ffprobe ]; then
  mode=$(cat "$MODE")
  case "$mode" in
    unavailable) exit 1 ;;
    changed) echo changed; exit 0 ;;
    once) echo ok > "$MODE"; exit 1 ;;
  esac
fi
echo "${name} stable"
`,
      { mode: 0o755 },
    );
  }
  const mode = join(root, 'mode'),
    renders = join(root, 'runs');
  const setMode = (value) => writeFile(mode, value);
  const cli = (out, ...args) =>
    exec(process.execPath, [join(directors, 'batch.mjs'), '--out', out, ...args, 'example'], {
      env: { ...process.env, PATH: bin + ':' + process.env.PATH, MODE: mode, RENDERS: renders },
    });
  const out = join(root, 'out'),
    movie = join(out, '001-example.mp4'),
    pending = join(out, '.full-directors/pending-example');
  const absent = (path) => assert.rejects(stat(path), { code: 'ENOENT' });
  await setMode('ok');
  await assert.rejects(cli(out, '--verify-only'), /No checked export to verify/);
  await absent(renders);
  await setMode('unavailable');
  await assert.rejects(cli(out), /Could not verify runtime versions: ffprobe/);
  await absent(renders);
  await setMode('once');
  await assert.rejects(cli(out), /Could not verify runtime versions: ffprobe/);
  await absent(movie);
  const checked = join(pending, 'movie.mp4');
  assert.equal(await readFile(checked, 'utf8'), 'checked movie');
  const unavailable = JSON.parse(await readFile(join(pending, 'unavailable.json'), 'utf8'));
  assert.equal(unavailable.runtime.ffprobe, null);
  assert.match(unavailable.source, /^[0-9a-f]{64}$/);
  assert.deepEqual(await readdir(join(out, '.full-directors')), ['pending-example']);
  await setMode('ok');
  await writeFile(checked, 'modified');
  await assert.rejects(cli(out), /Pending movie or verification record changed/);
  await absent(movie);
  await writeFile(checked, 'checked movie');
  const changedOut = join(root, 'changed'),
    changedMovie = join(changedOut, '001-example.mp4');
  await cp(out, changedOut, { recursive: true });
  await setMode('changed');
  await assert.rejects(cli(changedOut), /ffprobe.*stable.*changed/);
  await setMode('ok');
  await assert.rejects(cli(changedOut), /Source changed during export/);
  await absent(changedMovie);
  const changedFiles = join(root, 'changed-files');
  await cp(out, changedFiles, { recursive: true });
  await writeFile(film, 'export default {changed:true};');
  await assert.rejects(cli(changedFiles), /lessons\/example\/film\.mjs/);
  await writeFile(film, 'export default {};');
  await assert.rejects(cli(changedFiles), /Source changed during export/);
  const changedAdapter = join(root, 'changed-adapter');
  await cp(out, changedAdapter, { recursive: true });
  await writeFile(adapter, 'voice = 2\n');
  await assert.rejects(cli(changedAdapter, '--verify-only'), /adapters\/voice\.py/);
  await writeFile(adapter, 'voice = 1\n');
  const cache = join(adapters, '__pycache__', 'voice.cpython-312.pyc');
  await mkdir(join(adapters, '__pycache__'));
  await writeFile(cache, 'first cache');
  await setMode('once');
  assert.match((await cli(out, '--verify-only')).stdout, /Finished 001-example/);
  assert.equal(await readFile(movie, 'utf8'), 'checked movie');
  await absent(pending);
  await writeFile(cache, 'regenerated cache');
  assert.match((await cli(out)).stdout, /Verified existing 001-example/);
  assert.equal(await readFile(renders, 'utf8'), 'render\n');
});
