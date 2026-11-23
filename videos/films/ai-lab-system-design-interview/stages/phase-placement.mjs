import { clamp, lerp } from '../arithmetic.mjs';
import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, header } from '../defaults.mjs';

const reply = ['The', 'call', 'is', 'at', 'two.'];

function schedule(ctx, api, y, chunked, progress) {
  const { C } = api;
  const start = 175,
    replyWidth = 124,
    chunkWidth = 222;
  const promptWidth = chunkWidth * (reply.length - 1);
  const totalWidth = promptWidth + replyWidth * reply.length;
  const end = start + lerp(replyWidth, totalWidth, progress);
  let x = start;
  function segment(width, word) {
    const shown = clamp((end - x) / width) * width;
    if (shown > 6) {
      api.rect(ctx, x, y, shown - 5, 83, word ? C.yellow : C.blue, undefined, 7);
      if (word && shown > width - 12)
        chapterText(ctx, api, word, x + width / 2, y + 55, 36, C.bg, 'center');
    }
    x += width;
  }
  for (const [i, word] of reply.entries()) {
    if (i > 0 && chunked) segment(chunkWidth);
    if (i === 1 && !chunked) segment(promptWidth);
    segment(replyWidth, word);
  }
}

export function drawPhasePlacement(ctx, scene, state, api) {
  const { C } = api;
  const { beat, op, result } = systemExtensionFrame('phase-placement', state);
  return api.focus.target('sd-phase-placement-mechanism', () => {
    if (beat === 0) {
      header(ctx, api, 'One worker  ·  A new prompt arrives while an answer is streaming');
      chapterText(ctx, api, 'Read the whole prompt in one turn', 175, 408, 38, C.ink);
      schedule(ctx, api, 450, false, op);
      chapterText(ctx, api, 'Read the same prompt in four turns', 175, 674, 38, C.ink);
      schedule(ctx, api, 716, true, result);
      api.rect(ctx, 390, 920, 42, 30, C.blue);
      chapterText(ctx, api, 'Read prompt', 455, 947, 32, C.ink);
      api.rect(ctx, 920, 920, 42, 30, C.yellow);
      chapterText(ctx, api, 'Generate next token', 986, 947, 32, C.ink);
    } else if (beat === 1) {
      header(ctx, api, 'Two pools  ·  One request');
      chapterCard(ctx, api, 'Prefill pool', 160, 463, 404, C.blue, 120, 40);
      chapterCard(ctx, api, 'Decode pool', 1356, 463, 404, C.cyan, 120, 40);
      const packetWidth = 160;
      const x = lerp(570, 1350 - packetWidth, op);
      // Leave the occupied part of the link under the packet clear.
      api.line(ctx, 564, 524, x, 524, C.muted, 4);
      api.line(ctx, x + packetWidth, 524, 1356, 524, C.muted, 4);
      api.rect(ctx, x, 481, packetWidth, 86, C.yellow, undefined, 8);
      chapterText(ctx, api, 'KV', x + packetWidth / 2, 540, 42, C.bg, 'center');
      chapterText(
        ctx,
        api,
        'Prompt keys and values travel to the worker that generates the reply',
        960,
        735,
        36,
        C.ink,
        'center',
      );
      chapterText(ctx, api, 'Time the handoff under load', 960, 874, 33, C.yellow, 'center');
    } else {
      header(ctx, api, 'A smaller model drafts three tokens');
      const draft = ['Meet', 'at', 'noon'];
      const verified = ['Meet', 'at', 'two'];
      chapterText(ctx, api, 'Draft', 180, 468, 36, C.blue);
      chapterText(ctx, api, 'Target', 180, 682, 36, C.cyan);
      for (const [i, word] of draft.entries()) {
        const x = 440 + i * 434;
        chapterCard(ctx, api, word, x, 390, 368, C.blue, 120, 44);
        if (i < 2 ? op === 1 : result === 1)
          chapterCard(ctx, api, verified[i], x, 604, 368, i === 2 ? C.yellow : C.green, 120, 44);
      }
      if (result === 1)
        chapterText(
          ctx,
          api,
          'Two draft tokens accepted  ·  One replaced',
          960,
          874,
          38,
          C.ink,
          'center',
        );
    }
  });
}
export default {
  id: 'phase-placement',
  draw: drawPhasePlacement,
  cues: [
    'sd-phase-placement-0-operation',
    'sd-phase-placement-0-result',
    'sd-phase-placement-1-operation',
    'sd-phase-placement-1-result',
    'sd-phase-placement-2-operation',
    'sd-phase-placement-2-result',
  ],
};
