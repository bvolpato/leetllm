import { CORPUS } from '../fixtures.mjs';
import { drawText, footer, paragraph } from '../defaults.mjs';
export function drawSubjectIntro(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.04, 0.92);
  {
    api.focus.target('question', () => {
      components.panel({
        x: 120,
        y: 350,
        width: 740,
        height: 230,
        fill: themeColors.panel,
        stroke: themeColors.blue,
      });
      drawText(ctx, api, 'Support question', 150, 395, 29, themeColors.blue);
      drawText(ctx, api, 'Can a stale service key rotate?', 150, 470, 34, themeColors.ink);
    });
    api.focus.reveal('service-answer', () =>
      api.focus.target('answer', () => {
        components.panel({
          x: 1080,
          y: 350,
          width: 720,
          height: 230,
          fill: themeColors.panel,
          stroke: themeColors.yellow,
        });
        drawText(ctx, api, 'Service answer · E1', 1110, 395, 29, themeColors.yellow);
        drawText(ctx, api, '“Within 30 days”', 1110, 470, 37, themeColors.ink);
      }),
    );
    api.focus.reveal('open-source', () =>
      api.focus.target('source', () => {
        const amount = api.focus.progress('open-source', q),
          y = api.lerp(720, 660, amount);
        components.panel({
          x: 1080,
          y,
          width: 720,
          height: 260,
          fill: themeColors.panel,
          stroke: themeColors.pink,
        });
        drawText(ctx, api, 'Opened E1 · eu-session-v1', 1110, y + 45, 29, themeColors.pink);
        paragraph(
          ctx,
          api,
          CORPUS.find((r) => r.id === 'eu-session-v1').text,
          1110,
          y + 105,
          650,
          30,
        );
        drawText(ctx, api, 'Entity: browser sessions', 1110, y + 220, 28, themeColors.pink);
      }),
    );
    if (beat > 0)
      api.focus.reveal('wrong-domain', () => {
        api.focus.target('question', () => {
          api.line(ctx, 352, 490, 551, 490, themeColors.blue, 5);
          drawText(ctx, api, 'Requested entity: service keys', 150, 680, 29, themeColors.blue);
        });
        drawText(ctx, api, 'Entity match fails', 700, 850, 34, themeColors.pink, 'center');
        api.arrow(ctx, 1040, 810, 930, 810, themeColors.pink, 5);
      });
    footer(
      ctx,
      api,
      'A request-local citation label can identify text that does not support the requested claim',
    );
  }
}
export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['question', 'service-answer', 'open-source', 'wrong-domain', 'follow-request'],
};
