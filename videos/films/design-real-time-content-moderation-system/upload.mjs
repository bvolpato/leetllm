import { boundDecision, fusionResult } from './model.mjs';

export const skyClub = Object.freeze({
  id: 'P24',
  revision: 3,
  scope: 'upload-eu',
  policy: 'v8',
  caption: 0.54,
  image: 0.76,
});
const pending = { ...skyClub, state: 'PENDING', applied: {}, outbox: [] };
const current = {
  id: 'D24',
  revision: skyClub.revision,
  scope: skyClub.scope,
  policy: skyClub.policy,
  action: 'ALLOW',
};
export const lateReceipt = { ...current, revision: 2, id: 'D23' };
function commitPublication(item, receipt) {
  const result = boundDecision(item, receipt);
  if (result.status !== 'APPLIED') return result;
  const event = {
    decision: receipt.id,
    item: item.id,
    revision: item.revision,
    state: result.item.state,
  };
  return { status: result.status, item: { ...result.item, outbox: [...item.outbox, event] } };
}
export const oldResult = commitPublication(pending, lateReceipt);
export const currentResult = commitPublication(oldResult.item, current);
export const replayResult = commitPublication(currentResult.item, current);
export const currentReceipt = current;

// Align the image contribution with the end of the caption strip. Each strip keeps its true length.
export function scoreRuler(
  ctx,
  api,
  { caption, image, x, y, width, join, landed, result, showImage = true },
) {
  const { C } = api;
  const { score, action } = fusionResult(caption, image);
  const first = 0.45 * caption;
  const second = 0.55 * image;
  const mark = x + width * 0.65;
  api.line(ctx, x, y + 18, x + width, y + 18, C.muted, 2);
  api.rect(ctx, x, y, width * first, 28, C.blue, undefined, 0);
  if (showImage) {
    const lift = landed ? 0 : 45;
    api.rect(ctx, x + width * first * join, y + lift, width * second, 28, C.cyan, undefined, 0);
  }
  api.line(ctx, mark, y - 15, mark, y + 39, C.yellow, 4);
  if (result) {
    const value = Number(score.toFixed(4));
    api.text(
      ctx,
      value + ' → ' + action,
      x + width,
      y + 101,
      33,
      action === 'REVIEW' ? C.yellow : C.green,
      'right',
    );
  }
}

export function readerView(ctx, api, { id, revision, kind, status, visible }) {
  const { C } = api;
  const x = 140;
  api.rect(ctx, x, 310, 650, 590, C.panel, C.blue, 16);
  api.text(ctx, 'Member view', x + 42, 380, 44, C.ink);
  api.text(ctx, id + '   /   revision ' + revision, x + 42, 432, 30, C.blue);
  api.line(ctx, x + 42, 467, x + 608, 467, C.muted, 2);
  if (!visible) {
    api.rect(ctx, x + 51, 527, 548, 202, C.bg, C.muted, 10);
    api.text(ctx, 'No public post', x + 325, 650, 44, C.muted, 'center');
  } else if (kind === 'classroom') {
    // The spine and paired ruled pages identify the handout even at thumbnail size.
    api.rect(ctx, x + 54, 509, 542, 178, C.bg, C.blue, 8);
    api.line(ctx, x + 325, 530, x + 325, 665, C.blue, 4);
    for (const start of [x + 82, x + 355])
      for (let row = 0; row < 3; row++)
        api.line(ctx, start, 551 + row * 37, start + 182 - row * 14, 551 + row * 37, C.blue, 4);
    api.text(ctx, 'Official tutorial mirror for classroom', x + 40, 750, 32, C.ink);
  } else {
    const stars = [
      [225, 628],
      [301, 573],
      [428, 607],
      [508, 543],
      [660, 585],
    ];
    stars.slice(1).forEach(([xx, yy], i) => api.line(ctx, ...stars[i], xx, yy, C.blue, 3));
    stars.forEach(([xx, yy]) => api.circle(ctx, xx, yy, 8, C.cyan));
    api.text(ctx, 'Night Sky Club', x + 42, 744, 45, C.ink);
  }
  api.text(ctx, status, x + 42, 842, 41, visible ? C.green : C.yellow);
}

export function uploadWorksheet(
  ctx,
  api,
  { showImage = true, join = 0, result = false, prompt = false },
) {
  const { C, focus } = api;
  const { caption, image, id, revision } = skyClub;
  focus.target('member-view', () =>
    readerView(ctx, api, {
      id,
      revision,
      kind: 'sky',
      visible: false,
      status: result ? 'Pending review' : 'Awaiting decision',
    }),
  );
  focus.target('score-sheet', () => {
    api.text(ctx, 'Night Sky Club   /   profile upload', 865, 340, 42, C.ink);
    api.text(ctx, 'Approved signature lookup   •   no match', 865, 407, 29, C.muted);
    api.text(ctx, 'Caption     0.45 × ' + caption, 865, 508, 37, C.blue);
    if (showImage) api.text(ctx, 'Image        0.55 × ' + image, 865, 568, 37, C.cyan);
    api.text(ctx, 'Review ≥ 0.65', 865 + 885 * 0.65, 659, 30, C.yellow, 'center');
    scoreRuler(ctx, api, {
      caption,
      image,
      x: 865,
      y: 693,
      width: 885,
      join,
      landed: result,
      showImage,
      result: false,
    });
    if (result) {
      const sum = fusionResult(caption, image).score;
      api.text(
        ctx,
        (0.45 * caption).toFixed(3) + ' + ' + (0.55 * image).toFixed(3) + ' = ' + sum.toFixed(3),
        865,
        825,
        43,
        C.ink,
      );
      api.text(ctx, 'Keep pending for review', 865, 896, 36, C.yellow);
    } else if (prompt) api.text(ctx, 'Which route does this score earn?', 865, 860, 38, C.ink);
  });
}
