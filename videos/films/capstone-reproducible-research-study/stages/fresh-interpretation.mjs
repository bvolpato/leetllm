import { researchEvent } from '../construction.mjs';
import { researchConstructionModel } from '../model.mjs';
import { drawInterval, signed } from '../evidence.mjs';

export function drawFreshInterpretation(ctx, scene, state, api) {
  const { C } = api;
  const model = researchConstructionModel(scene.id, state);
  const { input } = model;
  const rates = input.absolute.map((value) => (100 * value).toFixed(1) + '%');
  const absolute = `${rates[0]} sparse   /   ${rates[1]} shaped`;
  const event = (b, s) => researchEvent(scene.id, state, b, s);
  const changed = model.changedEndpoint;
  const secondQuestion = state.beat >= 3;
  const secondAnswer = event(4, 0) === 1;
  api.focus.target('rs-fresh-interpretation-mechanism', () => {
    api.text(
      ctx,
      'Supplied worksheet   /   Differences in percentage points',
      135,
      238,
      33,
      C.muted,
    );
    const x = 175,
      width = 1010;
    api.text(ctx, 'Early goal-reaching rate', x, 327, 43, C.ink);
    const showEarly = event(0, 1) > 0;
    drawInterval(ctx, api, {
      x,
      y: 455,
      width,
      domain: [-5, 25],
      ticks: [0, 10, 20],
      interval: showEarly && input.earlyInterval.map((v) => 100 * v),
      point: 100 * input.earlyMean,
      guide: 10,
      labelDigits: 0,
    });
    api.text(
      ctx,
      showEarly
        ? `Mean ${signed(100 * input.earlyMean)}   /   Rule: mean ≥ +10 and lower end > 0`
        : 'Rule: mean ≥ +10 and lower end > 0',
      x,
      572,
      29,
      C.muted,
    );
    api.text(ctx, 'Final goal-reaching rate', x, 664, 43, C.ink);
    const showFinal = event(0, 2) > 0;
    drawInterval(ctx, api, {
      x,
      y: 793,
      width,
      domain: [-4, 4],
      ticks: [-4, -2, 0, 2, 4],
      interval: showFinal && input.finalInterval.map((v) => 100 * v),
      point: input.finalMean * 100,
      band: [-2, 2],
    });
    api.text(
      ctx,
      showFinal
        ? `Mean ${signed(input.finalMean * 100, 1)}   /   Allowed band: −2 to +2`
        : 'Allowed band: −2 to +2',
      x,
      913,
      29,
      C.muted,
    );
    const right = 1260;
    api.text(ctx, secondQuestion ? 'Same early evidence' : 'Early claim', right, 326, 33, C.muted);
    if (model.reportRepaired) {
      api.text(ctx, 'Mean-and-positive-interval rule passes', right, 387, 28, C.ink);
      api.text(ctx, 'Gains below ten points still fit.', right, 447, 31, C.cyan);
    } else {
      api.text(ctx, 'Draft: at least ten points', right, 388, 35, C.ink);
      api.text(ctx, 'at 90% confidence', right, 439, 35, C.ink);
    }
    if (model.earlyVisible) api.text(ctx, 'PASS stated rule', right, 521, 30, C.green);
    api.text(ctx, 'Final claim', right, 664, 33, C.muted);
    api.text(
      ctx,
      model.reportRepaired ? absolute : 'Draft: competent final policies',
      right,
      723,
      31,
      C.ink,
    );
    if (!model.reportRepaired && event(0, 3) > 0) api.text(ctx, absolute, right, 782, 29, C.ink);
    if (model.finalVisible && !secondQuestion)
      api.text(ctx, 'PASS stated rule', right, 853, 30, C.green);
    if (secondQuestion && !secondAnswer)
      api.text(
        ctx,
        changed ? 'Does this interval fit?' : 'Recheck the final interval',
        right,
        853,
        33,
        C.yellow,
      );
    if (secondAnswer)
      api.text(
        ctx,
        model.finalPass ? 'Inside the band' : 'Lower end outside the band',
        right,
        853,
        32,
        C.pink,
      );
    const footer = secondAnswer
      ? 'Report the early gain. Withhold support for the combined claim.'
      : secondQuestion
        ? 'Can the report still say both rules pass?'
        : model.reportRepaired
          ? 'Both rules pass. Each policy reaches the goal in fewer than half its episodes.'
          : 'Which claims can you defend from these measurements?';
    api.text(ctx, footer, 960, 1004, 33, C.ink, 'center');
  });
}
export default { id: 'fresh-interpretation', draw: drawFreshInterpretation };
