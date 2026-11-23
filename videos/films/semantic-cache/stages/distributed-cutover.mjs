import {
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintDistributedCutover(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  const cut = done(0, 'sc-new-reader-miss');
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Logical invalidation · the old record remains in storage',
    245,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Stored answer\ncorpus C7 · release R7\n30-day response',
    620,
    390,
    680,
    themeColors.blue,
    190,
    31,
  );
  const readers = [
    ['old reader', 'C7 / R7', true],
    ['new approved reader', cut ? 'C8 / R8' : 'C7 / R7', !cut],
  ];
  readers.forEach(([label, release, hit], i) => {
    const x = 170 + i * 1120;
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      label + '\n' + release,
      x,
      700,
      460,
      hit ? themeColors.cyan : themeColors.yellow,
      120,
      28,
    );
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      i ? 1300 : 620,
      580,
      x + 230,
      680,
      hit ? themeColors.cyan : themeColors.pink,
      4,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      hit ? 'scope match' : 'scope mismatch → fresh path',
      x + 230,
      915,
      27,
      hit ? themeColors.cyan : themeColors.pink,
      'center',
    );
  });
  if (currentBeat === 1)
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Coordinate loaded dependencies, approved scope and cache routing',
      325,
      themeColors.yellow,
      29,
    );
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Each reader switches when it loads the approved release and corpus.',
  );
}
export function drawDistributedCutover(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintDistributedCutover);
}
export default {
  id: 'distributed-cutover',
  draw: drawDistributedCutover,
  cues: ['sc-distributed-cutover-b0', 'sc-new-reader-miss', 'sc-distributed-cutover-b1'],
};
