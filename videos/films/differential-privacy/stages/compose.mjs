export function drawCompose(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  const names = ['Alice', 'Bao', 'Cai', 'Dev'];
  const draws = [[1, 0, 1, 0], [0, 1, 0, 0]];
  focus.target('sampler', () => {
    text('Independent inclusion   q = ½', 200, 285, 40, C.cyan);
    text('Fixed public divisor   L = 2', 1710, 285, 37, C.yellow, 'right');
    names.forEach((name, i) => text(name, 555 + 240 * i, 414, 38, C.ink, 'center'));
    draws.forEach((mask, r) => {
      const y = 520 + 152 * r;
      text('Step ' + (r + 1), 202, y + 14, 37);
      const p = focus.progress(r === 0 ? 'draw-one' : 'draw-two', 0);
      mask.forEach((included, i) => {
        const decided = p > 0 && p >= (i + 1) / names.length;
        const x = 555 + i * 240;
        api.circle(ctx, x, y, 34, decided && included ? C.cyan : C.panel, C.muted, 2);
        if (decided) text(included ? '+' : '−', x, y + 13, 34, included ? C.bg : C.muted, 'center');
      });
      if (p === 1) text(mask.reduce((a, b) => a + b, 0) + ' sampled', 1500, y + 14, 33, C.cyan);
    });
    const notes = [
      'One possible draw from four customers',
      'Each step uses fresh inclusion decisions.',
      'Could fixed pairs produce the second row?',
      'Fixed batches of two cannot produce the second row.',
      'Account for the actual sampler, noise and steps at the declared unit and δ.',
    ];
    text(notes[state.beat ?? 0], 960, 834, 35, C.ink, 'center');
    text('Parameter update   θ ← θ − η × (clipped sum + Gaussian noise) / L', 960, 974, 35, C.yellow, 'center');
  });
}
export default { id: 'compose', draw: drawCompose, cues: ['draw-one', 'draw-two', 'compare-sampler', 'explain-sampler', 'account-run'] };
