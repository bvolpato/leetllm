import { freshReport } from '../arithmetic.mjs';
import { spokenCue } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { FRESH_PROBABILITIES, freshPieces } from '../fixtures.mjs';

export function drawFreshCase(ctx, scene, state, api) {
  const { C } = api;
  const report = freshReport();
  const cue = (id) => spokenCue(scene, state, id);
  const hasTotal = cue('fresh-loss').phase === 'after';
  const hasPpl = cue('fresh-ppl').phase === 'after';
  const hasBpb = cue('fresh-bpb').phase === 'after';
  const byteCut = cue('fresh-byte-ruler').progress;
  const left = 180;
  const unit = 1560 / report.bytes;
  const textY = 395;
  const rulerY = 502;
  drawText(
    ctx,
    api,
    'Beginning token supplies context  ·  every text byte is scored',
    left,
    267,
    30,
    C.muted,
  );
  const shares = cue('fresh-shares').progress;
  let offset = 0;
  api.focus.target('fresh-inputs', () =>
    freshPieces.forEach((piece, i) => {
      const x = left + offset * unit;
      const width = piece.length * unit;
      [...piece].forEach((letter, j) =>
        drawText(
          ctx,
          api,
          letter === ' ' ? '·' : letter,
          x + (j + 0.5) * unit,
          textY,
          62,
          C.ink,
          'center',
        ),
      );
      if (i + 1 <= 4 * shares && byteCut === 0)
        drawText(
          ctx,
          api,
          'p = ' + FRESH_PROBABILITIES[i],
          x + width / 2,
          603,
          38,
          C.blue,
          'center',
        );
      offset += piece.length;
    }),
  );
  api.focus.target('fresh-ruler', () => {
    api.line(ctx, left, rulerY, left + report.bytes * unit, rulerY, C.muted, 3);
    let boundary = 0;
    const cuts = new Set([0, ...freshPieces.map((piece) => (boundary += piece.length))]);
    for (let i = 0; i <= report.bytes; i++) {
      const height = cuts.has(i) ? 48 : 48 * byteCut;
      if (height)
        api.line(
          ctx,
          left + i * unit,
          rulerY,
          left + i * unit,
          rulerY - height,
          byteCut === 1 ? C.cyan : C.blue,
          4,
        );
    }
    drawText(
      ctx,
      api,
      cue('fresh-byte-count').phase === 'after'
        ? report.bytes + ' scored bytes'
        : byteCut > 0
          ? 'Count the bytes'
          : report.count + ' scored tokens',
      left,
      687,
      39,
      byteCut === 1 ? C.cyan : C.blue,
    );
  });
  api.focus.target('fresh-numeric', () => {
    const steps = ['fresh-pair', 'fresh-triple', 'fresh-product'];
    const used = 1 + steps.filter((id) => cue(id).phase === 'after').length;
    const prior = FRESH_PROBABILITIES.slice(0, used - 1).reduce((p, share) => p * share, 1);
    const last = FRESH_PROBABILITIES[used - 1];
    const product =
      used > 1
        ? prior.toFixed(2) + ' × ' + last.toFixed(2) + ' = ' + (prior * last).toFixed(2)
        : shares === 1
          ? '0.40'
          : '…';
    drawText(
      ctx,
      api,
      hasTotal ? 'Total surprise' : 'Probability of the prefix',
      left,
      811,
      34,
      C.muted,
    );
    drawText(
      ctx,
      api,
      hasTotal ? 'ln(100) ≈ ' + report.sum.toFixed(3) + ' nats' : product,
      left,
      883,
      45,
      C.yellow,
    );
    if (cue('fresh-bits').phase === 'after')
      drawText(
        ctx,
        api,
        '≈ ' + (report.sum / Math.LN2).toFixed(3) + ' bits for the line',
        left,
        952,
        37,
        C.yellow,
      );
  });
  api.focus.target('fresh-ppl', () => {
    if (cue('fresh-mean').phase === 'after')
      drawText(ctx, api, report.mean.toFixed(3) + ' nats/token', 1030, 720, 35, C.muted);
    drawText(
      ctx,
      api,
      hasPpl ? 'PPL = exp(total / 4) = ' + report.ppl.toFixed(3) : 'Per scored token',
      1030,
      805,
      39,
      hasPpl ? C.green : C.muted,
    );
  });
  api.focus.target('fresh-bpb', () =>
    drawText(
      ctx,
      api,
      hasBpb ? 'BPB = total / (16 ln2) = ' + report.bpb.toFixed(3) : 'Per scored byte',
      1030,
      903,
      39,
      hasBpb ? C.cyan : C.muted,
    ),
  );
}

export default {
  id: 'fresh-case',
  draw: drawFreshCase,
  cues: [
    'fresh-shares',
    'fresh-pair',
    'fresh-triple',
    'fresh-product',
    'fresh-loss',
    'fresh-mean',
    'fresh-ppl',
    'fresh-byte-ruler',
    'fresh-byte-count',
    'fresh-bits',
    'fresh-bpb',
  ],
};
