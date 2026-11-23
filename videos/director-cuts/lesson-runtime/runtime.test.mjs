import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { filmText } from './sound.mjs';
import { buildTimeline } from './timeline.mjs';

test('a measured picture cue can follow a repeated word without cutting its caption', () => {
  const film = {
    title: 'Two results',
    beats: [{ id: 'pair', say: 'One then one more.', hold: 0 }],
  };
  const measured = (second) => [
    {
      duration: 2,
      words: [
        { text: 'One', start: 0.1, end: 0.3 },
        { text: 'then', start: 0.4, end: 0.5 },
        { text: 'one', start: second, end: second + 0.2 },
        { text: 'more.', start: 1.6, end: 1.9 },
      ],
    },
  ];
  for (const second of [0.9, 1.303]) {
    const take = measured(second);
    const expected = buildTimeline(film, take);
    expected.clockAtFrame(0).reveal('then', 0);
    const subtitles = filmText(film, expected.schedule).subtitles;
    assert.match(subtitles, /\nthen one more\./);
    const timeline = buildTimeline(film, take);
    const events = [];
    const clockAt = (frame) => timeline.clockAtFrame(frame, (...event) => events.push(event));
    const first = clockAt(0);
    const words = first.wordCue('one more');
    assert.deepEqual(words, { start: second, end: 1.9 });
    assert.throws(() => first.wordCue('one'), /2 times/);
    assert.throws(() => first.wordCue('absent'), /never says/);
    assert.equal(timeline.schedule[0].cueWordIndices.size, 0);
    const onset = Math.ceil(second * 30);
    assert.equal(clockAt(onset - 1).reveal('one more', 0, { captionStart: false }), 0);
    assert.equal(timeline.schedule[0].cueWordIndices.size, 0);
    assert.throws(() => first.reveal('one more', 0, { captionStart: 'one' }), /2 times/);
    assert.throws(() => first.reveal('one more', 0, { captionStart: 'absent' }), /never says/);
    assert.equal(clockAt(onset).reveal('one more', 0, { captionStart: 'then' }), 1);
    assert.deepEqual(events, [
      [second, 0],
      [second, 0],
    ]);
    assert.equal(filmText(film, timeline.schedule).subtitles, subtitles);
    first.reveal('one more', 0);
    assert.deepEqual([...timeline.schedule[0].cueWordIndices], [1, 2]);
    first.reveal('one', 0);
    assert.deepEqual([...timeline.schedule[0].cueWordIndices], [1, 2, 0]);
    const reverse = buildTimeline(film, take);
    const reverseClock = reverse.clockAtFrame(0);
    reverseClock.reveal('one more', 0);
    assert.deepEqual(reverseClock.wordCue('one more'), words);
    assert.deepEqual([...reverse.schedule[0].cueWordIndices], [2]);
  }
});

test('an explicit caption anchor selects the measured decimal word even at a tied onset', () => {
  const text = ['Read', '1', '2', 'then', '1.2', 'carefully.'];
  const film = { title: 'Decimals', beats: [{ id: 'decimal', say: text.join(' '), hold: 0 }] };
  const words = text.map((text, i) => ({
    text,
    start: [0, 0.4, 0.8, 1.6, 1.6, 2][i],
    end: (i + 1) * 0.4,
  }));
  const timeline = buildTimeline(film, [{ duration: 2.5, words }]);
  const clock = timeline.clockAtFrame(0);
  assert.equal(clock.wordCue('1.2').start, 1.6);
  clock.reveal('carefully', 0, { captionStart: '1.2' });
  assert.deepEqual([...timeline.schedule[0].cueWordIndices], [4]);
  const { subtitles } = filmText(film, timeline.schedule);
  assert.match(subtitles, /\nRead 1 2 then\n/);
  assert.match(subtitles, /\n1\.2 carefully\./);
});

