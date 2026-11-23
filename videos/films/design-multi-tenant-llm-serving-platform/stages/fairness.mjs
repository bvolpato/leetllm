import { sampleModel } from '../observations.mjs';

export function drawFairness(ctx, scene, state, api) {
  const s = sampleModel('fairness', state);
  const { C } = api;
  api.focus.target('service-round', () => {
    api.text(ctx, 'Tenant queue', 130, 305, 31, C.muted);
    api.text(ctx, 'Credit left', 610, 305, 31, C.muted, 'center');
    api.text(ctx, 'Work served   /   one block per completed chunk', 840, 305, 31, C.muted);
    for (const [row, tenant] of ['A', 'B'].entries()) {
      const cost = tenant === 'A' ? 3 : 1,
        grant = tenant === 'A' ? 4 : 2;
      const y = 420 + row * 254;
      const color = row ? C.pink : C.blue;
      api.text(ctx, tenant + '   +' + grant + ' per round', 130, y, 42, color);
      api.text(
        ctx,
        cost + (cost === 1 ? ' unit' : ' units') + ' per chunk',
        130,
        y + 67,
        32,
        C.ink,
      );
      api.text(ctx, s.credit[tenant], 610, y + 40, 62, C.yellow, 'center');
      api.line(ctx, 840, y + 99, 1752, y + 99, C.muted, 2);
      for (let i = 0; i < s.jobs[tenant]; i++) {
        const x = 840 + i * cost * 76;
        api.rect(ctx, x, y - 21, cost * 76 - 7, 88, color, undefined, 5);
        api.text(ctx, String(cost), x + (cost * 76 - 7) / 2, y + 38, 38, C.bg, 'center');
      }
      if (s.active?.tenant === tenant) {
        const x = 840 + s.jobs[tenant] * cost * 76;
        api.rect(ctx, x, y - 21, cost * 76 - 7, 88, C.panel, color, 5);
        if (s.active.progress > 0) {
          api.rect(
            ctx,
            x + 2,
            y - 19,
            (cost * 76 - 11) * s.active.progress,
            84,
            color,
            undefined,
            3,
          );
        }
      }
      api.text(
        ctx,
        s.served[tenant] + ' work units   ·   ' + s.jobs[tenant] + ' completed chunks',
        840,
        y + 149,
        32,
        C.ink,
      );
    }
    let note = 'Both queues have work waiting.';
    if (s.rounds === 1) note = 'A carries one credit into its next visit.';
    if (s.rounds === 2)
      note = 'A carries 2, earns 4 more, and pays 3 per chunk. How many can it serve?';
    if (s.time > 2 && s.time < 3) note = 'A can spend all six credits on its third visit.';
    if (s.rounds === 3) note = 'A : B    12 : 6 work units    /    4 : 6 completed chunks';
    api.text(ctx, note, 130, 976, 40, s.rounds === 3 ? C.green : C.ink);
  });
}
export default {
  id: 'fairness',
  draw: drawFairness,
  cues: ['fair-round-one', 'fair-round-two', 'fair-predict', 'fair-round-three'],
};
