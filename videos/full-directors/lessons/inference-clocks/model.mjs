import assert from 'node:assert/strict';

export const prompt = ['The', 'birds', 'sing', 'softly'];
export const words = ['at', 'dawn', 'too', '.'];
export const times = [320, 355, 392, 428];
export const other = [80, 115, 392, 428];
export const practice = [410, 454, 495, 542];
export const joined = (xs) => xs.join(' ').replace(/ \./g, '.');
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const roundPages = (n) => Math.ceil(n / 16);
export const fmt = (n) => n.toLocaleString('en-US');

export function metrics(t) {
  const gaps = t.slice(1).map((x, i) => x - t[i]);
  const span = sum(gaps);
  return {
    first: t[0],
    gaps,
    span,
    mean: gaps.length ? span / gaps.length : null,
    rate: span > 0 ? (1000 * gaps.length) / span : null,
    full: (1000 * t.length) / t.at(-1),
  };
}
export function path(queue) {
  const spans = [queue, 10, 230, 10];
  const first = sum(spans);
  return { spans, first, times: times.map((t) => t - times[0] + first), client: first + 60 };
}
export const transit = 30;
export const flush = 470;
export const steady = times.map((t) => t + transit);
export const buffered = [steady[0], steady[1], flush, flush];
export const slowServer = [320, 355, 438, 440];
export function stream(t, events = buffered) {
  const sent = times.filter((x) => x <= t).length;
  const received = events.filter((x) => x <= t).length;
  return {
    sent,
    received,
    pending: words.slice(received, sent),
    text: joined(words.slice(0, received)),
  };
}
export function history(consumedOutputs, emitted, rebuiltFraction = 1) {
  const positions = [...prompt, ...words.slice(0, consumedOutputs)];
  const pairs = positions.slice(0, Math.floor(positions.length * rebuiltFraction));
  return { positions, pairs, output: words.slice(0, emitted) };
}
export const roof = (rows, bw = 10, peak = 200) => Math.min(rows * bw, peak);
export const h100 = { sparse: 1979, factor: 2, bandwidth: 3.35, weights: 54 };
export const dense = h100.sparse / h100.factor;
export const ridge = dense / h100.bandwidth;
export const weightRate = (1000 * h100.bandwidth) / h100.weights;
export const layout = { heads: 4, readers: 24, layers: 16, otherLayers: 48, width: 256 };
export const perPosition = (bytes = 2) => 2 * layout.heads * layout.layers * layout.width * bytes;
export const GiB = 2 ** 30,
  MiB = 2 ** 20;
