import { cueClock } from '../cue-clock.mjs';

const pairs = [
  {
    id: 'R1',
    liveScore: 0.82,
    shadowScore: 0.85,
    liveTokens: 600,
    shadowTokens: 700,
    cue: 'extra-first',
  },
  {
    id: 'R2',
    liveScore: 0.86,
    shadowScore: 0.88,
    liveTokens: 640,
    shadowTokens: 760,
    cue: 'extra-second',
  },
  {
    id: 'R3',
    liveScore: 0.84,
    shadowScore: 0.85,
    liveTokens: 620,
    shadowTokens: 720,
    cue: 'extra-third',
  },
];
const sum = (key) => pairs.reduce((total, pair) => total + pair[key], 0);
const liveTotal = sum('liveTokens');
const extra = sum('shadowTokens') - liveTotal;
const meanGain = (sum('shadowScore') - sum('liveScore')) / pairs.length;

export function drawShadowPairs(ctx, scene, state, api) {
  const p = cueClock(scene, state);
  const { C, focus } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  focus.target('shadow-pairs', () => {
    text('Request', 140, 330, 30, C.muted);
    text('Judge score', 392, 265, 38);
    text('Live', 392, 330, 30, C.blue);
    text('Shadow', 554, 330, 30, C.cyan);
    text('Gain', 765, 330, 30, C.muted);
    text('Tokens per request', 1030, 265, 38);
    text('Live tokens  +  extra shadow tokens', 1030, 330, 30, C.muted);
    for (const [i, r] of pairs.entries()) {
      const y = 460 + i * 146;
      const seen = i === 0 ? p('pair-one') > 0 : p('pair-rest') > (i - 1) / 2;
      text(r.id, 148, y + 12, 45, C.ink);
      if (!seen) continue;
      text(r.liveScore.toFixed(2), 392, y + 12, 42, C.blue);
      text(r.shadowScore.toFixed(2), 554, y + 12, 42, C.cyan);
      if (p('judge-gains') > 0)
        text('+' + (r.shadowScore - r.liveScore).toFixed(2), 765, y + 12, 38, C.green);
      const x = 1035,
        scale = 0.84;
      const liveEnd = x + scale * r.liveTokens;
      api.line(ctx, x, y, liveEnd, y, C.blue, 11);
      text(String(r.liveTokens), x, y + 54, 28, C.blue);
      const progress = p(r.cue);
      if (progress > 0) {
        const increase = r.shadowTokens - r.liveTokens;
        api.line(ctx, liveEnd, y, liveEnd + scale * increase * progress, y, C.yellow, 11);
        if (progress === 1)
          text('+' + increase + '  =  ' + r.shadowTokens, liveEnd, y + 54, 28, C.yellow, 'center');
      }
    }
  });
  focus.target('shadow-summary', () => {
    api.line(ctx, 140, 865, 1760, 865, C.muted, 2);
    if (p('shadow-exposure') > 0)
      text('User-visible responses    3 live   /   0 shadow', 960, 972, 46, C.cyan, 'center');
    else if (p('sum-extra') > 0) {
      const growth = ((100 * extra) / liveTotal).toFixed(1);
      const verdict = p('shadow-review') > 0 ? '    ·    cost review above 10%' : '';
      text(
        'Extra tokens    ' + extra + ' / ' + liveTotal + '  ≈  ' + growth + '%' + verdict,
        960,
        972,
        42,
        C.yellow,
        'center',
      );
    } else if (p('judge-mean') > 0) {
      text(
        'Mean judge score    ' +
          (sum('liveScore') / pairs.length).toFixed(2) +
          '  →  ' +
          (sum('shadowScore') / pairs.length).toFixed(2) +
          '     ·     gain  +' +
          meanGain.toFixed(3),
        960,
        972,
        43,
        C.green,
        'center',
      );
    }
  });
}
export default {
  id: 'shadow-pairs',
  draw: drawShadowPairs,
  cues: [
    'pair-one',
    'pair-rest',
    'judge-gains',
    'judge-mean',
    'extra-first',
    'extra-second',
    'extra-third',
    'sum-extra',
    'shadow-review',
    'shadow-exposure',
  ],
};
