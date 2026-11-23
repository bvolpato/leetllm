import { ARTICLE_RECORD } from '../fixtures.mjs';
import { answerDigest } from '../model.mjs';
import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintQuarantineWrite(
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
  const admitted = done(0, 'sc-quarantine-admit'),
    revoked = done(1, 'sc-revoke-both');
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Local evidence binds actual response bytes, scope, class and expiry',
    245,
  );
  if (currentBeat === 0) {
    const cases = [
      ['Fresh retention response', 'no review yet', false],
      ['Reviewed rate-limit response', 'matching trusted digest', admitted],
      ['Live response / edited bytes', 'wrong class / digest', false],
    ];
    cases.forEach(([label, reason, pass], i) => {
      const x = 170 + i * 560;
      drawSemanticConstructionsBox(
        ctx,
        api,
        themeColors,
        c,
        label,
        x,
        370,
        480,
        pass ? themeColors.green : themeColors.muted,
        115,
        27,
      );
      drawSemanticConstructionsArrow(
        ctx,
        api,
        themeColors,
        x + 240,
        520,
        x + 240,
        645,
        pass ? themeColors.green : themeColors.pink,
      );
      drawSemanticConstructionsBox(
        ctx,
        api,
        themeColors,
        c,
        pass ? 'ADMITTED' : 'QUARANTINE',
        x,
        690,
        480,
        pass ? themeColors.green : themeColors.pink,
        100,
        30,
      );
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        reason,
        x + 240,
        870,
        26,
        themeColors.muted,
        'center',
      );
    });
  } else {
    const digest = answerDigest(),
      edited = answerDigest({
        ...ARTICLE_RECORD,
        response: ARTICLE_RECORD.response + '!',
      });
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      ARTICLE_RECORD.response,
      300,
      themeColors.blue,
      27,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'Reviewed digest',
      170,
      370,
      30,
      themeColors.blue,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      digest.slice(0, 32),
      600,
      370,
      29,
      themeColors.blue,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'Response + “!”',
      170,
      480,
      30,
      themeColors.pink,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      edited.slice(0, 32),
      600,
      480,
      29,
      themeColors.pink,
    );
    drawSemanticConstructionsLine(ctx, api, themeColors, 170, 550, 1750, 550, themeColors.panel, 2);
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Exact read',
      170,
      650,
      560,
      revoked ? themeColors.pink : themeColors.cyan,
      105,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Approval ID → trusted digest',
      825,
      650,
      900,
      revoked ? themeColors.muted : themeColors.blue,
      105,
      29,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'Semantic read',
      170,
      820,
      560,
      revoked ? themeColors.pink : themeColors.cyan,
      105,
    );
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      745,
      700,
      800,
      700,
      revoked ? themeColors.pink : themeColors.green,
      4,
    );
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      745,
      870,
      800,
      700,
      revoked ? themeColors.pink : themeColors.green,
      4,
    );
    if (revoked)
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'approval removed → both blocked',
        1275,
        875,
        31,
        themeColors.pink,
        'center',
      );
  }
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Only a trusted review can add an approved digest.',
  );
}
export function drawQuarantineWrite(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintQuarantineWrite);
}
export default {
  id: 'quarantine-write',
  draw: drawQuarantineWrite,
  cues: [
    'sc-quarantine-write-b0',
    'sc-quarantine-admit',
    'sc-quarantine-write-b1',
    'sc-revoke-both',
  ],
};