test('a brief stranded determiner joins the revealed caption at its measured start', () => {
  const words = [
    { text: 'The', start: 0.575, end: 0.65 },
    { text: 'report', start: 0.65, end: 0.95 },
    { text: 'says', start: 0.95, end: 1.05 },
    { text: 'C', start: 1.05, end: 1.1 },
    { text: 'seventeen', start: 1.1, end: 1.4 },
    { text: 'passed.', start: 1.4, end: 1.7 },
    { text: 'Its', start: 2.17, end: 2.407 },
    { text: 'author', start: 2.442, end: 2.8 },
    { text: 'agrees.', start: 2.9, end: 3.2 },
  ];
  const beat = { id: 'report', say: words.map((w) => w.text).join(' '), hold: 0 };
  const film = { title: 'A test report', beats: [beat] };
  const { schedule, clockAtFrame } = buildTimeline(film, [{ duration: 3.3, words }]);
  const reveal = (frame) => clockAtFrame(frame).reveal('report says', 0);
  assert.equal(reveal(19), 0);
  assert.equal(reveal(20), 1);
  clockAtFrame(74).reveal('author agrees', 0);
  assert.equal(
    filmText(film, schedule).subtitles,
    '1\n00:00:04,650 --> 00:00:05,700\nThe report says C seventeen passed.\n\n' +
      '2\n00:00:06,442 --> 00:00:07,200\nIts author agrees.\n',
  );
});

test('timed, punctuated and explicitly revealed words keep their own caption', () => {
  function captions(lead, duration, gap, anchorLead = false) {
    const words = [
      { text: lead, start: 0, end: duration },
      { text: 'next.', start: duration + gap, end: 1 },
    ];
    const film = {
      title: 'Caption boundaries',
      beats: [{ id: 'one', say: lead + ' next.', hold: 0 }],
    };
    const { schedule, clockAtFrame } = buildTimeline(film, [{ duration: 1.1, words }]);
    const clock = clockAtFrame(0);
    if (anchorLead) clock.reveal(lead);
    clock.reveal('next');
    return filmText(film, schedule).subtitles;
  }
  for (const [lead, duration, gap, anchor] of [
    ['The', 0.3, 0],
    ['Its', 0.2, 0.036],
    ['The.', 0.1, 0],
    ['Zero.', 0.1, 0],
    ['Now', 0.1, 0],
    ['The', 0.1, 0, true],
  ]) {
    assert(captions(lead, duration, gap, anchor).includes('\n' + lead + '\n\n2\n'));
  }
  const beats = ['The', 'next.'].map((say, i) => ({ id: String(i), say, hold: 0 }));
  const film = { title: 'Two beats', beats };
  const takes = beats.map(({ say }) => ({
    duration: 0.1,
    words: [{ text: say, start: 0, end: 0.1 }],
  }));
  assert(filmText(film, buildTimeline(film, takes).schedule).subtitles.includes('\nThe\n\n2\n'));
});

test('a long joined caption wraps at measured words and preserves the next reveal', () => {
  const text =
    'The host limits which private fields the model can read, which destinations it can contact.';
  const tokens = text.split(' ');
  const starts = [0, 0.113, 0.51, 0.91, 1.1, 1.5, 1.9, 2, 2.35, 2.55, 3.25, 3.45, 4.16, 4.25, 4.45];
  const words = tokens.map((token, i) => ({
    text: token,
    start: starts[i],
    end: i === 9 ? 3.12 : (starts[i + 1] ?? 5.01),
  }));
  const film = { title: 'Permissions', beats: [{ id: 'host', say: text, hold: 0 }] };
  const { schedule, clockAtFrame } = buildTimeline(film, [{ duration: 5.1, words }]);
  clockAtFrame(0).reveal('host limits');
  clockAtFrame(0).reveal('can contact');
  assert.equal(
    filmText(film, schedule).subtitles,
    '1\n00:00:04,113 --> 00:00:07,120\nThe host limits which private fields the model can read,\n\n' +
      '2\n00:00:07,250 --> 00:00:08,250\nwhich destinations it\n\n' +
      '3\n00:00:08,250 --> 00:00:09,010\ncan contact.\n',
  );
});

