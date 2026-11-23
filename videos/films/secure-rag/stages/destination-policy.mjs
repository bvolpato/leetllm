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
export function drawDestinationPolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-destination-policy-' + name,
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
  api.focus.target('sr-destination-policy-mechanism', () => {
    const src = drawSourceRecord(
        ctx,
        api,
        {
          ...SECURE_SOURCES[2],
        },
        170,
        360,
        480,
        themeColors.blue,
      ),
      destinations = [
        ['senior reader', true],
        ['junior recipient', false],
        ['outside judge', false],
        ['deploy effect', false],
      ];
    destinations.forEach(([n, yes], i) => {
      const y = 345 + i * 150,
        visible = currentBeat > 0 || Q(i === 2 ? 'other' : 'recipient', 0) > 0;
      const z = drawNode(
        ctx,
        api,
        n,
        1190,
        y,
        520,
        visible ? (yes ? themeColors.green : themeColors.pink) : themeColors.muted,
      );
      if (visible) {
        if (yes) drawFlow(ctx, api, src, z, 1, themeColors.green);
        else {
          const gate = {
            x: 970,
            y,
            w: 150,
            h: 78,
          };
          drawRectangle(ctx, api, gate.x, gate.y, gate.w, gate.h, themeColors.pink);
          drawText(ctx, api, 'HOLD', 1045, y + 49, 26, themeColors.pink, 'center');
          drawFlow(ctx, api, src, gate, 1, themeColors.pink);
        }
        drawText(
          ctx,
          api,
          yes ? 'read grant' : 'independent policy required',
          1185,
          y + 115,
          24,
          yes ? themeColors.green : themeColors.yellow,
        );
      }
    });
    if (currentBeat === 1 && resultComplete('effect', 1))
      drawTag(
        ctx,
        api,
        'Effect contract',
        'operation / target / args / approval',
        170,
        790,
        740,
        themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      'Authorized evidence remains reference data. Reader permission does not authorize another recipient or tool effect.',
    );
  });
}
export default {
  id: 'destination-policy',
  draw: drawDestinationPolicy,
  cues: [
    'sr-destination-policy-0',
    'sr-destination-policy-recipient',
    'sr-destination-policy-other',
    'sr-destination-policy-1',
    'sr-destination-policy-effect',
  ],
};
