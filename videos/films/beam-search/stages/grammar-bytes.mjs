import { enumByteTrace, stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText, drawProbabilityBars } from '../defaults.mjs';
export function drawGrammarBytes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('grammar-bytes', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'grammar-bytes'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'grammar-bytes',
      beat = state.beat ?? 0;
    {
      const prefix = '{"first_step":"';
      if (beat < 2)
        drawPolicyText(
          ctx,
          api,
          'Finite enum lab · supplied grammar and ASCII token bytes',
          960,
          300,
          31,
          C.muted,
          'center',
        );
      const candidates = ['create"}', 'quota"}', 're', 'voke"}'];
      if (beat === 0) {
        drawPolicyCard(ctx, api, 'grammar-bytes', '{"first_step":"', 170, 390, 700, 90, C.cyan, 35);
        drawPolicyText(ctx, api, 'Retained parser prefix', 520, 350, 27, C.cyan, 'center');
        target(() =>
          candidates.forEach((token, i) => {
            const trace = enumByteTrace(token, Math.floor(progress * token.length)),
              y = 540 + i * 93;
            drawPolicyText(ctx, api, token, 280, y + 29, 33, colors[i]);
            trace.scanned.forEach((byte, j) =>
              drawPolicyCard(
                ctx,
                api,
                'grammar-bytes',
                byte,
                620 + j * 38,
                y - 4,
                33,
                45,
                trace.rejectionIndex === j ? C.pink : C.cyan,
                23,
              ),
            );
            const status = trace.rejected
              ? 'invalid byte · reject token'
              : trace.complete
                ? 'accepting · EOS eligible'
                : trace.tokenInspected
                  ? 'valid prefix · EOS forbidden'
                  : 'scan next byte · EOS forbidden';
            drawPolicyText(
              ctx,
              api,
              status,
              1010,
              y + 29,
              28,
              trace.rejected ? C.pink : trace.complete ? C.green : C.muted,
            );
          }),
        );
        drawCaption(
          ctx,
          api,
          'A single vocabulary token may cross a quote and closing brace; its entire byte string must fit.',
        );
      } else if (beat === 1) {
        const logits = [3, 4, 2, 6],
          labels = ['create', 'revoke', 'rename', 'quota'];
        drawProbabilityBars(
          ctx,
          api,
          colors,
          stablePolicy(logits).probabilities,
          labels,
          170,
          430,
          820,
        );
        target(() => {
          const masked = stablePolicy([3, 4, 2, -Infinity]);
          drawProbabilityBars(
            ctx,
            api,
            colors,
            masked.probabilities,
            labels,
            1080,
            430,
            750,
            1,
            [0, 1, 2],
            (v) => v.toFixed(3),
            progress,
          );
        });
        drawPolicyText(
          ctx,
          api,
          'Grammar permits revoke. The supplied guide requires create first.',
          960,
          885,
          32,
          C.yellow,
          'center',
        );
        drawCaption(
          ctx,
          api,
          'EOS requires an accepting parser state. General recursive grammar needs a stack. Syntax does not check the guide.',
        );
      } else {
        const tokens = ['{', '"first_step"', ':', '"create"', '}'],
          visible = Math.min(tokens.length, Math.floor(tokens.length * progress));
        drawPolicyText(
          ctx,
          api,
          'A length limit can stop a valid prefix before the object is complete',
          960,
          310,
          31,
          C.ink,
          'center',
        );
        target(() =>
          tokens
            .slice(0, visible)
            .forEach((token, i) =>
              drawPolicyCard(
                ctx,
                api,
                'grammar-bytes',
                token,
                190 + i * 340,
                455,
                300,
                90,
                colors[i % 4],
                30,
              ),
            ),
        );
        target(() =>
          drawPolicyText(
            ctx,
            api,
            visible < tokens.length
              ? 'Parser: unfinished · EOS forbidden'
              : 'Parser: accepting · EOS eligible',
            960,
            710,
            37,
            visible < tokens.length ? C.pink : C.green,
            'center',
          ),
        );
        drawCaption(
          ctx,
          api,
          'A recursive parser tracks nested structure on a stack. An enum matcher alone is a smaller demonstration.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'grammar-bytes',
  draw: drawGrammarBytes,
  cues: ['grammar-bytes-build-0', 'grammar-bytes-build-1', 'grammar-bytes-build-2'],
};