test('a reflow skips a clause break that would flash its last word', () => {
  const tokens = [
    'The',
    'report',
    'records',
    'the',
    'first',
    'recommendation',
    'and',
    'identifies',
    'the',
    'planned',
    'day,',
    'too.',
  ];
  const film = { title: 'Review date', beats: [{ id: 'review', say: tokens.join(' '), hold: 0 }] };
  function subtitles(starts, duration) {
    const words = tokens.map((text, i) => ({
      text,
      start: starts[i],
      end: starts[i + 1] ?? duration,
    }));
    const timeline = buildTimeline(film, [{ duration, words }]);
    timeline.clockAtFrame(0).reveal('report records');
    return filmText(film, timeline.schedule).subtitles;
  }
  const measured = subtitles([0, 0.11, 0.5, 0.82, 0.9, 1.23, 1.98, 2.3, 2.8, 3, 3.4, 3.7], 3.9);
  assert.doesNotMatch(measured, /\nThe\n|\ntoo\.\n/);
  assert.match(measured, /00:00:04,110 --> [^\n]+\nThe report records/);
  assert.match(measured, /planned day, too\.\n$/);
  // If all internal cuts would flash, keep the original cue boundaries.
  const short = subtitles(
    tokens.map((_, i) => i * 0.025),
    0.48,
  );
  assert.match(short, /\nThe\n\n2\n00:00:04,025 --> 00:00:04,480/);
});

test('picture, speech holds, chapters and answer captions share the measured word clock', () => {
  const film = {
    title: 'A = B?',
    beats: [
      { id: 'setup', say: 'Which one?', hold: 0.25 },
      { id: 'payoff', say: 'One weighs less. Two stays.', hold: 0.7 },
    ],
  };
  const timeline = buildTimeline(film, [
    {
      duration: 0.66,
      words: [
        { text: 'Which', start: 0.1, end: 0.25 },
        { text: 'one?', start: 0.32, end: 0.62 },
      ],
    },
    {
      duration: 3.08,
      words: [
        { text: 'One', start: 0.07, end: 0.3 },
        { text: 'weighs', start: 0.48, end: 0.88 },
        { text: 'less.', start: 0.95, end: 1.3 },
        { text: 'Two', start: 2.001, end: 2.31 },
        { text: 'stays.', start: 2.41, end: 2.82 },
      ],
    },
  ]);
  const { clockAtFrame, schedule, frames } = timeline;
  assert.equal(schedule[1].startFrame, 28);
  assert.equal(clockAtFrame(27).progress, 1);
  assert.equal(clockAtFrame(28).beat, film.beats[1]);
  assert.equal(clockAtFrame(28).elapsed, 0);
  assert.equal(clockAtFrame(28).seconds, 28 / 30);
  const phase = (frame) => clockAtFrame(28 + frame).reveal('two stays');
  assert.equal(phase(60), 0);
  assert(phase(61) > 0 && phase(61) < 0.1);
  assert.equal(phase(74), 1);
  assert.equal(clockAtFrame(frames - 1).reveal('Two stays.', 0), 1);
  assert.throws(() => clockAtFrame(28).reveal('weight'), /payoff does not say/);
  const { subtitles, metadata } = filmText(film, schedule);
  assert.match(subtitles, /00:00:06,935 --> 00:00:07,753\nTwo stays\./);
  assert.match(metadata, /START=4000\nEND=4933\ntitle=setup/);
  assert.match(metadata, /START=4933\nEND=8733\ntitle=payoff/);
  assert.throws(
    () =>
      buildTimeline(film, [
        { duration: 1, words: [{ text: 'Unrelated words', start: 0, end: 0.9 }] },
        {},
      ]),
    /Transcript does not match/,
  );
});

