import { completed, event } from '../construction.mjs';
import { card, centeredText, extensionText, footer } from '../defaults.mjs';
export function drawVisibilityTest(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat),
    done = (name, beat) => completed(state, name, beat);
  api.focus.target('visibility-test-mechanism', () => {
    const changed = ev('mask-replace', 1) > 0,
      tokens = ['charge', 'the', changed ? 'invoice' : 'phone'];
    centeredText(
      ctx,
      api,
      'Same earlier prefix · only the later token changes',
      960,
      285,
      33,
      themeColors.yellow,
    );
    tokens.forEach((word, i) =>
      card(
        ctx,
        api,
        word,
        450 + i * 420,
        365,
        280,
        i === 2 && changed ? themeColors.pink : themeColors.blue,
      ),
    );
    const show = [ev('mask-encoder', 0) > 0, ev('mask-first', 0) > 0, ev('mask-final', 0) > 0],
      configs = [
        {
          name: 'encoder at charge',
          causal: false,
          pos: 0,
        },
        {
          name: 'causal at charge',
          causal: true,
          pos: 0,
        },
        {
          name: 'causal at final',
          causal: true,
          pos: 2,
        },
      ];
    configs.forEach((v, r) => {
      const y = 570 + r * 125;
      extensionText(
        ctx,
        api,
        v.name,
        130,
        y + 45,
        29,
        r === 1 ? themeColors.yellow : themeColors.cyan,
      );
      tokens.forEach((token, i) => {
        const allowed = show[r] && (!v.causal || i <= v.pos);
        card(
          ctx,
          api,
          show[r] ? (allowed ? token : 'blocked') : '?',
          520 + i * 410,
          y,
          300,
          allowed ? themeColors.cyan : themeColors.muted,
          75,
          29,
        );
      });
    });
    if (currentBeat === 1 && done('mask-invariant', 1))
      centeredText(
        ctx,
        api,
        'Earlier causal state: unchanged · later clue has no incoming edge',
        960,
        1015,
        30,
        themeColors.green,
      );
    else
      footer(
        ctx,
        api,
        'Availability comes from the mask; learned weights determine contributions among allowed positions',
      );
  });
}
export default {
  id: 'visibility-test',
  draw: drawVisibilityTest,
  cues: [
    'emb-mask-encoder',
    'emb-mask-first',
    'emb-mask-final',
    'emb-mask-replace',
    'emb-mask-invariant',
    'emb-mask-summary',
  ],
};
