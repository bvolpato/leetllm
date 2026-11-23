import { chapterBox, chapterText, footer, subtitle } from '../defaults.mjs';
export function drawReasoningWork(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-reasoning-work-b' + currentBeat);
  api.focus.target('pf-reasoning-work-mechanism', () => {
    subtitle(
      ctx,
      api,
      currentBeat === 2 ? 'Compare two effort settings' : 'Each position holds one generated token',
    );
    chapterBox(
      ctx,
      api,
      'Same fixed model\noptimizer steps: 0',
      210,
      350,
      550,
      130,
      themeColors.blue,
      30,
    );
    if (currentBeat === 2) {
      chapterBox(
        ctx,
        api,
        'Same incidents and prompt in both runs',
        220,
        585,
        1480,
        90,
        themeColors.cyan,
        31,
      );
      chapterBox(
        ctx,
        api,
        'Use IR-7 and return the four fields.',
        220,
        735,
        960,
        120,
        themeColors.cyan,
        30,
      );
      chapterBox(
        ctx,
        api,
        'effort: ' + (u > 0.7 ? 'high' : 'low'),
        1260,
        735,
        440,
        120,
        themeColors.blue,
        31,
      );
      footer(
        ctx,
        api,
        'Measure correct decisions, latency and cost in each run.',
        themeColors.yellow,
      );
      return;
    }
    const n = currentBeat === 0 ? Math.min(7, Math.floor(u * 7.99)) : 7;
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 230;
      chapterBox(
        ctx,
        api,
        't' + i,
        x,
        650,
        170,
        80,
        i < n ? themeColors.cyan : themeColors.muted,
        28,
      );
      if (i < n && currentBeat > 0) {
        api.rect(ctx, x, 800, 170, 80, themeColors.panel, themeColors.green, 3);
        chapterText(
          ctx,
          api,
          i < n - 1 ? 'K' + i + ', V' + i : 'next pass',
          x + 85,
          850,
          26,
          i < n - 1 ? themeColors.green : themeColors.yellow,
          'center',
        );
      }
    }
    chapterText(
      ctx,
      api,
      'Short answer: fewer positions',
      1130,
      380,
      30,
      themeColors.ink,
      'center',
    );
    chapterText(
      ctx,
      api,
      'Longer proposed explanation: more work',
      1130,
      470,
      30,
      themeColors.yellow,
      'center',
    );
    footer(ctx, api, 'Later tokens can attend to earlier steps.');
  });
  return;
}
export default {
  id: 'reasoning-work',
  draw: drawReasoningWork,
  cues: ['pf-reasoning-work-b0', 'pf-reasoning-work-b1', 'pf-reasoning-work-b2'],
};
