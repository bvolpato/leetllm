import { sceneClock } from '../worksheet.mjs';

export function drawCanaryEvidence(ctx, scene, state, api) {
  const { C } = api;
  const { after, progress } = sceneClock(state);
  const label = (s, x, y, size, color = C.ink, align = 'left') => api.text(ctx, s, x, y, size, color, align);
  api.focus.target('canary-evidence-construction', () => {
    if (state.beat === 0) {
      const count = 1 + Math.floor(4 * progress('kg-canary-ramp', 0, 0.31, 0.5));
      label('Illustrative 100-request group', 200, 309, 39);
      for (let i = 0; i < 100; i++) {
        const x = 260 + (i % 20) * 71, y = 409 + Math.floor(i / 20) * 68;
        api.rect(ctx, x, y, 51, 47, i < count ? C.cyan : C.blue, undefined, 4);
      }
      label(count + ' candidate responses', 280, 860, 43, C.cyan);
      label((100 - count) + ' trusted responses', 1620, 860, 43, C.blue, 'right');
      label('Monitor per-call latency, device and process health, and application quality.', 960, 985, 32, C.muted, 'center');
      return;
    }
    const trusted = [1, 1.0001], candidate = [1.0002, 1.0001];
    const show = after('kg-canary-perturb', 1, 0.28, 0.5);
    const choice = scores => scores[0] > scores[1] ? 'A' : 'B';
    label('Illustrative logits   ·   highest score wins', 200, 315, 39);
    label('Token A', 800, 460, 38, C.muted, 'center');
    label('Token B', 1200, 460, 38, C.muted, 'center');
    function pair(name, scores, y, color, decided) {
      label(name, 245, y, 41, color);
      scores.forEach((v, i) => label(v.toFixed(4), 800 + 400 * i, y, 53, color, 'center'));
      if (decided) label('Choose ' + choice(scores), 1490, y, 41, color);
    }
    const decided = after('kg-canary-choice', 1, 0.5, 0.6);
    pair('Trusted', trusted, 613, C.blue, true);
    if (show) pair('Candidate', candidate, 771, C.cyan, decided);
    label(decided ? 'The second score stayed fixed. The first crossed it.' : 'The trusted scores differ by one ten-thousandth.', 960, 941, 40, C.yellow, 'center');
  });
}
export default {
  id: 'canary-evidence', draw: drawCanaryEvidence,
  cues: ['kg-canary-ramp', 'kg-canary-perturb', 'kg-canary-choice'],
};
