import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText } from '../defaults.mjs';
export function drawSpeculativeBlock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('speculative-block', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'speculative-block'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'speculative-block',
      beat = state.beat ?? 0;
    {
      if (beat === 2) {
        const prompt = [
            {
              id: 'guide',
              token: 'guide',
            },
          ],
          block = ['create', 'a', 'key'].map((token, i) => ({
            id: `accepted-${i}`,
            token,
          }));
        const extra = {
          id: 'extra-target',
          token: 'EOS',
        };
        drawPolicyText(
          ctx,
          api,
          'Separate all-accepted iteration · K=3 proposals → one further target draw',
          960,
          300,
          30,
          C.ink,
          'center',
        );
        target(() =>
          teaching.tokenHistory({
            x: 180,
            y: 370,
            width: 1560,
            height: 560,
            fontSize: 27,
            prompt,
            accepted: progress === 1 ? [...block, extra] : block,
            processed: [...prompt, ...block],
            emitted: [],
            phase: 'resident',
            focusPrefix: 'speculative-history',
          }),
        );
        drawCaption(
          ctx,
          api,
          'The extra accepted token is pending its own model processing. EOS can stop the iteration.',
        );
        return;
      }
      const accepted = beat === 1 && progress > 0.2 ? 1 : 0,
        rejectKnown = beat === 1 && progress === 1;
      drawPolicyText(
        ctx,
        api,
        'Known draft block: create → a → key',
        960,
        300,
        34,
        C.ink,
        'center',
      );
      ['create', 'a', 'key'].forEach((token, i) => {
        const x = 240 + i * 570,
          isAccepted = i === 0 && accepted > 0,
          rejected = i > 0 && rejectKnown;
        drawPolicyCard(
          ctx,
          api,
          'speculative-block',
          token,
          x,
          405,
          420,
          85,
          rejected ? C.pink : isAccepted ? C.green : C.blue,
          35,
        );
        if (rejected)
          drawPolicyText(ctx, api, 'discarded suffix', x + 210, 540, 27, C.pink, 'center');
      });
      target(() => {
        if (beat === 0) {
          ['guide → p₁', 'guide, create → p₂', 'guide, create, a → p₃'].forEach((s, i) =>
            drawPolicyText(ctx, api, s, 450 + i * 570, 650, 30, colors[i], 'center'),
          );
          drawPolicyText(
            ctx,
            api,
            'Target rows score known draft prefixes in parallel',
            960,
            800,
            34,
            C.cyan,
            'center',
          );
        } else {
          drawPolicyText(
            ctx,
            api,
            accepted
              ? 'create: .60/.80=.75 · supplied u=.20 accepts'
              : 'create: compare supplied u=.20 with .60/.80=.75',
            960,
            600,
            33,
            accepted ? C.green : C.muted,
            'center',
          );
          drawPolicyText(
            ctx,
            api,
            rejectKnown
              ? 'a: .40/.80=.50 · supplied u=.80 rejects'
              : 'a: compare supplied u=.80 with .40/.80=.50',
            960,
            690,
            33,
            rejectKnown ? C.pink : C.muted,
            'center',
          );
          if (rejectKnown)
            drawPolicyText(
              ctx,
              api,
              'Keep create · normalized residual selects replacement · discard a and key',
              960,
              825,
              29,
              C.yellow,
              'center',
            );
        }
      });
      drawCaption(
        ctx,
        api,
        beat >= 2
          ? 'Rejected-suffix conditional rows and KV cannot become accepted future state. An all-accepted block gets one extra target draw.'
          : 'The target evaluates known draft prefixes together; the draft itself was generated autoregressively.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'speculative-block',
  draw: drawSpeculativeBlock,
  cues: ['speculative-block-build-0', 'speculative-block-build-1', 'speculative-block-build-2'],
};
