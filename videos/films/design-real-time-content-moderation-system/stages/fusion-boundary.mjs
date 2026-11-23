import { fusionResult } from '../model.mjs';
import { scoreRuler } from '../upload.mjs';

const cases = [
  { title: 'Study group photo', caption: 0.08, image: 0.12, cue: 'fusion-low' },
  { title: 'Official-account claim', caption: 0.71, image: 0.68, cue: 'fusion-high' },
  { title: 'Equal input scores', caption: 0.65, image: 0.65, cue: 'fusion-edge-complete' },
];

export function drawFusionBoundary(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat < 2) {
    focus.target('fusion-scale', () => {
      label('Caption × 0.45', 145, 270, 39, C.blue);
      label('Image × 0.55', 500, 270, 39, C.cyan);
      label('Review at 0.65 or higher', 960 + 815 * 0.65, 265, 37, C.yellow, 'center');
    });
    for (const [i, row] of cases.entries()) {
      if (i === 1 && state.beat === 0 && !focus.visible('fusion-claim-input')) continue;
      if (i === 2 && (state.beat === 0 || !focus.visible(row.cue))) continue;
      const y = 390 + i * 215;
      const join = focus.progress(row.cue);
      focus.target('fusion-' + ['study', 'claim', 'edge'][i], () => {
        label(row.title, 145, y, 46);
        const captionTerm = Number((0.45 * row.caption).toFixed(4));
        const imageTerm = Number((0.55 * row.image).toFixed(4));
        label('0.45 × ' + row.caption + ' = ' + captionTerm, 145, y + 73, 31, C.blue);
        label('0.55 × ' + row.image + ' = ' + imageTerm, 523, y + 73, 31, C.cyan);
        scoreRuler(ctx, api, {
          ...row,
          x: 960,
          y: y - 10,
          width: 815,
          join,
          landed: join === 1,
          result: join === 1,
        });
        if (join === 1 && i === 2) label('0.45×0.65 + 0.55×0.65 = 0.65', 145, y + 140, 29, C.muted);
      });
    }
    if (state.beat === 0 && focus.visible('fusion-question'))
      focus.target('fusion-prompt', () =>
        label('Which upload needs someone to check who owns the account?', 145, 952, 40),
      );
    return;
  }
  const matched = state.beat === 2;
  const unknown = state.beat > 2 && focus.visible('fusion-unknown');
  const flag = unknown ? 'unverified' : matched;
  const complete = focus.progress(matched ? 'fusion-signature' : 'fusion-invalid') === 1;
  focus.target('signature-input', () => {
    label('Approved signature lookup', 145, 330, 43);
    api.rect(ctx, 145, 380, 720, 135, C.panel, C.blue, 12);
    label(
      unknown ? 'Flag type unknown' : matched ? 'Verified match' : 'No match',
      195,
      470,
      48,
      C.blue,
    );
    label('Caption score', 145, 672, 41);
    label('Unavailable', 145, 755, 49, C.muted);
    label('Image score   0.10', 145, 853, 34, C.cyan);
  });
  focus.target('signature-route', () => {
    api.line(ctx, 930, 347, 930, 855, C.muted, 3);
    label('Publication decision', 1030, 398, 40);
    if (complete) {
      const { action } = fusionResult(NaN, 0.1, flag);
      label(action, 1030, 570, 87, action === 'BLOCK' ? C.pink : C.yellow);
      label(
        action === 'BLOCK' ? 'Send to restricted review' : 'Keep the upload pending',
        1030,
        692,
        37,
      );
    } else label('?', 1030, 570, 87, C.muted);
  });
}
export default {
  id: 'fusion-boundary',
  draw: drawFusionBoundary,
  cues: [
    'fusion-weights',
    'fusion-claim-input',
    'fusion-question',
    'fusion-low',
    'fusion-high',
    'fusion-edge-complete',
    'fusion-signature',
    'fusion-invalid',
    'fusion-unknown',
  ],
};
