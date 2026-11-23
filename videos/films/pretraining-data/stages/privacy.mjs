import { drawText, note, pill, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainPrivacy(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (b === 0) {
    drawText(ctx, api, C, 'One retained technical source', 960, 300, 38, C.blue);
    ['contact: alice@example.test', '-----BEGIN PRIVATE KEY-----', 'Author: Dr. Rivera'].forEach(
      (v, i) => api.text(ctx, v, 350, 460 + i * 140, 34, i === 1 ? C.pink : C.ink, 'left', 'mono'),
    );
    if (D('spans'))
      drawText(
        ctx,
        api,
        C,
        'Source spans + privacy-policy version remain attached',
        960,
        920,
        34,
        C.cyan,
      );
    note(
      ctx,
      api,
      C,
      'Private key, structured identifier and contextual personal information have distinct policies',
    );
  } else if (b === 1) {
    drawText(
      ctx,
      api,
      C,
      beg('replace') ? 'contact: <EMAIL>' : 'contact: alice@example.test',
      800,
      440,
      40,
      C.cyan,
    );
    drawText(ctx, api, C, '-----BEGIN PRIVATE KEY-----', 960, 605, 39, C.pink);
    pill(ctx, api, C, 'Tokenizer special registry', 960, 795, 850, C.blue);
    if (D('register'))
      drawText(ctx, api, C, '<EMAIL> absent → ordinary text pieces', 960, 920, 34, C.yellow);
  } else {
    pill(ctx, api, C, 'Clinical explanation', 500, 460, 650, C.blue);
    pill(ctx, api, C, 'Abusive message', 1400, 460, 650, C.pink);
    drawText(ctx, api, C, 'Same flagged word', 960, 650, 40, C.yellow);
    if (D('context'))
      drawText(
        ctx,
        api,
        C,
        'Different context → separately evaluated handling',
        960,
        800,
        35,
        C.cyan,
      );
    if (D('secret'))
      drawText(
        ctx,
        api,
        C,
        'contact: <EMAIL>     ·     -----BEGIN PRIVATE KEY-----',
        960,
        925,
        31,
        C.pink,
      );
    note(
      ctx,
      api,
      C,
      'Inspect retained and removed samples; preserve provenance and terms for synthetic variants',
    );
  }
}
export function drawPrivacyStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainPrivacy);
}
export default {
  id: 'privacy',
  draw: drawPrivacyStage,
  cues: [
    'pt-privacy-spans',
    'pt-privacy-replace',
    'pt-privacy-register',
    'pt-privacy-context',
    'pt-privacy-secret',
  ],
};
