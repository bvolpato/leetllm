#!/usr/bin/env node
// Set the cues of one scene of a rebuilt lesson from a list. The sentences and the holds stay.
//
//   node tools/stage-cues.mjs ID --scene mass                  print the beats and the cues of the scene, as a list
//   node tools/stage-cues.mjs ID --scene mass --set cues.txt   replace the cues of the scene with the list
//   node tools/stage-cues.mjs ID --drop-motion-checks          delete the motion_check blocks of the old film
//
// A list has one line for each cue: `beat|id|phrase`. The beat is its index in the scene, from 0.
// A line that starts with `#` is a comment. A cue that keeps its id keeps its targets, its color
// and its linger. A new cue gets the target `picture`. The tool writes only
// the stage lesson script, and only when the new file is valid. See stage-lessons/REBUILD.md.
import { readFile, writeFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { parse } from 'yaml';
import { validateVisualCues } from '../lib/narration-cues.mjs';
import { parseArguments, rebuildScript } from './lib/stage-rebuild.mjs';

const SCENE = /^ {2}- id:\s*["']?([a-z][a-z0-9-]*)["']?\s*$/;
const BEAT = /^ {6}- /;
const indent = (line) => line.length - line.trimStart().length;

/** The lines of one scene: `[from, to)`. */
function sceneLines(lines, id) {
  const from = lines.findIndex((line) => SCENE.exec(line)?.[1] === id);
  if (from < 0) {
    const ids = lines.map((line) => SCENE.exec(line)?.[1]).filter(Boolean);
    throw new Error(`The lesson file has no scene ${id}. Its scenes are: ${ids.join(', ')}`);
  }
  let to = from + 1;
  while (to < lines.length && !SCENE.test(lines[to]) && !/^\S/.test(lines[to])) to++;
  return [from, to];
}

/** The first line of each beat between two lines, and the line after the last beat. */
function beatStarts(lines, from, to) {
  const starts = [];
  for (let i = from; i < to; i++) if (BEAT.test(lines[i])) starts.push(i);
  let end = to;
  while (end > from && !lines[end - 1].trim()) end--;
  return [...starts, end];
}

/** Take a block of one key out of a beat, such as `visual_cues`: its line and the deeper lines after it. */
function withoutKey(block, key) {
  const kept = [];
  for (let i = 0; i < block.length; i++) {
    if (!block[i].startsWith(`        ${key}:`)) {
      kept.push(block[i]);
      continue;
    }
    while (i + 1 < block.length && block[i + 1].trim() && indent(block[i + 1]) >= 10) i++;
  }
  return kept;
}

/** A lesson with some keys of its beats taken out, to compare two files. */
function without(lesson, drop) {
  return {
    ...lesson,
    scenes: lesson.scenes.map((scene) => ({
      ...scene,
      beats: scene.beats.map((beat) =>
        Object.fromEntries(Object.entries(beat).filter(([key]) => !drop(scene.id, key))),
      ),
    })),
  };
}

function readList(text) {
  return text
    .split('\n')
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line && !line.startsWith('#'))
    .map(({ line, number }) => {
      const [beat, id, ...rest] = line.split('|');
      const phrase = rest.join('|').trim();
      if (!/^\d+$/.test(beat.trim()) || !id?.trim() || !phrase)
        throw new Error(`Line ${number} of the list is not beat|id|phrase: ${line}`);
      return { beat: Number(beat), id: id.trim(), phrase, number };
    });
}

function cueLines(cue, old) {
  const lines = [
    `          - id: ${cue.id}`,
    `            phrase: ${JSON.stringify(cue.phrase)}`,
    '            targets:',
  ];
  for (const target of old?.targets ?? ['picture']) lines.push(`              - ${target}`);
  if (old?.color !== undefined)
    lines.push(
      `            color: ${/^[a-z]+$/.test(old.color) ? old.color : JSON.stringify(old.color)}`,
    );
  if (old?.linger !== undefined) lines.push(`            linger: ${old.linger}`);
  return lines;
}

async function main() {
  const { id, options } = parseArguments(process.argv.slice(2), {
    values: ['--scene', '--set'],
    flags: ['--drop-motion-checks'],
  });
  const file = rebuildScript(id);
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  const before = parse(text);

  if (options['drop-motion-checks']) {
    const kept = [];
    let dropped = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('        motion_check:')) {
        kept.push(lines[i]);
        continue;
      }
      dropped++;
      while (i + 1 < lines.length && lines[i + 1].trim() && indent(lines[i + 1]) >= 10) i++;
    }
    const after = parse(kept.join('\n'));
    const same = (lesson) => without(lesson, (_, key) => key === 'motion_check');
    if (!isDeepStrictEqual(same(before), same(after)))
      throw new Error(
        'The file would change in more than its motion_check blocks. Nothing is written.',
      );
    if (dropped) await writeFile(file, kept.join('\n'));
    console.log(`[${id}] ${dropped} motion_check block(s) deleted`);
    return;
  }

  if (!options.scene) throw new Error('Give a scene: --scene ID');
  const [from, to] = sceneLines(lines, options.scene);
  const scene = before.scenes.find((entry) => entry.id === options.scene);
  if (!options.set) {
    console.log(
      `# ${id} / ${scene.id}: ${scene.beats.length} beat(s). One line for each cue: beat|id|phrase`,
    );
    for (const [index, beat] of scene.beats.entries()) {
      console.log(`# beat ${index}: ${beat.say}`);
      for (const cue of beat.visual_cues ?? []) console.log(`${index}|${cue.id}|${cue.phrase}`);
    }
    return;
  }

  const list = readList(await readFile(options.set, 'utf8'));
  const late = list.find((cue) => cue.beat >= scene.beats.length);
  if (late)
    throw new Error(
      `Line ${late.number} of the list names beat ${late.beat}, and ${scene.id} has ${scene.beats.length} beat(s)`,
    );
  const old = new Map(
    scene.beats.flatMap((beat) => beat.visual_cues ?? []).map((cue) => [cue.id, cue]),
  );
  const starts = beatStarts(lines, from, to);
  if (starts.length - 1 !== scene.beats.length)
    throw new Error(
      `${scene.id}: the lines of the file do not have the layout of a lesson file of the course`,
    );
  const rebuilt = lines.slice(from, starts[0]);
  for (let index = 0; index + 1 < starts.length; index++) {
    rebuilt.push(...withoutKey(lines.slice(starts[index], starts[index + 1]), 'visual_cues'));
    const cues = list.filter((cue) => cue.beat === index);
    if (cues.length)
      rebuilt.push(
        '        visual_cues:',
        ...cues.flatMap((cue) => cueLines(cue, old.get(cue.id))),
      );
  }
  const next = [...lines.slice(0, from), ...rebuilt, ...lines.slice(starts.at(-1))].join('\n');

  // The new file is written only when it is a valid lesson with the same sentences and holds.
  const after = parse(next);
  const same = (lesson) =>
    without(lesson, (sceneId, key) => sceneId === scene.id && key === 'visual_cues');
  if (!isDeepStrictEqual(same(before), same(after)))
    throw new Error(
      'The file would change in more than the cues of the scene. Nothing is written.',
    );
  validateVisualCues(after.scenes.find((entry) => entry.id === scene.id));
  await writeFile(file, next);
  const gone = [...old.keys()].filter((cue) => !list.some((entry) => entry.id === cue));
  console.log(
    `[${id}] ${scene.id}: ${list.length} cue(s) in ${new Set(list.map((cue) => cue.beat)).size} beat(s), ${old.size} before`,
  );
  if (gone.length)
    console.log(
      `[${id}] cue ids that are gone: ${gone.join(', ')}. A scene file that uses one of them stops the compile.`,
    );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