export const pool = 12e9;
export const liveBytes = 40 * 4096 * perPosition();
export const demand = (n) => liveBytes + roundPages(n) * 16 * perPosition();
export const remaining = (80 - 54 - 8) * 1e9;
export const pagesPerUser = (users) => Math.floor(remaining / (users * 16 * perPosition()));
export const recurrent = 144 * MiB;
export function cost(bytes, state = 0) {
  const raw = 5120 * perPosition(bytes);
  return { raw, state, count: Math.floor(remaining / (raw + state)) };
}
export const scheduling = { prompt: 8192, prefill: 200, decode: 35, chunks: 4, link: 200 };
export function workerTurns(chunks) {
  const chunkMs = scheduling.prefill / chunks;
  return Array.from({ length: chunks }, (_, i) => {
    const start = i * (chunkMs + scheduling.decode);
    const prefillEnd = start + chunkMs;
    return { start, prefillEnd, decodeEnd: prefillEnd + scheduling.decode };
  });
}
export const handoffPositions = 4096;
export const handoffKvBytes = handoffPositions * perPosition();
export const linkGBps = scheduling.link / 8;
export const kvTransferMs = (handoffKvBytes / (linkGBps * 1e9)) * 1000;
export const reserves = [56, 40, 24].map(roundPages);
export const finalBytes = (b) => sum(reserves) * 16 * perPosition(b);
export const offered = { onTime: 12, rejected: 5, failed: 3, seconds: 20 };
export const fraction = offered.onTime / (offered.onTime + offered.rejected + offered.failed);
export function checkModel() {
  assert.deepEqual(metrics(times).gaps, [35, 37, 36]);
  assert.equal(metrics(times).mean, 36);
  assert.equal(metrics(times).rate.toFixed(1), '27.8');
  assert.equal(metrics(times).full.toFixed(2), '9.35');
  assert.deepEqual(metrics(other).gaps, [35, 277, 36]);
  assert.equal(metrics(other).mean, 116);
  assert.equal(metrics(other).full, metrics(times).full);
  assert.equal(metrics([320]).rate, null);
  for (const queue of [0, 35, 70]) {
    const p = path(queue);
    assert.deepEqual(metrics(p.times).gaps, metrics(times).gaps);
    assert.equal(p.first, queue + 250);
    assert.equal(p.client, p.times[0] + 60);
  }
  assert.deepEqual(path(0).times, [250, 285, 322, 358]);
  for (let i = 0; i < 4; i++) {
    const h = history(i, i + 1);
    assert.equal(h.pairs.length, prompt.length + h.output.length - 1);
    assert.deepEqual(h.pairs.slice(4), h.output.slice(0, -1));
    assert.equal(h.output.at(-1), words[i]);
  }
  assert.deepEqual(
    [0, 0.5, 1].map((f) => history(3, 4, f).pairs.length),
    [0, 3, 7],
  );
  assert.deepEqual(steady, [350, 385, 422, 458]);
  assert.deepEqual(stream(469), { sent: 4, received: 2, pending: ['too', '.'], text: 'at dawn' });
  assert.deepEqual(stream(470), { sent: 4, received: 4, pending: [], text: 'at dawn too.' });
  assert.equal((flush - buffered[1]) / 2, 42.5);
  assert.deepEqual(
    [times, slowServer].map((t) => [t[2] - t[1], flush - t[2]]),
    [
      [37, 78],
      [83, 32],
    ],
  );
  assert.deepEqual(
    [1, 8, 20, 32].map((n) => roof(n)),
    [10, 80, 200, 200],
  );
  assert.deepEqual([dense, Math.round(ridge), Math.round(weightRate)], [989.5, 295, 62]);
  assert.equal(perPosition(), 65536);
  assert.equal((4096 * perPosition()) / GiB, 0.25);
  assert.equal(16 * roundPages(17) - 17, 15);
  assert.deepEqual([50, 100].map(pagesPerUser), [343, 171]);
  assert.deepEqual(
    [16384, 65536].map((n) => [(demand(n) / 1e9).toFixed(2), demand(n) <= pool]),
    [
      ['11.81', true],
      ['15.03', false],
    ],
  );
  assert.deepEqual(
    [cost(2).count, cost(1).count, cost(2, recurrent).count, cost(1, recurrent).count],
    [53, 107, 36, 56],
  );
  const wholePrompt = workerTurns(1);
  const chunkedPrompt = workerTurns(scheduling.chunks);
  assert.deepEqual(wholePrompt, [{ start: 0, prefillEnd: 200, decodeEnd: 235 }]);
  assert.deepEqual(
    chunkedPrompt.map(({ decodeEnd }) => decodeEnd),
    [85, 170, 255, 340],
  );
  assert.equal(sum(chunkedPrompt.map(({ start, prefillEnd }) => prefillEnd - start)), 200);
  assert.equal(chunkedPrompt.at(-1).prefillEnd, 305);
  assert.deepEqual([handoffKvBytes / MiB, linkGBps, kvTransferMs.toFixed(1)], [256, 25, '10.7']);
  assert.equal(scheduling.prompt, 8192);
  assert.equal(handoffPositions, 4096);
  assert.deepEqual(metrics(practice).gaps, [44, 41, 47]);
  assert.equal(metrics(practice).mean, 44);
  assert.ok(metrics(practice).first <= 450 && Math.max(...metrics(practice).gaps) <= 50);
  assert.equal(metrics(practice).rate.toFixed(1), '22.7');
  assert.deepEqual(reserves, [4, 3, 2]);
  assert.deepEqual([finalBytes(2) / MiB, finalBytes(1) / MiB], [9, 4.5]);
  assert.equal(fraction, 0.6);
  assert.equal(offered.onTime / offered.seconds, 0.6);
}
