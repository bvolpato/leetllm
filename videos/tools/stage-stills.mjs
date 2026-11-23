#!/usr/bin/env node
// Full-size stills of a rebuilt lesson, on estimated or recorded timing. No new speech and no movie.
//
//   node tools/stage-stills.mjs ID                              the end of each beat, and each cue
//   node tools/stage-stills.mjs ID --scene mass                 one scene, in a few seconds
//   node tools/stage-stills.mjs ID --scene mass --before        also the moment before each cue
//   node tools/stage-stills.mjs ID --scene mass --cue mass-raise --frames 8   frames inside one move
//   node tools/stage-stills.mjs ID --scene mass --at 3.5,4.25   seconds from the start of the scene
//   node tools/stage-stills.mjs ID --scene mass --sheet         one contact sheet of the scene, to find where to look
//
// The stills go to /tmp/leetllm-rebuild/ID/stills/NN-scene/, 1920 by 1080. A file name starts with
// the seconds from the start of its scene, so the files sort by time. `index.txt` in each folder
// lists the beats, the cues and the stills. A run replaces the folder of each scene that it builds.
// The frames of `--cue` and `--at` have a folder of their own inside it, `move-CUE` and `at`, which
// each such run replaces. A sheet goes to /tmp/leetllm-rebuild/ID/sheets/NN-scene.png. A run touches
// no other file, so two lessons can run at one time. See stage-lessons/REBUILD.md.
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderFilmFrames, renderFilmSheet } from 'vizmatic/stage/export';
import { compileRebuild, parseArguments, scratchFolder } from './lib/stage-rebuild.mjs';

/** A cue is settled this long after its phrase: a result fades in for 0.3 seconds after it. */
const SETTLE = 0.5;
/** The moment before a cue: the change of a cue starts 0.1 seconds before its phrase. */
const BEFORE = 0.15;
/**
 * The end of a beat is read this long before the next beat. A change on the first words of the
 * next beat starts 0.1 seconds before them, and it must not be in the still as a faint mark.
 */
const REST = 0.12;
const stamp = (seconds) => seconds.toFixed(2).padStart(6, '0');

/** The stills of one scene: `{ seconds, name }`, with seconds from the start of the scene. */
function sceneStills(scene, options) {
  const cues = [...(scene.visualCues ?? [])].sort((a, b) => a.start - b.start);
  if (options.at)
    return options.at.split(',').map((value) => ({ seconds: Number(value), name: 'at' }));
  if (options.cue) {
    const cue = cues.find((entry) => entry.id === options.cue);
    if (!cue)
      throw new Error(
        `${scene.id}: no cue ${options.cue}. Its cues are: ${cues.map((entry) => entry.id).join(', ')}`,
      );
    const count = Math.max(2, Number(options.frames ?? 8));
    const from = cue.start - 0.1,
      to = cue.end + SETTLE;
    return Array.from({ length: count }, (_, index) => ({
      seconds: from + ((to - from) * index) / (count - 1),
      name: `move-${cue.id}`,
    }));
  }
  const stills = scene.beats.map((beat, index) => ({
    seconds: beat.until - REST,
    name: `beat-${index}-end`,
  }));
  for (const cue of cues) {
    const beat = scene.beats[cue.beat] ?? scene.beats.at(-1);
    // A cue is read when it is settled: a result waits for the end of its phrase, and then fades in.
    const settled = Math.min(cue.end + SETTLE, beat.until - REST);
    stills.push({ seconds: settled, name: `cue-${cue.id}` });
    if (options.before) stills.push({ seconds: cue.start - BEFORE, name: `before-${cue.id}` });
  }
  // Two stills of one moment are one picture: keep the first, which is the end of a beat.
  const kept = [];
  for (const still of stills.sort(
    (a, b) => a.seconds - b.seconds || a.name.localeCompare(b.name),
  )) {
    const twin = kept.find((other) => Math.abs(other.seconds - still.seconds) < 0.1);
    if (twin) twin.name = twin.name.startsWith('beat') ? twin.name : still.name;
    else kept.push(still);
  }
  return kept;
}

