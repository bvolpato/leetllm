import { sampleModel } from './construction.mjs';
import { card, text } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('unknown', state);
  {
    card(
      ctx,
      api,
      'The guide names an old button.  Label: Docs',
      250,
      350,
      1420,
      100,
      themeColors.blue,
      33,
    );
    const checks = [
      ['Allowed label', true],
      ['Reference agrees', true],
    ];
    checks.forEach(([label, good], i) =>
      api.focus.target('workload-check-result', () =>
        card(
          ctx,
          api,
          `${label} · ${good ? 'PASS' : 'FAIL'}`,
          350 + i * 670,
          570,
          570,
          100,
          themeColors.green,
          30,
        ),
      ),
    );
    if (modelState.beat > 0) {
      ['Task success', 'Response time', 'Total memory'].forEach((label, i) =>
        card(ctx, api, label, 230 + i * 520, 795, 450, 88, themeColors.cyan, 27),
      );
    }
    text(
      ctx,
      api,
      modelState.beat === 2
        ? 'Context → representation → probabilities → next token'
        : 'A text interface still has a measurable application result',
      960,
      1015,
      28,
      themeColors.yellow,
      'center',
    );
  }
}
