import { createHash } from 'node:crypto';
import { link, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

async function applyCorrection(input, output) {
  const { editions } = JSON.parse(
    await readFile(new URL('./selected-editions.json', import.meta.url), 'utf8'),
  );
  const movie = await readFile(input);
  const originalSha256 = sha256(movie);
  const edition = editions.find(
    (entry) => entry.audioCorrection?.originalSha256 === originalSha256,
  );
  if (!edition) throw new Error(`No audio correction matches input SHA-256 ${originalSha256}.`);

  for (const { offset, before, after } of edition.audioCorrection.bytes) {
    if (movie[offset] !== before) throw new Error(`Unexpected byte at offset ${offset}.`);
    movie[offset] = after;
  }
  if (sha256(movie) !== edition.movieSha256)
    throw new Error('The corrected movie SHA-256 does not match the selected edition.');

  const temporary = await mkdtemp(join(dirname(output), '.audio-correction-'));
  try {
    const complete = join(temporary, 'movie.mp4');
    await writeFile(complete, movie);
    await link(complete, output);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  console.log(`${edition.movieSha256}  ${output}`);
}

try {
  if (process.argv.length !== 4)
    throw new Error('Usage: node apply-audio-correction.mjs <original.mp4> <corrected.mp4>');
  await applyCorrection(process.argv[2], process.argv[3]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
