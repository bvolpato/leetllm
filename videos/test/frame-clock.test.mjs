import { strict as assert } from 'node:assert';
import test from 'node:test';
import { checkPacketClock } from '../lib/frame-clock.mjs';

function example(lengths = [3, 5, 4], joinAdjustment = -20) {
  const count = lengths.reduce((a, b) => a + b);
  const pts = [];
  let adjustment = 0;
  for (const [index, length] of lengths.entries()) {
    if (index) adjustment += joinAdjustment;
    for (let i = 0; i < length; i++) pts.push({ pts: pts.length * 1000 + adjustment });
  }
  const duration = count * 1000 + adjustment;
  const stream = {
    r_frame_rate: '30/1',
    avg_frame_rate: `${count * 30000}/${duration}`,
    time_base: '1/30000',
    duration_ts: duration,
    start_pts: 0,
    nb_frames: count,
  };
  const timeline = {
    fps: 30,
    intro: { frames: lengths[0] },
    scenes: lengths.slice(1).map((frames) => ({ frames })),
  };
  const receipt = { fps: stream.avg_frame_rate, frameAudit: { frames: count } };
  return { pts, stream, timeline, receipt };
}
function verify({ pts, stream, timeline, receipt }) {
  checkPacketClock(stream, pts, timeline, receipt, 30);
}

test('a lesson-first clock includes the first authored scene and requires matching opening records', () => {
  const film = example();
  film.timeline.scenes.unshift({ ...film.timeline.intro, start: 0 });
  film.timeline.intro = null;
  film.timeline.opening = 'lesson';
  film.receipt.opening = 'lesson';
  film.receipt.brandIntro = null;
  verify(film);
  assert.throws(
    () =>
      checkPacketClock(film.stream, film.pts, film.timeline, film.receipt, 30, {
        requireBrand: true,
      }),
    /missing brand intro/,
  );
  delete film.receipt.opening;
  assert.throws(() => verify(film), /lesson opening/);
  delete film.timeline.opening;
  assert.throws(() => verify(film), /missing brand intro/);
});

test('a branded delivery joins from the four-second title directly to the first lesson frame', () => {
  const film = example([120, 5, 4], 0);
  film.timeline.intro = { id: 'leetllm-intro', frames: 120, start: 0, duration: 4 };
  film.receipt.brandIntro = { frames: 120, duration: 4 };
  film.timeline.scenes[0].start = 4;
  const check = () =>
    checkPacketClock(film.stream, film.pts, film.timeline, film.receipt, 30, {
      requireBrand: true,
    });
  check();
  film.timeline.scenes[0].start += 1 / 30;
  assert.throws(check, /gap before the first lesson frame/);
});

test('real join rounding accepts historical average and current nominal receipts in presentation order', () => {
  const film = example();
  film.pts.reverse();
  verify(film);
  film.receipt = { ...film.receipt, fps: '30/1', averageFps: film.stream.avg_frame_rate };
  verify(film);
  verify(example([3, 5, 4], 0));
});

test('a nominal header cannot hide dropped frames, motion jitter or excessive join drift', () => {
  for (const mutate of [
    (f) => f.pts.pop(),
    (f) => (f.pts[2].pts += 20),
    (f) => (f.pts[1].pts = f.pts[0].pts),
    (f) => f.timeline.scenes[0].frames++,
    (f) => (f.stream.duration_ts += 40),
    (f) => (f.stream.r_frame_rate = '24/1'),
    (f) => (f.receipt.averageFps = '31/1'),
  ]) {
    const film = example();
    film.receipt.fps = '30/1';
    mutate(film);
    assert.throws(() => verify(film), /picture clock/);
  }
  assert.throws(() => verify(example([3, 5], -32)), /scene join/);
  assert.throws(
    () => verify(example(Array(30).fill(3), -20)),
    /presentation timestamp|final frame/,
  );
});
