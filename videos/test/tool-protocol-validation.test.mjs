import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/tool-protocol.mjs';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';

async function fixture(id) {
  registerLessonFonts();
  const root = new URL('../../', import.meta.url).pathname;
  const lesson = await readLesson(root + 'videos/lessons/tool-protocol.lesson.yaml', root);
  const scene = lesson.scenes.find((scene) => scene.id === id);
  const sounds = scene.beats.map((beat, beatIndex) => ({
    beatIndex,
    words: beat.say.split(/\s+/).map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 })),
  }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'estimated-lexical-words';
  const canvas = createCanvas(1920, 1080);
  const labels = (time) =>
    drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, lesson.scenes.indexOf(scene), lesson.scenes.length),
      model.draw,
    )
      .labels.filter((x) => x.alpha > 0.35)
      .map((x) => x.text);
  return { lesson, scene, timing, labels };
}

test('validation paints its input before the narrated protocol verdict', async () => {
  const { labels } = await fixture('validate-results');
  const opening = labels(0.75);
  assert.equal(
    opening.some((text) => /[−-]32602/.test(text)),
    false,
    'Protocol verdict must wait for its narrated check',
  );
  assert(
    opening.some((text) => text.includes('"arguments": []')),
    'The malformed argument shape must be visible',
  );
});

test('discovery paints explicit per-request metadata without an early missing-capability verdict', async () => {
  const { timing, labels } = await fixture('discover-and-negotiate');
  const cue = timing.visualCues.find((x) => x.id === 'discover-and-negotiate-beat-2-focus-1');
  const requests = labels(cue.end + 0.1);
  assert(requests.some((text) => text.includes('2026-07-28')));
  assert(requests.some((text) => text.includes('clientCapabilities')));
  assert(requests.some((text) => text.includes('"elicitation"')));
  assert.equal(
    requests.some((text) => text.includes('-32021')),
    false,
    'Missing capability must wait for the narrated comparison',
  );
});

test('capability admission uses each request declaration and preserves its version and reply ID', () => {
  const fixture = model.discoveryFixture();
  assert.deepEqual(
    fixture.checks.map((check) => check.versionSupported),
    [true, true],
  );
  assert.deepEqual(
    fixture.checks.map((check) => check.admitted),
    [true, false],
  );
  const formCapabilities = { elicitation: { form: {} } };
  assert.deepEqual(
    fixture.requests.map(
      (request) => request.params._meta['io.modelcontextprotocol/clientCapabilities'],
    ),
    [formCapabilities, {}],
  );
  assert.equal(fixture.formReply.id, fixture.requests[0].id);
  assert.equal(fixture.formReply.result.resultType, 'input_required');
  const input = fixture.formReply.result.inputRequests.rollback_reason;
  assert.equal(input.method, 'elicitation/create');
  assert.equal(input.params.mode, 'form');
  assert.deepEqual(input.params.requestedSchema, {
    type: 'object',
    properties: { reason: { type: 'string' } },
    required: ['reason'],
  });
  assert.equal(fixture.missingReply.id, fixture.requests[1].id);
  assert.equal(fixture.missingReply.error.code, -32021);
  assert.deepEqual(fixture.missingReply.error.data.requiredCapabilities, formCapabilities);
  const held = model.discoverySnapshot(1, 0, {
    'discover-and-negotiate-beat-2-focus-1': { phase: 'after', progress: 1 },
  });
  assert.equal(held.firstRequestVisible, true);
  assert.equal(held.secondRequestVisible, true);
  assert.equal(held.missingResultVisible, false);
});

test('valid schema cannot admit a different release, malformed flags, extra fields, or a mismatched reply ID', () => {
  const fixture = model.validationFixture();
  assert.equal(fixture.protocolReply.error.code, -32602);
  assert.equal(fixture.toolReply.result.resultType, 'complete');
  assert.equal(fixture.toolReply.result.isError, true);
  assert.equal(fixture.host.schemaValid, true);
  assert.equal(fixture.host.admitted, false);
  const good = structuredClone(fixture.wrongReply);
  good.result.structuredContent.release_id = fixture.expected.params.arguments.release_id;
  assert.equal(model.validateStatusReply(good).admitted, true);
  assert.equal(model.validateStatusReply({ ...good, id: '53' }).admitted, false);
  assert.equal(model.validateStatusReply({ ...good, error: null }).admitted, false);
  assert.equal(
    model.validateStatusReply({ ...good, result: { ...good.result, isError: null } }).admitted,
    false,
  );
  assert.equal(
    model.validateStatusReply({ ...good, result: { ...good.result, content: undefined } }).admitted,
    false,
  );
  assert.equal(
    model.validateStatusReply({
      ...good,
      result: {
        ...good.result,
        structuredContent: { ...good.result.structuredContent, extra: true },
      },
    }).admitted,
    false,
  );
  assert.equal(
    model.validationSnapshot(0, 0.99, {
      'validation-envelope-error': { phase: 'before', progress: 0 },
    }).protocolReplyVisible,
    false,
  );
  assert.equal(
    model.validationSnapshot(0, 0, { 'validation-envelope-error': { phase: 'after', progress: 1 } })
      .protocolReplyVisible,
    true,
  );
});

test('permission completion and the traffic effect wait for their separate spoken checks', async () => {
  const { timing, labels } = await fixture('transport-and-pause');
  const host = timing.visualCues.find((cue) => cue.id === 't-transport-and-pause-host');
  const server = timing.visualCues.find((cue) => cue.id === 't-transport-and-pause-server');
  const beforeHost = labels(host.end - 1 / 30);
  assert.equal(beforeHost.includes('host scope + approval checked'), false);
  const afterHost = labels(host.end + 1 / 30);
  assert(afterHost.includes('host scope + approval checked'));
  assert.equal(afterHost.includes('1 authorized traffic effect'), false);
  const beforeServer = labels(server.end - 1 / 30);
  assert.equal(beforeServer.includes('server permission rechecked'), false);
  assert.equal(beforeServer.includes('1 authorized traffic effect'), false);
  const afterServer = labels(server.end + 1 / 30);
  assert(afterServer.includes('server permission rechecked'));
  assert(afterServer.includes('1 authorized traffic effect'));
});
