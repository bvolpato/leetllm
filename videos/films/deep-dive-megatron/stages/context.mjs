import { sum } from '../arithmetic.mjs';
import { contextMergeSnapshot } from '../construction.mjs';
import { spokenProgress } from '../defaults.mjs';
import { context } from '../fixtures.mjs';

const query = 6;
const localPositions = [0, 1, 2, query];
const remotePositions = [3, 4, 5, 7];
const remoteValues = [...context[1], 90];
const receiptCues = ['ctx-receive-three', 'ctx-receive-four', 'ctx-receive-five'];

export function drawContext(ctx, scene, state, api) {
  const { C } = api;
  const { beat } = state;
  const progress = (id, b, start, end) => spokenProgress(state, api, id, b, start, end);
  const travels = receiptCues.map((id, i) => progress(id, 2, 0.09 + i * 0.12, 0.21 + i * 0.12));
  const showMask = progress('ctx-mask', 2, 0.84, 0.98) > 0;
  const received = travels.filter((p) => p >= 1).length;
  const { local, remote, count, value } = contextMergeSnapshot(beat, 0, received);
  const left = 364,
    pitch = 174,
    w = 144,
    h = 90,
    localY = 399,
    remoteY = 616;
  const x = (pos) => left + pos * pitch;
  const label = (s, cx, y, size, color, align = 'center') =>
    api.text(ctx, s, cx, y, size, color, align);
  function valueAt(pos, y, v, color, filled, showValue = true) {
    api.rect(ctx, x(pos), y, w, h, filled ? color : C.panel, color, 5);
    if (showValue) label(String(v), x(pos) + w / 2, y + 60, 45, filled ? C.bg : color);
  }

  label('Position', 105, 319, 33, C.muted, 'left');
  for (let pos = 0; pos <= 7; pos++)
    label(String(pos), x(pos) + w / 2, 319, 41, pos === query ? C.yellow : C.ink);
  api.focus.target('query-marker', () => {
    label('Query', x(query) + w / 2, 232, 37, C.yellow);
    api.arrow(ctx, x(query) + w / 2, 246, x(query) + w / 2, 272, C.yellow, 3);
  });
  label("Query's worker", 105, localY + 53, 31, C.blue, 'left');
  for (let pos = 0; pos < 8; pos++) {
    const index = localPositions.indexOf(pos);
    if (index >= 0) valueAt(pos, localY, local[index], C.blue, true);
    else if (pos > query && showMask) label('future', x(pos) + w / 2, localY + 56, 30, C.muted);
    else api.rect(ctx, x(pos), localY, w, h, C.panel, C.muted, 5);
  }

  if (beat >= 1) {
    label('Other worker', 105, remoteY + 55, 33, C.pink, 'left');
    api.focus.target('remote-values', () => {
      remotePositions.forEach((pos, i) => {
        const allowed = pos <= query;
        const distance = (travels[i] ?? 0) * (remoteY - localY);
        const drawValue = () =>
          valueAt(
            pos,
            remoteY,
            remoteValues[i],
            !allowed && showMask ? C.muted : C.pink,
            false,
            distance === 0 || distance > h + 4,
          );
        if (allowed) drawValue();
        else api.focus.target('future-value', drawValue);
        if (allowed && travels[i] > 0) {
          valueAt(pos, remoteY - (remoteY - localY) * travels[i], remoteValues[i], C.pink, true);
        }
      });
    });
    if (showMask) {
      const boundary = (x(query) + w + x(query + 1)) / 2;
      api.line(ctx, boundary, 342, boundary, remoteY + h + 7, C.yellow, 3);
    }
  }

  api.focus.target('attention-result', () => {
    const numerator = [sum(local), ...remote].join(' + ');
    const denom = received ? local.length + ' + ' + received : String(local.length);
    const ready =
      received < context[1].length
        ? progress('ctx-local-sum', 0, 0.78, 0.87) >= 1
        : progress('ctx-full-mean', 2, 0.56, 0.68) >= 1;
    label(beat < 1 || received < 3 ? 'Running mean' : 'Prefix mean', 105, 870, 39, C.ink, 'left');
    label(numerator, 844, 815, 45, C.ink);
    api.line(ctx, 585, 837, 1103, 837, C.ink, 4);
    label(denom, 844, 898, 45, C.ink);
    label(
      ready ? (received ? '≈ ' + value.toFixed(3) : '= ' + value.toFixed(2)) : '= ?',
      1297,
      866,
      50,
      received === 3 ? C.green : C.yellow,
    );
    label(count + ' of 7 keys', 1637, 864, 31, C.muted);
  });

  if (beat === 3) {
    const wrong = (sum(local) / local.length + sum(remote) / remote.length) / 2;
    const showWrong = progress('ctx-equal-peers', 3, 0.12, 0.21) >= 1;
    const showMass = progress('ctx-masses', 3, 0.43, 0.63) >= 1;
    api.focus.target('mean-comparison', () => {
      label(
        'One vote per worker' + (showWrong ? '   ≈ ' + wrong.toFixed(3) : '   ?'),
        505,
        998,
        35,
        C.pink,
      );
      label(
        showMass
          ? 'Key shares    4/7 local    +    3/7 remote'
          : 'How much of the vote belongs to each worker?',
        1385,
        998,
        33,
        showMass ? C.green : C.muted,
      );
    });
  }
}

export default {
  id: 'context',
  draw: drawContext,
  cues: [
    'ctx-find-query',
    'ctx-local-sum',
    'ctx-remote-options',
    ...receiptCues,
    'ctx-full-mean',
    'ctx-mask',
    'ctx-equal-peers',
    'ctx-masses',
  ],
};
