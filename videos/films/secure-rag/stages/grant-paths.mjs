import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { SECURE_SOURCES } from '../fixtures.mjs';
import {
  drawFlow,
  drawFooter,
  drawNode,
  drawRectangle,
  drawSourceRecord,
  drawTag,
  drawText,
} from '../defaults.mjs';
export function drawGrantPaths(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-grant-paths-' + name,
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
  api.focus.target('sr-grant-paths-mechanism', () => {
    const faq = sourceRecord(SECURE_SOURCES[1]),
      groupGone = resultComplete('remove', 0) || currentBeat > 0,
      deptGone = currentBeat > 0;
    const center = drawNode(ctx, api, 'A:FAQ', 790, 490, 350, themeColors.blue),
      g = drawNode(
        ctx,
        api,
        'operations group',
        170,
        360,
        430,
        groupGone ? themeColors.pink : themeColors.green,
      ),
      d = drawNode(
        ctx,
        api,
        'operations department',
        170,
        700,
        430,
        deptGone ? themeColors.pink : themeColors.green,
      );
    drawFlow(ctx, api, g, center, 1, groupGone ? themeColors.pink : themeColors.green);
    drawFlow(ctx, api, d, center, 1, deptGone ? themeColors.pink : themeColors.green);
    const allowed = secureEligibility(
      {
        ...faq,
        grant: groupGone ? null : faq.grant,
        department: deptGone ? null : faq.department,
      },
      principal,
    );
    if (resultComplete('still', 0) || currentBeat > 0)
      drawTag(
        ctx,
        api,
        'FAQ permission',
        allowed ? 'ALLOW via department' : 'DENY · no grant path',
        1260,
        480,
        500,
        allowed ? themeColors.green : themeColors.pink,
      );
    if (currentBeat === 1) {
      [
        'tenant',
        'deleted',
        'deletion type',
        'future start',
        'exact expiry',
        'string time',
        'naive time',
        'no grant',
      ].forEach((v, i) => {
        const q = Q('cases', 1),
          x = 170 + (i % 4) * 420,
          y = 805 + Math.floor(i / 4) * 75;
        if (q * 8 >= i + 1) {
          drawRectangle(ctx, api, x, y, 350, 55, themeColors.pink);
          drawText(ctx, api, v, x + 175, y + 36, 23, themeColors.pink, 'center');
        }
      });
    }
    if (currentBeat === 2) {
      drawSourceRecord(
        ctx,
        api,
        sourceRecord(SECURE_SOURCES[0]),
        190,
        800,
        520,
        resultComplete('expire', 2) ? themeColors.pink : themeColors.blue,
      );
      if (resultComplete('expire', 2)) {
        drawText(ctx, api, 'Authorized set = ∅', 1090, 850, 34, themeColors.pink);
        drawText(
          ctx,
          api,
          'Refuse / request permitted evidence',
          1090,
          910,
          27,
          themeColors.yellow,
        );
      }
    }
    drawFooter(
      ctx,
      api,
      'Remove every permission path withdrawn by the actual source decision. Never retry without the filter.',
    );
  });
}
export default {
  id: 'grant-paths',
  draw: drawGrantPaths,
  cues: [
    'sr-grant-paths-0',
    'sr-grant-paths-remove',
    'sr-grant-paths-still',
    'sr-grant-paths-1',
    'sr-grant-paths-cases',
    'sr-grant-paths-2',
    'sr-grant-paths-expire',
  ],
};
