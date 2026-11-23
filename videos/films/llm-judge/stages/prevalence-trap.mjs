export function drawPrevalenceTrap(ctx, scene, state, api) {
  const { C, focus } = api;
  const total = 100;
  const unanimous = focus.progress('undefined-kappa', 0) === 1;
  const accepted = unanimous ? total : 90;
  const bad = total - accepted;
  const observed = accepted / total;
  const judgeAcceptRate = 1;
  const expected = (accepted / total) * judgeAcceptRate;
  const kappa = expected === 1 ? undefined : (observed - expected) / (1 - expected);
  const expectedPercent = (expected * 100).toFixed(0) + '%';
  const showErrors = focus.visible('majority-failure') && !unanimous;

  focus.target('majority-inputs', () => {
    api.text(ctx, 'Reviewer labels', 145, 275, 38, C.ink);
    for (let i = 0; i < total; i++) {
      const x = 150 + (i % 10) * 70;
      const y = 350 + Math.floor(i / 10) * 55;
      const knownBad = i >= accepted;
      api.rect(
        ctx,
        x,
        y,
        58,
        40,
        knownBad && showErrors ? C.pink : C.panel,
        knownBad ? C.pink : C.green,
        4,
      );
    }
    api.text(ctx, accepted + ' acceptable   /   ' + bad + ' bad', 145, 950, 38, C.ink);
    api.text(ctx, 'Judge approves all ' + total, 145, 1020, 34, C.yellow);
  });

  if (state.beat === 0) {
    if (showErrors)
      focus.target('majority-failure', () => {
        api.text(ctx, accepted + ' agreements', 1020, 389, 48, C.green);
        api.text(ctx, '0 of ' + bad + ' bad answers caught', 1020, 474, 40, C.pink);
        api.text(ctx, 'Raw agreement: ' + observed * 100 + '%', 1020, 567, 42, C.ink);
      });
    if (focus.visible('error-denominators'))
      focus.target('error-denominators', () => {
        api.math(
          ctx,
          '\\mathrm{false\\ acceptance}=' + bad + '/' + bad + '=1',
          1390,
          740,
          41,
          C.pink,
          'center',
        );
        api.math(
          ctx,
          '\\mathrm{false\\ rejection}=0/' + accepted + '=0',
          1390,
          848,
          41,
          C.cyan,
          'center',
        );
      });
    return;
  }
  focus.target('marginal-baseline', () => {
    api.text(ctx, 'Chance that both labels say acceptable', 972, 338, 39, C.ink);
    api.text(ctx, 'Reviewer', 985, 452, 34, C.muted);
    api.text(ctx, 'Judge', 1400, 452, 34, C.muted);
    api.text(ctx, accepted + ' / ' + total, 985, 534, 52, C.ink);
    api.text(ctx, '×', 1315, 534, 46, C.muted);
    api.text(ctx, total + ' / ' + total, 1400, 534, 52, C.ink);
    if (focus.progress('marginal-baseline', 0) === 1)
      api.text(ctx, 'Expected and observed: ' + expectedPercent, 972, 671, 43, C.cyan);
  });
  focus.target('kappa-result', () => {
    api.text(ctx, 'Cohen’s kappa', 972, 790, 34, C.muted);
    if (unanimous && focus.progress('kappa-undefined', 0) === 1) {
      api.text(ctx, '1 − 1 = 0 in the denominator', 972, 870, 40, C.yellow);
      api.text(ctx, 'Undefined', 972, 963, 56, C.ink, 'left', 'serif');
    } else if (!unanimous && focus.progress('kappa-zero', 0) === 1) {
      const o = observed.toFixed(2);
      const e = expected.toFixed(2);
      api.math(
        ctx,
        '\\kappa=\\frac{' + o + '-' + e + '}{1-' + e + '}=' + kappa,
        1320,
        900,
        62,
        C.yellow,
        'center',
      );
    }
  });
}

export default {
  id: 'prevalence-trap',
  draw: drawPrevalenceTrap,
  cues: [
    'majority-inputs',
    'majority-failure',
    'error-denominators',
    'marginal-baseline',
    'kappa-zero',
    'undefined-kappa',
    'kappa-undefined',
  ],
};
