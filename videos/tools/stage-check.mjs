#!/usr/bin/env node
// Compile a rebuilt lesson and check its film. No speech and no render.
//
//   node tools/stage-check.mjs ID                    the whole lesson
//   node tools/stage-check.mjs ID --scene mass,loss  a draft of some scenes, which is faster
//   node tools/stage-check.mjs ID --no-motion        the moments at rest only
//
// It runs the two gates of the course (a declared cue that drives nothing, a film that runs past
// its narration), the film check of Vizmatic at rest and in every frame with --text-gap 0.3, and
// two checks that the library does not have yet: small text and empty space. It does not run the
// coverage gate of the course. It writes no file. See stage-lessons/REBUILD.md.
import { Resvg } from '@resvg/resvg-js';
import { checkFilm } from 'vizmatic/stage';
import { largestEmptyShare } from '../audit-stage-space.mjs';
import { MIN_TEXT_SIZE } from '../stage-lessons/kit-narrated.mjs';
import { compileRebuild, parseArguments, restMoments, sceneAt } from './lib/stage-rebuild.mjs';

const TEXT_GAP = 0.3;

/** The scale from the units of a node to the pixels of the frame, from one glyph. */
function drawnScale(own, drawn) {
  const from = own[0]?.p,
    to = drawn[0]?.p;
  if (!from || !to || from.length < 2 || to.length < 2) return 0;
  let before = 0,
    after = 0;
  for (let r = 0; r < own.length && r < drawn.length; r++) {
    const p = own[r].p,
      q = drawn[r].p;
    for (let i = 0; i + 1 < p.length && i + 1 < q.length; i += 2) {
      before += (p[i] - from[0]) ** 2 + (p[i + 1] - from[1]) ** 2;
      after += (q[i] - to[0]) ** 2 + (q[i + 1] - to[1]) ** 2;
    }
  }
  return before > 0 ? Math.sqrt(after / before) : 0;
}

/** Each text that is smaller than the least size of the course, at the moments at rest. */
// LIBRARY: the check rule for small text. Remove this when `checkFilm` has it.
function smallText(compiled, times) {
  const found = new Map();
  for (const time of times) {
    const seen = new Set();
    for (const op of compiled.frame(time).ops) {
      const block = op.node?.parent;
      if (op.kind !== 'path' || op.node.data?.key === undefined || !block || seen.has(block))
        continue;
      if (typeof block.source !== 'string' || typeof block.data?.size !== 'number') continue;
      if ((op.fillAlpha ?? 0) < 0.5) continue;
      seen.add(block);
      const size = block.data.size * drawnScale(op.node.get('path') ?? [], op.path);
      if (size > 0 && size < MIN_TEXT_SIZE - 0.05 && !found.has(block))
        found.set(block, {
          severity: 'warning',
          code: 'course.text_small',
          time,
          until: time,
          message: `Text ${JSON.stringify(block.source)} is ${size.toFixed(1)} px. The least size is ${MIN_TEXT_SIZE} px.`,
        });
    }
  }
  return [...found.values()];
}

const GRID = { columns: 16, rows: 9, cell: 20 };

function emptyShareAt(compiled, time) {
  const image = new Resvg(compiled.svg(time), {
    fitTo: { mode: 'width', value: GRID.columns * GRID.cell },
    font: { loadSystemFonts: false },
  }).render();
  const pixels = image.pixels,
    counts = new Array(GRID.columns * GRID.rows).fill(0);
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      const i = (y * image.width + x) * 4;
      const gray = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      if (gray >= 40)
        counts[
          Math.min(GRID.rows - 1, Math.floor(y / GRID.cell)) * GRID.columns +
            Math.min(GRID.columns - 1, Math.floor(x / GRID.cell))
        ]++;
    }
  return largestEmptyShare(counts.map((count) => count >= 2));
}

