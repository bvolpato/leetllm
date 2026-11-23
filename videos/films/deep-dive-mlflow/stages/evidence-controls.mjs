import { spokenScene } from '../pieces/scene.mjs';
import { requestLedger, frozenCase } from '../pieces/request-ledger.mjs';

export default spokenScene('evidence-controls', (ctx, scene, state, api, g) => {
  if (state.beat === 0) {
    requestLedger(ctx, api, {
      earlier: 1,
      later: 1,
      common: true,
      prompts: true,
      indices: true,
      missing: true,
      replay: { id: 'Replay', prompt: 17, index: g(0, 0) >= 0.4 ? 'I7' : null },
    });
    api.text(
      ctx,
      g(0, 2) > 0
        ? 'Run the replay and record its citation.'
        : 'Reference for this replay   ·   T103',
      145,
      950,
      40,
      api.C.yellow,
    );
  } else {
    frozenCase(ctx, api, {
      caseProgress: g(1, 1),
      candidate: g(2, 0) > 0,
      index: g(2, 1) > 0,
      linked: g(2, 2) > 0,
    });
    api.text(
      ctx,
      state.beat === 1
        ? 'Reference for the regression   ·   T104'
        : 'Same case and expectation   ·   new execution',
      145,
      940,
      37,
      api.C.yellow,
    );
  }
});
