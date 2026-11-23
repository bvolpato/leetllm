import { testFixture, validationFixture } from '../fixtures.mjs';
import { complete } from '../policy-sheet.mjs';
import { countRow, developmentCounts } from '../tallies.mjs';
import { text } from '../defaults.mjs';

export function drawSealedTest(ctx, scene, state, api) {
  const { C } = api;
  developmentCounts(ctx, api, { baselineVisible: true, compiledVisible: true, selected: true });
  api.focus.target('test-counts', () => {
    const compared = complete(state, 'open-heldout');
    text(ctx, api, 'Held-out test  ·  20 new cases', 120, 647, 42, C.ink);
    ['baseline', 'compiled'].forEach((key, i) =>
      countRow(ctx, api, {
        y: 704 + i * 110,
        label: i ? 'Compiled A' : 'Baseline',
        fixture: testFixture[key],
        color: i ? C.cyan : C.blue,
        visible: i ? compared : complete(state, 'open-baseline'),
        resultName: key,
        selected: i === 1,
      }),
    );
    if (complete(state, 'reversed-order')) {
      const lead = validationFixture.compiled.correct - validationFixture.baseline.correct;
      const deficit = testFixture.baseline.correct - testFixture.compiled.correct;
      const note = complete(state, 'inspect-reversal')
        ? 'Pair both replies by request ID and inspect the differences.'
        : 'Compiled A  ·  ' + lead + ' more correct on development, ' + deficit + ' fewer on test';
      text(ctx, api, note, 120, 986, 37, C.yellow);
    }
  });
}
export default {
  id: 'sealed-test',
  draw: drawSealedTest,
  cues: ['frozen-winner', 'open-baseline', 'open-heldout', 'reversed-order', 'inspect-reversal'],
};
