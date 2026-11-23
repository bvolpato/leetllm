import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState, makeSceneTimeline } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import * as animation from '../animations/clustering-pca.mjs';

const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(
  new URL('../lessons/clustering-pca.lesson.yaml', import.meta.url),
  root,
);
const fixture = await loadMeasuredTimeline('clustering-pca');
const sceneData = (id) => {
  const authored = lesson.scenes.find((s) => s.id === id),
    measured = fixture.scenes.find((s) => s.id === id);
  assert.deepEqual(
    measured.beats.map((b) => b.say),
    authored.beats.map((b) => b.say),
  );
  return { authored, measured: { ...measured, visualCues: resolveSceneCues(authored, measured) } };
};
const at = (id, cueId, progress) => {
  const { authored, measured } = sceneData(id),
    cue = measured.visualCues.find((c) => c.id === cueId);
  const t =
    progress < 0
      ? cue.start - 0.05
      : progress > 1
        ? cue.end + cue.linger + 0.05
        : cue.start + (cue.end - cue.start) * progress;
  return {
    authored,
    state: frameState(measured, t, lesson.scenes.indexOf(authored), lesson.scenes.length),
  };
};
const paint = (id, cue, progress) => {
  const { authored, state } = at(id, cue, progress),
    canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(ctx, lesson, authored, state, animation.draw);
  return { canvas, ctx, audit, state, labels: audit.labels.map((l) => l.text) };
};
const close = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const cueState = (progress, phase = 'during') => ({ progress, phase, strength: 0 });
const paintEstimated = (id, cueId, progress) => {
  const authored = lesson.scenes.find((s) => s.id === id),
    sounds = authored.beats.map((b, beatIndex) => {
      const words = b.say.trim().split(/\s+/);
      return {
        beatIndex,
        duration: words.length / 2.5,
        words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
      };
    });
  const timing = makeSceneTimeline(
    authored,
    sounds.map((s) => s.duration),
    30,
  );
  timing.visualCues = resolveSceneCues(authored, timing, sounds);
  const cue = timing.visualCues.find((c) => c.id === cueId),
    time =
      progress < 0
        ? cue.start - 0.01
        : progress > 1
          ? cue.end + 0.01
          : cue.start + (cue.end - cue.start) * progress;
  const canvas = createCanvas(1920, 1080),
    state = frameState(timing, time, lesson.scenes.indexOf(authored), lesson.scenes.length),
    audit = drawFrame(canvas.getContext('2d'), lesson, authored, state, animation.draw);
  return audit.labels.map((label) => label.text);
};

test('candidate partitions and silhouettes are derived from their actual memberships', () => {
  const trials = animation.clusterTrials;
  assert.deepEqual(
    trials.map((t) => t.labels),
    [
      [0, 0, 0, 0, 1, 1],
      [0, 0, 1, 1, 2, 2],
      [0, 0, 1, 1, 2, 3],
    ],
  );
  trials.forEach((trial) => {
    const points = animation.messages.map((p) => [p.x, p.y]);
    const error = points.reduce(
      (sum, p, i) =>
        sum + p.reduce((n, v, j) => n + (v - trial.centers[trial.labels[i]][j]) ** 2, 0),
      0,
    );
    close(error, trial.inertia);
  });
  assert.deepEqual(
    trials.map((t) => t.inertia.toFixed(2)),
    ['20.06', '1.74', '0.92'],
  );
  assert.deepEqual(
    trials.map((t) => t.silhouette.toFixed(2)),
    ['0.56', '0.76', '0.51'],
  );
  assert.equal(
    animation.silhouette(
      animation.messages.map((p) => [p.x, p.y]),
      trials[2].labels,
      4,
    ).score,
    0,
  );
});

test('the named center-update cue preserves points and computes inertia at intermediate centers', () => {
  const state = { beat: 1, beatP: 0.99, cues: { 'centers-update': cueState(0.5) } };
  const current = animation.clusterFrame(state);
  current.centers.forEach((center, k) =>
    center.forEach((v, j) => close(v, (animation.seeds[k][j] + animation.centroids[k][j]) / 2)),
  );
  close(current.inertia, animation.inertia(current.centers));
  assert(current.inertia < animation.initialInertia && current.inertia > animation.updatedInertia);
  close(animation.clusterFrame({ beat: 2, beatP: 0 }).inertia, 1.74);
});

test('the measured assignment cue starts on real observation actors before the first nonzero spoke', () => {
  const current = paint('kmeans', 'points-assign', 0.05);
  assert.equal(animation.clusterFrame(current.state).assignedCount, 0);
  assert.equal(animation.clusterFrame(current.state).objectiveKnown, false);
  assert(current.labels.includes('J=?'));
  assert(current.labels.includes('Memberships: pending'));
  assert(!current.labels.includes('Left group: A and B'));
  assert.deepEqual(current.audit.issues, []);
  const points = current.audit.shapes.filter(
    (s) => s.kind === 'circle' && s.width === 20 && s.fillAlpha > 0.9 && s.alpha > 0.1,
  );
  assert.equal(
    points.length,
    6,
    'Every source observation must remain painted at assignment entry',
  );
});