/** Each span of 2 seconds or more in which one empty rectangle covers over 40% of the frame. */
// LIBRARY: the check rule for empty space. Remove this when `checkFilm` has it. It is the rule of
// audit-stage-space.mjs, on estimated timing.
function emptySpace(compiled, windows) {
  const found = [];
  for (const window of windows.filter((entry) => entry.built)) {
    let run = null;
    const flush = () => {
      if (run && run.to - run.from >= 2)
        found.push({
          severity: 'warning',
          code: 'course.space_empty',
          time: run.from,
          until: run.to,
          message: `One empty rectangle covers up to ${(run.peak * 100).toFixed(0)}% of the frame. The limit is 40% for 2 seconds.`,
        });
      run = null;
    };
    for (let time = window.from + 0.6; time < window.to - 0.6; time += 0.5) {
      const share = emptyShareAt(compiled, time);
      if (share <= 0.4) flush();
      else if (run) {
        run.to = time;
        run.peak = Math.max(run.peak, share);
      } else run = { from: time, to: time, peak: share };
    }
    flush();
  }
  return found;
}

async function main() {
  const { id, options } = parseArguments(process.argv.slice(2), {
    values: ['--scene', '--timeline'],
    flags: ['--no-motion', '--no-space'],
  });
  const started = performance.now();
  const build = await compileRebuild(id, { scenes: options.scene, timelineFile: options.timeline });
  const { compiled, windows, timeline, pending, built, changes, motionChecks } = build;
  const say = (line) => console.log(`[${id}] ${line}`);
  say(
    `compiled ${built.length} of ${windows.length} scenes, ${compiled.duration.toFixed(1)} s on ${options.timeline ? 'recorded' : 'estimated'} timing, in ${((performance.now() - started) / 1000).toFixed(1)} s`,
  );
  if (pending.length) say(`not rebuilt yet: ${pending.join(', ')}`);
  say(`narration: ${changes.length} change(s) from videos/lessons/${id}.lesson.yaml`);
  for (const change of changes)
    console.log(`  ${change.where}\n    old: ${change.old}\n    new: ${change.new}`);
  if (motionChecks.length)
    say(
      `lesson.yaml keeps ${motionChecks.length} motion_check block(s) of the old film (${motionChecks.join(', ')}). Delete them: node tools/stage-cues.mjs ${id} --drop-motion-checks`,
    );

  // A finding counts when it is in a scene that is built. An empty frame counts for its part there.
  const inBuilt = (finding) => {
    if (finding.code !== 'film.blank') return sceneAt(windows, finding.time).window.built;
    const shared = windows
      .filter((window) => window.built)
      .map(
        (window) => Math.min(finding.until, window.to - 0.3) - Math.max(finding.time, window.from),
      );
    return shared.some((seconds) => seconds >= 0.2);
  };
  const seen = new Set();
  let errors = 0,
    warnings = 0;
  const report = (title, findings) => {
    const fresh = findings.filter(inBuilt).filter((finding) => {
      const key = `${finding.code}|${finding.message}`;
      return seen.has(key) ? false : seen.add(key);
    });
    say(`${title}: ${fresh.length} finding(s)`);
    for (const finding of fresh.sort((a, b) => a.time - b.time)) {
      const { window, seconds } = sceneAt(windows, finding.time);
      const until =
        finding.until > finding.time ? ` to ${(finding.until - window.from).toFixed(2)}` : '';
      const repeats = finding.motion?.spans > 1 ? `, ${finding.motion.spans} times` : '';
      console.log(
        `  ${window.id} ${seconds.toFixed(2)}${until} s (film ${finding.time.toFixed(2)} s${repeats}) ${finding.severity} ${finding.code}: ${finding.message}`,
      );
      if (finding.severity === 'error') errors++;
      else warnings++;
    }
  };

  const times = restMoments(timeline, windows);
  const rest = await checkFilm(compiled, { times, textGap: TEXT_GAP });
  report(`film check at rest, ${times.length} moments`, rest.diagnostics);
  if (!options['no-motion']) {
    const motion = await checkFilm(compiled, { motion: true, textGap: TEXT_GAP });
    report(`film check in motion, ${motion.frames ?? 0} frames`, motion.diagnostics);
  }
  report('small text', smallText(compiled, times));
  if (!options['no-space']) report('empty space', emptySpace(compiled, windows));

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  say(
    `${errors} error(s), ${warnings} warning(s), ${pending.length} scene(s) not rebuilt, in ${seconds} s`,
  );
  if (errors || (pending.length && !options.scene)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
