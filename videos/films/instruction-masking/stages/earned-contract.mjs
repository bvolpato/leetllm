import { freshContract } from '../arithmetic.mjs';
import { cueProgress, done, ease } from '../construction.mjs';
import { budgetRepairFrame } from '../model.mjs';
import { instructionF, instructionLine, instructionT } from '../defaults.mjs';

function drawBudget(ctx, state, api) {
  const themeColors = api.C;
  const f = budgetRepairFrame(state),
    scale = 1530 / 1100,
    oldX = 180 + 925 * scale,
    reservedX = 180 + (f.committed ? 925 : 970) * scale;
  instructionT(ctx, api, 'Prompt and reserved reply', 180, 310, 37, themeColors.ink);
  instructionT(ctx, api, f.prompt + ' prompt', 180, 430, 31, themeColors.blue);
  instructionT(ctx, api, '96 reserved', reservedX, 430, 29, themeColors.yellow);
  api.rect(ctx, 180, 480, 925 * scale, 46, themeColors.blue);
  instructionT(ctx, api, '925', 180 + (925 * scale) / 2, 513, 25, themeColors.bg, 'center');
  if (!f.committed)
    api.rect(ctx, oldX, 480, 45 * scale, 46, themeColors.panel, themeColors.muted, 1);
  api.rect(ctx, oldX, 480 + 300 * ease(f.progress), 45 * scale, 46, themeColors.pink);
  instructionT(
    ctx,
    api,
    '45',
    oldX + (45 * scale) / 2,
    513 + 300 * ease(f.progress),
    25,
    themeColors.bg,
    'center',
  );
  api.rect(ctx, reservedX, 480, 96 * scale, 46, themeColors.yellow);
  instructionT(ctx, api, '96', reservedX + (96 * scale) / 2, 513, 25, themeColors.bg, 'center');
  instructionLine(ctx, api, 180, 546, oldX - 14, 546);
  instructionLine(ctx, api, oldX + 45 * scale + 14, 546, 1710, 546);
  const x = 180 + 1024 * scale;
  instructionLine(ctx, api, x, 550, x, 660, themeColors.pink, 4);
  instructionT(ctx, api, 'limit 1024', x - 60, 710, 35, themeColors.pink);
  if (f.progress > 0.25)
    instructionT(
      ctx,
      api,
      f.committed ? 'removed old exchange: 45' : 'moving one whole 45-token exchange',
      180,
      865,
      29,
      themeColors.pink,
    );
  instructionF(ctx, api, 'im-fresh-overflow', () =>
    instructionT(
      ctx,
      api,
      done(state, 'im-fresh-overflow', 2)
        ? f.committed
          ? done(state, 'im-fresh-total', 2)
            ? '925 + 96 = 1021   ·   fits'
            : '925 + 96 = ?'
          : '1066 − 1024 = 42 excess'
        : 'compute the new total',
      180,
      730,
      43,
      f.committed ? themeColors.green : themeColors.pink,
    ),
  );
  instructionT(
    ctx,
    api,
    f.committed
      ? 'Required policy evidence stays in the prompt'
      : f.progress > 0
        ? 'Removing the old exchange'
        : '970 prompt tokens include this removable 45-token exchange',
    180,
    950,
    32,
    f.committed ? themeColors.green : themeColors.muted,
  );
}

function drawDecoder(ctx, state, api) {
  const { C } = api;
  const row = freshContract(true, true);
  const eos = row.words.indexOf('EOS');
  const tokenId = row.ids[eos];
  const configured = done(state, 'fresh-config', 6);
  const stopIds = configured ? [42, tokenId] : [42];
  const evaluated = configured ? done(state, 'fresh-stop', 6) : done(state, 'fresh-miss', 6);
  const stops = stopIds.includes(tokenId);
  instructionF(ctx, api, 'decoded-reply', () => {
    instructionT(ctx, api, 'Decoder output', 137, 302, 35, C.muted);
    row.words.slice(3, eos + 1).forEach((piece, i) => {
      const x = 250 + i * 298;
      instructionT(ctx, api, piece, x, 458, 65, i === 2 ? C.yellow : C.ink, 'center');
      instructionT(
        ctx,
        api,
        'ID ' + row.ids[i + 3],
        x,
        533,
        37,
        i === 2 ? C.yellow : C.muted,
        'center',
      );
    });
  });
  instructionF(ctx, api, 'decoder-check', () => {
    instructionT(ctx, api, 'Configured stop IDs', 1135, 303, 35, C.muted);
    instructionT(ctx, api, '{ ' + stopIds.join(', ') + ' }', 1135, 455, 66, C.cyan);
    api.text(ctx, 'stop = token_id in stop_ids', 960, 711, 52, C.ink, 'center', 'mono');
    const result = evaluated
      ? stops
        ? 'True   ·   return the reply'
        : 'False   ·   request another token'
      : 'Does this token stop the decoder?';
    instructionT(
      ctx,
      api,
      result,
      960,
      898,
      55,
      evaluated ? (stops ? C.green : C.pink) : C.yellow,
      'center',
    );
  });
}

