export function drawMemoryPacket(ctx, api, clock, pass, count, t, local, write) {
  const { C } = api;
  function packet(left, top, cell, kind, ready = true) {
    const col = kind === 'S' ? C.blue : C.cyan;
    for (let row = 0; row < 3; row++)
      for (let k = 0; k < 3; k++) {
        api.rect(
          ctx,
          left + k * cell,
          top + row * cell,
          cell - 4,
          cell - 4,
          ready && k <= row ? col : C.panel,
          ready ? col : C.muted,
          2,
        );
      }
  }
  api.focus.target('local-data', () => {
    api.text(ctx, local ? 'Fused attention' : 'Arithmetic units', 160, 297, 44, C.ink);
    api.line(ctx, 160, 330, 624, 330, C.muted, 2);
    api.text(ctx, local ? 'On-chip score tile' : pass.operation, 160, 431, 36, C.ink);
    if (local) {
      for (let j = 0; j < 2; j++) api.rect(ctx, 175 + j * 108, 494, 98, 98, C.blue, undefined, 5);
      api.text(ctx, 'Reuse these slots', 160, 698, 31, C.blue);
    } else packet(181, 491, 48, pass.payload, write || clock.done(pass.cue));
  });
  api.focus.target('hbm-data', () => {
    api.text(ctx, 'HBM', 1355, 297, 48, C.ink);
    api.line(ctx, 1325, 330, 1770, 330, C.muted, 2);
    api.text(
      ctx,
      local
        ? 'Inputs and output'
        : count >= 3
          ? 'Probabilities  P'
          : count >= 1
            ? 'Scores  S'
            : 'Score allocation',
      1325,
      431,
      39,
      C.ink,
    );
    if (!local && count > 0) packet(1340, 491, 48, count >= 3 ? 'P' : 'S');
    if (local) api.text(ctx, 'Q   K   V   O', 1325, 560, 47, C.cyan);
  });
  api.focus.target('memory-channel', () => {
    if (local) {
      api.text(ctx, 'No full S or P transfer', 940, 598, 34, C.cyan, 'center');
    } else {
      const left = 590,
        right = 1190;
      api.arrow(ctx, write ? left : right, 680, write ? right : left, 680, C.muted, 3);
      api.text(ctx, pass.destination, 890, 780, 34, C.ink, 'center');
      if (t > 0 && t < 1)
        packet(api.lerp(write ? left : right, write ? right : left, t), 486, 33, pass.payload);
    }
  });
  api.focus.target('traffic-count', () =>
    api.text(
      ctx,
      local
        ? 'Full-matrix intermediate transfers avoided'
        : 'Completed full-matrix transfers   ' + count,
      960,
      948,
      44,
      local ? C.cyan : C.yellow,
      'center',
    ),
  );
}
