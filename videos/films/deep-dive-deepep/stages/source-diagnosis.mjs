import { expertThreeReplay } from '../model.mjs';
import { text } from '../defaults.mjs';

const run = expertThreeReplay();
const vector = (row) => '[' + row.map((v) => v.toFixed(2)).join(', ') + ']';

export function drawSourceDiagnosis(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const p = (id) => state.cues?.[id]?.progress ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after';
  const pairTravel = b > 0 ? 1 : p('de-swap-pairs');
  const detached = b < 1 ? 0 : b === 1 ? p('de-swap-values') : 1 - p('de-repair-pair');
  function position(i, travel) {
    const across = Math.max(0, Math.min(1, (travel - 0.22) / 0.56));
    const lowerLane = i === 0 ? Math.min(1, travel / 0.22, (1 - travel) / 0.22) : 0;
    return { x: 510 + 900 * (i === 0 ? across : 1 - across), offset: 220 * lowerLane };
  }

  text(ctx, api, 'Rank 1    ·    expanded expert slots', 960, 248, 36, C.muted, 'center');
  api.focus.target('de-slot-pairs', () => {
    for (const [i, row] of run.pair.entries()) {
      const tag = position(i, pairTravel);
      const value = position(i, pairTravel - detached);
      const color = i === 0 ? C.cyan : C.pink;
      const labelY = 357 + tag.offset;
      const valueY = 441 + value.offset;
      text(
        ctx,
        api,
        'Slot ' + row.key.split(':')[1] + ' → ' + row.source,
        tag.x,
        labelY,
        46,
        color,
        'center',
      );
      api.rect(ctx, value.x - 215, valueY - 55, 430, 100, C.panel, color, 12);
      text(ctx, api, vector(row.value), value.x, valueY + 17, 46, color, 'center');
    }
  });
  api.focus.target('de-source-sum', () => {
    const known = b > 0 || done('de-paired-result');
    const wrong = b === 2 && done('de-detached-result') && !done('de-repair-pair');
    const display = wrong
      ? vector(run.detached.a)
      : (b === 0 && known) || (b === 1 && detached === 0) || (b === 2 && done('de-repair-pair'))
        ? vector(run.paired.a)
        : '[?, ?]';
    text(ctx, api, "a's other contribution   " + vector(run.base), 960, 791, 34, C.ink, 'center');
    text(ctx, api, 'Restored a    ' + display, 960, 875, 56, wrong ? C.pink : C.yellow, 'center');
    const question = b === 1 && p('de-detached-ask') > 0;
    let footer = 'Slot numbers come from the saved return map';
    if (question) footer = 'What lands in the second coordinate of a?';
    if (b === 2 && done('de-repair-pair')) {
      footer = 'Wrong row    →    inspect the source-to-slot permutation';
      if (p('de-diagnose-count')) footer = 'Wrong count    →    inspect the valid expert ranges';
      if (p('de-diagnose-gin'))
        footer = 'Gin initialization    →    inspect communicator capability and topology';
      if (p('de-diagnose-jit'))
        footer = 'First-use compilation    →    inspect the target, compiler and cache';
      if (p('de-diagnose-device'))
        footer = 'On the device    →    check stream waits and physical links';
    }
    text(ctx, api, footer, 960, 1001, 34, C.ink, 'center');
  });
}
export default {
  id: 'source-diagnosis',
  draw: drawSourceDiagnosis,
  cues: [
    'de-swap-pairs',
    'de-paired-result',
    'de-swap-values',
    'de-detached-ask',
    'de-detached-result',
    'de-repair-pair',
    'de-diagnose-count',
    'de-diagnose-gin',
    'de-diagnose-jit',
    'de-diagnose-device',
  ],
};
