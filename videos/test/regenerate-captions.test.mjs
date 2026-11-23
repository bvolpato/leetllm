import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashDeliveryFiles } from '../lib/delivery.mjs';
import { srt, vtt } from '../lib/lesson.mjs';
import { teachingCaptions, teachingPolicy } from '../lib/teaching-captions.mjs';
import { paragraphCaptions } from '../lib/captions.mjs';
import { captionBoundaryTokens } from '../lib/narration-cues.mjs';
import {
  getCaptionRevision,
  regenerateLessonCaptions,
  runCaptionCli,
} from '../regenerate-captions.mjs';
import { checkCandidate } from '../visual-teaching-gallery.mjs';

const id = 'caption-fixture';
const narration =
  'A support team wants to search messages about billing, login problems, and deploy policies.';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const oldCaptions = [
  {
    start: 4.5,
    end: 7.9,
    text: 'A support team wants to search messages about billing, login problems, and',
  },
  { start: 7.91, end: 8.8, text: 'deploy policies.' },
];

function timedWords(text) {
  return [...text.matchAll(/\S+/gu)].map((match, index) => ({
    text: match[0],
    start: index * 0.3,
    end: index * 0.3 + 0.24,
  }));
}

async function fixture(
  t,
  { transcript = narration, staleAudits = false, visualCues, captionPolicy, manifest } = {},
) {
  const root = await mkdtemp(join(tmpdir(), 'leetllm-caption-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = join(root, id);
  await mkdir(join(directory, 'previews/frames'), { recursive: true });
  await mkdir(join(directory, 'encoded-review/frames'), { recursive: true });
  const movie = Buffer.from('fixture movie bytes');
  const scene = {
    id: 'support-search',
    start: 4,
    duration: 8,
    frames: 240,
    fps: 30,
    beats: [{ say: transcript, start: 0.5, end: 6.5, duration: 6, until: 7 }],
    sounds: [{ sceneIndex: 0, beatIndex: 0, duration: 6, words: timedWords(narration) }],
  };
  const timeline = {
    id,
    fps: 30,
    width: 1920,
    height: 1080,
    intro: { id: 'leetllm-intro', frames: 120 },
    scenes: [scene],
    captionPolicy,
    captions: oldCaptions,
    duration: 12,
  };
  if (visualCues) scene.beats[0].visual_cues = visualCues;
  const sample = (timestamp, caption, localTime = 2) => ({
    image: 'previews/frames/frame.png',
    scene: { id: scene.id, title: 'Search support messages', index: 1 },
    beat: { index: 1, text: narration },
    progress: 0.25,
    localTime,
    timestamp,
    caption,
    labels: [],
    issues: [],
  });
  const gallery = {
    lesson: id,
    title: 'Embedding geometry',
    profile: 'clean',
    timing: 'measured-speech',
    sampledProgress: [0.25],
    sampleCount: 2,
    samples: [
      sample('00:00:06.000', oldCaptions[0]),
      sample('00:00:10.000', null, 6),
      sample('00:00:08.640', null, 4.6396),
    ],
  };
  const captionHtml = (caption) =>
    caption
      ? `<p><strong>Caption cue:</strong> ${caption.text}</p>`
      : '<p class="meta">No caption cue at this sample.</p>';
  const html = `<!doctype html><html lang="en"><body><figure>${captionHtml(oldCaptions[0])}</figure><figure>${captionHtml(null)}</figure><figure>${captionHtml(null)}</figure></body></html>`;
  await Promise.all([
    writeFile(join(directory, `${id}.mp4`), movie),
    writeFile(join(directory, 'timeline.json'), JSON.stringify(timeline, null, 2)),
    writeFile(join(directory, `${id}.srt`), srt(oldCaptions)),
    writeFile(join(directory, `${id}.vtt`), vtt(oldCaptions)),
    writeFile(join(directory, 'frame-gallery.json'), JSON.stringify(gallery, null, 2)),
    writeFile(join(directory, 'frame-gallery.html'), html),
    writeFile(join(directory, 'frame-audit.json'), JSON.stringify({ passed: true, frames: 360 })),
    writeFile(join(directory, 'previews/frames/frame.png'), 'frame evidence'),
    writeFile(join(directory, 'encoded-review/frames/sample.png'), 'decoded review evidence'),
  ]);
  if (manifest) await writeFile(join(directory, 'source-manifest.json'), JSON.stringify(manifest));
  const reviewDirectory = join(directory, 'encoded-review');
  const review = { videoSha256: sha(movie), decodedFrameAudit: { passed: true } };
  review.artifactSha256 = await hashDeliveryFiles(reviewDirectory);
  await writeFile(join(reviewDirectory, 'verification.json'), JSON.stringify(review, null, 2));
  const receipt = {
    id,
    title: 'Embedding geometry',
    fullDecode: 'passed',
    frameAudit: { passed: true, frames: 360 },
    sha256: sha(movie),
    bytes: movie.length,
    duration: 12,
    fingerprint: 'a'.repeat(64),
    artifactSha256: await hashDeliveryFiles(directory),
  };
  await writeFile(join(directory, 'verification.json'), JSON.stringify(receipt, null, 2));
  if (staleAudits) {
    const staleReport = {
      id,
      passed: true,
      videoSha256: receipt.sha256,
      sourceFingerprint: receipt.fingerprint,
      timelineSha256: sha(await readFile(join(directory, 'timeline.json'))),
      receiptSha256: sha(await readFile(join(directory, 'verification.json'))),
      toolSha256: '0'.repeat(64),
    };
    await Promise.all([
      writeFile(join(directory, 'text-ink-audit.json'), JSON.stringify(staleReport)),
      writeFile(join(directory, 'motion-audit.json'), JSON.stringify(staleReport)),
    ]);
  }
  return { root, directory, movie, receipt };
}

async function snapshot(directory) {
  const result = {};
  async function visit(folder, prefix = '') {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name),
        name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(path, name);
      else result[name] = sha(await readFile(path));
    }
  }
  await visit(directory);
  return result;
}

