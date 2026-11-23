import { spokenCue } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { scoredRuns, text } from '../fixtures.mjs';

const bytes = Buffer.byteLength(text, 'utf8');
const start = 545;
const unit = 72;
const stop = start + bytes * unit;

export function drawTokenizers(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spokenCue(scene, state, id);
  const means = cue('token-means').phase === 'after';
  const tokenScores = cue('token-ppl').phase === 'after';
  const recut = cue('shared-bytes').progress;
  const inBits = cue('convert-bits').phase === 'after';
  const scored = cue('tokenizers-bpb').phase === 'after';
  const decided = cue('choose-fit').phase === 'after';

  drawText(ctx, api, 'Held-out text', 150, 266, 31, C.muted);
  drawText(ctx, api, '“' + text + '”', 150, 348, 64, C.ink);
  drawText(
    ctx,
    api,
    'Both models score the first token from a beginning marker.',
    start,
    275,
    30,
    C.muted,
  );
  scoredRuns.forEach((run, i) => {
    const y = 515 + i * 245;
    const color = i === 0 ? C.blue : C.pink;
    const cut = cue(i === 0 ? 'tokenizers-subword-cut' : 'tokenizers-character-cut').progress;
    const bits = run.nats / Math.LN2;
    drawText(ctx, api, run.name, 150, y - 9, 43, color);
    api.focus.target('comparison-totals', () =>
      drawText(
        ctx,
        api,
        run.nats.toFixed(1) + ' nats' + (inBits ? ' ≈ ' + bits.toFixed(2) + ' bits' : ''),
        150,
        y + 60,
        32,
        C.yellow,
      ),
    );

    api.focus.target(i === 0 ? 'tokenizers-subwords' : 'tokenizers-characters', () => {
      api.rect(ctx, start, y - 51, stop - start, 93, C.panel, undefined, 2);
      let end = 0;
      const tokenCuts = new Set(run.pieces.map((piece) => (end += piece.length)));
      [...text].forEach((letter, j) => {
        drawText(
          ctx,
          api,
          letter === ' ' ? '·' : letter,
          start + (j + 0.5) * unit,
          y + 13,
          40,
          C.ink,
          'center',
        );
        if (j + 1 === bytes) return;
        const height = tokenCuts.has(j + 1) ? api.clamp(cut * bytes - j) : recut;
        if (height > 0)
          api.line(
            ctx,
            start + (j + 1) * unit,
            y + 42,
            start + (j + 1) * unit,
            y + 42 - 93 * height,
            recut === 1 ? C.cyan : color,
            3,
          );
      });
      api.line(ctx, start, y + 50, stop, y + 50, recut === 1 ? C.cyan : color, 3);
      if (cut === 1)
        drawText(
          ctx,
          api,
          recut === 1 ? bytes + ' scored bytes' : run.pieces.length + ' scored tokens',
          (start + stop) / 2,
          y + 112,
          33,
          recut === 1 ? C.cyan : color,
          'center',
        );
    });
    api.focus.target('comparison-values', () => {
      drawText(
        ctx,
        api,
        recut > 0 ? 'bits/byte' : tokenScores ? 'token PPL' : 'nats/token',
        1710,
        y - 36,
        31,
        C.muted,
        'center',
      );
      let number = '…';
      if (scored || (i === 0 && cue('subword-bpb').phase === 'after'))
        number = (bits / bytes).toFixed(3);
      else if (tokenScores && recut === 0)
        number = Math.exp(run.nats / run.pieces.length).toFixed(2);
      else if (means && recut === 0) number = (run.nats / run.pieces.length).toFixed(3);
      api.focus.target(i === 0 ? 'subword-value' : 'character-value', () =>
        drawText(
          ctx,
          api,
          number,
          1710,
          y + 43,
          54,
          decided && i === 0 ? C.green : C.ink,
          'center',
        ),
      );
      if (tokenScores && recut === 0)
        drawText(
          ctx,
          api,
          'exp(' + run.nats.toFixed(1) + ' / ' + run.pieces.length + ')',
          1710,
          y + 112,
          28,
          C.muted,
          'center',
        );
    });
  });
  if (decided)
    drawText(
      ctx,
      api,
      'The subword model spends fewer bits on these 14 bytes.',
      960,
      989,
      46,
      C.green,
      'center',
    );
}

export default {
  id: 'tokenizers',
  draw: drawTokenizers,
  cues: [
    'tokenizers-subword-cut',
    'tokenizers-character-cut',
    'token-means',
    'token-ppl',
    'shared-bytes',
    'convert-bits',
    'subword-bpb',
    'tokenizers-bpb',
    'choose-fit',
  ],
};
