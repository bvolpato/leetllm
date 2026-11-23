import { readRepositoryLesson } from './helpers/repository.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { frameState } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { draw, actorLabel } from '../animations/responsible-ai-governance-ethics-compliance.mjs';

const lesson = await readRepositoryLesson(
  new URL('../lessons/responsible-ai-governance-ethics-compliance.lesson.yaml', import.meta.url)
    .pathname,
);
const fixture = await loadMeasuredTimeline('responsible-ai-governance-ethics-compliance');
registerLessonFonts();
const canvas = createCanvas(1920, 1080);
function measured(id) {
  const index = lesson.scenes.findIndex((s) => s.id === id),
    scene = lesson.scenes[index];
  const saved = fixture.scenes.find((s) => s.id === id);
  const timing = structuredClone(saved);
  timing.visualCues = resolveSceneCues(scene, timing);
  timing.cueTiming = 'provider-words';
  return {
    scene,
    timing,
    paint: (time) =>
      drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, time, index, lesson.scenes.length),
        draw,
      ),
  };
}
const labels = (a) => a.labels.filter((l) => l.alpha > 0.25).map((l) => l.text);
const text = (a) => labels(a).join('\n');
function boundary(sceneId, beat, phrase) {
  const m = measured(sceneId),
    probe = structuredClone(m.scene);
  probe.beats.forEach((b) => delete b.visual_cues);
  probe.beats[beat].visual_cues = [{ id: 'independent-probe', phrase, targets: ['probe'] }];
  const end = resolveSceneCues(probe, m.timing)[0].end,
    n = Math.ceil(end * 30);
  return { before: m.paint((n - 1) / 30), after: m.paint(n / 30) };
}

test('the product branch changes when either necessary input changes', () => {
  const m = measured('high-risk-branches');
  for (const [phrase, expected] of [
    [
      'Solely non-safety assistance, efficiency or convenience does not make a safety component',
      false,
    ],
    ['Failure that endangers health and safety can', true],
    ['A conformity check solely for unrelated risks does not satisfy the second condition', false],
  ]) {
    const p = boundary(m.scene.id, 0, phrase);
    assert.equal(text(p.after).includes('Both satisfied / product high-risk route'), expected);
    assert(
      text(p.after).includes(
        expected
          ? 'Both satisfied / product high-risk route'
          : 'Product route not established by these inputs',
      ),
    );
  }
});

test('the open-source exception removes two duties, while systemic risk restores them', () => {
  const exception = boundary(
    'gpai-layer',
    0,
    'Qualifying open-source models have a limited exception from the first two duties',
  );
  assert.equal(labels(exception.before).filter((v) => v === 'Duty retained').length, 4);
  assert.equal(labels(exception.after).filter((v) => v === 'Duty retained').length, 2);
  const systemic = boundary(
    'gpai-layer',
    0,
    'That exception does not apply to models with systemic risk',
  );
  assert.equal(labels(systemic.before).filter((v) => v === 'Duty retained').length, 2);
  assert.equal(labels(systemic.after).filter((v) => v === 'Duty retained').length, 4);
});

test('a repaired holdout moves into seen regressions before new private evidence is introduced', () => {
  const m = measured('evaluation-integrity');
  const p = boundary(m.scene.id, 1, 'Move H one into the regression suite');
  assert(text(p.after).includes('H1 / Missing signature'));
  const h1 = p.after.shapes.find((s) => s.x === 1110 && s.y === 565 && s.width === 500);
  assert(h1, 'case H1 did not land in the seen-regression partition');
  assert(!text(p.after).includes('H2 / Fresh rollout request'));
  const next = boundary(
    m.scene.id,
    1,
    'Use a fresh private case to see whether the fix works on another request',
  );
  assert(text(next.after).includes('H2 / Fresh rollout request'));
});

