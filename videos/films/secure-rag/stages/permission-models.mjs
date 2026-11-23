import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { SECURE_SOURCES } from '../fixtures.mjs';
import {
  drawDecisionMark,
  drawFlow,
  drawFooter,
  drawHeading,
  drawNode,
  drawSourceRecord,
  drawText,
} from '../defaults.mjs';
export function drawPermissionModels(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-permission-models-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  const principal = {
    id: 'analyst',
    tenant: 'A',
    groups: ['operations'],
    departments: ['operations'],
    roles: [],
  };
  api.focus.target('sr-permission-models-mechanism', () => {
    const docs = SECURE_SOURCES.map(sourceRecord);
    drawHeading(ctx, api, 'Tenant A · authenticated operations analyst');
    docs.forEach((r, i) => {
      const visible = Math.floor(Q('corpus', 0) * 4 + 1e-6) > i || resultComplete('corpus', 0);
      if (visible)
        drawSourceRecord(
          ctx,
          api,
          r,
          170 + i * 420,
          360,
          350,
          i < 2 ? themeColors.blue : themeColors.muted,
        );
      if (resultComplete('eligible', 0))
        drawDecisionMark(ctx, api, secureEligibility(r, principal), 345 + i * 420, 555);
    });
    if (currentBeat === 1) {
      const names = ['analyst', 'child team', 'parent team', 'document'],
        x = [170, 590, 1010, 1430],
        nodes = names.map((v, i) =>
          drawNode(ctx, api, v, x[i], 700, 320, i === 3 ? themeColors.green : themeColors.cyan),
        ),
        q = Q('path', 1);
      nodes
        .slice(0, -1)
        .forEach((n, i) => drawFlow(ctx, api, n, nodes[i + 1], clamp(q * 3 - i), themeColors.cyan));
      if (resultComplete('path-grant', 1))
        drawText(
          ctx,
          api,
          'Trusted inheritance path grants the read',
          960,
          870,
          31,
          themeColors.green,
          'center',
        );
    }
    if (currentBeat === 2) {
      ['User namespace', 'Metadata predicate', 'Trusted ID join', 'Permission graph'].forEach(
        (v, i) => {
          const q = Q('four', 2);
          if (q * 4 >= i + 1)
            drawNode(
              ctx,
              api,
              v,
              170 + i * 420,
              720,
              350,
              [themeColors.blue, themeColors.yellow, themeColors.green, themeColors.cyan][i],
            );
        },
      );
      drawText(
        ctx,
        api,
        'Content graph edges and reports still need source authorization',
        960,
        900,
        29,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Roles, attributes and relationships express source policy. Relevance ranks only eligible evidence.',
    );
  });
}
export default {
  id: 'permission-models',
  draw: drawPermissionModels,
  cues: [
    'sr-permission-models-0',
    'sr-permission-models-corpus',
    'sr-permission-models-eligible',
    'sr-permission-models-1',
    'sr-permission-models-path',
    'sr-permission-models-path-grant',
    'sr-permission-models-2',
    'sr-permission-models-four',
  ],
};