export function drawEarnedContract(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  if (beat === 2) {
    return instructionF(ctx, api, 'im-fresh-budget-repair', () => drawBudget(ctx, state, api));
  }
  if (beat >= 5) return drawDecoder(ctx, state, api);
  const repaired = done(state, 'im-fresh-cell', 1);
  const extension = ease(cueProgress(state, 'fresh-add-word', 3));
  const longer = extension === 1;
  const row = freshContract(repaired, longer);
  const transferring = extension > 0 && !longer;
  const revealStop = done(state, 'fresh-new-stop', 4);
  const cover = beat >= 3 && !revealStop;
  const stopPredictor = row.words.indexOf('EOS') - 1;
  const center = (i) => 420 + 218 * (i + (i >= 4 && transferring ? extension : 0));
  instructionF(ctx, api, 'fresh-input', () => {
    const fields = [
      ['Position', row.words.map((_, i) => i), 272, 29],
      ['Input', row.words, 370, 49],
      ['Token ID', row.ids, 455, 42],
      ['Valid', row.valid, 544, 32],
      ['Reply target', row.membership, 618, 32],
    ];
    for (const [name, values, y, size] of fields) {
      instructionT(ctx, api, name, 108, y, 32, C.muted);
      values.forEach((value, i) => {
        const color =
          name === 'Position' ? C.muted : name === 'Input' && longer && i === 4 ? C.cyan : C.ink;
        instructionT(ctx, api, value, center(i), y, size, color, 'center');
      });
    }
  });
  instructionF(ctx, api, 'fresh-labels', () => {
    instructionT(ctx, api, 'Next label', 108, 809, 37, C.muted);
    row.labels.forEach((label, i) => {
      const hidden = cover && i >= 3;
      const color = hidden ? C.yellow : label === -100 ? C.muted : C.green;
      instructionT(
        ctx,
        api,
        hidden ? '?' : label === -100 ? '−100' : label,
        center(i),
        809,
        52,
        color,
        'center',
      );
    });
    let arrowAt;
    if (revealStop) arrowAt = stopPredictor;
    else if (beat === 1 && repaired) arrowAt = done(state, 'fresh-real-end', 1) ? stopPredictor : 2;
    if (arrowAt !== undefined) {
      api.arrow(ctx, center(arrowAt + 1), 654, center(arrowAt), 741, C.green, 5);
    }
    const prompt = revealStop
      ? 'The last answer word predicts EOS. The following padding is ignored.'
      : cover
        ? longer
          ? 'Which position now predicts the real ending?'
          : 'One more word in the same reply'
        : repaired
          ? 'The header predicts the first word. The last word predicts the ending.'
          : 'Which predictor needs a different label, and which ID belongs there?';
    instructionT(
      ctx,
      api,
      prompt,
      960,
      948,
      40,
      revealStop || (repaired && !cover) ? C.green : C.yellow,
      'center',
    );
  });
}
export default {
  id: 'earned-contract',
  draw: drawEarnedContract,
  cues: [
    'fresh-question',
    'im-fresh-cell',
    'fresh-real-end',
    'im-fresh-overflow',
    'im-fresh-budget-repair',
    'im-fresh-total',
    'fresh-add-word',
    'fresh-transfer-question',
    'fresh-new-stop',
    'fresh-serving',
    'fresh-miss',
    'fresh-config',
    'fresh-stop',
  ],
};