test('measured word events keep a complete short sentence together in SRT, VTT, and gallery cues', async (t) => {
  const paths = await fixture(t);
  const beforeTimeline = JSON.parse(await readFile(join(paths.directory, 'timeline.json'), 'utf8'));
  const beforeEvidence = await readFile(join(paths.directory, 'previews/frames/frame.png'));
  const beforeMovie = await readFile(join(paths.directory, `${id}.mp4`));

  const result = await regenerateLessonCaptions({ input: paths.root, id });

  const timeline = JSON.parse(await readFile(join(paths.directory, 'timeline.json'), 'utf8'));
  const srtText = await readFile(join(paths.directory, `${id}.srt`), 'utf8');
  const vttText = await readFile(join(paths.directory, `${id}.vtt`), 'utf8');
  const gallery = JSON.parse(await readFile(join(paths.directory, 'frame-gallery.json'), 'utf8'));
  const html = await readFile(join(paths.directory, 'frame-gallery.html'), 'utf8');
  const receipt = JSON.parse(await readFile(join(paths.directory, 'verification.json'), 'utf8'));

  assert.equal(result.cues, 1);
  assert.equal(result.auditsNeedRefresh, true);
  assert.deepEqual(timeline.captions, [{ start: 4.5, end: 8.64, text: narration }]);
  assert.equal(srtText, `1\n00:00:04,500 --> 00:00:08,640\n${narration}\n`);
  assert.equal(vttText, `WEBVTT\n\n00:00:04.500 --> 00:00:08.640\n${narration}\n`);
  assert.deepEqual(timeline.scenes, beforeTimeline.scenes);
  assert.equal(gallery.samples[0].caption.text, narration);
  assert.equal(gallery.samples[1].caption, null);
  assert.equal(
    gallery.samples[2].caption.text,
    narration,
    'a rounded display timestamp must not erase a cue just before its boundary',
  );
  assert.ok(html.includes(`<p><strong>Caption cue:</strong> ${narration}</p>`));
  assert.equal((html.match(/Caption cue:/gu) ?? []).length, 2);
  assert.deepEqual(receipt.captionRevision, await getCaptionRevision(1));
  assert.equal(receipt.sha256, sha(beforeMovie));
  assert.equal(receipt.fingerprint, paths.receipt.fingerprint);
  assert.deepEqual(
    await readFile(join(paths.directory, 'previews/frames/frame.png')),
    beforeEvidence,
  );

  const changedArtifactNames = Object.keys(receipt.artifactSha256).filter(
    (name) => receipt.artifactSha256[name] !== paths.receipt.artifactSha256[name],
  );
  assert.deepEqual(
    changedArtifactNames.sort(),
    [`${id}.srt`, `${id}.vtt`, 'frame-gallery.html', 'frame-gallery.json', 'timeline.json'].sort(),
  );
  const repeated = await regenerateLessonCaptions({ input: paths.root, id });
  assert.equal(repeated.upToDate, true);
  assert.equal(repeated.auditsNeedRefresh, true);
  const current = await regenerateLessonCaptions({ input: paths.root, id, check: true });
  assert.equal(current.upToDate, true);
});

