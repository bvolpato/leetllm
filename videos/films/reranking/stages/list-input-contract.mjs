function tiles(ctx, api, names, x, y, width, accent) {
  const { C } = api;
  names.forEach((name, i) => {
    const left = x + i * (width + 12);
    const color = name === 'Hours' ? C.green : name === 'Events' || name === 'X' ? C.pink : accent;
    api.rect(ctx, left, y, width, 91, C.panel, color, 8);
    api.text(ctx, name, left + width / 2, y + 59, 34, color, 'center');
  });
}

function twoRuns(ctx, api) {
  const { C, focus } = api;
  const swap = focus.progress('replace-neighbor', 0);
  focus.target('pair', () => {
    api.text(ctx, 'Pair scorer', 120, 280, 46, C.blue);
    tiles(ctx, api, ['Sunday?', 'Hours'], 118, 422, 224, C.blue);
    if (swap === 1) {
      tiles(ctx, api, ['Sunday?', 'Hours'], 118, 673, 224, C.blue);
      api.text(ctx, 'Same pair, same score', 118, 878, 40, C.ink);
    }
  });
  focus.target('list', () => {
    api.text(ctx, 'Listwise scorer', 815, 280, 46, C.cyan);
    api.text(ctx, 'First run', 815, 384, 31, C.muted);
    const first = ['Sunday?', 'Holiday', 'Hours', 'Map'];
    tiles(ctx, api, first, 815, 422, 224, C.cyan);
    if (swap === 0) return;
    api.text(ctx, 'Run again', 815, 641, 31, C.muted);
    const x = 815 + 236;
    tiles(ctx, api, ['Sunday?'], 815, 673, 224, C.cyan);
    tiles(ctx, api, ['Hours', 'Map'], x + 236, 673, 224, C.cyan);
    // Let the replacement slip settle beside the unchanged hours slip.
    tiles(ctx, api, ['Events'], x, 673 - 100 * (1 - api.ease(swap)), 224, C.pink);
    if (swap === 1) api.text(ctx, 'New neighbor, new scoring input', 815, 878, 40, C.ink);
  });
}

function causalGrid(ctx, api) {
  const { C, focus } = api;
  focus.target('grid', () => {
    const names = ['Sunday?', 'Events', 'Hours', 'Map'];
    const progress = focus.progress('causal-list', 0);
    api.text(ctx, 'Text each row can read', 125, 280, 40, C.ink);
    names.forEach((name, i) => {
      const y = 429 + i * 123;
      api.text(ctx, name, 452 + i * 182, 371, 33, C.muted, 'center');
      api.text(ctx, name, 290, y + 42, 35, i === 2 ? C.green : C.ink, 'right');
      for (let column = 0; column <= i; column++) {
        const selected = i === 2 && column === 1 && progress > 0;
        const x = 420 + column * 182;
        api.rect(ctx, x, y, 64, 64, selected ? C.pink : i === 2 ? C.green : C.blue, undefined, 6);
        if (selected) {
          const radius = 5 + 4 * progress;
          api.circle(ctx, x + 32, y + 32, radius, C.bg);
        }
      }
    });
  });
  focus.target('model', () => {
    if (focus.visible('revision-contract')) {
      api.text(ctx, 'Jina Reranker v3.5', 1195, 433, 48, C.cyan);
      api.text(ctx, 'Causal attention', 1195, 564, 40, C.ink);
      api.text(ctx, 'Small projection network', 1195, 647, 40, C.ink);
      api.text(ctx, 'Cosine similarity', 1195, 730, 40, C.ink);
    }
  });
}

function checkOrder(ctx, api) {
  const { C, focus } = api;
  api.text(ctx, 'Identifiers sent', 150, 350, 43, C.ink);
  tiles(ctx, api, ['P', 'Q', 'R'], 150, 414, 188, C.blue);
  focus.target('permutation-mark', () => {
    if (!focus.visible('permutation')) return;
    api.text(ctx, 'Returned order', 1050, 350, 43, C.ink);
    focus.target('foreign-id-mark', () => {
      const foreign = focus.progress('foreign-id', 0) === 1;
      tiles(ctx, api, ['Q', 'P', foreign ? 'X' : 'R'], 1050, 414, 188, C.cyan);
      if (foreign) api.text(ctx, 'X is outside the list. Reject the order.', 1050, 650, 40, C.pink);
    });
  });
  focus.target('permutation-validation-mark', () => {
    if (focus.visible('permutation-validation'))
      api.text(ctx, 'Check every input ID appears exactly once.', 150, 850, 43, C.ink);
  });
}

export default {
  id: 'list-input-contract',
  draw(ctx, scene, state, api) {
    if (state.beat === 0) twoRuns(ctx, api);
    else if (state.beat === 1) causalGrid(ctx, api);
    else checkOrder(ctx, api);
  },
  cues: [
    'independent-pairs',
    'whole-list',
    'replace-neighbor',
    'causal-list',
    'revision-contract',
    'permutation',
    'foreign-id',
    'permutation-validation',
  ],
};