test('the moving holdout keeps its direction marker outside the case panel', () => {
  const m = measured('evaluation-integrity');
  const cue = m.timing.visualCues.find((cue) => cue.id === 'gov-seen-regression');
  for (const progress of [0.25, 0.5, 0.75, 0.9]) {
    const time = cue.start + (cue.end - cue.start) * progress;
    const actual = m.paint(time);
    assert.deepEqual([...actual.issues, ...layoutIssues(actual)], [], `moving H1 at ${time}s`);
  }
});

test('the independent zero-failure bound uses its own experiment and earns its endpoint', () => {
  const independent = boundary(
    'results',
    3,
    'With zero observed failures in three independent fixed-distribution trials',
  );
  const actual = text(independent.after);
  assert(actual.includes('Trial 1 / no failure') && actual.includes('Trial 3 / no failure'));
  assert(!actual.includes('1/3 =') && !actual.includes('1/2 ='));
  const bound = boundary('results', 3, 'about sixty-three point two percent');
  assert(!text(bound.before).includes('95% upper bound /'));
  assert(text(bound.after).includes('95% upper bound / 1 − 0.05^(1/3) = 63.2%'));
});

test('the moving confidence candidate reports its actual zero-failure likelihood', () => {
  const m = measured('results'),
    cue = m.timing.visualCues.find((c) => c.id === 'gov-bound-construction');
  const actual = text(m.paint((cue.start + cue.end) / 2));
  const candidate = (1 - 0.05 ** (1 / 3)) / 2;
  assert(
    actual.includes(
      'Candidate p = ' +
        (candidate * 100).toFixed(1) +
        '% / P(0 | p) = ' +
        ((1 - candidate) ** 3).toFixed(3),
    ),
  );
  assert(!actual.includes('95% upper bound /'));
});

test('the 96-bit display matches the article fixture and changes with actor or key scope', () => {
  assert.equal(actorLabel('USER-918204'), 'actor-f027638fb6653d5861c880a5');
  assert.equal(actorLabel('USER-918204'), actorLabel('USER-918204'));
  assert.notEqual(actorLabel('USER-918204'), actorLabel('USER-918205'));
  assert.notEqual(
    actorLabel('USER-918204'),
    actorLabel('USER-918204', 'different-public-demo-scope'),
  );
});

test('a factual appeal correction preserves the held decision and creates no traffic effect', () => {
  const p = boundary(
    'appeal-replay',
    1,
    'If a valid, authorized receipt already covered that exact proposal but the gate failed to read it, record a factual correction and assign the gate defect',
  );
  assert(!text(p.before).includes('CORRECT factual read defect'));
  assert(text(p.after).includes('CORRECT factual read defect'));
  assert(text(p.after).includes('Historical decision / HELD'));
  assert(text(p.after).includes('Recorded traffic effects: 0'));
  assert(text(p.after).includes('Append correction + gate defect / effects added 0'));
});

test('the fresh rejection is distinct from the later binding and exception explanation', () => {
  const rejection = boundary('earned-transfer', 1, 'They cannot');
  assert(!text(rejection.before).includes('HELD'));
  assert(text(rejection.after).includes('HELD'));
  assert(!text(rejection.after).includes('Old approvals mismatch'));
  const reason = boundary(
    'earned-transfer',
    1,
    'The exact proposal binding changes, and fifteen is above ten, so our local rule also requires exception review',
  );
  assert(!text(reason.before).includes('Old approvals mismatch'));
  assert(text(reason.after).includes('Old approvals mismatch'));
});

test('changed policy reviews remain pending until the complete mismatch clause', () => {
  const p = boundary(
    'package',
    2,
    'The manifest digest changes, and the old reviews stop matching',
  );
  assert.equal(labels(p.before).filter((t) => t === 'Required binding missing').length, 0);
  assert.equal(labels(p.before).filter((t) => t === 'Accepted G7 / compare G8').length, 8);
  assert.equal(labels(p.after).filter((t) => t === 'Required binding missing').length, 8);
  assert(text(p.after).includes('8 evidence gaps'));
});
