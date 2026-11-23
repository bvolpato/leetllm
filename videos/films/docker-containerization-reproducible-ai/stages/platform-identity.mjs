import { cueProgress } from '../construction.mjs';
import { codeText, focusTarget, line, rectangle, text } from '../defaults.mjs';

export function drawPlatformIdentity(ctx, scene, state, api) {
  const { C } = api;
  const after = (key) => state.cues?.['dk-platform-identity-' + key]?.phase === 'after';
  const explicit = state.beat > 0;
  const selected = explicit ? after('target') : after('variants');
  const p = cueProgress(
    state,
    'dk-platform-identity-' + (explicit ? 'target' : 'variants'),
    explicit ? 1 : 0,
  );

  focusTarget(ctx, api, 'platform-identity-construction', () => {
    if (state.beat === 3) {
      const parts = [
        { x: 130, title: 'Python base', contents: 'A · linux/amd64', visible: true },
        {
          x: 747,
          title: 'Scorer image',
          contents: 'Python + scorer + fixture',
          visible: after('build'),
        },
        { x: 1355, title: 'Deployment host', contents: 'linux/amd64', visible: after('test') },
      ];
      for (const [i, part] of parts.entries()) {
        if (!part.visible) continue;
        rectangle(ctx, api, part.x, 410, 443, 235, C.panel, i ? C.cyan : C.blue);
        codeText(ctx, api, part.title, part.x + 25, 496, 38, i ? C.cyan : C.blue);
        codeText(ctx, api, part.contents, part.x + 25, 585, 31);
        if (i) api.arrow(ctx, parts[i - 1].x + 460, 535, part.x - 20, 535, C.cyan, 4);
      }
      if (after('test')) codeText(ctx, api, 'Run the scorer here', 1378, 721, 33, C.cyan);
      if (after('promote')) {
        codeText(ctx, api, 'Promote after a passing run', 153, 883, 36);
        codeText(ctx, api, 'access-rag@sha256:…', 750, 883, 41, C.green, 'left', 'mono');
        codeText(ctx, api, 'Verified registry digest of the scorer image', 750, 952, 30, C.muted);
      }
      return;
    }
    text(ctx, api, 'python:3.12-slim-trixie', 960, 285, 47, C.ink, 'center', 'mono');
    text(
      ctx,
      api,
      explicit ? '--platform linux/arm64' : 'Default platform on each builder',
      486,
      404,
      32,
      explicit ? C.yellow : C.muted,
    );
    text(ctx, api, 'Members of the Python base index', 1435, 404, 32, C.muted);
    for (const [i, label] of ['x86 worker', 'Arm laptop'].entries()) {
      const y = 505 + i * 205;
      rectangle(ctx, api, 150, y - 53, 665, 105, C.panel, C.muted);
      codeText(ctx, api, label, 181, y + 14, 39);
      const targetY = explicit ? 710 : y;
      if (p > 0) {
        line(ctx, api, 838, y, 838 + 244 * p, y + (targetY - y) * p, C.blue, 4);
      }
    }
    for (const [i, member] of ['A    linux/amd64', 'B    linux/arm64'].entries()) {
      const y = 505 + i * 205;
      rectangle(ctx, api, 1110, y - 53, 651, 105, C.panel, C.blue);
      codeText(ctx, api, member, 1150, y + 14, 39, C.blue, 'left', 'mono');
    }
    if (selected && explicit)
      text(ctx, api, 'Scorer builds tested: both used base B', 960, 858, 39, C.cyan);
    if (state.beat === 2) text(ctx, api, 'Production target: linux/amd64', 960, 965, 33, C.yellow);
  });
}

export default {
  id: 'platform-identity',
  draw: drawPlatformIdentity,
  cues: [
    'dk-platform-identity-beat0',
    'dk-platform-identity-variants',
    'dk-platform-identity-beat1',
    'dk-platform-identity-index',
    'dk-platform-identity-target',
    'dk-platform-identity-beat2',
    'dk-platform-identity-build',
    'dk-platform-identity-test',
    'dk-platform-identity-promote',
  ],
};