test('--check detects an old generator revision without changing any file', async (t) => {
  const paths = await fixture(t);
  const before = await snapshot(paths.directory);
  await assert.rejects(
    regenerateLessonCaptions({ input: paths.root, id, check: true }),
    /caption artifacts are not current/,
  );
  assert.deepEqual(await snapshot(paths.directory), before);
});

test('retained cue declarations reproduce fresh caption boundaries and pass regeneration --check unchanged', async (t) => {
  const paths = await fixture(t, {
    visualCues: [
      { id: 'answer', phrase: 'deploy policies', targets: ['result'], caption_boundary: true },
    ],
  });
  const original = JSON.parse(await readFile(join(paths.directory, 'timeline.json'), 'utf8'));
  const scene = original.scenes[0];
  const freshCaptions = paragraphCaptions(
    scene.sounds[0].words,
    scene.start + scene.beats[0].start,
    scene.beats[0].say,
    captionBoundaryTokens(scene)[0],
  );
  assert.equal(freshCaptions[1].text, 'deploy policies.');
  assert.equal(freshCaptions[1].start, 4.5 + scene.sounds[0].words.at(-2).start);
  await runCaptionCli(['--input', paths.root, '--lesson', id]);
  const updated = JSON.parse(await readFile(join(paths.directory, 'timeline.json'), 'utf8'));
  assert.deepEqual(updated.captions, freshCaptions);
  assert.deepEqual(updated.scenes, original.scenes);
  assert.deepEqual(await readFile(join(paths.directory, `${id}.mp4`)), paths.movie);
  assert.equal(await readFile(join(paths.directory, `${id}.srt`), 'utf8'), srt(freshCaptions));
  assert.equal(await readFile(join(paths.directory, `${id}.vtt`), 'utf8'), vtt(freshCaptions));
  const beforeCheck = await snapshot(paths.root);
  await runCaptionCli(['--input', paths.root, '--lesson', id, '--check']);
  assert.deepEqual(await snapshot(paths.root), beforeCheck);
  assert.equal((await regenerateLessonCaptions({ input: paths.root, id })).upToDate, true);
});

test('packaging preserves native teaching cues for new and previously rendered directory projects', async (t) => {
  for (const origin of [
    { captionPolicy: teachingPolicy },
    { manifest: { mode: 'stage', lessonFile: `videos/stage-lessons/${id}/lesson.yaml` } },
  ]) {
    const paths = await fixture(t, {
      ...origin,
      visualCues: [{ id: 'answer', phrase: 'deploy policies', targets: ['result'] }],
    });
    const original = JSON.parse(await readFile(join(paths.directory, 'timeline.json'), 'utf8'));
    const expected = teachingCaptions(original.scenes[0]);
    assert.equal(expected.at(-1).text, 'deploy policies.');
    assert.equal(expected.at(-1).start, 8.1);
    await runCaptionCli(['--input', paths.root, '--lesson', id]);
    for (const [extension, format] of [
      ['srt', srt],
      ['vtt', vtt],
    ]) {
      assert.equal(
        await readFile(join(paths.directory, `${id}.${extension}`), 'utf8'),
        format(expected),
      );
    }
    const receipt = JSON.parse(await readFile(join(paths.directory, 'verification.json'), 'utf8'));
    assert.deepEqual(
      receipt.captionRevision,
      await getCaptionRevision(expected.length, teachingPolicy),
    );
    await runCaptionCli(['--input', paths.root, '--lesson', id, '--check']);
  }
});

