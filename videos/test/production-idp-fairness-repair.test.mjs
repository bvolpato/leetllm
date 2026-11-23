import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw as idpDraw } from '../animations/inference-data-plane.mjs';
import { draw as fairnessDraw } from '../animations/fairness-audits.mjs';
registerLessonFonts();
async function fixture(name) {
  const data = JSON.parse(
    fs.readFileSync(
      new URL('./fixtures/measured-narration/' + name + '-provider.json', import.meta.url),
    ),
  );
  const lesson = await readRepositoryLesson('videos/lessons/' + data.lesson + '.lesson.yaml');
  const index = lesson.scenes.findIndex((s) => s.id === data.scene),
    scene = lesson.scenes[index];
  const timing = makeSceneTimeline(
    scene,
    data.sounds.map((s) => s.duration),
    data.fps,
  );
  timing.sounds = data.sounds;
  timing.visualCues = resolveSceneCues(scene, timing, data.sounds);
  return { lesson, index, scene, timing };
}
function render(f, seconds, draw) {
  const canvas = createCanvas(1920, 1080);
  let owned = 0;
  const audit = drawFrame(
    canvas.getContext('2d'),
    f.lesson,
    f.scene,
    frameState(f.timing, seconds, f.index, f.lesson.scenes.length),
    (ctx, scene, state, api) => {
      const rect = (...args) => {
        if (
          f.scene.id === 'reserve-and-transfer' &&
          args[3] === 57 &&
          args[4] === 57 &&
          args[1] >= 210 &&
          args[1] <= 665 &&
          args[2] >= 395 &&
          args[2] <= 850 &&
          [api.C.blue, api.C.green].includes(args[6])
        )
          owned++;
        return api.rect(...args);
      };
      draw(ctx, scene, state, { ...api, rect });
    },
  );
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], []);
  return { labels: audit.labels.map((v) => v.text), owned };
}
async function completedResults(draw, checks) {
  for (const [name, rules] of Object.entries(checks)) {
    const f = await fixture(name);
    for (const [id, result] of rules) {
      const cue = f.timing.visualCues.find((c) => c.id === id);
      for (const time of [cue.start + 1 / 30, (cue.start + cue.end) / 2, cue.end - 1 / 30])
        assert(
          !render(f, time, draw).labels.some((s) => s.includes(result)),
          id + ': keep the completed result concealed during its spoken clause',
        );
      assert(
        render(f, cue.end + 1 / 30, draw).labels.some((s) => s.includes(result)),
        id + ': reveal the earned result after completion',
      );
    }
  }
}
test('IDP paints atomic block ownership and withholds the second request decision', async () => {
  const f = await fixture('idp-reserve-and-transfer'),
    grant = f.timing.visualCues.find((c) => c.id === 'reserve-and-transfer-b1'),
    verdict = f.timing.visualCues.find((c) => c.id === 'reservation-second-verdict');
  for (const time of [grant.start, (grant.start + grant.end) / 2, grant.end - 1 / 30]) {
    const state = render(f, time, idpDraw);
    assert.equal(state.owned, 0);
    assert(state.labels.includes('Target:48 blocks · reservation pending'));
  }
  for (const time of [grant.end + 1 / 30, 7.733333333, verdict.end - 1 / 30]) {
    const state = render(f, time, idpDraw);
    assert.equal(state.owned, 48);
    assert(state.labels.includes('48 reserved ·16 remain'));
    assert(!state.labels.includes('WAIT:24 exceeds16'));
  }
  assert(render(f, verdict.end + 1 / 30, idpDraw).labels.includes('WAIT:24 exceeds16'));
});
test('IDP payload and fresh completion outcomes wait for their measured complete clauses', async () => {
  await completedResults(idpDraw, {
    'idp-kv-state': [['kv-total-reveal', '32 KiB']],
    'idp-real-payload': [
      ['production-per-token', '320 KiB / token'],
      ['production-total', '2.5'],
    ],
    'idp-transfer': [
      ['fresh-coverage-reveal', '5/6 unique segments → REJECT commit'],
      ['fresh-reuse-reveal', 'Active old writer → keep charge; no reuse before quiescence'],
    ],
  });
});
test('fairness interval, pair and scoped release verdicts wait for complete measured clauses', async () => {
  await completedResults(fairnessDraw, {
    'fairness-uncertainty-gate': [
      ['uncertainty-pass', 'PASS: whole interval inside tolerance'],
      ['uncertainty-fail', 'FAIL: interval exceeds tolerance'],
    ],
    'fairness-release-gate': [
      ['release-pair-result', 'automatic service'],
      [
        'release-still-blocked',
        'Release BLOCKED · representative and governance evidence still required',
      ],
    ],
  });
});
