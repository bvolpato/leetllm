import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const required = ['COURSE_VIDEOS', 'DIRECTOR_WORK', 'DIRECTOR_MASTER', 'DIRECTOR_OUTPUT'];
for (const key of required) if (!process.env[key]) throw Error('Set ' + key + ' before rendering.');
await mkdir(process.env.DIRECTOR_WORK, { recursive: true });
for (const file of ['prepare.mjs', 'picture.mjs', 'finish.mjs']) {
  execFileSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], {
    stdio: 'inherit',
  });
}
