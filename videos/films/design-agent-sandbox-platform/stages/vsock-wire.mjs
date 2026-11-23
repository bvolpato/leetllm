import { clamp, motion } from '../arithmetic.mjs';
import { drawArrow, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawVsockWire(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-vsock-wire-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-vsock-wire-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-vsock-wire-mechanism', () => {
    drawRectangle(ctx, api, 180, 315, 680, 180, themeColors.blue);
    drawText(ctx, api, 'Host Unix-domain socket', 210, 380, 32, themeColors.blue);
    drawText(ctx, api, 'configured socket path', 210, 445, 28);
    drawRectangle(ctx, api, 1050, 315, 680, 180, themeColors.cyan);
    drawText(ctx, api, 'Guest virtio-vsock', 1080, 380, 32, themeColors.cyan);
    drawText(ctx, api, 'supervisor listen :5000', 1080, 445, 28);
    drawArrow(ctx, api, 880, 405, 1020, 405, themeColors.cyan);
    const command = 'CONNECT 5000\n',
      sent = currentBeat > 1 || (currentBeat === 1 && cueProgress('send', 1) > 0),
      ok = currentBeat > 1 || (currentBeat === 1 && resultComplete('ok', 1));
    drawText(ctx, api, 'Control handshake', 180, 570, 31, themeColors.ink);
    if (sent) {
      [...'CONNECT 5000\n'].forEach((v, i) => {
        const x = 185 + i * 100;
        drawRectangle(ctx, api, x, 620, 82, 85, themeColors.cyan);
        drawText(
          ctx,
          api,
          v === '\n' ? 'LF' : v === ' ' ? 'SP' : v,
          x + 41,
          675,
          27,
          themeColors.cyan,
          'center',
          'mono',
        );
      });
    }
    if (ok) {
      drawText(ctx, api, 'OK 1073741824\\n', 185, 830, 32, themeColors.green, 'left', 'mono');
      drawText(
        ctx,
        api,
        'validated → framed application commands',
        720,
        830,
        30,
        themeColors.green,
      );
    } else
      drawText(
        ctx,
        api,
        'Application bytes HELD until acknowledgement validates',
        185,
        830,
        31,
        themeColors.yellow,
      );
    if (currentBeat === 2)
      drawText(ctx, api, 'Assigned host port ∈ [2³⁰, 2³¹)', 190, 935, 32, themeColors.yellow);
    drawFooter(
      ctx,
      api,
      'No host TCP port for this control route; descriptors, buffers and VMM work still exist.',
    );
  });
}
export default {
  id: 'vsock-wire',
  draw: drawVsockWire,
  cues: [
    'sp-vsock-wire-0',
    'sp-vsock-wire-pair',
    'sp-vsock-wire-1',
    'sp-vsock-wire-send',
    'sp-vsock-wire-ok',
    'sp-vsock-wire-2',
    'sp-vsock-wire-range',
  ],
};
