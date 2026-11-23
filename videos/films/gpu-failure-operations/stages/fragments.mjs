import { fragments } from '../fixtures.mjs';
import { mix } from '../arithmetic.mjs';
import {
  constructionHeading,
  constructionNote,
  constructionText,
  text,
  withGpuConstructionFrame,
} from '../defaults.mjs';
export function paintGpuLegacyFragments(ctx, scene, state, api, C, c, t, s, b) {
  text(ctx, api, C, 'One request needs a suitable block', 150, 285, 37);
  s.fragments.forEach((v, i) => {
    const x = 180 + (i % 4) * 425,
      y = 380 + Math.floor(i / 4) * 230;
    if (i === s.probe) {
      api.focus.target('fragments-panel-fragments', () =>
        c.panel({
          x,
          y,
          width: 340,
          height: 110,
          fill: C.panel,
          stroke: C.pink,
          radius: 0,
        }),
      );
      text(ctx, api, C, 'Request: 1.50 GiB', x, y - 25, 25, C.pink);
    }
    api.rect(ctx, x, y, (v / 1.5) * 340, 110, i === s.probe ? C.yellow : C.cyan, undefined, 0);
    text(ctx, api, C, v.toFixed(2) + ' GiB', x, y + 165, 31, i === s.probe ? C.yellow : C.cyan);
  });
  api.focus.target(
    'fragments-inactive-total-s-total-tofixed-2-gib-largest-s-largest-tofixed-2-gib',
    () =>
      text(
        ctx,
        api,
        C,
        'Inactive total ' + s.total.toFixed(2) + ' GiB · largest ' + s.largest.toFixed(2) + ' GiB',
        960,
        890,
        41,
        C.blue,
        'center',
      ),
  );
  api.focus.target('fragments-1-50-gib-request-fits-no-observed-inactive-fragment', () =>
    text(
      ctx,
      api,
      C,
      '1.50 GiB request fits no observed inactive fragment',
      960,
      980,
      31,
      C.pink,
      'center',
    ),
  );
}
export function paintGpuConstructionFragments(
  ctx,
  scene,
  state,
  api,
  C,
  f,
  b,
  p,
  show,
  prog,
  done,
  original,
) {
  constructionHeading(
    ctx,
    api,
    C,
    'Possible layout    /    inactive block lengths in GiB',
  );
  let left = 190;
  const starts = [];
  fragments.forEach((v, i) => {
    starts.push(left);
    api.rect(ctx, left, 560, v * 150, 100, C.cyan);
    constructionText(ctx, api, C, v.toFixed(2), left + v * 75, 770, 30, C.cyan, 'center');
    left += v * 150;
    if (i < fragments.length - 1) {
      api.rect(ctx, left, 560, 75, 100, C.blue);
      constructionText(ctx, api, C, 'live', left + 37.5, 725, 21, C.blue, 'center');
      left += 75;
    }
  });
  const position = b === 0 ? 0 : 6 * prog('gpu-fragment-probe', 1),
    index = Math.min(6, Math.floor(position)),
    x = mix(starts[index], starts[Math.min(6, index + 1)], position - index);
  api.rect(ctx, x, 520, 1.5 * 150, 180, 'transparent', C.pink, 4);
  constructionText(ctx, api, C, 'same 1.50 GiB request', 960, 410, 35, C.pink, 'center');
  constructionText(
    ctx,
    api,
    C,
    'Seven inactive holes total 6.10 GiB · largest 0.88 GiB',
    960,
    850,
    37,
    C.cyan,
    'center',
  );
  constructionText(
    ctx,
    api,
    C,
    b === 0 && !done('fragments-beat-1-focus-1', 0) ? 'Can any one of these holes hold the request?' : 'Every observed hole ends before the request does.',
    960,
    960,
    30,
    C.pink,
    'center',
  );
  constructionNote(
    ctx,
    api,
    C,
    'Occupied spans are schematic. Pools and pending frees need separate evidence.',
  );
}
export function drawFragmentsStage(ctx, scene, state, api) {
  withGpuConstructionFrame(ctx, scene, state, api, paintGpuConstructionFragments);
}
export default {
  id: 'fragments',
  draw: drawFragmentsStage,
  cues: [
    'fragments-beat-1-focus-1',
    'fragments-beat-1-focus-2',
    'fragments-beat-2-focus-1',
    'gpu-fragment-probe',
  ],
};
