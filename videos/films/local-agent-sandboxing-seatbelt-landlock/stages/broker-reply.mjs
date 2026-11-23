import { cueComplete, cueProgress } from '../construction.mjs';
import { exactBrokerRequest, sanitizeBrokerReply } from '../model.mjs';

export default {
  id: 'broker-reply',
  cues: ['broker-get', 'broker-post', 'broker-reply-step-1', 'broker-reply-step-2'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const label = (s, x, y, size, color = C.ink, font = 'sans') =>
      api.text(ctx, s, x, y, size, color, 'left', font);
    if (state.beat === 0) {
      const showPost = cueProgress(state, 'broker-post', 0, 0.32, 0.5) > 0;
      api.focus.target('broker-exact-target', () => {
        label('Allowed read', 143, 312, 36, C.muted);
        label('GET /repos/owner/repo/pulls/42', 143, 403, 54, C.cyan, 'mono');
        for (const [i, method] of ['GET', 'POST'].entries()) {
          if (i === 1 && !showPost) continue;
          const y = 595 + 185 * i;
          const admitted = exactBrokerRequest(method, 'owner/repo', 42);
          const ready =
            i === 0
              ? cueComplete(state, 'broker-get', 0, 0.3)
              : cueComplete(state, 'broker-reply-step-1', 0, 0.65);
          label(method, 144, y, 52, C.yellow, 'mono');
          label('/repos/owner/repo/pulls/42', 332, y, 46, C.ink, 'mono');
          if (ready)
            label(admitted ? 'Dispatch' : 'Stop here', 1439, y, 50, admitted ? C.green : C.pink);
        }
      });
    } else {
      const p = cueProgress(state, 'broker-reply-step-2', 1, 0.27, 0.53);
      const upstream = { number: 42, state: 'open', debug_token: 'TEST-ONLY' };
      const reply = sanitizeBrokerReply(upstream);
      api.focus.target('broker-filtered-reply', () => {
        label('Upstream reply', 145, 311, 48, C.blue);
        label('Worker receives', 1180, 311, 48, C.cyan);
        for (const [i, [key, value]] of Object.entries(upstream).entries()) {
          const y = 453 + 158 * i;
          const field = key + ': ' + JSON.stringify(value);
          label(field, 145, y, 42, C.ink, 'mono');
          if (Object.hasOwn(reply, key)) {
            if (p > 0) api.arrow(ctx, 766, y - 15, 766 + 350 * p, y - 15, C.cyan, 3);
            if (p >= 1) label(key + ': ' + JSON.stringify(reply[key]), 1180, y, 42, C.cyan, 'mono');
          } else if (p >= 1) {
            api.line(ctx, 767, y - 14, 919, y - 14, C.muted, 3);
            api.line(ctx, 920, y - 37, 920, y + 9, C.pink, 5);
            label('Excluded', 965, y, 36, C.pink);
          }
        }
      });
    }
    label('Local request and reply fixture', 143, 981, 30, C.muted);
  },
};
