import { arrow, chapterText, footer, pill } from '../defaults.mjs';
export function drawProviderContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['mv-provider-contract-' + k],
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('provider-contract-mechanism', () => {
    chapterText(
      ctx,
      api,
      currentBeat < 2 ? 'Hosted model and request settings' : 'Production pointer history',
      960,
      295,
      36,
      themeColors.yellow,
    );
    if (currentBeat < 2) {
      pill(ctx, api, 'Application release R1', 500, 435, 660, themeColors.blue);
      pill(ctx, api, 'temperature = 0', 1390, 435, 760, themeColors.cyan);
    }
    if (currentBeat === 0) {
      chapterText(ctx, api, 'floating family alias', 500, 620, 32, themeColors.yellow);
      const moved = B('alias');
      pill(
        ctx,
        api,
        moved ? 'resolved provider version B' : 'resolved provider version A',
        1280,
        635,
        800,
        moved ? themeColors.pink : themeColors.blue,
      );
      arrow(ctx, api, 770, 620, 840, 620, themeColors.yellow);
      chapterText(
        ctx,
        api,
        moved ? 'Tuesday · the provider moved the alias' : 'Monday · the alias points to A',
        960,
        840,
        35,
        moved ? themeColors.pink : themeColors.muted,
      );
      footer(ctx, api, 'Pin the documented version and record the effective settings');
    } else if (currentBeat === 1) {
      [0, 1, 2].forEach((i) => {
        pill(ctx, api, 'retained input', 400, 590 + i * 115, 420, themeColors.blue);
        pill(
          ctx,
          api,
          B('variable') ? ['output A', 'output B', 'output A'][i] : 'repeat ' + (i + 1),
          1000,
          590 + i * 115,
          430,
          themeColors.cyan,
        );
      });
      const dead = B('retired');
      pill(
        ctx,
        api,
        dead ? 'retired · cannot serve' : 'stable endpoint available',
        1480,
        930,
        620,
        dead ? themeColors.pink : themeColors.green,
      );
      footer(ctx, api, 'Keep regression comparisons and availability evidence beside the pin');
    } else {
      const revision = B('revision');
      ['stable r1', 'candidate r2', 'stable r3'].forEach((v, i) =>
        pill(
          ctx,
          api,
          revision ? v : v.split(' ')[0],
          360 + i * 600,
          640,
          440,
          i === 1 ? themeColors.cyan : themeColors.blue,
        ),
      );
      chapterText(
        ctx,
        api,
        'Article: sequential expected-target check',
        960,
        835,
        32,
        themeColors.muted,
      );
      if (B('atomic'))
        chapterText(
          ctx,
          api,
          'Production: atomic compare + actor authorization + durable event',
          960,
          940,
          32,
          themeColors.green,
        );
      footer(ctx, api, 'Same target after a round trip still has a different revision');
    }
  });
}
export default {
  id: 'provider-contract',
  draw: drawProviderContract,
  cues: [
    'mv-provider-contract-alias',
    'mv-provider-contract-variable',
    'mv-provider-contract-retired',
    'mv-provider-contract-revision',
    'mv-provider-contract-atomic',
  ],
};
