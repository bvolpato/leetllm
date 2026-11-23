import { policy, publicationRecords } from '../fixtures.mjs';
import { publicationDecision } from '../model.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

const access = publicationDecision(publicationRecords[0]);
const note = publicationDecision(publicationRecords[2]);

function policyPage(ctx, api, x, y, underline) {
  const { C } = api;
  const width = 940;
  const fold = 76;
  const right = x + width;
  api.path(
    ctx,
    [
      { x, y },
      { x: right - fold, y },
      { x: right, y: y + fold },
      { x: right, y: y + 435 },
      { x, y: y + 435 },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: right - fold, y },
      { x: right, y: y + fold },
      { x: right - fold, y: y + fold },
    ],
    { closed: true, fill: C.blue, width: 0 },
  );
  const left = x + 54;
  api.text(ctx, access.record.id, left, y + 87, 62, C.bg, 'left', 'serif');
  api.line(ctx, left, y + 123, right - 54, y + 123, C.muted, 2);
  api.text(ctx, policy.replace(' after', '\nafter'), left, y + 214, 43, C.bg, 'left', 'serif');
  if (underline > 0) {
    ctx.save();
    ctx.font = lessonFont(43, 'serif');
    const length = ctx.measureText('after identity verification.').width;
    ctx.restore();
    api.line(ctx, left, y + 290, left + length * underline, y + 290, C.blue, 9);
  }
  api.text(ctx, access.record.documentId, left, y + 391, 29, C.panel, 'left', 'mono');
}

function workspaceNote(ctx, api, x, y) {
  const { C } = api;
  api.path(
    ctx,
    [
      { x, y },
      { x: x + 564, y },
      { x: x + 564, y: y + 300 },
      { x: x + 506, y: y + 341 },
      { x, y: y + 341 },
    ],
    { closed: true, fill: C.yellow, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: x + 506, y: y + 341 },
      { x: x + 505, y: y + 294 },
      { x: x + 564, y: y + 300 },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.rect(ctx, x + 185, y - 14, 195, 31, C.ink, undefined, 0);
  api.text(ctx, 'Private workspace note', x + 40, y + 79, 31, C.bg);
  api.text(ctx, 'Immediate access', x + 40, y + 197, 54, C.bg, 'left', 'serif');
  api.text(ctx, note.record.documentId, x + 40, y + 284, 28, C.panel, 'left', 'mono');
}

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const entering = (1 - api.clamp(state.t / 1.1)) ** 2;
  const underline = p('intro-timing');

  focus.target('policy-page', () =>
    policyPage(ctx, api, 170 - 70 * entering, 235 + 28 * entering, underline),
  );
  focus.target('workspace-page', () =>
    workspaceNote(ctx, api, 1180 + 64 * entering, 303 - 36 * entering),
  );

  if (p('intro-register') > 0) {
    focus.target('registry-entries', () => {
      api.text(ctx, 'Publisher’s register', 170, 768, 35, C.muted);
      api.line(ctx, 170, 795, 1744, 795, C.muted, 2);
      const grant = access.grant ? 'Active US grant' : 'No active grant';
      const digest = access.matching ? 'text matches' : 'text differs';
      api.text(ctx, grant + ' · ' + digest, 170, 860, 41, C.ink);
      api.text(ctx, note.registry ? 'Entry on file' : 'No entry', 1180, 860, 41, C.ink);
    });
  }
  const verdict = p('intro-verdict');
  if (p('intro-choice') > 0 || verdict > 0) {
    const target = verdict > 0 ? 'index-decision' : 'index-question';
    focus.target(target, () => {
      if (verdict < 1) {
        api.text(
          ctx,
          'Which page belongs in the policy index?',
          170,
          974,
          46,
          C.ink,
          'left',
          'serif',
        );
      } else {
        api.text(
          ctx,
          access.admitted ? 'Enter the policy index' : 'Keep outside',
          170,
          974,
          44,
          C.green,
        );
        api.text(
          ctx,
          note.admitted ? 'Enter the policy index' : 'Keep outside',
          1180,
          974,
          44,
          C.muted,
        );
      }
    });
  }
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-timing', 'intro-note', 'intro-register', 'intro-choice', 'intro-verdict'],
};
