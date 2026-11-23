import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildTimeline,
  estimateTakes,
  firstFrameAt,
} from '../../../director-cuts/lesson-runtime/timeline.mjs';

export function checkPictures(draw) {
  const chapters = JSON.parse(readFileSync(new URL('./narration.json', import.meta.url), 'utf8'));
  const beats = chapters.flatMap((chapter, chapterIndex) =>
    chapter.beats.map((b, beatIndex) => ({ ...b, chapterIndex, beatIndex })),
  );
  const timeline = buildTimeline({ beats }, estimateTakes({ beats }));
  function at(id, phrase = 'hold', delta = 0, clauseEnd = false) {
    const entry = timeline.schedule.find((e) => e.beat.id === id);
    const local =
      phrase === 'hold'
        ? entry.frames - 1
        : firstFrameAt(clauseEnd ? entry.wordCue(phrase).end : entry.phraseStart(phrase));
    const marks = [];
    const ctx = new Proxy(
      { fillText: (s, x, y) => marks.push({ s: String(s), x, y }) },
      {
        get: (o, k) => (k in o ? o[k] : () => {}),
      },
    );
    draw(ctx, timeline.clockAtFrame(entry.startFrame + local + delta));
    return {
      words: marks.map((m) => m.s),
      at: (x, y) => marks.find((m) => m.x === x && m.y === y)?.s,
      xOf: (s) => marks.find((m) => m.s === s)?.x,
    };
  }
  const late = at('c01-b01'),
    back = at('c01-b02', 'The eighteen jobs');
  assert(late.words.includes('ESCALATED') && !back.words.includes('ESCALATED'));
  for (const frame of [late, back]) assert(frame.words.includes('18 jobs recorded at 09:00'));
  assert.deepEqual(
    [1, 2, 3, 4].map((_, i) => at('c01-b02').at(1240, 381 + i * 119)),
    ['?', '?', '?', '?'],
  );
  const oldDistance = at('c05-b05', 'Its distance from the old mean is two', 0, true);
  const movingMean = at('c05-b05', 'The new mean is three');
  assert(oldDistance.words.includes('Old distance  2'));
  assert.equal(oldDistance.at(130, 832), '2');
  assert(oldDistance.xOf('Mean 2') < movingMean.xOf('Mean'));
  assert(movingMean.xOf('Mean') < at('c05-b05').xOf('Mean 3'));
  assert(!movingMean.words.includes('New distance  1'));
  const predictSix = at('c05-b05');
  assert(predictSix.words.includes('Next reading   6'));
  assert(!predictSix.words.includes('Mean 4') && !predictSix.words.includes('New distance  2'));
  for (const [id, clause, before, product, total] of [
    ['c05-b04', 'it adds zero to M two', '0', '2 × 0 = 0', '0 + 0 = 0'],
    ['c05-b05', 'add two times one to M two', '0', '2 × 1 = 2', '0 + 2 = 2'],
    ['c05-b06', 'taking M two from two to eight', '2', '3 × 2 = 6', '2 + 6 = 8'],
  ]) {
    const pending = at(id, clause, -1, true);
    const settled = at(id, clause, 0, true);
    assert.equal(pending.at(1180, 832), before);
    assert(!pending.words.includes(product));
    assert.equal(settled.at(535, 832), product);
    assert.equal(settled.at(1180, 832), total);
  }
  assert(at('c05-b06').words.includes('Population variance = 8/3'));
  assert(at('c05-b06').words.includes('Sample variance = 8/2'));
  const foldBefore = at('c10-b04'),
    foldAfter = at('c10-b06');
  assert.deepEqual([foldBefore.at(417, 859.5), foldAfter.at(417, 859.5)], ['0.6875', '0.4167']);
  assert.deepEqual([foldBefore.at(1281, 859.5), foldAfter.at(1281, 859.5)], ['0.75', '0.75']);
  const bay = at('c07-b02');
  assert.deepEqual(
    [bay.at(295, 850), bay.at(670, 850), bay.at(1170, 850), bay.at(1545, 850)],
    ['0', '0', '0', '1'],
  );
  const returnCue = 'Return to the nine';
  const orderCue = 'Put this row into';
  for (const [frame, backlog, missing, sensor] of [
    [at('c13-b04', 'Now send a measured zero', -1), '0', '1', 'blank'],
    [at('c13-b04'), '0', '0', '0 jobs'],
    [at('c14-b01', returnCue, -1), '0', '0', '0 jobs'],
    [at('c14-b01', returnCue), '18', '0', '18 jobs'],
    [at('c14-b01', orderCue, -1), '18', '0', '18 jobs'],
  ]) {
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(i => frame.at(1072, 347 + 95 * i)),
      ['a100-pool', '42', '0.5', backlog, missing, '0']);
    assert.equal(frame.at(1468.5, 543.5), sensor);
  }
  const plugged = at('c14-b01', orderCue);
  assert.equal(plugged.at(1270, 264), '09:00 BACKLOG SENSOR');
  assert.deepEqual([plugged.at(1270, 408), plugged.at(1478, 408)], ['18', '0']);
  const original = at('c14-b02'),
    swapped = at('c14-b04', 'Forty-two now supplies'),
    restored = at('c14-b04');
  const values = ['1', '0', '0', '42', '0.5', '18', '0', '0'];
  for (const [state, swap, total] of [
    [original, false, '0.61'],
    [swapped, true, '1.025'],
    [restored, false, '0.61'],
  ]) {
    const received = values.slice();
    if (swap) [received[3], received[4]] = [received[4], received[3]];
    const weights = [0, 0, 0, 0.01, 0.02, 0.01, 0, 0];
    const actualNames = [
      'A100',
      'H100',
      'other',
      'queue min',
      'age h',
      'backlog',
      'missing',
      'priority',
    ];
    received.forEach((v, i) => {
      const x = 230 + 208 * i,
        source = swap && (i === 3 || i === 4) ? 7 - i : i;
      assert.equal(state.at(x, 408), v);
      assert.equal(state.at(x, 360), actualNames[source]);
      assert.equal(state.at(x, 647), actualNames[i]);
      assert.equal(state.at(x, 715), '×' + weights[i]);
      assert.equal(state.at(x, 838), String(Number((Number(v) * weights[i]).toFixed(3))));
    });
    assert.equal(state.at(670, 941), total);
  }
  const editCue = 'The age delivered';
  for (const [frame, served, cap] of [
    [at('c15-b01', editCue, -1), 180, 180],
    [at('c15-b01', editCue), 200, 360],
  ]) {
    assert.equal(frame.at(100, 176), 'Compare training and serving caps');
    assert.equal(frame.at(256 + 180 * 3.78, 515), 'cap 180');
    assert.equal(frame.at(256 + 180 * 3.78, 381), 'input 180');
    assert.equal(frame.at(256 + cap * 3.78, 761), 'cap ' + cap);
    assert.equal(frame.at(256 + served * 3.78, 627), 'input ' + served);
  }
  for (const [offset, time, lag] of [[-1, '08:00', 120], [20, '09:02', 58], [39, '10:00', 0]]) {
    const frame = at('c18-b04', 'Follow the feed watermark', offset);
    assert.equal(frame.at(100, 176), 'Compare heartbeat age and feed lag');
    assert.equal(frame.at(150, 776), 'Feed watermark   ' + time);
    assert.equal(frame.at(153, 908), 'Heartbeat age   2 h');
    assert.equal(frame.at(1103, 908), 'Feed lag   ' + lag + ' min');
  }
  const a = at('c20-b05'),
    op = at('c20-b06', 'Restore the seven'),
    result = at('c20-b06');
  for (const [frame, repaired] of [
    [a, false],
    [op, true],
    [result, true],
  ]) {
    const nums = ['0', '0', '1', '20', '5/6', '0', '0', '0'];
    for (let i = 0; i < 8; i++) {
      assert.equal(frame.at(433, 425 + i * 53), nums[i]);
      assert.equal(frame.at(1329, 425 + i * 53), repaired && i === 5 ? '7' : nums[i]);
    }
    assert.equal(frame.words.filter((w) => w === '0.25').length, 2);
  }
  assert(!a.words.includes('ALERT') && !a.words.includes('0.2867'));
  assert(result.words.includes('0.2167') && result.words.includes('0.2867'));
  assert.equal(result.at(620, 861), 'QUIET');
  assert.equal(result.at(1516, 861), 'ALERT');
  return true;
}