test('silent CLI paints PNGs on both sides of a phrase and propagates author failures', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'director-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const installed = fileURLToPath(new URL('../../', import.meta.url));
  const directory = join(root, 'videos', 'director-cuts');
  const runtime = join(directory, 'lesson-runtime');
  const lesson = join(directory, 'lessons', 'fixture');
  const stills = join(root, 'stills');
  await mkdir(runtime, { recursive: true });
  await mkdir(lesson, { recursive: true });
  await symlink(join(installed, 'node_modules'), join(root, 'videos/node_modules'), 'dir');
  await symlink(join(installed, 'lib'), join(root, 'videos/lib'), 'dir');
  for (const file of ['check.mjs', 'timeline.mjs', 'picture.mjs']) {
    await copyFile(new URL(file, import.meta.url), join(runtime, file));
  }
  const film = `
    import assert from 'node:assert/strict';
    import { GlobalFonts } from '@napi-rs/canvas';
    let checked = false;
    export default {
      title: 'The signal', beats: [{ id: 'signal', say: 'Wait for green.', hold: 0.5 }],
      check() { checked = true; },
      draw(ctx, clock) {
        assert(checked);
        for (const family of ['Lesson Sans', 'Lesson Serif', 'Lesson Mono']) assert(GlobalFonts.has(family));
        clock.reveal('for', 0, { captionStart: false });
        const green = clock.reveal('green', 0.2);
        ctx.fillStyle = green >= 1 ? '#00ff00' : '#ff0000';
        ctx.fillRect(0, 0, clock.width, clock.height);
        ctx.translate(500, 500);
      }
    };`;
  const file = join(lesson, 'film.mjs');
  await writeFile(file, film);
  const run = promisify(execFile);
  const check = (...args) =>
    run(process.execPath, [join(runtime, 'check.mjs'), 'fixture', ...args], {
      env: { ...process.env, PATH: '', UV: '/no-speech-in-still-check' },
    });
  const { stdout } = await check('--stills', stills);
  const { pictures, revealStarts, timing } = JSON.parse(stdout);
  assert.equal(pictures, (await readdir(stills)).length);
  assert.equal(revealStarts, 2);
  assert.equal(timing, 'estimated words');
  async function pixelAt(frame) {
    const name = `fixture-b01-f${String(frame).padStart(6, '0')}.png`;
    const image = await loadImage(await readFile(join(stills, name)));
    assert.deepEqual([image.width, image.height], [1920, 1080]);
    const ctx = createCanvas(1, 1).getContext('2d');
    ctx.drawImage(image, 0, 0);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  }
  assert.deepEqual(await pixelAt(23), [255, 0, 0, 255]);
  assert.deepEqual(await pixelAt(30), [0, 255, 0, 255]);
  await writeFile(file, film.replace("reveal('green'", "reveal('amber'"));
  await assert.rejects(check(), /signal does not say the phrase "amber"/);
  await writeFile(file, film.replace('checked = true', "throw Error('wrong example')"));
  await assert.rejects(check(), /wrong example/);
});

test('four producers share one opener build and recover from an interrupted cache write', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'director-intro-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cache = join(root, 'shared');
  const source = join(root, 'text-fixture');
  const record = join(root, 'builder-calls');
  const builder = join(root, 'fixture-builder');
  await writeFile(source, 'The test builder links this text file. It never encodes media.');
  await writeFile(
    builder,
    [
      '#!/bin/sh',
      'set -eu',
      'for output do :; done',
      'echo build >> "$RECORD"',
      'mkdir "$output/brand"',
      'ln -s "$SOURCE" "$output/brand/leetllm-intro.mp4"',
      '',
    ].join('\n'),
    { mode: 0o700 },
  );
  const run = promisify(execFile);
  const script = fileURLToPath(new URL('./intro.py', import.meta.url));
  async function request(index) {
    const cwd = join(root, String(index));
    await mkdir(cwd, { recursive: true });
    const { stdout } = await run('python3', [script, builder], {
      cwd,
      env: { ...process.env, RECORD: record, SOURCE: source, LEETLLM_INTRO_CACHE: cache },
    });
    return stdout.trim();
  }
  const paths = await Promise.all([0, 1, 2, 3].map(request));
  assert.equal(new Set(paths).size, 1);
  assert.equal(await readFile(record, 'utf8'), 'build\n');
  // A crash between the movie and checksum renames leaves an incomplete cache entry.
  await rm(paths[0].replace(/\.mp4$/, '.sha256'));
  assert.equal(await request(0), paths[0]);
  assert.equal(await readFile(record, 'utf8'), 'build\nbuild\n');
});
