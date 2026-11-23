import { extendedFrame } from '../construction.mjs';
import { checkedParents } from '../model.mjs';
import { extendedNote, extendedText, movingPacket } from '../defaults.mjs';
export function drawCheckedParent(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('checked-parent', state);
  api.focus.target('checked-parent-operation', () => {
    const fail =
      currentBeat === 1
        ? begun('parent-small')
          ? 'budget'
          : begun('parent-denied')
            ? 'denied'
            : begun('parent-stale')
              ? 'stale'
              : null
        : null;
    const run = checkedParents({
      version: fail === 'stale' ? 2 : 3,
      allowed: fail !== 'denied',
      budget: fail === 'budget' ? 10 : 20,
    });
    if (currentBeat === 2) {
      extendedText(
        ctx,
        api,
        'Original accepted fixture · one deduplicated parent',
        960,
        285,
        33,
        themeColors.green,
        'center',
      );
      extendedText(ctx, api, run.text, 960, 400, 27, themeColors.ink, 'center');
      const words = run.text.split(/\s+/),
        step = 80,
        x = 160,
        u = progress('checked-parent-2');
      extendedText(
        ctx,
        api,
        'Evidence allowance: 20 words   /   parent: 14 words',
        960,
        520,
        33,
        themeColors.yellow,
        'center',
      );
      for (let i = 0; i < 20; i++) {
        const ready = i < Math.floor(words.length * u + 1e-9);
        api.rect(
          ctx,
          x + i * step,
          610,
          step - 6,
          70,
          themeColors.panel,
          ready ? themeColors.green : themeColors.border,
          4,
        );
        if (ready)
          extendedText(
            ctx,
            api,
            words[i].replace(/[.:]/g, ''),
            x + (i + 0.5) * step - 3,
            652,
            17,
            themeColors.green,
            'center',
          );
        extendedText(
          ctx,
          api,
          i + 1,
          x + (i + 0.5) * step - 3,
          730,
          20,
          themeColors.muted,
          'center',
        );
      }
      extendedText(
        ctx,
        api,
        'Two child hits spend one 14-word parent copy.',
        960,
        835,
        35,
        themeColors.green,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Reserve generator tokens for instructions, the question and the answer.',
        960,
        930,
        29,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Check the caller’s access to the expanded parent before returning it.',
      );
      return;
    }
    extendedText(
      ctx,
      api,
      'Two child matches · same parent identity',
      960,
      275,
      34,
      themeColors.cyan,
      'center',
    );
    extendedText(ctx, api, '15 minutes with deploy ID', 440, 430, 30, themeColors.blue, 'center');
    extendedText(ctx, api, 'Include the service name', 440, 590, 30, themeColors.green, 'center');
    const u = progress('parent-dedup');
    movingPacket(
      ctx,
      api,
      {
        x: 700,
        y: 420,
      },
      {
        x: 1100,
        y: 540,
      },
      currentBeat ? 1 : u,
      themeColors.blue,
    );
    movingPacket(
      ctx,
      api,
      {
        x: 700,
        y: 580,
      },
      {
        x: 1100,
        y: 540,
      },
      currentBeat ? 1 : u,
      themeColors.green,
    );
    extendedText(
      ctx,
      api,
      'child v' + (fail === 'stale' ? 2 : 3) + ' → parent v3 · rollback',
      1390,
      410,
      28,
      themeColors.yellow,
      'center',
    );
    extendedText(
      ctx,
      api,
      'Rollback failure: page on-call within',
      1390,
      510,
      29,
      themeColors.ink,
      'center',
    );
    extendedText(ctx, api, '15 minutes with deploy ID.', 1390, 560, 29, themeColors.ink, 'center');
    extendedText(ctx, api, 'Include the service name.', 1390, 610, 29, themeColors.ink, 'center');
    extendedText(
      ctx,
      api,
      '1 parent × ' + run.words + ' visible words',
      1390,
      725,
      34,
      themeColors.green,
      'center',
    );
    if (currentBeat === 1) {
      extendedText(
        ctx,
        api,
        'permission: ' +
          (fail === 'denied' ? 'denied' : 'allowed') +
          '   budget: ' +
          (fail === 'budget' ? 10 : 20),
        960,
        825,
        31,
        themeColors.yellow,
        'center',
      );
      if (fail) {
        extendedText(ctx, api, run.status, 960, 917, 31, themeColors.pink, 'center');
        extendedText(
          ctx,
          api,
          'Returned context: blocked',
          960,
          962,
          28,
          themeColors.pink,
          'center',
        );
      }
    } else if (currentBeat === 0 && begun('parent-dedup'))
      extendedText(
        ctx,
        api,
        '14 ≤ 20   /   two hits, one parent copy',
        960,
        900,
        38,
        themeColors.green,
        'center',
      );
    else if (currentBeat === 2)
      extendedText(
        ctx,
        api,
        'Current grants + versions + complete final token budget',
        960,
        905,
        35,
        themeColors.green,
        'center',
      );
    extendedNote(
      ctx,
      api,
      'This example counts words. In production, use the generator’s tokenizer.',
    );
  });
}
export default {
  id: 'checked-parent',
  draw: drawCheckedParent,
  cues: [
    'checked-parent-0',
    'parent-dedup',
    'checked-parent-1',
    'parent-stale',
    'parent-denied',
    'parent-small',
    'checked-parent-2',
  ],
};