function sceneIndex(scene, stills, timing) {
  const lines = [
    `${scene.id}: ${scene.duration.toFixed(2)} s on ${timing} timing. Times are seconds from the start of the scene.`,
    '',
  ];
  for (const [index, beat] of scene.beats.entries()) {
    lines.push(
      `beat ${index}: voice ${beat.start.toFixed(2)} to ${beat.end.toFixed(2)}, hold to ${beat.until.toFixed(2)}`,
    );
    lines.push(`  "${beat.say}"`);
    for (const cue of (scene.visualCues ?? []).filter((entry) => entry.beat === index))
      lines.push(
        `  cue ${cue.id}: ${cue.start.toFixed(2)} to ${cue.end.toFixed(2)}  "${cue.phrase}"`,
      );
  }
  lines.push('', 'stills:', ...stills.map((still) => `  ${still.file}`));
  return `${lines.join('\n')}\n`;
}

async function main() {
  const { id, options } = parseArguments(process.argv.slice(2), {
    values: ['--scene', '--cue', '--frames', '--at', '--out', '--width', '--timeline'],
    flags: ['--before', '--sheet'],
  });
  if ((options.cue || options.at) && (!options.scene || options.scene.includes(',')))
    throw new Error('--cue and --at need one scene: --scene ID');
  const started = performance.now();
  const { compiled, timeline, windows, pending } = await compileRebuild(id, {
    scenes: options.scene,
    timelineFile: options.timeline,
  });
  const out = options.out ?? join(scratchFolder(id), 'stills');
  const width = Number(options.width ?? 1920);
  const partial = Boolean(options.cue || options.at);
  const built = windows.filter((entry) => entry.built);
  if (!built.length)
    throw new Error(`${id}: no scene to draw. Not rebuilt yet: ${pending.join(', ')}`);
  const numbered = (window) => `${String(window.index + 1).padStart(2, '0')}-${window.id}`;

  if (options.sheet) {
    // A sheet has the moments of the stills of a scene as small tiles, with the time of the film under each.
    const sheets = options.out ?? join(scratchFolder(id), 'sheets');
    await mkdir(sheets, { recursive: true });
    for (const window of built) {
      const scene = timeline.scenes[window.index];
      const moments = sceneStills(scene, options);
      const file = join(sheets, `${numbered(window)}.png`);
      await renderFilmSheet(
        compiled,
        moments.map(
          (still) => window.from + Math.min(Math.max(still.seconds, 0), scene.duration - 0.01),
        ),
        file,
        { width: 480, columns: 4, workers: 4 },
      );
      console.log(`[${id}] ${scene.id}: ${moments.length} tile(s) in ${file}`);
      console.log(
        `  ${moments.map((still) => `${stamp(still.seconds)} ${still.name}`).join(' · ')}`,
      );
    }
    console.log(
      `[${id}] ${built.length} sheet(s) in ${((performance.now() - started) / 1000).toFixed(1)} s. A sheet shows where to look. Judge a layout on a still at full size.`,
    );
    return;
  }

  const jobs = [];
  for (const window of built) {
    const scene = timeline.scenes[window.index];
    // The frames of one move, and the stills at given times, have a folder of their own in the folder of the scene.
    const folder = join(
      out,
      numbered(window),
      options.cue ? `move-${options.cue}` : options.at ? 'at' : '',
    );
    await rm(folder, { recursive: true, force: true });
    await mkdir(folder, { recursive: true });
    const stills = sceneStills(scene, options).map((still) => {
      const seconds = Math.min(Math.max(still.seconds, 0), scene.duration - 0.01);
      return {
        time: window.from + seconds,
        file: join(folder, `${stamp(seconds)}-${still.name}.png`),
      };
    });
    jobs.push({ scene, folder, stills });
  }
  const all = jobs.flatMap((job) => job.stills);
  const prefix = join(out, `.frame-${process.pid}-`);
  const files = await renderFilmFrames(
    compiled,
    all.map((still) => still.time),
    prefix,
    { width, workers: 4 },
  );
  await Promise.all(files.map((file, index) => rename(file, all[index].file)));
  if (!partial)
    for (const job of jobs)
      await writeFile(
        join(job.folder, 'index.txt'),
        sceneIndex(job.scene, job.stills, options.timeline ? 'recorded' : 'estimated'),
      );
  for (const job of jobs)
    console.log(`[${id}] ${job.scene.id}: ${job.stills.length} still(s) in ${job.folder}`);
  if (partial) for (const still of all) console.log(`  ${still.file}`);
  console.log(
    `[${id}] ${all.length} still(s), ${width} px wide, in ${((performance.now() - started) / 1000).toFixed(1)} s`,
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
