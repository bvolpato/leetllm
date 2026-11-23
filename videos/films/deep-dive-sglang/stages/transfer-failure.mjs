import { motion, settled } from '../construction.mjs';
import { kvHandoff } from '../model.mjs';
import { payloadSlots, slot, text } from '../defaults.mjs';

const reserved = 512;
const initial = 384;
const attempt = 8;

export function drawTransferFailure(ctx, scene, state, api) {
  const { C } = api;
  const received =
    initial + Math.floor((reserved - initial) * motion(state, 'transfer-last-block', 1, 0.18, 0.4));
  const oldSignal = settled(state, 'transfer-old', 1, 0.72);
  const signal = settled(state, 'transfer-current', 2, 0.24) ? attempt : oldSignal ? 7 : null;
  const replay = settled(state, 'transfer-layout', 2, 0.78);
  const layout = replay ? 'L1' : 'L2';
  const result = kvHandoff({
    reserved,
    received,
    currentAttempt: attempt,
    readyAttempt: signal,
    readerReady: signal !== null,
    layout: layout === 'L2',
  });
  text(ctx, api, 'R42   ·   decode attempt 8', 170, 299, 44, C.ink);
  text(
    ctx,
    api,
    replay ? 'Replay with a changed layout' : 'Original transfer',
    1730,
    299,
    33,
    C.blue,
    'right',
  );
  api.focus.target('transfer-buffer', () => {
    text(ctx, api, 'Destination KV', 170, 404, 34, C.ink);
    text(ctx, api, received + ' / ' + reserved + ' MiB received', 1730, 404, 39, C.cyan, 'right');
    payloadSlots(ctx, api, {
      x: 170,
      y: 445,
      width: 1560,
      height: 90,
      received,
      reserved,
      segments: 4,
    });
    if (settled(state, 'transfer-short', 1, 0.15))
      text(ctx, api, result.missing + ' MiB missing', 1730, 588, 33, C.cyan, 'right');
  });
  api.focus.target('transfer-format', () => {
    text(ctx, api, 'Required layout   L2', 174, 680, 37, C.ink);
    slot(ctx, api, 'Received   ' + layout, 170, 719, 440, 92, C.blue);
  });
  api.focus.target('transfer-event', () => {
    text(ctx, api, 'Required attempt   8', 724, 680, 37, C.ink);
    slot(
      ctx,
      api,
      signal === null ? 'No ready event' : 'Ready   #' + signal,
      720,
      719,
      440,
      92,
      signal === null ? C.muted : C.blue,
    );
  });
  const gapShown = settled(state, 'transfer-short', 1, 0.15);
  const readShown = settled(state, 'transfer-read', 2, 0.46);
  const verdict = replay
    ? settled(state, 'transfer-hold', 3, 0.24)
    : result.canDecode
      ? readShown
      : gapShown;
  api.focus.target('transfer-consumer', () => {
    text(ctx, api, 'Decode worker', 1280, 680, 37, C.ink);
    const label =
      state.beat === 0
        ? 'Awaiting handoff'
        : verdict
          ? result.canDecode
            ? 'Read KV'
            : 'Hold'
          : 'Read KV?';
    slot(
      ctx,
      api,
      label,
      1276,
      719,
      454,
      92,
      state.beat === 0 ? C.muted : verdict ? (result.canDecode ? C.green : C.pink) : C.yellow,
      42,
    );
  });
  const note =
    state.beat === 0
      ? 'How much still has to arrive?'
      : replay
        ? 'Same bytes, model, dtype, positions and current ready event'
        : signal === 7
          ? 'The last 128 MiB are here. This event came from attempt 7.'
          : 'Model R7   ·   BF16   ·   positions 0–4095';
  text(ctx, api, note, 960, 963, 32, C.ink, 'center');
}

export default {
  id: 'transfer-failure',
  draw: drawTransferFailure,
  cues: [
    'transfer-segments',
    'transfer-short',
    'transfer-last-block',
    'transfer-old',
    'transfer-current',
    'transfer-read',
    'transfer-layout',
    'transfer-hold',
  ],
};
