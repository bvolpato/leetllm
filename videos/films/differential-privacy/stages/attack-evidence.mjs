export function drawAttackEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const text = (v, x, y, size, color = C.ink, align = 'left') => api.text(ctx, v, x, y, size, color, align);
  if (state.beat < 2) {
    const ref = focus.progress('read-reference', 0), labels = focus.progress('open-labels', 0) > 0;
    focus.target('loss-audit', () => {
      text('Synthetic audit set', 210, 277, 38);
      text('Target loss', 790, 396, 35, C.muted);
      text('Reference loss', 1230, 396, 35, C.muted);
      [['Public phrase', 0.25, 'Outside training'], ['Second phrase', 1.2, 'In training']].forEach(([name, reference, known], i) => {
        const y = 487 + 220 * i;
        text(name, 210, y, 38);
        if (labels) text(known, 210, y + 72, 33, C.yellow);
        text('0.20', 790, y, 41, C.cyan);
        api.rect(ctx, 790, y + 35, 60, 28, C.cyan, undefined, 0);
        if (ref > 0) {
          text(reference.toFixed(2), 1230, y, 41, C.blue);
          api.rect(ctx, 1230, y + 35, 300 * reference * ref, 28, C.blue, undefined, 0);
        }
      });
      text(labels ? 'Calling both members gives one false positive.' : 'Can these identical target losses distinguish the two documents?', 960, 956, 36, C.ink, 'center');
    });
  } else {
    focus.target('delta-example', () => {
      const reveal = focus.progress('whole-input', 0);
      text('One random draw   ·   20 equally likely squares', 960, 284, 47, C.ink, 'center');
      for (let i = 0; i < 20; i++) {
        const x = 250 + (i % 10) * 145, y = 355 + Math.floor(i / 10) * 143;
        const last = i === 19;
        api.rect(ctx, x, y, 120, 120, last ? C.panel : C.blue, last ? C.pink : undefined);
        if (last && reveal > 0) api.rect(ctx, x, y + 120 * (1 - reveal), 120, 120 * reveal, C.pink);
        text(last ? (reveal === 1 ? 'Data' : '?') : '0', x + 60, y + 76, 40,
          last && reveal < 1 ? C.ink : C.bg, 'center');
      }
      text('19 in 20   ·   always return 0', 250, 752, 39, C.blue);
      if (reveal === 1) {
        text('1 in 20   ·   return every record', 1675, 752, 39, C.pink, 'right');
      }
      if (focus.progress('delta-bound', 0) === 1) {
        text('Largest probability change   1 / 20 = 0.05     ·     ε = 0,  δ = 0.05', 960, 933, 38, C.yellow, 'center');
      }
    });
  }
}
export default { id: 'attack-evidence', draw: drawAttackEvidence, cues: ['compare-loss', 'read-reference', 'open-labels', 'whole-input', 'delta-bound'] };
