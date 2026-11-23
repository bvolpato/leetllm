import { text } from '../defaults.mjs';

const coldPrefill = 72,
  warmPrefill = 11,
  decode = 24;
const saved = coldPrefill - warmPrefill;

export function drawAffinityWait(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id) => state.cues?.[id]?.progress ?? 0;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const extra = Math.floor(saved * progress('aff-tie') + (70 - saved) * progress('aff-extra'));
  const left = 422,
    unit = 11.15;
  const coldEnd = coldPrefill + decode,
    warmEnd = extra + warmPrefill + decode;
  api.focus.target('aff-rails', () => {
    text(ctx, api, 'Milliseconds after the shared queue wait', left, 285, 36, C.muted);
    for (const ms of [0, 20, 40, 60, 80, 100, 120]) {
      const x = left + ms * unit;
      api.line(ctx, x, 337, x, 353, C.muted, 2);
      text(ctx, api, ms, x, 405, 31, C.muted, 'center');
    }
    for (const [i, name, queue, prefill] of [
      [0, 'Cold', 0, coldPrefill],
      [1, 'Warm', extra, warmPrefill],
    ]) {
      const y = 458 + i * 200;
      text(ctx, api, name, 145, y + 57, 48);
      let x = left;
      for (const [duration, color] of [
        [queue, C.yellow],
        [prefill, C.cyan],
        [decode, C.blue],
      ]) {
        if (!duration) continue;
        const w = duration * unit;
        api.rect(ctx, x, y, w, 82, color, null, 0, 0);
        if (w > 65) text(ctx, api, duration, x + w / 2, y + 57, 37, C.bg, 'center');
        x += w;
      }
      text(ctx, api, queue + prefill + decode + ' ms', x + 16, y + 55, 34, C.ink);
    }
    const key = [
      ['Extra queue', C.yellow],
      ['Prefill', C.cyan],
      ['Decode', C.blue],
    ];
    key.forEach(([label, color], i) => {
      const x = 465 + i * 405;
      api.rect(ctx, x, 815, 30, 30, color, null, 0, 2);
      text(ctx, api, label, x + 54, 842, 33);
    });
    let note = 'How much extra waiting can warm afford?';
    if (after('aff-tie')) note = 'Equal finishes at ' + saved + ' ms of extra wait';
    if (progress('aff-extra') > 0) note = 'Which worker finishes first?';
    if (after('aff-win')) note = 'Send to the cold worker';
    if (after('aff-nine')) note = 'Cold finishes ' + (warmEnd - coldEnd) + ' ms earlier';
    text(ctx, api, note, 960, 976, 42, C.yellow, 'center');
  });
}
export default {
  id: 'affinity-wait',
  draw: drawAffinityWait,
  cues: ['aff-services', 'aff-tie', 'aff-extra', 'aff-win', 'aff-nine'],
};