test('rotated unit projections preserve the perpendicular residual and energy split', () => {
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    const current = animation.projectionFrame({
      beat: 1,
      beatP: 0,
      cues: { 'pca-rotate': cueState(progress) },
    });
    close(Math.hypot(...current.vector), 1);
    current.rows.forEach((row) =>
      close(
        row.point.reduce((sum, v, j) => sum + (v - row.foot[j]) * current.vector[j], 0),
        0,
      ),
    );
    close(
      current.energy +
        current.rows.reduce(
          (sum, row) => sum + row.point.reduce((n, v, j) => n + (v - row.foot[j]) ** 2, 0),
          0,
        ),
      current.total,
    );
  }
});

test('measured one-list and two-list scans resolve their winner only after the candidates arrive', () => {
  for (const [id, reveal, ids, winner] of [
    ['ivf-one', 'cp-ivf-1-1', [2, 3], 2],
    ['ivf-two', 'cp-ivf-2-1', [2, 3, 0, 1], 1],
  ]) {
    const during = paint('ivf', id, 0.4),
      done = paint('ivf', reveal, 2),
      scanComplete = paint('ivf', reveal, -1);
    assert.equal(animation.retrievalFrame(during.state).resultKnown, false);
    assert(during.labels.includes('Scanned winner: pending'));
    assert(
      !scanComplete.labels.some((text) => text.startsWith('Winner:')),
      'Finishing a scan must not reveal its winner before the spoken answer',
    );
    assert.deepEqual(animation.retrievalFrame(done.state).candidates, ids);
    assert.equal(animation.retrievalFrame(done.state).selected, winner);
    assert(done.labels.some((text) => text.startsWith('Winner: ' + ['A', 'B', 'C'][winner])));
  }
});

test('the measured transfer moves the query with the documents and retains three actual coincident identities', () => {
  const before = paint('takeaway', 'transfer-project', -1),
    middle = paint('takeaway', 'transfer-project', 0.5),
    held = paint('takeaway', 'transfer-project', 2);
  assert.deepEqual(animation.transferFrame(before.state).ties, ['L']);
  const current = animation.transferFrame(middle.state);
  close(current.currentQuery[1], 3.2 * (1 - current.amount));
  assert(current.amount > 0 && current.amount < 1);
  assert(middle.labels.includes('Projecting to one coordinate'));
  assert(
    !middle.labels.includes(
      'Three retained identities occupy one coordinate; storage order can break the tie.',
    ),
  );
  const completed = animation.transferFrame(held.state);
  assert.deepEqual(completed.ties, ['B', 'L', 'R']);
  assert.equal(completed.tieKnown, true);
  assert(held.labels.includes('Compressed result: three-way tie'));
  const circles = held.audit.shapes.filter(
    (s) =>
      s.kind === 'circle' &&
      Math.abs(s.center.x - 710) < 0.01 &&
      Math.abs(s.center.y - 602.5) < 0.01,
  );
  for (const width of [18, 32, 46, 62])
    assert(
      circles.some((s) => Math.abs(s.width - width) < 0.01),
      'Coincident documents and query must be physically painted',
    );
  const pixel = held.ctx.getImageData(726, 603, 1, 1).data;
  assert(
    pixel[1] > 180 && pixel[2] > 180 && pixel[0] < 150,
    'The retained login ring must paint actual cyan pixels',
  );
});

test('the measured restored reconstruction equation follows both physical component contributions', () => {
  const v1 = animation.pca.vector,
    v2 = [-v1[1], v1[0]],
    original = animation.messages[2],
    centered = [original.x - animation.pca.mean[0], original.y - animation.pca.mean[1]];
  const z2 = centered.reduce((sum, v, i) => sum + v * v2[i], 0);
  for (const phase of [0.5, 2]) {
    const image = paint('compression', 'restore-second', phase),
      frame = animation.compressionFrame(image.state);
    const expected = animation.pca.mean.map(
      (v, i) => v + animation.pca.scores[2] * v1[i] + frame.restore * z2 * v2[i],
    );
    frame.rows[2].current.forEach((v, i) => close(v, expected[i]));
    assert(
      image.labels.some((text) => text.includes('z_{C2}v_2')),
      'A painted two-component equation must describe the restored point',
    );
    const circle = image.audit.shapes.find(
      (s) =>
        s.kind === 'circle' &&
        s.width === 20 &&
        s.fillAlpha > 0.9 &&
        Math.abs(s.center.x - (259.16666666666663 + expected[0] * 89.16666666666667)) < 0.1 &&
        Math.abs(s.center.y - (815.4166666666667 - expected[1] * 89.16666666666667)) < 0.1,
    );
    assert(circle, 'The equation must correspond to the physically painted C observation');
  }
});

