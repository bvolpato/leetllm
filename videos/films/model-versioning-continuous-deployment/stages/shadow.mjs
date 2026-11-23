import { authorize, enqueue } from '../model.mjs';

const copies = Array.from({ length: 3 }, (_, i) => ({
  id: 'shadow-' + (i + 1),
  tool: 'read policy',
}));
const arrivals = ['queue-arrivals', 'mv-shadow-two', 'mv-shadow-third'];

export function drawShadow(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.cue(id)?.phase === 'after';
  const write = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);

  focus.target('shadow-paths', () => {
    write('VISIBLE TO USER', 120, 260, 28, C.blue);
    write('Stable workers', 120, 350, 49);
    api.arrow(ctx, 530, 337, 1120, 337, C.blue, 4);
    if (state.beat === 0) {
      const p = focus.progress('live-visible', 0);
      api.circle(ctx, 548 + 550 * p, 337, 16, C.blue);
      write(done('live-visible') ? 'User gets stable’s reply' : 'User', 1180, 350, 43, C.blue);
    } else {
      const p = focus.progress('stable-replies', 0);
      for (let i = 0; i < 3; i++) {
        const q = Math.max(0, Math.min(1, 3 * p - i));
        api.circle(ctx, 565 + 90 * i + 620 * q, 337, 18, C.blue);
      }
      write(Math.floor(3 * p) + ' stable replies', 1430, 350, 38, C.blue);
    }

    api.line(ctx, 120, 440, 1795, 440, C.muted, 2);
    write('CANDIDATE COPY', 120, 520, 28, C.cyan);
    if (state.beat === 0) {
      const testingWrite = focus.progress('tool-authorization', 0) > 0;
      const tool = testingWrite ? 'deploy application' : 'read policy';
      const allowed = authorize(tool);
      write('Minimized policy question', 120, 602, 44);
      write('Tool requested', 120, 705, 31, C.muted);
      write(tool, 120, 773, 41, C.cyan);
      write('Tool allowlist', 780, 705, 31, C.muted);
      write(testingWrite ? 'Read tools only' : 'read policy', 780, 773, 38);
      write('Credential scope', 1285, 705, 31, C.muted);
      write('policy:read', 1285, 773, 38);
      if (done(testingWrite ? 'tool-authorization' : 'mv-shadow-allow'))
        write(
          allowed
            ? 'Read permitted · candidate result goes to evaluation'
            : 'Write denied · no deployment',
          960,
          949,
          38,
          allowed ? C.green : C.pink,
          'center',
        );
      return;
    }

    write('Two waiting slots', 1060, 520, 36, C.muted, 'center');
    const submitted = arrivals.filter(done).length;
    const queue = enqueue(copies.slice(0, submitted));
    const centers = [1035, 1535];
    api.line(ctx, 195, 567, centers[1], 567, C.muted, 3);
    centers.forEach((x, i) => {
      api.line(ctx, x, 567, x, 604, C.muted, 3);
      api.rect(ctx, x - 212, 637, 424, 144, C.panel, C.cyan, 12);
      write(
        queue.accepted[i]?.id ?? 'Empty',
        x,
        721,
        41,
        queue.accepted[i] ? C.cyan : C.muted,
        'center',
      );
    });
    write('Sanitized copies', 120, 655, 32, C.muted);
    for (const [i, cue] of arrivals.entries()) {
      const p = focus.progress(cue, 0);
      if (p > 0 && p < 1) {
        // The third copy reaches the full queue and falls out of the comparison path.
        const destination = centers[i] ?? 640;
        const x = 195 + (destination - 195) * Math.min(1, p / 0.72);
        const y = 567 + (i === 2 ? 244 : 45) * Math.max(0, (p - 0.72) / 0.28);
        api.circle(ctx, x, y, 18, C.cyan);
      }
    }
    if (queue.dropped.length) {
      api.line(ctx, 640, 569, 640, 812, C.pink, 4);
      write(queue.dropped[0].id + ' · DROP', 640, 866, 39, C.pink, 'center');
    }
    write(
      submitted +
        ' submitted · ' +
        queue.accepted.length +
        ' admitted · ' +
        queue.dropped.length +
        ' missing',
      960,
      972,
      41,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'shadow',
  draw: drawShadow,
  cues: ['live-visible', 'mv-shadow-allow', 'tool-authorization', 'stable-replies', ...arrivals],
};