test('a repeated no-refresh run reports audit reports bound to the previous delivery as stale', async (t) => {
  const paths = await fixture(t, { staleAudits: true });
  const updated = await regenerateLessonCaptions({ input: paths.root, id });
  assert.equal(updated.auditsNeedRefresh, true);
  const repeated = await regenerateLessonCaptions({ input: paths.root, id });
  assert.equal(repeated.upToDate, true);
  assert.equal(repeated.auditsRefreshed, false);
  assert.equal(repeated.auditsNeedRefresh, true);
});

test('a changed caption-generator hash blocks publication and preserves the delivery', async (t) => {
  const paths = await fixture(t);
  const before = await snapshot(paths.directory);
  await assert.rejects(
    regenerateLessonCaptions({ input: paths.root, id, generatorSha256: '0'.repeat(64) }),
    /caption generator source changed during regeneration/,
  );
  assert.deepEqual(await snapshot(paths.directory), before);
});

test('CLI updates selected manifest rows in place and checks them without writes', async (t) => {
  const paths = await fixture(t);
  const manifestPath = join(paths.root, 'manifest.json');
  const unselected = { id: 'another-lesson', title: 'Keep this row in its place' };
  await writeFile(manifestPath, JSON.stringify([unselected, paths.receipt], null, 2));

  await runCaptionCli(['--input', paths.root, '--lesson', id]);
  const rows = JSON.parse(await readFile(manifestPath, 'utf8'));
  const receipt = JSON.parse(await readFile(join(paths.directory, 'verification.json'), 'utf8'));
  assert.deepEqual(rows, [unselected, receipt]);
  const beforeCheck = await snapshot(paths.root);
  await runCaptionCli(['--input', paths.root, '--lesson', id, '--check']);
  assert.deepEqual(await snapshot(paths.root), beforeCheck);

  rows[1] = { ...rows[1], title: 'Stale manifest row' };
  await writeFile(manifestPath, JSON.stringify(rows, null, 2));
  const staleSnapshot = await snapshot(paths.root);
  await assert.rejects(
    runCaptionCli(['--input', paths.root, '--lesson', id, '--check']),
    /collection manifest receipt is stale/,
  );
  assert.deepEqual(await snapshot(paths.root), staleSnapshot);
});

test('transcript mismatch fails closed and preserves the original delivery', async (t) => {
  const paths = await fixture(t);
  const timelinePath = join(paths.directory, 'timeline.json');
  const timeline = JSON.parse(await readFile(timelinePath, 'utf8'));
  timeline.scenes[0].beats[0].say = 'A support team searches unrelated records.';
  await writeFile(timelinePath, JSON.stringify(timeline, null, 2));
  const receiptPath = join(paths.directory, 'verification.json');
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  receipt.artifactSha256['timeline.json'] = sha(await readFile(timelinePath));
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2));
  const before = await snapshot(paths.directory);

  await assert.rejects(
    regenerateLessonCaptions({ input: paths.root, id }),
    /Transcript does not match timed word coverage/,
  );
  assert.deepEqual(await snapshot(paths.directory), before);
});

test('corrupt artifact checksums fail before the delivery can be staged', async (t) => {
  const paths = await fixture(t);
  await writeFile(join(paths.directory, 'previews/frames/frame.png'), 'changed frame evidence');
  const before = await snapshot(paths.directory);

  await assert.rejects(
    regenerateLessonCaptions({ input: paths.root, id }),
    /artifact checksum mismatch/,
  );
  assert.deepEqual(await snapshot(paths.directory), before);
});

test('gallery caption verification follows an assembled directory link without changing its delivery', async (t) => {
  const paths = await fixture(t);
  await regenerateLessonCaptions({ input: paths.root, id });
  const before = await snapshot(paths.directory);
  const assembled = join(paths.root, 'assembled');
  await mkdir(assembled);
  await symlink(paths.directory, join(assembled, id), 'dir');
  const candidate = await checkCandidate(assembled, id, {
    lesson: {
      id,
      source: 'fixture/content.md',
      scenes: [{ id: 'support-search', beats: [{ say: narration }] }],
    },
  });
  const captions = candidate.gates.find((gate) => gate.name === 'Paragraph captions and bindings');
  assert.equal(captions.passed, true, captions.reason);
  assert.equal(
    candidate.passed,
    false,
    'the caption gate does not excuse other missing production evidence',
  );
  assert.deepEqual(await snapshot(paths.directory), before);
});