test('restoring the measured second component recovers the unique login neighbor and truthful held status', () => {
  const middle = paint('takeaway', 'transfer-restore', 0.5),
    held = paint('takeaway', 'cp-takeaway-2-1', 2),
    beforeAnswer = paint('takeaway', 'cp-takeaway-2-1', -1);
  assert(middle.labels.includes('Restoring the second component'));
  assert(!beforeAnswer.labels.includes('Restored winner: L · sign-in code help'));
  const current = animation.transferFrame(held.state);
  close(current.amount, 0);
  assert.deepEqual(current.ties, ['L']);
  close(current.distances[2], 0.2);
  assert.equal(current.answerKnown, true);
  assert(held.labels.includes('Restored winner: L · sign-in code help'));
  const point = held.audit.shapes.find(
    (s) =>
      s.kind === 'circle' &&
      s.width === 20 &&
      Math.abs(s.center.x - 710) < 0.01 &&
      Math.abs(s.center.y - (602.5 - (3 * 1000) / 44)) < 0.01,
  );
  assert(
    point?.fillAlpha > 0.5,
    'The restored login observation must be physically back at its source coordinate',
  );
  const pixel = held.ctx.getImageData(710, Math.round(point.center.y), 1, 1).data;
  assert(pixel[1] > 80 && pixel[2] > 80 && pixel[0] < pixel[1]);
});

test('squared-distance sampling excludes selected positions and recomputes nearest-selected mass', () => {
  const first = animation.seedMass([0]),
    next = animation.seedMass([0, 5]);
  first.weights.forEach((v, i) => close(v, [0, 0.68, 19.24, 23.84, 49, 64.64][i]));
  close(first.total, 157.4);
  close(
    first.probabilities.reduce((s, v) => s + v, 0),
    1,
  );
  assert(first.intervals[5][0] <= 0.8 && first.intervals[5][1] > 0.8);
  assert.equal(next.weights[0], 0);
  assert.equal(next.weights[5], 0);
  next.weights.forEach((v, i) => assert(v <= first.weights[i] + 1e-12));
});

test('the empty-center repair changes the center, then recomputes real assignments', () => {
  const row = animation.emptyCenterRepair();
  assert.deepEqual(row.counts, [1, 5, 0]);
  assert.equal(row.farthest, 5);
  assert.deepEqual(row.repaired[2], [9, 1.8]);
  assert(row.after.includes(2));
  assert(Number.isFinite(row.fit.inertia));
  assert(row.fit.inertia >= 0);
});

test('the fresh rectangle holds its answer and computes the intermediate objective from current centers', () => {
  const before = animation.rectangleFrame({ beat: 0, beatP: 1 });
  assert.equal(before.meanKnown, false);
  assert.equal(before.errorKnown, false);
  const middle = animation.rectangleFrame({
    beat: 1,
    beatP: 0,
    cues: { 'cp-fresh-seed-repair-1-0': cueState(0.5) },
  });
  assert.deepEqual(middle.centers, [
    [2, 0],
    [2, 2],
  ]);
  close(middle.error, 80);
  const bad = animation.rectangleFrame({ beat: 1, beatP: 1 });
  close(bad.error, 64);
  assert(bad.errorKnown);
  const repair = animation.rectangleFrame({ beat: 2, beatP: 1 });
  close(repair.error, 4);
  assert(repair.errorKnown);
  assert.deepEqual(repair.data, before.data);
  assert.deepEqual(repair.centers, [
    [0, 1],
    [8, 1],
  ]);
});

test('each actual centered message conserves retained plus residual squared energy', () => {
  const rows = animation.energyRows();
  rows.forEach((row) => close(row.total, row.retained + row.discarded));
  close(
    rows.reduce((s, r) => s + r.total, 0),
    65.63333333333334,
  );
});

test('the fresh source prediction holds both numeric answers and the convergence explanation', () => {
  const question = paintEstimated('fresh-seed-repair', 'cp-fresh-seed-repair-0-5', 2);
  assert(question.includes('J = ?'));
  assert(question.includes('C0 [ ?, ? ]'));
  assert(!question.some((text) => /global optimum|worse shortcut/.test(text)));
  const moving = paintEstimated('fresh-seed-repair', 'cp-fresh-seed-repair-1-0', 0.999);
  assert(moving.includes('C0 [ ?, ? ]'));
  assert(moving.includes('J = ?'));
  const before = paintEstimated('fresh-seed-repair', 'cp-fresh-seed-repair-1-3', -1);
  assert(!before.some((text) => text.includes('global optimum')));
  const after = paintEstimated('fresh-seed-repair', 'cp-fresh-seed-repair-1-3', 2);
  assert(after.some((text) => text.includes('do not establish the global optimum')));
});
