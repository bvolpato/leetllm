import { clamp, motion, sum } from '../arithmetic.mjs';
import { chapterFooter, chapterParagraph, chapterRect, chapterText } from '../defaults.mjs';
export function drawRouteCosts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-route-costs-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-route-costs-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-route-costs-mechanism', () => {
    const model = ((1500 + 400) * 3) / 1e6,
      full = model + 0.002 + 0.001 + 0.001,
      routes = [
        {
          name: 'Full synthesis',
          share: 0.6,
          cost: full,
          color: themeColors.blue,
        },
        {
          name: 'Valid cache',
          share: 0.3,
          cost: 0.0003,
          color: themeColors.green,
        },
        {
          name: 'Structured',
          share: 0.1,
          cost: 0.001,
          color: themeColors.yellow,
        },
      ],
      mean = sum(routes.map((x) => x.share * x.cost));
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Different workload from the capacity worksheet',
        160,
        285,
        33,
        themeColors.yellow,
      );
      const n = Math.ceil(prog('0', 0) * 19);
      for (let i = 0; i < n; i++) {
        const x = 190 + (i % 10) * 145,
          y = 400 + Math.floor(i / 10) * 140;
        chapterRect(
          ctx,
          api,
          x,
          y,
          120,
          95,
          themeColors.panel,
          i < 15 ? themeColors.blue : themeColors.green,
        );
        chapterText(
          ctx,
          api,
          i < 15 ? '100 in' : '100 out',
          x + 60,
          y + 60,
          24,
          i < 15 ? themeColors.blue : themeColors.green,
          'center',
        );
      }
      chapterText(ctx, api, '1,500 input + 400 output at $3 / million', 190, 790, 32);
      if (done('tokens', 0))
        chapterText(ctx, api, 'Model cost = $' + model.toFixed(4), 190, 915, 35, themeColors.green);
    } else if (currentBeat === 1) {
      const parts = [
          ['Model', model],
          ['Retrieval', 0.002],
          ['Rerank', 0.001],
          ['Verify', 0.001],
        ],
        n = Math.ceil(prog('1', 1) * 4);
      let x = 180;
      parts.slice(0, n).forEach(([name, value]) => {
        const w = (value / 0.01) * 1400;
        chapterRect(ctx, api, x, 470, w, 110, themeColors.panel, themeColors.blue);
        chapterParagraph(ctx, api, name, x + 12, 515, w - 24, 25, themeColors.blue);
        x += w;
      });
      if (done('full', 1))
        chapterText(ctx, api, 'Full route = $' + full.toFixed(4), 180, 700, 34, themeColors.green);
      if (done('cheap', 1)) {
        chapterText(ctx, api, 'Cache $0.0003', 180, 875, 32, themeColors.green);
        chapterText(ctx, api, 'Structured $0.0010', 1050, 875, 32, themeColors.yellow);
      }
    } else {
      chapterText(ctx, api, 'One traffic-weighted workload', 170, 285, 33, themeColors.blue);
      const q = prog('mean', 2);
      routes.forEach((r, i) => {
        const y = 380 + i * 155,
          complete = q > i / 3;
        chapterText(
          ctx,
          api,
          r.name + ' · ' + 100 * r.share + '% × $' + r.cost.toFixed(4),
          180,
          y,
          29,
          r.color,
        );
        const contribution = r.share * r.cost;
        chapterRect(ctx, api, 850, y - 32, (650 * contribution) / 0.006, 70, r.color);
        if (complete)
          chapterText(ctx, api, '$' + contribution.toFixed(5), 1750, y + 15, 29, r.color, 'right');
      });
      if (done('mean', 2))
        chapterText(
          ctx,
          api,
          'Mean = $' + mean.toFixed(5) + ' / request',
          180,
          875,
          34,
          themeColors.green,
        );
      if (done('minute', 2))
        chapterText(
          ctx,
          api,
          '1,000 req/s × 60 × mean = $' + (mean * 1000 * 60).toFixed(2) + ' / minute',
          960,
          955,
          31,
          themeColors.yellow,
          'center',
        );
    }
    chapterFooter(
      ctx,
      api,
      'Invented rates and workload inputs; replace with measured service evidence.',
    );
  });
}
export default {
  id: 'route-costs',
  draw: drawRouteCosts,
  cues: [
    'se-route-costs-0',
    'se-route-costs-tokens',
    'se-route-costs-1',
    'se-route-costs-full',
    'se-route-costs-cheap',
    'se-route-costs-2',
    'se-route-costs-mean',
    'se-route-costs-minute',
  ],
};
