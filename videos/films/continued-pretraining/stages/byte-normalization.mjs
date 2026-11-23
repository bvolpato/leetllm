import { phraseProgress } from '../construction.mjs';
import { byteReport } from '../model.mjs';

export function drawByteNormalization(ctx, scene, state, api) {
  const { C } = api;
  const reports = [byteReport(15, 10, 30), byteReport(18, 20, 30)];
  const tokens = phraseProgress(state, 'byte-token-result', 1) >= 1;
  const bytes = phraseProgress(state, 'byte-divisor', 1, 0.48, 0.8);
  const normalized = phraseProgress(state, 'byte-result', 2) >= 1;
  api.text(ctx, 'Same 30 scored UTF-8 bytes, same context and boundaries', 175, 288, 41, C.ink);
  api.text(ctx, 'Total NLL', 465, 397, 33, C.muted, 'center');
  api.text(ctx, bytes > 0 ? 'Scored bytes' : 'Scored tokens', 935, 397, 33, C.muted, 'center');
  api.text(ctx, bytes > 0 ? 'Bits per byte' : 'Token perplexity', 1530, 397, 33, C.muted, 'center');
  reports.forEach((r, i) => {
    const col = i ? C.yellow : C.cyan;
    const y = 507 + i * 165;
    api.focus.target('scoring-units', () => {
      api.text(ctx, i ? 'Fine' : 'Coarse', 175, y + 31, 44, col);
      api.text(ctx, r.nll + ' nats', 465, y + 30, 41, C.ink, 'center');
      const n = bytes > 0 ? r.bytes : r.tokens;
      const cell = 16,
        x = 685;
      for (let j = 0; j < n; j++)
        api.rect(ctx, x + j * cell, y - 5, cell - 3, 36, col, undefined, 1);
      api.text(ctx, n + (bytes > 0 ? ' bytes' : ' tokens'), x, y + 76, 29, col);
    });
    api.focus.target('unit-result', () => {
      const result =
        bytes > 0 ? (normalized ? r.bitsPerByte.toFixed(3) : '?') : tokens ? r.ppl.toFixed(3) : '?';
      api.text(ctx, result, 1530, y + 35, 55, C.ink, 'center');
    });
  });
  api.text(
    ctx,
    bytes > 0
      ? 'Bits per byte = total NLL / (scored bytes × ln 2)'
      : 'Token perplexity = exp(total NLL / scored tokens)',
    960,
    874,
    45,
    C.ink,
    'center',
  );
  const question = bytes > 0 ? 'Which row costs fewer bits per byte?' : 'Which row has the smaller loss per token?';
  if (!normalized && (!tokens || bytes > 0))
    api.text(ctx, question, 960, 972, 38, C.ink, 'center');
  if (normalized)
    api.text(
      ctx,
      'Coarse needs fewer bits per byte on the same scored text.',
      960,
      972,
      38,
      C.cyan,
      'center',
    );
}

export default {
  id: 'byte-normalization',
  draw: drawByteNormalization,
  cues: ['byte-tokens', 'byte-token-result', 'byte-divisor', 'byte-result'],
};
