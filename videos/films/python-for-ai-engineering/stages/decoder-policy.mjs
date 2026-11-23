import { cueProgress, pyP } from '../construction.mjs';
import { classifyJsonRow, exactMatch, mix } from '../arithmetic.mjs';
import { decoderState } from '../model.mjs';
import { box, pyMark, rail, text } from '../defaults.mjs';

const savedPairs = [
  ['prompt', 'Q'],
  ['expected', 'hold'],
  ['expected', ' SENT '],
  ['prediction', 'sent'],
  ['confidence', true],
];
const firstExpected = savedPairs.find(pair => pair[0] === 'expected');
const editedPairs = savedPairs.filter(pair => pair !== firstExpected);

function repeatedKey(pairs) {
  const seen = new Set();
  for (const [key] of pairs) {
    if (seen.has(key)) return key;
    seen.add(key);
  }
}

function drawTwoRecords(ctx, api, state) {
  const c = api.C;
  const ignored = cueProgress(state, 'extra-flags', 3, 0.33, 0.49) === 1;
  const edit = cueProgress(state, 'edit-copy', 3, 0.53, 0.74);
  const selected = cueProgress(state, 'keep-second-expected', 4, 0.08, 0.2) === 1;
  const showDefault = cueProgress(state, 'default-match', 4, 0.25, 0.43) === 1;
  const xs = [535, 1200];
  text(ctx, api, 'Fields in file order', 155, 282, 32, c.muted);
  text(ctx, api, 'Default decoder', 155, 780, 36, c.cyan);
  text(ctx, api, 'Strict hook', 155, 922, 36, c.blue);
  const records = edit === 0 ? [savedPairs] : [savedPairs, edit === 1 ? editedPairs : savedPairs];
  records.forEach((pairs, i) => {
    const x = xs[i];
    const repeated = repeatedKey(pairs);
    const { row } = classifyJsonRow(Object.fromEntries(pairs), 1);
    const decision = exactMatch(row.expected, row.prediction) ? 'True' : 'False';
    text(ctx, api, i === 0 ? 'Saved row' : 'Edited copy', x, 282, 42, c.ink);
    pairs.forEach(pair => {
      const [key, value] = pair;
      const y = 362 + savedPairs.indexOf(pair) * 67;
      const skipped = ignored && !(key in row);
      const losing = selected && repeated === key && value !== row[key];
      const removing = i === 1 && pair === firstExpected;
      ctx.save();
      if (removing) ctx.globalAlpha *= 1 - edit;
      text(ctx, api, key + ': ' + JSON.stringify(value), x, y, 38,
        removing ? c.pink : skipped || losing ? c.muted : c.ink, 'left', true);
      ctx.restore();
      if (selected && key === 'expected' && value === row[key])
        api.line(ctx, x - 16, y - 35, x - 16, y + 4, c.cyan, 5);
    });
    const showStrict = (i === 0
      ? cueProgress(state, 'strict-left', 4, 0.58, 0.69)
      : cueProgress(state, 'strict-right', 4, 0.8, 0.96)) === 1;
    const comparison = [row.expected, row.prediction]
      .map(label => JSON.stringify(label.trim().toLowerCase())).join(' == ');
    rail(ctx, api, x - 15, 711, 585, showDefault ? comparison + '  →  ' + decision : '?',
      showDefault ? c.green : c.muted, 104, 34);
    rail(ctx, api, x - 15, 853, 585, showStrict ? (repeated ? 'reject: repeated ' + repeated : decision) : '?',
      showStrict ? (repeated ? c.pink : c.green) : c.muted, 104, 34);
  });
}

