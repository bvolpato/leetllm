import { cueProgress, proposalFingerprint } from '../arithmetic.mjs';
import { bar, box, chapterCode, chapterText, footer, heading } from '../defaults.mjs';
export function drawRepeatedProposal(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-repeated-proposal-mechanism', () => {
    heading(ctx, api, 'Canonical action identity excludes the transport call ID');
    const a = {
        id: 'call-A',
        name: 'get_eval',
        args: {
          version: 'c17',
          scope: 'search',
        },
      },
      z = {
        id: 'call-B',
        name: 'get_eval',
        args: {
          scope: 'search',
          version: 'c17',
        },
      },
      same = proposalFingerprint(a) === proposalFingerprint(z);
    if (currentBeat === 0) {
      box(
        ctx,
        api,
        a.id,
        ['get_eval', '{version:c17, scope:search}'],
        150,
        405,
        720,
        themeColors.blue,
        165,
      );
      box(
        ctx,
        api,
        z.id,
        ['get_eval', '{scope:search, version:c17}'],
        1050,
        405,
        680,
        themeColors.cyan,
        165,
      );
      if (resultComplete('repeat-no-id', 0))
        chapterCode(
          ctx,
          api,
          'fingerprint: ' + proposalFingerprint(a),
          150,
          760,
          25,
          themeColors.yellow,
        );
      if (resultComplete('repeat-sorted', 0))
        chapterText(
          ctx,
          api,
          same ? 'same action despite reordered keys' : 'different action',
          150,
          930,
          34,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const done = resultComplete('repeat-two-zero', 1);
      bar(
        ctx,
        api,
        'Model generations',
        done ? 2 : cueProgress2('repeated-proposal-2', 1) * 2,
        2,
        150,
        490,
        650,
        themeColors.blue,
      );
      bar(ctx, api, 'Dispatched service operations', 0, 2, 1050, 490, 650, themeColors.green);
      if (done)
        chapterText(
          ctx,
          api,
          '2 generations · 0 service dispatches',
          150,
          830,
          35,
          themeColors.yellow,
        );
    } else {
      box(
        ctx,
        api,
        'Available permitted catalog',
        'get_eval only',
        150,
        410,
        720,
        themeColors.blue,
        135,
      );
      box(
        ctx,
        api,
        'Repeated unknown shell proposal',
        'catalog cannot satisfy that action',
        1050,
        410,
        680,
        themeColors.pink,
        135,
      );
      chapterText(
        ctx,
        api,
        'Stop unresolved within the external budgets',
        150,
        810,
        35,
        themeColors.yellow,
      );
      chapterText(
        ctx,
        api,
        'A changed argument earns validation, never wider authority',
        150,
        950,
        29,
        themeColors.cyan,
      );
    }
    footer(
      ctx,
      api,
      'Canonical tool name/arguments are separate from approved write-operation identity.',
    );
  });
}
export default {
  id: 'repeated-proposal',
  draw: drawRepeatedProposal,
  cues: [
    'tu-repeated-proposal-1',
    'tu-repeat-no-id',
    'tu-repeat-sorted',
    'tu-repeated-proposal-2',
    'tu-repeat-two-zero',
    'tu-repeated-proposal-3',
  ],
};
