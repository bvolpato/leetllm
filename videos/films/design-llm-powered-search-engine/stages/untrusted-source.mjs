import { spoken } from '../construction.mjs';

function drawPreview(ctx, api, request, denied) {
  const { C } = api;
  api.text(ctx, 'Signed in as Alice', 175, 252, 34, C.ink);
  api.text(ctx, 'Access to workspace A only', 1745, 252, 34, C.blue, 'right');

  api.rect(ctx, 175, 324, 705, 402, C.panel, C.blue, 12);
  api.text(ctx, 'Policy page', 215, 396, 47, C.ink, 'left', 'serif');
  api.text(ctx, 'Workspace A', 215, 456, 31, C.blue);
  api.line(ctx, 215, 493, 835, 493, C.muted, 2);
  api.text(ctx, 'Planning calendar', 215, 552, 33, C.ink);
  api.text(ctx, 'Open the roadmap', 215, 619, 39, C.cyan);
  api.line(ctx, 215, 628, 545, 628, C.cyan, 2);
  api.text(ctx, 'Link destination · workspace B', 215, 687, 30, C.muted);

  api.line(ctx, 884, 578, 1088, 578, C.muted, 2);
  api.line(ctx, 1090, 452, 1090, 704, denied ? C.pink : C.yellow, 6);
  api.text(ctx, 'Access check', 1050, 777, 30, C.ink, 'center');
  if (request > 0) {
    const x = 887 + 183 * request;
    api.circle(ctx, x, 578, 16, denied ? C.pink : C.cyan);
  }

  api.rect(ctx, 1190, 324, 555, 402, C.panel, denied ? C.pink : C.muted, 12);
  api.text(ctx, 'Roadmap preview', 1230, 396, 47, C.ink, 'left', 'serif');
  api.text(ctx, 'Workspace B', 1230, 456, 31, C.ink);
  api.line(ctx, 1230, 493, 1705, 493, C.muted, 2);
  if (denied) {
    api.text(ctx, 'Access denied', 1230, 596, 47, C.pink);
    api.text(ctx, 'No document fetched', 1230, 660, 32, C.ink);
  } else if (request > 0) {
    api.text(ctx, 'Preview requested', 1230, 596, 37, C.muted);
  }
}

function drawBufferedAnswer(ctx, api, showProgress) {
  const { C } = api;
  api.rect(ctx, 175, 347, 820, 385, C.panel, C.yellow, 12);
  api.text(ctx, 'Draft held for checking', 215, 422, 43, C.yellow);
  api.text(ctx, '60 days with security approval', 215, 547, 42, C.ink, 'left', 'serif');
  api.text(ctx, 'policy@2  ·  exception@1', 215, 650, 32, C.muted);
  api.rect(ctx, 1090, 347, 655, 385, C.panel, C.blue, 12);
  api.text(ctx, 'What Alice sees', 1130, 422, 43, C.blue);
  if (showProgress) api.text(ctx, 'Checking the policy sources…', 1130, 547, 37, C.ink);
  api.text(ctx, 'Policy claims sent  ·  0', 1130, 650, 32, C.muted);
}

export function drawUntrustedSource(ctx, scene, state, api) {
  const cue = (name) => spoken(scene, state, 'se-untrusted-source-' + name);
  api.focus.target('se-untrusted-source-mechanism', () => {
    if (state.beat === 2) {
      drawBufferedAnswer(ctx, api, cue('hold').phase !== 'before');
      return;
    }
    const request = cue('request');
    const denied = cue('1').phase === 'after';
    drawPreview(ctx, api, request.progress, denied);
    if (request.phase !== 'before') {
      api.text(
        ctx,
        denied
          ? 'The link opens only if Alice can read its destination.'
          : 'What happens when Alice asks for the preview?',
        175,
        917,
        41,
        denied ? api.C.ink : api.C.yellow,
      );
    }
  });
}

export default {
  id: 'untrusted-source',
  draw: drawUntrustedSource,
  cues: [
    'se-untrusted-source-0',
    'se-untrusted-source-isolate',
    'se-untrusted-source-request',
    'se-untrusted-source-1',
    'se-untrusted-source-2',
    'se-untrusted-source-hold',
  ],
};