export function drawDecoderPolicy(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  pyMark(api, 'decoder-policy', () => {
    if (currentBeat === 0) {
      const progress = pyP(state, 'decoder-policy');
      const translations = [
        ['{}', 'dict'],
        ['[]', 'list'],
        ['true', 'True · bool'],
        ['null', 'None'],
        ['7', 'int'],
        ['0.75', 'float'],
      ];
      translations.forEach(([raw, type], i) => {
        const x = 220 + (i % 3) * 560,
          y = 320 + Math.floor(i / 3) * 210;
        rail(ctx, api, x, y, 440, raw, api.C.blue, 85, 39);
        text(
          ctx,
          api,
          i < Math.ceil(progress * 6) ? '→ ' + type : '→ ?',
          x + 40,
          y + 145,
          34,
          api.C.cyan,
          'left',
          true,
        );
      });
      const digitLimit = cueProgress(state, 'digit-limit', 0, 0.42, 0.67);
      if (decoderState(state).arrayRejected) {
        rail(
          ctx,
          api,
          350,
          820,
          1220,
          '[]  →  list  →  TypeError: expected a JSON object',
          api.C.pink,
          95,
          33,
        );
      } else if (digitLimit > 0) {
        rail(ctx, api, 235, 818, 1450,
          digitLimit === 1 ? '4,301 decimal digits  →  ValueError in json.loads' : 'Default limit: 4,300 decimal digits',
          api.C.yellow, 100, 34);
      }
    } else if (currentBeat >= 3) {
      drawTwoRecords(ctx, api, state);
    } else {
      const { pairs, expected, value, savedKey, nextKey, advance, compared, strict } = decoderState(state);
      const replay = currentBeat === 2;
      const c = api.C;
      const columns = [165, 995];
      text(
        ctx,
        api,
        'Request 102   /   expected ' + JSON.stringify(expected),
        165,
        275,
        37,
        c.ink,
        'left',
        true,
      );
      text(ctx, api, 'Prediction fields in file order', 165, 363, 32, c.muted);
      pairs.forEach(([key, word], i) => {
        const x = columns[i];
        box(ctx, api, x, 395, 760, 114, c.blue);
        text(
          ctx,
          api,
          JSON.stringify(key) + ': ' + JSON.stringify(word),
          x + 32,
          466,
          41,
          c.ink,
          'left',
          true,
        );
      });

      const startX = columns[0] + 50;
      const endX = columns[1] + 50;
      const readerX = mix(startX, endX, advance);
      api.line(ctx, startX, 540, endX, 540, c.muted, 2);
      api.line(ctx, readerX, 515, readerX, 540, c.yellow, 4);
      api.circle(ctx, readerX, 540, 10, c.yellow);

      text(
        ctx,
        api,
        replay ? 'Replay  /  object_pairs_hook' : 'Default decoder',
        165,
        654,
        43,
        c.cyan,
        'left',
        replay,
      );
      if (replay) {
        text(ctx, api, 'Remembered name', columns[0], 743, 33, c.muted);
        text(ctx, api, 'Incoming name', columns[1], 743, 33, c.muted);
        const keyColor = strict ? c.pink : c.ink;
        rail(
          ctx,
          api,
          columns[0],
          770,
          760,
          savedKey ? JSON.stringify(savedKey) : '…',
          keyColor,
          104,
          43,
        );
        rail(
          ctx,
          api,
          columns[1],
          770,
          760,
          nextKey ? JSON.stringify(nextKey) : '…',
          keyColor,
          104,
          43,
        );
        if (strict)
          text(
            ctx,
            api,
            'Duplicate ' + JSON.stringify(nextKey) + '   →   no row returned',
            960,
            985,
            44,
            c.pink,
            'center',
          );
      } else {
        text(ctx, api, 'Dictionary key', columns[0], 743, 33, c.muted);
        text(ctx, api, 'Value at that key', columns[1], 743, 33, c.muted);
        rail(ctx, api, columns[0], 770, 760, JSON.stringify(pairs[0][0]), c.blue, 104, 43);
        rail(ctx, api, columns[1], 770, 760, value ? JSON.stringify(value) : '…', c.ink, 104, 43);
        if (compared) {
          const matches = exactMatch(expected, value);
          const comparison = JSON.stringify(value) + ' == ' + JSON.stringify(expected);
          text(
            ctx,
            api,
            comparison + '   →   ' + (matches ? 'True' : 'False'),
            960,
            985,
            44,
            matches ? c.green : c.pink,
            'center',
            true,
          );
        }
      }
    }
  });
}
export default {
  id: 'decoder-policy',
  draw: drawDecoderPolicy,
  cues: [
    'py-decoder-policy-0',
    'digit-limit',
    'py-decoder-array',
    'py-decoder-policy-1',
    'first-occurrence',
    'read-next-name',
    'py-decoder-last',
    'py-decoder-mismatch',
    'py-decoder-policy-2',
    'remember-name',
    'replay-next-name',
    'py-decoder-strict',
    'extra-flags',
    'keep-second-expected',
    'edit-copy',
    'default-match',
    'strict-left',
    'strict-right',
  ],
};
